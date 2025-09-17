import express from 'express';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

let pool;
if (process.env.NODE_ENV === 'test') {
  class FakeClient {
    constructor(p) {
      this.pool = p;
    }
    async query(text, params) {
      return this.pool._execute(text, params);
    }
    release() {}
  }

  class FakePool {
    constructor() {
      this.patients = [];
      this.events = [];
      this.nextPatientId = 1;
      this.nextEventId = 1;
    }
    async connect() {
      return new FakeClient(this);
    }
    async query(text, params) {
      return this._execute(text, params);
    }
    async _execute(text, params = []) {
      text = text.trim();
      if (text.startsWith('INSERT INTO patients')) {
        let [id, name, payload] = params;
        if (id == null) {
          id = this.nextPatientId++;
        } else if (id >= this.nextPatientId) {
          this.nextPatientId = id + 1;
        }
        const record = {
          patient_id: id,
          name,
          payload,
          created: new Date(),
          last_updated: new Date(),
        };
        const idx = this.patients.findIndex((p) => p.patient_id === id);
        if (idx >= 0) this.patients[idx] = record;
        else this.patients.push(record);
        return { rows: [record] };
      }
      if (text.startsWith('SELECT * FROM patients')) {
        return { rows: [...this.patients] };
      }
      if (text.startsWith('INSERT INTO events')) {
        for (let i = 0; i < params.length; i += 2) {
          this.events.push({
            id: this.nextEventId++,
            event: params[i],
            payload: params[i + 1],
            ts: new Date(),
          });
        }
        return { rows: [] };
      }
      if (text.startsWith('SELECT * FROM events')) {
        return { rows: [...this.events] };
      }
      throw new Error('Unsupported query: ' + text);
    }
    async end() {}
  }

  pool = new FakePool();
} else {
  const connectionString = process.env.DATABASE_URL;
  const sslFlag = process.env.DATABASE_SSL;
  const isSupabase =
    typeof connectionString === 'string' && connectionString.includes('supabase.co');

  let enableSsl;
  if (typeof sslFlag === 'string' && sslFlag.trim() !== '') {
    enableSsl = ['1', 'true', 'yes', 'on'].includes(sslFlag.trim().toLowerCase());
  } else {
    enableSsl = isSupabase;
  }

  const poolConfig = {
    connectionString,
    ...(enableSsl ? { ssl: { rejectUnauthorized: false } } : {}),
  };

  pool = new pg.Pool(poolConfig);
}

async function withClient(handler) {
  let client;
  try {
    client = await pool.connect();
    return await handler(client);
  } finally {
    if (client) {
      client.release();
    }
  }
}

const app = express();

app.use(express.json());

// Redirect legacy /patients path to the new /api/patients endpoint
app.use('/patients', (req, res) => {
  res.redirect(307, '/api/patients');
});

// GET /api/patients → return all patient records
app.get('/api/patients', async (_req, res) => {
  try {
    await withClient(async (client) => {
      const { rows } = await client.query('SELECT * FROM patients');
      res.status(200).json(rows);
    });
  } catch (err) {
    console.error('Error fetching patients', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/patients → upsert incoming patient data
app.post('/api/patients', async (req, res) => {
  const { patient_id, name, payload } = req.body || {};
  if (typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({ error: 'Invalid patient name' });
  }

  try {
    await withClient(async (client) => {
      const query =
        'INSERT INTO patients (patient_id, name, payload, last_updated) VALUES ($1, $2, $3, NOW()) ON CONFLICT (patient_id) DO UPDATE SET name = EXCLUDED.name, payload = EXCLUDED.payload, last_updated = NOW() RETURNING *';
      const values = [patient_id || null, name, payload || null];
      const { rows } = await client.query(query, values);
      res.status(201).json(rows[0]);
    });
  } catch (err) {
    console.error('Error upserting patient', err);
    res.status(500).json({ error: 'Internal server error' });
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

  try {
    await withClient(async (client) => {
      const query =
        'INSERT INTO events (event, payload) VALUES ' +
        events.map((_, i) => `($${i * 2 + 1}, $${i * 2 + 2})`).join(', ');
      const values = events.flatMap((e) => [e.event, e.payload || null]);
      await client.query(query, values);
      res.status(201).json({ inserted: events.length });
    });
  } catch (err) {
    console.error('Error inserting events', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

const port = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

export { app, pool };
