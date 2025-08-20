export function autoSetContraDecision({
  lkwTypeInputs = [],
  arrivalContraInputs = [],
  decisionInputs = [],
} = {}) {
  const val =
    'Reperfuzinis gydymas kontraindikuotinas, taikyti konservatyvią taktika';
  const decision = decisionInputs.find((d) => d.value === val);
  if (!decision) return;
  const lkwUnknown = lkwTypeInputs.find((o) => o.checked)?.value === 'unknown';
  const hasContra = arrivalContraInputs.some((c) => c.checked);
  if (lkwUnknown || hasContra) {
    if (!decision.checked) {
      decision.checked = true;
      decision.dispatchEvent(new Event('change'));
    }
  }
}
