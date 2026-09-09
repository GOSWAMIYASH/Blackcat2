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
  passwordHash: string;
  organization: string;
  createdAt: string;
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

export interface Alert {
  id: string;
  entityId: string;
  assetId: string;
  title: string;
  severity: SeverityLevel;
  source: string;
  rawTimestamp: string;
  normalizedTimestamp: string;
  category: string;
  description: string;
  status: 'NEW' | 'TRIAGED' | 'ESCALATED' | 'DISMISSED';
}

export interface Case {
  id: string;
  caseNumber: string;
  alertId: string;
  entityId: string;
  title: string;
  severity: SeverityLevel;
  status: 'OPEN' | 'IN_INVESTIGATION' | 'ESCALATED' | 'CLOSED' | 'REOPENED';
  assignedAnalyst: string;
  createdAt: string;
  acknowledgedAt?: string;
  closedAt?: string;
  slaTargetMinutes: number;
  slaActualMinutes?: number;
  slaBreached: boolean;
  closureReason?: string;
}

export interface Investigation {
  id: string;
  caseId: string;
  analystId: string;
  startedAt: string;
  completedAt?: string;
  durationMinutes?: number;
  hypothesis: string;
  evidenceIds: string[];
  findingsNotes: string;
  status: 'IN_PROGRESS' | 'COMPLETED' | 'SUSPENDED';
}

export interface Escalation {
  id: string;
  caseId: string;
  escalatedBy: string;
  escalatedTo: string;
  escalatedAt: string;
  delayMinutesFromAlert: number;
  escalationReason: string;
  priority: SeverityLevel;
  tier: 'Tier 1' | 'Tier 2' | 'Tier 3' | 'CISO / Incident Commander';
}

export interface EvidenceRecord {
  id: string;
  caseId: string;
  type: 'LOG_ARCHIVE' | 'PCAP' | 'MEMORY_DUMP' | 'HOST_ARTIFACT' | 'COMMUNICATION_RECORD' | 'CONFIGURATION';
  name: string;
  hash: string;
  collectedAt: string;
  collectedBy: string;
  sourceSystem: string;
  verified: boolean;
}

export interface Closure {
  id: string;
  caseId: string;
  closedBy: string;
  closedAt: string;
  classification: 'TRUE_POSITIVE' | 'FALSE_POSITIVE' | 'BENIGN_TRUE_POSITIVE' | 'INCONCLUSIVE';
  justification: string;
  approvedBySupervisor: boolean;
}

export interface WorkflowReconstruction {
  caseId: string;
  entityId: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  missingStages: string[];
  timing: {
    alertToCaseMinutes: number;
    caseToInvestigationMinutes: number;
    investigationDurationMinutes: number;
    escalationDelayMinutes?: number;
    totalCaseDurationMinutes: number;
  };
  stagesCompleted: {
    alertExists: boolean;
    caseExists: boolean;
    investigationExists: boolean;
    investigationEvidenceExists: boolean;
    escalationExpected: boolean;
    escalationOccurred: boolean;
    acknowledgementExists: boolean;
    closureExists: boolean;
  };
  slaStatus: 'MET' | 'BREACHED' | 'NOT_APPLICABLE';
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
  confidence: number; // 0-100
  recommendedAction: string;
  counterfactual: string;
  source: 'Deterministic Rule' | 'Negative Space' | 'Statistical Outlier' | 'ML Anomaly Signal';
  mlAnomalySignal?: {
    isAnomaly: boolean;
    anomalyScore: number; // 0-1
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

export interface AuditEvent {
  id: string;
  actorEmail: string;
  actorName: string;
  actorRole: UserRole;
  action:
    | 'LOGIN'
    | 'LOGOUT'
    | 'FINDING_VIEWED'
    | 'FINDING_REVIEWED'
    | 'REPORT_GENERATED'
    | 'DATA_UPLOAD'
    | 'ANALYTICS_EXECUTED'
    | 'SCENARIO_SWITCHED'
    | 'ADMIN_ACTION';
  timestamp: string;
  targetType: 'FINDING' | 'CASE' | 'REPORT' | 'DATASET' | 'AUTH' | 'SCENARIO';
  targetId: string;
  metadata: Record<string, any>;
}

export interface KPISummary {
  totalEntities: number;
  totalAlerts: number;
  totalCases: number;
  totalInvestigations: number;
  totalFindings: number;
  highFindings: number;
  criticalFindings: number;
  slaBreachRate: number; // percentage
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
