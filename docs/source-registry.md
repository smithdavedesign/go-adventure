# Source Registry

Every external data source that feeds ingested, transformed, or displayed content,
with the fields the PRD's Source Registry & Permitted Use table requires: owner,
endpoint, auth, rate limit, commercial-use terms, licence + attribution, media
rights, collection scope, refresh cadence, expiry policy, fallback, and last terms
review. This is the human-readable companion to the `Source` rows created in the
database on first ingest and to [ADR-0006](adr/0006-source-licences-and-refresh-contracts.md)
(licence + refresh contracts). It reflects what is **actually wired and live**, not
the full menu of sources the PRD anticipates.

**Trust model.** Sourced values carry `confidence: confirmed` and link to the
`SourceRecord` captured at retrieval; editorial judgements carry `confidence: editorial`;
nothing is served past its freshness gate. See [ARCHITECTURE.md → Content trust](ARCHITECTURE.md).

**Attribution is rendered, not just recorded.** Each obligation below has a concrete
render site in the product. Removing a source means removing its render site too.

---

## Live sources (feeding the 28 published destinations)

### 1. National Park Service — Data API

| Field | Value |
|---|---|
| Owner | US National Park Service (federal) |
| Adapter | `src/platform/ingestion/nps/adapter.ts`, `src/platform/alerts/nps.ts` |
| Endpoints | `GET /parks` (summary, coordinates, official URL, `entranceFees`), `GET /alerts` (closures/hazards) |
| External ID | `parkCode` (e.g. `yose`); joined to a destination via `SourceRecord` → `ContentRevision` |
| Auth | `NPS_API_KEY` (free developer key) |
| Rate limit | ~1,000 req/hr default; our whole-corpus refresh is 28 park codes in one call |
| Commercial use | Permitted; NPS data is a US-government work (public domain). **Media caveat:** NPS *images* may carry third-party rights and official insignia is not reusable — we do not ingest NPS media, only text/facts. |
| Licence + attribution | Public domain. Credit rendered: **"Data courtesy of the National Park Service."** |
| Collection scope | Park name, summary, coordinates, official URL, entrance fee, active alerts. No inventory, no bookable availability. |
| Refresh cadence | Parks/fees: on demand (`npm run enrich:fees`, stable data). Alerts: `npm run alerts:refresh` (safety-critical, short TTL). |
| Confidence | `confirmed` (entrance fee, alerts, official URL) |
| Expiry / freshness | Alerts stored as `AlertSnapshot` with `expiresAt`; `getFreshAlertsNear` never returns an expired row. Fees are stable facts (no TTL). |
| Fallback | No alerts snapshot → alert banner omitted (not "no alerts"). No fee fact → fee line omitted. |
| Render sites | Entrance fee line + "source: NPS" on the destination page; `AlertBanner`; official permit/park links. |
| Last terms review | 2026-07-24 (media rights sign-off still owed before any NPS media is used — none is today). |

### 2. OpenStreetMap — Overpass API

