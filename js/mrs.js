import { $$ } from './state.js';

export function initMRS() {
  $$('.mrs-calc').forEach((calc) => {
    const target = document.getElementById(calc.dataset.target);
    const totalEl = calc.querySelector('.mrs-total');
    const options = Array.from(
      calc.querySelectorAll('input[type="radio"][name="mrs_score"]'),
    );
    let isSyncing = false;

    const update = () => {
      const selected = options.find((opt) => opt.checked);
      totalEl.textContent = selected ? selected.value : '0';
      if (!target || isSyncing) return;
      isSyncing = true;
      target.value = selected ? selected.value : '';
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
      isSyncing = false;
    };

    const syncFromTarget = () => {
      if (!target || isSyncing) return;
      const val = target.value;
      isSyncing = true;
      let matched = false;
      options.forEach((opt) => {
        const shouldCheck = val !== '' && opt.value === val;
        opt.checked = shouldCheck;
        if (shouldCheck) matched = true;
      });
      if (!matched && val === '') {
        options.forEach((opt) => {
          opt.checked = false;
        });
      }
      totalEl.textContent = matched ? val : '0';
      isSyncing = false;
    };

    options.forEach((opt) => opt.addEventListener('change', update));
    if (target) target.addEventListener('input', syncFromTarget);
    syncFromTarget();
  });
}
