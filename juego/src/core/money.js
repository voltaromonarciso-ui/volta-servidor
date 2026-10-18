// Núcleo del dinero. Funciones puras sobre el estado de la partida (sin depender de G),
// para que las use también la migración del guardado.
//
// Cuentas:
//   dirty → G.state.money  (efectivo «sucio»: ventas y gastos de siempre)
//   clean → G.state.clean  (dinero limpio; en esta etapa nada lo genera todavía)
// La caja fuerte NO es una cuenta: su efectivo vive en el propio mueble (data.cash).
//
// Reglas:
// - Importes en dólares enteros. Un importe con decimales se redondea al entero más
//   cercano (Math.round) ANTES de validarlo; NaN, infinito, ≤ 0 tras redondear → error.
// - Ningún saldo puede quedar negativo, salvo el alquiler semanal de la nave
//   (regla existente, autorizada expresamente: solo con reason === 'alquiler').
// - Si algo no valida, no se toca NADA: ni saldo, ni historial, ni claves.
// - `key`: identifica UNA acción concreta (p. ej. 'deal:d1x', 'rent:8'). Una clave ya
//   usada no vuelve a ejecutarse. Se guarda en state.txKeys (persistente), aparte del
//   historial visible, y se purga pasados KEY_DAYS días de juego (máx. KEY_MAX claves).

export const ACCOUNTS = { dirty: 'money', clean: 'clean' };
export const LEDGER_MAX = 100;
export const KEY_DAYS = 14;
export const KEY_MAX = 1000;
export const NEGATIVE_OK = new Set(['alquiler']);

const fail = (code, msg) => ({ ok: false, code, msg });

// Importe válido → entero > 0, o null.
export function toAmount(n) {
  if (typeof n !== 'number' || !Number.isFinite(n)) return null;
  const v = Math.round(n);
  return v > 0 ? v : null;
}

// Saldo guardado válido = número finito (no se redondea ni se toca si ya es válido).
export const validBalance = (v) => typeof v === 'number' && Number.isFinite(v);

function ensure(s) {
  s.ledger ||= [];
  s.txKeys ||= {};
  if (!Number.isFinite(s.txSeq)) s.txSeq = 1;
}

export function keyUsed(s, key) { return !!(key && s.txKeys && key in s.txKeys); }

function remember(s, key, t) {
  if (!key) return;
  s.txKeys[key] = t;
  const keys = Object.keys(s.txKeys);
  if (keys.length > KEY_MAX || keys.length % 50 === 0) {
    const old = t - KEY_DAYS * 1440;
    for (const k of keys) if (s.txKeys[k] < old) delete s.txKeys[k];
    const left = Object.keys(s.txKeys);
    if (left.length > KEY_MAX) left.sort((a, b) => s.txKeys[a] - s.txKeys[b]).slice(0, left.length - KEY_MAX).forEach((k) => delete s.txKeys[k]);
  }
}

function log(s, e) {
  s.ledger.push({ id: s.txSeq++, ...e });
  if (s.ledger.length > LEDGER_MAX) s.ledger.splice(0, s.ledger.length - LEDGER_MAX);
}

// Comprueba sin modificar nada (para operaciones compuestas como un trato).
export function check(s, { acc, amount, kind, reason, key, allowNegative = false }) {
  const field = ACCOUNTS[acc];
  if (!field) return fail('cuenta', 'Cuenta desconocida.');
  const v = toAmount(amount);
  if (v === null) return fail('importe', 'Importe no válido.');
  if (!reason) return fail('motivo', 'Falta el motivo.');
  if (key && keyUsed(s, key)) return fail('duplicada', 'Esta operación ya se hizo.');
  if (kind === 'gasto') {
    const neg = allowNegative && NEGATIVE_OK.has(reason);
    if (!neg && (s[field] || 0) < v) return fail('saldo', 'No tienes suficiente dinero.');
  } else if (kind !== 'ingreso') return fail('tipo', 'Tipo de operación no válido.');
  return { ok: true, v, field };
}

// Ingreso o gasto en una cuenta. Devuelve { ok, amount, balance } o { ok:false, code, msg }.
export function apply(s, op, t) {
  ensure(s);
  const c = check(s, op);
  if (!c.ok) return c;
  const signed = op.kind === 'gasto' ? -c.v : c.v;
  s[c.field] = (s[c.field] || 0) + signed;
  remember(s, op.key, t);
  log(s, { t, acc: op.acc, amt: signed, kind: op.kind, reason: op.reason, bal: s[c.field], ...(op.key ? { key: op.key } : {}) });
  return { ok: true, amount: c.v, signed, balance: s[c.field] };
}

// Transferencia entre el efectivo sucio y un contenedor (caja fuerte). No es ingreso ni
// gasto. dir > 0: del efectivo al contenedor; dir < 0: del contenedor al efectivo.
export function transfer(s, box, amount, dir, reason, t) {
  ensure(s);
  const v = toAmount(amount);
  if (v === null) return fail('importe', 'Importe no válido.');
  if (!box || !validBalance(box.cash ?? 0)) return fail('caja', 'Caja no válida.');
  if (dir > 0 && (s.money || 0) < v) return fail('saldo', 'No llevas tanto dinero encima.');
  if (dir < 0 && (box.cash || 0) < v) return fail('saldo', 'La caja no tiene tanto.');
  box.cash = (box.cash || 0) + (dir > 0 ? v : -v);
  s.money = (s.money || 0) + (dir > 0 ? -v : v);
  log(s, { t, acc: 'dirty', amt: dir > 0 ? -v : v, kind: 'transferencia', reason, bal: s.money, caja: box.cash });
  return { ok: true, amount: v, balance: s.money };
}

// Al cargar: saldos corruptos → 0 (nunca se inventa dinero) y queda anotado.
export function repairBalances(s, t) {
  ensure(s);
  const fixed = [];
  for (const [acc, field] of Object.entries(ACCOUNTS)) {
    if (s[field] === undefined && field === 'clean') { s.clean = 0; continue; }
    if (!validBalance(s[field])) {
      fixed.push({ acc, was: String(s[field]) });
      s[field] = 0;
      log(s, { t, acc, amt: 0, kind: 'ajuste', reason: `saldo dañado (${String(fixed.at(-1).was)}) → 0`, bal: 0 });
    }
  }
  return fixed;
}
