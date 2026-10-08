// Competición: ranking global y por liga, perfiles públicos y denuncias.
// Todo se lee de cifras que el servidor ya validó y puntuó (ver src/lib/score.js y POST /api/users/stats).
const router = require('express').Router();
const { z } = require('zod');
const rateLimit = require('express-rate-limit');
const config = require('../config');
const { query, tx } = require('../db');
const { ah, HttpError } = require('../lib/http');
const VMOD = require('../lib/moderation');
const score = require('../lib/score');
const { requireAuth } = require('../middleware/auth');

router.use(requireAuth);

// El top de cada ranking es igual para todos: se cachea unos segundos para no repetir la consulta
// con miles de usuarios abriendo la pantalla a la vez. Tu propia posición se calcula aparte.
const TOP_TTL = config.rateLimitOff ? 0 : 15_000; // sin caché en los tests
const topCache = new Map();
async function top(scope, league, limit) {
  const key = `${scope}:${league}:${limit}`;
  const hit = topCache.get(key);
  if (TOP_TTL && hit && hit.at > Date.now() - TOP_TTL) return hit.rows;
  const { rows } = await query(
    `SELECT username, week_days AS days, week_sets AS sets, week_score AS score, league, xp
       FROM users
      WHERE week_key = date_trunc('week', now())::date AND NOT week_flagged AND week_score > 0
        AND ($1::smallint IS NULL OR league = $1)
      ORDER BY week_score DESC, stats_at ASC NULLS LAST
      LIMIT $2`,
    [scope === 'league' ? league : null, limit]
  );
  if (topCache.size > 100) topCache.clear();
  topCache.set(key, { at: Date.now(), rows });
  return rows;
}

// Una puntuación nueva que entraría en algún top cacheado lo invalida (así te ves subir al momento);
// las demás no tocan la caché, que es lo que la mantiene barata con millones de envíos.
function touch(points) {
  for (const [key, v] of topCache) {
    const limit = +key.split(':')[2];
    if (v.rows.length < limit || points >= v.rows[v.rows.length - 1].score) topCache.delete(key);
  }
}

// Empates: misma puntuación, misma posición (1, 1, 3…), igual que "tu posición"
const entry = (r, i, all) => ({
  rank: all.findIndex((x) => x.score === r.score) + 1,
  username: r.username,
  days: r.days,
  sets: r.sets,
  score: r.score,
  league: score.LEAGUES[r.league].id,
  level: score.levelOf(r.xp + r.score),
});

// GET /api/compete/leaderboard?scope=global|league&limit=50
router.get('/leaderboard', ah(async (req, res) => {
  const scope = req.query.scope === 'league' ? 'league' : 'global';
  const limit = z.coerce.number().int().min(1).max(100).catch(50).parse(req.query.limit);

  const { rows } = await query(
    `SELECT username, week_key = date_trunc('week', now())::date AS cur, week_days, week_sets, week_score,
            league, xp, week_flagged, date_trunc('week', now())::date::text AS week
       FROM users WHERE id = $1`,
    [req.user.id]
  );
  const me = rows[0];
  if (!me) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');
  const myScore = me.cur ? me.week_score : 0;

  const list = (await top(scope, me.league, limit)).map(entry);
  let rank = null;
  if (myScore > 0 && !me.week_flagged) {
    const { rows: r } = await query(
      `SELECT count(*)::int + 1 AS rank FROM users
        WHERE week_key = date_trunc('week', now())::date AND NOT week_flagged AND week_score > $1
          AND ($2::smallint IS NULL OR league = $2)`,
      [myScore, scope === 'league' ? me.league : null]
    );
    rank = r[0].rank;
  }
  const lg = score.LEAGUES[me.league], next = score.LEAGUES[me.league + 1];
  res.json({
    week: me.week,
    scope,
    league: lg.id,
    entries: list.map((e) => ({ ...e, me: e.username === me.username })),
    me: {
      username: me.username, rank, score: myScore, flagged: me.week_flagged,
      xp: me.xp, level: score.levelOf(me.xp + myScore), league: lg.id,
      nextLeague: next ? { id: next.id, xpNeeded: Math.max(0, next.min - me.xp - myScore) } : null,
    },
  });
}));

