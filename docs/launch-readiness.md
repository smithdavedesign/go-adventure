# Launch Readiness Assessment

Walks every gate in the [PRD Launch Gates](Adventure_Discovery_PRD_v1.1.md#launch-gates) table and records the honest current state. **No gate is signed off** — each requires an accountable human owner to verify evidence, and several are blocked on real content, external accounts, or legal/operational process that engineering cannot produce.

This is the M11 deliverable: not "launch approved," but "here is exactly what stands between the working platform and a launchable one."

**Legend:** 🟢 built & verified in code · 🟡 partial (code done, human/external work remains) · 🔴 not startable by engineering alone.

## The one-line summary

The **platform is built and works end-to-end** — discovery, search, the binding zero-result relaxation, the provenance-backed content model, ingestion, editorial publishing, auth, saves, AI-assisted drafting, and expiring dynamic data — and a **real 28-park corpus is now live** (sourced facts, representative trails, forecasts, licensed photos, all attributed and freshness-gated). What remains is not more application code: it's **editorial sign-off on the corpus, external service accounts, and human/legal sign-off**. The biggest remaining item is a human editorial pass per rubric and deciding the final launch set — human work by PRD design.

## Gate-by-gate

### 1. Content quality — 🟡 owner: Editorial lead
Every published destination/trail must pass rubric, source, attribution, rights, and freshness checks; corpus scope disclosed.
- 🟢 The machinery exists: rubric-gated publish (a draft can't publish until difficulty/budget/trip-length/activities/geometry are present), provenance backbone, `noindex` for anything unpublished.
- 🟢 A real corpus is live: **28 iconic national parks** published, each with an NPS-sourced summary, entrance fee, and live alerts, plus representative OpenStreetMap trails (**28/28**), Open-Meteo forecasts + elevation, an open-licensed Wikimedia hero + a **6-photo gallery** (**28/28**, ~168 photos), highlights, and nearby airports. Every source is attributed and dynamic data is freshness-gated.
- 🟡 **Remaining (human):** an editorial pass per rubric to sign off the researched facets (difficulty / best-months / budget are editorial judgements), a decision on the final launch-set size/regions, and the corpus-scope disclosure. The platform *and* a real corpus now exist — what's owed is editorial sign-off, not ingestion. Downgraded from 🔴 now that content is no longer fabricated seed data.

### 2. Source / legal — 🟡 owner: Product + legal reviewer
Source registry complete; commercial terms, OSM compliance, media rights, notices reviewed.
- 🟢 Source registry model + enforced-enabled ingestion; live source contracts captured with licence/attribution snapshots, and attribution is rendered in-product (map/footer credits, hero media credit, weather provenance) ([ADR-0006](adr/0006-source-licences-and-refresh-contracts.md), [source-registry.md](source-registry.md)).
- 🔴 **Blocking:** human legal review/sign-off of each source's commercial-use terms and per-asset media rights, plus periodic re-review ownership.

### 3. Safety — 🟡 (green-leaning) owner: Content + engineering
Official alert/permit links work; stale-data behaviour, sensitive-location policy, disclosures tested.
- 🟢 Permit info links to official land-manager pages; safety + data-freshness disclosure appears on destination/trail pages; forecast and alert snapshots are freshness-gated (`ForecastSnapshot`/`AlertSnapshot`) and are dropped when stale.
- 🟡 **Remaining:** written sensitive-location policy, monitored alert-refresh SLO/runbook, and periodic human spot-checks that official permit links still resolve.

### 4. Data operations — 🟢/🟡 owner: Engineering lead
Ingestion, retries/DLQ, outbox, reconciliation, data-health dashboard, manual recovery runbook exercised.
- 🟢 Ingestion pipeline (idempotent, single-flight, dead-letter queue, auditable runs), outbox emit+drain, data-health dashboard, publish workflow — all built and verified end-to-end offline.
- 🟡 **Remaining:** search-index reconciliation is moot at Phase 1 (Postgres is the index) but becomes real if Meilisearch graduates; write the manual-recovery runbook; exercise a real ingestion outage.

### 5. Security / privacy — 🟡 owner: Security/privacy owner
Threat model, roles/RLS, OAuth, secret handling, analytics consent, privacy/terms, deletion/export, backup restore.
- 🟢 Secure headers/CSP, rate limiting, allow-list validation, parameterised SQL, Auth.js DB sessions, account export (no secrets) + deletion, consent-gated event dictionary that never emits PII. **Admin is now gated by an authenticated Google account with `isAdmin`** — the interim password gate is retired, and each admin server action re-checks the role (not just the page render, closing the direct-POST gap). Grant the role with `npm run set-admin -- <email>`. See [security.md](security.md).
- 🟡 **RLS drafted:** least-privilege roles (web / ingest / read-only), a published-only read policy, and fail-closed user-isolation policies are written in [`prisma/rls-policies.sql`](../prisma/rls-policies.sql). Applying them (with DB-owner creds + per-context connection strings) is a review/apply step, not more code.
- 🔴 **Blocking:** apply the RLS/roles, managed secrets + rotation, threat-model review, privacy policy / terms / cookie notice, backup + tested restore ([ADR-0009](adr/0009-backups-rpo-rto.md)), production Google OAuth callback + first admin promotion.

### 6. Reliability — 🟡 owner: Engineering lead
Performance SLO smoke test, error monitoring, uptime checks, source-freshness alerts, incident drills.
- 🟢 Single error-reporting entry point wired; forecast + alert freshness gating; CI runs unit + full E2E against a real DB, plus **automated accessibility checks (axe-core, zero serious/critical violations on home/explore/destination/trail)** and a **Lighthouse CI** job (perf/a11y/SEO/best-practices, reports uploaded). **ISR is now wired** for published pages: the home page is static+ISR and trail pages are on-demand ISR (cached + hourly revalidate), reducing per-request DB load; the destination page stays dynamic by design (per-user save state + never-stale safety alerts).
- 🔴 **Blocking:** Sentry + uptime + source-freshness monitoring accounts and alert runbooks; a production RUM performance measurement (the PRD SLOs are RUM-based, not lab Lighthouse); incident drills.

### 7. Product validation — 🔴 owner: Product lead
Usability sessions show target users understand *why* a result fits and can reach official planning info.
- 🟢 The "why this fits" surfacing (facets, relaxation transparency, official links) is built and clickable.
- 🔴 **Blocking:** actual usability sessions with real users — a research activity, not code, and it needs real content (gate 1) to be meaningful.

### 8. SEO — 🟢/🟡 (green-leaning) owner: Growth/content lead
Only approved canonical pages index; metadata, sitemaps, structured data, noindex rules validated.
- 🟢 `robots.ts` (disallows admin/api/account/saved/signin), `sitemap.ts` (published canonical pages only — drafts have no URL), per-route `noindex` on non-content pages, JSON-LD with only real on-page facts, locale-aware `<title>` templates, Open Graph images from cleared hero media, and **ISR-served static HTML for the home + trail pages** (crawler-friendly, fast) with real photos on the 28 live parks.
- 🟡 **Remaining:** Search Console verification, `hreflang` once `es` ships, and SEO validation over the final human-curated launch corpus.

## What's needed from you

Everything below is **yours to do** — accounts, credentials, decisions, content, and legal/ops process that engineering can't produce. Each item notes what it produces, which `.env` var it fills (see [.env.example](../.env.example) / [DEPENDENCIES.md](DEPENDENCIES.md)), what it unblocks, and where **Claude Code can take over once you hand off the input**. "Effort" is your hands-on time; "cost" is rough monthly.

Nothing here is blocked on more application code — the platform is built and waiting to receive these.

### A. Accounts & credentials to create

| # | Service | Where | Produces / env var | Unblocks | Effort | Cost |
|---|---|---|---|---|---|---|
| ~~A1~~ | ~~**Supabase** project~~ | ✅ **Done** — project `mhftgnjjqfceojmxomls` (us-west-2). All 7 migrations applied, seed corpus live. `DATABASE_URL` (pooler) + `DIRECT_URL` set in `.env`. | — | — | — |
| A2 | **Vercel** project | vercel.com | Deploy target; set all env vars in the dashboard | Public hosting, ISR, preview deploys | ~20 min | Free→$20 |
| A3 | **Cloudflare R2** bucket | dash.cloudflare.com | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` | Real media + raw source captures (replaces local `.ingestion-raw`) | ~20 min | ~$0–5 |
| ~~A4~~ | ~~**NPS API key**~~ | ✅ **Done** — `NPS_API_KEY` set locally + Vercel. Smoke test: `npm run test:smoke`. Live ingest verified: 50 records drafted, 0 dead-lettered. | — | — | — |
| ~~A5~~ | ~~**Recreation.gov (RIDB) key**~~ | ✅ **Done** — `RECREATION_GOV_API_KEY` set locally + Vercel. Smoke test: `npm run test:smoke`. | — | — | — |
| ~~A6~~ | ~~**Google OAuth client**~~ | ✅ **Done** — `AUTH_GOOGLE_ID` + `AUTH_GOOGLE_SECRET` set. OAuth flow verified locally (Google sign-in screen reached). Add `https://<prod-domain>/api/auth/callback/google` to Google Console for production. | — | — | — |
| ~~A7~~ | ~~**`AUTH_SECRET`** (prod)~~ | ✅ **Done** — generated and set in `.env` + Vercel. | — | — | — |
| A8 | **Gemini key** *(optional)* | aistudio.google.com or Vertex | `GEMINI_API_KEY` | Live AI drafting (mock works without it) — **hold until ADR-0007 terms/cost review** | ~10 min | usage-based |
| A9 | **Sentry** project | sentry.io | `SENTRY_DSN` | Error alerting (call sites already wired) | ~15 min | Free→$26 |
| A10 | **GTM + GA4 + Search Console** | tagmanager / analytics / search.google.com | `NEXT_PUBLIC_GTM_ID`, `NEXT_PUBLIC_GA4_ID` | Consent-gated analytics (event dictionary already built) | ~45 min | Free |
| ~~A11~~ | ~~**Map tile provider**~~ | ✅ **Done** — MapTiler selected and wired (`NEXT_PUBLIC_MAPTILER_KEY`; MapLibre fallback remains local-dev only). | — | — | — |

> After A1–A2 exist, hand me the connection string and I'll run migrations + seed against Supabase and set up the Vercel config. After A4–A6/A9–A11, I wire each into the app.

### B. Decisions only you can make

- **B1. Map tile provider follow-through** ([ADR-0005](adr/0005-map-tile-provider.md), accepted). Keep quota/cost monitoring and verify attribution remains visible after style or provider changes.
- **B2. Product name + domain.** "Travel Roamer" is a candidate pending **trademark clearance** and domain purchase (`travel-roamer.com` preferred). Business/legal call.
- **B3. Launch regions + the destination shortlist.** Which "deliberately limited set of launch regions," and the specific 25–50 destinations. Drives the whole corpus effort.
- **B4. Cost budget** for paid services ([ADR-0010](adr/0010-commercial-service-cost-controls.md)) — a costed operating plan is a PRD gate before beta.
- **B5. RPO/RTO target** for backups ([ADR-0009](adr/0009-backups-rpo-rto.md)).

### C. Content — editorial sign-off (your judgment)

The corpus now exists: **28 national parks are published** with sourced facts, representative trails, forecasts, and open-licensed photos. What remains is human, per PRD design.

1. Review the 28 live destinations in `/admin` and confirm the editorial facets per rubric — difficulty, best months, budget (with assumptions), trip length, label — and that each permit type + official link is correct. These are the researched editorial judgements the publish gate can't verify for you.
2. Decide the final launch set (size + regions) and disclose corpus scope. Add or retire destinations with the ingestion + enrichment scripts (`ingest:nps`, `ingest:trails`, `enrich:fees|media|highlights`, `alerts:refresh`).
> I drive the mechanics (ingest parks, run trail/photo/fee enrichment, AI summary suggestions, admin flow); the rubric sign-off and source verification are yours — that's the content-quality gate.

### D. Legal & policy deliverables (you / legal)

- **D1.** Source commercial-terms + media-rights review for NPS, Recreation.gov, OSM/ODbL, Open-Meteo ([ADR-0006](adr/0006-source-licences-and-refresh-contracts.md)).
- **D2.** Privacy policy, terms of use, cookie/analytics consent notice, copyright/takedown contact — required before user accounts + analytics go live.
- **D3.** Sensitive-location policy (don't publish precise geometry for restricted/vulnerable sites).
- **D4.** A named incident-response owner + severity/containment/notification path.

### E. Operations (you, with my help wiring)

- **E1.** Stand up **uptime + source-freshness monitoring** with an owner + runbook per alert (a dashboard without an escalation path isn't monitoring).
- **E2.** Configure **off-platform backups + run a restore drill**; record RPO/RTO (B5).
- **E3.** Apply **Postgres RLS + least-privilege roles** in Supabase. **SQL is drafted** at [`prisma/rls-policies.sql`](../prisma/rls-policies.sql) — least-privilege roles by context (web / ingest / read-only), a published-only read policy, and fail-closed user-isolation policies. Review it, then apply with DB-owner creds and split connection strings by context.
- **E4.** **Usability sessions** against real content — validates the "why this fits" experience (a PRD gate).

### Suggested order

**Infra first** (A1→A2→A3, B1→A11) → **keys** (A4–A7, A9–A10) → **content loop** (C, the long pole — start as soon as A4/A5 land) → in parallel **legal** (D) and **ops** (E) → **live OAuth + analytics** (A6, A10 wiring) → **usability** (E4) → **launch-gate sign-off** (this doc, with owners).

### What I (Claude Code) can do next while you start on the above

Delivered since this doc was first written: **ISR** for home + trail pages (`force-dynamic` retired there), **admin auth on Auth.js `isAdmin`** (password gate retired, actions role-guarded), **trail/media enrichment completed to 28/28**, the **RLS SQL draft** (E3), and **axe + Lighthouse CI**. Still buildable next:
- Move the **destination page** onto ISR too, by relocating its per-user save state and safety alerts to client-fetched holes (deliberately deferred — keeps alerts never-stale).
- Apply the **RLS policies** together (you run them with DB-owner creds).
- Wire **`hreflang` + `es` locale** and Search Console once A10 lands.
