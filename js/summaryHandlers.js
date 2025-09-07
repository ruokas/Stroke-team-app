import {
  collectSummaryData,
  summaryTemplate,
  copySummary,
  exportSummaryPDF,
} from './summary.js';
import { getActivePatient } from './patients.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';

export function setupSummaryHandlers(inputs) {
  document.getElementById('summary')?.addEventListener('focus', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = summaryTemplate(data);
    inputs.summary.value = text;
    patient.summary = text;
  });
  document.getElementById('copySummaryBtn')?.addEventListener('click', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    copySummary(data)
      .then((text) => {
        patient.summary = text;
        showToast(t('summary_copied'), { type: 'success' });
      })
      .catch(() => {});
  });
  document.getElementById('exportSummaryBtn')?.addEventListener('click', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = summaryTemplate(data);
    inputs.summary.value = text;
    patient.summary = text;
    exportSummaryPDF(data);
    showToast(t('summary_exported'), { type: 'success' });
  });
}
