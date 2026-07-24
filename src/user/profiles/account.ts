/**
 * Account data governance (User domain). The PRD requires account deletion and
 * data export before user accounts launch. Export deliberately excludes secrets
 * (OAuth tokens are never returned); deletion cascades to sessions, accounts,
 * and saved destinations via the schema's onDelete: Cascade.
 */
import { prisma } from "@/shared/config/db";

export type UserDataExport = {
  exportedAt: string;
  profile: {
    id: string;
    email: string | null;
    name: string | null;
    locale: string;
    createdAt: string;
  };
  connectedProviders: string[]; // provider names only — never tokens
  savedDestinations: { slug: string; name: string; savedAt: string }[];
};

/** Assemble a user's exportable data (no secrets). `nowIso` injectable for tests. */
export async function exportUserData(
  userId: string,
  nowIso: string,
): Promise<UserDataExport | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      accounts: { select: { provider: true } },
      saved: {
        orderBy: { savedAt: "desc" },
        select: { destinationId: true, savedAt: true },
      },
    },
  });
  if (!user) return null;

  const destIds = user.saved.map((s) => s.destinationId);
  const destinations = await prisma.destination.findMany({
    where: { id: { in: destIds } },
    select: { id: true, slug: true, name: true },
  });
  const byId = new Map(destinations.map((d) => [d.id, d]));

  return {
    exportedAt: nowIso,
    profile: {
      id: user.id,
      email: user.email,
      name: user.name,
      locale: user.locale,
      createdAt: user.createdAt.toISOString(),
    },
    connectedProviders: user.accounts.map((a) => a.provider),
    savedDestinations: user.saved
      .map((s) => {
        const d = byId.get(s.destinationId);
        return d
          ? { slug: d.slug, name: d.name, savedAt: s.savedAt.toISOString() }
          : null;
      })
      .filter((x): x is NonNullable<typeof x> => x != null),
  };
}

/** Permanently delete a user and everything hanging off them (cascade). */
export async function deleteUserAccount(userId: string): Promise<void> {
  await prisma.user.delete({ where: { id: userId } });
}
