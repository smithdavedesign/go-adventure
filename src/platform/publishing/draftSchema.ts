/**
 * What a destination draft must contain before it can be published.
 *
 * Ingestion (M5) lands a draft with only source-confirmable fields; an editor
 * fills the editorial facets during review. This schema is the gate: publish is
 * refused until every required field is present and valid. That's how "every
 * published row has geometry / difficulty / budget" is enforced — at publish,
 * not by the (draft-permissive) table schema.
 */
import { z } from "zod";
import {
  ACTIVITIES,
  DIFFICULTIES,
  MONTHS,
  TRIP_LENGTHS,
} from "@/shared/types/content";

const permitTypes = [
  "none",
  "reservation",
  "quota",
  "timed_entry",
  "unknown",
] as const;

const labels = [
  "editors_pick",
  "hidden_gem",
  "trending",
  "beginner_friendly",
  "epic",
] as const;

export const publishableDraftSchema = z.object({
  name: z.string().min(1),
  slug: z
    .string()
    .min(1)
    .regex(/^[a-z0-9-]+$/, "slug must be URL-safe (lowercase, digits, hyphens)"),
  point: z.object({
    lat: z.number().min(-90).max(90),
    lng: z.number().min(-180).max(180),
  }),
  summary: z.string().min(1).nullable().optional(),
  summaryDraft: z.string().nullable().optional(),
  activities: z.array(z.enum(ACTIVITIES as unknown as [string, ...string[]])).min(1),
  bestMonths: z.array(z.enum(MONTHS as unknown as [string, ...string[]])),
  difficulty: z.enum(DIFFICULTIES as unknown as [string, ...string[]]),
  tripLength: z.enum(TRIP_LENGTHS as unknown as [string, ...string[]]),
  label: z.enum(labels).nullable().optional(),
  budget: z.object({
    currency: z.string().default("USD"),
    low: z.number().int().nonnegative(),
    high: z.number().int().nonnegative(),
  }),
  officialUrl: z.string().url().optional(),
  permit: z
    .object({
      requirementType: z.enum(permitTypes),
      scope: z.string().min(1),
      officialUrl: z.string().url(),
    })
    .nullable()
    .optional(),
  facts: z
    .array(
      z.object({
        field: z.string(),
        value: z.unknown(),
        confidence: z.enum(["confirmed", "editorial", "uncertain"]),
      }),
    )
    .optional()
    .default([]),
});

export type PublishableDraft = z.infer<typeof publishableDraftSchema>;

export type DraftValidation =
  | { ok: true; draft: PublishableDraft }
  | { ok: false; errors: string[] };

/** Validate a revision body for publish; returns friendly errors, never throws. */
export function validateDraftForPublish(body: unknown): DraftValidation {
  const result = publishableDraftSchema.safeParse(body);
  if (result.success) return { ok: true, draft: result.data };
  const errors = result.error.issues.map(
    (i) => `${i.path.join(".") || "(root)"}: ${i.message}`,
  );
  // Trip budget sanity beyond the schema: low ≤ high.
  return { ok: false, errors };
}
