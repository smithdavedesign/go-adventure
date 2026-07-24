/**
 * Ingestion pipeline orchestrator (Platform domain).
 *
 * Drives a SourceAdapter through the controlled publishing pipeline the PRD
 * specifies: fetch → validate/normalize → store raw capture → persist a
 * source record + canonical DRAFT revision. It does NOT publish — drafts land in
 * the editorial review queue (reviewStatus = in_review) for a human.
 *
 * Guarantees:
 *  - Idempotent: SourceRecord is unique per (source, externalId, normalizerVersion)
 *    and the draft revision is keyed by draftKey, so re-running updates in place.
 *  - Single-flight per source: refuses to start if a run is already in progress.
 *  - No partial writes: each record's source-record + draft persist in one
 *    transaction; a record that fails any stage is dead-lettered with its raw
 *    payload and never partially written.
 *  - Auditable: every run is an IngestionRun row with processed/failed counts.
 */
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import { checksum, rawObjectKey } from "./checksum";
import type { RawStore } from "./rawStore";
import type {
  NormalizedDestinationDraft,
  RawRecord,
  SourceAdapter,
} from "./types";

/** The draft struct is JSON-safe; assert it to Prisma's JSON input type. */
function asJson(draft: NormalizedDestinationDraft): Prisma.InputJsonObject {
  return draft as unknown as Prisma.InputJsonObject;
}

type IngestStage = "fetch" | "validate" | "normalize" | "store" | "persist";

class IngestError extends Error {
  constructor(
    readonly stage: IngestStage,
    message: string,
  ) {
    super(message);
    this.name = "IngestError";
  }
}

export type IngestionOptions = {
  rawStore: RawStore;
  /** Inject raw records instead of a live fetch — used by fixtures and tests. */
  fetchOverride?: () => Promise<RawRecord[]>;
};

export type IngestionSummary = {
  runId: string;
  status: "succeeded" | "failed";
  processed: number;
  failed: number;
};

/** Ensure the source has a registry row and is enabled (PRD: no ingest without one). */
async function ensureRegisteredSource(adapter: SourceAdapter) {
  const r = adapter.registry;
  const source = await prisma.source.upsert({
    where: { name: r.name },
    // Never clobber a curated registry entry on re-ingest; only create if absent.
    update: {},
    create: {
      name: r.name,
      baseUrl: r.baseUrl,
      licence: r.licence,
      attributionText: r.attributionText,
      termsUrl: r.termsUrl ?? null,
      commercialUse: r.commercialUse,
      refreshPolicy: r.refreshPolicy,
      owner: r.owner,
      enabled: true,
    },
  });
  if (!source.enabled) {
    throw new Error(`Source "${source.name}" is disabled — refusing to ingest.`);
  }
  return source;
}

/** Normalize, archive the raw capture, and persist one draft — transactionally. */
async function ingestOne(
  adapter: SourceAdapter,
  sourceId: string,
  raw: RawRecord,
  rawStore: RawStore,
): Promise<void> {
  let draft;
  try {
    draft = adapter.normalize(raw);
  } catch (err) {
    throw new IngestError("normalize", errorMessage(err));
  }

  const sum = checksum(raw.payload);
  const key = rawObjectKey(adapter.registry.name, raw.externalId, sum);
  try {
    await rawStore.put(key, JSON.stringify(raw.payload));
  } catch (err) {
    throw new IngestError("store", errorMessage(err));
  }

  const now = new Date();
  const draftKey = `${adapter.registry.name}:${raw.externalId}`;
  try {
    await prisma.$transaction(async (tx) => {
      const sourceRecord = await tx.sourceRecord.upsert({
        where: {
          sourceId_externalId_normalizerVersion: {
            sourceId,
            externalId: raw.externalId,
            normalizerVersion: adapter.normalizerVersion,
          },
        },
        update: {
          retrievedAt: now,
          rawObjectKey: key,
          checksum: sum,
          canonicalUrl: raw.canonicalUrl ?? null,
          licenceSnapshot: adapter.registry.licence,
          attributionSnapshot: adapter.registry.attributionText,
        },
        create: {
          sourceId,
          externalId: raw.externalId,
          normalizerVersion: adapter.normalizerVersion,
          retrievedAt: now,
          rawObjectKey: key,
          checksum: sum,
          canonicalUrl: raw.canonicalUrl ?? null,
          licenceSnapshot: adapter.registry.licence,
          attributionSnapshot: adapter.registry.attributionText,
        },
      });

      await tx.contentRevision.upsert({
        where: { draftKey },
        update: {
          body: asJson(draft),
          sourceRecordId: sourceRecord.id,
          reviewStatus: "in_review",
        },
        create: {
          draftKey,
          entityType: "destination",
          body: asJson(draft),
          origin: "official", // NPS is an official government source
          reviewStatus: "in_review",
          sourceRecordId: sourceRecord.id,
        },
      });
    });
  } catch (err) {
    throw new IngestError("persist", errorMessage(err));
  }
}

export async function runIngestion(
  adapter: SourceAdapter,
  opts: IngestionOptions,
): Promise<IngestionSummary> {
  const source = await ensureRegisteredSource(adapter);

  // Single-flight: one active run per source.
  const inFlight = await prisma.ingestionRun.findFirst({
    where: { sourceName: adapter.registry.name, status: "running" },
  });
  if (inFlight) {
    throw new Error(
      `An ingestion run for "${adapter.registry.name}" is already in progress (${inFlight.id}).`,
    );
  }

  const run = await prisma.ingestionRun.create({
    data: {
      sourceName: adapter.registry.name,
      normalizerVersion: adapter.normalizerVersion,
      status: "running",
    },
  });

  let processed = 0;
  let failed = 0;

  try {
    let raws: RawRecord[];
    try {
      raws = await (opts.fetchOverride ?? (() => adapter.fetchRaw()))();
    } catch (err) {
      throw new IngestError("fetch", errorMessage(err));
    }

    for (const raw of raws) {
      try {
        await ingestOne(adapter, source.id, raw, opts.rawStore);
        processed++;
      } catch (err) {
        failed++;
        const stage = err instanceof IngestError ? err.stage : "persist";
        await prisma.ingestionDeadLetter.create({
          data: {
            runId: run.id,
            sourceName: adapter.registry.name,
            externalId: raw.externalId,
            stage,
            error: errorMessage(err),
            payload: raw.payload as object,
          },
        });
      }
    }

    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "succeeded",
        finishedAt: new Date(),
        recordsProcessed: processed,
        recordsFailed: failed,
      },
    });
    return { runId: run.id, status: "succeeded", processed, failed };
  } catch (err) {
    // Whole-run failure (e.g. fetch failed): record it and re-throw.
    await prisma.ingestionRun.update({
      where: { id: run.id },
      data: {
        status: "failed",
        finishedAt: new Date(),
        recordsProcessed: processed,
        recordsFailed: failed,
        error: errorMessage(err),
      },
    });
    throw err;
  }
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}
