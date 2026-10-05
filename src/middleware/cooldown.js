const config = require('../config');
const { pool } = require('../db');
const { HttpError } = require('../lib/http');

const MESSAGE = 'Debes esperar 10 segundos entre mensajes.';

/**
 * Segundos que le faltan al usuario para poder publicar (0 = puede).
 * Lee created_at de su ÚLTIMO mensaje y usa el reloj de la base de datos,
 * así no depende de la hora del cliente ni del servidor Node.
 */
async function secondsLeft(db, userId) {
  const { rows } = await db.query(
    `SELECT CEIL(GREATEST(0, EXTRACT(EPOCH FROM
              (max(created_at) + make_interval(secs => $2) - clock_timestamp()))))::int AS wait
       FROM forum_posts WHERE user_id = $1`,
    [userId, config.postCooldownMs / 1000]
  );
  return rows[0].wait || 0;
}

const tooFast = (wait) =>
  new HttpError(429, 'rate_limited', MESSAGE, { retryAfter: wait, headers: { 'Retry-After': String(wait) } });

/** Middleware: rechaza rápido con 429 antes de validar/insertar. */
async function postCooldown(req, _res, next) {
  try {
    const wait = await secondsLeft(pool, req.user.id);
    next(wait > 0 ? tooFast(wait) : undefined);
  } catch (e) {
    next(e);
  }
}

module.exports = { postCooldown, secondsLeft, tooFast, MESSAGE };
