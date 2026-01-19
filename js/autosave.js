import { $ } from './state.js';
import { collectSummaryData, summaryTemplate } from './summary.js';
import { updateSummaryIndicators } from './summaryHandlers.js';
import { showToast } from './toast.js';
import { confirmModal, promptModal } from './modal.js';
import { t } from './i18n.js';
import { setButtonLoading } from './uiFeedback.js';
import {
  addPatient,
  switchPatient,
  removePatient,
  renamePatient,
  getActivePatient,
  getActivePatientId,
  updateActivePatient,
  getPatients,
  hydratePatients,
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
  const dirtyPatients = new Set();
  const patientSelect = $('#patientSelect');
  const patientMenu = $('#patientMenu');
  const patientMenuLabel = $('#patientMenuLabel');
  const patientSearch = $('#patientSearch');
  const patientSearchToggle = $('#patientSearchToggle');
  const saveBtn = $('#saveBtn');

  const isDesktop = () =>
    typeof window.matchMedia === 'function'
      ? window.matchMedia('(min-width: 769px)').matches
      : true;

  const updatePatientMenu = () => {
    if (isDesktop()) patientMenu.setAttribute('open', '');
    else patientMenu.removeAttribute('open');
  };
  updatePatientMenu();
  window.addEventListener('resize', updatePatientMenu);

  const closePatientMenu = () => {
    if (!isDesktop()) patientMenu.removeAttribute('open');
    if (patientSearch) {
      patientSearch.value = '';
      patientSearch.classList.add('hidden');
      refreshPatientSelect(getActivePatientId());
    }
  };

  const onDocumentClick = (e) => {
    if (
      patientMenu.hasAttribute('open') &&
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
    const query = patientSearch.value.toLowerCase() || '';
    Object.entries(pats).forEach(([id, p], idx) => {
      const name = p.name || `Pacientas ${idx + 1}`;
      if (!query || name.toLowerCase().includes(query)) {
        const opt = document.createElement('option');
        opt.value = id;
        opt.textContent = dirtyPatients.has(id) ? `${name} *` : name;
        patientSelect.appendChild(opt);
      }
    });
    if (
      selectedId &&
      Array.from(patientSelect.options).some((opt) => opt.value === selectedId)
    )
      patientSelect.value = selectedId;
    const currentId = selectedId || patientSelect.value;
    const current = pats[currentId];
    if (patientMenuLabel)
      patientMenuLabel.textContent = dirtyPatients.has(currentId)
        ? `${current.name || 'Pacientas'} *`
        : current.name || 'Pacientas';
  };

  const saveStatus = document.getElementById('saveStatus');
  if (saveStatus) {
    saveStatus.style.display = 'block';
    saveStatus.classList.add('subtle');
  }
  const updateSaveButtonState = () => {
    if (!saveBtn) return;
    const id = getActivePatientId();
    const isDirty = Boolean(id && dirtyPatients.has(id));
    saveBtn.disabled = !isDirty;
    saveBtn.setAttribute('aria-disabled', (!isDirty).toString());
  };
  const appForm = document.getElementById('appForm');
  const updateSaveStatus = () => {
    if (!saveStatus) return;
    const id = getActivePatientId();
    updateSaveButtonState();
    if (id && dirtyPatients.has(id)) {
      const name = getActivePatient().name || 'Pacientas';
      saveStatus.textContent = `${name} ${t('unsaved')}`;
      return;
    }
    const rec = getSavedPatients()[id];
    if (!rec) {
      saveStatus.textContent = '';
      return;
    }
    const lastUpdated =
      rec.lastUpdated ?? rec.last_updated ?? rec.created ?? null;
    if (!lastUpdated) {
      const name = rec.name || 'Pacientas';
      saveStatus.textContent = `${name} ${SAVE_STATUS_TEXT.saved()}`;
      return;
    }
    const diff = Date.now() - new Date(lastUpdated).getTime();
    const mins = Math.floor(diff / 60000);
    const ago =
      mins < 1 ? SAVE_STATUS_TEXT.justNow() : SAVE_STATUS_TEXT.minutesAgo(mins);
    saveStatus.textContent = `${rec.name} ${SAVE_STATUS_TEXT.saved()} ${ago}`;
  };

  patientSelect.addEventListener('change', () => {
    switchPatient(patientSelect.value);
    refreshPatientSelect(patientSelect.value);
    updateSaveStatus();
    closePatientMenu();
  });

  const storedPatients = getSavedPatients();
  const hydratedId = hydratePatients(storedPatients);
  if (hydratedId) {
    switchPatient(hydratedId);
    refreshPatientSelect(hydratedId);
  } else {
    const firstId = addPatient();
    refreshPatientSelect(firstId);
  }
  updateSaveStatus();
  const onPatientsRestored = () => {
    if (dirtyPatients.size) return;
    const refreshed = getSavedPatients();
    const currentId = getActivePatientId();
    const restoredId = hydratePatients(refreshed);
    const targetId = currentId && refreshed[currentId] ? currentId : restoredId;
    if (!targetId) return;
    switchPatient(targetId);
    refreshPatientSelect(targetId);
    updateSaveStatus();
  };
  window.addEventListener('patients-restored', onPatientsRestored);
  patientSearch.addEventListener('input', () =>
    refreshPatientSelect(getActivePatientId()),
  );

  patientSearchToggle.addEventListener('click', () => {
    patientSearch.classList.toggle('hidden');
    if (!patientSearch.classList.contains('hidden')) {
      patientSearch.focus();
    } else {
      patientSearch.value = '';
      refreshPatientSelect(getActivePatientId());
      patientSelect.focus();
    }
  });

  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented) return;
    const target = /** @type {HTMLElement} */ (e.target);
    const tag = target.tagName.toLowerCase();
    const isTyping =
      target.isContentEditable || tag === 'input' || tag === 'textarea';
    if (isTyping) return;
    if (e.key === '/') {
      e.preventDefault();
      if (!isDesktop()) patientMenu.setAttribute('open', '');
      patientSearch.classList.remove('hidden');
      patientSearch.focus();
      return;
    }
    if (e.key === 'Escape' && patientMenu.hasAttribute('open')) {
      closePatientMenu();
    }
  });

  $('#saveBtn').addEventListener('click', () => {
    const id = getActivePatientId();
    if (!id) return;
    setButtonLoading(saveBtn, true);
    flush(id, undefined, () => {
      showToast(t('saved_locally'), { type: 'success' });
      updateSaveStatus();
      dirtyPatients.delete(id);
      refreshPatientSelect(getActivePatientId());
      setButtonLoading(saveBtn, false);
    });
    closePatientMenu();
  });

  $('#renamePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    const pats = getPatients();
    const newName = await promptModal(t('rename_prompt'), pats[id].name || '');
    if (newName) {
      renamePatient(id, newName);
      refreshPatientSelect(id);
      flush(id, newName, () => {
        updateSaveStatus();
        showToast(t('patient_renamed'), { type: 'info' });
        dirtyPatients.delete(id);
        refreshPatientSelect(getActivePatientId());
      });
    }
    closePatientMenu();
  });

  $('#deletePatientBtn').addEventListener('click', async () => {
    const id = getActivePatientId();
    if (!id) return;
    if (await confirmModal(t('delete_patient_confirm'))) {
      removePatient(id);
      dirtyPatients.delete(id);
      let nextId = getActivePatientId();
      if (!nextId) nextId = addPatient();
      refreshPatientSelect(nextId);
      updateSaveStatus();
      showToast(t('patient_deleted'), { type: 'warning' });
    }
    closePatientMenu();
  });

  $('#newPatientBtn').addEventListener('click', () => {
    const id = addPatient();
    refreshPatientSelect(id);
    showToast(t('patient_created'), { type: 'success' });
    updateSaveStatus();
    closePatientMenu();
  });

  const handleChange = (e) => {
    const id = getActivePatientId();
    if (id) dirtyPatients.add(id);
    updateSaveStatus();
    if (e.target.id === 'a_name' && id) {
      renamePatient(id, e.target.value);
    }
    updateActivePatient();
    if (e.type === 'change' && !$('#summarySec').classList.contains('hidden')) {
      const patient = getActivePatient();
      if (patient) {
        const data = collectSummaryData(patient);
        const text = summaryTemplate(data);
        inputs.summary.value = text;
        patient.summary = text;
        updateSummaryIndicators(data);
      }
    }
    if (id) {
      refreshPatientSelect(getActivePatientId());
      sched(id, undefined, () => {
        updateSaveStatus();
        dirtyPatients.delete(id);
        refreshPatientSelect(getActivePatientId());
      });
    }
  };
  appForm.addEventListener('input', handleChange);
  appForm.addEventListener('change', handleChange);

  window.addEventListener('beforeunload', (e) => {
    if (dirtyPatients.size) {
      dirtyPatients.forEach((id) => flush(id, undefined));
      e.preventDefault();
      e.returnValue = '';
    }
  });

  return {
    updateSaveStatus,
    cleanup: () => {
      document.removeEventListener('click', onDocumentClick);
      window.removeEventListener('patients-restored', onPatientsRestored);
    },
  };
}
