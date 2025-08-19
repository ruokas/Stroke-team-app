import { inputs, state } from './state.js';
import { updateKPIs } from './time.js';
import { updateDrugDefaults } from './drugs.js';

const LS_KEY = 'strokeTeamDrafts_v1';

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

export function getPayload() {
  return {
    p_id: inputs.id.value,
    p_dob: inputs.dob.value,
    p_sex: inputs.sex.value,
    p_weight: inputs.weight.value,
    p_bp: inputs.bp.value,
    p_nihss0: inputs.nih0.value,
    p_nihss24: inputs.nih24.value,
    t_lkw: inputs.lkw.value,
    t_onset: inputs.onset.value,
    t_door: inputs.door.value,
    t_ct: inputs.ct.value,
    t_needle: inputs.needle.value,
    t_groin: inputs.groin.value,
    t_reperf: inputs.reperf.value,
    drug_type: inputs.drugType.value,
    drug_conc: inputs.drugConc.value,
    calc_weight: inputs.calcWeight.value,
    dose_total: inputs.doseTotal.value,
    dose_volume: inputs.doseVol.value,
    tpa_bolus: inputs.tpaBolus.value,
    tpa_infusion: inputs.tpaInf.value,
    i_ct: inputs.i_ct.checked,
    i_cta: inputs.i_cta.checked,
    i_tl: inputs.i_tl.checked,
    i_mt: inputs.i_mt.checked,
    i_tici: inputs.i_tici.value,
    i_decision: inputs.i_decision.value,
    notes: inputs.notes.value,
    goals: state.goals,
    def_tnk: inputs.def_tnk.value,
    def_tpa: inputs.def_tpa.value,
    autosave: state.autosave,
  };
}

export function setPayload(p) {
  if (!p) return;
  inputs.id.value = p.p_id || '';
  inputs.dob.value = p.p_dob || '';
  inputs.sex.value = p.p_sex || '';
  inputs.weight.value = p.p_weight || '';
  inputs.bp.value = p.p_bp || '';
  inputs.nih0.value = p.p_nihss0 || '';
  inputs.nih24.value = p.p_nihss24 || '';
  inputs.lkw.value = p.t_lkw || '';
  inputs.onset.value = p.t_onset || '';
  inputs.door.value = p.t_door || '';
  inputs.ct.value = p.t_ct || '';
  inputs.needle.value = p.t_needle || '';
  inputs.groin.value = p.t_groin || '';
  inputs.reperf.value = p.t_reperf || '';
  inputs.drugType.value = p.drug_type || 'tnk';
  inputs.drugConc.value = p.drug_conc || '';
  inputs.calcWeight.value = p.calc_weight || '';
  inputs.doseTotal.value = p.dose_total || '';
  inputs.doseVol.value = p.dose_volume || '';
  inputs.tpaBolus.value = p.tpa_bolus || '';
  inputs.tpaInf.value = p.tpa_infusion || '';
  inputs.i_ct.checked = !!p.i_ct;
  inputs.i_cta.checked = !!p.i_cta;
  inputs.i_tl.checked = !!p.i_tl;
  inputs.i_mt.checked = !!p.i_mt;
  inputs.i_tici.value = p.i_tici || '';
  inputs.i_decision.value = p.i_decision || '';
  inputs.notes.value = p.notes || '';
  if (p.goals) {
    inputs.goal_ct.value = p.goals.d2ct;
    inputs.goal_n.value = p.goals.d2n;
    inputs.goal_g.value = p.goals.d2g;
  }
  inputs.def_tnk.value = p.def_tnk || 5;
  inputs.def_tpa.value = p.def_tpa || 1;
  inputs.autosave.value = p.autosave || 'on';
  state.autosave = inputs.autosave.value || 'on';
  updateDrugDefaults();
  updateKPIs();
}

export function saveLS(id, name) {
  const drafts = getDrafts();
  const draftId = id || Date.now().toString();
  const draftName =
    name || drafts[draftId]?.name || inputs.id.value || `Juodraštis ${draftId}`;
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
  const drafts = getDrafts();
  const opt0 = document.createElement('option');
  opt0.value = '';
  opt0.textContent = '—';
  sel.appendChild(opt0);
  Object.entries(drafts).forEach(([id, d]) => {
    const opt = document.createElement('option');
    opt.value = id;
    opt.textContent = d.name;
    sel.appendChild(opt);
  });
  if (selectedId) sel.value = selectedId;
}
