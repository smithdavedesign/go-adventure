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

## What's needed from you

Everything below is **yours to do** — accounts, credentials, decisions, content, and legal/ops process that engineering can't produce. Each item notes what it produces, which `.env` var it fills (see [.env.example](../.env.example) / [DEPENDENCIES.md](DEPENDENCIES.md)), what it unblocks, and where **Claude Code can take over once you hand off the input**. "Effort" is your hands-on time; "cost" is rough monthly.

Nothing here is blocked on more application code — the platform is built and waiting to receive these.

### A. Accounts & credentials to create

| # | Service | Where | Produces / env var | Unblocks | Effort | Cost |
|---|---|---|---|---|---|---|
| A1 | **Supabase** project | supabase.com | `DATABASE_URL` (pooled) + `DIRECT_URL` (unpooled, for migrations); enable the PostGIS extension | Production DB; replaces local Docker | ~30 min | Free→$25 |
| A2 | **Vercel** project | vercel.com | Deploy target; set all env vars in the dashboard | Public hosting, ISR, preview deploys | ~20 min | Free→$20 |
| A3 | **Cloudflare R2** bucket | dash.cloudflare.com | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Real media + raw source captures (replaces local `.ingestion-raw`) | ~20 min | ~$0–5 |
| A4 | **NPS API key** | nps.gov/subjects/developer | `NPS_API_KEY` | Live NPS ingestion (M5 already built) | ~5 min | Free |
| A5 | **Recreation.gov (RIDB) key** | ridb.recreation.gov | `RECREATION_GOV_API_KEY` | Live RIDB ingestion (built) | ~10 min | Free |
| A6 | **Google OAuth client** | console.cloud.google.com → OAuth consent + credentials | `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET`; redirect URI `https://<domain>/api/auth/callback/google` | Real Google sign-in (dev test-login already works) | ~30 min | Free |
| A7 | **`AUTH_SECRET`** (prod) | `openssl rand -base64 32` | `AUTH_SECRET` in Vercel | Session signing in production | ~1 min | Free |
| A8 | **Gemini key** *(optional)* | aistudio.google.com or Vertex | `GEMINI_API_KEY` | Live AI drafting (mock works without it) — **hold until ADR-0007 terms/cost review** | ~10 min | usage-based |
| A9 | **Sentry** project | sentry.io | `SENTRY_DSN` | Error alerting (call sites already wired) | ~15 min | Free→$26 |
| A10 | **GTM + GA4 + Search Console** | tagmanager / analytics / search.google.com | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID` | Consent-gated analytics (event dictionary already built) | ~45 min | Free |
| A11 | **Map tile provider** | see B1 | `MAP_TILES_API_KEY` (+ style URL) | Production maps (dev uses a demo source) | ~20 min | Free tier→$ |

> After A1–A2 exist, hand me the connection string and I'll run migrations + seed against Supabase and set up the Vercel config. After A4–A6/A9–A11, I wire each into the app.

### B. Decisions only you can make

- **B1. Map tile provider** ([ADR-0005](adr/0005-map-tile-provider.md), still open). The PRD forbids depending on public OSM tiles in production. Compare **MapTiler**, **Stadia Maps**, **Mapbox**, or self-hosting on cost/volume/terms, then create the account (A11). *I can draft the ADR comparison if you want.*
- **B2. Product name + domain.** "Travel Roamer" is a candidate pending **trademark clearance** and domain purchase (`travel-roamer.com` preferred). Business/legal call.
- **B3. Launch regions + the destination shortlist.** Which "deliberately limited set of launch regions," and the specific 25–50 destinations. Drives the whole corpus effort.
- **B4. Cost budget** for paid services ([ADR-0010](adr/0010-commercial-service-cost-controls.md)) — a costed operating plan is a PRD gate before beta.
- **B5. RPO/RTO target** for backups ([ADR-0009](adr/0009-backups-rpo-rto.md)).

### C. Content — the long pole (your editorial judgment)

This is the single biggest blocker and is human by PRD design. The tooling is built; the judgment is yours.

1. With A4/A5 in place, run ingestion (`npm run ingest:nps -- <parkCodes>`) to land drafts in `/admin` review queue.
2. For each destination, **fill the editorial facets per the PRD rubrics** — difficulty, best months, budget (with assumptions), trip length, one primary label — and **verify the permit type + official link**. These are exactly the fields the publish gate requires; AI can suggest a summary but never these facts.
3. Publish. Repeat to ~25–50 destinations, disclosing corpus scope.
> I can drive the mechanics (ingest specific parks, run AI summary suggestions, walk you through the admin flow), but the rubric judgments and source verification are yours to sign off — that's the content-quality gate.

### D. Legal & policy deliverables (you / legal)

- **D1.** Source commercial-terms + media-rights review for NPS, Recreation.gov, OSM/ODbL, Open-Meteo ([ADR-0006](adr/0006-source-licences-and-refresh-contracts.md)).
- **D2.** Privacy policy, terms of use, cookie/analytics consent notice, copyright/takedown contact — required before user accounts + analytics go live.
- **D3.** Sensitive-location policy (don't publish precise geometry for restricted/vulnerable sites).
- **D4.** A named incident-response owner + severity/containment/notification path.

### E. Operations (you, with my help wiring)

- **E1.** Stand up **uptime + source-freshness monitoring** with an owner + runbook per alert (a dashboard without an escalation path isn't monitoring).
- **E2.** Configure **off-platform backups + run a restore drill**; record RPO/RTO (B5).
- **E3.** Apply **Postgres RLS + least-privilege roles** in Supabase (public read / user mutation / ingestion / moderation / deploy). *I can write the SQL policies; you apply them with DB-owner creds.*
- **E4.** **Usability sessions** against real content — validates the "why this fits" experience (a PRD gate).

### Suggested order

**Infra first** (A1→A2→A3, B1→A11) → **keys** (A4–A7, A9–A10) → **content loop** (C, the long pole — start as soon as A4/A5 land) → in parallel **legal** (D) and **ops** (E) → **live OAuth + analytics** (A6, A10 wiring) → **usability** (E4) → **launch-gate sign-off** (this doc, with owners).

### What I (Claude Code) can do next while you start on the above

- Wire **ISR/static generation** for published pages (retire the `force-dynamic` shortcut) — needs A1 or a CI DB.
- Fold **admin auth into Auth.js `is_admin`**, retiring the interim password gate — needs A6 to fully test, but buildable now.
- Build the **OSM/Overpass + USGS** trail adapters (the two parked sources).
- Draft the **ADR-0005 tile-provider comparison** and the **RLS SQL policies** for E3.
- Add **axe accessibility automation + Lighthouse CI** to the pipeline.
