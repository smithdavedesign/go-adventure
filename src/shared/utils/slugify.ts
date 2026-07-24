/**
 * URL-safe slug from an arbitrary name. Lowercase, ASCII-folded, hyphenated.
 * Stable for the same input so re-ingestion produces the same slug.
 */
export default function slugify(input: string): string {
  return input
    .normalize("NFKD") // split accents from letters
    .replace(/[̀-ͯ]/g, "") // strip combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-") // non-alphanumerics → hyphen
    .replace(/^-+|-+$/g, "") // trim leading/trailing hyphens
    .replace(/-{2,}/g, "-"); // collapse runs
}
