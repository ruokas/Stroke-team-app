import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';
import { renderAnalytics } from '../js/analytics.js';
import { t } from '../js/i18n.js';

// set up DOM and run renderAnalytics

test('renderAnalytics computes KPI values', () => {
  document.body.innerHTML = `
    <section id="analytics">
      <dd id="analytics_dtn"></dd>
      <dd id="analytics_dtd"></dd>
      <dd id="analytics_lkwd"></dd>
      <dd id="analytics_bp"></dd>
    </section>
    <input id="t_door" type="datetime-local" />
    <input id="t_thrombolysis" type="datetime-local" />
    <input id="d_time" type="datetime-local" />
    <input id="t_lkw" type="datetime-local" />
    <input id="p_bp_sys" type="number" />
    <input id="p_bp_dia" type="number" />
  `;

  document.querySelector('#t_door').value = '2024-01-01T10:00';
  document.querySelector('#t_thrombolysis').value = '2024-01-01T10:30';
  document.querySelector('#d_time').value = '2024-01-01T10:20';
  document.querySelector('#t_lkw').value = '2024-01-01T08:00';
  document.querySelector('#p_bp_sys').value = '180';
  document.querySelector('#p_bp_dia').value = '100';

  renderAnalytics();

  assert.equal(document.getElementById('analytics_dtn').textContent, '30');
  assert.equal(document.getElementById('analytics_dtd').textContent, '20');
  assert.equal(document.getElementById('analytics_lkwd').textContent, '120');
  assert.equal(document.getElementById('analytics_bp').textContent, t('yes'));
});
