import { inputs } from './state.js';
import { showToast } from './toast.js';

export function genSummary() {
  const get = (el) => (el && el.value ? el.value : null);
  const dob = get(inputs.a_dob) || '—';
  const w = get(inputs.weight) || '—';
  const bp = get(inputs.bp) || '—';
  const nih0 = get(inputs.nih0) || '—';

  const tLKW = get(inputs.lkw);
  const tDoor = get(inputs.door);
  const tDecision = get(inputs.d_time);
  const decisionVal = inputs.d_decision.find((n) => n.checked)?.value;

  const drugType =
    inputs.drugType.value === 'tnk' ? 'Tenekteplazė' : 'Alteplazė';
  const conc = inputs.drugConc.value ? `${inputs.drugConc.value} mg/ml` : '—';
  const totalDose = inputs.doseTotal.value
    ? `${inputs.doseTotal.value} mg`
    : '—';
  const totalVol = inputs.doseVol.value ? `${inputs.doseVol.value} ml` : '—';
  const tpaBolus = inputs.tpaBolus.value;
  const tpaInf = inputs.tpaInf.value;

  const parts = [];
  parts.push(
    `PACIENTAS: gim. data: ${dob}, svoris: ${w} kg, AKS atvykus: ${bp}. NIHSS pradinis: ${nih0}.`,
  );
  parts.push(
    `LAIKAI: LKW: ${tLKW || '—'}, Atvykimas: ${tDoor || '—'}, Sprendimas: ${tDecision || '—'}.`,
  );
  parts.push(
    `VAISTAI: ${drugType}. Koncentracija: ${conc}. Bendra dozė: ${totalDose} (${totalVol}). ${
      tpaBolus ? `Bolius: ${tpaBolus}. ` : ''
    }${tpaInf ? `Infuzija: ${tpaInf}.` : ''}`,
  );
  if (decisionVal) {
    parts.push(`SPRENDIMAS: ${decisionVal}.`);
  }

  inputs.summary.value = parts.join('\n');
}

export function copySummary() {
  genSummary();
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(inputs.summary.value).catch((err) => {
      showToast('Nepavyko nukopijuoti: ' + err);
    });
  } else {
    inputs.summary.select();
    const ok = document.execCommand('copy');
    if (!ok) showToast('Nepavyko nukopijuoti');
  }
}
