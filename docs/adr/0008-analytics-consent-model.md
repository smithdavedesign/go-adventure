# ADR-0008: Analytics consent model

**Status:** Not started
**Forced by:** Roadmap M10 (observability + security hardening)

## Context

The PRD requires an event dictionary (event name, trigger, properties, consent category, retention, owner, QA test) defined before implementation, consent-aware GTM/GA4/GSC, and that email, precise location, OAuth tokens, free-form user text, and provider secrets are never sent to analytics by default.

## Decision

**Partial (dictionary + consent gate built; sink wiring + banner parked).** The event dictionary is defined in code ([`events.ts`](../../src/platform/analytics/events.ts)) — every PRD launch event with its consent category (`necessary` | `analytics`) and an allow-list of property keys. [`track.ts`](../../src/platform/analytics/track.ts) enforces it: analytics-category events are dropped without consent, `necessary` events always emit, and `sanitizeProps` strips any non-allow-listed or non-primitive property so email, precise location, tokens, and free-form text can never leave the app (unit-tested).

Still owed: the GTM/GA4 sink wiring (deploy-time, env-gated on `NEXT_PUBLIC_GTM_ID`/`GA4_ID`), the consent-banner UI, and the retention/owner/QA columns of the event dictionary filled per event before go-live.

## Consequences

- Analytics code may only emit events declared in the dictionary — adding an event is a deliberate edit with a consent category, not an ad-hoc call.
- The consent gate defaults to *not* sending analytics events until consent is granted, which is the correct default for launch markets requiring consent.
