import { showToast } from './toast.js';
import { t } from './i18n.js';
import { track } from './analytics.js';

const LS_KEY = 'insultoKomandaPatients_v1';
const API_BASE =
  (typeof window !== 'undefined' && window.API_BASE) ||
  (typeof process !== 'undefined' && process.env.API_BASE) ||
  '/api';

const SYNC_FAIL_TOAST_INTERVAL = 60_000; // 1 minute
const MAX_CONSECUTIVE_SYNC_FAILS = 3;
let lastSyncFailToast = 0;
let consecutiveSyncFails = 0;

function loadLocalPatients() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}');
  } catch {
    return {};
  }
}

function saveLocalPatients(patients) {
  localStorage.setItem(LS_KEY, JSON.stringify(patients));
}

export async function syncPatients() {
  if (typeof window !== 'undefined' && window.disableSync) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  const patients = loadLocalPatients();
  let changed = false;
  let failed = false;
  for (const [id, p] of Object.entries(patients)) {
    if (!p?.needsSync) continue;
    try {
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });
      if (res.status === 404) continue;
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      p.needsSync = false;
      changed = true;
    } catch (e) {
      failed = true;
      console.error('Failed to sync patient', id, e);
      track('error', {
        message: 'Failed to sync patient',
        patientId: id,
        stack: e?.stack,
        source: 'sync.js',
      });
    }
  }
  if (changed) saveLocalPatients(patients);
  if (failed) {
    consecutiveSyncFails += 1;
    const now = Date.now();
    if (now - lastSyncFailToast > SYNC_FAIL_TOAST_INTERVAL) {
      showToast(t('sync_failed'), { type: 'error' });
      lastSyncFailToast = now;
    }
    if (
      typeof window !== 'undefined' &&
      consecutiveSyncFails >= MAX_CONSECUTIVE_SYNC_FAILS
    ) {
      window.disableSync = true;
      showToast(t('local_storage_enabled'), { type: 'info' });
    }
  } else {
    consecutiveSyncFails = 0;
  }
}

export async function restorePatients() {
  if (typeof window !== 'undefined' && window.disableSync) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  try {
    const res = await fetch(`${API_BASE}/patients`);
    if (res.status === 404) return;
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const serverData = await res.json();
    if (!serverData || typeof serverData !== 'object') return;
    const localData = loadLocalPatients();
    let changed = false;
    const merged = { ...localData };
    const remotes = Array.isArray(serverData)
      ? serverData
      : Object.entries(serverData).map(([id, data]) => ({
          ...data,
          patient_id: id,
        }));
    for (const remote of remotes) {
      const id = remote?.patient_id;
      if (!id) continue;
      const local = merged[id];
      if (!local) {
        merged[id] = { ...remote, needsSync: false };
        changed = true;
      } else {
        const lt = new Date(local.lastUpdated || 0).getTime();
        const rt = new Date(remote.lastUpdated || 0).getTime();
        if (rt > lt) {
          merged[id] = { ...remote, needsSync: false };
          changed = true;
        }
      }
    }
    if (changed) saveLocalPatients(merged);
  } catch (e) {
    console.error('Failed to restore patients', e);
    track('error', {
      message: 'Failed to restore patients',
      stack: e?.stack,
      source: 'sync.js',
    });
    showToast(t('restore_failed'), { type: 'error' });
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => {
    syncPatients();
    restorePatients();
  });
}

if (typeof document !== 'undefined') {
  document.getElementById('syncBtn')?.addEventListener('click', () => {
    syncPatients().then(restorePatients);
  });
  document.getElementById('enableLocalBtn')?.addEventListener('click', () => {
    window.disableSync = true;
    showToast(t('local_storage_enabled'), { type: 'info' });
  });
}
