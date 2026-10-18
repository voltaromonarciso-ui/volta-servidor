// Cajeros automáticos (uno por barrio en la isla): pasan dinero entre el efectivo que llevas
// encima (sucio) y la tarjeta (limpio). Reglas acordadas con el usuario:
// - Límite de 10.000 $ por semana de juego (7 días), sumando ingresos y retiradas.
// - Ingresar mucho de golpe es sospechoso: a partir de 2.000 $ el banco puede avisar a la
//   policía y una patrulla viene a cachearte (más probable cuanto mayor el ingreso).
// - Sin comisión.
import { G } from '../game.js';
import { spend, earn, canSpend } from './economy.js';
import { requestFrisk } from './police.js';

export const ATM = { weekLimit: 10000, suspectFrom: 2000 };

const weekOf = (day) => Math.floor((day - 1) / 7);
function usage() {
  const s = G.state, w = weekOf(s.day);
  if (!s.atm || s.atm.week !== w) s.atm = { week: w, used: 0 };
  return s.atm;
}
export const atmLeft = () => Math.max(0, ATM.weekLimit - usage().used);

// Probabilidad de que el banco dé el aviso por un ingreso de `v` dólares
export function suspicionChance(v) {
  if (v < ATM.suspectFrom) return 0;
  return Math.min(0.85, 0.15 + ((v - ATM.suspectFrom) / 8000) * 0.7);
}

// dir 'in': efectivo → tarjeta; 'out': tarjeta → efectivo. Devuelve { ok, amount, msg }.
export function atmMove(dir, amount, rnd = Math.random) {
  const u = usage();
  const have = dir === 'in' ? G.state.money || 0 : G.state.clean || 0;
  let v = Math.min(Math.floor(amount), Math.floor(have), atmLeft());
  if (atmLeft() <= 0) return { ok: false, msg: 'Has llegado al límite de 10.000 $ de esta semana.' };
  if (v <= 0) return { ok: false, msg: dir === 'in' ? 'No llevas efectivo encima.' : 'No tienes saldo en la tarjeta.' };
  const from = dir === 'in' ? 'dirty' : 'clean', to = dir === 'in' ? 'clean' : 'dirty';
  if (!canSpend(from, v)) return { ok: false, msg: 'No hay saldo suficiente.' };
  const reason = dir === 'in' ? 'cajero: ingreso' : 'cajero: retirada';
  const a = spend(from, v, reason);
  if (!a.ok) return { ok: false, msg: a.msg };
  earn(to, v, reason);
  u.used += v;
  let alert = false;
  if (dir === 'in' && rnd() < suspicionChance(v)) alert = requestFrisk('El banco ha avisado de un ingreso sospechoso.');
  return { ok: true, amount: v, alert };
}
