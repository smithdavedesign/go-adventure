import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { auth } from "@/user/auth/auth";
import { logoutAction } from "../actions";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

const NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/review", label: "Review queue" },
  { href: "/admin/destinations", label: "Destinations" },
  { href: "/admin/sources", label: "Sources" },
];

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Authoritative gate: an authenticated Auth.js session whose user carries the
  // `isAdmin` role (PRD M7). Signed-out users and non-admins are sent to the
  // admin sign-in page, which explains the Google + is_admin requirement.
  const session = await auth();
  if (!session?.user?.isAdmin) {
    redirect("/admin/login");
  }

  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <span className="font-semibold">Travel Roamer Admin</span>
            <nav className="flex gap-4 text-sm text-muted-foreground">
              {NAV.map((n) => (
                <Link key={n.href} href={n.href} className="hover:text-foreground">
                  {n.label}
                </Link>
              ))}
            </nav>
          </div>
          <form action={logoutAction}>
            <button
              type="submit"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Sign out
            </button>
          </form>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}
