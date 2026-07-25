import type { Metadata } from "next";
import Link from "next/link";
import { listPublishedDestinations } from "@/content/destinations/queries";
import { EMPTY_FILTERS } from "@/content/search/filters";
import { groupBy, REGION_ORDER } from "@/shared/data/regions";
import type { DestinationCard } from "@/shared/types/content";

export const metadata: Metadata = {
  title: "Browse",
  description:
    "Browse outdoor adventure destinations by region and mountain range.",
};

// ISR: browse is editorial and prerenders + revalidates hourly, like the home
// page. The featured read is best-effort so a DB-less build still succeeds.
export const revalidate = 3600;

export default async function BrowsePage() {
  let destinations: DestinationCard[] = [];
  try {
    destinations = await listPublishedDestinations(EMPTY_FILTERS);
  } catch {
    destinations = [];
  }

  const byRegion = groupBy(destinations, (t) => t.region, REGION_ORDER);
  const byRange = groupBy(destinations, (t) => t.mountainRange);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Browse destinations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {destinations.length} US national {destinations.length === 1 ? "park" : "parks"}, by region and
        mountain range. Prefer filters?{" "}
        <Link href="/explore" className="text-brand underline underline-offset-4">
          Explore with search &amp; facets
        </Link>
        .
      </p>

      <BrowseGroups title="By region" groups={byRegion} />
      <BrowseGroups title="By mountain range" groups={byRange} />
    </main>
  );
}

function BrowseGroups({
  title,
  groups,
}: {
  title: string;
  groups: [string, DestinationCard[]][];
}) {
  if (groups.length === 0) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {groups.map(([group, parks]) => (
          <div key={group} className="rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              {group}{" "}
              <span className="font-normal normal-case">({parks.length})</span>
            </h3>
            <ul className="mt-2 space-y-1">
              {parks.map((p) => (
                <li key={p.id}>
                  <Link
                    href={`/destinations/${p.slug}`}
                    className="text-sm hover:text-brand hover:underline underline-offset-4"
                  >
                    {p.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </section>
  );
}
