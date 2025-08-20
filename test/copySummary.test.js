import { test } from 'node:test';
import assert from 'node:assert/strict';

test('copySummary builds data object and copies formatted text', async () => {
  const elements = {};
  function createEl() {
    return {
      value: '',
      textContent: '',
      innerHTML: '',
      style: {},
      classList: {
        classes: new Set(),
        add() {},
        remove() {},
        contains() { return false; },
      },
      querySelector: () => ({ textContent: '' }),
      addEventListener: () => {},
      checked: false,
      select: () => {},
    };
  }
  function getEl(key) {
    if (!elements[key]) elements[key] = createEl();
    return elements[key];
  }

  global.document = {
    querySelector: (sel) => getEl(sel),
    querySelectorAll: () => [],
    getElementById: (id) => getEl('#' + id),
    addEventListener: () => {},
    execCommand: () => true,
  };
  global.window = { isSecureContext: true };
  Object.defineProperty(global, 'navigator', {
    value: {
      clipboard: {
        writeText: async (txt) => {
          global.__copied = txt;
        },
      },
    },
    configurable: true,
  });
  const { toast } = await import('../js/toast.js');
  toast.showToast = () => {};
  global.confirm = () => true;
  global.localStorage = { setItem: () => {}, getItem: () => null };
  global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
  global.Blob = function () {};
  global.FileReader = function () { this.readAsText = () => {}; };
  global.setInterval = () => {};

  const { inputs } = await import('../js/state.js');
  const { collectSummaryData, summaryTemplate, copySummary } = await import('../js/summary.js');

  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '10';
  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  inputs.d_decision = [
    { checked: true, value: 'Taikoma IVT, indikacijų MTE nenustatyta' },
  ];
  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  const data = collectSummaryData();
  assert.deepEqual(data, {
    patient: { dob: '1980-01-01', weight: '80', bp: '120/80', nih0: '10' },
    times: {
      lkw: '2024-01-01T07:00',
      door: '2024-01-01T08:00',
      decision: '2024-01-01T08:40',
    },
    drugs: {
      type: 'tnk',
      conc: '5',
      totalDose: '20',
      totalVol: '4',
      bolus: null,
      infusion: null,
    },
    decision: 'Taikoma IVT, indikacijų MTE nenustatyta',
  });

  const expected = summaryTemplate(data);
  await copySummary();
  assert.equal(global.__copied, expected);
  assert.equal(inputs.summary.value, expected);
});
