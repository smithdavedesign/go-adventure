"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Suggestion = { name: string; slug: string };

/**
 * Explore search box with destination autocomplete (PRD binding slice). Typing
 * fetches matching destinations from /api/suggest (debounced); picking one jumps
 * straight to that destination, while submitting runs the normal keyword search.
 * Implements the ARIA combobox pattern with keyboard navigation.
 */
export function SearchAutocomplete({
  initialQuery,
  onSearch,
}: {
  initialQuery: string;
  onSearch: (q: string | null) => void;
}) {
  const router = useRouter();
  const [value, setValue] = useState(initialQuery);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  // (The parent remounts this via `key` when the URL query changes externally,
  // e.g. "Clear all filters" — so no prop→state sync effect is needed here.)

  // Debounced suggestion fetch; aborts in-flight requests as the user types.
  useEffect(() => {
    const term = value.trim();
    if (term.length < 2) return; // display is gated on length; no need to clear
    const ctrl = new AbortController();
    const timer = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => (r.ok ? r.json() : []))
        .then((data: Suggestion[]) => {
          setSuggestions(data);
          setActive(-1);
        })
        .catch(() => {});
    }, 150);
    return () => {
      clearTimeout(timer);
      ctrl.abort();
    };
  }, [value]);

  // Close the list on an outside click.
  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  function runSearch() {
    const term = value.trim();
    setOpen(false);
    onSearch(term ? term : null);
  }

  function goToDestination(s: Suggestion) {
    setOpen(false);
    router.push(`/destinations/${s.slug}`);
  }

  const listVisible =
    open && value.trim().length >= 2 && suggestions.length > 0;

  function onKeyDown(e: React.KeyboardEvent) {
    if (!listVisible) {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch();
      }
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(a + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(a - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (active >= 0) goToDestination(suggestions[active]);
      else runSearch();
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div ref={boxRef} className="w-full max-w-md">
      <form
        role="search"
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (listVisible && active >= 0) goToDestination(suggestions[active]);
          else runSearch();
        }}
      >
        <div className="relative w-full">
          <input
            type="search"
            role="combobox"
            aria-expanded={listVisible}
            aria-controls={listVisible ? "destination-suggestions" : undefined}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `suggestion-${active}` : undefined}
            aria-label="Search destinations"
            value={value}
            onChange={(e) => {
              setValue(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder='Try "Yosemite" or "waterfalls"'
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          {listVisible && (
            <ul
              id="destination-suggestions"
              role="listbox"
              className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-border bg-background shadow-lg"
            >
              {suggestions.map((s, i) => (
                <li
                  key={s.slug}
                  id={`suggestion-${i}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onMouseDown={(e) => {
                    e.preventDefault(); // keep focus; fire before blur closes the list
                    goToDestination(s);
                  }}
                  className={
                    "cursor-pointer px-3 py-2 text-sm " +
                    (i === active ? "bg-secondary" : "hover:bg-secondary")
                  }
                >
                  {s.name}
                </li>
              ))}
            </ul>
          )}
        </div>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-foreground hover:opacity-90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
        >
          Search
        </button>
      </form>
    </div>
  );
}
