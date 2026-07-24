# ADR-0006: Source licences and refresh contracts

**Status:** Not started
**Forced by:** Roadmap M5 (first ingestion source)

## Context

The PRD requires every ingested source to have a reviewed source-registry entry before any ingest/transform/display: legal owner, endpoint/document URL, external ID format, authentication, rate limit, commercial-use terms, licence/attribution text, media rights, collection scope, refresh cadence, field mapping, transformation rules, expiry policy, fallback, owner, and last terms review date. NPS API, Recreation.gov RIDB, OpenStreetMap, Wikidata, Wikipedia, Open-Meteo, and USGS each have distinct terms (see PRD → Source Registry and Permitted Use table).

## Decision

**Partial (NPS entry drafted in code, legal review still owed).** The NPS Data API adapter carries a `SourceRegistry` entry (`src/platform/ingestion/nps/adapter.ts`) recording licence, attribution ("Data courtesy of the National Park Service"), terms URL, commercial-use note, refresh policy (daily), and owner — and the pipeline refuses to ingest a source whose `Source.enabled` flag is false. The registry row is created in the `Source` table on first ingest.

Still open before any NPS-sourced content is **published** (not just ingested to draft): a human legal/content review of NPS commercial-use terms and per-asset media rights (NPS material may include third-party rights; official insignia is not reusable). Remaining sources (Recreation.gov, OSM/ODbL, USGS, Open-Meteo) each need their own registry entry + review at M9.

## Consequences

- Ingestion is gated on a registry entry existing and being enabled, but the *content quality / legal* gate (PRD Launch Gates → Source/legal) is a human sign-off that code cannot satisfy — tracked for M11.
- Attribution and licence are snapshotted onto every `SourceRecord` at retrieval time, so a later terms change doesn't silently rewrite what a published value was based on.
