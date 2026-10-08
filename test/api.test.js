const { test, before, after, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { start, stop, reset, api, newUser, pool, base } = require('./helpers');

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
  assert.equal(wrong.status, 403);
  assert.equal((await api('GET', '/api/auth/me', { token: u.token })).status, 200);

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

// ───────────── app web / PWA ─────────────
test('sirve la app en / con la meta de API propia y una CSP que permite sus scripts', async () => {
  const res = await fetch(base() + '/');
  assert.equal(res.status, 200);
  const html = await res.text();
  assert.match(html, /<meta name="volta-api" content="same-origin">/);
  assert.match(html, /VOLTA-MEJORAS:START/);
  const csp = res.headers.get('content-security-policy');
  assert.match(csp, /script-src 'self' 'unsafe-inline'/);
  assert.match(csp, /connect-src 'self' ws: wss: https:\/\/api\.anthropic\.com/);
});

test('sirve el manifiesto, los iconos y el service worker', async () => {
  const m = await fetch(base() + '/manifest.webmanifest');
  assert.equal(m.status, 200);
  assert.match(m.headers.get('content-type'), /application\/manifest\+json/);
  const man = await m.json();
  assert.equal(man.short_name, 'Volta');
  for (const ic of man.icons) assert.equal((await fetch(base() + '/' + ic.src)).status, 200, ic.src);
  const sw = await fetch(base() + '/sw.js');
  assert.equal(sw.status, 200);
  assert.equal(sw.headers.get('cache-control'), 'no-cache');
});

// ───────────── clasificación semanal ─────────────
test('stats semanales: valida, guarda y la clasificación incluye solo amigos aceptados', async () => {
  const a = await newUser(), b = await newUser(), c = await newUser();
  // a y b amigos; c pendiente (no debe aparecer)
  await api('POST', '/api/friends/request', { token: a.token, body: { username: b.username } });
  await api('PUT', '/api/friends/respond', { token: b.token, body: { username: a.username, action: 'accept' } });
  await api('POST', '/api/friends/request', { token: c.token, body: { username: a.username } });

  assert.equal((await api('POST', '/api/users/stats', { token: a.token, body: { days: 9, sets: 1, volume: 1 } })).status, 400);
  assert.equal((await api('POST', '/api/users/stats', { token: a.token, body: { days: 1, sets: 40, volume: 12000 } })).status, 200);
  assert.equal((await api('POST', '/api/users/stats', { token: b.token, body: { days: 1, sets: 50, volume: 15500.6 } })).status, 200);
  assert.equal((await api('POST', '/api/users/stats', { token: c.token, body: { days: 1, sets: 55, volume: 99000 } })).status, 200);

  const r = await api('GET', '/api/friends/leaderboard', { token: a.token });
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.entries.map((e) => [e.username, e.volume, e.me]), [[b.username, 15501, false], [a.username, 12000, true]]);
  assert.match(r.body.week, /^\d{4}-\d{2}-\d{2}$/);
});

test('stats de una semana anterior cuentan como cero en la clasificación actual', async () => {
  const a = await newUser();
  await api('POST', '/api/users/stats', { token: a.token, body: { days: 1, sets: 10, volume: 500 } });
  await pool.query("UPDATE users SET week_key = week_key - 7 WHERE id = $1", [a.id]);
  const r = await api('GET', '/api/friends/leaderboard', { token: a.token });
  assert.deepEqual(r.body.entries.map((e) => [e.days, e.sets, e.volume]), [[0, 0, 0]]);
});

