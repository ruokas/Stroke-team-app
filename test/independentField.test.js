import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('independent fields sync and appear in summary', async () => {
  await import('../js/state.js');
  const { getPayload } = await import('../js/storage.js');
  const { collectSummaryData, summaryTemplate } = await import(
    '../js/summary.js'
  );

  const aYes = document.querySelector(
    'input[name="a_independent"][value="yes"]',
  );
  aYes.checked = true;
  aYes.dispatchEvent(new Event('change', { bubbles: true }));

  const pYes = document.querySelector(
    'input[name="p_independent"][value="yes"]',
  );
  assert.ok(pYes.checked, 'p_independent should mirror a_independent');

  const payload = getPayload();
  assert.equal(payload.a_independent, 'yes');
  assert.equal(payload.p_independent, 'yes');

  const data = collectSummaryData(payload);
  const summary = summaryTemplate(data);
  assert(summary.includes('Savarankiškas kasdienėje veikloje: yes'));
});
