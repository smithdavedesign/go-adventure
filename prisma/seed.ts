/**
 * Local development seed — M1.
 *
 * ⚠️  EVERY FACT IN THIS FILE IS FABRICATED. These are illustrative placeholder
 * destinations for building and testing the walking-skeleton UI (M2) and search
 * (M3) against a realistic-shaped corpus. None of it is sourced, verified, or
 * fit to publish. Real content arrives through the ingestion pipeline (M5) and
 * editorial review (M6) — never by promoting seed rows. Place names are real so
 * the map looks sensible; the attributes attached to them are invented.
 *
 * The facet spread (difficulty, budget, months, trip length, activities) is
 * deliberately varied so Explore filters and the M3 zero-result relaxation flow
 * have interesting combinations to exercise.
 *
 * Geometry note: Prisma's typed client cannot write geography columns, so each
 * row is created for its typed fields and then given its geometry via a
 * parameterized raw-SQL UPDATE. See docs/adr/0003-postgis-spatial-model.md.
 */
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import {
  PrismaClient,
  type Activity,
  type AdventureLabel,
  type Difficulty,
  type Month,
  type PermitRequirementType,
  type TripLength,
} from "../src/generated/prisma/client";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

type TrailSeed = {
  name: string;
  slug: string;
  distanceMiles: number;
  elevationGainFt: number;
  difficulty: Difficulty;
  durationHours: number;
  costUSD?: number;
  tags: string[];
  isRepresentative: boolean;
  /** Ordered [lng, lat] vertices forming the trail's illustrative route line. */
  route: [number, number][];
};

type PermitSeed = {
  requirementType: PermitRequirementType;
  scope: string;
  officialUrl: string;
};

type DestinationSeed = {
  name: string;
  slug: string;
  /** Canonical point as [longitude, latitude] (GeoJSON axis order). */
  point: [number, number];
  /** Fabricated permit info; officialUrl points at the real land manager. */
  permit: PermitSeed;
  activities: Activity[];
  bestMonths: Month[];
  difficulty: Difficulty;
  tripLength: TripLength;
  label: AdventureLabel;
  budgetLowUsd: number;
  budgetHighUsd: number;
  summary: string;
  tags: string[];
  trails: TrailSeed[];
};

