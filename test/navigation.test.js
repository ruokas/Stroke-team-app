import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { setupNavigation } from '../js/navigation.js';

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

test('falls back to first section when hash is invalid', () => {
  window.history.replaceState(null, '', 'http://localhost/#missing');
  document.body.innerHTML = `
    <button id="navToggle" class="btn"></button>
    <nav>
      <a href="#sec1" class="tab" data-section="sec1">One</a>
      <a href="#sec2" class="tab" data-section="sec2">Two</a>
    </nav>
    <main>
      <section id="sec1"></section>
      <section id="sec2" class="hidden"></section>
    </main>
  `;

  const inputs = { summary: { value: '' }, d_time: { value: '' } };
  global.location = window.location;
  global.history = window.history;
  const { activateFromHash } = setupNavigation(inputs);
  activateFromHash();

  const sections = document.querySelectorAll('main > section');
  assert.ok(!sections[0].classList.contains('hidden'));
  assert.ok(sections[1].classList.contains('hidden'));
  assert.strictEqual(window.location.hash, '#sec1');
});

test('collapses and expands nav on small screens', () => {
  window.innerWidth = 1024;
  document.body.innerHTML = `
    <nav id="mainNav">
      <a href="#s1" class="tab">One</a>
    </nav>
    <main><section id="s1"></section></main>
  `;

  const inputs = { summary: { value: '' }, d_time: { value: '' } };
  setupNavigation(inputs);

  const link = document.querySelector('nav .tab');
  const evt = new window.MouseEvent('click', {
    bubbles: true,
    cancelable: true,
  });
  const prevented = !link.dispatchEvent(evt);
  assert.ok(prevented);
  assert.ok(!document.body.classList.contains('nav-collapsed'));

  document.body.dispatchEvent(
    new window.MouseEvent('click', { bubbles: true }),
  );
  assert.ok(document.body.classList.contains('nav-collapsed'));
});

test('mobile: closes menu and updates aria after tab selection', () => {
  window.innerWidth = 375;
  document.body.innerHTML = `
    <button id="navToggle" class="btn" aria-expanded="true"></button>
    <nav id="mainNav" role="tablist">
      <a href="#s1" class="tab" data-section="s1">One</a>
    </nav>
    <main>
      <section id="s1"></section>
    </main>
  `;

  const inputs = { summary: { value: '' }, d_time: { value: '' } };
  const { activateFromHash } = setupNavigation(inputs);
  activateFromHash();

  document.body.classList.add('nav-open');
  const tab = document.querySelector('nav .tab');
  tab.dispatchEvent(new window.MouseEvent('click', { bubbles: true, cancelable: true }));

  // menu closed
  assert.ok(!document.body.classList.contains('nav-open'));
  // aria reflects closure
  const toggle = document.getElementById('navToggle');
  assert.strictEqual(toggle.getAttribute('aria-expanded'), 'false');
  // section activated
  assert.strictEqual(window.location.hash, '#s1');
});

test('tablet: single tap on tab expands and activates', () => {
  window.innerWidth = 1024;
  window.history.replaceState(null, '', 'http://localhost/');
  document.body.innerHTML = `
    <button id="navToggle" class="btn" aria-expanded="false"></button>
    <nav id="mainNav" role="tablist">
      <a href="#s1" class="tab" data-section="s1">One</a>
      <a href="#s2" class="tab" data-section="s2">Two</a>
    </nav>
    <main>
      <section id="s1"></section>
      <section id="s2" class="hidden"></section>
    </main>
  `;

  const inputs = { summary: { value: '' }, d_time: { value: '' } };
  setupNavigation(inputs);

  // Initially collapsed by setup
  assert.ok(document.body.classList.contains('nav-collapsed'));

  const tab2 = document.querySelectorAll('nav .tab')[1];
  const evt = new window.MouseEvent('click', { bubbles: true, cancelable: true });
  const result = tab2.dispatchEvent(evt);

  // Default prevented due to our handler
  assert.ok(!result);
  // Expanded
  assert.ok(!document.body.classList.contains('nav-collapsed'));
  // Activated to s2
  assert.strictEqual(window.location.hash, '#s2');
});