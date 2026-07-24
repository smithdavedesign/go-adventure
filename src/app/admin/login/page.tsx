import type { Metadata } from "next";
import { loginAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AdminLogin({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <main className="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4">
      <h1 className="text-xl font-semibold">Admin sign-in</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Interim password gate. Replaced by Google OAuth + <code>is_admin</code>{" "}
        in M7.
      </p>
      <form action={loginAction} className="mt-6 space-y-3">
        <input
          type="password"
          name="password"
          required
          autoFocus
          placeholder="Admin password"
          aria-label="Admin password"
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        {error && (
          <p className="text-sm text-destructive">Incorrect password.</p>
        )}
        <button
          type="submit"
          className="w-full rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90"
        >
          Sign in
        </button>
      </form>
    </main>
  );
}
