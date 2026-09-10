import { Router, Request, Response } from 'express';
import { db } from './db';
import {
  verifyPassword,
  signToken,
  verifyToken,
  PRESET_USERS,
  canUserAccess,
  ServerPermission
} from './auth';
import { createRefreshSession, getRefreshTokenFromRequest, setRefreshCookie, clearRefreshCookie, rotateRefreshSession, revokeRefreshSession, roleLabel } from './auth';
import { prisma } from './prisma';
import { validateAndNormalizeSOCData } from './engine/normalizer';
import { generateAssessmentDossier } from './engine/reporting';
import { SCENARIO_DEFINITIONS } from './engine/scenarios';
import { calculateStatistics } from './engine/statistics';

export const apiRouter = Router();

// Middleware to extract authenticated user from Authorization header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

function requirePermission(req: Request, res: Response, permission: ServerPermission) {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: 'Authentication required' });
    return false;
  }

  if (!canUserAccess(authUser.role, permission)) {
    res.status(403).json({ error: 'You do not have permission to perform this action.' });
    return false;
  }

  return true;
}

function getRoleScopedCases(authUser: ReturnType<typeof getAuthUser>) {
  if (!authUser || authUser.role === 'Lead Examiner' || authUser.role === 'Auditor') {
    return [...db.cases];
  }

  const userName = authUser.name.toLowerCase();
  const supervisorCaseIds = new Set(
    db.closures
      .filter(closure => closure.closedBy.toLowerCase().includes(userName))
      .map(closure => closure.caseId)
  );
  return db.cases.filter(caseItem => {
    const assigned = (caseItem.assignedAnalyst || '').toLowerCase();
    const closedBy = (caseItem.closureReason || '').toLowerCase();
    return supervisorCaseIds.has(caseItem.id) || assigned.includes(userName) || closedBy.includes(userName);
  });
}

function getRoleScopedFindings(authUser: ReturnType<typeof getAuthUser>) {
  if (!authUser) return [...db.findings];

  if (authUser.role === 'Lead Examiner' || authUser.role === 'Auditor') {
    return [...db.findings];
  }

  const ownedCaseIds = new Set(getRoleScopedCases(authUser).map(caseItem => caseItem.id));
  return db.findings.filter(finding => ownedCaseIds.has(finding.caseId));
}

function getRoleScopedEntities(authUser: ReturnType<typeof getAuthUser>) {
  if (!authUser) return [...db.entities];
  if (authUser.role === 'Lead Examiner' || authUser.role === 'Auditor') {
    return [...db.entities];
  }

  const visibleCaseIds = new Set(getRoleScopedFindings(authUser).map(f => f.caseId));
  const visibleEntityIds = new Set(
    db.cases
      .filter(caseItem => visibleCaseIds.has(caseItem.id))
      .map(caseItem => caseItem.entityId)
  );

  return db.entities.filter(entity => visibleEntityIds.has(entity.id));
}

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
type AuthUser = ReturnType<typeof verifyToken>;

function requireAuth(req: Request, res: Response): AuthUser | null {
  const authUser = getAuthUser(req);
  if (!authUser) {
    res.status(401).json({ error: 'Authentication is required' });
    return null;
  }
  return authUser;
}

function requireRole(req: Request, res: Response, roles: string[]): AuthUser | null {
  const authUser = requireAuth(req, res);
  if (!authUser) return null;
  if (!roles.includes(authUser.role)) {
    res.status(403).json({ error: `Operation not permitted for role ${authUser.role}` });
    return null;
  }
  return authUser;
}

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    include: { organization: true }
  });
  if (!user || !user.isActive || !verifyPassword(password, user.passwordHash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: roleLabel(user.role) as any
  });
  const refreshToken = await createRefreshSession(user.id, req);
  setRefreshCookie(res, refreshToken);

  db.addAuditLog({
    actorEmail: user.email,
    actorName: user.name,
    actorRole: roleLabel(user.role) as any,
    action: 'LOGIN',
    targetType: 'AUTH',
    targetId: user.id,
    metadata: { ip: req.ip, userAgent: req.headers['user-agent'] }
  });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    organization: user.organization.name
    }
  });
});

apiRouter.post('/auth/refresh', async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (!refreshToken) return res.status(401).json({ error: 'Refresh session is required' });
  const rotated = await rotateRefreshSession(refreshToken, req);
  if (!rotated) {
    clearRefreshCookie(res);
    return res.status(401).json({ error: 'Refresh session is no longer valid' });
  }
  setRefreshCookie(res, rotated.refreshToken);
  res.json({ token: rotated.accessToken, user: rotated.user });
});

