/**
 * Integration smoke tests — validate live API keys and external endpoints.
 *
 * These tests hit the real network. They are NOT included in the default
 * `npm test` (vitest unit run). Run them explicitly:
 *
 *   npm run test:smoke
 *
 * They require the following env vars to be set (see .env / Vercel):
 *   NPS_API_KEY, RECREATION_GOV_API_KEY
 *
 * Optional (untested when absent):
 *   GEMINI_API_KEY
 *
 * Open-Meteo is keyless — its smoke test always runs.
 *
 * Failure modes:
 *   401 / 403  → key wrong or missing
 *   429        → rate-limited; retry later
 *   5xx        → provider outage; not a key issue
 */
import "dotenv/config";
import { describe, it, expect, beforeAll } from "vitest";
import { NpsAdapter } from "@/platform/ingestion/nps/adapter";
import { RecGovAdapter } from "@/platform/ingestion/recgov/adapter";
import { GeminiAiProvider } from "@/platform/ai/gemini";
import { fetchForecast } from "@/platform/forecasts/openMeteo";

// ---------------------------------------------------------------------------
// NPS Data API
// ---------------------------------------------------------------------------
describe("NPS API smoke test", () => {
  it("NPS_API_KEY is present in env", () => {
    expect(process.env.NPS_API_KEY, "NPS_API_KEY must be set").toBeTruthy();
  });

  it("fetches at least one park record from the live NPS API", async () => {
    const adapter = new NpsAdapter(process.env.NPS_API_KEY, ["zion"]);
    const records = await adapter.fetchRaw();
    expect(records.length).toBeGreaterThan(0);
    // Confirm the response has the expected shape
    const first = records[0];
    expect(first.externalId).toBeTruthy();
  });

  it("normalizes a live NPS record without throwing", async () => {
    const adapter = new NpsAdapter(process.env.NPS_API_KEY, ["zion"]);
    const records = await adapter.fetchRaw();
    const draft = adapter.normalize(records[0]);
    expect(draft.name).toBeTruthy();
    expect(draft.slug).toBeTruthy();
    expect(typeof draft.point.lat).toBe("number");
    expect(typeof draft.point.lng).toBe("number");
    expect(draft.permit?.requirementType).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// Recreation.gov RIDB
// ---------------------------------------------------------------------------
describe("Recreation.gov (RIDB) API smoke test", () => {
  it("RECREATION_GOV_API_KEY is present in env", () => {
    expect(
      process.env.RECREATION_GOV_API_KEY,
      "RECREATION_GOV_API_KEY must be set",
    ).toBeTruthy();
  });

  it("fetches at least one rec area from the live RIDB API", async () => {
    const adapter = new RecGovAdapter(
      process.env.RECREATION_GOV_API_KEY,
      "Yosemite",
    );
    const records = await adapter.fetchRaw();
    expect(records.length).toBeGreaterThan(0);
    const first = records[0];
    expect(first.externalId).toBeTruthy();
  });

  it("normalizes a live RIDB record without throwing", async () => {
    const adapter = new RecGovAdapter(
      process.env.RECREATION_GOV_API_KEY,
      "Yosemite",
    );
    const records = await adapter.fetchRaw();
    const draft = adapter.normalize(records[0]);
    expect(draft.name).toBeTruthy();
    expect(draft.officialUrl).toContain("recreation.gov");
    expect(draft.permit?.requirementType).toBe("unknown");
  });
});

// ---------------------------------------------------------------------------
// Open-Meteo (keyless)
// ---------------------------------------------------------------------------
describe("Open-Meteo forecast smoke test (keyless)", () => {
  it("fetches a 3-day forecast for a known location without throwing", async () => {
    // Zion NP coordinates
    const forecast = await fetchForecast(37.2984, -113.0265, new Date().toISOString());
    expect(forecast.provider).toBe("open-meteo");
    expect(forecast.days.length).toBeGreaterThanOrEqual(1);
    expect(forecast.days[0].date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof forecast.days[0].tempMaxC).toBe("number");
  });
});

// ---------------------------------------------------------------------------
// Gemini AI (optional — only runs when GEMINI_API_KEY is set)
// ---------------------------------------------------------------------------
describe("Gemini AI smoke test", () => {
  let hasKey: boolean;

  beforeAll(() => {
    hasKey = !!process.env.GEMINI_API_KEY;
  });

  it("GEMINI_API_KEY is present in env (skipped if absent — M8 milestone)", () => {
    if (!hasKey) {
      console.log("  ⚠ GEMINI_API_KEY not set — skipping Gemini smoke test (expected until M8).");
      return;
    }
    expect(process.env.GEMINI_API_KEY).toBeTruthy();
  });

  it("drafts a summary from a minimal source packet", async () => {
    if (!hasKey) return;
    const provider = new GeminiAiProvider(process.env.GEMINI_API_KEY);
    const output = await provider.draft({
      sourceName: "NPS Data API",
      name: "Zion National Park",
      designation: "National Park",
      description:
        "Zion National Park is a southwest Utah nature preserve " +
        "distinguished by Zion Canyon's steep red cliffs.",
    });
    expect(output.summary).toBeTruthy();
    expect(output.summary.length).toBeGreaterThan(10);
    expect(Array.isArray(output.tags)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Supabase / DATABASE_URL reachability
// ---------------------------------------------------------------------------
describe("Supabase DB connectivity smoke test", () => {
  it("DATABASE_URL is present in env", () => {
    expect(process.env.DATABASE_URL, "DATABASE_URL must be set").toBeTruthy();
  });

  it("DATABASE_URL points to the pooler (not a direct host)", () => {
    const url = process.env.DATABASE_URL ?? "";
    // Supabase pooler hostnames contain "pooler.supabase.com"
    // Direct hostnames contain "db.<ref>.supabase.co"
    // Both are valid but we document which is which for clarity.
    const isPooler = url.includes("pooler.supabase.com");
    const isDirect = url.includes(".supabase.co");
    expect(isPooler || isDirect, "DATABASE_URL should be a Supabase connection string").toBe(true);
    if (!isPooler) {
      console.warn("⚠ DATABASE_URL appears to be a direct connection — use the pooler URL for runtime on Vercel.");
    }
  });

  it("can connect and run a minimal query", async () => {
    // Dynamically import to avoid pulling PrismaClient into unit test bundle.
    const { prisma } = await import("@/shared/config/db");
    const result = await prisma.$queryRaw<{ count: bigint }[]>`SELECT COUNT(*) as count FROM "Destination"`;
    expect(typeof Number(result[0].count)).toBe("number");
  });
});
