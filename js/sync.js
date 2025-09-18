import { showToast } from './toast.js';
import { t } from './i18n.js';
import { track } from './analytics.js';
import { SCHEMA_VERSION } from './storage/migrations.js';

const LS_KEY = 'insultoKomandaPatients_v1';
const API_BASE =
  (typeof window !== 'undefined' && window.API_BASE) ||
  (typeof process !== 'undefined' && process.env.API_BASE) ||
  '/api';

const SYNC_FAIL_TOAST_INTERVAL = 60_000; // 1 minute
const MAX_CONSECUTIVE_SYNC_FAILS = 3;
let lastSyncFailToast = 0;
let consecutiveSyncFails = 0;

function isMissingEndpoint(status) {
  const code = Number(status);
  return code === 404 || code === 405 || code === 410 || code === 466;
}

function switchToLocalOnlyMode({ status, context }) {
  if (typeof window === 'undefined') return;
  const alreadyDisabled = Boolean(window.disableSync);
  window.disableSync = true;
  if (typeof localStorage !== 'undefined') {
    localStorage.setItem('disableSync', 'true');
  }
  syncEnableLocalBtnState();
  track('sync_missing_endpoint', {
    status,
    context,
    source: 'sync.js',
  });
  if (!alreadyDisabled) {
    showToast(t('local_storage_enabled'), { type: 'info' });
  }
}

if (typeof window !== 'undefined') {
  const saved = localStorage.getItem('disableSync');
  window.disableSync = saved === 'true';
}

function buildServerPayload(id, record) {
  if (!record || typeof record !== 'object') return null;
  const computedId =
    record.patientId ?? record.patient_id ?? (id !== undefined ? id : null);
  const patientId =
    computedId !== undefined &&
    computedId !== null &&
    `${computedId}`.trim() !== ''
      ? computedId
      : null;
  const payload = record.data ?? record.payload ?? null;
  const lastUpdated = record.last_updated ?? record.lastUpdated ?? null;
  const created = record.created ?? record.created_at ?? null;
  const nameValue =
    typeof record.name === 'string' && record.name.trim() !== ''
      ? record.name
      : patientId
        ? `Pacientas ${patientId}`
        : 'Pacientas';

  const body = {
    patient_id: patientId,
    name: nameValue,
    payload,
  };

  if (!body.patient_id && id !== undefined && id !== null) {
    body.patient_id = id;
  }

  if (lastUpdated) body.last_updated = lastUpdated;
  if (created) body.created = created;

  return body;
}

function toVersionedData(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    'version' in payload &&
    'data' in payload
  ) {
    return {
      version: payload.version,
      data: payload.data,
    };
  }
  return {
    version: SCHEMA_VERSION,
    data: payload ?? {},
  };
}

function mapRemotePatient(remote) {
  if (!remote || typeof remote !== 'object') return null;
  const rawId =
    remote.patientId ??
    remote.patient_id ??
    remote.id ??
    remote.patientID ??
    null;
  const lastUpdated =
    remote.lastUpdated ??
    remote.last_updated ??
    remote.updated_at ??
    remote.updatedAt ??
    null;
  const payload = remote.payload ?? remote.data ?? null;
  const mapped = { ...remote };
  if (rawId !== undefined && rawId !== null && `${rawId}`.trim() !== '') {
    mapped.patientId = `${rawId}`;
  }
  if (lastUpdated) {
    mapped.lastUpdated = lastUpdated;
  }
  const basePayload =
    payload !== undefined
      ? payload
      : mapped.data !== undefined
        ? mapped.data
        : null;
  mapped.data = toVersionedData(basePayload);
  return mapped;
}

function normalizeRemotePatient(remote) {
  if (!remote || typeof remote !== 'object') return null;
  const rawId =
    remote.patientId ??
    remote.patient_id ??
    remote.id ??
    remote.patientID ??
    null;
  if (rawId === undefined || rawId === null || `${rawId}`.trim() === '')
    return null;
  const patientId = `${rawId}`;
  const payload = remote.data ?? remote.payload ?? null;
  const created =
    remote.created ?? remote.created_at ?? remote.createdAt ?? null;
  const lastUpdated =
    remote.lastUpdated ??
    remote.last_updated ??
    remote.updated_at ??
    remote.updatedAt ??
    created ??
    null;

  const normalized = {
    patientId,
    name:
      typeof remote.name === 'string' && remote.name.trim() !== ''
        ? remote.name
        : `Pacientas ${patientId}`,
    created: created ?? new Date().toISOString(),
    lastUpdated: lastUpdated ?? new Date().toISOString(),
    data: payload ?? null,
    needsSync: false,
  };

  if (remote.last_updated) normalized.last_updated = remote.last_updated;
  if (remote.payload !== undefined && normalized.data === remote.payload) {
    normalized.payload = remote.payload;
  }

  return normalized;
}

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
  let missingEndpointDetected = false;
  for (const [id, p] of Object.entries(patients)) {
    if (!p?.needsSync) continue;
    try {
      const bodyPayload = buildServerPayload(id, p);
      if (!bodyPayload) continue;
      const res = await fetch(`${API_BASE}/patients`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });
      if (isMissingEndpoint(res.status)) {
        missingEndpointDetected = true;
        switchToLocalOnlyMode({ status: res.status, context: 'syncPatients' });
        break;
      }
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
  if (missingEndpointDetected) {
    consecutiveSyncFails = 0;
    return;
  }
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
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('disableSync', 'true');
      }
      syncEnableLocalBtnState();
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
    if (isMissingEndpoint(res.status)) {
      switchToLocalOnlyMode({ status: res.status, context: 'restorePatients' });
      return;
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const serverData = await res.json();
    if (!serverData || typeof serverData !== 'object') return;
    const localData = loadLocalPatients();
    let changed = false;
    const merged = { ...localData };
    const remotes = (
      Array.isArray(serverData)
        ? serverData
        : Object.entries(serverData).map(([id, data]) => ({
            ...data,
            patient_id: id,
          }))
    )
      .map(mapRemotePatient)
      .filter(Boolean);
    for (const remote of remotes) {
      const normalized = normalizeRemotePatient(remote);
      if (!normalized) continue;
      const id = normalized.patientId;
      const local = merged[id];
      if (!local) {
        merged[id] = { ...normalized };
        changed = true;
      } else {
        const lt = new Date(
          local.lastUpdated || local.last_updated || 0,
        ).getTime();
        const rt = new Date(normalized.lastUpdated || 0).getTime();
        if (rt > lt) {
          merged[id] = { ...normalized };
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

function syncEnableLocalBtnState() {
  if (typeof document === 'undefined') return;
  const enableLocalBtn = document.getElementById('enableLocalBtn');
  if (!enableLocalBtn) return;
  const disabled = Boolean(window.disableSync);
  enableLocalBtn.checked = disabled;
  enableLocalBtn.setAttribute('aria-checked', String(disabled));
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
  const enableLocalBtn = document.getElementById('enableLocalBtn');
  if (enableLocalBtn) {
    syncEnableLocalBtnState();
    enableLocalBtn.addEventListener('change', () => {
      const enabled = enableLocalBtn.checked;
      window.disableSync = enabled;
      localStorage.setItem('disableSync', String(enabled));
      syncEnableLocalBtnState();
      if (enabled) {
        showToast(t('local_storage_enabled'), { type: 'info' });
      } else {
        showToast(t('local_storage_disabled'), { type: 'info' });
        syncPatients().then(restorePatients);
      }
    });
  }
}
