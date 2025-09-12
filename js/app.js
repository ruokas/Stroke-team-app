import { initErrorLogger } from './errorLogger.js';
import { getInputs, state } from './state.js';
import { updateDrugDefaults } from './drugs.js';
import { updateAge } from './age.js';
import { initArrival } from './arrival.js';
import { initActivation } from './activation.js';
import { initImaging } from './imaging.js';
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
import { initTheme, setupThemeToggle } from './theme.js';
import { setupNotificationToggle } from './notifications.js';

initTheme();
initErrorLogger();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('sw.js', window.location))
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

const SETTINGS_KEY = 'stroke_settings';

function loadSettings(inputs) {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return;
    const data = JSON.parse(raw);
    if (inputs.def_tnk)
      inputs.def_tnk.value = data.def_tnk ?? inputs.def_tnk.value;
    if (inputs.def_tpa)
      inputs.def_tpa.value = data.def_tpa ?? inputs.def_tpa.value;
    if (inputs.autosave) {
      inputs.autosave.value = data.autosave ?? inputs.autosave.value;
      state.autosave = inputs.autosave.value;
    }
  } catch (err) {
    console.error('Failed to load settings', err);
  }
}

function saveSettings(inputs) {
  const data = {
    def_tnk: inputs.def_tnk?.value || '',
    def_tpa: inputs.def_tpa?.value || '',
    autosave: inputs.autosave?.value || 'on',
  };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(data));
  } catch (err) {
    console.error('Failed to save settings', err);
  }
}

function bind() {
  const inputs = getInputs();
  loadSettings(inputs);
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
  setupThemeToggle();
  setupNotificationToggle();

  const { updateSaveStatus } = setupAutosave(inputs, {
    scheduleSave,
    flushSave,
  });
  const { activateFromHash } = setupNavigation(inputs);

  const settingsForm = document.getElementById('settingsForm');
  settingsForm?.addEventListener('submit', (e) => {
    e.preventDefault();
    saveSettings(inputs);
    updateDrugDefaults();
  });

  initNIHSS();
  updateDrugDefaults();
  updateAge();
  initActivation();
  initArrival();
  initImaging();
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
