export type PatientInput = {
  patient_id?: unknown;
  patientId?: unknown;
  name?: unknown;
  payload?: unknown;
  data?: unknown;
  last_updated?: unknown;
  lastUpdated?: unknown;
};

export function parsePatientPayload(body: unknown) {
  if (typeof body !== 'object' || body === null) {
    return { error: 'Invalid request body' } as const;
  }

  const payload = body as PatientInput;
  const {
    patient_id: snakeId,
    patientId: camelId,
    name,
    payload: bodyPayload,
    data,
    last_updated: snakeLastUpdated,
    lastUpdated: camelLastUpdated,
  } = payload;

  if (typeof name !== 'string' || name.trim() === '') {
    return { error: 'Invalid patient name' } as const;
  }

  const resolvedPatientId = snakeId ?? camelId;
  if (
    resolvedPatientId !== undefined &&
    resolvedPatientId !== null &&
    `${resolvedPatientId}`.trim() === ''
  ) {
    return { error: 'Invalid patient_id' } as const;
  }

  const resolvedPayload = bodyPayload ?? data;
  if (typeof resolvedPayload !== 'object' || resolvedPayload === null) {
    return { error: 'Invalid payload' } as const;
  }

  const resolvedLastUpdated = snakeLastUpdated ?? camelLastUpdated ?? null;
  let normalizedLastUpdated: string;
  if (resolvedLastUpdated === null) {
    normalizedLastUpdated = new Date().toISOString();
  } else {
    const parsedLastUpdated = new Date(String(resolvedLastUpdated));
    if (Number.isNaN(parsedLastUpdated.getTime())) {
      return { error: 'Invalid last_updated value' } as const;
    }
    normalizedLastUpdated = parsedLastUpdated.toISOString();
  }

  const normalizedPatientId =
    resolvedPatientId !== undefined && resolvedPatientId !== null
      ? `${resolvedPatientId}`.trim()
      : crypto.randomUUID();

  return {
    value: {
      patientId: normalizedPatientId,
      name: name.trim(),
      payload: resolvedPayload,
      lastUpdated: normalizedLastUpdated,
    },
  } as const;
}

export type EventInput = { event?: unknown; payload?: unknown };

export function parseEventsPayload(body: unknown) {
  if (!Array.isArray(body) || body.length === 0) {
    return { error: 'Events payload must be a non-empty array' } as const;
  }

  const normalizedEvents: { event: string; payload: unknown }[] = [];
  for (let index = 0; index < body.length; index += 1) {
    const entry = body[index] as EventInput;
    if (typeof entry !== 'object' || entry === null) {
      return { error: `Invalid event at index ${index}` } as const;
    }

    const { event, payload } = entry;
    if (typeof event !== 'string' || event.trim() === '') {
      return { error: `Invalid event name at index ${index}` } as const;
    }

    normalizedEvents.push({
      event: event.trim(),
      payload: payload ?? null,
    });
  }

  return { value: normalizedEvents } as const;
}
