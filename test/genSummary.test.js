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
  const { genSummary } = await import('../js/summary.js');

  // populate typical inputs
  inputs.id.value = '123';
  inputs.dob.value = '1980-01-01';
  inputs.sex.value = 'Vyras';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '10';
  inputs.nih24.value = '5';

  inputs.lkw.value = '2024-01-01T07:00';
  inputs.onset.value = '2024-01-01T07:30';
  inputs.door.value = '2024-01-01T08:00';
  inputs.ct.value = '2024-01-01T08:20';
  inputs.needle.value = '2024-01-01T08:50';
  inputs.groin.value = '2024-01-01T09:30';
  inputs.reperf.value = '2024-01-01T10:00';

  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  inputs.i_ct.checked = true;
  inputs.i_tl.checked = true;
  inputs.i_tici.value = '2b';

  inputs.i_decision.value = 'Gydymas tęsti';
  inputs.notes.value = 'No issues';

  genSummary();

  const summary = inputs.summary.value;
  assert(
    summary.includes(
      'PACIENTAS: Ligos istorijos Nr. 123, gim. data: 1980-01-01, lytis: Vyras, svoris: 80 kg, AKS atvykus: 120/80. NIHSS pradinis: 10, po 24 h: 5.'
    )
  );
  assert(
    summary.includes(
      'RODIKLIAI: D2CT 20 min, D2N 50 min, D2G 1 h 30 min, O2N 1 h 20 min.'
    )
  );
  assert(
    summary.includes(
      'TYRIMAI/INTERVENCIJOS: KT galvos, IV trombolizė, TICI: 2b.'
    )
  );
  assert(
    summary.includes(
      'VAISTAI: Tenekteplazė. Koncentracija: 5 mg/ml. Bendra dozė: 20 mg (4 ml).'
    )
  );
});