| Field | Value |
|---|---|
| Owner | OpenStreetMap Foundation / contributors |
| Adapter | `src/platform/ingestion/osm/{overpass,adapter,ingest}.ts` |
| Endpoints | Overpass `POST /api/interpreter` — named hiking `way`s around each park point. Mirror rotation across 3 endpoints, backoff on 429/504. |
| External ID | OSM `way` id → `Trail.slug` = `${slugify(name)}-${parkCode}` |
| Auth | None (keyless). Requires a descriptive `User-Agent`. |
| Rate limit | Shared public Overpass — strict. We use small radii, `out geom 80`, 4 s between parks, mirror rotation, capped retries. Coverage reached incrementally (25/28 parks, 138 trails). |
| Commercial use | Permitted under ODbL. |
| Licence + attribution | **ODbL.** Credit rendered: **"© OpenStreetMap contributors"** (via the map's attribution control; the same credit covers the OSM-derived trail geometry drawn over the basemap). |
| Collection scope | Trail name, geometry (LineString), `sac_scale` difficulty where tagged. Dropped: closed/`access=no` ways, unnamed ways, segments < 0.3 mi. Curated to ≤ 5 representative named trails/park. |
| Transformation | `sac_scale` → difficulty (`hiking`→easy … `alpine`→expert), **confirmed** where tagged else editorial; distance via haversine; geometry written as EWKT via raw SQL (ADR-0003). |
| Refresh cadence | On demand (`npm run ingest:trails`); idempotent + re-runnable for the remaining 3 parks. |
| Expiry / freshness | Trail geometry is durable (not snapshotted); re-ingest overwrites by slug. |
| Fallback | Overpass unavailable → that park keeps whatever trails it already has (no partial wipes). |
| Render sites | Trail list + `/trails/[slug]`; routes on `DestinationMap`; map attribution control. |
| Last terms review | 2026-07-24 |

### 3. Open-Meteo — Forecast + Elevation

| Field | Value |
|---|---|
| Owner | Open-Meteo (open-data weather) |
| Adapter | `src/platform/forecasts/openMeteo.ts` (forecast), `src/platform/ingestion/osm/elevation.ts` (elevation) |
| Endpoints | `GET /v1/forecast` (daily outlook), Elevation API (batch point elevations for trail gain) |
| External ID | Lat/lng of the destination point / sampled route points |
| Auth | None (keyless free non-commercial tier; `OPEN_METEO_API_KEY` only for the paid tier) |
| Rate limit | Free tier is generous but throttles bursts (observed 429 when sampling elevation for 138 trails back-to-back) — batch requests, sample ≤ 40 pts/route. |
| Commercial use | Free tier is **non-commercial**; a paid plan is required if/when this becomes a commercial dependency (tracked in DEPENDENCIES). |
| Licence + attribution | CC-BY 4.0. Weather data attributed on the forecast card. |
| Collection scope | Daily forecast (temp/precip/wind); cumulative elevation gain (Naismith duration input). |
| Refresh cadence | Forecast: `npm run forecasts:refresh` (short TTL). Elevation: once per trail at ingest. |
| Expiry / freshness | `ForecastSnapshot.expiresAt`; `getFreshForecastNear` never returns stale. Elevation is a durable trail attribute. |
| Fallback | No fresh forecast → forecast card omitted. Elevation fetch fails → trail keeps OSM/estimated gain. |
| Render sites | `ForecastCard`; trail elevation gain + estimated duration. |
| Last terms review | 2026-07-24 |

*Note: the original plan named USGS for elevation. We use Open-Meteo's Elevation API
instead — same keyless provider as the forecast, one less source to register, adequate
for cumulative-gain estimates. USGS is not wired.*

### 4. Wikimedia Commons + Wikipedia REST — Hero photos

| Field | Value |
|---|---|
| Owner | Wikimedia Foundation / individual contributors |
| Adapter | `src/platform/media/wikimedia.ts`, `scripts/enrich-media-wikimedia.ts` |
| Endpoints | Wikipedia REST summary (lead image) → Commons `imageinfo` (URL, licence, `Artist`/creator) |
| External ID | Commons file name → `MediaAsset.objectKey` = `wikimedia/${fileName}` |
| Auth | None (keyless) |
| Rate limit | Light; one hero per park |
| Commercial use | Permitted **only** for CC/PD licences. `isAcceptableLicence` rejects fair-use/non-free — those parks keep the gradient fallback (Glacier: 27/28 have open heroes). |
| Licence + attribution | Per-image CC/PD. Credit rendered: **`${creator} · ${licence} · Wikimedia Commons`** as a caption overlay on the hero. `rightsStatus: verified` only when the licence passes the gate. |
| Collection scope | One landscape hero per destination (external URL now; R2 self-hosting deferred). EXIF-stripped marker set. |
| Refresh cadence | On demand (`npm run enrich:media`); idempotent. |
| Expiry / freshness | Durable; re-run overwrites. |
| Fallback | No acceptable image → `HeroPlaceholder` gradient (graceful, no broken image). |
| Render sites | Destination hero + credit overlay; Explore cards; OpenGraph image in `generateMetadata`. |
| Last terms review | 2026-07-24 |

### 5. MapTiler — Map tiles (basemap only)

| Field | Value |
|---|---|
| Owner | MapTiler AG |
| Component | `src/content/destinations/DestinationMap.tsx` (MapLibre GL renderer) |
| Endpoint | `https://api.maptiler.com/maps/outdoor-v2/style.json?key=…` |
| Auth | `NEXT_PUBLIC_MAPTILER_KEY` (public client key) |
| Rate limit | Per MapTiler plan quota; basemap tiles only, not stored or re-served. |
| Commercial use | Per MapTiler plan terms. |
| Licence + attribution | MapTiler + OSM. Rendered by MapLibre's `attributionControl` (the style ships "© MapTiler © OpenStreetMap contributors"). |
| Collection scope | Rendered tiles only — no data ingested or persisted. |
| Fallback | Key unset (local dev) → MapLibre demo style. PRD forbids shipping the shared-public demo tiles to production; MapTiler is the production answer. |
| Render sites | `DestinationMap` on every destination page. |
| Decision | [ADR-0005](adr/0005-map-tile-provider.md) — Accepted. |
| Last terms review | 2026-07-24 |

---

## Registered but not yet feeding published content

- **Recreation.gov / RIDB** — adapter exists (`src/platform/ingestion/recgov/adapter.ts`,
  attribution "Recreation information courtesy of Recreation.gov (RIDB)") but is not
  wired into the 28 live destinations. Needs `RECREATION_GOV_API_KEY` + its own review
  before use.

## Not used (despite appearing in the plan/PRD)

- **USGS Elevation** — superseded by Open-Meteo Elevation (see source 3).
- **Wikidata** — not wired; no structured claims ingested this round.
- **Gemini / AI drafting** — deferred by decision; NPS summaries kept verbatim, no AI
  text in the corpus ([ADR-0007](adr/0007-ai-provider-and-data-handling.md)).

## Open compliance items

- **Media rights human sign-off** for any future NPS-media or paid-tier use — a legal
  review code can't satisfy (PRD Launch Gates → Source/legal; ADR-0006 consequences).
- **Open-Meteo commercial tier** if usage crosses the non-commercial line.
- **R2 self-hosting** of Wikimedia heroes (currently hotlinked) — deferred, not blocking.
