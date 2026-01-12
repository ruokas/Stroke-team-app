export async function insertEvents(client, events) {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  const query =
    'INSERT INTO events (event, payload) VALUES ' +
    events.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
  const values = events.flatMap((e) => [e.event, e.payload ?? null]);
  await client.query(query, values);
}
