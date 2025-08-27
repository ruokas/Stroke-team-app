import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('bp entry can be added and removed', async () => {
  document.body.innerHTML = `
    <button id="bpCorrBtn" class="btn"></button>
    <div id="bpMedList"><button class="btn bp-med" data-med="Med" data-dose="1"></button></div>
    <div id="bpEntries"></div>
  `;
  const { setupBpEntry } = await import('../js/bp.js');
  const { handleBpEntriesClick } = await import('../js/bpEntries.js');

  setupBpEntry();

  const medBtn = document.querySelector('.bp-med');
  medBtn.click();

  const bpEntries = document.getElementById('bpEntries');
  assert.equal(bpEntries.children.length, 1);

  bpEntries.addEventListener('click', handleBpEntriesClick);

  const removeBtn = bpEntries.querySelector('button[data-remove-bp]');
  removeBtn.dispatchEvent(new MouseEvent('click', { bubbles: true }));

  assert.equal(bpEntries.children.length, 0);
});
