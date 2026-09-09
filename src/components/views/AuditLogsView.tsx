import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { AuditEvent } from '../../types';
import { History, ShieldCheck, Search, Filter } from 'lucide-react';

export const AuditLogsView: React.FC = () => {
  const [events, setEvents] = useState<AuditEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    async function loadLogs() {
      try {
        const res = await api.getAuditLogs(100);
        setEvents(res.events);
      } catch (err) {
        console.error('Audit load failed:', err);
      } finally {
        setLoading(false);
      }
    }
    loadLogs();
  }, []);

  const filtered = events.filter(e => {
    if (search) {
      const q = search.toLowerCase();
      return (
        e.id.toLowerCase().includes(q) ||
        e.actorName.toLowerCase().includes(q) ||
        e.action.toLowerCase().includes(q) ||
        e.targetId.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-base font-bold text-zinc-100 uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-red-400" />
            <span>Supervisory Assessment Tamper-Evident Audit Trail</span>
          </h1>
          <p className="text-xs text-zinc-400 mt-0.5">
            Immutable chronological logging of all examiner reviews, scenario modifications, and report generations.
          </p>
        </div>
        <span className="text-xs font-mono px-3 py-1 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
          {events.length} Audit Events Recorded
        </span>
      </div>

      {/* Search Filter */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 shadow-sm">
        <div className="relative max-w-md">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search audit trail by actor, action, or target ID..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-900 pl-9 pr-3 py-1.5 text-xs text-zinc-200 placeholder-zinc-500 focus:border-red-600 focus:outline-none"
          />
        </div>
      </div>

      {/* Audit Table */}
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/80 text-zinc-400 font-mono text-[11px] uppercase">
                <th className="py-3 px-4">Event ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Actor</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Supervisory Action</th>
                <th className="py-3 px-4">Target Type</th>
                <th className="py-3 px-4">Target ID</th>
                <th className="py-3 px-4">Metadata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-850 font-sans">
              {filtered.map(e => (
                <tr key={e.id} className="hover:bg-zinc-900/50 transition">
                  <td className="py-2.5 px-4 font-mono font-medium text-zinc-400">{e.id}</td>
                  <td className="py-2.5 px-4 font-mono text-zinc-400 text-[11px]">
                    {new Date(e.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-zinc-200">{e.actorName}</td>
                  <td className="py-2.5 px-4">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-300">
                      {e.actorRole}
                    </span>
                  </td>
                  <td className="py-2.5 px-4 font-mono font-bold text-red-300">{e.action}</td>
                  <td className="py-2.5 px-4 text-zinc-400">{e.targetType}</td>
                  <td className="py-2.5 px-4 font-mono text-zinc-300">{e.targetId}</td>
                  <td className="py-2.5 px-4 text-zinc-400 text-[11px] font-mono max-w-xs truncate">
                    {JSON.stringify(e.metadata || {})}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={8} className="text-center py-8 text-zinc-500 text-xs">
                    No audit records matching search filter.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
