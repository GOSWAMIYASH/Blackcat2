import test from 'node:test';
import assert from 'node:assert/strict';
import { canUserAccess } from '../server/auth';

test('Lead Examiner can access review, reports, uploads, and scenario controls', () => {
  assert.equal(canUserAccess('Lead Examiner', 'review_decision'), true);
  assert.equal(canUserAccess('Lead Examiner', 'generate_report'), true);
  assert.equal(canUserAccess('Lead Examiner', 'upload_evidence'), true);
  assert.equal(canUserAccess('Lead Examiner', 'load_scenario'), true);
});

test('SOC Supervisor can clarify and upload but cannot make final decisions', () => {
  assert.equal(canUserAccess('SOC Supervisor', 'submit_clarification'), true);
  assert.equal(canUserAccess('SOC Supervisor', 'upload_evidence'), true);
  assert.equal(canUserAccess('SOC Supervisor', 'review_decision'), false);
  assert.equal(canUserAccess('SOC Supervisor', 'generate_report'), false);
  assert.equal(canUserAccess('SOC Supervisor', 'load_scenario'), false);
});

test('Auditor has read-only reporting and analytics access', () => {
  assert.equal(canUserAccess('Auditor', 'view_reports'), true);
  assert.equal(canUserAccess('Auditor', 'access_analytics'), true);
  assert.equal(canUserAccess('Auditor', 'review_decision'), false);
  assert.equal(canUserAccess('Auditor', 'upload_evidence'), false);
  assert.equal(canUserAccess('Auditor', 'generate_report'), false);
});

test('unknown roles cannot access protected actions', () => {
  assert.equal(canUserAccess(undefined, 'review_decision'), false);
  assert.equal(canUserAccess(undefined, 'access_analytics'), false);
});
