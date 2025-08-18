const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const elements = {};
function createEl(){ return { value: '', style: {}, addEventListener: ()=>{} }; }
function getEl(key){ if(!elements[key]) elements[key] = createEl(); return elements[key]; }

const documentStub = {
  querySelector: (sel) => getEl(sel),
  querySelectorAll: () => [],
  getElementById: (id) => getEl('#'+id),
  addEventListener: () => {},
  createElement: () => createEl()
};

const sandbox = {
  document: documentStub,
  alert: ()=>{},
  confirm: ()=>true,
  localStorage: { setItem: ()=>{}, getItem: ()=>null },
  URL: { createObjectURL: ()=>'', revokeObjectURL: ()=>{} },
  Blob: function(){},
  FileReader: function(){ this.readAsText = ()=>{}; },
  setInterval: ()=>{}
};

vm.createContext(sandbox);
const code = fs.readFileSync('js/app.js', 'utf8');
vm.runInContext(code, sandbox);
vm.runInContext('this.inputs = inputs; this.updateDrugDefaults = updateDrugDefaults;', sandbox);

// When inputs for defaults are empty, updateDrugDefaults should
// populate drug concentration with hard-coded defaults (5 for TNK, 1 for tPA).
sandbox.inputs.def_tnk.value = '';
sandbox.inputs.def_tpa.value = '';

sandbox.inputs.drugType.value = 'tnk';
sandbox.updateDrugDefaults();
assert.strictEqual(sandbox.inputs.drugConc.value, '5');

sandbox.inputs.drugType.value = 'tpa';
sandbox.updateDrugDefaults();
assert.strictEqual(sandbox.inputs.drugConc.value, '1');

console.log('updateDrugDefaults sets default concentrations correctly');

