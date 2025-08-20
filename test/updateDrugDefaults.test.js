import { test } from 'node:test';
import assert from 'node:assert/strict';

test('updateDrugDefaults sets default concentrations correctly', async () => {
  const elements = {};
  function createEl() {
    return { value: '', style: {}, addEventListener: () => {} };
  }
  function getEl(key) {
    if (!elements[key]) elements[key] = createEl();
    return elements[key];
  }

  const documentStub = {
    querySelector: (sel) => getEl(sel),
    querySelectorAll: () => [],
    getElementById: (id) => getEl('#' + id),
    addEventListener: () => {},
    createElement: () => createEl(),
  };

  global.document = documentStub;
  const { toast } = await import('../js/toast.js');
  toast.showToast = () => {};
  global.confirm = () => true;
  global.localStorage = { setItem: () => {}, getItem: () => null };
  global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
  global.Blob = function () {};
  global.FileReader = function () {
    this.readAsText = () => {};
  };
  global.setInterval = () => {};

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

