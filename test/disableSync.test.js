import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

const LS_KEY = 'insultoKomandaPatients_v1';

function seedPatient() {
  const patientId = 'demo';
  const patient = {
    patientId,
    name: 'Test Pacientas',
    created: '2024-01-01T00:00:00.000Z',
    lastUpdated: '2024-01-01T00:00:00.000Z',
    needsSync: true,
    data: { version: 1, data: { foo: 'bar' } },
  };
  localStorage.setItem(LS_KEY, JSON.stringify({ [patientId]: patient }));
}

test(
  'stored disableSync="false" keeps sync enabled after reload',
  { concurrency: false },
  async () => {
    localStorage.clear();
    navigator.onLine = true;
    localStorage.setItem('disableSync', 'false');
    seedPatient();

    const { syncPatients } = await import('../js/sync.js?persistFalse');
    assert.equal(window.disableSync, false);
    assert.equal(localStorage.getItem('disableSync'), 'false');

    const calls = [];
    const originalFetch = global.fetch;
    global.fetch = async (url, options = {}) => {
      calls.push({ url, method: options.method });
      return { ok: true, status: 200 };
    };

    try {
      await syncPatients();
    } finally {
      global.fetch = originalFetch;
    }

    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/patients'));
  },
);

test(
  'syncPatients runs on first load when sync has never been disabled',
  { concurrency: false },
  async () => {
    localStorage.clear();
    navigator.onLine = true;
    seedPatient();

    const { syncPatients } = await import('../js/sync.js?firstLoadCheck');
    assert.equal(window.disableSync, false);

    const calls = [];
    const originalFetch = global.fetch;
    global.fetch = async (url, options = {}) => {
      calls.push({ url, method: options.method });
      return { ok: true, status: 200 };
    };

    try {
      await syncPatients();
    } finally {
      global.fetch = originalFetch;
    }

    assert.equal(calls.length, 1);
    assert.ok(calls[0].url.endsWith('/patients'));
  },
);
