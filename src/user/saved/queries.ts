/**
 * Saved destinations (User domain, server-only). A qualified save is the PRD's
 * primary success signal. User code references published content IDs but never
 * mutates content.
 */
import { prisma } from "@/shared/config/db";
import { getPublishedDestinationCardsByIds } from "@/content/destinations/queries";
import type { DestinationCard } from "@/shared/types/content";

export async function isSaved(
  userId: string,
  destinationId: string,
): Promise<boolean> {
  const row = await prisma.savedDestination.findUnique({
    where: { userId_destinationId: { userId, destinationId } },
    select: { id: true },
  });
  return row != null;
}

/** Save (idempotent). Only saves a *published* destination. */
export async function saveDestination(
  userId: string,
  destinationId: string,
): Promise<void> {
  const published = await prisma.destination.findFirst({
    where: { id: destinationId, status: "published" },
    select: { id: true },
  });
  if (!published) return; // never save an unpublished/nonexistent destination
  await prisma.savedDestination.upsert({
    where: { userId_destinationId: { userId, destinationId } },
    update: {},
    create: { userId, destinationId },
  });
}

export async function unsaveDestination(
  userId: string,
  destinationId: string,
): Promise<void> {
  await prisma.savedDestination.deleteMany({
    where: { userId, destinationId },
  });
}

/** The user's saved destinations, most-recently-saved first. */
export async function listSavedDestinations(
  userId: string,
): Promise<DestinationCard[]> {
  const saved = await prisma.savedDestination.findMany({
    where: { userId },
    orderBy: { savedAt: "desc" },
    select: { destinationId: true },
  });
  const ids = saved.map((s) => s.destinationId);
  const cards = await getPublishedDestinationCardsByIds(ids);
  // Preserve save order (getPublishedDestinationCardsByIds doesn't guarantee it).
  const order = new Map(ids.map((id, i) => [id, i]));
  return cards.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
}
