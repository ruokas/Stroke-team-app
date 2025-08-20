import * as dom from './state.js';
import { computeDose } from './computeDose.js';

export function updateDrugDefaults() {
  const typeEl = dom.getDrugTypeInput();
  const concEl = dom.getDrugConcInput();
  const defTnkEl = dom.getDefTnkInput();
  const defTpaEl = dom.getDefTpaInput();
  if (!typeEl || !concEl || !defTnkEl || !defTpaEl) return;
  const type = typeEl.value;
  const conc =
    type === 'tnk'
      ? Number(defTnkEl.value || 5)
      : Number(defTpaEl.value || 1);
  concEl.value = String(conc);
  const tpaBreakdown = document.getElementById('tpaBreakdown');
  if (tpaBreakdown) tpaBreakdown.style.display = type === 'tpa' ? 'grid' : 'none';
}

export function calcDrugs() {
  const typeEl = dom.getDrugTypeInput();
  const weightEl = dom.getWeightInput();
  const concEl = dom.getDrugConcInput();
  const doseTotalEl = dom.getDoseTotalInput();
  const doseVolEl = dom.getDoseVolInput();
  const tpaBolusEl = dom.getTpaBolusInput();
  const tpaInfEl = dom.getTpaInfInput();
  if (
    !typeEl ||
    !weightEl ||
    !concEl ||
    !doseTotalEl ||
    !doseVolEl ||
    !tpaBolusEl ||
    !tpaInfEl
  )
    return;

  const type = typeEl.value;
  const w = Number((weightEl.value || '').replace(/,/g, '.'));
  const conc = Number((concEl.value || '').replace(/,/g, '.'));
  const wValid = Number.isFinite(w) && w > 0;
  const cValid = Number.isFinite(conc) && conc > 0;

  [weightEl, concEl].forEach((el) => {
    el.classList.remove('invalid');
    if (el.setCustomValidity) el.setCustomValidity('');
  });

  if (!wValid || !cValid) {
    doseTotalEl.value = '';
    doseVolEl.value = '';
    tpaBolusEl.value = '';
    tpaInfEl.value = '';
    if (!wValid) {
      weightEl.classList.add('invalid');
      if (weightEl.setCustomValidity)
        weightEl.setCustomValidity('Įveskite teisingą svorį.');
      if (weightEl.reportValidity) weightEl.reportValidity();
    }
    if (!cValid) {
      concEl.classList.add('invalid');
      if (concEl.setCustomValidity)
        concEl.setCustomValidity('Įveskite teisingą koncentraciją.');
      if (concEl.reportValidity) concEl.reportValidity();
    }
    return;
  }

  const result = computeDose(w, conc, type);
  if (!result) return;

  doseTotalEl.value = result.doseTotal;
  doseVolEl.value = result.doseVol;

  if (result.bolus) {
    const { bolus, infusion } = result;
    tpaBolusEl.value = `${bolus.mg} mg (${bolus.ml} ml)`;
    tpaInfEl.value = `${infusion.mg} mg (${infusion.ml} ml) · ~${infusion.rateMlH} ml/val`;
  } else {
    tpaBolusEl.value = '';
    tpaInfEl.value = '';
  }
}
