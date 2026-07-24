/**
 * Event dictionary (PRD Analytics: "Define an event dictionary before
 * implementation"). Every launch-required event is declared here with its
 * consent category and allowed property keys. This is the authority — analytics
 * code may only emit events defined here.
 *
 * Hard rule: no email, precise location, OAuth tokens, free-form user text, or
 * provider secrets are ever event properties. Property values are constrained to
 * primitives and the allow-listed keys; `sanitizeProps` drops anything else.
 */

export type ConsentCategory = "necessary" | "analytics";

export type EventDef = {
  name: string;
  consent: ConsentCategory;
  /** Allow-listed property keys for this event. */
  props: readonly string[];
};

/** The PRD's required launch events. */
export const EVENTS = {
  exploration_opened: { name: "exploration_opened", consent: "analytics", props: [] },
  filter_applied: {
    name: "filter_applied",
    consent: "analytics",
    props: ["facet"], // facet name only, never the free-form query text
  },
  zero_results: { name: "zero_results", consent: "analytics", props: ["relaxed"] },
  relaxation_selected: {
    name: "relaxation_selected",
    consent: "analytics",
    props: ["constraint"],
  },
  search_submitted: { name: "search_submitted", consent: "analytics", props: [] },
  result_shown: { name: "result_shown", consent: "analytics", props: ["count"] },
  destination_opened: {
    name: "destination_opened",
    consent: "analytics",
    props: ["slug"], // published slug is public, not PII
  },
  official_link_opened: {
    name: "official_link_opened",
    consent: "analytics",
    props: ["kind"], // "permit" | "alert"
  },
  save_attempted: { name: "save_attempted", consent: "analytics", props: ["slug"] },
  save_completed: { name: "save_completed", consent: "analytics", props: ["slug"] },
  save_failed: { name: "save_failed", consent: "analytics", props: ["slug"] },
  signin_started: { name: "signin_started", consent: "necessary", props: [] },
  signin_completed: { name: "signin_completed", consent: "necessary", props: [] },
  source_data_stale: {
    name: "source_data_stale",
    consent: "analytics",
    props: ["kind"],
  },
} as const satisfies Record<string, EventDef>;

export type EventName = keyof typeof EVENTS;

export type PropValue = string | number | boolean;

/** Keep only the event's allow-listed keys with primitive values. */
export function sanitizeProps(
  event: EventName,
  props: Record<string, unknown>,
): Record<string, PropValue> {
  const allowed = new Set<string>(EVENTS[event].props);
  const out: Record<string, PropValue> = {};
  for (const [k, v] of Object.entries(props)) {
    if (!allowed.has(k)) continue;
    if (
      typeof v === "string" ||
      typeof v === "number" ||
      typeof v === "boolean"
    ) {
      out[k] = v;
    }
  }
  return out;
}
