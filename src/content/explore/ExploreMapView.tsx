"use client";

import { useEffect, useRef, useState } from "react";
import {
  LngLatBounds,
  Map as MapLibreMap,
  Marker,
  NavigationControl,
  Popup,
} from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "@/shared/maplibre"; // self-hosted worker URL (must run before map creation)
import type { DestinationCard } from "@/shared/types/content";
import { formatBudget, formatDifficulty } from "@/shared/utils/format";

const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const TILE_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
  : "https://demotiles.maplibre.org/style.json";

/**
 * Explore-level destination map: shows a pin per published destination.
 * Clicking a pin navigates to the destination detail page.
 * This is the "where should I go?" discovery interface (Skyscanner Explore model).
 */
export function ExploreMapView({
  destinations,
}: {
  destinations: DestinationCard[];
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  const pinned = destinations.filter((d) => d.location !== null);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const fail = () => {
      if (!cancelled) setFailed(true);
    };

    try {
      // Start view: if there are pins, compute bounds; otherwise show continental US.
      const initialCenter: [number, number] = [-98.35, 39.5];
      const initialZoom = 3.5;

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
        center: initialCenter,
        zoom: initialZoom,
        attributionControl: { compact: true },
      });

      map.on("error", fail);
      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        if (!map || cancelled) return;

        // Fit to all pins if any exist.
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

        // Place one marker per destination.
        for (const dest of pinned) {
          const { location, name, slug, difficulty, budgetCurrency, budgetLowUsd, budgetHighUsd } = dest;
          if (!location) continue;

          const popup = new Popup({
            offset: 32,
            closeButton: false,
            maxWidth: "240px",
          }).setHTML(
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

          const el = document.createElement("div");
          el.style.cssText = `
            width: 28px; height: 28px; border-radius: 50%;
            background: #e05d2a; border: 3px solid #fff;
            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
            cursor: pointer; transition: transform 0.15s;
          `;
          el.addEventListener("mouseenter", () => {
            el.style.transform = "scale(1.2)";
          });
          el.addEventListener("mouseleave", () => {
            el.style.transform = "scale(1)";
          });

          new Marker({ element: el })
            .setLngLat([location.lng, location.lat])
            .setPopup(popup)
            .addTo(map!);
        }
      });
    } catch {
      queueMicrotask(fail);
    }

    return () => {
      cancelled = true;
      map?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinned.length]);

  if (pinned.length === 0) {
    return (
      <div className="flex h-[580px] items-center justify-center rounded-xl border border-dashed border-border bg-secondary/30 text-sm text-muted-foreground">
        No destinations with location data to show on map.
      </div>
    );
  }

  if (failed) {
    return (
      <div className="flex h-[580px] items-center justify-center rounded-xl border border-border bg-secondary text-sm text-muted-foreground">
        Map unavailable.
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="h-[580px] w-full overflow-hidden rounded-xl border border-border"
    />
  );
}

/** Minimal HTML escaping to prevent XSS in popup HTML from destination names. */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
