import { test } from 'node:test';
import assert from 'node:assert/strict';

test('summaryTemplate generates summary text correctly', async () => {
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
        ? [
            { value: '10:00' },
            { value: '25 mg' },
            { value: 'požymai' },
          ]
        : [],
  };
  const documentStub = {
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
  const { getPayload } = await import('../js/storage.js');
  const { collectSummaryData, summaryTemplate } = await import('../js/summary.js');

  inputs.a_personal.value = '12345678901';
  inputs.a_name.value = 'Jonas Jonaitis';
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '0';

  inputs.a_warfarin.checked = true;
  inputs.a_glucose.value = '5';
  inputs.a_aks.value = '140/90';
  inputs.a_hr.value = '80';
  inputs.a_spo2.value = '98';
  inputs.a_temp.value = '37';
  inputs.arrival_symptoms.value = 'Dešinės rankos silpnumas';

  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';

  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  const data = collectSummaryData(getPayload());
  const summary = summaryTemplate(data);

  assert(
    summary.includes(
      'PACIENTAS: Jonas Jonaitis (12345678901), gim. data: 1980-01-01, svoris: 80 kg, AKS atvykus: 120/80.',
    ),
  );
  assert(
    summary.includes(
      'VAISTAI: Tenekteplazė. Koncentracija: 5 mg/ml. Bendra dozė: 20 mg (4 ml).',
    ),
  );
  assert(
    summary.includes(
      'AKS korekcija: Kaptoprilis 10:00 25 mg (požymai).',
    ),
  );
  assert(
    summary.includes(
      'Aktyvacijos kriterijai: <4.5, Varfarinas, Gliukozė: 5, AKS: 140/90, ŠSD: 80, SpO₂: 98, Temp: 37.',
    ),
  );
  assert(
    summary.includes(
      'Simptomai: Veido paralyžius, Kalbos sutrikimas; Dešinės rankos silpnumas.',
    ),
  );
  assert(summary.includes('NIHSS pradinis: 0.'));
  assert(
    summary.includes(
      'SPRENDIMAS: Taikoma IVT, indikacijų MTE nenustatyta.',
    ),
  );
});
