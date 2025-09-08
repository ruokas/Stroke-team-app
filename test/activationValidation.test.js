import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import './jsdomSetup.js';

async function loadModule() {
  return import('../js/activation.js');
}

test('validateGlucose enforces 2.8-22 range', async () => {
  const { validateGlucose } = await loadModule();
  const el = document.createElement('input');
  el.value = '1';
  validateGlucose(el);
  assert(el.classList.contains('invalid'));
  el.value = '25';
  validateGlucose(el);
  assert(el.classList.contains('invalid'));
  el.value = '5';
  validateGlucose(el);
  assert(!el.classList.contains('invalid'));
});

test('validateAksSys checks 30-300', async () => {
  const { validateAksSys } = await loadModule();
  const el = document.createElement('input');
  el.value = '10';
  validateAksSys(el);
  assert(el.classList.contains('invalid'));
  el.value = '350';
  validateAksSys(el);
  assert(el.classList.contains('invalid'));
  el.value = '120';
  validateAksSys(el);
  assert(!el.classList.contains('invalid'));
});

test('validateAksDia checks 10-200', async () => {
  const { validateAksDia } = await loadModule();
  const el = document.createElement('input');
  el.value = '5';
  validateAksDia(el);
  assert(el.classList.contains('invalid'));
  el.value = '250';
  validateAksDia(el);
  assert(el.classList.contains('invalid'));
  el.value = '80';
  validateAksDia(el);
  assert(!el.classList.contains('invalid'));
});

test('validateHr checks 30-250 bpm', async () => {
  const { validateHr } = await loadModule();
  const el = document.createElement('input');
  el.value = '10';
  validateHr(el);
  assert(el.classList.contains('invalid'));
  el.value = '260';
  validateHr(el);
  assert(el.classList.contains('invalid'));
  el.value = '70';
  validateHr(el);
  assert(!el.classList.contains('invalid'));
});

test('validateSpo2 checks 50-100%', async () => {
  const { validateSpo2 } = await loadModule();
  const el = document.createElement('input');
  el.value = '30';
  validateSpo2(el);
  assert(el.classList.contains('invalid'));
  el.value = '101';
  validateSpo2(el);
  assert(el.classList.contains('invalid'));
  el.value = '98';
  validateSpo2(el);
  assert(!el.classList.contains('invalid'));
});

test('validateTemp checks 30-43°C', async () => {
  const { validateTemp } = await loadModule();
  const el = document.createElement('input');
  el.value = '25';
  validateTemp(el);
  assert(el.classList.contains('invalid'));
  el.value = '45';
  validateTemp(el);
  assert(el.classList.contains('invalid'));
  el.value = '37';
  validateTemp(el);
  assert(!el.classList.contains('invalid'));
});

test('activation parameter inputs have numeric attributes', async () => {
  const html = await fs.readFile('templates/sections/activation.njk', 'utf8');
  function getInput(id) {
    const regex = new RegExp(`<input[^>]*id="${id}"[^>]*>`, 'm');
    const match = html.match(regex);
    assert.ok(match, `Input ${id} not found`);
    return match[0];
  }

  let input = getInput('a_glucose');
  assert.match(input, /type="number"/);
  assert.match(input, /step="0.1"/);
  assert.match(input, /min="2.8"/);
  assert.match(input, /max="22"/);
  assert.match(input, /placeholder="mmol\/l"/);

  input = getInput('a_hr');
  assert.match(input, /type="number"/);
  assert.match(input, /step="1"/);
  assert.match(input, /min="30"/);
  assert.match(input, /max="250"/);
  assert.match(input, /placeholder="bpm"/);

  input = getInput('a_spo2');
  assert.match(input, /type="number"/);
  assert.match(input, /step="1"/);
  assert.match(input, /min="50"/);
  assert.match(input, /max="100"/);
  assert.match(input, /placeholder="%"/);

  input = getInput('a_temp');
  assert.match(input, /type="number"/);
  assert.match(input, /step="0.1"/);
  assert.match(input, /min="30"/);
  assert.match(input, /max="43"/);
  assert.match(input, /placeholder="°C"/);

  input = getInput('a_aks_sys');
  assert.match(input, /type="number"/);
  assert.match(input, /step="1"/);
  assert.match(input, /min="30"/);
  assert.match(input, /max="300"/);
  assert.match(
    html,
    new RegExp(
      `<input[^>]*id="a_aks_sys"[\\s\\S]*?<span class="unit">mmHg<\\/span>`,
    ),
  );

  input = getInput('a_aks_dia');
  assert.match(input, /type="number"/);
  assert.match(input, /step="1"/);
  assert.match(input, /min="10"/);
  assert.match(input, /max="200"/);
  assert.match(
    html,
    new RegExp(
      `<input[^>]*id="a_aks_dia"[\\s\\S]*?<span class="unit">mmHg<\\/span>`,
    ),
  );
});
