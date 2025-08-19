const toast = {
  showToast(msg) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = msg;
    container.appendChild(el);
    setTimeout(() => {
      el.classList.add('hide');
      el.addEventListener('transitionend', () => el.remove());
    }, 3000);
  },
};

export function showToast(msg) {
  return toast.showToast(msg);
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

export { toast };
