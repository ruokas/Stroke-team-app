import { track } from './analytics.js';

/**
 * Initialize global error logging by listening to browser error events
 * and forwarding them to the analytics tracker.
 */
export function initErrorLogger() {
  window.addEventListener('error', (event) => {
    const message = event.message;
    const stack = event.error?.stack;
    const source = event.filename || event.target?.src || '';
    track('error', { message, stack, source });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = reason?.message || String(reason);
    const stack = reason?.stack;
    track('error', { message, stack, source: 'unhandledrejection' });
  });
}
