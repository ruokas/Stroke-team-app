// Shared state and DOM helpers
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  autosave: 'on',
};

/**
 * @typedef {HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement} InputEl
 * @typedef {InputEl[]} InputElList
 */

/**
 * Map of known input selectors. `true` means all matching elements are returned.
 * @type {Record<string, [string, boolean?]>}
 */
const selectorMap = {
  weight: ['#p_weight'],
  bp_sys: ['#p_bp_sys'],
  bp_dia: ['#p_bp_dia'],
  inr: ['#p_inr'],
  nih0: ['#p_nihss0'],
  lkw: ['#t_lkw'],
  door: ['#t_door'],
  d_time: ['#d_time'],
  d_decision: ['input[name="d_decision"]', true],
  lkw_type: ['input[name="lkw_type"]', true],
  sleep_start: ['#t_sleep_start'],
  sleep_end: ['#t_sleep_end'],
  arrival_symptoms: ['#arrival_symptoms'],
  arrival_contra: ['input[name="arrival_contra"]', true],
  arrival_mt_contra: ['input[name="arrival_mt_contra"]', true],
  drugType: ['#drug_type'],
  drugConc: ['#drug_conc'],
  doseTotal: ['#dose_total'],
  doseVol: ['#dose_volume'],
  tpaBolus: ['#tpa_bolus'],
  tpaInf: ['#tpa_infusion'],
  def_tnk: ['#def_tnk'],
  def_tpa: ['#def_tpa'],
  t_thrombolysis: ['#t_thrombolysis'],
  autosave: ['#autosave'],
  summary: ['#summary'],
  patientSelect: ['#patientSelect'],
  a_personal: ['#a_personal'],
  a_name: ['#a_name'],
  a_dob: ['#a_dob'],
  a_age: ['#a_age'],
  a_gmp_time: ['#a_gmp_time'],
  a_sym_face: ['input[name="a_face"]', true],
  a_sym_speech: ['input[name="a_speech"]', true],
  a_sym_commands: ['input[name="a_commands"]', true],
  a_sym_arm: ['input[name="a_arm"]', true],
  a_sym_leg: ['input[name="a_leg"]', true],
  a_sym_gaze: ['input[name="a_gaze"]', true],
  a_warfarin: ['#a_warfarin'],
  a_apixaban: ['#a_apixaban'],
  a_rivaroxaban: ['#a_rivaroxaban'],
  a_dabigatran: ['#a_dabigatran'],
  a_edoxaban: ['#a_edoxaban'],
  a_unknown: ['#a_unknown'],
  a_drugs: ['#a_drugs input[type="checkbox"]', true],
  a_lkw: ['input[name="a_lkw"]', true],
  a_glucose: ['#a_glucose'],
  a_aks_sys: ['#a_aks_sys'],
  a_aks_dia: ['#a_aks_dia'],
  a_hr: ['#a_hr'],
  a_spo2: ['#a_spo2'],
  a_temp: ['#a_temp'],
};

function toPascal(key) {
  return key.replace(/(^|_)([a-z])/g, (_, __, c) => c.toUpperCase());
}

/**
 * Generated DOM accessor functions.
 * @type {Record<string, () => InputEl | InputElList>}
 */
export const dom = Object.fromEntries(
  Object.entries(selectorMap).map(([key, [sel, all]]) => {
    const fnName = `get${toPascal(key)}${all ? 'Inputs' : 'Input'}`;
    /** @returns {InputEl | InputElList} */
    const fn = () => (all ? $$ : $)(sel);
    return [fnName, fn];
  }),
);

/**
 * Convenience aggregator for tests and other consumers.
 * @returns {Record<keyof typeof selectorMap, InputEl | InputElList>}
 */
export function getInputs() {
  /** @type {Record<string, InputEl | InputElList>} */
  const inputs = {};
  for (const [key, [, all]] of Object.entries(selectorMap)) {
    const fnName = `get${toPascal(key)}${all ? 'Inputs' : 'Input'}`;
    inputs[key] = dom[fnName]();
  }
  return /** @type {Record<keyof typeof selectorMap, InputEl | InputElList>} */ (
    inputs
  );
}

if (typeof document !== 'undefined') {
  state.autosave = dom.getAutosaveInput()?.value || 'on';
}
