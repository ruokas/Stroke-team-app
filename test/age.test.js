import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('calcAge and updateAge compute and display age correctly', async () => {
  const RealDate = global.Date;
  const mockNow = new RealDate('2024-01-01T00:00:00Z');
  global.Date = class extends RealDate {
    constructor(value) {
      return value ? new RealDate(value) : mockNow;
    }
    static now() {
      return mockNow.getTime();
    }
  };

  const { getInputs } = await import('../src/state.js');
  const inputs = getInputs();
  const { calcAge, updateAge } = await import('../src/age.js');

  inputs.a_dob.value = '2000-01-01';
  assert.strictEqual(calcAge('2000-01-01'), '24');
  updateAge();
  assert.strictEqual(inputs.a_age.value, '24');
  assert.strictEqual(
    document.getElementById('a_age_display').textContent,
    '24 m.',
  );

  inputs.a_dob.value = '';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(document.getElementById('a_age_display').textContent, '');

  assert.strictEqual(calcAge('not-a-date'), '');
  inputs.a_dob.value = 'not-a-date';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(document.getElementById('a_age_display').textContent, '');

  assert.strictEqual(calcAge('2025-01-01'), '');
  inputs.a_dob.value = '2025-01-01';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(document.getElementById('a_age_display').textContent, '');

  global.Date = RealDate;
});
