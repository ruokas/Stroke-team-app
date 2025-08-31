import * as state from './state.js';
import { diffMinutes } from './time.js';

/**
 * Render analytics KPIs into the analytics section.
 */
export function renderAnalytics() {
  const inputs = state.getInputs();
  const door = inputs.door?.value;
  const needle = inputs.t_thrombolysis?.value;
  const decision = inputs.d_time?.value;
  const lkw = inputs.lkw?.value;
  const sys = parseInt(inputs.bp_sys?.value || '', 10);
  const dia = parseInt(inputs.bp_dia?.value || '', 10);

  const dtn = diffMinutes(door, needle);
  const dtd = diffMinutes(door, decision);
  const lkwDoor = diffMinutes(lkw, door);
  const bpOk =
    Number.isFinite(sys) && Number.isFinite(dia)
      ? sys < 185 && dia < 110
      : null;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('analytics_dtn', Number.isFinite(dtn) ? String(dtn) : '');
  setText('analytics_dtd', Number.isFinite(dtd) ? String(dtd) : '');
  setText('analytics_lkwd', Number.isFinite(lkwDoor) ? String(lkwDoor) : '');
  setText('analytics_bp', bpOk == null ? '' : bpOk ? 'Yes' : 'No');
}
