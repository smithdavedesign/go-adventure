# ADR-0006: Source licences and refresh contracts

**Status:** Partial (multiple sources live with registry entries; media/legal sign-off still owed)
**Forced by:** Roadmap M5 (first ingestion source), extended at M9 (remaining sources online)

## Context

The PRD requires every ingested source to have a reviewed source-registry entry before any ingest/transform/display: legal owner, endpoint/document URL, external ID format, authentication, rate limit, commercial-use terms, licence/attribution text, media rights, collection scope, refresh cadence, field mapping, transformation rules, expiry policy, fallback, owner, and last terms review date. NPS API, Recreation.gov RIDB, OpenStreetMap, Wikidata, Wikipedia, Open-Meteo, and USGS each have distinct terms (see PRD → Source Registry and Permitted Use table).

The human-readable registry now lives at [`docs/source-registry.md`](../source-registry.md); this ADR records the licence + refresh **contract** and the decisions behind it.

## Decision

**Five sources are live** and feed the 28 published destinations, each with a registry entry and a rendered attribution obligation:

| Source | Licence | Attribution (rendered) | Confidence | Freshness contract |
|---|---|---|---|---|
| **NPS** parks/fees/alerts | Public domain (US gov) | "Data courtesy of the National Park Service" | confirmed | Alerts → `AlertSnapshot.expiresAt`, never stale; fees stable |
| **OpenStreetMap** trails | ODbL | "© OpenStreetMap contributors" (map control) | `sac_scale`→confirmed, else editorial | Durable geometry; re-ingest overwrites by slug |
| **Open-Meteo** forecast + elevation | CC-BY 4.0 | On the forecast card | confirmed (measured) | `ForecastSnapshot.expiresAt`, never stale; elevation durable |
| **Wikimedia Commons** photos | Per-image CC/PD only | `${creator} · ${licence} · Wikimedia Commons` | n/a (media) | Durable; `rightsStatus: verified` only when licence gate passes |
| **MapTiler** basemap | MapTiler + OSM | Map attribution control | n/a (not ingested) | Rendered tiles only, nothing stored ([ADR-0005](0005-map-tile-provider.md)) |

Contract rules that hold across all sources:

- **Ingestion is gated** on a `Source` row existing and `enabled` — the pipeline refuses a disabled/unknown source.
- **Attribution + licence are snapshotted** onto the `SourceRecord` at retrieval, so a later terms change never silently rewrites what a published value was based on.
- **Licence gating for media:** Wikimedia heroes pass `isAcceptableLicence` (CC/PD accepted, fair-use/non-free rejected) or the destination keeps its gradient — no non-free image is ever displayed (27/28 have open heroes).
- **Freshness gating for snapshots:** alerts and forecasts are only served when unexpired; expired rows are pruned and the UI omits the section rather than showing stale data.

**Deferred / not wired:** USGS elevation (superseded by Open-Meteo), Wikidata, and Recreation.gov/RIDB (adapter exists, not yet feeding the 28). Gemini/AI drafting deferred by decision ([ADR-0007](0007-ai-provider-and-data-handling.md)) — NPS summaries are kept verbatim; there is no AI-generated text in the corpus.

**Still open before beta:** a human legal/content review of commercial-use terms and per-asset media rights. NPS material may include third-party rights and official insignia is not reusable — we ingest only NPS text/facts, no NPS media. Open-Meteo's free tier is non-commercial; a paid plan is required if usage crosses that line.

## Consequences

- The *content-quality / legal* gate (PRD Launch Gates → Source/legal) is a human sign-off that code cannot satisfy — tracked for M11. Everything code *can* enforce (registry existence, attribution capture, licence/freshness gating) is enforced.
- Every rendered credit has a source in the registry and vice versa: removing a source means removing its render site, and there are no orphan attributions.
