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
| M0 | Project scaffolding | **Done** | Next.js (App Router) + TypeScript + Tailwind CSS 4 + shadcn/ui initialized; lint/format/typecheck configured; CI skeleton (install → lint → typecheck → test → build on PR); local Postgres + PostGIS via Docker Compose; Prisma (v7, driver-adapter based) connected; `/docs/adr/` created with the required ADRs stubbed. | App boots locally with a placeholder page ✓; lint/typecheck/test/build all pass locally ✓; `SELECT postgis_version()` succeeds against the local DB via `prisma db execute` ✓; all required ADRs exist as files ✓ (see [ADR tracker](#adr-tracker)). CI workflow is written but unverified — nothing has been pushed yet. |
| M1 | Minimal schema + seed data | **Done** | Trimmed Prisma schema — `Destination`, `Trail`, `DestinationTrail`, `MediaAsset` with enum facets and PostGIS geography columns. No provenance model yet (M4). Seed script with 6 fabricated destinations + 7 trails, real geometry. | `prisma migrate deploy` + `npm run db:seed` run cleanly; verified live — spatial columns/GiST indexes present, coordinates and routes round-trip via PostGIS, seed is idempotent. |
| M2 | Walking-skeleton discovery UI | **Done** | Home → Explore (card grid + 5 facet filters) → Destination (hero, facts, MapLibre map, trail list, safety disclosure) → Trail, all Server Components against the seeded DB. Domain-boundary folder structure per ARCHITECTURE.md. | Full click-through works on seed data (verified by screenshots + E2E), mobile-first, no spinners, map degrades gracefully — per the PRD's [Design Principles](Adventure_Discovery_PRD_v1.1.md#design-principles). |
| M3 | Search + zero-result relaxation | **Done** | Postgres FTS (`websearch_to_tsquery` over name/summary/tags/activities) + `pg_trgm` `word_similarity` typo tolerance; facet queries; the PRD's mandated [constraint-relaxation flow](Adventure_Discovery_PRD_v1.1.md#zero-result-constraint-relaxation) (drop order budget → month → trip length → difficulty; never activity/keyword) with a transparency banner and removable chips. | The zero-result relaxation Playwright test passes (binding PRD requirement) — plus 4 other E2E specs and 9 unit tests over the drop-order logic. |
| M4 | Full canonical data model | Not started | Expand schema to the complete model: `Source`, `SourceRecord`, `FactAssertion`, `PermitRequirement`, `ContentRevision`. Migrate seed data into the provenance-backed shape. | Every seed record has real (even if manually authored) provenance fields — no more bare facts with no source. |
| M5 | Ingestion pipeline — first source | Not started | Build the full [fetch → validate → normalize → store → outbox](ARCHITECTURE.md#5-data-ingestion-pipeline) pipeline, idempotent and resumable, against one real source first — NPS API is the natural first pick (richest official data, most launch-gate-relevant). | One real source flows end-to-end into the admin review queue without manual DB edits. |
| M6 | Editorial admin tooling | Not started | Protected `/admin`: destination list + editor, source record viewer, revision history, publish/unpublish, data-health dashboard, media approval queue — per [Internal Editorial Tooling](Adventure_Discovery_PRD_v1.1.md#internal-editorial-tooling), a launch requirement, not a nice-to-have. | An editor can take a destination from draft to published without touching SQL or Supabase Studio. |
| M7 | Auth + saves | Not started | Google OAuth via Auth.js (session-strategy ADR resolved first), save/unsave a destination, account export + deletion. | Sign-in, save, and account deletion are all integration-tested; `is_admin` gate on admin routes verified separately from normal auth. |
| M8 | AI-assisted drafting | Not started | Gemini Flash drafts a summary/tags from a *supplied* source packet only — schema-validated output, `origin=ai_assisted` marker, prompt version + source packet hash recorded, human-approval gate before publish. | No factual field (difficulty, permits, duration, budget, conditions) is ever AI-originated — only summaries/tags, and never auto-published. |
| M9 | Content population | Not started | Bring remaining sources online (Recreation.gov, OSM/Overpass, USGS, Open-Meteo); populate the real 25–50 launch destinations through the actual pipeline and editorial rubrics — not by hand-editing seed data. | Corpus meets the [content-quality launch gate](Adventure_Discovery_PRD_v1.1.md#launch-gates). |
| M10 | Observability + security hardening | Not started | Sentry across frontend/API/ingestion; consent-aware GTM/GA4/GSC; uptime + source-freshness monitoring; backup + restore drill; RLS and least-privilege service credentials per write path. | Alerts have owners and runbooks; a restore drill has actually been run and documented, not just planned. |
| M11 | Launch gate review | Not started | Walk every row of the PRD's [Launch Gates](Adventure_Discovery_PRD_v1.1.md#launch-gates) table (content quality, source/legal, safety, data operations, security/privacy, reliability, product validation, SEO). | Every gate has evidence and an explicit sign-off — not assumed green because the code exists. |

### M0 notes (what actually happened vs. the plan)

- **Supabase was not provisioned.** No Supabase account/credentials exist yet, and none were needed — M0–M4 run against local Postgres+PostGIS via `docker-compose.yml` (`postgis/postgis:17-3.4`). Point `DATABASE_URL` at a real Supabase project only when actually deploying; that's a deploy-time task, not part of this roadmap's milestones as written. Note for Apple Silicon dev machines: this image has no native arm64 build and runs under emulation — functional but slower; revisit if local DB performance becomes noticeable.
- **`npm audit` currently reports 3 high-severity CVEs** in Next.js's own bundled transitive deps (`postcss`, `sharp`) with no non-breaking fix available yet — tracked in [ADR-0001](adr/0001-framework-version-and-caching-model.md), checked non-blockingly in CI. Re-run `npm audit` on every Next.js patch bump.
- **Prisma generated as v7.9.0**, which changed more than expected: no built-in query engine binary for SQL — it now requires an explicit driver adapter (`@prisma/adapter-pg` + `pg`) passed to `PrismaClient`. Prisma's own CLI installed reference docs under `.agents/skills/` (symlinked from `.claude/skills/`) — worth reading before assuming any pre-2026 Prisma pattern still applies, especially for M1's `Unsupported(...)` PostGIS field types.
- **CI is written but not yet verified live** — this repo has no commits from these milestones yet, so `.github/workflows/ci.yml` has never actually run on GitHub. Confirm both jobs (`checks` and `e2e`) go green on the first real PR.

### M1–M3 notes (what actually happened vs. the plan)

- **PostGIS + Prisma friction, resolved.** Geography columns are `Unsupported(...)` and nullable at the DB level (Prisma's typed `.create()` can't populate them — rows are created, then geometry written via parameterized raw SQL). Prisma 7 *does* accept `@@index(..., type: Gist)` on `Unsupported` columns, which is load-bearing: without the schema declaration, every `migrate dev` tries to DROP the GiST indexes. Full write-up in [ADR-0003](adr/0003-postgis-spatial-model.md).
- **Use `prisma migrate deploy`, not `migrate dev`, for the extension migrations.** `migrate dev` interactively prompts to reconcile drift it can't represent; `deploy` just applies pending migrations non-interactively.
- **Static generation deferred to M6.** The content pages read the DB, so they're `force-dynamic` for now — static generation at build would need a database in CI. Proper ISR/static generation for published pages (the PRD's caching model) is wired at M6 with a CI database and the outbox→revalidate path. Noted at the top of `src/app/page.tsx`.
- **`postinstall: prisma generate` added.** The generated client is gitignored, so CI and fresh clones regenerate it on install; without this, typecheck/build fail with no client.
- **Search is inline FTS + `word_similarity`, no stored tsvector/index.** Correct and fast for a 25–50 row corpus; a stored/indexed FTS column (or Meilisearch) is gated on measured need per [ADR-0004](adr/0004-search-graduation-criteria.md). `word_similarity` (not `similarity`) is what makes typos like "zionn" → "Zion Narrows Basecamp" match.
- **Map uses a keyless demo tile source (local dev only).** MapLibre renders; the real tile provider is still [ADR-0005](adr/0005-map-tile-provider.md). The map is progressive enhancement — it degrades to a static fallback and never blocks reading a destination.

## Key constraints worth re-reading before starting a milestone

Easy to lose track of in code; each of these is a binding PRD rule, not a suggestion:

- **M3** — a hard "no results" state is a product failure. Relaxation must be visible, labeled, and reversible (removable chip), never a silent widened query.
- **M5/M9** — no source may be ingested, transformed, or displayed until it has a reviewed entry in the [source registry](Adventure_Discovery_PRD_v1.1.md#source-registry-and-permitted-use). Raw captures are preserved with checksums; partial writes cannot publish a record.
- **M6** — publish/unpublish is a single action that emits the outbox event and triggers index/cache rebuild — not a direct DB write from the admin UI.
- **M8** — AI cannot fill factual gaps under any circumstance. It drafts from a supplied packet and stops; a human reviewer accepts responsibility for the published result.
- **All content milestones** — dynamic data (weather, closures, permit inventory) are expiring, attributable snapshots or official outbound links, never permanent fields. A stale snapshot gets removed from the UI, not shown anyway.

## ADR tracker

The PRD requires these decisions to live in `/docs/adr/` rather than the PRD itself. Status as of M3:

| ADR | Forces a decision by | Status |
|---|---|---|
| Framework version + caching model | M0 | **Accepted** — [ADR-0001](adr/0001-framework-version-and-caching-model.md) |
| Auth.js session strategy (DB vs. JWT sessions) | M7 | Not started |
| PostGIS and spatial model | M1 | **Accepted** — [ADR-0003](adr/0003-postgis-spatial-model.md) |
| Search graduation criteria (when Postgres FTS → Meilisearch) | M3 | Partial — inline FTS + pg_trgm shipped; numeric graduation thresholds still open in [ADR-0004](adr/0004-search-graduation-criteria.md) |
| Map tile provider + OSM compliance | M2 | Open — demo tiles in use for local dev only; production provider undecided ([ADR-0005](adr/0005-map-tile-provider.md)) |
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
