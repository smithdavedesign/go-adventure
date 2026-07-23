# Product Specification v1.1

**Status:** Draft — implementation-ready only after the launch gates in this document pass  
**Last updated:** 2026-07-23  
**Canonical product name:** Travel Roamer (candidate)

## Product Name

**Working Name:** Travel Roamer

**Domain Candidates**

-   `travel-roamer.com` (preferred)
-   `travelroamer.co` (fallback)
-   `travelerroam.com` (fallback)

Final availability and trademark clearance required before lock.

------------------------------------------------------------------------

# North Star

> **We are building the "Skyscanner Explore" experience for outdoor
> adventure. Users come to discover *where* to go, not just to research
> a place they've already chosen. Every feature, filter, and screen
> should reduce decision fatigue and make choosing the next adventure
> feel inspiring, effortless, and visually delightful.**

Every feature should answer one of two questions: 1. Does this help
users **discover where to go**? 2. Does this help them **plan after
they've chosen**?

The first always wins.

------------------------------------------------------------------------

# Vision

Create the world's best destination discovery platform for outdoor
adventures.

Users shouldn't have to know where they want to go.

Instead they describe the adventure they're looking for and discover
destinations through an intuitive, beautiful interface similar to
Airbnb, Nomads, and Skyscanner.

------------------------------------------------------------------------

# Product Philosophy

## NOT

A trail app.

NOT another AllTrails.

NOT another Gaia GPS.

NOT another route planner.

------------------------------------------------------------------------

## IS

An adventure discovery platform.

Think:

> Airbnb × Nomads × Lonely Planet × Skyscanner Explore

------------------------------------------------------------------------

# Competitive Landscape

> **Positioning:** We are building the **discovery layer** for outdoor adventure — not another navigation or trail application. This one sentence should end every scope debate.

| Product | Primary Job | Strength | Weakness | Our Differentiation |
|---|---|---|---|---|
| AllTrails | Find hiking trails | Massive trail database | Discovery begins *after* choosing a destination | We help users decide **where to go** before choosing trails |
| Komoot | Route planning & navigation | Excellent routing | Navigation-focused, not inspiration-focused | Destination-first experience with editorial guidance |
| The Dyrt | Camping discovery | Campground inventory | Camping-centric, limited destination discovery | Multi-day adventure destination planning |
| Hipcamp | Book campsites | Marketplace & booking | Lodging-focused | Adventure discovery before booking |
| Wikiloc | Community GPX sharing | Huge global route library | Route-first UX | Curated destination exploration |
| Nomads | Choose cities to live/work | Exceptional discovery UX | Not outdoor focused | Apply the Nomads discovery model to outdoor adventure |

------------------------------------------------------------------------

# Product Non-Goals (MVP)

We are NOT building:

- A GPS navigation app
- A fitness tracker
- A social network
- A booking platform
- A trail recording app
- A replacement for Gaia GPS or AllTrails

These non-goals give the team explicit permission to say no to features that don't fit.

------------------------------------------------------------------------

# Target User

Outdoor travelers.

Examples:

-   Backpackers
-   Hikers
-   Climbers
-   Skiers
-   Divers
-   Vanlifers
-   Adventure travelers

------------------------------------------------------------------------

# Core User Story

> "I have a week off in September. Where should I go backpacking?"

Not

> "Show me trails around Chamonix."

------------------------------------------------------------------------

## Decision Inputs

The primary discovery question is a constrained decision, not a generic
search query. The product must be able to explain why every recommended
destination fits the inputs it knows.

**Launch inputs:** activity, trip length, month/season, experience level,
budget, permit tolerance, and an optional origin airport or metro area.

**Launch output:** a small, ranked set of destinations with a plain-language
"Why this fits" explanation, source-backed caveats, and a path to official
permit and safety information. The app must not imply that it has checked
availability, conditions, or a route unless it has a current, attributable
source for that specific claim.

------------------------------------------------------------------------

# MVP

## Phase 1 Launch Slice — Binding

Phase 1 validates that people can choose an adventure destination, rather
than attempting to become a comprehensive trail catalogue.

- 25–50 human-reviewed US destinations across a deliberately limited set of
  launch regions; expand only after the content-quality launch gate passes.
- A small, representative set of source-backed trails per destination. A
  destination page must not claim to list every trail in an area.
- Hiking and backpacking only.
- Faceted discovery, keyword search, autocomplete, destination comparison
  rationale, maps, and saved destinations.
- Official outbound links for permits, alerts, and operating information.
- No community submissions, live booking/availability promise, offline
  downloads, billing, user-facing AI planner, semantic ranking, or computed
  Adventure Score at launch.

The Phase 1 slice is a product-quality constraint. New regions, filters, or
activity types cannot be added simply because data is available; they must
meet the same provenance, freshness, and editorial requirements.

## Discovery

Browse destinations by:

-   Country
-   Region
-   National Park
-   Mountain Range

**MVP Activity Filters (Launch):**

-   Backpacking
-   Hiking

**Phase 2 Activity Filters:**

-   Climbing
-   Camping
-   Ski Touring
-   Mountaineering
-   Diving

**MVP Destination Filters (Launch):**

Season

Difficulty

Budget

Trip Length

Permit Required

Optional origin airport / metro area (used only for travel-time or distance
context once a reliable calculation and source are available)

**Phase 2 Filters:**

Origin-aware flight / driving distance

Weather

Crowds

Family Friendly

Pet Friendly

Remote

Off-grid

Hut-to-hut

Wild Camping

------------------------------------------------------------------------

## Destination Page

### Launch Set

Hero image

Adventure label (Editor's Pick / Hidden Gem / Trending / Beginner
Friendly / Epic)

Best months

Activities (hiking, backpacking)

Typical duration

Budget range

Weather summary

Difficulty

Highlights

Nearby airports

Permit information

Photos

Map

Trail listing (with trail-level filters)

### Phase 2

Top itineraries

Transportation details

Camping information

Wildlife

Gear recommendations

Community reviews

### Eventually

AI trip summaries

Adventure score (computed --- replaces editorial label)

AI itinerary builder

------------------------------------------------------------------------

## Search

**Launch:** global keyword search, autocomplete, and facets. Search must
gracefully tolerate common place and activity terms, but results remain
grounded in explicit, filterable attributes.

Examples:

"I want alpine backpacking"

"Good October hiking"

"Best hut-to-hut"

