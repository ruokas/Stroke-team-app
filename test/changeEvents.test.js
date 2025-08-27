import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('setPayload bubbles change events', async () => {
  const { setPayload } = await import('../js/storage.js');

  document.body.innerHTML = '';
  const known = document.createElement('input');
  known.name = 'lkw_type';
  known.value = 'known';
  const unknown = document.createElement('input');
  unknown.name = 'lkw_type';
  unknown.value = 'unknown';
  document.body.append(known, unknown);

  let changeCount = 0;
  document.addEventListener('change', () => {
    changeCount++;
  });

  setPayload({ arrival_lkw_type: 'unknown' });

  assert.strictEqual(unknown.checked, true);
  assert.strictEqual(changeCount, 2);
});
