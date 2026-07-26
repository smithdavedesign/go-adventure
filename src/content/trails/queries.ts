/**
 * Published-trail reads (server-only, Content domain). Read-only, published only.
 */
import { prisma } from "@/shared/config/db";
import { fetchTrailRoutes } from "@/content/geo";
import type {
  ElevationPoint,
  GalleryPhoto,
  TrailDetail,
} from "@/shared/types/content";

/** Read a trail's stored elevation profile (a FactAssertion) — the raw {d,e}
 *  points, before coordinates are zipped in. */
async function getRawElevationProfile(
  trailId: string,
): Promise<{ d: number; e: number }[] | null> {
  const fact = await prisma.factAssertion.findFirst({
    where: { subjectType: "trail", subjectId: trailId, field: "elevationProfile" },
    orderBy: { verifiedAt: "desc" },
    select: { value: true },
  });
  const value = fact?.value;
  if (!Array.isArray(value)) return null;
  const points = value.filter(
    (p): p is { d: number; e: number } =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as { d: unknown }).d === "number" &&
      typeof (p as { e: unknown }).e === "number",
  );
  return points.length > 1 ? points : null;
}

/** Evenly pick `count` points from a list by index (matches the backfill's
 *  sampling, so the i-th coordinate lines up with the i-th stored {d,e}). */
function sampleByIndex<T>(items: T[], count: number): T[] {
  if (items.length <= count) return items;
  const step = (items.length - 1) / (count - 1);
  return Array.from({ length: count }, (_, i) => items[Math.round(i * step)]);
}

/** Zip the stored {d,e} profile with route coordinates so each chart point knows
 *  its map position. The profile was sampled from this same route (max 40 pts),
 *  so re-sampling the flattened route to the profile length re-aligns the points. */
function withCoordinates(
  raw: { d: number; e: number }[] | null,
  route: [number, number][][] | null,
): ElevationPoint[] | null {
  if (!raw || !route) return null;
  const flat = route.flat();
  if (flat.length < 2) return null;
  const coords = sampleByIndex(flat, Math.min(raw.length, 40));
  const n = Math.min(raw.length, coords.length);
  if (n < 2) return null;
  return Array.from({ length: n }, (_, i) => ({
    d: raw[i].d,
    e: raw[i].e,
    lng: coords[i][0],
    lat: coords[i][1],
  }));
}

export async function getTrailBySlug(slug: string): Promise<TrailDetail | null> {
  const row = await prisma.trail.findFirst({
    where: { slug, status: "published" },
    include: {
      destinations: {
        where: { destination: { status: "published" } },
        include: {
          destination: {
            select: {
              name: true,
              slug: true,
              photos: {
                where: { moderationStatus: "approved", originalUrl: { not: null } },
                select: { id: true, originalUrl: true, creatorCredit: true, altText: true },
                orderBy: { createdAt: "asc" },
                take: 6,
              },
            },
          },
        },
      },
    },
  });
  if (!row) return null;

  const [routes, rawProfile] = await Promise.all([
    fetchTrailRoutes([row.id]),
    getRawElevationProfile(row.id),
  ]);
  const route = routes.get(row.id) ?? null;
  const elevationProfile = withCoordinates(rawProfile, route);

  // Trail-specific photos aren't reliably available; surface the parent park's
  // gallery instead (clearly captioned as park photos on the page).
  const parkPhotos: GalleryPhoto[] = (row.destinations[0]?.destination.photos ?? [])
    .filter((p): p is typeof p & { originalUrl: string } => !!p.originalUrl)
    .map((p) => ({
      id: p.id,
      imageUrl: p.originalUrl,
      credit: p.creatorCredit,
      alt: p.altText,
    }));

  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    distanceMiles: row.distanceMiles,
    elevationGainFt: row.elevationGainFt,
    difficulty: row.difficulty,
    durationHours: row.durationHours,
    costUSD: row.costUSD,
    tags: row.tags,
    // A trail viewed on its own page has no single editorial "representative"
    // status — that's a property of a destination↔trail listing, not the trail.
    isRepresentative: false,
    route,
    destinations: row.destinations.map((dt) => ({
      name: dt.destination.name,
      slug: dt.destination.slug,
    })),
    elevationProfile,
    parkPhotos,
  };
}

/** All published trail slugs — for the sitemap. */
export async function listPublishedTrailSlugs(): Promise<string[]> {
  const rows = await prisma.trail.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}

/** Lightweight published trail lookup for route metadata generation. */
export async function getTrailMetadataBySlug(
  slug: string,
): Promise<{ name: string } | null> {
  const row = await prisma.trail.findFirst({
    where: { slug, status: "published" },
    select: { name: true },
  });
  return row ? { name: row.name } : null;
}
