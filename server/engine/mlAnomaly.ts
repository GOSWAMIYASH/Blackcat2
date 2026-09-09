import { Case, Investigation, EvidenceRecord } from '../types';

export interface MLAnomalyResult {
  isAnomaly: boolean;
  anomalyScore: number; // 0.0 - 1.0
  featureContributions: { feature: string; deviation: string }[];
}

export function detectMLAnomaly(
  c: Case,
  investigation?: Investigation,
  evidences: EvidenceRecord[] = [],
  populationStats?: {
    meanDuration: number;
    stdDuration: number;
    meanEvidenceCount: number;
  }
): MLAnomalyResult {
  const invDuration = investigation?.durationMinutes || 0;
  const caseDuration = c.slaActualMinutes || (c.closedAt ? Math.round((new Date(c.closedAt).getTime() - new Date(c.createdAt).getTime()) / 60000) : 0);
  const evidenceCount = evidences.length;

  const meanDur = populationStats?.meanDuration || 45;
  const stdDur = populationStats?.stdDuration || 25;
  const meanEv = populationStats?.meanEvidenceCount || 2.5;

  const durationZ = stdDur > 0 ? (invDuration - meanDur) / stdDur : 0;
  const evidenceDeficit = Math.max(0, meanEv - evidenceCount);

  const featureContributions: { feature: string; deviation: string }[] = [];

  // Abnormally short duration for high severity
  if ((c.severity === 'CRITICAL' || c.severity === 'HIGH') && invDuration < 10 && invDuration > 0) {
    featureContributions.push({
      feature: 'Premature Investigation Speed',
      deviation: `${invDuration}m vs mean expected ${meanDur}m (-${Math.abs(Math.round(durationZ * 10)) / 10} std)`
    });
  }

  // Abnormally long duration (potential stagnation)
  if (durationZ > 2.5) {
    featureContributions.push({
      feature: 'Investigation Stagnation Outlier',
      deviation: `${invDuration}m (+${(Math.round(durationZ * 10) / 10)} std deviation above norm)`
    });
  }

  // Zero evidence for critical/high cases
  if ((c.severity === 'CRITICAL' || c.severity === 'HIGH') && evidenceCount === 0) {
    featureContributions.push({
      feature: 'Digital Artifact Absence Deficit',
      deviation: `0 attached evidence items vs baseline average ${meanEv}`
    });
  }

  // Calculate composite isolation score (0 - 1)
  let rawScore = 0;
  if (Math.abs(durationZ) > 2.0) rawScore += 0.45;
  else if (Math.abs(durationZ) > 1.2) rawScore += 0.25;

  if (evidenceDeficit >= 2) rawScore += 0.35;
  else if (evidenceDeficit >= 1) rawScore += 0.15;

  if (c.severity === 'CRITICAL' && !investigation) rawScore += 0.4;

  const anomalyScore = Math.min(0.99, Math.max(0.05, Math.round(rawScore * 100) / 100));
  const isAnomaly = anomalyScore >= 0.55 || featureContributions.length > 0;

  return {
    isAnomaly,
    anomalyScore,
    featureContributions
  };
}
