import type { NormalizedForecast } from "@/platform/forecasts/openMeteo";

/** WMO weather-code → short label (only what the code encodes; no embellishment). */
function weatherLabel(code: number): string {
  if (code === 0) return "Clear";
  if (code <= 3) return "Partly cloudy";
  if (code <= 48) return "Fog";
  if (code <= 67) return "Rain";
  if (code <= 77) return "Snow";
  if (code <= 82) return "Showers";
  if (code <= 99) return "Thunderstorm";
  return "—";
}

/**
 * Forecast card. States provider, generated time, and valid period, and is
 * explicitly NOT an on-trail observation or safety advice (PRD Safety/Dynamic
 * Information). Only rendered when a fresh (non-expired) snapshot exists — the
 * page omits it entirely otherwise, never showing stale weather.
 */
export function ForecastCard({ forecast }: { forecast: NormalizedForecast }) {
  return (
    <section className="mt-10">
      <h2 className="mb-3 text-lg font-semibold">Weather outlook</h2>
      <div className="rounded-xl border border-border p-4">
        <div className="grid grid-cols-3 gap-3">
          {forecast.days.map((d) => (
            <div key={d.date} className="text-center">
              <div className="text-xs text-muted-foreground">
                {new Date(d.date).toLocaleDateString(undefined, {
                  weekday: "short",
                })}
              </div>
              <div className="mt-1 text-sm font-medium">
                {Math.round(d.tempMaxC)}° / {Math.round(d.tempMinC)}°C
              </div>
              <div className="text-xs text-muted-foreground">
                {weatherLabel(d.weatherCode)}
              </div>
            </div>
          ))}
        </div>
        <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
          Source: {forecast.provider}. Generated{" "}
          {new Date(forecast.observedAt).toLocaleString()}; valid{" "}
          {forecast.validFrom}–{forecast.validTo}. A general area outlook — not an
          on-trail observation or safety advice. Always check current conditions
          with the land manager.
        </p>
      </div>
    </section>
  );
}
