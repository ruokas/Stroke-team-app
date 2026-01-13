import { loadSettings, saveSettings } from '../domain/settings.js';
import { setState } from '../state.js';

function sanitizeSettings(data) {
  const normalized = {};
  if (typeof data.def_tnk === 'string') normalized.def_tnk = data.def_tnk;
  if (typeof data.def_tpa === 'string') normalized.def_tpa = data.def_tpa;
  if (typeof data.autosave === 'string') normalized.autosave = data.autosave;
  return normalized;
}

export function applySettings(inputs) {
  const defTnkInput = inputs?.def_tnk ?? null;
  const defTpaInput = inputs?.def_tpa ?? null;
  const autosaveInput = inputs?.autosave ?? null;
  const defaults = {
    def_tnk: defTnkInput?.value || '',
    def_tpa: defTpaInput?.value || '',
    autosave: autosaveInput?.value || 'on',
  };
  const stored = loadSettings(localStorage);
  if (!stored) return;
  const data = { ...defaults, ...sanitizeSettings(stored) };
  if (defTnkInput) defTnkInput.value = data.def_tnk || defTnkInput.value;
  if (defTpaInput) defTpaInput.value = data.def_tpa || defTpaInput.value;
  if (autosaveInput) {
    autosaveInput.value = data.autosave || autosaveInput.value;
    setState({ autosave: autosaveInput.value });
  }
}

export function persistSettings(inputs) {
  const data = {
    def_tnk: inputs?.def_tnk?.value || '',
    def_tpa: inputs?.def_tpa?.value || '',
    autosave: inputs?.autosave?.value || 'on',
  };
  const saved = saveSettings(localStorage, data);
  if (!saved) {
    console.error('Failed to save settings');
  }
}
