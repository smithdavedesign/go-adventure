/**
 * Ingestion CLI. Runs a source through the pipeline into the review queue.
 *
 *   npm run ingest:nps                 # live — requires NPS_API_KEY
 *   npm run ingest:nps -- --fixture    # offline — uses the bundled NPS fixture
 *   npm run ingest:nps -- zion,olym    # live, limited to specific park codes
 *
 * The fixture mode is how the pipeline is exercised end-to-end without a key
 * (and how the E2E/verification runs), proving the M5 exit criterion: a source
 * flows into the admin review queue with no manual DB edits.
 */
import "dotenv/config";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { NpsAdapter } from "./nps/adapter";
import { runIngestion } from "./pipeline";
import { LocalRawStore } from "./rawStore";
import { npsParksResponseSchema } from "./nps/schema";
import type { RawRecord } from "./types";

const here = dirname(fileURLToPath(import.meta.url));

async function fixtureRaws(): Promise<RawRecord[]> {
  const raw = await readFile(
    join(here, "nps", "__fixtures__", "parks.json"),
    "utf8",
  );
  const parsed = npsParksResponseSchema.parse(JSON.parse(raw));
  return parsed.data.map((payload) => ({
    externalId: String(
      (payload as { parkCode?: unknown })?.parkCode ?? "unknown",
    ),
    canonicalUrl: (payload as { url?: string })?.url,
    payload,
  }));
}

async function main() {
  const args = process.argv.slice(2);
  const useFixture = args.includes("--fixture");
  const parkArg = args.find((a) => !a.startsWith("--"));
  const parkCodes = parkArg ? parkArg.split(",") : [];

  const adapter = new NpsAdapter(process.env.NPS_API_KEY, parkCodes);
  const rawStore = new LocalRawStore(
    join(process.cwd(), ".ingestion-raw"),
  );

  const summary = await runIngestion(adapter, {
    rawStore,
    fetchOverride: useFixture ? fixtureRaws : undefined,
  });

  console.log(
    `Ingestion ${summary.status}: ${summary.processed} drafted, ${summary.failed} dead-lettered (run ${summary.runId}).`,
  );
  if (summary.failed > 0) {
    console.log("Failed records are in the dead-letter queue for review.");
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
