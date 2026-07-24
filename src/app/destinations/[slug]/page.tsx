import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getDestinationBySlug } from "@/content/destinations/queries";
import { HeroPlaceholder } from "@/content/destinations/HeroPlaceholder";
import { DestinationMap } from "@/content/destinations/DestinationMap";
import { SafetyDisclosure } from "@/content/SafetyDisclosure";
import { ForecastCard } from "@/content/destinations/ForecastCard";
import { getFreshForecastNear } from "@/platform/forecasts/snapshots";
import { auth } from "@/user/auth/auth";
import { isSaved } from "@/user/saved/queries";
import { SaveControl } from "@/user/saved/SaveControl";
import { Badge } from "@/shared/ui/badge";
import {
  formatActivity,
  formatBestMonths,
  formatBudget,
  formatDifficulty,
  formatLabel,
  formatPermitType,
  formatTripLength,
} from "@/shared/utils/format";

export const dynamic = "force-dynamic"; // see note in app/page.tsx

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) return { title: "Not found" };
  return {
    title: destination.name,
    description: destination.summary ?? undefined,
  };
}

export default async function DestinationPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const destination = await getDestinationBySlug(slug);
  if (!destination) notFound();

  const session = await auth();
  const saved = session?.user?.id
    ? await isSaved(session.user.id, destination.id)
    : false;

  const {
    name,
    label,
    heroAlt,
    summary,
    activities,
    bestMonths,
    difficulty,
    tripLength,
    budgetCurrency,
    budgetLowUsd,
    budgetHighUsd,
    location,
    trails,
    permit,
    lastVerifiedAt,
  } = destination;

  const mapRoutes = trails
    .filter((t) => t.route)
    .map((t) => ({ name: t.name, route: t.route as [number, number][][] }));

  // Fresh (non-expired) forecast near the destination, if any. Never stale.
  const forecast = location
    ? await getFreshForecastNear(location.lat, location.lng)
    : null;

  // JSON-LD: only real on-page facts (name, description, geo). Never ratings,
  // availability, or route claims (PRD SEO). Inline JSON is CSP-safe.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name,
    ...(summary ? { description: summary } : {}),
    ...(location
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: location.lat,
            longitude: location.lng,
          },
        }
      : {}),
  };

  return (
    <main>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero ≥ 60% viewport height on desktop (PRD Design Principles). */}
      <HeroPlaceholder slug={slug} alt={heroAlt} className="h-[45vh] sm:h-[60vh]">
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-6 sm:p-10">
          <div className="mx-auto max-w-6xl">
            {label && (
              <Badge variant="brand" className="mb-3">
                {formatLabel(label)}
              </Badge>
            )}
            <h1 className="text-3xl font-semibold text-white sm:text-5xl">
              {name}
            </h1>
          </div>
        </div>
      </HeroPlaceholder>

      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-center justify-between gap-4">
          <Link
            href="/explore"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back to Explore
          </Link>
          <SaveControl
            destinationId={destination.id}
            slug={slug}
            isSignedIn={!!session?.user?.id}
            saved={saved}
          />
        </div>

        {/* At-a-glance facts */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Fact label="Difficulty" value={formatDifficulty(difficulty)} />
          <Fact label="Trip length" value={formatTripLength(tripLength)} />
          <Fact
            label="Budget"
            value={formatBudget(budgetCurrency, budgetLowUsd, budgetHighUsd)}
          />
          <Fact label="Best months" value={formatBestMonths(bestMonths)} />
        </dl>

        <div className="mt-4 flex flex-wrap gap-1.5">
          {activities.map((a) => (
            <Badge key={a} variant="outline">
              {formatActivity(a)}
            </Badge>
          ))}
        </div>

        {summary && (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground">
            {summary}
          </p>
        )}

        {/* Map (progressive enhancement — page reads fully without it). */}
        {location && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Map</h2>
            <DestinationMap
              center={location}
              routes={mapRoutes}
              className="h-[380px] w-full"
            />
          </section>
        )}

        {/* Trail listing */}
        <section className="mt-10">
          <h2 className="mb-4 text-lg font-semibold">
            Trails ({trails.length})
          </h2>
          {trails.length > 0 ? (
            <ul className="divide-y divide-border rounded-xl border border-border">
              {trails.map((t) => (
                <li key={t.id}>
                  <Link
                    href={`/trails/${t.slug}`}
                    className="flex flex-col gap-1 p-4 transition-colors hover:bg-secondary sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{t.name}</span>
                        {t.isRepresentative && (
                          <Badge variant="brand">Representative</Badge>
                        )}
                      </div>
                      <div className="mt-1 flex flex-wrap gap-x-3 text-sm text-muted-foreground">
                        <span>{t.distanceMiles} mi</span>
                        <span aria-hidden>·</span>
                        <span>{t.elevationGainFt.toLocaleString()} ft gain</span>
                        <span aria-hidden>·</span>
                        <span>{formatDifficulty(t.difficulty)}</span>
                        <span aria-hidden>·</span>
                        <span>~{t.durationHours} h</span>
                      </div>
                    </div>
                    <span className="text-sm text-muted-foreground">View →</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">
              No representative trails listed yet.
            </p>
          )}
        </section>

        {/* Weather outlook — only when a fresh snapshot exists (never stale). */}
        {forecast && <ForecastCard forecast={forecast} />}

        {/* Permit info — always links to the official land manager, never
            presents cached inventory as bookable (PRD Content Trust). */}
        <section className="mt-10">
          <h2 className="mb-3 text-lg font-semibold">Permits &amp; access</h2>
          {permit ? (
            <div className="rounded-xl border border-border p-4">
              <p className="font-medium">
                {formatPermitType(permit.requirementType)}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{permit.scope}</p>
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <a
                  href={permit.officialUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-medium text-brand underline underline-offset-4"
                >
                  Official permit &amp; conditions ↗
                </a>
                <span className="text-muted-foreground">
                  Last verified {permit.lastVerifiedAt.toLocaleDateString()}
                </span>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Permit status unconfirmed — check with the land manager before you
              go.
            </p>
          )}
        </section>

        <div className="mt-10">
          <SafetyDisclosure lastVerifiedAt={lastVerifiedAt} />
        </div>
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
