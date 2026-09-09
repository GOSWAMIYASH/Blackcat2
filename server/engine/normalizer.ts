import { Alert, Case, SeverityLevel } from '../types';

export interface IngestionResult {
  success: boolean;
  totalRecords: number;
  acceptedRecords: number;
  rejectedRecords: number;
  errors: { row: number; field: string; message: string }[];
  normalizedCases: Partial<Case>[];
  normalizedAlerts: Partial<Alert>[];
  summary: {
    entitiesDetected: string[];
    severityCounts: Record<string, number>;
    duplicatesFiltered: number;
  };
}

// Column alias dictionary for diverse SOC feeds
const COLUMN_ALIASES: Record<string, string[]> = {
  timestamp: ['timestamp', 'event_timestamp', 'alert_time', 'event_datetime', 'time', 'created_at', 'log_time'],
  case_id: ['case_id', 'case_number', 'incident_id', 'ticket_id', 'ticket_no', 'incident_number'],
  entity_id: ['entity_id', 'entity', 'organization', 'org', 'tenant_id', 'client_id', 'site'],
  severity: ['severity', 'severity_level', 'sev', 'crit', 'priority', 'risk_level'],
  title: ['title', 'alert_title', 'incident_title', 'name', 'summary', 'description'],
  analyst: ['analyst', 'assigned_analyst', 'assigned_to', 'operator', 'owner', 'investigator'],
  status: ['status', 'state', 'incident_status', 'case_status'],
  duration_minutes: ['duration_minutes', 'duration', 'investigation_time', 'time_spent', 'sla_actual'],
  evidence_present: ['evidence_present', 'has_evidence', 'evidence_count', 'artifacts_attached']
};

export function normalizeColumnName(rawHeader: string): string {
  const cleaned = rawHeader.trim().toLowerCase().replace(/[\s\-_]+/g, '_');
  for (const [canonical, aliases] of Object.entries(COLUMN_ALIASES)) {
    if (aliases.includes(cleaned)) {
      return canonical;
    }
  }
  return cleaned;
}

export function normalizeSeverity(rawSeverity: any): SeverityLevel {
  if (!rawSeverity) return 'MEDIUM';
  const val = String(rawSeverity).toUpperCase().trim();
  if (val.includes('CRIT') || val === '1' || val === 'P1') return 'CRITICAL';
  if (val.includes('HIGH') || val === '2' || val === 'P2') return 'HIGH';
  if (val.includes('MED') || val === '3' || val === 'P3') return 'MEDIUM';
  if (val.includes('LOW') || val === 'INFO' || val === '4' || val === 'P4') return 'LOW';
  return 'MEDIUM';
}

