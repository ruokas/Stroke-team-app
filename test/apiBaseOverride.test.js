import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

// Ensure process.env.API_BASE is respected in sync.js

test(
  'process.env.API_BASE overrides default in sync.js',
  { concurrency: false },
  async () => {
    process.env.API_BASE = 'https://example.com/api';
    navigator.onLine = true;
    localStorage.setItem(
      'insultoKomandaPatients_v1',
      JSON.stringify({ a: { needsSync: true, name: 'Alice' } }),
    );
    const calls = [];
    const origFetch = global.fetch;
    global.fetch = async (url) => {
      calls.push(url);
      return { ok: true, status: 200, json: async () => ({}) };
    };

    const { syncPatients } = await import('../js/sync.js?env');
    window.disableSync = false;
    await syncPatients();

    assert.equal(calls[0], 'https://example.com/api/patients');
    global.fetch = origFetch;
    delete process.env.API_BASE;
  },
);

// Ensure window.API_BASE is respected in analytics.js

test(
  'window.API_BASE overrides default in analytics.js',
  { concurrency: false },
  async () => {
    window.API_BASE = 'https://example.com/api';
    navigator.onLine = true;
    localStorage.setItem(
      'analytics_events',
      JSON.stringify([{ event: 'load' }]),
    );
    const calls = [];
    const origFetch = global.fetch;
    global.fetch = async (url, opts = {}) => {
      calls.push({ url, method: opts.method });
      return { ok: true, status: 200, json: async () => ({}) };
    };

    const { sync } = await import('../js/analytics.js?win');
    await sync();

    assert.deepEqual(calls, [
      { url: 'https://example.com/api/events', method: 'OPTIONS' },
      { url: 'https://example.com/api/events', method: 'POST' },
    ]);
    global.fetch = origFetch;
  },
);
