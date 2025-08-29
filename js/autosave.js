import { $ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { showToast } from './toast.js';
import { confirmModal, promptModal } from './modal.js';
import { t } from './i18n.js';
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

const SAVE_STATUS_TEXT = {
  justNow: () => t('just_now'),
  minutesAgo: (mins) => t('minutes_ago', { mins }),
  saved: () => t('saved'),
};

export function setupAutosave(
  inputs,
  { scheduleSave: sched, flushSave: flush },
) {
  let dirty = false;
  const patientSelect = $('#patientSelect');
  const patientMenu = $('#patientMenu');
  const patientMenuLabel = $('#patientMenuLabel');
  const patientSearch = $('#patientSearch');
  const patientSearchToggle = $('#patientSearchToggle');

  const isDesktop = () =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 769px)').matches
      : true;

  const updatePatientMenu = () => {
    if (isDesktop()) patientMenu?.setAttribute('open', '');
    else patientMenu?.removeAttribute('open');
  };
  updatePatientMenu();
  window.addEventListener('resize', updatePatientMenu);

  const closePatientMenu = () => {
    if (!isDesktop()) patientMenu?.removeAttribute('open');
    patientSearch?.classList.add('hidden');
  };

  const onDocumentClick = (e) => {
    if (
      patientMenu?.hasAttribute('open') &&
      !patientMenu.contains(/** @type {Node} */ (e.target))
    ) {
      closePatientMenu();
    }
  };
  document.addEventListener('click', onDocumentClick);

  const refreshPatientSelect = (selectedId) => {
    if (!patientSelect) return;
    patientSelect.innerHTML = '';
    const pats = getPatients();
    const query = patientSearch?.value?.toLowerCase() || '';
    Object.entries(pats).forEach(([id, p], idx) => {
      const name = p.name || `Pacientas ${idx + 1}`;
      if (!query || name.toLowerCase().includes(query)) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = name;
        patientSelect.appendChild(opt);
      }
    });
    if (
      selectedId &&
      Array.from(patientSelect.options).some((opt) => opt.value === selectedId)
    )
      patientSelect.value = selectedId;
    const current = pats[selectedId || patientSelect.value];
    if (patientMenuLabel)
      patientMenuLabel.textContent = current?.name || 'Pacientas';
  };

  const saveStatus = document.getElementById('saveStatus');
  const appForm = document.getElementById('appForm');
  const updateSaveStatus = () => {
    if (!saveStatus) return;
    const id = getActivePatientId();
    const rec = getSavedPatients()[id];
    if (!rec) {
      saveStatus.textContent = '';
      return;
    }
    const diff = Date.now() - new Date(rec.lastUpdated).getTime();
    const mins = Math.floor(diff / 60000);
    const ago =
      mins < 1 ? SAVE_STATUS_TEXT.justNow() : SAVE_STATUS_TEXT.minutesAgo(mins);
    saveStatus.textContent = `${rec.name} ${SAVE_STATUS_TEXT.saved()} ${ago}`;
  };

  patientSelect?.addEventListener('change', () => {
    switchPatient(patientSelect.value);
    refreshPatientSelect(patientSelect.value);
    updateSaveStatus();
    closePatientMenu();
  });

  const firstId = addPatient();
  refreshPatientSelect(firstId);
  patientSearch?.addEventListener('input', () =>
    refreshPatientSelect(getActivePatientId()),
  );

  patientSearchToggle?.addEventListener('click', () => {
    patientSearch?.classList.toggle('hidden');
    if (!patientSearch?.classList.contains('hidden')) {
      patientSearch?.focus();
    } else {
      patientSearch.value = '';
      refreshPatientSelect(getActivePatientId());
    }
  });

  $('#saveBtn')?.addEventListener('click', () => {
    const id = getActivePatientId();
    if (!id) return;
    flush(id, undefined, () => {
      showToast(t('saved_locally'), { type: 'success' });
      updateSaveStatus();
      dirty = false;
    });
    closePatientMenu();
  });

  $('#renamePatientBtn')?.addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    const pats = getPatients();
    const newName = await promptModal(t('rename_prompt'), pats[id]?.name || '');
    if (newName) {
      renamePatient(id, newName);
      refreshPatientSelect(id);
      flush(id, newName, () => {
        updateSaveStatus();
        showToast(t('patient_renamed'), { type: 'info' });
      });
    }
    closePatientMenu();
  });

  $('#deletePatientBtn')?.addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    if (await confirmModal(t('delete_patient_confirm'))) {
      removePatient(id);
      refreshPatientSelect(getActivePatientId());
      updateSaveStatus();
      showToast(t('patient_deleted'), { type: 'warning' });
    }
    closePatientMenu();
  });

  $('#newPatientBtn')?.addEventListener('click', async () => {
    const id = addPatient();
    const enteredName = await promptModal(t('rename_prompt'), '');
    if (enteredName) {
      renamePatient(id, enteredName);
      refreshPatientSelect(id);
    } else {
      refreshPatientSelect(id);
    }
    showToast(t('patient_created'), { type: 'success' });
    updateSaveStatus();
    closePatientMenu();
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
  appForm?.addEventListener('input', handleChange);
  appForm?.addEventListener('change', handleChange);

  window.addEventListener('beforeunload', (e) => {
    if (dirty) {
      flush(getActivePatientId(), undefined);
      e.preventDefault();
      e.returnValue = '';
    }
  });

  return {
    updateSaveStatus,
    cleanup: () => document.removeEventListener('click', onDocumentClick),
  };
}
