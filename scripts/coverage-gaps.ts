/** One-off: report published destinations missing trails or a hero photo. */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";

async function main() {
  const noTrails = await prisma.$queryRaw<
    { slug: string; park_code: string }[]
  >(Prisma.sql`
    SELECT d.slug, sr."externalId" AS park_code
    FROM "Destination" d
    JOIN "ContentRevision" cr ON cr."entityId" = d.id AND cr."reviewStatus" = 'approved'
    JOIN "SourceRecord" sr ON sr.id = cr."sourceRecordId"
    WHERE d.status = 'published'
      AND NOT EXISTS (
        SELECT 1 FROM "DestinationTrail" dt WHERE dt."destinationId" = d.id
      )
    ORDER BY d.slug
  `);

  const noPhoto = await prisma.destination.findMany({
    where: { status: "published", heroAssetId: null },
    select: { slug: true },
    orderBy: { slug: "asc" },
  });

  console.log("Missing trails:", noTrails.map((r) => `${r.slug} (${r.park_code})`).join(", ") || "none");
  console.log("Codes:", noTrails.map((r) => r.park_code).join(","));
  console.log("Missing hero photo:", noPhoto.map((r) => r.slug).join(", ") || "none");
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
