/**
 * Display formatting for enum values and structured facts.
 *
 * PRD rule enforced here: budget is never shown as $/$$/$$$ without the
 * underlying numbers — `formatBudget` always renders the real currency range.
 */
import type {
  Activity,
  AdventureLabel,
  Difficulty,
  Month,
  TripLength,
} from "@/shared/types/content";

const LABEL_TEXT: Record<AdventureLabel, string> = {
  editors_pick: "Editor's Pick",
  hidden_gem: "Hidden Gem",
  trending: "Trending",
  beginner_friendly: "Beginner Friendly",
  epic: "Epic",
};

const TRIP_LENGTH_TEXT: Record<TripLength, string> = {
  day: "Day trip",
  short_2_3d: "2–3 days",
  medium_4_7d: "4–7 days",
  long_7d_plus: "7+ days",
};

const DIFFICULTY_TEXT: Record<Difficulty, string> = {
  easy: "Easy",
  moderate: "Moderate",
  hard: "Hard",
  expert: "Expert",
};

const ACTIVITY_TEXT: Record<Activity, string> = {
  hiking: "Hiking",
  backpacking: "Backpacking",
};

/** Capitalize a month enum value ("april" → "Apr"). */
export function formatMonthShort(month: Month): string {
  return month.slice(0, 3).replace(/^./, (c) => c.toUpperCase());
}

export function formatLabel(label: AdventureLabel): string {
  return LABEL_TEXT[label];
}

export function formatTripLength(t: TripLength): string {
  return TRIP_LENGTH_TEXT[t];
}

export function formatDifficulty(d: Difficulty): string {
  return DIFFICULTY_TEXT[d];
}

export function formatActivity(a: Activity): string {
  return ACTIVITY_TEXT[a];
}

/** e.g. ("USD", 400, 900) → "$400–$900". Falls back gracefully for non-USD. */
export function formatBudget(
  currency: string,
  low: number,
  high: number,
): string {
  const symbol = currency === "USD" ? "$" : `${currency} `;
  return `${symbol}${low.toLocaleString()}–${symbol}${high.toLocaleString()}`;
}

/** Condense a best-months list into ranges where consecutive ("Apr–Jun, Sep"). */
export function formatBestMonths(months: Month[]): string {
  if (months.length === 0) return "—";
  const order: Month[] = [
    "january",
    "february",
    "march",
    "april",
    "may",
    "june",
    "july",
    "august",
    "september",
    "october",
    "november",
    "december",
  ];
  const indices = months
    .map((m) => order.indexOf(m))
    .sort((a, b) => a - b);

  const ranges: string[] = [];
  let start = indices[0];
  let prev = indices[0];
  for (let i = 1; i <= indices.length; i++) {
    const cur = indices[i];
    if (cur !== prev + 1) {
      // close the current run
      ranges.push(
        start === prev
          ? formatMonthShort(order[start])
          : `${formatMonthShort(order[start])}–${formatMonthShort(order[prev])}`,
      );
      start = cur;
    }
    prev = cur;
  }
  return ranges.join(", ");
}
