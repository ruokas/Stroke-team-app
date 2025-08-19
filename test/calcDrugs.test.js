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

// TNK calculation
sandbox.inputs.drugConc.classList.remove('invalid');
sandbox.inputs.calcWeight.value = '70';
sandbox.inputs.drugConc.value = '5';
sandbox.inputs.drugType.value = 'tnk';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 17.5);
assert.strictEqual(sandbox.inputs.doseVol.value, 3.5);
assert.strictEqual(sandbox.inputs.tpaBolus.value, '');
assert.strictEqual(sandbox.inputs.tpaInf.value, '');

// TNK maximum cap
sandbox.inputs.calcWeight.value = '200';
sandbox.inputs.drugConc.value = '5';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 25);
assert.strictEqual(sandbox.inputs.doseVol.value, 5);

// tPA calculation
sandbox.inputs.drugType.value = 'tpa';
sandbox.inputs.calcWeight.value = '70';
sandbox.inputs.drugConc.value = '1';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 63);
assert.strictEqual(sandbox.inputs.doseVol.value, 63);
assert.strictEqual(sandbox.inputs.tpaBolus.value, '6.3 mg (6.3 ml)');
assert.strictEqual(sandbox.inputs.tpaInf.value, '56.7 mg (56.7 ml) · ~56.7 ml/val');

// tPA maximum cap
sandbox.inputs.calcWeight.value = '120';
sandbox.inputs.drugConc.value = '1';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 90);
assert.strictEqual(sandbox.inputs.doseVol.value, 90);
assert.strictEqual(sandbox.inputs.tpaBolus.value, '9 mg (9 ml)');
assert.strictEqual(sandbox.inputs.tpaInf.value, '81 mg (81 ml) · ~81 ml/val');

// reset outputs when inputs become invalid after a valid calculation
sandbox.inputs.calcWeight.value = '70';
sandbox.inputs.drugConc.value = '1';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 63);
assert.notStrictEqual(sandbox.inputs.doseTotal.value, '', 'doseTotal should be populated after valid calc');

// invalidate weight
sandbox.inputs.calcWeight.value = '0';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, '', 'doseTotal should clear when weight invalid');
assert.strictEqual(sandbox.inputs.doseVol.value, '', 'doseVol should clear when weight invalid');
assert.strictEqual(sandbox.inputs.tpaBolus.value, '', 'tpaBolus should clear when weight invalid');
assert.strictEqual(sandbox.inputs.tpaInf.value, '', 'tpaInf should clear when weight invalid');

// restore valid inputs
sandbox.inputs.calcWeight.value = '70';
sandbox.inputs.drugConc.value = '1';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, 63);

// invalidate concentration
sandbox.inputs.drugConc.value = '0';

sandbox.calcDrugs();
assert.strictEqual(sandbox.inputs.doseTotal.value, '', 'doseTotal should clear when concentration invalid');
assert.strictEqual(sandbox.inputs.doseVol.value, '', 'doseVol should clear when concentration invalid');
assert.strictEqual(sandbox.inputs.tpaBolus.value, '', 'tpaBolus should clear when concentration invalid');
assert.strictEqual(sandbox.inputs.tpaInf.value, '', 'tpaInf should clear when concentration invalid');

console.log('calcDrugs handles dosing correctly, validates inputs, and resets outputs');
