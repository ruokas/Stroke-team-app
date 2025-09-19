import * as state from './state.js';
import { diffMinutes } from './time.js';
import { t } from './i18n.js';
import { withSupabaseHeaders } from './supabase.js';

const LS_KEY = 'analytics_events';
let buffer = [];
const API_BASE =
  (typeof window !== 'undefined' && window.API_BASE) ||
  (typeof process !== 'undefined' && process.env.API_BASE) ||
  '/api';

const DISABLE_ANALYTICS =
  typeof window !== 'undefined' && window.DISABLE_ANALYTICS === true;

let apiWritable = null;
let lastSendBlockReason = null;

function shouldSend() {
  if (DISABLE_ANALYTICS) {
    lastSendBlockReason = 'disabled';
    return false;
  }
  if (typeof navigator === 'undefined' || !navigator.onLine) {
    lastSendBlockReason = 'offline';
    return false;
  }
  lastSendBlockReason = null;
  return true;
}

async function canPost() {
  if (apiWritable !== null) return apiWritable;
  try {
    const headers = withSupabaseHeaders(API_BASE);
    const options = Object.keys(headers).length
      ? { method: 'OPTIONS', headers }
      : { method: 'OPTIONS' };
    const res = await fetch(`${API_BASE}/events`, options);
    if (res.ok) {
      apiWritable = true;
    } else if (res.status === 404) {
      // Some backends may not expose OPTIONS but still accept POST
      apiWritable = true;
    } else {
      apiWritable = false;
    }
  } catch {
    apiWritable = false;
  }
  return apiWritable;
}

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
  if (!shouldSend()) return;
  buffer.push({
    event: eventName,
    payload,
    ts: new Date().toISOString(),
  });
}

export async function sync() {
  if (!shouldSend()) return;
  if (!(await canPost())) return;
  const events = loadEvents();
  if (!events.length) return;
  try {
    const res = await fetch(`${API_BASE}/events`, {
      method: 'POST',
      headers: withSupabaseHeaders(API_BASE, {
        'Content-Type': 'application/json',
      }),
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
  if (!shouldSend()) {
    if (lastSendBlockReason === 'disabled') {
      buffer = [];
      return Promise.resolve();
    }
    const stored = loadEvents();
    if (buffer.length) {
      saveEvents(stored.concat(buffer));
      buffer = [];
    }
    return Promise.resolve();
  }
  const stored = loadEvents();
  if (buffer.length) {
    saveEvents(stored.concat(buffer));
    buffer = [];
  }
  return sync();
}

export function initAnalytics() {
  if (DISABLE_ANALYTICS) return;
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
