import { test } from 'node:test';
import assert from 'node:assert/strict';
import './jsdomSetup.js';

test('summaryTemplate generates summary text correctly', async () => {
  const { getInputs } = await import('../js/state.js');
  const inputs = getInputs();
  const { getPayload } = await import('../js/storage.js');
  const { collectSummaryData, summaryTemplate } = await import(
    '../js/summary.js'
  );

  document.querySelector(
    'input[name="d_decision"][value="Taikoma IVT, indikacijų MTE nenustatyta"]',
  ).checked = true;
  document.querySelector('input[name="a_lkw"][value="<4.5"]').checked = true;
  document.querySelector('input[name="a_face"]').checked = true;
  document.querySelector('input[name="a_speech"]').checked = true;

  const bpEntries = document.getElementById('bpEntries');
  bpEntries.innerHTML = `<div class="bp-entry"><strong>Kaptoprilis</strong><input value="10:00" /><input value="25 mg" /><input value="požymai" /></div>`;

  inputs.a_personal.value = '12345678901';
  inputs.a_name.value = 'Jonas Jonaitis';
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp.value = '120/80';
  inputs.nih0.value = '0';
  inputs.a_warfarin.checked = true;
  inputs.a_glucose.value = '5';
  inputs.a_aks.value = '140/90';
  inputs.a_hr.value = '80';
  inputs.a_spo2.value = '98';
  inputs.a_temp.value = '37';
  inputs.arrival_symptoms.value = 'Dešinės rankos silpnumas';
  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  inputs.drugType.value = 'tnk';
  inputs.drugConc.value = '5';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';

  const data = collectSummaryData(getPayload());
  const summary = summaryTemplate(data);

  assert(summary.includes('PACIENTAS:\n- Vardas: Jonas Jonaitis'));
  assert(summary.includes('- Asmens kodas: 12345678901'));
  assert(summary.includes('- Svoris: 80 kg'));
  assert(summary.includes('- AKS atvykus: 120/80'));
  assert(summary.includes('- NIHSS pradinis: 0'));
  assert(summary.includes('VAISTAI:\n- Tipas: Tenekteplazė'));
  assert(summary.includes('- Koncentracija: 5 mg/ml'));
  assert(summary.includes('- Bendra dozė: 20 mg (4 ml)'));
  assert(
    summary.includes('AKS KOREKCIJA:\n- Kaptoprilis 10:00 25 mg (požymai)'),
  );
  assert(
    summary.includes('AKTYVACIJA:\n- Preliminarus susirgimo laikas: <4.5'),
  );
  assert(summary.includes('- Vartojami vaistai: Varfarinas'));
  assert(
    summary.includes(
      '- GMP parametrai: Gliukozė: 5, AKS: 140/90, ŠSD: 80, SpO₂: 98, Temp: 37',
    ),
  );
  assert(summary.includes('SIMPTOMAI:\n- Veido paralyžius, Kalbos sutrikimas'));
  assert(summary.includes('- Dešinės rankos silpnumas'));
  assert(
    summary.includes('SPRENDIMAS:\n- Taikoma IVT, indikacijų MTE nenustatyta'),
  );
});
