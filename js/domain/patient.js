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

const MAX_PATIENT_ID_LENGTH = 128;

function isPlainObject(value) {
  return !!value && typeof value === 'object' && !Array.isArray(value);
}

function isValidVersion(value) {
  return Number.isFinite(value);
}

function normalizePatientId(raw) {
  if (raw === undefined || raw === null) return null;
  const id = String(raw).trim();
  if (!id) return null;
  if (id.length > MAX_PATIENT_ID_LENGTH) return null;
  return id;
}

function normalizeTimestamp(value) {
  if (value === undefined || value === null || value === '') return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return trimmed;
  }
  const date =
    value instanceof Date
      ? value
      : new Date(typeof value === 'string' ? value.trim() : String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function normalizeVersionedData(payload) {
  let changed = false;
  let versioned;
  if (isPlainObject(payload) && 'version' in payload && 'data' in payload) {
    const version = payload.version;
    const data = payload.data;
    if (!isValidVersion(version) || !isPlainObject(data)) {
      versioned = {
        version: SCHEMA_VERSION,
        data: {},
      };
      changed = true;
    } else {
      versioned = { version, data };
    }
  } else {
    versioned = {
      version: SCHEMA_VERSION,
      data: isPlainObject(payload) ? payload : {},
    };
    changed = true;
  }
  return { value: versioned, changed };
}

export function toVersionedData(payload) {
  return normalizeVersionedData(payload).value;
}

export function migratePatientRecord(id, record, options = {}) {
  const logger = options?.logger;
  const source = isPlainObject(record) ? record : {};
  let changed = !isPlainObject(record);
  const patientId = normalizePatientId(source.patientId ?? id);
  if (!patientId) {
    return {
      record: null,
      changed: true,
      error: { code: 'invalid_id', message: 'Missing or invalid patient id.' },
    };
  }

  let created = normalizeTimestamp(source.created ?? source.created_at);
  if (!created) {
    created = new Date().toISOString();
    changed = true;
  }

  let lastUpdated = normalizeTimestamp(
    source.lastUpdated ?? source.last_updated,
  );
  if (!lastUpdated) {
    lastUpdated = created;
    changed = true;
  }

  const name =
    typeof source.name === 'string' && source.name.trim()
      ? source.name.trim()
      : `Pacientas ${patientId}`;
  if (source.name !== name) changed = true;

  const needsSync =
    typeof source.needsSync === 'boolean' ? source.needsSync : false;
  if (source.needsSync !== needsSync) changed = true;

  const payloadCandidate =
    source.data ?? source.payload ?? source.payload_data ?? null;
  const normalizedData = normalizeVersionedData(payloadCandidate);
  let versioned = normalizedData.value;
  if (normalizedData.changed) changed = true;

  if (versioned.version !== SCHEMA_VERSION) {
    try {
      versioned = migrateSchema(versioned);
      if (versioned.version !== SCHEMA_VERSION) throw new Error('');
      changed = true;
    } catch {
      if (logger?.warn) {
        logger.warn(
          `Discarding patient ${patientId} due to incompatible schema version ${versioned.version}`,
        );
      }
      return {
        record: null,
        changed: true,
        error: {
          code: 'incompatible_schema',
          message: 'Incompatible schema version.',
        },
      };
    }
  }

  const normalized = {
    ...source,
    patientId,
    name,
    created,
    lastUpdated,
    needsSync,
    data: versioned,
  };

  if (source.patientId !== patientId) changed = true;
  if (source.created !== created) changed = true;
  if (source.lastUpdated !== lastUpdated) changed = true;

  return { record: normalized, changed };
}

export function buildServerPayload(id, record) {
  if (!record || typeof record !== 'object') return null;
  const patientId = normalizePatientId(
    record.patientId ?? record.patient_id ?? id,
  );
  if (!patientId) return null;
  const payload = record.data ?? record.payload ?? null;
  const lastUpdated = normalizeTimestamp(
    record.last_updated ?? record.lastUpdated,
  );
  const created = normalizeTimestamp(record.created ?? record.created_at);
  const nameValue =
    typeof record.name === 'string' && record.name.trim()
      ? record.name.trim()
      : `Pacientas ${patientId}`;

  const body = {
    patient_id: patientId,
    name: nameValue,
    payload,
  };

  if (lastUpdated) body.last_updated = lastUpdated;
  if (created) body.created = created;

  return body;
}

function extractRemoteId(remote) {
  return normalizePatientId(
    remote.patientId ?? remote.patient_id ?? remote.id ?? remote.patientID,
  );
}

function normalizeRemoteFields(remote) {
  const patientId = extractRemoteId(remote);
  if (!patientId) {
    return {
      record: null,
      error: { code: 'invalid_id', message: 'Missing or invalid patient id.' },
    };
  }

  const created = normalizeTimestamp(
    remote.created ?? remote.created_at ?? remote.createdAt,
  );
  const lastUpdated = normalizeTimestamp(
    remote.lastUpdated ??
      remote.last_updated ??
      remote.updated_at ??
      remote.updatedAt ??
      created,
  );
  const payload = remote.payload ?? remote.data ?? null;
  const versioned = normalizeVersionedData(payload).value;

  return {
    record: {
      patientId,
      name:
        typeof remote.name === 'string' && remote.name.trim()
          ? remote.name.trim()
          : `Pacientas ${patientId}`,
      created: created ?? new Date().toISOString(),
      lastUpdated: lastUpdated ?? new Date().toISOString(),
      data: versioned,
      needsSync: false,
    },
    error: null,
  };
}

export function mapRemotePatient(remote) {
  if (!remote || typeof remote !== 'object') return null;
  const result = normalizeRemoteFields(remote);
  if (!result.record) return null;
  return {
    ...remote,
    patientId: result.record.patientId,
    lastUpdated: result.record.lastUpdated,
    data: result.record.data,
  };
}

export function normalizeRemotePatient(remote, options = {}) {
  if (!remote || typeof remote !== 'object') {
    return options.withError
      ? { record: null, error: { code: 'invalid_payload' } }
      : null;
  }
  const result = normalizeRemoteFields(remote);
  if (options.withError) return result;
  return result.record;
}
