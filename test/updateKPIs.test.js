import { test } from 'node:test';
import assert from 'node:assert/strict';

test('updateKPIs classifies KPIs correctly', async () => {
  const elements = {};
  function createEl() {
    return {
      value: '',
      textContent: '',
      style: {},
      classList: {
        classes: new Set(),
        add(...cs) {
          cs.forEach((c) => this.classes.add(c));
        },
        remove(...cs) {
          cs.forEach((c) => this.classes.delete(c));
        },
        contains(c) {
          return this.classes.has(c);
        },
      },
      querySelector: () => ({ textContent: '' }),
      addEventListener: () => {},
      checked: false,
    };
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
  global.alert = () => {};
  global.confirm = () => true;
  global.localStorage = { setItem: () => {}, getItem: () => null };
  global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
  global.Blob = function () {};
  global.FileReader = function () {
    this.readAsText = () => {};
  };
  global.setInterval = () => {};

  const { inputs } = await import('../js/state.js');
  const { updateKPIs } = await import('../js/time.js');

  inputs.goal_ct.value = '20';
  inputs.goal_n.value = '60';
  inputs.goal_g.value = '90';

  inputs.door.value = '2024-01-01T00:00';
  inputs.ct.value = '2024-01-01T00:15';
  inputs.needle.value = '2024-01-01T01:10';
  inputs.groin.value = '2024-01-01T02:00';

  updateKPIs();

  assert(getEl('#kpi_d2ct').classList.contains('good'));
  assert(getEl('#kpi_d2n').classList.contains('warn'));
  assert(getEl('#kpi_d2g').classList.contains('bad'));
});

