import { describe, expect, it } from "vitest";
import { EMPTY_FILTERS, type DestinationFilters } from "./filters";
import {
  dropConstraint,
  isConstraintActive,
  nextRelaxation,
  RELAX_ORDER,
} from "./relaxation";

function filters(overrides: Partial<DestinationFilters>): DestinationFilters {
  return { ...EMPTY_FILTERS, ...overrides };
}

describe("relaxation drop order", () => {
  it("drops budget before month before trip length before difficulty", () => {
    expect(RELAX_ORDER).toEqual(["budget", "month", "tripLength", "difficulty"]);
  });

  it("relaxes budget first when all facets are set", () => {
    const f = filters({
      maxBudgetUsd: 250,
      months: ["july"],
      tripLengths: ["day"],
      difficulties: ["easy"],
    });
    const step = nextRelaxation(f);
    expect(step?.constraint).toBe("budget");
    expect(step?.relaxed.maxBudgetUsd).toBeNull();
    // everything else preserved
    expect(step?.relaxed.months).toEqual(["july"]);
    expect(step?.relaxed.difficulties).toEqual(["easy"]);
  });

  it("skips to the next active constraint when higher-priority ones are unset", () => {
    const f = filters({ tripLengths: ["day"], difficulties: ["hard"] });
    const step = nextRelaxation(f);
    expect(step?.constraint).toBe("tripLength");
  });

  it("NEVER relaxes activity — activity-only filters yield no relaxation", () => {
    const f = filters({ activities: ["backpacking"] });
    expect(nextRelaxation(f)).toBeNull();
  });

  it("NEVER relaxes keyword — q-only filters yield no relaxation", () => {
    const f = filters({ q: "alpine" });
    expect(nextRelaxation(f)).toBeNull();
  });

  it("preserves activity and keyword through a relaxation", () => {
    const f = filters({
      activities: ["hiking"],
      q: "waterfall",
      maxBudgetUsd: 100,
    });
    const step = nextRelaxation(f);
    expect(step?.relaxed.activities).toEqual(["hiking"]);
    expect(step?.relaxed.q).toBe("waterfall");
    expect(step?.relaxed.maxBudgetUsd).toBeNull();
  });

  it("returns null when there is nothing left to relax", () => {
    expect(nextRelaxation(EMPTY_FILTERS)).toBeNull();
  });
});

describe("isConstraintActive / dropConstraint", () => {
  it("reports active constraints correctly", () => {
    const f = filters({ maxBudgetUsd: 500, difficulties: ["expert"] });
    expect(isConstraintActive(f, "budget")).toBe(true);
    expect(isConstraintActive(f, "difficulty")).toBe(true);
    expect(isConstraintActive(f, "month")).toBe(false);
    expect(isConstraintActive(f, "tripLength")).toBe(false);
  });

  it("dropConstraint clears exactly one field and nothing else", () => {
    const f = filters({ months: ["june"], difficulties: ["easy"] });
    const dropped = dropConstraint(f, "month");
    expect(dropped.months).toEqual([]);
    expect(dropped.difficulties).toEqual(["easy"]);
  });
});
