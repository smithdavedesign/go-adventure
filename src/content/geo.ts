/**
 * Geometry read helpers (server-only).
 *
 * Geography/geometry columns are Unsupported(...) in Prisma and can't be
 * selected through the typed client, so all geometry decoding happens here via
 * raw SQL: points → ST_X/ST_Y, routes → ST_AsGeoJSON. Callers fetch typed
 * fields with Prisma and enrich them with these coordinates by id.
 * See docs/adr/0003-postgis-spatial-model.md.
 */
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import type { Coordinates } from "@/shared/types/content";

/** Map of destination id → decoded point (rows without a point are omitted). */
export async function fetchDestinationPoints(
  ids: string[],
): Promise<Map<string, Coordinates>> {
  const out = new Map<string, Coordinates>();
  if (ids.length === 0) return out;

  const rows = await prisma.$queryRaw<
    { id: string; lat: number | null; lng: number | null }[]
  >(Prisma.sql`
    SELECT id::text AS id,
           ST_Y(location::geometry) AS lat,
           ST_X(location::geometry) AS lng
    FROM "Destination"
    WHERE id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      AND location IS NOT NULL
  `);

  for (const r of rows) {
    if (r.lat != null && r.lng != null) out.set(r.id, { lat: r.lat, lng: r.lng });
  }
  return out;
}

/** GeoJSON MultiLineString coordinates: array of lines, each an array of [lng, lat]. */
type MultiLineCoords = [number, number][][];

/** Map of trail id → route coordinates (rows without geometry are omitted). */
export async function fetchTrailRoutes(
  ids: string[],
): Promise<Map<string, MultiLineCoords>> {
  const out = new Map<string, MultiLineCoords>();
  if (ids.length === 0) return out;

  const rows = await prisma.$queryRaw<
    { id: string; route: { type: string; coordinates: MultiLineCoords } | null }[]
  >(Prisma.sql`
    SELECT id::text AS id,
           ST_AsGeoJSON("routeGeometry")::json AS route
    FROM "Trail"
    WHERE id = ANY(ARRAY[${Prisma.join(ids)}]::uuid[])
      AND "routeGeometry" IS NOT NULL
  `);

  for (const r of rows) {
    if (r.route?.coordinates) out.set(r.id, r.route.coordinates);
  }
  return out;
}
