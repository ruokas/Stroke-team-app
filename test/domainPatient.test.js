import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  buildServerPayload,
  migratePatientRecord,
  normalizeRemotePatient,
} from '../js/domain/patient.js';
import { basePatientPayload } from './fixtures/patientPayload.js';

test('buildServerPayload uses a fallback patient name', () => {
  const record = { patientId: 'abc', payload: basePatientPayload.payload };
  const payload = buildServerPayload('abc', record);
  assert.equal(payload.patient_id, 'abc');
  assert.equal(payload.name, 'Pacientas abc');
});

test('normalizeRemotePatient fills defaults for missing fields', () => {
  const normalized = normalizeRemotePatient({ patient_id: '123' });
  assert.ok(normalized);
  assert.equal(normalized.patientId, '123');
  assert.equal(normalized.name, 'Pacientas 123');
  assert.equal(normalized.needsSync, false);
  assert.ok(normalized.created);
  assert.ok(normalized.lastUpdated);
});

test('migratePatientRecord upgrades payload schema', () => {
  const record = { data: { version: 0, data: { ok: true } } };
  const result = migratePatientRecord('99', record);
  assert.equal(result.record.data.version, 1);
  assert.deepEqual(result.record.data.data, { ok: true });
});
