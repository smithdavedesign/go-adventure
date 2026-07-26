# Legal readiness — the solo-founder map

> **This is not legal advice.** It's an engineering map of what legal-facing
> material exists, what's drafted, and the short list of things only you (or a
> lawyer) can finish. Everything in `docs/legal/` and the `/privacy` `/terms`
> pages is a **draft prepared for your review** — not a lawyer's sign-off.

The point of this doc: you're a one-person team and "do legal" feels like a wall.
It isn't. Most of it is drafting, and the drafting is done. What's left is small,
specific, and listed at the bottom.

---

## 1. What already exists (and is solid)

| Document | Where | State |
|---|---|---|
| Privacy Policy | [`src/app/privacy/page.tsx`](../src/app/privacy/page.tsx) | Draft, app-accurate, GDPR-aware. 11 sections. |
| Terms of Use | [`src/app/terms/page.tsx`](../src/app/terms/page.tsx) | Draft, has the clauses that matter: "as is" disclaimer, limitation of liability, safety, governing law. |
| Safety disclosure (in-product) | [`src/content/SafetyDisclosure.tsx`](../src/content/SafetyDisclosure.tsx) | Rendered on destination + trail pages. |
| Source attributions | Maps (ODbL), photo credits (CC), footer (NPS) | Rendered in-product. |

The privacy policy accurately describes what the app actually collects: account
name/email from Google sign-in, saved destinations, consent-gated anonymous usage
events, and short-retention server logs. It does **not** claim things the app
doesn't do (no ad networks, no data sale, no AI training on user data). That
honesty is the thing regulators and users care about most, and it's already right.

## 2. What I drafted to close the gaps (this folder)

| Document | Where | Closes gate |
|---|---|---|
| Sensitive-location policy | [`docs/legal/sensitive-location-policy.md`](legal/sensitive-location-policy.md) | D3 |
| Incident-response runbook | [`docs/legal/incident-response.md`](legal/incident-response.md) | D4 |
| Copyright / takedown policy | [`docs/legal/copyright-takedown.md`](legal/copyright-takedown.md) | D2 (takedown contact) |

These are drafts too, with `[BRACKETED]` blanks that only you can fill.

## 3. Small tightening still worth doing (I can do these)

- **CCPA/California callout** in the privacy policy. It already says "we do not
  sell your data" (the core CCPA point), but a named California-rights paragraph
  is cheap insurance if you'll have CA users. *(Draftable now.)*
- **International-transfer note** for EU users (data lives in US-region Supabase).
  One sentence naming the transfer basis. *(Draftable now — you confirm the basis.)*
- **Cookie-consent banner UI.** The privacy policy references a cookie notice, and
  analytics is gated on consent, but the banner component isn't built yet. It's
  only needed **when you turn analytics on** (GA4 is currently parked), so this is
  not launch-blocking today. *(Buildable when you wire analytics.)*

---

## 4. The irreducible "only you" list

These cannot be drafted for you. They're short.

**A. Fill three real details** (they appear as `[BRACKETS]` across all the docs):

1. `[YOUR LEGAL NAME / ENTITY]` — the person or company operating Travel Roamer.
   If you haven't formed an LLC, it's you personally (which is also your liability
   exposure — see B).
2. `[GOVERNING-LAW STATE/COUNTRY]` — where disputes are governed. Usually where
   you live/operate. Fill the blank in Terms §"Governing law".
3. `[CONTACT EMAIL]` / domain — the docs currently assume
   `privacy@travel-roamer.com`, `legal@travel-roamer.com`. You either **register
   that domain and create the inboxes**, or **swap in an email you actually own**.
   Pick one and make it consistent everywhere.

**B. One targeted lawyer pass** — the only part genuinely worth paying for:

1. **The liability + safety disclaimer** (Terms §Disclaimer/§Limitation of
   liability). This is an outdoor product. Your real-world exposure is: someone
   relies on distance/elevation/route/weather/alert data that's wrong or stale,
   goes into the backcountry, and gets hurt. The disclaimer language is your
   primary shield. A lawyer confirming it's enforceable in your jurisdiction is a
   few hundred dollars extremely well spent.
2. **Source commercial-use terms.** Confirm each data source permits a commercial
   product: NPS/RIDB (public domain, low risk), OpenStreetMap (ODbL — attribution
   + share-alike on derived geodata), Wikimedia (per-image CC — attribution),
   Open-Meteo, MapTiler (check your plan tier), USGS. Summary is in
   [`docs/source-registry.md`](source-registry.md); the lawyer just confirms your
   *use* fits each *license*.

**C. Register the domain.** Needed for the contact emails and the launch anyway.

That's the whole list. Three details, one lawyer pass, one domain.

---

## 5. Pragmatic launch paths (your risk call, not mine)

I won't tell you which to pick — that's a risk decision only you can own. The
honest options solo founders actually use:

- **Full path:** fill A, register domain (C), get the lawyer pass (B) on the
  disclaimer + source terms *before* public launch. Lowest risk. Costs a bit of
  time + a few hundred dollars.
- **Soft/beta path:** fill A + C, ship behind clear disclaimers and a "beta /
  informational only" label, get the lawyer pass (B) before you scale or take on
  users at volume. Common in practice; the risk is real but bounded by your
  disclaimers and small user count. **This is a judgment call you make, not me.**

Either way, the disclaimer language (B1) is what's doing the protective work, so
it should be strong and prominent regardless of path.

---

## 6. Status vs. launch-readiness gate D

| Gate item | Status | Owner |
|---|---|---|
| D2 Privacy policy | Drafted ✅ — needs your details + review | You + lawyer (review) |
| D2 Terms of use | Drafted ✅ — needs your details + review | You + lawyer (review) |
| D2 Copyright/takedown contact | Drafted ✅ — needs designated-agent detail | You |
| D2 Cookie/analytics consent notice | Policy text ✅; banner UI deferred until analytics on | You (when analytics ships) |
| D3 Sensitive-location policy | Drafted ✅ | You (adopt) |
| D4 Incident-response runbook | Drafted ✅ — needs contacts | You |
| Liability disclaimer enforceability | ⚠️ Needs lawyer pass | Lawyer |
| Source commercial-use terms | ⚠️ Needs confirmation | You + lawyer |

**Bottom line:** the drafting wall is gone. What's left is your three details, one
lawyer conversation, and a domain.
