// Redis OPCIONAL (REDIS_URL). Sin él, todo funciona en una sola instancia como antes.
// Con él: los WebSockets llegan al usuario aunque esté conectado a otra instancia (pub/sub)
// y los límites de peticiones se cuentan entre todas las instancias.
const config = require('./config');

let pub = null, sub = null;
if (config.redisUrl) {
  const { createClient } = require('redis');
  pub = createClient({ url: config.redisUrl, socket: { connectTimeout: 10_000 } });
  sub = pub.duplicate();
  for (const c of [pub, sub]) c.on('error', (e) => console.error('[redis]', e.message));
  pub.connect().catch((e) => console.error('[redis] no conecta:', e.message));
  sub.connect().catch((e) => console.error('[redis] no conecta:', e.message));
}

async function close() {
  await Promise.all([pub, sub].filter(Boolean).map((c) => c.quit().catch(() => {})));
}

module.exports = { pub, sub, enabled: !!pub, close };
