import { getInputs } from './state.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';

export function collectSummaryData(payload) {
  const get = (v) => (v !== undefined && v !== null && v !== '' ? v : null);
  const formatBp = (sys, dia) => {
    const s = get(sys);
    const d = get(dia);
    return s && d ? `${s}/${d}` : null;
  };
  const patient = {
    personal: get(payload.a_personal),
    name: get(payload.a_name),
    dob: get(payload.a_dob),
    age: get(payload.a_age),
    weight: get(payload.p_weight),
    bp: formatBp(payload.p_bp_sys, payload.p_bp_dia),
    inr: get(payload.p_inr),
    nih0: get(payload.p_nihss0 ?? payload.nihs_initial),
  };
  const times = {
    lkw: get(payload.t_lkw),
    door: get(payload.t_door),
    decision: get(payload.d_time),
    thrombolysis: get(payload.t_thrombolysis),
    gmp: get(payload.a_gmp_time),
  };
  const drugs = {
    type: payload.drug_type || '',
    totalDose: get(payload.dose_total),
    totalVol: get(payload.dose_volume),
    bolus: get(payload.tpa_bolus),
    infusion: get(payload.tpa_infusion),
  };
  const bpMeds = payload.bp_meds || [];
  const activation = {
    lkw: get(payload.a_lkw),
    drugs: [
      payload.a_drug_warfarin && 'Varfarinas (Warfarin, Orfarin)',
      payload.a_drug_apixaban && 'Apiksabanas (Eliquis)',
      payload.a_drug_rivaroxaban && 'Rivaroksabanas (Xarelto)',
      payload.a_drug_dabigatran && 'Dabigatranas (Pradaxa)',
      payload.a_drug_edoxaban && 'Edoksabanas (Lixiana)',
      payload.a_drug_unknown && 'Nežinoma',
    ].filter(Boolean),
    params: {
      glucose: get(payload.a_glucose),
      aks: formatBp(payload.a_aks_sys, payload.a_aks_dia),
      hr: get(payload.a_hr),
      spo2: get(payload.a_spo2),
      temp: get(payload.a_temp),
    },
    symptoms: [
      payload.a_sym_face && 'Veido paralyžius',
      payload.a_sym_speech && 'Kalbos sutrikimas',
      payload.a_sym_commands && 'Nevykdo paliepimų',
      payload.a_sym_arm && 'Rankos silpnumas',
      payload.a_sym_leg && 'Kojos silpnumas',
      payload.a_sym_gaze && 'Žvilgsnis fiksuotas ar nukrypęs',
    ].filter(Boolean),
  };
  const arrivalSymptoms = get(payload.arrival_symptoms);
  const arrivalContra = get(payload.arrival_contra);
  const arrivalMtContra = get(payload.arrival_mt_contra);
  const decision = payload.d_decision || null;
  return {
    patient,
    times,
    drugs,
    decision,
    bpMeds,
    activation,
    arrivalSymptoms,
    arrivalContra,
    arrivalMtContra,
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
  arrivalContra,
  arrivalMtContra,
}) {
  const lines = [];
  lines.push('PACIENTAS:');
  lines.push(`- Vardas: ${patient.name ?? '—'}`);
  lines.push(`- Asmens kodas: ${patient.personal ?? '—'}`);
  lines.push(`- Gim. data: ${patient.dob ?? '—'}`);
  if (patient.age) lines.push(`- Amžius: ${patient.age}`);
  lines.push(`- Svoris: ${patient.weight ?? '—'} kg`);
  lines.push(`- AKS atvykus: ${patient.bp ?? '—'}`);
  if (patient.inr) lines.push(`- INR: ${patient.inr}`);
  lines.push(`- NIHSS pradinis: ${patient.nih0 ?? '—'}`);

  if (
    activation.lkw ||
    activation.drugs.length ||
    activation.params.glucose ||
    activation.params.aks ||
    activation.params.hr ||
    activation.params.spo2 ||
    activation.params.temp
  ) {
    lines.push('AKTYVACIJA:');
    if (activation.lkw)
      lines.push(`- Preliminarus susirgimo laikas: ${activation.lkw}`);
    if (activation.drugs.length)
      lines.push(`- Vartojami vaistai: ${activation.drugs.join(', ')}`);
    const paramParts = [];
    if (activation.params.glucose)
      paramParts.push(`Gliukozė: ${activation.params.glucose}`);
    if (activation.params.aks) paramParts.push(`AKS: ${activation.params.aks}`);
    if (activation.params.hr) paramParts.push(`ŠSD: ${activation.params.hr}`);
    if (activation.params.spo2)
      paramParts.push(`SpO₂: ${activation.params.spo2}`);
    if (activation.params.temp)
      paramParts.push(`Temp: ${activation.params.temp}`);
    if (paramParts.length)
      lines.push(`- GMP parametrai: ${paramParts.join(', ')}`);
  }

  lines.push('LAIKAI:');
  if (times.gmp) lines.push(`- GMP iškvietimas: ${times.gmp}`);
  lines.push(`- Paskutinį kartą matytas sveikas: ${times.lkw ?? '—'}`);
  lines.push(`- Atvykimas: ${times.door ?? '—'}`);
  lines.push(`- Sprendimas: ${times.decision ?? '—'}`);
  lines.push(`- Trombolizė pradėta: ${times.thrombolysis ?? '—'}`);

  lines.push('VAISTAI:');
  const drugType = drugs.type === 'tnk' ? 'Tenekteplazė' : 'Alteplazė';
  lines.push(`- Tipas: ${drugType}`);
  const concLine = drugs.type === 'tnk' ? '5 mg/ml' : '1 mg/ml';
  lines.push(`- Koncentracija: ${concLine}`);
  lines.push(
    `- Bendra dozė: ${
      drugs.totalDose ? `${drugs.totalDose} mg` : '—'
    } (${drugs.totalVol ? `${drugs.totalVol} ml` : '—'})`,
  );
  if (drugs.bolus) lines.push(`- Bolius: ${drugs.bolus}`);
  if (drugs.infusion) lines.push(`- Infuzija: ${drugs.infusion}`);

  if (bpMeds.length) {
    lines.push('AKS KOREKCIJA:');
    bpMeds.forEach((m) =>
      lines.push(
        `- ${m.med} ${m.time || '—'} ${m.dose || ''}${
          m.unit ? ` ${m.unit}` : ''
        }${m.notes ? ` (${m.notes})` : ''}`.trim(),
      ),
    );
  }

  if (activation.symptoms.length || arrivalSymptoms) {
    lines.push('SIMPTOMAI:');
    if (arrivalSymptoms) {
      lines.push(`- ${arrivalSymptoms}`);
    } else if (activation.symptoms.length) {
      lines.push(`- ${activation.symptoms.join(', ')}`);
    }
  }

  if (arrivalContra) {
    lines.push('KONTRAINDIKACIJOS IVT:');
    lines.push(`- ${arrivalContra}`);
  }
  if (arrivalMtContra) {
    lines.push('KONTRAINDIKACIJOS MTE:');
    lines.push(`- ${arrivalMtContra}`);
  }

  lines.push('SPRENDIMAS:');
  lines.push(`- ${decision ?? '—'}`);
  return lines.join('\n');
}

