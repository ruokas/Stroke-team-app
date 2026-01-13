export const SETTINGS_KEY = 'stroke_settings';

export function loadSettings(storage, options = {}) {
  const { withResult = false, allowedKeys, defaults = {}, validate } = options;
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) {
      const empty = { ...defaults };
      return withResult ? { ok: true, data: empty } : null;
    }
    const parsed = JSON.parse(raw);
    const payload =
      parsed &&
      typeof parsed === 'object' &&
      'version' in parsed &&
      'data' in parsed
        ? parsed.data
        : parsed;
    const source = payload && typeof payload === 'object' ? payload : {};
    const filtered = allowedKeys
      ? Object.fromEntries(
          allowedKeys
            .map((key) => [key, source[key]])
            .filter(([, v]) => v !== undefined),
        )
      : { ...source };
    const merged = { ...defaults, ...filtered };
    const data = validate ? validate(merged) : merged;
    return withResult ? { ok: true, data } : data;
  } catch {
    return withResult ? { ok: false, data: null } : null;
  }
}

export function saveSettings(storage, settings) {
  try {
    storage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ version: 1, data: settings }),
    );
    return { ok: true };
  } catch {
    return { ok: false };
  }
}
