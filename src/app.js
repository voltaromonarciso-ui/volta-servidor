const fs = require('fs');
const path = require('path');
const express = require('express');
const helmet = require('helmet');
const compression = require('compression');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
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
app.use(compression()); // la app (≈2,8 MB) viaja comprimida
app.use(express.json({ limit: '16kb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 300, standardHeaders: true, legacyHeaders: false, skip: () => config.rateLimitOff }));

app.get('/health', (_req, res) => res.json({ ok: true }));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/users', require('./routes/users'));
app.use('/api/friends', require('./routes/friends'));
app.use('/api/forum', require('./routes/forum'));

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
  app.get(['/', '/index.html'], (_req, res) => {
    res.set({ 'Content-Security-Policy': APP_CSP, 'Cache-Control': 'no-cache' }).type('html').send(appHtml);
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
