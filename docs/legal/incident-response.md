# Incident-response runbook

> **Draft for review — not legal advice.** A one-person operational plan for when
> something goes wrong: a security breach, an outage, or a content-safety problem.
> The point is to have decided *before* the incident, so you're not improvising at
> 2am. Fill the `[BRACKETS]` and keep this somewhere you can reach without the app.

## Scope

Covers: personal-data breach, security compromise, service outage, and
content-safety incidents (dangerous or wrong information published). It does **not**
replace legal counsel for a real breach — it tells you the first moves and who to
call.

## Roles (solo)

- **Incident commander:** `[YOUR NAME]` (you). You run the response.
- **Escalation / help:** `[LAWYER NAME + CONTACT]`, `[ANY TRUSTED SECOND CONTACT]`.
- **Providers to contact if theirs:** Supabase `[support link]`, Vercel
  `[support link]`, Sentry, Google (OAuth). Keep account emails handy.

## Severity levels

| Level | Meaning | Examples | First response |
|---|---|---|---|
| **P0** | Personal data exposed or credible breach | DB access leaked, secrets in a public commit, user data downloadable | Immediately — drop everything |
| **P1** | Full outage | Site down, DB unreachable, auth broken | Within the hour |
| **P2** | Degraded / safety-relevant | Wrong safety info live, alerts stale-serving, partial outage | Same day |
| **P3** | Minor | Cosmetic bug, single broken page | Next working session |

## Detection

- **Errors:** Sentry alerts (server + client).
- **Uptime:** `[uptime monitor — set one up if none]`, Vercel deploy status.
- **Data/DB:** Supabase dashboard, connection-pool errors (e.g. `EMAXCONNSESSION`).
- **User reports:** `[CONTACT EMAIL]`.
- **Secrets:** treat any secret appearing in a commit, log, or screenshot as P0.

## Response steps

**1. Detect & declare.** Note the time (UTC), assign a severity, start a plain-text
log of what you see and do (timestamps matter later, especially for a breach).

**2. Contain.** Stop the bleeding before you diagnose.
- Secret leaked → **rotate it now** (DB password, OAuth secret, API keys, `NEXTAUTH_SECRET`). Update Vercel env + `.env`. Assume the leaked value is burned.
- Compromised access → revoke sessions, rotate credentials, restrict DB network access in Supabase.
- Bad/dangerous content live → unpublish the page (set status) or roll back the deploy.
- Outage → check Vercel + Supabase status first (is it yours or theirs?), then last-good deploy via Vercel rollback.

**3. Assess.** What happened, what data/systems are affected, what's the blast
radius, is it still ongoing. For data: *what fields, whose, how many, exposed how.*

**4. Notify (breach-specific — this is the legal-sensitive part).**
- **GDPR:** if a personal-data breach is likely to risk users' rights/freedoms,
  the rule is notify the relevant supervisory authority **without undue delay and
  within 72 hours** of becoming aware. If risk is high, notify affected users too.
  **Call `[LAWYER]` before deciding you don't need to.**
- **US state laws:** many require notifying affected residents of a breach of
  personal information, sometimes on a deadline. `[LAWYER]` scopes which apply.
- Draft user notice: what happened, what data, when, what you've done, what they
  should do. Plain language. Don't downplay.
- Keep the incident log — regulators and users will ask for the timeline.

**5. Recover.** Restore service from a known-good state, verify the fix, confirm
containment held. Watch for recurrence.

**6. Post-incident review.** Within `[3 business days]`: root cause, timeline, what
worked, what to change (a monitor, a guardrail, a rotated-secret process). One
concrete follow-up action, tracked. No blame — you're the only one here anyway.

## Data-breach quick reference

- **72-hour GDPR clock starts when you become *aware*.** Don't sit on it.
- **Rotate first, investigate second.** A burned secret stays burned.
- **Write it down as you go.** Reconstructed timelines are worse than logged ones.
- **Call the lawyer early**, not after you've decided what to do.

## Communication templates

**Status (outage):** "Travel Roamer is currently experiencing `[issue]`. We're
working on it and will update by `[time]`." — post to `[status channel / page]`.

**Breach (user notice):** "On `[date]` we discovered `[what]`. The following
information `[was / may have been]` affected: `[data]`. We have `[actions taken]`.
We recommend you `[action]`. Questions: `[CONTACT EMAIL]`." — send only after
`[LAWYER]` review if personal data is involved.

## Keep reachable offline

Provider logins, `[LAWYER]` contact, this runbook, and where secrets live (so you
can rotate them) — somewhere that doesn't depend on the app being up.

Owner: `[YOUR LEGAL NAME / ENTITY]`. Review after any P0/P1 and at least yearly.
