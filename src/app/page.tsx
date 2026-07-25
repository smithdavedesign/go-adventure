import Link from "next/link";
import { listPublishedDestinations } from "@/content/destinations/queries";
import { EMPTY_FILTERS } from "@/content/search/filters";
import { DestinationCard } from "@/content/destinations/DestinationCard";

// ISR (PRD caching model): the home page is editorial and prerenders, then
// revalidates hourly. The publish workflow also revalidates "/" on-demand
// (outbox → revalidatePath), so new featured content appears immediately.
// The featured read is best-effort: if the DB is unreachable at build (e.g. CI
// without a database) or during a background revalidation, the page still
// renders (empty featured strip) rather than failing the build — ISR keeps
// serving the last good version. See docs/adr/0001 caching model.
export const revalidate = 3600;

export default async function HomePage() {
  let featured: Awaited<ReturnType<typeof listPublishedDestinations>> = [];
  try {
    featured = (await listPublishedDestinations(EMPTY_FILTERS)).slice(0, 3);
  } catch {
    featured = [];
  }

  return (
    <main>
      {/* Hero — large imagery, one primary CTA (PRD Design Principles). */}
      <section className="mx-auto max-w-6xl px-4 py-20 sm:py-28">
        <p className="text-sm font-medium uppercase tracking-widest text-brand">
          Adventure discovery
        </p>
        <h1 className="mt-4 max-w-3xl text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
          Don&apos;t start with where. Start with the adventure you&apos;re
          looking for.
        </h1>
        <p className="mt-5 max-w-2xl text-lg text-muted-foreground">
          Describe the trip — the activity, the season, the effort — and
          discover the destinations that fit. Built for deciding{" "}
          <em>where</em> to go, not just researching a place you&apos;ve already
          chosen.
        </p>
        <div className="mt-8">
          <Link
            href="/explore"
            className="inline-flex items-center rounded-lg bg-brand px-6 py-3 font-medium text-brand-foreground transition-opacity hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            Explore destinations
          </Link>
        </div>
      </section>

      {featured.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 pb-20">
          <div className="mb-6 flex items-baseline justify-between">
            <h2 className="text-xl font-semibold">Featured destinations</h2>
            <Link
              href="/explore"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See all →
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((d) => (
              <DestinationCard key={d.id} destination={d} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
