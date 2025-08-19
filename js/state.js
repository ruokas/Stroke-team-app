// Shared state and DOM helpers
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  goals: { d2ct: 20, d2n: 60, d2g: 90 },
  autosave: 'on',
};

export const inputs = {
  id: $('#p_id'),
  dob: $('#p_dob'),
  sex: $('#p_sex'),
  weight: $('#p_weight'),
  bp: $('#p_bp'),
  nih0: $('#p_nihss0'),
  nih24: $('#p_nihss24'),
  lkw: $('#t_lkw'),
  onset: $('#t_onset'),
  door: $('#t_door'),
  ct: $('#t_ct'),
  needle: $('#t_needle'),
  groin: $('#t_groin'),
  reperf: $('#t_reperf'),
  drugType: $('#drug_type'),
  drugConc: $('#drug_conc'),
  calcWeight: $('#calc_weight'),
  doseTotal: $('#dose_total'),
  doseVol: $('#dose_volume'),
  tpaBolus: $('#tpa_bolus'),
  tpaInf: $('#tpa_infusion'),
  i_ct: $('#i_ct'),
  i_cta: $('#i_cta'),
  i_tl: $('#i_thrombolysis'),
  i_mt: $('#i_thrombectomy'),
  i_tici: $('#i_tici'),
  i_decision: $('#i_decision'),
  notes: $('#notes'),
  goal_ct: $('#goal_ct'),
  goal_n: $('#goal_n'),
  goal_g: $('#goal_g'),
  def_tnk: $('#def_tnk'),
  def_tpa: $('#def_tpa'),
  autosave: $('#autosave'),
  summary: $('#summary'),
  draftSelect: $('#draftSelect'),
};

state.autosave = inputs.autosave.value || 'on';