apiRouter.post('/auth/logout', async (req: Request, res: Response) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  if (refreshToken) await revokeRefreshSession(refreshToken);
  clearRefreshCookie(res);
  res.status(204).send();
});

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.json({
      authenticated: false,
      user: null
    });
  }

  const user = await prisma.user.findUnique({ where: { id: authUser.userId }, include: { organization: true } });
  if (!user || !user.isActive) return res.status(401).json({ error: 'Session is no longer valid' });
  res.json({
    authenticated: true,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: roleLabel(user.role),
      organization: user.organization.name
    }
  });
});

apiRouter.get('/auth/users', async (req: Request, res: Response) => {
  if (!requireAuth(req, res)) return;
  const users = await prisma.user.findMany({ include: { organization: true } });
  res.json({
    users: users.map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: roleLabel(u.role),
      organization: u.organization.name
    }))
  });
});

// Every application data endpoint below requires an authenticated session.
apiRouter.use((req: Request, res: Response, next) => {
  if (requireAuth(req, res)) next();
});

// ----------------------------------------------------
// ANALYTICS & KPIS
// ----------------------------------------------------
apiRouter.get('/analytics/summary', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const visibleCases = getRoleScopedCases(authUser);
  const visibleFindings = getRoleScopedFindings(authUser);
  const visibleCaseIds = new Set(visibleCases.map(caseItem => caseItem.id));
  const visibleAlertIds = new Set(visibleCases.map(caseItem => caseItem.alertId));
  const visibleInvestigations = db.investigations.filter(investigation => visibleCaseIds.has(investigation.caseId));
  const breachedCases = visibleCases.filter(caseItem => caseItem.slaBreached).length;

  const summary = db.getKPISummary();
  const filteredSummary = {
    ...summary,
    totalAlerts: db.alerts.filter(alert => visibleAlertIds.has(alert.id)).length,
    totalInvestigations: visibleInvestigations.length,
    totalFindings: visibleFindings.length,
    highFindings: visibleFindings.filter(f => f.severity === 'HIGH').length,
    criticalFindings: visibleFindings.filter(f => f.severity === 'CRITICAL').length,
    reviewedFindingsCount: visibleFindings.filter(f => f.reviewStatus !== 'PENDING').length,
    pendingReviewCount: visibleFindings.filter(f => f.reviewStatus === 'PENDING').length,
    totalCases: visibleCases.length,
    slaBreachRate: visibleCases.length ? Math.round((breachedCases / visibleCases.length) * 100) : 0,
    totalEntities: getRoleScopedEntities(authUser).length
  };

  res.json(filteredSummary);
});

apiRouter.get('/analytics/findings-by-severity', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const visibleFindings = getRoleScopedFindings(authUser);
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  for (const f of visibleFindings) {
    counts[f.severity] = (counts[f.severity] || 0) + 1;
  }

  const data = [
    { severity: 'Critical', count: counts.CRITICAL, fill: '#dc2626' },
    { severity: 'High', count: counts.HIGH, fill: '#ea580c' },
    { severity: 'Medium', count: counts.MEDIUM, fill: '#eab308' },
    { severity: 'Low', count: counts.LOW, fill: '#3b82f6' }
  ];

  res.json(data);
});

apiRouter.get('/analytics/findings-by-category', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const visibleFindings = getRoleScopedFindings(authUser);
  const counts: Record<string, number> = {};
  for (const f of visibleFindings) {
    counts[f.category] = (counts[f.category] || 0) + 1;
  }

  const data = Object.entries(counts).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  res.json(data);
});

apiRouter.get('/analytics/workflow-completion', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (authUser && authUser.role === 'Auditor') {
    return res.json([]);
  }
  const visibleCases = getRoleScopedCases(authUser);
  const visibleCaseIds = new Set(visibleCases.map(caseItem => caseItem.id));
  const stats = authUser?.role === 'SOC Supervisor'
    ? calculateStatistics(
        visibleCases,
        db.alerts.filter(alert => visibleCases.some(caseItem => caseItem.alertId === alert.id)),
        db.investigations.filter(investigation => visibleCaseIds.has(investigation.caseId)),
        db.escalations.filter(escalation => visibleCaseIds.has(escalation.caseId)),
        db.closures.filter(closure => visibleCaseIds.has(closure.caseId)),
        getRoleScopedFindings(authUser)
      )
    : db.getStatistics();
  res.json(stats.conversionFunnel);
});

apiRouter.get('/analytics/trends', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (authUser?.role !== 'SOC Supervisor') {
    return res.json(db.getStatistics().trends);
  }
  const visibleCases = getRoleScopedCases(authUser);
  const visibleCaseIds = new Set(visibleCases.map(caseItem => caseItem.id));
  const stats = calculateStatistics(
    visibleCases,
    db.alerts.filter(alert => visibleCases.some(caseItem => caseItem.alertId === alert.id)),
    db.investigations.filter(investigation => visibleCaseIds.has(investigation.caseId)),
    db.escalations.filter(escalation => visibleCaseIds.has(escalation.caseId)),
    db.closures.filter(closure => visibleCaseIds.has(closure.caseId)),
    getRoleScopedFindings(authUser)
  );
  res.json(stats.trends);
});

