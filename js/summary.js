import { getInputs } from './state.js';
import { showToast } from './toast.js';
import { t } from './i18n.js';

const hasValue = (value) =>
  value !== undefined && value !== null && value !== '';

export function collectSummaryData(payload) {
  const get = (v) => (hasValue(v) ? v : null);
  const formatBp = (sys, dia) => {
    const s = get(sys);
    const d = get(dia);
    return s && d ? `${s}/${d}` : null;
  };
  const independent = payload.a_independent ?? payload.p_independent;
  const patient = {
    personal: get(payload.a_personal),
    name: get(payload.a_name),
    dob: get(payload.a_dob),
    age: get(payload.a_age),
    weight: get(payload.p_weight),
    bp: formatBp(payload.p_bp_sys, payload.p_bp_dia),
    inr: get(payload.p_inr),
    nih0: get(payload.p_nihss0 ?? payload.nihs_initial),
    mrs: get(payload.p_mrs),
    independent: get(independent),
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
      payload.a_drug_warfarin && t('summary_drug_warfarin'),
      payload.a_drug_apixaban && t('summary_drug_apixaban'),
      payload.a_drug_rivaroxaban && t('summary_drug_rivaroxaban'),
      payload.a_drug_dabigatran && t('summary_drug_dabigatran'),
      payload.a_drug_edoxaban && t('summary_drug_edoxaban'),
      payload.a_drug_unknown && t('summary_drug_unknown'),
    ].filter(Boolean),
    params: {
      glucose: get(payload.a_glucose),
      aks: formatBp(payload.a_aks_sys, payload.a_aks_dia),
      hr: get(payload.a_hr),
      spo2: get(payload.a_spo2),
      temp: get(payload.a_temp),
    },
    symptoms: [
      payload.a_sym_face && t('summary_symptom_face'),
      payload.a_sym_speech && t('summary_symptom_speech'),
      payload.a_sym_commands && t('summary_symptom_commands'),
      payload.a_sym_arm && t('summary_symptom_arm'),
      payload.a_sym_leg && t('summary_symptom_leg'),
      payload.a_sym_gaze && t('summary_symptom_gaze'),
    ].filter(Boolean),
  };
  const arrivalSymptoms = get(payload.arrival_symptoms);
  const arrivalContra = get(payload.arrival_contra);
  const arrivalMtContra = get(payload.arrival_mt_contra);
  const arrivalSource = get(payload.arrival_source);
  const arrivalPrenotify = payload.arrival_ems_prenotify ?? null;
  const complications = get(payload.complications);
  const compTime = get(payload.t_complication);
  const decision = payload.d_decision || null;
  const nextCare = payload.d_next_care || null;
  const department = payload.d_department || null;
  const transferInfo = get(payload.d_transfer_info);
  const thrombolysisLocation = get(payload.thrombolysis_location);
  const imaging = {
    ct: get(payload.ct_result),
    kta: get(payload.kta_result),
    ktaSide: get(payload.kta_side),
    ktaVessels: get(payload.kta_vessels),
    perfCore: get(payload.perf_core),
    perfPenumbra: get(payload.perf_penumbra),
  };
  return {
    patient,
    times,
    drugs,
    decision,
    nextCare,
    department,
    transferInfo,
    bpMeds,
    activation,
    arrivalSymptoms,
    arrivalContra,
    arrivalMtContra,
    arrivalSource,
    arrivalPrenotify,
    complications,
    compTime,
    imaging,
    thrombolysisLocation,
  };
}

export function getSummaryFilterOptions() {
  const defaults = {
    showImaging: true,
    showComplications: true,
    showContra: true,
    showBpMeds: true,
  };
  if (typeof document === 'undefined') return defaults;
  const map = {
    imaging: 'showImaging',
    complications: 'showComplications',
    contra: 'showContra',
    bpMeds: 'showBpMeds',
  };
  const options = { ...defaults };
  document.querySelectorAll('[data-summary-filter]').forEach((el) => {
    const key = map[el.dataset.summaryFilter];
    if (!key) return;
    options[key] = Boolean(el.checked);
  });
  return options;
}

