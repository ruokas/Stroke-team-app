import { sleepMidpoint, triggerChange } from './time.js';

function setupSplitDateTime({ dateId, timeId, hiddenId }) {
  const dateEl = document.getElementById(dateId);
  const timeEl = document.getElementById(timeId);
  const hiddenEl = document.getElementById(hiddenId);
  if (!dateEl || !timeEl || !hiddenEl) return;

  const syncVisible = () => {
    const value = hiddenEl.value || '';
    if (!value) {
      dateEl.value = '';
      timeEl.value = '';
      return;
    }
    const [datePart, timePart] = value.split('T');
    if (datePart) dateEl.value = datePart;
    if (timePart) timeEl.value = timePart.slice(0, 5);
  };

  const syncHidden = () => {
    const dateVal = dateEl.value;
    const timeVal = timeEl.value;
    let next = '';
    if (dateVal) {
      next = timeVal ? `${dateVal}T${timeVal}` : dateVal;
    }
    if (hiddenEl.value !== next) {
      hiddenEl.value = next;
      triggerChange(hiddenEl);
    }
  };

  dateEl.addEventListener('input', syncHidden);
  timeEl.addEventListener('input', syncHidden);
  hiddenEl.addEventListener('input', syncVisible);
  hiddenEl.addEventListener('change', syncVisible);
  syncVisible();
}

export function setupLkw(inputs) {
  if (!inputs) return;
  const lkwOptions = inputs.lkw_type || [];
  if (!Array.isArray(lkwOptions) || lkwOptions.length === 0) return;
  setupSplitDateTime({
    dateId: 't_lkw_date',
    timeId: 't_lkw_time',
    hiddenId: 't_lkw',
  });
  setupSplitDateTime({
    dateId: 't_sleep_start_date',
    timeId: 't_sleep_start_time',
    hiddenId: 't_sleep_start',
  });
  setupSplitDateTime({
    dateId: 't_sleep_end_date',
    timeId: 't_sleep_end_time',
    hiddenId: 't_sleep_end',
  });
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
