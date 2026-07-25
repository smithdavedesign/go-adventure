/**
 * Attach a small gallery of openly-licensed Wikimedia photos to each published
 * destination (PRD Destination Page Launch Set: "Photos"). Stored as MediaAsset
 * rows on the DestinationPhotos relation (destinationId set), separate from the
 * hero. External CC URLs for now (R2 self-hosting later). Idempotent; excludes
 * the hero image so it isn't duplicated in the gallery.
 *
 *   npm run enrich:gallery                       # all published destinations
 *   npm run enrich:gallery -- glacier-national-park
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { fetchParkPhotos } from "@/platform/media/wikimedia";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const only = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const dests = await prisma.destination.findMany({
    where: { status: "published", ...(only ? { slug: only } : {}) },
    select: {
      id: true,
      name: true,
      slug: true,
      heroAsset: { select: { objectKey: true } },
    },
    orderBy: { name: "asc" },
  });

  let total = 0;
  for (const d of dests) {
    const heroFile = d.heroAsset?.objectKey?.replace(/^wikimedia\//, "");
    const photos = await fetchParkPhotos(d.name, 6, heroFile);

    // Idempotent: replace any prior gallery for this destination.
    await prisma.mediaAsset.deleteMany({
      where: { destinationId: d.id, objectKey: { startsWith: "wikimedia-gallery/" } },
    });
    for (const p of photos) {
      await prisma.mediaAsset.create({
        data: {
          objectKey: `wikimedia-gallery/${p.fileName}`,
          originalUrl: p.imageUrl,
          altText: d.name,
          creatorCredit: `${p.creatorCredit} · ${p.licence} · Wikimedia Commons`,
          licence: p.licence,
          rightsStatus: "verified",
          moderationStatus: "approved",
          exifStrippedAt: new Date(),
          destinationId: d.id,
        },
      });
    }
    total += photos.length;
    console.log(`✓ ${d.slug}: ${photos.length} gallery photos`);
    await sleep(400); // gentle with the Wikimedia API
  }

  console.log(`\nAdded ${total} gallery photos across ${dests.length} destinations.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
