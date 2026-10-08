const fs = require('fs');
const zlib = require('zlib');
const crypto = require('crypto');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const { limiter } = require('./lib/limiter');
const { ZodError } = require('zod');
const config = require('./config');

const app = express();
if (config.trustProxy) app.set('trust proxy', 1);
app.disable('x-powered-by');

app.use(helmet());
app.use(cors({
  origin: (origin, cb) => cb(null, !config.corsOrigins.length || !origin || config.corsOrigins.includes(origin)),
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Retry-After'],
  maxAge: 600,
}));
app.use(compression()); // la app (≈1,3 MB) viaja comprimida
app.use(express.json({ limit: '16kb' }));
app.use(limiter({ name: 'global', windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false, skip: () => config.rateLimitOff }));

app.get('/health', (_req, res) => res.json({ ok: true, pid: process.pid, ws: require('./ws').stats(), uptime: Math.round(process.uptime()) }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/forum', require('./routes/forum'));
app.use('/api/compete', require('./routes/compete'));

// ── App web (Volta-app.html) + archivos para instalarla como app (PWA) ──
// La meta "volta-api" le indica a la app que use este mismo servidor como API.
const APP_FILE = path.join(__dirname, '..', 'Volta-app.html');
const appHtml = fs.existsSync(APP_FILE)
  ? fs.readFileSync(APP_FILE, 'utf8').replace('<head>', '<head><meta name="volta-api" content="same-origin">')
  : null;
// La app usa scripts y estilos en línea y llama a la API de Anthropic desde el navegador (clave del usuario)
const APP_CSP = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline'", "script-src-attr 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'", "img-src 'self' data: blob:", "media-src 'self' data: blob:", "font-src 'self' data:",
  "connect-src 'self' ws: wss: https://api.anthropic.com", "manifest-src 'self' blob:", "worker-src 'self'",
  "base-uri 'self'", "form-action 'self'", "frame-ancestors 'none'", "object-src 'none'",
].join('; ');
if (appHtml) {
  // Se comprime una sola vez al arrancar (comprimir 2,9 MB en cada visita limitaba a ~20 cargas/s)
  const appGz = zlib.gzipSync(appHtml, { level: 9 });
  // Brotli pesa bastante menos que gzip con texto: menos ancho de banda por cada visita
  // Brotli 11 tarda varios segundos: se hace en segundo plano (hilo de libuv) para no bloquear el arranque;
  // hasta que esté listo se sirve gzip.
  let appBr = null;
  zlib.brotliCompress(appHtml, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: Buffer.byteLength(appHtml) } },
    (err, buf) => { if (!err) appBr = buf; });
  const etag = '"' + crypto.createHash('sha1').update(appHtml).digest('base64url').slice(0, 20) + '"';
  app.get(['/', '/index.html'], (req, res) => {
    res.set({ 'Content-Security-Policy': APP_CSP, 'Cache-Control': 'no-cache', ETag: etag, Vary: 'Accept-Encoding' });
    if (req.headers['if-none-match'] === etag) return res.status(304).end();
    res.type('html');
    const ae = req.headers['accept-encoding'] || '';
    if (appBr && /\bbr\b/.test(ae)) return res.set('Content-Encoding', 'br').send(appBr);
    if (/\bgzip\b/.test(ae)) return res.set('Content-Encoding', 'gzip').send(appGz);
    res.send(appHtml);
  });
}
app.use(express.static(path.join(__dirname, '..', 'public'), {
  index: false,
  setHeaders(res, file) {
    if (file.endsWith('sw.js')) res.set('Cache-Control', 'no-cache');
    if (file.endsWith('.webmanifest')) res.type('application/manifest+json');
  },
}));

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
  if (err.code === '23505') { // violación de UNIQUE (carrera entre dos peticiones iguales)
    const c = err.constraint || '';
    if (c.startsWith('users_email')) return res.status(409).json({ error: 'email_taken', message: 'Ya existe una cuenta con ese correo.' });
    if (c.startsWith('users_username')) return res.status(409).json({ error: 'username_taken', message: 'Ese nombre de usuario ya está en uso.' });
    return res.status(409).json({ error: 'conflict', message: 'La operación entra en conflicto con otra. Inténtalo de nuevo.' });
  }
  if (err.code === '23503' && /user_id/.test(err.constraint || '')) { // el JWT es de una cuenta ya borrada
    return res.status(401).json({ error: 'invalid_token', message: 'La cuenta ya no existe.' });
  }
  if (err.status && err.code) {
    if (err.extra?.headers) res.set(err.extra.headers);
    const { headers, ...extra } = err.extra || {};
    return res.status(err.status).json({ error: err.code, message: err.message, ...extra });
  }
  console.error(err);
  res.status(500).json({ error: 'internal', message: 'Error interno del servidor.' });
});

module.exports = app;
