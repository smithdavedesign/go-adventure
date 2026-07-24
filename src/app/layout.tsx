import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import Link from "next/link";
import { cn } from "@/lib/utils";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
  title: {
    default: "Travel Roamer",
    template: "%s · Travel Roamer",
  },
  description: "Discover where to go for your next outdoor adventure.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body className="min-h-dvh bg-background text-foreground antialiased">
        <header className="border-b border-border">
          <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
            <Link href="/" className="font-semibold tracking-tight">
              Travel Roamer
            </Link>
            <nav>
              <Link
                href="/explore"
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Explore
              </Link>
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  );
}
