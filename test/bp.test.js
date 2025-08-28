import { test } from 'node:test';
import assert from 'node:assert/strict';
import { validateBp } from '../js/bp.js';

test('validateBp accepts correct range', () => {
  assert.equal(validateBp(120, 80), true);
  assert.equal(validateBp(200, 100), true);
});

test('validateBp rejects out of range or NaN', () => {
  assert.equal(validateBp(120, NaN), false);
  assert.equal(validateBp(400, 50), false);
});
