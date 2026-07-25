import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Providers } from "@/user/auth/Providers";
import { UserNav } from "@/user/auth/UserNav";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Travel Roamer",
    template: "%s · Travel Roamer",
  },
  description: "Discover where to go for your next outdoor adventure.",
};

// No `auth()` here on purpose: the header reads session on the client (Providers
// + UserNav) so the layout stays static and published pages can be ISR. See
// Providers.tsx.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <Providers>
          <header className="border-b border-border">
            <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
              <Link href="/" className="font-semibold tracking-tight">
                Travel Roamer
              </Link>
              <nav className="flex items-center gap-4 text-sm text-muted-foreground">
                <Link href="/explore" className="hover:text-foreground">
                  Explore
                </Link>
                <UserNav />
              </nav>
            </div>
          </header>
          {children}
        <footer className="mt-auto border-t border-border py-6 text-xs text-muted-foreground">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4">
            <span>© {new Date().getFullYear()} Travel Roamer</span>
            <nav className="flex items-center gap-4">
              <Link href="/privacy" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="/terms" className="hover:text-foreground">
                Terms of Use
              </Link>
            </nav>
          </div>
          </footer>
        </Providers>
      </body>
    </html>
  );
}
