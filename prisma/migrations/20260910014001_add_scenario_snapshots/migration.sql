-- CreateTable
CREATE TABLE "ScenarioSnapshot" (
    "id" TEXT NOT NULL,
    "scenarioId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ScenarioSnapshot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ScenarioSnapshot_scenarioId_key" ON "ScenarioSnapshot"("scenarioId");

-- CreateIndex
CREATE INDEX "ScenarioSnapshot_updatedAt_idx" ON "ScenarioSnapshot"("updatedAt");
