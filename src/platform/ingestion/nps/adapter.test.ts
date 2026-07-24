import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { NpsAdapter } from "./adapter";
import type { RawRecord } from "@/platform/ingestion/types";

const fixture = JSON.parse(
  readFileSync(join(__dirname, "__fixtures__", "parks.json"), "utf8"),
) as { data: unknown[] };

function raw(i: number): RawRecord {
  const payload = fixture.data[i] as { parkCode: string; url?: string };
  return { externalId: payload.parkCode, canonicalUrl: payload.url, payload };
}

const adapter = new NpsAdapter("test-key");

describe("NpsAdapter.normalize", () => {
  it("maps a valid park to a draft with only source-confirmable fields", () => {
    const draft = adapter.normalize(raw(0)); // Zion
    expect(draft.name).toBe("Zion National Park");
    expect(draft.slug).toBe("zion-national-park");
    expect(draft.point.lat).toBeCloseTo(37.2984, 3);
    expect(draft.point.lng).toBeCloseTo(-113.0265, 3);
    expect(draft.officialUrl).toBe("https://www.nps.gov/zion/index.htm");
  });

  it("maps only the Phase 1 activities, dropping the rest", () => {
    // Zion fixture has Hiking, Backpacking, and Astronomy — only the first two count.
    const draft = adapter.normalize(raw(0));
    expect(draft.activities.sort()).toEqual(["backpacking", "hiking"]);
  });

  it("never invents editorial facets or a permit rule", () => {
    const draft = adapter.normalize(raw(0));
    // No difficulty/tripLength/budget/bestMonths asserted from NPS.
    expect(draft.bestMonths).toEqual([]);
    const factFields = draft.facts.map((f) => f.field);
    expect(factFields).not.toContain("difficulty");
    expect(factFields).not.toContain("budget");
    // Permit is present but explicitly unconfirmed, with the official URL.
    expect(draft.permit?.requirementType).toBe("unknown");
    expect(draft.permit?.officialUrl).toContain("nps.gov/zion");
  });

  it("marks source-confirmed facts with confidence=confirmed", () => {
    const draft = adapter.normalize(raw(0));
    expect(draft.facts.every((f) => f.confidence === "confirmed")).toBe(true);
    expect(draft.facts.map((f) => f.field)).toContain("location");
    expect(draft.facts.map((f) => f.field)).toContain("officialUrl");
  });

  it("throws on a malformed record (missing coordinates) so it can be dead-lettered", () => {
    expect(() => adapter.normalize(raw(2))).toThrow(); // badpark has no lat/lng
  });
});
