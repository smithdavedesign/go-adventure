import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  getDestinationBySlug,
  getDestinationMetadataBySlug,
} from "@/content/destinations/queries";
import { HeroPlaceholder } from "@/content/destinations/HeroPlaceholder";
import { PhotoGallery } from "@/content/destinations/PhotoGallery";
import { DestinationMapWithTrails } from "@/content/destinations/DestinationMapWithTrails";
import { SafetyDisclosure } from "@/content/SafetyDisclosure";
import { ForecastCard } from "@/content/destinations/ForecastCard";
import { getFreshForecastNear } from "@/platform/forecasts/snapshots";
import { AlertBanner } from "@/content/destinations/AlertBanner";
import { getFreshAlertsNear } from "@/platform/alerts/snapshots";
import { nearestAirports } from "@/shared/data/airports";
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

// Deliberately dynamic (not ISR, unlike trails/home): this page reads per-user
// save state (auth) and safety-critical live alerts that must never be served
// stale from a cache. Reading auth() forces dynamic rendering regardless, so
// caching here would either break per-user state or risk stale closures. The
// durable content is still on-demand revalidated by the publish workflow.
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const destination = await getDestinationMetadataBySlug(slug);
  if (!destination) return { title: "Not found" };
  return {
    title: destination.name,
    description: destination.summary ?? undefined,
    openGraph: destination.heroImageUrl
      ? {
          title: destination.name,
          description: destination.summary ?? undefined,
          images: [{ url: destination.heroImageUrl }],
        }
      : undefined,
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
    heroImageUrl,
    heroCredit,
    summary,
    activities,
    bestMonths,
    difficulty,
    tripLength,
    budgetCurrency,
    budgetLowUsd,
    budgetHighUsd,
    location,
    area,
    trails,
    permit,
    entranceFee,
    highlights,
    photos,
    lastVerifiedAt,
  } = destination;

  const airports = location ? nearestAirports(location, 3) : [];

  // Fresh (non-expired) forecast + official alerts near the destination. Never stale.
  const [forecast, alerts] = location
    ? await Promise.all([
        getFreshForecastNear(location.lat, location.lng),
        getFreshAlertsNear(location.lat, location.lng),
      ])
    : [null, null];

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
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Hero ≥ 60% viewport height on desktop (PRD Design Principles). */}
      <HeroPlaceholder
        slug={slug}
        alt={heroAlt}
        imageUrl={heroImageUrl}
        credit={heroCredit}
        className="h-[45vh] sm:h-[60vh]"
      >
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
          <div className="flex items-center gap-4">
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back to Explore
            </Link>
            <Link
              href={`/compare?d=${slug}`}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Compare ↔
            </Link>
          </div>
          <SaveControl
            destinationId={destination.id}
            slug={slug}
            isSignedIn={!!session?.user?.id}
            saved={saved}
          />
        </div>

        {/* Official park alerts, high up — safety-forward. Only when fresh. */}
        {alerts && <AlertBanner data={alerts} />}

        {/* At-a-glance facts */}
        <dl className="mt-6 grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          <Fact label="Difficulty" value={formatDifficulty(difficulty)} />
          <Fact label="Trip length" value={formatTripLength(tripLength)} />
          <Fact
            label="Budget"
            value={formatBudget(budgetCurrency, budgetLowUsd, budgetHighUsd)}
            note="per person · excl. airfare"
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

        {/* Entrance fee is a sourced (confirmed) fact from NPS — shown distinctly
            from the editorial trip-budget estimate above. */}
        {entranceFee && (
          <p className="mt-4 text-sm text-muted-foreground">
            <span className="font-medium text-foreground">
              Park entrance: ${entranceFee.costUsd.toFixed(0)}
            </span>{" "}
            ({entranceFee.title}) · source: NPS
          </p>
        )}

        {summary && (
          <p className="mt-8 max-w-2xl text-lg leading-relaxed text-foreground">
            {summary}
          </p>
        )}

        {/* Highlights — brief editorial "why go" bullets. */}
        {highlights.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 text-lg font-semibold">Highlights</h2>
            <ul className="grid max-w-2xl gap-2 sm:grid-cols-2">
              {highlights.map((h) => (
                <li key={h} className="flex gap-2 text-sm text-foreground">
                  <span aria-hidden className="text-brand">
                    ◆
                  </span>
                  <span>{h}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Photo gallery (openly-licensed, per-image credit). */}
        <PhotoGallery photos={photos} />

        {/* Map + trail listing (client component — shares hover state). */}
        <DestinationMapWithTrails
          center={location}
          area={area}
          destinationName={name}
          trails={trails}
        />

        {/* Getting there — nearest airports (great-circle; airfare out of scope). */}
        {airports.length > 0 && (
          <section className="mt-10">
            <h2 className="mb-3 text-lg font-semibold">Getting there</h2>
            <ul className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
              {airports.map((a) => (
                <li key={a.code}>
                  <span className="font-medium">{a.code}</span> {a.name}{" "}
                  <span className="text-muted-foreground">
                    · {a.distanceMiles} mi
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Straight-line distances to nearby airports. Airfare and drive times
              are not included.
            </p>
          </section>
        )}

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

function Fact({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note?: string;
}) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="mt-1 font-medium">{value}</dd>
      {note && <dd className="text-xs text-muted-foreground">{note}</dd>}
    </div>
  );
}
