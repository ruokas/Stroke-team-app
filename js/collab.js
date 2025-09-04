let ws;
let roomId;
let suppress = false;
let getPayload;
let setPayload;

async function ensureStorage() {
  if (!getPayload || !setPayload) {
    ({ getPayload, setPayload } = await import('./storage.js'));
  }
}

async function broadcast() {
  if (suppress) return;
  if (!ws || ws.readyState !== WebSocket.OPEN || !roomId) return;
  await ensureStorage();
  ws.send(
    JSON.stringify({ type: 'update', room: roomId, payload: getPayload() }),
  );
}

function connect() {
  if (typeof WebSocket === 'undefined') return;
  const proto = location.protocol === 'https:' ? 'wss' : 'ws';
  ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.addEventListener('open', () => {
    ws.send(JSON.stringify({ type: 'join', room: roomId }));
    broadcast();
  });
  ws.addEventListener('message', async (ev) => {
    let msg;
    try {
      msg = JSON.parse(ev.data);
    } catch {
      return;
    }
    if (msg.type === 'update' && msg.room === roomId && msg.payload) {
      await ensureStorage();
      suppress = true;
      setPayload(msg.payload);
      suppress = false;
    }
  });
}

export function initCollab() {
  const input = document.getElementById('collabRoomInput');
  const joinBtn = document.getElementById('collabJoinBtn');
  const form = document.getElementById('appForm');
  const showBtn = document.getElementById('joinCollabBtn');
  const bar = document.getElementById('collabBar');

  showBtn?.addEventListener('click', () => {
    bar?.classList.remove('hidden');
    document.body.style.paddingBottom = '60px';
    input?.focus();
  });

  form?.addEventListener('input', () => {
    void broadcast();
  });

  joinBtn?.addEventListener('click', () => {
    const room = input?.value?.trim();
    if (!room) return;
    roomId = room;
    connect();
  });
}
