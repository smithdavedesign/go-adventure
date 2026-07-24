/**
 * Domain types for the content layer, shared by server queries and client
 * components.
 *
 * The enum unions below are declared by hand rather than imported from the
 * generated Prisma client on purpose: the generated client pulls in `node:*`
 * modules and cannot be imported into client components. These literal unions
 * are the single source of truth the UI iterates over, and they must stay in
 * sync with prisma/schema.prisma (there's a unit test asserting exactly that).
 */

export type Activity = "hiking" | "backpacking";

export type Month =
  | "january"
  | "february"
  | "march"
  | "april"
  | "may"
  | "june"
  | "july"
  | "august"
  | "september"
  | "october"
  | "november"
  | "december";

export type Difficulty = "easy" | "moderate" | "hard" | "expert";

export type TripLength = "day" | "short_2_3d" | "medium_4_7d" | "long_7d_plus";

export type AdventureLabel =
  | "editors_pick"
  | "hidden_gem"
  | "trending"
  | "beginner_friendly"
  | "epic";

/** Ordered lists used to render filter controls and validate query params. */
export const ACTIVITIES: readonly Activity[] = ["hiking", "backpacking"];
export const DIFFICULTIES: readonly Difficulty[] = [
  "easy",
  "moderate",
  "hard",
  "expert",
];
export const TRIP_LENGTHS: readonly TripLength[] = [
  "day",
  "short_2_3d",
  "medium_4_7d",
  "long_7d_plus",
];
export const MONTHS: readonly Month[] = [
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

export type Coordinates = { lat: number; lng: number };

/** Summary shape for the Explore grid — one card per destination. */
export type DestinationCard = {
  id: string;
  name: string;
  slug: string;
  activities: Activity[];
  bestMonths: Month[];
  difficulty: Difficulty;
  tripLength: TripLength;
  label: AdventureLabel | null;
  budgetCurrency: string;
  budgetLowUsd: number;
  budgetHighUsd: number;
  summary: string | null;
  tags: string[];
  location: Coordinates | null;
  heroAlt: string | null;
};

export type TrailSummary = {
  id: string;
  name: string;
  slug: string;
  distanceMiles: number;
  elevationGainFt: number;
  difficulty: Difficulty;
  durationHours: number;
  costUSD: number | null;
  tags: string[];
  isRepresentative: boolean;
  /** GeoJSON MultiLineString coordinates: array of lines, each an array of [lng, lat]. */
  route: [number, number][][] | null;
};

export type DestinationDetail = DestinationCard & {
  trails: TrailSummary[];
};

export type TrailDetail = TrailSummary & {
  /** Destinations this trail is listed under, for back-navigation. */
  destinations: { name: string; slug: string }[];
};
