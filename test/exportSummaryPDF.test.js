import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

const { getInputs } = await import('../js/state.js');
const { getPayload } = await import('../js/storage.js');
const { exportSummaryPDF, summaryTemplate, collectSummaryData } = await import(
  '../js/summary.js'
);
const { toast } = await import('../js/toast.js');

function createData() {
  const inputs = getInputs();
  inputs.a_name.value = 'Jonas <Doe>';
  return collectSummaryData(getPayload());
}

test('exportSummaryPDF writes escaped summary to new window', () => {
  const data = createData();
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

test('exportSummaryPDF shows error when window cannot be opened', () => {
  const data = createData();
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
