import {
  collectSummaryData,
  summaryTemplate,
  copySummary,
  exportSummaryPDF,
  exportSummaryToDrive,
} from './summary.js';
import { getActivePatient } from './patients.js';
import { getPayload } from './storage.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';

/**
 * Atnaujina santraukos lauką pagal aktyvų pacientą arba paskutinį įrašą.
 * @param {object|null} patient
 * @param {{ summary?: HTMLTextAreaElement|null }} inputs
 * @returns {object}
 */
function updateSummary(patient, inputs) {
  const data = collectSummaryData(patient || getPayload());
  const text = summaryTemplate(data);
  if (inputs.summary) inputs.summary.value = text;
  if (patient) patient.summary = text;
  return data;
}

export function setupSummaryHandlers(inputs) {
  if (document.readyState === 'loading') {
    document.addEventListener(
      'DOMContentLoaded',
      () => setupSummaryHandlers(inputs),
      { once: true },
    );
    return;
  }

  const summaryEl = document.getElementById('summary');
  if (!summaryEl) return;

  summaryEl.addEventListener('focus', () => {
    const patient = getActivePatient();
    updateSummary(patient, inputs);
  });

  document.getElementById('copySummaryBtn')?.addEventListener('click', () => {
    const patient = getActivePatient();
    const data = updateSummary(patient, inputs);
    copySummary(data)
      .then((text) => {
        if (patient) patient.summary = text;
        showToast(t('summary_copied'), { type: 'success' });
      })
      .catch(() => {});
  });

  document.getElementById('exportSummaryBtn')?.addEventListener('click', () => {
    const patient = getActivePatient();
    const data = updateSummary(patient, inputs);
    exportSummaryPDF(data);
    showToast(t('summary_exported'), { type: 'success' });
  });

  document.getElementById('exportDriveBtn')?.addEventListener('click', () => {
    const patient = getActivePatient();
    const data = updateSummary(patient, inputs);
    exportSummaryToDrive(data);
  });
}
