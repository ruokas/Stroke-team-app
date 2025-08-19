import { $, $$, inputs, state } from './state.js';
import { TIME_FIELDS, setNow, updateKPIs, updateLiveTiles } from './time.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { genSummary, copySummary } from './summary.js';
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
    const inputs = calc.querySelectorAll('input[data-score]');
    const totalEl = calc.querySelector('.nihss-total');
    const update = () => {
      const sum = Array.from(inputs).reduce(
        (s, i) => s + (parseInt(i.value, 10) || 0),
        0,
      );
      totalEl.textContent = sum;
    };
    inputs.forEach((i) => i.addEventListener('input', update));
    calc.querySelector('.apply').addEventListener('click', () => {
      target.value = totalEl.textContent;
      target.dispatchEvent(new Event('input'));
      calc.removeAttribute('open');
    });
  });
}

function bind() {
  // Now buttons
  $$('button[data-now]').forEach((b) =>
    b.addEventListener('click', () => setNow(b.getAttribute('data-now'))),
  );

  // KPI update on any time change
  TIME_FIELDS.forEach((id) => {
    const el = document.getElementById(id);
    el.addEventListener('input', updateKPIs);
  });

  // Goals / defaults
  [inputs.goal_ct, inputs.goal_n, inputs.goal_g].forEach((el) =>
    el.addEventListener('input', updateKPIs),
  );
  [inputs.def_tnk, inputs.def_tpa].forEach((el) =>
    el.addEventListener('input', updateDrugDefaults),
  );
  inputs.drugType.addEventListener('change', updateDrugDefaults);

  // Calculators
  $('#calcBtn').addEventListener('click', calcDrugs);

  // Summary
  $('#summary').addEventListener('focus', genSummary);
  $('#copySummaryBtn').addEventListener('click', copySummary);

  // Pill checked state
  document.querySelectorAll('.pill input').forEach((input) => {
    const pill = input.closest('.pill');
    const update = () => pill.classList.toggle('checked', input.checked);
    input.addEventListener('change', update);
    update();
  });

  // Save/Load/Export/Import
  $('#saveBtn').addEventListener('click', () => {
    const existing = inputs.draftSelect.value;
    let name = null;
    if (!existing)
      name = prompt('Juodraščio pavadinimas?', inputs.id.value || 'Juodraštis');
    const id = saveLS(existing || undefined, name);
    inputs.draftSelect.value = id;
    alert('Išsaugota naršyklėje.');
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
    a.download = `stroke_patient_${Date.now()}.json`;
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
  $('#navToggle').addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
  $$('nav .tab').forEach((tab) =>
    tab.addEventListener('click', () =>
      document.body.classList.remove('nav-open'),
    ),
  );

  // Clear times
  $('#clearTimes').addEventListener('click', () => {
    TIME_FIELDS.forEach((id) => {
      const el = document.getElementById(id);
      el.value = '';
    });
    updateKPIs();
  });

  // New patient
  $('#newPatientBtn').addEventListener('click', () => {
    if (confirm('Išvalyti visus laukus naujam pacientui?')) {
      document.querySelectorAll('input, textarea, select').forEach((el) => {
        if (el.type === 'checkbox') el.checked = false;
        else if (
          el.id !== 'def_tnk' &&
          el.id !== 'def_tpa' &&
          !el.matches('#goal_ct,#goal_n,#goal_g,#autosave')
        )
          el.value = '';
        el.classList.remove('invalid');
        if (el.setCustomValidity) el.setCustomValidity('');
      });
      updateKPIs();
      updateDrugDefaults();
      $('#summary').value = '';
    }
  });

  // Autosave
  inputs.autosave.addEventListener('change', (e) => {
    state.autosave = e.target.value;
  });
  document.addEventListener('input', () => {
    if (state.autosave === 'on' && inputs.draftSelect.value)
      saveLS(inputs.draftSelect.value);
  });

  // Initial
  initNIHSS();
  updateDrugDefaults();
  updateKPIs();
  updateDraftSelect();
  setInterval(() => {
    updateLiveTiles();
  }, 1000);
}

document.addEventListener('DOMContentLoaded', bind);
