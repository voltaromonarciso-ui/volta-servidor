// Casino Royal: tragaperras y ruleta sencillas. Se apuesta con el efectivo (dinero sucio)
// y las ganancias vuelven al efectivo: el casino NO blanquea dinero.
//
// Cada jugada es atómica y lleva su número (s.casinoSeq): la apuesta se cobra con la
// clave casino:<n> y el premio se paga con casino-win:<n>, así que una misma jugada no
// se puede cobrar ni pagar dos veces aunque se toque el botón muy deprisa.
import { G, randi } from '../game.js';
import { spend, earn, canSpend } from './economy.js';
import { save } from '../core/state.js';

export const CASINO = {
  open: 16, close: 4,              // de 16:00 a 4:00
  bets: [5, 10, 25, 50, 100, 250], // apuestas permitidas
  maxBet: 250,
};

// ¿Está abierto? (el horario cruza la medianoche)
export function casinoOpen(minute = G.state.minute) {
  const h = minute / 60;
  return h >= CASINO.open || h < CASINO.close;
}

// Tragaperras: tres rodillos. Premios (veces la apuesta, incluida la apuesta):
// 7 7 7 → ×25 · tres iguales → ×8 · dos cerezas → ×3 · una cereza → ×1 (recuperas la apuesta).
// Retorno medio ≈ 90 % (calculado con estos pesos): a la larga el casino gana.
export const REEL = ['🍒', '🍋', '🍊', '🔔', '⭐', '7️⃣'];
const WEIGHTS = [4, 6, 6, 4, 3, 1];
const REEL_BAG = REEL.flatMap((s, i) => Array(WEIGHTS[i]).fill(s));
export function slotPayout(r) {
  if (r[0] === r[1] && r[1] === r[2]) return r[0] === '7️⃣' ? 25 : 8;
  const ch = r.filter((x) => x === '🍒').length;
  return ch === 2 ? 3 : ch === 1 ? 1 : 0;
}

// Ruleta europea (0–36). Rojo/negro paga ×2, un número ×36. El 0 no es rojo ni negro.
export const RED = new Set([1, 3, 5, 7, 9, 12, 14, 16, 18, 19, 21, 23, 25, 27, 30, 32, 34, 36]);
export function rouletteColor(n) { return n === 0 ? 'verde' : RED.has(n) ? 'rojo' : 'negro'; }
export function roulettePayout(pick, n) {
  if (pick === 'rojo' || pick === 'negro') return rouletteColor(n) === pick ? 2 : 0;
  return Number(pick) === n ? 36 : 0;
}

// Juega una ronda. `game` = 'slots' | 'roulette', `pick` = elección en la ruleta.
// `rng` se puede inyectar en las pruebas.
export function play(game, bet, pick = null, rng = Math.random) {
  const s = G.state;
  bet = Math.round(Number(bet));
  if (!casinoOpen()) return { ok: false, msg: 'El casino está cerrado (abre de 16:00 a 4:00).' };
  if (!CASINO.bets.includes(bet)) return { ok: false, msg: 'Apuesta no válida.' };
  if (game === 'roulette' && !(pick === 'rojo' || pick === 'negro' || (Number.isInteger(Number(pick)) && pick !== null && Number(pick) >= 0 && Number(pick) <= 36))) return { ok: false, msg: 'Elige rojo, negro o un número.' };
  if (game !== 'slots' && game !== 'roulette') return { ok: false, msg: 'Juego no válido.' };
  if (!canSpend('dirty', bet)) return { ok: false, msg: 'No llevas suficiente efectivo para esa apuesta.' };
  const n = (s.casinoSeq = (s.casinoSeq || 0) + 1);
  const paid = spend('dirty', bet, 'casino: apuesta', { key: `casino:${n}` });
  if (!paid.ok) return { ok: false, msg: paid.msg };
  let result, mult;
  if (game === 'slots') {
    result = [0, 1, 2].map(() => REEL_BAG[Math.floor(rng() * REEL_BAG.length)]);
    mult = slotPayout(result);
  } else {
    result = Math.floor(rng() * 37);
    mult = roulettePayout(pick, result);
  }
  const win = bet * mult;
  if (win > 0) earn('dirty', win, 'casino: premio', { key: `casino-win:${n}` });
  s.stats.casino = s.stats.casino || { played: 0, bet: 0, won: 0 };
  s.stats.casino.played++; s.stats.casino.bet += bet; s.stats.casino.won += win;
  save();
  return { ok: true, round: n, result, mult, win, net: win - bet };
}

export const randomBet = () => CASINO.bets[randi(0, CASINO.bets.length - 1)];
