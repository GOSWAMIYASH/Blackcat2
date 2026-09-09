import { Entity, Case, Investigation, Escalation, Closure, SupervisoryFinding, NegativeSpaceRow } from '../types';

export function buildNegativeSpaceMatrix(
  entities: Entity[],
  cases: Case[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  findings: SupervisoryFinding[]
): NegativeSpaceRow[] {
  const matrix: NegativeSpaceRow[] = [];

  for (const entity of entities) {
    const entityCases = cases.filter(c => c.entityId === entity.id);
    const entityFindings = findings.filter(f => f.entityId === entity.id);

    if (entityCases.length === 0) {
      matrix.push({
        entityId: entity.id,
        entityName: entity.name,
        investigationStatus: 'PRESENT',
        escalationStatus: 'PRESENT',
        closureStatus: 'PRESENT',
        associatedFindingIds: {},
        severity: entity.criticality,
        findingCount: 0
      });
      continue;
    }

    const investigationFindingIds: string[] = [];
    const escalationFindingIds: string[] = [];
    const closureFindingIds: string[] = [];

    // Check investigations
    let missingInvCount = 0;
    let abnormalInvCount = 0;
    for (const c of entityCases) {
      const inv = investigations.find(i => i.caseId === c.id);
      if (!inv && c.status === 'CLOSED') {
        missingInvCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id && (f.category === 'Execution Gap' || f.category === 'Missing Evidence'));
        rel.forEach(r => investigationFindingIds.push(r.id));
      } else if (inv && ((inv.durationMinutes || 0) < 5 || (inv.durationMinutes || 0) > 180)) {
        abnormalInvCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id);
        rel.forEach(r => investigationFindingIds.push(r.id));
      }
    }

    // Check escalations for high/critical cases
    let missingEscCount = 0;
    let abnormalEscCount = 0;
    const highCritCases = entityCases.filter(c => c.severity === 'CRITICAL' || c.severity === 'HIGH');
    for (const c of highCritCases) {
      const esc = escalations.find(e => e.caseId === c.id);
      if (!esc) {
        missingEscCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id && f.title.toLowerCase().includes('escalation'));
        rel.forEach(r => escalationFindingIds.push(r.id));
      } else if (esc.delayMinutesFromAlert > 120) {
        abnormalEscCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id);
        rel.forEach(r => escalationFindingIds.push(r.id));
      }
    }

    // Check closures
    let missingClosureCount = 0;
    let abnormalClosureCount = 0;
    for (const c of entityCases) {
      const cl = closures.find(cls => cls.caseId === c.id);
      if (!cl && c.status === 'CLOSED') {
        missingClosureCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id);
        rel.forEach(r => closureFindingIds.push(r.id));
      } else if (cl && !cl.approvedBySupervisor && (c.severity === 'CRITICAL' || c.severity === 'HIGH')) {
        abnormalClosureCount++;
        const rel = entityFindings.filter(f => f.caseId === c.id);
        rel.forEach(r => closureFindingIds.push(r.id));
      }
    }

    const investigationStatus = missingInvCount > 0 ? 'MISSING' : abnormalInvCount > 0 ? 'ABNORMAL' : 'PRESENT';
    const escalationStatus = missingEscCount > 0 ? 'MISSING' : abnormalEscCount > 0 ? 'ABNORMAL' : 'PRESENT';
    const closureStatus = missingClosureCount > 0 ? 'MISSING' : abnormalClosureCount > 0 ? 'ABNORMAL' : 'PRESENT';

    // Aggregate highest severity from findings
    let rowSeverity = entity.criticality;
    if (entityFindings.some(f => f.severity === 'CRITICAL')) rowSeverity = 'CRITICAL';
    else if (entityFindings.some(f => f.severity === 'HIGH')) rowSeverity = 'HIGH';

    matrix.push({
      entityId: entity.id,
      entityName: entity.name,
      investigationStatus,
      escalationStatus,
      closureStatus,
      associatedFindingIds: {
        investigation: Array.from(new Set(investigationFindingIds)),
        escalation: Array.from(new Set(escalationFindingIds)),
        closure: Array.from(new Set(closureFindingIds))
      },
      severity: rowSeverity,
      findingCount: entityFindings.length
    });
  }

  return matrix;
}
