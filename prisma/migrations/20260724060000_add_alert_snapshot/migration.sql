-- CreateTable
CREATE TABLE "AlertSnapshot" (
    "id" UUID NOT NULL,
    "location" geography(Point, 4326),
    "provider" TEXT NOT NULL,
    "externalId" TEXT NOT NULL,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AlertSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "AlertSnapshot_expiresAt_idx" ON "AlertSnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX "AlertSnapshot_location_idx" ON "AlertSnapshot" USING GIST ("location");

