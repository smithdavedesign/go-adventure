"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { DestinationMap } from "./DestinationMap";
import { Badge } from "@/shared/ui/badge";
import { formatDifficulty } from "@/shared/utils/format";
import type { Coordinates, MultiPolygonCoords, TrailSummary } from "@/shared/types/content";

const DIFFICULTY_ORDER = ["easy", "moderate", "hard", "expert"] as const;

function summarizeTrailDifficulty(difficulties: string[]): string | null {
  const ranks = difficulties
    .map((d) => DIFFICULTY_ORDER.indexOf(d as (typeof DIFFICULTY_ORDER)[number]))
    .filter((i) => i >= 0);
  if (ranks.length === 0) return null;
  const lo = DIFFICULTY_ORDER[Math.min(...ranks)];
  const hi = DIFFICULTY_ORDER[Math.max(...ranks)];
  const cap = (s: string) => s[0].toUpperCase() + s.slice(1);
  return lo === hi ? cap(lo) : `${cap(lo)}–${cap(hi)}`;
}

/**
 * Combined map + trail listing for the destination detail page.
 * Both sections share hover state: mousing over a trail card highlights
 * the corresponding route on the map, making spatial context immediate.
 */
type TrailSort = "featured" | "longest" | "shortest" | "elevation" | "duration";

const SORTERS: Record<TrailSort, (a: TrailSummary, b: TrailSummary) => number> = {
  featured: () => 0, // keep incoming order (representative first, editorial order)
  longest: (a, b) => b.distanceMiles - a.distanceMiles,
  shortest: (a, b) => a.distanceMiles - b.distanceMiles,
  elevation: (a, b) => b.elevationGainFt - a.elevationGainFt,
  duration: (a, b) => b.durationHours - a.durationHours,
};

export function DestinationMapWithTrails({
  center,
  area,
  destinationName,
  trails,
}: {
  center: Coordinates | null;
  area?: MultiPolygonCoords | null;
  destinationName?: string;
  trails: TrailSummary[];
}) {
  const [hoveredTrailName, setHoveredTrailName] = useState<string | null>(null);
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [sort, setSort] = useState<TrailSort>("featured");

  // Memoized so hovering a trail (which re-renders this component) doesn't hand
  // DestinationMap a fresh `routes` array each time — otherwise its init effect
  // would tear down and rebuild the whole map on every hover, flashing the map
  // and defeating the highlight. Keyed on `trails`, which is stable per page.
  // The map always shows the full set (spatial overview); only the LIST filters.
  const mapRoutes = useMemo(
    () =>
      trails
        .filter((t) => t.route)
        .map((t) => ({ name: t.name, route: t.route as [number, number][][] })),
    [trails],
  );

  const difficultyRange = useMemo(
    () => summarizeTrailDifficulty(trails.map((t) => t.difficulty)),
    [trails],
  );

  // Difficulties actually present, in canonical order — drives the filter chips.
  const presentDifficulties = useMemo(
    () =>
      DIFFICULTY_ORDER.filter((d) => trails.some((t) => t.difficulty === d)),
    [trails],
  );

  const visibleTrails = useMemo(() => {
    const filtered = difficulty
      ? trails.filter((t) => t.difficulty === difficulty)
      : trails;
    // Copy before sort so the incoming array isn't mutated.
    return [...filtered].sort(SORTERS[sort]);
  }, [trails, difficulty, sort]);

  // Sort is useful whenever there are a few trails; difficulty chips only when
  // the trails actually span more than one difficulty.
  const showControls = trails.length >= 3;
  const showDifficultyChips = presentDifficulties.length > 1;

  return (
    <>
      {/* Map */}
      {center && (
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Map</h2>
          <DestinationMap
            center={center}
            routes={mapRoutes}
            area={area}
            destinationName={destinationName}
            hoveredTrailName={hoveredTrailName}
            className="h-[420px] w-full"
          />
        </section>
      )}

      {/* Trail listing */}
      <section className="mt-10">
        <h2 className="mb-4 text-lg font-semibold">
          Trails ({difficulty ? `${visibleTrails.length} of ${trails.length}` : trails.length})
          {difficultyRange && (
            <span className="ml-2 font-normal text-muted-foreground">
              · {difficultyRange}
            </span>
          )}
        </h2>

        {/* Trail-level filters (PRD: trail listing with trail-level filters). */}
        {showControls && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            {showDifficultyChips && (
              <div
                className="flex flex-wrap items-center gap-1.5"
                role="group"
                aria-label="Filter trails by difficulty"
              >
                <FilterChip active={difficulty === null} onClick={() => setDifficulty(null)}>
                  All
                </FilterChip>
                {presentDifficulties.map((d) => (
                  <FilterChip
                    key={d}
                    active={difficulty === d}
                    onClick={() => setDifficulty(difficulty === d ? null : d)}
                  >
                    {formatDifficulty(d)}
                  </FilterChip>
                ))}
              </div>
            )}
            <label className="ml-auto flex items-center gap-2 text-sm text-muted-foreground">
              Sort
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as TrailSort)}
                className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
              >
                <option value="featured">Featured</option>
                <option value="longest">Longest</option>
                <option value="shortest">Shortest</option>
                <option value="elevation">Elevation gain</option>
                <option value="duration">Duration</option>
              </select>
            </label>
          </div>
        )}

        {visibleTrails.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {visibleTrails.map((t) => (
              <li key={t.id}>
                <Link
                  href={`/trails/${t.slug}`}
                  className="flex flex-col gap-1 p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                  onMouseEnter={() => setHoveredTrailName(t.name)}
                  onMouseLeave={() => setHoveredTrailName(null)}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className="font-medium transition-colors"
                        style={hoveredTrailName === t.name ? { color: "#e05d2a" } : undefined}
                      >
                        {t.name}
                      </span>
                      {t.isRepresentative && (
                        <Badge variant="brand">Representative</Badge>
                      )}
                    </div>
                    <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                      <span>{t.distanceMiles} mi</span>
                      <span aria-hidden>·</span>
                      <span>{t.elevationGainFt.toLocaleString()} ft gain</span>
                      <span aria-hidden>·</span>
                      <span>{formatDifficulty(t.difficulty)}</span>
                      <span aria-hidden>·</span>
                      <span>~{t.durationHours} h</span>
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">View →</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">
            No representative trails listed yet.
          </p>
        )}
      </section>
    </>
  );
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={
        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
        (active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border text-muted-foreground hover:text-foreground")
      }
    >
      {children}
    </button>
  );
}
