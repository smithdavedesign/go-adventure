/**
 * Consent-gated event emit. Respects the analytics consent category and drops
 * any non-allow-listed properties before an event leaves the app. Without
 * analytics consent, `analytics`-category events are silently dropped;
 * `necessary` events always emit. The actual sink (GTM/GA4) is wired at deploy
 * time and is env-gated — this module never sends PII regardless of the sink.
 */
import { EVENTS, sanitizeProps, type EventName, type PropValue } from "./events";

export type ConsentState = { analytics: boolean };

export type Sink = (
  name: string,
  props: Record<string, PropValue>,
) => void;

/** Default sink: no-op unless a real sink is injected (GTM wiring is deploy-time). */
const noopSink: Sink = () => {};

export function track(
  event: EventName,
  props: Record<string, unknown>,
  consent: ConsentState,
  sink: Sink = noopSink,
): boolean {
  const def = EVENTS[event];
  if (def.consent === "analytics" && !consent.analytics) {
    return false; // dropped — no consent
  }
  sink(def.name, sanitizeProps(event, props));
  return true;
}
