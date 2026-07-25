/**
 * Published-destination reads (server-only, Content domain).
 *
 * Per the service boundaries in ARCHITECTURE.md, this module reads published
 * content only and never mutates. Typed fields and facet filtering go through
 * Prisma's client (`hasSome`/`in`/`lte`); coordinates are enriched from the geo
 * helpers. Nothing here returns draft/in_review/archived rows.
 */
import { prisma } from "@/shared/config/db";
import {
  fetchDestinationAreas,
  fetchDestinationPoints,
  fetchTrailRoutes,
} from "@/content/geo";
import type { DestinationFilters } from "@/content/search/filters";
import { searchDestinationIds } from "@/content/search/search";
import { resolveFacts, resolvePermit } from "@/platform/content-revisions/precedence";
import type {
  DestinationCard,
  DestinationDetail,
  EntranceFee,
  PermitRequirementType,
  ResolvedPermit,
  TrailSummary,
} from "@/shared/types/content";

/** Fetch and resolve the current permit for a destination (freshest, non-expired). */
async function getDestinationPermit(
  destinationId: string,
): Promise<ResolvedPermit | null> {
  const permits = await prisma.permitRequirement.findMany({
    where: { subjectType: "destination", subjectId: destinationId },
  });
  const winner = resolvePermit(permits, new Date());
  if (!winner) return null;
  return {
    requirementType: winner.requirementType as PermitRequirementType,
    scope: winner.scope,
    officialUrl: winner.officialUrl,
    lastVerifiedAt: winner.lastVerifiedAt,
  };
}

/** Resolve the destination's fact assertions (precedence + freshness) to values. */
async function getDestinationFacts(
  destinationId: string,
): Promise<{ entranceFee: EntranceFee | null; highlights: string[] }> {
  const facts = await prisma.factAssertion.findMany({
    where: { subjectType: "destination", subjectId: destinationId },
  });
  const resolved = resolveFacts(facts, new Date());

  const fee = resolved.entranceFee as
    | { costUsd?: number; title?: string }
    | undefined;
  const entranceFee =
    fee && typeof fee.costUsd === "number"
      ? { costUsd: fee.costUsd, title: fee.title ?? "Entrance fee" }
      : null;

  const highlights = Array.isArray(resolved.highlights)
    ? (resolved.highlights as unknown[]).filter(
        (h): h is string => typeof h === "string",
      )
    : [];

  return { entranceFee, highlights };
}

/**
 * Translate parsed filters into a Prisma `where` over published destinations.
 * `searchIds` (when the query has a keyword `q`) constrains and orders by the
 * FTS match; passing an empty list means "keyword matched nothing".
 */
function toWhere(
  filters: DestinationFilters,
  searchIds: string[] | null,
  permitIds: string[] | null = null,
) {
  // Both searchIds (keyword FTS) and permitIds (permit-required) constrain by id;
  // AND them so a destination must be in every active id set.
  const idClauses: { id: { in: string[] } }[] = [];
  if (searchIds) idClauses.push({ id: { in: searchIds } });
  if (permitIds) idClauses.push({ id: { in: permitIds } });
  return {
    status: "published" as const,
    ...(idClauses.length ? { AND: idClauses } : {}),
    ...(filters.activities.length
      ? { activities: { hasSome: filters.activities } }
      : {}),
    ...(filters.difficulties.length
      ? { difficulty: { in: filters.difficulties } }
      : {}),
    ...(filters.tripLengths.length
      ? { tripLength: { in: filters.tripLengths } }
      : {}),
    ...(filters.months.length
      ? { bestMonths: { hasSome: filters.months } }
      : {}),
    ...(filters.maxBudgetUsd != null
      ? { budgetLowUsd: { lte: filters.maxBudgetUsd } }
      : {}),
  };
}

/** Resolve keyword `q` to ranked ids once, so callers (and the relaxation loop)
 *  reuse the same search result. `null` = no keyword filter in play. */
