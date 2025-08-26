import { sleepMidpoint, triggerChange } from './time.js';
import { autoSetContraDecision } from './decision.js';

export function setupLkw(inputs) {
  const lkwOptions = inputs.lkw_type;
  const lkwRow = document.getElementById('lkwTimeRow');
  const sleepRow = document.getElementById('sleepTimeRow');
  const updateSleepMid = () => {
    const val = sleepMidpoint(inputs.sleep_start.value, inputs.sleep_end.value);
    inputs.lkw.value = val;
    if (val) triggerChange(inputs.lkw);
  };
  inputs.sleep_start?.addEventListener('input', updateSleepMid);
  inputs.sleep_end?.addEventListener('input', updateSleepMid);
  const updateLKW = () => {
    const val = lkwOptions.find((o) => o.checked)?.value;
    if (val === 'unknown') {
      lkwRow.classList.add('hidden');
      sleepRow.classList.add('hidden');
      inputs.lkw.value = '';
    } else if (val === 'sleep') {
      lkwRow.classList.add('hidden');
      sleepRow.classList.remove('hidden');
      updateSleepMid();
    } else {
      lkwRow.classList.remove('hidden');
      sleepRow.classList.add('hidden');
    }
  };
  lkwOptions.forEach((o) => o.addEventListener('change', updateLKW));
  updateLKW();

  const updateDecision = () =>
    autoSetContraDecision({
      lkwTypeInputs: inputs.lkw_type,
      arrivalContraInputs: inputs.arrival_contra || [],
      decisionInputs: inputs.d_decision || [],
    });
  inputs.lkw_type.forEach((o) => o.addEventListener('change', updateDecision));
  (inputs.arrival_contra || []).forEach((c) =>
    c.addEventListener('change', updateDecision),
  );
  updateDecision();
}
