export type SeverityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
export type FindingCategory =
  | 'Execution Gap'
  | 'SLA Breach'
  | 'Missing Evidence'
  | 'Negative Space'
  | 'Anomaly'
  | 'Premature Closure'
  | 'Invalid Transition';

export type ReviewStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE';
export type UserRole = 'Lead Examiner' | 'SOC Supervisor' | 'Auditor' | 'Read-Only Reviewer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organization: string;
}

export interface Entity {
  id: string;
  name: string;
  code: string;
  criticality: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  sector: string;
  activeCases: number;
  totalFindings: number;
  slaBreachRate: number;
  lastAssessedAt: string;
}

export interface ScoreContributors {
  severity: number;
  workflowImpact: number;
  missingEvidence: number;
  slaImpact: number;
  entityCriticality: number;
  statisticalAbnormality: number;
}

export interface SupervisoryFinding {
  id: string;
  entityId: string;
  entityName: string;
  caseId: string;
  caseNumber: string;
  title: string;
  category: FindingCategory;
  severity: SeverityLevel;
  priorityScore: number;
  priorityLevel: PriorityLevel;
  scoreExplanation: {
    baseScore: number;
    contributors: ScoreContributors;
    totalScore: number;
  };
  whatHappened: string;
  whyFlagged: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  supportingEvidence: {
    recordId: string;
    type: string;
    description: string;
    timestamp: string;
  }[];
  missingEvidence: {
    expectedType: string;
    description: string;
    impact: string;
  }[];
  evidenceStrength: 'WEAK' | 'MODERATE' | 'STRONG' | 'DEFINITIVE';
  confidence: number;
  recommendedAction: string;
  counterfactual: string;
  source: 'Deterministic Rule' | 'Negative Space' | 'Statistical Outlier' | 'ML Anomaly Signal';
  mlAnomalySignal?: {
    isAnomaly: boolean;
    anomalyScore: number;
    featureContributions: { feature: string; deviation: string }[];
  };
  reviewStatus: ReviewStatus;
  reviewDecision?: {
    decision: ReviewStatus;
    reviewerId: string;
    reviewerName: string;
    reviewedAt: string;
    notes: string;
    recommendedFollowUp?: string;
  };
  createdAt: string;
}

export interface NegativeSpaceRow {
  entityId: string;
  entityName: string;
  investigationStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  escalationStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  closureStatus: 'PRESENT' | 'MISSING' | 'ABNORMAL';
  associatedFindingIds: {
    investigation?: string[];
    escalation?: string[];
    closure?: string[];
  };
  severity: SeverityLevel;
  findingCount: number;
}

export interface KPISummary {
  totalEntities: number;
  totalAlerts: number;
  totalCases: number;
  totalInvestigations: number;
  totalFindings: number;
  highFindings: number;
  criticalFindings: number;
  slaBreachRate: number;
  reviewedFindingsCount: number;
  pendingReviewCount: number;
}

export interface ScenarioDefinition {
  id: string;
  name: string;
  badge: string;
  description: string;
  expectedOutcome: string;
  keyGaps: string[];
}

export interface WorkflowFunnel {
  step: string;
  sourceCount: number;
  targetCount: number;
  conversionRate: number;
  dropOffRate: number;
}

export interface OperationalTrendPoint {
  date: string;
  avgInvestigationDuration: number;
  slaBreachRate: number;
  findingCount: number;
  caseVolume: number;
}

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  action: string;
  timestamp: string;
  targetType: string;
  targetId: string;
  metadata: Record<string, any>;
}
