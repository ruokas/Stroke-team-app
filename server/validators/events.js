export function parseEventsPayload(body) {
  if (!Array.isArray(body) || body.length === 0) {
    return { error: 'Invalid events payload' };
  }

  const events = [];
  for (const entry of body) {
    if (!entry || typeof entry !== 'object') {
      return { error: 'Invalid events payload' };
    }
    if (typeof entry.event !== 'string' || entry.event.trim() === '') {
      return { error: 'Invalid events payload' };
    }
    const payload = entry.payload ?? null;
    if (payload !== null) {
      const payloadType = typeof payload;
      if (
        payloadType === 'function' ||
        payloadType === 'symbol' ||
        payloadType === 'bigint'
      ) {
        return { error: 'Invalid events payload' };
      }
    }
    events.push({
      event: entry.event.trim(),
      payload,
    });
  }

  return { value: events };
}
