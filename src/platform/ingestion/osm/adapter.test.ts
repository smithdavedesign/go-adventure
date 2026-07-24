import { describe, expect, it } from "vitest";
import { normalizeTrails } from "./adapter";
import type { OsmWay } from "./overpass";

function way(
  id: number,
  name: string,
  tags: Record<string, string>,
  n: number,
): OsmWay {
  // A rough straight line of n points near Zion, ~0.01° apart (~0.7 mi/point).
  const geometry = Array.from({ length: n }, (_, i) => ({
    lat: 37.3 + i * 0.01,
    lon: -113.0,
  }));
  return { type: "way", id, tags: { name, ...tags }, geometry };
}

describe("normalizeTrails", () => {
  const ways: OsmWay[] = [
    way(1, "West Rim Trail", {}, 30),
    way(2, "East Rim Trail", { sac_scale: "mountain_hiking" }, 20),
    way(3, "Angels Landing", { sac_scale: "demanding_mountain_hiking" }, 10),
    way(4, "Closed Loop - Closed Indefinitely", {}, 15),
    way(5, "Tiny Spur", {}, 2), // too short after filter
  ];

  it("maps sac_scale to difficulty with confirmed confidence", () => {
    const out = normalizeTrails(ways, "zion");
    const east = out.find((t) => t.name === "East Rim Trail")!;
    expect(east.difficulty).toBe("moderate");
    expect(east.difficultyConfidence).toBe("confirmed");
    const angels = out.find((t) => t.name === "Angels Landing")!;
    expect(angels.difficulty).toBe("hard");
  });

  it("defaults difficulty to editorial when sac_scale is absent", () => {
    const west = normalizeTrails(ways, "zion").find((t) => t.name === "West Rim Trail")!;
    expect(west.difficulty).toBe("moderate");
    expect(west.difficultyConfidence).toBe("editorial");
  });

  it("drops closed trails and park-suffixes the slug", () => {
    const out = normalizeTrails(ways, "zion");
    expect(out.some((t) => /closed/i.test(t.name))).toBe(false);
    expect(out[0].slug.endsWith("-zion")).toBe(true);
  });

  it("computes a positive distance and sorts longest-first", () => {
    const out = normalizeTrails(ways, "zion");
    expect(out[0].distanceMiles).toBeGreaterThan(out[out.length - 1].distanceMiles);
    expect(out[0].name).toBe("West Rim Trail"); // most nodes → longest
  });

  it("caps the representative set", () => {
    const many = Array.from({ length: 12 }, (_, i) => way(100 + i, `Trail ${i}`, {}, 10));
    expect(normalizeTrails(many, "zion", 5)).toHaveLength(5);
  });
});
