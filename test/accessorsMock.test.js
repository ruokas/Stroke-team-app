import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

// calcDrugs test
import('../js/drugs.js').then(({ calcDrugs }) => {
  test('calcDrugs handles missing and injected elements', async () => {
    document.body.innerHTML = '';
    assert.doesNotThrow(() => calcDrugs());

    document.body.innerHTML = `
      <select id="drug_type"></select>
      <input id="drug_conc" />
      <input id="p_weight" />
      <input id="dose_total" />
      <input id="dose_volume" />
      <input id="tpa_bolus" />
      <input id="tpa_infusion" />
      <input id="def_tnk" value="5" />
      <input id="def_tpa" value="1" />
    `;
    const { getInputs } = await import('../js/state.js');
    const inputs = getInputs();
    inputs.drugType.value = 'tnk';
    inputs.drugConc.value = '5';
    inputs.weight.value = '70';
    assert.doesNotThrow(() => calcDrugs());
  });
});

// storage test
import('../js/storage.js').then(({ setPayload, getPayload }) => {
  test('storage functions work with dynamic inputs', async () => {
    document.body.innerHTML = '';
    assert.doesNotThrow(() => setPayload({ p_weight: '70' }));
    const p0 = getPayload();
    assert.strictEqual(p0.p_weight, '');

    document.body.innerHTML = `<input id="p_weight" />`;
    const { getInputs } = await import('../js/state.js');
    const inputs = getInputs();
    setPayload({ p_weight: '80' });
    const p1 = getPayload();
    assert.strictEqual(inputs.weight.value, '80');
    assert.strictEqual(p1.p_weight, '80');
  });
});
