import type { MetadataRoute } from "next";
import { listPublishedDestinationSlugs } from "@/content/destinations/queries";
import { listPublishedTrailSlugs } from "@/content/trails/queries";

/**
 * XML sitemap — contains ONLY approved, published, canonical content pages
 * (PRD SEO: no drafts, stale, thin, or unreviewed pages in the sitemap). Drafts
 * live as ContentRevisions and never have a public URL, so they can't leak here.
 * The /compare tool is intentionally excluded (query-driven, not canonical).
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const [destinationSlugs, trailSlugs] = await Promise.all([
    listPublishedDestinationSlugs(),
    listPublishedTrailSlugs(),
  ]);

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${base}/browse`, changeFrequency: "weekly", priority: 0.7 },
    ...destinationSlugs.map((slug) => ({
      url: `${base}/destinations/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...trailSlugs.map((slug) => ({
      url: `${base}/trails/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })),
  ];
}

// Reads the DB — must run at request time (no DB at build in CI).
export const dynamic = "force-dynamic";
