/**
 * Ingestion contracts (Platform domain).
 *
 * A SourceAdapter knows how to fetch raw records from one external source and
 * normalize each into a canonical DRAFT. The pipeline (pipeline.ts) drives the
 * adapter through fetch → validate → normalize → store → persist-draft, lands
 * the draft in the editorial review queue, and never publishes on its own.
 *
 * `normalize` is a pure function of one raw record → one draft (or a thrown
 * error), so it's fully unit-testable against recorded fixtures without any
 * network or database.
 */
import type {
  Activity,
  Month,
  PermitRequirementType,
} from "@/shared/types/content";
import type { FactConfidence } from "@/generated/prisma/client";

/** One raw object captured from a source, before normalization. */
export type RawRecord = {
  /** Stable id of the object within the source (e.g. NPS parkCode). */
  externalId: string;
  canonicalUrl?: string;
  /** The raw payload exactly as fetched; checksummed and archived verbatim. */
  payload: unknown;
};

export type NormalizedFact = {
  field: string;
  value: unknown;
  /** confirmed = sourced from the authority; editorial/uncertain = needs review. */
  confidence: FactConfidence;
};

export type NormalizedPermit = {
  requirementType: PermitRequirementType;
  scope: string;
  officialUrl: string;
};

/**
 * A normalized destination DRAFT. Only fields the source can authoritatively
 * provide are populated; editorial facets (difficulty, trip length, budget,
 * best months) are left for a human to add during review — never invented here.
 */
export type NormalizedDestinationDraft = {
  sourceExternalId: string;
  name: string;
  slug: string;
  point: { lat: number; lng: number };
  /** Draft summary text from the source, subject to editorial review + rights check. */
  summaryDraft: string | null;
  officialUrl: string;
  activities: Activity[];
  bestMonths: Month[];
  facts: NormalizedFact[];
  permit: NormalizedPermit | null;
};

/** Registry metadata a source must carry before it can be ingested (PRD Source Registry). */
export type SourceRegistry = {
  name: string;
  baseUrl: string;
  licence: string;
  attributionText: string;
  termsUrl?: string;
  commercialUse: string;
  refreshPolicy: string;
  owner: string;
};

export interface SourceAdapter {
  registry: SourceRegistry;
  /** Bumped whenever the mapping logic changes, so re-normalized records don't collide. */
  normalizerVersion: string;
  /** Live fetch from the source. May require an API key; throws if misconfigured. */
  fetchRaw(): Promise<RawRecord[]>;
  /** Pure map of one raw record → one draft. Throws on invalid/unmappable input. */
  normalize(raw: RawRecord): NormalizedDestinationDraft;
}
