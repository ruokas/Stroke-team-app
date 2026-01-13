export async function insertEvents(client, events) {
  if (!Array.isArray(events) || events.length === 0) {
    return;
  }
  const batchSize = 200;
  for (let i = 0; i < events.length; i += batchSize) {
    const batch = events.slice(i, i + batchSize);
    const query =
      'INSERT INTO events (event, payload) VALUES ' +
      batch.map((_, idx) => `($${idx * 2 + 1}, $${idx * 2 + 2})`).join(', ');
    const values = batch.flatMap((e) => [e.event, e.payload || null]);
    await client.query(query, values);
  }
}
