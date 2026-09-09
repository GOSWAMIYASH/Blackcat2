import React from 'react';
import { ArrowRight, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react';

interface Props {
  expectedWorkflow: string[];
  observedWorkflow: string[];
  className?: string;
}

export const WorkflowDiagram: React.FC<Props> = ({ expectedWorkflow, observedWorkflow, className = '' }) => {
  return (
    <div className={`space-y-4 rounded-lg border border-zinc-800 bg-zinc-950 p-4 ${className}`}>
      {/* Expected Sequence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
            Expected Standard SOC Workflow
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Prescribed Baseline</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {expectedWorkflow.map((stage, idx) => (
            <React.Fragment key={`exp-${stage}-${idx}`}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-950/40 border border-emerald-700/50 text-emerald-300 text-xs font-medium shadow-sm">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>{stage}</span>
              </div>
              {idx < expectedWorkflow.length - 1 && (
                <ArrowRight className="w-4 h-4 text-zinc-600 flex-shrink-0" />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="border-t border-zinc-800/80 my-2" />

      {/* Observed Sequence */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold tracking-wider text-amber-400 uppercase">
            Observed Operational Workflow
          </span>
          <span className="text-[11px] text-zinc-500 font-mono">Reconstructed Evidence</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {expectedWorkflow.map((stage, idx) => {
            const isObserved = observedWorkflow.includes(stage);
            return (
              <React.Fragment key={`obs-${stage}-${idx}`}>
                <div
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium border shadow-sm ${
                    isObserved
                      ? 'bg-zinc-900 border-zinc-700 text-zinc-200'
                      : 'bg-rose-950/60 border-rose-600/80 text-rose-300 ring-1 ring-rose-500/40'
                  }`}
                >
                  {isObserved ? (
                    <CheckCircle2 className="w-3.5 h-3.5 text-zinc-400" />
                  ) : (
                    <XCircle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
                  )}
                  <span className={!isObserved ? 'font-semibold line-through decoration-rose-500' : ''}>
                    {stage}
                  </span>
                  {!isObserved && (
                    <span className="ml-1 text-[10px] uppercase font-bold text-rose-400 bg-rose-900/60 px-1 py-0.5 rounded">
                      Gapped
                    </span>
                  )}
                </div>
                {idx < expectedWorkflow.length - 1 && (
                  <ArrowRight
                    className={`w-4 h-4 flex-shrink-0 ${
                      isObserved ? 'text-zinc-600' : 'text-rose-700/60'
                    }`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
