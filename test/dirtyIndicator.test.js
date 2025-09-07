import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

// Test that dirty indicator appears and disappears after save

test(
  'dirty flag indicator toggles with autosave',
  { concurrency: false },
  async () => {
    const { setupAutosave } = await import('../js/autosave.js');
    const { getInputs } = await import('../js/state.js');
    const { getActivePatientId } = await import('../js/patients.js');

    const inputs = getInputs();
    let saveCb;
    setupAutosave(inputs, {
      scheduleSave(id, name, cb) {
        saveCb = cb;
      },
      flushSave() {},
    });

    const id = getActivePatientId();
    const select = document.getElementById('patientSelect');
    const field = document.getElementById('a_name');
    field.value = 'Test';
    field.dispatchEvent(new Event('input', { bubbles: true }));

    let opt = Array.from(select.options).find((o) => o.value === id);
    assert.ok(opt.textContent.endsWith(' •'));

    saveCb?.();
    opt = Array.from(select.options).find((o) => o.value === id);
    assert.ok(!opt.textContent.endsWith(' •'));
  },
);
