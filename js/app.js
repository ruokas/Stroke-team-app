import { initErrorLogger } from './errorLogger.js';
import { getInputs } from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';
import { initArrival } from './arrival.js';
import { initActivation } from './activation.js';
import { setupNavigation } from './navigation.js';
import { setupAutosave } from './autosave.js';
import { savePatient } from './storage.js';
import { setupIntervals } from './intervals.js';
import { setupHeaderHeight } from './header.js';
import { setupToolbarNavigation } from './toolbar.js';
import { setupTimeButtons } from './timeButtons.js';
import { setupDrugControls } from './drugControls.js';
import { setupSummaryHandlers } from './summaryHandlers.js';
import { setupPersonalCodeCopy } from './personalCode.js';
import { setupAgeListener } from './ageSetup.js';
import { setupBpHandlers } from './bpEntries.js';
import { setupPillState } from './pill.js';
import { setupLkw } from './lkw.js';
import { initNIHSS } from './nihss.js';
import { initI18n } from './i18n.js';
import { initAnalytics, track } from './analytics.js';

initErrorLogger();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        track('sw_register_success');
        navigator.serviceWorker.ready.then(() => track('sw_active'));
        reg.addEventListener('updatefound', () => track('sw_update_found'));
      })
      .catch((err) => {
        console.error('Service worker registration failed', err);
        track('sw_register_error', { message: err.message });
        track('error', {
          message: 'Service worker registration failed',
          stack: err?.stack,
          source: 'serviceWorker',
        });
      });
  });
}

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

function bind() {
  const inputs = getInputs();
  initAnalytics();
  setupIntervals(inputs);
  setupHeaderHeight();
  setupToolbarNavigation();
  setupTimeButtons();
  setupDrugControls(inputs);
  setupSummaryHandlers(inputs);
  setupPersonalCodeCopy(inputs);
  setupAgeListener(inputs);
  setupBpHandlers();
  setupPillState();
  setupLkw(inputs);

  const { updateSaveStatus } = setupAutosave(inputs, {
    scheduleSave,
    flushSave,
  });
  const { activateFromHash } = setupNavigation(inputs);

  initNIHSS();
  updateDrugDefaults();
  updateAge();
  initActivation();
  initArrival();
  updateSaveStatus();
  activateFromHash();
}

async function init() {
  try {
    await initI18n();
  } catch (err) {
    console.error('Failed to initialize i18n', err);
    track('error', {
      message: 'Failed to initialize i18n',
      stack: err?.stack,
      source: 'i18n',
    });
  } finally {
    bind();
  }
}

if (
  document.readyState === 'complete' ||
  document.readyState === 'interactive'
) {
  init();
} else {
  document.addEventListener('DOMContentLoaded', init);
}
