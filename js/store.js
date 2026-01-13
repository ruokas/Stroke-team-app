export const state = {
  autosave: 'on',
};

const listeners = new Set();

export function setState(partial) {
  if (!partial || typeof partial !== 'object') return;
  Object.assign(state, partial);
  listeners.forEach((listener) => listener(state));
}

export function subscribe(listener) {
  if (typeof listener !== 'function') return () => {};
  listeners.add(listener);
  return () => listeners.delete(listener);
}
