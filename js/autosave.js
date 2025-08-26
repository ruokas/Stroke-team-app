import { $ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { showToast } from './toast.js';
import { confirmModal, promptModal } from './modal.js';
import {
  addPatient,
  switchPatient,
  removePatient,
  renamePatient,
  getActivePatient,
  getActivePatientId,
  updateActivePatient,
  getPatients,
} from './patients.js';
import { getPatients as getSavedPatients } from './storage.js';

export function setupAutosave(
  inputs,
  { scheduleSave: sched, flushSave: flush },
) {
  let dirty = false;
  const patientSelect = $('#patientSelect');

  const refreshPatientSelect = (selectedId) => {
    if (!patientSelect) return;
    patientSelect.innerHTML = '';
    const pats = getPatients();
    Object.entries(pats).forEach(([id, p], idx) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = p.name || `Pacientas ${idx + 1}`;
      patientSelect.appendChild(opt);
    });
    if (selectedId) patientSelect.value = selectedId;
  };

  const saveStatus = document.getElementById('saveStatus');
  const updateSaveStatus = () => {
    const id = getActivePatientId();
    const rec = getSavedPatients()[id];
    if (!rec) {
      saveStatus.textContent = '';
      return;
    }
    const diff = Date.now() - new Date(rec.lastUpdated).getTime();
    const mins = Math.floor(diff / 60000);
    const ago = mins < 1 ? 'just now' : `${mins}m ago`;
    saveStatus.textContent = `${rec.name} saved ${ago}`;
  };

  patientSelect?.addEventListener('change', () => {
    switchPatient(patientSelect.value);
    refreshPatientSelect(patientSelect.value);
    updateSaveStatus();
  });

  const firstId = addPatient();
  refreshPatientSelect(firstId);

  $('#saveBtn').addEventListener('click', () => {
    const id = getActivePatientId();
    if (!id) return;
    flush(id, undefined, () => {
      showToast('Išsaugota naršyklėje.', { type: 'success' });
      updateSaveStatus();
      dirty = false;
    });
  });

  $('#renamePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    const pats = getPatients();
    const newName = await promptModal(
      'Naujas pavadinimas',
      pats[id]?.name || '',
    );
    if (newName) {
      renamePatient(id, newName);
      refreshPatientSelect(id);
      flush(id, newName, () => {
        updateSaveStatus();
        showToast('Pacientas pervadintas.', { type: 'info' });
      });
    }
  });

  $('#deletePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    if (await confirmModal('Ištrinti pacientą?')) {
      removePatient(id);
      refreshPatientSelect(getActivePatientId());
      updateSaveStatus();
      showToast('Pacientas ištrintas.', { type: 'warning' });
    }
  });

  $('#newPatientBtn').addEventListener('click', () => {
    const id = addPatient();
    refreshPatientSelect(id);
    updateSaveStatus();
  });

  const handleChange = () => {
    dirty = true;
    updateActivePatient();
    const id = getActivePatientId();
    if (!$('#summarySec').classList.contains('hidden')) {
      const patient = getActivePatient();
      if (patient) {
        const data = collectSummaryData(patient);
        const text = summaryTemplate(data);
        inputs.summary.value = text;
        patient.summary = text;
      }
    }
    if (id) {
      sched(id, undefined, () => {
        updateSaveStatus();
        dirty = false;
      });
    }
  };
  document.addEventListener('input', handleChange);
  document.addEventListener('change', handleChange);

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      e.preventDefault();
      e.returnValue = '';
    }
  });

  return { updateSaveStatus };
}
