import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeArrivalMessage, timeSince } from '../js/arrival.js';

test('unknown last known well', () => {
  const res = computeArrivalMessage({ lkwType: 'unknown' });
  assert.deepEqual(res, {
    message: 'Pacientui reperfuzinis gydymas neindikuotinas.',
    type: 'error',
  });
});

test('within 4.5 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T10:00',
  });
  assert.deepEqual(res, {
    message: 'Indikuotina trombolizė / trombektomija.',
    type: 'success',
  });
});

test('exactly 4.5 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T11:30',
  });
  assert.deepEqual(res, {
    message: 'Indikuotina trombolizė / trombektomija.',
    type: 'success',
  });
});

test('between 4.5 and 9 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T06:00',
    doorValue: '2024-01-01T12:00',
  });
  assert.deepEqual(res, {
    message: 'Reikalinga KT perfuzija.',
    type: 'warning',
  });
});

test('exactly 9 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T16:00',
  });
  assert.deepEqual(res, {
    message:
      'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
    type: 'warning',
  });
});

test('over 9 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T00:00',
    doorValue: '2024-01-01T10:00',
  });
  assert.deepEqual(res, {
    message:
      'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
    type: 'warning',
  });
});

test('over 24 hours', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T00:00',
    doorValue: '2024-01-02T01:00',
  });
  assert.deepEqual(res, {
    message: 'Reperfuzinis gydymas neindikuotinas.',
    type: 'error',
  });
});

test('negative diff returns empty message', () => {
  const res = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T10:00',
    doorValue: '2024-01-01T09:00',
  });
  assert.deepEqual(res, { message: '', type: '' });
});

test('sleep midpoint without door time uses current time', () => {
  const eightHoursAgo = new Date(Date.now() - 8 * 36e5).toISOString();
  const res = computeArrivalMessage({
    lkwType: 'sleep',
    lkwValue: eightHoursAgo,
    doorValue: '',
  });
  assert.deepEqual(res, {
    message: 'Reikalinga KT perfuzija.',
    type: 'warning',
  });
});

test('sleep midpoint older than 9h requires different message', () => {
  const tenHoursAgo = new Date(Date.now() - 10 * 36e5).toISOString();
  const res = computeArrivalMessage({
    lkwType: 'sleep',
    lkwValue: tenHoursAgo,
    doorValue: '',
  });
  assert.deepEqual(res, {
    message:
      'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
    type: 'warning',
  });
});

test('timeSince formats difference', () => {
  const fakeNow = new Date('2024-01-01T10:00:00').getTime();
  const origNow = Date.now;
  Date.now = () => fakeNow;
  const res = timeSince('2024-01-01T07:05:04');
  Date.now = origNow;
  assert.equal(res, '02:54:56');
});
