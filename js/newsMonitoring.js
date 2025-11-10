import { pad, toLocalInputValue, parseValidDate } from './time.js';
import { showToast } from './toast.js';
import { notify } from './notifications.js';

const REMINDER_MINUTES = 10;
const REMINDER_INTERVAL_MS = 60_000;

let els = {
  time: null,
  resp: null,
  spo2: null,
  oxygen: null,
  temp: null,
  systolic: null,
  heartRate: null,
  consciousness: null,
  notes: null,
  total: null,
  warnings: null,
  addBtn: null,
  entries: null,
  reminder: null,
};

let reminderTimer;
let overdueNotified = false;

const getEntries = () =>
  Array.from(els.entries?.querySelectorAll('.news-entry') ?? []);

function toNumber(value) {
  if (value === null || value === undefined || value === '') return null;
  const num = Number(value);
  return Number.isFinite(num) ? num : null;
}

function scoreResp(rate) {
  if (rate === null) return 0;
  if (rate <= 8) return 3;
  if (rate <= 11) return 1;
  if (rate <= 20) return 0;
  if (rate <= 24) return 2;
  return 3;
}

function scoreSpo2(spo2) {
  if (spo2 === null) return 0;
  if (spo2 <= 91) return 3;
  if (spo2 <= 93) return 2;
  if (spo2 <= 95) return 1;
  return 0;
}

function scoreTemp(temp) {
  if (temp === null) return 0;
  if (temp <= 35) return 3;
  if (temp < 36) return 1;
  if (temp <= 38) return 0;
  if (temp < 39) return 1;
  return 2;
}

function scoreSystolic(bp) {
  if (bp === null) return 0;
  if (bp <= 90) return 3;
  if (bp <= 100) return 2;
  if (bp <= 110) return 1;
  if (bp <= 219) return 0;
  return 3;
}

function scoreHeartRate(hr) {
  if (hr === null) return 0;
  if (hr <= 40) return 3;
  if (hr <= 50) return 1;
  if (hr <= 90) return 0;
  if (hr <= 110) return 1;
  if (hr <= 130) return 2;
  return 3;
}

function scoreConscious(level) {
  if (!level) return 0;
  return level === 'alert' ? 0 : 3;
}

function evaluateFlags(components, total) {
  const flags = [];
  let severity = 'normal';
  components.forEach((comp) => {
    if (comp.score >= 3) {
      severity = 'critical';
      flags.push(`${comp.label}: ${comp.value || 'nenurodyta'} - 3 taškai`);
    } else if (comp.score === 2 && severity !== 'critical') {
      if (severity !== 'critical') severity = 'warning';
      flags.push(`${comp.label}: ${comp.value || 'nenurodyta'} - 2 taškai`);
    }
  });
  if (total >= 7) {
    severity = 'critical';
    flags.unshift('Bendra NEWS2 suma ≥7 – reikia skubios reakcijos');
  } else if (total >= 5 && severity !== 'critical') {
    severity = 'warning';
    flags.unshift('Bendra NEWS2 suma ≥5 – peržiūrėkite gydymo planą');
  }
  return { flags, severity };
}

function getFormValues() {
  return {
    time: els.time?.value.trim() || '',
    resp: toNumber(els.resp?.value),
    spo2: toNumber(els.spo2?.value),
    oxygen: !!els.oxygen?.checked,
    temp: toNumber(els.temp?.value),
    systolic: toNumber(els.systolic?.value),
    heartRate: toNumber(els.heartRate?.value),
    consciousness: els.consciousness?.value || '',
    notes: els.notes?.value.trim() || '',
  };
}

function calculateScore(values) {
  const components = [
    {
      id: 'resp',
      label: 'Kvėpavimo dažnis',
      value: values.resp !== null ? `${values.resp}/min` : '',
      score: scoreResp(values.resp),
    },
    {
      id: 'spo2',
      label: 'SpO₂',
      value: values.spo2 !== null ? `${values.spo2}%` : '',
      score: scoreSpo2(values.spo2),
    },
    {
      id: 'oxygen',
      label: 'Papildomas O₂',
      value: values.oxygen ? 'Taip' : 'Ne',
      score: values.oxygen ? 2 : 0,
    },
    {
      id: 'temp',
      label: 'Temperatūra',
      value: values.temp !== null ? `${values.temp.toFixed(1)} °C` : '',
      score: scoreTemp(values.temp),
    },
    {
      id: 'bp',
      label: 'Sistolinis AKS',
      value: values.systolic !== null ? `${values.systolic} mmHg` : '',
      score: scoreSystolic(values.systolic),
    },
    {
      id: 'hr',
      label: 'Pulsas',
      value: values.heartRate !== null ? `${values.heartRate}/min` : '',
      score: scoreHeartRate(values.heartRate),
    },
    {
      id: 'conscious',
      label: 'Sąmonė',
      value: values.consciousness || 'Neužfiksuota',
      score: scoreConscious(values.consciousness),
    },
  ];
  const total = components.reduce((sum, comp) => sum + comp.score, 0);
  const { flags, severity } = evaluateFlags(components, total);
  return { total, components, flags, severity };
}

