"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/shared/config/db";
import { auth, signIn, signOut } from "@/user/auth/auth";
import {
  publishDestinationDraft,
  unpublishDestination,
} from "@/platform/publishing/publish";
import { processOutbox } from "@/platform/outbox/processor";
import { draftWithAi } from "@/platform/ai/draft";
import {
  ACTIVITIES,
  MONTHS,
  type Activity,
  type Month,
} from "@/shared/types/content";

/** Start Google OAuth and return to /admin. The layout re-checks `isAdmin`, so
 *  a signed-in non-admin lands back on the sign-in page with the explanation. */
export async function adminSignInAction() {
  await signIn("google", { redirectTo: "/admin" });
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

/** Guard for admin mutations invoked outside the protected layout's render. */
async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.isAdmin) redirect("/admin/login");
}

/** Merge editor field edits into a draft revision's JSON body. */
export async function updateDraftAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("revisionId"));
  const revision = await prisma.contentRevision.findUnique({ where: { id } });
  if (!revision) redirect("/admin/review");

  const body = (revision.body ?? {}) as Record<string, unknown>;

  const num = (k: string) => {
    const v = formData.get(k);
    const n = v != null && v !== "" ? Number(v) : NaN;
    return Number.isFinite(n) ? n : undefined;
  };
  const str = (k: string) => {
    const v = formData.get(k);
    return v != null && v !== "" ? String(v) : undefined;
  };

  const activities = (formData.getAll("activities") as string[]).filter(
    (a): a is Activity => (ACTIVITIES as readonly string[]).includes(a),
  );
  const bestMonths = (formData.getAll("bestMonths") as string[]).filter(
    (m): m is Month => (MONTHS as readonly string[]).includes(m),
  );

  const low = num("budgetLow");
  const high = num("budgetHigh");

  const next: Record<string, unknown> = {
    ...body,
    difficulty: str("difficulty") ?? body.difficulty,
    tripLength: str("tripLength") ?? body.tripLength,
    label: str("label") ?? null,
    summary: str("summary") ?? body.summary ?? body.summaryDraft ?? null,
    activities: activities.length ? activities : body.activities,
    bestMonths,
    budget: {
      currency: "USD",
      low: low ?? 0,
      high: high ?? 0,
    },
    permit: {
      requirementType: str("permitType") ?? "unknown",
      scope: str("permitScope") ?? "Confirm with the land manager",
      officialUrl: str("permitUrl") ?? String(body.officialUrl ?? ""),
    },
  };

  await prisma.contentRevision.update({
    where: { id },
    data: { body: next as never },
  });
  redirect(`/admin/review/${id}?saved=1`);
}

export async function publishAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("revisionId"));
  const result = await publishDestinationDraft(id);
  if (!result.ok) {
    const msg = encodeURIComponent(result.errors.join(" • "));
    redirect(`/admin/review/${id}?error=${msg}`);
  }
  // Drain the outbox we just wrote → rebuild the affected pages.
  await processOutbox(revalidatePath);
  redirect(`/admin/review/${id}?published=1`);
}

export async function unpublishAction(formData: FormData) {
  await requireAdmin();
  const destinationId = String(formData.get("destinationId"));
  await unpublishDestination(destinationId);
  await processOutbox(revalidatePath);
  redirect("/admin/destinations");
}

/** Generate an AI-assisted summary suggestion for a draft (never auto-applied). */
export async function aiDraftAction(formData: FormData) {
  await requireAdmin();
  const id = String(formData.get("revisionId"));
  const result = await draftWithAi(id);
  if (!result.ok) {
    redirect(`/admin/review/${id}?error=${encodeURIComponent("AI: " + result.error)}`);
  }
  redirect(`/admin/review/${id}?ai=1`);
}