export function copySummary(data) {
  const inputs = getInputs();
  if (inputs.summary) inputs.summary.value = summaryTemplate(data);
  const text = inputs.summary.value;
  if (window.isSecureContext && navigator.clipboard) {
    return navigator.clipboard
      .writeText(text)
      .then(() => text)
      .catch((err) => {
        showToast('Nepavyko nukopijuoti: ' + err, { type: 'error' });
        throw err;
      });
  } else {
    inputs.summary.select();
    const ok = document.execCommand('copy');
    if (!ok) {
      showToast('Nepavyko nukopijuoti', { type: 'error' });
      return Promise.reject(new Error('copy failed'));
    }
    return Promise.resolve(text);
  }
}

export function openPrintWindow(win) {
  const printWindow = win.open('', '', 'width=800,height=600');
  if (!printWindow) {
    showToast('Nepavyko atidaryti spausdinimo lango', { type: 'error' });
    return null;
  }
  return printWindow;
}

export function exportSummaryPDF(data, win = window) {
  const text = summaryTemplate(data);
  const printWindow = openPrintWindow(win);
  if (!printWindow) return;
  const esc = (s) =>
    s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  printWindow.document.write(`
    <html>
      <head>
        <title>Santrauka</title>
        <style>
          body { font-family: monospace; white-space: pre-wrap; padding: 16px; }
          pre { margin: 0; }
        </style>
      </head>
      <body><pre>${esc(text)}</pre></body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
}

let tokenClient;

async function loadGoogle() {
  if (window.google && window.google.accounts && window.google.accounts.oauth2)
    return;
  await new Promise((resolve, reject) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = resolve;
    script.onerror = () => reject(new Error('GIS load failed'));
    document.head.appendChild(script);
  });
}

async function getAccessToken() {
  await loadGoogle();
  return new Promise((resolve, reject) => {
    if (!window.GOOGLE_CLIENT_ID) {
      reject(new Error('Missing Google client ID'));
      return;
    }
    if (!tokenClient) {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: window.GOOGLE_CLIENT_ID,
        scope: 'https://www.googleapis.com/auth/drive.file',
        callback: (resp) => {
          if (resp.error) reject(resp);
          else resolve(resp.access_token);
        },
      });
    }
    tokenClient.callback = (resp) => {
      if (resp.error) reject(resp);
      else resolve(resp.access_token);
    };
    tokenClient.requestAccessToken();
  });
}

export async function exportSummaryToDrive(data) {
  const text = summaryTemplate(data);
  try {
    const token = await getAccessToken();
    const metadata = {
      name: `santrauka-${new Date().toISOString().slice(0, 10)}.txt`,
      mimeType: 'text/plain',
    };
    const form = new FormData();
    form.append(
      'metadata',
      new Blob([JSON.stringify(metadata)], { type: 'application/json' }),
    );
    form.append('file', new Blob([text], { type: 'text/plain' }));
    const res = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart',
      {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: form,
      },
    );
    if (!res.ok) throw new Error(await res.text());
    showToast(t('summary_drive_ok'), { type: 'success' });
  } catch (err) {
    console.error('Drive upload failed', err);
    showToast(t('summary_drive_fail'), { type: 'error' });
  }
}
