const fs = require('fs');
const vm = require('vm');
const assert = require('assert');

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

const sandbox = {
  document: documentStub,
  alert: () => {},
  confirm: () => true,
  prompt: () => '',
  localStorage: localStorageStub,
  URL: { createObjectURL: () => '', revokeObjectURL: () => {} },
  Blob: function () {},
  FileReader: function () { this.readAsText = () => {}; },
  setInterval: () => {},
};

vm.createContext(sandbox);
const code = fs.readFileSync('js/app.js', 'utf8');
vm.runInContext(code, sandbox);
vm.runInContext(
  'this.inputs = inputs; this.saveLS = saveLS; this.loadLS = loadLS; this.deleteLS = deleteLS;',
  sandbox,
);

sandbox.inputs.id.value = 'p1';
const id1 = sandbox.saveLS();
sandbox.inputs.id.value = 'p2';
const id2 = sandbox.saveLS();
assert.notStrictEqual(id1, id2, 'IDs should be unique');
const rec1 = sandbox.loadLS(id1);
const rec2 = sandbox.loadLS(id2);
assert.strictEqual(rec1.p_id, 'p1', 'First record should be retrievable');
assert.strictEqual(rec2.p_id, 'p2', 'Second record should be retrievable');

sandbox.deleteLS(id1);
assert.strictEqual(sandbox.loadLS(id1), null, 'Deleted record should not load');
assert.strictEqual(sandbox.loadLS(id2).p_id, 'p2', 'Other record remains');

console.log('localStorage handles multiple records');
