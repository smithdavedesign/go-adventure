import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTrailBySlug, getTrailMetadataBySlug } from "@/content/trails/queries";
import { DestinationMap } from "@/content/destinations/DestinationMap";
import { SafetyDisclosure } from "@/content/SafetyDisclosure";
import { Badge } from "@/shared/ui/badge";
import { formatDifficulty } from "@/shared/utils/format";

// ISR: trail pages are pure published content (no per-user or safety-critical
// live data), so each is generated on first request and then served from cache,
// revalidated hourly. We deliberately do NOT prerender the whole set at build:
// there are 100+ trails and the build DB is the Supabase pooler (small client
// limit), so a parallel build-time prerender storm exhausts it. On-demand
// generation spreads that load across real traffic instead, with the same cache
// benefit. New/edited trails appear on first request or the next revalidation.
export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

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
    destinations,
  } = trail;

  // Center the map on the route's first vertex when geometry exists.
  const center =
    route && route[0]?.[0]
      ? { lng: route[0][0][0], lat: route[0][0][1] }
      : null;

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

      {center && (
        <section className="mt-8">
          <h2 className="mb-3 text-lg font-semibold">Route</h2>
          <DestinationMap
            center={center}
            routes={route ? [{ name, route }] : []}
            destinationName={name}
            className="h-[420px] w-full"
          />
        </section>
      )}

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
