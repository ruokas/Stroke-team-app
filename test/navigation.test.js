import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { setupNavigation } from '../src/navigation.js';

test(
  'arrow key navigation updates focus, sections and hash',
  { concurrency: false },
  () => {
    // reset url
    window.history.replaceState(null, '', 'http://localhost/');

    document.body.innerHTML = `
    <button id="navToggle" class="btn"></button>
    <nav>
      <a href="#sec1" class="tab" data-section="sec1">One</a>
      <a href="#sec2" class="tab" data-section="sec2">Two</a>
      <a href="#sec3" class="tab" data-section="sec3">Three</a>
    </nav>
    <main>
      <section id="sec1"></section>
      <section id="sec2" class="hidden"></section>
      <section id="sec3" class="hidden"></section>
    </main>
  `;

    const inputs = { summary: { value: '' }, d_time: { value: '' } };
    global.location = window.location;
    global.history = window.history;
    const { activateFromHash } = setupNavigation(inputs);
    activateFromHash();

    const tabs = document.querySelectorAll('nav .tab');
    const sections = document.querySelectorAll('main > section');

    // Initial state: first section visible
    assert.ok(!sections[0].classList.contains('hidden'));
    assert.ok(sections[1].classList.contains('hidden'));

    // Move to next tab with ArrowRight
    tabs[0].focus();
    tabs[0].dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, tabs[1]);
    assert.ok(sections[0].classList.contains('hidden'));
    assert.ok(!sections[1].classList.contains('hidden'));
    assert.strictEqual(window.location.hash, '#sec2');

    // Move back with ArrowLeft
    tabs[1].dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, tabs[0]);
    assert.ok(!sections[0].classList.contains('hidden'));
    assert.ok(sections[1].classList.contains('hidden'));
    assert.strictEqual(window.location.hash, '#sec1');

    // Wrap around: ArrowLeft from first goes to last
    tabs[0].dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowLeft', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, tabs[2]);
    assert.ok(sections[0].classList.contains('hidden'));
    assert.ok(!sections[2].classList.contains('hidden'));
    assert.strictEqual(window.location.hash, '#sec3');

    // Wrap around forward: ArrowRight from last goes to first
    tabs[2].dispatchEvent(
      new window.KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }),
    );
    assert.strictEqual(document.activeElement, tabs[0]);
    assert.ok(!sections[0].classList.contains('hidden'));
    assert.ok(sections[2].classList.contains('hidden'));
    assert.strictEqual(window.location.hash, '#sec1');
  },
);