export async function resolveSearchIds(
  filters: DestinationFilters,
): Promise<string[] | null> {
  return filters.q ? searchDestinationIds(filters.q) : null;
}

/** Name-matching published destinations for the search autocomplete. Substring,
 *  case-insensitive — adequate for the launch corpus; the full search adds typo
 *  tolerance. */
export async function suggestDestinations(
  q: string,
  limit = 6,
): Promise<{ name: string; slug: string }[]> {
  const term = q.trim();
  if (term.length < 2) return [];
  return prisma.destination.findMany({
    where: {
      status: "published",
      name: { contains: term, mode: "insensitive" },
    },
    select: { name: true, slug: true },
    orderBy: { name: "asc" },
    take: limit,
  });
}

/** Published-destination ids that currently require a permit/reservation. `null`
 *  when the permit filter is off (so it doesn't constrain the query). */
export async function resolvePermitIds(
  filters: DestinationFilters,
): Promise<string[] | null> {
  if (!filters.permitRequired) return null;
  const rows = await prisma.permitRequirement.findMany({
    where: {
      subjectType: "destination",
      requirementType: { in: ["reservation", "quota", "timed_entry"] },
      OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
    },
    select: { subjectId: true },
    distinct: ["subjectId"],
  });
  return rows.map((r) => r.subjectId);
}

export async function countPublishedDestinations(
  filters: DestinationFilters,
  searchIds: string[] | null = null,
  permitIds: string[] | null = null,
): Promise<number> {
  if (searchIds && searchIds.length === 0) return 0;
  if (permitIds && permitIds.length === 0) return 0;
  return prisma.destination.count({ where: toWhere(filters, searchIds, permitIds) });
}

export async function listPublishedDestinations(
  filters: DestinationFilters,
  searchIds: string[] | null = null,
  permitIds: string[] | null = null,
): Promise<DestinationCard[]> {
  if (searchIds && searchIds.length === 0) return [];
  if (permitIds && permitIds.length === 0) return [];

  const rows = await prisma.destination.findMany({
    where: toWhere(filters, searchIds, permitIds),
    // Keyword results keep FTS rank order (applied below); otherwise A→Z.
    orderBy: searchIds ? undefined : { name: "asc" },
    include: {
      heroAsset: { select: { altText: true, originalUrl: true, creatorCredit: true } },
    },
  });

  // Reorder to the search ranking when a keyword is active.
  if (searchIds) {
    const rank = new Map(searchIds.map((id, i) => [id, i]));
    rows.sort((a, b) => (rank.get(a.id) ?? 0) - (rank.get(b.id) ?? 0));
  }

  const points = await fetchDestinationPoints(rows.map((r) => r.id));

  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    activities: r.activities,
    bestMonths: r.bestMonths,
    difficulty: r.difficulty,
    tripLength: r.tripLength,
    label: r.label,
    budgetCurrency: r.budgetCurrency,
    budgetLowUsd: r.budgetLowUsd,
    budgetHighUsd: r.budgetHighUsd,
    summary: r.summary,
    tags: r.tags,
    location: points.get(r.id) ?? null,
    heroAlt: r.heroAsset?.altText ?? null,
    heroImageUrl: r.heroAsset?.originalUrl ?? null,
    heroCredit: r.heroAsset?.creatorCredit ?? null,
  }));
}

