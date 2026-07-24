# ADR-0002: Auth.js session strategy

**Status:** Accepted
**Forced by:** Roadmap M7 (auth + saves)

## Context

The PRD requires Auth.js with one explicit session strategy (database or JWT) and its required account/session tables, and forbids mixing Supabase Auth and Auth.js for the same identity. Google is the only launch provider.

## Decision

- **Database sessions** via `@auth/prisma-adapter` (`session.strategy = "database"`).
- Standard Auth.js models added to the Prisma schema: `User`, `Account`, `Session`, `VerificationToken`, with UUID ids consistent with the rest of the schema. `User.isAdmin` (default false) is the admin gate; `SavedDestination` hangs off `User`.
- The session callback surfaces `user.id` and `user.isAdmin` onto `session.user`.
- **No Credentials provider.** A Credentials provider would force JWT sessions and violate "one explicit strategy." For E2E/local testing without live Google, a **non-production-only** route (`/api/dev-login`, hard-disabled when `NODE_ENV === "production"`) mints a real DB session directly.

## Rationale

- **Revocable + clean deletion.** Database sessions are server-side rows, so account deletion (a PRD launch requirement) cascade-deletes sessions and immediately invalidates them — no lingering valid JWTs. This directly serves the data-governance gate.
- Sessions are auditable and countable (useful for the admin/data-health views).
- Trade-off accepted: a DB read per authenticated request. At launch scale this is negligible; if it ever isn't, that's a measured optimization, not a launch concern.

## Consequences

- `AUTH_SECRET` must be set in every environment (dev `.env`, CI env, production secret store).
- Google sign-in is gated on `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`; the app boots without them (only the Google flow is unavailable) and `/api/dev-login` covers non-prod testing.
- The interim `/admin` password gate (M6) coexists for now; folding admin auth fully into Auth.js + `is_admin` is a small follow-up (the `isAdmin` flag and session plumbing already exist).
