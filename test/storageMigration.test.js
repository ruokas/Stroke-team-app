import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

const { migratePatientRecord } = await import('../js/storage.js');
const { migrateSchema, SCHEMA_VERSION } = await import(
  '../js/storage/migrations.js'
);

test('legacy record without version is migrated to current schema', () => {
  const legacy = { data: { foo: 'bar' } };
  const { record, changed } = migratePatientRecord('id1', legacy);
  assert.ok(record, 'record should not be null');
  assert.strictEqual(record.data.version, SCHEMA_VERSION);
  assert.deepEqual(record.data.data, { foo: 'bar' });
  assert.ok(changed);
});

test('record with invalid schema is discarded', () => {
  assert.throws(() => migrateSchema({ version: 999, data: {} }));
  const { record, changed } = migratePatientRecord('id2', {
    data: { version: 999, data: {} },
  });
  assert.strictEqual(record, null);
  assert.ok(changed);
});
