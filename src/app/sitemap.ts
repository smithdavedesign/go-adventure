import type { MetadataRoute } from "next";
import { listPublishedDestinationSlugs } from "@/content/destinations/queries";

/**
 * XML sitemap — contains ONLY approved, published, canonical destination pages
 * (PRD SEO: no drafts, stale, thin, or unreviewed pages in the sitemap). Drafts
 * live as ContentRevisions and never have a public URL, so they can't leak here.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const slugs = await listPublishedDestinationSlugs();

  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/explore`, changeFrequency: "daily", priority: 0.9 },
    ...slugs.map((slug) => ({
      url: `${base}/destinations/${slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}

// Reads the DB — must run at request time (no DB at build in CI).
export const dynamic = "force-dynamic";
