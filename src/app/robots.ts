import type { MetadataRoute } from "next";

/**
 * robots. Only public content is crawlable; admin, auth, account, and API
 * surfaces are disallowed (PRD SEO: only approved canonical pages index).
 */
export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/account", "/saved", "/signin"],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
