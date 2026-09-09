import React from 'react';
import { NegativeSpaceRow, SupervisoryFinding } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { CheckCircle2, XCircle, AlertTriangle, Grid, Info, ArrowRight, ShieldAlert } from 'lucide-react';

interface Props {
  matrix: NegativeSpaceRow[];
  findings: SupervisoryFinding[];
  onSelectFindingId: (findingId: string) => void;
  onOpenFindingByCase: (finding: SupervisoryFinding) => void;
}

export const NegativeSpaceView: React.FC<Props> = ({
  matrix,
  findings,
  onSelectFindingId,
  onOpenFindingByCase
}) => {
  const renderStatusCell = (
    status: 'PRESENT' | 'MISSING' | 'ABNORMAL',
    associatedIds: string[] = [],
    stageName: string
  ) => {
    if (status === 'PRESENT') {
      return (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 font-medium text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>Present</span>
        </div>
      );
    }

    if (status === 'MISSING') {
      const hasLink = associatedIds && associatedIds.length > 0;
      return (
        <button
          onClick={() => {
            if (hasLink) onSelectFindingId(associatedIds[0]);
          }}
          className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md bg-rose-950/70 border border-rose-700 text-rose-200 font-bold text-xs transition shadow-sm ${
            hasLink ? 'hover:bg-rose-900/80 hover:scale-[1.02] cursor-pointer' : ''
          }`}
        >
          <div className="flex items-center gap-1.5">
            <XCircle className="w-4 h-4 text-rose-400 animate-pulse" />
            <span>Missing</span>
          </div>
          {hasLink && (
            <span className="text-[10px] font-mono text-rose-300 underline flex items-center gap-0.5">
              <span>View Finding</span>
              <ArrowRight className="w-3 h-3" />
            </span>
          )}
        </button>
      );
    }

    // ABNORMAL
    const hasLink = associatedIds && associatedIds.length > 0;
    return (
      <button
        onClick={() => {
          if (hasLink) onSelectFindingId(associatedIds[0]);
        }}
        className={`flex items-center justify-between w-full px-3 py-1.5 rounded-md bg-amber-950/70 border border-amber-700 text-amber-200 font-bold text-xs transition shadow-sm ${
          hasLink ? 'hover:bg-amber-900/80 hover:scale-[1.02] cursor-pointer' : ''
        }`}
      >
        <div className="flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-amber-400" />
          <span>Abnormal</span>
        </div>
        {hasLink && (
          <span className="text-[10px] font-mono text-amber-300 underline flex items-center gap-0.5">
            <span>View Finding</span>
            <ArrowRight className="w-3 h-3" />
          </span>
        )}
      </button>
    );
  };

  const totalMissing = matrix.reduce(
    (acc, row) =>
      acc +
      (row.investigationStatus === 'MISSING' ? 1 : 0) +
      (row.escalationStatus === 'MISSING' ? 1 : 0) +
      (row.closureStatus === 'MISSING' ? 1 : 0),
    0
  );

  const totalAbnormal = matrix.reduce(
    (acc, row) =>
      acc +
      (row.investigationStatus === 'ABNORMAL' ? 1 : 0) +
      (row.escalationStatus === 'ABNORMAL' ? 1 : 0) +
      (row.closureStatus === 'ABNORMAL' ? 1 : 0),
    0
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Core Philosophy */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-950/70 border border-indigo-700/60 text-indigo-400">
              <Grid className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider">
                  Negative-Space Operational Matrix
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                  Signature SAT-SA Feature
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Core Question: <em>"What expected operational evidence or mandatory lifecycle activity is missing?"</em>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono">
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Negative Space Deficits</span>
              <span className="text-rose-400 font-bold">{totalMissing} Missing Stages</span>
            </div>
            <div className="text-right">
              <span className="text-zinc-500 block text-[10px] uppercase">Abnormal Behaviors</span>
              <span className="text-amber-400 font-bold">{totalAbnormal} Outliers</span>
            </div>
          </div>
        </div>

        {/* Mandatory Supervisory Disclaimer */}
        <div className="rounded-lg border border-indigo-900/50 bg-indigo-950/30 p-3.5 flex items-start gap-3">
          <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-200/90 leading-relaxed">
            <strong>Supervisory Caution:</strong> Missing evidence or an incomplete activity stage does{' '}
            <strong>NOT</strong> automatically prove an organizational compliance violation. Missing items are labeled
            strictly as <em>"Potential supervisory signals — examiner review required"</em>. Click any missing or abnormal cell
            to drill into the supporting forensics and trigger the human review workflow.
          </p>
        </div>
      </div>

      {/* The Matrix Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        <div className="border-b border-zinc-800 bg-zinc-900/80 px-4 py-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-200">
            Regulated Critical Infrastructure Matrix ({matrix.length} Entities)
          </span>
          <div className="flex items-center gap-4 text-xs text-zinc-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Present</span>
            </div>
            <div className="flex items-center gap-1.5">
              <XCircle className="w-3.5 h-3.5 text-rose-400" />
              <span>Missing Gap</span>
            </div>
            <div className="flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Abnormal</span>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400 font-mono text-[11px] uppercase bg-zinc-900/40">
                <th className="py-3 px-4">Regulated Entity</th>
                <th className="py-3 px-4">Criticality</th>
                <th className="py-3 px-4">Investigation Phase</th>
                <th className="py-3 px-4">Escalation Phase</th>
                <th className="py-3 px-4">Closure Phase</th>
                <th className="py-3 px-4 text-right">Signals</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-sans">
              {matrix.map((row) => (
                <tr key={row.entityId} className="hover:bg-zinc-900/50 transition">
                  <td className="py-3 px-4">
                    <div className="font-semibold text-zinc-100">{row.entityName}</div>
                    <div className="text-[11px] font-mono text-zinc-500">{row.entityId}</div>
                  </td>
                  <td className="py-3 px-4">
                    <SeverityBadge severity={row.severity} size="sm" />
                  </td>
                  <td className="py-3 px-4 w-60">
                    {renderStatusCell(row.investigationStatus, row.associatedFindingIds.investigation, 'Investigation')}
                  </td>
                  <td className="py-3 px-4 w-60">
                    {renderStatusCell(row.escalationStatus, row.associatedFindingIds.escalation, 'Escalation')}
                  </td>
                  <td className="py-3 px-4 w-60">
                    {renderStatusCell(row.closureStatus, row.associatedFindingIds.closure, 'Closure')}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-zinc-300">
                    {row.findingCount > 0 ? (
                      <span className="px-2 py-0.5 rounded bg-red-950/80 border border-red-800 text-red-300">
                        {row.findingCount} Signals
                      </span>
                    ) : (
                      <span className="text-zinc-600">0</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Linked Supervisory Findings for Quick Action */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-red-400" />
          <span>Active Negative-Space Supervisory Findings</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {findings
            .filter(f => f.category === 'Execution Gap' || f.category === 'Missing Evidence')
            .map(f => (
              <div
                key={f.id}
                onClick={() => onOpenFindingByCase(f)}
                className="group cursor-pointer rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 hover:border-zinc-700 hover:bg-zinc-900 transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-mono text-zinc-400">{f.id} • {f.entityName}</span>
                    <SeverityBadge severity={f.severity} size="sm" />
                  </div>
                  <h4 className="text-xs font-bold text-zinc-100 group-hover:text-red-300 transition">
                    {f.title}
                  </h4>
                  <p className="text-[11px] text-zinc-400 mt-1 line-clamp-2">
                    {f.whatHappened}
                  </p>
                </div>

                <div className="mt-3 pt-2 border-t border-zinc-800 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-500 font-mono">
                    Priority Score: <strong className="text-red-300">{f.priorityScore}</strong>
                  </span>
                  <span className="text-red-400 group-hover:translate-x-0.5 transition font-semibold flex items-center gap-1">
                    <span>Inspect Evidence</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
};
