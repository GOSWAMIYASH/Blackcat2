export interface ExplainabilityPackage {
  whatHappened: string;
  whyFlagged: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  counterfactual: string;
  recommendedAction: string;
}

export function generateExplanation(gapType: string, context: {
  caseNumber: string;
  entityName: string;
  severity: string;
  expectedWorkflow: string[];
  observedWorkflow: string[];
  missingItemName?: string;
  durationObserved?: number;
  durationTarget?: number;
}): ExplainabilityPackage {
  switch (gapType) {
    case 'MISSING_ESCALATION':
      return {
        whatHappened: `Case ${context.caseNumber} for ${context.entityName} was flagged as ${context.severity} severity and went from Investigation directly into Closure without an Escalation event record.`,
        whyFlagged: `The supervisory baseline mandates that high or critical severity incident investigations require formal tier escalation or incident commander notification prior to closure.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If a verified Tier 2/3 or Incident Commander escalation event record had been logged prior to case closure, this potential supervisory finding would not have been generated.`,
        recommendedAction: `Examiner should review communication logs (email, chat, ticketing notes) to ascertain whether an informal escalation took place or if high-severity containment was executed without required oversight.`
      };

    case 'SLA_BREACH':
      return {
        whatHappened: `Investigation for Case ${context.caseNumber} took ${context.durationObserved ?? 'extended'} minutes, exceeding the mandated operational SLA target of ${context.durationTarget ?? 60} minutes.`,
        whyFlagged: `The elapsed time between case acknowledgement/triage and investigation completion exceeds the supervisory SLA threshold for ${context.severity} severity cases.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If the investigation had concluded or an SLA extension waiver had been authorized within ${context.durationTarget ?? 60} minutes, this signal would not have been triggered.`,
        recommendedAction: `Inspect analyst workload, shift handovers, and external dependency ticket references to verify root cause of delay.`
      };

    case 'MISSING_INVESTIGATION_EVIDENCE':
      return {
        whatHappened: `Investigation was marked completed for Case ${context.caseNumber}, but zero supporting digital evidence records (PCAP, host logs, memory artifact) were attached in the repository.`,
        whyFlagged: `Supervisory standards require that closure of escalated or high-priority security investigations must link verifiable supporting digital artifacts.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If forensic artifacts, hashed log extracts, or verification hashes were associated with the investigation record, this execution gap would be resolved.`,
        recommendedAction: `Request digital forensics evidence from the analyst and verify if artifacts were stored outside the primary repository without linkage.`
      };

    case 'PREMATURE_CLOSURE':
      return {
        whatHappened: `Case ${context.caseNumber} was closed after only ${context.durationObserved ?? 4} minutes with no substantive investigation hypothesis or containment steps logged.`,
        whyFlagged: `Abnormally rapid closure of a ${context.severity} incident deviates statistically from the mean investigation duration and indicates potential unvalidated dismissal.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If thorough triage analysis and verified containment steps had been documented matching the severity profile, this finding would not have triggered.`,
        recommendedAction: `Conduct spot check on alert veracity and examine whether alert was improperly dismissed without genuine assessment.`
      };

    case 'MISSING_INVESTIGATION':
      return {
        whatHappened: `Case ${context.caseNumber} progressed from Alert triage directly to Closure without an Investigation record.`,
        whyFlagged: `Security cases cannot bypass the investigation phase unless explicit automated suppression rules are referenced.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If an analyst investigation entry or automated enrichment log had been generated, this signal would not exist.`,
        recommendedAction: `Verify if this was an unmanaged ticket closure or an unlogged automated script action.`
      };

    case 'MISSING_ACKNOWLEDGEMENT':
      return {
        whatHappened: `Case ${context.caseNumber} lacked an analyst initial acknowledgement timestamp between alert generation and investigation.`,
        whyFlagged: `Initial acknowledgement confirms human awareness within mandatory response windows.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `If initial analyst triage acknowledgement timestamp had been recorded, this flag would not appear.`,
        recommendedAction: `Review analyst queue monitoring practices and queue response telemetry.`
      };

    default:
      return {
        whatHappened: `Operational workflow sequence anomaly detected on Case ${context.caseNumber} for ${context.entityName}.`,
        whyFlagged: `Reconstructed operational flow deviates from the expected standard SOC lifecycle.`,
        expectedWorkflow: context.expectedWorkflow,
        observedWorkflow: context.observedWorkflow,
        counterfactual: `Aligning operational evidence records with the standard expected lifecycle would prevent this supervisory signal.`,
        recommendedAction: `Review case timeline and operational logs with SOC supervisor.`
      };
  }
}
