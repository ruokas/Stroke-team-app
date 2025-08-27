import { $$ } from './state.js';
import { openTimePicker } from './timePicker.js';
import { setNow } from './time.js';

export function setupTimeButtons() {
  $$('button[data-now]').forEach((b) =>
    b.addEventListener('click', () => setNow(b.getAttribute('data-now'))),
  );

  $$('button[data-time-picker]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(
        b.getAttribute('data-time-picker'),
      );
      openTimePicker(target);
    }),
  );

  $$('button[data-stepup]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.getAttribute('data-stepup'));
      target?.stepUp(5);
      target?.dispatchEvent(new Event('input'));
    }),
  );

  $$('button[data-stepdown]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.getAttribute('data-stepdown'));
      target?.stepDown(5);
      target?.dispatchEvent(new Event('input'));
    }),
  );

  $$('button[data-set]').forEach((b) =>
    b.addEventListener('click', () => {
      const target = document.getElementById(b.dataset.set);
      if (target) {
        target.value = b.dataset.val ?? '';
        target.dispatchEvent(new Event('input'));
      }
    }),
  );
}
