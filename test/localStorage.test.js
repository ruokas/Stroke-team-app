import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

let inputs = null;
const { getInputs } = await import('../js/state.js');
const {
  savePatient,
  loadPatient,
  deletePatient,
  setPayload,
  getPatients,
  getPayload,
} = await import('../js/storage.js');
const { SCHEMA_VERSION } = await import('../js/storage/migrations.js');
inputs = getInputs();
const { copySummary, collectSummaryData } = await import('../js/summary.js');

function resetInputs() {
  inputs = getInputs();
  Object.values(inputs).forEach((el) => {
    if (Array.isArray(el)) {
      el.forEach((n) => {
        if ('value' in n) n.value = '';
        if ('checked' in n) n.checked = false;
      });
    } else if (el) {
      if ('value' in el) el.value = '';
      if ('checked' in el) el.checked = false;
    }
  });
}

test('localStorage handles multiple records', { concurrency: false }, () => {
  localStorage.clear();
  resetInputs();

  inputs.nih0.value = '1';
  savePatient('d1');
  inputs.nih0.value = '2';
  savePatient('d2');
  const rec1 = loadPatient('d1');
  const rec2 = loadPatient('d2');
  assert.strictEqual(rec1.p_nihss0, '1');
  assert.strictEqual(rec2.p_nihss0, '2');

  deletePatient('d1');
  assert.strictEqual(loadPatient('d1'), null);
  assert.strictEqual(loadPatient('d2').p_nihss0, '2');
  const patients = getPatients();
  assert.ok(!('d1' in patients));
  assert.strictEqual(patients.d2.data.version, SCHEMA_VERSION);
  assert.strictEqual(patients.d2.patientId, 'd2');
  assert.ok(patients.d2.created);
  assert.ok(patients.d2.lastUpdated);
});

test(
  'getPayload/setPayload support complex fields',
  { concurrency: false },
  () => {
    const orig = document.body.innerHTML;
    document.body.innerHTML =
      '<input type="checkbox" name="arrival_contra" value="A" />\n' +
      '<input type="radio" name="d_decision" value="X" />\n' +
      '<input type="radio" name="d_decision" value="Y" />';
    inputs = getInputs();
    inputs.arrival_contra[0].checked = true;
    inputs.d_decision[1].checked = true;

    const payload = getPayload();
    assert.strictEqual(payload.arrival_contra, 'A');
    assert.strictEqual(payload.d_decision, 'Y');

    document.body.innerHTML = orig;
    inputs = getInputs();
  },
);

test(
  'savePatient/loadPatient with copySummary copies generated text',
  { concurrency: false },
  async () => {
    localStorage.clear();
    resetInputs();

    inputs.a_dob.value = '2000-01-01';
    inputs.weight.value = '70';
    inputs.bp_sys.value = '120';
    inputs.bp_dia.value = '80';
    inputs.nih0.value = '5';
    inputs.lkw.value = '2024-01-01T08:00';
    inputs.door.value = '2024-01-01T08:30';
    inputs.drugType.value = 'tnk';
    inputs.drugConc.value = '5';
    inputs.doseTotal.value = '10';
    inputs.doseVol.value = '2';

    savePatient('draft1');
    inputs.a_dob.value = '';
    setPayload(loadPatient('draft1'));

    await copySummary(collectSummaryData(getPayload()));

    assert.ok(global.__copied.includes('PACIENTAS'));
    assert.ok(global.__copied.includes('NIHSS pradinis: 5'));
    assert.strictEqual(
      document.getElementById('summary').value,
      global.__copied,
    );
  },
);

test('getPatients migrates unversioned data', () => {
  localStorage.clear();
  localStorage.setItem(
    'insultoKomandaPatients_v1',
    JSON.stringify({ old: { name: 'Old', data: { p_nihss0: '1' } } }),
  );
  const patients = getPatients();
  assert.strictEqual(patients.old.data.version, SCHEMA_VERSION);
  assert.strictEqual(patients.old.data.data.p_nihss0, '1');
  assert.strictEqual(patients.old.patientId, 'old');
  assert.ok(patients.old.created);
  assert.ok(patients.old.lastUpdated);
});

test('getPatients discards unknown schema versions', () => {
  localStorage.clear();
  localStorage.setItem(
    'insultoKomandaPatients_v1',
    JSON.stringify({
      future: { name: 'Future', data: { version: 999, data: {} } },
    }),
  );
  let warned = false;
  const origWarn = console.warn;
  console.warn = () => {
    warned = true;
  };
  const patients = getPatients();
  console.warn = origWarn;
  assert.ok(!('future' in patients));
  assert.ok(warned);
});
