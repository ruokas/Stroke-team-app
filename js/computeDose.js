const INFUSION_MINUTES = 60;

function round1(n) {
  return Math.round(n * 10) / 10;
}

export function computeDose(weight, concentration, type) {
  const w = Number(weight);
  const c = Number(concentration);
  if (!Number.isFinite(w) || w <= 0) return null;
  if (!Number.isFinite(c) || c <= 0) return null;

  if (type === 'tnk') {
    const doseTotal = Math.min(25, round1(0.25 * w));
    return {
      doseTotal,
      doseVol: round1(doseTotal / c),
      bolus: null,
      infusion: null,
    };
  }

  if (type === 'tpa') {
    const doseTotal = Math.min(90, round1(0.9 * w));
    const bolusMg = round1(doseTotal * 0.1);
    const infusionMg = round1(doseTotal - bolusMg);
    const bolusMl = round1(bolusMg / c);
    const infusionMl = round1(infusionMg / c);
    const rateMlH = round1((infusionMl / INFUSION_MINUTES) * 60);
    return {
      doseTotal,
      doseVol: round1(doseTotal / c),
      bolus: { mg: bolusMg, ml: bolusMl },
      infusion: { mg: infusionMg, ml: infusionMl, rateMlH },
    };
  }

  return null;
}
