import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { auth } from "@/user/auth/auth";
import { signOutAction } from "@/user/auth/actions";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Travel Roamer",
    template: "%s · Travel Roamer",
  },
  description: "Discover where to go for your next outdoor adventure.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="font-semibold tracking-tight">
              Travel Roamer
            </Link>
            <nav className="flex items-center gap-4 text-sm text-muted-foreground">
              <Link href="/explore" className="hover:text-foreground">
                Explore
              </Link>
              {session?.user?.id ? (
                <>
                  <Link href="/saved" className="hover:text-foreground">
                    Saved
                  </Link>
                  <Link href="/account" className="hover:text-foreground">
                    Account
                  </Link>
                  <form action={signOutAction}>
                    <button type="submit" className="hover:text-foreground">
                      Sign out
                    </button>
                  </form>
                </>
              ) : (
                <Link href="/signin" className="hover:text-foreground">
                  Sign in
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
