import { registerFeature } from '../featureRegistry.js';
import { initTheme, setupThemeToggle } from '../../theme.js';
import { initErrorLogger } from '../../errorLogger.js';
import { initAnalytics, track } from '../../analytics.js';
import { setupNotificationToggle } from '../../notifications.js';

registerFeature({
  id: 'theme',
  init: () => {
    initTheme();
  },
});

registerFeature({
  id: 'error-logger',
  init: () => {
    initErrorLogger();
  },
});

registerFeature({
  id: 'analytics',
  init: () => {
    initAnalytics();
  },
});

registerFeature({
  id: 'service-worker',
  deps: ['analytics'],
  init: () => {
    if (!('serviceWorker' in navigator)) return;
    const registerSw = () => {
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
            stack: err?.stack,
            source: 'serviceWorker',
          });
        });
    };
    if (document.readyState === 'complete') registerSw();
    else window.addEventListener('load', registerSw, { once: true });
  },
});

registerFeature({
  id: 'theme-controls',
  deps: ['theme'],
  init: () => {
    setupThemeToggle();
    setupNotificationToggle();
  },
});
