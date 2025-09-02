import './jsdomSetup.js';
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { WebSocket, WebSocketServer } from 'ws';

const wait = (ms = 50) => new Promise((r) => setTimeout(r, ms));

test('collaboration websocket flow', async () => {
  global.WebSocket = WebSocket;

  const wss = new WebSocketServer({ port: 0, path: '/ws' });
  const { port } = wss.address();
  global.location = { protocol: 'http:', host: `localhost:${port}` };

  const messages = [];
  let serverSocket;
  wss.on('connection', (socket) => {
    serverSocket = socket;
    socket.on('message', (data) => messages.push(data.toString()));
  });

  const dialog = document.getElementById('collabDialog');
  if (dialog) {
    dialog.close = () => {};
    dialog.showModal = () => {};
  }

  const { initCollab } = await import('../js/collab.js');
  initCollab();

  document.getElementById('collabRoomInput').value = 'room1';
  document.getElementById('collabJoinBtn').click();

  await wait(100);
  assert.deepEqual(JSON.parse(messages[0]), { type: 'join', room: 'room1' });

  const initialUpdates = messages.filter(
    (m) => JSON.parse(m).type === 'update',
  ).length;
  document
    .getElementById('appForm')
    .dispatchEvent(new Event('input', { bubbles: true }));
  await wait();
  const updatesAfterEdit = messages.filter(
    (m) => JSON.parse(m).type === 'update',
  ).length;
  assert.ok(updatesAfterEdit > initialUpdates);

  const before = messages.length;
  serverSocket.send(
    JSON.stringify({
      type: 'update',
      room: 'room1',
      payload: { p_weight: '42' },
    }),
  );
  await wait();
  assert.equal(document.querySelector('#p_weight')?.value, '42');
  assert.equal(messages.length, before);

  wss.close();
});
