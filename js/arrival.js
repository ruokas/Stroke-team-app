const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

export function computeArrivalMessage({ lkwType, lkwValue, doorValue }) {
  if (lkwType === 'unknown') {
    return 'Pacientui reperfuzinis gydymas neindikuotinas.';
  }
  if (!lkwValue || !doorValue) return '';
  const diff = (new Date(doorValue) - new Date(lkwValue)) / 36e5;
  if (!isFinite(diff) || diff < 0) return '';
  if (diff <= 4.5) {
    return 'Indikuotina trombolizė / trombektomija.';
  }
  if (diff <= 9) {
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
  ['#t_lkw', '#t_door'].forEach((id) =>
    $(id)?.addEventListener('input', updateArrivalInfo),
  );
  $$('input[name="lkw_type"]').forEach((r) =>
    r.addEventListener('change', updateArrivalInfo),
  );
  updateArrivalInfo();
}
