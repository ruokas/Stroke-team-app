import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('updateDrugDefaults sets default concentrations correctly', async () => {
  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { updateDrugDefaults } = await import('../js/drugs.js');

  inputs.def_tnk.value = '';
  inputs.def_tpa.value = '';

  inputs.drugType.value = 'tnk';
  updateDrugDefaults();
  assert.strictEqual(inputs.drugConc.value, '5');

  inputs.drugType.value = 'tpa';
  updateDrugDefaults();
  assert.strictEqual(inputs.drugConc.value, '1');
});
