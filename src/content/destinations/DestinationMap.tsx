"use client";

import { useEffect, useRef, useState } from "react";
import { Map as MapLibreMap, Marker, NavigationControl } from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import type { Coordinates } from "@/shared/types/content";

/**
 * Destination map (progressive enhancement).
 *
 * MapLibre GL is the renderer only. The tile source below is MapLibre's public
 * DEMO style — a local-dev placeholder, NOT a production tile provider. Picking
 * the real provider (with attribution, volume limits, and fallback) is
 * docs/adr/0005-map-tile-provider.md, still open.
 *
 * Graceful degradation is a hard PRD requirement: a map failure must never block
 * reading or saving a destination. Any init error is caught and replaced with a
 * static fallback; the surrounding page renders fully without this component.
 */

const DEMO_STYLE_URL = "https://demotiles.maplibre.org/style.json";

type TrailRoute = { name: string; route: [number, number][][] };

export function DestinationMap({
  center,
  routes,
  className,
}: {
  center: Coordinates;
  routes: TrailRoute[];
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const fail = () => {
      if (!cancelled) setFailed(true);
    };

    try {
      map = new MapLibreMap({
        container: containerRef.current,
        style: DEMO_STYLE_URL,
        center: [center.lng, center.lat],
        zoom: 9,
        attributionControl: { compact: true },
      });

      // If the style/tiles fail to load (offline, demo server down), fall back
      // rather than showing a broken grey box. This is an event callback, so
      // the state update here is outside the effect body.
      map.on("error", fail);

      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        if (!map) return;

        new Marker({ color: "#2f855a" })
          .setLngLat([center.lng, center.lat])
          .addTo(map);

        // Trail routes as one GeoJSON line layer.
        const features = routes
          .filter((r) => r.route && r.route.length > 0)
          .map((r) => ({
            type: "Feature" as const,
            properties: { name: r.name },
            geometry: { type: "MultiLineString" as const, coordinates: r.route },
          }));

        if (features.length > 0) {
          map.addSource("trails", {
            type: "geojson",
            data: { type: "FeatureCollection", features },
          });
          map.addLayer({
            id: "trails-line",
            type: "line",
            source: "trails",
            paint: {
              "line-color": "#2f855a",
              "line-width": 3,
              "line-opacity": 0.85,
            },
          });
        }
      });
    } catch {
      // Synchronous init failure (e.g. WebGL unavailable). Defer the state
      // update out of the effect body so it doesn't trigger a cascading render.
      queueMicrotask(fail);
    }

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [center, routes]);

  if (failed) {
    return (
      <div
        className={
          "flex items-center justify-center rounded-xl border border-border bg-secondary text-sm text-muted-foreground " +
          (className ?? "")
        }
      >
        Map unavailable — {center.lat.toFixed(3)}, {center.lng.toFixed(3)}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={"overflow-hidden rounded-xl border border-border " + (className ?? "")}
    />
  );
}
