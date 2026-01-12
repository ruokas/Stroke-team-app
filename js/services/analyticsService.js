import { getApiBase } from './apiBase.js';
import { withSupabaseHeaders } from './supabase.js';

const LS_KEY = 'analytics_events';
let buffer = [];

const DISABLE_ANALYTICS =
  typeof window !== 'undefined' && window.DISABLE_ANALYTICS === true;

let apiWritable = null;
let lastSendBlockReason = null;
let storageErrorHandler = null;

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
  const apiBase = getApiBase();
  try {
    const headers = withSupabaseHeaders(apiBase);
    const options = Object.keys(headers).length
      ? { method: 'OPTIONS', headers }
      : { method: 'OPTIONS' };
    const res = await fetch(`${apiBase}/events`, options);
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
  if (typeof localStorage === 'undefined') return [];
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
  if (typeof localStorage === 'undefined') return;
  try {
    if (events.length) localStorage.setItem(LS_KEY, JSON.stringify(events));
    else localStorage.removeItem(LS_KEY);
  } catch (error) {
    if (storageErrorHandler) storageErrorHandler(error);
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

export function setAnalyticsStorageErrorHandler(handler) {
  storageErrorHandler = typeof handler === 'function' ? handler : null;
}

export async function sync() {
  if (!shouldSend()) return;
  apiWritable = null;
  if (!(await canPost())) return;
  if (typeof localStorage === 'undefined') return;
  const apiBase = getApiBase();
  const events = loadEvents();
  if (!events.length) return;
  try {
    const res = await fetch(`${apiBase}/events`, {
      method: 'POST',
      headers: withSupabaseHeaders(apiBase, {
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(events),
    });
    if (res.ok) localStorage.removeItem(LS_KEY);
  } catch {
    // Network errors are handled by keeping the buffer stored locally.
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
