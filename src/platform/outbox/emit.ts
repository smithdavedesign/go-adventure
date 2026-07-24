/**
 * Outbox emit. Writing the event in the SAME transaction as the data change is
 * the whole point of the pattern: the projection-rebuild intent is durable and
 * atomic with the change, so a crash after commit can't lose it (PRD: "no
 * distributed write is considered successful merely because an API call was
 * attempted").
 */
import type { Prisma } from "@/generated/prisma/client";

export type OutboxEventInput = {
  type: string; // e.g. "destination.published"
  entityType: string;
  entityId: string;
  payload: Prisma.InputJsonObject;
};

/** Emit within an interactive transaction (tx), alongside the data mutation. */
export async function emitOutboxEvent(
  tx: Prisma.TransactionClient,
  event: OutboxEventInput,
): Promise<void> {
  await tx.outboxEvent.create({
    data: {
      type: event.type,
      entityType: event.entityType,
      entityId: event.entityId,
      payload: event.payload,
    },
  });
}
