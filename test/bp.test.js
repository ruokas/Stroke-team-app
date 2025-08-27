import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBp } from '../js/bp.js';

test('validateBp accepts correct format and range', () => {
  assert.equal(validateBp('120/80'), true);
  assert.equal(validateBp(' 200 / 100 '), true);
});

test('validateBp rejects wrong format or out of range', () => {
  assert.equal(validateBp('120'), false);
  assert.equal(validateBp('abc/def'), false);
  assert.equal(validateBp('400/50'), false);
});
