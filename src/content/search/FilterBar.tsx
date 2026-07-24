"use client";

import { useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ACTIVITIES,
  DIFFICULTIES,
  MONTHS,
  TRIP_LENGTHS,
} from "@/shared/types/content";
import {
  formatActivity,
  formatDifficulty,
  formatMonthShort,
  formatTripLength,
} from "@/shared/utils/format";
import {
  activeFilterCount,
  filtersToSearchParams,
  parseFilters,
  type DestinationFilters,
} from "./filters";

const BUDGET_PRESETS = [250, 500, 1000, 2000] as const;

/**
 * Explore filter controls. State lives entirely in the URL — this component
 * reads the current filters from the query string and writes updates back with a
 * client-side navigation (no full reload, per PRD Design Principles). Multi-select
 * facets use toggle chips; month and budget use compact selects.
 */
export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // ReadonlyURLSearchParams → real URLSearchParams so parseFilters can read it.
  const filters = parseFilters(new URLSearchParams(searchParams.toString()));

  const commit = useCallback(
    (next: DestinationFilters) => {
      const qs = filtersToSearchParams(next).toString();
      router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [router, pathname],
  );

  /** Add/remove a value from one of the array facets. */
  function toggle<K extends "activities" | "difficulties" | "tripLengths">(
    key: K,
    value: DestinationFilters[K][number],
  ) {
    const current = filters[key] as string[];
    const nextValues = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value];
    commit({ ...filters, [key]: nextValues });
  }

  const count = activeFilterCount(filters);

  return (
    <div className="space-y-4">
      {/* Uncontrolled input: `key` remounts it (resetting the field) when the
          URL keyword changes, e.g. after "Clear all". Committed on submit so we
          don't navigate on every keystroke. */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const value = new FormData(e.currentTarget).get("q");
          const trimmed = (value?.toString() ?? "").trim();
          commit({ ...filters, q: trimmed ? trimmed : null });
        }}
        role="search"
        className="flex gap-2"
      >
        <input
          key={filters.q ?? ""}
          name="q"
          type="search"
          defaultValue={filters.q ?? ""}
          placeholder='Try "alpine backpacking" or "waterfalls"'
          aria-label="Search destinations"
          className="w-full max-w-md rounded-md border border-input bg-background px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap items-start gap-x-8 gap-y-4">
        <ChipGroup label="Activity">
          {ACTIVITIES.map((a) => (
            <Chip
              key={a}
              active={filters.activities.includes(a)}
              onClick={() => toggle("activities", a)}
            >
              {formatActivity(a)}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Difficulty">
          {DIFFICULTIES.map((d) => (
            <Chip
              key={d}
              active={filters.difficulties.includes(d)}
              onClick={() => toggle("difficulties", d)}
            >
              {formatDifficulty(d)}
            </Chip>
          ))}
        </ChipGroup>

        <ChipGroup label="Trip length">
          {TRIP_LENGTHS.map((t) => (
            <Chip
              key={t}
              active={filters.tripLengths.includes(t)}
              onClick={() => toggle("tripLengths", t)}
            >
              {formatTripLength(t)}
            </Chip>
          ))}
        </ChipGroup>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Best month</span>
          <select
            value={filters.months[0] ?? ""}
            onChange={(e) =>
              commit({
                ...filters,
                months: e.target.value ? [e.target.value as (typeof MONTHS)[number]] : [],
              })
            }
            className="rounded-md border border-input bg-background px-3 py-1.5"
          >
            <option value="">Any</option>
            {MONTHS.map((m) => (
              <option key={m} value={m}>
                {formatMonthShort(m)}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5 text-sm">
          <span className="font-medium">Max budget</span>
          <select
            value={filters.maxBudgetUsd ?? ""}
            onChange={(e) =>
              commit({
                ...filters,
                maxBudgetUsd: e.target.value ? Number(e.target.value) : null,
              })
            }
            className="rounded-md border border-input bg-background px-3 py-1.5"
          >
            <option value="">Any</option>
            {BUDGET_PRESETS.map((b) => (
              <option key={b} value={b}>
                Up to ${b.toLocaleString()}
              </option>
            ))}
          </select>
        </label>
      </div>

      {count > 0 && (
        <button
          type="button"
          onClick={() => router.push(pathname, { scroll: false })}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Clear all filters ({count})
        </button>
      )}
    </div>
  );
}

function ChipGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium">{label}</span>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3 py-1 text-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
        active
          ? "border-brand bg-brand text-brand-foreground"
          : "border-border bg-background hover:bg-secondary",
      )}
    >
      {children}
    </button>
  );
}
