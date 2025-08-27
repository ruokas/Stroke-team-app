// Event handlers for created entries are delegated in app.js

import { createBpEntry } from './bpEntry.js';

export function setupBpEntry() {
  const bpCorrBtn = document.getElementById('bpCorrBtn');
  const bpMedList = document.getElementById('bpMedList');
  const bpEntries = document.getElementById('bpEntries');
  if (bpCorrBtn && bpMedList && bpEntries) {
    bpCorrBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = bpMedList.classList.toggle('hidden');
      bpMedList.hidden = isHidden;
      bpCorrBtn.setAttribute('aria-expanded', (!isHidden).toString());
    });
    bpMedList.querySelectorAll('.bp-med').forEach((btn) => {
      btn.addEventListener('click', () => {
        const med = btn.dataset.med;
        const dose = btn.dataset.dose || '';
        const now = new Date().toISOString().slice(11, 16);
        const entry = createBpEntry(med, dose, now);
        bpEntries.appendChild(entry);
        bpMedList.classList.add('hidden');
        bpMedList.hidden = true;
        bpCorrBtn.setAttribute('aria-expanded', 'false');
      });
    });
  }
}
