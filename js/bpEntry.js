import { pad } from './time.js';
import { validateBp } from './bp.js';

export function createBpEntry(
  med,
  dose = '',
  time,
  notes = '',
  unit = '',
  bpSysAfter = '',
  bpDiaAfter = '',
) {
  const ts = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entryId = `bp_entry_${ts}`;
  const timeId = `bp_time_${ts}`;

  const entry = document.createElement('div');
  entry.className = 'bp-entry mt-6 card';
  entry.id = entryId;

  const strong = document.createElement('strong');
  strong.textContent = med;
  entry.appendChild(strong);

  const group = document.createElement('div');
  group.className = 'input-group';
  entry.appendChild(group);

  const timeInput = document.createElement('input');
  timeInput.setAttribute('type', 'time');
  timeInput.id = timeId;
  timeInput.className = 'time-input';
  timeInput.step = '60';
  const now = new Date();
  timeInput.value = time ?? `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  group.appendChild(timeInput);

  const nowBtn = document.createElement('button');
  nowBtn.className = 'btn ghost';
  nowBtn.setAttribute('type', 'button');
  nowBtn.setAttribute('data-now', timeId);
  nowBtn.textContent = 'Dabar';
  group.appendChild(nowBtn);

  const doseGroup = document.createElement('div');
  doseGroup.className = 'input-group flex-nowrap';

  const doseInput = document.createElement('input');
  doseInput.type = 'text';
  doseInput.className = 'dose-input';
  let doseValue = dose;
  let unitValue = unit;
  if (dose && typeof dose === 'string' && !unit) {
    const match = dose.trim().match(/^(\d+(?:[.,]\d+)?)(.*)$/);
    if (match) {
      doseValue = match[1].replace(',', '.');
      unitValue = match[2].trim();
    }
  }
  doseInput.value = doseValue;
  const placeholder = unitValue || 'mg';
  doseInput.placeholder = placeholder;
  if (unitValue) doseInput.dataset.unit = unitValue;
  const validateDose = () => {
    const value = doseInput.value.trim();
    if (!value) {
      doseInput.classList.remove('invalid');
      doseInput.setCustomValidity?.('');
      return;
    }
    const num = Number.parseFloat(value);
    if (!Number.isFinite(num)) {
      doseInput.classList.add('invalid');
      doseInput.setCustomValidity?.('Enter a valid dose');
    } else {
      doseInput.classList.remove('invalid');
      doseInput.setCustomValidity?.('');
    }
  };
  doseInput.addEventListener('input', validateDose);
  validateDose();

  doseGroup.appendChild(doseInput);
  const unitSpan = document.createElement('span');
  unitSpan.className = 'unit';
  unitSpan.textContent = placeholder;
  doseGroup.appendChild(unitSpan);
  entry.appendChild(doseGroup);

  const bpAfterGroup = document.createElement('div');
  bpAfterGroup.className = 'input-group flex-nowrap bp-after';

  const sysAfterInput = document.createElement('input');
  sysAfterInput.type = 'number';
  sysAfterInput.name = 'bp_sys_after';
  sysAfterInput.className = 'bp-sys-after';
  sysAfterInput.placeholder = 'Sistolinis';
  sysAfterInput.min = '30';
  sysAfterInput.max = '300';
  sysAfterInput.step = '1';
  sysAfterInput.value = bpSysAfter;

  const diaAfterInput = document.createElement('input');
  diaAfterInput.type = 'number';
  diaAfterInput.name = 'bp_dia_after';
  diaAfterInput.className = 'bp-dia-after';
  diaAfterInput.placeholder = 'Diastolinis';
  diaAfterInput.min = '10';
  diaAfterInput.max = '200';
  diaAfterInput.step = '1';
  diaAfterInput.value = bpDiaAfter;

  const validate = () => {
    [sysAfterInput, diaAfterInput].forEach((i) => {
      i.classList.remove('invalid');
      i.setCustomValidity?.('');
    });
    if (!sysAfterInput.value || !diaAfterInput.value) return;
    if (!validateBp(Number(sysAfterInput.value), Number(diaAfterInput.value))) {
      [sysAfterInput, diaAfterInput].forEach((i) => {
        i.classList.add('invalid');
        i.setCustomValidity?.('Įveskite teisingą AKS (pvz. 120/80).');
      });
    }
  };
  sysAfterInput.addEventListener('input', validate);
  diaAfterInput.addEventListener('input', validate);

  bpAfterGroup.appendChild(sysAfterInput);
  bpAfterGroup.appendChild(diaAfterInput);
  entry.appendChild(bpAfterGroup);

  const notesInput = document.createElement('input');
  notesInput.setAttribute('type', 'text');
  notesInput.setAttribute('placeholder', 'Pastabos');
  notesInput.value = notes;
  entry.appendChild(notesInput);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn ghost';
  removeBtn.type = 'button';
  removeBtn.setAttribute('data-remove-bp', entryId);
  removeBtn.setAttribute('aria-label', 'Pašalinti');
  const closeIcon = document.createElement('img');
  closeIcon.src = 'icons/close.svg';
  closeIcon.alt = '';
  removeBtn.appendChild(closeIcon);
  entry.appendChild(removeBtn);

  return entry;
}
