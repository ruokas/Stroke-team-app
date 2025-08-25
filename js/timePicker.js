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

  const hourOpts = Array.from({ length: 24 })
    .map((_, i) => `<option value="${pad(i)}">${pad(i)}</option>`)
    .join('');
  const minuteOpts = Array.from({ length: 60 })
    .map((_, i) => `<option value="${pad(i)}">${pad(i)}</option>`)
    .join('');

  dialog.innerHTML = `
    <form method="dialog" class="tp-form">
      ${
        target.type === 'time'
          ? ''
          : `<input type="date" class="tp-date" value="${datePart}" />`
      }
      <div class="tp-time">
        <select class="tp-hour">${hourOpts}</select>
        <span>:</span>
        <select class="tp-minute">${minuteOpts}</select>
      </div>
      <div class="tp-actions">
        <button value="cancel" type="button">Atšaukti</button>
        <button value="ok" type="submit">Gerai</button>
      </div>
    </form>`;

  document.body.appendChild(dialog);
  const hourSel = dialog.querySelector('.tp-hour');
  const minuteSel = dialog.querySelector('.tp-minute');
  hourSel.value = hour;
  minuteSel.value = minute;
  const dateInput = dialog.querySelector('.tp-date');

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
