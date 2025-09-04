import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { setNow } from './time.js';

export function setupDrugControls(inputs) {
  const startThrombolysisBtn = document.getElementById('startThrombolysis');
  const thrombolysisRow = document.getElementById('thrombolysisStartRow');

  const toggleStartBtn = () => {
    if (!startThrombolysisBtn) return;
    const w = Number((inputs.weight?.value || '').replace(/,/g, '.'));
    const weightValid = Number.isFinite(w) && w > 0;
    const drugTypeValid = Boolean(inputs.drugType?.value);
    startThrombolysisBtn.disabled = !(weightValid && drugTypeValid);
  };

  [inputs.def_tnk, inputs.def_tpa].forEach((el) =>
    el?.addEventListener('input', () => {
      updateDrugDefaults();
      calcDrugs();
    }),
  );
  inputs.drugType.addEventListener('change', () => {
    updateDrugDefaults();
    calcDrugs();
    toggleStartBtn();
  });
  inputs.weight?.addEventListener('input', () => {
    calcDrugs();
    toggleStartBtn();
  });
  inputs.drugConc?.addEventListener('input', calcDrugs);

  startThrombolysisBtn?.addEventListener('click', () => {
    setNow('t_thrombolysis');
    thrombolysisRow?.classList.remove('hidden');
  });

  toggleStartBtn();
}
