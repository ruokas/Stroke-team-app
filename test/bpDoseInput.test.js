import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { createBpEntry } from '../js/bpEntry.js';

test('dose input is configured for numeric values', () => {
  const entry = createBpEntry('Med');
  const doseInput = entry.querySelector('.dose-input');

  assert.ok(doseInput);
  assert.equal(doseInput.type, 'number');
  assert.equal(doseInput.step, '0.1');
  assert.equal(doseInput.placeholder, 'mg');

  doseInput.value = '5.5';
  doseInput.dispatchEvent(new Event('input'));
  assert(!doseInput.classList.contains('invalid'));
});
