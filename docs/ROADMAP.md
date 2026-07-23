# Roadmap — Phase 1 Execution Plan

**Status:** Draft — no milestone has started. This is the engineering execution plan for [Phase 1 of the PRD](Adventure_Discovery_PRD_v1.1.md#phased-roadmap); it does not restate or override product scope, which stays authoritative in the PRD. This doc answers a narrower question: *in what order do we actually build it?*

Written for a solo build (one person + Claude Code) — milestones are sequenced, not parallelized across a team. Update the Status column as work lands; add notes inline rather than rewriting history.

## How to read this

- **Sequencing is walking-skeleton-first, not PRD-layer-order.** The PRD documents the data model before the UI; we build the reverse — a thin, real, end-to-end slice on fake data first (M0–M3), *then* the provenance-backed content pipeline and admin tooling (M4–M9), then hardening and gate review (M10–M11). This trades spec-order for the fastest path to a real, clickable product loop.
- **Every milestone still has to satisfy the PRD's binding constraints** for whatever it touches — walking-skeleton-first changes the *order* of work, not the *bar* each piece has to clear once it's built for real (e.g., M3 still owes the exact zero-result relaxation behavior; M8 still can't let AI invent facts).
- Milestones M4 onward largely replace or extend what M0–M3 built with throwaway/simplified pieces (e.g., the M1 seed script is not the ingestion pipeline — it's scaffolding to unblock the UI, and gets superseded once M5 exists).

## Milestones

| # | Milestone | Status | Goal | Exit criteria |
|---|---|---|---|---|
| M0 | Project scaffolding | Not started | Next.js (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui initialized; lint/format/typecheck configured; CI skeleton (install → lint → typecheck → test on PR); Supabase Postgres + PostGIS provisioned; Prisma connected; `/docs/adr/` created with the required ADRs stubbed as "not started." | App boots locally with a placeholder page; CI runs green on an empty PR; all required ADRs exist as files (see [ADR tracker](#adr-tracker)) even if undecided. |
| M1 | Minimal schema + seed data | Not started | Trimmed Prisma schema — just `Destination`, `Trail`, `DestinationTrail`, `MediaAsset` with enough fields to render a page. No `Source`/`SourceRecord`/`FactAssertion`/provenance model yet — that's M4, once the UI shape is proven. Hand-written seed script with ~5–8 fake destinations. | `prisma migrate dev` + seed script run cleanly; seeded data is queryable. |
| M2 | Walking-skeleton discovery UI | Not started | Home → Explore (card grid + a handful of filters) → Destination page, Server Components/SSR against the seeded DB. No auth, no real search infra — plain SQL filtering is fine here. | Can go from Home to a Destination page on seed data, mobile-first, no loading spinners — per the PRD's [Design Principles](Adventure_Discovery_PRD_v1.1.md#design-principles). |
| M3 | Search + zero-result relaxation | Not started | Postgres FTS + `pg_trgm`, facet queries against the seeded corpus, and specifically the PRD's mandated [constraint-relaxation flow](Adventure_Discovery_PRD_v1.1.md#zero-result-constraint-relaxation) (drop order: budget → month/season → trip length → difficulty; never relax activity last). | The zero-result relaxation Playwright test passes — this is a binding PRD test requirement, not optional polish. |
| M4 | Full canonical data model | Not started | Expand schema to the complete model: `Source`, `SourceRecord`, `FactAssertion`, `PermitRequirement`, `ContentRevision`. Migrate seed data into the provenance-backed shape. | Every seed record has real (even if manually authored) provenance fields — no more bare facts with no source. |
| M5 | Ingestion pipeline — first source | Not started | Build the full [fetch → validate → normalize → store → outbox](ARCHITECTURE.md#5-data-ingestion-pipeline) pipeline, idempotent and resumable, against one real source first — NPS API is the natural first pick (richest official data, most launch-gate-relevant). | One real source flows end-to-end into the admin review queue without manual DB edits. |
| M6 | Editorial admin tooling | Not started | Protected `/admin`: destination list + editor, source record viewer, revision history, publish/unpublish, data-health dashboard, media approval queue — per [Internal Editorial Tooling](Adventure_Discovery_PRD_v1.1.md#internal-editorial-tooling), a launch requirement, not a nice-to-have. | An editor can take a destination from draft to published without touching SQL or Supabase Studio. |
| M7 | Auth + saves | Not started | Google OAuth via Auth.js (session-strategy ADR resolved first), save/unsave a destination, account export + deletion. | Sign-in, save, and account deletion are all integration-tested; `is_admin` gate on admin routes verified separately from normal auth. |
| M8 | AI-assisted drafting | Not started | Gemini Flash drafts a summary/tags from a *supplied* source packet only — schema-validated output, `origin=ai_assisted` marker, prompt version + source packet hash recorded, human-approval gate before publish. | No factual field (difficulty, permits, duration, budget, conditions) is ever AI-originated — only summaries/tags, and never auto-published. |
| M9 | Content population | Not started | Bring remaining sources online (Recreation.gov, OSM/Overpass, USGS, Open-Meteo); populate the real 25–50 launch destinations through the actual pipeline and editorial rubrics — not by hand-editing seed data. | Corpus meets the [content-quality launch gate](Adventure_Discovery_PRD_v1.1.md#launch-gates). |
| M10 | Observability + security hardening | Not started | Sentry across frontend/API/ingestion; consent-aware GTM/GA4/GSC; uptime + source-freshness monitoring; backup + restore drill; RLS and least-privilege service credentials per write path. | Alerts have owners and runbooks; a restore drill has actually been run and documented, not just planned. |
| M11 | Launch gate review | Not started | Walk every row of the PRD's [Launch Gates](Adventure_Discovery_PRD_v1.1.md#launch-gates) table (content quality, source/legal, safety, data operations, security/privacy, reliability, product validation, SEO). | Every gate has evidence and an explicit sign-off — not assumed green because the code exists. |

## Key constraints worth re-reading before starting a milestone

Easy to lose track of in code; each of these is a binding PRD rule, not a suggestion:

- **M3** — a hard "no results" state is a product failure. Relaxation must be visible, labeled, and reversible (removable chip), never a silent widened query.
- **M5/M9** — no source may be ingested, transformed, or displayed until it has a reviewed entry in the [source registry](Adventure_Discovery_PRD_v1.1.md#source-registry-and-permitted-use). Raw captures are preserved with checksums; partial writes cannot publish a record.
- **M6** — publish/unpublish is a single action that emits the outbox event and triggers index/cache rebuild — not a direct DB write from the admin UI.
- **M8** — AI cannot fill factual gaps under any circumstance. It drafts from a supplied packet and stops; a human reviewer accepts responsibility for the published result.
- **All content milestones** — dynamic data (weather, closures, permit inventory) are expiring, attributable snapshots or official outbound links, never permanent fields. A stale snapshot gets removed from the UI, not shown anyway.

## ADR tracker

The PRD requires these decisions to live in `/docs/adr/` rather than the PRD itself. All ten are currently undecided:

| ADR | Forces a decision by | Status |
|---|---|---|
| Framework version + caching model | M0 | Not started |
| Auth.js session strategy (DB vs. JWT sessions) | M7 | Not started |
| PostGIS and spatial model | M1/M4 | Not started |
| Search graduation criteria (when Postgres FTS → Meilisearch) | M3 | Not started |
| Map tile provider + OSM compliance | M2 | Not started |
| Source licences and refresh contracts | M5 | Not started |
| AI provider and data handling | M8 | Not started |
| Analytics consent model | M10 | Not started |
| Backups, RPO/RTO | M10 | Not started |
| Commercial service cost controls | M10/M11 | Not started |

## Explicitly still open (not resolved by this roadmap)

- **Which specific launch regions** make up the 25–50 Phase 1 destinations — the PRD requires "a deliberately limited set of launch regions" but doesn't name them.
- **Final product name and domain** — "Travel Roamer" is a PRD candidate pending trademark/domain clearance.
- **Map tile provider selection** — needed earlier than "before beta" in practice, since M2's map view depends on it.
- **No target launch date exists in the PRD.** This roadmap sequences work, not calendar time — add dates here if/when they're set, rather than inferring them.

## Phase 2 and Phase 3

Out of scope for this roadmap by design. See the PRD's [Phased Roadmap](Adventure_Discovery_PRD_v1.1.md#phased-roadmap) section — community contributions, expanded regions/activities, Meilisearch/pgvector/Redis, Spanish localization, and monetization all have their own release gates and shouldn't be pulled forward just because they'd be convenient to build alongside Phase 1 work.
