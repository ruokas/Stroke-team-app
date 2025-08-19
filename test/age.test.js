import { test } from 'node:test';
import assert from 'node:assert/strict';

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

  const elements = {};
  function createEl() {
    return {
      value: '',
      textContent: '',
      classList: { add: () => {}, remove: () => {}, contains: () => false },
      addEventListener: () => {},
      style: {},
    };
  }
  function getEl(sel) {
    if (!elements[sel]) elements[sel] = createEl();
    return elements[sel];
  }

  global.document = {
    querySelector: (sel) => getEl(sel),
    querySelectorAll: () => [],
    getElementById: (id) => getEl('#' + id),
    addEventListener: () => {},
  };

  const { inputs } = await import('../js/state.js');
  const { calcAge, updateAge } = await import('../js/age.js');

  // valid date of birth
  inputs.a_dob.value = '2000-01-01';
  assert.strictEqual(calcAge('2000-01-01'), '24');
  updateAge();
  assert.strictEqual(inputs.a_age.value, '24');
  assert.strictEqual(elements['#a_age_display'].textContent, '24 m.');

  // empty date of birth
  inputs.a_dob.value = '';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(elements['#a_age_display'].textContent, '');

  // invalid date of birth
  assert.strictEqual(calcAge('not-a-date'), '');
  inputs.a_dob.value = 'not-a-date';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(elements['#a_age_display'].textContent, '');

  // future date of birth
  assert.strictEqual(calcAge('2025-01-01'), '');
  inputs.a_dob.value = '2025-01-01';
  updateAge();
  assert.strictEqual(inputs.a_age.value, '');
  assert.strictEqual(elements['#a_age_display'].textContent, '');

  global.Date = RealDate;
});
