import React, { useState } from 'react';
import { SupervisoryFinding, ReviewStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { WorkflowDiagram } from '../common/WorkflowDiagram';
import { useReviewDraft } from '../../hooks/useReviewDraft';
import {
  X,
  ShieldCheck,
  AlertTriangle,
  FileCheck2,
  FileQuestion,
  HelpCircle,
  Clock,
  Sparkles,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Check,
  Download,
  History
} from 'lucide-react';

interface Props {
  finding: SupervisoryFinding;
  onClose: () => void;
  onReviewSubmit: (
    id: string,
    decision: ReviewStatus,
    notes: string,
    followUp?: string
  ) => Promise<void>;
  canReview: boolean;
}

export const FindingDetailModal: React.FC<Props> = ({ finding, onClose, onReviewSubmit, canReview }) => {
  const initialDecision: ReviewStatus =
    finding.reviewStatus !== 'PENDING' ? finding.reviewStatus : 'CONFIRMED';
  const initialNotes = finding.reviewDecision?.notes || '';
  const initialFollowUp = finding.reviewDecision?.recommendedFollowUp || '';

  const {
    decision,
    setDecision,
    notes,
    setNotes,
    followUp,
    setFollowUp,
    draftRestored,
    lastSaved,
    clearDraft,
    discardDraft
  } = useReviewDraft(finding.id, initialDecision, initialNotes, initialFollowUp);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onReviewSubmit(finding.id, decision, notes, followUp);
      clearDraft();
      setSubmitSuccess(true);
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 2500);
    } catch (err) {
      console.error('Review submit failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportJSON = () => {
    const offlineReport = {
      reportType: 'SAT-SA Individual Finding Supervisory Assessment Dossier',
      platform: 'SAT-SA (SIH26157)',
      generatedAt: new Date().toISOString(),
      exportVersion: '1.0.0',
      findingMetadata: {
        findingId: finding.id,
        entityId: finding.entityId,
        entityName: finding.entityName,
        caseId: finding.caseId,
        caseNumber: finding.caseNumber,
        title: finding.title,
        category: finding.category,
        severity: finding.severity,
        priorityScore: finding.priorityScore,
        priorityLevel: finding.priorityLevel,
        source: finding.source,
        evidenceStrength: finding.evidenceStrength,
        confidenceScore: finding.confidence,
        createdAt: finding.createdAt
      },
      tenSectionAuditDossier: {
        section1_FindingSummary: {
          whatHappened: finding.whatHappened,
          evidenceStrength: finding.evidenceStrength,
          confidence: finding.confidence
        },
        section2_WhyFlagged: {
          rationale: finding.whyFlagged,
          triggerRule: finding.source
        },
        section3_WorkflowReconstruction: {
          expectedWorkflowSequence: finding.expectedWorkflow,
          observedWorkflowSequence: finding.observedWorkflow,
          executionGaps: finding.expectedWorkflow.filter(s => !finding.observedWorkflow.includes(s))
        },
        section4_MissingEvidenceDeficit: finding.missingEvidence,
        section5_SupportingDigitalEvidence: finding.supportingEvidence,
        section6_PriorityScoreContributors: {
          totalPriorityScore: finding.priorityScore,
          priorityLevel: finding.priorityLevel,
          scoreExplanation: finding.scoreExplanation
        },
        section7_MLAnomalySignal: finding.mlAnomalySignal || {
          isAnomaly: false,
          anomalyScore: 0,
          featureContributions: []
        },
        section8_Counterfactual: {
          reversalCondition: finding.counterfactual
        },
        section9_RecommendedExaminerAction: {
          recommendedAction: finding.recommendedAction
        },
        section10_HumanReviewDecision: {
          currentStatus: finding.reviewStatus,
          stagedReviewDecision: decision,
          stagedNotes: notes,
          stagedFollowUp: followUp,
          committedDecision: finding.reviewDecision || null
        }
      },
      offlineReviewGuidelines: {
        notice: 'This file contains an unedited forensic record of a potential supervisory operational signal from SAT-SA. It is formatted for offline human examiner review, cross-system audit corroboration, and regulatory filing.',
        confidentialityNotice: 'Restricted Supervisory Evidence — SIH26157.'
      }
    };

    const blob = new Blob([JSON.stringify(offlineReport, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `SAT-SA-Finding-${finding.id}-${finding.entityName.replace(/\s+/g, '_')}-offline.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const { scoreExplanation } = finding;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl max-h-[90vh] rounded-xl border border-zinc-800 bg-zinc-950 shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/80">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded bg-zinc-800 border border-zinc-700">
              <ShieldCheck className="w-5 h-5 text-red-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-zinc-400">{finding.id}</span>
                <span className="text-xs font-mono text-zinc-500">•</span>
                <span className="text-xs text-zinc-300 font-medium">{finding.entityName}</span>
                <span className="text-xs font-mono text-zinc-500">• Case {finding.caseNumber}</span>
              </div>
              <h2 className="text-base font-bold text-zinc-100">{finding.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={handleExportJSON}
              title="Generate JSON report with 10-section audit metadata for offline review"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-700 bg-zinc-900 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition shadow-sm"
            >
              <Download className="w-3.5 h-3.5 text-zinc-400" />
              <span>Export JSON Report</span>
            </button>
            <SeverityBadge severity={finding.severity} />
            <CategoryBadge category={finding.category} />
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg border border-zinc-800 text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 transition ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: 10 Evidence-First Sections */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-zinc-300 text-xs leading-relaxed">
          {/* Section 1: Finding Summary */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/50 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                1. Finding Summary
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400">
                  Evidence Strength:{' '}
                  <strong className="text-emerald-300 font-mono">{finding.evidenceStrength}</strong>
                </span>
                <span className="text-[11px] text-zinc-400">
                  Rule Confidence:{' '}
                  <strong className="text-blue-300 font-mono">{finding.confidence}%</strong>
                </span>
              </div>
            </div>
            <p className="text-zinc-300 text-xs leading-normal">{finding.whatHappened}</p>
          </div>

          {/* Section 2: Why Flagged */}
          <div className="rounded-lg border border-amber-900/40 bg-amber-950/20 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-amber-300 font-semibold uppercase tracking-wider text-xs">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>2. Why Flagged (Supervisory Assessment Rule)</span>
            </div>
            <p className="text-amber-200/90 text-xs">{finding.whyFlagged}</p>
          </div>

          {/* Section 3: Expected vs Observed Workflow */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              3. Workflow Reconstruction Comparison
            </div>
            <WorkflowDiagram
              expectedWorkflow={finding.expectedWorkflow}
              observedWorkflow={finding.observedWorkflow}
            />
          </div>

          {/* Section 4: Missing Evidence */}
          <div className="rounded-lg border border-red-950 bg-red-950/30 p-4 space-y-2">
            <div className="flex items-center gap-2 text-red-300 font-semibold uppercase tracking-wider text-xs">
              <FileQuestion className="w-4 h-4 text-red-400" />
              <span>4. Missing Expected Evidence (Negative-Space Deficit)</span>
            </div>
            {finding.missingEvidence.map((item, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between border-b border-red-900/40 pb-2 last:border-0 last:pb-0"
              >
                <div>
                  <div className="font-semibold text-red-200 text-xs">{item.expectedType}</div>
                  <div className="text-zinc-400 text-[11px] mt-0.5">{item.description}</div>
                </div>
                <span className="text-[10px] text-red-400 font-mono uppercase bg-red-950/80 px-2 py-0.5 rounded border border-red-800">
                  {item.impact}
                </span>
              </div>
            ))}
          </div>

          {/* Section 5: Supporting Evidence */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-zinc-200 font-semibold uppercase tracking-wider text-xs">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                <span>5. Supporting Digital Evidence (Observed Records)</span>
              </div>
              <span className="text-[11px] text-zinc-500 font-mono">
                {finding.supportingEvidence.length} Verifiable Record(s) Linked
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-[11px]">
                <thead>
                  <tr className="border-b border-zinc-800 text-zinc-500 font-mono uppercase">
                    <th className="py-1.5 px-2">Record ID</th>
                    <th className="py-1.5 px-2">Type</th>
                    <th className="py-1.5 px-2">Description</th>
                    <th className="py-1.5 px-2">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-sans">
                  {finding.supportingEvidence.map((ev, i) => (
                    <tr key={i} className="hover:bg-zinc-800/40">
                      <td className="py-1.5 px-2 font-mono text-zinc-300">{ev.recordId}</td>
                      <td className="py-1.5 px-2 text-zinc-400">{ev.type}</td>
                      <td className="py-1.5 px-2 text-zinc-300">{ev.description}</td>
                      <td className="py-1.5 px-2 font-mono text-zinc-500">{ev.timestamp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 6 & 7: Priority Score Breakdown + ML Anomaly Signal */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Priority Score Breakdown */}
            <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
                  6. Priority Score Engine
                </span>
                <span className="text-xs font-bold text-red-400 font-mono">
                  {finding.priorityScore} / 100 ({finding.priorityLevel})
                </span>
              </div>

              <div className="space-y-1.5 text-[11px]">
                <div className="flex justify-between text-zinc-400">
                  <span>Severity Impact:</span>
                  <span className="font-mono text-zinc-200">
                    +{scoreExplanation.contributors.severity}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Workflow Execution Gap:</span>
                  <span className="font-mono text-zinc-200">
                    +{scoreExplanation.contributors.workflowImpact}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Missing Evidence Deficit:</span>
                  <span className="font-mono text-zinc-200">
                    +{scoreExplanation.contributors.missingEvidence}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Operational SLA Impact:</span>
                  <span className="font-mono text-zinc-200">
                    +{scoreExplanation.contributors.slaImpact}
                  </span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Critical Entity Tier:</span>
                  <span className="font-mono text-zinc-200">
                    +{scoreExplanation.contributors.entityCriticality}
                  </span>
                </div>
                <div className="border-t border-zinc-800 pt-1 flex justify-between font-semibold text-zinc-200">
                  <span>Total Transparent Priority:</span>
                  <span className="font-mono text-red-300">{finding.priorityScore}</span>
                </div>
              </div>
            </div>

            {/* Section 7: Optional ML Anomaly Signal */}
            <div className="rounded-lg border border-cyan-950/70 bg-cyan-950/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-cyan-300 font-semibold uppercase tracking-wider text-xs">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>7. Behavioral Anomaly Model</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Secondary Signal
                </span>
              </div>

              {finding.mlAnomalySignal?.isAnomaly ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-zinc-400">Anomaly Divergence:</span>
                    <span className="font-mono font-bold text-cyan-300">
                      {Math.round((finding.mlAnomalySignal.anomalyScore || 0) * 100)}% Divergence
                    </span>
                  </div>
                  <div className="space-y-1">
                    {finding.mlAnomalySignal.featureContributions.map((fc, i) => (
                      <div key={i} className="text-[11px] bg-cyan-950/40 p-1.5 rounded border border-cyan-900/50">
                        <strong className="text-cyan-200">{fc.feature}:</strong>{' '}
                        <span className="text-zinc-400">{fc.deviation}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-[10px] text-zinc-500 italic mt-1">
                    Note: ML anomaly detection provides a secondary statistical indicator and never decides compliance.
                  </p>
                </div>
              ) : (
                <div className="text-[11px] text-zinc-400 flex items-center gap-2 py-4">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>No behavioral outlier divergence detected for this case.</span>
                </div>
              )}
            </div>
          </div>

          {/* Section 8: Counterfactual */}
          <div className="rounded-lg border border-indigo-950/80 bg-indigo-950/30 p-4 space-y-1.5">
            <div className="flex items-center gap-2 text-indigo-300 font-semibold uppercase tracking-wider text-xs">
              <HelpCircle className="w-4 h-4 text-indigo-400" />
              <span>8. Counterfactual (What Would Have Changed the Result?)</span>
            </div>
            <p className="text-indigo-200 text-xs italic">{finding.counterfactual}</p>
          </div>

          {/* Section 9: Recommended Examiner Action */}
          <div className="rounded-lg border border-zinc-800 bg-zinc-900/60 p-4 space-y-1.5">
            <span className="text-xs font-semibold text-zinc-200 uppercase tracking-wider">
              9. Recommended Examiner Action
            </span>
            <p className="text-zinc-300 text-xs">{finding.recommendedAction}</p>
          </div>

          {/* Section 10: Human-in-the-Loop Review Decision */}
          <div className="rounded-xl border border-zinc-700 bg-zinc-900 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                  <span className="text-xs font-bold text-zinc-100 uppercase tracking-wider">
                  {canReview ? '10. Human Examiner Review Decision' : '10. Review Decision (Read-only)'}
                </span>
                <p className="text-[11px] text-zinc-400 mt-0.5">
                  Distinguishes analytics signal from human examiner verdict. Logged to tamper-evident audit trail.
                </p>
              </div>
              <span
                className={`text-xs px-2.5 py-1 rounded font-bold uppercase tracking-wider border ${
                  finding.reviewStatus === 'CONFIRMED'
                    ? 'bg-red-950 text-red-300 border-red-800'
                    : finding.reviewStatus === 'REJECTED'
                    ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                    : finding.reviewStatus === 'NEEDS_EVIDENCE'
                    ? 'bg-amber-950 text-amber-300 border-amber-800'
                    : 'bg-blue-950 text-blue-300 border-blue-800 animate-pulse'
                }`}
              >
                Status: {finding.reviewStatus}
              </span>
            </div>

            {/* Draft Recovery Alert */}
            {draftRestored && (
              <div className="flex items-center justify-between px-3.5 py-2 rounded-lg bg-blue-950/50 border border-blue-800/80 text-xs text-blue-200">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 text-blue-400 flex-shrink-0" />
                  <span>
                    <strong>Restored Unsaved Draft:</strong> Progress from your previous editing session was recovered.
                  </span>
                </div>
                <button
                  type="button"
                  onClick={discardDraft}
                  className="text-xs font-semibold text-blue-300 hover:text-blue-100 underline ml-3 flex-shrink-0"
                >
                  Discard Draft
                </button>
              </div>
            )}

            {/* Decision Radio Buttons */}
            <div className={`grid grid-cols-3 gap-3 ${canReview ? '' : 'hidden'}`}>
              <button
                type="button"
                onClick={() => setDecision('CONFIRMED')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  decision === 'CONFIRMED'
                    ? 'bg-red-950 border-red-600 text-red-200 ring-2 ring-red-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 text-red-400" />
                <span>Confirm Gap</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  decision === 'REJECTED'
                    ? 'bg-zinc-800 border-zinc-600 text-zinc-100 ring-2 ring-zinc-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <XCircle className="w-4 h-4 text-zinc-400" />
                <span>Reject / Dismiss</span>
              </button>

              <button
                type="button"
                onClick={() => setDecision('NEEDS_EVIDENCE')}
                className={`flex items-center justify-center gap-2 p-2.5 rounded-lg border text-xs font-semibold transition ${
                  decision === 'NEEDS_EVIDENCE'
                    ? 'bg-amber-950 border-amber-600 text-amber-200 ring-2 ring-amber-500/40'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                }`}
              >
                <RotateCcw className="w-4 h-4 text-amber-400" />
                <span>Request More Evidence</span>
              </button>
            </div>

            {/* Notes Input */}
            <div className={`space-y-2 ${canReview ? '' : 'hidden'}`}>
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                  Examiner Review Notes & Rationale:
                </label>
                {lastSaved && (
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="inline-flex items-center gap-1.5 text-emerald-400 font-mono">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      Auto-saved to local draft
                    </span>
                    <button
                      type="button"
                      onClick={discardDraft}
                      title="Clear local draft and reset notes"
                      className="text-zinc-500 hover:text-red-400 transition underline"
                    >
                      Clear
                    </button>
                  </div>
                )}
              </div>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Enter detailed supervisory review notes, justification, or interviews conducted with the SOC manager..."
                rows={3}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 p-3 text-xs text-zinc-200 placeholder-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Follow-up recommendation */}
            <div className={`space-y-2 ${canReview ? '' : 'hidden'}`}>
              <label className="text-[11px] font-semibold text-zinc-300 uppercase tracking-wider block">
                Recommended Follow-up Action / Directive:
              </label>
              <input
                type="text"
                value={followUp}
                onChange={e => setFollowUp(e.target.value)}
                placeholder="e.g., Issue 14-day rectification notice to SOC Lead for missing escalation logs"
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-200 placeholder-zinc-600 focus:border-red-600 focus:outline-none focus:ring-1 focus:ring-red-600"
              />
            </div>

            {/* Submit Action */}
            <div className="flex items-center justify-between pt-2">
              {submitSuccess ? (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> Decision committed to audit trail!
                </span>
              ) : (
                <span className="text-[11px] text-zinc-500 font-mono">
                  Recorded with reviewer credentials & timestamp
                </span>
              )}

              <div className="flex items-center gap-2.5">
                {canReview && <button
                  type="button"
                  onClick={handleExportJSON}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-950 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-zinc-100 transition shadow-sm"
                >
                  <Download className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Export JSON Report</span>
                </button>}
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg border border-zinc-700 text-xs font-medium text-zinc-300 hover:bg-zinc-800 transition"
                >
                  Close
                </button>
                {canReview && <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSubmit}
                  className="px-5 py-2 rounded-lg bg-red-800 hover:bg-red-700 text-white font-semibold text-xs transition shadow-md disabled:opacity-50"
                >
                  {isSubmitting ? 'Recording...' : 'Commit Examiner Decision'}
                </button>}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
