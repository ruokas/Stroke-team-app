import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('time picker works even when #p_weight is invalid or empty', async () => {
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

  medBtn.click();

  const timePickerBtn = bpEntries.querySelector('button[data-time-picker]');

  window.HTMLDialogElement = window.HTMLElement;
  const origCreate = document.createElement.bind(document);
  let opened = 0;
  document.createElement = (tag, opts) => {
    const el = origCreate(tag, opts);
    if (tag === 'dialog') {
      el.showModal = () => {
        opened++;
      };
      el.close = () => {};
    }
    return el;
  };

  document.getElementById('p_weight').value = 'abc';
  timePickerBtn.click();
  assert.equal(opened, 1);

  document.getElementById('p_weight').value = '';
  timePickerBtn.click();
  assert.equal(opened, 2);

  document.createElement = origCreate;
});

test('now button sets time even when #p_weight is invalid or empty', async () => {
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

  medBtn.click();
  const timeInput = bpEntries.querySelector('.time-input');
  const nowBtn = bpEntries.querySelector('button[data-now]');

  timeInput.value = '';
  document.getElementById('p_weight').value = 'abc';
  nowBtn.click();
  assert.notEqual(timeInput.value, '');

  timeInput.value = '';
  document.getElementById('p_weight').value = '';
  nowBtn.click();
  assert.notEqual(timeInput.value, '');
});
