import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';

import { initSymptomButtons } from '../js/arrival.js';

test('symptom buttons sync with textarea both ways', () => {
  const dom = new JSDOM(`<!DOCTYPE html><body>
    <textarea id="arrival_symptoms">Dešinės rankos silpnumas, Kalbos sutrikimas</textarea>
    <label><input type="checkbox" name="arrival_symptom" value="Rankos silpnumas"></label>
    <label><input type="checkbox" name="arrival_symptom" value="Kalbos sutrikimas"></label>
    <label><input type="radio" name="arrival_symptom_side" value="left"></label>
    <label><input type="radio" name="arrival_symptom_side" value="right"></label>
  </body>`);
  const { document, Event } = dom.window;
  global.document = document;
  initSymptomButtons();
  const boxes = document.querySelectorAll('input[name="arrival_symptom"]');
  const textarea = document.getElementById('arrival_symptoms');
  const sides = document.querySelectorAll('input[name="arrival_symptom_side"]');
  // initial text should check boxes and side
  assert(boxes[0].checked);
  assert(boxes[1].checked);
  assert(sides[1].checked);
  // uncheck first box -> textarea updates
  boxes[0].checked = false;
  boxes[0].dispatchEvent(new Event('change'));
  assert.equal(textarea.value, 'Kalbos sutrikimas');
  // edit textarea -> boxes and side update
  textarea.value = 'Kairės rankos silpnumas';
  textarea.dispatchEvent(new Event('input'));
  assert(boxes[0].checked);
  assert(!boxes[1].checked);
  assert(sides[0].checked);
});
