import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

function createData() {
  return {
    patient: {
      personal: null,
      name: 'Jonas <Doe>',
      dob: null,
      age: null,
      weight: null,
      bp: null,
      inr: null,
      nih0: null,
    },
    times: {
      lkw: null,
      door: null,
      decision: null,
      thrombolysis: null,
      gmp: null,
    },
    drugs: {
      type: '',
      conc: null,
      totalDose: null,
      totalVol: null,
      bolus: null,
      infusion: null,
    },
    decision: null,
    bpMeds: [],
    activation: {
      lkw: null,
      drugs: [],
      params: {
        glucose: null,
        aks: null,
        hr: null,
        spo2: null,
        temp: null,
      },
      symptoms: [],
    },
    arrivalSymptoms: null,
    arrivalContra: null,
    arrivalMtContra: null,
  };
}

test('exportSummaryPDF writes escaped summary to new window', async () => {
  const data = createData();
  const { exportSummaryPDF, summaryTemplate } = await import(
    '../js/summary.js'
  );
  let html = '';
  const stubPrintWindow = {
    document: {
      write: (content) => {
        html += content;
      },
      close: () => {},
    },
    focus: () => {},
    print: () => {},
  };
  const stubWindow = {
    open: () => stubPrintWindow,
  };
  exportSummaryPDF(data, stubWindow);
  const escaped = summaryTemplate(data)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  assert.ok(html.includes('<title>Santrauka</title>'));
  assert.ok(html.includes(`<pre>${escaped}</pre>`));
});

test('exportSummaryPDF shows error when window cannot be opened', async () => {
  const data = createData();
  const { exportSummaryPDF } = await import('../js/summary.js');
  const { toast } = await import('../js/toast.js');
  let message;
  let options;
  toast.showToast = (msg, opts) => {
    message = msg;
    options = opts;
  };
  const stubWindow = {
    open: () => null,
  };
  exportSummaryPDF(data, stubWindow);
  assert.equal(message, 'Nepavyko atidaryti spausdinimo lango');
  assert.deepEqual(options, { type: 'error' });
});
