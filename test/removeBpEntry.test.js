import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('bp entry can be removed even when #p_weight is invalid or empty', async () => {
  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="number" />
      <button id="bpCorrBtn" class="btn" type="button"></button>
      <div id="bpMedList"><button type="button" class="btn bp-med" data-med="Med" data-dose="1"></button></div>
      <div id="bpEntries"></div>
    </form>
  `;
  const { setupBpEntry } = await import('../js/bp.js');
  const { handleBpEntriesClick } = await import('../js/bpEntries.js');

  setupBpEntry();

  const medBtn = document.querySelector('.bp-med');
  const bpEntries = document.getElementById('bpEntries');
  bpEntries.addEventListener('click', handleBpEntriesClick);

  // invalid weight
  medBtn.click();
  assert.equal(bpEntries.children.length, 1);
  document.getElementById('p_weight').value = 'abc';
  bpEntries.querySelector('button[data-remove-bp]').click();
  assert.equal(bpEntries.children.length, 0);

  // empty weight
  medBtn.click();
  assert.equal(bpEntries.children.length, 1);
  document.getElementById('p_weight').value = '';
  bpEntries.querySelector('button[data-remove-bp]').click();
  assert.equal(bpEntries.children.length, 0);
});
