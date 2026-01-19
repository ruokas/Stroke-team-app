import {
  collectSummaryData,
  summaryTemplate,
  copySummary,
  exportSummaryPDF,
  getSummaryMissingFields,
} from './summary.js';
import { getActivePatient } from './patients.js';
import { getPayload } from './storage.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';
import { withButtonLoading, flashButtonLoading } from './uiFeedback.js';

/**
 * Atnaujina santraukos lauką pagal aktyvų pacientą arba paskutinį įrašą.
 * @param {object|null} patient
 * @param {{ summary: HTMLTextAreaElement|null }} inputs
 * @returns {object}
 */
function updateSummary(patient, inputs) {
  const data = collectSummaryData(patient || getPayload());
  const text = summaryTemplate(data);
  if (inputs.summary) inputs.summary.value = text;
  if (patient) patient.summary = text;
  updateSummaryIndicators(data);
  return data;
}

export function updateSummaryIndicators(data) {
  const missing = getSummaryMissingFields(data);
  const isIncomplete = missing.length > 0;
  const warningEl = document.getElementById('summaryIncompleteWarning');
  if (warningEl) {
    warningEl.classList.toggle('hidden', !isIncomplete);
  }
  const listEl = document.getElementById('summaryMissingList');
  if (listEl) {
    listEl.innerHTML = '';
    if (isIncomplete) {
      const fixes = {
        summary_missing_lkw: 'arrival',
        summary_missing_nihss: 'nihss',
        summary_missing_decision: 'decision',
        summary_missing_dose: 'thrombolysis',
      };
      missing.forEach((key) => {
        const item = document.createElement('li');
        const label = document.createElement('span');
        label.textContent = t(key);
        item.appendChild(label);
        const sectionId = fixes[key];
        if (sectionId) {
          const link = document.createElement('a');
          link.href = `#${sectionId}`;
          link.className = 'summary-fix-link';
          link.textContent = t('summary_missing_fix');
          item.appendChild(link);
        }
        listEl.appendChild(item);
      });
    }
  }
  document
    .querySelectorAll('[data-summary-badge]')
    .forEach((badge) => badge.classList.toggle('hidden', !isIncomplete));
  return isIncomplete;
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
  const filterEls = Array.from(
    document.querySelectorAll('[data-summary-filter]'),
  );

  summaryEl.addEventListener('focus', () => {
    const patient = getActivePatient();
    updateSummary(patient, inputs);
  });
  filterEls.forEach((el) =>
    el.addEventListener('change', () => {
      const patient = getActivePatient();
      updateSummary(patient, inputs);
    }),
  );

  const copyBtn = document.getElementById('copySummaryBtn');
  copyBtn.addEventListener('click', () => {
    const patient = getActivePatient();
    const data = updateSummary(patient, inputs);
    withButtonLoading(copyBtn, () =>
      copySummary(data)
        .then((text) => {
          if (patient) patient.summary = text;
          showToast(t('summary_copied'), { type: 'success' });
        })
        .catch(() => {}),
    );
  });

  const exportBtn = document.getElementById('exportSummaryBtn');
  exportBtn.addEventListener('click', () => {
    const patient = getActivePatient();
    const data = updateSummary(patient, inputs);
    flashButtonLoading(exportBtn);
    exportSummaryPDF(data);
    showToast(t('summary_exported'), { type: 'success' });
  });
}
