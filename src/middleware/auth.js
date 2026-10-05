const jwt = require('jsonwebtoken');
const config = require('../config');
const { HttpError } = require('../lib/http');

const sign = (user) =>
  jwt.sign({ username: user.username }, config.jwtSecret, {
    subject: user.id,
    algorithm: 'HS256',
    expiresIn: config.jwtExpires,
  });

const verify = (token) => jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });

function requireAuth(req, _res, next) {
  const m = /^Bearer (.+)$/i.exec(req.headers.authorization || '');
  if (!m) return next(new HttpError(401, 'unauthorized', 'Inicia sesión para continuar.'));
  try {
    const p = verify(m[1]);
    req.user = { id: p.sub, username: p.username };
    next();
  } catch {
    next(new HttpError(401, 'invalid_token', 'Sesión caducada o inválida. Vuelve a iniciar sesión.'));
  }
}

module.exports = { sign, verify, requireAuth };
