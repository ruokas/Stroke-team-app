import * as dom from './state.js';
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
  return setValidity(el, ok, 'Gliukozė turi būti 2.8–22 mmol/l.');
}

export function validateAks(el) {
  const val = (el.value || '').trim();
  const match = val.match(/^\d{2,3}\s*\/\s*\d{2,3}$/);
  return setValidity(el, !val || !!match, 'AKS įveskite formatu "120/80".');
}

export function validateHr(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 30 && v <= 250);
  return setValidity(el, ok, 'ŠSD turi būti 30–250.');
}

export function validateSpo2(el) {
  const v = parseInt(el.value, 10);
  const ok = !el.value || (Number.isFinite(v) && v >= 50 && v <= 100);
  return setValidity(el, ok, 'SpO₂ turi būti 50–100.');
}

export function validateTemp(el) {
  const v = parseFloat(el.value);
  const ok = !el.value || (Number.isFinite(v) && v >= 30 && v <= 43);
  return setValidity(el, ok, 'Temperatūra turi būti 30–43 °C.');
}

export function initActivation() {
  const handlers = [
    [dom.getAGlucoseInput(), validateGlucose],
    [dom.getAAksInput(), validateAks],
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
      showToast('Pašalinti kiti vaistai.', { type: 'info' });
    }
  });

  drugs.forEach((el) => {
    el.addEventListener('change', () => {
      if (el.checked && unknown?.checked) {
        unknown.checked = false;
        showToast('„Nežinoma“ nužymėta.', { type: 'info' });
      }
    });
  });
}
