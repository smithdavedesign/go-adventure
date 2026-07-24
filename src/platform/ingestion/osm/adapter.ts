/**
 * Normalize OSM ways → representative trail records (pure, fixture-testable).
 *
 * Curation (PRD: representative trails, not a full catalogue): dedupe by name,
 * drop closed/too-short trails, keep the ~5 longest distinct named trails per
 * park. Difficulty comes from OSM `sac_scale` where present (sourced) else an
 * editorial default. Distance is derived from the geometry (haversine).
 */
import slugify from "@/shared/utils/slugify";
import type { OsmWay } from "./overpass";

export type Difficulty = "easy" | "moderate" | "hard" | "expert";

export type NormalizedTrail = {
  name: string;
  slug: string;
  osmWayId: number;
  /** [lng, lat] vertices for EWKT MultiLineString. */
  routePoints: [number, number][];
  distanceMiles: number;
  difficulty: Difficulty;
  /** confirmed when sac_scale-derived, editorial when defaulted. */
  difficultyConfidence: "confirmed" | "editorial";
  tags: string[];
};

/** OSM sac_scale → our difficulty enum (SAC hiking scale T1–T6). */
const SAC_MAP: Record<string, Difficulty> = {
  hiking: "easy",
  mountain_hiking: "moderate",
  demanding_mountain_hiking: "hard",
  alpine_hiking: "expert",
  demanding_alpine_hiking: "expert",
  difficult_alpine_hiking: "expert",
};

function haversineMiles(a: [number, number], b: [number, number]): number {
  const R = 3958.8; // miles
  const toRad = (d: number) => (d * Math.PI) / 180;
  const [lng1, lat1] = a;
  const [lng2, lat2] = b;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

function lengthMiles(points: [number, number][]): number {
  let total = 0;
  for (let i = 1; i < points.length; i++) total += haversineMiles(points[i - 1], points[i]);
  return total;
}

function isClosed(name: string, tags: Record<string, string>): boolean {
  return /closed|permanently/i.test(name) || tags.access === "no";
}

export function normalizeTrails(
  ways: OsmWay[],
  parkCode: string,
  max = 5,
): NormalizedTrail[] {
  // Dedupe by name, keeping the longest-geometry version.
  const byName = new Map<string, OsmWay>();
  for (const w of ways) {
    const name = w.tags.name;
    if (!name || isClosed(name, w.tags)) continue;
    const existing = byName.get(name);
    if (!existing || w.geometry.length > existing.geometry.length) byName.set(name, w);
  }

  const normalized = [...byName.values()]
    .map((w) => {
      const routePoints = w.geometry.map(
        (n) => [n.lon, n.lat] as [number, number],
      );
      const distanceMiles = Math.round(lengthMiles(routePoints) * 10) / 10;
      const sac = w.tags.sac_scale;
      const difficulty = sac ? (SAC_MAP[sac] ?? "moderate") : "moderate";
      return {
        name: w.tags.name,
        slug: `${slugify(w.tags.name)}-${parkCode}`,
        osmWayId: w.id,
        routePoints,
        distanceMiles,
        difficulty,
        difficultyConfidence: sac && SAC_MAP[sac] ? ("confirmed" as const) : ("editorial" as const),
        tags: [w.tags.route, w.tags.surface, w.tags.sac_scale].filter(
          (t): t is string => Boolean(t),
        ),
      };
    })
    // Drop trivially short segments; prefer prominent (longer) named trails.
    .filter((t) => t.distanceMiles >= 0.3)
    .sort((a, b) => b.distanceMiles - a.distanceMiles)
    .slice(0, max);

  return normalized;
}
