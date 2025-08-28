export function showModal({ title = '', message = '', input, buttons = [] }) {
  return new Promise((resolve) => {
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';

    const dialog = document.createElement('div');
    dialog.className = 'modal';
    dialog.setAttribute('role', 'dialog');
    dialog.setAttribute('aria-modal', 'true');
    const idPart = globalThis.crypto?.randomUUID?.() ?? Date.now();
    const titleId = `modal-title-${idPart}`;
    dialog.setAttribute('aria-labelledby', titleId);

    const h2 = document.createElement('h2');
    h2.id = titleId;
    h2.textContent = title;
    dialog.appendChild(h2);

    if (message) {
      const p = document.createElement('p');
      p.textContent = message;
      dialog.appendChild(p);
    }

    let inputEl;
    if (input !== undefined) {
      inputEl = document.createElement('input');
      inputEl.type = 'text';
      inputEl.value = input?.value || '';
      if (input?.placeholder) inputEl.placeholder = input.placeholder;
      inputEl.setAttribute('aria-label', title);
      dialog.appendChild(inputEl);
    }

    const actions = document.createElement('div');
    actions.className = 'actions';
    dialog.appendChild(actions);

    const resolveAndCleanup = (val) => {
      overlay.removeEventListener('keydown', trap);
      overlay.remove();
      lastFocused?.focus();
      resolve(val);
    };

    buttons.forEach((btn) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.textContent = btn.label;
      b.className = 'btn' + (btn.class ? ` ${btn.class}` : '');
      b.addEventListener('click', () => {
        const v =
          typeof btn.value === 'function'
            ? btn.value(inputEl?.value)
            : btn.value;
        resolveAndCleanup(v);
      });
      actions.appendChild(b);
      if (btn.autofocus) setTimeout(() => b.focus(), 0);
    });

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);

    const focusable = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    const lastFocused = document.activeElement;

    const trap = (e) => {
      if (e.key === 'Tab') {
        if (focusable.length === 0) return;
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      } else if (e.key === 'Escape') {
        resolveAndCleanup(null);
      }
    };
    overlay.addEventListener('keydown', trap);

    (inputEl || first)?.focus();
  });
}

export function confirmModal(title) {
  return showModal({
    title,
    buttons: [
      { label: 'OK', value: true, class: 'primary', autofocus: true },
      { label: 'Cancel', value: false },
    ],
  });
}

export function promptModal(title, defaultValue = '') {
  return showModal({
    title,
    input: { value: defaultValue },
    buttons: [
      {
        label: 'OK',
        value: (v) => v,
        class: 'primary',
        autofocus: true,
      },
      { label: 'Cancel', value: null },
    ],
  });
}