test('la app se sirve precomprimida y responde 304 si no ha cambiado', async () => {
  const r = await fetch(base() + '/', { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(r.status, 200);
  assert.match(await r.text(), /VOLTA-MEJORAS:START/); // fetch descomprime: el gzip es válido
  const etag = r.headers.get('etag');
  assert.ok(etag);
  const again = await fetch(base() + '/', { headers: { 'If-None-Match': etag } });
  assert.equal(again.status, 304);
});

// ───────────── competición ─────────────
test('stats: el servidor calcula los puntos y rechaza cifras imposibles', async () => {
  const u = await newUser();
  const ok = await api('POST', '/api/users/stats', { token: u.token, body: { days: 1, sets: 20, volume: 12000 } });
  assert.equal(ok.status, 200);
  assert.equal(ok.body.score, 100 + 20 * 5 + Math.round(40 * Math.log2(1 + 12)));
  assert.equal(ok.body.league, 'hermes');
  // el cliente no puede mandar su propia puntuación
  const forged = await api('POST', '/api/users/stats', { token: u.token, body: { days: 1, sets: 20, volume: 12000, score: 999999 } });
  assert.equal(forged.body.score, ok.body.score);
  // 200 series en un día, o 10 000 kg·reps por serie: imposibles
  const bad1 = await api('POST', '/api/users/stats', { token: u.token, body: { days: 1, sets: 200, volume: 1000 } });
  assert.equal(bad1.status, 422);
  assert.equal(bad1.body.reason, 'too_many_sets');
  const bad2 = await api('POST', '/api/users/stats', { token: u.token, body: { days: 1, sets: 2, volume: 20000 } });
  assert.equal(bad2.body.reason, 'too_much_volume');
  // se conserva el último envío válido
  const { rows } = await pool.query('SELECT week_score, week_strikes, week_flagged FROM users WHERE id = $1', [u.id]);
  assert.equal(rows[0].week_score, ok.body.score);
  assert.equal(rows[0].week_strikes, 2);
  assert.equal(rows[0].week_flagged, false);
  // tercer intento imposible → fuera del ranking esta semana
  await api('POST', '/api/users/stats', { token: u.token, body: { days: 1, sets: 1, volume: 9000 } });
  const lb = await api('GET', '/api/compete/leaderboard', { token: u.token });
  assert.equal(lb.body.me.flagged, true);
  assert.equal(lb.body.me.rank, null);
  assert.equal(lb.body.entries.length, 0);
});

test('stats: al cambiar de semana la anterior suma XP, sube de liga y premia la progresión', async () => {
  const u = await newUser();
  // semana pasada simulada: 4000 puntos y 10 000 de volumen
  await pool.query(
    `UPDATE users SET week_key = (date_trunc('week', now()) - interval '7 days')::date,
            week_score = 4000, week_volume = 10000, xp = 1000 WHERE id = $1`, [u.id]);
  const r = await api('POST', '/api/users/stats', { token: u.token, body: { days: 2, sets: 10, volume: 15000 } });
  assert.equal(r.status, 200);
  assert.equal(r.body.xp, 5000);
  assert.equal(r.body.league, 'ares');
  // +50 % de volumen frente a la semana anterior → bonus máximo de progresión (200)
  const base = 200 + 50 + Math.round(40 * Math.log2(1 + 15));
  assert.equal(r.body.score, base + 200);
});

test('ranking global y de liga con mi posición, y perfil público sin datos privados', async () => {
  const a = await newUser('alpha');
  const b = await newUser('bravo');
  const c = await newUser('charlie');
  await api('POST', '/api/users/stats', { token: a.token, body: { days: 1, sets: 10, volume: 5000 } });
  await api('POST', '/api/users/stats', { token: b.token, body: { days: 1, sets: 25, volume: 20000 } });
  await pool.query('UPDATE users SET xp = 6000, league = 2 WHERE id = $1', [c.id]); // otra liga
  await api('POST', '/api/users/stats', { token: c.token, body: { days: 1, sets: 30, volume: 30000 } });

  const g = await api('GET', '/api/compete/leaderboard?scope=global', { token: a.token });
  assert.equal(g.status, 200);
  assert.deepEqual(g.body.entries.map((e) => e.username), ['charlie', 'bravo', 'alpha']);
  assert.equal(g.body.me.rank, 3);
  assert.equal(g.body.entries[2].me, true);
  assert.equal(g.body.me.nextLeague.id, 'artemisa');

  const l = await api('GET', '/api/compete/leaderboard?scope=league', { token: a.token });
  assert.deepEqual(l.body.entries.map((e) => e.username), ['bravo', 'alpha']);
  assert.equal(l.body.me.rank, 2);

  const p = await api('GET', '/api/compete/profile/BRAVO', { token: a.token });
  assert.equal(p.status, 200);
  assert.equal(p.body.username, 'bravo');
  assert.equal(p.body.week.rank, 2);
  assert.equal(p.body.email, undefined);
  assert.equal((await api('GET', '/api/compete/profile/nadie', { token: a.token })).status, 404);
  assert.equal((await api('GET', '/api/compete/leaderboard')).status, 401);
});

test('denuncias: 3 personas distintas por trampas sacan la cuenta del ranking; texto moderado', async () => {
  const cheat = await newUser('tramposo');
  await api('POST', '/api/users/stats', { token: cheat.token, body: { days: 1, sets: 10, volume: 5000 } });
  const rs = [await newUser(), await newUser(), await newUser()];
  const bad = await api('POST', '/api/compete/report', { token: rs[0].token, body: { username: 'tramposo', reason: 'cheating', details: 'eres un gilipollas' } });
  assert.equal(bad.status, 400);
  const self = await api('POST', '/api/compete/report', { token: cheat.token, body: { username: 'tramposo', reason: 'cheating' } });
  assert.equal(self.status, 400);
  // la misma persona denunciando dos veces cuenta una sola
  for (let i = 0; i < 3; i++) {
    const r = await api('POST', '/api/compete/report', { token: rs[0].token, body: { username: 'tramposo', reason: 'cheating' } });
    assert.equal(r.status, 201);
  }
  let lb = await api('GET', '/api/compete/leaderboard', { token: rs[0].token });
  assert.deepEqual(lb.body.entries.map((e) => e.username), ['tramposo']);
  await api('POST', '/api/compete/report', { token: rs[1].token, body: { username: 'tramposo', reason: 'cheating' } });
  await api('POST', '/api/compete/report', { token: rs[2].token, body: { username: 'tramposo', reason: 'cheating', details: 'Hace 60 series cada día' } });
  lb = await api('GET', '/api/compete/leaderboard', { token: rs[0].token });
  assert.equal(lb.body.entries.length, 0);
});
