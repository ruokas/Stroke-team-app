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
  const ctClear = document.querySelector(
    'input[name="ct_result"][value="clear"]',
  );
  ctClear.checked = true;
  ctClear.dispatchEvent(new Event('change', { bubbles: true }));
  const ktaLvo = document.querySelector(
    'input[name="kta_result"][value="lvo"]',
  );
  ktaLvo.checked = true;
  ktaLvo.dispatchEvent(new Event('change', { bubbles: true }));

  const bpEntries = document.getElementById('bpEntries');
  bpEntries.innerHTML = `<div class="bp-entry"><strong>Nifedipinas</strong><input value="10:00" /><div class="input-group flex-nowrap"><input value="25" data-unit="mg" placeholder="mg" /><span class="unit">mg</span></div><div class="input-group flex-nowrap bp-after"><input name="bp_sys_after" value="150" /><input name="bp_dia_after" value="90" /></div><input value="požymai" /></div>`;

  inputs.a_personal.value = '12345678901';
  inputs.a_name.value = 'Jonas Jonaitis';
  inputs.a_dob.value = '1980-01-01';
  inputs.weight.value = '80';
  inputs.bp_sys.value = '120';
  inputs.bp_dia.value = '80';
  inputs.nih0.value = '0';
  inputs.a_warfarin.checked = true;
  inputs.a_glucose.value = '5';
  inputs.a_aks_sys.value = '140';
  inputs.a_aks_dia.value = '90';
  inputs.a_hr.value = '80';
  inputs.a_spo2.value = '98';
  inputs.a_temp.value = '37';
  inputs.arrival_symptoms.value = 'Dešinės rankos silpnumas';
  inputs.lkw.value = '2024-01-01T07:00';
  inputs.door.value = '2024-01-01T08:00';
  inputs.d_time.value = '2024-01-01T08:40';
  inputs.d_department.value = 'Neurologijos skyrius';
  inputs.drugType.value = 'tnk';
  inputs.doseTotal.value = '20';
  inputs.doseVol.value = '4';
  inputs.perf_core.value = '12';
  inputs.perf_penumbra.value = '80';

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
    summary.includes('AKS KOREKCIJA:\n- Nifedipinas 10:00 25 mg (požymai)'),
  );
  assert(
    summary.includes('AKTYVACIJA:\n- Preliminarus susirgimo laikas: <4.5'),
  );
  assert(
    summary.includes('- Vartojami vaistai: Varfarinas (Warfarin, Orfarin)'),
  );
  assert(
    summary.includes(
      '- GMP parametrai: Gliukozė: 5, AKS: 140/90, ŠSD: 80, SpO₂: 98, Temp: 37',
    ),
  );
  assert(summary.includes('SIMPTOMAI:\n- Dešinės rankos silpnumas'));
  assert(!summary.includes('Veido paralyžius'));
  assert(
    summary.includes(
      'VAIZDINIAI TYRIMAI:\n- KT: Be kraujavimo\n- KTA: Didelės arterijos okliuzija\n- Perfuzija: Infarkto branduolys 12 ml, Penumbra 80 ml',
    ),
  );
  assert(
    summary.includes('SPRENDIMAS:\n- Taikoma IVT, indikacijų MTE nenustatyta'),
  );
  assert(summary.includes('- Stacionarizacija: Neurologijos skyrius'));
});
