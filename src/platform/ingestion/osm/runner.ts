/**
 * Trail ingestion CLI. For each published destination (optionally filtered to
 * given park codes), pulls representative OSM trails and links them.
 *
 *   npm run ingest:trails            # all published destinations
 *   npm run ingest:trails -- zion,yose
 *
 * Sequential with a delay between parks — the public Overpass instance is
 * rate-limited. Raw captures go to the local restricted store (dev stand-in for R2).
 */
import "dotenv/config";
import { join } from "node:path";
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import { LocalRawStore } from "@/platform/ingestion/rawStore";
import { ingestTrailsForPark } from "./ingest";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const filter = process.argv.slice(2).find((a) => !a.startsWith("--"));
  const codes = filter ? filter.split(",") : null;

  const rows = await prisma.$queryRaw<
    { id: string; slug: string; lat: number; lng: number; park_code: string }[]
  >(Prisma.sql`
    SELECT DISTINCT ON (d.id)
           d.id::text AS id, d.slug,
           ST_Y(d.location::geometry) AS lat,
           ST_X(d.location::geometry) AS lng,
           sr."externalId" AS park_code
    FROM "Destination" d
    JOIN "ContentRevision" cr ON cr."entityId" = d.id AND cr."reviewStatus" = 'approved'
    JOIN "SourceRecord" sr ON sr.id = cr."sourceRecordId"
    WHERE d.status = 'published' AND d.location IS NOT NULL
    ORDER BY d.id, cr."publishedAt" DESC
  `);

  const targets = codes ? rows.filter((r) => codes.includes(r.park_code)) : rows;
  const rawStore = new LocalRawStore(join(process.cwd(), ".ingestion-raw"));
  // Some parks' NPS point sits far from trailheads — a wider radius helps.
  const radiusM = Number(process.env.TRAILS_RADIUS_M) || 6000;

  let totalTrails = 0;
  let withTrails = 0;
  for (const d of targets) {
    try {
      const n = await ingestTrailsForPark(d.id, d.park_code, d.lat, d.lng, rawStore, radiusM);
      if (n > 0) withTrails++;
      totalTrails += n;
      console.log(`✓ ${d.slug}: ${n} trails`);
    } catch (err) {
      console.warn(`! ${d.slug}: ${err instanceof Error ? err.message : err}`);
    }
    await sleep(4000); // be gentle with the public Overpass instances
  }

  console.log(
    `\nLinked ${totalTrails} trails across ${withTrails}/${targets.length} destinations.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
