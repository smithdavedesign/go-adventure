/**
 * Sample and store an elevation profile for each published trail (M12: richer
 * trail pages). Stored as a trail FactAssertion (field="elevationProfile",
 * confidence="confirmed") — the provenance-backed fact store — so no schema
 * migration is needed. Idempotent; rate-limited for the keyless Open-Meteo API.
 *
 *   npm run enrich:elevation                 # all published trails
 *   npm run enrich:elevation -- <trail-slug> # one trail
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";
import { fetchTrailRoutes } from "@/content/geo";
import { fetchElevationProfile } from "@/platform/ingestion/osm/elevation";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function main() {
  const args = process.argv.slice(2);
  const only = args.find((a) => !a.startsWith("--"));
  const force = args.includes("--force");
  const trails = await prisma.trail.findMany({
    where: { status: "published", ...(only ? { slug: only } : {}) },
    select: { id: true, slug: true },
    orderBy: { slug: "asc" },
  });

  // Skip trails that already have a profile so re-runs only fill gaps (Open-Meteo
  // rate-limits bursts). `--force` reprocesses everything.
  const existing = force
    ? new Set<string>()
    : new Set(
        (
          await prisma.factAssertion.findMany({
            where: { subjectType: "trail", field: "elevationProfile" },
            select: { subjectId: true },
          })
        ).map((f) => f.subjectId),
      );

  const routes = await fetchTrailRoutes(trails.map((t) => t.id));

  let done = 0;
  let skipped = 0;
  for (const t of trails) {
    if (existing.has(t.id)) {
      skipped++;
      continue;
    }
    const route = routes.get(t.id);
    const points = route?.flat() ?? [];
    if (points.length < 2) {
      skipped++;
      console.log(`  - ${t.slug}: no route geometry`);
      continue;
    }

    let profile: { d: number; e: number }[] = [];
    try {
      profile = await fetchElevationProfile(points);
    } catch (err) {
      console.warn(`! ${t.slug}: ${err instanceof Error ? err.message : err}`);
      await sleep(1500);
      continue;
    }
    if (profile.length < 2) {
      skipped++;
      console.log(`  - ${t.slug}: no elevation returned`);
      continue;
    }

    await prisma.$transaction([
      prisma.factAssertion.deleteMany({
        where: { subjectType: "trail", subjectId: t.id, field: "elevationProfile" },
      }),
      prisma.factAssertion.create({
        data: {
          subjectType: "trail",
          subjectId: t.id,
          field: "elevationProfile",
          value: profile,
          confidence: "confirmed",
          verifiedAt: new Date(),
        },
      }),
    ]);
    done++;
    console.log(`✓ ${t.slug}: ${profile.length} points`);
    await sleep(1500); // Open-Meteo 429s on bursts; keep well under its rate cap
  }

  console.log(`\nStored elevation profiles for ${done} trails (${skipped} skipped).`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
