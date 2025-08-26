import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

test('bp entry can be added and removed', async () => {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <button id="bpCorrBtn"></button>
    <div id="bpMedList"><button class="bp-med" data-med="Med" data-dose="1"></button></div>
    <div id="bpEntries"></div>
  </body>`);
  global.window = dom.window;
  global.document = dom.window.document;
  global.HTMLElement = dom.window.HTMLElement;

  const { setupBpEntry } = await import('../js/bp.js');
  const { handleBpEntriesClick } = await import('../js/app.js');

  setupBpEntry();

  const medBtn = document.querySelector('.bp-med');
  medBtn.click();

  const bpEntries = document.getElementById('bpEntries');
  assert.equal(bpEntries.children.length, 1);

  bpEntries.addEventListener('click', handleBpEntriesClick);

  const removeBtn = bpEntries.querySelector('button[data-remove-bp]');
  removeBtn.dispatchEvent(new dom.window.MouseEvent('click', { bubbles: true }));

  assert.equal(bpEntries.children.length, 0);
});

