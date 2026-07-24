-- CreateEnum
CREATE TYPE "IngestionStatus" AS ENUM ('running', 'succeeded', 'failed');

-- AlterTable
-- updatedAt gets a DB default so the NOT NULL column backfills cleanly on the
-- existing seed rows; Prisma still manages the value at the app layer (@updatedAt).
ALTER TABLE "ContentRevision" ADD COLUMN     "draftKey" TEXT,
ADD COLUMN     "sourceRecordId" UUID,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "entityId" DROP NOT NULL;

-- CreateTable
CREATE TABLE "IngestionRun" (
    "id" UUID NOT NULL,
    "sourceName" TEXT NOT NULL,
    "normalizerVersion" TEXT NOT NULL,
    "status" "IngestionStatus" NOT NULL DEFAULT 'running',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMP(3),
    "recordsProcessed" INTEGER NOT NULL DEFAULT 0,
    "recordsFailed" INTEGER NOT NULL DEFAULT 0,
    "error" TEXT,

    CONSTRAINT "IngestionRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IngestionDeadLetter" (
    "id" UUID NOT NULL,
    "runId" UUID NOT NULL,
    "sourceName" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "stage" TEXT NOT NULL,
    "error" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "IngestionDeadLetter_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "IngestionRun_sourceName_startedAt_idx" ON "IngestionRun"("sourceName", "startedAt");

-- CreateIndex
CREATE INDEX "IngestionDeadLetter_runId_idx" ON "IngestionDeadLetter"("runId");

-- CreateIndex
CREATE UNIQUE INDEX "ContentRevision_draftKey_key" ON "ContentRevision"("draftKey");

-- CreateIndex
CREATE INDEX "ContentRevision_sourceRecordId_idx" ON "ContentRevision"("sourceRecordId");

-- AddForeignKey
ALTER TABLE "ContentRevision" ADD CONSTRAINT "ContentRevision_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "IngestionDeadLetter" ADD CONSTRAINT "IngestionDeadLetter_runId_fkey" FOREIGN KEY ("runId") REFERENCES "IngestionRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

