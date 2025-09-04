import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { app, pool } = await import('../server/index.js');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

test('POST /api/patients inserts a patient record', async () => {
  const res = await fetch(`${baseUrl}/api/patients`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name: 'Alice', payload: { foo: 'bar' } }),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.name, 'Alice');

  const { rows } = await pool.query('SELECT * FROM patients');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].name, 'Alice');
});

test('POST /api/events stores analytics events', async () => {
  const res = await fetch(`${baseUrl}/api/events`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify([
      { event: 'load', payload: { a: 1 } },
      { event: 'click', payload: { b: 2 } },
    ]),
  });
  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.inserted, 2);

  const { rows } = await pool.query('SELECT * FROM events');
  assert.equal(rows.length, 2);
  assert.deepEqual(
    rows.map((r) => r.event),
    ['load', 'click'],
  );
});
