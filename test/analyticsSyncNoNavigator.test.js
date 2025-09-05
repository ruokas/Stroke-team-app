import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test(
  'sync aborts gracefully when navigator is undefined',
  { concurrency: false },
  async () => {
    delete global.navigator;
    localStorage.setItem(
      'analytics_events',
      JSON.stringify([{ event: 'load' }]),
    );
    let fetchCalled = false;
    const origFetch = global.fetch;
    global.fetch = async () => {
      fetchCalled = true;
      return { ok: true, status: 200, json: async () => ({}) };
    };

    const { sync } = await import('../js/analytics.js?nonav');
    await sync();

    assert.equal(fetchCalled, false);
    global.fetch = origFetch;
  },
);
