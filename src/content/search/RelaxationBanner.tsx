"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import type { RelaxableConstraint } from "./relaxation";

/** URL param name(s) each relaxable constraint maps to. */
const PARAM_FOR: Record<RelaxableConstraint, string> = {
  budget: "maxBudget",
  month: "month",
  tripLength: "tripLength",
  difficulty: "difficulty",
};

export type DroppedLabel = { constraint: RelaxableConstraint; label: string };

/**
 * Transparency banner shown when the exact filters matched nothing and the app
 * relaxed one or more constraints to find results (PRD: never a silent widen,
 * always visible and labeled).
 *
 * Each dropped constraint is a removable chip. The dropped filters are still in
 * the URL (non-relaxed constraints are preserved); clicking × removes that one,
 * committing the relaxation as the user's explicit choice.
 */
export function RelaxationBanner({ dropped }: { dropped: DroppedLabel[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function remove(constraint: RelaxableConstraint) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete(PARAM_FOR[constraint]);
    const qs = params.toString();
    router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  return (
    <div
      role="status"
      className="rounded-lg border border-brand/40 bg-brand/5 p-4 text-sm"
    >
      <p className="font-medium">
        No exact matches — showing the closest results instead.
      </p>
      <p className="mt-1 text-muted-foreground">
        We relaxed {dropped.length === 1 ? "this filter" : "these filters"} to
        find destinations for you:
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {dropped.map((d) => (
          <button
            key={d.constraint}
            type="button"
            onClick={() => remove(d.constraint)}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-sm hover:bg-secondary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            aria-label={`Remove filter: ${d.label}`}
          >
            <span>{d.label}</span>
            <span aria-hidden className="text-muted-foreground">
              ×
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
