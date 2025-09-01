import { diffMinutes } from './time.js';
import { showToast } from './toast.js';
import { notify } from './notifications.js';

const INTERVAL_LIMITS = {
  lkwThrombolysis: 270,
  doorThrombolysis: 60,
};

export function setupIntervals(inputs) {
  const lkwIntervalBox = document.getElementById('lkwThrombolysisInterval');
  const doorIntervalBox = document.getElementById('doorThrombolysisInterval');
  let lkwToastShown = false;
  let doorToastShown = false;
  const updateIntervals = () => {
    const thrombo = inputs.t_thrombolysis?.value;
    const lkw = inputs.lkw?.value;
    const door = inputs.door?.value;

    if (lkwIntervalBox) {
      if (lkw && thrombo) {
        const diff = diffMinutes(lkw, thrombo);
        lkwIntervalBox.textContent = `Paskutinį kartą matytas sveikas → trombolizė: ${diff} min`;
        const over = diff > INTERVAL_LIMITS.lkwThrombolysis;
        lkwIntervalBox.classList.toggle('error', over);
        if (over) {
          if (!lkwToastShown) {
            const msg =
              'Viršytas Paskutinį kartą matytas sveikas→trombolizės intervalas';
            showToast(msg, {
              type: 'warning',
            });
            notify(msg);
          }
          lkwToastShown = true;
        } else {
          lkwToastShown = false;
        }
      } else {
        lkwIntervalBox.textContent = '';
        lkwIntervalBox.classList.remove('error');
        lkwToastShown = false;
      }
    }

    if (doorIntervalBox) {
      if (door && thrombo) {
        const diff = diffMinutes(door, thrombo);
        doorIntervalBox.textContent = `Durys → trombolizė: ${diff} min`;
        const over = diff > INTERVAL_LIMITS.doorThrombolysis;
        doorIntervalBox.classList.toggle('error', over);
        if (over) {
          if (!doorToastShown) {
            const msg = 'Viršytas durų→trombolizės intervalas';
            showToast(msg, {
              type: 'warning',
            });
            notify(msg);
          }
          doorToastShown = true;
        } else {
          doorToastShown = false;
        }
      } else {
        doorIntervalBox.textContent = '';
        doorIntervalBox.classList.remove('error');
        doorToastShown = false;
      }
    }
  };
  [inputs.t_thrombolysis, inputs.lkw, inputs.door].forEach((el) =>
    el?.addEventListener('input', updateIntervals),
  );
  updateIntervals();
}
