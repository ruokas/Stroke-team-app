import { getInputs, state } from './state.js';
import { savePatient } from './storage.js';
import { initI18n } from './i18n.js';
import { track } from './analytics.js';
import { runAll } from './bootstrap/featureRegistry.js';
import './bootstrap/features/index.js';

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

async function init() {
  const inputs = getInputs();
  loadSettings(inputs);

  const featuresContext = {
    inputs,
    scheduleSave,
    flushSave,
    saveSettings: () => saveSettings(inputs),
  };

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
    await runAll(featuresContext);
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