export function summaryTemplate(
  {
    patient,
    times,
    drugs,
    decision,
    nextCare,
    department,
    transferInfo,
    bpMeds,
    activation,
    arrivalSymptoms,
    arrivalContra,
    arrivalMtContra,
    arrivalSource,
    arrivalPrenotify,
    complications,
    compTime,
    imaging = {},
    thrombolysisLocation,
  } = {},
  options = getSummaryFilterOptions(),
) {
  const lines = [];
  const unknown = t('summary_unknown');
  const withUnknown = (value) => (hasValue(value) ? value : unknown);
  const line = (key, value) => {
    lines.push(t(key, { value: withUnknown(value) }));
  };
  const {
    showImaging = true,
    showComplications = true,
    showContra = true,
    showBpMeds = true,
  } = options || {};

  lines.push(t('summary_section_patient'));
  line('summary_label_name', patient.name);
  line('summary_label_personal', patient.personal);
  line('summary_label_dob', patient.dob);
  if (hasValue(patient.age)) line('summary_label_age', patient.age);
  const weightText = hasValue(patient.weight) ? `${patient.weight} kg` : null;
  line('summary_label_weight', weightText);
  line('summary_label_bp', patient.bp);
  if (hasValue(patient.inr)) line('summary_label_inr', patient.inr);
  line('summary_label_nihss0', patient.nih0);
  if (hasValue(patient.mrs)) line('summary_label_mrs0', patient.mrs);
  if (hasValue(patient.independent)) {
    line(
      'summary_label_independent',
      patient.independent === 'yes' ? t('yes') : t('no'),
    );
  }

  if (
    activation.lkw ||
    activation.drugs.length ||
    activation.params.glucose ||
    activation.params.aks ||
    activation.params.hr ||
    activation.params.spo2 ||
    activation.params.temp
  ) {
    lines.push(t('summary_section_activation'));
    if (activation.lkw) line('summary_activation_lkw', activation.lkw);
    if (activation.drugs.length)
      lines.push(
        t('summary_activation_drugs', {
          value: activation.drugs.join(', '),
        }),
      );
    const paramParts = [];
    if (activation.params.glucose)
      paramParts.push(
        t('summary_param_glucose', { value: activation.params.glucose }),
      );
    if (activation.params.aks)
      paramParts.push(t('summary_param_aks', { value: activation.params.aks }));
    if (activation.params.hr)
      paramParts.push(t('summary_param_hr', { value: activation.params.hr }));
    if (activation.params.spo2)
      paramParts.push(
        t('summary_param_spo2', { value: activation.params.spo2 }),
      );
    if (activation.params.temp)
      paramParts.push(
        t('summary_param_temp', { value: activation.params.temp }),
      );
    if (paramParts.length)
      lines.push(
        t('summary_activation_params', {
          value: paramParts.join(', '),
        }),
      );
  }

  const ctMap = {
    clear: t('summary_ct_clear'),
    bleed: t('summary_ct_bleed'),
  };
  const ktaMap = {
    none: t('summary_kta_none'),
    lvo: t('summary_kta_lvo'),
  };
  const ktaSideMap = {
    left: t('summary_kta_left'),
    right: t('summary_kta_right'),
  };
  const perfParts = [];
  if (imaging.perfCore)
    perfParts.push(t('summary_perf_core', { value: imaging.perfCore }));
  if (imaging.perfPenumbra)
    perfParts.push(t('summary_perf_penumbra', { value: imaging.perfPenumbra }));
  if (showImaging && (imaging.ct || imaging.kta || perfParts.length)) {
    lines.push(t('summary_section_imaging'));
    if (imaging.ct)
      lines.push(
        t('summary_imaging_ct', { value: ctMap[imaging.ct] || imaging.ct }),
      );
    if (imaging.kta) {
      let ktaLabel = ktaMap[imaging.kta] || imaging.kta;
      if (imaging.kta === 'lvo') {
        const details = [];
        const sideLabel = ktaSideMap[imaging.ktaSide];
        if (sideLabel) details.push(sideLabel);
        if (imaging.ktaVessels) details.push(imaging.ktaVessels);
        if (details.length) ktaLabel += ` (${details.join('; ')})`;
      }
      lines.push(t('summary_imaging_kta', { value: ktaLabel }));
    }
    if (perfParts.length)
      lines.push(t('summary_imaging_perf', { value: perfParts.join(', ') }));
  }

  if (arrivalSource || arrivalPrenotify !== null) {
    lines.push(t('summary_section_arrival'));
    if (arrivalSource) {
      const sourceLabels = {
        EMS: t('summary_arrival_source_ems'),
        Private: t('summary_arrival_source_private'),
        OtherHospital: t('summary_arrival_source_other'),
      };
      lines.push(
        t('summary_arrival_source', {
          value: sourceLabels[arrivalSource] || arrivalSource,
        }),
      );
    }
    if (arrivalPrenotify !== null) {
      lines.push(
        t('summary_arrival_prenotify', {
          value: arrivalPrenotify ? t('yes') : t('no'),
        }),
      );
    }
  }

  lines.push(t('summary_section_times'));
  if (times.gmp) line('summary_time_gmp', times.gmp);
  line('summary_time_lkw', times.lkw);
  line('summary_time_door', times.door);
  line('summary_time_decision', times.decision);
  line('summary_time_thrombolysis', times.thrombolysis);

  if (thrombolysisLocation)
    line('summary_time_thrombolysis_location', thrombolysisLocation);
  lines.push(t('summary_section_drugs'));
  const drugType =
    drugs.type === 'tnk' ? t('summary_drug_tnk') : t('summary_drug_tpa');
  lines.push(t('summary_drug_type', { value: drugType }));
  const concLine = drugs.type === 'tnk' ? '5 mg/ml' : '1 mg/ml';
  lines.push(t('summary_drug_concentration', { value: concLine }));
  const doseText = hasValue(drugs.totalDose)
    ? `${drugs.totalDose} mg`
    : unknown;
  const volumeText = hasValue(drugs.totalVol)
    ? `${drugs.totalVol} ml`
    : unknown;
  lines.push(
    t('summary_drug_total', {
      dose: doseText,
      volume: volumeText,
    }),
  );
  if (drugs.bolus) line('summary_drug_bolus', drugs.bolus);
  if (drugs.infusion) line('summary_drug_infusion', drugs.infusion);

  if (showBpMeds && bpMeds.length) {
    lines.push(t('summary_section_bp_meds'));
    bpMeds.forEach((m) => {
      const med = withUnknown(m.med);
      const time = withUnknown(m.time);
      const dose = hasValue(m.dose) ? `${m.dose}` : '';
      const unit = hasValue(m.unit) ? ` ${m.unit}` : '';
      const notes = hasValue(m.notes) ? ` (${m.notes})` : '';
      lines.push(`${med} ${time} ${dose}${unit}${notes}`.trim());
    });
  }

  if (activation.symptoms.length || arrivalSymptoms) {
    lines.push(t('summary_section_symptoms'));
    if (arrivalSymptoms) {
      lines.push(`- ${arrivalSymptoms}`);
    } else if (activation.symptoms.length) {
      lines.push(`- ${activation.symptoms.join(', ')}`);
    }
  }

  if (showContra) {
    if (arrivalContra) {
      lines.push(t('summary_section_contra_ivt'));
      lines.push(`- ${arrivalContra}`);
    }
    if (arrivalMtContra) {
      lines.push(t('summary_section_contra_mte'));
      lines.push(`- ${arrivalMtContra}`);
    }
  }

  if (showComplications && (complications || compTime)) {
    lines.push(t('summary_section_complications'));
    if (complications) {
      const compList = complications
        .split('; ')
        .map((code) => {
          const key = 'comp_' + code;
          const translated = t(key);
          return translated === key ? code : translated;
        })
        .join('; ');
      lines.push(`- ${compList}`);
    }
    if (compTime) line('summary_complication_time', compTime);
  }

  lines.push(t('summary_section_decision'));
  lines.push(
    t('summary_decision_value', {
      value: withUnknown(decision),
    }),
  );
  if (nextCare) {
    const nextCareLabel =
      nextCare === 'stationary'
        ? t('summary_next_care_stationary')
        : t('summary_next_care_transfer');
    lines.push(t('summary_next_care', { value: nextCareLabel }));
  }
  if (department) line('summary_department', department);
  if (transferInfo) line('summary_transfer', transferInfo);
  return lines.join('\n');
}

export function getSummaryMissingFields({ times, patient, decision, drugs }) {
  const missing = [];
  if (!hasValue(times?.lkw)) missing.push('summary_missing_lkw');
  if (!hasValue(patient?.nih0)) missing.push('summary_missing_nihss');
  if (!hasValue(decision)) missing.push('summary_missing_decision');
  if (!hasValue(drugs?.totalDose)) missing.push('summary_missing_dose');
  return missing;
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
