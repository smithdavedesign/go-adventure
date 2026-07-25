/**
 * Editorial browse taxonomy for the launch corpus (PRD Discovery: browse by
 * Country / Region / National Park / Mountain Range). All launch destinations
 * are US national parks, so Country is implicit; Region and Mountain Range are
 * curated per park. Kept as a static map (like airports.ts) rather than DB
 * columns — the launch set is fixed and this is stable geographic editorial
 * data. Move to columns if the corpus outgrows a hand-maintained map.
 */
export type ParkTaxonomy = { region: string; mountainRange?: string };

export const PARK_TAXONOMY: Record<string, ParkTaxonomy> = {
  "yosemite-national-park": { region: "California", mountainRange: "Sierra Nevada" },
  "sequoia-kings-canyon-national-parks": { region: "California", mountainRange: "Sierra Nevada" },
  "joshua-tree-national-park": { region: "California" },
  "redwood-national-and-state-parks": { region: "California" },
  "pinnacles-national-park": { region: "California" },
  "lassen-volcanic-national-park": { region: "California", mountainRange: "Cascades" },
  "olympic-national-park": { region: "Pacific Northwest", mountainRange: "Olympic Mountains" },
  "mount-rainier-national-park": { region: "Pacific Northwest", mountainRange: "Cascades" },
  "north-cascades-national-park": { region: "Pacific Northwest", mountainRange: "Cascades" },
  "crater-lake-national-park": { region: "Pacific Northwest", mountainRange: "Cascades" },
  "grand-canyon-national-park": { region: "Southwest" },
  "zion-national-park": { region: "Southwest" },
  "bryce-canyon-national-park": { region: "Southwest" },
  "arches-national-park": { region: "Southwest" },
  "canyonlands-national-park": { region: "Southwest" },
  "capitol-reef-national-park": { region: "Southwest" },
  "saguaro-national-park": { region: "Southwest" },
  "rocky-mountain-national-park": { region: "Rocky Mountains", mountainRange: "Rocky Mountains" },
  "glacier-national-park": { region: "Rocky Mountains", mountainRange: "Rocky Mountains" },
  "yellowstone-national-park": { region: "Rocky Mountains", mountainRange: "Rocky Mountains" },
  "grand-teton-national-park": { region: "Rocky Mountains", mountainRange: "Teton Range" },
  "black-canyon-of-the-gunnison-national-park": { region: "Rocky Mountains" },
  "great-sand-dunes-national-park-preserve": { region: "Rocky Mountains", mountainRange: "Sangre de Cristo" },
  "badlands-national-park": { region: "Great Plains" },
  "big-bend-national-park": { region: "Texas", mountainRange: "Chisos Mountains" },
  "great-smoky-mountains-national-park": { region: "Appalachians", mountainRange: "Appalachian Mountains" },
  "shenandoah-national-park": { region: "Appalachians", mountainRange: "Blue Ridge Mountains" },
  "acadia-national-park": { region: "Northeast" },
};

/** Display order for regions on the browse page. */
export const REGION_ORDER = [
  "Pacific Northwest",
  "California",
  "Southwest",
  "Rocky Mountains",
  "Great Plains",
  "Texas",
  "Appalachians",
  "Northeast",
];

/** Group items by a taxonomy key, returning ordered [group, items] pairs.
 *  Items whose slug isn't in the taxonomy are dropped from the grouping. */
export function groupBy<T extends { slug: string }>(
  items: T[],
  pick: (t: ParkTaxonomy) => string | undefined,
  order?: string[],
): [string, T[]][] {
  const groups = new Map<string, T[]>();
  for (const item of items) {
    const tax = PARK_TAXONOMY[item.slug];
    const key = tax && pick(tax);
    if (!key) continue;
    (groups.get(key) ?? groups.set(key, []).get(key)!).push(item);
  }
  const keys = [...groups.keys()].sort((a, b) => {
    if (order) {
      const ia = order.indexOf(a);
      const ib = order.indexOf(b);
      if (ia !== -1 || ib !== -1) return (ia === -1 ? 999 : ia) - (ib === -1 ? 999 : ib);
    }
    return a.localeCompare(b);
  });
  return keys.map((k) => [k, groups.get(k)!]);
}
