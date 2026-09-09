import React, { useState } from 'react';
import { SupervisoryFinding, ReviewStatus } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { CategoryBadge } from '../common/CategoryBadge';
import { CheckSquare, Clock, CheckCircle2, XCircle, RotateCcw, ArrowRight, UserCheck } from 'lucide-react';

interface Props {
  findings: SupervisoryFinding[];
  onSelectFinding: (finding: SupervisoryFinding) => void;
}

export const ReviewQueueView: React.FC<Props> = ({ findings, onSelectFinding }) => {
  const [activeTab, setActiveTab] = useState<ReviewStatus>('PENDING');

  const filtered = findings.filter(f => f.reviewStatus === activeTab);

  const counts = {
    PENDING: findings.filter(f => f.reviewStatus === 'PENDING').length,
    CONFIRMED: findings.filter(f => f.reviewStatus === 'CONFIRMED').length,
    REJECTED: findings.filter(f => f.reviewStatus === 'REJECTED').length,
    NEEDS_EVIDENCE: findings.filter(f => f.reviewStatus === 'NEEDS_EVIDENCE').length
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-red-400" />
            <span>Human Examiner Review & Triage Queue</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Every supervisory signal must be formally verified or dismissed by an authorized human examiner before any regulatory action.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
        <button
          onClick={() => setActiveTab('PENDING')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'PENDING'
              ? 'bg-blue-950 text-blue-200 border border-blue-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5 text-blue-400" />
          <span>Pending Review</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-blue-900/60 font-mono">
            {counts.PENDING}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('CONFIRMED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'CONFIRMED'
              ? 'bg-red-950 text-red-200 border border-red-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-red-400" />
          <span>Confirmed Violations</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-red-900/60 font-mono">
            {counts.CONFIRMED}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('NEEDS_EVIDENCE')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'NEEDS_EVIDENCE'
              ? 'bg-amber-950 text-amber-200 border border-amber-700/60 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 text-amber-400" />
          <span>Awaiting Evidence</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-amber-900/60 font-mono">
            {counts.NEEDS_EVIDENCE}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('REJECTED')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition ${
            activeTab === 'REJECTED'
              ? 'bg-zinc-800 text-zinc-100 border border-zinc-600 shadow-sm'
              : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5 text-zinc-400" />
          <span>Dismissed / Rejected</span>
          <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-zinc-700 font-mono">
            {counts.REJECTED}
          </span>
        </button>
      </div>

      {/* Queue Cards */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map(f => (
          <div
            key={f.id}
            onClick={() => onSelectFinding(f)}
            className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-4 hover:border-zinc-700 hover:bg-zinc-900/60 transition shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4"
          >
            <div className="space-y-1.5 flex-1">
              <div className="flex items-center gap-3">
                <span className="text-xs font-mono font-bold text-zinc-300">{f.id}</span>
                <span className="text-xs text-zinc-400 font-medium">• {f.entityName}</span>
                <span className="text-xs font-mono text-zinc-500">• Case {f.caseNumber}</span>
                <CategoryBadge category={f.category} size="sm" />
                <SeverityBadge severity={f.severity} size="sm" />
              </div>

              <h3 className="text-sm font-bold text-zinc-100 group-hover:text-red-300 transition">
                {f.title}
              </h3>

              <p className="text-xs text-zinc-400 line-clamp-2">{f.whatHappened}</p>

              {f.reviewDecision && (
                <div className="mt-2 pt-2 border-t border-zinc-850 flex flex-wrap items-center gap-4 text-[11px] text-zinc-400">
                  <span className="flex items-center gap-1 text-zinc-300">
                    <UserCheck className="w-3.5 h-3.5 text-red-400" />
                    <strong>Reviewer:</strong> {f.reviewDecision.reviewerName} ({f.reviewDecision.reviewerId})
                  </span>
                  <span>
                    <strong>Timestamp:</strong> {new Date(f.reviewDecision.reviewedAt).toLocaleString()}
                  </span>
                  {f.reviewDecision.notes && (
                    <span className="italic text-zinc-300">"{f.reviewDecision.notes}"</span>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col items-end justify-between self-stretch flex-shrink-0">
              <div className="text-right font-mono">
                <span className="text-[10px] uppercase text-zinc-500 block">Priority Score</span>
                <span className="text-sm font-bold text-red-400">{f.priorityScore} / 100</span>
              </div>

              <button
                onClick={e => {
                  e.stopPropagation();
                  onSelectFinding(f);
                }}
                className="mt-3 flex items-center gap-1 text-xs font-semibold text-red-400 hover:text-red-300 transition"
              >
                <span>{activeTab === 'PENDING' ? 'Perform Review' : 'Edit Decision'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            No findings currently in the <strong>{activeTab}</strong> queue.
          </div>
        )}
      </div>
    </div>
  );
};