const DESTINATIONS: DestinationSeed[] = [
  {
    name: "Zion Narrows Basecamp",
    slug: "zion-narrows-basecamp",
    point: [-112.9479, 37.2982],
    permit: {
      requirementType: "reservation",
      scope: "Top-down Narrows through-hike (Zion Wilderness permit)",
      officialUrl: "https://www.nps.gov/zion/planyourvisit/thenarrows.htm",
    },
    activities: ["hiking", "backpacking"],
    bestMonths: ["april", "may", "september", "october"],
    difficulty: "moderate",
    tripLength: "medium_4_7d",
    label: "epic",
    budgetLowUsd: 400,
    budgetHighUsd: 900,
    summary:
      "PLACEHOLDER. A slot-canyon river route with a permitted top-down traverse and easy valley day hikes for shoulder days.",
    tags: ["slot-canyon", "river-hike", "desert", "permit"],
    trails: [
      {
        name: "The Narrows — Top-Down",
        slug: "the-narrows-top-down",
        distanceMiles: 16,
        elevationGainFt: 334,
        difficulty: "hard",
        durationHours: 12,
        costUSD: 15,
        tags: ["permit", "wet", "iconic"],
        isRepresentative: true,
        route: [
          [-112.9312, 37.3369],
          [-112.9401, 37.312],
          [-112.9479, 37.2982],
        ],
      },
      {
        name: "Riverside Walk",
        slug: "riverside-walk",
        distanceMiles: 2.2,
        elevationGainFt: 57,
        difficulty: "easy",
        durationHours: 1.5,
        tags: ["accessible", "family"],
        isRepresentative: false,
        route: [
          [-112.9479, 37.2982],
          [-112.9465, 37.301],
        ],
      },
    ],
  },
  {
    name: "Mount Whitney Approach",
    slug: "mount-whitney-approach",
    point: [-118.2923, 36.5785],
    permit: {
      requirementType: "quota",
      scope: "Overnight & day-use lottery quota",
      officialUrl: "https://www.recreation.gov/permits/233260",
    },
    activities: ["backpacking"],
    bestMonths: ["july", "august", "september"],
    difficulty: "expert",
    tripLength: "long_7d_plus",
    label: "editors_pick",
    budgetLowUsd: 700,
    budgetHighUsd: 1600,
    summary:
      "PLACEHOLDER. High-Sierra approach to the highest summit in the contiguous US, with acclimatization camps and a lottery permit.",
    tags: ["alpine", "high-altitude", "permit", "strenuous"],
    trails: [
      {
        name: "Mount Whitney Trail",
        slug: "mount-whitney-trail",
        distanceMiles: 22,
        elevationGainFt: 6100,
        difficulty: "expert",
        durationHours: 16,
        costUSD: 21,
        tags: ["permit", "summit", "exposure"],
        isRepresentative: true,
        route: [
          [-118.2401, 36.5866],
          [-118.2712, 36.5801],
          [-118.2923, 36.5785],
        ],
      },
    ],
  },
  {
    name: "Cuyahoga Valley Loops",
    slug: "cuyahoga-valley-loops",
    point: [-81.5679, 41.2808],
    permit: {
      requirementType: "none",
      scope: "No permit required for day hiking",
      officialUrl: "https://www.nps.gov/cuva/planyourvisit/index.htm",
    },
    activities: ["hiking"],
    bestMonths: ["april", "may", "june", "september", "october"],
    difficulty: "easy",
    tripLength: "day",
    label: "beginner_friendly",
    budgetLowUsd: 80,
    budgetHighUsd: 220,
    summary:
      "PLACEHOLDER. Gentle towpath and waterfall loops between Cleveland and Akron — an easy first taste of multi-trail day hiking.",
    tags: ["waterfalls", "towpath", "family", "no-permit"],
    trails: [
      {
        name: "Brandywine Gorge Loop",
        slug: "brandywine-gorge-loop",
        distanceMiles: 1.5,
        elevationGainFt: 190,
        difficulty: "easy",
        durationHours: 1,
        tags: ["waterfall", "loop"],
        isRepresentative: true,
        route: [
          [-81.5601, 41.2776],
          [-81.5679, 41.2808],
        ],
      },
    ],
  },
  {
    name: "Olympic Coast Traverse",
    slug: "olympic-coast-traverse",
    point: [-124.6357, 47.8991],
    permit: {
      requirementType: "reservation",
      scope: "Wilderness coast overnight permit + approved bear canister",
      officialUrl:
        "https://www.nps.gov/olym/planyourvisit/wilderness-permits.htm",
    },
    activities: ["backpacking"],
    bestMonths: ["july", "august"],
    difficulty: "hard",
    tripLength: "medium_4_7d",
    label: "hidden_gem",
    budgetLowUsd: 350,
    budgetHighUsd: 750,
    summary:
      "PLACEHOLDER. A tide-dependent wilderness-coast backpack with headland ropes, bear canisters, and few bail-out points.",
    tags: ["coastal", "tides", "wilderness", "permit"],
    trails: [
      {
        name: "Rialto to Sand Point",
        slug: "rialto-to-sand-point",
        distanceMiles: 18,
        elevationGainFt: 1200,
        difficulty: "hard",
        durationHours: 14,
        costUSD: 8,
        tags: ["tides", "remote", "permit"],
        isRepresentative: true,
        route: [
          [-124.6402, 47.9201],
          [-124.6357, 47.8991],
          [-124.63, 47.87],
        ],
      },
    ],
  },
  {
    name: "Sedona Red Rocks",
    slug: "sedona-red-rocks",
    point: [-111.7891, 34.8697],
    permit: {
      requirementType: "none",
      scope: "No permit for listed day hikes (Red Rock Pass for parking)",
      officialUrl: "https://www.fs.usda.gov/coconino",
    },
    activities: ["hiking"],
    bestMonths: ["march", "april", "october", "november"],
    difficulty: "moderate",
    tripLength: "short_2_3d",
    label: "editors_pick",
    budgetLowUsd: 250,
    budgetHighUsd: 600,
    summary:
      "PLACEHOLDER. Red-rock day hikes with big views and short approaches — a weekend-friendly desert basecamp.",
    tags: ["desert", "red-rock", "views", "weekend"],
    trails: [
      {
        name: "Cathedral Rock Trail",
        slug: "cathedral-rock-trail",
        distanceMiles: 1.2,
        elevationGainFt: 740,
        difficulty: "moderate",
        durationHours: 2,
        tags: ["scramble", "sunset"],
        isRepresentative: true,
        route: [
          [-111.7924, 34.8203],
          [-111.7891, 34.8697],
        ],
      },
    ],
  },
  {
    name: "Great Smoky Highlands",
    slug: "great-smoky-highlands",
    point: [-83.4985, 35.6532],
    permit: {
      requirementType: "reservation",
      scope: "Backcountry shelter reservation",
      officialUrl:
        "https://www.nps.gov/grsm/planyourvisit/backcountry-camping.htm",
    },
    activities: ["hiking", "backpacking"],
    bestMonths: ["april", "may", "june", "september", "october"],
    difficulty: "moderate",
    tripLength: "short_2_3d",
    label: "hidden_gem",
    budgetLowUsd: 150,
    budgetHighUsd: 450,
    summary:
      "PLACEHOLDER. Ridge-line hikes and shelter-to-shelter overnights through misted spruce-fir highlands.",
    tags: ["forest", "ridge", "shelters", "no-fee"],
    trails: [
      {
        name: "Charlies Bunion",
        slug: "charlies-bunion",
        distanceMiles: 8.1,
        elevationGainFt: 1640,
        difficulty: "moderate",
        durationHours: 5,
        tags: ["ridge", "views"],
        isRepresentative: true,
        route: [
          [-83.4249, 35.6111],
          [-83.4985, 35.6532],
        ],
      },
    ],
  },
];

