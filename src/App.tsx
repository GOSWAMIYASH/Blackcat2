import React, { useState, useEffect, useCallback } from 'react';
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
import { ShieldCheck } from 'lucide-react';
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
  const canReviewFindings = user?.role === 'Lead Examiner';
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

  // Load all central state from API
  const refreshData = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }

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
  }, [user]);

  useEffect(() => {
    refreshData();
  }, [refreshData]);

  useEffect(() => {
    if (!canReviewFindings && activeTab === 'review-queue') {
      setActiveTab('findings');
    }
  }, [activeTab, canReviewFindings]);

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

  if (authLoading || (user && loading && !kpi)) {
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
    return <LoginScreen onLogin={login} />;
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
          canReviewFindings={canReviewFindings}
        />

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6 bg-zinc-900/40">
          {activeTab === 'dashboard' && kpi && (
            <DashboardView
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
              canReviewFindings={canReviewFindings}
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
          canReview={canReviewFindings}
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

const LoginScreen: React.FC<{ onLogin: (email: string, password: string) => Promise<void> }> = ({ onLogin }) => {
  const [email, setEmail] = useState('examiner@satsa.gov.in');
  const [password, setPassword] = useState('examiner123');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await onLogin(email, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to sign in.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 p-6 text-zinc-100">
      <form onSubmit={submit} className="w-full max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-8 shadow-2xl">
        <div className="mb-6 flex items-center gap-3">
          <ShieldCheck className="h-9 w-9 text-red-400" />
          <div>
            <h1 className="font-semibold">SAT-SA</h1>
            <p className="text-xs text-zinc-400">Supervisory Analytics Tool for SOC Assessment</p>
          </div>
        </div>
        <label className="mb-4 block text-sm">Email
          <input value={email} onChange={event => setEmail(event.target.value)} type="email" required className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-red-500" />
        </label>
        <label className="mb-4 block text-sm">Password
          <input value={password} onChange={event => setPassword(event.target.value)} type="password" required className="mt-1.5 w-full rounded-md border border-zinc-700 bg-zinc-950 px-3 py-2 text-sm outline-none focus:border-red-500" />
        </label>
        {error && <p className="mb-4 rounded-md border border-red-900 bg-red-950/50 p-2 text-xs text-red-200">{error}</p>}
        <button disabled={submitting} className="w-full rounded-md bg-red-700 px-3 py-2 text-sm font-medium hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-60">
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="mt-4 text-xs text-zinc-500">Demo accounts: examiner@satsa.gov.in, supervisor@soc.internal, auditor@cert.gov.in</p>
      </form>
    </main>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
