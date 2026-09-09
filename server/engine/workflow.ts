import { Alert, Case, Investigation, Escalation, Closure, EvidenceRecord, WorkflowReconstruction } from '../types';

export function reconstructWorkflow(
  c: Case,
  alerts: Alert[],
  investigations: Investigation[],
  escalations: Escalation[],
  closures: Closure[],
  evidences: EvidenceRecord[]
): WorkflowReconstruction {
  const matchingAlert = alerts.find(a => a.id === c.alertId);
  const matchingInv = investigations.find(i => i.caseId === c.id);
  const matchingEsc = escalations.find(e => e.caseId === c.id);
  const matchingClosure = closures.find(cl => cl.caseId === c.id);
  const caseEvidences = evidences.filter(ev => ev.caseId === c.id);

  // Determine if escalation was expected based on severity & threat classification
  const escalationExpected = c.severity === 'CRITICAL' || c.severity === 'HIGH';

  const expectedStages: string[] = ['Alert', 'Case', 'Investigation'];
  if (escalationExpected) {
    expectedStages.push('Escalation');
  }
  expectedStages.push('Closure');

  const observedStages: string[] = [];
  if (matchingAlert) observedStages.push('Alert');
  observedStages.push('Case');
  if (matchingInv) observedStages.push('Investigation');
  if (matchingEsc) observedStages.push('Escalation');
  if (matchingClosure) observedStages.push('Closure');

  const missingStages = expectedStages.filter(stage => !observedStages.includes(stage));

  // Compute timing
  const alertTime = matchingAlert ? new Date(matchingAlert.normalizedTimestamp).getTime() : new Date(c.createdAt).getTime();
  const caseTime = new Date(c.createdAt).getTime();
  const invStartTime = matchingInv ? new Date(matchingInv.startedAt).getTime() : caseTime;
  const invEndTime = matchingInv?.completedAt ? new Date(matchingInv.completedAt).getTime() : Date.now();
  const escTime = matchingEsc ? new Date(matchingEsc.escalatedAt).getTime() : undefined;
  const closeTime = matchingClosure ? new Date(matchingClosure.closedAt).getTime() : Date.now();

  const alertToCaseMinutes = Math.max(0, Math.round((caseTime - alertTime) / 60000));
  const caseToInvestigationMinutes = Math.max(0, Math.round((invStartTime - caseTime) / 60000));
  const investigationDurationMinutes = Math.max(0, Math.round((invEndTime - invStartTime) / 60000));
  const escalationDelayMinutes = escTime ? Math.max(0, Math.round((escTime - alertTime) / 60000)) : undefined;
  const totalCaseDurationMinutes = Math.max(0, Math.round((closeTime - caseTime) / 60000));

  const slaBreached = c.slaBreached || (c.slaTargetMinutes > 0 && totalCaseDurationMinutes > c.slaTargetMinutes);

  return {
    caseId: c.id,
    entityId: c.entityId,
    expectedWorkflow: expectedStages,
    observedWorkflow: observedStages,
    missingStages,
    timing: {
      alertToCaseMinutes,
      caseToInvestigationMinutes,
      investigationDurationMinutes,
      escalationDelayMinutes,
      totalCaseDurationMinutes
    },
    stagesCompleted: {
      alertExists: !!matchingAlert,
      caseExists: true,
      investigationExists: !!matchingInv,
      investigationEvidenceExists: caseEvidences.length > 0,
      escalationExpected,
      escalationOccurred: !!matchingEsc,
      acknowledgementExists: !!c.acknowledgedAt,
      closureExists: !!matchingClosure
    },
    slaStatus: slaBreached ? 'BREACHED' : 'MET'
  };
}
