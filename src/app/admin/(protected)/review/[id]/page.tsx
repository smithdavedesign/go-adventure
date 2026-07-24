import Link from "next/link";
import { notFound } from "next/navigation";
import { getReviewDraft } from "@/admin/queries";
import {
  updateDraftAction,
  publishAction,
  aiDraftAction,
} from "@/app/admin/actions";
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

export const dynamic = "force-dynamic";

const PERMIT_TYPES = ["none", "reservation", "quota", "timed_entry", "unknown"];
const LABELS = ["", "editors_pick", "hidden_gem", "beginner_friendly", "epic"];

export default async function ReviewEditor({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    published?: string;
    saved?: string;
    error?: string;
    ai?: string;
  }>;
}) {
  const { id } = await params;
  const { published, saved, error, ai } = await searchParams;
  const draft = await getReviewDraft(id);
  if (!draft) notFound();

  const b = draft.body as Record<string, unknown>;
  const budget = (b.budget ?? {}) as { low?: number; high?: number };
  const permit = (b.permit ?? {}) as {
    requirementType?: string;
    scope?: string;
    officialUrl?: string;
  };
  const currentActivities = (b.activities as string[]) ?? [];
  const currentMonths = (b.bestMonths as string[]) ?? [];
  const aiSuggestion = b.aiSuggestion as
    | { summary: string; tags: string[]; model: string; promptVersion: string }
    | undefined;

  return (
    <div className="max-w-3xl">
      <Link href="/admin/review" className="text-sm text-muted-foreground hover:text-foreground">
        ← Review queue
      </Link>
      <h1 className="mt-3 text-2xl font-semibold tracking-tight">
        {String(b.name ?? "Draft")}
      </h1>

      {published && (
        <p className="mt-4 rounded-md border border-brand/40 bg-brand/5 p-3 text-sm">
          Published. <Link className="underline" href={`/destinations/${String(b.slug)}`}>View live page →</Link>
        </p>
      )}
      {saved && (
        <p className="mt-4 rounded-md border border-border bg-secondary p-3 text-sm">
          Draft saved.
        </p>
      )}
      {error && (
        <div className="mt-4 rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm">
          <p className="font-medium">Can’t publish yet:</p>
          <p className="mt-1 text-muted-foreground">{decodeURIComponent(error)}</p>
        </div>
      )}

      {/* Source provenance (read-only) */}
      {draft.source && (
        <section className="mt-6 rounded-xl border border-border p-4 text-sm">
          <div className="font-medium">Source record</div>
          <dl className="mt-2 grid grid-cols-2 gap-y-1 text-muted-foreground">
            <dt>Source</dt><dd className="text-foreground">{draft.source.name}</dd>
            <dt>External ID</dt><dd className="text-foreground">{draft.source.externalId}</dd>
            <dt>Normalizer</dt><dd className="text-foreground">{draft.source.normalizerVersion}</dd>
            <dt>Checksum</dt><dd className="truncate text-foreground">{draft.source.checksum}</dd>
            <dt>Licence</dt><dd className="text-foreground">{draft.source.licence}</dd>
            <dt>Retrieved</dt><dd className="text-foreground">{draft.source.retrievedAt.toLocaleString()}</dd>
          </dl>
        </section>
      )}

      {/* AI-assisted drafting — summary + tag SUGGESTIONS only. Never applied
          automatically; never touches factual fields. */}
      <section className="mt-6 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-medium">AI-assisted summary</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Summarizes the source text only. Review and paste into Summary
              above if useful — it is never auto-applied.
            </p>
          </div>
          <form action={aiDraftAction}>
            <input type="hidden" name="revisionId" value={draft.id} />
            <button
              type="submit"
              className="rounded-md border border-border px-3 py-1.5 text-sm hover:bg-secondary"
            >
              Suggest with AI
            </button>
          </form>
        </div>
        {ai && !aiSuggestion && (
          <p className="mt-3 text-sm text-muted-foreground">No suggestion produced.</p>
        )}
        {aiSuggestion && (
          <div className="mt-3 rounded-md bg-secondary/50 p-3 text-sm">
            <p>{aiSuggestion.summary}</p>
            {aiSuggestion.tags.length > 0 && (
              <p className="mt-2 text-muted-foreground">
                Tags: {aiSuggestion.tags.join(", ")}
              </p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {aiSuggestion.model} · {aiSuggestion.promptVersion} · marked{" "}
              <code>ai_assisted</code> — a human reviewer remains responsible for
              the published result.
            </p>
          </div>
        )}
      </section>

      {/* Editorial fields */}
      <form action={updateDraftAction} className="mt-6 space-y-5">
        <input type="hidden" name="revisionId" value={draft.id} />

        <Field label="Summary">
          <textarea
            name="summary"
            rows={3}
            defaultValue={String(b.summary ?? b.summaryDraft ?? "")}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
        </Field>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Difficulty">
            <select name="difficulty" defaultValue={String(b.difficulty ?? "")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— select —</option>
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>{formatDifficulty(d)}</option>
              ))}
            </select>
          </Field>
          <Field label="Trip length">
            <select name="tripLength" defaultValue={String(b.tripLength ?? "")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              <option value="">— select —</option>
              {TRIP_LENGTHS.map((t) => (
                <option key={t} value={t}>{formatTripLength(t)}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Field label="Budget low (USD)">
            <input type="number" name="budgetLow" min={0} defaultValue={budget.low ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
          <Field label="Budget high (USD)">
            <input type="number" name="budgetHigh" min={0} defaultValue={budget.high ?? ""} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
          </Field>
        </div>

        <Field label="Activities">
          <div className="flex flex-wrap gap-3">
            {ACTIVITIES.map((a) => (
              <label key={a} className="flex items-center gap-1.5 text-sm">
                <input type="checkbox" name="activities" value={a} defaultChecked={currentActivities.includes(a)} />
                {formatActivity(a)}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Best months">
          <div className="flex flex-wrap gap-2">
            {MONTHS.map((m) => (
              <label key={m} className="flex items-center gap-1 text-sm">
                <input type="checkbox" name="bestMonths" value={m} defaultChecked={currentMonths.includes(m)} />
                {formatMonthShort(m)}
              </label>
            ))}
          </div>
        </Field>

        <Field label="Label (optional)">
          <select name="label" defaultValue={String(b.label ?? "")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            {LABELS.map((l) => (
              <option key={l} value={l}>{l || "— none —"}</option>
            ))}
          </select>
        </Field>

        <fieldset className="rounded-lg border border-border p-4">
          <legend className="px-1 text-sm font-medium">Permit</legend>
          <div className="grid gap-3 sm:grid-cols-3">
            <select name="permitType" defaultValue={permit.requirementType ?? "unknown"} className="rounded-md border border-input bg-background px-3 py-2 text-sm">
              {PERMIT_TYPES.map((p) => (<option key={p} value={p}>{p}</option>))}
            </select>
            <input name="permitScope" defaultValue={permit.scope ?? ""} placeholder="Scope" className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-2" />
            <input name="permitUrl" type="url" defaultValue={permit.officialUrl ?? String(b.officialUrl ?? "")} placeholder="Official URL" className="rounded-md border border-input bg-background px-3 py-2 text-sm sm:col-span-3" />
          </div>
        </fieldset>

        <button type="submit" className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-secondary">
          Save draft
        </button>
      </form>

      {/* Publish — separate form so validation errors are clear */}
      <form action={publishAction} className="mt-6 border-t border-border pt-6">
        <input type="hidden" name="revisionId" value={draft.id} />
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={!draft.validation.ok}
            className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-foreground hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Publish
          </button>
          {!draft.validation.ok && (
            <span className="text-sm text-muted-foreground">
              Save the required fields above first.
            </span>
          )}
        </div>
        {!draft.validation.ok && (
          <ul className="mt-3 list-inside list-disc text-sm text-muted-foreground">
            {draft.validation.errors.slice(0, 6).map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ul>
        )}
      </form>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">{label}</span>
      {children}
    </label>
  );
}
