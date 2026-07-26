/**
 * Published-trail reads (server-only, Content domain). Read-only, published only.
 */
import { prisma } from "@/shared/config/db";
import { fetchTrailRoutes } from "@/content/geo";
import type { ElevationPoint, TrailDetail } from "@/shared/types/content";

/** Read a trail's stored elevation profile (a FactAssertion), or null. */
async function getTrailElevationProfile(
  trailId: string,
): Promise<ElevationPoint[] | null> {
  const fact = await prisma.factAssertion.findFirst({
    where: { subjectType: "trail", subjectId: trailId, field: "elevationProfile" },
    orderBy: { verifiedAt: "desc" },
    select: { value: true },
  });
  const value = fact?.value;
  if (!Array.isArray(value)) return null;
  const points = value.filter(
    (p): p is ElevationPoint =>
      typeof p === "object" &&
      p !== null &&
      typeof (p as ElevationPoint).d === "number" &&
      typeof (p as ElevationPoint).e === "number",
  );
  return points.length > 1 ? points : null;
}

export async function getTrailBySlug(slug: string): Promise<TrailDetail | null> {
  const row = await prisma.trail.findFirst({
    where: { slug, status: "published" },
    include: {
      destinations: {
        where: { destination: { status: "published" } },
        include: { destination: { select: { name: true, slug: true } } },
      },
    },
  });
  if (!row) return null;

  const [routes, elevationProfile] = await Promise.all([
    fetchTrailRoutes([row.id]),
    getTrailElevationProfile(row.id),
  ]);

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
    route: routes.get(row.id) ?? null,
    destinations: row.destinations.map((dt) => ({
      name: dt.destination.name,
      slug: dt.destination.slug,
    })),
    elevationProfile,
  };
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
