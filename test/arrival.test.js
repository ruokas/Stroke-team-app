import { test } from 'node:test';
import assert from 'node:assert/strict';
import { computeArrivalMessage } from '../js/arrival.js';

test('unknown last known well', () => {
  const msg = computeArrivalMessage({ lkwType: 'unknown' });
  assert.equal(msg, 'Pacientui reperfuzinis gydymas neindikuotinas.');
});

test('within 4.5 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T10:00',
  });
  assert.equal(msg, 'Indikuotina trombolizė / trombektomija.');
});

test('exactly 4.5 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T11:30',
  });
  assert.equal(msg, 'Indikuotina trombolizė / trombektomija.');
});

test('between 4.5 and 9 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T06:00',
    doorValue: '2024-01-01T12:00',
  });
  assert.equal(msg, 'Reikalinga KT perfuzija.');
});

test('exactly 9 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T07:00',
    doorValue: '2024-01-01T16:00',
  });
  assert.equal(
    msg,
    'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
  );
});

test('over 9 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T00:00',
    doorValue: '2024-01-01T10:00',
  });
  assert.equal(
    msg,
    'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
  );
});

test('over 24 hours', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T00:00',
    doorValue: '2024-01-02T01:00',
  });
  assert.equal(msg, 'Reperfuzinis gydymas neindikuotinas.');
});

test('negative diff returns empty message', () => {
  const msg = computeArrivalMessage({
    lkwType: 'known',
    lkwValue: '2024-01-01T10:00',
    doorValue: '2024-01-01T09:00',
  });
  assert.equal(msg, '');
});

test('sleep midpoint without door time uses current time', () => {
  const eightHoursAgo = new Date(Date.now() - 8 * 36e5).toISOString();
  const msg = computeArrivalMessage({
    lkwType: 'sleep',
    lkwValue: eightHoursAgo,
    doorValue: '',
  });
  assert.equal(msg, 'Reikalinga KT perfuzija.');
});

test('sleep midpoint older than 9h requires different message', () => {
  const tenHoursAgo = new Date(Date.now() - 10 * 36e5).toISOString();
  const msg = computeArrivalMessage({
    lkwType: 'sleep',
    lkwValue: tenHoursAgo,
    doorValue: '',
  });
  assert.equal(
    msg,
    'Trombolizė kontraindikuotina, bet gali būti taikoma trombektomija.',
  );
});
