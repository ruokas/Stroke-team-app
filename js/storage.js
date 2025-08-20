import * as dom from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';

const { state } = dom;

const LS_KEY = 'insultoKomandaDrafts_v1';
// Current version of the payload schema stored in localStorage
const SCHEMA_VERSION = 1;

export function getDrafts() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    const drafts = JSON.parse(raw);
    let migrated = false;
    Object.values(drafts).forEach((d) => {
      if (
        !d.data ||
        typeof d.data !== 'object' ||
        d.data.version === undefined
      ) {
        d.data = { version: 0, data: d.data };
        migrated = true;
      }
    });
    if (migrated) setDrafts(drafts);
    return drafts;
  } catch (e) {
    console.error(e);
    localStorage.removeItem(LS_KEY);
    return {};
  }
}

function setDrafts(drafts) {
  const keys = Object.keys(drafts);
  if (keys.length) localStorage.setItem(LS_KEY, JSON.stringify(drafts));
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
  return {
    p_weight: inputs.weight?.value || '',
    p_bp: inputs.bp?.value || '',
    p_inr: inputs.inr?.value || '',
    p_nihss0: inputs.nih0?.value || '',
    t_lkw: inputs.lkw?.value || '',
    t_door: inputs.door?.value || '',
    d_time: inputs.d_time?.value || '',
    d_decision: getRadioValue(inputs.d_decision || []),
    drug_type: inputs.drugType?.value || '',
    drug_conc: inputs.drugConc?.value || '',
    dose_total: inputs.doseTotal?.value || '',
    dose_volume: inputs.doseVol?.value || '',
    tpa_bolus: inputs.tpaBolus?.value || '',
    tpa_infusion: inputs.tpaInf?.value || '',
    arrival_lkw_type: getRadioValue(inputs.lkw_type || []),
    arrival_symptoms: inputs.arrival_symptoms?.value || '',
    arrival_contra: (inputs.arrival_contra || [])
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
    a_sym_face: getRadioValue(inputs.a_sym_face || []),
    a_sym_arm: getRadioValue(inputs.a_sym_arm || []),
    a_sym_speech: getRadioValue(inputs.a_sym_speech || []),
    a_sym_balance: getRadioValue(inputs.a_sym_balance || []),
    a_sym_conscious: getRadioValue(inputs.a_sym_conscious || []),
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
  };
}

export function setPayload(p) {
  if (!p) return;
  const payload = p.version !== undefined ? p.data : p;
  const inputs = dom.getInputs();
  if (inputs.weight) inputs.weight.value = payload.p_weight || '';
  if (inputs.bp) inputs.bp.value = payload.p_bp || '';
  if (inputs.inr) inputs.inr.value = payload.p_inr || '';
  if (inputs.nih0) inputs.nih0.value = payload.p_nihss0 || '';
  if (inputs.lkw) inputs.lkw.value = payload.t_lkw || '';
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
  if (inputs.lkw_type)
    setRadioValue(inputs.lkw_type, payload.arrival_lkw_type || 'known');
  if (inputs.arrival_symptoms)
    inputs.arrival_symptoms.value = payload.arrival_symptoms || '';
  const contraVals = (payload.arrival_contra || '')
    .split(/;\s*/)
    .filter(Boolean);
  (inputs.arrival_contra || []).forEach((cb) => {
    cb.checked = contraVals.includes(cb.value);
  });
  if (inputs.a_personal) inputs.a_personal.value = payload.a_personal || '';
  if (inputs.a_name) inputs.a_name.value = payload.a_name || '';
  if (inputs.a_dob) inputs.a_dob.value = payload.a_dob || '';
  updateAge();
  if (inputs.a_sym_face)
    setRadioValue(inputs.a_sym_face, payload.a_sym_face || '');
  if (inputs.a_sym_arm)
    setRadioValue(inputs.a_sym_arm, payload.a_sym_arm || '');
  if (inputs.a_sym_speech)
    setRadioValue(inputs.a_sym_speech, payload.a_sym_speech || '');
  if (inputs.a_sym_balance)
    setRadioValue(inputs.a_sym_balance, payload.a_sym_balance || '');
  if (inputs.a_sym_conscious)
    setRadioValue(inputs.a_sym_conscious, payload.a_sym_conscious || '');
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
  if (inputs.def_tnk) inputs.def_tnk.value = payload.def_tnk || 5;
  if (inputs.def_tpa) inputs.def_tpa.value = payload.def_tpa || 1;
  if (inputs.autosave) inputs.autosave.value = payload.autosave || 'on';
  state.autosave = inputs.autosave?.value || 'on';
  updateDrugDefaults();
}

export function saveLS(id, name) {
  const inputs = dom.getInputs();
  const drafts = getDrafts();
  const draftId = id || Date.now().toString();
  const draftName =
    name ||
    drafts[draftId]?.name ||
    inputs.nih0?.value ||
    `Juodraštis ${draftId}`;
  drafts[draftId] = {
    name: draftName,
    data: { version: SCHEMA_VERSION, data: getPayload() },
  };
  setDrafts(drafts);
  updateDraftSelect(draftId);
  return draftId;
}

export function loadLS(id) {
  const drafts = getDrafts();
  const rec = drafts[id];
  if (!rec) return null;
  const d = rec.data;
  return d && d.version !== undefined ? d.data : d;
}

export function deleteLS(id) {
  const drafts = getDrafts();
  if (drafts[id]) {
    delete drafts[id];
    setDrafts(drafts);
    updateDraftSelect();
  }
}

export function renameLS(id, newName) {
  const drafts = getDrafts();
  if (drafts[id]) {
    drafts[id].name = newName;
    setDrafts(drafts);
    updateDraftSelect(id);
  }
}

export function updateDraftSelect(selectedId) {
  const inputs = dom.getInputs();
  const sel = inputs.draftSelect;
  if (!sel) return;
  sel.innerHTML = '';
  const filterVal =
    document.getElementById('draftFilter')?.value.toLowerCase() || '';
  const drafts = getDrafts();
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = '—';
  sel.appendChild(opt0);
  Object.entries(drafts)
    .filter(([, d]) => d.name.toLowerCase().includes(filterVal))
    .forEach(([id, d]) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = d.name;
      sel.appendChild(opt);
    });
  if (selectedId) sel.value = selectedId;
}
