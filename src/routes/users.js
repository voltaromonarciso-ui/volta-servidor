const router = require('express').Router();
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { query } = require('../db');
const { ah, HttpError } = require('../lib/http');
const VMOD = require('../lib/moderation');
const { requireAuth } = require('../middleware/auth');

// Comprobación "en tiempo real" mientras escribe: permitimos ráfagas, pero no scraping
const checkLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.rateLimitOff,
  message: { error: 'rate_limited', message: 'Demasiadas comprobaciones. Espera un momento.' },
});

// GET /api/users/check-username?username=xyz   (público: se usa antes de registrarse)
router.get('/check-username', checkLimiter, ah(async (req, res) => {
  const username = String(req.query.username ?? '').trim();
  if (!username) throw new HttpError(400, 'validation', 'Falta el parámetro username.');

  const v = VMOD.username(username);
  if (!v.ok) return res.json({ username, available: false, reason: v.reason, message: v.message });

  const { rowCount } = await query('SELECT 1 FROM users WHERE lower(username) = lower($1)', [username]);
  if (rowCount) {
    return res.json({ username, available: false, reason: 'taken', message: 'Ese nombre de usuario ya está en uso.' });
  }
  res.json({ username, available: true });
}));

// GET /api/users/search?q=ana   (para el buscador de amigos)
router.get('/search', requireAuth, ah(async (req, res) => {
  const q = z.string().trim().min(2, 'Escribe al menos 2 letras.').max(20).parse(req.query.q);
  const like = q.replace(/[\\%_]/g, '\\$&') + '%'; // "_" es comodín en LIKE y también válido en usernames
  const { rows } = await query(
    `SELECT username FROM users
      WHERE lower(username) LIKE lower($1) AND id <> $2
      ORDER BY username LIMIT 10`,
    [like, req.user.id]
  );
  res.json({ users: rows.map((r) => ({ username: r.username })) });
}));

// POST /api/users/heartbeat   (marca "en línea"; llámalo cada ~30-60 s mientras la app esté abierta)
router.post('/heartbeat', requireAuth, ah(async (req, res) => {
  const { rowCount } = await query('UPDATE users SET last_seen_at = now() WHERE id = $1', [req.user.id]);
  if (!rowCount) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');
  res.status(204).end();
}));

module.exports = router;
