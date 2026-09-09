import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { BarChart3, Activity, Sparkles, TrendingUp, Clock, AlertCircle } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const AnalyticsView: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [mlAnomalies, setMLAnomalies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [statsData, mlData] = await Promise.all([
          api.getFullStatistics(),
          api.getMLAnomalies()
        ]);
        setStats(statsData);
        setMLAnomalies(mlData);
      } catch (err) {
        console.error('Analytics load error:', err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading || !stats) {
    return (
      <div className="py-16 text-center text-xs text-zinc-500 font-mono">
        Loading statistical analytics models...
      </div>
    );
  }

  const { durations, analystWorkload } = stats;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div>
        <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-red-400" />
          <span>Operational Statistics & Behavioral Outlier Models</span>
        </h1>
        <p className="text-xs text-zinc-400 mt-0.5">
          Mathematical percentile distributions, analyst load variance, and machine learning behavioral anomaly indicators.
        </p>
      </div>

      {/* Lifecycle Durations Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">Median Investigation Time</div>
          <div className="text-xl font-bold text-zinc-200 mt-1 font-mono">
            {durations.medianInvestigationMinutes} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Typical analyst engagement</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">Mean Investigation Time</div>
          <div className="text-xl font-bold text-zinc-200 mt-1 font-mono">
            {durations.meanInvestigationMinutes} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Arithmetic operational average</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">90th Percentile (P90)</div>
          <div className="text-xl font-bold text-amber-300 mt-1 font-mono">
            {durations.p90InvestigationMinutes} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Upper boundary threshold</div>
        </div>

        <div className="rounded-lg border border-zinc-800 bg-zinc-950 p-4">
          <div className="text-[10px] uppercase font-mono text-zinc-500">99th Percentile (P99 Outlier)</div>
          <div className="text-xl font-bold text-red-400 mt-1 font-mono">
            {durations.p99InvestigationMinutes} mins
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">Statistical stall threshold</div>
        </div>
      </div>

      {/* Analyst Workload Chart */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-zinc-200">
              Analyst Caseload Distribution & Operational Variance
            </h2>
            <p className="text-[11px] text-zinc-500">
              Measures case handling volume across triage and tier-2 responders.
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-400">
            {analystWorkload.length} Operators Active
          </span>
        </div>

        <div className="h-56 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analystWorkload} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="analystId" stroke="#71717a" fontSize={11} tickLine={false} />
              <YAxis stroke="#71717a" fontSize={11} allowDecimals={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', borderRadius: '8px', fontSize: '11px', color: '#f4f4f5' }}
              />
              <Bar dataKey="caseCount" name="Assigned Cases" fill="#38bdf8" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Machine Learning Behavioral Anomaly Models */}
      <div className="rounded-xl border border-cyan-950/80 bg-cyan-950/20 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-cyan-200">
                Machine Learning Behavioral Anomaly Signals (Isolation Forest)
              </h2>
              <p className="text-[11px] text-cyan-400/80">
                Identifies multivariate statistical deviations from normalized peer baseline. Used as a secondary corroboration signal.
              </p>
            </div>
          </div>
          <span className="text-xs font-mono px-2.5 py-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
            {mlAnomalies.length} Flagged Anomalies
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {mlAnomalies.map((m, i) => (
            <div key={i} className="rounded-lg border border-cyan-900/60 bg-zinc-950 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-cyan-300 font-bold">{m.findingId}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-300">
                  Score: {Math.round((m.anomalyScore || 0) * 100)}%
                </span>
              </div>
              <div className="text-xs font-semibold text-zinc-200">{m.title}</div>
              <div className="text-[11px] text-zinc-400 font-mono">Entity: {m.entityName} • Case {m.caseNumber}</div>

              <div className="pt-2 border-t border-zinc-850 space-y-1">
                {m.featureContributions?.map((fc: any, fidx: number) => (
                  <div key={fidx} className="text-[11px] text-zinc-300 flex justify-between">
                    <span className="text-zinc-400">{fc.feature}:</span>
                    <span className="font-mono text-cyan-300 font-medium">{fc.deviation}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
