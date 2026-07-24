/**
 * Publish / unpublish workflow (Platform domain).
 *
 * Publishing materializes an approved draft ContentRevision into the canonical
 * `Destination` row plus its FactAssertions and PermitRequirement, flips it to
 * `published`, and emits a durable outbox event — all in one transaction, so a
 * partial write can never leave a half-published record (PRD Ingestion &
 * Publishing Operations). Idempotent: re-publishing updates in place.
 *
 * This is the single action behind the admin "Publish" button — an editor never
 * touches SQL.
 */
import { prisma } from "@/shared/config/db";
import { emitOutboxEvent } from "@/platform/outbox/emit";
import { validateDraftForPublish } from "./draftSchema";
import type { FactConfidence } from "@/generated/prisma/client";

export type PublishResult =
  | { ok: true; destinationId: string; slug: string }
  | { ok: false; errors: string[] };

export async function publishDestinationDraft(
  revisionId: string,
): Promise<PublishResult> {
  const revision = await prisma.contentRevision.findUnique({
    where: { id: revisionId },
  });
  if (!revision) return { ok: false, errors: ["Revision not found."] };
  if (revision.entityType !== "destination") {
    return { ok: false, errors: ["Only destination drafts are supported here."] };
  }

  const validation = validateDraftForPublish(revision.body);
  if (!validation.ok) return { ok: false, errors: validation.errors };
  const draft = validation.draft;

  if (draft.budget.low > draft.budget.high) {
    return { ok: false, errors: ["budget: low estimate exceeds high estimate."] };
  }

  const now = new Date();
  const summary = draft.summary ?? draft.summaryDraft ?? null;

  const destinationId = await prisma.$transaction(async (tx) => {
    // 1. Upsert the canonical Destination (typed fields).
    const destination = await tx.destination.upsert({
      where: { slug: draft.slug },
      update: {
        name: draft.name,
        activities: draft.activities as never,
        bestMonths: draft.bestMonths as never,
        difficulty: draft.difficulty as never,
        tripLength: draft.tripLength as never,
        label: (draft.label ?? null) as never,
        budgetCurrency: draft.budget.currency,
        budgetLowUsd: draft.budget.low,
        budgetHighUsd: draft.budget.high,
        summary,
        status: "published",
        publishedAt: now,
        lastVerifiedAt: now,
      },
      create: {
        slug: draft.slug,
        name: draft.name,
        activities: draft.activities as never,
        bestMonths: draft.bestMonths as never,
        difficulty: draft.difficulty as never,
        tripLength: draft.tripLength as never,
        label: (draft.label ?? null) as never,
        budgetCurrency: draft.budget.currency,
        budgetLowUsd: draft.budget.low,
        budgetHighUsd: draft.budget.high,
        summary,
        status: "published",
        publishedAt: now,
        lastVerifiedAt: now,
      },
    });

    // 2. Canonical geography (raw SQL — Unsupported column, see ADR-0003).
    await tx.$executeRaw`
      UPDATE "Destination"
      SET location = ST_SetSRID(ST_MakePoint(${draft.point.lng}, ${draft.point.lat}), 4326)::geography
      WHERE id = ${destination.id}::uuid
    `;

    // 3. Rebuild FactAssertions for this subject (replace, don't accumulate).
    await tx.factAssertion.deleteMany({
      where: { subjectType: "destination", subjectId: destination.id },
    });
    const editorialFacts: {
      field: string;
      value: unknown;
      confidence: FactConfidence;
    }[] = [
      { field: "difficulty", value: draft.difficulty, confidence: "editorial" },
      { field: "tripLength", value: draft.tripLength, confidence: "editorial" },
      { field: "bestMonths", value: draft.bestMonths, confidence: "editorial" },
      { field: "budget", value: draft.budget, confidence: "editorial" },
    ];
    const sourceFacts = (draft.facts ?? []).map((f) => ({
      field: f.field,
      value: f.value,
      confidence: f.confidence as FactConfidence,
    }));
    await tx.factAssertion.createMany({
      data: [...editorialFacts, ...sourceFacts].map((f) => ({
        subjectType: "destination",
        subjectId: destination.id,
        field: f.field,
        value: f.value as object,
        confidence: f.confidence,
        sourceRecordId: revision.sourceRecordId,
        contentRevisionId: revision.id,
        verifiedAt: now,
      })),
    });

    // 4. Permit (replace).
    await tx.permitRequirement.deleteMany({
      where: { subjectType: "destination", subjectId: destination.id },
    });
    if (draft.permit) {
      await tx.permitRequirement.create({
        data: {
          subjectType: "destination",
          subjectId: destination.id,
          requirementType: draft.permit.requirementType as never,
          scope: draft.permit.scope,
          officialUrl: draft.permit.officialUrl,
          sourceRecordId: revision.sourceRecordId,
          lastVerifiedAt: now,
        },
      });
    }

    // 5. Link + approve the revision.
    await tx.contentRevision.update({
      where: { id: revision.id },
      data: {
        entityId: destination.id,
        reviewStatus: "approved",
        publishedAt: now,
      },
    });

    // 6. Durable outbox event (same tx → atomic with the change).
    await emitOutboxEvent(tx, {
      type: "destination.published",
      entityType: "destination",
      entityId: destination.id,
      payload: { slug: draft.slug },
    });

    return destination.id;
  });

  return { ok: true, destinationId, slug: draft.slug };
}

export async function unpublishDestination(
  destinationId: string,
): Promise<{ ok: true; slug: string } | { ok: false; errors: string[] }> {
  const destination = await prisma.destination.findUnique({
    where: { id: destinationId },
    select: { slug: true },
  });
  if (!destination) return { ok: false, errors: ["Destination not found."] };

  await prisma.$transaction(async (tx) => {
    await tx.destination.update({
      where: { id: destinationId },
      data: { status: "archived", publishedAt: null },
    });
    await emitOutboxEvent(tx, {
      type: "destination.unpublished",
      entityType: "destination",
      entityId: destinationId,
      payload: { slug: destination.slug },
    });
  });

  return { ok: true, slug: destination.slug };
}
