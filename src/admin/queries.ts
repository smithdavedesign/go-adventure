/**
 * Admin read queries (Admin domain). Server-only. These power the editorial
 * dashboard, review queue, and source viewer. They read across content and
 * platform domains (which the admin domain is explicitly allowed to do).
 */
import { prisma } from "@/shared/config/db";
import { validateDraftForPublish } from "@/platform/publishing/draftSchema";

export async function getDataHealth() {
  const [
    published,
    drafts,
    inReview,
    deadLetters,
    sources,
    unattributedMedia,
    latestRun,
  ] = await Promise.all([
    prisma.destination.count({ where: { status: "published" } }),
    prisma.destination.count({ where: { status: { not: "published" } } }),
    prisma.contentRevision.count({ where: { reviewStatus: "in_review" } }),
    prisma.ingestionDeadLetter.count(),
    prisma.source.count({ where: { enabled: true } }),
    // "attribution gaps": media with no attribution text and unverified rights.
    prisma.mediaAsset.count({
      where: { rightsStatus: { not: "verified" }, creatorCredit: null },
    }),
    prisma.ingestionRun.findFirst({ orderBy: { startedAt: "desc" } }),
  ]);

  // Facts expiring within 30 days (dynamic-data freshness signal).
  const soon = new Date();
  soon.setDate(soon.getDate() + 30);
  const expiringSoon = await prisma.factAssertion.count({
    where: { expiresAt: { not: null, lte: soon, gte: new Date() } },
  });

  return {
    published,
    drafts,
    inReview,
    deadLetters,
    sources,
    unattributedMedia,
    expiringSoon,
    latestRun,
  };
}

export async function listReviewQueue() {
  const revisions = await prisma.contentRevision.findMany({
    where: { reviewStatus: "in_review", entityType: "destination" },
    orderBy: { updatedAt: "desc" },
    include: { sourceRecord: { include: { source: true } } },
  });
  return revisions.map((r) => {
    const body = (r.body ?? {}) as { name?: string; slug?: string };
    const validation = validateDraftForPublish(r.body);
    return {
      id: r.id,
      name: body.name ?? "(unnamed draft)",
      slug: body.slug ?? "",
      origin: r.origin,
      sourceName: r.sourceRecord?.source.name ?? "editorial",
      updatedAt: r.updatedAt,
      publishReady: validation.ok,
      blockingCount: validation.ok ? 0 : validation.errors.length,
    };
  });
}

export async function getReviewDraft(id: string) {
  const r = await prisma.contentRevision.findUnique({
    where: { id },
    include: { sourceRecord: { include: { source: true } } },
  });
  if (!r) return null;
  const validation = validateDraftForPublish(r.body);
  return {
    id: r.id,
    body: (r.body ?? {}) as Record<string, unknown>,
    origin: r.origin,
    reviewStatus: r.reviewStatus,
    source: r.sourceRecord
      ? {
          name: r.sourceRecord.source.name,
          externalId: r.sourceRecord.externalId,
          checksum: r.sourceRecord.checksum,
          normalizerVersion: r.sourceRecord.normalizerVersion,
          licence: r.sourceRecord.licenceSnapshot,
          retrievedAt: r.sourceRecord.retrievedAt,
          canonicalUrl: r.sourceRecord.canonicalUrl,
        }
      : null,
    validation,
  };
}

export async function listAdminDestinations() {
  const rows = await prisma.destination.findMany({
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: { _count: { select: { trails: true } } },
  });
  return rows.map((d) => ({
    id: d.id,
    name: d.name,
    slug: d.slug,
    status: d.status,
    label: d.label,
    trailCount: d._count.trails,
    lastVerifiedAt: d.lastVerifiedAt,
    publishedAt: d.publishedAt,
  }));
}

export async function listSources() {
  const sources = await prisma.source.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: { select: { records: true } },
      records: { orderBy: { retrievedAt: "desc" }, take: 1 },
    },
  });
  return sources.map((s) => ({
    id: s.id,
    name: s.name,
    licence: s.licence,
    owner: s.owner,
    enabled: s.enabled,
    refreshPolicy: s.refreshPolicy,
    recordCount: s._count.records,
    lastRetrievedAt: s.records[0]?.retrievedAt ?? null,
  }));
}
