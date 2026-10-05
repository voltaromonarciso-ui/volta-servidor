const http = require('http');
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { ZodError } = require('zod');
const config = require('./config');
const { pool } = require('./db');
const ws = require('./ws');

const app = express();
if (config.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, !config.corsOrigins.length || !origin || config.corsOrigins.includes(origin)),
  methods: ['GET', 'POST', 'PUT', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Retry-After'],
  maxAge: 600,
}));
app.use(express.json({ limit: '16kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/forum', require('./routes/forum'));

app.use((_req, res) => res.status(404).json({ error: 'not_found', message: 'Ruta no encontrada.' }));

// Manejador de errores único: todas las respuestas de error tienen forma { error, message }
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const issues = err.issues.map((i) => ({ field: i.path.join('.'), message: i.message }));
    return res.status(400).json({ error: 'validation', message: issues[0]?.message || 'Datos no válidos.', issues });
  }
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'validation', message: 'JSON no válido.' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'too_large', message: 'Petición demasiado grande.' });
  if (err.code === '23505') { // violación de UNIQUE (carrera entre dos registros iguales)
    const msg = /email/.test(err.constraint || '') ? 'Ya existe una cuenta con ese correo.' : 'Ese nombre de usuario ya está en uso.';
    return res.status(409).json({ error: 'conflict', message: msg });
  }
  if (err.status && err.code) {
    if (err.extra?.headers) res.set(err.extra.headers);
    const { headers, ...extra } = err.extra || {};
    return res.status(err.status).json({ error: err.code, message: err.message, ...extra });
  }
  console.error(err);
  res.status(500).json({ error: 'internal', message: 'Error interno del servidor.' });
});

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
