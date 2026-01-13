import { showToast } from './toast.js';

/**
 * Imaging section handlers: validates perfusion inputs and shows basic warnings.
 * Values are saved via global autosave mechanism.
 */
export function initImaging() {
  const coreEl = document.getElementById('perf_core');
  const penumbraEl = document.getElementById('perf_penumbra');
  const warnEl = document.getElementById('perfusion_warning');

  if (coreEl && penumbraEl && warnEl) {
    const validate = () => {
      const core = parseFloat(coreEl.value);
      const penumbra = parseFloat(penumbraEl.value);
      warnEl.textContent = '';
      warnEl.classList.remove('error', 'warning');
      if (Number.isNaN(core) || Number.isNaN(penumbra)) return;
      if (core < 0 || penumbra < 0) {
        warnEl.textContent = 'Reikšmės negali būti neigiamos';
        warnEl.classList.add('error');
      } else if (penumbra < core) {
        warnEl.textContent = 'Penumbra turi būti ≥ branduolio';
        warnEl.classList.add('warning');
      }
    };

    coreEl.addEventListener('input', validate);
    penumbraEl.addEventListener('input', validate);
  }

  const ctRadios = document.querySelectorAll('input[name="ct_result"]');
  ctRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked && radio.value === 'bleed') {
        showToast('Užsakyk neurochirurgo konsultaciją', { type: 'warning' });
      }
    });
  });

  const ktaRadios = document.querySelectorAll('input[name="kta_result"]');
  ktaRadios.forEach((radio) => {
    radio.addEventListener('change', () => {
      if (radio.checked && radio.value === 'lvo') {
        showToast('Susisiek su intervenciniu radiologu.', {
          type: 'warning',
        });
      }
    });
  });
}
