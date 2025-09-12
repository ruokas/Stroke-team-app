import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('copySummary builds data object and copies formatted text', async () => {
  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { getPayload } = await import('../js/storage.js');
  const { collectSummaryData, summaryTemplate, copySummary } = await import(
    '../js/summary.js'
  );

  document.querySelector(
    'input[name="d_decision"][value="Taikoma IVT, indikacijų MTE nenustatyta"]',
  ).checked = true;
  document.querySelector('input[name="a_lkw"][value="<4.5"]').checked = true;
  document.querySelector('input[name="a_face"]').checked = true;
  document.querySelector('input[name="a_speech"]').checked = true;

  const bpEntries = document.getElementById('bpEntries');
  bpEntries.innerHTML = `<div class="bp-entry"><strong>Kaptoprilis</strong><input value="10:00" /><div class="input-group flex-nowrap"><input value="25" data-unit="mg" placeholder="mg" /><span class="unit">mg</span></div><div class="input-group flex-nowrap bp-after"><input name="bp_sys_after" value="150" /><input name="bp_dia_after" value="90" /></div><input value="požymai" /></div>`;

  inputs.a_personal.value = '12345678901';
  inputs.a_name.value = 'Jonas Jonaitis';
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp_sys.value = '120';
  inputs.bp_dia.value = '80';
  inputs.nih0.value = '0';
  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  inputs.d_department.value = 'Neurologijos skyrius';
  inputs.t_thrombolysis.value = '2024-01-01T09:00';
  inputs.a_warfarin.checked = true;
  inputs.a_glucose.value = '5';
  inputs.a_aks_sys.value = '140';
  inputs.a_aks_dia.value = '90';
  inputs.a_hr.value = '80';
  inputs.a_spo2.value = '98';
  inputs.a_temp.value = '37';
  inputs.arrival_symptoms.value = 'Dešinės rankos silpnumas';
  inputs.drugType.value = 'tnk';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  const data = collectSummaryData(getPayload());
  assert.deepEqual(data, {
    patient: {
      personal: '12345678901',
      name: 'Jonas Jonaitis',
      dob: '1980-01-01',
      age: null,
      weight: '80',
      bp: '120/80',
      inr: null,
      nih0: '0',
      independent: null,
    },
    times: {
      lkw: '2024-01-01T07:00',
      door: '2024-01-01T08:00',
      decision: '2024-01-01T08:40',
      thrombolysis: '2024-01-01T09:00',
      gmp: null,
    },
    drugs: {
      type: 'tnk',
      totalDose: '20',
      totalVol: '4',
      bolus: null,
      infusion: null,
    },
    decision: 'Taikoma IVT, indikacijų MTE nenustatyta',
    department: 'Neurologijos skyrius',
    bpMeds: [
      {
        time: '10:00',
        med: 'Kaptoprilis',
        dose: '25',
        unit: 'mg',
        bp_sys_after: '150',
        bp_dia_after: '90',
        notes: 'požymai',
      },
    ],
    activation: {
      lkw: '<4.5',
      drugs: ['Varfarinas (Warfarin, Orfarin)'],
      params: {
        glucose: '5',
        aks: '140/90',
        hr: '80',
        spo2: '98',
        temp: '37',
      },
      symptoms: ['Veido paralyžius', 'Kalbos sutrikimas'],
    },
    arrivalSymptoms: 'Dešinės rankos silpnumas',
    arrivalContra: null,
    arrivalMtContra: null,
    complications: null,
    compTime: null,
  });

  const expected = summaryTemplate(data);
  const copied = await copySummary(data);
  assert.equal(global.__copied, expected);
  assert.equal(inputs.summary.value, expected);
  assert.equal(copied, expected);
});
