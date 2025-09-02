import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';

const server = http.createServer();
const wss = new WebSocketServer({ server, path: '/ws' });

const rooms = new Map(); // roomId -> Set of clients

wss.on('connection', (socket) => {
  let roomId;

  socket.on('message', (data) => {
    let message;
    try {
      message = JSON.parse(data.toString());
    } catch {
      return;
    }

    if (message.type === 'join' && typeof message.room === 'string') {
      if (roomId) {
        rooms.get(roomId)?.delete(socket);
      }
      roomId = message.room;
      if (!rooms.has(roomId)) {
        rooms.set(roomId, new Set());
      }
      rooms.get(roomId).add(socket);
    } else if (message.type === 'update' && roomId) {
      const payload = JSON.stringify({ type: 'update', payload: message.payload });
      for (const client of rooms.get(roomId) || []) {
        if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
        }
      }
    }
  });

  socket.on('close', () => {
    if (roomId && rooms.has(roomId)) {
      rooms.get(roomId).delete(socket);
      if (rooms.get(roomId).size === 0) {
        rooms.delete(roomId);
      }
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`WebSocket server listening on ws://localhost:${PORT}/ws`);
});
