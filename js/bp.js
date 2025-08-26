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
        entry.innerHTML = `
          <strong>${med}</strong>
          <div class="grid-3 mt-5">
            <div class="input-group">
              <input type="time" id="${id}" class="time-input" step="60" value="${now}" />
              <button class="btn ghost" data-time-picker="${id}" aria-label="Pasirinkti laiką">⌚</button>
              <button class="btn ghost" data-now="${id}">Dabar</button>
              <button class="btn ghost" data-stepdown="${id}" aria-label="−5 min">−5</button>
              <button class="btn ghost" data-stepup="${id}" aria-label="+5 min">+5</button>
            </div>
            <input type="text" value="${dose}" />
            <input type="text" placeholder="Pastabos" />
          </div>`;
        bpEntries.appendChild(entry);
        bpMedList.classList.add('hidden');
      });
    });
  }
}
