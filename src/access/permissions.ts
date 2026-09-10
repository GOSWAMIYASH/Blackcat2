import { UserRole } from '../types';

export type Permission =
  | 'view_dashboard'
  | 'view_negative_space'
  | 'view_findings'
  | 'view_review_queue'
  | 'view_analytics'
  | 'view_entities'
  | 'view_reports'
  | 'view_audit_logs'
  | 'generate_report'
  | 'view_reports_readonly'
  | 'ingest_evidence'
  | 'review_decision'
  | 'request_evidence'
  | 'submit_clarification'
  | 'upload_evidence'
  | 'view_peer_comparison'
  | 'view_all_findings'
  | 'view_own_analytics'
  | 'view_ai_reasoning'
  | 'view_data_lineage'
  | 'view_activity_history';

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  'Lead Examiner': [
    'view_dashboard',
    'view_negative_space',
    'view_findings',
    'view_review_queue',
    'view_analytics',
    'view_entities',
    'view_reports',
    'view_audit_logs',
    'generate_report',
    'ingest_evidence',
    'review_decision',
    'request_evidence',
    'view_peer_comparison',
    'view_all_findings',
    'view_ai_reasoning',
    'view_data_lineage',
    'view_activity_history'
  ],
  'SOC Supervisor': [
    'view_dashboard',
    'view_negative_space',
    'view_findings',
    'view_analytics',
    'view_entities',
    'view_audit_logs',
    'submit_clarification',
    'upload_evidence',
    'view_own_analytics',
    'view_ai_reasoning',
    'view_activity_history'
  ],
  Auditor: [
    'view_dashboard',
    'view_findings',
    'view_analytics',
    'view_reports',
    'view_audit_logs',
    'view_all_findings',
    'view_reports_readonly',
    'view_ai_reasoning',
    'view_data_lineage',
    'view_activity_history'
  ]
};

export function canAccess(role: UserRole | null | undefined, permission: Permission): boolean {
  if (!role) return false;
  return (ROLE_PERMISSIONS[role] ?? []).includes(permission);
}

export const NAV_PERMISSION_MAP: Record<string, Permission> = {
  dashboard: 'view_dashboard',
  'negative-space': 'view_negative_space',
  findings: 'view_findings',
  'review-queue': 'view_review_queue',
  analytics: 'view_analytics',
  entities: 'view_entities',
  reports: 'view_reports',
  'audit-logs': 'view_audit_logs'
};
