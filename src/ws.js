// WebSocket en /ws. Autenticación por primer mensaje {type:"auth", token} (así el JWT no viaja en la URL).
const { WebSocketServer } = require('ws');
const config = require('./config');
const { verify } = require('./middleware/auth');
const redis = require('./redis');

// Con Redis, cada aviso se publica en este canal y TODAS las instancias lo entregan a sus conexiones locales.
const CHANNEL = 'volta:ws';

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

// Entrega local (conexiones de este proceso)
function deliver({ u, p, close }) {
  const data = p ? JSON.stringify(p) : null;
  const each = (fn) => (u === '*' ? sockets.forEach((set) => set.forEach(fn)) : (sockets.get(u) || []).forEach(fn));
  each((ws) => (close ? ws.close(4401, 'account deleted') : send(ws, data)));
}
if (redis.enabled) {
  redis.sub.subscribe(CHANNEL, (raw) => { try { deliver(JSON.parse(raw)); } catch { /* mensaje corrupto: se ignora */ } })
    .catch((e) => console.error('[redis] suscripción:', e.message));
}
// Con Redis se publica (llega también a esta instancia); sin Redis se entrega directamente
function route(msg) {
  if (redis.enabled) redis.pub.publish(CHANNEL, JSON.stringify(msg)).catch(() => deliver(msg));
  else deliver(msg);
}

const sendToUser = (userId, payload) => route({ u: userId, p: payload });

/** Envía a todos los usuarios autenticados (de todas las instancias). */
const broadcast = (payload) => route({ u: '*', p: payload });

/** Cierra las conexiones de un usuario (p. ej. al borrar su cuenta). */
const disconnectUser = (userId) => route({ u: userId, close: true });

/** Conexiones abiertas en este proceso (para /health y métricas). */
const stats = () => ({ users: sockets.size, sockets: wss ? wss.clients.size : 0 });

const close = () => wss && wss.close();

module.exports = { attach, sendToUser, broadcast, disconnectUser, close, stats };
