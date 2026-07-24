import Link from "next/link";
import { toggleSaveAction } from "./actions";

/**
 * Save / unsave control for a destination. Signed-out users get a sign-in
 * prompt (the auth gate the PRD's save flow describes). Progressive
 * enhancement: it's a plain form + server action, so it works without client JS.
 */
export function SaveControl({
  destinationId,
  slug,
  isSignedIn,
  saved,
}: {
  destinationId: string;
  slug: string;
  isSignedIn: boolean;
  saved: boolean;
}) {
  if (!isSignedIn) {
    return (
      <Link
        href={`/signin?next=${encodeURIComponent(`/destinations/${slug}`)}`}
        className="inline-flex items-center rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
      >
        ♥ Save this destination
      </Link>
    );
  }

  return (
    <form action={toggleSaveAction}>
      <input type="hidden" name="destinationId" value={destinationId} />
      <input type="hidden" name="slug" value={slug} />
      <button
        type="submit"
        aria-pressed={saved}
        className={
          "inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring " +
          (saved
            ? "bg-brand text-brand-foreground hover:opacity-90"
            : "border border-border hover:bg-secondary")
        }
      >
        {saved ? "♥ Saved" : "♡ Save"}
      </button>
    </form>
  );
}
