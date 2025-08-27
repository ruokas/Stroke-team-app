import { test } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import { autoSetContraDecision } from '../src/decision.js';

test('selects contraindicated decision when contraindication checked', () => {
  const dom = new JSDOM(
    `<!doctype html><input type="radio" name="lkw_type" value="known" checked><input type="radio" name="lkw_type" value="unknown"><input type="checkbox" name="arrival_contra"><input type="radio" name="d_decision" value="Reperfuzinis gydymas kontraindikuotinas, taikyti konservatyvią taktika"><input type="radio" name="d_decision" value="other">`,
  );
  const { document, Event } = dom.window;
  global.Event = Event;
  const lkw = Array.from(document.querySelectorAll('input[name="lkw_type"]'));
  const contra = Array.from(
    document.querySelectorAll('input[name="arrival_contra"]'),
  );
  const decision = Array.from(
    document.querySelectorAll('input[name="d_decision"]'),
  );
  autoSetContraDecision({
    lkwTypeInputs: lkw,
    arrivalContraInputs: contra,
    decisionInputs: decision,
  });
  assert.equal(decision[0].checked, false);
  contra[0].checked = true;
  autoSetContraDecision({
    lkwTypeInputs: lkw,
    arrivalContraInputs: contra,
    decisionInputs: decision,
  });
  assert.equal(decision[0].checked, true);
});

test('selects contraindicated decision when onset unknown', () => {
  const dom = new JSDOM(
    `<!doctype html><input type="radio" name="lkw_type" value="known"><input type="radio" name="lkw_type" value="unknown" checked><input type="checkbox" name="arrival_contra"><input type="radio" name="d_decision" value="Reperfuzinis gydymas kontraindikuotinas, taikyti konservatyvią taktika"><input type="radio" name="d_decision" value="other">`,
  );
  const { document, Event } = dom.window;
  global.Event = Event;
  const lkw = Array.from(document.querySelectorAll('input[name="lkw_type"]'));
  const contra = Array.from(
    document.querySelectorAll('input[name="arrival_contra"]'),
  );
  const decision = Array.from(
    document.querySelectorAll('input[name="d_decision"]'),
  );
  autoSetContraDecision({
    lkwTypeInputs: lkw,
    arrivalContraInputs: contra,
    decisionInputs: decision,
  });
  assert.equal(decision[0].checked, true);
});
