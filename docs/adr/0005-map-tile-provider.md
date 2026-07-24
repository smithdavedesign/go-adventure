# ADR-0005: Map tile provider and OSM compliance

**Status:** Not started
**Forced by:** Roadmap M2 (walking-skeleton UI, map view) for local dev; binding "before beta" per PRD for production

## Context

MapLibre GL is the renderer only, not a tile source. The PRD requires a contracted tile provider or self-hosted tile stack selected via ADR before beta — shared public OSM tile infrastructure is explicitly disallowed as a dependency. Attribution (OSM/ODbL) and the provider's terms, volume limits, caching rules, and incident fallback must be recorded in the source registry.

## Decision

Not yet decided for production. For local development only, M2 may use a no-API-key demo/free tile source as a placeholder — that placeholder is not a substitute for this ADR and must not be relied on at beta.

## Consequences

TBD once decided.
