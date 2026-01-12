import { migrateSchema, SCHEMA_VERSION } from '../storage/migrations.js';

/**
 * @typedef {Object} PatientRecord
 * @property {string} patientId
 * @property {string} name
 * @property {string} created
 * @property {string} lastUpdated
 * @property {boolean} needsSync
 * @property {{ version: number, data: Record<string, unknown> }} data
 */

export function generatePatientId() {
  const globalCrypto =
    typeof globalThis !== 'undefined' ? globalThis.crypto : undefined;
  if (globalCrypto && typeof globalCrypto.randomUUID === 'function') {
    try {
      return globalCrypto.randomUUID();
    } catch {
      // Some polyfills may expose randomUUID but throw; fall back gracefully.
    }
  }
  if (globalCrypto && typeof globalCrypto.getRandomValues === 'function') {
    const buf = new Uint32Array(4);
    globalCrypto.getRandomValues(buf);
    return Array.from(buf)
      .map((n) => n.toString(16).padStart(8, '0'))
      .join('');
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2, 10)}`;
}

export function toVersionedData(payload) {
  if (
    payload &&
    typeof payload === 'object' &&
    'version' in payload &&
    'data' in payload
  ) {
    return {
      version: payload.version,
      data: payload.data,
    };
  }
  return {
    version: SCHEMA_VERSION,
    data: payload ?? {},
  };
}

export function migratePatientRecord(id, record) {
  const p = record && typeof record === 'object' ? record : {};
  const before = JSON.stringify(p);
  p.patientId ??= id;
  p.created ??= new Date().toISOString();
  p.lastUpdated ??= p.created;
  if (!p.data || typeof p.data !== 'object' || p.data.version === undefined) {
    p.data = { version: 0, data: p.data };
  }
  if (p.data.version !== SCHEMA_VERSION) {
    try {
      p.data = migrateSchema(p.data);
      if (p.data.version !== SCHEMA_VERSION) throw new Error('');
    } catch {
      console.warn(
        `Discarding patient ${id} due to incompatible schema version ${p.data.version}`,
      );
      return { record: null, changed: true };
    }
  }
  return { record: p, changed: before !== JSON.stringify(p) };
}

export function buildServerPayload(id, record) {
  if (!record || typeof record !== 'object') return null;
  const computedId =
    record.patientId ?? record.patient_id ?? (id !== undefined ? id : null);
  const patientId =
    computedId !== undefined &&
    computedId !== null &&
    `${computedId}`.trim() !== ''
      ? computedId
      : null;
  const payload = record.data ?? record.payload ?? null;
  const lastUpdated = record.last_updated ?? record.lastUpdated ?? null;
  const created = record.created ?? record.created_at ?? null;
  const nameValue =
    typeof record.name === 'string' && record.name.trim() !== ''
      ? record.name
      : patientId
        ? `Pacientas ${patientId}`
        : 'Pacientas';

  const body = {
    patient_id: patientId,
    name: nameValue,
    payload,
  };

  if (!body.patient_id && id !== undefined && id !== null) {
    body.patient_id = id;
  }

  if (lastUpdated) body.last_updated = lastUpdated;
  if (created) body.created = created;

  return body;
}

export function mapRemotePatient(remote) {
  if (!remote || typeof remote !== 'object') return null;
  const rawId =
    remote.patientId ??
    remote.patient_id ??
    remote.id ??
    remote.patientID ??
    null;
  const lastUpdated =
    remote.lastUpdated ??
    remote.last_updated ??
    remote.updated_at ??
    remote.updatedAt ??
    null;
  const payload = remote.payload ?? remote.data ?? null;
  const mapped = { ...remote };
  if (rawId !== undefined && rawId !== null && `${rawId}`.trim() !== '') {
    mapped.patientId = `${rawId}`;
  }
  if (lastUpdated) {
    mapped.lastUpdated = lastUpdated;
  }
  const basePayload =
    payload !== undefined
      ? payload
      : mapped.data !== undefined
        ? mapped.data
        : null;
  mapped.data = toVersionedData(basePayload);
  return mapped;
}

export function normalizeRemotePatient(remote) {
  if (!remote || typeof remote !== 'object') return null;
  const rawId =
    remote.patientId ??
    remote.patient_id ??
    remote.id ??
    remote.patientID ??
    null;
  if (rawId === undefined || rawId === null || `${rawId}`.trim() === '')
    return null;
  const patientId = `${rawId}`;
  const payload = remote.data ?? remote.payload ?? null;
  const created =
    remote.created ?? remote.created_at ?? remote.createdAt ?? null;
  const lastUpdated =
    remote.lastUpdated ??
    remote.last_updated ??
    remote.updated_at ??
    remote.updatedAt ??
    created ??
    null;

  const normalized = {
    patientId,
    name:
      typeof remote.name === 'string' && remote.name.trim() !== ''
        ? remote.name
        : `Pacientas ${patientId}`,
    created: created ?? new Date().toISOString(),
    lastUpdated: lastUpdated ?? new Date().toISOString(),
    data: payload ?? null,
    needsSync: false,
  };

  if (remote.last_updated) normalized.last_updated = remote.last_updated;
  if (remote.payload !== undefined && normalized.data === remote.payload) {
    normalized.payload = remote.payload;
  }

  return normalized;
}
