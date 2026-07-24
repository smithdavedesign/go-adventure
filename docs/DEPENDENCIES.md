# Dependencies Requiring Your Involvement

Things only you can do — external accounts, credentials, and business/legal decisions I can't make or provision on your behalf. Nothing here blocks the roadmap through **M3**; local Docker Postgres+PostGIS covers all of it. Everything below is organized by the milestone that actually needs it, so you can ignore anything past where we currently are.

Once you have a value, it goes in `.env` (copy from [`.env.example`](../.env.example) — never commit `.env`, it's gitignored).

## Not needed yet (M1–M3)

Nothing. We're running entirely on local Docker Postgres+PostGIS (`docker-compose.yml`) — no account, no API key, no signup.

## Before M5 — first ingestion source (NPS)

- **NPS API key** — National Park Service's developer portal at `nps.gov/subjects/developer`. Free signup, no approval wait typically. Goes in `.env` as `NPS_API_KEY`.
  - Registry entry for this source still needs to be filled in at [`docs/adr/0006-source-licences-and-refresh-contracts.md`](adr/0006-source-licences-and-refresh-contracts.md) before we ingest anything with it — getting the key doesn't skip that review.

## Before M7 — auth

- **Google OAuth credentials** — in Google Cloud Console (`console.cloud.google.com`): create a project (or reuse one), configure the OAuth consent screen, then create an **OAuth 2.0 Client ID** of type "Web application."
  - Authorized redirect URI (Auth.js's default callback path): `http://localhost:3000/api/auth/callback/google` for local dev, plus the production URL equivalent once deployed.
  - Produces `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` for `.env`. `AUTH_SECRET` is separate — generate a random value yourself (e.g. `openssl rand -base64 32`), not something Google gives you.
  - Session strategy (DB vs JWT) is still an open decision — [ADR-0002](adr/0002-authjs-session-strategy.md).

## Before M8 — AI-assisted drafting

- **Gemini API key** — Google AI Studio (`aistudio.google.com`) is the fastest path to a Gemini key; Vertex AI via Cloud Console is the alternative if you want billing/quota managed there instead. Which one, plus retention/data-use terms and a cost cap, is [ADR-0007](adr/0007-ai-provider-and-data-handling.md) — not decided yet, so hold off generating this key until that ADR is actually settled (the key itself is trivial; the terms review it's gated behind isn't).

## Before M9 — remaining ingestion sources

- **Recreation.gov / RIDB API key** — developer signup at `ridb.recreation.gov`. Goes in `.env` as `RECREATION_GOV_API_KEY`.
- **Open-Meteo commercial plan** — only if we exceed their free non-commercial tier; check `open-meteo.com`'s pricing before this becomes a paid dependency. `OPEN_METEO_API_KEY` in `.env` only applies to the paid tier.
- USGS and OpenStreetMap/Overpass are expected to stay keyless at our volume — no action unless ingestion hits a rate limit.
- Each of these also needs its own source-registry entry (owner, licence, attribution, refresh cadence) per [ADR-0006](adr/0006-source-licences-and-refresh-contracts.md) before use, same as NPS.

## Before M5/M6 — media storage

- **Cloudflare R2** — create a Cloudflare account (`dash.cloudflare.com`) and an R2 bucket. Produces `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL` for `.env`.

## Decision needed, not yet a signup task

- **Map tile provider** — [ADR-0005](adr/0005-map-tile-provider.md) is undecided (MapLibre GL is just the renderer; PRD explicitly disallows depending on shared public OSM tile infrastructure in production). M2's map view uses a free/keyless demo tile source for local dev only — that placeholder is not a production answer. When you're ready to pick (candidates worth comparing: MapTiler, Stadia Maps, Mapbox, or a self-hosted tile stack), that's when this becomes a signup task.

## Before deploy / beta

- **Supabase project** — create at `supabase.com`, enable the PostGIS extension, grab the connection string. Until then, local Docker is authoritative for dev. Note: Supabase's pooled connection typically needs a separate `DIRECT_URL` for Prisma migrations (see the bottom of `.env.example`).
- **Vercel account** — `vercel.com`, for hosting/deploy per `ARCHITECTURE.md`.
- **Domain registration** — PRD candidates: `travel-roamer.com` (preferred), with `travelroamer.co` / `travelerroam.com` as fallbacks. Trademark clearance still needed per the PRD's Product Name section — this is a business decision, not something to register reflexively.
- **Sentry account** — `sentry.io`, for error monitoring (M10).
- **Google Tag Manager / GA4 / Search Console** — `tagmanager.google.com`, `analytics.google.com`, `search.google.com/search-console`. Consent-aware setup per the PRD's Analytics section — the event dictionary ([ADR-0008](adr/0008-analytics-consent-model.md)) needs to exist before wiring these up, not after.

## Legal / business (no engineering blocker, but on you, not me)

These come up in the PRD's Launch Gates table and won't get resolved by writing more code:

- Source commercial-use terms and legal review (Source/legal gate — "Product + legal reviewer" owner in the PRD).
- Privacy policy, terms of use, cookie/analytics consent notice, copyright/takedown contact — required before user accounts and analytics go live.
- Backup/recovery owner and RPO/RTO target — [ADR-0009](adr/0009-backups-rpo-rto.md), a decision, not a config file.
- Commercial cost budget/approval for paid services (hosting, weather data, AI, maps) — [ADR-0010](adr/0010-commercial-service-cost-controls.md).

I'll keep building against local/free resources and flag in the roadmap whenever a milestone is actually blocked waiting on one of these — I won't stall waiting on items further down this list than what we're currently building.
