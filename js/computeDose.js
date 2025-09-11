const INFUSION_MINUTES = 60;

function round0(n) {
  return Math.round(n);
}

export function computeDose(weight, concentration, type) {
  const w = Number(weight);
  let c = Number(concentration);
  if (!Number.isFinite(w) || w <= 0) return null;
  if (!Number.isFinite(c) || c <= 0) {
    c = type === 'tnk' ? 5 : 1;
  }

  if (type === 'tnk') {
    const doseTotal = Math.min(25, round0(0.25 * w));
    return {
      doseTotal,
      doseVol: round0(doseTotal / c),
      bolus: null,
      infusion: null,
    };
  }

  if (type === 'tpa') {
    const doseTotal = Math.min(90, round0(0.9 * w));
    const bolusMg = round0(doseTotal * 0.1);
    const infusionMg = round0(doseTotal - bolusMg);
    const bolusMl = round0(bolusMg / c);
    const infusionMl = round0(infusionMg / c);
    const rateMlH = round0((infusionMl / INFUSION_MINUTES) * 60);
    return {
      doseTotal,
      doseVol: round0(doseTotal / c),
      bolus: { mg: bolusMg, ml: bolusMl },
      infusion: { mg: infusionMg, ml: infusionMl, rateMlH },
    };
  }

  return null;
}
