import Link from "next/link";
import { listAdminDestinations } from "@/admin/queries";
import { unpublishAction } from "@/app/admin/actions";
import { Badge } from "@/shared/ui/badge";

export const dynamic = "force-dynamic";

export default async function AdminDestinations() {
  const destinations = await listAdminDestinations();

  return (
    <div>
      <h1 className="text-2xl font-semibold tracking-tight">Destinations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        All destinations across every status.
      </p>

      <div className="mt-6 overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-border text-left text-muted-foreground">
              <th className="py-2 pr-4 font-medium">Name</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Trails</th>
              <th className="py-2 pr-4 font-medium">Last verified</th>
              <th className="py-2 pr-4 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {destinations.map((d) => (
              <tr key={d.id} className="border-b border-border">
                <td className="py-2 pr-4">
                  {d.status === "published" ? (
                    <Link href={`/destinations/${d.slug}`} className="hover:underline">
                      {d.name}
                    </Link>
                  ) : (
                    d.name
                  )}
                </td>
                <td className="py-2 pr-4">
                  <Badge variant={d.status === "published" ? "brand" : "outline"}>
                    {d.status}
                  </Badge>
                </td>
                <td className="py-2 pr-4">{d.trailCount}</td>
                <td className="py-2 pr-4 text-muted-foreground">
                  {d.lastVerifiedAt ? d.lastVerifiedAt.toLocaleDateString() : "—"}
                </td>
                <td className="py-2 pr-4">
                  {d.status === "published" && (
                    <form action={unpublishAction}>
                      <input type="hidden" name="destinationId" value={d.id} />
                      <button
                        type="submit"
                        className="text-muted-foreground underline underline-offset-4 hover:text-destructive"
                      >
                        Unpublish
                      </button>
                    </form>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {destinations.length === 0 && (
          <p className="mt-6 text-sm text-muted-foreground">No destinations yet.</p>
        )}
      </div>
    </div>
  );
}