apiRouter.get('/analytics/entity-priority', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const visibleEntities = getRoleScopedEntities(authUser);
  const visibleEntityIds = new Set(visibleEntities.map(entity => entity.id));
  const stats = db.getStatistics();
  res.json(stats.entityRankings.filter(entry => visibleEntityIds.has(entry.entityId)));
});

apiRouter.get('/analytics/negative-space-matrix', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const visibleEntities = getRoleScopedEntities(authUser);
  const visibleEntityIds = new Set(visibleEntities.map(entity => entity.id));
  res.json(db.getNegativeSpaceMatrix().filter(row => visibleEntityIds.has(row.entityId)));
});

apiRouter.get('/analytics/full-statistics', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  if (authUser.role !== 'SOC Supervisor') {
    return res.json(db.getStatistics());
  }

  const visibleCases = getRoleScopedCases(authUser);
  const visibleCaseIds = new Set(visibleCases.map(caseItem => caseItem.id));
  res.json(calculateStatistics(
    visibleCases,
    db.alerts.filter(alert => visibleCases.some(caseItem => caseItem.alertId === alert.id)),
    db.investigations.filter(investigation => visibleCaseIds.has(investigation.caseId)),
    db.escalations.filter(escalation => visibleCaseIds.has(escalation.caseId)),
    db.closures.filter(closure => visibleCaseIds.has(closure.caseId)),
    getRoleScopedFindings(authUser)
  ));
});

apiRouter.get('/analytics/ml-anomalies', (req: Request, res: Response) => {
  const mlFindings = db.findings.filter(f => f.mlAnomalySignal?.isAnomaly);
  res.json(mlFindings.map(f => ({
    findingId: f.id,
    caseNumber: f.caseNumber,
    entityName: f.entityName,
    title: f.title,
    severity: f.severity,
    anomalyScore: f.mlAnomalySignal?.anomalyScore,
    featureContributions: f.mlAnomalySignal?.featureContributions
  })));
});

// ----------------------------------------------------
// FINDINGS & DETAILS
// ----------------------------------------------------
apiRouter.get('/findings', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  let list = getRoleScopedFindings(authUser);

  const { severity, priority, category, entity, status, search, sort } = req.query;

  if (severity && severity !== 'ALL') {
    list = list.filter(f => f.severity.toUpperCase() === String(severity).toUpperCase());
  }
  if (priority && priority !== 'ALL') {
    list = list.filter(f => f.priorityLevel.toUpperCase() === String(priority).toUpperCase());
  }
  if (category && category !== 'ALL') {
    list = list.filter(f => f.category.toLowerCase() === String(category).toLowerCase());
  }
  if (entity && entity !== 'ALL') {
    list = list.filter(f => f.entityId === entity || f.entityName.toLowerCase().includes(String(entity).toLowerCase()));
  }
  if (status && status !== 'ALL') {
    list = list.filter(f => f.reviewStatus.toUpperCase() === String(status).toUpperCase());
  }
  if (search) {
    const q = String(search).toLowerCase();
    list = list.filter(
      f =>
        f.id.toLowerCase().includes(q) ||
        f.title.toLowerCase().includes(q) ||
        f.caseNumber.toLowerCase().includes(q) ||
        f.entityName.toLowerCase().includes(q) ||
        f.whatHappened.toLowerCase().includes(q)
    );
  }

  // Sorting
  if (sort === 'oldest') {
    list.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  } else if (sort === 'severity') {
    const sevWeight = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    list.sort((a, b) => sevWeight[b.severity] - sevWeight[a.severity]);
  } else if (sort === 'newest') {
    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } else {
    // Default: priority
    list.sort((a, b) => b.priorityScore - a.priorityScore);
  }

  res.json({
    total: list.length,
    findings: list
  });
});

apiRouter.get('/findings/:id', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const finding = getRoleScopedFindings(authUser).find(f => f.id === req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  // Audit view
  db.addAuditLog({
    actorEmail: authUser.email,
    actorName: authUser.name,
    actorRole: authUser.role,
    action: 'FINDING_VIEWED',
    targetType: 'FINDING',
    targetId: finding.id,
    metadata: { title: finding.title }
  });

  res.json(finding);
});

