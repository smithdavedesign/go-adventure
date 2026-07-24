# ADR-0004: Search graduation criteria

**Status:** Not started
**Forced by:** Roadmap M3 (search + zero-result relaxation)

## Context

The PRD mandates Postgres FTS + `pg_trgm` at launch and defers Meilisearch until "a benchmarked beta shows that Postgres cannot meet a documented relevance, facet, or p95 latency target," migrated via an outbox-driven indexer with index versioning and reconciliation. The specific numeric thresholds are not yet defined.

## Decision

Not yet decided. M3 must define the actual relevance/facet/p95 latency targets Postgres FTS is measured against — not just restate that graduation is possible.

## Consequences

TBD once decided.
