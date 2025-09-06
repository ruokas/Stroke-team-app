import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { createBpEntry } from '../js/bpEntry.js';

test('dose input accepts text and validates numeric part', () => {
  const entry = createBpEntry('Med', '5 mg');
  const doseInput = entry.querySelector('.dose-input');

  assert.ok(doseInput);
  assert.equal(doseInput.type, 'text');
  assert.equal(doseInput.placeholder, 'mg');
  assert.equal(doseInput.value, '5');

  doseInput.value = '5.5';
  doseInput.dispatchEvent(new Event('input'));
  assert(!doseInput.classList.contains('invalid'));

  doseInput.value = 'abc';
  doseInput.dispatchEvent(new Event('input'));
  assert(doseInput.classList.contains('invalid'));
});
