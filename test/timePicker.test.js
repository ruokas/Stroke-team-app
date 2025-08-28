import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { openTimePicker } from '../js/timePicker.js';

test('cancel button closes time picker dialog', () => {
  document.body.innerHTML =
    '<input id="t" type="datetime-local" value="2024-01-01T12:30">';
  const input = document.getElementById('t');

  window.HTMLDialogElement = window.HTMLElement;
  const origCreate = document.createElement.bind(document);
  document.createElement = (tag, opts) => {
    const el = origCreate(tag, opts);
    if (tag === 'dialog') {
      el.showModal = () => {};
      el.close = (val) => {
        el.returnValue = val;
        el.dispatchEvent(new window.Event('close'));
      };
    }
    return el;
  };

  openTimePicker(input);
  const dialog = document.querySelector('dialog.time-picker-dialog');
  assert.ok(dialog);

  const cancelBtn = dialog.querySelector('button[value="cancel"]');
  cancelBtn.click();

  assert.ok(!document.body.contains(dialog));
  assert.strictEqual(input.value, '2024-01-01T12:30');

  document.createElement = origCreate;
});
