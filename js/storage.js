import { getInputs } from './state.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { updateAge } from './age.js';
import { createBpEntry } from './bpEntry.js';
import { FIELD_DEFS } from './storage/fields.js';
import { migrateSchema, SCHEMA_VERSION } from './storage/migrations.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';
import { track, flush } from './analytics.js';
import { syncPatients, restorePatients } from './sync.js';

const LS_KEY = 'insultoKomandaPatients_v1';

window.addEventListener('unload', flush);
if (typeof navigator !== 'undefined' && navigator.onLine) restorePatients();

export function migratePatientRecord(id, p) {
  let changed = false;
  if (!p.patientId) {
    p.patientId = id;
    changed = true;
  }
  if (!p.created) {
    p.created = new Date().toISOString();
    changed = true;
  }
  if (!p.lastUpdated) {
    p.lastUpdated = p.created;
    changed = true;
  }
  if (!p.data || typeof p.data !== 'object' || p.data.version === undefined) {
    p.data = { version: 0, data: p.data };
    changed = true;
  }
  if (p.data.version !== SCHEMA_VERSION) {
    try {
      p.data = migrateSchema(p.data);
      if (p.data.version !== SCHEMA_VERSION) throw new Error('');
      changed = true;
    } catch {
      console.warn(
        `Discarding patient ${id} due to incompatible schema version ${p.data.version}`,
      );
      return { record: null, changed: true };
    }
  }
  return { record: p, changed };
}

export function getPatients() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    const patients = JSON.parse(raw);
    let migrated = false;
    Object.entries(patients).forEach(([id, p]) => {
      const { record, changed } = migratePatientRecord(id, p);
      if (record) patients[id] = record;
      else delete patients[id];
      if (changed) migrated = true;
    });
    if (migrated) setPatients(patients);
    return patients;
  } catch (e) {
    console.error(e);
    track('error', {
      message: e?.message || 'Failed to load patients',
      stack: e?.stack,
      source: 'storage.js',
    });
    localStorage.removeItem(LS_KEY);
    return {};
  }
}

function setPatients(patients) {
  const keys = Object.keys(patients);
  try {
    if (keys.length) localStorage.setItem(LS_KEY, JSON.stringify(patients));
    else localStorage.removeItem(LS_KEY);
  } catch (e) {
    console.error(e);
    track('error', {
      message: e?.message || 'Failed to save patients',
      stack: e?.stack,
      source: 'storage.js',
    });
    showToast(t('storage_full'), { type: 'error' });
  }
}

export function getPayload() {
  const inputs = getInputs();
  /** @type {Record<string, unknown>} */
  const payload = {};
  FIELD_DEFS.forEach(({ key, alias, selector, get }) => {
    const input = selector ? inputs[selector] : undefined;
    const val = get ? get(input) : input?.value || '';
    payload[key] = val;
    if (alias) alias.forEach((a) => (payload[a] = val));
  });
  payload.bp_meds = Array.from(
    document.querySelectorAll('#bpEntries .bp-entry'),
  ).map((entry) => {
    const med = entry.querySelector('strong')?.textContent || '';
    const [timeEl, doseEl, notesEl] = entry.querySelectorAll('input');
    return {
      time: timeEl?.value || '',
      med,
      dose: doseEl?.value || '',
      notes: notesEl?.value || '',
    };
  });
  return payload;
}

export function setPayload(p) {
  if (!p) return;
  const payload = p.version !== undefined ? p.data : p;
  const inputs = getInputs();
  FIELD_DEFS.forEach(({ key, alias, selector, set, default: def }) => {
    const input = selector ? inputs[selector] : undefined;
    let value = payload[key];
    if (value === undefined && alias) {
      for (const a of alias) {
        if (payload[a] !== undefined) {
          value = payload[a];
          break;
        }
      }
    }
    if (value === undefined) value = def;
    if (set) {
      set(input, value, payload);
    } else if (input) {
      if (Array.isArray(input)) return;
      if ('value' in input) input.value = value ?? '';
      else if ('checked' in input) input.checked = !!value;
    }
  });
  const bpContainer = document.getElementById('bpEntries');
  if (bpContainer) {
    bpContainer.innerHTML = '';
    (payload.bp_meds || []).forEach((m) => {
      const entry = createBpEntry(
        m.med || '',
        m.dose || '',
        m.time,
        m.notes || '',
      );
      bpContainer.appendChild(entry);
    });
  }
  updateAge();
  updateDrugDefaults();
  calcDrugs();
}

export function savePatient(id, name) {
  const inputs = getInputs();
  const patients = getPatients();
  const patientId = id || Date.now().toString();
  const now = new Date().toISOString();
  const patientName =
    name ||
    patients[patientId]?.name ||
    inputs.nih0?.value ||
    `Pacientas ${patientId}`;
  patients[patientId] = {
    patientId,
    name: patientName,
    created: patients[patientId]?.created || now,
    lastUpdated: now,
    data: {
      version:
        (patients[patientId]?.data?.version || 0) < SCHEMA_VERSION
          ? SCHEMA_VERSION
          : patients[patientId]?.data?.version || SCHEMA_VERSION,
      data: getPayload(),
    },
  };
  setPatients(patients);
  track('patient_save', { patientId, name: patientName });
  if (typeof navigator !== 'undefined' && navigator.onLine) syncPatients();
  return patientId;
}

export function loadPatient(id) {
  const patients = getPatients();
  const rec = patients[id];
  if (!rec) return null;
  const d = rec.data;
  return d && d.version !== undefined ? d.data : d;
}

export function deletePatient(id) {
  const patients = getPatients();
  if (patients[id]) {
    delete patients[id];
    setPatients(patients);
    track('patient_delete', { patientId: id });
  }
}

export function renamePatient(id, newName) {
  const patients = getPatients();
  if (patients[id]) {
    patients[id].name = newName;
    setPatients(patients);
    track('patient_rename', { patientId: id, newName });
  }
}
