/**
 * OpenStreetMap / Overpass trail fetch.
 *
 * Queries named hiking paths near a park point and returns raw OSM ways with
 * inline geometry. The public Overpass instance is rate-limited and times out on
 * heavy queries, so we keep the radius small, request geometry, and retry on
 * 429/504 with backoff. OSM data is ODbL — attribution is rendered on maps and
 * in the source registry.
 *
 * `parseOverpass` is pure and fixture-testable; `fetchTrailsNear` does the network.
 */
import { z } from "zod";

const USER_AGENT = "TravelRoamer/1.0 (+https://travel-roamer.com)";

const nodeSchema = z.object({ lat: z.number(), lon: z.number() });

export const osmWaySchema = z.object({
  type: z.literal("way"),
  id: z.number(),
  tags: z.record(z.string(), z.string()).optional().default({}),
  geometry: z.array(nodeSchema).min(2),
});

export type OsmWay = z.infer<typeof osmWaySchema>;

const overpassResponseSchema = z.object({
  elements: z.array(z.unknown()),
});

/** Pure: keep only well-formed, named ways with geometry. */
export function parseOverpass(raw: unknown): OsmWay[] {
  const parsed = overpassResponseSchema.parse(raw);
  const ways: OsmWay[] = [];
  for (const el of parsed.elements) {
    const w = osmWaySchema.safeParse(el);
    if (w.success && w.data.tags.name) ways.push(w.data);
  }
  return ways;
}

function buildQuery(lat: number, lng: number, radiusM: number): string {
  // Named foot/hiking paths within the radius, with geometry. Capped at 80 ways
  // — enough to pick ~5 representative, but light enough to avoid 504 timeouts
  // on dense parks (we only keep the longest few anyway).
  return `[out:json][timeout:90];way["highway"~"path|footway"]["name"](around:${radiusM},${lat},${lng});out geom 80;`;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Public Overpass mirrors — rotated across retries to spread load. */
const OVERPASS_ENDPOINTS = [
  "https://overpass-api.de/api/interpreter",
  "https://overpass.kumi.systems/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

export async function fetchTrailsNear(
  lat: number,
  lng: number,
  radiusM = 6000,
  maxRetries = 5,
): Promise<OsmWay[]> {
  const body = new URLSearchParams({ data: buildQuery(lat, lng, radiusM) });

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const endpoint = OVERPASS_ENDPOINTS[attempt % OVERPASS_ENDPOINTS.length];
    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: {
          "User-Agent": USER_AGENT,
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: body.toString(),
      });
      if (res.ok) return parseOverpass(await res.json());
      // 429 (rate limit) / 504 (timeout) → back off, rotate, retry.
      if ((res.status === 429 || res.status === 504) && attempt < maxRetries) {
        await sleep(3000 * (attempt + 1));
        continue;
      }
      if (attempt >= maxRetries) throw new Error(`Overpass responded ${res.status}`);
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await sleep(3000 * (attempt + 1));
    }
  }
  return [];
}
