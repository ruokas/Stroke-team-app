import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { setupLkw } from '../js/lkw.js';
import { setupDrugControls } from '../js/drugControls.js';
import { getInputs } from '../js/state.js';

test('startThrombolysis button disables on unknown LKW', () => {
  const inputs = getInputs();
  setupLkw(inputs);
  setupDrugControls(inputs);

  inputs.weight.value = '70';
  inputs.weight.dispatchEvent(new Event('input', { bubbles: true }));
  inputs.drugType.value = 'tpa';
  inputs.drugType.dispatchEvent(new Event('change', { bubbles: true }));

  const startBtn = document.getElementById('startThrombolysis');

  const lkwUnknown = inputs.lkw_type.find((o) => o.value === 'unknown');
  lkwUnknown.checked = true;
  lkwUnknown.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, true);
  assert.equal(startBtn.hasAttribute('disabled'), true);

  inputs.weight.value = '80';
  inputs.weight.dispatchEvent(new Event('input', { bubbles: true }));
  assert.equal(startBtn.disabled, true);
  assert.equal(startBtn.hasAttribute('disabled'), true);

  const lkwKnown = inputs.lkw_type.find((o) => o.value === 'known');
  lkwKnown.checked = true;
  lkwKnown.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, false);
  assert.equal(startBtn.hasAttribute('disabled'), false);
});
