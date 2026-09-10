import {
  User,
  Entity,
  Alert,
  Case,
  Investigation,
  Escalation,
  Closure,
  EvidenceRecord,
  SupervisoryFinding,
  AuditEvent,
  KPISummary,
  ReviewStatus,
  NegativeSpaceRow
} from './types';
import { PRESET_USERS } from './auth';
import { prisma } from './prisma';
import { generateScenarioData, SCENARIO_DEFINITIONS } from './engine/scenarios';
import { runExecutionGapRules } from './engine/executionGap';
import { buildNegativeSpaceMatrix } from './engine/negativeSpace';
import { calculateStatistics, StatisticalAnalysisSummary } from './engine/statistics';

class DatabaseStore {
  public users: User[] = [...PRESET_USERS];
  public entities: Entity[] = [];
  public alerts: Alert[] = [];
  public cases: Case[] = [];
  public investigations: Investigation[] = [];
  public escalations: Escalation[] = [];
  public closures: Closure[] = [];
  public evidences: EvidenceRecord[] = [];
  public findings: SupervisoryFinding[] = [];
  public auditEvents: AuditEvent[] = [];
  public activeScenarioId: string = 'SCENARIO_2'; // Start with Scenario 2 (Missing Escalation) so examiners see a rich finding immediately

  constructor() {
    this.loadScenario(this.activeScenarioId, 'System Initialization');
  }

  public loadScenario(scenarioId: string, actor: string = 'System'): void {
    const data = generateScenarioData(scenarioId);
    this.activeScenarioId = scenarioId;
    this.entities = data.entities;
    this.alerts = data.alerts;
    this.cases = data.cases;
    this.investigations = data.investigations;
    this.escalations = data.escalations;
    this.closures = data.closures;
    this.evidences = data.evidences;

    this.recomputeAnalytics();

    this.addAuditLog({
      actorEmail: actor === 'System' ? 'system@satsa.internal' : actor,
      actorName: actor === 'System' ? 'SAT-SA Platform' : actor,
      actorRole: 'Lead Examiner',
      action: 'SCENARIO_SWITCHED',
      targetType: 'SCENARIO',
      targetId: scenarioId,
      metadata: { scenarioName: data.scenario.name }
    });
  }

  public recomputeAnalytics(): void {
    // Run execution gap engine
    this.findings = runExecutionGapRules(
      this.cases,
      this.alerts,
      this.investigations,
      this.escalations,
      this.closures,
      this.evidences,
      this.entities
    );

    // Update entity metrics
    for (const entity of this.entities) {
      const entityCases = this.cases.filter(c => c.entityId === entity.id);
      const entityFindings = this.findings.filter(f => f.entityId === entity.id);
      const breached = entityCases.filter(c => c.slaBreached).length;

      entity.activeCases = entityCases.length;
      entity.totalFindings = entityFindings.length;
      entity.slaBreachRate = entityCases.length > 0 ? Math.round((breached / entityCases.length) * 100) : 0;
      entity.lastAssessedAt = new Date().toISOString();
    }
  }

  public getKPISummary(): KPISummary {
    const totalEntities = this.entities.length;
    const totalAlerts = this.alerts.length;
    const totalCases = this.cases.length;
    const totalInvestigations = this.investigations.length;
    const totalFindings = this.findings.length;
    const highFindings = this.findings.filter(f => f.severity === 'HIGH').length;
    const criticalFindings = this.findings.filter(f => f.severity === 'CRITICAL').length;
    const breached = this.cases.filter(c => c.slaBreached).length;
    const slaBreachRate = totalCases > 0 ? Math.round((breached / totalCases) * 100) : 0;
    const reviewedFindingsCount = this.findings.filter(f => f.reviewStatus !== 'PENDING').length;
    const pendingReviewCount = this.findings.filter(f => f.reviewStatus === 'PENDING').length;

    return {
      totalEntities,
      totalAlerts,
      totalCases,
      totalInvestigations,
      totalFindings,
      highFindings,
      criticalFindings,
      slaBreachRate,
      reviewedFindingsCount,
      pendingReviewCount
    };
  }

