import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavTab } from './components/layout/Sidebar';
import { DashboardView } from './components/views/DashboardView';
import { NegativeSpaceView } from './components/views/NegativeSpaceView';
import { FindingsView } from './components/views/FindingsView';
import { ReviewQueueView } from './components/views/ReviewQueueView';
import { EntitiesView } from './components/views/EntitiesView';
import { AnalyticsView } from './components/views/AnalyticsView';
import { ReportsView } from './components/views/ReportsView';
import { AuditLogsView } from './components/views/AuditLogsView';
import { FindingDetailModal } from './components/views/FindingDetailModal';
import { DataIngestionModal } from './components/modals/DataIngestionModal';
import { api } from './services/api';
import {
  KPISummary,
  SupervisoryFinding,
  NegativeSpaceRow,
  ScenarioDefinition,
  Entity,
  WorkflowFunnel,
  OperationalTrendPoint,
  ReviewStatus
} from './types';

export const AppContent: React.FC = () => {
  const { user, loading: authLoading, login } = useAuth();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [activeScenarioId, setActiveScenarioId] = useState<string>('scenario-2');
  const [scenarios, setScenarios] = useState<ScenarioDefinition[]>([]);
  const [kpi, setKpi] = useState<KPISummary | null>(null);
  const [severityData, setSeverityData] = useState<{ severity: string; count: number; fill: string }[]>([]);
  const [categoryData, setCategoryData] = useState<{ category: string; count: number }[]>([]);
  const [workflowFunnel, setWorkflowFunnel] = useState<WorkflowFunnel[]>([]);
  const [trends, setTrends] = useState<OperationalTrendPoint[]>([]);
  const [entityRankings, setEntityRankings] = useState<any[]>([]);
  const [negativeSpaceMatrix, setNegativeSpaceMatrix] = useState<NegativeSpaceRow[]>([]);
  const [findings, setFindings] = useState<SupervisoryFinding[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);

  // Modals & Drill-down selections
  const [selectedFinding, setSelectedFinding] = useState<SupervisoryFinding | null>(null);
  const [isUploadOpen, setIsUploadOpen] = useState<boolean>(false);
  const [findingCategoryFilter, setFindingCategoryFilter] = useState<string>('ALL');
  const [findingSeverityFilter, setFindingSeverityFilter] = useState<string>('ALL');
  const [findingEntityFilter, setFindingEntityFilter] = useState<string>('ALL');

  const [loading, setLoading] = useState<boolean>(true);
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginFieldsEnabled, setLoginFieldsEnabled] = useState(false);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const [loginFieldNames] = useState(() => ({
    email: `access-${Math.random().toString(36).slice(2)}`,
    password: `secret-${Math.random().toString(36).slice(2)}`
  }));

  useEffect(() => {
    const clearAutofill = () => {
      if (emailInputRef.current?.value) emailInputRef.current.value = '';
      if (passwordInputRef.current?.value) passwordInputRef.current.value = '';
      setLoginEmail('');
      setLoginPassword('');
    };

    const timer = window.setTimeout(clearAutofill, 250);
    return () => window.clearTimeout(timer);
  }, []);

  const handleLogin = async (e?: React.FormEvent | React.MouseEvent) => {
    e?.preventDefault();
    try {
      setLoginError('');
      await login(loginEmail, loginPassword);
    } catch (err: any) {
      setLoginError(err.message || 'Login failed');
    }
  };

  const clearAutofilledInput = (input: HTMLInputElement, clear: (value: string) => void) => {
    input.value = '';
    clear('');
  };

  // Load all central state from API
  const refreshData = useCallback(async () => {
    try {
      const [
        kpiRes,
        scenRes,
        sevRes,
        catRes,
        funnelRes,
        trendRes,
        rankRes,
        matrixRes,
        findingsRes,
        entitiesRes
      ] = await Promise.all([
        api.getKPISummary(),
        api.getScenarios(),
        api.getFindingsBySeverity(),
        api.getFindingsByCategory(),
        api.getWorkflowCompletion(),
        api.getTrends(),
        api.getEntityPriority(),
        api.getNegativeSpaceMatrix(),
        api.getFindings(),
        api.getEntities()
      ]);

      setKpi(kpiRes);
      setScenarios(scenRes.scenarios);
      setActiveScenarioId(scenRes.activeScenarioId);
      setSeverityData(sevRes);
      setCategoryData(catRes);
      setWorkflowFunnel(funnelRes);
      setTrends(trendRes);
      setEntityRankings(rankRes);
      setNegativeSpaceMatrix(matrixRes);
      setFindings(findingsRes.findings);
      setEntities(entitiesRes);
    } catch (err) {
      console.error('Failed to load application data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      refreshData();
    }
  }, [user, refreshData]);

  // Scenario switch
  const handleSelectScenario = async (scenarioId: string) => {
    try {
      setLoading(true);
      await api.loadScenario(scenarioId);
      await refreshData();
    } catch (err) {
      console.error('Failed to switch scenario:', err);
    } finally {
      setLoading(false);
    }
  };

  // Review submission
  const handleReviewSubmit = async (
    id: string,
    decision: ReviewStatus,
    notes: string,
    followUp?: string
  ) => {
    if (decision === 'PENDING') return;
    const res = await api.reviewFinding(id, decision as 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE', notes, followUp);
    if (res.finding) {
      setSelectedFinding(res.finding);
    }
    await refreshData();
  };

  // Interactive Graph-to-Finding navigation
  const navigateToCategory = (category: string) => {
    setFindingCategoryFilter(category);
    setFindingSeverityFilter('ALL');
    setActiveTab('findings');
  };

  const navigateToSeverity = (severity: string) => {
    setFindingSeverityFilter(severity);
    setFindingCategoryFilter('ALL');
    setActiveTab('findings');
  };

  const navigateToEntity = (entityId: string) => {
    setFindingEntityFilter(entityId);
    setActiveTab('findings');
  };

  // Negative space drilldown
  const handleSelectFindingId = async (findingId: string) => {
    try {
      const finding = await api.getFindingById(findingId);
      setSelectedFinding(finding);
    } catch (err) {
      console.error('Finding lookup error:', err);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-300 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <span>Booting SAT-SA Supervisory Engine (SIH26157)...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 text-zinc-100">
        <div className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6 shadow-2xl">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-red-800 bg-red-950 text-red-400">
              <span className="font-bold">SAT-SA</span>
            </div>
            <h1 className="text-xl font-bold tracking-wider text-zinc-100">Secure Access</h1>
            <p className="mt-1 text-xs text-zinc-400">SIH26157 Supervisory Analytics</p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-400">Account ID</label>
              <input
                ref={emailInputRef}
                type="text"
                autoComplete="nope"
                name={loginFieldNames.email}
                readOnly={!loginFieldsEnabled}
                onFocus={() => setLoginFieldsEnabled(true)}
                onAnimationStart={e => {
                  if (e.animationName === 'autofill-detected') {
                    clearAutofilledInput(e.currentTarget, setLoginEmail);
                  }
                }}
                value={loginEmail}
                onChange={e => setLoginEmail(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-600"
                placeholder="abc@etc.co.in"
              />
            </div>

            <div>
              <label className="mb-1 block text-[11px] uppercase tracking-wider text-zinc-400">Access Key</label>
              <input
                ref={passwordInputRef}
                type="text"
                autoComplete="nope"
                name={loginFieldNames.password}
                readOnly={!loginFieldsEnabled}
                onFocus={() => setLoginFieldsEnabled(true)}
                onAnimationStart={e => {
                  if (e.animationName === 'autofill-detected') {
                    clearAutofilledInput(e.currentTarget, setLoginPassword);
                  }
                }}
                value={loginPassword}
                onChange={e => setLoginPassword(e.target.value)}
                className="w-full rounded-lg border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm text-zinc-100 outline-none focus:border-red-600"
                style={{ WebkitTextSecurity: 'disc' } as React.CSSProperties}
                placeholder="Enter access key"
              />
            </div>

            {loginError && (
              <div className="rounded-lg border border-red-800 bg-red-950/40 px-3 py-2 text-xs text-red-200">
                {loginError}
              </div>
            )}

            <button
              type="button"
              onClick={handleLogin}
              className="w-full rounded-lg bg-red-800 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (loading && !kpi) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-zinc-950 text-zinc-300 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-red-500 border-t-transparent" />
          <span>Loading supervisory data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-950 text-zinc-100 font-sans overflow-hidden">
      {/* Top Navbar */}
      <Navbar
        scenarios={scenarios}
        activeScenarioId={activeScenarioId}
        onSelectScenario={handleSelectScenario}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenReport={() => setActiveTab('reports')}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          pendingReviewCount={kpi?.pendingReviewCount || 0}
          totalFindingsCount={kpi?.totalFindings || 0}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-900/40">
          {activeTab === 'dashboard' && kpi && (
            <DashboardView
              role={user.role}
              kpi={kpi}
              severityData={severityData}
              categoryData={categoryData}
              workflowFunnel={workflowFunnel}
              trends={trends}
              entityRankings={entityRankings}
              findings={findings}
              onSelectFinding={setSelectedFinding}
              onNavigateToCategory={navigateToCategory}
              onNavigateToEntity={navigateToEntity}
              onNavigateToSeverity={navigateToSeverity}
            />
          )}

          {activeTab === 'negative-space' && (
            <NegativeSpaceView
              matrix={negativeSpaceMatrix}
              findings={findings}
              onSelectFindingId={handleSelectFindingId}
              onOpenFindingByCase={setSelectedFinding}
            />
          )}

          {activeTab === 'findings' && (
            <FindingsView
              findings={findings}
              onSelectFinding={setSelectedFinding}
              initialCategoryFilter={findingCategoryFilter}
              initialSeverityFilter={findingSeverityFilter}
              initialEntityFilter={findingEntityFilter}
            />
          )}

          {activeTab === 'review-queue' && (
            <ReviewQueueView
              findings={findings}
              onSelectFinding={setSelectedFinding}
            />
          )}

          {activeTab === 'entities' && (
            <EntitiesView
              entities={entities}
              onSelectEntity={(entityId) => {
                navigateToEntity(entityId);
              }}
            />
          )}

          {activeTab === 'analytics' && <AnalyticsView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'audit-logs' && <AuditLogsView />}
        </main>
      </div>

      {/* 10-Section Evidence-First Finding Detail Modal */}
      {selectedFinding && (
        <FindingDetailModal
          finding={selectedFinding}
          onClose={() => setSelectedFinding(null)}
          onReviewSubmit={handleReviewSubmit}
        />
      )}

      {/* Evidence Ingestion Modal */}
      <DataIngestionModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          refreshData();
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
