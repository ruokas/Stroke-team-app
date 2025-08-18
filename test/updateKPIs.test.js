const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

const elements = {};
function createEl(){
  return {
    value: '',
    textContent: '',
    style: {},
    classList: {
      classes: new Set(),
      add(...cs){ cs.forEach(c => this.classes.add(c)); },
      remove(...cs){ cs.forEach(c => this.classes.delete(c)); },
      contains(c){ return this.classes.has(c); }
    },
    querySelector: () => ({ textContent: '' }),
    addEventListener: () => {},
    checked: false
  };
}
function getEl(key){ if(!elements[key]) elements[key] = createEl(); return elements[key]; }

const documentStub = {
  querySelector: (sel) => getEl(sel),
  querySelectorAll: () => [],
  getElementById: (id) => getEl('#'+id),
  addEventListener: () => {},
  createElement: () => createEl(),
};

const sandbox = {
  document: documentStub,
  alert: () => {},
  confirm: () => true,
  localStorage: { setItem: () => {}, getItem: () => null },
  URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function(){},
  FileReader: function(){ this.readAsText = () => {}; },
  setInterval: () => {},
};

vm.createContext(sandbox);
const code = fs.readFileSync('js/app.js', 'utf8');
vm.runInContext(code, sandbox);
vm.runInContext('this.inputs = inputs; this.updateKPIs = updateKPIs;', sandbox);

// set goal values
sandbox.inputs.goal_ct.value = '20';
sandbox.inputs.goal_n.value = '60';
sandbox.inputs.goal_g.value = '90';

// set times
sandbox.inputs.door.value = '2024-01-01T00:00';
sandbox.inputs.ct.value = '2024-01-01T00:15'; // 15 min -> good
sandbox.inputs.needle.value = '2024-01-01T01:10'; // 70 min -> warn
sandbox.inputs.groin.value = '2024-01-01T02:00'; // 120 min -> bad

sandbox.updateKPIs();

assert(getEl('#kpi_d2ct').classList.contains('good'), 'D2CT should be classified good');
assert(getEl('#kpi_d2n').classList.contains('warn'), 'D2N should be classified warn');
assert(getEl('#kpi_d2g').classList.contains('bad'), 'D2G should be classified bad');

console.log('updateKPIs classifies KPIs correctly');
