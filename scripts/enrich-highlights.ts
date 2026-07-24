/**
 * Attach brief editorial "highlights" to each published destination (PRD
 * destination Launch Set → Highlights). Stored as an editorial FactAssertion
 * (field="highlights"), confidence=editorial — these are editorial judgements,
 * not sourced facts. Idempotent; attaches to live destinations without republish.
 *
 *   npm run enrich:highlights
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";

// slug → 3 concise highlights. Editorial.
const HIGHLIGHTS: Record<string, string[]> = {
  "yosemite-national-park": ["Granite giants — El Capitan & Half Dome", "Waterfalls peaking in late spring", "High-country lakes on the Tioga Road"],
  "grand-canyon-national-park": ["Mile-deep layered canyon", "Rim-to-river day hikes", "Sunrise from the South Rim"],
  "zion-national-park": ["The Narrows river hike", "Angels Landing's chained spine", "Emerald Pools & slot canyons"],
  "rocky-mountain-national-park": ["Trail Ridge Road above treeline", "Alpine lakes & tundra", "Elk in Moraine Park"],
  "glacier-national-park": ["Going-to-the-Sun Road", "Turquoise glacial lakes", "Highline Trail traverse"],
  "yellowstone-national-park": ["Geysers & hot springs", "Lamar Valley wildlife", "Grand Canyon of the Yellowstone"],
  "grand-teton-national-park": ["Abrupt granite skyline", "Jenny Lake & Cascade Canyon", "Snake River overlooks"],
  "olympic-national-park": ["Temperate rainforest", "Wild Pacific coastline", "Hurricane Ridge alpine views"],
  "mount-rainier-national-park": ["Wildflower meadows at Paradise", "Glaciers on a 14er volcano", "The Wonderland Trail"],
  "sequoia-kings-canyon-national-parks": ["The largest trees on Earth", "Deep Kings Canyon", "Gateway to Mt. Whitney"],
  "acadia-national-park": ["Sunrise on Cadillac Mountain", "Granite coast & carriage roads", "Jordan Pond & the Bubbles"],
  "great-smoky-mountains-national-park": ["Misty ridgelines", "Wildflowers & synchronous fireflies", "Clingmans Dome high point"],
  "arches-national-park": ["Delicate Arch at sunset", "2,000+ natural arches", "Fiery Furnace maze"],
  "bryce-canyon-national-park": ["Hoodoo amphitheaters", "Rim-to-hoodoo loops", "Dark-sky stargazing"],
  "joshua-tree-national-park": ["Twisted Joshua trees", "World-class rock scrambling", "Desert wildflower blooms"],
  "shenandoah-national-park": ["Skyline Drive overlooks", "Appalachian Trail miles", "Waterfall hollows"],
  "north-cascades-national-park": ["Jagged glaciated peaks", "Turquoise Diablo Lake", "Remote alpine wilderness"],
  "crater-lake-national-park": ["Deepest lake in the US", "Impossibly blue caldera", "Rim Drive views"],
  "badlands-national-park": ["Striped rock spires", "Fossil beds & bison", "Sunset over the Wall"],
  "big-bend-national-park": ["Chisos Mountains", "Rio Grande canyons", "Dark-sky desert nights"],
  "black-canyon-of-the-gunnison-national-park": ["Sheer, narrow gorge", "Painted Wall cliff", "Dramatic rim overlooks"],
  "canyonlands-national-park": ["Island in the Sky mesas", "The Needles district", "Confluence of two rivers"],
  "capitol-reef-national-park": ["Waterpocket Fold", "Historic Fruita orchards", "Slot canyons & petroglyphs"],
  "great-sand-dunes-national-park-preserve": ["Tallest dunes in North America", "Sandboarding & Medano Creek", "Sangre de Cristo backdrop"],
  "saguaro-national-park": ["Giant saguaro forests", "Sonoran desert sunsets", "Rincon Mountain trails"],
  "redwood-national-and-state-parks": ["Tallest trees on Earth", "Fern canyons & elk", "Rugged Pacific coast"],
  "pinnacles-national-park": ["Volcanic spires & talus caves", "California condors overhead", "Spring wildflowers"],
  "lassen-volcanic-national-park": ["All four volcano types", "Bubbling mudpots & fumaroles", "Alpine lakes"],
};

async function main() {
  const now = new Date();
  let n = 0;
  for (const [slug, highlights] of Object.entries(HIGHLIGHTS)) {
    const dest = await prisma.destination.findUnique({
      where: { slug },
      select: { id: true },
    });
    if (!dest) continue;
    await prisma.$transaction([
      prisma.factAssertion.deleteMany({
        where: { subjectType: "destination", subjectId: dest.id, field: "highlights" },
      }),
      prisma.factAssertion.create({
        data: {
          subjectType: "destination",
          subjectId: dest.id,
          field: "highlights",
          value: highlights,
          confidence: "editorial",
          verifiedAt: now,
        },
      }),
    ]);
    n++;
  }
  console.log(`Attached highlights to ${n} destinations.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
