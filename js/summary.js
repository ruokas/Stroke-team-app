import * as dom from './state.js';
import { showToast } from './toast.js';

export function collectSummaryData(payload) {
  const get = (v) => (v !== undefined && v !== null && v !== '' ? v : null);
  const patient = {
    personal: get(payload.a_personal),
    name: get(payload.a_name),
    dob: get(payload.a_dob),
    weight: get(payload.p_weight),
    bp: get(payload.p_bp),
    nih0: get(payload.p_nihss0 ?? payload.nihs_initial),
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
  const bpMeds = payload.bp_meds || [];
  const activation = {
    lkw: get(payload.a_lkw),
    drugs: [
      payload.a_drug_warfarin && 'Varfarinas',
      payload.a_drug_apixaban && 'Apiksabanas',
      payload.a_drug_rivaroxaban && 'Rivaroksabanas',
      payload.a_drug_dabigatran && 'Dabigatranas',
      payload.a_drug_edoxaban && 'Edoksabanas',
      payload.a_drug_unknown && 'Nežinoma',
    ].filter(Boolean),
    params: {
      glucose: get(payload.a_glucose),
      aks: get(payload.a_aks),
      hr: get(payload.a_hr),
      spo2: get(payload.a_spo2),
      temp: get(payload.a_temp),
    },
    symptoms: [
      payload.a_sym_face && 'Veido paralyžius',
      payload.a_sym_speech && 'Kalbos sutrikimas',
      payload.a_sym_commands && 'Paliepimų nevykdo',
      payload.a_sym_arm && 'Rankos silpnumas',
      payload.a_sym_leg && 'Kojos silpnumas',
      payload.a_sym_gaze && 'Žvilgsnis fiksuotas ar nukrypęs',
    ].filter(Boolean),
  };
  const arrivalSymptoms = get(payload.arrival_symptoms);
  const decision = payload.d_decision || null;
  return {
    patient,
    times,
    drugs,
    decision,
    bpMeds,
    activation,
    arrivalSymptoms,
  };
}

export function summaryTemplate({
  patient,
  times,
  drugs,
  decision,
  bpMeds,
  activation,
  arrivalSymptoms,
}) {
  const parts = [];
  parts.push(
    `PACIENTAS: ${patient.name ?? '—'} (${patient.personal ?? '—'}), gim. data: ${
      patient.dob ?? '—'
    }, svoris: ${patient.weight ?? '—'} kg, AKS atvykus: ${patient.bp ?? '—'}.`,
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

  if (bpMeds.length) {
    const bpLines = bpMeds.map((m) =>
      `${m.med} ${m.time || '—'} ${m.dose || ''}${
        m.notes ? ` (${m.notes})` : ''
      }`.trim(),
    );
    parts.push(`AKS korekcija: ${bpLines.join('; ')}.`);
  }

  const actParts = [];
  if (activation.lkw) actParts.push(activation.lkw);
  if (activation.drugs.length) actParts.push(activation.drugs.join(', '));
  const paramParts = [];
  if (activation.params.glucose)
    paramParts.push(`Gliukozė: ${activation.params.glucose}`);
  if (activation.params.aks) paramParts.push(`AKS: ${activation.params.aks}`);
  if (activation.params.hr) paramParts.push(`ŠSD: ${activation.params.hr}`);
  if (activation.params.spo2)
    paramParts.push(`SpO₂: ${activation.params.spo2}`);
  if (activation.params.temp)
    paramParts.push(`Temp: ${activation.params.temp}`);
  if (paramParts.length) actParts.push(paramParts.join(', '));
  if (actParts.length)
    parts.push(`Aktyvacijos kriterijai: ${actParts.join(', ')}.`);

  const symptomParts = [];
  if (activation.symptoms.length)
    symptomParts.push(activation.symptoms.join(', '));
  if (arrivalSymptoms) symptomParts.push(arrivalSymptoms);
  if (symptomParts.length) parts.push(`Simptomai: ${symptomParts.join('; ')}.`);

  parts.push(`NIHSS pradinis: ${patient.nih0 ?? '—'}.`);
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
