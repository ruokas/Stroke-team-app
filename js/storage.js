import { inputs, state } from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';

const LS_KEY = 'insultoKomandaDrafts_v1';

export function getDrafts() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return {};
  try {
    return JSON.parse(raw);
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
  return {
    p_weight: inputs.weight.value,
    p_bp: inputs.bp.value,
    p_inr: inputs.inr.value,
    p_nihss0: inputs.nih0.value,
    t_lkw: inputs.lkw.value,
    t_door: inputs.door.value,
    d_time: inputs.d_time.value,
    d_decision: getRadioValue(inputs.d_decision),
    drug_type: inputs.drugType.value,
    drug_conc: inputs.drugConc.value,
    dose_total: inputs.doseTotal.value,
    dose_volume: inputs.doseVol.value,
    tpa_bolus: inputs.tpaBolus.value,
    tpa_infusion: inputs.tpaInf.value,
    arrival_lkw_type: getRadioValue(inputs.lkw_type),
    arrival_symptoms: inputs.arrival_symptoms.value,
    arrival_contra: inputs.arrival_contra
      .filter((n) => n.checked)
      .map((n) => n.value)
      .join('; '),
    def_tnk: inputs.def_tnk.value,
    def_tpa: inputs.def_tpa.value,
    autosave: state.autosave,
    a_personal: inputs.a_personal.value,
    a_name: inputs.a_name.value,
    a_dob: inputs.a_dob.value,
    a_age: inputs.a_age.value,
    a_sym_face: getRadioValue(inputs.a_sym_face),
    a_sym_arm: getRadioValue(inputs.a_sym_arm),
    a_sym_speech: getRadioValue(inputs.a_sym_speech),
    a_sym_balance: getRadioValue(inputs.a_sym_balance),
    a_sym_conscious: getRadioValue(inputs.a_sym_conscious),
    a_drug_warfarin: inputs.a_warfarin.checked,
    a_drug_apixaban: inputs.a_apixaban.checked,
    a_drug_rivaroxaban: inputs.a_rivaroxaban.checked,
    a_drug_dabigatran: inputs.a_dabigatran.checked,
    a_drug_edoxaban: inputs.a_edoxaban.checked,
    a_drug_unknown: inputs.a_unknown.checked,
    a_lkw: getRadioValue(inputs.a_lkw),
    a_glucose: inputs.a_glucose.value,
    a_aks: inputs.a_aks.value,
    a_hr: inputs.a_hr.value,
    a_spo2: inputs.a_spo2.value,
    a_temp: inputs.a_temp.value,
  };
}

export function setPayload(p) {
  if (!p) return;
  inputs.weight.value = p.p_weight || '';
  inputs.bp.value = p.p_bp || '';
  inputs.inr.value = p.p_inr || '';
  inputs.nih0.value = p.p_nihss0 || '';
  inputs.lkw.value = p.t_lkw || '';
  inputs.door.value = p.t_door || '';
  inputs.d_time.value = p.d_time || '';
  setRadioValue(inputs.d_decision, p.d_decision || '');
  inputs.drugType.value = p.drug_type || 'tnk';
  inputs.drugConc.value = p.drug_conc || '';
  inputs.doseTotal.value = p.dose_total || '';
  inputs.doseVol.value = p.dose_volume || '';
  inputs.tpaBolus.value = p.tpa_bolus || '';
  inputs.tpaInf.value = p.tpa_infusion || '';
  setRadioValue(inputs.lkw_type, p.arrival_lkw_type || 'known');
  inputs.arrival_symptoms.value = p.arrival_symptoms || '';
  const contraVals = (p.arrival_contra || '').split(/;\s*/).filter(Boolean);
  inputs.arrival_contra.forEach((cb) => {
    cb.checked = contraVals.includes(cb.value);
  });
  inputs.a_personal.value = p.a_personal || '';
  inputs.a_name.value = p.a_name || '';
  inputs.a_dob.value = p.a_dob || '';
  updateAge();
  setRadioValue(inputs.a_sym_face, p.a_sym_face || '');
  setRadioValue(inputs.a_sym_arm, p.a_sym_arm || '');
  setRadioValue(inputs.a_sym_speech, p.a_sym_speech || '');
  setRadioValue(inputs.a_sym_balance, p.a_sym_balance || '');
  setRadioValue(inputs.a_sym_conscious, p.a_sym_conscious || '');
  inputs.a_warfarin.checked = !!p.a_drug_warfarin;
  inputs.a_apixaban.checked = !!p.a_drug_apixaban;
  inputs.a_rivaroxaban.checked = !!p.a_drug_rivaroxaban;
  inputs.a_dabigatran.checked = !!p.a_drug_dabigatran;
  inputs.a_edoxaban.checked = !!p.a_drug_edoxaban;
  inputs.a_unknown.checked = !!p.a_drug_unknown;
  setRadioValue(inputs.a_lkw, p.a_lkw || '');
  inputs.a_glucose.value = p.a_glucose || '';
  inputs.a_aks.value = p.a_aks || '';
  inputs.a_hr.value = p.a_hr || '';
  inputs.a_spo2.value = p.a_spo2 || '';
  inputs.a_temp.value = p.a_temp || '';
  inputs.def_tnk.value = p.def_tnk || 5;
  inputs.def_tpa.value = p.def_tpa || 1;
  inputs.autosave.value = p.autosave || 'on';
  state.autosave = inputs.autosave.value || 'on';
  updateDrugDefaults();
}

export function saveLS(id, name) {
  const drafts = getDrafts();
  const draftId = id || Date.now().toString();
  const draftName =
    name ||
    drafts[draftId]?.name ||
    inputs.nih0.value ||
    `Juodraštis ${draftId}`;
  drafts[draftId] = { name: draftName, data: getPayload() };
  setDrafts(drafts);
  updateDraftSelect(draftId);
  return draftId;
}

export function loadLS(id) {
  const drafts = getDrafts();
  return drafts[id] ? drafts[id].data : null;
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
