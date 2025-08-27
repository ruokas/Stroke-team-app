import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { showModal, confirmModal, promptModal } from '../src/modal.js';

const tick = () => new Promise((r) => setTimeout(r, 0));

test(
  'showModal traps focus and cleans up on Escape',
  { concurrency: false },
  async () => {
    const outside = document.createElement('button');
    outside.className = 'btn';
    document.body.appendChild(outside);
    outside.focus();

    const promise = showModal({
      title: 'test',
      buttons: [
        { label: 'A', value: 'a', autofocus: true },
        { label: 'B', value: 'b' },
      ],
    });

    await tick();
    const overlay = document.querySelector('.modal-overlay');
    const [btnA, btnB] = overlay.querySelectorAll('button');
    assert.strictEqual(document.activeElement, btnA);

    btnB.focus();
    btnB.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, btnA);

    btnA.focus();
    btnA.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    assert.strictEqual(document.activeElement, btnB);

    btnB.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    const res = await promise;
    assert.strictEqual(res, null);
    assert.strictEqual(document.querySelector('.modal-overlay'), null);
    assert.strictEqual(document.activeElement, outside);
  },
);

test(
  'confirmModal traps focus and resolves null on Escape',
  { concurrency: false },
  async () => {
    const outside = document.createElement('button');
    outside.className = 'btn';
    document.body.appendChild(outside);
    outside.focus();

    const promise = confirmModal('Confirm?');
    await tick();
    const overlay = document.querySelector('.modal-overlay');
    const [okBtn, cancelBtn] = overlay.querySelectorAll('button');
    assert.strictEqual(document.activeElement, okBtn);

    cancelBtn.focus();
    cancelBtn.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, okBtn);

    okBtn.focus();
    okBtn.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    assert.strictEqual(document.activeElement, cancelBtn);

    cancelBtn.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    const res = await promise;
    assert.strictEqual(res, null);
    assert.strictEqual(document.querySelector('.modal-overlay'), null);
    assert.strictEqual(document.activeElement, outside);
  },
);

test(
  'promptModal traps focus across fields and resolves null on Escape',
  { concurrency: false },
  async () => {
    const outside = document.createElement('button');
    outside.className = 'btn';
    document.body.appendChild(outside);
    outside.focus();

    const promise = promptModal('Prompt', 'x');
    await tick();
    const overlay = document.querySelector('.modal-overlay');
    const input = overlay.querySelector('input');
    const [okBtn, cancelBtn] = overlay.querySelectorAll('button');
    assert.strictEqual(document.activeElement, okBtn);

    cancelBtn.focus();
    cancelBtn.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Tab', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, input);

    input.focus();
    input.dispatchEvent(
      new window.KeyboardEvent('keydown', {
        key: 'Tab',
        shiftKey: true,
        bubbles: true,
      }),
    );
    assert.strictEqual(document.activeElement, cancelBtn);

    cancelBtn.dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
    );
    const res = await promise;
    assert.strictEqual(res, null);
    assert.strictEqual(document.querySelector('.modal-overlay'), null);
    assert.strictEqual(document.activeElement, outside);
  },
);
