import Link from "next/link";
import { getDataHealth } from "@/admin/queries";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const h = await getDataHealth();

  const stats: { label: string; value: number; href?: string; warn?: boolean }[] =
    [
      { label: "Published destinations", value: h.published, href: "/admin/destinations" },
      { label: "Drafts / unpublished", value: h.drafts, href: "/admin/destinations" },
      { label: "In review", value: h.inReview, href: "/admin/review" },
      { label: "Enabled sources", value: h.sources, href: "/admin/sources" },
      { label: "Dead-lettered records", value: h.deadLetters, warn: h.deadLetters > 0 },
      { label: "Media attribution gaps", value: h.unattributedMedia, warn: h.unattributedMedia > 0 },
      { label: "Facts expiring ≤30d", value: h.expiringSoon, warn: h.expiringSoon > 0 },
    ];

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Data health</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Freshness, review backlog, and ingestion state.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {stats.map((s) => {
          const card = (
            <div
              className={
                "rounded-xl border p-4 " +
                (s.warn
                  ? "border-destructive/40 bg-destructive/5"
                  : "border-border")
              }
            >
              <div className="text-2xl font-semibold">{s.value}</div>
              <div className="mt-1 text-sm text-muted-foreground">{s.label}</div>
            </div>
          );
          return s.href ? (
            <Link key={s.label} href={s.href}>
              {card}
            </Link>
          ) : (
            <div key={s.label}>{card}</div>
          );
        })}
      </div>

      <div className="mt-8 rounded-xl border border-border p-4 text-sm">
        <div className="font-medium">Latest ingestion run</div>
        {h.latestRun ? (
          <p className="mt-1 text-muted-foreground">
            {h.latestRun.sourceName} — {h.latestRun.status}, {h.latestRun.recordsProcessed}{" "}
            processed / {h.latestRun.recordsFailed} failed, started{" "}
            {h.latestRun.startedAt.toLocaleString()}
          </p>
        ) : (
          <p className="mt-1 text-muted-foreground">No ingestion runs yet.</p>
        )}
      </div>
    </div>
  );
}
