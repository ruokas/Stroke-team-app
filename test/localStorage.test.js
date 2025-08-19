import { test } from 'node:test';
import assert from 'node:assert/strict';

const elements = {};
function createEl() {
  return {
    value: '',
    textContent: '',
    innerHTML: '',
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
    appendChild(child) {
      (this.children || (this.children = [])).push(child);
    },
    select: () => {},
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
  execCommand: () => true,
};

const localStorageStub = {
  store: {},
  setItem(k, v) {
    this.store[k] = v;
  },
  getItem(k) {
    return this.store[k] || null;
  },
  removeItem(k) {
    delete this.store[k];
  },
};

global.document = documentStub;
global.alert = () => {};
global.confirm = () => true;
global.prompt = () => '';
global.localStorage = localStorageStub;
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.Blob = function () {};
global.FileReader = function () {
  this.readAsText = () => {};
};
global.setInterval = () => {};
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

const { inputs } = await import('../js/state.js');
const { saveLS, loadLS, deleteLS, setPayload } = await import(
  '../js/storage.js'
);
const { copySummary } = await import('../js/summary.js');

function resetInputs() {
  Object.values(inputs).forEach((el) => {
    if ('value' in el) el.value = '';
    if ('checked' in el) el.checked = false;
  });
}

test('localStorage handles multiple records', { concurrency: false }, () => {
  localStorageStub.store = {};
  resetInputs();

  inputs.nih0.value = '1';
  saveLS('d1');
  inputs.nih0.value = '2';
  saveLS('d2');
  const rec1 = loadLS('d1');
  const rec2 = loadLS('d2');
  assert.strictEqual(rec1.p_nihss0, '1');
  assert.strictEqual(rec2.p_nihss0, '2');

  deleteLS('d1');
  assert.strictEqual(loadLS('d1'), null);
  assert.strictEqual(loadLS('d2').p_nihss0, '2');
});

test(
  'saveLS/loadLS with copySummary copies generated text',
  { concurrency: false },
  async () => {
    localStorageStub.store = {};
    resetInputs();

    inputs.a_dob.value = '2000-01-01';
    inputs.weight.value = '70';
    inputs.bp.value = '120/80';
    inputs.nih0.value = '5';
    inputs.lkw.value = '2024-01-01T08:00';
    inputs.door.value = '2024-01-01T08:30';
    inputs.drugType.value = 'tnk';
    inputs.drugConc.value = '5';
    inputs.doseTotal.value = '10';
    inputs.doseVol.value = '2';

    saveLS('draft1');
    inputs.a_dob.value = '';
    setPayload(loadLS('draft1'));

    await copySummary();

    assert.ok(global.__copied.includes('PACIENTAS'));
    assert.ok(global.__copied.includes('NIHSS pradinis: 5'));
    assert.strictEqual(getEl('#summary').value, global.__copied);
  },
);
