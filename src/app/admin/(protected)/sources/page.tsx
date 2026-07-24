import { listSources } from "@/admin/queries";
import { Badge } from "@/shared/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminSources() {
  const sources = await listSources();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Sources</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        The source registry. No source may be ingested or displayed without a
        reviewed, enabled entry here.
      </p>

      <ul className="mt-6 space-y-3">
        {sources.map((s) => (
          <li key={s.id} className="rounded-xl border border-border p-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">{s.name}</span>
              <Badge variant={s.enabled ? "brand" : "outline"}>
                {s.enabled ? "enabled" : "disabled"}
              </Badge>
            </div>
            <dl className="mt-2 grid grid-cols-2 gap-y-1 text-sm text-muted-foreground sm:grid-cols-4">
              <div><dt className="inline">Owner: </dt><dd className="inline text-foreground">{s.owner}</dd></div>
              <div><dt className="inline">Refresh: </dt><dd className="inline text-foreground">{s.refreshPolicy}</dd></div>
              <div><dt className="inline">Records: </dt><dd className="inline text-foreground">{s.recordCount}</dd></div>
              <div><dt className="inline">Last pull: </dt><dd className="inline text-foreground">{s.lastRetrievedAt ? s.lastRetrievedAt.toLocaleDateString() : "—"}</dd></div>
            </dl>
            <p className="mt-2 text-xs text-muted-foreground">Licence: {s.licence}</p>
          </li>
        ))}
        {sources.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No sources registered. Ingestion registers a source on first run.
          </p>
        )}
      </ul>
    </div>
  );
}
