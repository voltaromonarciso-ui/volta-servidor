const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { start, stop, reset, api, newUser, pool } = require('./helpers');

before(start);
after(stop);
beforeEach(reset);

const card = (over = {}) => ({
  type: 'weekly', icon: '📅', title: 'Resumen semanal',
  stats: [['Días entrenados', '3/4'], ['Volumen', '+5 %']], note: '', ...over,
});

// ───────────── auth ─────────────
test('registro, login con usuario o correo y /me', async () => {
  const u = await newUser('Ana_Fit');
  const byName = await api('POST', '/api/auth/login', { body: { identifier: 'ana_fit', password: 'password123' } });
  assert.equal(byName.status, 200);
  const byMail = await api('POST', '/api/auth/login', { body: { identifier: 'ANA_FIT@test.dev', password: 'password123' } });
  assert.equal(byMail.status, 200);
  const bad = await api('POST', '/api/auth/login', { body: { identifier: 'ana_fit', password: 'nope-nope' } });
  assert.equal(bad.status, 401);
  const me = await api('GET', '/api/auth/me', { token: u.token });
  assert.equal(me.body.user.username, 'Ana_Fit');
});

test('registro rechaza nombre duplicado sin distinguir mayúsculas', async () => {
  await newUser('marta');
  const r = await api('POST', '/api/auth/register', { body: { username: 'MARTA', email: 'otra@test.dev', password: 'password123' } });
  assert.equal(r.status, 409);
  assert.equal(r.body.error, 'username_taken');
});

test('check-username informa de nombres ocupados o malsonantes', async () => {
  await newUser('pepe');
  assert.equal((await api('GET', '/api/users/check-username?username=Pepe')).body.reason, 'taken');
  assert.equal((await api('GET', '/api/users/check-username?username=gilipollas1')).body.reason, 'banned');
  assert.equal((await api('GET', '/api/users/check-username?username=libre_99')).body.available, true);
});

test('un token de una cuenta borrada devuelve 401, no 500', async () => {
  const u = await newUser();
  await pool.query('DELETE FROM users WHERE id = $1', [u.id]);
  const r = await api('POST', '/api/forum/posts', { token: u.token, body: { content: 'hola' } });
  assert.equal(r.status, 401);
  const f = await api('POST', '/api/users/heartbeat', { token: u.token });
  assert.equal(f.status, 401);
});

test('DELETE /api/auth/me borra la cuenta y sus datos si la contraseña es correcta', async () => {
  const u = await newUser();
  const v = await newUser();
  await api('POST', '/api/forum/posts', { token: u.token, body: { content: 'adiós' } });
  await api('POST', '/api/friends/request', { token: u.token, body: { username: v.username } });

  const wrong = await api('DELETE', '/api/auth/me', { token: u.token, body: { password: 'incorrecta' } });
  assert.equal(wrong.status, 401);

  const ok = await api('DELETE', '/api/auth/me', { token: u.token, body: { password: 'password123' } });
  assert.equal(ok.status, 204);
  const { rows } = await pool.query(
    'SELECT (SELECT count(*) FROM users WHERE id=$1)::int u, (SELECT count(*) FROM forum_posts WHERE user_id=$1)::int p, (SELECT count(*) FROM friends WHERE user_id_1=$1 OR user_id_2=$1)::int f',
    [u.id]
  );
  assert.deepEqual(rows[0], { u: 0, p: 0, f: 0 });
  assert.equal((await api('GET', '/api/auth/me', { token: u.token })).status, 401);
});

// ───────────── amigos ─────────────
test('flujo de amistad: solicitud, aceptación y listado', async () => {
  const a = await newUser();
  const b = await newUser();
  assert.equal((await api('POST', '/api/friends/request', { token: a.token, body: { username: b.username } })).status, 201);
  const inc = await api('GET', '/api/friends', { token: b.token });
  assert.equal(inc.body.incoming[0].username, a.username);
  const resp = await api('PUT', '/api/friends/respond', { token: b.token, body: { username: a.username, action: 'accept' } });
  assert.equal(resp.body.status, 'accepted');
  const list = await api('GET', '/api/friends', { token: a.token });
  assert.equal(list.body.friends[0].username, b.username);
});

test('solicitudes cruzadas simultáneas acaban en amistad, nunca en error', async () => {
  for (let i = 0; i < 10; i++) {
    await reset();
    const a = await newUser();
    const b = await newUser();
    const [r1, r2] = await Promise.all([
      api('POST', '/api/friends/request', { token: a.token, body: { username: b.username } }),
      api('POST', '/api/friends/request', { token: b.token, body: { username: a.username } }),
    ]);
    assert.deepEqual([r1.status, r2.status].sort(), [200, 201], JSON.stringify([r1.body, r2.body]));
    const { rows } = await pool.query("SELECT status FROM friends");
    assert.deepEqual(rows, [{ status: 'accepted' }]);
  }
});

// ───────────── foro ─────────────
test('publicar, cooldown de 10 s y paginación por cursor', async () => {
  const users = await Promise.all([1, 2, 3].map(() => newUser()));
  for (const u of users) {
    assert.equal((await api('POST', '/api/forum/posts', { token: u.token, body: { content: `hola de ${u.username}` } })).status, 201);
  }
  const fast = await api('POST', '/api/forum/posts', { token: users[0].token, body: { content: 'otra vez' } });
  assert.equal(fast.status, 429);
  assert.ok(Number(fast.headers.get('retry-after')) > 0);

  const p1 = await api('GET', '/api/forum/posts?limit=2', { token: users[0].token });
  assert.equal(p1.body.posts.length, 2);
  assert.equal(p1.body.posts[0].author.username, users[2].username);
  const p2 = await api('GET', `/api/forum/posts?limit=2&cursor=${p1.body.nextCursor}`, { token: users[0].token });
  assert.equal(p2.body.posts.length, 1);
  assert.equal(p2.body.nextCursor, null);
});

test('acepta las tarjetas de progreso que genera la app', async () => {
  const u = await newUser();
  const r = await api('POST', '/api/forum/posts', { token: u.token, body: { content: '', progressData: card() } });
  assert.equal(r.status, 201);
  assert.deepEqual(r.body.post.progressData, card());
});

test('rechaza tarjetas con forma inválida (romperían el foro de todos)', async () => {
  const bad = [
    card({ stats: 'no-soy-lista' }),
    card({ stats: { a: 1 } }),
    card({ stats: [['solo-uno']] }),
    card({ title: { html: '<b>' } }),
    card({ stats: Array.from({ length: 20 }, () => ['x', 'y']) }),
    { foo: 'bar' },
  ];
  for (const progressData of bad) {
    const u = await newUser();
    const r = await api('POST', '/api/forum/posts', { token: u.token, body: { progressData } });
    assert.equal(r.status, 400, JSON.stringify(progressData));
  }
});

test('el filtro de palabras también se aplica a los textos de la tarjeta', async () => {
  const u = await newUser();
  const r = await api('POST', '/api/forum/posts', { token: u.token, body: { progressData: card({ title: 'eres un gilipollas' }) } });
  assert.equal(r.status, 422);
});
