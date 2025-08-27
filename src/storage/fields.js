import { state } from '../state.js';

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
