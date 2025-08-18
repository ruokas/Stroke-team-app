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
vm.runInContext('this.inputs = inputs; this.genSummary = genSummary;', sandbox);

// populate typical inputs
sandbox.inputs.name.value = 'Jonas';
sandbox.inputs.id.value = '123';
sandbox.inputs.dob.value = '1980-01-01';
sandbox.inputs.sex.value = 'M';
sandbox.inputs.weight.value = '80';
sandbox.inputs.bp.value = '120/80';
sandbox.inputs.nih0.value = '10';
sandbox.inputs.nih24.value = '5';

sandbox.inputs.lkw.value = '2024-01-01T07:00';
sandbox.inputs.onset.value = '2024-01-01T07:30';
sandbox.inputs.door.value = '2024-01-01T08:00';
sandbox.inputs.ct.value = '2024-01-01T08:20';
sandbox.inputs.needle.value = '2024-01-01T08:50';
sandbox.inputs.groin.value = '2024-01-01T09:30';
sandbox.inputs.reperf.value = '2024-01-01T10:00';

sandbox.inputs.drugType.value = 'tnk';
sandbox.inputs.drugConc.value = '5';
sandbox.inputs.doseTotal.value = '20';
sandbox.inputs.doseVol.value = '4';

sandbox.inputs.i_ct.checked = true;
sandbox.inputs.i_tl.checked = true;
sandbox.inputs.i_tici.value = '2b';

sandbox.inputs.i_decision.value = 'Gydymas tęsti';
sandbox.inputs.notes.value = 'No issues';

sandbox.genSummary();

const summary = sandbox.inputs.summary.value;
assert(summary.includes('PACIENTAS: Jonas, ID: 123, gim. data: 1980-01-01, lytis: M, svoris: 80 kg, AKS atvykus: 120/80. NIHSS pradinis: 10, po 24 h: 5.'));
assert(summary.includes('RODIKLIAI: D2CT 20 min, D2N 50 min, D2G 1 h 30 min, O2N 1 h 20 min.'));
assert(summary.includes('TYRIMAI/INTERVENCIJOS: KT galvos, IV trombolizė, TICI: 2b.'));
assert(summary.includes('VAISTAI: Tenekteplazė. Koncentracija: 5 mg/ml. Bendra dozė: 20 mg (4 ml).'));

console.log('genSummary generates summary text correctly');
