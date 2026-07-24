# Launch Readiness Assessment

Walks every gate in the [PRD Launch Gates](Adventure_Discovery_PRD_v1.1.md#launch-gates) table and records the honest current state. **No gate is signed off** — each requires an accountable human owner to verify evidence, and several are blocked on real content, external accounts, or legal/operational process that engineering cannot produce.

This is the M11 deliverable: not "launch approved," but "here is exactly what stands between the working platform and a launchable one."

**Legend:** 🟢 built & verified in code · 🟡 partial (code done, human/external work remains) · 🔴 not startable by engineering alone.

## The one-line summary

The **platform is built and works end-to-end** — discovery, search, the binding zero-result relaxation, the provenance-backed content model, ingestion, editorial publishing, auth, saves, AI-assisted drafting, and expiring dynamic data. What remains is not more application code: it's **real content, external service accounts, and human/legal sign-off**. The single biggest blocker is the curated 25–50-destination corpus, which by PRD design is human editorial work.

## Gate-by-gate

### 1. Content quality — 🔴 owner: Editorial lead
Every published destination/trail must pass rubric, source, attribution, rights, and freshness checks; corpus scope disclosed.
- 🟢 The machinery exists: rubric-gated publish (a draft can't publish until difficulty/budget/trip-length/activities/geometry are present), provenance backbone, `noindex` for anything unpublished.
- 🔴 **Blocking:** the actual 25–50 destinations don't exist yet. Producing them is human editorial judgment per rubric against real sources — the work the PRD explicitly reserves for people. This is the critical-path launch blocker.

### 2. Source / legal — 🟡 owner: Product + legal reviewer
Source registry complete; commercial terms, OSM compliance, media rights, notices reviewed.
- 🟢 Source registry model + enforced-enabled ingestion; NPS and Recreation.gov registry entries in code with licence/attribution snapshots per record ([ADR-0006](adr/0006-source-licences-and-refresh-contracts.md)).
- 🔴 **Blocking:** human legal review of each source's commercial-use terms and per-asset media rights; OSM/ODbL attribution compliance once map tiles are wired; the map tile provider decision ([ADR-0005](adr/0005-map-tile-provider.md)).

### 3. Safety — 🟡 owner: Content + engineering
Official alert/permit links work; stale-data behaviour, sensitive-location policy, disclosures tested.
- 🟢 Permit info always links to the official land manager; safety + data-freshness disclosure on every destination/trail page; forecast cards carry provenance and are dropped when stale; dynamic data expires and is never shown stale (verified).
- 🔴 **Blocking:** real NPS alert/closure ingestion (needs the key + a monitored refresh SLO); a written sensitive-location policy; human verification that real permit links resolve.

### 4. Data operations — 🟢/🟡 owner: Engineering lead
Ingestion, retries/DLQ, outbox, reconciliation, data-health dashboard, manual recovery runbook exercised.
- 🟢 Ingestion pipeline (idempotent, single-flight, dead-letter queue, auditable runs), outbox emit+drain, data-health dashboard, publish workflow — all built and verified end-to-end offline.
- 🟡 **Remaining:** search-index reconciliation is moot at Phase 1 (Postgres is the index) but becomes real if Meilisearch graduates; write the manual-recovery runbook; exercise a real ingestion outage.

### 5. Security / privacy — 🟡 owner: Security/privacy owner
Threat model, roles/RLS, OAuth, secret handling, analytics consent, privacy/terms, deletion/export, backup restore.
- 🟢 Secure headers/CSP, rate limiting, allow-list validation, parameterised SQL, Auth.js DB sessions, account export (no secrets) + deletion, consent-gated event dictionary that never emits PII. See [security.md](security.md).
- 🔴 **Blocking:** Postgres RLS + least-privilege roles (Supabase), managed secrets + rotation, threat-model review, privacy policy / terms / cookie notice, backup + tested restore ([ADR-0009](adr/0009-backups-rpo-rto.md)), live Google OAuth credentials.

### 6. Reliability — 🔴 owner: Engineering lead
Performance SLO smoke test, error monitoring, uptime checks, source-freshness alerts, incident drills.
- 🟢 Single error-reporting entry point wired; forecast freshness gating; CI runs unit + full E2E against a real DB.
- 🔴 **Blocking:** Sentry + uptime + source-freshness monitoring accounts and alert runbooks; a production RUM performance measurement (the PRD SLOs are RUM-based, not build-time); incident drills. Static generation / ISR for published pages is also deferred (pages are `force-dynamic` now — see roadmap M0/M2 notes).

### 7. Product validation — 🔴 owner: Product lead
Usability sessions show target users understand *why* a result fits and can reach official planning info.
- 🟢 The "why this fits" surfacing (facets, relaxation transparency, official links) is built and clickable.
- 🔴 **Blocking:** actual usability sessions with real users — a research activity, not code, and it needs real content (gate 1) to be meaningful.

### 8. SEO — 🟢/🟡 owner: Growth/content lead
Only approved canonical pages index; metadata, sitemaps, structured data, noindex rules validated.
- 🟢 `robots.ts` (disallows admin/api/account/saved/signin), `sitemap.ts` (published canonical pages only — drafts have no URL), per-route `noindex` on non-content pages, JSON-LD with only real on-page facts (no manufactured ratings/availability), locale-aware `<title>` templates.
- 🟡 **Remaining:** Search Console verification, `hreflang` once `es` ships, Open Graph images from cleared media (needs real media), validation against the real corpus.

## What a human needs to do next (rough order)

1. **Provision infrastructure**: Supabase project (+ RLS roles), Vercel, Cloudflare R2, and pick the map tile provider ([DEPENDENCIES.md](DEPENDENCIES.md)).
2. **Get source keys** and complete the legal/terms review for each source.
3. **Build the corpus**: ingest → edit per rubric → publish the first real destinations. This is the long pole.
4. **Stand up monitoring**: Sentry, uptime, source-freshness alerts — each with an owner + runbook.
5. **Legal deliverables**: privacy policy, terms, cookie/consent notice, takedown contact.
6. **Backups + a tested restore drill**; define RPO/RTO.
7. **Usability sessions** against real content.
8. **Wire live Google OAuth + GTM/GA4** and the consent banner.

None of these are blocked on more application engineering — the platform is ready to receive them.
