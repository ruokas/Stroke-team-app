import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { setNow } from './time.js';

export function setupDrugControls(inputs) {
  [inputs.def_tnk, inputs.def_tpa].forEach((el) =>
    el?.addEventListener('input', () => {
      updateDrugDefaults();
      calcDrugs();
    }),
  );
  inputs.drugType.addEventListener('change', () => {
    updateDrugDefaults();
    calcDrugs();
  });
  inputs.weight?.addEventListener('input', calcDrugs);
  inputs.drugConc?.addEventListener('input', calcDrugs);

  const startThrombolysisBtn = document.getElementById('startThrombolysis');
  const thrombolysisRow = document.getElementById('thrombolysisStartRow');
  startThrombolysisBtn?.addEventListener('click', () => {
    setNow('t_thrombolysis');
    thrombolysisRow?.classList.remove('hidden');
  });
}
