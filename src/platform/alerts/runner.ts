/**
 * Alert refresh runner. For every published destination, resolves its NPS park
 * code (via its approved revision's source record), fetches current NPS alerts,
 * and stores an expiring snapshot at the park's point. Intended for a scheduled
 * job. Requires NPS_API_KEY.
 *
 *   npm run alerts:refresh
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import { fetchAlerts } from "./nps";
import { pruneExpiredAlerts, storeAlertSnapshot } from "./snapshots";

async function main() {
  // Published destinations with their point and NPS park code.
  const rows = await prisma.$queryRaw<
    { id: string; lat: number; lng: number; park_code: string }[]
  >(Prisma.sql`
    SELECT DISTINCT ON (d.id)
           d.id::text AS id,
           ST_Y(d.location::geometry) AS lat,
           ST_X(d.location::geometry) AS lng,
           sr."externalId" AS park_code
    FROM "Destination" d
    JOIN "ContentRevision" cr ON cr."entityId" = d.id AND cr."reviewStatus" = 'approved'
    JOIN "SourceRecord" sr ON sr.id = cr."sourceRecordId"
    WHERE d.status = 'published' AND d.location IS NOT NULL
    ORDER BY d.id, cr."publishedAt" DESC
  `);

  const parkCodes = [...new Set(rows.map((r) => r.park_code))];
  if (parkCodes.length === 0) {
    console.log("No published NPS destinations to refresh alerts for.");
    return;
  }

  const now = new Date();
  const byPark = new Map(
    (await fetchAlerts(parkCodes, now.toISOString())).map((a) => [a.parkCode, a]),
  );

  let stored = 0;
  for (const d of rows) {
    const alerts = byPark.get(d.park_code);
    if (!alerts || alerts.alerts.length === 0) continue;
    await storeAlertSnapshot(d.lat, d.lng, alerts, now);
    stored++;
  }

  const pruned = await pruneExpiredAlerts(now);
  console.log(
    `Stored alert snapshots for ${stored} destinations; pruned ${pruned} expired.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
