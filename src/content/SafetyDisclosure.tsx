/**
 * Concise safety + data-freshness disclosure, required on every destination and
 * trail page and readable without opening a modal (PRD: Safety, Access, and
 * Dynamic Information).
 *
 * During M2 the corpus is fabricated seed data, so this states that plainly.
 * Once real sources and official permit/alert links exist (M5/M6), this
 * component gains the "Last verified" date and official land-manager links.
 */
export function SafetyDisclosure({
  lastVerifiedAt,
}: {
  lastVerifiedAt?: Date | null;
}) {
  return (
    <aside className="rounded-lg border border-border bg-secondary/50 p-4 text-sm text-muted-foreground">
      <p>
        <strong className="text-foreground">Plan responsibly.</strong> Travel
        Roamer inspires and informs — it is not a navigation, emergency, permit,
        or route-safety service. Regulations and conditions change; always
        confirm current rules, closures, and permits with the responsible land
        manager before you go.
      </p>
      <p className="mt-2">
        <strong className="text-foreground">Note:</strong> this is illustrative
        placeholder content for development. Facts here are not sourced or
        verified and must not be relied on.
      </p>
      {lastVerifiedAt && (
        <p className="mt-2">Last reviewed: {lastVerifiedAt.toLocaleDateString()}</p>
      )}
    </aside>
  );
}
