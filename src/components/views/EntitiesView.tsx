import React from 'react';
import { Entity } from '../../types';
import { SeverityBadge } from '../common/SeverityBadge';
import { Building2, ShieldAlert, ArrowRight, Clock, AlertTriangle } from 'lucide-react';

interface Props {
  entities: Entity[];
  onSelectEntity: (entityId: string) => void;
}

export const EntitiesView: React.FC<Props> = ({ entities, onSelectEntity }) => {
  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-5 h-5 text-red-400" />
            <span>Regulated Critical Infrastructure Entities</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Designated strategic sectors subject to mandatory periodic SOC operational review and supervisory compliance oversight.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {entities.length} Strategic Entities
        </span>
      </div>

      {/* Grid of Entity Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {entities.map(e => (
          <div
            key={e.id}
            onClick={() => onSelectEntity(e.id)}
            className="group cursor-pointer rounded-xl border border-zinc-800 bg-zinc-950 p-5 hover:border-zinc-700 hover:bg-zinc-900/60 transition shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                  {e.code}
                </span>
                <SeverityBadge severity={e.criticality} size="sm" />
              </div>

              <h2 className="text-sm font-bold text-zinc-100 group-hover:text-red-300 transition">
                {e.name}
              </h2>
              <span className="text-[11px] text-zinc-500 font-mono block mt-0.5">
                Sector: {e.sector}
              </span>

              <div className="mt-4 pt-3 border-t border-zinc-850 grid grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">Active Cases</div>
                  <div className="text-sm font-bold text-zinc-200">{e.activeCases}</div>
                </div>

                <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">Signals</div>
                  <div className={`text-sm font-bold ${e.totalFindings > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                    {e.totalFindings}
                  </div>
                </div>

                <div className="rounded-lg bg-zinc-900 p-2 border border-zinc-800/80">
                  <div className="text-[10px] uppercase text-zinc-500 font-mono">SLA Breach</div>
                  <div className={`text-sm font-bold ${e.slaBreachRate > 15 ? 'text-amber-400' : 'text-zinc-200'}`}>
                    {e.slaBreachRate}%
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-zinc-850 flex items-center justify-between text-[11px] text-zinc-400">
              <span className="flex items-center gap-1 font-mono text-[10px]">
                <Clock className="w-3 h-3 text-zinc-500" />
                <span>Last Evaluated: {new Date(e.lastAssessedAt).toLocaleDateString()}</span>
              </span>
              <span className="text-red-400 font-semibold flex items-center gap-1 group-hover:translate-x-0.5 transition">
                <span>View Signals</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
