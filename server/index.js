import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
});

const app = express();

app.use(express.json());

// GET /api/patients → return all patient records
app.get('/api/patients', async (_req, res) => {
  let client;
  try {
    client = await pool.connect();
    const { rows } = await client.query('SELECT * FROM patients');
    res.status(200).json(rows);
  } catch (err) {
    console.error('Error fetching patients', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client?.release();
  }
});

// POST /api/patients → upsert incoming patient data
app.post('/api/patients', async (req, res) => {
  const { patient_id, name, payload } = req.body || {};
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid patient name' });
  }

  let client;
  try {
    client = await pool.connect();
    const query =
      'INSERT INTO patients (patient_id, name, payload, last_updated) VALUES ($1, $2, $3, NOW()) ON CONFLICT (patient_id) DO UPDATE SET name = EXCLUDED.name, payload = EXCLUDED.payload, last_updated = NOW() RETURNING *';
    const values = [patient_id || null, name, payload || null];
    const { rows } = await client.query(query, values);
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error('Error upserting patient', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client?.release();
  }
});

// POST /api/events → batch insert analytics events
app.post('/api/events', async (req, res) => {
  const events = req.body;
  if (
    !Array.isArray(events) ||
    events.length === 0 ||
    events.some((e) => typeof e.event !== 'string')
  ) {
    return res.status(400).json({ error: 'Invalid events payload' });
  }

  let client;
  try {
    client = await pool.connect();
    const query =
      'INSERT INTO events (event, payload) VALUES ' +
      events.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
    const values = events.flatMap((e) => [e.event, e.payload || null]);
    await client.query(query, values);
    res.status(201).json({ inserted: events.length });
  } catch (err) {
    console.error('Error inserting events', err);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    client?.release();
  }
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

export { app, pool };
