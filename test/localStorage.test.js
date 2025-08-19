import assert from 'assert';

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
    appendChild: function (child) {
      (this.children || (this.children = [])).push(child);
    },
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
global.FileReader = function () { this.readAsText = () => {}; };
global.setInterval = () => {};

const { inputs } = await import('../js/state.js');
const { saveLS, loadLS, deleteLS } = await import('../js/storage.js');

inputs.id.value = 'p1';
const id1 = saveLS();
inputs.id.value = 'p2';
const id2 = saveLS();
assert.notStrictEqual(id1, id2, 'IDs should be unique');
const rec1 = loadLS(id1);
const rec2 = loadLS(id2);
assert.strictEqual(rec1.p_id, 'p1', 'First record should be retrievable');
assert.strictEqual(rec2.p_id, 'p2', 'Second record should be retrievable');

deleteLS(id1);
assert.strictEqual(loadLS(id1), null, 'Deleted record should not load');
assert.strictEqual(loadLS(id2).p_id, 'p2', 'Other record remains');

console.log('localStorage handles multiple records');
