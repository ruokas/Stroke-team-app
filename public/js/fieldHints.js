const HINT_CLASS = 'field-hint';

function buildHintText(el) {
  const hints = [];
  if (el.dataset.hint) hints.push(el.dataset.hint);
  if (el.required) hints.push('Required');
  const min = el.getAttribute('min');
  const max = el.getAttribute('max');
  if (min && max) hints.push(`Range: ${min}-${max}`);
  else if (min) hints.push(`Min: ${min}`);
  else if (max) hints.push(`Max: ${max}`);
  const step = el.getAttribute('step');
  if (step && step !== 'any' && step !== '1') hints.push(`Step: ${step}`);
  return hints.join(' • ');
}

function isFormField(el) {
  return ['INPUT', 'SELECT', 'TEXTAREA'].includes(el.tagName);
}

function positionHint(el, hintEl) {
  const rect = el.getBoundingClientRect();
  const scrollX = window.scrollX || window.pageXOffset;
  const scrollY = window.scrollY || window.pageYOffset;
  const hintWidth = hintEl.offsetWidth || 240;
  const padding = 8;
  let left = rect.left + scrollX;
  const top = rect.bottom + scrollY + 6;
  if (left + hintWidth + padding > scrollX + window.innerWidth) {
    left = scrollX + window.innerWidth - hintWidth - padding;
  }
  if (left < scrollX + padding) left = scrollX + padding;
  hintEl.style.left = `${left}px`;
  hintEl.style.top = `${top}px`;
  hintEl.style.minWidth = `${Math.max(160, rect.width * 0.6)}px`;
}

export function setupFieldHints() {
  const hintEl = document.createElement('div');
  hintEl.className = `${HINT_CLASS} hidden`;
  hintEl.setAttribute('role', 'status');
  hintEl.setAttribute('aria-live', 'polite');
  document.body.appendChild(hintEl);

  let activeEl = null;

  const show = (el) => {
    const hint = buildHintText(el);
    if (!hint) {
      hide();
      return;
    }
    activeEl = el;
    if (el.classList.contains('info-btn')) el.setAttribute('aria-expanded', 'true');
    hintEl.textContent = hint;
    hintEl.classList.remove('hidden');
    positionHint(el, hintEl);
  };

  const hide = () => {
    if (activeEl && activeEl.classList && activeEl.classList.contains('info-btn')) {
      activeEl.setAttribute('aria-expanded', 'false');
    }
    activeEl = null;
    hintEl.classList.add('hidden');
  };

  const onFocusIn = (e) => {
    const el = e.target;
    if (!el || !isFormField(el) || el.type === 'hidden' || el.readOnly) {
      return;
    }
    show(el);
  };

  const onFocusOut = (e) => {
    if (e.target === activeEl && activeEl && isFormField(activeEl)) hide();
  };

  const onClick = (e) => {
    if (hintEl.contains(e.target)) return;
    const btn = e.target.closest('.info-btn');
    if (!btn) {
      if (activeEl && !hintEl.classList.contains('hidden')) hide();
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    if (activeEl === btn && !hintEl.classList.contains('hidden')) {
      hide();
      return;
    }
    show(btn);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Escape' && activeEl) hide();
  };

  const onReposition = () => {
    if (activeEl && !hintEl.classList.contains('hidden')) {
      positionHint(activeEl, hintEl);
    }
  };

  document.addEventListener('focusin', onFocusIn);
  document.addEventListener('focusout', onFocusOut);
  document.addEventListener('click', onClick);
  document.addEventListener('keydown', onKeyDown);
  window.addEventListener('resize', onReposition);
  window.addEventListener('scroll', onReposition, true);

  return {
    cleanup: () => {
      document.removeEventListener('focusin', onFocusIn);
      document.removeEventListener('focusout', onFocusOut);
      document.removeEventListener('click', onClick);
      document.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', onReposition);
      window.removeEventListener('scroll', onReposition, true);
      hintEl.remove();
    },
  };
}
