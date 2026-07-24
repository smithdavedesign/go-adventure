/**
 * Published-trail reads (server-only, Content domain). Read-only, published only.
 */
import { prisma } from "@/shared/config/db";
import { fetchTrailRoutes } from "@/content/geo";
import type { TrailDetail } from "@/shared/types/content";

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

  const routes = await fetchTrailRoutes([row.id]);

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
  };
}
