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
    checked: false,
    appendChild(child) {
      (this.children || (this.children = [])).push(child);
    },
    select: () => {},
    listeners: {},
    addEventListener(type, fn) {
      (this.listeners[type] || (this.listeners[type] = [])).push(fn);
    },
    dispatchEvent(evt) {
      (this.listeners[evt.type] || []).forEach((fn) => fn.call(this, evt));
      if (evt.bubbles && document.dispatchEvent) document.dispatchEvent(evt);
    },
  };
}
function getEl(key) {
  if (!elements[key]) elements[key] = createEl();
  return elements[key];
}

const documentStub = {
  listeners: {},
  querySelector: (sel) => getEl(sel),
  querySelectorAll: () => [],
  getElementById: (id) => getEl('#' + id),
  addEventListener(type, fn) {
    (this.listeners[type] || (this.listeners[type] = [])).push(fn);
  },
  dispatchEvent(evt) {
    (this.listeners[evt.type] || []).forEach((fn) => fn.call(this, evt));
  },
  createElement: () => createEl(),
  execCommand: () => true,
};

global.document = documentStub;
const localStorageStub = {
  setItem() {},
  getItem() {
    return null;
  },
  removeItem() {},
};

global.localStorage = localStorageStub;
global.confirm = () => true;
global.prompt = () => '';
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.Blob = function () {};
global.FileReader = function () {
  this.readAsText = () => {};
};
global.setInterval = () => {};
global.window = { isSecureContext: true };

test('setPayload bubbles change events', async () => {
  const { setPayload } = await import('../js/storage.js');

  const known = createEl();
  known.value = 'known';
  const unknown = createEl();
  unknown.value = 'unknown';
  document.querySelectorAll = (sel) =>
    sel === 'input[name="lkw_type"]' ? [known, unknown] : [];

  let changeCount = 0;
  document.addEventListener('change', () => {
    changeCount++;
  });

  setPayload({ arrival_lkw_type: 'unknown' });

  assert.strictEqual(unknown.checked, true);
  assert.strictEqual(changeCount, 2);
});
