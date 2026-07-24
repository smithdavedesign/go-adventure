/**
 * Trail elevation gain via the Open-Meteo Elevation API (batch, keyless — up to
 * 100 points per request; backed by the Copernicus DEM). We already use
 * Open-Meteo for weather, so this reuses that dependency rather than USGS EPQS,
 * which is one-point-per-request and far too slow across ~140 trails.
 *
 * `cumulativeGainFt` is pure/testable; `fetchElevationGainFt` does the network.
 */
const OPEN_METEO_ELEVATION = "https://api.open-meteo.com/v1/elevation";
const METERS_TO_FEET = 3.28084;

/** Evenly sample up to `maxSamples` points along a [lng,lat] route. */
export function sampleRoute(
  points: [number, number][],
  maxSamples = 40,
): [number, number][] {
  if (points.length <= maxSamples) return points;
  const step = (points.length - 1) / (maxSamples - 1);
  const out: [number, number][] = [];
  for (let i = 0; i < maxSamples; i++) out.push(points[Math.round(i * step)]);
  return out;
}

/** Sum of positive elevation deltas (meters) → feet. Pure. */
export function cumulativeGainFt(elevationsMeters: number[]): number {
  let gain = 0;
  for (let i = 1; i < elevationsMeters.length; i++) {
    const d = elevationsMeters[i] - elevationsMeters[i - 1];
    if (d > 0) gain += d;
  }
  return Math.round(gain * METERS_TO_FEET);
}

export async function fetchElevationGainFt(
  routePoints: [number, number][],
): Promise<number> {
  const sample = sampleRoute(routePoints);
  const lats = sample.map(([, lat]) => lat).join(",");
  const lngs = sample.map(([lng]) => lng).join(",");
  const res = await fetch(
    `${OPEN_METEO_ELEVATION}?latitude=${lats}&longitude=${lngs}`,
  );
  if (!res.ok) throw new Error(`Open-Meteo elevation responded ${res.status}`);
  const json = (await res.json()) as { elevation?: number[] };
  if (!json.elevation?.length) return 0;
  return cumulativeGainFt(json.elevation);
}

/** Naismith's rule: 1h per 3 miles + 1h per 2000 ft of ascent. */
export function estimateDurationHours(
  distanceMiles: number,
  elevationGainFt: number,
): number {
  const hours = distanceMiles / 3 + elevationGainFt / 2000;
  return Math.round(hours * 10) / 10;
}
