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

test('startThrombolysis button disables on CT bleed', () => {
  const inputs = getInputs();
  setupDrugControls(inputs);

  inputs.weight.value = '70';
  inputs.weight.dispatchEvent(new Event('input', { bubbles: true }));
  inputs.drugType.value = 'tpa';
  inputs.drugType.dispatchEvent(new Event('change', { bubbles: true }));

  const startBtn = document.getElementById('startThrombolysis');

  const ctClear = inputs.ct_result.find((o) => o.value === 'clear');
  ctClear.checked = true;
  ctClear.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, false);
  assert.equal(startBtn.hasAttribute('disabled'), false);

  const ctBleed = inputs.ct_result.find((o) => o.value === 'bleed');
  ctBleed.checked = true;
  ctBleed.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, true);
  assert.equal(startBtn.hasAttribute('disabled'), true);
});

test('startThrombolysis button disables when patient not independent', () => {
  const inputs = getInputs();
  setupDrugControls(inputs);

  inputs.weight.value = '75';
  inputs.weight.dispatchEvent(new Event('input', { bubbles: true }));
  inputs.drugType.value = 'tnk';
  inputs.drugType.dispatchEvent(new Event('change', { bubbles: true }));

  const startBtn = document.getElementById('startThrombolysis');

  const independentYes = inputs.p_independent.find((o) => o.value === 'yes');
  independentYes.checked = true;
  independentYes.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, false);
  assert.equal(startBtn.hasAttribute('disabled'), false);

  const independentNo = inputs.p_independent.find((o) => o.value === 'no');
  independentNo.checked = true;
  independentNo.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, true);
  assert.equal(startBtn.hasAttribute('disabled'), true);

  independentYes.checked = true;
  independentYes.dispatchEvent(new Event('change', { bubbles: true }));
  assert.equal(startBtn.disabled, false);
  assert.equal(startBtn.hasAttribute('disabled'), false);
});
