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
import type { Coordinates, MultiPolygonCoords } from "@/shared/types/content";

/**
 * Destination map (progressive enhancement).
 *
 * MapLibre GL is the renderer only. The tile source below is MapLibre's public
 * DEMO style only when no key is configured in local dev.
 *
 * Graceful degradation is a hard PRD requirement: a map failure must never block
 * reading or saving a destination. Any init error is caught and replaced with a
 * static fallback; the surrounding page renders fully without this component.
 */

// MapTiler Outdoor style — proper production tiles. Falls back to the MapLibre
// demo style if NEXT_PUBLIC_MAPTILER_KEY is not set (local dev without a key).
const MAPTILER_KEY = process.env.NEXT_PUBLIC_MAPTILER_KEY;
const TILE_STYLE_URL = MAPTILER_KEY
  ? `https://api.maptiler.com/maps/outdoor-v2/style.json?key=${MAPTILER_KEY}`
  : "https://demotiles.maplibre.org/style.json";

type TrailRoute = { name: string; route: [number, number][][] };

function buildInitialBounds(
  center: Coordinates,
  routes: TrailRoute[],
  area?: MultiPolygonCoords | null,
): LngLatBounds {
  const bounds = new LngLatBounds([center.lng, center.lat], [center.lng, center.lat]);

  for (const route of routes) {
    for (const line of route.route) {
      for (const point of line) {
        bounds.extend(point);
      }
    }
  }

  if (area) {
    for (const polygon of area) {
      for (const ring of polygon) {
        for (const point of ring) {
          bounds.extend(point);
        }
      }
    }
  }

  return bounds;
}

