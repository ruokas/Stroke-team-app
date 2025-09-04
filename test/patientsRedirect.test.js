import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';

process.env.NODE_ENV = 'test';

const { app } = await import('../server/index.js');

let server;
let baseUrl;

before(() => {
  server = app.listen(0);
  baseUrl = `http://127.0.0.1:${server.address().port}`;
});

after(() => {
  server.close();
});

test('GET /patients redirects to /api/patients', async () => {
  const res = await fetch(`${baseUrl}/patients`, { redirect: 'manual' });
  assert.equal(res.status, 307);
  assert.equal(res.headers.get('location'), '/api/patients');
});