// GET /api/compete/profile/:username  → perfil público (sin correo ni datos privados)
router.get('/profile/:username', ah(async (req, res) => {
  const username = z.string().trim().min(1).max(20).parse(req.params.username);
  const { rows } = await query(
    `SELECT u.id, u.username, u.created_at, u.xp, u.league, u.week_flagged,
            CASE WHEN u.week_key = date_trunc('week', now())::date THEN u.week_days ELSE 0 END AS days,
            CASE WHEN u.week_key = date_trunc('week', now())::date THEN u.week_sets ELSE 0 END AS sets,
            CASE WHEN u.week_key = date_trunc('week', now())::date THEN u.week_score ELSE 0 END AS score,
            (u.last_seen_at > now() - interval '2 minutes') AS online,
            (SELECT status FROM friends f
              WHERE (f.user_id_1 = $2 AND f.user_id_2 = u.id) OR (f.user_id_2 = $2 AND f.user_id_1 = u.id)) AS friendship
       FROM users u WHERE lower(u.username) = lower($1)`,
    [username, req.user.id]
  );
  const u = rows[0];
  if (!u) throw new HttpError(404, 'not_found', 'No existe ningún usuario con ese nombre.');
  let rank = null;
  if (u.score > 0 && !u.week_flagged) {
    const { rows: r } = await query(
      `SELECT count(*)::int + 1 AS rank FROM users
        WHERE week_key = date_trunc('week', now())::date AND NOT week_flagged AND week_score > $1`,
      [u.score]
    );
    rank = r[0].rank;
  }
  res.json({
    username: u.username,
    memberSince: u.created_at,
    me: u.id === req.user.id,
    online: !!u.online,
    friendship: u.friendship || null,
    xp: u.xp,
    level: score.levelOf(u.xp + u.score),
    league: score.LEAGUES[u.league].id,
    week: { days: u.days, sets: u.sets, score: u.score, rank },
  });
}));

// POST /api/compete/report   { username, reason, details? }
const reportLimiter = rateLimit({
  windowMs: 60 * 60_000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.rateLimitOff,
  keyGenerator: (req) => req.user.id,
  message: { error: 'rate_limited', message: 'Has enviado muchas denuncias. Inténtalo más tarde.' },
});
const reportSchema = z.object({
  username: z.string().trim().min(1).max(20),
  reason: z.enum(['cheating', 'offensive_name', 'offensive_content', 'other']),
  details: z.string().trim().max(300).optional(),
});
// Con 3 denuncias de trampas de personas distintas en 14 días, la cuenta sale del ranking de la semana
// hasta que se revise. Las de nombre ofensivo se guardan para la revisión manual.
const FLAG_AT = 3;
router.post('/report', reportLimiter, ah(async (req, res) => {
  const { username, reason, details } = reportSchema.parse(req.body ?? {});
  if (details && !VMOD.text(details)) throw new HttpError(400, 'moderation', 'El texto contiene términos no permitidos.');
  const t = await query('SELECT id FROM users WHERE lower(username) = lower($1)', [username]);
  if (!t.rows[0]) throw new HttpError(404, 'not_found', 'No existe ningún usuario con ese nombre.');
  const target = t.rows[0].id;
  if (target === req.user.id) throw new HttpError(400, 'self', 'No puedes denunciarte a ti mismo.');

  const flagged = await tx(async (c) => {
    const ins = await c.query(
      `INSERT INTO reports (reporter_id, target_id, reason, details) VALUES ($1, $2, $3, $4)
       ON CONFLICT ON CONSTRAINT reports_once DO NOTHING`,
      [req.user.id, target, reason, details || null]
    );
    if (!ins.rowCount || reason !== 'cheating') return false;
    const { rows } = await c.query(
      `SELECT count(DISTINCT reporter_id)::int AS n FROM reports
        WHERE target_id = $1 AND reason = 'cheating' AND created_at > now() - interval '14 days'`,
      [target]
    );
    if (rows[0].n < FLAG_AT) return false;
    await c.query('UPDATE users SET week_flagged = true WHERE id = $1', [target]);
    return true;
  });
  topCache.clear();
  // No revelamos al denunciante si la cuenta ha quedado marcada
  void flagged;
  res.status(201).json({ ok: true, message: 'Gracias. Revisaremos la denuncia.' });
}));

// GET /api/compete/leagues → umbrales de cada liga (para pintar la barra de progreso)
router.get('/leagues', (_req, res) => res.json({ leagues: score.LEAGUES }));

router.touch = touch;
module.exports = router;
