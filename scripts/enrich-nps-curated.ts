/**
 * Editorial enrichment for the curated NPS adventure corpus.
 *
 * NPS ingestion provides only source-confirmable fields (name, description,
 * coordinates, official URL, activities). This script fills the EDITORIAL facets
 * a human editor would — difficulty range, best months, budget estimate, trip
 * length, primary label — and a permit category, for a hand-curated set of
 * iconic hiking/backpacking national parks.
 *
 * Honesty / provenance:
 *  - These are EDITORIAL judgments (the publish workflow records them with
 *    confidence = editorial; source facts stay confidence = confirmed).
 *  - Difficulty/best-months/budget/trip-length are exactly the "editorial
 *    judgement" fields the PRD rubric describes — not source facts.
 *  - PERMIT is safety-relevant: `requirementType` is the well-established
 *    category, and every `scope` directs the user to the official site for
 *    current specifics (day-use timed-entry / reservation systems change yearly).
 *    Nothing is presented as live availability.
 *  - Budget is a rough per-person, few-day estimate excluding airfare (per rubric).
 *
 * This script only edits DRAFTS (reviewStatus stays in_review). It also rejects
 * the non-adventure NPS units (historic sites, memorials, etc.) that an earlier
 * unfiltered ingest left in the queue, so the queue equals the curated set.
 *
 * Re-runnable: idempotent per draftKey.
 */
import "dotenv/config";
import { prisma } from "@/shared/config/db";

type Enrichment = {
  activities: ("hiking" | "backpacking")[];
  difficulty: "easy" | "moderate" | "hard" | "expert";
  tripLength: "day" | "short_2_3d" | "medium_4_7d" | "long_7d_plus";
  bestMonths: string[];
  budgetLow: number;
  budgetHigh: number;
  label:
    | "editors_pick"
    | "hidden_gem"
    | "beginner_friendly"
    | "epic";
  permitType: "none" | "reservation" | "quota" | "timed_entry" | "unknown";
  permitScope: string;
};

const H = ["hiking"] as const;
const HB = ["hiking", "backpacking"] as const;

