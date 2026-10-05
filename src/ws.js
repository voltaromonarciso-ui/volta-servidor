// WebSocket en /ws. Autenticación por primer mensaje {type:"auth", token} (así el JWT no viaja en la URL).
const { WebSocketServer } = require('ws');
const config = require('./config');
const { verify } = require('./middleware/auth');

const sockets = new Map(); // userId -> Set<WebSocket>
let wss;

const allowedOrigin = (origin) =>
  !config.corsOrigins.length || (origin && config.corsOrigins.includes(origin));

function attach(server) {
  wss = new WebSocketServer({ noServer: true, maxPayload: 2048 });

  server.on('upgrade', (req, socket, head) => {
    const path = new URL(req.url, 'http://localhost').pathname;
    if (path !== '/ws' || !allowedOrigin(req.headers.origin)) {
      socket.write('HTTP/1.1 403 Forbidden\r\n\r\n');
      return socket.destroy();
    }
    wss.handleUpgrade(req, socket, head, (ws) => wss.emit('connection', ws, req));
  });

  wss.on('connection', (ws) => {
    ws.isAlive = true;
    ws.userId = null;
    const authTimer = setTimeout(() => ws.close(4401, 'auth timeout'), 5000);

    ws.on('pong', () => { ws.isAlive = true; });
    ws.on('message', (raw) => {
      let msg;
      try { msg = JSON.parse(raw.toString()); } catch { return ws.close(4400, 'bad json'); }
      if (ws.userId) return; // el cliente solo escucha; ignoramos el resto
      if (msg.type !== 'auth') return ws.close(4401, 'auth required');
      try {
        ws.userId = verify(msg.token).sub;
      } catch {
        return ws.close(4401, 'invalid token');
      }
      clearTimeout(authTimer);
      if (!sockets.has(ws.userId)) sockets.set(ws.userId, new Set());
      sockets.get(ws.userId).add(ws);
      ws.send(JSON.stringify({ type: 'ready' }));
    });
    ws.on('close', () => {
      clearTimeout(authTimer);
      const set = ws.userId && sockets.get(ws.userId);
      if (set) { set.delete(ws); if (!set.size) sockets.delete(ws.userId); }
    });
    ws.on('error', () => ws.terminate());
  });

  // Elimina conexiones muertas cada 30 s
  const iv = setInterval(() => {
    wss.clients.forEach((c) => {
      if (!c.isAlive) return c.terminate();
      c.isAlive = false;
      c.ping();
    });
  }, 30_000);
  wss.on('close', () => clearInterval(iv));
}

const send = (ws, data) => { if (ws.readyState === ws.OPEN) ws.send(data); };

function sendToUser(userId, payload) {
  const data = JSON.stringify(payload);
  (sockets.get(userId) || []).forEach((ws) => send(ws, data));
}

/** Envía a todos los usuarios autenticados. */
function broadcast(payload) {
  const data = JSON.stringify(payload);
  sockets.forEach((set) => set.forEach((ws) => send(ws, data)));
}

const close = () => wss && wss.close();

module.exports = { attach, sendToUser, broadcast, close };
