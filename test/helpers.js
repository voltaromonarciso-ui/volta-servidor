// Arranca la API real contra una base de datos de pruebas.
// Necesita PostgreSQL: TEST_DATABASE_URL (por defecto postgres://volta:volta@localhost:5432/volta_test).
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL || 'postgres://volta:volta@localhost:5432/volta_test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-secret-de-al-menos-32-caracteres!!';
process.env.BCRYPT_ROUNDS = '4';

const fs = require('fs');
const path = require('path');
const http = require('http');
const { pool } = require('../src/db');
const ws = require('../src/ws');
const app = require('../src/app');

let server, base;

async function start() {
  await pool.query(fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8'));
  server = http.createServer(app);
  ws.attach(server);
  await new Promise((ok) => server.listen(0, ok));
  base = `http://127.0.0.1:${server.address().port}`;
  return base;
}

async function stop() {
  ws.close();
  await new Promise((ok) => server.close(ok));
  await pool.end();
}

const reset = () => pool.query('TRUNCATE forum_posts, friends, users CASCADE');

async function api(method, url, { token, body } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(base + url, { method, headers, body: body === undefined ? undefined : JSON.stringify(body) });
  const text = await res.text();
  return { status: res.status, headers: res.headers, body: text ? JSON.parse(text) : null };
}

let n = 0;
async function newUser(name) {
  const username = name || `user_${++n}_${Date.now() % 100000}`;
  const r = await api('POST', '/api/auth/register', {
    body: { username, email: `${username.toLowerCase()}@test.dev`, password: 'password123' },
  });
  if (r.status !== 201) throw new Error(`registro falló: ${r.status} ${JSON.stringify(r.body)}`);
  return { ...r.body.user, token: r.body.token };
}

module.exports = { start, stop, reset, api, newUser, pool };
