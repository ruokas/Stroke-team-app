import { test } from 'node:test';
import assert from 'node:assert/strict';

test('genSummary generates summary text correctly', async () => {
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
  const { genSummary } = await import('../js/summary.js');

  // populate typical inputs
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '10';

  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  const decisionOpt = {
    checked: true,
    value: 'Taikoma IVT, indikacijų MTE nenustatyta',
  };
  document.querySelectorAll = (sel) =>
    sel === 'input[name="d_decision"]' ? [decisionOpt] : [];

  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  genSummary();

  const summary = inputs.summary.value;
  assert(
    summary.includes(
      'PACIENTAS: gim. data: 1980-01-01, svoris: 80 kg, AKS atvykus: 120/80. NIHSS pradinis: 10.',
    ),
  );
  assert(
    summary.includes(
      'VAISTAI: Tenekteplazė. Koncentracija: 5 mg/ml. Bendra dozė: 20 mg (4 ml).',
    ),
  );
  assert(
    summary.includes(
      'SPRENDIMAS: Taikoma IVT, indikacijų MTE nenustatyta.',
    ),
  );
});
