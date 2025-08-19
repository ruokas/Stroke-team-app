import { test } from 'node:test';
import assert from 'node:assert/strict';

test('calcDrugs handles dosing correctly, validates inputs, and resets outputs', async () => {
  const elements = {};
  function createEl() {
    return {
      value: '',
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
      addEventListener: () => {},
      setCustomValidity: () => {},
      reportValidity: () => {},
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

  const { inputs } = await import('../js/state.js');
  const { calcDrugs } = await import('../js/drugs.js');

  // invalid weight
  inputs.weight.value = '0';
  inputs.drugConc.value = '5';
  inputs.drugType.value = 'tnk';

  calcDrugs();
  assert(inputs.weight.classList.contains('invalid'));
  assert.strictEqual(inputs.doseTotal.value, '');

  // invalid concentration
  inputs.weight.value = '70';
  inputs.weight.classList.remove('invalid');
  inputs.drugConc.value = '0';
  inputs.drugConc.classList.remove('invalid');
  inputs.doseTotal.value = '';

  calcDrugs();
  assert(inputs.drugConc.classList.contains('invalid'));
  assert.strictEqual(inputs.doseTotal.value, '');

  // TNK calculation
  inputs.drugConc.classList.remove('invalid');
  inputs.weight.value = '70';
  inputs.drugConc.value = '5';
  inputs.drugType.value = 'tnk';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 17.5);
  assert.strictEqual(inputs.doseVol.value, 3.5);
  assert.strictEqual(inputs.tpaBolus.value, '');
  assert.strictEqual(inputs.tpaInf.value, '');

  // TNK maximum cap
  inputs.weight.value = '200';
  inputs.drugConc.value = '5';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 25);
  assert.strictEqual(inputs.doseVol.value, 5);

  // tPA calculation
  inputs.drugType.value = 'tpa';
  inputs.weight.value = '70';
  inputs.drugConc.value = '1';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 63);
  assert.strictEqual(inputs.doseVol.value, 63);
  assert.strictEqual(inputs.tpaBolus.value, '6.3 mg (6.3 ml)');
  assert.strictEqual(
    inputs.tpaInf.value,
    '56.7 mg (56.7 ml) · ~56.7 ml/val',
  );

  // tPA maximum cap
  inputs.weight.value = '120';
  inputs.drugConc.value = '1';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 90);
  assert.strictEqual(inputs.doseVol.value, 90);
  assert.strictEqual(inputs.tpaBolus.value, '9 mg (9 ml)');
  assert.strictEqual(
    inputs.tpaInf.value,
    '81 mg (81 ml) · ~81 ml/val',
  );

  // reset outputs when inputs become invalid after valid calc
  inputs.weight.value = '70';
  inputs.drugConc.value = '1';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 63);
  assert.notStrictEqual(inputs.doseTotal.value, '');

  // invalidate weight
  inputs.weight.value = '0';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '');
  assert.strictEqual(inputs.doseVol.value, '');
  assert.strictEqual(inputs.tpaBolus.value, '');
  assert.strictEqual(inputs.tpaInf.value, '');

  // restore valid inputs
  inputs.weight.value = '70';
  inputs.drugConc.value = '1';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, 63);

  // invalidate concentration
  inputs.drugConc.value = '0';

  calcDrugs();
  assert.strictEqual(inputs.doseTotal.value, '');
  assert.strictEqual(inputs.doseVol.value, '');
  assert.strictEqual(inputs.tpaBolus.value, '');
  assert.strictEqual(inputs.tpaInf.value, '');
});

