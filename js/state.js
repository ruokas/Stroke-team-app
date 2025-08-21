// Shared state and DOM helpers
export const $ = (sel) => document.querySelector(sel);
export const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export const state = {
  autosave: 'on',
};

// Individual DOM accessors
export const getWeightInput = () => $('#p_weight');
export const getBpInput = () => $('#p_bp');
export const getInrInput = () => $('#p_inr');
export const getNih0Input = () => $('#p_nihss0');
export const getLkwInput = () => $('#t_lkw');
export const getDoorInput = () => $('#t_door');
export const getDTimeInput = () => $('#d_time');
export const getDDecisionInputs = () => $$('input[name="d_decision"]');
export const getLkwTypeInputs = () => $$('input[name="lkw_type"]');
export const getArrivalSymptomsInput = () => $('#arrival_symptoms');
export const getArrivalContraInputs = () => $$('input[name="arrival_contra"]');
export const getArrivalMtContraInputs = () =>
  $$('input[name="arrival_mt_contra"]');
export const getDrugTypeInput = () => $('#drug_type');
export const getDrugConcInput = () => $('#drug_conc');
export const getDoseTotalInput = () => $('#dose_total');
export const getDoseVolInput = () => $('#dose_volume');
export const getTpaBolusInput = () => $('#tpa_bolus');
export const getTpaInfInput = () => $('#tpa_infusion');
export const getDefTnkInput = () => $('#def_tnk');
export const getDefTpaInput = () => $('#def_tpa');
export const getThrombolysisStartInput = () => $('#t_thrombolysis');
export const getAutosaveInput = () => $('#autosave');
export const getSummaryInput = () => $('#summary');
export const getPatientSelect = () => $('#patientSelect');
export const getAPersonalInput = () => $('#a_personal');
export const getANameInput = () => $('#a_name');
export const getADobInput = () => $('#a_dob');
export const getAAgeInput = () => $('#a_age');
export const getASymFaceInputs = () => $$('input[name="a_face"]');
export const getASymSpeechInputs = () => $$('input[name="a_speech"]');
export const getASymCommandsInputs = () => $$('input[name="a_commands"]');
export const getASymArmInputs = () => $$('input[name="a_arm"]');
export const getASymLegInputs = () => $$('input[name="a_leg"]');
export const getASymGazeInputs = () => $$('input[name="a_gaze"]');
export const getAWarfarinInput = () => $('#a_warfarin');
export const getAApixabanInput = () => $('#a_apixaban');
export const getARivaroxabanInput = () => $('#a_rivaroxaban');
export const getADabigatranInput = () => $('#a_dabigatran');
export const getAEdoxabanInput = () => $('#a_edoxaban');
export const getAUnknownInput = () => $('#a_unknown');
export const getALkwInputs = () => $$('input[name="a_lkw"]');
export const getAGlucoseInput = () => $('#a_glucose');
export const getAAksInput = () => $('#a_aks');
export const getAHrInput = () => $('#a_hr');
export const getASpo2Input = () => $('#a_spo2');
export const getATempInput = () => $('#a_temp');

// Convenience aggregator for tests
export function getInputs() {
  return {
    weight: getWeightInput(),
    bp: getBpInput(),
    inr: getInrInput(),
    nih0: getNih0Input(),
    lkw: getLkwInput(),
    door: getDoorInput(),
    d_time: getDTimeInput(),
    d_decision: getDDecisionInputs(),
    lkw_type: getLkwTypeInputs(),
    arrival_symptoms: getArrivalSymptomsInput(),
    arrival_contra: getArrivalContraInputs(),
    arrival_mt_contra: getArrivalMtContraInputs(),
    drugType: getDrugTypeInput(),
    drugConc: getDrugConcInput(),
    doseTotal: getDoseTotalInput(),
    doseVol: getDoseVolInput(),
    tpaBolus: getTpaBolusInput(),
    tpaInf: getTpaInfInput(),
    def_tnk: getDefTnkInput(),
    def_tpa: getDefTpaInput(),
    t_thrombolysis: getThrombolysisStartInput(),
    autosave: getAutosaveInput(),
    summary: getSummaryInput(),
    patientSelect: getPatientSelect(),
    a_personal: getAPersonalInput(),
    a_name: getANameInput(),
    a_dob: getADobInput(),
    a_age: getAAgeInput(),
    a_sym_face: getASymFaceInputs(),
    a_sym_speech: getASymSpeechInputs(),
    a_sym_commands: getASymCommandsInputs(),
    a_sym_arm: getASymArmInputs(),
    a_sym_leg: getASymLegInputs(),
    a_sym_gaze: getASymGazeInputs(),
    a_warfarin: getAWarfarinInput(),
    a_apixaban: getAApixabanInput(),
    a_rivaroxaban: getARivaroxabanInput(),
    a_dabigatran: getADabigatranInput(),
    a_edoxaban: getAEdoxabanInput(),
    a_unknown: getAUnknownInput(),
    a_lkw: getALkwInputs(),
    a_glucose: getAGlucoseInput(),
    a_aks: getAAksInput(),
    a_hr: getAHrInput(),
    a_spo2: getASpo2Input(),
    a_temp: getATempInput(),
  };
}

state.autosave = getAutosaveInput()?.value || 'on';
