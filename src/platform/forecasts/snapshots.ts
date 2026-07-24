/**
 * Forecast snapshot storage + freshness-gated reads (server-only).
 *
 * A snapshot is stored with an explicit `expiresAt`; reads NEVER return an
 * expired snapshot (the claim is dropped, not shown stale — PRD Dynamic-data
 * rule). The point is written/queried via raw SQL because `location` is an
 * Unsupported geography column (ADR-0003).
 */
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import type { NormalizedForecast } from "./openMeteo";

/** Default snapshot lifetime — forecasts go stale fast. */
const DEFAULT_TTL_HOURS = 6;

export async function storeForecastSnapshot(
  lat: number,
  lng: number,
  forecast: NormalizedForecast,
  now: Date = new Date(),
  ttlHours: number = DEFAULT_TTL_HOURS,
): Promise<string> {
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);

  // Create typed fields via Prisma, then set the geography point via raw SQL.
  const snapshot = await prisma.forecastSnapshot.create({
    data: {
      provider: forecast.provider,
      observedAt: new Date(forecast.observedAt),
      validFrom: new Date(forecast.validFrom),
      validTo: new Date(forecast.validTo),
      expiresAt,
      payload: forecast as unknown as Prisma.InputJsonObject,
    },
  });
  await prisma.$executeRaw`
    UPDATE "ForecastSnapshot"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${snapshot.id}::uuid
  `;
  return snapshot.id;
}

/**
 * The freshest non-expired forecast within `radiusMeters` of a point, or null.
 * Returning null is correct and honest — the UI then shows no forecast rather
 * than a stale one.
 */
export async function getFreshForecastNear(
  lat: number,
  lng: number,
  now: Date = new Date(),
  radiusMeters = 25_000,
): Promise<NormalizedForecast | null> {
  const rows = await prisma.$queryRaw<{ payload: NormalizedForecast }[]>(Prisma.sql`
    SELECT payload
    FROM "ForecastSnapshot"
    WHERE "expiresAt" > ${now}
      AND location IS NOT NULL
      AND ST_DWithin(
        location,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )
    ORDER BY "observedAt" DESC
    LIMIT 1
  `);
  return rows[0]?.payload ?? null;
}

/** Housekeeping: delete expired snapshots (safe to run on a schedule). */
export async function pruneExpiredForecasts(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.forecastSnapshot.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return count;
}
