import Link from "next/link";
import { Badge } from "@/shared/ui/badge";
import { HeroPlaceholder } from "./HeroPlaceholder";
import {
  formatActivity,
  formatBestMonths,
  formatBudget,
  formatDifficulty,
  formatLabel,
  formatTripLength,
} from "@/shared/utils/format";
import type { DestinationCard as DestinationCardData } from "@/shared/types/content";

/**
 * One destination in the Explore grid. The whole card is a single link — "one
 * click to inspiration" (PRD Design Principles). Photography-forward: the hero
 * area dominates, text sits below.
 */
export function DestinationCard({ destination }: { destination: DestinationCardData }) {
  const {
    slug,
    name,
    label,
    heroAlt,
    difficulty,
    tripLength,
    activities,
    bestMonths,
    budgetCurrency,
    budgetLowUsd,
    budgetHighUsd,
  } = destination;

  return (
    <Link
      href={`/destinations/${slug}`}
      className="group block overflow-hidden rounded-xl border border-border bg-card transition-shadow hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
    >
      <HeroPlaceholder
        slug={slug}
        alt={heroAlt}
        className="aspect-[4/3] w-full transition-transform duration-300 group-hover:scale-[1.02]"
      >
        {label && (
          <span className="absolute left-3 top-3">
            <Badge variant="brand">{formatLabel(label)}</Badge>
          </span>
        )}
      </HeroPlaceholder>

      <div className="space-y-2 p-4">
        <h3 className="text-base font-semibold leading-tight">{name}</h3>

        <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          <span>{formatDifficulty(difficulty)}</span>
          <span aria-hidden>·</span>
          <span>{formatTripLength(tripLength)}</span>
          <span aria-hidden>·</span>
          <span>{formatBudget(budgetCurrency, budgetLowUsd, budgetHighUsd)}</span>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {activities.map((a) => (
            <Badge key={a} variant="outline">
              {formatActivity(a)}
            </Badge>
          ))}
          <Badge variant="outline">Best: {formatBestMonths(bestMonths)}</Badge>
        </div>
      </div>
    </Link>
  );
}
