import { dom } from './state.js';
import { computeDose } from './computeDose.js';
import { t } from './i18n.js';

export function updateDrugDefaults() {
  const typeEl = dom.getDrugTypeInput();
  if (!typeEl) return;
  const tpaBreakdown = document.getElementById('tpaBreakdown');
  if (tpaBreakdown)
    tpaBreakdown.style.display = typeEl.value === 'tpa' ? 'grid' : 'none';
}

export function calcDrugs() {
  const typeEl = dom.getDrugTypeInput();
  const weightEl = dom.getWeightInput();
  const defTnkEl = dom.getDefTnkInput();
  const defTpaEl = dom.getDefTpaInput();
  const doseTotalEl = dom.getDoseTotalInput();
  const doseVolEl = dom.getDoseVolInput();
  const tpaBolusEl = dom.getTpaBolusInput();
  const tpaInfEl = dom.getTpaInfInput();
  if (
    !typeEl ||
    !weightEl ||
    !doseTotalEl ||
    !doseVolEl ||
    !tpaBolusEl ||
    !tpaInfEl
  )
    return;

  const type = typeEl.value;
  const w = Number((weightEl.value || '').replace(/,/g, '.'));
  const conc =
    type === 'tnk'
      ? Number(defTnkEl?.value) || 5
      : Number(defTpaEl?.value) || 1;
  const wValid = Number.isFinite(w) && w > 0;

  weightEl.classList.remove('invalid');
  if (weightEl.setCustomValidity) weightEl.setCustomValidity('');

  if (!wValid) {
    doseTotalEl.value = '';
    doseVolEl.value = '';
    tpaBolusEl.value = '';
    tpaInfEl.value = '';
    weightEl.classList.add('invalid');
    if (weightEl.setCustomValidity)
      weightEl.setCustomValidity(t('invalid_weight'));
    if (weightEl.reportValidity) weightEl.reportValidity();
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