/** Build an EWKT MULTILINESTRING literal from [lng, lat] vertices (numbers we control). */
function toMultiLineStringEwkt(route: [number, number][]): string {
  const coords = route.map(([lng, lat]) => `${lng} ${lat}`).join(", ");
  return `SRID=4326;MULTILINESTRING((${coords}))`;
}

async function clearAll() {
  // FK-safe order: dependent/provenance rows first, then entities, then the
  // source at the root. FactAssertion/PermitRequirement have no FK to their
  // polymorphic subject, so order among them is flexible.
  await prisma.factAssertion.deleteMany();
  await prisma.permitRequirement.deleteMany();
  await prisma.outboxEvent.deleteMany();
  await prisma.destinationTrail.deleteMany();
  await prisma.mediaAsset.deleteMany();
  await prisma.contentRevision.deleteMany();
  await prisma.trail.deleteMany();
  await prisma.destination.deleteMany();
  await prisma.sourceRecord.deleteMany();
  await prisma.source.deleteMany();
}

async function main() {
  await clearAll();

  // The provenance root for all seed content: a single "Editorial seed" source.
  // Real content will hang off registered external sources (NPS, etc.) at M5/M9.
  const source = await prisma.source.create({
    data: {
      name: "Editorial seed",
      baseUrl: "internal://seed",
      licence: "PLACEHOLDER-NOT-FOR-PUBLICATION",
      attributionText: "Fabricated development seed data",
      commercialUse: "None — development only, never published",
      refreshPolicy: "static",
      owner: "engineering",
      enabled: true,
    },
  });

  const now = new Date();

  for (const d of DESTINATIONS) {
    // 0. A source record: the (fabricated) raw capture this content derives from.
    //    Real records carry a checksummed raw object in restricted storage; here
    //    the checksum is a stable placeholder.
    const sourceRecord = await prisma.sourceRecord.create({
      data: {
        sourceId: source.id,
        externalId: d.slug,
        canonicalUrl: d.permit.officialUrl,
        retrievedAt: now,
        rawObjectKey: `seed/raw/${d.slug}.json`,
        checksum: `seed-${d.slug}`,
        normalizerVersion: "seed-v1",
        licenceSnapshot: "PLACEHOLDER-NOT-FOR-PUBLICATION",
        attributionSnapshot: "Fabricated development seed data",
      },
    });

    // 1. Hero media placeholder, linked to its source record. No real bitmap yet
    //    (no rights-cleared media until M5/M6) — the UI renders a generated
    //    placeholder from the slug.
    const hero = await prisma.mediaAsset.create({
      data: {
        objectKey: `seed/${d.slug}/hero.jpg`,
        altText: `${d.name} (placeholder image)`,
        creatorCredit: "Seed placeholder",
        licence: "PLACEHOLDER-NOT-FOR-PUBLICATION",
        rightsStatus: "unknown",
        moderationStatus: "approved",
        sourceRecordId: sourceRecord.id,
      },
    });

    // 2. Destination (typed fields via Prisma). Seeded as published so the
    //    walking-skeleton UI, which only queries published rows, has content.
    const destination = await prisma.destination.create({
      data: {
        name: d.name,
        slug: d.slug,
        activities: d.activities,
        bestMonths: d.bestMonths,
        difficulty: d.difficulty,
        tripLength: d.tripLength,
        label: d.label,
        budgetLowUsd: d.budgetLowUsd,
        budgetHighUsd: d.budgetHighUsd,
        summary: d.summary,
        tags: d.tags,
        status: "published",
        publishedAt: new Date(),
        lastVerifiedAt: new Date(),
        heroAssetId: hero.id,
      },
    });

    // 3. Canonical point via raw SQL (Prisma can't set geography columns).
    const [lng, lat] = d.point;
    await prisma.$executeRaw`
      UPDATE "Destination"
      SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
      WHERE id = ${destination.id}::uuid
    `;

    // 3a. Provenance: an approved editorial ContentRevision holding the summary,
    //     the FactAssertions backing each published fact, and the permit info.
    //     This is what makes every seed fact traceable (M4 exit criterion).
    const revision = await prisma.contentRevision.create({
      data: {
        entityType: "destination",
        entityId: destination.id,
        body: { summary: d.summary },
        origin: "editorial",
        reviewStatus: "approved",
        publishedAt: now,
      },
    });

    const factFields: { field: string; value: unknown }[] = [
      { field: "difficulty", value: d.difficulty },
      { field: "tripLength", value: d.tripLength },
      { field: "bestMonths", value: d.bestMonths },
      {
        field: "budget",
        value: { currency: "USD", low: d.budgetLowUsd, high: d.budgetHighUsd },
      },
    ];
    await prisma.factAssertion.createMany({
      data: factFields.map((f) => ({
        subjectType: "destination",
        subjectId: destination.id,
        field: f.field,
        value: f.value as object,
        confidence: "editorial" as const,
        sourceRecordId: sourceRecord.id,
        contentRevisionId: revision.id,
        verifiedAt: now,
      })),
    });

    // 3b. Permit requirement, always with an official land-manager URL.
    await prisma.permitRequirement.create({
      data: {
        subjectType: "destination",
        subjectId: destination.id,
        requirementType: d.permit.requirementType,
        scope: d.permit.scope,
        officialUrl: d.permit.officialUrl,
        sourceRecordId: sourceRecord.id,
        lastVerifiedAt: now,
      },
    });

    // 4. Trails + geometry + the destination↔trail editorial ordering.
    let order = 0;
    for (const t of d.trails) {
      const trail = await prisma.trail.create({
        data: {
          name: t.name,
          slug: t.slug,
          distanceMiles: t.distanceMiles,
          elevationGainFt: t.elevationGainFt,
          difficulty: t.difficulty,
          durationHours: t.durationHours,
          costUSD: t.costUSD ?? null,
          tags: t.tags,
          status: "published",
          publishedAt: new Date(),
          lastVerifiedAt: new Date(),
        },
      });

      const ewkt = toMultiLineStringEwkt(t.route);
      await prisma.$executeRaw`
        UPDATE "Trail"
        SET "routeGeometry" = ST_GeogFromText(${ewkt})
        WHERE id = ${trail.id}::uuid
      `;

      await prisma.destinationTrail.create({
        data: {
          destinationId: destination.id,
          trailId: trail.id,
          isRepresentative: t.isRepresentative,
          editorialOrder: order++,
        },
      });
    }

    console.log(`✓ ${d.name} (${d.trails.length} trail(s))`);
  }

  const [{ count }] = await prisma.$queryRaw<
    { count: bigint }[]
  >`SELECT COUNT(*)::int AS count FROM "Destination" WHERE location IS NOT NULL`;
  const facts = await prisma.factAssertion.count();
  const permits = await prisma.permitRequirement.count();
  const revisions = await prisma.contentRevision.count();
  console.log(
    `\nSeeded ${DESTINATIONS.length} destinations (${count} with a location point), ` +
      `${revisions} revisions, ${facts} fact assertions, ${permits} permits — all provenance-backed.`,
  );
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
