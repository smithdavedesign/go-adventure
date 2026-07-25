"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { THEMES, type ThemeKey } from "@/shared/data/themes";
import { filtersToSearchParams, parseFilters } from "./filters";

/**
 * Airbnb-style vibe/category pills — a scrollable row of tappable themes that
 * filter Explore without typing. Selection lives in the URL (`?theme=…`), so it
 * composes with the other facets and is linkable/back-button friendly.
 */
export function CategoryPills() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const filters = parseFilters(new URLSearchParams(searchParams.toString()));
  const active = new Set<ThemeKey>(filters.themes);

  function toggle(key: ThemeKey) {
    const themes = active.has(key)
      ? filters.themes.filter((t) => t !== key)
      : [...filters.themes, key];
    const qs = filtersToSearchParams({ ...filters, themes }).toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      className="-mx-4 overflow-x-auto px-4"
      role="group"
      aria-label="Browse by theme"
    >
      <div className="flex gap-2 pb-1">
        {THEMES.map(({ key, label, icon }) => {
          const on = active.has(key);
          return (
            <button
              key={key}
              type="button"
              aria-pressed={on}
              onClick={() => toggle(key)}
              className={cn(
                "flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                on
                  ? "border-brand bg-brand text-brand-foreground"
                  : "border-border bg-background text-foreground hover:bg-secondary",
              )}
            >
              <span aria-hidden>{icon}</span>
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
