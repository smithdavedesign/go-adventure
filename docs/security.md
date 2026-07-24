# Security & Observability

Status of the PRD Security and Analytics/Monitoring requirements as of M10. Code-level controls are built and tested; operational controls that need external infrastructure or human process are marked **parked** with an owner note.

## Built (code-level)

| Control | Where | Notes |
|---|---|---|
| Secure response headers | [`securityHeaders.ts`](../src/shared/config/securityHeaders.ts) via `next.config.ts` | CSP, `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`, HSTS. `unsafe-eval` is dev-only. |
| Allow-list input validation | `content/search/filters.ts`, all Zod schemas | URL params and external data are allow-list parsed; unknown values dropped, never trusted. |
| Parameterised data access | Prisma + tagged-template raw SQL | No string-interpolated SQL anywhere; geometry writes use bound params. |
| Rate limiting | [`rateLimit.ts`](../src/platform/security/rateLimit.ts) | Fixed-window limiter (in-memory). Applied to `/api/dev-login`; the pattern extends to production auth/save mutations. |
| CSRF posture | Server Actions + `SameSite=Lax` cookies | Next.js Server Actions are origin-checked; session/admin cookies are httpOnly + SameSite=Lax. |
| Auth session handling | Auth.js DB sessions ([ADR-0002](adr/0002-authjs-session-strategy.md)) | Revocable; account deletion cascade-invalidates sessions. Secrets never sent to the browser. |
| Data governance | `user/profiles/account.ts` | Account export (no secrets) + deletion (cascade) before user accounts launch. |
| Analytics event dictionary | [`events.ts`](../src/platform/analytics/events.ts) + [`track.ts`](../src/platform/analytics/track.ts) | Every launch event declared with consent category + allow-listed props. `track()` drops analytics events without consent and strips any non-allow-listed property — no email/location/tokens/free-text ever leave the app. |
| Single error-reporting entry point | [`report.ts`](../src/platform/observability/report.ts) | Structured error logs for log-based alerting; Sentry sink is the one place to wire alerting. |

## Parked (needs external infra or human process)

These are launch-gate items ([PRD Launch Gates](Adventure_Discovery_PRD_v1.1.md#launch-gates) → Security/privacy, Reliability) that code alone can't satisfy:

- **Row-level security + least-privilege DB roles.** Needs real Postgres roles (Supabase) for public reads, user mutations, ingestion, moderation, deployment. The *service boundaries* are already enforced structurally (content code never imports user code); RLS is the DB-level enforcement to add at provisioning.
- **Secret management + rotation + CI secret/dependency scanning.** `npm audit` runs non-blocking in CI today (ADR-0001); add secret scanning and a managed secret store at deploy.
- **Sentry / uptime monitoring / source-freshness alerts.** Accounts + DSNs required; `report.ts` is the wired call site. Alerts need owners + runbooks (a dashboard without an escalation path is not monitoring — PRD).
- **Backups + tested restore + RPO/RTO.** [ADR-0009](adr/0009-backups-rpo-rto.md) — a quarterly restore drill is a human process, not code.
- **Consent-aware GTM/GA4/GSC wiring.** The event dictionary + consent gate exist; the tag-manager wiring and the consent-banner UI are deploy-time ([ADR-0008](adr/0008-analytics-consent-model.md)).
- **Threat model review + privacy policy / terms / cookie notice.** Human/legal deliverables required before user accounts and analytics go live.
- **Incident response** — owner, severity classes, containment, notification path ([`incident-response`](adr/) / ADR area). Documented process, not code.

## Notes

- CSP currently uses `'unsafe-inline'` for scripts/styles. A nonce-based strict CSP (via middleware) is a hardening follow-up; the connect/img allow-list already scopes external hosts (MapLibre demo tiles, Open-Meteo, Google) and must be tightened to the production tile provider once [ADR-0005](adr/0005-map-tile-provider.md) is decided.