export function parseCSVToObjects(csvContent: string): { headers: string[]; rows: Record<string, string>[] } {
  const lines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  if (lines.length === 0) return { headers: [], rows: [] };

  const rawHeaders = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
  const normalizedHeaders = rawHeaders.map(normalizeColumnName);

  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i];
    // Basic CSV splitting handling quoted commas
    const values: string[] = [];
    let currentVal = '';
    let insideQuote = false;

    for (let charIdx = 0; charIdx < rawLine.length; charIdx++) {
      const char = rawLine[charIdx];
      if (char === '"' || char === "'") {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(currentVal.trim().replace(/^["']|["']$/g, ''));
        currentVal = '';
      } else {
        currentVal += char;
      }
    }
    values.push(currentVal.trim().replace(/^["']|["']$/g, ''));

    const rowObj: Record<string, string> = {};
    normalizedHeaders.forEach((header, idx) => {
      rowObj[header] = values[idx] ?? '';
    });
    rows.push(rowObj);
  }

  return { headers: normalizedHeaders, rows };
}

export function validateAndNormalizeSOCData(content: string, mimeType: string): IngestionResult {
  const errors: { row: number; field: string; message: string }[] = [];
  const normalizedCases: Partial<Case>[] = [];
  const normalizedAlerts: Partial<Alert>[] = [];
  const seenKeys = new Set<string>();
  const entitiesSet = new Set<string>();
  const severityCounts: Record<string, number> = { LOW: 0, MEDIUM: 0, HIGH: 0, CRITICAL: 0 };
  let duplicates = 0;

  // Protect against overly massive single-payload files (e.g. >10,000 rows for demo safety)
  const MAX_ALLOWED_ROWS = 10000;

  let rawRecords: Record<string, any>[] = [];

  try {
    if (mimeType.includes('json') || content.trim().startsWith('[') || content.trim().startsWith('{')) {
      const parsed = JSON.parse(content);
      const items = Array.isArray(parsed) ? parsed : (parsed.records || parsed.data || [parsed]);
      rawRecords = items.map((item: Record<string, any>) => {
        const normalizedItem: Record<string, any> = {};
        for (const [k, v] of Object.entries(item)) {
          normalizedItem[normalizeColumnName(k)] = v;
        }
        return normalizedItem;
      });
    } else {
      const parsedCsv = parseCSVToObjects(content);
      rawRecords = parsedCsv.rows;
    }
  } catch (err: any) {
    return {
      success: false,
      totalRecords: 0,
      acceptedRecords: 0,
      rejectedRecords: 0,
      errors: [{ row: 0, field: 'file', message: `Malformed data syntax: ${err.message}` }],
      normalizedCases: [],
      normalizedAlerts: [],
      summary: { entitiesDetected: [], severityCounts: {}, duplicatesFiltered: 0 }
    };
  }

  if (rawRecords.length > MAX_ALLOWED_ROWS) {
    return {
      success: false,
      totalRecords: rawRecords.length,
      acceptedRecords: 0,
      rejectedRecords: rawRecords.length,
      errors: [{ row: 0, field: 'row_limit', message: `Dataset exceeds maximum limit of ${MAX_ALLOWED_ROWS} rows.` }],
      normalizedCases: [],
      normalizedAlerts: [],
      summary: { entitiesDetected: [], severityCounts: {}, duplicatesFiltered: 0 }
    };
  }

  rawRecords.forEach((record, idx) => {
    const rowNum = idx + 1;
    const title = record.title || record.description || record.name || `Case Record #${rowNum}`;
    const entityId = record.entity_id || record.entity || 'Entity-Default';
    const caseId = record.case_id || `CASE-${Date.now().toString().slice(-4)}-${idx + 1}`;
    const severity = normalizeSeverity(record.severity);

    // Dedup check
    const dedupKey = `${entityId}:${caseId}:${title}`;
    if (seenKeys.has(dedupKey)) {
      duplicates++;
      return;
    }
    seenKeys.add(dedupKey);

    // Timestamp check
    const rawTime = record.timestamp || record.time || new Date().toISOString();
    const parsedDate = new Date(rawTime);
    const validTimestamp = !isNaN(parsedDate.getTime()) ? parsedDate.toISOString() : new Date().toISOString();

    entitiesSet.add(entityId);
    severityCounts[severity] = (severityCounts[severity] || 0) + 1;

    normalizedCases.push({
      id: caseId,
      caseNumber: caseId,
      entityId,
      title,
      severity,
      status: (record.status?.toUpperCase() || 'OPEN') as any,
      assignedAnalyst: record.analyst || 'SOC Analyst Tier 1',
      createdAt: validTimestamp,
      slaTargetMinutes: severity === 'CRITICAL' ? 60 : severity === 'HIGH' ? 120 : 240,
      slaBreached: record.sla_breached === 'true' || record.sla_breached === true
    });
  });

  return {
    success: errors.length === 0 || normalizedCases.length > 0,
    totalRecords: rawRecords.length,
    acceptedRecords: normalizedCases.length,
    rejectedRecords: rawRecords.length - normalizedCases.length,
    errors,
    normalizedCases,
    normalizedAlerts,
    summary: {
      entitiesDetected: Array.from(entitiesSet),
      severityCounts,
      duplicatesFiltered: duplicates
    }
  };
}
