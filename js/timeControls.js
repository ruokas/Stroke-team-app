import { setNow, triggerChange } from './time.js';

export function handleTimeButton(target) {
  if (!(target instanceof HTMLElement)) return false;
  const button = target.closest('button');
  if (!button) return false;

  const { now, stepup, stepdown, set, val } = button.dataset;

  if (now !== undefined) {
    setNow(now);
    return true;
  }

  if (stepup !== undefined) {
    const input = document.getElementById(stepup);
    input?.stepUp(5);
    if (input) triggerChange(input);
    return true;
  }

  if (stepdown !== undefined) {
    const input = document.getElementById(stepdown);
    input?.stepDown(5);
    if (input) triggerChange(input);
    return true;
  }

  if (set !== undefined) {
    const input = document.getElementById(set);
    if (input) {
      input.value = val ?? '';
      triggerChange(input);
    }
    return true;
  }

  return false;
}