// Curated editorial data, keyed by NPS parkCode. Best months use our Month enum.
const DATA: Record<string, Enrichment> = {
  yose: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["may","june","july","august","september","october"], budgetLow: 300, budgetHigh: 1200, label: "editors_pick", permitType: "quota", permitScope: "Wilderness permit (lottery) required for overnight; Half Dome day-use permit; peak-season day-use reservations may apply — confirm current rules on the official site." },
  grca: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["april","may","september","october"], budgetLow: 300, budgetHigh: 1200, label: "editors_pick", permitType: "reservation", permitScope: "Backcountry permit required for below-rim/overnight; the inner canyon is extreme in summer heat — confirm current rules on the official site." },
  zion: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["april","may","september","october"], budgetLow: 250, budgetHigh: 800, label: "editors_pick", permitType: "quota", permitScope: "Permits (lottery) for The Narrows top-down, The Subway, and Angels Landing; shuttle reservations may apply — confirm current rules on the official site." },
  romo: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["june","july","august","september"], budgetLow: 250, budgetHigh: 900, label: "epic", permitType: "reservation", permitScope: "Wilderness permit for overnight; timed-entry reservation for day-use in peak season — confirm current rules on the official site." },
  glac: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["july","august","september"], budgetLow: 300, budgetHigh: 1100, label: "editors_pick", permitType: "reservation", permitScope: "Backcountry permit for overnight; vehicle reservations for Going-to-the-Sun Road in season — confirm current rules on the official site." },
  yell: { activities: [...HB], difficulty: "moderate", tripLength: "medium_4_7d", bestMonths: ["june","july","august","september"], budgetLow: 300, budgetHigh: 1200, label: "editors_pick", permitType: "reservation", permitScope: "Backcountry permit required for overnight; be bear-aware and carry spray — confirm current rules on the official site." },
  grte: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["june","july","august","september"], budgetLow: 300, budgetHigh: 1100, label: "epic", permitType: "reservation", permitScope: "Backcountry permit required for overnight; bear canister required — confirm current rules on the official site." },
  olym: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["june","july","august","september"], budgetLow: 250, budgetHigh: 900, label: "epic", permitType: "reservation", permitScope: "Wilderness permit + approved bear canister for overnight; consult tide tables for the coast — confirm current rules on the official site." },
  mora: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["july","august","september"], budgetLow: 250, budgetHigh: 900, label: "epic", permitType: "reservation", permitScope: "Wilderness permit for overnight; climbing permit above Camp Muir — confirm current rules on the official site." },
  seki: { activities: [...HB], difficulty: "expert", tripLength: "medium_4_7d", bestMonths: ["july","august","september"], budgetLow: 300, budgetHigh: 1100, label: "epic", permitType: "quota", permitScope: "Wilderness permits (quota) for overnight; Mt. Whitney lottery; bear canister required — confirm current rules on the official site." },
  acad: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["june","july","august","september","october"], budgetLow: 200, budgetHigh: 700, label: "beginner_friendly", permitType: "none", permitScope: "No permit for day hiking; vehicle reservation for the Cadillac Summit Road in season — check the official site." },
  grsm: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["april","may","june","september","october"], budgetLow: 150, budgetHigh: 600, label: "editors_pick", permitType: "reservation", permitScope: "Backcountry reservation for overnight; a parking tag is required — confirm current rules on the official site." },
  arch: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["april","may","september","october"], budgetLow: 200, budgetHigh: 700, label: "beginner_friendly", permitType: "timed_entry", permitScope: "No permit for most day hiking; seasonal timed-entry vehicle reservation; the Fiery Furnace requires a permit — check the official site." },
  brca: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["may","june","september","october"], budgetLow: 200, budgetHigh: 700, label: "beginner_friendly", permitType: "none", permitScope: "No permit for day hiking; backcountry permit for the Under-the-Rim Trail overnight — check the official site." },
  jotr: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["march","april","october","november"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "none", permitScope: "No permit for day hiking; register for some backcountry routes — carry ample water — check the official site." },
  shen: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["april","may","june","september","october"], budgetLow: 150, budgetHigh: 600, label: "beginner_friendly", permitType: "reservation", permitScope: "Free backcountry permit for overnight — confirm current rules on the official site." },
  noca: { activities: [...HB], difficulty: "expert", tripLength: "medium_4_7d", bestMonths: ["july","august","september"], budgetLow: 250, budgetHigh: 900, label: "hidden_gem", permitType: "reservation", permitScope: "Wilderness permit for overnight; remote and rugged terrain — confirm current rules on the official site." },
  crla: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["july","august","september"], budgetLow: 200, budgetHigh: 800, label: "hidden_gem", permitType: "reservation", permitScope: "Backcountry permit for overnight; deep snow can linger into summer — confirm current rules on the official site." },
  badl: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["may","june","september","october"], budgetLow: 150, budgetHigh: 600, label: "hidden_gem", permitType: "none", permitScope: "Open hiking with no permit for day use; extreme heat in summer, no shade or water — check the official site." },
  bibe: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["november","december","january","february","march"], budgetLow: 250, budgetHigh: 900, label: "hidden_gem", permitType: "reservation", permitScope: "Backcountry permit for overnight; remote desert — summer is dangerously hot — confirm current rules on the official site." },
  blca: { activities: [...H], difficulty: "hard", tripLength: "short_2_3d", bestMonths: ["may","june","september","october"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "reservation", permitScope: "Wilderness permit for the steep, unmaintained inner-canyon routes — confirm current rules on the official site." },
  cany: { activities: [...HB], difficulty: "hard", tripLength: "medium_4_7d", bestMonths: ["april","may","september","october"], budgetLow: 250, budgetHigh: 900, label: "epic", permitType: "reservation", permitScope: "Backcountry permit for overnight; some day-use permits for vehicle routes — carry ample water — confirm current rules on the official site." },
  care: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["april","may","june","september","october"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "none", permitScope: "No permit for most day hiking; a free backcountry permit is recommended for overnight — check the official site." },
  grsa: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["may","june","september"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "none", permitScope: "No permit for day use / dune hiking; backcountry permit for overnight — sand surface gets extremely hot midday — check the official site." },
  sagu: { activities: [...H], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["november","december","february","march"], budgetLow: 150, budgetHigh: 600, label: "hidden_gem", permitType: "none", permitScope: "No permit for day hiking; backcountry permit for overnight — extreme summer heat, carry ample water — check the official site." },
  redw: { activities: [...H], difficulty: "easy", tripLength: "short_2_3d", bestMonths: ["may","june","july","august","september"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "reservation", permitScope: "No permit for most day hiking; a free permit is required for Tall Trees Grove; backcountry permit for overnight — check the official site." },
  pinn: { activities: [...H], difficulty: "moderate", tripLength: "day", bestMonths: ["march","april","october","november"], budgetLow: 100, budgetHigh: 400, label: "hidden_gem", permitType: "none", permitScope: "No permit for day hiking; talus caves may close seasonally for bats or high water — check the official site." },
  lavo: { activities: [...HB], difficulty: "moderate", tripLength: "short_2_3d", bestMonths: ["july","august","september"], budgetLow: 200, budgetHigh: 700, label: "hidden_gem", permitType: "reservation", permitScope: "Wilderness permit for overnight — confirm current rules on the official site." },
};

async function main() {
  const codes = Object.keys(DATA);
  let enriched = 0;

  for (const code of codes) {
    const draftKey = `NPS Data API:${code}`;
    const revision = await prisma.contentRevision.findUnique({ where: { draftKey } });
    if (!revision) {
      console.warn(`! no draft for ${code} (ingest it first)`);
      continue;
    }
    const body = (revision.body ?? {}) as Record<string, unknown>;
    const e = DATA[code];
    const next = {
      ...body,
      activities: e.activities,
      difficulty: e.difficulty,
      tripLength: e.tripLength,
      bestMonths: e.bestMonths,
      budget: { currency: "USD", low: e.budgetLow, high: e.budgetHigh },
      label: e.label,
      summary: body.summaryDraft ?? body.summary ?? null,
      permit: {
        requirementType: e.permitType,
        scope: e.permitScope,
        officialUrl: String(body.officialUrl ?? ""),
      },
    };
    await prisma.contentRevision.update({
      where: { draftKey },
      data: { body: next as never, origin: "editorial" },
    });
    enriched++;
    console.log(`✓ ${code}  ${e.difficulty}/${e.tripLength}  $${e.budgetLow}-${e.budgetHigh}  ${e.label}  permit=${e.permitType}`);
  }

  // Reject the non-curated NPS drafts (the earlier unfiltered alphabetical
  // ingest) so the review queue equals the curated adventure set.
  const curatedKeys = codes.map((c) => `NPS Data API:${c}`);
  const rejected = await prisma.contentRevision.updateMany({
    where: {
      reviewStatus: "in_review",
      entityType: "destination",
      draftKey: { startsWith: "NPS Data API:", notIn: curatedKeys },
    },
    data: { reviewStatus: "rejected" },
  });

  console.log(`\nEnriched ${enriched}/${codes.length} curated parks.`);
  console.log(`Rejected ${rejected.count} non-curated (non-adventure) drafts.`);
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
