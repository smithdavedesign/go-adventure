/**
 * Open-Meteo forecast client + normalizer.
 *
 * Weather is dynamic data: it is an expiring, attributable snapshot, never a
 * permanent field, and never presented as an on-trail observation or safety
 * advice (PRD Safety/Dynamic Information). `normalizeOpenMeteo` is pure and
 * fixture-tested; `fetchForecast` hits the public API.
 *
 * Open-Meteo is keyless for non-commercial use; a commercial plan is required
 * for production commercial use (parked — see docs/DEPENDENCIES.md / ADR-0010).
 */
import { z } from "zod";

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

export const PROVIDER = "open-meteo" as const;

export type ForecastDay = {
  date: string;
  tempMaxC: number;
  tempMinC: number;
  precipMm: number;
  weatherCode: number;
};

export type NormalizedForecast = {
  provider: typeof PROVIDER;
  /** When the provider generated this data. */
  observedAt: string;
  validFrom: string;
  validTo: string;
  days: ForecastDay[];
};

const openMeteoResponseSchema = z.object({
  daily: z.object({
    time: z.array(z.string()).min(1),
    temperature_2m_max: z.array(z.number()),
    temperature_2m_min: z.array(z.number()),
    precipitation_sum: z.array(z.number()),
    weather_code: z.array(z.number()),
  }),
});

/** Pure: map an Open-Meteo response to our snapshot shape. `observedAtIso` injectable. */
export function normalizeOpenMeteo(
  raw: unknown,
  observedAtIso: string,
): NormalizedForecast {
  const parsed = openMeteoResponseSchema.parse(raw);
  const d = parsed.daily;
  const days: ForecastDay[] = d.time.map((date, i) => ({
    date,
    tempMaxC: d.temperature_2m_max[i],
    tempMinC: d.temperature_2m_min[i],
    precipMm: d.precipitation_sum[i],
    weatherCode: d.weather_code[i],
  }));
  return {
    provider: PROVIDER,
    observedAt: observedAtIso,
    validFrom: days[0]?.date ?? observedAtIso,
    validTo: days[days.length - 1]?.date ?? observedAtIso,
    days,
  };
}

export async function fetchForecast(
  lat: number,
  lng: number,
  observedAtIso: string,
): Promise<NormalizedForecast> {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    daily: "temperature_2m_max,temperature_2m_min,precipitation_sum,weather_code",
    forecast_days: "3",
    timezone: "auto",
  });
  const res = await fetch(`${OPEN_METEO_BASE}?${params.toString()}`);
  if (!res.ok) throw new Error(`Open-Meteo responded ${res.status}`);
  return normalizeOpenMeteo(await res.json(), observedAtIso);
}
