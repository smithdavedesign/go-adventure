-- CreateEnum
CREATE TYPE "FactConfidence" AS ENUM ('confirmed', 'editorial', 'uncertain');

-- CreateEnum
CREATE TYPE "RevisionOrigin" AS ENUM ('official', 'editorial', 'community', 'ai_assisted');

-- CreateEnum
CREATE TYPE "ReviewStatus" AS ENUM ('draft', 'in_review', 'approved', 'rejected');

-- CreateEnum
CREATE TYPE "PermitRequirementType" AS ENUM ('none', 'reservation', 'quota', 'timed_entry', 'unknown');

-- AlterTable
ALTER TABLE "MediaAsset" ADD COLUMN     "sourceRecordId" UUID;

-- CreateTable
CREATE TABLE "Source" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "baseUrl" TEXT NOT NULL,
    "licence" TEXT NOT NULL,
    "attributionText" TEXT NOT NULL,
    "termsUrl" TEXT,
    "commercialUse" TEXT NOT NULL,
    "refreshPolicy" TEXT NOT NULL,
    "owner" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Source_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SourceRecord" (
    "id" UUID NOT NULL,
    "sourceId" UUID NOT NULL,
    "externalId" TEXT NOT NULL,
    "canonicalUrl" TEXT,
    "retrievedAt" TIMESTAMP(3) NOT NULL,
    "rawObjectKey" TEXT NOT NULL,
    "checksum" TEXT NOT NULL,
    "normalizerVersion" TEXT NOT NULL,
    "licenceSnapshot" TEXT NOT NULL,
    "attributionSnapshot" TEXT NOT NULL,
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SourceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FactAssertion" (
    "id" UUID NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "field" TEXT NOT NULL,
    "value" JSONB NOT NULL,
    "confidence" "FactConfidence" NOT NULL DEFAULT 'editorial',
    "sourceRecordId" UUID,
    "contentRevisionId" UUID,
    "reviewedBy" UUID,
    "verifiedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FactAssertion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PermitRequirement" (
    "id" UUID NOT NULL,
    "subjectType" TEXT NOT NULL,
    "subjectId" UUID NOT NULL,
    "requirementType" "PermitRequirementType" NOT NULL,
    "scope" TEXT NOT NULL,
    "officialUrl" TEXT NOT NULL,
    "sourceRecordId" UUID,
    "lastVerifiedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PermitRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ContentRevision" (
    "id" UUID NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "body" JSONB NOT NULL,
    "origin" "RevisionOrigin" NOT NULL DEFAULT 'editorial',
    "promptVersion" TEXT,
    "sourcePacketHash" TEXT,
    "reviewStatus" "ReviewStatus" NOT NULL DEFAULT 'draft',
    "authorId" UUID,
    "reviewedBy" UUID,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publishedAt" TIMESTAMP(3),

    CONSTRAINT "ContentRevision_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "type" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" UUID NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMP(3),
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Source_name_key" ON "Source"("name");

-- CreateIndex
CREATE INDEX "Source_enabled_idx" ON "Source"("enabled");

-- CreateIndex
CREATE INDEX "SourceRecord_sourceId_idx" ON "SourceRecord"("sourceId");

-- CreateIndex
CREATE UNIQUE INDEX "SourceRecord_sourceId_externalId_normalizerVersion_key" ON "SourceRecord"("sourceId", "externalId", "normalizerVersion");

-- CreateIndex
CREATE INDEX "FactAssertion_subjectType_subjectId_idx" ON "FactAssertion"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "FactAssertion_expiresAt_idx" ON "FactAssertion"("expiresAt");

-- CreateIndex
CREATE INDEX "PermitRequirement_subjectType_subjectId_idx" ON "PermitRequirement"("subjectType", "subjectId");

-- CreateIndex
CREATE INDEX "ContentRevision_entityType_entityId_idx" ON "ContentRevision"("entityType", "entityId");

-- CreateIndex
CREATE INDEX "ContentRevision_reviewStatus_idx" ON "ContentRevision"("reviewStatus");

-- CreateIndex
CREATE INDEX "OutboxEvent_processedAt_idx" ON "OutboxEvent"("processedAt");

-- CreateIndex
CREATE INDEX "MediaAsset_sourceRecordId_idx" ON "MediaAsset"("sourceRecordId");

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SourceRecord" ADD CONSTRAINT "SourceRecord_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "Source"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactAssertion" ADD CONSTRAINT "FactAssertion_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FactAssertion" ADD CONSTRAINT "FactAssertion_contentRevisionId_fkey" FOREIGN KEY ("contentRevisionId") REFERENCES "ContentRevision"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PermitRequirement" ADD CONSTRAINT "PermitRequirement_sourceRecordId_fkey" FOREIGN KEY ("sourceRecordId") REFERENCES "SourceRecord"("id") ON DELETE SET NULL ON UPDATE CASCADE;
