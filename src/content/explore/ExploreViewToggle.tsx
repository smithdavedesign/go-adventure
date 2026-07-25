"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * List / Map view toggle for the Explore page.
 * Writes `?view=map` into the URL; list is the default (no param).
 * All other filter params are preserved.
 */
export function ExploreViewToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isMap = searchParams.get("view") === "map";

  function setView(v: "list" | "map") {
    const next = new URLSearchParams(searchParams.toString());
    if (v === "list") next.delete("view");
    else next.set("view", "map");
    const qs = next.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const btn =
    "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

  return (
    <div
      className="flex items-center gap-0.5 rounded-lg border border-border bg-secondary/50 p-1"
      role="group"
      aria-label="View mode"
    >
      <button
        type="button"
        onClick={() => setView("list")}
        aria-pressed={!isMap}
        className={cn(
          btn,
          !isMap
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {/* Rows icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <rect x="1" y="2" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="6" width="12" height="2" rx="1" fill="currentColor" />
          <rect x="1" y="10" width="12" height="2" rx="1" fill="currentColor" />
        </svg>
        List
      </button>

      <button
        type="button"
        onClick={() => setView("map")}
        aria-pressed={isMap}
        className={cn(
          btn,
          isMap
            ? "bg-background text-foreground shadow-sm"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        {/* Map pin icon */}
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
          <circle cx="7" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M7 2C5.067 2 3.5 3.567 3.5 5.5c0 2.8 3.5 6.5 3.5 6.5s3.5-3.7 3.5-6.5C10.5 3.567 8.933 2 7 2z"
            stroke="currentColor"
            strokeWidth="1.5"
            fill="none"
          />
        </svg>
        Map
      </button>
    </div>
  );
}
