const http = require('http');
const config = require('./config');
const { pool } = require('./db');
const ws = require('./ws');
const app = require('./app');

const server = http.createServer(app);
ws.attach(server);
server.listen(config.port, () => console.log(`VOLTA API en http://localhost:${config.port}  (WS: /ws)`));

const shutdown = () => {
  ws.close();
  server.close(() => pool.end().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
