"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/shared/maplibre"; // self-hosted worker URL (must run before map creation)
import { cn } from "@/lib/utils";
import type { DestinationCard } from "@/shared/types/content";
import { formatBudget, formatDifficulty } from "@/shared/utils/format";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const TILE_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
  : "https://demotiles.maplibre.org/style.json";

/**
 * Explore split view: a scrollable destination list beside a map with a pin per
 * destination (the Airbnb/Kayak discovery pattern). Hovering a list card
 * highlights its pin, and hovering a pin highlights its card — both driven by a
 * shared `hoveredSlug`. Clicking either goes to the destination.
 */
export function ExploreMapView({
  destinations,
}: {
  destinations: DestinationCard[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  // slug → the inner pin element (scaled on hover; the outer marker element keeps
  // MapLibre's positioning transform untouched).
  const markersRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [failed, setFailed] = useState(false);
  const [hoveredSlug, setHoveredSlug] = useState<string | null>(null);

  const pinned = destinations.filter((d) => d.location !== null);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const markers = markersRef.current;
    const fail = () => {
      if (!cancelled) setFailed(true);
    };

    try {
      const bounds =
        pinned.length > 0
          ? pinned.reduce(
              (b, d) => b.extend([d.location!.lng, d.location!.lat]),
              new LngLatBounds(
                [pinned[0].location!.lng, pinned[0].location!.lat],
                [pinned[0].location!.lng, pinned[0].location!.lat],
              ),
            )
          : null;

      map = new MapLibreMap({
        container: containerRef.current,
        style: TILE_STYLE_URL,
        center: [-98.35, 39.5],
        zoom: 3.5,
        attributionControl: { compact: true },
      });

      map.on("error", fail);
      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        if (!map || cancelled) return;

        if (bounds && pinned.length > 1) {
          map.fitBounds(bounds, {
            padding: { top: 60, right: 60, bottom: 60, left: 60 },
            maxZoom: 8,
            duration: 0,
          });
        } else if (pinned.length === 1) {
          map.setCenter([pinned[0].location!.lng, pinned[0].location!.lat]);
          map.setZoom(8);
        }

        for (const dest of pinned) {
          const { location, name, slug, difficulty, budgetCurrency, budgetLowUsd, budgetHighUsd } = dest;
          if (!location) continue;

          const popup = new Popup({ offset: 32, closeButton: false, maxWidth: "240px" }).setHTML(
            `<div style="font-family:inherit;padding:2px 0;">
              <div style="font-weight:600;font-size:13px;margin-bottom:4px;">${escapeHtml(name)}</div>
              <div style="font-size:12px;color:#666;margin-bottom:8px;">
                ${formatDifficulty(difficulty)} · ${formatBudget(budgetCurrency, budgetLowUsd, budgetHighUsd)}
              </div>
              <a href="/destinations/${encodeURIComponent(slug)}"
                 style="display:inline-block;font-size:12px;font-weight:500;color:#e05d2a;text-decoration:none;">
                View destination →
              </a>
            </div>`,
          );

          // Scale the INNER pin on hover (never the outer element MapLibre
          // positions). Hovering a pin also drives the shared hover state so the
          // matching list card highlights.
          const el = document.createElement("div");
          el.style.cursor = "pointer";
          const pin = document.createElement("div");
          pin.style.cssText = `
            width: 26px; height: 26px; border-radius: 50%;
            background: #e05d2a; border: 3px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            transition: transform 0.15s, background 0.15s;
          `;
          el.appendChild(pin);
          el.addEventListener("mouseenter", () => setHoveredSlug(slug));
          el.addEventListener("mouseleave", () => setHoveredSlug(null));
          markers.set(slug, pin);

          new Marker({ element: el }).setLngLat([location.lng, location.lat]).setPopup(popup).addTo(map!);
        }
      });
    } catch {
      queueMicrotask(fail);
    }

    return () => {
      cancelled = true;
      map?.remove();
      markers.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned.length]);

  // Highlight the hovered pin (imperative — no map re-init).
  useEffect(() => {
    for (const [slug, pin] of markersRef.current) {
      highlightPin(pin, slug === hoveredSlug);
    }
  }, [hoveredSlug]);

  if (pinned.length === 0) {
    return (
      <div className="flex h-[400px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
        No destinations with location data to show on map.
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
      {/* List (below the map on mobile, left of it on desktop) */}
      <ul className="order-2 max-h-[380px] space-y-2 overflow-y-auto pr-1 lg:order-1 lg:max-h-[600px]">
        {pinned.map((d) => (
          <li key={d.id}>
            <Link
              href={`/destinations/${d.slug}`}
              onMouseEnter={() => setHoveredSlug(d.slug)}
              onMouseLeave={() => setHoveredSlug(null)}
              className={cn(
                "flex gap-3 rounded-xl border p-2 transition-colors",
                hoveredSlug === d.slug
                  ? "border-brand bg-secondary"
                  : "border-border hover:bg-secondary",
              )}
            >
              <div
                className="h-16 w-24 shrink-0 rounded-lg bg-secondary bg-cover bg-center"
                style={
                  d.heroImageUrl
                    ? { backgroundImage: `url(${JSON.stringify(d.heroImageUrl)})` }
                    : undefined
                }
              />
              <div className="min-w-0 py-0.5">
                <div className="truncate text-sm font-semibold">{d.name}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {formatDifficulty(d.difficulty)} ·{" "}
                  {formatBudget(d.budgetCurrency, d.budgetLowUsd, d.budgetHighUsd)}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>

      {/* Map (on top on mobile, right + sticky on desktop) */}
      <div className="order-1 h-fit lg:order-2 lg:sticky lg:top-4">
        {failed ? (
          <div className="flex h-[400px] items-center justify-center rounded-xl border border-border bg-secondary text-sm text-muted-foreground lg:h-[600px]">
            Map unavailable — the list still works.
          </div>
        ) : (
          <div
            ref={containerRef}
            className="h-[400px] w-full overflow-hidden rounded-xl border border-border lg:h-[600px]"
          />
        )}
      </div>
    </div>
  );
}

/** Scale + raise a pin when its list card is hovered (and vice versa). */
function highlightPin(pin: HTMLDivElement, on: boolean): void {
  pin.style.transform = on ? "scale(1.45)" : "scale(1)";
  pin.style.background = on ? "#c2410c" : "#e05d2a";
  const el = pin.parentElement;
  if (el) el.style.zIndex = on ? "2" : "";
}

/** Minimal HTML escaping to prevent XSS in popup HTML from destination names. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
