/**
 * Outbox processor. Drains pending events and rebuilds the affected projections
 * (ISR pages, and later search indexes/caches). Idempotent: reprocessing an
 * event just revalidates the same paths again.
 *
 * `revalidate` is injected (the caller passes Next's `revalidatePath`) so the
 * processor has no framework coupling and stays unit-testable. Invoked inline
 * after a publish today; a scheduled drainer is the scaled version.
 */
import { prisma } from "@/shared/config/db";
import { captureError } from "@/platform/observability/report";

type RevalidateFn = (path: string) => void;

/** Which paths a given event type invalidates. */
function pathsForEvent(type: string, payload: unknown): string[] {
  const slug =
    payload && typeof payload === "object" && "slug" in payload
      ? String((payload as { slug: unknown }).slug)
      : null;

  switch (type) {
    case "destination.published":
    case "destination.unpublished":
      return ["/", "/explore", ...(slug ? [`/destinations/${slug}`] : [])];
    default:
      return ["/", "/explore"];
  }
}

export type ProcessResult = { processed: number; failed: number };

/** Process all pending outbox events. Returns counts. */
export async function processOutbox(
  revalidate: RevalidateFn,
): Promise<ProcessResult> {
  const pending = await prisma.outboxEvent.findMany({
    where: { processedAt: null },
    orderBy: { createdAt: "asc" },
    take: 100,
  });

  let processed = 0;
  let failed = 0;

  for (const event of pending) {
    try {
      for (const path of pathsForEvent(event.type, event.payload)) {
        revalidate(path);
      }
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: { processedAt: new Date(), attempts: { increment: 1 } },
      });
      processed++;
    } catch (err) {
      failed++;
      captureError(err, {
        area: "outbox",
        op: "process",
        meta: { eventId: event.id, type: event.type },
      });
      await prisma.outboxEvent.update({
        where: { id: event.id },
        data: {
          attempts: { increment: 1 },
          lastError: err instanceof Error ? err.message : String(err),
        },
      });
    }
  }

  return { processed, failed };
}

export { pathsForEvent };
