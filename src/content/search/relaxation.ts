/**
 * Zero-result constraint relaxation (PRD Search: Zero-Result Constraint Relaxation).
 *
 * A hard "No results found" state is a product failure. When a filter combination
 * matches nothing, we drop the most restrictive constraint and re-run, showing the
 * result transparently. Rules implemented here, verbatim from the PRD:
 *
 *  - Drop order (most-restrictive first): budget → month → trip length → difficulty.
 *  - Activity is NEVER relaxed — it's the user's primary intent.
 *  - Keyword (`q`) is never relaxed either; if the keyword itself matches nothing,
 *    relaxing facets can't help, so we don't pretend it can.
 *  - At most two relaxations before falling back to "explore all".
 *  - Every relaxation is visible and labeled (the caller renders the banner);
 *    non-relaxed constraints are preserved.
 *
 * The drop-order functions are pure and covered by unit tests; resolveExplore adds
 * the DB counting/listing around them.
 */
import {
  countPublishedDestinations,
  listPublishedDestinations,
  resolveSearchIds,
} from "@/content/destinations/queries";
import type { DestinationFilters } from "./filters";
import type { DestinationCard } from "@/shared/types/content";

export type RelaxableConstraint = "budget" | "month" | "tripLength" | "difficulty";

/** Priority order in which constraints are dropped. Activity/keyword excluded. */
export const RELAX_ORDER: readonly RelaxableConstraint[] = [
  "budget",
  "month",
  "tripLength",
  "difficulty",
];

export const MAX_RELAXATIONS = 2;

export function isConstraintActive(
  filters: DestinationFilters,
  c: RelaxableConstraint,
): boolean {
  switch (c) {
    case "budget":
      return filters.maxBudgetUsd != null;
    case "month":
      return filters.months.length > 0;
    case "tripLength":
      return filters.tripLengths.length > 0;
    case "difficulty":
      return filters.difficulties.length > 0;
  }
}

/** Return a copy of `filters` with one constraint cleared. */
export function dropConstraint(
  filters: DestinationFilters,
  c: RelaxableConstraint,
): DestinationFilters {
  switch (c) {
    case "budget":
      return { ...filters, maxBudgetUsd: null };
    case "month":
      return { ...filters, months: [] };
    case "tripLength":
      return { ...filters, tripLengths: [] };
    case "difficulty":
      return { ...filters, difficulties: [] };
  }
}

/** The next constraint to relax, or null when nothing relaxable remains. */
export function nextRelaxation(
  filters: DestinationFilters,
): { constraint: RelaxableConstraint; relaxed: DestinationFilters } | null {
  for (const c of RELAX_ORDER) {
    if (isConstraintActive(filters, c)) {
      return { constraint: c, relaxed: dropConstraint(filters, c) };
    }
  }
  return null;
}

export type ExploreResult = {
  destinations: DestinationCard[];
  /** Filters actually applied to the shown results (after any relaxation). */
  appliedFilters: DestinationFilters;
  /** Constraints dropped to reach the shown results, in the order dropped. */
  dropped: RelaxableConstraint[];
  /** True when results are still empty after exhausting allowed relaxations. */
  exhausted: boolean;
  /** True when a keyword was given but matched no destination at all. */
  noKeywordMatch: boolean;
};

/**
 * Resolve an Explore request: run the filters, and if they match nothing, relax
 * up to MAX_RELAXATIONS constraints in priority order. The keyword search is
 * resolved once and preserved across relaxations (it is never relaxed).
 */
export async function resolveExplore(
  filters: DestinationFilters,
): Promise<ExploreResult> {
  const searchIds = await resolveSearchIds(filters);

  // Keyword given but nothing matched it — relaxing facets cannot produce a
  // match, and silently widening would violate the grounding rule.
  if (searchIds && searchIds.length === 0) {
    return {
      destinations: [],
      appliedFilters: filters,
      dropped: [],
      exhausted: true,
      noKeywordMatch: true,
    };
  }

  let current = filters;
  const dropped: RelaxableConstraint[] = [];
  let count = await countPublishedDestinations(current, searchIds);

  while (count === 0 && dropped.length < MAX_RELAXATIONS) {
    const step = nextRelaxation(current);
    if (!step) break; // nothing left that we're allowed to relax
    current = step.relaxed;
    dropped.push(step.constraint);
    count = await countPublishedDestinations(current, searchIds);
  }

  const destinations =
    count > 0 ? await listPublishedDestinations(current, searchIds) : [];

  return {
    destinations,
    appliedFilters: current,
    dropped,
    exhausted: count === 0,
    noKeywordMatch: false,
  };
}
