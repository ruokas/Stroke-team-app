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
  if (typeof process === 'undefined' || !process?.env) return undefined;
  const value = process.env[name];
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
}

function parseHostname(value) {
  if (!value || typeof value !== 'string') return '';
  const trimmed = value.trim();
  if (!trimmed) return '';
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    try {
      return new URL(
        trimmed,
        'https://placeholder.local',
      ).hostname.toLowerCase();
    } catch {
      return '';
    }
  }
}

export function getSupabaseProjectUrl() {
  return (
    readWindowValue('SUPABASE_PROJECT_URL') ??
    readEnvValue('SUPABASE_PROJECT_URL') ??
    ''
  );
}

export function getSupabaseAnonKey() {
  return (
    readWindowValue('SUPABASE_ANON_KEY') ??
    readWindowValue('SUPABASE_ANONPUBLIC') ??
    readEnvValue('SUPABASE_ANON_KEY') ??
    readEnvValue('SUPABASE_ANONPUBLIC') ??
    ''
  );
}

function isSupabaseApi(base) {
  if (!base || typeof base !== 'string') return false;
  const trimmed = base.trim();
  if (!trimmed || trimmed.startsWith('/')) return false;
  const host = parseHostname(trimmed);
  if (!host) return false;
  if (host.includes('supabase')) return true;
  const projectHost = parseHostname(getSupabaseProjectUrl());
  if (!projectHost) return false;
  return host === projectHost || host.endsWith(`.${projectHost}`);
}

export function withSupabaseHeaders(apiBase, baseHeaders = {}) {
  const headers =
    baseHeaders &&
    typeof baseHeaders === 'object' &&
    !Array.isArray(baseHeaders)
      ? { ...baseHeaders }
      : {};
  const anonKey = getSupabaseAnonKey();
  if (!anonKey) return headers;
  if (!isSupabaseApi(apiBase)) return headers;
  headers.Authorization = `Bearer ${anonKey}`;
  headers.apikey = anonKey;
  return headers;
}
