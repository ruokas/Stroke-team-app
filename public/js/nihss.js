import { $$ } from './state.js';

export function initNIHSS() {
  $$('.nihss-calc').forEach((calc) => {
    const target = document.getElementById(calc.dataset.target);
    const fields = calc.querySelectorAll('[data-score]');
    const totalEl = calc.querySelector('.nihss-total');
    const update = () => {
      const sum = Array.from(fields).reduce(
        (s, i) => s + (parseInt(i.value, 10) || 0),
        0,
      );
      totalEl.textContent = sum;
    };
    fields.forEach((i) => i.addEventListener('input', update));
    const applyBtn = calc.querySelector('.apply');
    if (applyBtn)
      applyBtn.addEventListener('click', () => {
        target.value = totalEl.textContent;
        target.dispatchEvent(new Event('input'));
      });
  });
}
