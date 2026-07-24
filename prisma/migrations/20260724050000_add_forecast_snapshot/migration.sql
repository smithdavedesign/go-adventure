-- CreateTable
CREATE TABLE "ForecastSnapshot" (
    "id" UUID NOT NULL,
    "location" geography(Point, 4326),
    "provider" TEXT NOT NULL,
    "model" TEXT,
    "observedAt" TIMESTAMP(3) NOT NULL,
    "validFrom" TIMESTAMP(3) NOT NULL,
    "validTo" TIMESTAMP(3) NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ForecastSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ForecastSnapshot_expiresAt_idx" ON "ForecastSnapshot"("expiresAt");

-- CreateIndex
CREATE INDEX "ForecastSnapshot_location_idx" ON "ForecastSnapshot" USING GIST ("location");

