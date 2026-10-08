const router = require('express').Router();
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { query, tx } = require('../db');
const score = require('../lib/score');
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

// POST /api/users/stats   { days, sets, volume }  → resumen de la semana en curso (lunes a domingo)
// El servidor valida que las cifras sean posibles, cierra la semana anterior (suma su XP) y calcula los puntos.
const statsSchema = z.object({
  days: z.number().int().min(0).max(7),
  sets: z.number().int().min(0).max(5000),
  volume: z.number().min(0).max(10_000_000),
});
const statsLimiter = rateLimit({
  windowMs: 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.rateLimitOff,
  keyGenerator: (req) => req.user.id,
  message: { error: 'rate_limited', message: 'Demasiados envíos. Espera un momento.' },
});
router.post('/stats', requireAuth, statsLimiter, ah(async (req, res) => {
  const body = statsSchema.parse(req.body ?? {});
  const stats = { ...body, volume: Math.round(body.volume) };

  const out = await tx(async (c) => {
    // Bloquea la fila: dos envíos simultáneos no pueden cerrar la misma semana dos veces
    const { rows } = await c.query(
      `SELECT week_key, week_score, week_volume, week_flagged, week_strikes, xp, prev_volume,
              date_trunc('week', now())::date AS cur, (date_trunc('week', now()) - interval '7 days')::date AS prev,
              EXTRACT(ISODOW FROM now())::int AS dow
         FROM users WHERE id = $1 FOR UPDATE`,
      [req.user.id]
    );
    const u = rows[0];
    if (!u) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');

    let { xp, prev_volume: prevVolume, week_strikes: strikes, week_flagged: flagged } = u;
    const sameWeek = u.week_key && +u.week_key === +u.cur;
    if (!sameWeek) {
      // Semana nueva: la anterior suma su XP (si no estaba marcada por trampas)
      if (u.week_key && !u.week_flagged) xp += u.week_score;
      prevVolume = u.week_key && +u.week_key === +u.prev ? u.week_volume : 0;
      strikes = 0;
      flagged = false;
    }

    const why = score.plausible(stats, u.dow);
    if (why) {
      strikes += 1;
      flagged = flagged || strikes >= score.LIMITS.strikesToFlag;
      await c.query(
        `UPDATE users SET week_key = $2, xp = $3, league = $4, prev_volume = $5, week_strikes = $6, week_flagged = $7,
                week_days = CASE WHEN $8 THEN week_days ELSE 0 END, week_sets = CASE WHEN $8 THEN week_sets ELSE 0 END,
                week_volume = CASE WHEN $8 THEN week_volume ELSE 0 END, week_score = CASE WHEN $8 THEN week_score ELSE 0 END
          WHERE id = $1`,
        [req.user.id, u.cur, xp, score.leagueOf(xp), prevVolume, strikes, flagged, sameWeek]
      );
      return { error: why };
    }

    const pts = score.weekScore(stats, prevVolume);
    await c.query(
      `UPDATE users SET week_key = $2, week_days = $3, week_sets = $4, week_volume = $5, week_score = $6,
              xp = $7, league = $8, prev_volume = $9, week_strikes = $10, week_flagged = $11, stats_at = now()
        WHERE id = $1`,
      [req.user.id, u.cur, stats.days, stats.sets, stats.volume, pts, xp, score.leagueOf(xp), prevVolume, strikes, flagged]
    );
    return { score: pts, xp, league: score.LEAGUES[score.leagueOf(xp)].id, level: score.levelOf(xp + pts), flagged };
  });

  if (out.error) {
    // Se guarda el aviso (cuenta para el antitrampas) y se rechaza el envío
    throw new HttpError(422, 'implausible', 'Esas cifras no son posibles. Revisa tu registro de entrenamientos.', { reason: out.error });
  }
  require('./compete').touch(out.score);
  res.json(out);
}));

// POST /api/users/heartbeat   (marca "en línea"; llámalo cada ~30-60 s mientras la app esté abierta)
router.post('/heartbeat', requireAuth, ah(async (req, res) => {
  const { rowCount } = await query('UPDATE users SET last_seen_at = now() WHERE id = $1', [req.user.id]);
  if (!rowCount) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');
  res.status(204).end();
}));

module.exports = router;
