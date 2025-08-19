import assert from 'assert';

const elements = {};
function createEl() { return { value: '', style: {}, addEventListener: () => {} }; }
function getEl(key) { if (!elements[key]) elements[key] = createEl(); return elements[key]; }

const documentStub = {
  querySelector: (sel) => getEl(sel),
  querySelectorAll: () => [],
  getElementById: (id) => getEl('#' + id),
  addEventListener: () => {},
  createElement: () => createEl(),
};

global.document = documentStub;
global.alert = () => {};
global.confirm = () => true;
global.localStorage = { setItem: () => {}, getItem: () => null };
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.Blob = function () {};
global.FileReader = function () { this.readAsText = () => {}; };
global.setInterval = () => {};

const { inputs } = await import('../js/state.js');
const { updateDrugDefaults } = await import('../js/drugs.js');

// When inputs for defaults are empty, updateDrugDefaults should
// populate drug concentration with hard-coded defaults (5 for TNK, 1 for tPA).
inputs.def_tnk.value = '';
inputs.def_tpa.value = '';

inputs.drugType.value = 'tnk';
updateDrugDefaults();
assert.strictEqual(inputs.drugConc.value, '5');

inputs.drugType.value = 'tpa';
updateDrugDefaults();
assert.strictEqual(inputs.drugConc.value, '1');

console.log('updateDrugDefaults sets default concentrations correctly');
