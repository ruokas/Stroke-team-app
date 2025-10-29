# Code review notes

## 1. Make theme detection resilient when `matchMedia` is unavailable
- **Files:** `js/theme.js`
- **Issue:** `initTheme` assumes `window.matchMedia` exists and throws in headless/JSDOM environments or legacy browsers. This surfaces as noisy test output and can break runtime on locked-down clinical workstations.  【F:js/theme.js†L8-L22】
- **Suggestion:** Guard the call with a capability check (e.g., `const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;`) or fall back to a CSS media query evaluation via `document.documentElement.dataset`. This keeps initialization silent and removes the need for environment shims.

## 2. Deduplicate patient storage helpers between `storage.js` and `sync.js`
- **Files:** `js/storage.js`, `js/sync.js`
- **Issue:** Both modules hard-code the same localStorage key and serialize the same shape, but `sync.js` re-implements its own `loadLocalPatients`/`saveLocalPatients` helpers without migration/error handling. Divergence risks inconsistent payloads (e.g., missing future schema migrations or toast notifications).  【F:js/storage.js†L12-L101】【F:js/sync.js†L7-L184】
- **Suggestion:** Export thin helpers (e.g., `readPatients()`/`writePatients()`) from `storage.js` and reuse them in `sync.js`. That keeps a single migration/toast path, simplifies the sync module, and prevents subtle differences when schema/version logic evolves.

## 3. Harden sync disable/enable toggles against storage failures
- **Files:** `js/sync.js`
- **Issue:** Writes to `localStorage` when toggling local-only mode run without `try/catch`, so Safari private browsing or quota exhaustion will throw and leave the toggle out of sync with UI state.  【F:js/sync.js†L23-L44】【F:js/sync.js†L174-L238】
- **Suggestion:** Wrap those writes in `try/catch`, reuse the existing toast for storage failures, and keep the checkbox state update inside `finally` to ensure the UI reflects the decision even when persistence fails.
