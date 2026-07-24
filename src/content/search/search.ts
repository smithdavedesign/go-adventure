/**
 * Keyword search over published destinations (server-only).
 *
 * Phase 1 approach per the PRD: Postgres full-text search (websearch_to_tsquery
 * over name + summary + tags) combined with pg_trgm similarity for typo
 * tolerance. Returns destination ids ranked best-first; the caller applies facet
 * filters and preserves this order.
 *
 * The tsvector is computed inline rather than stored, and there are no search
 * indexes yet — correct and fast enough for a 25–50 row corpus. Graduating to a
 * stored/indexed FTS column (or Meilisearch) is gated on measured need:
 * docs/adr/0004-search-graduation-criteria.md.
 *
 * Grounding rule (PRD): search matches explicit text on the record. It never
 * infers facts (crowds, permits, conditions) that aren't stored.
 */
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";

/**
 * Minimum word-level trigram similarity for a fuzzy name match. We use
 * `word_similarity(query, name)` — which scores the query against the best
 * matching WORD in the name — rather than `similarity()` over the whole string,
 * so a typo like "zionn" still matches "Zion Narrows Basecamp" (0.67) instead of
 * being diluted by the rest of the name (0.17). 0.4 catches typos without noise.
 */
const WORD_SIMILARITY_THRESHOLD = 0.4;

export async function searchDestinationIds(query: string): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];

  const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
    WITH doc AS (
      SELECT
        id,
        name,
        to_tsvector(
          'english',
          coalesce(name, '') || ' ' ||
          coalesce(summary, '') || ' ' ||
          array_to_string(tags, ' ') || ' ' ||
          -- activities is a stored attribute, so "backpacking"/"hiking" as a
          -- keyword legitimately matches destinations with that activity.
          array_to_string(activities::text[], ' ')
        ) AS tsv
      FROM "Destination"
      WHERE status = 'published'
    )
    SELECT id::text AS id
    FROM doc
    WHERE tsv @@ websearch_to_tsquery('english', ${q})
       OR word_similarity(${q}, name) > ${WORD_SIMILARITY_THRESHOLD}
       OR name ILIKE ${"%" + q + "%"}
    ORDER BY
      ts_rank(tsv, websearch_to_tsquery('english', ${q})) DESC,
      word_similarity(${q}, name) DESC
  `);

  return rows.map((r) => r.id);
}
