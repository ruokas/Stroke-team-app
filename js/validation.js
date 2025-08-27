export function setValidity(el, valid, message) {
  if (!el) return valid;
  if (valid) {
    el.classList.remove('invalid');
    el.setCustomValidity?.('');
  } else {
    el.classList.add('invalid');
    el.setCustomValidity?.(message);
  }
  return valid;
}
