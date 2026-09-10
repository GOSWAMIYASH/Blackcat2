import React, { useState } from 'react';
import {
  KPISummary,
  SupervisoryFinding,
  WorkflowFunnel,
  OperationalTrendPoint,
  UserRole
} from '../../types';
import { StatCard } from '../common/StatCard';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LineChart,
  Line,
  CartesianGrid
} from 'recharts';
import {
  Building2,
  Bell,
  Briefcase,
  Search,
  AlertOctagon,
  AlertTriangle,
  Clock,
  ShieldAlert,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';

interface Props {
  role: UserRole;
  kpi: KPISummary;
  severityData: { severity: string; count: number; fill: string }[];
  categoryData: { category: string; count: number }[];
  workflowFunnel: WorkflowFunnel[];
  trends: OperationalTrendPoint[];
  entityRankings: { entityId: string; entityName: string; priorityScore: number; findingCount: number; criticalCount: number }[];
  findings: SupervisoryFinding[];
  onSelectFinding: (finding: SupervisoryFinding) => void;
  onNavigateToCategory: (category: string) => void;
  onNavigateToEntity: (entityId: string) => void;
  onNavigateToSeverity: (severity: string) => void;
}

export const DashboardView: React.FC<Props> = ({
  role,
  kpi,
  severityData,
  categoryData,
  workflowFunnel,
  trends,
  entityRankings,
  findings,
  onSelectFinding,
  onNavigateToCategory,
  onNavigateToEntity,
  onNavigateToSeverity
}) => {
  const [trendMetric, setTrendMetric] = useState<'duration' | 'sla' | 'findings' | 'volume'>('duration');
  const isLeadExaminer = role === 'Lead Examiner';
  const isSupervisor = role === 'SOC Supervisor';
  const isAuditor = role === 'Auditor';
  const roleContent = {
    'Lead Examiner': {
      title: 'Supervisory Operational Posture',
      badge: 'Evidence Evaluation Window',
      description: 'Cross-entity supervisory review of workflow execution gaps, missing expected evidence, and operational anomalies requiring examiner verification.',
      progressLabel: 'Examiner Review Progress',
      entityQuestion: 'Which entities require examiner attention first?',
      findingsTitle: 'Prioritized Supervisory Signals Requiring Examiner Review',
      findingsDescription: 'Select a signal to review the evidence dossier, reconstructed workflow comparison, and examiner decision controls.',
      access: ['All CSEs', 'All SOC cases', 'All findings and investigations', 'All evidence', 'Risk scores', 'Peer comparison', 'Review queue', 'Request evidence', 'Confirm / reject findings', 'Generate reports', 'Audit trail', 'AI/ML reasoning'],
      restrictions: []
    },
    'SOC Supervisor': {
      title: 'Supervisory Control Center',
      badge: 'Assigned Portfolio Scope',
      description: 'Monitor assigned entities, evidence quality, and unresolved supervisory signals within your operational portfolio.',
      progressLabel: 'Portfolio Resolution Progress',
      entityQuestion: 'Which assigned entities require supervisor attention first?',
      findingsTitle: 'Assigned Signals Requiring Supervisor Action',
      findingsDescription: 'Select a signal to inspect the evidence dossier and submit clarification or supporting evidence for your assigned portfolio.',
      access: ['Own CSE and SOC scope', 'Own cases, investigations, and findings', 'Related evidence', 'Finding rationale', 'Submit clarification', 'Upload supporting evidence', 'Respond to examiner requests', 'Own operational analytics', 'Own activity history'],
      restrictions: ['Other CSEs or SOCs', 'Final finding decisions', 'Peer comparison', 'Risk-score modification', 'Assessment reports']
    },
    Auditor: {
      title: 'Independent Audit Overview',
      badge: 'Read-Only Evidence Scope',
      description: 'Review supervisory signals, entity risk concentration, and evidence traceability without changing operational decisions.',
      progressLabel: 'Evidence Review Coverage',
      entityQuestion: 'Which entities require audit attention first?',
      findingsTitle: 'Signals Available for Independent Audit',
      findingsDescription: 'Select a signal to inspect its evidence dossier and decision history. Audit access is read-only.',
      access: ['CSE assessment records', 'Cases, findings, and evidence', 'Reports', 'Audit trail', 'Data lineage', 'Finding history', 'AI/ML traceability', 'Assessment activity history'],
      restrictions: ['Modify records', 'Confirm or reject findings', 'Submit SOC responses', 'Upload evidence', 'Change risk scores or analytics', 'Delete records']
    }
  }[role];

  const getMetricLabel = () => {
    switch (trendMetric) {
      case 'duration': return 'Avg Investigation Minutes';
      case 'sla': return 'SLA Breach Rate (%)';
      case 'findings': return 'Supervisory Findings Count';
      case 'volume': return 'Case Ingestion Volume';
    }
  };

  const getMetricDataKey = () => {
    switch (trendMetric) {
      case 'duration': return 'avgInvestigationDuration';
      case 'sla': return 'slaBreachRate';
      case 'findings': return 'findingCount';
      case 'volume': return 'caseVolume';
    }
  };

  const getMetricColor = () => {
    switch (trendMetric) {
      case 'duration': return '#38bdf8';
      case 'sla': return '#f59e0b';
      case 'findings': return '#ef4444';
      case 'volume': return '#a855f7';
    }
  };

  return (
    <div className={`${isLeadExaminer ? 'space-y-5' : 'space-y-6'} pb-12`}>
      {/* Supervisory Scope Callout */}
      <div className="rounded-lg border border-red-900/40 bg-zinc-900/90 p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-md bg-red-950 border border-red-800 text-red-400 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold uppercase tracking-wider text-zinc-100 flex items-center gap-2">
              <span>{roleContent.title}</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 font-mono font-normal">
                {roleContent.badge}
              </span>
              {isLeadExaminer && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-red-950 text-red-300 border border-red-800 font-mono font-normal">
                  EXECUTIVE SUMMARY
                </span>
              )}
            </h1>
            <p className="text-xs text-zinc-400 mt-1 max-w-3xl">
              {roleContent.description}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0 self-end md:self-center">
          <div className="text-right">
            <div className="text-[11px] uppercase tracking-wider text-zinc-500 font-medium">{roleContent.progressLabel}</div>
            <div className="text-xs font-bold text-zinc-200">
              {kpi.reviewedFindingsCount} of {kpi.totalFindings} Signals Addressed
            </div>
          </div>
        </div>
      </div>

      {/* Role workspace: each role starts from a different operational question */}
      {!isLeadExaminer && <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {isLeadExaminer && (
          <>
            <div className="rounded-lg border border-red-900/50 bg-red-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-red-300">Review queue</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.pendingReviewCount} pending decisions</div>
              <div className="mt-1 text-[11px] text-zinc-400">Confirm, reject, or request evidence from the examiner queue.</div>
            </div>
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Risk focus</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.criticalFindings} critical signals</div>
              <div className="mt-1 text-[11px] text-zinc-400">Cross-entity risk scores requiring supervisory attention.</div>
            </div>
            <div className="rounded-lg border border-blue-900/50 bg-blue-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-blue-300">Peer comparison</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{entityRankings.length} entities ranked</div>
              <div className="mt-1 text-[11px] text-zinc-400">Compare priority exposure across the full regulated scope.</div>
            </div>
          </>
        )}
        {isSupervisor && (
          <>
            <div className="rounded-lg border border-emerald-900/50 bg-emerald-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Assigned portfolio</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.totalCases} active cases</div>
              <div className="mt-1 text-[11px] text-zinc-400">Work only within your assigned CSE and SOC scope.</div>
            </div>
            <div className="rounded-lg border border-amber-900/50 bg-amber-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Evidence response</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.pendingReviewCount} open signals</div>
              <div className="mt-1 text-[11px] text-zinc-400">Submit clarification or supporting evidence to the examiner.</div>
            </div>
            <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-sky-300">Operations</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.slaBreachRate}% SLA exposure</div>
              <div className="mt-1 text-[11px] text-zinc-400">Monitor workflow delays across your own operational portfolio.</div>
            </div>
          </>
        )}
        {isAuditor && (
          <>
            <div className="rounded-lg border border-sky-900/50 bg-sky-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-sky-300">Evidence coverage</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{findings.filter(f => f.evidenceStrength === 'STRONG' || f.evidenceStrength === 'DEFINITIVE').length} strong records</div>
              <div className="mt-1 text-[11px] text-zinc-400">Inspect supporting evidence without changing the assessment.</div>
            </div>
            <div className="rounded-lg border border-zinc-700 bg-zinc-900/70 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-zinc-300">Decision history</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{kpi.reviewedFindingsCount} reviewed signals</div>
              <div className="mt-1 text-[11px] text-zinc-400">Trace finding status and reviewer activity in read-only mode.</div>
            </div>
            <div className="rounded-lg border border-purple-900/50 bg-purple-950/20 p-4">
              <div className="text-[10px] uppercase tracking-wider font-bold text-purple-300">Model traceability</div>
              <div className="mt-2 text-lg font-bold text-zinc-100">{findings.filter(f => f.mlAnomalySignal).length} traced signals</div>
              <div className="mt-1 text-[11px] text-zinc-400">Review AI/ML rationale and data lineage; no edits permitted.</div>
            </div>
          </>
        )}
      </div>}

      {isLeadExaminer ? <>
      {/* KPI Cards: executive summary */}
      <div className={`grid grid-cols-2 sm:grid-cols-4 ${isLeadExaminer ? 'lg:grid-cols-4' : 'lg:grid-cols-8'} gap-3`}>
        <StatCard
          title="Entities"
          value={kpi.totalEntities}
          subtext={isSupervisor ? 'Assigned CSE scope' : isAuditor ? 'Assessment scope' : 'Regulated scope'}
          icon={Building2}
          variant="default"
        />
        {!isLeadExaminer && <StatCard
          title="Alerts"
          value={kpi.totalAlerts}
          subtext={isSupervisor ? 'Portfolio inputs' : isAuditor ? 'Traceable inputs' : 'Triaged inputs'}
          icon={Bell}
          variant="default"
        />}
        <StatCard
          title="Cases"
          value={kpi.totalCases}
          subtext={isSupervisor ? 'Assigned tickets' : isAuditor ? 'Read-only records' : 'Operational tickets'}
          icon={Briefcase}
          variant="default"
        />
        {!isLeadExaminer && <StatCard
          title="Investigations"
          value={kpi.totalInvestigations}
          subtext={isAuditor ? 'Auditable analyses' : 'Completed analyses'}
          icon={Search}
          variant="default"
        />}
        <StatCard
          title="Total Signals"
          value={kpi.totalFindings}
          subtext="Potential gaps"
          icon={AlertOctagon}
          variant={kpi.totalFindings > 0 ? 'warning' : 'success'}
        />
        {!isAuditor && <StatCard
          title="High Priority"
          value={kpi.highFindings}
          subtext="Elevated risk"
          icon={AlertTriangle}
          variant={kpi.highFindings > 0 ? 'warning' : 'default'}
          onClick={() => onNavigateToSeverity('HIGH')}
        />}
        <StatCard
          title="Critical"
          value={kpi.criticalFindings}
          subtext="Immediate review"
          icon={ShieldAlert}
          variant={kpi.criticalFindings > 0 ? 'danger' : 'default'}
          onClick={() => onNavigateToSeverity('CRITICAL')}
        />
        {!isAuditor && <StatCard
          title="SLA Breach"
          value={`${kpi.slaBreachRate}%`}
          subtext="Delay exposure"
          icon={Clock}
          variant={kpi.slaBreachRate > 15 ? 'danger' : 'default'}
          onClick={() => onNavigateToCategory('SLA Breach')}
        />}
      </div>

      {/* Primary Analytics Charts Row */}
      <div className={`grid grid-cols-1 ${isLeadExaminer ? 'lg:grid-cols-2' : 'lg:grid-cols-3'} gap-6`}>
        {/* Chart 1: Findings by Severity */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 1: Findings by Severity
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "How serious are the detected supervisory signals?"
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="severity" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="count"
                  radius={[4, 4, 0, 0]}
                  onClick={(entry) => onNavigateToSeverity(entry.severity.toUpperCase())}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Click any bar to filter matching findings</span>
            <span className="font-mono text-zinc-500">N={kpi.totalFindings} Signals</span>
          </div>
        </div>

        {/* Chart 2: Findings by Category */}
        {!isAuditor && <>
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 2: Findings by Category
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "What type of supervisory signals are occurring?"
              </span>
            </div>
          </div>

          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 15, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
                <YAxis dataKey="category" type="category" stroke="#71717a" fontSize={10} width={95} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="count"
                  fill="#f43f5e"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry) => onNavigateToCategory(entry.category)}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Select category to view rule logic</span>
            <span className="font-mono text-zinc-500">{categoryData.length} Categories</span>
          </div>
        </div>
        </>}

        {/* Chart 3: Workflow Completion Funnel */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 flex flex-col justify-between shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                {isAuditor ? 'Chart 3: Evidence Traceability' : isSupervisor ? 'Chart 3: Assigned Workflow Completion' : 'Chart 3: Workflow Completion'}
              </span>
              <span className="text-[11px] text-zinc-500">
                {isAuditor
                  ? 'Read-only view of evidence strength across assessed signals.'
                  : isSupervisor
                  ? 'Question: "Where is my assigned SOC workflow breaking down?"'
                  : 'Question: "Where is the SOC workflow breaking down?"'}
              </span>
            </div>
          </div>

          <div className="space-y-2.5 py-1">
            {isAuditor ? (
              <>
                {(['DEFINITIVE', 'STRONG', 'MODERATE', 'WEAK'] as const).map(strength => {
                  const count = findings.filter(f => f.evidenceStrength === strength).length;
                  const percentage = findings.length ? Math.round((count / findings.length) * 100) : 0;
                  return (
                    <div key={strength} className="rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-semibold text-zinc-200">{strength} evidence</span>
                        <span className="font-mono font-bold text-sky-300">{count} records</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-sky-500" style={{ width: `${Math.max(count ? 5 : 0, percentage)}%` }} />
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-1 font-mono">Coverage: {percentage}%</div>
                    </div>
                  );
                })}
              </>
            ) : workflowFunnel.map((step, idx) => (
              <div
                key={idx}
                onClick={() => {
                  if (step.step.includes('Escalation')) onNavigateToCategory('Execution Gap');
                  else if (step.step.includes('Investigation')) onNavigateToCategory('Missing Evidence');
                }}
                className="group cursor-pointer rounded-lg border border-zinc-800/80 bg-zinc-900/60 p-2 hover:border-zinc-700 transition"
              >
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-semibold text-zinc-200 group-hover:text-red-300 transition">
                    {step.step}
                  </span>
                  <span className={`font-mono font-bold ${step.conversionRate < 70 ? 'text-rose-400' : 'text-emerald-400'}`}>
                    {step.conversionRate}%
                  </span>
                </div>
                <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${step.conversionRate < 70 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.max(5, step.conversionRate)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500 mt-1 font-mono">
                  <span>In: {step.sourceCount}</span>
                  <span>Out: {step.targetCount}</span>
                  <span className="text-zinc-400 font-sans">Drop: {step.dropOffRate}%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-2 border-t border-zinc-850 text-[11px] text-zinc-400 flex justify-between">
            <span>{isAuditor ? 'Read-only evidence inspection' : 'Interactive funnel: Click step to view gaps'}</span>
            <span className="font-mono text-zinc-500">{isAuditor ? `${findings.length} Signals Audited` : '4-Stage Pipeline'}</span>
          </div>
        </div>
      </div>

      </> : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {isSupervisor ? (
            <>
              <div className="rounded-xl border border-emerald-900/60 bg-emerald-950/20 p-5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-emerald-300">Assigned operations</div>
                <div className="mt-3 grid grid-cols-3 gap-3">
                  <div><div className="text-2xl font-bold text-zinc-100">{kpi.totalCases}</div><div className="text-[10px] text-zinc-400">Cases</div></div>
                  <div><div className="text-2xl font-bold text-zinc-100">{kpi.totalInvestigations}</div><div className="text-[10px] text-zinc-400">Investigations</div></div>
                  <div><div className="text-2xl font-bold text-amber-300">{kpi.slaBreachRate}%</div><div className="text-[10px] text-zinc-400">SLA breach</div></div>
                </div>
                <div className="mt-4 h-2 rounded-full bg-zinc-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${Math.max(8, 100 - kpi.slaBreachRate)}%` }} /></div>
                <div className="mt-2 text-[11px] text-zinc-400">Portfolio health based on your assigned CSE/SOC cases.</div>
              </div>
              <div className="rounded-xl border border-amber-900/60 bg-amber-950/20 p-5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-amber-300">Evidence response queue</div>
                <div className="mt-3 text-3xl font-bold text-zinc-100">{kpi.pendingReviewCount}</div>
                <div className="text-xs text-zinc-300">Signals requiring clarification or supporting evidence</div>
                <button onClick={() => onNavigateToSeverity('HIGH')} className="mt-4 rounded-md border border-amber-800 px-3 py-2 text-xs font-semibold text-amber-200 hover:bg-amber-950">Open assigned signals</button>
              </div>
            </>
          ) : (
            <>
              <div className="rounded-xl border border-sky-900/60 bg-sky-950/20 p-5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-sky-300">Read-only evidence coverage</div>
                <div className="mt-3 text-3xl font-bold text-zinc-100">{findings.length}</div>
                <div className="text-xs text-zinc-300">Signals available for audit inspection</div>
                <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]">
                  {(['DEFINITIVE', 'STRONG', 'MODERATE', 'WEAK'] as const).map(strength => (
                    <div key={strength} className="rounded bg-zinc-900/80 p-2"><div className="font-bold text-sky-300">{findings.filter(f => f.evidenceStrength === strength).length}</div><div className="mt-1 text-zinc-500">{strength}</div></div>
                  ))}
                </div>
              </div>
              <div className="rounded-xl border border-purple-900/60 bg-purple-950/20 p-5">
                <div className="text-[10px] uppercase tracking-wider font-bold text-purple-300">Audit traceability</div>
                <div className="mt-3 space-y-3 text-xs text-zinc-300">
                  <div className="flex justify-between"><span>Reviewed decisions</span><strong>{kpi.reviewedFindingsCount}</strong></div>
                  <div className="flex justify-between"><span>AI/ML traces</span><strong>{findings.filter(f => f.mlAnomalySignal).length}</strong></div>
                  <div className="flex justify-between"><span>Evidence records</span><strong>{findings.reduce((total, finding) => total + finding.supportingEvidence.length, 0)}</strong></div>
                </div>
                <div className="mt-4 text-[11px] text-zinc-400">Use Audit Trail, Reports, and Findings from the sidebar. No mutation controls are available.</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Secondary analytics remain available from the sidebar for Lead Examiner. */}
      {!isLeadExaminer && <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: Operational Trend */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 4: Operational Trend
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "Is operational performance improving or deteriorating?"
              </span>
            </div>

            {/* Metric Selector Buttons */}
            <div className="flex items-center gap-1 bg-zinc-900 border border-zinc-800 p-1 rounded-lg">
              <button
                onClick={() => setTrendMetric('duration')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'duration' ? 'bg-zinc-800 text-sky-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Duration
              </button>
              <button
                onClick={() => setTrendMetric('sla')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'sla' ? 'bg-zinc-800 text-amber-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                SLA %
              </button>
              <button
                onClick={() => setTrendMetric('findings')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'findings' ? 'bg-zinc-800 text-rose-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Signals
              </button>
              <button
                onClick={() => setTrendMetric('volume')}
                className={`px-2 py-1 text-[10px] font-semibold rounded ${
                  trendMetric === 'volume' ? 'bg-zinc-800 text-purple-300' : 'text-zinc-400 hover:text-zinc-200'
                }`}
              >
                Volume
              </button>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trends} margin={{ top: 10, right: 20, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                />
                <Line
                  type="monotone"
                  dataKey={getMetricDataKey()}
                  name={getMetricLabel()}
                  stroke={getMetricColor()}
                  strokeWidth={2.5}
                  dot={{ fill: getMetricColor(), r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Tracking: {getMetricLabel()}</span>
            <span className="font-mono text-zinc-500">7 Time Intervals</span>
          </div>
        </div>

        {/* Chart 5: Entity Priority Ranking */}
        <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className="text-xs font-bold text-zinc-200 uppercase tracking-wider block">
                Chart 5: Entity Priority Ranking
              </span>
              <span className="text-[11px] text-zinc-500">
                Question: "{roleContent.entityQuestion}"
              </span>
            </div>
          </div>

          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={entityRankings} layout="vertical" margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" horizontal={false} />
                <XAxis type="number" stroke="#71717a" domain={[0, 100]} fontSize={11} tickLine={false} />
                <YAxis dataKey="entityName" type="category" stroke="#71717a" fontSize={10} width={130} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
                  cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                />
                <Bar
                  dataKey="priorityScore"
                  name="Priority Risk Score (0-100)"
                  fill="#ea580c"
                  radius={[0, 4, 4, 0]}
                  onClick={(entry) => onNavigateToEntity(entry.entityId)}
                  className="cursor-pointer hover:opacity-85 transition"
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
            <span>Click entity to inspect findings dossier</span>
            <span className="font-mono text-zinc-500">Score Range: 0-100</span>
          </div>
        </div>
      </div>}

      {/* Detailed findings stay in the sidebar's Findings and Review Queue modules. */}
      {!isLeadExaminer && <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-red-400" />
              <span>{roleContent.findingsTitle}</span>
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              {roleContent.findingsDescription}
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {findings.length} Signals Generated
          </span>
        </div>

        <div className="overflow-x-auto rounded-lg border border-zinc-850">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-2.5 px-3">Finding ID</th>
                <th className="py-2.5 px-3">Regulated Entity</th>
                <th className="py-2.5 px-3">Signal Title</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Priority Score</th>
                <th className="py-2.5 px-3">Evidence</th>
                <th className="py-2.5 px-3">Review Status</th>
                <th className="py-2.5 px-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-sans">
              {findings.map(f => (
                <tr
                  key={f.id}
                  onClick={() => onSelectFinding(f)}
                  className="hover:bg-zinc-900/80 cursor-pointer transition"
                >
                  <td className="py-2.5 px-3 font-mono text-zinc-300 font-medium">{f.id}</td>
                  <td className="py-2.5 px-3 text-zinc-200 font-medium">{f.entityName}</td>
                  <td className="py-2.5 px-3 text-zinc-100 font-semibold">{f.title}</td>
                  <td className="py-2.5 px-3">
                    <CategoryBadge category={f.category} size="sm" />
                  </td>
                  <td className="py-2.5 px-3">
                    <SeverityBadge severity={f.severity} size="sm" />
                  </td>
                  <td className="py-2.5 px-3 font-mono font-bold text-red-300">
                    {f.priorityScore} <span className="text-[10px] text-zinc-500 font-normal">({f.priorityLevel})</span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {f.evidenceStrength}
                    </span>
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        f.reviewStatus === 'CONFIRMED'
                          ? 'bg-red-950 text-red-300 border border-red-800'
                          : f.reviewStatus === 'REJECTED'
                          ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                          : f.reviewStatus === 'NEEDS_EVIDENCE'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-blue-950 text-blue-300 border border-blue-800'
                      }`}
                    >
                      {f.reviewStatus}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectFinding(f);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-400 hover:text-red-300"
                    >
                      <span>Inspect</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>}
    </div>
  );
};
