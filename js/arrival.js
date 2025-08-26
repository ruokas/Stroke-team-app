import { $, $$ } from './state.js';
import { pad } from './time.js';

export function timeSince(onset) {
  const start = new Date(onset).getTime();
  const diff = Date.now() - start;
  if (!onset || !isFinite(start) || diff < 0) return '';
  const total = Math.floor(diff / 1000);
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

let timerId;
function updateTimers() {
  const onsetEl = $('#onset_timer');
  const doorEl = $('#door_timer');
  const lkwType = $$('input[name="lkw_type"]').find((r) => r.checked)?.value;
  const lkwValue = $('#t_lkw')?.value;
  const doorValue = $('#t_door')?.value;

  if (doorEl) {
    doorEl.textContent = doorValue ? timeSince(doorValue) : '';
  }

  if (onsetEl) {
    if (!lkwValue || lkwType === 'unknown') {
      onsetEl.textContent = '';
    } else {
      onsetEl.textContent = timeSince(lkwValue);
    }
  }
}

export function computeArrivalMessage({ lkwType, lkwValue, doorValue }) {
  if (lkwType === 'unknown') {
    return {
      message: 'Pacientui reperfuzinis gydymas neindikuotinas.',
      type: 'error',
    };
  }
  if (!lkwValue) return { message: '', type: '' };
  let diff;
  if (lkwType === 'sleep' && !doorValue) {
    diff = (Date.now() - new Date(lkwValue).getTime()) / 36e5;
  } else if (doorValue) {
    diff = (new Date(doorValue) - new Date(lkwValue)) / 36e5;
  } else {
    return { message: '', type: '' };
  }
  if (!isFinite(diff)) return { message: '', type: '' };
  if (diff < 0) {
    return { message: 'Nenuoseklus laiko įrašas.', type: 'error' };
  }
  if (diff <= 4.5) {
    return {
      message: 'Indikuotina trombolizė / trombektomija.',
      type: 'success',
    };
  }
  if (diff < 9) {
    return { message: 'Reikalinga KT perfuzija.', type: 'warning' };
  }
  if (diff <= 24) {
    return {
      message:
        'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
      type: 'warning',
    };
  }
  return {
    message: 'Reperfuzinis gydymas neindikuotinas.',
    type: 'error',
  };
}

export function updateArrivalInfo() {
  const infoEl = $('#arrival_info');
  if (!infoEl) return;
  const lkwType = $$('input[name="lkw_type"]').find((r) => r.checked)?.value;
  const lkwValue = $('#t_lkw')?.value;
  const doorValue = $('#t_door')?.value;
  const { message, type } = computeArrivalMessage({
    lkwType,
    lkwValue,
    doorValue,
  });
  infoEl.textContent = '';
  infoEl.classList.remove('success', 'warning', 'error');
  if (message) {
    infoEl.textContent = message;
    if (type) infoEl.classList.add(type);
  }
}

export function initSymptomButtons() {
  const textarea = $('#arrival_symptoms');
  if (!textarea) return;
  const boxes = $$('input[name="arrival_symptom"]');
  const sideRadios = $$('input[name="arrival_symptom_side"]');
  const sideSymptoms = [
    'Veido asimetrija',
    'Rankos silpnumas',
    'Kojos silpnumas',
  ];
  const sideLabels = { left: 'Kairės', right: 'Dešinės' };
  const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

  const updateFromBoxes = () => {
    const side = sideRadios.find((r) => r.checked)?.value;
    const values = boxes
      .filter((i) => i.checked)
      .map((i) => i.value)
      .map((v) =>
        side && sideSymptoms.includes(v)
          ? `${sideLabels[side]} ${v.toLowerCase()}`
          : v,
      );
    textarea.value = values.join(', ');
  };
  const updateFromText = () => {
    const leftPrefix = `${sideLabels.left} `;
    const rightPrefix = `${sideLabels.right} `;
    let detectedSide;
    const values = textarea.value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
      .map((v) => {
        if (v.toLowerCase().startsWith(leftPrefix.toLowerCase())) {
          detectedSide = 'left';
          return capitalize(v.slice(leftPrefix.length).trim());
        }
        if (v.toLowerCase().startsWith(rightPrefix.toLowerCase())) {
          detectedSide = 'right';
          return capitalize(v.slice(rightPrefix.length).trim());
        }
        return capitalize(v);
      });
    boxes.forEach((b) => {
      b.checked = values.includes(b.value);
    });
    sideRadios.forEach((r) => {
      r.checked = r.value === detectedSide;
    });
  };
  boxes.forEach((i) => i.addEventListener('change', updateFromBoxes));
  sideRadios.forEach((r) => r.addEventListener('change', updateFromBoxes));
  textarea.addEventListener('input', updateFromText);
  updateFromText();
}

export function initArrival() {
  const updateAll = () => {
    updateArrivalInfo();
    updateTimers();
  };
  ['#t_lkw', '#t_door'].forEach((id) =>
    $(id)?.addEventListener('input', updateAll),
  );
  $$('input[name="lkw_type"]').forEach((r) =>
    r.addEventListener('change', updateAll),
  );
  initSymptomButtons();
  updateAll();
  clearInterval(timerId);
  timerId = setInterval(updateTimers, 1000);
}
