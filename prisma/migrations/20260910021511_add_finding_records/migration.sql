-- CreateTable
CREATE TABLE "FindingRecord" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "severity" "OperationalSeverity" NOT NULL,
    "reviewStatus" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "reviewDecision" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FindingRecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FindingRecord_organizationId_reviewStatus_idx" ON "FindingRecord"("organizationId", "reviewStatus");

-- CreateIndex
CREATE INDEX "FindingRecord_caseId_idx" ON "FindingRecord"("caseId");

-- CreateIndex
CREATE INDEX "FindingRecord_entityId_severity_idx" ON "FindingRecord"("entityId", "severity");
