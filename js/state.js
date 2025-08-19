// Shared state and DOM helpers
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  autosave: 'on',
};

export const inputs = {
  weight: $('#p_weight'),
  bp: $('#p_bp'),
  inr: $('#p_inr'),
  nih0: $('#p_nihss0'),
  lkw: $('#t_lkw'),
  door: $('#t_door'),
  d_time: $('#d_time'),
  d_decision: $$('input[name="d_decision"]'),
  lkw_type: $$('input[name="lkw_type"]'),
  arrival_symptoms: $('#arrival_symptoms'),
  arrival_contra: $$('input[name="arrival_contra"]'),
  drugType: $('#drug_type'),
  drugConc: $('#drug_conc'),
  doseTotal: $('#dose_total'),
  doseVol: $('#dose_volume'),
  tpaBolus: $('#tpa_bolus'),
  tpaInf: $('#tpa_infusion'),
  def_tnk: $('#def_tnk'),
  def_tpa: $('#def_tpa'),
  autosave: $('#autosave'),
  summary: $('#summary'),
  draftSelect: $('#draftSelect'),
  a_personal: $('#a_personal'),
  a_name: $('#a_name'),
  a_dob: $('#a_dob'),
  a_age: $('#a_age'),
  a_sym_face: $$('input[name="a_face"]'),
  a_sym_arm: $$('input[name="a_arm"]'),
  a_sym_speech: $$('input[name="a_speech"]'),
  a_sym_balance: $$('input[name="a_balance"]'),
  a_sym_conscious: $$('input[name="a_conscious"]'),
  a_warfarin: $('#a_warfarin'),
  a_apixaban: $('#a_apixaban'),
  a_rivaroxaban: $('#a_rivaroxaban'),
  a_dabigatran: $('#a_dabigatran'),
  a_edoxaban: $('#a_edoxaban'),
  a_unknown: $('#a_unknown'),
  a_lkw: $$('input[name="a_lkw"]'),
  a_glucose: $('#a_glucose'),
  a_aks: $('#a_aks'),
  a_hr: $('#a_hr'),
  a_spo2: $('#a_spo2'),
  a_temp: $('#a_temp'),
};

state.autosave = inputs.autosave.value || 'on';
