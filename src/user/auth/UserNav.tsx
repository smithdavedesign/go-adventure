"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";

/**
 * Auth-dependent header links, resolved client-side (see Providers). Signed-out
 * and while-loading both render the "Sign in" affordance, so the static HTML a
 * crawler or first paint sees is correct for the common case; an authenticated
 * session swaps in Saved/Account/Sign out once it hydrates.
 */
export function UserNav() {
  const { data: session, status } = useSession();
  const authed = status === "authenticated" && !!session?.user;

  if (!authed) {
    return (
      <Link href="/signin" className="hover:text-foreground">
        Sign in
      </Link>
    );
  }

  return (
    <>
      <Link href="/saved" className="hover:text-foreground">
        Saved
      </Link>
      <Link href="/account" className="hover:text-foreground">
        Account
      </Link>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/" })}
        className="hover:text-foreground"
      >
        Sign out
      </button>
    </>
  );
}
