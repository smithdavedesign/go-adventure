# Travel Roamer *(working name)*

> The "Skyscanner Explore" experience for outdoor adventure. Users come to discover *where* to go, not just to research a place they've already chosen.

**Status:** Milestones 0–3 complete — a working walking-skeleton you can run and click through: discover destinations on Explore with faceted filters and typo-tolerant keyword search, transparent zero-result relaxation, and destination/trail pages with maps. Content is fabricated seed data (real ingestion is M5). See [Status](#status) below.

The name "Travel Roamer" is a candidate pending domain and trademark clearance (see the PRD's Product Name section) — it's used here as the working name, not a final decision.

---

## What this is

An adventure discovery platform for outdoor travelers (backpackers, hikers, climbers, skiers, divers, vanlifers) — think **Airbnb × Nomads × Lonely Planet × Skyscanner Explore**. The core interaction is answering *"I have a week off in September, where should I go backpacking?"*, not *"show me trails around Chamonix."*

**It is explicitly not:** a trail app, a GPS navigation app, a fitness tracker, a social network, a booking platform, or a replacement for AllTrails / Gaia GPS. Every feature decision should answer *"does this help users discover where to go, or plan after they've chosen?"* — discovery always wins. Full reasoning: [Product Philosophy and Non-Goals in the PRD](docs/Adventure_Discovery_PRD_v1.1.md#product-philosophy).

**Phase 1 launch slice (binding):** 25–50 human-reviewed US destinations, hiking + backpacking only, faceted discovery + search, no community submissions/billing/AI planner/live availability promises. See [MVP → Phase 1 Launch Slice](docs/Adventure_Discovery_PRD_v1.1.md#phase-1-launch-slice--binding) for the full constraint set.

## Status

**Milestones 0–3 are done** — see [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full sequence and what's next (M4: full canonical data model + provenance). What works today, running locally:

- **Home** → **Explore** (destination card grid, five facet filters, typo-tolerant keyword search) → **Destination** (hero, facts, MapLibre map, trail list, safety disclosure) → **Trail**.
- **Zero-result relaxation**: an impossible filter combination relaxes the strictest constraint (budget → month → trip length → difficulty, never activity) with a transparent banner and removable chips, instead of a dead-end "no results" — a binding PRD behavior, covered by a Playwright test.

All content is **fabricated seed data** for building the UI — nothing is sourced or publishable. Real content arrives via the ingestion pipeline (M5) and editorial review (M6).

- [`docs/Adventure_Discovery_PRD_v1.1.md`](docs/Adventure_Discovery_PRD_v1.1.md) — the binding product spec.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — C4 diagrams, ERD, ingestion/auth/search flows, technical decisions.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — engineering execution plan, milestone status, ADR tracker.
- [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) — external setup only you can do (accounts, API keys), by milestone.
- [`docs/adr/`](docs/adr/) — Architecture Decision Records. ADR-0001 (framework/caching) and ADR-0003 (PostGIS spatial model) are accepted; the rest are decided as their milestone arrives.

## Getting started

Requires Docker (for local Postgres+PostGIS) and Node 24+ (tested on Node 25 locally).

```bash
npm install                   # postinstall runs `prisma generate`
cp .env.example .env          # defaults already match docker-compose.yml
docker compose up -d          # starts local Postgres + PostGIS on :5432
npx prisma migrate deploy     # applies migrations (enables postgis + pg_trgm)
npm run db:seed               # loads 6 sample destinations + trails
npm run dev                   # http://localhost:3000
```

Then open `/explore` and try a filter combo like *Expert difficulty + budget ≤ $250* to see the relaxation behavior, or search "zionn" to see typo tolerance.

Scripts: `npm run lint`, `npm run typecheck`, `npm run test` (Vitest unit), `npm run test:e2e` (Playwright — needs the DB up and seeded), `npm run build`. CI (`.github/workflows/ci.yml`) runs the unit checks plus a full E2E job against a Postgres+PostGIS service on every PR.

Everything past `DATABASE_URL` in [`.env.example`](.env.example) is commented out and only needed starting specific roadmap milestones (auth at M7, ingestion sources at M5/M9, AI drafting at M8) — each block says which, and [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md) is the checklist.

## Tech stack

Full rationale for each choice is in [`ARCHITECTURE.md` → Key Technical Decisions](docs/ARCHITECTURE.md#9-key-technical-decisions). Condensed:

| Layer | Choice |
|---|---|
| Frontend | Next.js (App Router), React 19, TypeScript, Tailwind CSS 4, shadcn/ui, MapLibre GL |
| Backend | Next.js Route Handlers + typed service layer, Node.js runtime, OpenAPI contract |
| Database | Supabase (Postgres + PostGIS), Prisma ORM |
| Search (Phase 1) | Postgres full-text search + `pg_trgm` — Meilisearch/pgvector deferred until graduation criteria are met |
| Auth | Auth.js, Google OAuth |
| Storage | Cloudflare R2 + CDN |
| AI | Gemini Flash — editorial draft assistance only, never a source of published facts |
| Hosting / CI | Vercel, GitHub Actions |

## Documentation

| Doc | Purpose |
|---|---|
| [PRD v1.1](docs/Adventure_Discovery_PRD_v1.1.md) | Product spec — scope, data model, content trust, security, KPIs, launch gates. The binding source of truth. |
| [Architecture](docs/ARCHITECTURE.md) | C4 diagrams, ERD, ingestion/auth/search flow, service boundaries, technical decisions. |
| [Roadmap](docs/ROADMAP.md) | Phase 1 sequenced into engineering milestones, plus the tracker for required ADRs. |
| [Dependencies](docs/DEPENDENCIES.md) | External setup only you can do — accounts, API keys, legal/business items — organized by which milestone actually needs them. |

The PRD's Documentation section anticipates a fuller `/docs` set (`search.md`, `security.md`, `deployment.md`, `adr/`, etc.) — those are added as each area is actually built, per the roadmap, rather than stubbed out in advance.

## What's next

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full milestone sequence. Short version: M0–M3 (scaffolding through the searchable walking-skeleton) are done — next is M4 (expand to the full provenance-backed data model), then M5 (first real ingestion source, NPS) and M6 (editorial admin tooling).
