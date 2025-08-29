import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

// Test ensures patient search filters options and switching works

test(
  'patient search filters options and switches patients',
  { concurrency: false },
  async () => {
    const { setupAutosave } = await import('../js/autosave.js');
    const { getInputs } = await import('../js/state.js');
    const {
      addPatient,
      removePatient,
      getPatients: getPatientStore,
      renamePatient,
      getActivePatientId,
    } = await import('../js/patients.js');

    // reset state
    localStorage.clear();
    Object.keys(getPatientStore()).forEach((id) => removePatient(id));

    const inputs = getInputs();
    setupAutosave(inputs, { scheduleSave() {}, flushSave() {} });

    const firstId = getActivePatientId();
    renamePatient(firstId, 'Alice');
    const id2 = addPatient(undefined, { name: 'Bob' });
    addPatient(undefined, { name: 'Charlie' });

    const searchInput = document.getElementById('patientSearch');
    // refresh list with all patients
    searchInput.value = '';
    searchInput.dispatchEvent(new Event('input'));

    const patientSelect = document.getElementById('patientSelect');
    assert.strictEqual(patientSelect.options.length, 3);

    // filter for Bob
    searchInput.value = 'bo';
    searchInput.dispatchEvent(new Event('input'));
    assert.strictEqual(patientSelect.options.length, 1);
    assert.strictEqual(patientSelect.options[0].textContent, 'Bob');

    // selecting filtered option switches patient
    patientSelect.value = id2;
    patientSelect.dispatchEvent(new Event('change'));
    assert.strictEqual(getActivePatientId(), id2);
  },
);
