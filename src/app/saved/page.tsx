import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/user/auth/auth";
import { listSavedDestinations } from "@/user/saved/queries";
import { DestinationCard } from "@/content/destinations/DestinationCard";

export const metadata: Metadata = {
  title: "Saved",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SavedPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?next=${encodeURIComponent("/saved")}`);
  }

  const destinations = await listSavedDestinations(session.user.id);

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Saved destinations</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {destinations.length} saved.
      </p>

      {destinations.length > 0 ? (
        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {destinations.map((d) => (
            <DestinationCard key={d.id} destination={d} />
          ))}
        </div>
      ) : (
        <div className="mt-8 rounded-xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">Nothing saved yet.</p>
          <Link
            href="/explore"
            className="mt-4 inline-flex rounded-lg bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90"
          >
            Explore destinations
          </Link>
        </div>
      )}
    </main>
  );
}
