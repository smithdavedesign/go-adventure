import { describe, expect, it } from "vitest";
import { cumulativeGainFt, estimateDurationHours, sampleRoute } from "./elevation";

describe("cumulativeGainFt", () => {
  it("sums only positive deltas and converts to feet", () => {
    // meters: +100, -50, +50 → +150m gain → ~492 ft
    expect(cumulativeGainFt([1000, 1100, 1050, 1100])).toBe(492);
  });
  it("is zero for a flat/descending profile", () => {
    expect(cumulativeGainFt([1000, 990, 980])).toBe(0);
  });
});

describe("sampleRoute", () => {
  it("returns the route unchanged when under the cap", () => {
    const pts: [number, number][] = [[0, 0], [1, 1]];
    expect(sampleRoute(pts, 40)).toHaveLength(2);
  });
  it("downsamples to the cap and keeps endpoints", () => {
    const pts = Array.from({ length: 200 }, (_, i) => [i, i] as [number, number]);
    const s = sampleRoute(pts, 40);
    expect(s).toHaveLength(40);
    expect(s[0]).toEqual([0, 0]);
    expect(s[39]).toEqual([199, 199]);
  });
});

describe("estimateDurationHours (Naismith)", () => {
  it("adds time for distance and ascent", () => {
    // 6 miles + 2000 ft → 2h + 1h = 3h
    expect(estimateDurationHours(6, 2000)).toBe(3);
  });
});
