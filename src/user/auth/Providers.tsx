"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Client session context so the global header can read auth state WITHOUT the
 * root layout calling `auth()` on the server. Reading auth()/cookies() in the
 * layout would force every page (including ISR trail/home pages) to render
 * dynamically. Keeping session on the client lets those pages stay static.
 */
export function Providers({ children }: { children: React.ReactNode }) {
  return <SessionProvider>{children}</SessionProvider>;
}
