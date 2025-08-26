export function openTimePicker(target) {
  if (!target) return;
  if (typeof document === 'undefined' || typeof window === 'undefined') {
    target.showPicker?.();
    return;
  }
  if (!('HTMLDialogElement' in window)) {
    target.showPicker?.();
    return;
  }

  const dialog = document.createElement('dialog');
  dialog.className = 'time-picker-dialog';

  const pad = (n) => n.toString().padStart(2, '0');
  const now = new Date();
  let datePart = now.toISOString().slice(0, 10);
  let hour = pad(now.getHours());
  let minute = pad(now.getMinutes());

  if (target.value) {
    if (target.type === 'time') {
      const [h, m] = target.value.split(':');
      if (h) hour = pad(h);
      if (m) minute = pad(m);
    } else {
      const [d, t] = target.value.split('T');
      if (d) datePart = d;
      if (t) {
        const [h, m] = t.split(':');
        if (h) hour = pad(h);
        if (m) minute = pad(m);
      }
    }
  }

  const form = document.createElement('form');
  form.method = 'dialog';
  form.className = 'tp-form';

  let dateInput;
  if (target.type !== 'time') {
    dateInput = document.createElement('input');
    dateInput.type = 'date';
    dateInput.className = 'tp-date';
    dateInput.value = datePart;
    form.appendChild(dateInput);
  }

  const timeWrap = document.createElement('div');
  timeWrap.className = 'tp-time';

  const hourSel = document.createElement('select');
  hourSel.className = 'tp-hour';
  for (let i = 0; i < 24; i++) {
    const opt = document.createElement('option');
    const val = pad(i);
    opt.value = val;
    opt.textContent = val;
    hourSel.appendChild(opt);
  }
  timeWrap.appendChild(hourSel);

  const sep = document.createElement('span');
  sep.textContent = ':';
  timeWrap.appendChild(sep);

  const minuteSel = document.createElement('select');
  minuteSel.className = 'tp-minute';
  for (let i = 0; i < 60; i++) {
    const opt = document.createElement('option');
    const val = pad(i);
    opt.value = val;
    opt.textContent = val;
    minuteSel.appendChild(opt);
  }
  timeWrap.appendChild(minuteSel);

  form.appendChild(timeWrap);

  const actions = document.createElement('div');
  actions.className = 'tp-actions';

  const cancelBtn = document.createElement('button');
  cancelBtn.value = 'cancel';
  cancelBtn.type = 'button';
  cancelBtn.textContent = 'Atšaukti';
  actions.appendChild(cancelBtn);

  const okBtn = document.createElement('button');
  okBtn.value = 'ok';
  okBtn.type = 'submit';
  okBtn.textContent = 'Gerai';
  actions.appendChild(okBtn);

  form.appendChild(actions);

  dialog.appendChild(form);

  document.body.appendChild(dialog);
  hourSel.value = hour;
  minuteSel.value = minute;

  dialog.addEventListener('close', () => {
    if (dialog.returnValue === 'ok') {
      const h = hourSel.value;
      const m = minuteSel.value;
      let val = '';
      if (target.type === 'time') {
        val = `${h}:${m}`;
      } else {
        const d = dateInput?.value || datePart;
        val = `${d}T${h}:${m}`;
      }
      target.value = val;
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }
    dialog.remove();
  });

  try {
    dialog.showModal();
  } catch (e) {
    dialog.remove();
    target.showPicker?.();
  }
}
