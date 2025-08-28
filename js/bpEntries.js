import { handleTimeButton } from './timeControls.js';
import { setupBpEntry, setupBpInput } from './bp.js';

export function handleBpEntriesClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (handleTimeButton(target)) return;

  if (target.matches('button[data-remove-bp]')) {
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
