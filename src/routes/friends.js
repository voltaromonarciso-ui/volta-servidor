const router = require('express').Router();
const { z } = require('zod');
const { query, tx } = require('../db');
const { ah, HttpError } = require('../lib/http');
const { requireAuth } = require('../middleware/auth');
const ws = require('../ws');

router.use(requireAuth);


// GET /api/friends  → amigos confirmados + solicitudes recibidas y enviadas pendientes
router.get('/', ah(async (req, res) => {
  const { rows } = await query(
    `SELECT f.id, f.status, f.user_id_1 AS requester, f.created_at,
            o.username, o.last_seen_at
       FROM friends f
       JOIN users o ON o.id = CASE WHEN f.user_id_1 = $1 THEN f.user_id_2 ELSE f.user_id_1 END
      WHERE (f.user_id_1 = $1 OR f.user_id_2 = $1) AND f.status IN ('pending','accepted')
      ORDER BY o.username`,
    [req.user.id]
  );
  const mine = (r) => r.requester === req.user.id;
  res.json({
    friends: rows.filter((r) => r.status === 'accepted')
      .map((r) => ({ username: r.username, lastSeen: r.last_seen_at, since: r.created_at })),
    incoming: rows.filter((r) => r.status === 'pending' && !mine(r))
      .map((r) => ({ requestId: r.id, username: r.username, createdAt: r.created_at })),
    outgoing: rows.filter((r) => r.status === 'pending' && mine(r))
      .map((r) => ({ requestId: r.id, username: r.username, createdAt: r.created_at })),
  });
}));

// POST /api/friends/request   { username }
router.post('/request', ah(async (req, res) => {
  const { username } = z.object({ username: z.string().trim().min(1).max(20) }).parse(req.body);
  const me = req.user.id;

  const t = await query('SELECT id, username FROM users WHERE lower(username) = lower($1)', [username]);
  if (!t.rows[0]) throw new HttpError(404, 'not_found', 'No existe ningún usuario con ese nombre.');
  const target = t.rows[0];
  if (target.id === me) throw new HttpError(400, 'self', 'No puedes añadirte a ti mismo.');

  const result = await tx(async (c) => {
    const { rows } = await c.query(
      `SELECT id, user_id_1, status FROM friends
        WHERE (user_id_1 = $1 AND user_id_2 = $2) OR (user_id_1 = $2 AND user_id_2 = $1)
        FOR UPDATE`,
      [me, target.id]
    );
    const row = rows[0];
    if (!row) {
      await c.query('INSERT INTO friends (user_id_1, user_id_2) VALUES ($1, $2)', [me, target.id]);
      return 'pending';
    }
    const iAmRequester = row.user_id_1 === me;
    if (row.status === 'accepted') throw new HttpError(409, 'already_friends', 'Ya sois amigos.');
    if (row.status === 'pending') {
      if (iAmRequester) throw new HttpError(409, 'already_requested', 'Ya enviaste una solicitud a este usuario.');
      // Esa persona ya te había enviado una: aceptar directamente
      await c.query("UPDATE friends SET status = 'accepted', responded_at = now() WHERE id = $1", [row.id]);
      return 'accepted';
    }
    // rejected: quien fue rechazado no puede insistir; quien rechazó sí puede reabrirla
    if (iAmRequester) throw new HttpError(409, 'rejected', 'Esta persona rechazó tu solicitud anterior.');
    await c.query(
      "UPDATE friends SET user_id_1 = $1, user_id_2 = $2, status = 'pending', created_at = now(), responded_at = NULL WHERE id = $3",
      [me, target.id, row.id]
    );
    return 'pending';
  });

  ws.sendToUser(target.id, { type: result === 'accepted' ? 'friend:accepted' : 'friend:request', from: req.user.username });
  res.status(result === 'accepted' ? 200 : 201).json({ status: result, username: target.username });
}));

// PUT /api/friends/respond   { requestId | username, action: "accept" | "reject" }
const respondSchema = z
  .object({
    requestId: z.string().uuid().optional(),
    username: z.string().trim().min(1).max(20).optional(),
    action: z.enum(['accept', 'reject']),
  })
  .refine((b) => b.requestId || b.username, 'Indica requestId o username.');

router.put('/respond', ah(async (req, res) => {
  const { requestId, username, action } = respondSchema.parse(req.body);
  const status = action === 'accept' ? 'accepted' : 'rejected';

  // Solo el DESTINATARIO (user_id_2) puede responder, y solo si sigue pendiente
  const { rows } = await query(
    `UPDATE friends f SET status = $1, responded_at = now()
       FROM users s
      WHERE s.id = f.user_id_1 AND f.user_id_2 = $2 AND f.status = 'pending'
        AND (($3::uuid IS NOT NULL AND f.id = $3::uuid) OR ($3::uuid IS NULL AND lower(s.username) = lower($4)))
      RETURNING f.id, s.id AS requester_id, s.username`,
    [status, req.user.id, requestId ?? null, username ?? null]
  );
  if (!rows[0]) throw new HttpError(404, 'not_found', 'No hay ninguna solicitud pendiente de ese usuario.');

  if (status === 'accepted') ws.sendToUser(rows[0].requester_id, { type: 'friend:accepted', from: req.user.username });
  res.json({ status, username: rows[0].username });
}));

module.exports = router;
