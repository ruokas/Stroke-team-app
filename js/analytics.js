import * as state from './state.js';
import { diffMinutes } from './time.js';
import { t } from './i18n.js';

const LS_KEY = 'analytics_events';
let buffer = [];

function loadEvents() {
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return [];
  try {
    const events = JSON.parse(raw);
    return Array.isArray(events) ? events : [];
  } catch {
    return [];
  }
}

function saveEvents(events) {
  try {
    if (events.length) localStorage.setItem(LS_KEY, JSON.stringify(events));
    else localStorage.removeItem(LS_KEY);
  } catch (e) {
    console.error('Failed to save analytics events', e);
    track('error', {
      message: 'Failed to save analytics events',
      stack: e?.stack,
      source: 'analytics.js',
    });
  }
}

export function track(eventName, payload = {}) {
  buffer.push({
    event: eventName,
    payload,
    ts: new Date().toISOString(),
  });
}

export async function sync() {
  if (!navigator.onLine) return;
  const events = loadEvents();
  if (!events.length) return;
  try {
    const res = await fetch('/api/events', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    });
    if (res.ok) localStorage.removeItem(LS_KEY);
  } catch (e) {
    console.error('Failed to sync analytics', e);
    track('error', {
      message: 'Failed to sync analytics',
      stack: e?.stack,
      source: 'analytics.js',
    });
  }
}

export function flush() {
  const stored = loadEvents();
  if (buffer.length) {
    saveEvents(stored.concat(buffer));
    buffer = [];
  }
  return sync();
}

export function initAnalytics() {
  window.addEventListener('online', () => {
    track('online');
    sync();
  });
  window.addEventListener('offline', () => {
    track('offline');
    flush();
  });
  setInterval(flush, 30000);
  sync();
}

/**
 * Render analytics KPIs into the analytics section.
 */
export function renderAnalytics() {
  const inputs = state.getInputs();
  const door = inputs.door?.value;
  const needle = inputs.t_thrombolysis?.value;
  const decision = inputs.d_time?.value;
  const lkw = inputs.lkw?.value;
  const sys = parseInt(inputs.bp_sys?.value || '', 10);
  const dia = parseInt(inputs.bp_dia?.value || '', 10);

  const dtn = diffMinutes(door, needle);
  const dtd = diffMinutes(door, decision);
  const lkwDoor = diffMinutes(lkw, door);
  const bpOk =
    Number.isFinite(sys) && Number.isFinite(dia)
      ? sys < 185 && dia < 110
      : null;

  const setText = (id, value) => {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  };

  setText('analytics_dtn', Number.isFinite(dtn) ? String(dtn) : '');
  setText('analytics_dtd', Number.isFinite(dtd) ? String(dtd) : '');
  setText('analytics_lkwd', Number.isFinite(lkwDoor) ? String(lkwDoor) : '');
  setText('analytics_bp', bpOk == null ? '' : bpOk ? t('yes') : t('no'));
}
