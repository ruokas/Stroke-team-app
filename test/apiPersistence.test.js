import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';

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

beforeEach(() => {
  if (pool.patients) {
    pool.patients = [];
    pool.nextPatientId = 1;
  }
  if (pool.events) {
    pool.events = [];
    pool.nextEventId = 1;
  }
});

test(
  'POST /api/patients inserts and updates a patient record by UUID',
  { concurrency: false },
  async () => {
    const patientId = randomUUID();
    const createdAt = '2024-01-01T00:00:00.000Z';
    const initialUpdatedAt = '2024-01-02T00:00:00.000Z';

    const createRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        name: 'Alice',
        payload: { foo: 'bar' },
        last_updated: initialUpdatedAt,
        created: createdAt,
      }),
    });
    assert.equal(createRes.status, 201);
    const createdBody = await createRes.json();
    assert.equal(createdBody.name, 'Alice');
    assert.equal(createdBody.patient_id, patientId);
    assert.equal(createdBody.last_updated.slice(0, 19), '2024-01-02T00:00:00');

    const updateRes = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_id: patientId,
        name: 'Alice Updated',
        payload: { foo: 'baz' },
        last_updated: '2024-02-02T00:00:00.000Z',
      }),
    });
    assert.equal(updateRes.status, 201);
    const updatedBody = await updateRes.json();
    assert.equal(updatedBody.patient_id, patientId);
    assert.equal(updatedBody.name, 'Alice Updated');
    assert.deepEqual(updatedBody.payload, { foo: 'baz' });
    assert.equal(updatedBody.last_updated.slice(0, 19), '2024-02-02T00:00:00');

    const { rows } = await pool.query('SELECT * FROM patients');
    assert.equal(rows.length, 1);
    assert.equal(rows[0].name, 'Alice Updated');
    assert.equal(String(rows[0].patient_id), patientId);
    assert.deepEqual(rows[0].payload, { foo: 'baz' });
  },
);

test(
  'POST /api/patients accepts camelCase identifiers and data payload',
  { concurrency: false },
  async () => {
    const id = randomUUID();
    const res = await fetch(`${baseUrl}/api/patients`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientId: id,
        name: 'Bob',
        data: { version: 1, data: { foo: 'baz' } },
        lastUpdated: '2024-02-02T00:00:00.000Z',
      }),
    });
    assert.equal(res.status, 201);
    const body = await res.json();
    assert.equal(String(body.patient_id), id);
    assert.deepEqual(body.payload, { version: 1, data: { foo: 'baz' } });
    assert.equal(body.name, 'Bob');
    assert.equal(body.last_updated.slice(0, 19), '2024-02-02T00:00:00');

    const { rows } = await pool.query('SELECT * FROM patients');
    assert.equal(rows.length, 1);
    assert.equal(String(rows[0].patient_id), id);
    assert.deepEqual(rows[0].payload, { version: 1, data: { foo: 'baz' } });
  },
);

test(
  'POST /api/events stores analytics events',
  { concurrency: false },
  async () => {
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
  },
);

test(
  'OPTIONS /api/events responds with CORS headers and allows POST',
  { concurrency: false },
  async () => {
    const optionsRes = await fetch(`${baseUrl}/api/events`, {
      method: 'OPTIONS',
    });
    assert.equal(optionsRes.status, 204);
    assert.equal(
      optionsRes.headers.get('access-control-allow-methods'),
      'OPTIONS, POST',
    );
    assert.equal(optionsRes.headers.get('access-control-allow-origin'), '*');
    assert.equal(
      optionsRes.headers.get('access-control-allow-headers'),
      'Content-Type',
    );

    const postRes = await fetch(`${baseUrl}/api/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify([{ event: 'after-options' }]),
    });
    assert.equal(postRes.status, 201);
  },
);
