import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { auth } from "@/user/auth/auth";
import { deleteAccountAction } from "./actions";

export const metadata: Metadata = {
  title: "Account",
  robots: { index: false, follow: false },
};
export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(`/signin?next=${encodeURIComponent("/account")}`);
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-semibold tracking-tight">Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {session.user.email ?? session.user.name ?? "Signed in"}
      </p>

      <section className="mt-8 space-y-6">
        <div className="rounded-xl border border-border p-4">
          <h2 className="font-medium">Export your data</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Download everything we hold about your account as JSON. Excludes
            authentication secrets.
          </p>
          <a
            href="/api/account/export"
            className="mt-3 inline-flex rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Download my data
          </a>
        </div>

        <div className="rounded-xl border border-destructive/40 p-4">
          <h2 className="font-medium">Delete your account</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Permanently removes your profile, sessions, and saved destinations.
            This cannot be undone.
          </p>
          <form action={deleteAccountAction} className="mt-3">
            <button
              type="submit"
              className="rounded-lg bg-destructive px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Delete account
            </button>
          </form>
        </div>
      </section>
    </main>
  );
}
