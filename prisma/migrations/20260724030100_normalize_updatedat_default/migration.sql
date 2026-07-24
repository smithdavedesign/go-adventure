-- The prior migration added updatedAt with a DB default so the NOT NULL column
-- could backfill existing rows. The Prisma schema declares no default (@updatedAt
-- is app-managed), so drop it to keep the DB and schema in sync (no drift).
ALTER TABLE "ContentRevision" ALTER COLUMN "updatedAt" DROP DEFAULT;
