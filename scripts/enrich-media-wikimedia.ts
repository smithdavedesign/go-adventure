/**
 * Set a licensed Wikimedia Commons hero photo on each published destination.
 * Only openly-licensed images are used; creator + licence are stored on the
 * MediaAsset and shown as a required photo credit (PRD media rights). External
 * URLs for now (R2 self-hosting later). Idempotent per destination. Requires no
 * key (Wikimedia is public).
 *
 *   npm run enrich:media
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { fetchParkHero } from "@/platform/media/wikimedia";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const dests = await prisma.destination.findMany({
    where: { status: "published" },
    select: { id: true, name: true, slug: true, heroAssetId: true },
    orderBy: { name: "asc" },
  });

  let set = 0;
  let skipped = 0;
  for (const d of dests) {
    const hero = await fetchParkHero(d.name);
    if (!hero) {
      skipped++;
      console.log(`  - ${d.slug}: no openly-licensed lead image`);
      continue;
    }

    // Idempotent: drop the previous Wikimedia hero for this destination.
    if (d.heroAssetId) {
      await prisma.destination.update({ where: { id: d.id }, data: { heroAssetId: null } });
      await prisma.mediaAsset.deleteMany({
        where: { id: d.heroAssetId, objectKey: { startsWith: "wikimedia/" } },
      });
    }

    const asset = await prisma.mediaAsset.create({
      data: {
        objectKey: `wikimedia/${hero.fileName}`,
        originalUrl: hero.imageUrl,
        altText: d.name,
        creatorCredit: `${hero.creatorCredit} · ${hero.licence} · Wikimedia Commons`,
        licence: hero.licence,
        rightsStatus: "verified", // licence checked against an allow-list
        moderationStatus: "approved",
        exifStrippedAt: new Date(), // external CC image, not a user upload
      },
    });
    await prisma.destination.update({
      where: { id: d.id },
      data: { heroAssetId: asset.id },
    });
    set++;
    console.log(`✓ ${d.slug}: ${hero.licence}`);
    await sleep(300); // gentle with the Wikimedia API
  }

  console.log(`\nHero photos set for ${set} destinations (${skipped} without one).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
