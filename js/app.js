import { $, $$, getInputs } from './state.js';
import { setNow, triggerChange, sleepMidpoint } from './time.js';
import { openTimePicker } from './timePicker.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { collectSummaryData, summaryTemplate, copySummary } from './summary.js';
import { showToast } from './toast.js';
import { confirmModal, promptModal } from './modal.js';
import { updateAge } from './age.js';
import { initArrival } from './arrival.js';
import { initActivation } from './activation.js';
import { autoSetContraDecision } from './decision.js';
import { savePatient, getPatients as getSavedPatients } from './storage.js';
import {
  addPatient,
  switchPatient,
  removePatient,
  renamePatient,
  getActivePatient,
  getActivePatientId,
  updateActivePatient,
  getPatients,
} from './patients.js';

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
  const inputs = getInputs();
  let dirty = false;
  const patientSelect = $('#patientSelect');
  const refreshPatientSelect = (selectedId) => {
    if (!patientSelect) return;
    patientSelect.innerHTML = '';
    const pats = getPatients();
    Object.entries(pats).forEach(([id, p], idx) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = p.name || `Pacientas ${idx + 1}`;
      patientSelect.appendChild(opt);
    });
    if (selectedId) patientSelect.value = selectedId;
  };

  patientSelect?.addEventListener('change', () => {
    switchPatient(patientSelect.value);
    refreshPatientSelect(patientSelect.value);
    updateSaveStatus();
  });

  const firstId = addPatient();
  refreshPatientSelect(firstId);
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

  // Date picker buttons
  $$('button[data-time-picker]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(
        b.getAttribute('data-time-picker'),
      );
      openTimePicker(target);
    }),
  );

  // Step up/down buttons
  $$('button[data-stepup]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.getAttribute('data-stepup'));
      target?.stepUp(5);
      target?.dispatchEvent(new Event('input'));
    }),
  );
  $$('button[data-stepdown]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.getAttribute('data-stepdown'));
      target?.stepDown(5);
      target?.dispatchEvent(new Event('input'));
    }),
  );

  // Fast value buttons
  $$('button[data-set]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.dataset.set);
      if (target) {
        target.value = b.dataset.val ?? '';
        target.dispatchEvent(new Event('input'));
      }
    }),
  );

  // Drug defaults and automatic calculator
  [inputs.def_tnk, inputs.def_tpa].forEach((el) =>
    el.addEventListener('input', () => {
      updateDrugDefaults();
      calcDrugs();
    }),
  );
  inputs.drugType.addEventListener('change', () => {
    updateDrugDefaults();
    calcDrugs();
  });
  inputs.weight?.addEventListener('input', calcDrugs);
  inputs.drugConc?.addEventListener('input', calcDrugs);

  // Thrombolysis start time
  const startThrombolysisBtn = $('#startThrombolysis');
  const thrombolysisRow = document.getElementById('thrombolysisStartRow');
  startThrombolysisBtn?.addEventListener('click', () => {
    setNow('t_thrombolysis');
    thrombolysisRow?.classList.remove('hidden');
  });

  // Summary
  $('#summary').addEventListener('focus', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = summaryTemplate(data);
    inputs.summary.value = text;
    patient.summary = text;
  });
  $('#copySummaryBtn').addEventListener('click', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = copySummary(data);
    patient.summary = text;
  });

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
        entry.innerHTML = `<strong>${med}</strong><div class="grid-3 mt-5"><div class="input-group"><input type="time" id="${id}" class="time-input" step="60" value="${now}" /><button class="btn ghost" data-time-picker="${id}" aria-label="Pasirinkti laiką">⌚</button><button class="btn ghost" data-now="${id}">Dabar</button><button class="btn ghost" data-stepdown="${id}" aria-label="−5 min">−5</button><button class="btn ghost" data-stepup="${id}" aria-label="+5 min">+5</button></div><input type="text" value="${dose}" /><input type="text" placeholder="Pastabos" /></div>`;
        bpEntries.appendChild(entry);
        bpMedList.classList.add('hidden');
        entry
          .querySelector(`[data-now="${id}"]`)
          .addEventListener('click', () => setNow(id));
        entry
          .querySelector(`[data-time-picker="${id}"]`)
          .addEventListener('click', () =>
            openTimePicker(document.getElementById(id)),
          );
        entry
          .querySelector(`[data-stepup="${id}"]`)
          .addEventListener('click', () => {
            const target = document.getElementById(id);
            target?.stepUp(5);
            target?.dispatchEvent(new Event('input'));
          });
        entry
          .querySelector(`[data-stepdown="${id}"]`)
          .addEventListener('click', () => {
            const target = document.getElementById(id);
            target?.stepDown(5);
            target?.dispatchEvent(new Event('input'));
          });
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
  const sleepRow = $('#sleepTimeRow');
  const updateSleepMid = () => {
    const val = sleepMidpoint(inputs.sleep_start.value, inputs.sleep_end.value);
    inputs.lkw.value = val;
    if (val) triggerChange(inputs.lkw);
  };
  inputs.sleep_start?.addEventListener('input', updateSleepMid);
  inputs.sleep_end?.addEventListener('input', updateSleepMid);
  const updateLKW = () => {
    const val = lkwOptions.find((o) => o.checked)?.value;
    if (val === 'unknown') {
      lkwRow.classList.add('hidden');
      sleepRow.classList.add('hidden');
      inputs.lkw.value = '';
    } else if (val === 'sleep') {
      lkwRow.classList.add('hidden');
      sleepRow.classList.remove('hidden');
      updateSleepMid();
    } else {
      lkwRow.classList.remove('hidden');
      sleepRow.classList.add('hidden');
    }
  };
  lkwOptions.forEach((o) => o.addEventListener('change', updateLKW));
  updateLKW();

  // Auto decision when contraindications or unknown onset time
  const updateDecision = () =>
    autoSetContraDecision({
      lkwTypeInputs: inputs.lkw_type,
      arrivalContraInputs: inputs.arrival_contra || [],
      decisionInputs: inputs.d_decision || [],
    });
  inputs.lkw_type.forEach((o) => o.addEventListener('change', updateDecision));
  (inputs.arrival_contra || []).forEach((c) =>
    c.addEventListener('change', updateDecision),
  );
  updateDecision();

  // Save/Load/Export/Import
  const saveStatus = document.getElementById('saveStatus');
  const updateSaveStatus = () => {
    const id = getActivePatientId();
    const rec = getSavedPatients()[id];
    if (!rec) {
      saveStatus.textContent = '';
      return;
    }
    const diff = Date.now() - new Date(rec.lastUpdated).getTime();
    const mins = Math.floor(diff / 60000);
    const ago = mins < 1 ? 'just now' : `${mins}m ago`;
    saveStatus.textContent = `${rec.name} saved ${ago}`;
  };

  $('#saveBtn').addEventListener('click', () => {
    const id = getActivePatientId();
    if (!id) return;
    savePatient(id);
    showToast('Išsaugota naršyklėje.', { type: 'success' });
    updateSaveStatus();
    dirty = false;
  });

  $('#renamePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    const pats = getPatients();
    const newName = await promptModal(
      'Naujas pavadinimas',
      pats[id]?.name || '',
    );
    if (newName) {
      renamePatient(id, newName);
      refreshPatientSelect(id);
      savePatient(id, newName);
      updateSaveStatus();
      showToast('Pacientas pervadintas.', { type: 'info' });
    }
  });

  $('#deletePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    if (await confirmModal('Ištrinti pacientą?')) {
      removePatient(id);
      refreshPatientSelect(getActivePatientId());
      updateSaveStatus();
      showToast('Pacientas ištrintas.', { type: 'warning' });
    }
  });

  // Navigation
  const tabs = $$('nav .tab');
  const sections = $$('main > section');
  const navToggle = $('#navToggle');
  const showSection = (id) => {
    sections.forEach((s) => {
      const active = s.id === id;
      s.classList.toggle('hidden', !active);
      s.setAttribute('tabindex', active ? '0' : '-1');
      s.setAttribute('aria-hidden', active ? 'false' : 'true');
    });
    tabs.forEach((t) => {
      const selected = t.dataset.section === id;
      t.classList.toggle('active', selected);
      t.setAttribute('aria-selected', selected ? 'true' : 'false');
      t.setAttribute('tabindex', selected ? '0' : '-1');
    });
    if (id === 'summarySec') {
      const patient = getActivePatient();
      if (patient) {
        const data = collectSummaryData(patient);
        const text = summaryTemplate(data);
        inputs.summary.value = text;
        patient.summary = text;
      }
    }
    if (id === 'decision' && inputs.d_time && !inputs.d_time.value)
      setNow('d_time');
    document.body.classList.remove('nav-open');
    navToggle.setAttribute('aria-expanded', 'false');
  };
  const activateFromHash = () => {
    const id = location.hash.slice(1) || tabs[0]?.dataset.section;
    if (id) showSection(id);
  };
  navToggle.addEventListener('click', () => {
    const open = document.body.classList.toggle('nav-open');
    navToggle.setAttribute('aria-expanded', open ? 'true' : 'false');
  });
  tabs.forEach((tab, index) => {
    tab.addEventListener('click', (e) => {
      e.preventDefault();
      const id = tab.dataset.section;
      showSection(id);
      if (id) history.pushState(null, '', `#${id}`);
    });
    tab.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
        e.preventDefault();
        const dir = e.key === 'ArrowRight' ? 1 : -1;
        const next = (index + dir + tabs.length) % tabs.length;
        const nextTab = tabs[next];
        const id = nextTab.dataset.section;
        nextTab.focus();
        showSection(id);
        if (id) history.pushState(null, '', `#${id}`);
      }
    });
  });
  window.addEventListener('hashchange', activateFromHash);
  window.addEventListener('popstate', activateFromHash);

  // New patient
  $('#newPatientBtn').addEventListener('click', () => {
    const id = addPatient();
    refreshPatientSelect(id);
    updateSaveStatus();
  });

  const handleChange = () => {
    dirty = true;
    updateActivePatient();
    const id = getActivePatientId();
    if (!$('#summarySec').classList.contains('hidden')) {
      const patient = getActivePatient();
      if (patient) {
        const data = collectSummaryData(patient);
        const text = summaryTemplate(data);
        inputs.summary.value = text;
        patient.summary = text;
      }
    }
    if (id) {
      savePatient(id);
      updateSaveStatus();
      dirty = false;
    }
  };
  document.addEventListener('input', handleChange);
  document.addEventListener('change', handleChange);

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
  initActivation();
  initArrival();
  updateSaveStatus();
  // Apply initial section visibility only after successful setup
  activateFromHash();
}

document.addEventListener('DOMContentLoaded', bind);
