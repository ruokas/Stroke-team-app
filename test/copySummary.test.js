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
        contains() {
          return false;
        },
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
  const decisionOpt = {
    checked: true,
    value: 'Taikoma IVT, indikacijų MTE nenustatyta',
  };
  const aLkwOpt = { checked: true, value: '<4.5' };
  const bpEntry = {
    querySelector: (sel) =>
      sel === 'strong' ? { textContent: 'Kaptoprilis' } : null,
    querySelectorAll: (sel) =>
      sel === 'input'
        ? [{ value: '10:00' }, { value: '25 mg' }, { value: 'požymai' }]
        : [],
  };
  global.document = {
    querySelector: (sel) => getEl(sel),
    querySelectorAll: (sel) => {
      if (sel === 'input[name="a_lkw"]') return [aLkwOpt];
      if (sel === 'input[name="d_decision"]') return [decisionOpt];
      if (sel === '#bpEntries .bp-entry') return [bpEntry];
      if (sel === 'input[name="a_face"]') return [{ checked: true }];
      if (sel === 'input[name="a_speech"]') return [{ checked: true }];
      return [];
    },
    getElementById: (id) => getEl('#' + id),
    addEventListener: () => {},
    execCommand: () => true,
    createElement: () => createEl(),
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
  global.FileReader = function () {
    this.readAsText = () => {};
  };
  global.setInterval = () => {};

  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { getPayload } = await import('../js/storage.js');
  const { collectSummaryData, summaryTemplate, copySummary } = await import(
    '../js/summary.js'
  );

  inputs.a_personal.value = '12345678901';
  inputs.a_name.value = 'Jonas Jonaitis';
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '0';
  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  inputs.t_thrombolysis.value = '2024-01-01T09:00';
  inputs.a_warfarin.checked = true;
  inputs.a_glucose.value = '5';
  inputs.a_aks.value = '140/90';
  inputs.a_hr.value = '80';
  inputs.a_spo2.value = '98';
  inputs.a_temp.value = '37';
  inputs.arrival_symptoms.value = 'Dešinės rankos silpnumas';
  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  const data = collectSummaryData(getPayload());
  assert.deepEqual(data, {
    patient: {
      personal: '12345678901',
      name: 'Jonas Jonaitis',
      dob: '1980-01-01',
      age: null,
      weight: '80',
      bp: '120/80',
      inr: null,
      nih0: '0',
    },
    times: {
      lkw: '2024-01-01T07:00',
      door: '2024-01-01T08:00',
      decision: '2024-01-01T08:40',
      thrombolysis: '2024-01-01T09:00',
      gmp: null,
    },
    drugs: {
      type: 'tnk',
      conc: '5',
      totalDose: '20',
      totalVol: '4',
      bolus: null,
      infusion: null,
    },
    bpMeds: [
      { time: '10:00', med: 'Kaptoprilis', dose: '25 mg', notes: 'požymai' },
    ],
    activation: {
      lkw: '<4.5',
      drugs: ['Varfarinas'],
      params: {
        glucose: '5',
        aks: '140/90',
        hr: '80',
        spo2: '98',
        temp: '37',
      },
      symptoms: ['Veido paralyžius', 'Kalbos sutrikimas'],
    },
    arrivalSymptoms: 'Dešinės rankos silpnumas',
    arrivalContra: null,
    arrivalMtContra: null,
    decision: 'Taikoma IVT, indikacijų MTE nenustatyta',
  });

  const expected = summaryTemplate(data);
  const copied = copySummary(data);
  assert.equal(global.__copied, expected);
  assert.equal(inputs.summary.value, expected);
  assert.equal(copied, expected);
});
