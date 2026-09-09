import React from 'react';
import {
  LayoutDashboard,
  Building2,
  BarChart3,
  AlertOctagon,
  CheckSquare,
  Grid,
  FileCheck2,
  History,
  Shield
} from 'lucide-react';

export type NavTab =
  | 'dashboard'
  | 'entities'
  | 'analytics'
  | 'findings'
  | 'review-queue'
  | 'negative-space'
  | 'reports'
  | 'audit-logs';

interface Props {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  pendingReviewCount: number;
  totalFindingsCount: number;
}

export const Sidebar: React.FC<Props> = ({
  activeTab,
  onSelectTab,
  pendingReviewCount,
  totalFindingsCount
}) => {
  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Supervisory Dashboard', icon: LayoutDashboard },
    { id: 'negative-space' as NavTab, label: 'Negative Space Matrix', icon: Grid, badge: 'Signature' },
    { id: 'findings' as NavTab, label: 'Supervisory Findings', icon: AlertOctagon, count: totalFindingsCount },
    { id: 'review-queue' as NavTab, label: 'Examiner Review Queue', icon: CheckSquare, count: pendingReviewCount, countHighlight: true },
    { id: 'analytics' as NavTab, label: 'Workflow & Statistics', icon: BarChart3 },
    { id: 'entities' as NavTab, label: 'Critical Entities', icon: Building2 },
    { id: 'reports' as NavTab, label: 'Assessment Dossier', icon: FileCheck2 },
    { id: 'audit-logs' as NavTab, label: 'Supervisory Audit Trail', icon: History }
  ];

  return (
    <aside className="w-64 border-r border-zinc-800 bg-zinc-950 flex flex-col justify-between py-4 px-3 flex-shrink-0">
      <div className="space-y-1">
        <div className="px-3 pb-2 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Supervisory Navigation
        </div>

        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-zinc-800/90 text-zinc-100 border border-zinc-700 shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-red-400' : 'text-zinc-500'}`} />
                <span>{item.label}</span>
              </div>

              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-950 border border-indigo-700/60 text-indigo-300">
                  {item.badge}
                </span>
              )}

              {item.count !== undefined && item.count > 0 && (
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    item.countHighlight
                      ? 'bg-red-950 text-red-300 border border-red-700/60'
                      : 'bg-zinc-800 text-zinc-400 border border-zinc-700'
                  }`}
                >
                  {item.count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Footer Core Principle */}
      <div className="rounded-lg border border-zinc-850 bg-zinc-900/60 p-3 text-zinc-400">
        <div className="flex items-center gap-2 mb-1.5 text-zinc-300 font-semibold text-xs">
          <Shield className="w-3.5 h-3.5 text-red-400" />
          <span>Core Principle</span>
        </div>
        <p className="text-[11px] leading-relaxed text-zinc-400">
          SAT-SA does not declare automatic compliance. It generates evidence-backed supervisory signals to assist human examiners.
        </p>
      </div>
    </aside>
  );
};
