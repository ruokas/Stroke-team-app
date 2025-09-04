import { test } from 'node:test';
import assert from 'node:assert/strict';
import { newDb } from 'pg-mem';

test('API endpoints persist data to the database', async (t) => {
  const db = newDb();
  const pg = db.adapters.createPg();
  const mock = await t.mock.module('pg', {
    defaultExport: { Pool: pg.Pool },
    namedExports: { Pool: pg.Pool },
  });

  process.env.DATABASE_URL = 'postgres://user:pass@localhost:5432/db';

  const { app, pool } = await import('../server/index.js');

  await pool.query(`CREATE TABLE patients (
    patient_id serial PRIMARY KEY,
    name text,
    payload jsonb,
    created timestamp default now(),
    last_updated timestamp default now()
  );`);
  await pool.query(`CREATE TABLE events (
    id serial PRIMARY KEY,
    event text,
    payload jsonb,
    ts timestamp default now()
  );`);

  const server = app.listen(0);
  const port = server.address().port;

  await t.test('POST /api/patients saves record', async () => {
    const res = await fetch(`http://localhost:${port}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Alice', payload: { info: 'test' } }),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    const dbRes = await pool.query(
      'SELECT name FROM patients WHERE patient_id = $1',
      [body.patient_id],
    );
    assert.strictEqual(dbRes.rows[0].name, 'Alice');
  });

  await t.test('POST /api/events saves records', async () => {
    const events = [
      { event: 'start', payload: { a: 1 } },
      { event: 'end', payload: { b: 2 } },
    ];
    const res = await fetch(`http://localhost:${port}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(events),
    });
    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.inserted, events.length);
    const dbRes = await pool.query('SELECT event FROM events ORDER BY id');
    assert.deepStrictEqual(
      dbRes.rows.map((r) => r.event),
      events.map((e) => e.event),
    );
  });

  server.close();
  mock.restore();
});
