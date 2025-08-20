import { test } from 'node:test';
import assert from 'node:assert/strict';

function createEl() {
  return {
    value: '',
    classList: { add() {}, remove() {} },
    setCustomValidity() {},
    reportValidity() {},
    style: {},
  };
}

// Using document mapping to simulate dynamic DOM
const elements = {};
const documentStub = {
  querySelector(sel) {
    return elements[sel] || null;
  },
  querySelectorAll(sel) {
    return elements[sel] ? [].concat(elements[sel]) : [];
  },
  getElementById(id) {
    return elements['#' + id] || null;
  },
  addEventListener() {},
  createElement: () => createEl(),
};

global.document = documentStub;

// Needed globals for modules
global.confirm = () => true;
global.localStorage = { setItem: () => {}, getItem: () => null };
global.URL = { createObjectURL: () => '', revokeObjectURL: () => {} };
global.Blob = function () {};
global.FileReader = function () { this.readAsText = () => {}; };
global.setInterval = () => {};

import('../js/toast.js').then(({ toast }) => (toast.showToast = () => {}));

// calcDrugs test
import('../js/drugs.js').then(({ calcDrugs }) => {
  test('calcDrugs handles missing and injected elements', () => {
    // no elements present
    assert.doesNotThrow(() => calcDrugs());

    // inject elements
    elements['#drug_type'] = { value: 'tnk' };
    elements['#drug_conc'] = createEl();
    elements['#drug_conc'].value = '5';
    elements['#p_weight'] = createEl();
    elements['#p_weight'].value = '70';
    elements['#dose_total'] = createEl();
    elements['#dose_volume'] = createEl();
    elements['#tpa_bolus'] = createEl();
    elements['#tpa_infusion'] = createEl();
    elements['#def_tnk'] = { value: '5' };
    elements['#def_tpa'] = { value: '1' };

    calcDrugs();
    assert.strictEqual(elements['#dose_total'].value, 17.5);
  });
});

// storage test
import('../js/storage.js').then(({ setPayload, getPayload }) => {
  test('storage functions work with dynamic inputs', () => {
    // ensure no relevant elements present
    delete elements['#p_weight'];
    assert.doesNotThrow(() => setPayload({ p_weight: '70' }));
    const p0 = getPayload();
    assert.strictEqual(p0.p_weight, '');

    // inject weight element
    elements['#p_weight'] = createEl();
    setPayload({ p_weight: '80' });
    const p1 = getPayload();
    assert.strictEqual(elements['#p_weight'].value, '80');
    assert.strictEqual(p1.p_weight, '80');
  });
});
