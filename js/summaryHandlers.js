import {
  collectSummaryData,
  summaryTemplate,
  copySummary,
  exportSummaryPDF,
} from './summary.js';
import { getActivePatient } from './patients.js';

export function setupSummaryHandlers(inputs) {
  document.getElementById('summary').addEventListener('focus', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = summaryTemplate(data);
    inputs.summary.value = text;
    patient.summary = text;
  });
  document.getElementById('copySummaryBtn').addEventListener('click', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = copySummary(data);
    patient.summary = text;
  });
  document.getElementById('exportSummaryBtn').addEventListener('click', () => {
    const patient = getActivePatient();
    if (!patient) return;
    const data = collectSummaryData(patient);
    const text = summaryTemplate(data);
    inputs.summary.value = text;
    patient.summary = text;
    exportSummaryPDF(data);
  });
}