function renderWarnings(score) {
  const box = els.warnings;
  if (!box) return;
  box.classList.remove('warning', 'error', 'success');
  if (!score || (!score.flags.length && score.total === 0)) {
    box.textContent = 'Rodikliai normos ribose.';
    box.classList.add('success');
    return;
  }
  box.textContent = score.flags.join(' | ');
  if (score.severity === 'critical') box.classList.add('error');
  else if (score.severity === 'warning') box.classList.add('warning');
  else box.classList.add('success');
}

function updateScoreDisplay() {
  const values = getFormValues();
  const score = calculateScore(values);
  if (els.total) els.total.textContent = String(score.total);
  renderWarnings(score);
  return { values, score };
}

function ensureTime(value) {
  if (value) return value;
  const now = new Date();
  const local = toLocalInputValue(now);
  if (els.time) els.time.value = local;
  return local;
}

function formatDisplayTime(value) {
  const date = parseValidDate(value);
  if (!date) return value || '';
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function createEntryElement(entry) {
  const id = `news_entry_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const el = document.createElement('div');
  el.className = 'news-entry card mt-6';
  el.id = id;
  el.dataset.time = entry.time || '';
  el.dataset.resp = entry.resp !== null ? String(entry.resp) : '';
  el.dataset.spo2 = entry.spo2 !== null ? String(entry.spo2) : '';
  el.dataset.oxygen = entry.oxygen ? 'true' : 'false';
  el.dataset.temp = entry.temp !== null ? String(entry.temp) : '';
  el.dataset.systolic = entry.systolic !== null ? String(entry.systolic) : '';
  el.dataset.heartRate = entry.heartRate !== null ? String(entry.heartRate) : '';
  el.dataset.consciousness = entry.consciousness || '';
  el.dataset.notes = entry.notes || '';
  el.dataset.score = String(entry.score);
  el.dataset.flags = entry.flags.join('|');

  const header = document.createElement('div');
  header.className = 'news-entry-header';
  header.innerHTML = `<strong>${formatDisplayTime(entry.time)}</strong> · NEWS2 ${entry.score}`;
  el.appendChild(header);

  const list = document.createElement('ul');
  list.className = 'mini';
  list.style.listStyle = 'none';
  list.style.paddingLeft = '0';
  list.style.margin = '8px 0';
  list.innerHTML = [
    `Kvėpavimo dažnis: ${
      entry.resp !== null && entry.resp !== '' ? `${entry.resp}/min` : 'nenurodyta'
    }`,
    `SpO₂: ${
      entry.spo2 !== null && entry.spo2 !== ''
        ? `${entry.spo2}%${entry.oxygen ? ' (papildomas O₂)' : ''}`
        : entry.oxygen
          ? 'papildomas O₂'
          : 'nenurodyta'
    }`,
    `Temperatūra: ${
      entry.temp !== null && entry.temp !== '' ? `${entry.temp} °C` : 'nenurodyta'
    }`,
    `Sistolinis AKS: ${
      entry.systolic !== null && entry.systolic !== ''
        ? `${entry.systolic} mmHg`
        : 'nenurodyta'
    }`,
    `Pulsas: ${
      entry.heartRate !== null && entry.heartRate !== ''
        ? `${entry.heartRate}/min`
        : 'nenurodyta'
    }`,
    `Sąmonė: ${entry.consciousness || 'neužfiksuota'}`,
  ]
    .map((line) => `<li>${line}</li>`)
    .join('');
  el.appendChild(list);

  if (entry.flags.length) {
    const warn = document.createElement('div');
    warn.className = 'info-box warning';
    warn.textContent = entry.flags.join(' | ');
    el.appendChild(warn);
  }

  if (entry.notes) {
    const notes = document.createElement('p');
    notes.className = 'mini';
    notes.textContent = `Pastabos: ${entry.notes}`;
    el.appendChild(notes);
  }

  const removeBtn = document.createElement('button');
  removeBtn.type = 'button';
  removeBtn.className = 'btn ghost';
  removeBtn.dataset.removeNews = id;
  removeBtn.setAttribute('aria-label', 'Pašalinti įrašą');
  removeBtn.textContent = 'Pašalinti';
  el.appendChild(removeBtn);

  return el;
}

function dispatchPayloadUpdate() {
  if (!els.entries) return;
  const event = new Event('input', { bubbles: true });
  els.entries.dispatchEvent(event);
}

function refreshReminder() {
  const box = els.reminder;
  if (!box) return;
  const entries = getEntries();
  if (!entries.length) {
    box.textContent = 'Dar nėra stebėjimo įrašų. Įrašykite pirmą matavimą.';
    box.classList.remove('error');
    box.classList.add('warning');
    overdueNotified = false;
    return;
  }
  let latest = null;
  entries.forEach((entry) => {
    const date = parseValidDate(entry.dataset.time);
    if (!date) return;
    if (!latest || date > latest) latest = date;
  });
  if (!latest) {
    box.textContent = 'Paskutinio matavimo laikas nenustatytas.';
    box.classList.remove('error');
    box.classList.add('warning');
    overdueNotified = false;
    return;
  }
  const diffMs = Date.now() - latest.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin >= REMINDER_MINUTES) {
    box.textContent = `Paskutinis matavimas prieš ${diffMin} min. Užfiksuokite naują.`;
    box.classList.add('error');
    box.classList.remove('warning');
    if (!overdueNotified) {
      showToast('Praėjo daugiau kaip 10 min. nuo paskutinio matavimo.', {
        type: 'warning',
      });
      notify('Laikas užfiksuoti naują NEWS2 matavimą.');
      overdueNotified = true;
    }
  } else {
    const remaining = REMINDER_MINUTES - diffMin;
    box.textContent = `Kitas matavimas po ~${remaining} min.`;
    box.classList.remove('error');
    box.classList.add('warning');
    overdueNotified = false;
  }
}

function addEntry(entry, { silent = false } = {}) {
  if (!els.entries) return null;
  const element = createEntryElement(entry);
  els.entries.appendChild(element);
  refreshReminder();
  if (!silent) {
    showToast('Matavimas įrašytas.', { type: 'success' });
    dispatchPayloadUpdate();
  }
  return element;
}

function handleAdd() {
  const { values, score } = updateScoreDisplay();
  const time = ensureTime(values.time);
  const entry = {
    ...values,
    time,
    score: score.total,
    flags: score.flags,
  };
  addEntry(entry, { silent: false });
  if (els.notes) els.notes.value = '';
}

function handleEntryClick(event) {
  const target = event.target;
  if (!(target instanceof HTMLElement)) return;
  const btn = target.closest('[data-remove-news]');
  if (!btn) return;
  const id = btn.dataset.removeNews;
  if (!id) return;
  const entry = document.getElementById(id);
  entry?.remove();
  refreshReminder();
  dispatchPayloadUpdate();
  showToast('Matavimas pašalintas.', { type: 'info' });
}

function startReminderTimer() {
  if (reminderTimer) clearInterval(reminderTimer);
  reminderTimer = setInterval(refreshReminder, REMINDER_INTERVAL_MS);
}

export function setupNewsMonitoring() {
  els = {
    time: document.getElementById('news_time'),
    resp: document.getElementById('news_resp'),
    spo2: document.getElementById('news_spo2'),
    oxygen: document.getElementById('news_oxygen'),
    temp: document.getElementById('news_temp'),
    systolic: document.getElementById('news_bp_sys'),
    heartRate: document.getElementById('news_hr'),
    consciousness: document.getElementById('news_consciousness'),
    notes: document.getElementById('news_notes'),
    total: document.getElementById('news_total'),
    warnings: document.getElementById('newsWarnings'),
    addBtn: document.getElementById('news_add'),
    entries: document.getElementById('newsEntries'),
    reminder: document.getElementById('newsReminder'),
  };

  [
    els.resp,
    els.spo2,
    els.oxygen,
    els.temp,
    els.systolic,
    els.heartRate,
    els.consciousness,
  ].forEach((input) => {
    input?.addEventListener('input', updateScoreDisplay);
    input?.addEventListener('change', updateScoreDisplay);
  });

  els.addBtn?.addEventListener('click', handleAdd);
  els.entries?.addEventListener('click', handleEntryClick);

  updateScoreDisplay();
  refreshReminder();
  startReminderTimer();
}

export function addStoredNewsEntry(entry) {
  addEntry(entry, { silent: true });
}

export function clearNewsEntries() {
  if (!els.entries) return;
  els.entries.innerHTML = '';
  refreshReminder();
}

export function getNewsEntriesPayload() {
  return getEntries().map((el) => ({
    time: el.dataset.time || '',
    resp: el.dataset.resp || '',
    spo2: el.dataset.spo2 || '',
    oxygen: el.dataset.oxygen === 'true',
    temp: el.dataset.temp || '',
    systolic: el.dataset.systolic || '',
    heartRate: el.dataset.heartRate || '',
    consciousness: el.dataset.consciousness || '',
    notes: el.dataset.notes || '',
    score: Number(el.dataset.score || '0') || 0,
    flags: (el.dataset.flags || '').split('|').filter(Boolean),
  }));
}




