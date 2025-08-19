import { inputs, state } from './state.js';
import { toDate, minsBetween, fmtMins } from './time.js';

export function genSummary() {
  const get = (el) => (el && el.value ? el.value : null);
  const dob = get(inputs.a_dob) || '—';
  const sex = get(inputs.sex) || '—';
  const id = get(inputs.id) || '—';
  const w = get(inputs.weight) || '—';
  const bp = get(inputs.bp) || '—';
  const nih0 = get(inputs.nih0) || '—';
  const nih24 = get(inputs.nih24) || '—';

  const tLKW = get(inputs.lkw),
    tOnset = get(inputs.onset),
    tDoor = get(inputs.door),
    tCT = get(inputs.ct),
    tN = get(inputs.needle),
    tG = get(inputs.groin),
    tR = get(inputs.reperf);

  const dLKW = toDate(tLKW),
    dOnset = toDate(tOnset),
    dDoor = toDate(tDoor),
    dCT = toDate(tCT),
    dN = toDate(tN),
    dG = toDate(tG),
    dR = toDate(tR);

  const d2ct = minsBetween(dDoor, dCT);
  const d2n = minsBetween(dDoor, dN);
  const d2g = minsBetween(dDoor, dG);
  const o2n = minsBetween(dOnset || dLKW, dN);

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
    `PACIENTAS: Ligos istorijos Nr. ${id}, gim. data: ${dob}, lytis: ${sex}, svoris: ${w} kg, AKS atvykus: ${bp}. NIHSS pradinis: ${nih0}, po 24 val: ${nih24}.`,
  );
  parts.push(
    `LAIKAI: LKW: ${tLKW || '—'}, Pradžia: ${tOnset || '—'}, Atvykimas: ${tDoor || '—'}, KT: ${tCT || '—'}, Trombolizė: ${tN || '—'}, Kateterizacija: ${tG || '—'}, Reperfuzija: ${tR || '—'}.`,
  );
  parts.push(
    `RODIKLIAI: D2CT ${fmtMins(d2ct)}, D2N ${fmtMins(d2n)}, D2G ${fmtMins(d2g)}${o2n != null ? `, O2N ${fmtMins(o2n)}` : ''}. Tikslai: D2CT ≤ ${state.goals.d2ct} min, D2N ≤ ${state.goals.d2n} min, D2G ≤ ${state.goals.d2g} min.`,
  );

  if (
    inputs.i_ct.checked ||
    inputs.i_cta.checked ||
    inputs.i_tl.checked ||
    inputs.i_mt.checked
  ) {
    const ivs = [];
    if (inputs.i_ct.checked) ivs.push('KT galvos');
    if (inputs.i_cta.checked) ivs.push('CTA/CTP');
    if (inputs.i_tl.checked) ivs.push('IV trombolizė');
    if (inputs.i_mt.checked) ivs.push('Mechaninė trombektomija');
    parts.push(
      `TYRIMAI/INTERVENCIJOS: ${ivs.join(', ')}${inputs.i_tici.value ? `, TICI: ${inputs.i_tici.value}` : ''}.`,
    );
  }

  parts.push(
    `VAISTAI: ${drugType}. Koncentracija: ${conc}. Bendra dozė: ${totalDose} (${totalVol}). ${tpaBolus ? `Bolius: ${tpaBolus}. ` : ''}${tpaInf ? `Infuzija: ${tpaInf}.` : ''}`,
  );

  if (inputs.i_decision.value) {
    parts.push(`SPRENDIMAS: ${inputs.i_decision.value}.`);
  }
  if (inputs.notes.value) {
    parts.push(`PASTABOS: ${inputs.notes.value}`);
  }

  inputs.summary.value = parts.join('\n');
}

export function copySummary() {
  genSummary();
  if (window.isSecureContext && navigator.clipboard) {
    navigator.clipboard.writeText(inputs.summary.value).catch((err) => {
      alert('Nepavyko nukopijuoti: ' + err);
    });
  } else {
    inputs.summary.select();
    const ok = document.execCommand('copy');
    if (!ok) alert('Nepavyko nukopijuoti');
  }
}
