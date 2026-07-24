import type { FreshAlerts } from "@/platform/alerts/snapshots";

/** Danger / closures get destructive styling; everything else is informational. */
function isUrgent(category: string): boolean {
  return /danger|closure|closed/i.test(category);
}

/**
 * Current official park alerts (Tier 1). Sourced from NPS, expiring, and shown
 * only when fresh (getFreshAlertsNear returns null otherwise). Never presented
 * as anything but the park's own current notices, always with the official link
 * (PRD Safety / Dynamic Information). Rendered high on the destination page.
 */
export function AlertBanner({ data }: { data: FreshAlerts }) {
  const urgent = data.alerts.some((a) => isUrgent(a.category));

  return (
    <section
      role="status"
      className={
        "mt-8 rounded-xl border p-4 " +
        (urgent
          ? "border-destructive/50 bg-destructive/5"
          : "border-border bg-secondary/40")
      }
    >
      <h2 className="text-sm font-semibold">
        Current park alerts ({data.alerts.length})
      </h2>
      <ul className="mt-3 space-y-3">
        {data.alerts.slice(0, 6).map((a, i) => (
          <li key={i} className="text-sm">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span
                className={
                  "text-xs font-medium uppercase tracking-wide " +
                  (isUrgent(a.category) ? "text-destructive" : "text-muted-foreground")
                }
              >
                {a.category}
              </span>
              <span className="font-medium">{a.title}</span>
            </div>
            {a.description && (
              <p className="mt-1 text-muted-foreground">{a.description}</p>
            )}
            {a.url && (
              <a
                href={a.url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-brand underline underline-offset-4"
              >
                Official details ↗
              </a>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 border-t border-border pt-2 text-xs text-muted-foreground">
        Source: National Park Service, as of{" "}
        {new Date(data.observedAt).toLocaleString()}. Always confirm current
        conditions with the park before you go.
      </p>
    </section>
  );
}
