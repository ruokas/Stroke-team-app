import * as dom from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';
import { setNow } from './time.js';
import { openTimePicker } from './timePicker.js';

const { state } = dom;

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
        } catch (e) {
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

export function getPayload() {
  const inputs = dom.getInputs();
  const bp_meds = Array.from(
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
  return {
    p_weight: inputs.weight?.value || '',
    p_bp: inputs.bp?.value || '',
    p_inr: inputs.inr?.value || '',
    p_nihss0: inputs.nih0?.value || '',
    nihs_initial: inputs.nih0?.value || '',
    t_lkw: inputs.lkw?.value || '',
    t_sleep_start: inputs.sleep_start?.value || '',
    t_sleep_end: inputs.sleep_end?.value || '',
    t_door: inputs.door?.value || '',
    d_time: inputs.d_time?.value || '',
    d_decision: getRadioValue(inputs.d_decision || []),
    drug_type: inputs.drugType?.value || '',
    drug_conc: inputs.drugConc?.value || '',
    dose_total: inputs.doseTotal?.value || '',
    dose_volume: inputs.doseVol?.value || '',
    tpa_bolus: inputs.tpaBolus?.value || '',
    tpa_infusion: inputs.tpaInf?.value || '',
    t_thrombolysis: inputs.t_thrombolysis?.value || '',
    arrival_lkw_type: getRadioValue(inputs.lkw_type || []),
    arrival_symptoms: inputs.arrival_symptoms?.value || '',
    arrival_contra: (inputs.arrival_contra || [])
      .filter((n) => n.checked)
      .map((n) => n.value)
      .join('; '),
    arrival_mt_contra: (inputs.arrival_mt_contra || [])
      .filter((n) => n.checked)
      .map((n) => n.value)
      .join('; '),
    def_tnk: inputs.def_tnk?.value || '',
    def_tpa: inputs.def_tpa?.value || '',
    autosave: state.autosave,
    a_personal: inputs.a_personal?.value || '',
    a_name: inputs.a_name?.value || '',
    a_dob: inputs.a_dob?.value || '',
    a_age: inputs.a_age?.value || '',
    a_sym_face: inputs.a_sym_face?.some((n) => n.checked) || false,
    a_sym_speech: inputs.a_sym_speech?.some((n) => n.checked) || false,
    a_sym_commands: inputs.a_sym_commands?.some((n) => n.checked) || false,
    a_sym_arm: inputs.a_sym_arm?.some((n) => n.checked) || false,
    a_sym_leg: inputs.a_sym_leg?.some((n) => n.checked) || false,
    a_sym_gaze: inputs.a_sym_gaze?.some((n) => n.checked) || false,
    a_drug_warfarin: inputs.a_warfarin?.checked || false,
    a_drug_apixaban: inputs.a_apixaban?.checked || false,
    a_drug_rivaroxaban: inputs.a_rivaroxaban?.checked || false,
    a_drug_dabigatran: inputs.a_dabigatran?.checked || false,
    a_drug_edoxaban: inputs.a_edoxaban?.checked || false,
    a_drug_unknown: inputs.a_unknown?.checked || false,
    a_lkw: getRadioValue(inputs.a_lkw || []),
    a_glucose: inputs.a_glucose?.value || '',
    a_aks: inputs.a_aks?.value || '',
    a_hr: inputs.a_hr?.value || '',
    a_spo2: inputs.a_spo2?.value || '',
    a_temp: inputs.a_temp?.value || '',
    a_gmp_time: inputs.a_gmp_time?.value || '',
    bp_meds,
  };
}

export function setPayload(p) {
  if (!p) return;
  const payload = p.version !== undefined ? p.data : p;
  const inputs = dom.getInputs();
  if (inputs.weight) inputs.weight.value = payload.p_weight || '';
  if (inputs.bp) inputs.bp.value = payload.p_bp || '';
  if (inputs.inr) inputs.inr.value = payload.p_inr || '';
  if (inputs.nih0)
    inputs.nih0.value = payload.p_nihss0 || payload.nihs_initial || '';
  if (inputs.lkw) inputs.lkw.value = payload.t_lkw || '';
  if (inputs.sleep_start)
    inputs.sleep_start.value = payload.t_sleep_start || '';
  if (inputs.sleep_end) inputs.sleep_end.value = payload.t_sleep_end || '';
  if (inputs.door) inputs.door.value = payload.t_door || '';
  if (inputs.d_time) inputs.d_time.value = payload.d_time || '';
  if (inputs.d_decision)
    setRadioValue(inputs.d_decision, payload.d_decision || '');
  if (inputs.drugType) inputs.drugType.value = payload.drug_type || 'tnk';
  if (inputs.drugConc) inputs.drugConc.value = payload.drug_conc || '';
  if (inputs.doseTotal) inputs.doseTotal.value = payload.dose_total || '';
  if (inputs.doseVol) inputs.doseVol.value = payload.dose_volume || '';
  if (inputs.tpaBolus) inputs.tpaBolus.value = payload.tpa_bolus || '';
  if (inputs.tpaInf) inputs.tpaInf.value = payload.tpa_infusion || '';
  if (inputs.t_thrombolysis)
    inputs.t_thrombolysis.value = payload.t_thrombolysis || '';
  if (inputs.lkw_type)
    setRadioValue(inputs.lkw_type, payload.arrival_lkw_type || 'known');
  if (inputs.arrival_symptoms) {
    inputs.arrival_symptoms.value = payload.arrival_symptoms || '';
    inputs.arrival_symptoms.dispatchEvent?.(
      new Event('input', { bubbles: true }),
    );
  }
  const contraVals = (payload.arrival_contra || '')
    .split(/;\s*/)
    .filter(Boolean);
  (inputs.arrival_contra || []).forEach((cb) => {
    cb.checked = contraVals.includes(cb.value);
  });
  const mtContraVals = (payload.arrival_mt_contra || '')
    .split(/;\s*/)
    .filter(Boolean);
  (inputs.arrival_mt_contra || []).forEach((cb) => {
    cb.checked = mtContraVals.includes(cb.value);
  });
  if (inputs.a_personal) inputs.a_personal.value = payload.a_personal || '';
  if (inputs.a_name) inputs.a_name.value = payload.a_name || '';
  if (inputs.a_dob) inputs.a_dob.value = payload.a_dob || '';
  updateAge();
  if (inputs.a_sym_face)
    inputs.a_sym_face.forEach((n) => {
      n.checked = !!payload.a_sym_face;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_sym_speech)
    inputs.a_sym_speech.forEach((n) => {
      n.checked = !!payload.a_sym_speech;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_sym_commands)
    inputs.a_sym_commands.forEach((n) => {
      n.checked = !!payload.a_sym_commands;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_sym_arm)
    inputs.a_sym_arm.forEach((n) => {
      n.checked = !!payload.a_sym_arm;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_sym_leg)
    inputs.a_sym_leg.forEach((n) => {
      n.checked = !!payload.a_sym_leg;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_sym_gaze)
    inputs.a_sym_gaze.forEach((n) => {
      n.checked = !!payload.a_sym_gaze;
      n.dispatchEvent(new Event('change', { bubbles: true }));
    });
  if (inputs.a_warfarin) inputs.a_warfarin.checked = !!payload.a_drug_warfarin;
  if (inputs.a_apixaban) inputs.a_apixaban.checked = !!payload.a_drug_apixaban;
  if (inputs.a_rivaroxaban)
    inputs.a_rivaroxaban.checked = !!payload.a_drug_rivaroxaban;
  if (inputs.a_dabigatran)
    inputs.a_dabigatran.checked = !!payload.a_drug_dabigatran;
  if (inputs.a_edoxaban) inputs.a_edoxaban.checked = !!payload.a_drug_edoxaban;
  if (inputs.a_unknown) inputs.a_unknown.checked = !!payload.a_drug_unknown;
  if (inputs.a_lkw) setRadioValue(inputs.a_lkw, payload.a_lkw || '');
  if (inputs.a_glucose) inputs.a_glucose.value = payload.a_glucose || '';
  if (inputs.a_aks) inputs.a_aks.value = payload.a_aks || '';
  if (inputs.a_hr) inputs.a_hr.value = payload.a_hr || '';
  if (inputs.a_spo2) inputs.a_spo2.value = payload.a_spo2 || '';
  if (inputs.a_temp) inputs.a_temp.value = payload.a_temp || '';
  if (inputs.a_gmp_time) inputs.a_gmp_time.value = payload.a_gmp_time || '';
  const bpContainer = document.getElementById('bpEntries');
  if (bpContainer) {
    bpContainer.innerHTML = '';
    (payload.bp_meds || []).forEach((m) => {
      const entry = document.createElement('div');
      entry.className = 'bp-entry mt-10';
      const id = `bp_time_${Date.now()}_${Math.random()
        .toString(36)
        .slice(2, 7)}`;
      const strong = document.createElement('strong');
      strong.textContent = m.med;
      entry.appendChild(strong);

      const grid = document.createElement('div');
      grid.className = 'grid-3 mt-5';
      entry.appendChild(grid);

      const group = document.createElement('div');
      group.className = 'input-group';
      grid.appendChild(group);

      const timeInput = document.createElement('input');
      timeInput.setAttribute('type', 'time');
      timeInput.id = id;
      timeInput.className = 'time-input';
      timeInput.step = '60';
      if (m.time) timeInput.value = m.time;
      group.appendChild(timeInput);

      const timePickerBtn = document.createElement('button');
      timePickerBtn.className = 'btn ghost';
      timePickerBtn.setAttribute('data-time-picker', id);
      timePickerBtn.setAttribute('aria-label', 'Pasirinkti laiką');
      timePickerBtn.textContent = '⌚';
      group.appendChild(timePickerBtn);

      const nowBtn = document.createElement('button');
      nowBtn.className = 'btn ghost';
      nowBtn.setAttribute('data-now', id);
      nowBtn.textContent = 'Dabar';
      group.appendChild(nowBtn);

      const stepDownBtn = document.createElement('button');
      stepDownBtn.className = 'btn ghost';
      stepDownBtn.setAttribute('data-stepdown', id);
      stepDownBtn.setAttribute('aria-label', '−5 min');
      stepDownBtn.textContent = '−5';
      group.appendChild(stepDownBtn);

      const stepUpBtn = document.createElement('button');
      stepUpBtn.className = 'btn ghost';
      stepUpBtn.setAttribute('data-stepup', id);
      stepUpBtn.setAttribute('aria-label', '+5 min');
      stepUpBtn.textContent = '+5';
      group.appendChild(stepUpBtn);

      const doseInput = document.createElement('input');
      doseInput.setAttribute('type', 'text');
      doseInput.value = m.dose || '';
      grid.appendChild(doseInput);

      const notesInput = document.createElement('input');
      notesInput.setAttribute('type', 'text');
      notesInput.setAttribute('placeholder', 'Pastabos');
      notesInput.value = m.notes || '';
      grid.appendChild(notesInput);

      bpContainer.appendChild(entry);
      entry
        .querySelector(`[data-now="${id}"]`)
        ?.addEventListener?.('click', () => setNow(id));
      entry
        .querySelector(`[data-time-picker="${id}"]`)
        ?.addEventListener?.('click', () =>
          openTimePicker(document.getElementById(id)),
        );
      entry
        .querySelector(`[data-stepup="${id}"]`)
        ?.addEventListener?.('click', () => {
          const target = document.getElementById(id);
          target?.stepUp(5);
          target?.dispatchEvent(new Event('input'));
        });
      entry
        .querySelector(`[data-stepdown="${id}"]`)
        ?.addEventListener?.('click', () => {
          const target = document.getElementById(id);
          target?.stepDown(5);
          target?.dispatchEvent(new Event('input'));
        });
    });
  }
  if (inputs.def_tnk) inputs.def_tnk.value = payload.def_tnk || 5;
  if (inputs.def_tpa) inputs.def_tpa.value = payload.def_tpa || 1;
  if (inputs.autosave) inputs.autosave.value = payload.autosave || 'on';
  state.autosave = inputs.autosave?.value || 'on';
  updateDrugDefaults();
}

export function savePatient(id, name) {
  const inputs = dom.getInputs();
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
