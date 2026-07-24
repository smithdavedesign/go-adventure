import { describe, expect, it } from "vitest";
import { normalizeOpenMeteo } from "./openMeteo";

const sample = {
  daily: {
    time: ["2026-07-24", "2026-07-25", "2026-07-26"],
    temperature_2m_max: [31.2, 33.0, 30.5],
    temperature_2m_min: [15.1, 16.4, 14.9],
    precipitation_sum: [0, 2.4, 0],
    weather_code: [1, 61, 0],
  },
};

describe("normalizeOpenMeteo", () => {
  it("maps daily arrays into per-day records", () => {
    const f = normalizeOpenMeteo(sample, "2026-07-24T12:00:00Z");
    expect(f.provider).toBe("open-meteo");
    expect(f.days).toHaveLength(3);
    expect(f.days[1]).toEqual({
      date: "2026-07-25",
      tempMaxC: 33.0,
      tempMinC: 16.4,
      precipMm: 2.4,
      weatherCode: 61,
    });
  });

  it("sets valid period and observedAt for provenance", () => {
    const f = normalizeOpenMeteo(sample, "2026-07-24T12:00:00Z");
    expect(f.observedAt).toBe("2026-07-24T12:00:00Z");
    expect(f.validFrom).toBe("2026-07-24");
    expect(f.validTo).toBe("2026-07-26");
  });

  it("throws on a malformed response", () => {
    expect(() => normalizeOpenMeteo({ daily: {} }, "2026-07-24T12:00:00Z")).toThrow();
  });
});
