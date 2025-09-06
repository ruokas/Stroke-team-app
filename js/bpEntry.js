import { pad } from './time.js';

export function createBpEntry(med, dose = '', time, notes = '') {
  const ts = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entryId = `bp_entry_${ts}`;
  const timeId = `bp_time_${ts}`;

  const entry = document.createElement('div');
  entry.className = 'bp-entry mt-6';
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

  const doseInput = document.createElement('input');
  doseInput.setAttribute('type', 'text');
  doseInput.value = dose;
  entry.appendChild(doseInput);

  const notesInput = document.createElement('input');
  notesInput.setAttribute('type', 'text');
  notesInput.setAttribute('placeholder', 'Pastabos');
  notesInput.value = notes;
  entry.appendChild(notesInput);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn ghost';
  removeBtn.type = 'button';
  removeBtn.setAttribute('data-remove-bp', entryId);
  const closeIcon = document.createElement('img');
  closeIcon.src = 'icons/close.svg';
  closeIcon.alt = '';
  removeBtn.appendChild(closeIcon);
  entry.appendChild(removeBtn);

  return entry;
}
