import { test } from 'node:test';
import assert from 'node:assert/strict';

function createEl() {
  return {
    value: '',
    classList: {
      classes: new Set(),
      add(c) {
        this.classes.add(c);
      },
      remove(c) {
        this.classes.delete(c);
      },
      contains(c) {
        return this.classes.has(c);
      },
    },
    setCustomValidity: () => {},
  };
}

async function loadModule() {
  global.document = {
    querySelector: () => null,
    querySelectorAll: () => [],
    getElementById: () => null,
  };
  return import('../js/activation.js');
}

test('validateGlucose enforces 2.8-22 range', async () => {
  const { validateGlucose } = await loadModule();
  const el = createEl();
  el.value = '1';
  validateGlucose(el);
  assert(el.classList.contains('invalid'));
  el.value = '5';
  validateGlucose(el);
  assert(!el.classList.contains('invalid'));
});

test('validateAks requires systolic/diastolic format', async () => {
  const { validateAks } = await loadModule();
  const el = createEl();
  el.value = '120';
  validateAks(el);
  assert(el.classList.contains('invalid'));
  el.value = '120/80';
  validateAks(el);
  assert(!el.classList.contains('invalid'));
});

test('validateHr checks 30-250 bpm', async () => {
  const { validateHr } = await loadModule();
  const el = createEl();
  el.value = '10';
  validateHr(el);
  assert(el.classList.contains('invalid'));
  el.value = '70';
  validateHr(el);
  assert(!el.classList.contains('invalid'));
});

test('validateSpo2 checks 50-100%', async () => {
  const { validateSpo2 } = await loadModule();
  const el = createEl();
  el.value = '30';
  validateSpo2(el);
  assert(el.classList.contains('invalid'));
  el.value = '98';
  validateSpo2(el);
  assert(!el.classList.contains('invalid'));
});

test('validateTemp checks 30-43°C', async () => {
  const { validateTemp } = await loadModule();
  const el = createEl();
  el.value = '25';
  validateTemp(el);
  assert(el.classList.contains('invalid'));
  el.value = '37';
  validateTemp(el);
  assert(!el.classList.contains('invalid'));
});

