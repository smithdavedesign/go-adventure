"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/shared/ui/badge";

const MAX = 4;

/**
 * Add/remove destinations to compare. Selection lives in the `?d=` query param
 * (linkable, server-rendered), so this only rewrites the URL; the page re-renders
 * the comparison table server-side.
 */
export function ComparePicker({
  all,
  selected,
}: {
  all: { name: string; slug: string }[];
  selected: string[];
}) {
  const router = useRouter();

  function setSelected(next: string[]) {
    const qs = next.length ? `?d=${next.join(",")}` : "";
    router.push(`/compare${qs}`, { scroll: false });
  }

  const remaining = all.filter((d) => !selected.includes(d.slug));
  const bySlug = new Map(all.map((d) => [d.slug, d.name]));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {selected.map((slug) => (
        <Badge key={slug} variant="brand" className="gap-1.5">
          {bySlug.get(slug) ?? slug}
          <button
            type="button"
            aria-label={`Remove ${bySlug.get(slug) ?? slug}`}
            onClick={() => setSelected(selected.filter((s) => s !== slug))}
            className="rounded-full leading-none hover:opacity-80"
          >
            ×
          </button>
        </Badge>
      ))}

      {selected.length < MAX && remaining.length > 0 && (
        <select
          value=""
          onChange={(e) => {
            if (e.target.value) setSelected([...selected, e.target.value]);
          }}
          aria-label="Add a destination to compare"
          className="rounded-md border border-border bg-background px-2 py-1 text-sm text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          <option value="">
            {selected.length ? "Add another…" : "Add a destination…"}
          </option>
          {remaining.map((d) => (
            <option key={d.slug} value={d.slug}>
              {d.name}
            </option>
          ))}
        </select>
      )}

      {selected.length > 0 && (
        <button
          type="button"
          onClick={() => setSelected([])}
          className="text-sm text-muted-foreground underline underline-offset-4 hover:text-foreground"
        >
          Clear
        </button>
      )}
    </div>
  );
}
