import * as dom from './state.js';
import { showToast } from './toast.js';

export function collectSummaryData() {
  const inputs = dom.getInputs();
  const get = (el) => (el && el.value ? el.value : null);
  const patient = {
    dob: get(inputs.a_dob),
    weight: get(inputs.weight),
    bp: get(inputs.bp),
    nih0: get(inputs.nih0),
  };
  const times = {
    lkw: get(inputs.lkw),
    door: get(inputs.door),
    decision: get(inputs.d_time),
    thrombolysis: get(inputs.t_thrombolysis),
  };
  const drugs = {
    type: inputs.drugType?.value || '',
    conc: get(inputs.drugConc),
    totalDose: get(inputs.doseTotal),
    totalVol: get(inputs.doseVol),
    bolus: get(inputs.tpaBolus),
    infusion: get(inputs.tpaInf),
  };
  const decision =
    (inputs.d_decision || []).find((n) => n.checked)?.value || null;
  return { patient, times, drugs, decision };
}

export function summaryTemplate({ patient, times, drugs, decision }) {
  const parts = [];
  parts.push(
    `PACIENTAS: gim. data: ${patient.dob ?? '—'}, svoris: ${
      patient.weight ?? '—'
    } kg, AKS atvykus: ${patient.bp ?? '—'}. NIHSS pradinis: ${
      patient.nih0 ?? '—'
    }.`,
  );
  parts.push(
    `LAIKAI: LKW: ${times.lkw ?? '—'}, Atvykimas: ${times.door ?? '—'}, Sprendimas: ${
      times.decision ?? '—'
    }, Trombolizė pradėta: ${times.thrombolysis ?? '—'}.`,
  );
  const drugType = drugs.type === 'tnk' ? 'Tenekteplazė' : 'Alteplazė';
  const drugParts = [`VAISTAI: ${drugType}.`];
  drugParts.push(
    `Koncentracija: ${drugs.conc ? `${drugs.conc} mg/ml` : '—'}. Bendra dozė: ${
      drugs.totalDose ? `${drugs.totalDose} mg` : '—'
    } (${drugs.totalVol ? `${drugs.totalVol} ml` : '—'}).`,
  );
  if (drugs.bolus) drugParts.push(`Bolius: ${drugs.bolus}.`);
  if (drugs.infusion) drugParts.push(`Infuzija: ${drugs.infusion}.`);
  parts.push(drugParts.join(' '));
  if (decision) parts.push(`SPRENDIMAS: ${decision}.`);
  return parts.join('\n');
}

export function genSummary() {
  const inputs = dom.getInputs();
  const data = collectSummaryData();
  if (inputs.summary) inputs.summary.value = summaryTemplate(data);
  return data;
}

export function copySummary() {
  const inputs = dom.getInputs();
  genSummary();
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(inputs.summary.value).catch((err) => {
      showToast('Nepavyko nukopijuoti: ' + err, { type: 'error' });
    });
  } else {
    inputs.summary.select();
    const ok = document.execCommand('copy');
    if (!ok) showToast('Nepavyko nukopijuoti', { type: 'error' });
  }
}
