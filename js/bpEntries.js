import { handleTimeButton } from './timeControls.js';
import { setupBpEntry, setupBpInput } from './bp.js';

export function handleBpEntriesClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;

  if (handleTimeButton(target)) return;

  const removeBtn = target.closest('button[data-remove-bp]');
  if (removeBtn) {
    const entry = document.getElementById(removeBtn.dataset.removeBp);
    entry?.remove();
  }
}

export function setupBpHandlers() {
  setupBpEntry();
  setupBpInput();
  const bpEntries = document.getElementById('bpEntries');
  bpEntries?.addEventListener('click', handleBpEntriesClick);
}
