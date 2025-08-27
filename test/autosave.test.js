import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('autosave triggers on form input', { concurrency: false }, async () => {
  const { setupAutosave } = await import('../src/autosave.js');
  const { getInputs } = await import('../src/state.js');

  const inputs = getInputs();
  let called = false;
  setupAutosave(inputs, {
    scheduleSave(id, data, cb) {
      called = true;
      cb?.();
    },
    flushSave() {},
  });

  const field = document.getElementById('a_name');
  field.value = 'Test';
  field.dispatchEvent(new Event('input', { bubbles: true }));

  assert.ok(called);
});
