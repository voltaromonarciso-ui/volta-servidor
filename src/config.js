require('dotenv').config();

const need = (k) => {
  if (!process.env[k]) throw new Error(`Falta la variable de entorno ${k} (mira .env.example)`);
  return process.env[k];
};

const config = {
  port: Number(process.env.PORT) || 3000,
  databaseUrl: need('DATABASE_URL'),
  pgSsl: process.env.PGSSL === 'true',
  jwtSecret: need('JWT_SECRET'),
  jwtExpires: process.env.JWT_EXPIRES || '7d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS) || 12,
  corsOrigins: (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean),
  trustProxy: process.env.TRUST_PROXY === '1',
  postCooldownMs: 10_000, // 10 s entre mensajes del foro
  isProd: process.env.NODE_ENV === 'production',
  // En los tests se registran muchos usuarios desde la misma IP: sin esto saltarían los límites
  rateLimitOff: process.env.NODE_ENV === 'test',
};

if (config.jwtSecret.length < 32) throw new Error('JWT_SECRET debe tener al menos 32 caracteres');
if (config.isProd && !config.corsOrigins.length) {
  console.warn('[aviso] CORS_ORIGINS vacío en producción: se aceptan peticiones de cualquier origen');
}

module.exports = config;
