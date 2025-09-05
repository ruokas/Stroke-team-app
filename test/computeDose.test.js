import { test } from 'node:test';
import assert from 'node:assert/strict';

import { computeDose } from '../js/computeDose.js';

test('computeDose returns null on invalid inputs', () => {
  assert.strictEqual(computeDose(0, 1, 'tnk'), null);
  assert.strictEqual(computeDose(70, 0, 'tnk'), null);
  assert.strictEqual(computeDose(70, 1, 'foo'), null);
});

test('computeDose calculates TNK dose and caps at 25 mg', () => {
  const normal = computeDose(70, 5, 'tnk');
  assert.deepStrictEqual(normal, {
    doseTotal: 18,
    doseVol: 4,
    bolus: null,
    infusion: null,
  });
  const capped = computeDose(200, 5, 'tnk');
  assert.strictEqual(capped.doseTotal, 25);
  assert.strictEqual(capped.doseVol, 5);
});

test('computeDose calculates tPA dose and caps at 90 mg', () => {
  const normal = computeDose(70, 1, 'tpa');
  assert.deepStrictEqual(normal, {
    doseTotal: 63,
    doseVol: 63,
    bolus: { mg: 6, ml: 6 },
    infusion: { mg: 57, ml: 57, rateMlH: 57 },
  });
  const capped = computeDose(120, 1, 'tpa');
  assert.strictEqual(capped.doseTotal, 90);
  assert.deepStrictEqual(capped.bolus, { mg: 9, ml: 9 });
  assert.deepStrictEqual(capped.infusion, { mg: 81, ml: 81, rateMlH: 81 });
});
