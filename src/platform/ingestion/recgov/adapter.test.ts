import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { RecGovAdapter } from "./adapter";
import type { RawRecord } from "@/platform/ingestion/types";

const fixture = JSON.parse(
  readFileSync(join(__dirname, "__fixtures__", "recareas.json"), "utf8"),
) as { RECDATA: unknown[] };

function raw(i: number): RawRecord {
  const payload = fixture.RECDATA[i] as { RecAreaID: string };
  return { externalId: payload.RecAreaID, payload };
}

const adapter = new RecGovAdapter("test-key");

describe("RecGovAdapter.normalize", () => {
  it("maps a rec area to a draft with an official Recreation.gov URL", () => {
    const draft = adapter.normalize(raw(0));
    expect(draft.name).toBe("Inyo National Forest");
    expect(draft.slug).toBe("inyo-national-forest");
    expect(draft.point.lat).toBeCloseTo(37.6, 1);
    expect(draft.officialUrl).toContain("recreation.gov");
    expect(draft.permit?.requirementType).toBe("unknown"); // never inferred
  });

  it("records only source-confirmed facts", () => {
    const draft = adapter.normalize(raw(0));
    expect(draft.facts.every((f) => f.confidence === "confirmed")).toBe(true);
    expect(draft.facts.map((f) => f.field)).toContain("officialUrl");
  });

  it("throws on a malformed area so it dead-letters", () => {
    expect(() => adapter.normalize(raw(2))).toThrow();
  });
});
