import { db } from '../db';

export interface AssessmentDossier {
  metadata: {
    reportId: string;
    generatedAt: string;
    generatedBy: string;
    organization: string;
    platform: string;
    regulatoryScope: string;
    disclaimer: string;
  };
  executiveSummary: {
    totalEntitiesAssessed: number;
    totalCasesReviewed: number;
    totalSupervisoryFindings: number;
    criticalFindingsCount: number;
    highFindingsCount: number;
    slaBreachRate: number;
    overallSupervisoryPosture: string;
    keyRiskGaps: string[];
  };
  entityBreakdown: {
    entityId: string;
    name: string;
    criticality: string;
    activeCases: number;
    findingsCount: number;
    slaBreachRate: number;
    negativeSpaceSummary: {
      investigation: string;
      escalation: string;
      closure: string;
    };
  }[];
  findingsDossier: {
    id: string;
    entityName: string;
    caseNumber: string;
    title: string;
    category: string;
    severity: string;
    priorityScore: number;
    priorityLevel: string;
    whatHappened: string;
    whyFlagged: string;
    counterfactual: string;
    evidenceStrength: string;
    missingEvidence: string[];
    reviewStatus: string;
    reviewDecisionNotes?: string;
  }[];
  workflowAndNegativeSpaceSummary: {
    conversions: { step: string; conversionRate: number }[];
    negativeSpaceRows: any[];
  };
  examinerDecisionsLog: {
    findingId: string;
    decision: string;
    reviewerName: string;
    reviewedAt: string;
    notes: string;
  }[];
  auditTrailExcerpt: {
    timestamp: string;
    actor: string;
    action: string;
    target: string;
  }[];
  supervisoryRecommendations: string[];
}

export function generateAssessmentDossier(generatedBy: string = 'Dr. Arunima Sen (Lead Examiner)'): AssessmentDossier {
  const kpi = db.getKPISummary();
  const negativeSpace = db.getNegativeSpaceMatrix();
  const stats = db.getStatistics();
  const findings = db.findings;

  const entityBreakdown = db.entities.map(e => {
    const nsRow = negativeSpace.find(n => n.entityId === e.id);
    return {
      entityId: e.id,
      name: e.name,
      criticality: e.criticality,
      activeCases: e.activeCases,
      findingsCount: e.totalFindings,
      slaBreachRate: e.slaBreachRate,
      negativeSpaceSummary: {
        investigation: nsRow?.investigationStatus || 'PRESENT',
        escalation: nsRow?.escalationStatus || 'PRESENT',
        closure: nsRow?.closureStatus || 'PRESENT'
      }
    };
  });

  const findingsDossier = findings.map(f => ({
    id: f.id,
    entityName: f.entityName,
    caseNumber: f.caseNumber,
    title: f.title,
    category: f.category,
    severity: f.severity,
    priorityScore: f.priorityScore,
    priorityLevel: f.priorityLevel,
    whatHappened: f.whatHappened,
    whyFlagged: f.whyFlagged,
    counterfactual: f.counterfactual,
    evidenceStrength: f.evidenceStrength,
    missingEvidence: f.missingEvidence.map(m => `${m.expectedType}: ${m.description}`),
    reviewStatus: f.reviewStatus,
    reviewDecisionNotes: f.reviewDecision?.notes
  }));

  const reviewedFindings = findings.filter(f => f.reviewDecision);
  const examinerDecisionsLog = reviewedFindings.map(f => ({
    findingId: f.id,
    decision: f.reviewDecision!.decision,
    reviewerName: f.reviewDecision!.reviewerName,
    reviewedAt: f.reviewDecision!.reviewedAt,
    notes: f.reviewDecision!.notes
  }));

  const auditTrailExcerpt = db.auditEvents.slice(0, 15).map(a => ({
    timestamp: a.timestamp,
    actor: `${a.actorName} (${a.actorRole})`,
    action: a.action,
    target: `${a.targetType}:${a.targetId}`
  }));

  let posture = 'Acceptable Supervisory Baseline';
  if (kpi.criticalFindings > 0 || kpi.slaBreachRate > 30) {
    posture = 'Elevated Supervisory Scrutiny Required';
  } else if (kpi.highFindings > 0) {
    posture = 'Moderate Operational Gaps Observed';
  }

  const keyGaps: string[] = [];
  if (findings.some(f => f.category === 'Execution Gap')) {
    keyGaps.push('Tier 1 to Tier 2 escalation bypass observed on critical severity assets.');
  }
  if (kpi.slaBreachRate > 20) {
    keyGaps.push(`Operational SLA breach rate elevated at ${kpi.slaBreachRate}%. Extended attacker dwell risk.`);
  }
  if (findings.some(f => f.category === 'Missing Evidence')) {
    keyGaps.push('Forensic digital evidence deficit: investigation conclusions closed without verified PCAP/artifacts.');
  }
  if (findings.some(f => f.category === 'Premature Closure')) {
    keyGaps.push('Abnormally rapid closures (<5 mins) without verified containment validation.');
  }

  return {
    metadata: {
      reportId: `DOSSIER-${Date.now().toString().slice(-6)}`,
      generatedAt: new Date().toISOString(),
      generatedBy,
      organization: 'National Cyber Coordination & Supervisory Review Group',
      platform: 'SAT-SA — Supervisory Analytics Tool for SOC Assessment (SIH26157)',
      regulatoryScope: 'Periodic SOC Operational Audit & Workflow Evidence Verification',
      disclaimer:
        'IMPORTANT: SAT-SA does not declare automatic compliance or non-compliance. This dossier contains potential supervisory findings, reconstructed workflow gaps, and negative-space deficits to guide human examiner evidence-based review.'
    },
    executiveSummary: {
      totalEntitiesAssessed: kpi.totalEntities,
      totalCasesReviewed: kpi.totalCases,
      totalSupervisoryFindings: kpi.totalFindings,
      criticalFindingsCount: kpi.criticalFindings,
      highFindingsCount: kpi.highFindings,
      slaBreachRate: kpi.slaBreachRate,
      overallSupervisoryPosture: posture,
      keyRiskGaps: keyGaps.length > 0 ? keyGaps : ['No acute execution gaps observed in evaluated window.']
    },
    entityBreakdown,
    findingsDossier,
    workflowAndNegativeSpaceSummary: {
      conversions: stats.conversionFunnel.map(cf => ({ step: cf.step, conversionRate: cf.conversionRate })),
      negativeSpaceRows: negativeSpace
    },
    examinerDecisionsLog,
    auditTrailExcerpt,
    supervisoryRecommendations: [
      'Enforce mandatory digital evidence attachment in SIEM/SOAR prior to ticket closure authorization.',
      'Implement automated supervisor escalation triggers when high/critical cases exceed 45 minutes.',
      'Mandate secondary supervisor sign-off on false-positive dismissals for Tier-1 critical assets.',
      'Schedule quarterly workflow reconstruction assessments utilizing SAT-SA negative-space analytics.'
    ]
  };
}
