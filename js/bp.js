// Event handlers for created entries are delegated in app.js

import { createBpEntry } from './bpEntry.js';
import { pad } from './time.js';
import { bpMeds } from './bpMeds.js';

export function validateBp(sys, dia) {
  if (
    !Number.isFinite(sys) ||
    !Number.isFinite(dia) ||
    sys < 30 ||
    sys > 300 ||
    dia < 10 ||
    dia > 200
  )
    return false;
  return true;
}

export function setupBpInput() {
  const sys = document.getElementById('p_bp_sys');
  const dia = document.getElementById('p_bp_dia');
  if (!sys || !dia) return;
  const inputs = [sys, dia];
  const handler = () => {
    inputs.forEach((i) => {
      i.classList.remove('invalid');
      i.setCustomValidity?.('');
    });
    if (!sys.value || !dia.value) return;
    if (!validateBp(Number(sys.value), Number(dia.value))) {
      inputs.forEach((i) => {
        i.classList.add('invalid');
        i.setCustomValidity?.('Įveskite teisingą AKS (pvz. 120/80).');
      });
    }
  };
  inputs.forEach((i) => i.addEventListener('input', handler));
}

export function setupBpEntry() {
  const bpCorrBtn = document.getElementById('bpCorrBtn');
  const bpMedList = document.getElementById('bpMedList');
  const bpEntries = document.getElementById('bpEntries');
  if (bpCorrBtn && bpMedList && bpEntries) {
    bpMedList.setAttribute('role', 'list');
    bpCorrBtn.addEventListener('click', (e) => {
      e.preventDefault();
      const isHidden = bpMedList.classList.toggle('hidden');
      bpMedList.hidden = isHidden;
      bpCorrBtn.setAttribute('aria-expanded', (!isHidden).toString());
    });
    bpMedList.addEventListener('click', (e) => {
      const btn = e.target.closest('.bp-med');
      if (!btn) return;
      const med = btn.dataset.med;
      const medObj = bpMeds.find((m) => m.name === med);
      let dose = medObj?.dose || '';
      let medName = med;
      if (med === 'Kita') {
        const input = prompt('Įveskite vaisto pavadinimą');
        if (!input) return;
        medName = input.trim();
        if (!medName) return;
      }
      const now = new Date();
      const time = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
      const entry = createBpEntry(medName, dose, time);
      bpEntries.appendChild(entry);
      bpMedList.classList.add('hidden');
      bpMedList.hidden = true;
      bpCorrBtn.setAttribute('aria-expanded', 'false');
    });
  }
}
