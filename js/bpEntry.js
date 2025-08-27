export function createBpEntry(med, dose = '', time, notes = '') {
  const ts = `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const entryId = `bp_entry_${ts}`;
  const timeId = `bp_time_${ts}`;

  const entry = document.createElement('div');
  entry.className = 'bp-entry mt-10';
  entry.id = entryId;

  const strong = document.createElement('strong');
  strong.textContent = med;
  entry.appendChild(strong);

  const grid = document.createElement('div');
  grid.className = 'grid-3 mt-5';
  entry.appendChild(grid);

  const group = document.createElement('div');
  group.className = 'input-group';
  grid.appendChild(group);

  const timeInput = document.createElement('input');
  timeInput.setAttribute('type', 'time');
  timeInput.id = timeId;
  timeInput.className = 'time-input';
  timeInput.step = '60';
  timeInput.value = time ?? new Date().toISOString().slice(11, 16);
  group.appendChild(timeInput);

  const timePickerBtn = document.createElement('button');
  timePickerBtn.className = 'btn ghost';
  timePickerBtn.setAttribute('data-time-picker', timeId);
  timePickerBtn.setAttribute('aria-label', 'Pasirinkti laiką');
  timePickerBtn.textContent = '⌚';
  group.appendChild(timePickerBtn);

  const nowBtn = document.createElement('button');
  nowBtn.className = 'btn ghost';
  nowBtn.setAttribute('data-now', timeId);
  nowBtn.textContent = 'Dabar';
  group.appendChild(nowBtn);

  const stepDownBtn = document.createElement('button');
  stepDownBtn.className = 'btn ghost';
  stepDownBtn.setAttribute('data-stepdown', timeId);
  stepDownBtn.setAttribute('aria-label', '−5 min');
  stepDownBtn.textContent = '−5';
  group.appendChild(stepDownBtn);

  const stepUpBtn = document.createElement('button');
  stepUpBtn.className = 'btn ghost';
  stepUpBtn.setAttribute('data-stepup', timeId);
  stepUpBtn.setAttribute('aria-label', '+5 min');
  stepUpBtn.textContent = '+5';
  group.appendChild(stepUpBtn);

  const doseInput = document.createElement('input');
  doseInput.setAttribute('type', 'text');
  doseInput.value = dose;
  grid.appendChild(doseInput);

  const notesInput = document.createElement('input');
  notesInput.setAttribute('type', 'text');
  notesInput.setAttribute('placeholder', 'Pastabos');
  notesInput.value = notes;
  grid.appendChild(notesInput);

  const removeBtn = document.createElement('button');
  removeBtn.className = 'btn ghost';
  removeBtn.setAttribute('data-remove-bp', entryId);
  removeBtn.textContent = '❌';
  entry.appendChild(removeBtn);

  return entry;
}
