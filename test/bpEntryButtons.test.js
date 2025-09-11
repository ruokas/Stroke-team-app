import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { bpMeds } from '../js/bpMeds.js';

test('now button sets time even when #p_weight is invalid or empty', async () => {
  const med = bpMeds[0];
  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="number" />
      <ul id="bpMedList" role="list"><li><button type="button" class="btn bp-med" data-med="${med.name}">${med.name}</button></li></ul>
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

test('bp entry defaults to local time', async () => {
  const RealDate = Date;
  const fixed = new RealDate('2024-01-02T03:04');
  global.Date = class extends RealDate {
    constructor(...args) {
      if (args.length === 0) return new RealDate(fixed);
      return new RealDate(...args);
    }
    static now() {
      return fixed.getTime();
    }
  };

  const med = bpMeds[0];
  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="number" />
      <ul id="bpMedList" role="list"><li><button type="button" class="btn bp-med" data-med="${med.name}">${med.name}</button></li></ul>
      <div id="bpEntries"></div>
    </form>
  `;

  const { setupBpEntry } = await import('../js/bp.js');

  setupBpEntry();
  document.querySelector('.bp-med').click();

  const timeInput = document.querySelector('.time-input');
  assert.equal(timeInput.value, '03:04');

  global.Date = RealDate;
});

test('bp entry displays default dose from bpMeds', async () => {
  const med = bpMeds[0];
  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="number" />
      <ul id="bpMedList" role="list"><li><button type="button" class="btn bp-med" data-med="${med.name}">${med.name}</button></li></ul>
      <div id="bpEntries"></div>
    </form>
  `;
  const { setupBpEntry } = await import('../js/bp.js');

  setupBpEntry();
  document.querySelector('.bp-med').click();

  const doseInput = document.querySelector('.dose-input');
  const unitSpan = document.querySelector('.bp-entry .unit');
  assert.equal(doseInput.value, med.dose);
  assert.equal(doseInput.placeholder, med.unit);
  assert.equal(unitSpan.textContent, med.unit);
});

test('bp entry creates and saves BP after inputs', async () => {
  const med = bpMeds[0];
  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="number" />
      <ul id="bpMedList" role="list"><li><button type="button" class="btn bp-med" data-med="${med.name}">${med.name}</button></li></ul>
      <div id="bpEntries"></div>
    </form>
  `;
  const { setupBpEntry } = await import('../js/bp.js');
  const { getPayload } = await import('../js/storage.js');

  setupBpEntry();
  document.querySelector('.bp-med').click();

  const sysInput = document.querySelector('.bp-sys-after');
  const diaInput = document.querySelector('.bp-dia-after');
  assert.ok(sysInput);
  assert.ok(diaInput);

  sysInput.value = '150';
  diaInput.value = '90';

  const payload = getPayload();
  assert.equal(payload.bp_meds[0].bp_sys_after, '150');
  assert.equal(payload.bp_meds[0].bp_dia_after, '90');
});
