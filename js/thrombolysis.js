import { dom } from './state.js';
import { setValidity } from './validation.js';

export function validateInr(el) {
  const v = parseFloat(el.value);
  const ok = !el.value || (Number.isFinite(v) && v >= 0.8 && v <= 10);
  return setValidity(el, ok, 'INR turi būti 0.8–10.');
}

export function initThrombolysisValidation() {
  const inrEl = dom.getInrInput();
  if (inrEl) {
    const cb = () => validateInr(inrEl);
    inrEl.addEventListener('input', cb);
    cb();
  }
}
