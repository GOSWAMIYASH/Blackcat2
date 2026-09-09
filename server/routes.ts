import { Router, Request, Response } from 'express';
import { db } from './db';
import { verifyPassword, signToken, verifyToken, PRESET_USERS } from './auth';
import { prisma } from './prisma';
import argon2 from 'argon2';
import { validateAndNormalizeSOCData } from './engine/normalizer';
import { generateAssessmentDossier } from './engine/reporting';
import { SCENARIO_DEFINITIONS } from './engine/scenarios';

export const apiRouter = Router();

// Middleware to extract authenticated user from Authorization header
function getAuthUser(req: Request) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) return null;
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// ----------------------------------------------------
// AUTHENTICATION & USERS
// ----------------------------------------------------
const roleLabel = (role: string) => role.split('_').map(word => word[0] + word.slice(1).toLowerCase()).join(' ');

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  const user = await prisma.user.findUnique({
    where: { email: String(email).toLowerCase().trim() },
    include: { organization: true }
  });
  if (!user || !user.isActive || !(await argon2.verify(user.passwordHash, password))) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const token = signToken({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: roleLabel(user.role) as any
  });

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

apiRouter.get('/auth/me', async (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  if (!authUser) {
    return res.status(401).json({ error: 'Authentication is required' });
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

apiRouter.get('/auth/users', async (_req: Request, res: Response) => {
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

// ----------------------------------------------------
// ANALYTICS & KPIS
// ----------------------------------------------------
apiRouter.get('/analytics/summary', (req: Request, res: Response) => {
  res.json(db.getKPISummary());
});

apiRouter.get('/analytics/findings-by-severity', (req: Request, res: Response) => {
  const counts: Record<string, number> = {
    CRITICAL: 0,
    HIGH: 0,
    MEDIUM: 0,
    LOW: 0
  };

  for (const f of db.findings) {
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
  const counts: Record<string, number> = {};
  for (const f of db.findings) {
    counts[f.category] = (counts[f.category] || 0) + 1;
  }

  const data = Object.entries(counts).map(([category, count]) => ({
    category,
    count
  })).sort((a, b) => b.count - a.count);

  res.json(data);
});

apiRouter.get('/analytics/workflow-completion', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.conversionFunnel);
});

apiRouter.get('/analytics/trends', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.trends);
});

apiRouter.get('/analytics/entity-priority', (req: Request, res: Response) => {
  const stats = db.getStatistics();
  res.json(stats.entityRankings);
});

apiRouter.get('/analytics/negative-space-matrix', (req: Request, res: Response) => {
  res.json(db.getNegativeSpaceMatrix());
});

apiRouter.get('/analytics/full-statistics', (req: Request, res: Response) => {
  res.json(db.getStatistics());
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
  let list = [...db.findings];

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
  const finding = db.findings.find(f => f.id === req.params.id);
  if (!finding) {
    return res.status(404).json({ error: `Finding ${req.params.id} not found` });
  }

  // Audit view
  const authUser = getAuthUser(req);
  db.addAuditLog({
    actorEmail: authUser?.email || 'examiner@satsa.gov.in',
    actorName: authUser?.name || 'Dr. Arunima Sen',
    actorRole: authUser?.role || 'Lead Examiner',
    action: 'FINDING_VIEWED',
    targetType: 'FINDING',
    targetId: finding.id,
    metadata: { title: finding.title }
  });

  res.json(finding);
});

apiRouter.post('/findings/:id/review', (req: Request, res: Response) => {
  const { decision, notes, recommendedFollowUp } = req.body || {};
  if (!decision || !['CONFIRMED', 'REJECTED', 'NEEDS_EVIDENCE'].includes(decision)) {
    return res.status(400).json({ error: 'Valid decision (CONFIRMED, REJECTED, NEEDS_EVIDENCE) is required' });
  }

  const authUser = getAuthUser(req);
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

// ----------------------------------------------------
// ENTITIES
// ----------------------------------------------------
apiRouter.get('/entities', (req: Request, res: Response) => {
  res.json(db.entities);
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
  const { scenarioId } = req.body || {};
  if (!scenarioId) {
    return res.status(400).json({ error: 'scenarioId is required' });
  }

  const authUser = getAuthUser(req);
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
  const { content, mimeType = 'text/csv' } = req.body || {};
  if (!content) {
    return res.status(400).json({ error: 'Uploaded content payload is required' });
  }

  const authUser = getAuthUser(req);
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
  const limit = parseInt(req.query.limit as string) || 100;
  res.json({
    total: db.auditEvents.length,
    events: db.auditEvents.slice(0, limit)
  });
});

// ----------------------------------------------------
// ASSESSMENT REPORT / DOSSIER
// ----------------------------------------------------
apiRouter.get('/reports/assessment-dossier', (req: Request, res: Response) => {
  const authUser = getAuthUser(req);
  const examinerName = authUser ? `${authUser.name} (${authUser.role})` : 'Dr. Arunima Sen (Lead Examiner)';
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
