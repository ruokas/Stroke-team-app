import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

/*
  Regression test:
  Removing a blood pressure entry used to fail when the weight field contained
  an invalid value or was empty. The remove button acted as a submit button and
  native form validation prevented the click from firing. This test simulates a
  real user clicking the buttons so that the regression is caught if the button
  loses type="button" again.
*/

test('bp entry can be removed even when #p_weight is invalid or empty', async () => {
  const origClick = window.HTMLButtonElement.prototype.click;
  window.HTMLButtonElement.prototype.click = function () {
    // Simulate native validation: submit buttons won't click when form invalid
    if (this.type === 'submit') {
      const form = this.form;
      if (form && !form.checkValidity()) return;
    }
    return origClick.call(this);
  };

  document.body.innerHTML = `
    <form>
      <input id="p_weight" type="text" pattern="\\d+" required />
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

  window.HTMLButtonElement.prototype.click = origClick;
});
