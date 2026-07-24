/**
 * Deterministic placeholder visuals.
 *
 * We have no rights-cleared imagery yet (real media arrives at M5/M6), so hero
 * areas render a stable gradient derived from the destination slug rather than a
 * bitmap. Deterministic = the same destination always gets the same colors, so
 * the UI feels intentional instead of random, with zero external image
 * dependency.
 */

/** Simple stable string hash (FNV-1a-ish) → unsigned 32-bit int. */
function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/**
 * Two-stop CSS gradient in natural, outdoorsy hues (greens → teals → ambers),
 * kept dark enough that white overlay text stays legible (WCAG AA).
 */
export function slugGradient(slug: string): string {
  const h = hashString(slug);
  const hue = 120 + (h % 140); // 120–260: greens through blues
  const hue2 = (hue + 40) % 360;
  const c1 = `hsl(${hue} 42% 32%)`;
  const c2 = `hsl(${hue2} 38% 22%)`;
  return `linear-gradient(135deg, ${c1}, ${c2})`;
}
