import { inputs } from './state.js';
import { computeDose } from './computeDose.js';

export function updateDrugDefaults() {
  const type = inputs.drugType.value;
  const conc =
    type === 'tnk'
      ? Number(inputs.def_tnk.value || 5)
      : Number(inputs.def_tpa.value || 1);
  inputs.drugConc.value = String(conc);
  document.getElementById('tpaBreakdown').style.display =
    type === 'tpa' ? 'grid' : 'none';
}

export function calcDrugs() {
  const type = inputs.drugType.value;
  const w = Number((inputs.weight.value || '').replace(/,/g, '.'));
  const conc = Number((inputs.drugConc.value || '').replace(/,/g, '.'));
  const wValid = Number.isFinite(w) && w > 0;
  const cValid = Number.isFinite(conc) && conc > 0;

  [inputs.weight, inputs.drugConc].forEach((el) => {
    el.classList.remove('invalid');
    if (el.setCustomValidity) el.setCustomValidity('');
  });

  if (!wValid || !cValid) {
    inputs.doseTotal.value = '';
    inputs.doseVol.value = '';
    inputs.tpaBolus.value = '';
    inputs.tpaInf.value = '';
    if (!wValid) {
      inputs.weight.classList.add('invalid');
      if (inputs.weight.setCustomValidity)
        inputs.weight.setCustomValidity('Įveskite teisingą svorį.');
      if (inputs.weight.reportValidity) inputs.weight.reportValidity();
    }
    if (!cValid) {
      inputs.drugConc.classList.add('invalid');
      if (inputs.drugConc.setCustomValidity)
        inputs.drugConc.setCustomValidity('Įveskite teisingą koncentraciją.');
      if (inputs.drugConc.reportValidity) inputs.drugConc.reportValidity();
    }
    return;
  }

  const result = computeDose(w, conc, type);
  if (!result) return;

  inputs.doseTotal.value = result.doseTotal;
  inputs.doseVol.value = result.doseVol;

  if (result.bolus) {
    const { bolus, infusion } = result;
    inputs.tpaBolus.value = `${bolus.mg} mg (${bolus.ml} ml)`;
    inputs.tpaInf.value = `${infusion.mg} mg (${infusion.ml} ml) · ~${infusion.rateMlH} ml/val`;
  } else {
    inputs.tpaBolus.value = '';
    inputs.tpaInf.value = '';
  }
}
