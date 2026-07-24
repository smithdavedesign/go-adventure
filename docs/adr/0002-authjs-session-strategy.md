# ADR-0002: Auth.js session strategy

**Status:** Not started
**Forced by:** Roadmap M7 (auth + saves)

## Context

The PRD requires Auth.js with "one explicit strategy (database sessions or JWT sessions) and its required account/session tables," and explicitly forbids mixing Supabase Auth and Auth.js for the same user identity. Google OAuth is the only launch provider.

## Decision

Not yet decided. Requires choosing between database-backed sessions (Prisma adapter, session table, revocable server-side) vs. JWT sessions (stateless, no session table, harder to revoke) before M7 auth work begins.

## Consequences

TBD once decided.
