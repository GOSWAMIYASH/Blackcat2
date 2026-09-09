import {
  KPISummary,
  SupervisoryFinding,
  NegativeSpaceRow,
  ScenarioDefinition,
  AuditEvent,
  Entity,
  WorkflowFunnel,
  OperationalTrendPoint
} from '../types';

class ApiService {
  private token: string | null = localStorage.getItem('satsa_auth_token');

  public setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('satsa_auth_token', token);
    } else {
      localStorage.removeItem('satsa_auth_token');
    }
  }

  public getToken(): string | null {
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers
    });

    if (!res.ok) {
      let errMessage = `API error (${res.status}): ${res.statusText}`;
      try {
        const errJson = await res.json();
        if (errJson.error) errMessage = errJson.error;
      } catch {
        // Fall back to status text
      }
      throw new Error(errMessage);
    }

    return res.json() as Promise<T>;
  }

  // Auth
  public async login(email: string, password: string) {
    const data = await this.request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.setToken(data.token);
    return data;
  }

  public async getMe() {
    return this.request<{ authenticated: boolean; user: any }>('/auth/me');
  }

  public async getUsers() {
    return this.request<{ users: any[] }>('/auth/users');
  }

  // Analytics
  public async getKPISummary(): Promise<KPISummary> {
    return this.request<KPISummary>('/analytics/summary');
  }

  public async getFindingsBySeverity(): Promise<{ severity: string; count: number; fill: string }[]> {
    return this.request('/analytics/findings-by-severity');
  }

  public async getFindingsByCategory(): Promise<{ category: string; count: number }[]> {
    return this.request('/analytics/findings-by-category');
  }

  public async getWorkflowCompletion(): Promise<WorkflowFunnel[]> {
    return this.request('/analytics/workflow-completion');
  }

  public async getTrends(): Promise<OperationalTrendPoint[]> {
    return this.request('/analytics/trends');
  }

  public async getEntityPriority(): Promise<{ entityId: string; entityName: string; priorityScore: number; findingCount: number; criticalCount: number }[]> {
    return this.request('/analytics/entity-priority');
  }

  public async getNegativeSpaceMatrix(): Promise<NegativeSpaceRow[]> {
    return this.request('/analytics/negative-space-matrix');
  }

  public async getMLAnomalies(): Promise<any[]> {
    return this.request('/analytics/ml-anomalies');
  }

  public async getFullStatistics(): Promise<any> {
    return this.request('/analytics/full-statistics');
  }

  // Findings
  public async getFindings(params: Record<string, string> = {}): Promise<{ total: number; findings: SupervisoryFinding[] }> {
    const query = new URLSearchParams(params).toString();
    return this.request(`/findings${query ? `?${query}` : ''}`);
  }

  public async getFindingById(id: string): Promise<SupervisoryFinding> {
    return this.request(`/findings/${encodeURIComponent(id)}`);
  }

  public async reviewFinding(
    id: string,
    decision: 'CONFIRMED' | 'REJECTED' | 'NEEDS_EVIDENCE',
    notes: string,
    recommendedFollowUp?: string
  ): Promise<{ success: boolean; message: string; finding: SupervisoryFinding }> {
    return this.request(`/findings/${encodeURIComponent(id)}/review`, {
      method: 'POST',
      body: JSON.stringify({ decision, notes, recommendedFollowUp })
    });
  }

  // Entities
  public async getEntities(): Promise<Entity[]> {
    return this.request('/entities');
  }

  // Scenarios
  public async getScenarios(): Promise<{ activeScenarioId: string; scenarios: ScenarioDefinition[] }> {
    return this.request('/scenarios');
  }

  public async loadScenario(scenarioId: string): Promise<any> {
    return this.request('/scenarios/load', {
      method: 'POST',
      body: JSON.stringify({ scenarioId })
    });
  }

  // Upload
  public async uploadSOCData(content: string, mimeType: string = 'text/csv'): Promise<any> {
    return this.request('/upload', {
      method: 'POST',
      body: JSON.stringify({ content, mimeType })
    });
  }

  // Audit Logs
  public async getAuditLogs(limit: number = 100): Promise<{ total: number; events: AuditEvent[] }> {
    return this.request(`/audit/logs?limit=${limit}`);
  }

  // Assessment Report
  public async getAssessmentDossier(): Promise<any> {
    return this.request('/reports/assessment-dossier');
  }
}

export const api = new ApiService();
