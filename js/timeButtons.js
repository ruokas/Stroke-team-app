import { handleTimeButton } from './timeControls.js';

export function setupTimeButtons() {
  document.addEventListener('click', (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;
    handleTimeButton(target);
  });
}
