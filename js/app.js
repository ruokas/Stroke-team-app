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

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await initI18n();
  } catch (err) {
    console.error('Failed to initialize i18n', err);
  } finally {
    bind();
  }
});
