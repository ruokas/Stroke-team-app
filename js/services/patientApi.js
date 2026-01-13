import { getApiBase } from './apiBase.js';
import { withSupabaseHeaders } from './supabase.js';

export async function postPatient(body) {
  const apiBase = getApiBase();
  return fetch(`${apiBase}/patients`, {
    method: 'POST',
    headers: withSupabaseHeaders(apiBase, {
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify(body),
  });
}

export async function fetchPatients() {
  const apiBase = getApiBase();
  const headers = withSupabaseHeaders(apiBase);
  const fetchOptions = Object.keys(headers).length ? { headers } : {};
  return fetch(`${apiBase}/patients`, fetchOptions);
}

export async function deletePatientById(patientId) {
  const apiBase = getApiBase();
  const headers = withSupabaseHeaders(apiBase);
  const fetchOptions = Object.keys(headers).length
    ? { method: 'DELETE', headers }
    : { method: 'DELETE' };
  return fetch(
    `${apiBase}/patients?patientId=${encodeURIComponent(patientId)}`,
    fetchOptions,
  );
}
