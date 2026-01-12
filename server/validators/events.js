export function parseEventsPayload(body) {
  if (
    !Array.isArray(body) ||
    body.length === 0 ||
    body.some((e) => typeof e.event !== 'string' || e.event.trim() === '')
  ) {
    return { error: 'Invalid events payload' };
  }

  const events = body.map((entry) => ({
    event: entry.event.trim(),
    payload: entry.payload ?? null,
  }));

  return { value: events };
}
