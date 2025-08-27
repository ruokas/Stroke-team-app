import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import './jsdomSetup.js';

test('validateInr enforces 0.8-10', async () => {
  const { validateInr } = await import('../js/thrombolysis.js');
  const el = document.createElement('input');
  el.value = '0.5';
  validateInr(el);
  assert(el.classList.contains('invalid'));
  el.value = '12';
  validateInr(el);
  assert(el.classList.contains('invalid'));
  el.value = '1.2';
  validateInr(el);
  assert(!el.classList.contains('invalid'));
});

test('thrombolysis inputs have validation attributes', async () => {
  const html = await fs.readFile('templates/sections/thrombolysis.njk', 'utf8');
  function getInput(id) {
    const regex = new RegExp(`<input[^>]*id="${id}"[^>]*>`, 'm');
    const match = html.match(regex);
    assert.ok(match, `Input ${id} not found`);
    return match[0];
  }

  let input = getInput('p_weight');
  assert.match(input, /required/);
  assert.match(input, /min="1"/);
  assert.match(input, /max="300"/);

  input = getInput('p_bp');
  assert.match(input, /required/);
  assert.match(input, /inputmode="numeric"/);

  input = getInput('p_inr');
  assert.match(input, /required/);
  assert.match(input, /min="0.8"/);
  assert.match(input, /max="10"/);

  input = getInput('drug_conc');
  assert.match(input, /required/);
  assert.match(input, /min="0.01"/);
});
