/**
 * Forecast refresh runner. Fetches a fresh forecast for every published
 * destination and stores an expiring snapshot. Idempotent to run repeatedly (a
 * new snapshot each run; old ones expire and are pruned). Intended for a
 * scheduled job. Open-Meteo is keyless for non-commercial use.
 *
 *   npm run forecasts:refresh
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import { fetchForecast } from "./openMeteo";
import { pruneExpiredForecasts, storeForecastSnapshot } from "./snapshots";

async function main() {
  const rows = await prisma.$queryRaw<
    { id: string; lat: number; lng: number }[]
  >(Prisma.sql`
    SELECT id::text AS id,
           ST_Y(location::geometry) AS lat,
           ST_X(location::geometry) AS lng
    FROM "Destination"
    WHERE status = 'published' AND location IS NOT NULL
  `);

  let stored = 0;
  const now = new Date();
  for (const d of rows) {
    try {
      const forecast = await fetchForecast(d.lat, d.lng, now.toISOString());
      await storeForecastSnapshot(d.lat, d.lng, forecast, now);
      stored++;
    } catch (err) {
      console.warn(`forecast failed for ${d.id}:`, err instanceof Error ? err.message : err);
    }
  }

  const pruned = await pruneExpiredForecasts(now);
  console.log(`Stored ${stored} forecast snapshots; pruned ${pruned} expired.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
