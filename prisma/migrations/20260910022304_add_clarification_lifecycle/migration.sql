-- CreateEnum
CREATE TYPE "ClarificationStatus" AS ENUM ('OPEN', 'RESPONDED', 'RESOLVED');

-- CreateTable
CREATE TABLE "Clarification" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "findingId" TEXT NOT NULL,
    "caseId" TEXT NOT NULL,
    "submittedById" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "status" "ClarificationStatus" NOT NULL DEFAULT 'OPEN',
    "response" TEXT,
    "respondedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Clarification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Clarification_organizationId_status_createdAt_idx" ON "Clarification"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Clarification_findingId_idx" ON "Clarification"("findingId");

-- CreateIndex
CREATE INDEX "Clarification_caseId_idx" ON "Clarification"("caseId");

-- AddForeignKey
ALTER TABLE "Clarification" ADD CONSTRAINT "Clarification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
