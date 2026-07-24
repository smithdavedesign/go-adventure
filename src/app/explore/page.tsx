import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { parseFilters, type DestinationFilters } from "@/content/search/filters";
import {
  resolveExplore,
  type RelaxableConstraint,
} from "@/content/search/relaxation";
import { FilterBar } from "@/content/search/FilterBar";
import {
  RelaxationBanner,
  type DroppedLabel,
} from "@/content/search/RelaxationBanner";
import { DestinationCard } from "@/content/destinations/DestinationCard";
import {
  formatDifficulty,
  formatMonthShort,
  formatTripLength,
} from "@/shared/utils/format";

export const metadata: Metadata = {
  title: "Explore",
  description:
    "Filter outdoor adventure destinations by activity, season, difficulty, trip length, and budget.",
};

// Filter results depend on the query string and the current corpus; not a
// statically cached editorial page. Rendered per-request. (PRD caching model.)
export const dynamic = "force-dynamic";

/** Human label for a constraint that was relaxed away, from the user's original filters. */
function droppedLabel(
  constraint: RelaxableConstraint,
  filters: DestinationFilters,
): string {
  switch (constraint) {
    case "budget":
      return `Budget up to $${filters.maxBudgetUsd?.toLocaleString()}`;
    case "month":
      return `Month: ${filters.months.map(formatMonthShort).join(", ")}`;
    case "tripLength":
      return `Trip: ${filters.tripLengths.map(formatTripLength).join(", ")}`;
    case "difficulty":
      return `Difficulty: ${filters.difficulties.map(formatDifficulty).join(", ")}`;
  }
}

export default async function ExplorePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const filters = parseFilters(await searchParams);
  const { destinations, dropped, noKeywordMatch } =
    await resolveExplore(filters);

  const wasRelaxed = dropped.length > 0 && destinations.length > 0;
  const droppedLabels: DroppedLabel[] = dropped.map((c) => ({
    constraint: c,
    label: droppedLabel(c, filters),
  }));

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          Explore destinations
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {destinations.length === 0
            ? "No matches yet — adjust your search."
            : wasRelaxed
              ? `Showing the ${destinations.length} closest ${destinations.length === 1 ? "result" : "results"}.`
              : `${destinations.length} matching ${destinations.length === 1 ? "destination" : "destinations"}.`}
        </p>
      </div>

      {/* useSearchParams inside these client components requires a Suspense boundary. */}
      <Suspense fallback={<div className="h-28" />}>
        <FilterBar />
      </Suspense>

      <div className="mt-8 space-y-6">
        {wasRelaxed && <RelaxationBanner dropped={droppedLabels} />}

        {destinations.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {destinations.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        ) : (
          // Terminal empty state is never a dead end: offer a broader path.
          // Reached only when even relaxing every allowed facet found nothing
          // (or the keyword matched nothing at all).
          <div className="rounded-xl border border-dashed border-border py-16 text-center">
            {noKeywordMatch ? (
              <>
                <p className="font-medium">
                  No destinations matched &ldquo;{filters.q}&rdquo;.
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try a different word, or browse everything.
                </p>
              </>
            ) : (
              <p className="font-medium">
                No matches, even after relaxing filters.
              </p>
            )}
            <Link
              href="/explore"
              className="mt-4 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
            >
              Explore all destinations
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
