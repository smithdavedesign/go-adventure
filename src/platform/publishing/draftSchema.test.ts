import { describe, expect, it } from "vitest";
import { validateDraftForPublish } from "./draftSchema";

const completeDraft = {
  name: "Zion National Park",
  slug: "zion-national-park",
  point: { lat: 37.3, lng: -113.0 },
  summary: "A slot-canyon river route.",
  activities: ["hiking", "backpacking"],
  bestMonths: ["april", "may"],
  difficulty: "moderate",
  tripLength: "medium_4_7d",
  budget: { currency: "USD", low: 400, high: 900 },
  permit: {
    requirementType: "reservation",
    scope: "Wilderness permit",
    officialUrl: "https://www.nps.gov/zion/index.htm",
  },
};

describe("validateDraftForPublish", () => {
  it("accepts a complete draft", () => {
    const r = validateDraftForPublish(completeDraft);
    expect(r.ok).toBe(true);
  });

  it("rejects an NPS-style draft missing editorial facets", () => {
    // What ingestion produces: no difficulty/tripLength/budget yet.
    const npsDraft = {
      name: "Olympic National Park",
      slug: "olympic-national-park",
      point: { lat: 47.9, lng: -123.5 },
      activities: ["hiking"],
      bestMonths: [],
    };
    const r = validateDraftForPublish(npsDraft);
    expect(r.ok).toBe(false);
    if (!r.ok) {
      const joined = r.errors.join(" ");
      expect(joined).toMatch(/difficulty/);
      expect(joined).toMatch(/tripLength/);
      expect(joined).toMatch(/budget/);
    }
  });

  it("rejects an invalid slug", () => {
    const r = validateDraftForPublish({ ...completeDraft, slug: "Not A Slug" });
    expect(r.ok).toBe(false);
  });

  it("rejects out-of-range coordinates", () => {
    const r = validateDraftForPublish({
      ...completeDraft,
      point: { lat: 200, lng: 0 },
    });
    expect(r.ok).toBe(false);
  });

  it("requires at least one activity", () => {
    const r = validateDraftForPublish({ ...completeDraft, activities: [] });
    expect(r.ok).toBe(false);
  });
});
