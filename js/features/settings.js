import { loadSettings, saveSettings } from '../domain/settings.js';
import { setState } from '../state.js';

export function applySettings(inputs) {
  const data = loadSettings(localStorage);
  if (!data) return;
  if (inputs.def_tnk)
    inputs.def_tnk.value = data.def_tnk ?? inputs.def_tnk.value;
  if (inputs.def_tpa)
    inputs.def_tpa.value = data.def_tpa ?? inputs.def_tpa.value;
  if (inputs.autosave) {
    inputs.autosave.value = data.autosave ?? inputs.autosave.value;
    setState({ autosave: inputs.autosave.value });
  }
}

export function persistSettings(inputs) {
  const data = {
    def_tnk: inputs.def_tnk?.value || '',
    def_tpa: inputs.def_tpa?.value || '',
    autosave: inputs.autosave?.value || 'on',
  };
  const saved = saveSettings(localStorage, data);
  if (!saved) {
    console.error('Failed to save settings');
  }
}
