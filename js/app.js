import { $, $$, getInputs } from './state.js';
import { setNow, triggerChange, sleepMidpoint } from './time.js';
import { openTimePicker } from './timePicker.js';
import { updateDrugDefaults, calcDrugs } from './drugs.js';
import { collectSummaryData, summaryTemplate, copySummary } from './summary.js';
import { showToast } from './toast.js';
import { updateAge } from './age.js';
import { initArrival } from './arrival.js';
import { initActivation } from './activation.js';
import { autoSetContraDecision } from './decision.js';
import { getActivePatient } from './patients.js';
import { setupNavigation } from './navigation.js';
import { setupAutosave } from './autosave.js';
import { setupBpEntry } from './bp.js';
import { savePatient } from './storage.js';

const SAVE_DEBOUNCE_MS = 500;
let saveTimer;
function scheduleSave(id, name, cb) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePatient(id, name);
    cb?.();
  }, SAVE_DEBOUNCE_MS);
}
function flushSave(id, name, cb) {
  clearTimeout(saveTimer);
  savePatient(id, name);
  cb?.();
}

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
    el?.addEventListener('input', () => {
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

  // Copy personal code
  $('#copyPersonalBtn').addEventListener('click', () => {
    const val = inputs.a_personal.value;
    if (window.isSecureContext && navigator.clipboard) {
      navigator.clipboard.writeText(val).catch((err) => {
        showToast('Nepavyko nukopijuoti: ' + err, { type: 'error' });
      });
    } else {
      inputs.a_personal.select();
      const ok = document.execCommand('copy');
      if (!ok) showToast('Nepavyko nukopijuoti', { type: 'error' });
    }
  });

  // Age calculation
  inputs.a_dob.addEventListener('input', updateAge);

  // BP correction helpers
  setupBpEntry();

  const bpEntries = document.getElementById('bpEntries');
  bpEntries?.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.matches('button[data-now]')) {
      setNow(target.dataset.now);
    } else if (target.matches('button[data-time-picker]')) {
      const input = document.getElementById(target.dataset.timePicker);
      if (input) openTimePicker(input);
    } else if (target.matches('button[data-stepup]')) {
      const input = document.getElementById(target.dataset.stepup);
      input?.stepUp(5);
      input?.dispatchEvent(new Event('input'));
    } else if (target.matches('button[data-stepdown]')) {
      const input = document.getElementById(target.dataset.stepdown);
      input?.stepDown(5);
      input?.dispatchEvent(new Event('input'));
    }
  });

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

  const { updateSaveStatus } = setupAutosave(inputs, {
    scheduleSave,
    flushSave,
  });
  const { activateFromHash } = setupNavigation(inputs);

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
