import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrailBySlug, getTrailMetadataBySlug } from "@/content/trails/queries";
import { DestinationMap } from "@/content/destinations/DestinationMap";
import { TrailRouteAndProfile } from "@/content/trails/TrailRouteAndProfile";
import { ForecastCard } from "@/content/destinations/ForecastCard";
import { getFreshForecastNear } from "@/platform/forecasts/snapshots";
import { AlertBanner } from "@/content/destinations/AlertBanner";
import { getFreshAlertsNear } from "@/platform/alerts/snapshots";
import { SafetyDisclosure } from "@/content/SafetyDisclosure";
import { Badge } from "@/shared/ui/badge";
import { formatDifficulty } from "@/shared/utils/format";

// Dynamic (like the destination page): trail pages now carry live weather + NPS
// alerts near the trailhead, which must never be served stale from a cache.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const trail = await getTrailMetadataBySlug(slug);
  if (!trail) return { title: "Not found" };
  return { title: trail.name };
}

export default async function TrailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const trail = await getTrailBySlug(slug);
  if (!trail) notFound();

  const {
    name,
    distanceMiles,
    elevationGainFt,
    difficulty,
    durationHours,
    costUSD,
    tags,
    route,
    elevationProfile,
    destinations,
  } = trail;

  // Center the map on the route's first vertex when geometry exists.
  const center =
    route && route[0]?.[0]
      ? { lng: route[0][0][0], lat: route[0][0][1] }
      : null;

  // Fresh (non-expired) weather + official alerts near the trailhead. Never stale.
  const [forecast, alerts] = center
    ? await Promise.all([
        getFreshForecastNear(center.lat, center.lng),
        getFreshAlertsNear(center.lat, center.lng),
      ])
    : [null, null];

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      {destinations[0] && (
        <Link
          href={`/destinations/${destinations[0].slug}`}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← {destinations[0].name}
        </Link>
      )}

      <h1 className="mt-4 text-3xl font-semibold tracking-tight">{name}</h1>

      {/* Official alerts near the trailhead, high up — safety-forward. */}
      {alerts && (
        <div className="mt-4">
          <AlertBanner data={alerts} />
        </div>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
        <Fact label="Distance" value={`${distanceMiles} mi`} />
        <Fact label="Elevation gain" value={`${elevationGainFt.toLocaleString()} ft`} />
        <Fact label="Difficulty" value={formatDifficulty(difficulty)} />
        <Fact label="Duration" value={`~${durationHours} h`} />
        {costUSD != null && <Fact label="Cost" value={`$${costUSD}`} />}
      </dl>

      {tags.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <Badge key={t} variant="outline">
              {t}
            </Badge>
          ))}
        </div>
      )}

      {elevationProfile && center && route ? (
        // Interactive elevation profile + route map with shared hover (L1–L3).
        <TrailRouteAndProfile
          name={name}
          center={center}
          route={route}
          elevationProfile={elevationProfile}
          gainFt={elevationGainFt}
          distanceMiles={distanceMiles}
        />
      ) : (
        center && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Route</h2>
            <DestinationMap
              center={center}
              routes={route ? [{ name, route }] : []}
              destinationName={name}
              className="h-[420px] w-full"
            />
          </section>
        )
      )}

      {/* Weather outlook near the trailhead — only when a fresh snapshot exists. */}
      {forecast && <ForecastCard forecast={forecast} />}

      <div className="mt-8">
        <SafetyDisclosure />
      </div>
    </main>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
    </div>
  );
}
