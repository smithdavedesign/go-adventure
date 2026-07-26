"use client";

import { useMemo, useState } from "react";
import { DestinationMap } from "@/content/destinations/DestinationMap";
import { ElevationChart } from "./ElevationChart";
import type { Coordinates, ElevationPoint } from "@/shared/types/content";

/**
 * Elevation profile + route map with a shared hover position (AllTrails-style):
 * scrubbing the chart moves a marker along the trail on the map (L2), and
 * hovering the route on the map highlights that spot on the chart (L3). Both
 * directions flow through one `hoverIndex`.
 */
export function TrailRouteAndProfile({
  name,
  center,
  route,
  elevationProfile,
  gainFt,
  distanceMiles,
}: {
  name: string;
  center: Coordinates;
  route: [number, number][][];
  elevationProfile: ElevationPoint[];
  gainFt: number;
  distanceMiles: number;
}) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  // Memoized so a hover re-render doesn't hand DestinationMap fresh arrays and
  // force it to tear down + rebuild the map.
  const mapRoutes = useMemo(() => [{ name, route }], [name, route]);
  const hoverCoords = useMemo(
    () => elevationProfile.map((p) => ({ lng: p.lng, lat: p.lat })),
    [elevationProfile],
  );

  const hp = hoverIndex != null ? elevationProfile[hoverIndex] : null;

  return (
    <>
      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Elevation profile</h2>
        <ElevationChart
          points={elevationProfile}
          gainFt={gainFt}
          distanceMiles={distanceMiles}
          hoverIndex={hoverIndex}
          onHover={setHoverIndex}
        />
      </section>

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-semibold">Route</h2>
        <DestinationMap
          center={center}
          routes={mapRoutes}
          destinationName={name}
          hoverPoint={hp ? { lng: hp.lng, lat: hp.lat } : null}
          hoverPoints={hoverCoords}
          onHoverPointChange={setHoverIndex}
          className="h-[420px] w-full"
        />
      </section>
    </>
  );
}
