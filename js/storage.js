import { state, getInputs } from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';
import { createBpEntry } from './bpEntry.js';

const LS_KEY = 'insultoKomandaPatients_v1';
// Current version of the payload schema stored in localStorage
const SCHEMA_VERSION = 1;

function migrateSchema(rec) {
  // Attempt to migrate an older schema to the current version.
  // Currently, schema v0 simply wrapped the payload without versioning.
  if (rec.version === 0) return { version: 1, data: rec.data };
  if (rec.version === 1) return { version: SCHEMA_VERSION, data: rec.data };
  throw new Error(`Unknown schema version ${rec.version}`);
}

export function getPatients() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    const patients = JSON.parse(raw);
    let migrated = false;
    Object.entries(patients).forEach(([id, p]) => {
      if (!p.patientId) {
        p.patientId = id;
        migrated = true;
      }
      if (!p.created) {
        p.created = new Date().toISOString();
        migrated = true;
      }
      if (!p.lastUpdated) {
        p.lastUpdated = p.created;
        migrated = true;
      }
      if (
        !p.data ||
        typeof p.data !== 'object' ||
        p.data.version === undefined
      ) {
        p.data = { version: 0, data: p.data };
        migrated = true;
      }
      if (p.data.version !== SCHEMA_VERSION) {
        try {
          p.data = migrateSchema(p.data);
          if (p.data.version !== SCHEMA_VERSION) throw new Error('');
          migrated = true;
        } catch {
          console.warn(
            `Discarding patient ${id} due to incompatible schema version ${p.data.version}`,
          );
          delete patients[id];
          migrated = true;
        }
      }
    });
    if (migrated) setPatients(patients);
    return patients;
  } catch (e) {
    console.error(e);
    localStorage.removeItem(LS_KEY);
    return {};
  }
}

function setPatients(patients) {
  const keys = Object.keys(patients);
  if (keys.length) localStorage.setItem(LS_KEY, JSON.stringify(patients));
  else localStorage.removeItem(LS_KEY);
}

function getRadioValue(nodes) {
  return nodes.find((n) => n.checked)?.value || '';
}

function setRadioValue(nodes, value) {
  nodes.forEach((n) => {
    n.checked = n.value === value;
    n.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

function getCheckboxList(nodes) {
  return (nodes || [])
    .filter((n) => n.checked)
    .map((n) => n.value)
    .join('; ');
}

function setCheckboxList(nodes, value) {
  const vals = (value || '').split(/;\s*/).filter(Boolean);
  (nodes || []).forEach((cb) => {
    cb.checked = vals.includes(cb.value);
  });
}

function getBooleanGroup(nodes) {
  return nodes?.some((n) => n.checked) || false;
}

function setBooleanGroup(nodes, value) {
  (nodes || []).forEach((n) => {
    n.checked = !!value;
    n.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

const FIELD_DEFS = [
  { key: 'p_weight', selector: 'weight' },
  { key: 'p_bp', selector: 'bp' },
  { key: 'p_inr', selector: 'inr' },
  { key: 'p_nihss0', selector: 'nih0', alias: ['nihs_initial'] },
  { key: 't_lkw', selector: 'lkw' },
  { key: 't_sleep_start', selector: 'sleep_start' },
  { key: 't_sleep_end', selector: 'sleep_end' },
  { key: 't_door', selector: 'door' },
  { key: 'd_time', selector: 'd_time' },
  {
    key: 'd_decision',
    selector: 'd_decision',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
  { key: 'drug_type', selector: 'drugType', default: 'tnk' },
  { key: 'drug_conc', selector: 'drugConc' },
  { key: 'dose_total', selector: 'doseTotal' },
  { key: 'dose_volume', selector: 'doseVol' },
  { key: 'tpa_bolus', selector: 'tpaBolus' },
  { key: 'tpa_infusion', selector: 'tpaInf' },
  { key: 't_thrombolysis', selector: 't_thrombolysis' },
  {
    key: 'arrival_lkw_type',
    selector: 'lkw_type',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || 'known'),
    default: 'known',
  },
  {
    key: 'arrival_symptoms',
    selector: 'arrival_symptoms',
    set: (el, value) => {
      if (el) {
        el.value = value || '';
        el.dispatchEvent?.(new Event('input', { bubbles: true }));
      }
    },
  },
  {
    key: 'arrival_contra',
    selector: 'arrival_contra',
    get: getCheckboxList,
    set: setCheckboxList,
  },
  {
    key: 'arrival_mt_contra',
    selector: 'arrival_mt_contra',
    get: getCheckboxList,
    set: setCheckboxList,
  },
  { key: 'def_tnk', selector: 'def_tnk', default: 5 },
  { key: 'def_tpa', selector: 'def_tpa', default: 1 },
  {
    key: 'autosave',
    selector: 'autosave',
    get: () => state.autosave,
    set: (el, value) => {
      if (el) {
        el.value = value || 'on';
        state.autosave = el.value || 'on';
      }
    },
    default: 'on',
  },
  { key: 'a_personal', selector: 'a_personal' },
  { key: 'a_name', selector: 'a_name' },
  { key: 'a_dob', selector: 'a_dob' },
  { key: 'a_age', selector: 'a_age' },
  {
    key: 'a_sym_face',
    selector: 'a_sym_face',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_sym_speech',
    selector: 'a_sym_speech',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_sym_commands',
    selector: 'a_sym_commands',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_sym_arm',
    selector: 'a_sym_arm',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_sym_leg',
    selector: 'a_sym_leg',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_sym_gaze',
    selector: 'a_sym_gaze',
    get: getBooleanGroup,
    set: setBooleanGroup,
    default: false,
  },
  {
    key: 'a_drug_warfarin',
    selector: 'a_warfarin',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_drug_apixaban',
    selector: 'a_apixaban',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_drug_rivaroxaban',
    selector: 'a_rivaroxaban',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_drug_dabigatran',
    selector: 'a_dabigatran',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_drug_edoxaban',
    selector: 'a_edoxaban',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_drug_unknown',
    selector: 'a_unknown',
    get: (el) => el?.checked || false,
    set: (el, value) => {
      if (el) el.checked = !!value;
    },
    default: false,
  },
  {
    key: 'a_lkw',
    selector: 'a_lkw',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
  { key: 'a_glucose', selector: 'a_glucose' },
  { key: 'a_aks', selector: 'a_aks' },
  { key: 'a_hr', selector: 'a_hr' },
  { key: 'a_spo2', selector: 'a_spo2' },
  { key: 'a_temp', selector: 'a_temp' },
  { key: 'a_gmp_time', selector: 'a_gmp_time' },
];

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
  }
}

export function renamePatient(id, newName) {
  const patients = getPatients();
  if (patients[id]) {
    patients[id].name = newName;
    setPatients(patients);
  }
}