export async function getDestinationBySlug(
  slug: string,
): Promise<DestinationDetail | null> {
  const row = await prisma.destination.findFirst({
    where: { slug, status: "published" },
    include: {
      heroAsset: { select: { altText: true, originalUrl: true, creatorCredit: true } },
      photos: {
        where: { moderationStatus: "approved", originalUrl: { not: null } },
        select: { id: true, originalUrl: true, creatorCredit: true, altText: true },
        orderBy: { createdAt: "asc" },
      },
      trails: {
        where: { trail: { status: "published" } },
        orderBy: { editorialOrder: "asc" },
        include: { trail: true },
      },
    },
  });
  if (!row) return null;

  const [points, areas, routes, permit, facts] = await Promise.all([
    fetchDestinationPoints([row.id]),
    fetchDestinationAreas([row.id]),
    fetchTrailRoutes(row.trails.map((t) => t.trailId)),
    getDestinationPermit(row.id),
    getDestinationFacts(row.id),
  ]);

  const trails: TrailSummary[] = row.trails.map((dt) => ({
    id: dt.trail.id,
    name: dt.trail.name,
    slug: dt.trail.slug,
    distanceMiles: dt.trail.distanceMiles,
    elevationGainFt: dt.trail.elevationGainFt,
    difficulty: dt.trail.difficulty,
    durationHours: dt.trail.durationHours,
    costUSD: dt.trail.costUSD,
    tags: dt.trail.tags,
    isRepresentative: dt.isRepresentative,
    route: routes.get(dt.trailId) ?? null,
  }));

  const photos = row.photos
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
    activities: row.activities,
    bestMonths: row.bestMonths,
    difficulty: row.difficulty,
    tripLength: row.tripLength,
    label: row.label,
    budgetCurrency: row.budgetCurrency,
    budgetLowUsd: row.budgetLowUsd,
    budgetHighUsd: row.budgetHighUsd,
    summary: row.summary,
    tags: row.tags,
    location: points.get(row.id) ?? null,
    area: areas.get(row.id) ?? null,
    heroAlt: row.heroAsset?.altText ?? null,
    heroImageUrl: row.heroAsset?.originalUrl ?? null,
    heroCredit: row.heroAsset?.creatorCredit ?? null,
    trails,
    permit,
    entranceFee: facts.entranceFee,
    highlights: facts.highlights,
    photos,
    lastVerifiedAt: row.lastVerifiedAt,
  };
}

/** Lightweight published destination fields for route metadata generation. */
export async function getDestinationMetadataBySlug(slug: string): Promise<{
  name: string;
  summary: string | null;
  heroImageUrl: string | null;
} | null> {
  const row = await prisma.destination.findFirst({
    where: { slug, status: "published" },
    select: {
      name: true,
      summary: true,
      heroAsset: { select: { originalUrl: true } },
    },
  });

  if (!row) return null;
  return {
    name: row.name,
    summary: row.summary,
    heroImageUrl: row.heroAsset?.originalUrl ?? null,
  };
}

/** Published destination cards for a set of ids (used by the saved list). Order
 *  is not guaranteed — the caller reorders (e.g. by save time). */
export async function getPublishedDestinationCardsByIds(
  ids: string[],
): Promise<DestinationCard[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.destination.findMany({
    where: { id: { in: ids }, status: "published" },
    include: {
      heroAsset: { select: { altText: true, originalUrl: true, creatorCredit: true } },
    },
  });
  const points = await fetchDestinationPoints(rows.map((r) => r.id));
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    slug: r.slug,
    activities: r.activities,
    bestMonths: r.bestMonths,
    difficulty: r.difficulty,
    tripLength: r.tripLength,
    label: r.label,
    budgetCurrency: r.budgetCurrency,
    budgetLowUsd: r.budgetLowUsd,
    budgetHighUsd: r.budgetHighUsd,
    summary: r.summary,
    tags: r.tags,
    location: points.get(r.id) ?? null,
    heroAlt: r.heroAsset?.altText ?? null,
    heroImageUrl: r.heroAsset?.originalUrl ?? null,
    heroCredit: r.heroAsset?.creatorCredit ?? null,
  }));
}

/** All published slugs — for generateStaticParams / sitemap use. */
export async function listPublishedDestinationSlugs(): Promise<string[]> {
  const rows = await prisma.destination.findMany({
    where: { status: "published" },
    select: { slug: true },
  });
  return rows.map((r) => r.slug);
}
