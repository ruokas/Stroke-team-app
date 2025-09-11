import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('updateDrugDefaults toggles tPA breakdown visibility', async () => {
  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { updateDrugDefaults } = await import('../js/drugs.js');
  const tpaBreakdown = document.getElementById('tpaBreakdown');

  inputs.drugType.value = 'tnk';
  updateDrugDefaults();
  assert.strictEqual(tpaBreakdown.style.display, 'none');

  inputs.drugType.value = 'tpa';
  updateDrugDefaults();
  assert.strictEqual(tpaBreakdown.style.display, 'grid');
});
