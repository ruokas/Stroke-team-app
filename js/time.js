export const pad = (n) => String(n).padStart(2, '0');

export function toLocalInputValue(d) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function triggerChange(el) {
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
}

export function parseValidDate(value) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? null : date;
}

export function normalizePair(start, end) {
  if (!start || !end) return null;
  const s = parseValidDate(start);
  let e = parseValidDate(end);
  if (!s || !e) return null;
  if (e < s) {
    e = new Date(e.getTime() + 864e5);
  }
  return { s, e };
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

// Privers naršyklę rodyti laiką 24 valandų formatu
export function force24HourFormat() {
  const timeInputs = document.querySelectorAll('input[type="time"]');
  timeInputs.forEach(input => {
    // Nustatome step atributą, kad būtų tiksliau valandos ir minutės
    input.step = '60';
    
    // Pridedame event listener, kad užtikrintume 24 valandų formatą
    input.addEventListener('change', function() {
      if (this.value) {
        const [hours, minutes] = this.value.split(':');
        const hour24 = parseInt(hours, 10);
        if (hour24 >= 0 && hour24 <= 23) {
          this.value = `${pad(hour24)}:${minutes}`;
        }
      }
    });
    
    // Pridedame event listener input įvykiui
    input.addEventListener('input', function() {
      if (this.value) {
        const [hours, minutes] = this.value.split(':');
        const hour24 = parseInt(hours, 10);
        if (hour24 >= 0 && hour24 <= 23) {
          this.value = `${pad(hour24)}:${minutes}`;
        }
      }
    });
  });
}

export function sleepMidpoint(start, end) {
  const pair = normalizePair(start, end);
  if (!pair) return '';
  const { s, e } = pair;
  const mid = new Date((s.getTime() + e.getTime()) / 2);
  return toLocalInputValue(mid);
}

export function diffMinutes(start, end) {
  const pair = normalizePair(start, end);
  if (!pair) return NaN;
  const { s, e } = pair;
  return Math.round((e.getTime() - s.getTime()) / 60000);
}
