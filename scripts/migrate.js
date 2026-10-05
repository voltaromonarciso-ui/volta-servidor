// Uso: npm run migrate   (ejecuta sql/schema.sql contra DATABASE_URL)
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

(async () => {
  const sql = fs.readFileSync(path.join(__dirname, '../sql/schema.sql'), 'utf8');
  await pool.query(sql);
  console.log('Esquema aplicado correctamente.');
  await pool.end();
})().catch((e) => { console.error(e); process.exit(1); });
