import { $, $$, inputs, state } from './state.js';
import { setNow } from './time.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { genSummary, copySummary } from './summary.js';
import { updateAge } from './age.js';
import {
  saveLS,
  loadLS,
  renameLS,
  deleteLS,
  getPayload,
  setPayload,
  updateDraftSelect,
  getDrafts,
} from './storage.js';

function initNIHSS() {
  $$('.nihss-calc').forEach((calc) => {
    const target = document.getElementById(calc.dataset.target);
    const fields = calc.querySelectorAll('[data-score]');
    const totalEl = calc.querySelector('.nihss-total');
    const update = () => {
      const sum = Array.from(fields).reduce(
        (s, i) => s + (parseInt(i.value, 10) || 0),
        0,
      );
      totalEl.textContent = sum;
    };
    fields.forEach((i) => i.addEventListener('input', update));
    calc.querySelector('.apply').addEventListener('click', () => {
      target.value = totalEl.textContent;
      target.dispatchEvent(new Event('input'));
    });
  });
}

function bind() {
  let dirty = false;
  const header = document.querySelector('header');
  const setHeaderHeight = () =>
    document.documentElement.style.setProperty(
      '--header-height',
      header.offsetHeight + 'px',
    );
  setHeaderHeight();
  window.addEventListener('resize', setHeaderHeight);

  // Now buttons
  $$('button[data-now]').forEach((b) =>
    b.addEventListener('click', () => setNow(b.getAttribute('data-now'))),
  );

  // Drug defaults
  [inputs.def_tnk, inputs.def_tpa].forEach((el) =>
    el.addEventListener('input', updateDrugDefaults),
  );
  inputs.drugType.addEventListener('change', updateDrugDefaults);

  // Calculators
  $('#calcBtn').addEventListener('click', calcDrugs);

  // Summary
  $('#summary').addEventListener('focus', genSummary);
  $('#copySummaryBtn').addEventListener('click', copySummary);

  // Age calculation
  inputs.a_dob.addEventListener('input', updateAge);

  // BP correction
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
        entry.innerHTML = `<strong>${med}</strong><div class="grid-3 mt-5"><div class="input-group"><input type="time" id="${id}" class="time-input" step="60" value="${now}" /><button class="btn ghost" data-now="${id}">Dabar</button></div><input type="text" value="${dose}" /><input type="text" placeholder="Pastabos" /></div>`;
        bpEntries.appendChild(entry);
        bpMedList.classList.add('hidden');
        entry
          .querySelector(`[data-now="${id}"]`)
          .addEventListener('click', () => setNow(id));
      });
    });
  }

  // Pill checked state
  document.querySelectorAll('.pill input').forEach((input) => {
    const pill = input.closest('.pill');
    const update = () => {
      if (input.type === 'radio') {
        document
          .querySelectorAll(`input[name="${input.name}"]`)
          .forEach((i) =>
            i.closest('.pill')?.classList.toggle('checked', i.checked),
          );
      } else {
        pill.classList.toggle('checked', input.checked);
      }
    };
    input.addEventListener('change', update);
    update();
  });

  // LKW option handling
  const lkwOptions = inputs.lkw_type;
  const lkwRow = $('#lkwTimeRow');
  const updateLKW = () => {
    const val = lkwOptions.find((o) => o.checked)?.value;
    if (val === 'unknown') {
      lkwRow.classList.add('hidden');
      inputs.lkw.value = '';
    } else {
      lkwRow.classList.remove('hidden');
    }
  };
  lkwOptions.forEach((o) => o.addEventListener('change', updateLKW));
  updateLKW();

  // Save/Load/Export/Import
  const saveStatus = document.getElementById('saveStatus');
  const updateSaveStatus = () => {
    const t = new Date().toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });
    saveStatus.textContent = `Išsaugota ${t}`;
  };

  $('#saveBtn').addEventListener('click', () => {
    const existing = inputs.draftSelect.value;
    let name = null;
    if (!existing)
      name = prompt(
        'Juodraščio pavadinimas?',
        inputs.nih0.value || 'Juodraštis',
      );
    const id = saveLS(existing || undefined, name);
    inputs.draftSelect.value = id;
    alert('Išsaugota naršyklėje.');
    updateSaveStatus();
    dirty = false;
  });
  $('#loadBtn').addEventListener('click', () => {
    const id = inputs.draftSelect.value;
    if (!id) {
      alert('Pasirinkite juodraštį.');
      return;
    }
    const p = loadLS(id);
    if (p) {
      setPayload(p);
      alert('Atkurta iš naršyklės.');
      dirty = false;
    } else alert('Nėra išsaugoto įrašo.');
  });
  $('#renameDraftBtn').addEventListener('click', () => {
    const id = inputs.draftSelect.value;
    if (!id) {
      alert('Pasirinkite juodraštį.');
      return;
    }
    const drafts = getDrafts();
    const newName = prompt('Naujas pavadinimas', drafts[id]?.name || '');
    if (newName) renameLS(id, newName);
  });
  $('#deleteDraftBtn').addEventListener('click', () => {
    const id = inputs.draftSelect.value;
    if (!id) {
      alert('Pasirinkite juodraštį.');
      return;
    }
    if (confirm('Ištrinti juodraštį?')) {
      deleteLS(id);
      inputs.draftSelect.value = '';
    }
  });
  $('#exportBtn').addEventListener('click', () => {
    const data = JSON.stringify(getPayload(), null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `insulto_pacientas_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });
  $('#importBtn').addEventListener('click', () => $('#importFile').click());
  $('#importFile').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const p = JSON.parse(reader.result);
        setPayload(p);
        alert('Importuota.');
      } catch (err) {
        alert('Klaida skaitant JSON.');
      }
      e.target.value = '';
    };
    reader.readAsText(file);
  });

  // Navigation
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const showSection = (id) => {
    sections.forEach((s) => s.classList.toggle('hidden', s.id !== id));
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.section === id));
    if (id === 'summarySec') genSummary();
    if (id === 'decision' && inputs.d_time && !inputs.d_time.value)
      setNow('d_time');
    document.body.classList.remove('nav-open');
  };
  const activateFromHash = () => {
    const id = location.hash.slice(1) || tabs[0]?.dataset.section;
    if (id) showSection(id);
  };
  $('#navToggle').addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
  tabs.forEach((tab) =>
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const id = tab.dataset.section;
      showSection(id);
      if (id) location.hash = id;
    }),
  );
  window.addEventListener('hashchange', activateFromHash);
  activateFromHash();

  // New patient
  $('#newPatientBtn').addEventListener('click', () => {
    if (confirm('Išvalyti visus laukus naujam pacientui?')) {
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        if (el.type === 'checkbox') el.checked = false;
        else if (
          el.id !== 'def_tnk' &&
          el.id !== 'def_tpa' &&
          el.id !== 'autosave'
        )
          el.value = '';
        el.classList.remove('invalid');
        if (el.setCustomValidity) el.setCustomValidity('');
      });
      updateDrugDefaults();
      $('#summary').value = '';
    }
  });

  // Autosave
  inputs.autosave.addEventListener('change', (e) => {
    state.autosave = e.target.value;
  });
  document.addEventListener('input', () => {
    dirty = true;
    if (state.autosave === 'on' && inputs.draftSelect.value) {
      saveLS(inputs.draftSelect.value);
      updateSaveStatus();
      dirty = false;
    }
    if (!$('#summarySec').classList.contains('hidden')) genSummary();
  });
  document.addEventListener('change', () => {
    dirty = true;
  });

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  // Initial
  initNIHSS();
  updateDrugDefaults();
  updateAge();
  updateDraftSelect();
}

document.addEventListener('DOMContentLoaded', bind);
