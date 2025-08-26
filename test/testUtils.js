export async function setupDom() {
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
      querySelector: () => ({ textContent: '', addEventListener: () => {} }),
      addEventListener: () => {},
      setAttribute(name, value) {
        (this.attributes || (this.attributes = {}))[name] = value;
      },
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
  const { toast } = await import('../js/toast.js');
  toast.showToast = () => {};
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
  return { getEl, localStorageStub };
}
