import { sleepMidpoint, triggerChange } from './time.js';

export function setupLkw(inputs) {
  if (!inputs) return;
  const lkwOptions = inputs.lkw_type || [];
  if (!Array.isArray(lkwOptions) || lkwOptions.length === 0) return;
  const lkwRow = document.getElementById('lkwTimeRow');
  const sleepRow = document.getElementById('sleepTimeRow');
  const updateSleepMid = () => {
    if (!inputs.sleep_start || !inputs.sleep_end || !inputs.lkw) return;
    const val = sleepMidpoint(inputs.sleep_start.value, inputs.sleep_end.value);
    inputs.lkw.value = val;
    if (val) triggerChange(inputs.lkw);
  };
  if (inputs.sleep_start && inputs.sleep_end) {
    inputs.sleep_start.addEventListener('input', updateSleepMid);
    inputs.sleep_end.addEventListener('input', updateSleepMid);
  }
  const updateLKW = () => {
    const checked = lkwOptions.find((o) => o.checked);
    const val = checked ? checked.value : '';
    if (val === 'unknown') {
      lkwRow?.classList.add('hidden');
      sleepRow?.classList.add('hidden');
      if (inputs.lkw) inputs.lkw.value = '';
    } else if (val === 'sleep') {
      lkwRow?.classList.add('hidden');
      sleepRow?.classList.remove('hidden');
      updateSleepMid();
    } else {
      lkwRow?.classList.remove('hidden');
      sleepRow?.classList.add('hidden');
    }
  };
  lkwOptions.forEach((o) => o.addEventListener('change', updateLKW));
  updateLKW();

  const updateThrombolysisAccess = () => {
    const lkwUnknown =
      inputs.lkw_type.find((o) => o.checked)?.value === 'unknown';
    const hasArrivalContra = (inputs.arrival_contra || []).some(
      (c) => c.checked,
    );
    const disabled = lkwUnknown || hasArrivalContra;
    const tab = document.getElementById('thrombolysis-tab');
    const startBtn = document.getElementById('startThrombolysis');
    tab?.classList.toggle('disabled', disabled);
    tab?.toggleAttribute('disabled', disabled);
    if (startBtn) {
      startBtn.dataset.lkwDisabled = disabled ? 'true' : 'false';
      const startDisabled =
        disabled || startBtn.dataset.requirementsInvalid === 'true';
      startBtn.disabled = startDisabled;
      startBtn.toggleAttribute('disabled', startDisabled);
    }
    document.dispatchEvent(new Event('tab-status-update'));
  };
  inputs.lkw_type.forEach((o) =>
    o.addEventListener('change', updateThrombolysisAccess),
  );
  (inputs.arrival_contra || []).forEach((c) =>
    c.addEventListener('change', updateThrombolysisAccess),
  );
  updateThrombolysisAccess();
}
