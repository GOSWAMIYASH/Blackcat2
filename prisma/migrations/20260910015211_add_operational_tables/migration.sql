-- CreateEnum
CREATE TYPE "OperationalSeverity" AS ENUM ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL');

-- CreateEnum
CREATE TYPE "OperationalCaseStatus" AS ENUM ('OPEN', 'IN_INVESTIGATION', 'ESCALATED', 'CLOSED', 'REOPENED');

-- CreateEnum
CREATE TYPE "OperationalInvestigationStatus" AS ENUM ('IN_PROGRESS', 'COMPLETED', 'SUSPENDED');

-- CreateTable
CREATE TABLE "OperationalEntity" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "criticality" "OperationalSeverity" NOT NULL,
    "sector" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalEntity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalAlert" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "OperationalSeverity" NOT NULL,
    "status" TEXT NOT NULL,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "OperationalAlert_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalCase" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "alertId" TEXT NOT NULL,
    "caseNumber" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "severity" "OperationalSeverity" NOT NULL,
    "status" "OperationalCaseStatus" NOT NULL,
    "assignedAnalyst" TEXT,
    "payload" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalCase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalInvestigation" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "status" "OperationalInvestigationStatus" NOT NULL,
    "analystId" TEXT,
    "payload" JSONB,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "OperationalInvestigation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "OperationalEvidence" (
    "id" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "evidenceType" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,
    "payload" JSONB,
    "collectedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OperationalEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OperationalEntity_organizationId_criticality_idx" ON "OperationalEntity"("organizationId", "criticality");

-- CreateIndex
CREATE INDEX "OperationalAlert_organizationId_severity_createdAt_idx" ON "OperationalAlert"("organizationId", "severity", "createdAt");

-- CreateIndex
CREATE INDEX "OperationalAlert_entityId_idx" ON "OperationalAlert"("entityId");

-- CreateIndex
CREATE INDEX "OperationalCase_organizationId_status_severity_idx" ON "OperationalCase"("organizationId", "status", "severity");

-- CreateIndex
CREATE INDEX "OperationalCase_assignedAnalyst_idx" ON "OperationalCase"("assignedAnalyst");

-- CreateIndex
CREATE UNIQUE INDEX "OperationalCase_organizationId_caseNumber_key" ON "OperationalCase"("organizationId", "caseNumber");

-- CreateIndex
CREATE INDEX "OperationalInvestigation_organizationId_status_idx" ON "OperationalInvestigation"("organizationId", "status");

-- CreateIndex
CREATE INDEX "OperationalInvestigation_caseId_idx" ON "OperationalInvestigation"("caseId");

-- CreateIndex
CREATE INDEX "OperationalEvidence_organizationId_verified_idx" ON "OperationalEvidence"("organizationId", "verified");

-- CreateIndex
CREATE INDEX "OperationalEvidence_caseId_idx" ON "OperationalEvidence"("caseId");

-- AddForeignKey
ALTER TABLE "OperationalEntity" ADD CONSTRAINT "OperationalEntity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalAlert" ADD CONSTRAINT "OperationalAlert_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "OperationalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCase" ADD CONSTRAINT "OperationalCase_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCase" ADD CONSTRAINT "OperationalCase_entityId_fkey" FOREIGN KEY ("entityId") REFERENCES "OperationalEntity"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalCase" ADD CONSTRAINT "OperationalCase_alertId_fkey" FOREIGN KEY ("alertId") REFERENCES "OperationalAlert"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalInvestigation" ADD CONSTRAINT "OperationalInvestigation_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "OperationalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "OperationalEvidence" ADD CONSTRAINT "OperationalEvidence_caseId_fkey" FOREIGN KEY ("caseId") REFERENCES "OperationalCase"("id") ON DELETE CASCADE ON UPDATE CASCADE;
