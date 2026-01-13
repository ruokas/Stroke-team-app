import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  loadSettings,
  saveSettings,
  SETTINGS_KEY,
} from '../js/domain/settings.js';

function createMemoryStorage() {
  const store = new Map();
  return {
    getItem(key) {
      return store.has(key) ? store.get(key) : null;
    },
    setItem(key, value) {
      store.set(key, value);
    },
  };
}

test('loadSettings migrates legacy settings and applies defaults', () => {
  const storage = createMemoryStorage();
  storage.setItem(
    SETTINGS_KEY,
    JSON.stringify({ def_tnk: 'x', extra: 'drop' }),
  );

  const result = loadSettings(storage, {
    withResult: true,
    allowedKeys: ['def_tnk', 'def_tpa', 'autosave'],
    defaults: { def_tpa: 'y', autosave: 'on' },
    validate: (data) => ({
      def_tnk: typeof data.def_tnk === 'string' ? data.def_tnk : '',
      def_tpa: typeof data.def_tpa === 'string' ? data.def_tpa : '',
      autosave: typeof data.autosave === 'string' ? data.autosave : 'on',
    }),
  });

  assert.equal(result.ok, true);
  assert.deepEqual(result.data, {
    def_tnk: 'x',
    def_tpa: 'y',
    autosave: 'on',
  });
});

test('saveSettings stores versioned settings payload', () => {
  const storage = createMemoryStorage();
  const result = saveSettings(storage, { def_tnk: 'a' });
  assert.equal(result.ok, true);

  const saved = JSON.parse(storage.getItem(SETTINGS_KEY));
  assert.equal(saved.version, 1);
  assert.deepEqual(saved.data, { def_tnk: 'a' });
});
