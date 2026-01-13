import { track } from '../analytics.js';

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register(new URL('sw.js', window.location))
      .then((reg) => {
        track('sw_register_success');
        navigator.serviceWorker.ready.then(() => track('sw_active'));
        reg.addEventListener('updatefound', () => track('sw_update_found'));
      })
      .catch((err) => {
        console.error('Service worker registration failed', err);
        track('sw_register_error', { message: err.message });
        track('error', {
          message: 'Service worker registration failed',
          stack: err.stack,
          source: 'serviceWorker',
        });
      });
  });
}
