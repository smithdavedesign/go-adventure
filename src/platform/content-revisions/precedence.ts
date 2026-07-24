/**
 * Fact precedence and freshness rules (Platform domain, pure/testable).
 *
 * PRD Content Trust Policy — precedence when sources conflict, highest first:
 *   1. Official government / land-manager information
 *   2. Human-reviewed editorial content
 *   3. Approved community contribution
 *   4. AI-assisted draft (never published without human approval)
 *
 * PRD Dynamic-data rule — an expired fact is removed from display, never shown
 * stale. These functions decide which assertion "wins" for a field and whether a
 * fact/permit is still fresh. `now` is injected so callers and tests are
 * deterministic (the app passes `new Date()`).
 *
 * Kept free of any Prisma import so it runs in the unit-test (jsdom) environment.
 */

/** Confidence ordering, most-trusted first. Mirrors the FactConfidence enum. */
const CONFIDENCE_RANK: Record<string, number> = {
  confirmed: 0,
  editorial: 1,
  uncertain: 2,
};

/** Revision-origin ordering, most-trusted first. Mirrors the RevisionOrigin enum. */
const ORIGIN_RANK: Record<string, number> = {
  official: 0,
  editorial: 1,
  community: 2,
  ai_assisted: 3,
};

export type FactLike = {
  field: string;
  value: unknown;
  confidence: string;
  verifiedAt: Date;
  expiresAt?: Date | null;
};

export type PermitLike = {
  requirementType: string;
  lastVerifiedAt: Date;
  expiresAt?: Date | null;
};

/** A fact is fresh if it has no expiry or the expiry is still in the future. */
export function isFresh(
  item: { expiresAt?: Date | null },
  now: Date,
): boolean {
  return item.expiresAt == null || item.expiresAt.getTime() > now.getTime();
}

export function confidenceRank(confidence: string): number {
  // Unknown values sort last (least trusted) rather than throwing.
  return CONFIDENCE_RANK[confidence] ?? Number.MAX_SAFE_INTEGER;
}

export function originRank(origin: string): number {
  return ORIGIN_RANK[origin] ?? Number.MAX_SAFE_INTEGER;
}

/**
 * Given several assertions for the SAME field, return the winning one:
 * drop expired, then prefer higher confidence, then more recent verification.
 * Returns null when every assertion is expired.
 */
export function pickWinningFact<T extends FactLike>(
  facts: T[],
  now: Date,
): T | null {
  const fresh = facts.filter((f) => isFresh(f, now));
  if (fresh.length === 0) return null;

  return fresh.reduce((best, f) => {
    const byConfidence = confidenceRank(f.confidence) - confidenceRank(best.confidence);
    if (byConfidence !== 0) return byConfidence < 0 ? f : best;
    // Tie on confidence → most recently verified wins.
    return f.verifiedAt.getTime() > best.verifiedAt.getTime() ? f : best;
  });
}

/**
 * Resolve the fresh facts for a subject into a { field → value } map, applying
 * precedence per field. Expired facts and fields with only expired assertions
 * are omitted (the claim is dropped, not shown stale).
 */
export function resolveFacts<T extends FactLike>(
  facts: T[],
  now: Date,
): Record<string, unknown> {
  const byField = new Map<string, T[]>();
  for (const f of facts) {
    const list = byField.get(f.field) ?? [];
    list.push(f);
    byField.set(f.field, list);
  }

  const out: Record<string, unknown> = {};
  for (const [field, list] of byField) {
    const winner = pickWinningFact(list, now);
    if (winner) out[field] = winner.value;
  }
  return out;
}

/**
 * The permit to display for a subject: the freshest non-expired requirement.
 * Returns null when there's no current permit info — the UI must then say so
 * honestly rather than implying "no permit required".
 */
export function resolvePermit<T extends PermitLike>(
  permits: T[],
  now: Date,
): T | null {
  const fresh = permits.filter((p) => isFresh(p, now));
  if (fresh.length === 0) return null;
  return fresh.reduce((best, p) =>
    p.lastVerifiedAt.getTime() > best.lastVerifiedAt.getTime() ? p : best,
  );
}
