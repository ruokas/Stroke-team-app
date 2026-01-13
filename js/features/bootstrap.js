import { initErrorLogger } from '../errorLogger.js';
import { getInputs } from '../state.js';
import { updateDrugDefaults } from '../drugs.js';
import { updateAge } from '../age.js';
import { initArrival } from '../arrival.js';
import { initActivation } from '../activation.js';
import { initImaging } from '../imaging.js';
import { setupNavigation } from '../navigation.js';
import { setupAutosave } from '../autosave.js';
import { savePatient } from '../storage.js';
import { setupIntervals } from '../intervals.js';
import { setupHeaderHeight } from '../header.js';
import { setupToolbarNavigation } from '../toolbar.js';
import { setupTimeButtons } from '../timeControls.js';
import { setupDrugControls } from '../drugControls.js';
import { setupSummaryHandlers } from '../summaryHandlers.js';
import { setupPersonalCodeCopy } from '../personalCode.js';
import { setupAgeListener } from '../ageSetup.js';
import { setupBpHandlers } from '../bpEntries.js';
import { setupPillState } from '../pill.js';
import { setupLkw } from '../lkw.js';
import { setupDecision } from '../decision.js';
import { initNIHSS } from '../nihss.js';
import { initI18n } from '../i18n.js';
import { initAnalytics, track } from '../analytics.js';
import { initTheme, setupThemeToggle } from '../theme.js';
import { setupNotificationToggle } from '../notifications.js';
import { setupFieldHints } from '../fieldHints.js';
import { applySettings, persistSettings } from './settings.js';
import { registerServiceWorker } from './serviceWorker.js';

const SAVE_DEBOUNCE_MS = 500;
let saveTimer;

function scheduleSave(id, name, cb) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    savePatient(id, name);
    cb();
  }, SAVE_DEBOUNCE_MS);
}

function flushSave(id, name, cb) {
  clearTimeout(saveTimer);
  savePatient(id, name);
  cb();
}

function bind() {
  const inputs = getInputs();
  applySettings(inputs);
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
  setupDecision(inputs);
  setupThemeToggle();
  setupNotificationToggle();
  setupFieldHints();

  const { updateSaveStatus } = setupAutosave(inputs, {
    scheduleSave,
    flushSave,
  });
  const { activateFromHash } = setupNavigation(inputs);

  const settingsForm = document.getElementById('settingsForm');
  settingsForm.addEventListener('submit', (e) => {
    e.preventDefault();
    persistSettings(inputs);
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
      stack: err.stack,
      source: 'i18n',
    });
  } finally {
    bind();
  }
}

export function bootstrapApp() {
  initTheme();
  initErrorLogger();
  registerServiceWorker();

  if (
    document.readyState === 'complete' ||
    document.readyState === 'interactive'
  ) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
}
