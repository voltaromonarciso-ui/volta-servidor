const router = require('express').Router();
const bcrypt = require('bcrypt');
const { z } = require('zod');
const { limiter } = require('../lib/limiter');
const config = require('../config');
const { query } = require('../db');
const { ah, HttpError } = require('../lib/http');
const VMOD = require('../lib/moderation');
const { sign, requireAuth } = require('../middleware/auth');
const ws = require('../ws');

const authLimiter = limiter({ name: 'auth',
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.rateLimitOff,
  message: { error: 'rate_limited', message: 'Demasiados intentos. Prueba de nuevo en unos minutos.' },
});

const registerSchema = z.object({
  username: z.string().trim(),
  email: z.string().trim().toLowerCase().email('Correo electrónico no válido.').max(254),
  // bcrypt ignora todo lo que pase de 72 bytes: lo limitamos para no dar falsa seguridad
  password: z
    .string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres.')
    .refine((p) => Buffer.byteLength(p) <= 72, 'La contraseña es demasiado larga (máx. 72 bytes).'),
});

const publicUser = (u) => ({ id: u.id, username: u.username, email: u.email, createdAt: u.created_at });

// POST /api/auth/register
router.post('/register', authLimiter, ah(async (req, res) => {
  const { username, email, password } = registerSchema.parse(req.body);

  // 1) Filtro de nombres malsonantes (ES/EN) + formato → 400
  const check = VMOD.username(username);
  if (!check.ok) throw new HttpError(400, check.reason, check.message);

  // 2) Unicidad (sin distinguir mayúsculas)
  const dup = await query(
    'SELECT (lower(username) = lower($1)) AS u, (email = $2) AS e FROM users WHERE lower(username) = lower($1) OR email = $2 LIMIT 2',
    [username, email]
  );
  if (dup.rows.some((r) => r.u)) throw new HttpError(409, 'username_taken', 'Ese nombre de usuario ya está en uso.');
  if (dup.rows.some((r) => r.e)) throw new HttpError(409, 'email_taken', 'Ya existe una cuenta con ese correo.');

  const hash = await bcrypt.hash(password, config.bcryptRounds);
  // Si dos registros idénticos llegan a la vez, el índice UNIQUE lo frena (el error 23505 se mapea a 409)
  const { rows } = await query(
    'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email, created_at',
    [username, email, hash]
  );
  res.status(201).json({ token: sign(rows[0]), user: publicUser(rows[0]) });
}));

const loginSchema = z.object({
  identifier: z.string().trim().min(1), // correo o nombre de usuario
  password: z.string().min(1).max(200),
});
let dummyHash; // para igualar tiempos cuando el usuario no existe

// POST /api/auth/login
router.post('/login', authLimiter, ah(async (req, res) => {
  const { identifier, password } = loginSchema.parse(req.body);
  const { rows } = await query(
    'SELECT * FROM users WHERE lower(username) = lower($1) OR email = lower($1) LIMIT 1',
    [identifier]
  );
  const user = rows[0];
  dummyHash = dummyHash || (await bcrypt.hash('volta-dummy', config.bcryptRounds));
  const ok = await bcrypt.compare(password, user ? user.password_hash : dummyHash);
  if (!user || !ok) throw new HttpError(401, 'bad_credentials', 'Usuario o contraseña incorrectos.');
  res.json({ token: sign(user), user: publicUser(user) });
}));

// GET /api/auth/me
router.get('/me', requireAuth, ah(async (req, res) => {
  const { rows } = await query('SELECT id, username, email, created_at FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');
  res.json({ user: publicUser(rows[0]) });
}));

// DELETE /api/auth/me   { password }  → borra la cuenta, sus mensajes y amistades (ON DELETE CASCADE)
router.delete('/me', authLimiter, requireAuth, ah(async (req, res) => {
  const { password } = z.object({ password: z.string().min(1).max(200) }).parse(req.body ?? {});
  const { rows } = await query('SELECT password_hash FROM users WHERE id = $1', [req.user.id]);
  if (!rows[0]) throw new HttpError(401, 'invalid_token', 'La cuenta ya no existe.');
  // 403 y no 401: la sesión es válida (los clientes cierran sesión al recibir 401)
  if (!(await bcrypt.compare(password, rows[0].password_hash))) {
    throw new HttpError(403, 'bad_credentials', 'Contraseña incorrecta.');
  }
  await query('DELETE FROM users WHERE id = $1', [req.user.id]);
  ws.disconnectUser(req.user.id);
  res.status(204).end();
}));

module.exports = router;
