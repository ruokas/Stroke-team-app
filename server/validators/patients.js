import { randomUUID } from 'node:crypto';

export function parsePatientPayload(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return { error: 'Invalid request body' };
  }

  const {
    patient_id: snakeId,
    patientId: camelId,
    name,
    payload,
    data,
    last_updated: snakeLastUpdated,
    lastUpdated: camelLastUpdated,
  } = body;

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'Invalid patient name' };
  }

  const resolvedPatientId = snakeId ?? camelId ?? null;
  const normalizedPatientId =
    resolvedPatientId !== undefined &&
    resolvedPatientId !== null &&
    `${resolvedPatientId}`.trim() !== ''
      ? `${resolvedPatientId}`.trim()
      : randomUUID();
  const resolvedPayload = payload ?? data ?? null;
  if (resolvedPayload !== null && typeof resolvedPayload !== 'object') {
    return { error: 'Invalid payload' };
  }
  if (resolvedPayload !== null) {
    const payloadType = typeof resolvedPayload;
    if (
      payloadType === 'function' ||
      payloadType === 'symbol' ||
      payloadType === 'bigint'
    ) {
      return { error: 'Invalid payload' };
    }
  }
  const resolvedLastUpdated = snakeLastUpdated ?? camelLastUpdated ?? null;
  let normalizedLastUpdated = null;
  if (resolvedLastUpdated !== null) {
    const parsedLastUpdated =
      typeof resolvedLastUpdated === 'number'
        ? new Date(resolvedLastUpdated)
        : new Date(String(resolvedLastUpdated));
    if (Number.isNaN(parsedLastUpdated.getTime())) {
      return { error: 'Invalid last_updated value' };
    }
    normalizedLastUpdated = parsedLastUpdated.toISOString();
  }

  return {
    value: {
      patientId: normalizedPatientId,
      name: name.trim(),
      payload: resolvedPayload,
      lastUpdated: normalizedLastUpdated,
    },
  };
}
