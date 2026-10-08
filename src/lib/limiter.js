// Límite de peticiones. Con Redis el contador es común a todas las instancias;
// sin Redis cada proceso cuenta por su cuenta (válido con una sola instancia).
const rateLimit = require('express-rate-limit');
const config = require('../config');
const redis = require('../redis');

let n = 0;
function limiter(opts) {
  const o = { standardHeaders: true, legacyHeaders: false, skip: () => config.rateLimitOff, ...opts };
  if (redis.enabled) {
    const { RedisStore } = require('rate-limit-redis');
    o.store = new RedisStore({ prefix: `rl:${opts.name || ++n}:`, sendCommand: (...args) => redis.pub.sendCommand(args) });
  }
  delete o.name;
  return rateLimit(o);
}

module.exports = { limiter };
