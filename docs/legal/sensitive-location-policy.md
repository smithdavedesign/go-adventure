# Sensitive-location editorial policy

> **Draft for review — not legal advice.** Adopt this as your editorial standard
> before scaling content. It reflects what the product does today and sets the
> rule for what it will and won't publish.

## Why this exists

Travel Roamer publishes place coordinates and trail geometry. For most locations
(established national-park trails) that's harmless — the information is already
public and official. But precise geographic data can cause real harm for a
minority of sites: fragile cultural/archaeological sites, sensitive wildlife
habitat, private land, and dangerous unmaintained "social" routes. Publishing or
amplifying precise access to those can lead to looting, habitat damage, trespass,
or people getting hurt on routes that were never meant to be recommended.

This policy is how we avoid that.

## Principles

1. **Official, already-public sources only.** We publish geometry and coordinates
   from authoritative public sources (NPS, USGS, OpenStreetMap named public ways).
   We do **not** accept user-submitted routes or coordinates. There is no
   crowd-sourced "secret spot" surface, and we will not add one without revisiting
   this policy.
2. **We describe, we don't navigate.** The product is a *discovery* tool, not a
   turn-by-turn navigation or safety device. We surface that a place exists and
   what it's like; we do not present ourselves as the source of record for
   in-field routefinding. (See the in-product safety disclosure and Terms.)
3. **Don't amplify precise access to sensitive sites.** For the categories below,
   we either omit precise geometry, generalize the location, or decline to feature
   the site at all.
4. **Defer to land managers.** If an authoritative land manager, agency, or tribal
   authority asks us to remove or generalize a location, we do it promptly (see
   "Removal path") without requiring a legal process.

## Categories we omit, generalize, or decline

- **Cultural / archaeological / sacred sites** vulnerable to looting or
  desecration (including many Indigenous cultural sites). Default: do not publish
  precise coordinates or access routes.
- **Sensitive wildlife habitat** — nesting sites, denning areas, sensitive or
  endangered-species locations where visitation causes harm. Default: generalize.
- **Private land / restricted access.** Do not publish routes that cross private
  land without a clearly public right-of-way, and never imply access permission we
  can't confirm.
- **Dangerous unmaintained / "social" trails.** Do not present unofficial,
  unmaintained, or hazardous routes as recommended trails. If OSM data includes
  such a way, it is not eligible to be a *representative* featured trail.
- **Permits & closures.** Permit requirements are published only when confirmed
  from an official source; they are never inferred. Active closures/alerts are
  shown from official feeds and are never served stale (freshness-gated).

## Editorial checkpoint

Before a destination or trail is published or featured:

- The source is authoritative and cited.
- The location is not in a category above; if it borders one, geometry is
  generalized or the feature is declined.
- Permit/closure claims are confirmed-source, not inferred.
- Attribution for the source is rendered.

Because trails are currently ingested from OSM without a per-trail human review UI,
treat this checkpoint as a **spot-check standard** on published trails until that
review surface exists (tracked as a known gap in the roadmap).

## Removal path

Anyone — especially a land manager, agency, or tribal authority — can request
removal or generalization of a location:

- **Contact:** `[CONTACT EMAIL]` (subject: "Sensitive location").
- **What we need:** the page URL(s) and the concern (harm category above).
- **Our response:** acknowledge within **[2 business days]**; where the concern is
  credible, **remove or generalize the location promptly** (target **[5 business
  days]**), and confirm back. We err toward removal when a credible land-management
  or cultural authority asks — we do not require a court order.

This path also covers privacy-based removal requests (a location tied to an
identifiable private individual). Copyright issues use the separate
[copyright/takedown policy](copyright-takedown.md).

## Review

Revisit this policy whenever a new content source or a user-contribution feature is
added, and at least once a year. Owner: `[YOUR LEGAL NAME / ENTITY]`.
