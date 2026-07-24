/**
 * Explore filter state: parsing, validation, and serialization.
 *
 * Filter state lives in the URL query string so every Explore view is
 * linkable, server-renderable, and back-button friendly. This module is
 * deliberately free of any Prisma/server import so client components (the
 * filter bar) and server queries share one definition.
 *
 * All parsing is allow-list based — unknown values are dropped, never trusted
 * (PRD Security: allow-list input validation). The M2 subset covers activity,
 * difficulty, trip length, month, and max budget; `q` (keyword) is parsed now
 * but only acted on starting M3.
 */
import {
  ACTIVITIES,
  DIFFICULTIES,
  MONTHS,
  TRIP_LENGTHS,
  type Activity,
  type Difficulty,
  type Month,
  type TripLength,
} from "@/shared/types/content";

export type DestinationFilters = {
  activities: Activity[];
  difficulties: Difficulty[];
  tripLengths: TripLength[];
  months: Month[];
  maxBudgetUsd: number | null;
  q: string | null;
};

export const EMPTY_FILTERS: DestinationFilters = {
  activities: [],
  difficulties: [],
  tripLengths: [],
  months: [],
  maxBudgetUsd: null,
  q: null,
};

/** The multi-value facet keys, paired with their valid value set. */
const FACETS = {
  activity: ACTIVITIES,
  difficulty: DIFFICULTIES,
  tripLength: TRIP_LENGTHS,
  month: MONTHS,
} as const;

type FacetKey = keyof typeof FACETS;

/** Read a repeated/comma-joined param and keep only allow-listed values. */
function readFacet<T extends string>(
  params: URLSearchParams,
  key: string,
  allowed: readonly T[],
): T[] {
  const raw = params.getAll(key).flatMap((v) => v.split(","));
  const seen = new Set<string>();
  const out: T[] = [];
  for (const v of raw) {
    const trimmed = v.trim();
    if (allowed.includes(trimmed as T) && !seen.has(trimmed)) {
      seen.add(trimmed);
      out.push(trimmed as T);
    }
  }
  return out;
}

/**
 * Accepts anything URLSearchParams can be built from, including Next's
 * `searchParams` object ({ [k]: string | string[] | undefined }).
 */
export function parseFilters(
  input: URLSearchParams | Record<string, string | string[] | undefined>,
): DestinationFilters {
  const params =
    input instanceof URLSearchParams ? input : toSearchParams(input);

  const maxBudgetRaw = params.get("maxBudget");
  const maxBudget = maxBudgetRaw ? Number.parseInt(maxBudgetRaw, 10) : NaN;

  const q = params.get("q")?.trim();

  return {
    activities: readFacet(params, "activity", FACETS.activity),
    difficulties: readFacet(params, "difficulty", FACETS.difficulty),
    tripLengths: readFacet(params, "tripLength", FACETS.tripLength),
    months: readFacet(params, "month", FACETS.month),
    maxBudgetUsd: Number.isFinite(maxBudget) && maxBudget > 0 ? maxBudget : null,
    q: q ? q.slice(0, 120) : null, // bound length defensively
  };
}

function toSearchParams(
  obj: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    if (Array.isArray(value)) {
      for (const v of value) params.append(key, v);
    } else {
      params.append(key, value);
    }
  }
  return params;
}

/** Serialize back to a URLSearchParams for building hrefs. */
export function filtersToSearchParams(
  filters: DestinationFilters,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const v of filters.activities) params.append("activity", v);
  for (const v of filters.difficulties) params.append("difficulty", v);
  for (const v of filters.tripLengths) params.append("tripLength", v);
  for (const v of filters.months) params.append("month", v);
  if (filters.maxBudgetUsd != null)
    params.set("maxBudget", String(filters.maxBudgetUsd));
  if (filters.q) params.set("q", filters.q);
  return params;
}

/** Count of active constraints — drives the "clear filters" affordance. */
export function activeFilterCount(filters: DestinationFilters): number {
  return (
    filters.activities.length +
    filters.difficulties.length +
    filters.tripLengths.length +
    filters.months.length +
    (filters.maxBudgetUsd != null ? 1 : 0) +
    (filters.q ? 1 : 0)
  );
}

export type { FacetKey };