apiRouter.post('/findings/:id/review', (req: Request, res: Response) => {
  if (!requirePermission(req, res, 'review_decision')) return;

  const { decision, notes, recommendedFollowUp } = req.body || {};
  if (!decision || !['CONFIRMED', 'REJECTED', 'NEEDS_EVIDENCE'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (CONFIRMED, REJECTED, NEEDS_EVIDENCE) is required' });
  }

  const authUser = requireRole(req, res, ['Lead Examiner']);
  if (!authUser) return;
  const reviewer = {
    id: authUser?.userId || 'USR-001',
    name: authUser?.name || 'Dr. Arunima Sen',
    email: authUser?.email || 'examiner@satsa.gov.in',
    role: authUser?.role || 'Lead Examiner'
  };

  const updated = db.reviewFinding(req.params.id, decision, reviewer, notes || 'Review decision submitted.', recommendedFollowUp);
  if (!updated) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  res.json({
    success: true,
    message: `Finding ${req.params.id} recorded as ${decision}`,
    finding: updated
  });
});

apiRouter.post('/findings/:id/clarification', (req: Request, res: Response) => {
  if (!requirePermission(req, res, 'submit_clarification')) return;

  const authUser = getAuthUser(req);
  const finding = getRoleScopedFindings(authUser).find(item => item.id === req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found in your assigned scope` });
  }

  const message = String(req.body?.message || '').trim();
  if (!message) {
    return res.status(400).json({ error: 'Clarification message is required' });
  }

  db.addAuditLog({
    actorEmail: authUser!.email,
    actorName: authUser!.name,
    actorRole: authUser!.role,
    action: 'CLARIFICATION_SUBMITTED',
    targetType: 'FINDING',
    targetId: finding.id,
    metadata: { caseNumber: finding.caseNumber, message }
  });

  res.json({ success: true, message: 'Clarification submitted to the examiner.' });
});

// ----------------------------------------------------
// ENTITIES
// ----------------------------------------------------
apiRouter.get('/entities', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  res.json(getRoleScopedEntities(authUser));
});

// ----------------------------------------------------
// SCENARIOS & DEMO MODE
// ----------------------------------------------------
apiRouter.get('/scenarios', (req: Request, res: Response) => {
  res.json({
    activeScenarioId: db.activeScenarioId,
    scenarios: SCENARIO_DEFINITIONS
  });
});

apiRouter.post('/scenarios/load', (req: Request, res: Response) => {
  if (!requirePermission(req, res, 'load_scenario')) return;

  const { scenarioId } = req.body || {};
  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' });
  }

  const authUser = requireRole(req, res, ['Lead Examiner']);
  if (!authUser) return;
  db.loadScenario(scenarioId, authUser?.name || 'Lead Examiner');

  res.json({
    success: true,
    activeScenarioId: db.activeScenarioId,
    kpi: db.getKPISummary(),
    findingsCount: db.findings.length
  });
});

// ----------------------------------------------------
// DATA INGESTION (CSV / JSON)
// ----------------------------------------------------
apiRouter.post('/upload', (req: Request, res: Response) => {
  if (!requirePermission(req, res, 'upload_evidence')) return;

  const { content, mimeType = 'text/csv' } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'Uploaded content payload is required' });
  }

  const authUser = requireRole(req, res, ['SOC Supervisor']);
  if (!authUser) return;
  const result = validateAndNormalizeSOCData(content, mimeType);

  if (!result.success && result.errors.length > 0 && result.normalizedCases.length === 0) {
    return res.status(422).json({
      error: 'Data validation and normalization failed',
      errors: result.errors
    });
  }

  db.ingestCustomDataset(result.normalizedCases, result.normalizedAlerts, authUser?.email || 'examiner@satsa.gov.in');

  res.json({
    success: true,
    ingestion: result,
    newSummary: db.getKPISummary()
  });
});

// ----------------------------------------------------
// AUDIT LOGS
// ----------------------------------------------------
apiRouter.get('/audit/logs', (req: Request, res: Response) => {
  const authUser = requireAuth(req, res);
  if (!authUser) return;
  if (!canUserAccess(authUser.role, 'access_audit_logs')) {
    return res.status(403).json({ error: 'You do not have permission to view audit logs.' });
  }

  const limit = parseInt(req.query.limit as string) || 100;
  let events = [...db.auditEvents];

  if (authUser.role === 'SOC Supervisor') {
    events = events.filter(event => event.actorEmail === authUser.email);
  }

  res.json({
    total: events.length,
    events: events.slice(0, limit)
  });
});

// ----------------------------------------------------
// ASSESSMENT REPORT / DOSSIER
// ----------------------------------------------------
apiRouter.get('/reports/assessment-dossier', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  if (!canUserAccess(authUser.role, 'generate_report') && !canUserAccess(authUser.role, 'view_reports')) {
    return res.status(403).json({ error: 'You do not have permission to access assessment reports.' });
  }

  const examinerName = `${authUser.name} (${authUser.role})`;
  const dossier = generateAssessmentDossier(examinerName);

  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'REPORT_GENERATED',
    targetType: 'REPORT',
    targetId: dossier.metadata.reportId,
    metadata: { totalFindings: dossier.findingsDossier.length }
  });

  res.json(dossier);
});
