import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/user/auth/auth";
import { adminSignInAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

/**
 * Admin sign-in. The gate is an authenticated Google account carrying the
 * `is_admin` role (PRD M7 — replaces the interim password gate). Three states:
 * already an admin → straight to the dashboard; signed in without the role →
 * explain; signed out → offer Google sign-in.
 */
export default async function AdminLogin() {
  const session = await auth();

  if (session?.user?.isAdmin) {
    redirect("/admin");
  }

  const signedInNotAdmin = !!session?.user && !session.user.isAdmin;

  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-semibold">Admin sign-in</h1>

      {signedInNotAdmin ? (
        <>
          <p className="mt-2 text-sm text-muted-foreground">
            You&rsquo;re signed in as{" "}
            <span className="font-medium text-foreground">
              {session!.user!.email}
            </span>
            , but this account doesn&rsquo;t have admin access. Ask an existing
            admin to grant it.
          </p>
          <Link
            href="/"
            className="mt-6 inline-flex justify-center rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary"
          >
            Back to site
          </Link>
        </>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted-foreground">
            Sign in with an authorized Google account (<code>is_admin</code>).
          </p>
          <form action={adminSignInAction} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
            >
              Sign in with Google
            </button>
          </form>
        </>
      )}
    </main>
  );
}
