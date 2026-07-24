import { describe, expect, it } from "vitest";
import { nearestAirports } from "./airports";

describe("nearestAirports", () => {
  it("returns the closest airports first with distances", () => {
    // Near Zion — St. George (SGU) and Cedar City (CDC) are closest.
    const near = nearestAirports({ lat: 37.2982, lng: -112.9479 }, 3);
    expect(near).toHaveLength(3);
    expect(near[0].distanceMiles).toBeLessThanOrEqual(near[1].distanceMiles);
    expect(["SGU", "CDC"]).toContain(near[0].code);
  });

  it("finds a sensible nearest for an eastern park (Acadia → BHB/BGR)", () => {
    const near = nearestAirports({ lat: 44.35, lng: -68.21 }, 2);
    expect(["BHB", "BGR"]).toContain(near[0].code);
  });

  it("caps the result count", () => {
    expect(nearestAirports({ lat: 40, lng: -110 }, 2)).toHaveLength(2);
  });
});
