-- =============================================================================
-- Row-Level Security + least-privilege roles (DRAFT — launch-readiness E3)
-- =============================================================================
-- Apply with DB-owner credentials against Supabase (SQL editor or psql as the
-- table owner). NOT run by migrations — this is an operational hardening step
-- the DB owner applies deliberately, reviewed against the current schema.
--
-- ARCHITECTURE NOTE (read before applying):
-- This app authenticates with Auth.js (not Supabase Auth) and talks to Postgres
-- through ONE Prisma connection (DATABASE_URL) as a single role. So the primary
-- authorization boundary is APPLICATION code (session checks + query scoping),
-- and there is no Supabase JWT to drive `auth.uid()` policies.
--
-- What this file buys you, given that reality:
--   1. Least privilege BY CONTEXT — separate DB roles for the web runtime, the
--      ingestion CLI, and migrations, so a leaked credential has a bounded blast
--      radius (a leaked web cred can't DROP tables or rewrite provenance).
--   2. A published-only read role for any DIRECT reader (analytics, a read
--      replica, a future public API) that isn't the app — enforced at the DB.
--   3. User-data isolation policies that activate once the app sets
--      `app.user_id` per transaction (a later hardening step; see bottom).
-- Until the web app is split into per-context connections, treat 2–3 as
-- defense-in-depth layered under the app's own authz, not a replacement for it.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Roles (least privilege by context)
-- -----------------------------------------------------------------------------
-- Create login roles; set real passwords out-of-band (never commit them).
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'travelroamer_web') THEN
    CREATE ROLE travelroamer_web LOGIN;      -- Next.js runtime (DATABASE_URL)
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'travelroamer_ingest') THEN
    CREATE ROLE travelroamer_ingest LOGIN;   -- ingestion / enrichment CLIs
  END IF;
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'travelroamer_readonly') THEN
    CREATE ROLE travelroamer_readonly LOGIN; -- analytics / read replica / public API
  END IF;
END $$;

-- Everyone can reach the schema; table grants below scope what they can do.
GRANT USAGE ON SCHEMA public TO travelroamer_web, travelroamer_ingest, travelroamer_readonly;

-- Web runtime: read all content, write user data + the publish path. No DDL,
-- and provenance is append-only (no UPDATE/DELETE on SourceRecord).
GRANT SELECT ON ALL TABLES IN SCHEMA public TO travelroamer_web;
GRANT INSERT, UPDATE, DELETE ON
  "SavedDestination", "User", "Account", "Session", "VerificationToken"
  TO travelroamer_web;
GRANT UPDATE ON "Destination", "Trail", "ContentRevision" TO travelroamer_web; -- publish/unpublish
GRANT INSERT, UPDATE ON "OutboxEvent" TO travelroamer_web;
GRANT INSERT, UPDATE, DELETE ON "MediaAsset", "FactAssertion", "PermitRequirement" TO travelroamer_web;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO travelroamer_web;

-- Ingestion CLI: write drafts + sources + snapshots; never touches user tables.
GRANT SELECT ON ALL TABLES IN SCHEMA public TO travelroamer_ingest;
GRANT INSERT, UPDATE ON
  "Source", "SourceRecord", "ContentRevision", "FactAssertion", "PermitRequirement",
  "Destination", "Trail", "DestinationTrail", "MediaAsset",
  "ForecastSnapshot", "AlertSnapshot", "IngestionRun", "IngestionDeadLetter", "OutboxEvent"
  TO travelroamer_ingest;
GRANT DELETE ON "ForecastSnapshot", "AlertSnapshot" TO travelroamer_ingest; -- prune expired
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO travelroamer_ingest;
REVOKE INSERT, UPDATE, DELETE ON "User", "Account", "Session", "SavedDestination" FROM travelroamer_ingest;

-- Read-only: published content only (enforced by RLS below). No writes ever.
GRANT SELECT ON
  "Destination", "Trail", "DestinationTrail", "MediaAsset",
  "FactAssertion", "PermitRequirement", "ForecastSnapshot", "AlertSnapshot"
  TO travelroamer_readonly;

