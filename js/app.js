import { $, $$, inputs, state } from './state.js';
import { TIME_FIELDS, setNow, updateKPIs, updateLiveTiles } from './time.js';
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

  // Age calculation
  inputs.a_dob.addEventListener('input', updateAge);

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
      updateKPIs();
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
      name = prompt('Juodraščio pavadinimas?', inputs.id.value || 'Juodraštis');
    const id = saveLS(existing || undefined, name);
    inputs.draftSelect.value = id;
    alert('Išsaugota naršyklėje.');
    updateSaveStatus();
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
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const showSection = (id) => {
    sections.forEach((s) => s.classList.toggle('hidden', s.id !== id));
    tabs.forEach((t) => t.classList.toggle('active', t.dataset.section === id));
    document.body.classList.remove('nav-open');
  };
  $('#navToggle').addEventListener('click', () => {
    document.body.classList.toggle('nav-open');
  });
  tabs.forEach((tab) =>
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      showSection(tab.dataset.section);
    }),
  );
  showSection(tabs[0]?.dataset.section);

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
    if (state.autosave === 'on' && inputs.draftSelect.value) {
      saveLS(inputs.draftSelect.value);
      updateSaveStatus();
    }
  });

  // Initial
  initNIHSS();
  updateDrugDefaults();
  updateKPIs();
  updateAge();
  updateDraftSelect();
  setInterval(() => {
    updateLiveTiles();
  }, 1000);
}

document.addEventListener('DOMContentLoaded', bind);
