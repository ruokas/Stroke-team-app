import assert from 'assert';

const elements = {};
function createEl() {
  return {
    value: '',
    textContent: '',
    style: {},
    classList: {
      classes: new Set(),
      add(...cs) { cs.forEach((c) => this.classes.add(c)); },
      remove(...cs) { cs.forEach((c) => this.classes.delete(c)); },
      contains(c) { return this.classes.has(c); },
    },
    querySelector: () => ({ textContent: '' }),
    addEventListener: () => {},
    checked: false,
  };
}
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
const { updateKPIs } = await import('../js/time.js');

// set goal values
inputs.goal_ct.value = '20';
inputs.goal_n.value = '60';
inputs.goal_g.value = '90';

// set times
inputs.door.value = '2024-01-01T00:00';
inputs.ct.value = '2024-01-01T00:15'; // 15 min -> good
inputs.needle.value = '2024-01-01T01:10'; // 70 min -> warn
inputs.groin.value = '2024-01-01T02:00'; // 120 min -> bad

updateKPIs();

assert(getEl('#kpi_d2ct').classList.contains('good'), 'D2CT should be classified good');
assert(getEl('#kpi_d2n').classList.contains('warn'), 'D2N should be classified warn');
assert(getEl('#kpi_d2g').classList.contains('bad'), 'D2G should be classified bad');

console.log('updateKPIs classifies KPIs correctly');
