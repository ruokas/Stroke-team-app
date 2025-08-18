const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const elements = {};
function createEl(){
  return {
    value: '',
    style: {},
    classList: {
      classes: new Set(),
      add(...cs){ cs.forEach(c => this.classes.add(c)); },
      remove(...cs){ cs.forEach(c => this.classes.delete(c)); },
      contains(c){ return this.classes.has(c); }
    },
    addEventListener: ()=>{},
    setCustomValidity: ()=>{},
    reportValidity: ()=>{}
  };
}
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
vm.runInContext('this.inputs = inputs; this.calcDrugs = calcDrugs;', sandbox);

// invalid weight
sandbox.inputs.calcWeight.value = '0';
sandbox.inputs.weight.value = '';
sandbox.inputs.drugConc.value = '5';
sandbox.inputs.drugType.value = 'tnk';

sandbox.calcDrugs();
assert(sandbox.inputs.calcWeight.classList.contains('invalid'), 'calcWeight should be marked invalid');
assert.strictEqual(sandbox.inputs.doseTotal.value, '', 'doseTotal should remain empty when weight invalid');

// invalid concentration
sandbox.inputs.calcWeight.value = '70';
sandbox.inputs.calcWeight.classList.remove('invalid');
sandbox.inputs.drugConc.value = '0';
sandbox.inputs.drugConc.classList.remove('invalid');
sandbox.inputs.doseTotal.value = '';

sandbox.calcDrugs();
assert(sandbox.inputs.drugConc.classList.contains('invalid'), 'drugConc should be marked invalid');
assert.strictEqual(sandbox.inputs.doseTotal.value, '', 'doseTotal should remain empty when concentration invalid');

console.log('calcDrugs handles invalid inputs');
