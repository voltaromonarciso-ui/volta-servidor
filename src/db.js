const { Pool } = require('pg');
const config = require('./config');

const pool = new Pool({
  connectionString: config.databaseUrl,
  // Supabase/Neon/Render exigen TLS; rejectUnauthorized:false evita problemas con su CA intermedia
  ssl: config.pgSsl ? { rejectUnauthorized: false } : undefined,
  max: config.pgPoolMax,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 5_000, // si la base no da conexión en 5 s, fallo rápido en vez de cola infinita
  statement_timeout: config.pgStatementTimeoutMs,
});
pool.on('error', (err) => console.error('[pg] error en conexión inactiva:', err.message));

const query = (text, params) => pool.query(text, params);

/** Ejecuta fn(client) dentro de una transacción. */
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const out = await fn(client);
    await client.query('COMMIT');
    return out;
  } catch (e) {
    await client.query('ROLLBACK').catch(() => {});
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, tx };
