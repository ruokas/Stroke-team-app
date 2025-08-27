import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('setNow sets local HH:MM and triggers change', async () => {
  const RealDate = Date;
  const fixed = new RealDate('2024-01-02T03:04:05');
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(fixed);
      return new RealDate(...args);
    }
    static now() {
      return fixed.getTime();
    }
  };

  const input = document.createElement('input');
  input.type = 'time';
  input.id = 'time-input';
  const dispatched = [];
  input.addEventListener('input', (e) => dispatched.push(e.type));
  input.addEventListener('change', (e) => dispatched.push(e.type));
  document.body.appendChild(input);

  const { setNow } = await import('../js/time.js');

  setNow('time-input');

  assert.equal(input.value, '03:04');
  assert.deepEqual(dispatched, ['input', 'change']);

  global.Date = RealDate;
});

test('sleepMidpoint computes midpoint across midnight', async () => {
  const { sleepMidpoint } = await import('../js/time.js');
  const start = '2024-01-01T22:00';
  const end = '2024-01-02T06:00';
  assert.equal(sleepMidpoint(start, end), '2024-01-02T02:00');
});

test('diffMinutes returns minutes between times', async () => {
  const { diffMinutes } = await import('../js/time.js');
  assert.equal(diffMinutes('2024-01-01T23:00', '2024-01-02T01:00'), 120);
});

test('parseValidDate returns null for invalid input', async () => {
  const { parseValidDate } = await import('../js/time.js');
  assert.equal(parseValidDate('not-a-date'), null);
});

test('sleepMidpoint returns empty string for invalid dates', async () => {
  const { sleepMidpoint } = await import('../js/time.js');
  assert.equal(sleepMidpoint('bad', 'dates'), '');
});

test('diffMinutes returns NaN for invalid dates', async () => {
  const { diffMinutes } = await import('../js/time.js');
  assert.ok(Number.isNaN(diffMinutes('bad', 'dates')));
});
