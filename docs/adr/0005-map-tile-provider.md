# ADR-0005: Map tile provider and OSM compliance

**Status:** Accepted (MapTiler Outdoor)
**Forced by:** Roadmap M2 (walking-skeleton UI, map view) for local dev; binding "before beta" per PRD for production

## Context

MapLibre GL is the renderer only, not a tile source. The PRD requires a contracted tile provider or self-hosted tile stack selected via ADR before beta — shared public OSM tile infrastructure is explicitly disallowed as a dependency. Attribution (OSM/ODbL) and the provider's terms, volume limits, caching rules, and incident fallback must be recorded in the source registry.

## Decision

**MapTiler Outdoor (`outdoor-v2`)** is the production tile provider. The style is loaded from `https://api.maptiler.com/maps/outdoor-v2/style.json` keyed by the public `NEXT_PUBLIC_MAPTILER_KEY` (`src/content/destinations/DestinationMap.tsx`). The outdoor style is the right fit for a hiking product — it renders trails, contours, and terrain.

Attribution is satisfied by MapLibre's built-in `attributionControl` (compact): the MapTiler style ships `sources[].attribution` = "© MapTiler © OpenStreetMap contributors", which the control renders on every map. That same OSM credit also covers our OSM-derived trail geometry drawn as overlays (see [ADR-0006](0006-source-licences-and-refresh-contracts.md) and the [source registry](../source-registry.md)).

**Fallback:** when `NEXT_PUBLIC_MAPTILER_KEY` is unset (local dev), the component falls back to the MapLibre demo style. That demo (shared public infrastructure) is explicitly **not** for production — production sets the key.

## Consequences

- A `NEXT_PUBLIC_*` key is exposed to the client by necessity (all client-side map SDKs work this way). Exposure is bounded by MapTiler's per-key domain allow-list and plan quota, not by secrecy — see [ADR-0010](0010-commercial-service-cost-controls.md) for the cost cap.
- Volume is a MapTiler plan concern; if free-tier limits bite, the decision to upgrade or self-host tiles is a cost decision, not a re-architecture (the renderer stays MapLibre).
- OSM/ODbL attribution is met through the provider's style metadata, so removing or swapping the provider must preserve the attribution control.
