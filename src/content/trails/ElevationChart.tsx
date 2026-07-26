"use client";

import { useRef } from "react";
import type { ElevationPoint } from "@/shared/types/content";

/**
 * Interactive elevation profile (AllTrails-style). Hover or drag across the
 * chart to read distance + elevation at that spot; the parent shares a
 * `hoverIndex` so the same point can be marked on the map (and vice versa).
 * Inline SVG — CSP-safe, no chart library.
 */
export function ElevationChart({
  points,
  gainFt,
  distanceMiles,
  hoverIndex,
  onHover,
}: {
  points: ElevationPoint[];
  gainFt: number;
  distanceMiles: number;
  hoverIndex: number | null;
  onHover: (index: number | null) => void;
}) {
  const svgRef = useRef<SVGSVGElement>(null);

  const W = 800;
  const H = 200;
  const padL = 46;
  const padR = 12;
  const padT = 12;
  const padB = 26;

  const maxD = Math.max(distanceMiles || 0, ...points.map((p) => p.d)) || 1;
  const elevs = points.map((p) => p.e);
  const minE = Math.min(...elevs);
  let maxE = Math.max(...elevs);
  if (maxE - minE < 1) maxE = minE + 1;

  const x = (d: number) => padL + (d / maxD) * (W - padL - padR);
  const y = (e: number) =>
    padT + (1 - (e - minE) / (maxE - minE)) * (H - padT - padB);

  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${x(p.d).toFixed(1)},${y(p.e).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${x(maxD).toFixed(1)},${(H - padB).toFixed(1)} L${x(0).toFixed(
    1,
  )},${(H - padB).toFixed(1)} Z`;
  const ft = (n: number) => Math.round(n).toLocaleString();

  function pointerToIndex(clientX: number) {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const frac = Math.min(
      1,
      Math.max(0, ((clientX - rect.left) / rect.width) * W - padL) / (W - padL - padR),
    );
    const targetD = frac * maxD;
    let best = 0;
    let bestDiff = Infinity;
    for (let i = 0; i < points.length; i++) {
      const diff = Math.abs(points[i].d - targetD);
      if (diff < bestDiff) {
        bestDiff = diff;
        best = i;
      }
    }
    onHover(best);
  }

  const hp = hoverIndex != null ? points[hoverIndex] : null;
  const leftPct = hp ? (x(hp.d) / W) * 100 : 0;

  return (
    <figure className="rounded-xl border border-border p-3">
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${W} ${H}`}
          className="w-full"
          style={{ touchAction: "pan-y" }}
          role="img"
          aria-label={`Elevation profile from ${ft(minE)} to ${ft(
            maxE,
          )} feet over ${distanceMiles} miles, ${ft(gainFt)} feet of total gain.`}
          onPointerMove={(e) => pointerToIndex(e.clientX)}
          onPointerDown={(e) => pointerToIndex(e.clientX)}
          onPointerLeave={() => onHover(null)}
        >
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

          {hp && (
            <>
              <line
                x1={x(hp.d)}
                y1={padT}
                x2={x(hp.d)}
                y2={H - padB}
                className="stroke-brand/50"
                strokeWidth={1}
              />
              <circle
                cx={x(hp.d)}
                cy={y(hp.e)}
                r={4.5}
                className="fill-brand stroke-background"
                strokeWidth={2}
              />
            </>
          )}

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

        {hp && (
          <div
            className="pointer-events-none absolute top-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-background px-2 py-1 text-xs shadow-sm"
            style={{ left: `${Math.min(90, Math.max(10, leftPct))}%` }}
          >
            <span className="font-medium text-foreground">{hp.d.toFixed(1)} mi</span>
            <span className="text-muted-foreground"> · {ft(hp.e)} ft</span>
          </div>
        )}
      </div>
      <figcaption className="mt-1 text-xs text-muted-foreground">
        {ft(gainFt)} ft total gain · ranges {ft(minE)}–{ft(maxE)} ft. Hover or drag
        to read any point. Sampled elevation (Open-Meteo); approximate.
      </figcaption>
    </figure>
  );
}
