import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { randomUUID } from 'node:crypto';
import './jsdomSetup.js';

process.env.NODE_ENV = 'test';

const { app, pool } = await import('../server/index.js');

let server;
let baseUrl;

const LS_KEY = 'insultoKomandaPatients_v1';

before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

test(
  'syncPatients + restorePatients round-trip preserves schema payload',
  { concurrency: false },
  async () => {
    navigator.onLine = true;
    localStorage.clear();
    if (pool.patients) {
      pool.patients = [];
      pool.nextPatientId = 1;
    }

    const patientId = randomUUID();
    const localPatient = {
      patientId,
      name: 'Test Pacientas',
      created: '2024-01-01T00:00:00.000Z',
      lastUpdated: '2024-01-02T00:00:00.000Z',
      needsSync: true,
      data: {
        version: 1,
        data: {
          foo: 'bar',
          nested: { value: 5 },
        },
      },
    };

    localStorage.setItem(LS_KEY, JSON.stringify({ [patientId]: localPatient }));

    const previousApiBase = process.env.API_BASE;
    process.env.API_BASE = `${baseUrl}/api`;
    localStorage.setItem('disableSync', 'false');
    const { syncPatients, restorePatients } = await import(
      '../js/sync.js?roundtrip'
    );
    window.disableSync = false;

    await syncPatients();

    const storedAfterSync = JSON.parse(localStorage.getItem(LS_KEY));
    assert.equal(storedAfterSync[patientId].needsSync, false);

    const { rows } = await pool.query('SELECT * FROM patients');
    assert.equal(rows.length, 1);
    assert.equal(String(rows[0].patient_id), patientId);
    assert.equal(rows[0].name, 'Test Pacientas');
    assert.deepEqual(rows[0].payload, localPatient.data);

    localStorage.clear();

    await restorePatients();

    const restored = JSON.parse(localStorage.getItem(LS_KEY));
    assert.ok(restored[patientId]);
    assert.equal(restored[patientId].patientId, patientId);
    assert.equal(restored[patientId].name, 'Test Pacientas');
    assert.deepEqual(restored[patientId].data, localPatient.data);
    assert.equal(restored[patientId].needsSync, false);
    assert.equal(
      restored[patientId].lastUpdated.slice(0, 19),
      '2024-01-02T00:00:00',
    );

    if (previousApiBase === undefined) delete process.env.API_BASE;
    else process.env.API_BASE = previousApiBase;
    localStorage.removeItem('disableSync');
  },
);