-- -----------------------------------------------------------------------------
-- 2. Enable RLS
-- -----------------------------------------------------------------------------
-- Table owner + superuser BYPASS RLS by default, so migrations (run as owner)
-- are unaffected. Policies below constrain the non-owner login roles above.
ALTER TABLE "Destination"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Trail"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DestinationTrail"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "MediaAsset"        ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SavedDestination"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Session"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Account"           ENABLE ROW LEVEL SECURITY;
ALTER TABLE "User"              ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- 3. Policies
-- -----------------------------------------------------------------------------

-- 3a. Public read: the read-only role sees ONLY published content.
CREATE POLICY readonly_published_destinations ON "Destination"
  FOR SELECT TO travelroamer_readonly
  USING (status = 'published');

CREATE POLICY readonly_published_trails ON "Trail"
  FOR SELECT TO travelroamer_readonly
  USING (status = 'published');

CREATE POLICY readonly_published_dt ON "DestinationTrail"
  FOR SELECT TO travelroamer_readonly
  USING (EXISTS (
    SELECT 1 FROM "Destination" d
    WHERE d.id = "DestinationTrail"."destinationId" AND d.status = 'published'
  ));

-- Approved, non-rejected media only for the public reader.
CREATE POLICY readonly_approved_media ON "MediaAsset"
  FOR SELECT TO travelroamer_readonly
  USING ("moderationStatus" = 'approved' AND "rightsStatus" <> 'rejected');

-- 3b. Web runtime sees everything (admin needs drafts). Authz is in app code.
CREATE POLICY web_all_destinations ON "Destination" FOR ALL TO travelroamer_web USING (true) WITH CHECK (true);
CREATE POLICY web_all_trails       ON "Trail"       FOR ALL TO travelroamer_web USING (true) WITH CHECK (true);
CREATE POLICY web_all_dt           ON "DestinationTrail" FOR ALL TO travelroamer_web USING (true) WITH CHECK (true);
CREATE POLICY web_all_media        ON "MediaAsset"  FOR ALL TO travelroamer_web USING (true) WITH CHECK (true);

-- 3c. User data isolation. Enforced ONLY when the app sets `app.user_id` per
--     transaction (see wiring note). `current_setting(..., true)` returns NULL
--     when unset, so an un-instrumented query matches no rows — fail-closed.
CREATE POLICY web_own_saves ON "SavedDestination"
  FOR ALL TO travelroamer_web
  USING ("userId" = current_setting('app.user_id', true))
  WITH CHECK ("userId" = current_setting('app.user_id', true));

CREATE POLICY web_own_sessions ON "Session"
  FOR ALL TO travelroamer_web
  USING ("userId" = current_setting('app.user_id', true))
  WITH CHECK ("userId" = current_setting('app.user_id', true));

CREATE POLICY web_own_accounts ON "Account"
  FOR ALL TO travelroamer_web
  USING ("userId" = current_setting('app.user_id', true))
  WITH CHECK ("userId" = current_setting('app.user_id', true));

CREATE POLICY web_own_user ON "User"
  FOR ALL TO travelroamer_web
  USING (id = current_setting('app.user_id', true))
  WITH CHECK (id = current_setting('app.user_id', true));

-- =============================================================================
-- WIRING NOTES
-- =============================================================================
-- * Split connection strings by context: point the Next.js runtime at
--   travelroamer_web, the ingestion CLIs at travelroamer_ingest, and keep the
--   owner/service role only for `prisma migrate`.
--
-- * The 3c user-isolation policies are INERT until the web app tells Postgres
--   who the current user is. With Auth.js + Prisma, do this per request inside a
--   transaction, e.g.:
--       await prisma.$transaction(async (tx) => {
--         await tx.$executeRaw`SELECT set_config('app.user_id', ${userId}, true)`;
--         ... user-scoped queries ...
--       });
--   `true` makes it transaction-local (resets on commit) — safe with a pooler.
--   NOTE: Auth.js's own adapter queries (Session/Account/User) run outside this
--   wrapper, so introduce these four policies only after the adapter path is
--   given a role/context that satisfies them (or keep those four disabled and
--   rely on app-level scoping for auth tables). SavedDestination is the safe
--   first policy to switch on, since all its access is app-owned.
--
-- * Verify after applying: connect as travelroamer_readonly and confirm a draft
--   Destination is invisible while a published one is visible.
-- =============================================================================
