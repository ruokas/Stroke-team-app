import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
const { getInputs } = await import('../js/state.js');
const {
  addPatient,
  switchPatient,
  removePatient,
  getPatients: getPatientStore,
} = await import('../js/patients.js');
const { savePatient, loadPatient, getPatients } = await import(
  '../js/storage.js'
);
const { SCHEMA_VERSION } = await import('../js/storage/migrations.js');

let inputs = getInputs();
function resetInputs() {
  inputs = getInputs();
  Object.values(inputs).forEach((el) => {
    if ('value' in el) el.value = '';
    if ('checked' in el) el.checked = false;
  });
}

test(
  'patients add, switch and delete correctly',
  { concurrency: false },
  () => {
    localStorage.clear();
    resetInputs();

    // start first patient
    const id1 = addPatient();
    inputs.nih0.value = '1';

    // second patient starts with empty form
    const id2 = addPatient();
    assert.strictEqual(inputs.nih0.value, '');

    // modify second patient and save both
    inputs.nih0.value = '2';
    switchPatient(id1); // saves p2 changes
    savePatient(id1);
    switchPatient(id2);
    savePatient(id2);

    // adding two patients stores two distinct payloads
    const memoryPatients = getPatientStore();
    assert.strictEqual(memoryPatients[id1].p_nihss0, '1');
    assert.strictEqual(memoryPatients[id2].p_nihss0, '2');
    assert.strictEqual(loadPatient(id1).p_nihss0, '1');
    assert.strictEqual(loadPatient(id2).p_nihss0, '2');
    const stored = getPatients();
    assert.strictEqual(stored[id1].data.version, SCHEMA_VERSION);
    assert.strictEqual(stored[id2].data.version, SCHEMA_VERSION);

    // switching patients restores their respective data
    switchPatient(id1);
    inputs.nih0.value = '3';
    switchPatient(id2);
    assert.strictEqual(inputs.nih0.value, '2');
    switchPatient(id1);
    assert.strictEqual(inputs.nih0.value, '3');

    // deleting one patient leaves the other intact
    removePatient(id1);
    assert.strictEqual(loadPatient(id1), null);
    assert.strictEqual(loadPatient(id2).p_nihss0, '2');
    const remaining = getPatientStore();
    assert.ok(!remaining[id1]);
    assert.strictEqual(remaining[id2].p_nihss0, '2');
  },
);

test('addPatient keeps provided ID and data', () => {
  localStorage.clear();
  resetInputs();

  const existingId = 'existing-id';
  const data = { p_nihss0: '5', summary: 's', name: 'Existing' };
  const id = addPatient(existingId, data);

  assert.strictEqual(id, existingId);
  const patients = getPatientStore();
  assert.strictEqual(patients[existingId].p_nihss0, '5');
  assert.strictEqual(patients[existingId].summary, 's');
  assert.strictEqual(patients[existingId].name, 'Existing');
});

test('addPatient persists previous patient data', () => {
  localStorage.clear();
  resetInputs();
  Object.keys(getPatientStore()).forEach((id) => removePatient(id));

  const id1 = addPatient();
  inputs.nih0.value = '1';
  addPatient();
  const patients = getPatientStore();
  assert.strictEqual(patients[id1].p_nihss0, '1');
});

test('switchPatient persists previous patient data', () => {
  localStorage.clear();
  resetInputs();
  Object.keys(getPatientStore()).forEach((id) => removePatient(id));

  const id1 = addPatient();
  inputs.nih0.value = '1';
  const id2 = addPatient();
  inputs.nih0.value = '2';
  switchPatient(id1);
  const patients = getPatientStore();
  assert.strictEqual(patients[id2].p_nihss0, '2');
});
