import { $, inputs, state } from './state.js';

export const TIME_FIELDS = [
  't_lkw',
  't_onset',
  't_door',
  't_ct',
  't_needle',
  't_groin',
  't_reperf',
];

export function toDate(val) {
  if (!val) return null;
  const d = new Date(val);
  return isNaN(d) ? null : d;
}

export function minsBetween(a, b) {
  if (!a || !b) return null;
  return Math.round((b - a) / 60000);
}

export function fmtMins(m) {
  if (m == null) return '—';
  const sign = m < 0 ? '-' : '';
  m = Math.abs(m);
  const h = Math.floor(m / 60);
  const r = m % 60;
  return h ? `${sign}${h} val ${r} min` : `${sign}${r} min`;
}

export function toLocalInputValue(d) {
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function triggerChange(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function setNow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const now = new Date();
  el.value = toLocalInputValue(now);
  triggerChange(el);
}

export function classify(value, goal) {
  if (value == null) return '';
  if (value <= goal) return 'good';
  if (value <= goal + 15) return 'warn';
  return 'bad';
}

export function readGoals() {
  state.goals.d2ct = Number(inputs.goal_ct.value || 20);
  state.goals.d2n = Number(inputs.goal_n.value || 60);
  state.goals.d2g = Number(inputs.goal_g.value || 90);
  $('#g_ct_goal').textContent = state.goals.d2ct;
  $('#g_n_goal').textContent = state.goals.d2n;
  $('#g_g_goal').textContent = state.goals.d2g;
}

export function updateKPIs() {
  readGoals();
  const tDoor = toDate(inputs.door.value);
  const tCT = toDate(inputs.ct.value);
  const tN = toDate(inputs.needle.value);
  const tG = toDate(inputs.groin.value);

  const d2ct = minsBetween(tDoor, tCT);
  const d2n = minsBetween(tDoor, tN);
  const d2g = minsBetween(tDoor, tG);

  const kpis = [
    { id: 'kpi_d2ct', val: d2ct, goal: state.goals.d2ct, label: 'D2CT' },
    { id: 'kpi_d2n', val: d2n, goal: state.goals.d2n, label: 'D2N' },
    { id: 'kpi_d2g', val: d2g, goal: state.goals.d2g, label: 'D2G' },
  ];

  kpis.forEach((k) => {
    const el = document.getElementById(k.id);
    el.classList.remove('good', 'warn', 'bad');
    const clazz = classify(k.val, k.goal);
    if (clazz) el.classList.add(clazz);
    el.querySelector('[data-val]').textContent =
      `${k.label}: ${fmtMins(k.val)}`;
  });

  updateLiveTiles();
}

export function updateLiveTiles() {
  const now = new Date();
  const tDoor = toDate(inputs.door.value);
  const tOnset = toDate(inputs.onset.value) || toDate(inputs.lkw.value);
  const d2nGoal = state.goals.d2n;

  const sinceDoor = minsBetween(tDoor, now);
  const sinceOnset = minsBetween(tOnset, now);
  const toNeedle = tDoor
    ? inputs.needle.value
      ? null
      : d2nGoal - minsBetween(tDoor, now)
    : null;

  const elSD = $('#t_since_door');
  elSD.textContent = fmtMins(sinceDoor);
  const elSO = $('#t_since_onset');
  elSO.textContent = fmtMins(sinceOnset);
  const elTN = $('#t_to_needle');
  elTN.textContent =
    toNeedle == null
      ? '—'
      : toNeedle >= 0
        ? fmtMins(toNeedle) + ' liko'
        : 'Tikslas viršytas ' + fmtMins(Math.abs(toNeedle));

  $('#t_since_door_dot').style.background = tDoor
    ? 'var(--good)'
    : 'var(--muted)';
  $('#t_since_onset_dot').style.background = tOnset
    ? 'var(--good)'
    : 'var(--muted)';
  $('#t_to_needle_dot').style.background =
    toNeedle == null
      ? 'var(--muted)'
      : toNeedle >= 0
        ? 'var(--warn)'
        : 'var(--bad)';
}
