import { test } from 'node:test';
import assert from 'node:assert/strict';

const el = {
  type: 'time',
  value: '',
  dispatched: [],
  dispatchEvent(evt) {
    this.dispatched.push(evt.type);
  },
};

global.document = {
  getElementById: () => el,
};

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

  const { setNow } = await import('../js/time.js');

  setNow('time-input');

  assert.equal(el.value, '03:04');
  assert.deepEqual(el.dispatched, ['input', 'change']);

  global.Date = RealDate;
});

test('sleepMidpoint computes midpoint across midnight', async () => {
  const { sleepMidpoint } = await import('../js/time.js');
  const start = '2024-01-01T22:00';
  const end = '2024-01-02T06:00';
  assert.equal(sleepMidpoint(start, end), '2024-01-02T02:00');
});