"Beginner mountaineering"

Autocomplete.

### Zero-Result Constraint Relaxation

With a Phase 1 corpus of 25–50 destinations, multi-faceted filtering will
frequently return zero exact matches. A hard "No results found" state is a
product failure — it should never be the final response.

**Required behavior:** when a filter combination yields zero results, apply
the following ordered relaxation strategy and display the result with full
transparency:

1. **Identify the most restrictive constraint** — rank by: `budget` → `month/season` → `trip length` → `difficulty` → `activity` (never relax activity last; it is the user's primary intent).
2. **Drop the most restrictive constraint** and re-run the query.
3. **Display the relaxed result set** with a plain-language explanation:
   > *"No exact matches for September under \$200, but here are 2 destinations in October that match your skill level."*
4. **Show the dropped constraint** as a removable chip so the user can restore it or adjust manually.
5. If relaxing one constraint still yields zero results, drop the next most restrictive and repeat — up to two relaxations before showing a broader "Explore all destinations" fallback.

**Rules:**
- Never silently widen a search. Every relaxation must be visible and labeled.
- Preserve all non-relaxed constraints in the active filter state.
- Relaxation suggestions are based on actual corpus coverage, not hypothetical data.
- The zero-result + relaxation state is a required Playwright test case.

**Phase 2:** natural-language input and semantic re-ranking, only after an
offline evaluation set proves that queries are interpreted correctly and that
the required attributes exist. Embeddings must not be used to infer facts
such as crowd levels, permit availability, or safety conditions from sparse
content.

------------------------------------------------------------------------

# User Accounts

Google OAuth

Later:

Apple

GitHub

Email/password

Anonymous browsing supported.

------------------------------------------------------------------------

# Free Tier

Unlimited destination browsing.

Search

Filtering

Maps

Photos

Save favorites

------------------------------------------------------------------------

# Pro

**Launch status: not built and not charged at launch.** The free-first
strategy is validated before billing, entitlements, and payment-provider
implementation are introduced. Feature flags may reserve the product surface,
but no subscription infrastructure is a Phase 1 requirement.

**Monetization approach for Phase 1:** pure loss-leader. Google AdSense is
explicitly excluded — banner advertising on a minimalist, photo-forward
editorial product conflicts with the Airbnb / Linear / Apple design standard
and degrades brand trust disproportionately to any revenue it would generate.
If hosting costs require offset before Pro launches, curated affiliate links
(e.g., park pass booking, gear rental partners, permit platform referrals) are
the preferred first option — they add contextual value rather than visual
noise. The decision to introduce any affiliate link requires a content-trust
and legal review before implementation.

Monthly / Annual subscription (future --- price TBD).

Unlock:

Offline downloads

AI trip planner

Advanced filters

Packing lists

Route exports

Weather intelligence

Trip collections

Custom itineraries

Season recommendations

Price tracking

Eventually:

AI Concierge

------------------------------------------------------------------------

# Tech Stack

## Frontend

Next.js — current supported stable major at implementation time (currently
Next.js 16); pin the exact version and caching model in an ADR.

React 19.x

TypeScript

Tailwind CSS 4

shadcn/ui

Motion (Framer Motion successor if applicable)

TanStack Query

React Hook Form

Zod

MapLibre GL

------------------------------------------------------------------------

## Backend

Next.js Route Handlers with a typed service layer and OpenAPI contract for
public/internal API boundaries. Do not introduce both tRPC and a second API
framework for Phase 1.

Node.js runtime by default for database, ingestion, and provider SDK work.
Use Edge only for endpoints proven compatible with every dependency.

TypeScript end-to-end

------------------------------------------------------------------------

## Database

Postgres

Supabase

Prisma ORM

PostGIS — required for points, route geometry, regions, map bounds, and
proximity queries. Store display coordinates separately only as a projection
of canonical geography data.

Postgres full-text search plus `pg_trgm` for Phase 1 autocomplete and
typo-tolerance.

`pgvector` and Redis are deferred until measured query latency, relevance, or
cache-load evidence justifies them.

------------------------------------------------------------------------

## Authentication

Google OAuth

Auth.js with one explicit strategy (database sessions or JWT sessions) and
its required account/session tables. Do not mix Supabase Auth and Auth.js for
the same user identity.

Passkeys (future)

------------------------------------------------------------------------

## Storage

Cloudflare R2

Image optimization

CDN

All uploads use signed URLs, content-type/size validation, malware scanning,
EXIF privacy handling, and immutable derivative keys. Original and derivative
assets retain rights, source, credit, and moderation metadata.

------------------------------------------------------------------------

## Search

**Phase 1: Postgres full-text/trigram search, autocomplete, and SQL facets.**

This keeps the initial content system to one source of truth and avoids an
indexing service before the launch corpus and query patterns are known.

**Graduation criteria for Meilisearch:** adopt it only when a benchmarked beta
shows that Postgres cannot meet a documented relevance, facet, or p95 latency
target. The migration must use an outbox-driven indexer, index versioning, and
reconciliation job; search must never be the sole source of published content.

Semantic similarity and combined lexical/vector ranking are Phase 2 features.
They require a labelled evaluation set, explicit filter handling, source
provenance, and a relevance/error budget before release.

Launch queries such as "alpine backpacking in October" and "beginner hiking
under $200" are satisfied through normalised attributes and keyword matching,
not an unverified model inference.

------------------------------------------------------------------------

## Maps

MapLibre GL is the map renderer, not the data or tile provider.

Use a contracted tile provider or a self-hosted tile stack selected through an
ADR before beta. Do not depend on shared public OSM tile infrastructure.

Every interactive map, exported map, and derived OSM dataset must display the
required OpenStreetMap attribution and comply with ODbL obligations. The tile
provider’s terms, volume limits, caching rules, and incident fallback are
recorded in the source registry.

------------------------------------------------------------------------

## AI

AI is an internal editorial-assistance tool, not a source of truth or a
required launch dependency.

Permitted Phase 1 use: draft summaries and structured tags from a supplied,
licensed source packet. Output is schema-validated, attached to a content
revision, marked as AI-assisted, and remains unpublished until human approval.

Prohibited Phase 1 use: inventing or filling factual attributes such as
permit requirements, safety conditions, duration, difficulty, weather,
budget, or availability; processing user PII; and automatic publication.

Select a paid commercial API tier or self-hosted alternative before enabling
AI assistance. The chosen model/version, retention/data-use terms, cost cap,
fallback behaviour, prompt version, and evaluation set belong in an ADR. If
the service is unavailable or over budget, the editorial workflow continues
without AI.

------------------------------------------------------------------------

## Hosting

Paid production hosting plan appropriate for commercial use

Cloudflare for R2/CDN where terms and cost model fit

GitHub

CI/CD via GitHub Actions. Scheduled Actions are acceptable for low-frequency,
idempotent batch ingestion, but not as the sole mechanism for urgent alert
refreshes or long-running jobs.

---

## Internal Editorial Tooling

The content model (`ContentRevision`, `SourceRecord`, `FactAssertion`,
`PermitRequirement`) is sophisticated enough that managing 25–50 destinations
and their associated trails, sources, and approvals via SQL scripts or
Supabase Studio directly will produce errors at unacceptable rates.

**Phase 1 requirement:** a lightweight internal admin interface is a launch
requirement, not a nice-to-have.

**Approach:** a protected `/admin` route set within the existing Next.js app.
No external CMS. This is a custom-code project.

Minimum admin capabilities at launch:

| Capability | Description |
|---|---|
| Destination list | View all destinations with status (draft / in_review / published / archived), source count, freshness state, and label |
| Destination editor | Edit summary, label, best months, difficulty, budget, permit info; attach source records; trigger AI draft from a source packet |
| Trail list per destination | View, add, and set representative/editorial-order status |
| Source record viewer | Inspect raw capture, normalizer version, checksum, licence, and expiry |
| Content revision history | View revision diff, AI provenance marker, reviewer, and approval state |
| Publish / unpublish | Single action that emits the outbox event and triggers index/cache rebuild |
| Data health dashboard | Source freshness, failed ingestion runs, unpublished drafts, attribution gaps, and upcoming expirations |
| Media approval queue | Review uploaded images with rights status, moderator action, and attribution |

**Auth:** admin routes are protected by a separate session check — authenticated
Google account plus an `is_admin` role flag. No public registration path.

**Not required for Phase 1:** a full visual CMS, rich-text editor, drag-and-drop
media manager, or multi-user workflow beyond single-reviewer approval.

------------------------------------------------------------------------

# Architecture Principles

Server Components first.

Node-first; Edge only where compatible and measurably beneficial.

SSR by default.

Streaming UI.

Minimal client JavaScript.

Optimistic UI.

API-first architecture.

Feature flags.

Domain-driven design.

One canonical Postgres database is the source of truth. Search indexes,
embeddings, caches, static pages, and media derivatives are rebuildable
projections. Every mutation that changes a projection emits a durable outbox
event; no distributed write is considered successful merely because an API
call was attempted.

------------------------------------------------------------------------

# Data Model

## Canonical Objects

Everything hangs off two canonical objects. Define these before writing
any schema.

### Destination

    Destination {
      id              UUID
      name            String
      slug            String           // URL-safe, unique
      location        Geography(Point, 4326)
      area            Geometry(MultiPolygon, 4326)?
      geographyLinks  DestinationGeography[] // country, state, region, park, range
      activities      Activity[]       // hiking | backpacking | ...
      months          Month[]          // best months to visit
      difficulty      Difficulty       // rubric-backed, destination-level range
      budget           BudgetEstimate  // currency, range, inclusions/exclusions
      tripLength      TripLength       // day | 2-3d | 4-7d | 7+d
      label           AdventureLabel   // Editor's Pick | Hidden Gem | Trending | Beginner Friendly | Epic
      score           Float?           // null until Phase 2
      summaryRevision ContentRevision  // editorial or approved AI-assisted draft
      heroAsset       MediaAsset
      photos          MediaAsset[]
      tags            String[]
      accessPoints    AccessPoint[]
      permits         PermitRequirement[]
      sourceRecords   SourceRecord[]
      factAssertions  FactAssertion[]
      status          ContentStatus    // draft | in_review | published | archived
      lastVerifiedAt  DateTime
      publishedAt     DateTime?
      trails          DestinationTrail[]
    }

### Trail

    Trail {
      id              UUID
      name            String
      slug            String
      routeGeometry   Geography(MultiLineString, 4326)
      trailhead       AccessPoint?
      distanceMiles   Float
      elevationGainFt Float
      difficulty      Difficulty
      durationHours   Float
      costUSD         Float?
      permits         PermitRequirement[]
      routeAssets     MediaAsset[]     // GPX/original source documents
      photos          MediaAsset[]
      tags            String[]
      sourceRecords   SourceRecord[]
      factAssertions  FactAssertion[]
      status          ContentStatus
      lastVerifiedAt  DateTime
      publishedAt     DateTime?
    }

    DestinationTrail {
      destinationId   UUID
      trailId         UUID
      isRepresentative Boolean
      editorialOrder  Int
    }

    Source {
      id              UUID
      name            String
      baseUrl         URL
      licence         String
      attributionText String
      termsUrl        URL
      commercialUse   String
      refreshPolicy   String
      owner           String
      enabled         Boolean
    }

    SourceRecord {
      id              UUID
      sourceId        UUID
      externalId      String
      canonicalUrl    URL?
      retrievedAt     DateTime
      rawObjectKey    String           // immutable raw capture in restricted storage
      checksum        String
      normalizerVersion String
      licenceSnapshot  String
      attributionSnapshot String
      validFrom       DateTime?
      validTo         DateTime?
    }

    FactAssertion {
      id              UUID
      subjectType     String           // destination | trail | permit | access point
      subjectId       UUID
      field           String
      value           JSON
      sourceRecordId  UUID?
      contentRevisionId UUID?
      confidence      String           // confirmed | editorial | uncertain
      reviewedBy      UUID?
      verifiedAt      DateTime
      expiresAt       DateTime?
    }

    PermitRequirement {
      id              UUID
      subjectType     String
      subjectId       UUID
      requirementType String           // none | reservation | quota | timed-entry | unknown
      scope           String
      officialUrl     URL
      sourceRecordId  UUID
      lastVerifiedAt  DateTime
      expiresAt       DateTime?
    }

    ForecastSnapshot {
      id              UUID
      location        Geography(Point, 4326)
      provider        String
      model           String?
      observedAt      DateTime
      validFrom       DateTime
      validTo         DateTime
      expiresAt       DateTime
      payload         JSON
    }

    ContentRevision {
      id              UUID
      entityType      String
      entityId        UUID
      body            JSON
      origin          String           // editorial | ai_assisted | community
      promptVersion   String?
      sourcePacketHash String?
      reviewStatus    String           // draft | in_review | approved | rejected
      authorId        UUID?
      reviewedBy      UUID?
      createdAt       DateTime
      publishedAt     DateTime?
    }

    MediaAsset {
      id              UUID
      objectKey       String
      originalUrl     URL?
      sourceRecordId  UUID?
      uploadedBy      UUID?
      creatorCredit   String?
      licence         String
      attributionText String?
      rightsStatus    String           // verified | restricted | unknown | rejected
      moderationStatus String          // pending | approved | rejected
      exifStrippedAt  DateTime?
    }

## Service Boundaries

Separate content data from user data from day one --- even within a
monorepo.

    Content Domain          User Domain             Platform Domain
    ──────────────          ───────────             ───────────────
    Destination             User                    Source / SourceRecord
    Trail                   Account / Session       IngestionRun
    MediaAsset              SavedDestination        ContentRevision
    PermitRequirement       SavedTrail              FactAssertion
    ForecastSnapshot        Review / Report         OutboxEvent
    AccessPoint             ModeratorRole           AuditLog

Content code never imports user-domain code. User code may reference published
content IDs but cannot mutate editorial records. Ingestion and moderation are
separate write paths with least-privilege database roles.

**Dynamic-data rule:** weather forecasts, closures, trail conditions, permit
inventory, and availability are not permanent fields on `Destination` or
`Trail`. They are expiring, attributable snapshots or official outbound links.
If a snapshot is stale or unavailable, the UI removes the claim rather than
showing an outdated value.

------------------------------------------------------------------------

# Performance

Performance targets are measured on production-like mobile hardware, a
representative US 4G network profile, and real-user monitoring. They are not
desktop-only Lighthouse claims.

| Metric | Launch SLO | Measurement |
| --- | --- | --- |
| LCP | p75 <= 2.5 s | Core Web Vitals, public destination pages |
| CLS | p75 <= 0.1 | Core Web Vitals, public destination pages |
| INP | p75 <= 200 ms | Core Web Vitals, Explore interactions |
| Explore filter result | p95 <= 500 ms after request reaches the app | server and client telemetry |
| Public-page error rate | < 0.5% over 7 days | Sentry / platform logs |
| Accessibility | no critical axe violations; keyboard and screen-reader smoke tests pass | CI + manual release check |

Use responsive AVIF/WebP derivatives with explicit dimensions, static
generation for published editorial pages, and progressive enhancement for
maps. A map failure must not prevent a user from reading or saving a
destination.

------------------------------------------------------------------------

# Caching Strategy

Cache policy follows data freshness, not a blanket "aggressive" rule.

| Data class | Example | Policy |
| --- | --- | --- |
| Published editorial | destination summary, approved photos | CDN/ISR; invalidate by content revision |
| Search/filter result | current corpus and user-selected facets | short-lived or uncached initially; canonical DB remains authoritative |
| Dynamic external fact | forecast, alert, permit data | provider-specific TTL; retain `fetchedAt` and `expiresAt`; never serve beyond expiry |
| User-specific data | saves, sessions, profile | private, no shared CDN cache |

Cache keys include locale, published-content version, filter values, and
applicable source freshness version. Cache invalidation is driven by durable
outbox events. Redis is not a launch dependency; introduce it only after
measured need and document invalidation ownership.

------------------------------------------------------------------------

# Security

Security requirements are launch requirements, not a generic checklist.

- Follow OWASP ASVS-aligned controls appropriate to a consumer web app:
  parameterised data access, allow-list input validation, output encoding,
  CSP, secure headers, CSRF protection for cookie-authenticated mutations,
  strict CORS, rate limits, and bot/abuse controls.
- Google OAuth redirect URIs, authorised domains, cookie settings, session
  rotation/expiry, account linking, and logout must be integration-tested.
  Auth/session secrets are never exposed to the browser or ingestion jobs.
- Apply row-level permissions and separate service credentials for public
  reads, user mutations, ingestion, moderation, and deployment. Service-role
  credentials never run in the client.
- Store secrets in managed secret storage; rotate them, use least privilege,
  and scan commits and dependencies in CI. Production audit logs record
  moderation, publish, permission, and source-configuration changes.
- Encrypt data in transit and at rest; take tested off-platform database and
  media backups. Define a recovery owner, RPO/RTO target, and quarterly restore
  test before beta.
- Provide account deletion, data export, and retention workflows before user
  accounts launch. Publish a privacy policy, terms of use, cookie/analytics
  notice and consent behaviour where required, copyright/takedown contact, and
  community guidelines before accepting user content.
- Security incidents, harmful content, source compromise, and credential
  exposure have a documented incident owner, severity classification,
  containment procedure, and user-notification decision path.

------------------------------------------------------------------------

# Design Principles

**Aesthetic:** Minimal. Modern. Editorial. Adventure. No visual clutter. No dashboards. No enterprise styling.

**Inspired by:** Airbnb, Nomads, Skyscanner, Apple, Linear.

Rules, not guidelines. Each prevents a specific category of bad decision.

Rules, not guidelines. Each prevents a specific category of bad
decision.

  -----------------------------------------------------------------------
  Principle                           Rule
  ----------------------------------- -----------------------------------
  One click to inspiration            User reaches a destination card in
                                      one interaction from home

  Helpful zero-result states          Preserve the user's constraints,
                                      explain why no match exists, and
                                      offer transparent nearby relaxations

  Never overwhelm                     Max 6 filter options visible
                                      without scrolling

  One CTA per screen                  Every screen has exactly one
                                      primary action

  Content over chrome                 Photography \> UI. The destination
                                      is the product

  Large imagery                       Hero images never below 60%
                                      viewport height on desktop

  Fast interactions                   Filter changes reflect instantly
                                      --- no full page reload

  No loading spinners                 Use skeleton screens, ISR, and
                                      prefetching to eliminate waits

  Motion with purpose                 Animation only when communicating
                                      state change or guiding attention

  Mobile-first                        Design and QA on mobile before
                                      desktop

  Accessibility AA                    WCAG 2.2 AA minimum, no exceptions
  -----------------------------------------------------------------------

------------------------------------------------------------------------

# Information Architecture

## Discovery Flow

Two-step experience inspired by Airbnb / Kayak / Nomads. Fewer pages.
Faster decisions. Visual-first.

**Step 1 --- Destination Discovery**

User applies top-level filters → destination card grid.

Top-level filters: activity, trip length, budget, difficulty, season, region,
and optional origin context.

**Step 2 --- Trail Exploration**

User selects a destination → destination page with a representative,
source-backed trail set and clear scope disclosure.

Trail-level filters: distance, elevation gain, difficulty, and verified permit
context. Conditions and forecast are optional expiring snapshots, never
required filter values.

## Page Hierarchy

    Home

    ↓

    Explore (filter: activity, budget, time, difficulty, season)

    ↓

    Destination (national park / region)

    ↓

    Trail listing (filter: distance, elevation, conditions, permit, cost)

    ↓

    Trail detail

------------------------------------------------------------------------

# Documentation

I'd recommend treating documentation as a first-class deliverable. At
minimum:

    /docs

      vision.md

      product.md

      roadmap.md

      architecture.md

      frontend.md

      backend.md

      api.md

      auth.md

      permissions.md

      search.md

      caching.md

      maps.md

      database.md

      deployment.md

      security.md

      privacy.md

      data-governance.md

      source-registry.md

      ingestion-runbook.md

      content-guidelines.md

      safety-and-disclaimers.md

      incident-response.md

      backup-and-recovery.md

      analytics.md

      subscriptions.md

      ui-principles.md

      branding.md

      contributing.md

      ADR/

Also include:

-   **C4 architecture diagrams** (Context, Container, Component) to
    communicate system structure.
-   **Sequence diagrams** for authentication, search, subscriptions, and
    content publishing.
-   **Entity Relationship Diagram (ERD)** for the data model.
-   **API specifications** using OpenAPI from the start.

------------------------------------------------------------------------

## Decisions Log (v1.1)

Open risks are explicit in this PRD; they are not treated as resolved merely
because a preferred technology has been named.

1. **Phase 1 is curated discovery, not a nationwide trail catalogue.** The
   binding launch slice limits the corpus and makes data quality a release
   criterion.
2. **Hiking and backpacking are the only launch activities.** All activity
   expansion requires a revised taxonomy, safety review, and data-quality gate.
3. **Source evidence outranks generated content.** Official sources,
   human-reviewed editorial work, approved community contributions, and
   AI-assisted drafts are the precedence order. AI cannot fill factual gaps.
4. **Postgres plus PostGIS is the canonical store.** Search, cache, static
   output, and embeddings are rebuildable projections; Meilisearch, Redis,
   and pgvector are deferred pending measured graduation criteria.
5. **Dynamic information expires.** Permit inventory, closures, weather, and
   conditions are either attributable snapshots with an expiry or official
   outbound links. The app does not promise live availability.
6. **Free-first does not mean free infrastructure.** Production services,
   commercial weather/data rights, backups, maps, and AI assistance require a
   costed, commercially permitted operating plan before beta.
7. **Community content is disabled at launch.** It may be enabled only after
   the moderation and abuse-prevention launch gate passes.
8. **English is the launch content language.** Spanish routes and content ship
   only when the localized critical UI, safety messaging, permit context, and
   required editorial content meet the i18n release gate.
9. **Subscriptions and advertising are post-validation decisions.** Their
   introduction requires legal/privacy, commercial provider, and unit-economics
   review; they are not an emergency hosting-cost fallback.

------------------------------------------------------------------------

> **Discovery before planning.** Every design decision should optimize
> for helping users discover *where* to go before helping them plan
> *how* to get there. Existing outdoor apps excel at planning routes;
> this product should excel at inspiring and narrowing down destinations
> through a fast, visually rich, filter-first experience. That principle
> can guide feature prioritization and help avoid drifting into becoming
> "another trail app."

------------------------------------------------------------------------

# Launch Market

**Primary:** United States

**Reasoning:**
- Highest quality public datasets (NPS, Recreation.gov, USGS)
- Simplifies content moderation and QA at launch
- Allows rapid iteration before international expansion
- English-first market aligns with MVP i18n scope

**Expansion:**

1. Canada
2. Alps (France, Switzerland, Italy)
3. Patagonia (Argentina, Chile)
4. New Zealand

------------------------------------------------------------------------

# Content Strategy

## Content Trust Policy

Every user-visible factual claim has a source, a verification timestamp, and
a display rule. The product distinguishes facts from editorial judgement:

1. Official government or land-manager information
2. Human-reviewed editorial content, with the underlying sources recorded
3. Approved community contribution, with a moderator decision
4. AI-assisted draft, never published without human approval

When sources conflict, official current land-manager information wins. The UI
links to the applicable official source and shows a `Last verified` date for
permits, access, closures, and other time-sensitive information.

## Source Registry and Permitted Use

No source may be ingested, mirrored, transformed, or displayed until it has a
reviewed entry in the source registry. The registry records: legal owner,
endpoint/document URL, external ID format, authentication, rate limit,
commercial-use terms, licence and attribution text, media rights, collection
scope, refresh cadence, field mapping, transformation rules, expiry policy,
fallback, owner, and last terms review date.

| Source | Approved launch use | Required control |
| --- | --- | --- |
| NPS Data API | Park facts, alerts, fees, campgrounds, official links | API key server-side; respect quota; per-asset rights review |
| Recreation.gov RIDB | Recreation-area, facility, campground, permit metadata | Preserve official URL/IDs; validate API terms before copying media |
| OpenStreetMap | Geometry and POIs where source coverage is adequate | ODbL compliance, visible attribution, source capture, tile-provider compliance |
| Wikidata | Identifiers and structured geographic facts | CC0 source capture and reference preservation |
| Wikipedia | Linked research lead only | Do not copy prose/images without separate CC BY-SA compliance |
| Open-Meteo | Expiring weather snapshots | Paid commercial plan or self-hosting; CC BY attribution |
| USGS | Elevation/topographic facts | Dataset-specific terms, metadata, and attribution |

The NPS API is an authoritative source for park information, alerts,
campgrounds, fees and related content; it is not the assumed nationwide source
of trail geometry or trail facts. Recreation.gov is not a promise of live
booking or permit availability. The product links users to the official
transaction surface rather than presenting cached inventory as bookable.

Government-origin content and images are not assumed reusable solely because
they came from a government endpoint. Store the individual asset credit,
rights status, and licence; reject unknown or restricted media. NPS material
may include third-party rights, and its official insignia is not reusable.

## Editorial Rubrics

Each rubric is versioned, documented, and shown to editors. A field may not be
published if the evidence required by its rubric is missing.

- **Difficulty:** record physical effort, technical skill, exposure, altitude,
  and remoteness separately for trails. Destination difficulty describes the
  range of representative trails; it is not a safety certification.
- **Best months:** an editorial access/seasons judgement based on normal
  conditions and verified sources, not a weather forecast. Record reasons and
  exceptions such as snow, fire, closures, heat, or monsoon.
- **Budget:** store currency, low/high estimate, trip-duration assumption,
  party-size assumption, inclusions, exclusions, and `calculatedAt`. Do not
  reduce a user-facing budget estimate to `$`/`$$`/`$$$` without an accessible
  explanation. Airfare from an origin is excluded unless calculated from that
  origin and dated explicitly.
- **Trip length:** explain whether it describes travel plus activity or
  activity only.
- **Permit required:** use `required`, `not required`, or `unknown`; include
  scope, season, official URL, last verification, and expiry. Never infer a
  permit rule from a nearby trail or park.
- **Labels:** one hand-assigned primary label is allowed at launch. `Trending`
  cannot be used until its metric, timeframe, source, and review cadence are
  defined. Labels are editorial opinions, not objective scores.

## Safety, Access, and Dynamic Information

Travel Roamer inspires and informs; it is not a navigation, emergency, permit,
or route-safety service. Before users act on a trip, pages make clear that
regulations and conditions change and direct them to the responsible land
manager.

- Ingest and display applicable official NPS alerts/closures with an expiry
  and source link; failed refreshes remove or mark stale claims rather than
  silently retaining them.
- Forecast cards state provider, location, generated time, valid period, and
  expiry. They are never presented as on-trail observations or safety advice.
- Trail reports, wildlife advice, fire restrictions, and conditions are absent
  from Phase 1 unless an approved authoritative source and freshness rule
  exist.
- Establish a sensitive-location policy: do not publish precise geometry or
  access details for restricted, culturally sensitive, ecologically vulnerable,
  or prohibited locations without an approved source and editorial review.
- All destination and trail pages include a concise safety and data-freshness
  disclosure, accessible without opening a modal.

## Ingestion and Publishing Operations

Ingestion is a controlled publishing pipeline, not a seed script:

    fetch raw capture
      → schema + licence validation
      → normalise with source ID and checksum
      → persist source record + canonical draft
      → factual/editorial review
      → publish canonical revision
      → durable outbox
      → rebuild search, embeddings, caches, and static pages

Requirements:

- Runs are idempotent, single-flight per source, auditable, and resumable.
- Preserve raw source captures in restricted storage with checksums and a
  normalizer version so published values can be reproduced.
- Capture `retrievedAt`, `verifiedAt`, `expiresAt`, and per-source refresh
  status. Alert and time-sensitive sources have a monitored refresh SLO.
- Validate incoming and generated data with schemas, range checks, geometry
  validation, duplicate detection, source-ID matching, and referential checks.
- Failed jobs use bounded retry/backoff, a dead-letter queue, an alert, and a
  documented manual recovery path. Partial writes cannot publish a record.
- Run daily reconciliation between canonical published records and each search
  index; index failures do not change published content.
- A data-health dashboard shows source freshness, latest run status, failed
  records, unpublished drafts, attribution gaps, and upcoming expirations.

## AI-Assisted Editorial Workflow

AI may summarise a supplied source packet or propose tags for an editor. It
may not create facts, substitute for source research, or automatically publish
content. Store the prompt template/version, model/version, source packet hash,
structured output, human reviewer, and final edited revision. Do not send
accounts, user queries, private reports, or other PII to an AI provider.

Content that is materially AI-assisted carries an internal provenance marker;
public disclosure follows the content policy and is retained until a human
reviewer accepts responsibility for the factual and editorial result. Pages
created principally by automation remain `noindex` until approved and shown to
provide original, useful value beyond source aggregation.

## Media and Community Contributions

Phase 1 accepts no public uploads. Editorial/seeded media may be used only
after a rights review and must preserve creator, source, licence, credit,
approval status, and source URL. Strip EXIF location data by default; retain it
only when policy permits and access is restricted.

Before enabling community trail submissions, reviews, or photos, all of the
following are required: terms/consent, rate limits and anti-automation,
content and malware scanning, copyright/takedown handling, user reporting,
moderator roles and audit trail, factual review queue, appeal/escalation path,
retention/deletion policy, and an abuse-response on-call owner.

------------------------------------------------------------------------

# i18n

## Launch Languages

| Language | Code | Status |
| --- | --- | --- |
| English | `en` | Phase 1 content and UI |
| Spanish | `es` | Gated fast-follow; not a route or SEO target until release criteria pass |

## Architecture Requirements

-   Use `next-intl` for string management (App Router compatible)
-   All UI strings externalized from day one --- no hardcoded English in
    components
-   Locale-prefixed routing: `/en/explore`; `/es/explore` remains disabled
    until its content gate passes
-   Locale-aware formatting: dates, numbers, units (miles / km toggle)
-   A locale is launchable only when its critical UI, accessibility labels,
    safety disclosure, permit/access context, legal notices, metadata,
    canonical/hreflang tags, and required editorial content are human-reviewed.
    Do not present a translated interface around untranslated or stale
    safety-critical content.

------------------------------------------------------------------------

# Analytics & Monitoring

## Launch Stack

| Tool | Purpose |
| --- | --- |
| Google Tag Manager | Consent-aware tag management and event routing |
| Google Search Console | Indexing, search performance, and Core Web Vitals |
| Google Analytics 4 | Consent-aware aggregate traffic and funnel analysis |
| Sentry | Frontend, API, ingestion, and scheduled-job errors with alerting |
| Uptime monitoring | Public-page, source-refresh, and ingestion health checks |

## Fast-Follow (Post-Launch)

| Tool | Purpose |
| --- | --- |
| PostHog | Product analytics, session replay, and feature flags after privacy review |
| Google Ads | Paid acquisition only after consent, conversion, and legal review |

## Event and Observability Requirements

Define an event dictionary before implementation: event name, trigger,
properties, consent category, retention, owner, and QA test. Never send email,
precise location, OAuth tokens, free-form user text, or provider secrets to
analytics by default.

Required launch events: exploration opened; filter applied; zero results;
suggested filter relaxation selected; search submitted; result shown;
destination opened; official permit/alert link opened; save attempted,
completed, and failed; sign-in started/completed; and source data shown stale
or unavailable.

Observability covers frontend/API errors, failed ingestion, outbox backlog,
source freshness, data-quality failures, index reconciliation, auth failures,
provider quota/cost, backup outcome, and p75/p95 performance. Alerts have an
owner and runbook; a dashboard without an escalation path is not monitoring.

------------------------------------------------------------------------

# KPIs

## Discovery Funnel (Primary Success Signal)

The primary outcome is a **qualified destination save**: a signed-in or
anonymous user saves a destination after opening it from Explore, with at
least one decision input recorded. This measures a decision, not a casual
click. Measure the funnel from launch, establish a four-week baseline, then
set targets by acquisition channel and cohort rather than assuming universal
percentages.

    User lands on Explore
            ↓
    Supplies or changes a decision input
            ↓
    Views a destination page
            ↓
    Opens official permit/alert information or a representative trail
            ↓
    Saves a destination
            ↓
    Returns within 7 days
            ↓
    Reports that the result helped choose a trip (optional qualitative signal)

Guardrail metrics: zero-result rate, filter-relaxation rate, stale-data
impressions, source-link click-through, save failure rate, page/API errors,
and support/flag volume. A rising save rate is not success if it is accompanied
by stale or misleading information.

## MVP Volume Targets (Organic / Pre-Marketing)

Goal: validate a trustworthy, useful experience before scaling content or
acquisition. The original 200-page index target is intentionally removed: it
conflicts with the curated Phase 1 corpus and would reward quantity over
quality.

| Metric | Launch measurement |
| --- | --- |
| Published destinations | 25–50, each passing the content-quality gate |
| Indexed pages | all approved canonical pages; no draft, stale, thin, or substantially unreviewed AI pages indexed |
| Qualified destination save | establish 4-week baseline by acquisition channel and activity |
| Seven-day return after save | establish baseline; compare with unsaved cohort |
| Zero-result and relaxation rate | instrument and reduce without hiding inventory gaps |
| Content freshness | 100% of published time-sensitive claims have a valid source/expiry state |
| Organic search | assess impressions, indexed quality, and branded/non-branded query fit before paid acquisition |

## Phase 2 (Post-Marketing)

-   Define conversion and retention targets after the Phase 1 baseline and a
    qualitative user-study readout
-   Run a relevance and content-trust review before extending the corpus
-   GTM/analytics consent, conversion tracking, and legal review must be in
    place before paid acquisition

------------------------------------------------------------------------

# Adventure Labels & Score

## MVP: Editorial Labels

At launch, destinations show an editorial label instead of a computed
score. Labels are assigned manually during content curation, carry an owner
and review date, and are not a proxy for safety, popularity, or data
completeness. No algorithm is needed at launch.

  Label               When to Use
  ------------------- -----------------------------------------------
  Editor's Pick       Exceptional destination, hand-selected
  Hidden Gem          Lesser-known, high-quality, undervisited
  Trending            Disabled until a documented, reliable trend metric exists
  Beginner Friendly   Accessible to first-time hikers / backpackers
  Epic                Bucket-list caliber experience

One primary label per destination. More can be added as tags. The editor must
record the rationale and evidence for every label; `Trending` is unavailable
until its data contract has been approved.

## Phase 2: Computed Adventure Score

Do not replace editorial labels with a computed score merely because some
community data exists. A score may be tested only after a documented data
coverage threshold, anti-gaming controls, moderation quality, bias review,
minimum sample size, methodology version, confidence interval/display rule,
appeal path, and user-research validation are approved.

Score out of 10, displayed to one decimal place (e.g., 8.4 / 10).

  Attribute                   Weight   Source
  --------------------------- -------- --------------------------------------------
  Scenery / wow factor        25%      Community ratings + editorial
  Trail quality & condition   20%      Trail reports, maintenance data
  Accessibility               15%      Trailhead access, parking, nearest airport
  Difficulty range            15%      Suitable for range of skill levels
  Season length               10%      Number of accessible months
  Uniqueness                  10%      Rarity vs. comparable destinations
  Safety                      5%       Wildlife, weather, rescue access

**Notes:** methodology is versioned, scoped to hiking/backpacking initially,
and shown with data coverage and `last calculated` information. It supplements
editorial judgement; it does not suppress official safety or access warnings.

------------------------------------------------------------------------

# Content Moderation

**Status: disabled at launch.** Community content is a separate product launch,
not a toggle. It requires its own threat model, legal review, operational
staffing, and release gate.

Required before enabling community-submitted content:

-   Spam detection for trail submissions and reviews
-   Photo moderation (inappropriate content, copyright)
-   Factual accuracy review queue
-   User reporting / flagging system
-   Moderator role in admin tooling
-   Terms acceptance, age/eligibility policy, consent and data-retention rules
-   Rate limiting, account reputation, abuse detection, and malware scanning
-   Copyright/takedown process, source attribution, and appeal/escalation path
-   Reviewer SLAs, audit logs, escalation owner, and incident playbook
-   Rollback/disable switch that can immediately stop new submissions

------------------------------------------------------------------------

# Engineering Standards

## Testing

-   Unit tests: Vitest, including rubrics, expiry, permission, and source
    precedence rules
-   Component tests: React Testing Library
-   End-to-end: Playwright for anonymous discovery, OAuth/save, zero results,
    stale-data fallback, map degradation, and mobile viewports
-   Accessibility: axe-core in CI plus keyboard, screen-reader, contrast, and
    reduced-motion release smoke tests
-   Performance: Lighthouse CI as a regression signal plus production RUM SLOs
-   API contract tests: OpenAPI validation and consumer tests for native-app
    compatibility
-   Data-pipeline tests: source fixtures, schema/range/geometry validation,
    duplicate handling, idempotency, partial-failure recovery, outbox delivery,
    index reconciliation, and attribution completeness
-   Security tests: dependency/secret scanning, permission/RLS tests, OAuth
    redirect tests, rate-limit tests, and a pre-release threat-model review
-   Operational tests: backup restore, source outage, quota exhaustion,
    provider failover, and alert/runbook exercises

## Architecture Decision Records (ADRs)

Implementation-specific technology decisions should live under
`/docs/adr/` rather than this PRD.

Required ADRs: framework/caching model; Auth.js session strategy; PostGIS and
spatial model; search graduation criteria; map tile provider and OSM
compliance; source licences and refresh contracts; AI provider/data handling;
analytics consent; backups/RPO/RTO; and commercial service cost controls.

# SEO Strategy (Summary)

SEO is a primary acquisition channel, but SEO quantity cannot override content
quality or safety. Only approved canonical pages with unique, useful editorial
value are indexable.

-   One canonical, human-readable URL per published page; correct locale,
    canonical, and `hreflang` handling
-   XML and image sitemaps contain only indexable, approved canonical pages
-   Valid JSON-LD that reflects on-page facts; never manufacture ratings,
    availability, or route claims for rich-result eligibility
-   Open Graph images only from cleared media assets
-   Strong internal links that help a person compare destinations, not mass
    pages generated for keyword permutations
-   Drafts, stale or unreviewed AI pages, duplicate facets, thin pages, and
    disabled locales use `noindex` or are not publicly routable
-   Record author/editor, source links, `last reviewed`, and update history on
    substantive destination pages where practical

# Content Governance

The content-trust policy and source registry above are the authority. Content
governance additionally requires an assigned owner for every source, rubric,
published page, and expiration policy. Changes to factual records are
versioned and auditable; a published record can be reverted without deleting
its source history.

# Phased Roadmap

## Phase 1 — Launch

- USA only; 25–50 reviewed destinations in selected launch regions
- Hiking + backpacking; representative trails only
- Destination discovery + explicit filters + keyword/autocomplete search
- Clear "why this fits" rationale and helpful zero-result state
- Editorial labels other than `Trending` unless its metric is approved
- Source registry, provenance, content review, official permit/alert links,
  safety disclosure, and data-health dashboard
- Postgres/PostGIS canonical store, outbox-based publication pipeline, and
  source/index reconciliation
- Save destinations, Google OAuth, account export/deletion, and English UI
- Consent-aware GTM/GA4/GSC, Sentry, uptime/source monitoring, backups, and
  tested recovery procedures

## Phase 2 — Community & Expansion

- Expand corpus/regions only after the Phase 1 quality and reliability
  baseline is met
- Spanish localization only after the localized-content release gate passes
- Meilisearch, Redis, and vector search only if their documented graduation
  criteria are met
- Community contributions and reviews only after the dedicated moderation
  launch gate passes
- Additional activities and filters only after their taxonomy, source,
  freshness, safety, and rubric requirements are approved
- AI itinerary/packing assistance only after provider, privacy, evaluation,
  source-citation, and safety requirements are approved
- Advertising or paid acquisition only after commercial-provider, consent, and
  unit-economics review

## Phase 3 — Scale

- Native mobile apps (React Native / Expo)
  - Shared TypeScript models + API
  - Offline sync
  - Push notifications
- Premium subscription (activate monetization)
- Offline mode
- Trip journals + public profiles + following
- International expansion (Patagonia, New Zealand)
- Marketplace / booking opportunities

------------------------------------------------------------------------

# Launch Gates

Phase 1 cannot launch until all gates are green and an accountable owner signs
off each one.

| Gate | Evidence required | Owner |
| --- | --- | --- |
| Content quality | Every published destination/trail passes rubric, source, attribution, rights, and freshness checks; corpus scope is disclosed | Editorial lead |
| Source/legal | Source registry complete; commercial terms, OSM compliance, media rights, and required notices reviewed | Product + legal reviewer |
| Safety | Official alert/permit links work; stale-data behaviour, sensitive-location policy, and disclosures tested | Content + engineering |
| Data operations | Ingestion, retries/DLQ, outbox, reconciliation, data-health dashboard, and manual recovery runbook exercised | Engineering lead |
| Security/privacy | Threat model, roles/RLS, OAuth, secret handling, analytics consent, privacy/terms, deletion/export, and backup restore pass | Security/privacy owner |
| Reliability | Performance SLO smoke test, error monitoring, uptime checks, source freshness alerts, and incident drills pass | Engineering lead |
| Product validation | Usability sessions show that target users can understand why a result fits and reach official planning information | Product lead |
| SEO | Only approved canonical pages index; metadata, sitemaps, structured data, and noindex rules validated | Growth/content lead |

# Risk Register

| Risk | Severity | Early signal | Mitigation / release rule |
| --- | --- | --- | --- |
| Incomplete, stale, or contradictory permits/conditions | Critical | expired snapshots, source refresh failure, user flags | link official source; expire claims; do not claim live availability; block launch if refresh monitoring fails |
| Licence, attribution, or image-rights breach | Critical | missing registry metadata/rights status | do not ingest/display without approved source record; rights review and takedown path |
| OSM tile/data non-compliance | High | missing attribution, unexpected tile volume | approved tile ADR, visible attribution, volume monitoring, compliant fallback |
| "Free" provider becomes commercial, limited, or unavailable | High | quota alerts, plan/terms change | paid/self-hosted fallback, cost cap, provider owner, graceful feature removal |
| AI produces plausible but false travel facts | High | unsupported field, reviewer rejection, source mismatch | AI drafts only; evidence-required rubric; human approval; no automatic publishing |
| Thin or mass-generated SEO content | High | low-value pages, indexing issues, weak engagement | index only approved original pages; noindex drafts/duplicates; editorial quality gate |
| Search gives misleading recommendations | High | zero-result workarounds, relevance complaints | explicit attributes first; test set and relevance review before semantic ranking |
| Provider/index partial failure causes inconsistent results | High | outbox backlog, canonical/index divergence | canonical DB authority; idempotent outbox, retries, reconciliation, rebuild tooling |
| Sensitive route/location disclosure | High | protected-area feedback, sensitive coordinates detected | sensitive-location policy, source restrictions, editorial review, rapid removal path |
| Auth, upload, or analytics privacy breach | High | anomalous access, unexpected PII events | least privilege, signed uploads, RLS tests, consent controls, audit logs, incident plan |
| Scope expansion prevents a trustworthy launch | High | launch corpus exceeds review capacity | binding launch slice; additions require gate evidence and owner approval |
| Spanish UI implies unavailable localized guidance | Medium | untranslated critical fields/pages | do not expose locale until localized-content gate passes |
