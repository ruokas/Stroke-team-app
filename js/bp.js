// Event handlers for created entries are delegated in app.js

import { createBpEntry } from './bpEntry.js';

export function validateBp(value) {
  const match = /^\s*(\d{2,3})\s*\/\s*(\d{2,3})\s*$/.exec(value);
  if (!match) return false;
  const systolic = Number(match[1]);
  const diastolic = Number(match[2]);
  if (
    !Number.isFinite(systolic) ||
    !Number.isFinite(diastolic) ||
    systolic < 30 ||
    systolic > 300 ||
    diastolic < 10 ||
    diastolic > 200
  )
    return false;
  return true;
}

export function setupBpInput() {
  const bpInput = document.getElementById('p_bp');
  if (!bpInput) return;
  bpInput.addEventListener('input', () => {
    bpInput.classList.remove('invalid');
    if (bpInput.setCustomValidity) bpInput.setCustomValidity('');
    const val = bpInput.value;
    if (!val) return;
    if (!validateBp(val)) {
      bpInput.classList.add('invalid');
      if (bpInput.setCustomValidity)
        bpInput.setCustomValidity('Įveskite teisingą AKS (pvz. 120/80).');
    }
  });
}

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
