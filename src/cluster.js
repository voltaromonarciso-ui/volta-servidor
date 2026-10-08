// Arranque multiproceso: un proceso por núcleo (WEB_CONCURRENCY para fijar cuántos).
// Uso: node src/cluster.js   (npm run start:cluster)
// Con más de un proceso hace falta REDIS_URL para que los avisos en tiempo real y los límites
// de peticiones se compartan entre procesos.
const cluster = require('node:cluster');
const os = require('node:os');

if (cluster.isPrimary) {
  require('dotenv').config();
  const n = Math.max(1, Number(process.env.WEB_CONCURRENCY) || (os.availableParallelism ? os.availableParallelism() : os.cpus().length));
  if (n > 1 && !process.env.REDIS_URL) {
    console.warn(`[aviso] ${n} procesos sin REDIS_URL: los avisos por WebSocket solo llegan a quien esté en el mismo proceso y cada proceso cuenta sus propios límites.`);
  }
  console.log(`VOLTA: arrancando ${n} procesos`);
  for (let i = 0; i < n; i++) cluster.fork();
  let stopping = false;
  cluster.on('exit', (w, code, signal) => {
    if (stopping) return;
    console.error(`[cluster] proceso ${w.process.pid} terminó (${signal || code}); se reinicia`);
    setTimeout(() => cluster.fork(), 1000);
  });
  const stop = () => { stopping = true; for (const id in cluster.workers) cluster.workers[id].process.kill('SIGTERM'); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
} else {
  require('./index');
}
