# ADR-0007: AI provider and data handling

**Status:** Not started
**Forced by:** Roadmap M8 (AI-assisted drafting)

## Context

`ARCHITECTURE.md` names Google Gemini Flash for editorial draft assistance; the PRD requires the chosen model/version, retention/data-use terms, cost cap, fallback behaviour, prompt version, and evaluation set to be recorded in an ADR, plus a paid commercial tier or self-hosted alternative selected before enabling AI assistance at all. AI may only draft summaries/tags from a supplied source packet — never factual attributes, never automatic publication, never user PII sent to the provider.

## Decision

**Partial (integration built; commercial terms/cost cap/eval set still owed).** The M8 implementation uses a provider interface (`AiDraftProvider`) with a `GeminiAiProvider` (model `gemini-1.5-flash`, env-gated on `GEMINI_API_KEY`) and a deterministic `MockAiProvider` fallback so the workflow runs offline. Encoded guarantees:

- **Packet is source-only.** `buildSourcePacket` allow-lists exactly four source-derived fields; a unit test asserts no extra/user data can leak. No accounts, queries, reports, or PII are ever sent.
- **Output is schema-validated** (`aiDraftOutputSchema`) — malformed responses are rejected, never stored.
- **Provenance recorded**: `origin = ai_assisted`, `promptVersion` (`summary-v1`), and `sourcePacketHash` on the revision.
- **Never auto-publishes / never fills facts**: the suggestion lands as `body.aiSuggestion` for a human to accept; `reviewStatus` stays `in_review`; factual fields are untouched.

Still owed before enabling against real content in production: the paid commercial tier selection, retention/data-use terms, a cost cap, a documented fallback, and an evaluation set — plus the ADR sign-off. Until then the mock provider is the default when no key is set.

## Consequences

- `noindex` for materially-AI-assisted pages until a human reviewer accepts responsibility (PRD) is enforced by the fact that AI-assisted content is a draft (`in_review`) — it isn't a public page at all until published by a human.
- Swapping providers is an interface implementation, not a workflow change.
