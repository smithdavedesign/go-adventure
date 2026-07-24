import Link from "next/link";
import { listReviewQueue } from "@/admin/queries";
import { Badge } from "@/shared/ui/badge";

export const dynamic = "force-dynamic";

export default async function ReviewQueue() {
  const drafts = await listReviewQueue();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Review queue</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Ingested and editorial drafts awaiting review. A draft can only be
        published once every required field is present.
      </p>

      {drafts.length === 0 ? (
        <p className="mt-8 text-sm text-muted-foreground">
          Nothing in review. Run <code>npm run ingest:nps -- --fixture</code> to
          create some drafts.
        </p>
      ) : (
        <ul className="mt-6 divide-y divide-border rounded-xl border border-border">
          {drafts.map((d) => (
            <li key={d.id}>
              <Link
                href={`/admin/review/${d.id}`}
                className="flex items-center justify-between p-4 hover:bg-secondary"
              >
                <div>
                  <div className="font-medium">{d.name}</div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {d.sourceName} · {d.origin} · updated{" "}
                    {d.updatedAt.toLocaleDateString()}
                  </div>
                </div>
                {d.publishReady ? (
                  <Badge variant="brand">Ready</Badge>
                ) : (
                  <Badge variant="outline">
                    {d.blockingCount} field{d.blockingCount === 1 ? "" : "s"} to
                    fill
                  </Badge>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
