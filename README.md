# Travel Roamer *(working name)*

> The "Skyscanner Explore" experience for outdoor adventure. Users come to discover *where* to go, not just to research a place they've already chosen.

**Status:** Pre-code — product spec and architecture are locked for Phase 1 planning; implementation has not started. See [Status](#status) below.

The name "Travel Roamer" is a candidate pending domain and trademark clearance (see the PRD's Product Name section) — it's used here as the working name, not a final decision.

---

## What this is

An adventure discovery platform for outdoor travelers (backpackers, hikers, climbers, skiers, divers, vanlifers) — think **Airbnb × Nomads × Lonely Planet × Skyscanner Explore**. The core interaction is answering *"I have a week off in September, where should I go backpacking?"*, not *"show me trails around Chamonix."*

**It is explicitly not:** a trail app, a GPS navigation app, a fitness tracker, a social network, a booking platform, or a replacement for AllTrails / Gaia GPS. Every feature decision should answer *"does this help users discover where to go, or plan after they've chosen?"* — discovery always wins. Full reasoning: [Product Philosophy and Non-Goals in the PRD](docs/Adventure_Discovery_PRD_v1.1.md#product-philosophy).

**Phase 1 launch slice (binding):** 25–50 human-reviewed US destinations, hiking + backpacking only, faceted discovery + search, no community submissions/billing/AI planner/live availability promises. See [MVP → Phase 1 Launch Slice](docs/Adventure_Discovery_PRD_v1.1.md#phase-1-launch-slice--binding) for the full constraint set.

## Status

There is no application code in this repository yet. What exists today:

- [`docs/Adventure_Discovery_PRD_v1.1.md`](docs/Adventure_Discovery_PRD_v1.1.md) — the binding product spec: scope, data model, content-trust policy, security, performance SLOs, launch gates, risk register.
- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — C4 diagrams, ERD, ingestion/auth/search flows, and the technical decisions derived from the PRD.
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — the engineering execution plan: Phase 1 broken into sequenced, buildable milestones, starting with project scaffolding.

Current stage is **Milestone 0** in the roadmap (project scaffolding — not yet started). There's no install/run instructions here because there's nothing to run yet; once M0 lands, this section will be replaced with real setup steps.

## Tech stack (planned)

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

The PRD's Documentation section anticipates a fuller `/docs` set (`search.md`, `security.md`, `deployment.md`, `adr/`, etc.) — those are added as each area is actually built, per the roadmap, rather than stubbed out in advance.

## What's next

See [`docs/ROADMAP.md`](docs/ROADMAP.md) for the full milestone sequence. Short version: scaffold the Next.js/Prisma project (M0), then build a thin walking-skeleton (Home → Explore → Destination page on seed data) before investing in the ingestion pipeline, provenance model, or admin tooling.
