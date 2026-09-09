import { PriorityLevel, ScoreContributors, SeverityLevel } from '../types';

export interface CalculatedPriority {
  priorityScore: number;
  priorityLevel: PriorityLevel;
  contributors: ScoreContributors;
}

export function calculatePriorityScore(params: {
  severity: SeverityLevel;
  hasWorkflowGap: boolean;
  missingEvidenceCount: number;
  slaBreached: boolean;
  entityCriticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  isStatisticalOutlier?: boolean;
}): CalculatedPriority {
  let severityScore = 0;
  if (params.severity === 'CRITICAL') severityScore = 25;
  else if (params.severity === 'HIGH') severityScore = 18;
  else if (params.severity === 'MEDIUM') severityScore = 10;
  else severityScore = 5;

  let workflowImpactScore = 0;
  if (params.hasWorkflowGap) {
    workflowImpactScore = params.severity === 'CRITICAL' ? 20 : 15;
  }

  let missingEvidenceScore = 0;
  if (params.missingEvidenceCount > 0) {
    missingEvidenceScore = Math.min(15, params.missingEvidenceCount * 7);
  }

  let slaImpactScore = 0;
  if (params.slaBreached) {
    slaImpactScore = 15;
  }

  let entityCriticalityScore = 0;
  if (params.entityCriticality === 'CRITICAL') entityCriticalityScore = 15;
  else if (params.entityCriticality === 'HIGH') entityCriticalityScore = 12;
  else if (params.entityCriticality === 'MEDIUM') entityCriticalityScore = 8;
  else entityCriticalityScore = 4;

  let statisticalAbnormalityScore = 0;
  if (params.isStatisticalOutlier) {
    statisticalAbnormalityScore = 10;
  }

  const rawTotal =
    severityScore +
    workflowImpactScore +
    missingEvidenceScore +
    slaImpactScore +
    entityCriticalityScore +
    statisticalAbnormalityScore;

  const totalScore = Math.min(100, Math.max(0, rawTotal));

  let priorityLevel: PriorityLevel = 'LOW';
  if (totalScore >= 75) priorityLevel = 'CRITICAL';
  else if (totalScore >= 55) priorityLevel = 'HIGH';
  else if (totalScore >= 35) priorityLevel = 'MEDIUM';
  else priorityLevel = 'LOW';

  return {
    priorityScore: totalScore,
    priorityLevel,
    contributors: {
      severity: severityScore,
      workflowImpact: workflowImpactScore,
      missingEvidence: missingEvidenceScore,
      slaImpact: slaImpactScore,
      entityCriticality: entityCriticalityScore,
      statisticalAbnormality: statisticalAbnormalityScore
    }
  };
}
