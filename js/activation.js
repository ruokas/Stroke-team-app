import { dom } from './state.js';
import { showToast } from './toast.js';
import { setValidity } from './validation.js';

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

export function validatePersonalCode(el) {
  const ok = !el.value || /^\d{11}$/.test(el.value);
  return setValidity(el, ok, 'Asmens kodas turi būti 11 skaitmenų.');
}

export function validateName(el) {
  const val = (el.value || '').trim();
  const ok = val.length >= 2;
  return setValidity(el, ok, 'Įveskite vardą ir pavardę.');
}

export function validateDob(el) {
  const val = el.value;
  const d = val ? new Date(val) : null;
  const now = new Date();
  const ok = !val || (d instanceof Date && !isNaN(d) && d <= now);
  return setValidity(el, ok, 'Pasirinkite teisingą gimimo datą.');
}

export function initActivation() {
  const handlers = [
    [dom.getAGlucoseInput(), validateGlucose],
    [dom.getAAksInput(), validateAks],
    [dom.getAHrInput(), validateHr],
    [dom.getASpo2Input(), validateSpo2],
    [dom.getATempInput(), validateTemp],
    [dom.getAPersonalInput(), validatePersonalCode],
    [dom.getANameInput(), validateName],
    [dom.getADobInput(), validateDob],
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

  const lkwInputs = dom.getALkwInputs();
  const spsInput = lkwInputs.find((el) => el.value === '4.5-24');
  let spsBadge;
  if (spsInput) {
    const label = spsInput.closest('label');
    if (label) {
      spsBadge = document.createElement('span');
      spsBadge.className = 'badge';
      spsBadge.textContent = 'SPS';
      spsBadge.style.display = 'none';
      label.appendChild(spsBadge);
    }
  }

  const updateLkwBadge = () => {
    if (spsBadge && spsInput) {
      spsBadge.style.display = spsInput.checked ? 'inline-block' : 'none';
    }
  };

  lkwInputs.forEach((el) => {
    el.addEventListener('change', () => {
      if (el.value === '<4.5') {
        showToast('Aktyvuokite insulto komandą', { type: 'info' });
      } else if (el.value === '4.5-24') {
        showToast('Informuokite SPS gydytoją', { type: 'warning' });
      }
      updateLkwBadge();
    });
  });
  updateLkwBadge();
}
