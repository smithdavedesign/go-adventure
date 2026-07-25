/**
 * Editorial "vibe" themes for browse-by-category pills on Explore (the Airbnb-
 * style passive-browse row). Static curated map, like regions.ts — themes are a
 * stable editorial characterization of the fixed launch set, not user data.
 * Filtering resolves a theme to the parks tagged with it (by slug), so no schema
 * column or migration is needed.
 */
export type ThemeKey =
  | "desert"
  | "canyons"
  | "waterfalls"
  | "alpine"
  | "volcanic"
  | "forest"
  | "coastal"
  | "darksky"
  | "wildlife"
  | "geothermal";

/** Ordered themes for the pill row. `icon` is decorative (emoji). */
export const THEMES: { key: ThemeKey; label: string; icon: string }[] = [
  { key: "desert", label: "Desert", icon: "🏜️" },
  { key: "canyons", label: "Canyons", icon: "🏜" },
  { key: "waterfalls", label: "Waterfalls", icon: "💧" },
  { key: "alpine", label: "Alpine & lakes", icon: "🏔️" },
  { key: "volcanic", label: "Volcanic", icon: "🌋" },
  { key: "forest", label: "Old-growth forest", icon: "🌲" },
  { key: "coastal", label: "Coastal", icon: "🌊" },
  { key: "darksky", label: "Dark skies", icon: "✨" },
  { key: "wildlife", label: "Wildlife", icon: "🦌" },
  { key: "geothermal", label: "Geysers & hot springs", icon: "♨️" },
];

const THEME_KEYS = new Set<string>(THEMES.map((t) => t.key));
export function isThemeKey(v: string): v is ThemeKey {
  return THEME_KEYS.has(v);
}

/** slug → themes it fits. */
export const PARK_THEMES: Record<string, ThemeKey[]> = {
  "yosemite-national-park": ["waterfalls", "alpine", "forest"],
  "sequoia-kings-canyon-national-parks": ["forest", "alpine"],
  "grand-canyon-national-park": ["canyons", "desert", "darksky"],
  "zion-national-park": ["canyons", "desert"],
  "bryce-canyon-national-park": ["canyons", "desert", "darksky"],
  "arches-national-park": ["desert", "darksky"],
  "canyonlands-national-park": ["canyons", "desert", "darksky"],
  "capitol-reef-national-park": ["canyons", "desert", "darksky"],
  "rocky-mountain-national-park": ["alpine", "wildlife"],
  "glacier-national-park": ["alpine", "wildlife"],
  "yellowstone-national-park": ["geothermal", "wildlife"],
  "grand-teton-national-park": ["alpine", "wildlife"],
  "olympic-national-park": ["coastal", "forest", "waterfalls", "alpine"],
  "mount-rainier-national-park": ["volcanic", "alpine", "waterfalls"],
  "north-cascades-national-park": ["alpine"],
  "crater-lake-national-park": ["volcanic", "alpine"],
  "lassen-volcanic-national-park": ["volcanic", "geothermal"],
  "acadia-national-park": ["coastal"],
  "great-smoky-mountains-national-park": ["forest", "waterfalls", "wildlife"],
  "shenandoah-national-park": ["forest", "waterfalls"],
  "joshua-tree-national-park": ["desert", "darksky"],
  "saguaro-national-park": ["desert"],
  "big-bend-national-park": ["desert", "darksky", "canyons"],
  "great-sand-dunes-national-park-preserve": ["desert", "darksky", "alpine"],
  "black-canyon-of-the-gunnison-national-park": ["canyons"],
  "badlands-national-park": ["desert", "darksky", "wildlife"],
  "redwood-national-and-state-parks": ["forest", "coastal"],
  "pinnacles-national-park": ["volcanic", "wildlife"],
};

/** Slugs matching ANY of the given themes (union). Empty input → null (no filter). */
export function resolveThemeSlugs(themes: string[]): string[] | null {
  if (themes.length === 0) return null;
  const want = new Set(themes);
  const out: string[] = [];
  for (const [slug, keys] of Object.entries(PARK_THEMES)) {
    if (keys.some((k) => want.has(k))) out.push(slug);
  }
  return out;
}
