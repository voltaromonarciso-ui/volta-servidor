// Cajeros automáticos (uno por barrio en la isla): pasan dinero entre el efectivo que llevas
// encima (sucio) y la tarjeta (limpio). Reglas acordadas con el usuario:
// - Ingresar tiene un tope de 10.000 $ por semana de juego (7 días) que no se puede pasar.
// - Sacar es libre. Sin comisión y sin avisos a la policía.
import { G } from '../game.js';
import { spend, earn, canSpend } from './economy.js';

export const ATM = { weekLimit: 10000 };

const weekOf = (day) => Math.floor((day - 1) / 7);
function usage() {
  const s = G.state, w = weekOf(s.day);
  if (!s.atm || s.atm.week !== w) s.atm = { week: w, used: 0 };
  return s.atm;
}
// Lo que aún se puede ingresar esta semana
export const atmLeft = () => Math.max(0, ATM.weekLimit - usage().used);

// dir 'in': efectivo → tarjeta (cuenta para el tope); 'out': tarjeta → efectivo.
// Devuelve { ok, amount } o { ok:false, msg }.
export function atmMove(dir, amount) {
  const have = dir === 'in' ? G.state.money || 0 : G.state.clean || 0;
  if (dir === 'in' && atmLeft() <= 0) return { ok: false, msg: 'Ya has ingresado el máximo de 10.000 $ esta semana.' };
  const v = Math.min(Math.floor(amount), Math.floor(have), dir === 'in' ? atmLeft() : Infinity);
  if (v <= 0) return { ok: false, msg: dir === 'in' ? 'No llevas efectivo encima.' : 'No tienes saldo en la tarjeta.' };
  const from = dir === 'in' ? 'dirty' : 'clean', to = dir === 'in' ? 'clean' : 'dirty';
  if (!canSpend(from, v)) return { ok: false, msg: 'No hay saldo suficiente.' };
  const reason = dir === 'in' ? 'cajero: ingreso' : 'cajero: retirada';
  const a = spend(from, v, reason);
  if (!a.ok) return { ok: false, msg: a.msg };
  earn(to, v, reason);
  if (dir === 'in') usage().used += v;
  return { ok: true, amount: v };
}
