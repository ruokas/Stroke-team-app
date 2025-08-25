const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const pad = (n) => String(n).padStart(2, '0');

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
function updateOnsetTimer() {
  const timerEl = $('#onset_timer');
  if (!timerEl) return;
  const lkwType = $$('input[name="lkw_type"]').find((r) => r.checked)?.value;
  const lkwValue = $('#t_lkw')?.value;
  if (!lkwValue || lkwType === 'unknown') {
    timerEl.textContent = '';
    return;
  }
  timerEl.textContent = timeSince(lkwValue);
}

export function computeArrivalMessage({ lkwType, lkwValue, doorValue }) {
  if (lkwType === 'unknown') {
    return 'Pacientui reperfuzinis gydymas neindikuotinas.';
  }
  if (!lkwValue) return '';
  let diff;
  if (lkwType === 'sleep' && !doorValue) {
    diff = (Date.now() - new Date(lkwValue).getTime()) / 36e5;
  } else if (doorValue) {
    diff = (new Date(doorValue) - new Date(lkwValue)) / 36e5;
  } else {
    return '';
  }
  if (!isFinite(diff) || diff < 0) return '';
  if (diff <= 4.5) {
    return 'Indikuotina trombolizė / trombektomija.';
  }
  if (diff < 9) {
    return 'Reikalinga KT perfuzija.';
  }
  if (diff <= 24) {
    return 'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.';
  }
  return 'Reperfuzinis gydymas neindikuotinas.';
}

export function updateArrivalInfo() {
  const infoEl = $('#arrival_info');
  if (!infoEl) return;
  const lkwType = $$('input[name="lkw_type"]').find((r) => r.checked)?.value;
  const lkwValue = $('#t_lkw')?.value;
  const doorValue = $('#t_door')?.value;
  infoEl.textContent = computeArrivalMessage({
    lkwType,
    lkwValue,
    doorValue,
  });
}

export function initArrival() {
  const updateAll = () => {
    updateArrivalInfo();
    updateOnsetTimer();
  };
  ['#t_lkw', '#t_door'].forEach((id) =>
    $(id)?.addEventListener('input', updateAll),
  );
  $$('input[name="lkw_type"]').forEach((r) =>
    r.addEventListener('change', updateAll),
  );
  updateAll();
  clearInterval(timerId);
  timerId = setInterval(updateOnsetTimer, 1000);
}
