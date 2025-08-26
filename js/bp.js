// Event handlers for created entries are delegated in app.js

export function setupBpEntry() {
  const bpCorrBtn = document.getElementById('bpCorrBtn');
  const bpMedList = document.getElementById('bpMedList');
  const bpEntries = document.getElementById('bpEntries');
  if (bpCorrBtn && bpMedList && bpEntries) {
    bpCorrBtn.addEventListener('click', (e) => {
      e.preventDefault();
      bpMedList.classList.toggle('hidden');
    });
    bpMedList.querySelectorAll('.bp-med').forEach((btn) => {
      btn.addEventListener('click', () => {
        const med = btn.dataset.med;
        const dose = btn.dataset.dose || '';
        const now = new Date().toISOString().slice(11, 16);
        const entry = document.createElement('div');
        entry.className = 'bp-entry mt-10';
        const id = `bp_time_${Date.now()}`;

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
        timeInput.id = id;
        timeInput.className = 'time-input';
        timeInput.step = '60';
        timeInput.value = now;
        group.appendChild(timeInput);

        const timePickerBtn = document.createElement('button');
        timePickerBtn.className = 'btn ghost';
        timePickerBtn.setAttribute('data-time-picker', id);
        timePickerBtn.setAttribute('aria-label', 'Pasirinkti laiką');
        timePickerBtn.textContent = '⌚';
        group.appendChild(timePickerBtn);

        const nowBtn = document.createElement('button');
        nowBtn.className = 'btn ghost';
        nowBtn.setAttribute('data-now', id);
        nowBtn.textContent = 'Dabar';
        group.appendChild(nowBtn);

        const stepDownBtn = document.createElement('button');
        stepDownBtn.className = 'btn ghost';
        stepDownBtn.setAttribute('data-stepdown', id);
        stepDownBtn.setAttribute('aria-label', '−5 min');
        stepDownBtn.textContent = '−5';
        group.appendChild(stepDownBtn);

        const stepUpBtn = document.createElement('button');
        stepUpBtn.className = 'btn ghost';
        stepUpBtn.setAttribute('data-stepup', id);
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
        grid.appendChild(notesInput);

        bpEntries.appendChild(entry);
        bpMedList.classList.add('hidden');
      });
    });
  }
}
