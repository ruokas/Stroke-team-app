import { getInputs } from './state.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { updateAge } from './age.js';
import { createBpEntry } from './bpEntry.js';
import { FIELD_DEFS } from './storage/fields.js';
import { SCHEMA_VERSION } from './storage/migrations.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';
import { track, flush } from './analytics.js';
import { syncPatients, restorePatients } from './sync.js';
import { deletePatientById } from './services/patientApi.js';
import { generatePatientId, migratePatientRecord } from './domain/patient.js';

const LS_KEY = 'insultoKomandaPatients_v1';

export { migratePatientRecord };

if (typeof window !== 'undefined') {
  window.addEventListener('unload', flush);
  if (navigator.onLine && !window.disableSync) restorePatients();
}

export function getPatients() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    const patients = JSON.parse(raw);
    let migrated = false;
    Object.entries(patients).forEach(([id, p]) => {
      const { record, changed, error } = migratePatientRecord(id, p);
      if (record) patients[id] = record;
      else delete patients[id];
      if (changed) migrated = true;
      if (error) {
        track('error', {
          message: 'Discarded patient record during migration',
          patientId: id,
          code: error.code,
          source: 'storage.js',
        });
      }
    });
    if (migrated) setPatients(patients);
    return patients;
  } catch (e) {
    console.error(e);
    track('error', {
      message: e.message || 'Failed to load patients',
      stack: e.stack,
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
      message: e.message || 'Failed to save patients',
      stack: e.stack,
      source: 'storage.js',
    });
    showToast(t('storage_full'), { type: 'error' });
  }
}

export function getPayload() {
  const inputs = getInputs();
  /** @type {Record<string, unknown>} */
  const payload = {};
  FIELD_DEFS.forEach(({ key, alias, selector, get, default: def }) => {
    const input = selector ? inputs[selector] : undefined;
    let val;
    if (get) {
      if (input === undefined || input === null) {
        val = def !== undefined ? def : get([]);
      } else {
        val = get(input);
      }
    } else if (input && 'value' in input) {
      val = input.value || '';
    } else {
      val = def !== undefined ? def : '';
    }
    payload[key] = val;
    if (alias) alias.forEach((a) => (payload[a] = val));
  });
  payload.bp_meds = Array.from(
    document.querySelectorAll('#bpEntries .bp-entry'),
  ).map((entry) => {
    const medEl = entry.querySelector('strong');
    const med = medEl ? medEl.textContent || '' : '';
    const [timeEl, doseEl, sysAfterEl, diaAfterEl, notesEl] =
      entry.querySelectorAll('input');
    return {
      time: timeEl?.value || '',
      med,
      dose: doseEl?.value || '',
      unit: doseEl?.dataset?.unit || doseEl?.placeholder || '',
      bp_sys_after: sysAfterEl?.value || '',
      bp_dia_after: diaAfterEl?.value || '',
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
      if (
        input !== undefined &&
        input !== null &&
        (!Array.isArray(input) || input.length)
      ) {
        set(input, value, payload);
      }
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
        m.unit || '',
        m.bp_sys_after || '',
        m.bp_dia_after || '',
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
  const patientId = `${id || generatePatientId()}`;
  const existing = patients[patientId] || {};
  const existingData =
    existing.data && typeof existing.data === 'object' ? existing.data : {};
  const now = new Date().toISOString();
  const formName = inputs.a_name?.value?.trim?.() || '';
  const patientName =
    name ||
    (formName ? formName : '') ||
    existing.name ||
    inputs.nih0?.value ||
    `Pacientas ${patientId}`;
  const storedVersion = Number.isFinite(existingData.version)
    ? existingData.version
    : SCHEMA_VERSION;
  patients[patientId] = {
    patientId,
    name: patientName,
    created: existing.created || now,
    lastUpdated: now,
    needsSync: true,
    data: {
      version: storedVersion < SCHEMA_VERSION ? SCHEMA_VERSION : storedVersion,
      data: getPayload(),
    },
  };
  setPatients(patients);
  track('patient_save', { patientId, name: patientName });
  if (
    !window.disableSync &&
    typeof navigator !== 'undefined' &&
    navigator.onLine
  )
    syncPatients();
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
    if (
      !window.disableSync &&
      typeof navigator !== 'undefined' &&
      navigator.onLine
    ) {
      deletePatientById(id).catch((error) => {
        console.error('Failed to delete patient on server', error);
        track('error', {
          message: 'Failed to delete patient on server',
          patientId: id,
          stack: error.stack,
          source: 'storage.js',
        });
      });
    }
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
