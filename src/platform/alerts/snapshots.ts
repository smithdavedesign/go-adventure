/**
 * Alert snapshot storage + freshness-gated reads (server-only).
 *
 * Mirrors src/platform/forecasts/snapshots.ts: a snapshot has an explicit
 * `expiresAt`, and reads NEVER return an expired one — a stale/removed alert is
 * dropped, not shown (PRD Dynamic-data rule). The point is written/queried via
 * raw SQL because `location` is an Unsupported geography column (ADR-0003).
 */
import { prisma } from "@/shared/config/db";
import { Prisma } from "@/generated/prisma/client";
import type { NormalizedAlert, NormalizedAlerts } from "./nps";

/** Alerts are refreshed frequently; a short TTL keeps them from going stale. */
const DEFAULT_TTL_HOURS = 6;

export async function storeAlertSnapshot(
  lat: number,
  lng: number,
  alerts: NormalizedAlerts,
  now: Date = new Date(),
  ttlHours: number = DEFAULT_TTL_HOURS,
): Promise<string> {
  const expiresAt = new Date(now.getTime() + ttlHours * 60 * 60 * 1000);
  const snapshot = await prisma.alertSnapshot.create({
    data: {
      provider: alerts.provider,
      externalId: alerts.parkCode,
      observedAt: new Date(alerts.observedAt),
      expiresAt,
      payload: { alerts: alerts.alerts } as unknown as Prisma.InputJsonObject,
    },
  });
  await prisma.$executeRaw`
    UPDATE "AlertSnapshot"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${snapshot.id}::uuid
  `;
  return snapshot.id;
}

export type FreshAlerts = { observedAt: string; alerts: NormalizedAlert[] };

/** The freshest non-expired alert snapshot within `radiusMeters`, or null. */
export async function getFreshAlertsNear(
  lat: number,
  lng: number,
  now: Date = new Date(),
  radiusMeters = 5_000,
): Promise<FreshAlerts | null> {
  const rows = await prisma.$queryRaw<
    { observedat: Date; payload: { alerts: NormalizedAlert[] } }[]
  >(Prisma.sql`
    SELECT "observedAt" AS observedat, payload
    FROM "AlertSnapshot"
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
  const row = rows[0];
  if (!row?.payload?.alerts?.length) return null;
  return { observedAt: new Date(row.observedat).toISOString(), alerts: row.payload.alerts };
}

export async function pruneExpiredAlerts(now: Date = new Date()): Promise<number> {
  const { count } = await prisma.alertSnapshot.deleteMany({
    where: { expiresAt: { lt: now } },
  });
  return count;
}
