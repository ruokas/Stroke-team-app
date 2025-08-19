import { inputs } from './state.js';

const INFUSION_MINUTES = 60;

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
  const w = Number(
    (inputs.calcWeight.value || inputs.weight.value || '').replace(/,/g, '.'),
  );
  const conc = Number((inputs.drugConc.value || '').replace(/,/g, '.'));
  const wValid = Number.isFinite(w) && w > 0;
  const cValid = Number.isFinite(conc) && conc > 0;

  [inputs.calcWeight, inputs.weight, inputs.drugConc].forEach((el) => {
    el.classList.remove('invalid');
    if (el.setCustomValidity) el.setCustomValidity('');
  });

  if (!wValid || !cValid) {
    inputs.doseTotal.value = '';
    inputs.doseVol.value = '';
    inputs.tpaBolus.value = '';
    inputs.tpaInf.value = '';
    if (!wValid) {
      const target = inputs.calcWeight.value
        ? inputs.calcWeight
        : inputs.weight;
      target.classList.add('invalid');
      if (target.setCustomValidity)
        target.setCustomValidity('Įveskite teisingą svorį.');
      if (target.reportValidity) target.reportValidity();
    }
    if (!cValid) {
      inputs.drugConc.classList.add('invalid');
      if (inputs.drugConc.setCustomValidity)
        inputs.drugConc.setCustomValidity('Įveskite teisingą koncentraciją.');
      if (inputs.drugConc.reportValidity) inputs.drugConc.reportValidity();
    }
    return;
  }

  let totalMg = 0;
  if (type === 'tnk') {
    totalMg = Math.min(25, round1(0.25 * w));
    inputs.doseTotal.value = totalMg;
    inputs.doseVol.value = round1(totalMg / conc);
    inputs.tpaBolus.value = '';
    inputs.tpaInf.value = '';
  } else {
    totalMg = Math.min(90, round1(0.9 * w));
    const bolusMg = round1(totalMg * 0.1);
    const infMg = round1(totalMg - bolusMg);
    const bolusMl = round1(bolusMg / conc);
    const infMl = round1(infMg / conc);
    const rateMlH = round1((infMl / INFUSION_MINUTES) * 60);
    inputs.doseTotal.value = totalMg;
    inputs.doseVol.value = round1(totalMg / conc);
    inputs.tpaBolus.value = `${bolusMg} mg (${bolusMl} ml)`;
    inputs.tpaInf.value = `${infMg} mg (${infMl} ml) · ~${rateMlH} ml/val`;
  }
}

function round1(n) {
  return Math.round(n * 10) / 10;
}
