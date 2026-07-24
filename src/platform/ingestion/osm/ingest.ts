/**
 * OSM trail ingestion orchestrator.
 *
 * Per park: fetch named trails from Overpass → normalize to a representative set
 * → compute elevation gain → create `Trail` rows (geometry via raw SQL like the
 * seed) linked to the published destination via `DestinationTrail`, with a
 * `SourceRecord` (checksummed raw OSM capture) + per-trail provenance fact.
 *
 * Trails don't go through the destination draft→publish flow; they attach to the
 * already-published destination and are created `published` with provenance.
 * (A trail-review admin UI is a follow-up; for now they're spot-checked live.)
 * Idempotent per trail slug.
 */
import { prisma } from "@/shared/config/db";
import { checksum, rawObjectKey } from "@/platform/ingestion/checksum";
import type { RawStore } from "@/platform/ingestion/rawStore";
import { fetchTrailsNear } from "./overpass";
import { normalizeTrails } from "./adapter";
import { estimateDurationHours, fetchElevationGainFt } from "./elevation";

const NORMALIZER_VERSION = "osm-v1";

async function ensureOsmSource() {
  return prisma.source.upsert({
    where: { name: "OpenStreetMap" },
    update: {},
    create: {
      name: "OpenStreetMap",
      baseUrl: "https://overpass-api.de/api/interpreter",
      licence: "ODbL 1.0",
      attributionText: "© OpenStreetMap contributors",
      termsUrl: "https://www.openstreetmap.org/copyright",
      commercialUse: "Permitted under ODbL with attribution; share-alike on derived DB",
      refreshPolicy: "on-demand",
      owner: "content",
      enabled: true,
    },
  });
}

function toMultiLineEwkt(points: [number, number][]): string {
  const coords = points.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
  return `SRID=4326;MULTILINESTRING((${coords}))`;
}

/** Ingest representative trails for one park into its published destination. */
export async function ingestTrailsForPark(
  destinationId: string,
  parkCode: string,
  lat: number,
  lng: number,
  rawStore: RawStore,
  radiusM = 6000,
): Promise<number> {
  const ways = await fetchTrailsNear(lat, lng, radiusM);
  const trails = normalizeTrails(ways, parkCode);
  if (trails.length === 0) return 0;

  const source = await ensureOsmSource();
  const now = new Date();
  const sum = checksum(ways);
  const key = rawObjectKey("OpenStreetMap", parkCode, sum);
  await rawStore.put(key, JSON.stringify(ways));

  const sourceRecord = await prisma.sourceRecord.upsert({
    where: {
      sourceId_externalId_normalizerVersion: {
        sourceId: source.id,
        externalId: parkCode,
        normalizerVersion: NORMALIZER_VERSION,
      },
    },
    update: { retrievedAt: now, rawObjectKey: key, checksum: sum },
    create: {
      sourceId: source.id,
      externalId: parkCode,
      normalizerVersion: NORMALIZER_VERSION,
      retrievedAt: now,
      rawObjectKey: key,
      checksum: sum,
      licenceSnapshot: source.licence,
      attributionSnapshot: source.attributionText,
    },
  });

  let order = 0;
  for (const t of trails) {
    // Real elevation gain (best-effort; 0 if the elevation service is down).
    const gain = await fetchElevationGainFt(t.routePoints).catch(() => 0);
    const duration = estimateDurationHours(t.distanceMiles, gain);

    const trail = await prisma.trail.upsert({
      where: { slug: t.slug },
      update: {
        name: t.name,
        distanceMiles: t.distanceMiles,
        elevationGainFt: gain,
        difficulty: t.difficulty,
        durationHours: duration,
        tags: t.tags,
        status: "published",
        publishedAt: now,
        lastVerifiedAt: now,
      },
      create: {
        slug: t.slug,
        name: t.name,
        distanceMiles: t.distanceMiles,
        elevationGainFt: gain,
        difficulty: t.difficulty,
        durationHours: duration,
        tags: t.tags,
        status: "published",
        publishedAt: now,
        lastVerifiedAt: now,
      },
    });

    await prisma.$executeRaw`
      UPDATE "Trail" SET "routeGeometry" = ST_GeogFromText(${toMultiLineEwkt(t.routePoints)})
      WHERE id = ${trail.id}::uuid
    `;

    // Provenance: tie the trail to its OSM source record.
    await prisma.factAssertion.deleteMany({
      where: { subjectType: "trail", subjectId: trail.id, field: "osmSource" },
    });
    await prisma.factAssertion.create({
      data: {
        subjectType: "trail",
        subjectId: trail.id,
        field: "osmSource",
        value: { wayId: t.osmWayId, licence: "ODbL" },
        confidence: t.difficultyConfidence,
        sourceRecordId: sourceRecord.id,
        verifiedAt: now,
      },
    });

    await prisma.destinationTrail.upsert({
      where: { destinationId_trailId: { destinationId, trailId: trail.id } },
      update: { isRepresentative: true, editorialOrder: order },
      create: {
        destinationId,
        trailId: trail.id,
        isRepresentative: true,
        editorialOrder: order,
      },
    });
    order++;
  }

  return trails.length;
}
