import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

const { restorePatients } = await import('../js/sync.js');

const LS_KEY = 'insultoKomandaPatients_v1';

function setLocal(data) {
  localStorage.setItem(LS_KEY, JSON.stringify(data));
}

function getLocal() {
  return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
}

test('restorePatients merges array responses using patient_id', async () => {
  localStorage.clear();
  setLocal({ local1: { name: 'Local', lastUpdated: '2020-01-01' } });
  navigator.onLine = true;
  window.disableSync = false;

  const remotePatients = [
    {
      patient_id: 'remote1',
      name: 'Remote',
      lastUpdated: '2024-01-01',
    },
  ];

  const origFetch = global.fetch;
  global.fetch = async () => ({
    status: 200,
    ok: true,
    json: async () => remotePatients,
  });

  await restorePatients();
  global.fetch = origFetch;

  const stored = getLocal();
  assert.ok(stored.local1);
  assert.ok(stored.remote1);
  assert.equal(stored.remote1.name, 'Remote');
  assert.equal(stored.remote1.needsSync, false);
  assert.equal(stored.remote1.patientId, 'remote1');
  assert.equal(stored.remote1.lastUpdated, '2024-01-01');
  assert.deepEqual(stored.remote1.data, { version: 1, data: {} });
});

test('restorePatients maps API rows to camelCase with versioned data', async () => {
  localStorage.clear();
  setLocal({});
  navigator.onLine = true;
  window.disableSync = false;

  const remotePatients = [
    {
      patient_id: 42,
      name: 'Server Pacientas',
      created: '2024-01-01T00:00:00.000Z',
      last_updated: '2024-01-02T12:00:00.000Z',
      payload: {
        version: 1,
        data: {
          a_name: 'Jonas',
          a_age: '67',
        },
      },
    },
  ];

  const origFetch = global.fetch;
  global.fetch = async () => ({
    status: 200,
    ok: true,
    json: async () => remotePatients,
  });

  await restorePatients();
  global.fetch = origFetch;

  const stored = getLocal();
  assert.ok(stored['42']);
  assert.equal(stored['42'].patientId, '42');
  assert.equal(stored['42'].lastUpdated, '2024-01-02T12:00:00.000Z');
  assert.equal(stored['42'].needsSync, false);
  assert.deepEqual(stored['42'].data, {
    version: 1,
    data: {
      a_name: 'Jonas',
      a_age: '67',
    },
  });
});

test('restorePatients wraps legacy payloads into the schema envelope', async () => {
  localStorage.clear();
  setLocal({});
  navigator.onLine = true;
  window.disableSync = false;

  const remotePatients = [
    {
      patient_id: 'legacy',
      name: 'Senas Pacientas',
      last_updated: '2023-12-31T23:59:59.000Z',
      payload: {
        foo: 'bar',
      },
    },
  ];

  const origFetch = global.fetch;
  global.fetch = async () => ({
    status: 200,
    ok: true,
    json: async () => remotePatients,
  });

  await restorePatients();
  global.fetch = origFetch;

  const stored = getLocal();
  assert.ok(stored.legacy);
  assert.deepEqual(stored.legacy.data, {
    version: 1,
    data: {
      foo: 'bar',
    },
  });
  assert.equal(stored.legacy.lastUpdated, '2023-12-31T23:59:59.000Z');
});
