import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

// Test that clicking 'Kita' shows modal and uses entered name to create entry

test(
  'Kita medication uses modal input for entry',
  { concurrency: false },
  async () => {
    document.body.innerHTML = `
    <form>
      <button id="bpCorrBtn" class="btn" type="button"></button>
      <ul id="bpMedList" role="list">
        <li><button type="button" class="btn bp-med" data-med="Kita">Kita</button></li>
      </ul>
      <div id="bpEntries"></div>
    </form>
  `;

    const { setupBpEntry } = await import('../js/bp.js');
    setupBpEntry();

    const medBtn = document.querySelector('.bp-med');
    medBtn.click();

    await tick();
    const overlay = document.querySelector('.modal-overlay');
    const input = overlay.querySelector('input');
    input.value = 'CustomMed';
    const [okBtn] = overlay.querySelectorAll('button');
    okBtn.click();

    await tick();
    const entry = document.querySelector('#bpEntries .bp-entry strong');
    assert.equal(entry.textContent, 'CustomMed');
  },
);

// Test that cancelling the modal does not create an entry

test(
  'canceling Kita medication modal creates no entry',
  { concurrency: false },
  async () => {
    document.body.innerHTML = `
    <form>
      <button id="bpCorrBtn" class="btn" type="button"></button>
      <ul id="bpMedList" role="list">
        <li><button type="button" class="btn bp-med" data-med="Kita">Kita</button></li>
      </ul>
      <div id="bpEntries"></div>
    </form>
  `;

    const { setupBpEntry } = await import('../js/bp.js');
    setupBpEntry();

    const medBtn = document.querySelector('.bp-med');
    medBtn.click();

    await tick();
    const overlay = document.querySelector('.modal-overlay');
    const buttons = overlay.querySelectorAll('button');
    const cancelBtn = buttons[1];
    cancelBtn.click();

    await tick();
    const entries = document.querySelector('#bpEntries');
    assert.equal(entries.children.length, 0);
  },
);
