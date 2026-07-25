import type { Metadata } from "next";
import Link from "next/link";
import {
  getDestinationBySlug,
  listPublishedDestinations,
} from "@/content/destinations/queries";
import { EMPTY_FILTERS } from "@/content/search/filters";
import { ComparePicker } from "@/content/compare/ComparePicker";
import {
  formatActivity,
  formatBestMonths,
  formatBudget,
  formatDifficulty,
  formatLabel,
  formatPermitType,
  formatTripLength,
} from "@/shared/utils/format";
import type { DestinationDetail } from "@/shared/types/content";

export const metadata: Metadata = {
  title: "Compare",
  description: "Compare adventure destinations side by side.",
};

// Depends on the ?d= query, so it's rendered per request.
export const dynamic = "force-dynamic";

const MAX = 4;

const ROWS: { label: string; value: (d: DestinationDetail) => string }[] = [
  { label: "Difficulty", value: (d) => formatDifficulty(d.difficulty) },
  { label: "Trip length", value: (d) => formatTripLength(d.tripLength) },
  {
    label: "Budget (per person, excl. airfare)",
    value: (d) => formatBudget(d.budgetCurrency, d.budgetLowUsd, d.budgetHighUsd),
  },
  { label: "Best months", value: (d) => formatBestMonths(d.bestMonths) },
  { label: "Activities", value: (d) => d.activities.map(formatActivity).join(", ") },
  {
    label: "Park entrance",
    value: (d) => (d.entranceFee ? `$${d.entranceFee.costUsd.toFixed(0)}` : "—"),
  },
  {
    label: "Permit",
    value: (d) =>
      d.permit ? formatPermitType(d.permit.requirementType) : "Unconfirmed",
  },
  { label: "Representative trails", value: (d) => String(d.trails.length) },
  { label: "Label", value: (d) => (d.label ? formatLabel(d.label) : "—") },
];

export default async function ComparePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.d) ? params.d[0] : params.d;
  const requested = (raw ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, MAX);

  const all = await listPublishedDestinations(EMPTY_FILTERS);
  const valid = new Set(all.map((a) => a.slug));
  const selectedSlugs = [...new Set(requested)].filter((s) => valid.has(s));

  const details = (
    await Promise.all(selectedSlugs.map((s) => getDestinationBySlug(s)))
  ).filter((d): d is DestinationDetail => d !== null);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-2xl font-semibold tracking-tight">Compare destinations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Put up to {MAX} destinations side by side to see which fits your trip.
      </p>

      <div className="mt-4">
        <ComparePicker
          all={all.map((a) => ({ name: a.name, slug: a.slug }))}
          selected={selectedSlugs}
        />
      </div>

      {details.length >= 2 ? (
        <div className="mt-8 overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-sm">
            <thead>
              <tr>
                <th className="w-44 border-b border-border p-3 text-left font-medium text-muted-foreground">
                  Attribute
                </th>
                {details.map((d) => (
                  <th key={d.id} className="border-b border-border p-3 text-left align-bottom">
                    <Link
                      href={`/destinations/${d.slug}`}
                      className="font-semibold hover:text-brand hover:underline underline-offset-4"
                    >
                      {d.name}
                    </Link>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ROWS.map((row) => (
                <tr key={row.label} className="align-top">
                  <th
                    scope="row"
                    className="border-b border-border p-3 text-left font-medium text-muted-foreground"
                  >
                    {row.label}
                  </th>
                  {details.map((d) => (
                    <td key={d.id} className="border-b border-border p-3">
                      {row.value(d)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">Pick at least two destinations to compare.</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Add them above, or from any destination page.{" "}
            <Link href="/explore" className="text-brand underline underline-offset-4">
              Explore destinations
            </Link>
            .
          </p>
        </div>
      )}
    </main>
  );
}