  public getNegativeSpaceMatrix(): NegativeSpaceRow[] {
    return buildNegativeSpaceMatrix(
      this.entities,
      this.cases,
      this.investigations,
      this.escalations,
      this.closures,
      this.findings
    );
  }

  public getStatistics(): StatisticalAnalysisSummary {
    return calculateStatistics(
      this.cases,
      this.alerts,
      this.investigations,
      this.escalations,
      this.closures,
      this.findings
    );
  }

  public reviewFinding(
    findingId: string,
    decision: ReviewStatus,
    reviewer: { id: string; name: string; email: string; role: any },
    notes: string,
    recommendedFollowUp?: string
  ): SupervisoryFinding | null {
    const finding = this.findings.find(f => f.id === findingId);
    if (!finding) return null;

    finding.reviewStatus = decision;
    finding.reviewDecision = {
      decision,
      reviewerId: reviewer.id,
      reviewerName: reviewer.name,
      reviewedAt: new Date().toISOString(),
      notes,
      recommendedFollowUp
    };

    this.addAuditLog({
      actorEmail: reviewer.email,
      actorName: reviewer.name,
      actorRole: reviewer.role,
      action: 'FINDING_REVIEWED',
      targetType: 'FINDING',
      targetId: findingId,
      metadata: {
        decision,
        notes,
        findingTitle: finding.title,
        entityName: finding.entityName
      }
    });

    return finding;
  }

  public addAuditLog(event: Omit<AuditEvent, 'id' | 'timestamp'>): AuditEvent {
    const log: AuditEvent = {
      id: `AUD-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toISOString(),
      ...event
    };
    this.auditEvents.unshift(log);
    // Retain up to 2,000 log events in memory
    if (this.auditEvents.length > 2000) {
      this.auditEvents.pop();
    }

    void this.persistAuditLog(log);
    return log;
  }

  private async persistAuditLog(log: AuditEvent): Promise<void> {
    try {
      const actor = await prisma.user.findUnique({
        where: { email: log.actorEmail },
        select: { id: true, organizationId: true }
      });
      const organization = actor
        ? { id: actor.organizationId }
        : await prisma.organization.findFirst({ select: { id: true } });
      if (!organization) return;

      await prisma.auditLog.create({
        data: {
          organizationId: organization.id,
          actorId: actor?.id,
          action: log.action,
          targetType: log.targetType,
          targetId: log.targetId,
          metadata: log.metadata,
          createdAt: new Date(log.timestamp)
        }
      });
    } catch (error) {
      console.warn('Audit persistence unavailable; retained in memory:', error);
    }
  }

  public ingestCustomDataset(cases: Partial<Case>[], alerts: Partial<Alert>[], actorEmail: string): void {
    const newCases: Case[] = cases.map((c, idx) => ({
      id: c.id || `CASE-CUST-${Date.now()}-${idx}`,
      caseNumber: c.caseNumber || `CUST-INC-${idx + 1}`,
      alertId: c.alertId || `ALT-CUST-${idx + 1}`,
      entityId: c.entityId || 'ENT-FIN-01',
      title: c.title || 'Custom Ingested Incident',
      severity: c.severity || 'HIGH',
      status: c.status || 'CLOSED',
      assignedAnalyst: c.assignedAnalyst || 'Ingested Analyst',
      createdAt: c.createdAt || new Date().toISOString(),
      slaTargetMinutes: c.slaTargetMinutes || 120,
      slaActualMinutes: c.slaActualMinutes || 60,
      slaBreached: !!c.slaBreached
    }));

    this.cases = [...newCases, ...this.cases];
    this.recomputeAnalytics();

    this.addAuditLog({
      actorEmail,
      actorName: actorEmail,
      actorRole: 'SOC Supervisor',
      action: 'DATA_UPLOAD',
      targetType: 'DATASET',
      targetId: `UPLOAD-${Date.now()}`,
      metadata: { recordCount: newCases.length }
    });
  }
}

export const db = new DatabaseStore();
