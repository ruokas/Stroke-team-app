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
  'sync disables after three consecutive failures and stays disabled after reload',
  { concurrency: false },
  async () => {
    localStorage.clear();
    navigator.onLine = true;
    window.disableSync = false;
    seedPatient();

    const originalFetch = global.fetch;

    let failCalls = 0;
    global.fetch = async () => {
      failCalls += 1;
      return { ok: false, status: 500 };
    };

    try {
      const { syncPatients } = await import('../js/sync.js?consecutiveFails');
      for (let i = 0; i < 3; i += 1) {
        await syncPatients();
      }
    } finally {
      global.fetch = originalFetch;
    }

    assert.equal(failCalls, 3);
    assert.equal(window.disableSync, true);
    assert.equal(localStorage.getItem('disableSync'), 'true');

    const toggle = document.getElementById('enableLocalBtn');
    assert.ok(toggle);
    assert.equal(toggle.checked, true);
    assert.equal(toggle.getAttribute('aria-checked'), 'true');

    toggle.checked = false;
    toggle.setAttribute('aria-checked', 'false');
    window.disableSync = false;

    let postReloadCalls = 0;
    const originalFetchAfter = global.fetch;
    global.fetch = async () => {
      postReloadCalls += 1;
      return { ok: true, status: 200 };
    };

    try {
      const { syncPatients: syncAfterReload } = await import(
        '../js/sync.js?afterReload'
      );
      assert.equal(window.disableSync, true);
      const toggleAfter = document.getElementById('enableLocalBtn');
      assert.ok(toggleAfter);
      assert.equal(toggleAfter.checked, true);
      assert.equal(toggleAfter.getAttribute('aria-checked'), 'true');

      await syncAfterReload();
      assert.equal(postReloadCalls, 0);
    } finally {
      global.fetch = originalFetchAfter;
    }
  },
);

test('syncPatients switches to local mode when API returns 466', async () => {
  localStorage.clear();
  navigator.onLine = true;
  window.disableSync = false;
  seedPatient();

  const { toast } = await import('../js/toast.js');
  const messages = [];
  const originalToast = toast.showToast;
  toast.showToast = (msg, opts) => {
    messages.push(msg);
    return originalToast(msg, opts);
  };

  const originalFetch = global.fetch;
  global.fetch = async () => ({ status: 466, ok: false });

  try {
    const { syncPatients } = await import('../js/sync.js?missing466');
    await syncPatients();
  } finally {
    global.fetch = originalFetch;
    toast.showToast = originalToast;
  }

  const stored = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  assert.ok(stored.demo);
  assert.equal(stored.demo.needsSync, true);
  assert.deepEqual(stored.demo.data, { version: 1, data: { foo: 'bar' } });
  assert.equal(window.disableSync, true);
  assert.equal(localStorage.getItem('disableSync'), 'true');

  const { t } = await import('../js/i18n.js');
  assert.equal(messages.includes(t('sync_failed')), false);
  assert.equal(messages.includes(t('local_storage_enabled')), true);
});
