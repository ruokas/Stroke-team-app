import { setNow } from './time.js';
import { openTimePicker } from './timePicker.js';
import { setupBpEntry, setupBpInput } from './bp.js';

export function handleBpEntriesClick(event) {
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
  } else if (target.matches('button[data-remove-bp]')) {
    const entry = document.getElementById(target.dataset.removeBp);
    entry?.remove();
  }
}

export function setupBpHandlers() {
  setupBpEntry();
  setupBpInput();
  const bpEntries = document.getElementById('bpEntries');
  bpEntries?.addEventListener('click', handleBpEntriesClick);
}
