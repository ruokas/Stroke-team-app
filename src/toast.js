const toast = {
  queue: [],
  showing: false,
  _showNext() {
    if (this.showing) return;
    const item = this.queue.shift();
    if (!item) return;
    const { msg, options, container } = item;
    const { type, duration = 3000 } = options;
    const validTypes = ['success', 'error', 'warning', 'info'];
    const classType = validTypes.includes(type) ? ` ${type}` : '';
    const el = document.createElement('div');
    el.className = 'toast' + classType;
    el.setAttribute('role', 'alert');
    el.textContent = msg;

    const closeBtn = document.createElement('button');
    closeBtn.type = 'button';
    closeBtn.className = 'btn toast-close';
    closeBtn.setAttribute('aria-label', 'Close');
    closeBtn.setAttribute('tabindex', '0');
    closeBtn.textContent = '×';
    el.appendChild(closeBtn);

    const hide = () => {
      el.classList.add('hide');
      el.addEventListener(
        'transitionend',
        () => {
          el.remove();
          this.showing = false;
          this._showNext();
        },
        { once: true },
      );
    };

    const timer = setTimeout(hide, duration);
    closeBtn.addEventListener('click', () => {
      clearTimeout(timer);
      hide();
    });

    container.appendChild(el);
    this.showing = true;
  },
  showToast(msg, options = {}) {
    if (typeof document === 'undefined') return;
    const container = document.getElementById('toastContainer');
    if (!container) return;
    this.queue.push({ msg, options, container });
    this._showNext();
  },
};

export function showToast(msg, options) {
  return toast.showToast(msg, options);
}

if (typeof window !== 'undefined') {
  window.showToast = showToast;
}

export { toast };
