import { state } from '../state.js';
import { booleanField } from './helpers.js';

export function getRadioValue(nodes) {
  return nodes.find((n) => n.checked)?.value || '';
}

export function setRadioValue(nodes, value) {
  nodes.forEach((n) => {
    n.checked = n.value === value;
    n.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export function getCheckboxList(nodes) {
  return (nodes || [])
    .filter((n) => n.checked)
    .map((n) => n.value)
    .join('; ');
}

export function setCheckboxList(nodes, value) {
  const vals = (value || '').split(/;\s*/).filter(Boolean);
  (nodes || []).forEach((cb) => {
    cb.checked = vals.includes(cb.value);
  });
}

export function getBooleanGroup(nodes) {
  return nodes?.some((n) => n.checked) || false;
}

export function setBooleanGroup(nodes, value) {
  (nodes || []).forEach((n) => {
    n.checked = !!value;
    n.dispatchEvent(new Event('change', { bubbles: true }));
  });
}

export const FIELD_DEFS = [
  { key: 'p_weight', selector: 'weight' },
  { key: 'p_bp_sys', selector: 'bp_sys' },
  { key: 'p_bp_dia', selector: 'bp_dia' },
  { key: 'p_inr', selector: 'inr' },
  {
    key: 'p_independent',
    selector: 'p_independent',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
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
  { key: 'd_department', selector: 'd_department' },
  { key: 'drug_type', selector: 'drugType', default: 'tnk' },
  { key: 'dose_total', selector: 'doseTotal' },
  { key: 'dose_volume', selector: 'doseVol' },
  { key: 'tpa_bolus', selector: 'tpaBolus' },
  { key: 'tpa_infusion', selector: 'tpaInf' },
  { key: 't_thrombolysis', selector: 't_thrombolysis' },
  {
    key: 'complications',
    selector: 'complication',
    get: getCheckboxList,
    set: setCheckboxList,
  },
  { key: 't_complication', selector: 't_complication' },
  {
    key: 'ct_result',
    selector: 'ct_result',
    get: getRadioValue,
    set: setRadioValue,
  },
  {
    key: 'kta_result',
    selector: 'kta_result',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
  { key: 'perf_core', selector: 'perf_core' },
  { key: 'perf_penumbra', selector: 'perf_penumbra' },
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
    key: 'a_independent',
    selector: 'a_independent',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
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
  booleanField('a_drug_warfarin', 'a_warfarin'),
  booleanField('a_drug_apixaban', 'a_apixaban'),
  booleanField('a_drug_rivaroxaban', 'a_rivaroxaban'),
  booleanField('a_drug_dabigatran', 'a_dabigatran'),
  booleanField('a_drug_edoxaban', 'a_edoxaban'),
  booleanField('a_drug_unknown', 'a_unknown'),
  {
    key: 'a_lkw',
    selector: 'a_lkw',
    get: getRadioValue,
    set: (nodes, value) => setRadioValue(nodes, value || ''),
  },
  { key: 'a_glucose', selector: 'a_glucose' },
  { key: 'a_aks_sys', selector: 'a_aks_sys' },
  { key: 'a_aks_dia', selector: 'a_aks_dia' },
  { key: 'a_hr', selector: 'a_hr' },
  { key: 'a_spo2', selector: 'a_spo2' },
  { key: 'a_temp', selector: 'a_temp' },
  { key: 'a_gmp_time', selector: 'a_gmp_time' },
];

if (typeof document !== 'undefined') {
  const aNodes = Array.from(
    document.querySelectorAll('input[name="a_independent"]'),
  );
  const pNodes = Array.from(
    document.querySelectorAll('input[name="p_independent"]'),
  );
  function mirror(src, target) {
    src.forEach((el) => {
      el.addEventListener('change', () => {
        if (!el.checked) return;
        target.forEach((t) => {
          t.checked = t.value === el.value;
          t.dispatchEvent(new Event('change', { bubbles: true }));
        });
      });
    });
  }
  mirror(aNodes, pNodes);
  mirror(pNodes, aNodes);
}
