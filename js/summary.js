import * as dom from './state.js';
import { showToast } from './toast.js';

export function collectSummaryData(payload) {
  const get = (v) => (v ? v : null);
  const patient = {
    personal: get(payload.a_personal),
    name: get(payload.a_name),
    dob: get(payload.a_dob),
    weight: get(payload.p_weight),
    bp: get(payload.p_bp),
    nih0: get(payload.p_nihss0),
  };
  const times = {
    lkw: get(payload.t_lkw),
    door: get(payload.t_door),
    decision: get(payload.d_time),
    thrombolysis: get(payload.t_thrombolysis),
  };
  const drugs = {
    type: payload.drug_type || '',
    conc: get(payload.drug_conc),
    totalDose: get(payload.dose_total),
    totalVol: get(payload.dose_volume),
    bolus: get(payload.tpa_bolus),
    infusion: get(payload.tpa_infusion),
  };
  const decision = payload.d_decision || null;
  return { patient, times, drugs, decision };
}

export function summaryTemplate({ patient, times, drugs, decision }) {
  const parts = [];
  parts.push(
    `PACIENTAS: ${patient.name ?? '—'} (${patient.personal ?? '—'}), gim. data: ${
      patient.dob ?? '—'
    }, svoris: ${patient.weight ?? '—'} kg, AKS atvykus: ${
      patient.bp ?? '—'
    }. NIHSS pradinis: ${patient.nih0 ?? '—'}.`,
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

export function copySummary(data) {
  const inputs = dom.getInputs();
  if (inputs.summary) inputs.summary.value = summaryTemplate(data);
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(inputs.summary.value).catch((err) => {
      showToast('Nepavyko nukopijuoti: ' + err, { type: 'error' });
    });
  } else {
    inputs.summary.select();
    const ok = document.execCommand('copy');
    if (!ok) showToast('Nepavyko nukopijuoti', { type: 'error' });
  }
  return inputs.summary.value;
}
