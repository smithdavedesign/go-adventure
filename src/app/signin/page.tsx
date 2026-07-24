import type { Metadata } from "next";
import { signInWithGoogle } from "@/user/auth/actions";

export const metadata: Metadata = {
  title: "Sign in",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;
  const returnTo = next ?? "/";
  const isDev = process.env.NODE_ENV !== "production";

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-4">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Save destinations to your account and pick up where you left off.
        Anonymous browsing stays available — you only need an account to save.
      </p>

      <form action={signInWithGoogle} className="mt-6">
        <input type="hidden" name="next" value={returnTo} />
        <button
          type="submit"
          className="w-full rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-secondary"
        >
          Continue with Google
        </button>
      </form>

      {isDev && (
        <div className="mt-6 rounded-lg border border-dashed border-border p-3 text-sm">
          <p className="font-medium">Dev sign-in</p>
          <p className="mt-1 text-muted-foreground">
            Google OAuth needs credentials (see DEPENDENCIES). For local testing:
          </p>
          <a
            href={`/api/dev-login?next=${encodeURIComponent(returnTo)}`}
            className="mt-2 inline-block text-brand underline underline-offset-4"
          >
            Sign in as a test user →
          </a>
        </div>
      )}
    </main>
  );
}
