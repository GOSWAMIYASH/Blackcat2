import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import {
  ShieldCheck,
  UploadCloud,
  FileText,
  ChevronDown,
  UserCheck,
  Sparkles,
  Layers
} from 'lucide-react';
import { ScenarioDefinition, UserRole } from '../../types';

interface Props {
  scenarios: ScenarioDefinition[];
  activeScenarioId: string;
  onSelectScenario: (id: string) => void;
  onOpenUpload: () => void;
  onOpenReport: () => void;
}

export const Navbar: React.FC<Props> = ({
  scenarios,
  activeScenarioId,
  onSelectScenario,
  onOpenUpload,
  onOpenReport
}) => {
  const { user, switchUser, presetUsers } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [scenarioMenuOpen, setScenarioMenuOpen] = useState(false);

  const activeScenario = scenarios.find(s => s.id === activeScenarioId) || scenarios[0];

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between border-b border-zinc-800 bg-zinc-950/90 backdrop-blur px-6 py-3">
      {/* Brand & Mission */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-red-950/80 border border-red-700/60 text-red-400 shadow-md">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-wider text-zinc-100">SAT-SA</span>
              <span className="rounded bg-zinc-800/90 border border-zinc-700 px-1.5 py-0.5 text-[10px] font-mono font-semibold text-red-400">
                SIH26157
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 font-medium leading-none">
              Supervisory Analytics Tool for SOC Assessment
            </p>
          </div>
        </div>
      </div>

      {/* Center: Scenario Quick Switcher */}
      <div className="relative">
        <button
          onClick={() => setScenarioMenuOpen(!scenarioMenuOpen)}
          className="flex items-center gap-2 rounded-lg border border-red-900/40 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-200 hover:border-red-750 hover:bg-zinc-800/90 transition-colors shadow-sm"
        >
          <Sparkles className="w-3.5 h-3.5 text-red-400 animate-pulse" />
          <span className="text-zinc-400">Demo Scenario:</span>
          <span className="font-semibold text-red-300 truncate max-w-[220px]">
            {activeScenario?.name.split(':')[1] || activeScenario?.name || 'Scenario 2'}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-zinc-400" />
        </button>

        {scenarioMenuOpen && (
          <div className="absolute right-0 mt-2 w-80 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-2xl z-50">
            <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
              Select Reproducible SOC Scenario
            </div>
            {scenarios.map(s => (
              <button
                key={s.id}
                onClick={() => {
                  onSelectScenario(s.id);
                  setScenarioMenuOpen(false);
                }}
                className={`w-full text-left p-2 rounded-md text-xs transition-colors flex flex-col gap-0.5 mb-1 ${
                  s.id === activeScenarioId
                    ? 'bg-red-950/60 border border-red-700/60 text-red-200'
                    : 'text-zinc-300 hover:bg-zinc-800'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold">{s.name}</span>
                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 border border-zinc-700 text-zinc-400">
                    {s.badge}
                  </span>
                </div>
                <span className="text-[11px] text-zinc-400 line-clamp-1">{s.description}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Controls: Ingest, Report, User Role Switcher */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenUpload}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800 transition"
        >
          <UploadCloud className="w-3.5 h-3.5 text-zinc-400" />
          <span>Ingest Evidence</span>
        </button>

        <button
          onClick={onOpenReport}
          className="flex items-center gap-1.5 rounded-lg border border-emerald-800/60 bg-emerald-950/40 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-900/60 transition"
        >
          <FileText className="w-3.5 h-3.5 text-emerald-400" />
          <span>Dossier</span>
        </button>

        {/* User Role Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
            className="flex items-center gap-2 rounded-lg border border-zinc-800 bg-zinc-900 px-3 py-1.5 text-xs text-zinc-300 hover:border-zinc-700 hover:bg-zinc-800 transition"
          >
            <UserCheck className="w-3.5 h-3.5 text-zinc-400" />
            <div className="text-left leading-none">
              <span className="font-semibold block text-zinc-200">{user?.name || 'Dr. Arunima Sen'}</span>
              <span className="text-[10px] text-zinc-500">{user?.role || 'Lead Examiner'}</span>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-zinc-500 ml-1" />
          </button>

          {roleMenuOpen && (
            <div className="absolute right-0 mt-2 w-64 rounded-lg border border-zinc-800 bg-zinc-900 p-2 shadow-2xl z-50">
              <div className="text-[10px] uppercase font-bold tracking-wider text-zinc-500 px-2 py-1">
                Simulate Role / Access Level
              </div>
              {presetUsers.map(p => (
                <button
                  key={p.email}
                  onClick={() => {
                    switchUser(p.role);
                    setRoleMenuOpen(false);
                  }}
                  className={`w-full text-left p-2 rounded-md text-xs transition-colors flex flex-col mb-1 ${
                    user?.role === p.role
                      ? 'bg-red-950/50 border border-red-800 text-red-200'
                      : 'text-zinc-300 hover:bg-zinc-800'
                  }`}
                >
                  <span className="font-medium">{p.name}</span>
                  <span className="text-[10px] text-zinc-400">{p.role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
