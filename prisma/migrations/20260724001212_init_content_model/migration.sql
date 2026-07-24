-- Enable PostGIS. Required before any geography/geometry column is created.
-- Kept in the migration (not assumed from the Docker image) so a fresh database
-- or a Supabase project provisions identically. See docs/adr/0003-postgis-spatial-model.md.
CREATE EXTENSION IF NOT EXISTS postgis;

-- CreateEnum
CREATE TYPE "Activity" AS ENUM ('hiking', 'backpacking');

-- CreateEnum
CREATE TYPE "Month" AS ENUM ('january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december');

-- CreateEnum
CREATE TYPE "Difficulty" AS ENUM ('easy', 'moderate', 'hard', 'expert');

-- CreateEnum
CREATE TYPE "TripLength" AS ENUM ('day', 'short_2_3d', 'medium_4_7d', 'long_7d_plus');

-- CreateEnum
CREATE TYPE "AdventureLabel" AS ENUM ('editors_pick', 'hidden_gem', 'trending', 'beginner_friendly', 'epic');

-- CreateEnum
CREATE TYPE "ContentStatus" AS ENUM ('draft', 'in_review', 'published', 'archived');

-- CreateEnum
CREATE TYPE "RightsStatus" AS ENUM ('verified', 'restricted', 'unknown', 'rejected');

-- CreateEnum
CREATE TYPE "ModerationStatus" AS ENUM ('pending', 'approved', 'rejected');

-- CreateTable
CREATE TABLE "Destination" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "location" geography(Point, 4326),
    "area" geometry(MultiPolygon, 4326),
    "activities" "Activity"[],
    "bestMonths" "Month"[],
    "difficulty" "Difficulty" NOT NULL,
    "tripLength" "TripLength" NOT NULL,
    "label" "AdventureLabel",
    "budgetCurrency" TEXT NOT NULL DEFAULT 'USD',
    "budgetLowUsd" INTEGER NOT NULL,
    "budgetHighUsd" INTEGER NOT NULL,
    "summary" TEXT,
    "tags" TEXT[],
    "score" DOUBLE PRECISION,
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "lastVerifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "heroAssetId" UUID,

    CONSTRAINT "Destination_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Trail" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "routeGeometry" geography(MultiLineString, 4326),
    "distanceMiles" DOUBLE PRECISION NOT NULL,
    "elevationGainFt" DOUBLE PRECISION NOT NULL,
    "difficulty" "Difficulty" NOT NULL,
    "durationHours" DOUBLE PRECISION NOT NULL,
    "costUSD" DOUBLE PRECISION,
    "tags" TEXT[],
    "status" "ContentStatus" NOT NULL DEFAULT 'draft',
    "lastVerifiedAt" TIMESTAMP(3),
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Trail_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DestinationTrail" (
    "destinationId" UUID NOT NULL,
    "trailId" UUID NOT NULL,
    "isRepresentative" BOOLEAN NOT NULL DEFAULT false,
    "editorialOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DestinationTrail_pkey" PRIMARY KEY ("destinationId","trailId")
);

-- CreateTable
CREATE TABLE "MediaAsset" (
    "id" UUID NOT NULL,
    "objectKey" TEXT NOT NULL,
    "originalUrl" TEXT,
    "altText" TEXT,
    "creatorCredit" TEXT,
    "licence" TEXT NOT NULL,
    "rightsStatus" "RightsStatus" NOT NULL DEFAULT 'unknown',
    "moderationStatus" "ModerationStatus" NOT NULL DEFAULT 'pending',
    "exifStrippedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "destinationId" UUID,
    "trailId" UUID,

    CONSTRAINT "MediaAsset_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Destination_slug_key" ON "Destination"("slug");

-- CreateIndex
CREATE INDEX "Destination_status_idx" ON "Destination"("status");

-- CreateIndex
CREATE INDEX "Destination_slug_idx" ON "Destination"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Trail_slug_key" ON "Trail"("slug");

-- CreateIndex
CREATE INDEX "Trail_status_idx" ON "Trail"("status");

-- CreateIndex
CREATE INDEX "Trail_slug_idx" ON "Trail"("slug");

-- CreateIndex
CREATE INDEX "DestinationTrail_trailId_idx" ON "DestinationTrail"("trailId");

-- AddForeignKey
ALTER TABLE "Destination" ADD CONSTRAINT "Destination_heroAssetId_fkey" FOREIGN KEY ("heroAssetId") REFERENCES "MediaAsset"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationTrail" ADD CONSTRAINT "DestinationTrail_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DestinationTrail" ADD CONSTRAINT "DestinationTrail_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Destination"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MediaAsset" ADD CONSTRAINT "MediaAsset_trailId_fkey" FOREIGN KEY ("trailId") REFERENCES "Trail"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Spatial (GiST) indexes on the geography columns. Hand-written because Prisma
-- cannot express a GiST index over an Unsupported(...) column via schema syntax
-- (ADR-0003). These back the map-bounds and proximity queries (M2 onward).
CREATE INDEX "Destination_location_idx" ON "Destination" USING GIST ("location");
CREATE INDEX "Trail_routeGeometry_idx" ON "Trail" USING GIST ("routeGeometry");
