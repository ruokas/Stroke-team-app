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
});
