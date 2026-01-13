import { dom } from './state.js';
import { showToast } from './toast.js';

function setValidity(el, valid, message) {
  if (!el) return valid;
  if (valid) {
    el.classList.remove('invalid');
    el.setCustomValidity?.('');
  } else {
    el.classList.add('invalid');
    el.setCustomValidity?.(message);
  }
  return valid;
}

export function validateGlucose(el) {
  const v = parseFloat(el.value);
  const ok = !el.value || (Number.isFinite(v) && v >= 2.8 && v <= 22);
  return setValidity(el, ok, 'Gliukoz─ù turi b┼½ti 2.8ΓÇô22 mmol/l.');
}

export function validateAksSys(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 30 && v <= 300);
  return setValidity(el, ok, 'Sistolinis AKS turi b┼½ti 30ΓÇô300.');
}

export function validateAksDia(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 10 && v <= 200);
  return setValidity(el, ok, 'Diastolinis AKS turi b┼½ti 10ΓÇô200.');
}

export function validateHr(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 30 && v <= 250);
  return setValidity(el, ok, '┼áSD turi b┼½ti 30ΓÇô250.');
}

export function validateSpo2(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 50 && v <= 100);
  return setValidity(el, ok, 'SpOΓéé turi b┼½ti 50ΓÇô100.');
}

export function validateTemp(el) {
  const v = parseFloat(el.value);
  const ok = !el.value || (Number.isFinite(v) && v >= 30 && v <= 43);
  return setValidity(el, ok, 'Temperat┼½ra turi b┼½ti 30ΓÇô43 ┬░C.');
}

export function initActivation() {
  const handlers = [
    [dom.getAGlucoseInput(), validateGlucose],
    [dom.getAAksSysInput(), validateAksSys],
    [dom.getAAksDiaInput(), validateAksDia],
    [dom.getAHrInput(), validateHr],
    [dom.getASpo2Input(), validateSpo2],
    [dom.getATempInput(), validateTemp],
  ];
  handlers.forEach(([el, fn]) => {
    if (!el) return;
    const cb = () => fn(el);
    el.addEventListener('input', cb);
    fn(el);
  });

  const unknown = dom.getAUnknownInput();
  const drugs = dom.getADrugsInputs().filter((el) => el.id !== 'a_unknown');

  unknown?.addEventListener('change', () => {
    if (!unknown.checked) return;
    let cleared = false;
    drugs.forEach((el) => {
      if (el.checked) {
        el.checked = false;
        cleared = true;
      }
    });
    if (cleared) {
      showToast('Pa┼íalinti kiti vaistai.', { type: 'info' });
    }
  });

  drugs.forEach((el) => {
    el.addEventListener('change', () => {
      if (el.checked && unknown?.checked) {
        unknown.checked = false;
        showToast('ΓÇ₧Ne┼╛inomaΓÇ£ nu┼╛ym─ùta.', { type: 'info' });
      }
    });
  });

  const lkwInputs = dom.getALkwInputs();

  lkwInputs.forEach((el) => {
    el.addEventListener('change', (e) => {
      if (!e.isTrusted || !e.target.checked || !el.checked) {
        return;
      }
      if (el.value === '<4.5') {
        showToast('Aktyvuokite insulto komand─à', { type: 'info' });
      } else if (el.value === '4.5-24') {
        showToast('Informuokite SPS gydytoj─à', { type: 'warning' });
      }
    });
  });
}
