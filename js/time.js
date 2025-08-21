const pad = (n) => String(n).padStart(2, '0');

export function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function triggerChange(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function setNow(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const now = new Date();
  if (el.type === 'time') {
    el.value = `${pad(now.getHours())}:${pad(now.getMinutes())}`;
  } else {
    el.value = toLocalInputValue(now);
  }
  triggerChange(el);
}
