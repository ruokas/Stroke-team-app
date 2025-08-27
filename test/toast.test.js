import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { toast, showToast } from '../js/toast.js';

const originalShowToast = toast.showToast;

beforeEach(() => {
  // restore original showToast implementation overridden by jsdomSetup
  toast.showToast = originalShowToast;
  toast.queue = [];
  toast.showing = false;
  const container = document.getElementById('toastContainer');
  container.innerHTML = '';
});

test('queues messages and shows next on close', { concurrency: false }, async () => {
  showToast('first', { duration: 10000 });
  showToast('second', { duration: 10000 });

  const container = document.getElementById('toastContainer');
  assert.equal(container.querySelectorAll('.toast').length, 1);
  assert.match(container.querySelector('.toast').textContent, /first/);
  assert.equal(toast.queue.length, 1);

  const firstToast = container.querySelector('.toast');
  const closeBtn = firstToast.querySelector('.toast-close');
  closeBtn.dispatchEvent(new window.Event('click', { bubbles: true }));
  firstToast.dispatchEvent(new window.Event('transitionend'));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(container.querySelectorAll('.toast').length, 1);
  assert.match(container.querySelector('.toast').textContent, /second/);
});

test('shows queued toast after timeout', { concurrency: false }, async () => {
  showToast('first', { duration: 10 });
  showToast('second', { duration: 10 });

  const container = document.getElementById('toastContainer');
  assert.equal(container.querySelectorAll('.toast').length, 1);
  assert.match(container.querySelector('.toast').textContent, /first/);

  await new Promise((r) => setTimeout(r, 20));
  const firstToast = container.querySelector('.toast');
  firstToast.dispatchEvent(new window.Event('transitionend'));
  await new Promise((r) => setTimeout(r, 0));

  assert.equal(container.querySelectorAll('.toast').length, 1);
  assert.match(container.querySelector('.toast').textContent, /second/);
});

