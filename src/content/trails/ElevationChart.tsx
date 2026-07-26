import type { ElevationPoint } from "@/shared/types/content";

/**
 * Elevation profile chart for a trail — inline SVG (CSP-safe, no chart library).
 * Descriptive only: it helps gauge the effort, not navigate. Elevation on the y
 * axis, cumulative distance on the x axis.
 */
export function ElevationChart({
  profile,
  gainFt,
  distanceMiles,
}: {
  profile: ElevationPoint[];
  gainFt: number;
  distanceMiles: number;
}) {
  const W = 800;
  const H = 200;
  const padL = 46;
  const padR = 12;
  const padT = 12;
  const padB = 26;

  const maxD = Math.max(distanceMiles || 0, ...profile.map((p) => p.d)) || 1;
  const elevs = profile.map((p) => p.e);
  const minE = Math.min(...elevs);
  let maxE = Math.max(...elevs);
  if (maxE - minE < 1) maxE = minE + 1; // avoid a zero-height (flat) range

  const x = (d: number) => padL + (d / maxD) * (W - padL - padR);
  const y = (e: number) =>
    padT + (1 - (e - minE) / (maxE - minE)) * (H - padT - padB);

  const line = profile
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.d).toFixed(1)},${y(p.e).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(maxD).toFixed(1)},${(H - padB).toFixed(1)} L${x(0).toFixed(
    1,
  )},${(H - padB).toFixed(1)} Z`;

  const ft = (n: number) => Math.round(n).toLocaleString();

  return (
    <figure className="rounded-xl border border-border p-3">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="img"
        aria-label={`Elevation profile from ${ft(minE)} to ${ft(
          maxE,
        )} feet over ${distanceMiles} miles, ${ft(gainFt)} feet of total gain.`}
      >
        {/* baseline */}
        <line
          x1={padL}
          y1={H - padB}
          x2={W - padR}
          y2={H - padB}
          className="stroke-border"
          strokeWidth={1}
        />
        <path d={area} className="fill-brand/10" />
        <path d={line} fill="none" className="stroke-brand" strokeWidth={2} />
        <text x={6} y={y(maxE) + 9} className="fill-muted-foreground text-[11px]">
          {ft(maxE)} ft
        </text>
        <text x={6} y={y(minE)} className="fill-muted-foreground text-[11px]">
          {ft(minE)} ft
        </text>
        <text x={padL} y={H - 8} className="fill-muted-foreground text-[11px]">
          0 mi
        </text>
        <text
          x={W - padR}
          y={H - 8}
          textAnchor="end"
          className="fill-muted-foreground text-[11px]"
        >
          {distanceMiles} mi
        </text>
      </svg>
      <figcaption className="mt-1 text-xs text-muted-foreground">
        {ft(gainFt)} ft total gain · ranges {ft(minE)}–{ft(maxE)} ft. Sampled
        elevation (Open-Meteo); approximate.
      </figcaption>
    </figure>
  );
}
