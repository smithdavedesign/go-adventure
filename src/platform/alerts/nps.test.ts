import { describe, expect, it } from "vitest";
import { normalizeAlerts } from "./nps";

const sample = {
  data: [
    { title: "Road closed", category: "Park Closure", url: "https://nps.gov/x", description: "Snow", parkCode: "glac" },
    { title: "Trail reroute", category: "Caution", url: "", parkCode: "glac" },
    { title: "Info notice", category: "Information", parkCode: "yose" },
    { title: "", parkCode: "bad" }, // malformed (empty title) → skipped
  ],
};

describe("normalizeAlerts", () => {
  it("groups alerts by parkCode", () => {
    const out = normalizeAlerts(sample, "2026-07-24T00:00:00Z");
    const glac = out.find((o) => o.parkCode === "glac");
    const yose = out.find((o) => o.parkCode === "yose");
    expect(glac?.alerts).toHaveLength(2);
    expect(yose?.alerts).toHaveLength(1);
  });

  it("preserves category, url (null when empty), and provenance", () => {
    const out = normalizeAlerts(sample, "2026-07-24T00:00:00Z");
    const glac = out.find((o) => o.parkCode === "glac")!;
    expect(glac.provider).toBe("nps");
    expect(glac.observedAt).toBe("2026-07-24T00:00:00Z");
    expect(glac.alerts[0]).toMatchObject({ category: "Park Closure", url: "https://nps.gov/x" });
    expect(glac.alerts[1].url).toBeNull(); // empty string → null
  });

  it("skips malformed alerts without failing the batch", () => {
    const out = normalizeAlerts(sample, "2026-07-24T00:00:00Z");
    expect(out.find((o) => o.parkCode === "bad")).toBeUndefined();
  });

  it("handles an empty response", () => {
    expect(normalizeAlerts({ data: [] }, "2026-07-24T00:00:00Z")).toEqual([]);
  });
});
