import { showToast } from './toast.js';

export function setupPersonalCodeCopy(inputs) {
  const copyPersonalBtn = document.getElementById('copyPersonalBtn');
  if (!copyPersonalBtn) return;

  copyPersonalBtn.addEventListener('click', () => {
    const val = inputs.a_personal.value;
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard.writeText(val).catch((err) => {
        showToast('Nepavyko nukopijuoti: ' + err, { type: 'error' });
      });
    } else {
      inputs.a_personal.select();
      const ok = document.execCommand('copy');
      if (!ok) showToast('Nepavyko nukopijuoti', { type: 'error' });
    }
  });
}
