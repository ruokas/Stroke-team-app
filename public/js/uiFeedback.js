export function setButtonLoading(btn, loading) {
  if (!btn) return;
  if (loading) {
    if (!btn.dataset.prevDisabled) {
      btn.dataset.prevDisabled = btn.disabled ? 'true' : 'false';
    }
    btn.disabled = true;
    btn.classList.add('is-loading');
    btn.setAttribute('aria-busy', 'true');
    return;
  }
  const wasDisabled = btn.dataset.prevDisabled === 'true';
  delete btn.dataset.prevDisabled;
  if (!wasDisabled) btn.disabled = false;
  btn.classList.remove('is-loading');
  btn.removeAttribute('aria-busy');
}

export async function withButtonLoading(btn, task) {
  setButtonLoading(btn, true);
  try {
    return await task();
  } finally {
    setButtonLoading(btn, false);
  }
}

export function flashButtonLoading(btn, durationMs = 600) {
  if (!btn) return;
  setButtonLoading(btn, true);
  window.setTimeout(() => setButtonLoading(btn, false), durationMs);
}
