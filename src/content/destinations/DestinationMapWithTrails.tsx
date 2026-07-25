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

  // Memoized so hovering a trail (which re-renders this component) doesn't hand
  // DestinationMap a fresh `routes` array each time — otherwise its init effect
  // would tear down and rebuild the whole map on every hover, flashing the map
  // and defeating the highlight. Keyed on `trails`, which is stable per page.
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
          Trails ({trails.length})
          {difficultyRange && (
            <span className="ml-2 font-normal text-muted-foreground">
              · {difficultyRange}
            </span>
          )}
        </h2>
        {trails.length > 0 ? (
          <ul className="divide-y divide-border rounded-xl border border-border">
            {trails.map((t) => (
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
