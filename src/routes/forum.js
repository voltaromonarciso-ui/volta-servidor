const router = require('express').Router();
const { z } = require('zod');
const { query, tx } = require('../db');
const { ah, HttpError } = require('../lib/http');
const VMOD = require('../lib/moderation');
const { requireAuth } = require('../middleware/auth');
const { postCooldown, secondsLeft, tooFast } = require('../middleware/cooldown');
const ws = require('../ws');

router.use(requireAuth);

// Formato de timestamptz::text de Postgres, p. ej. 2026-10-04 15:44:52.123456+00
const TS_RE = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}(\.\d{1,6})?[+-]\d{2}(:\d{2})?$/;

const toPost = (r) => ({
  id: r.id,
  content: r.content,
  progressData: r.progress_data,
  createdAt: r.created_at,
  author: { username: r.username },
});

// GET /api/forum/posts?limit=20&cursor=...   (más recientes primero, paginación por cursor)
const listSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().max(200).optional(),
});

router.get('/posts', ah(async (req, res) => {
  const { limit, cursor } = listSchema.parse(req.query);

  let ts = null, id = null;
  if (cursor) {
    // El cursor es "<created_at completo con microsegundos>|<id>" en base64url
    [ts, id] = Buffer.from(cursor, 'base64url').toString().split('|');
    if (!z.string().uuid().safeParse(id).success || !TS_RE.test(ts || '')) {
      throw new HttpError(400, 'validation', 'Cursor no válido.');
    }
  }

  const { rows } = await query(
    `SELECT p.id, p.content, p.progress_data, p.created_at, p.created_at::text AS cursor_ts, u.username
       FROM forum_posts p JOIN users u ON u.id = p.user_id
      WHERE ($1::timestamptz IS NULL OR (p.created_at, p.id) < ($1::timestamptz, $2::uuid))
      ORDER BY p.created_at DESC, p.id DESC
      LIMIT $3`,
    [ts, id, limit + 1]
  );

  const page = rows.slice(0, limit);
  const last = page[page.length - 1];
  res.json({
    posts: page.map(toPost),
    nextCursor: rows.length > limit ? Buffer.from(`${last.cursor_ts}|${last.id}`).toString('base64url') : null,
  });
}));

// POST /api/forum/posts   { content?, progressData? }
const MAX_CARD_BYTES = 4096;
const postSchema = z
  .object({
    content: z.string().trim().max(1000, 'El mensaje no puede superar los 1000 caracteres.').default(''),
    progressData: z
      .record(z.string(), z.unknown())
      .refine((o) => Buffer.byteLength(JSON.stringify(o)) <= MAX_CARD_BYTES, 'La tarjeta de progreso es demasiado grande.')
      .optional(),
  })
  .refine((b) => b.content || b.progressData, { message: 'Escribe algo o adjunta tu progreso.' });

router.post('/posts', postCooldown, ah(async (req, res) => {
  const { content, progressData } = postSchema.parse(req.body);

  if (content && !VMOD.text(content)) {
    throw new HttpError(422, 'banned_content', 'Tu mensaje contiene términos no permitidos.');
  }

  const post = await tx(async (c) => {
    // Candado por usuario: dos peticiones simultáneas no pueden saltarse el cooldown
    await c.query('SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))', [req.user.id]);
    const wait = await secondsLeft(c, req.user.id);
    if (wait > 0) throw tooFast(wait);

    const { rows } = await c.query(
      `INSERT INTO forum_posts (user_id, content, progress_data, created_at)
       VALUES ($1, $2, $3, clock_timestamp())
       RETURNING id, content, progress_data, created_at`,
      [req.user.id, content, progressData ? JSON.stringify(progressData) : null]
    );
    return { ...rows[0], username: req.user.username };
  });

  const out = toPost(post);
  ws.broadcast({ type: 'forum:new_post', post: out });
  res.status(201).json({ post: out });
}));

module.exports = router;
