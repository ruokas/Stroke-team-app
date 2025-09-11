import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('calcDrugs handles dosing correctly, validates inputs, and resets outputs', async () => {
  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { calcDrugs } = await import('../js/drugs.js');

  inputs.weight.value = '0';
  inputs.drugType.value = 'tnk';
  calcDrugs();
  assert(inputs.weight.classList.contains('invalid'));
  assert.strictEqual(inputs.doseTotal.value, '');

  inputs.weight.value = '70';
  inputs.weight.classList.remove('invalid');
  inputs.doseTotal.value = '';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '18');
  assert.strictEqual(inputs.doseVol.value, '4');
  assert.strictEqual(inputs.tpaBolus.value, '');
  assert.strictEqual(inputs.tpaInf.value, '');

  inputs.weight.value = '200';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '25');
  assert.strictEqual(inputs.doseVol.value, '5');

  inputs.drugType.value = 'tpa';
  inputs.weight.value = '70';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '63');
  assert.strictEqual(inputs.doseVol.value, '63');
  assert.strictEqual(inputs.tpaBolus.value, '6 mg (6 ml)');
  assert.strictEqual(inputs.tpaInf.value, '57 mg (57 ml) · ~57 ml/val');

  inputs.weight.value = '120';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '90');
  assert.strictEqual(inputs.doseVol.value, '90');
  assert.strictEqual(inputs.tpaBolus.value, '9 mg (9 ml)');
  assert.strictEqual(inputs.tpaInf.value, '81 mg (81 ml) · ~81 ml/val');

  inputs.weight.value = '70';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '63');
  inputs.weight.value = '0';
  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '');
  assert.strictEqual(inputs.doseVol.value, '');
  assert.strictEqual(inputs.tpaBolus.value, '');
  assert.strictEqual(inputs.tpaInf.value, '');
});
