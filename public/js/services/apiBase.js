export const DEFAULT_API_BASE = '/api';

function readWindowValue(name) {
  if (typeof window === 'undefined') return undefined;
  const value = window[name];
  if (value == null) return undefined;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed === '' ? undefined : trimmed;
  }
  return value;
}

function readEnvValue(name) {
  if (typeof process === 'undefined' || !process.env) return undefined;
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

export function getApiBase() {
  return (
    readWindowValue('API_BASE') ||
    readEnvValue('API_BASE') ||
    DEFAULT_API_BASE
  );
}