export function DestinationMap({
  center,
  routes,
  area,
  destinationName,
  hoveredTrailName,
  hoverPoint,
  hoverPoints,
  onHoverPointChange,
  className,
}: {
  center: Coordinates;
  routes: TrailRoute[];
  area?: MultiPolygonCoords | null;
  /** If supplied, shown in a popup on the destination marker. */
  destinationName?: string;
  /** Trail name to highlight on the map (route line brightens). */
  hoveredTrailName?: string | null;
  /** Position of a moving "cursor" marker on the route (synced to the elevation
   *  chart). null hides it. */
  hoverPoint?: { lng: number; lat: number } | null;
  /** Route points to detect on map-hover (drives the reverse chart sync). */
  hoverPoints?: { lng: number; lat: number }[];
  /** Fires with the nearest route-point index while hovering the map, or null. */
  onHoverPointChange?: (index: number | null) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<MapLibreMap | null>(null);
  const initialBoundsRef = useRef<LngLatBounds | null>(null);
  const hoverMarkerRef = useRef<Marker | null>(null);
  // Latest hover inputs, read by the map's persistent mousemove handler without
  // re-initialising the map.
  const hoverPointsRef = useRef(hoverPoints);
  const onHoverChangeRef = useRef(onHoverPointChange);
  useEffect(() => {
    hoverPointsRef.current = hoverPoints;
    onHoverChangeRef.current = onHoverPointChange;
  }, [hoverPoints, onHoverPointChange]);
  const [failed, setFailed] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    if (!containerRef.current) return;
    let map: MapLibreMap | undefined;
    let cancelled = false;
    const fail = () => {
      if (!cancelled) setFailed(true);
    };

    try {
      const initialBounds = buildInitialBounds(center, routes, area);
      initialBoundsRef.current = initialBounds;

      const hasRouteOrArea = routes.length > 0 || !!area;
      map = new MapLibreMap({
        container: containerRef.current,
        style: TILE_STYLE_URL,
        center: [center.lng, center.lat],
        zoom: hasRouteOrArea ? 9 : 11,
        attributionControl: { compact: true },
      });
      mapRef.current = map;

      // If the style/tiles fail to load (offline, demo server down), fall back
      // rather than showing a broken grey box. This is an event callback, so
      // the state update here is outside the effect body.
      map.on("error", fail);

      map.addControl(new NavigationControl(), "top-right");

      map.on("load", () => {
        if (!map) return;
        setMapLoaded(true);

        new Marker({ color: "#e05d2a" })
          .setLngLat([center.lng, center.lat])
          .setPopup(
            new Popup({ offset: 28, closeButton: false }).setText(
              destinationName ?? "",
            ),
          )
          .addTo(map);

        if (area) {
          map.addSource("destination-area", {
            type: "geojson",
            data: {
              type: "FeatureCollection",
              features: [
                {
                  type: "Feature",
                  properties: {},
                  geometry: {
                    type: "MultiPolygon",
                    coordinates: area,
                  },
                },
              ],
            },
          });

          map.addLayer({
            id: "destination-area-fill",
            type: "fill",
            source: "destination-area",
            paint: {
              "fill-color": "#2f855a",
              "fill-opacity": 0.08,
            },
          });

          map.addLayer({
            id: "destination-area-outline",
            type: "line",
            source: "destination-area",
            paint: {
              "line-color": "#2f855a",
              "line-width": 2,
              "line-opacity": 0.7,
            },
          });
        }

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

          // White casing below the colored line — essential for contrast on
          // the outdoor basemap which already shows trails in similar greens.
          map.addLayer({
            id: "trails-casing",
            type: "line",
            source: "trails",
            paint: {
              "line-color": "#ffffff",
              "line-width": 7,
              "line-opacity": 0.85,
            },
          });

          map.addLayer({
            id: "trails-line",
            type: "line",
            source: "trails",
            paint: {
              "line-color": "#e05d2a",
              "line-width": 4,
              "line-opacity": 1,
            },
          });
        }

        // A moving "elevation cursor" marker, hidden until a hover position is
        // set (by the chart, or by hovering the route below).
        const hoverEl = document.createElement("div");
        hoverEl.style.cssText =
          "width:16px;height:16px;border-radius:50%;background:#c2410c;border:3px solid #fff;box-shadow:0 0 0 3px rgba(194,65,12,0.3);display:none;";
        hoverMarkerRef.current = new Marker({ element: hoverEl })
          .setLngLat([center.lng, center.lat])
          .addTo(map);

        // L3 (reverse sync): hovering the map near the route reports the nearest
        // route-point index so the chart can highlight it. Uses refs for the
        // latest points/callback so the handler needn't be re-bound.
        map.on("mousemove", (e) => {
          const pts = hoverPointsRef.current;
          const cb = onHoverChangeRef.current;
          if (!map || !cb || !pts?.length) return;
          let best = -1;
          let bestDist = 18; // px hit radius near the line
          for (let i = 0; i < pts.length; i++) {
            const px = map.project([pts[i].lng, pts[i].lat]);
            const dist = Math.hypot(px.x - e.point.x, px.y - e.point.y);
            if (dist < bestDist) {
              bestDist = dist;
              best = i;
            }
          }
          cb(best >= 0 ? best : null);
        });
        map.on("mouseout", () => onHoverChangeRef.current?.(null));

        map.fitBounds(initialBounds, {
          padding: { top: 48, right: 48, bottom: 48, left: 48 },
          maxZoom: 12,
          duration: 0,
        });
      });
    } catch {
      // Synchronous init failure (e.g. WebGL unavailable). Defer the state
      // update out of the effect body so it doesn't trigger a cascading render.
      queueMicrotask(fail);
    }

    return () => {
      cancelled = true;
      map?.remove();
      mapRef.current = null;
      hoverMarkerRef.current = null;
    };
  }, [area, center, routes, destinationName]);

  // Highlight the hovered trail route imperatively (no map re-init).
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapLoaded) return;
    if (!map.getLayer("trails-line")) return;

    if (hoveredTrailName) {
      map.setPaintProperty("trails-casing", "line-width", [
        "case",
        ["==", ["get", "name"], hoveredTrailName],
        10,
        7,
      ]);
      map.setPaintProperty("trails-line", "line-color", [
        "case",
        ["==", ["get", "name"], hoveredTrailName],
        "#ff4500",
        "#e05d2a",
      ]);
      map.setPaintProperty("trails-line", "line-width", [
        "case",
        ["==", ["get", "name"], hoveredTrailName],
        6,
        4,
      ]);
    } else {
      map.setPaintProperty("trails-casing", "line-width", 7);
      map.setPaintProperty("trails-line", "line-color", "#e05d2a");
      map.setPaintProperty("trails-line", "line-width", 4);
    }
  }, [hoveredTrailName, mapLoaded]);

  // Move/show the elevation-cursor marker as the shared hover position changes.
  useEffect(() => {
    const marker = hoverMarkerRef.current;
    if (!marker || !mapLoaded) return;
    const el = marker.getElement();
    if (hoverPoint) {
      marker.setLngLat([hoverPoint.lng, hoverPoint.lat]);
      el.style.display = "";
    } else {
      el.style.display = "none";
    }
  }, [hoverPoint, mapLoaded]);

  const resetView = () => {
    const map = mapRef.current;
    const bounds = initialBoundsRef.current;
    if (!map || !bounds) return;
    map.fitBounds(bounds, {
      padding: { top: 48, right: 48, bottom: 48, left: 48 },
      maxZoom: 12,
      duration: 350,
    });
  };

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
    <div className="relative">
      <div
        ref={containerRef}
        className={"overflow-hidden rounded-xl border border-border " + (className ?? "")}
      />
      <button
        type="button"
        onClick={resetView}
        className="absolute left-3 top-3 rounded-md border border-border bg-background/95 px-2.5 py-1.5 text-xs font-medium text-foreground shadow-sm backdrop-blur hover:bg-background"
      >
        Reset view
      </button>
    </div>
  );
}
