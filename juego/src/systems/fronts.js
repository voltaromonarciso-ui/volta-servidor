// Negocios tapadera: la Lavandería Espuma y el Lavadero de coches. Se compran en la app
// Inmobiliaria con dinero limpio y cada mañana (a las 9:00) blanquean una parte del efectivo
// que llevas encima, hasta su tope diario y quedándose una comisión. Cada día se liquida una
// sola vez (también si duermes o pasas días fuera): se apunta el último día liquidado.
import { G, money } from '../game.js';
import { spend, earn, sendMsg, CONTACTS } from './economy.js';
import { save } from '../core/state.js';

export const FRONTS = {
  lavanderia: { name: 'Lavandería Espuma', price: 12000, cap: 1500, fee: 0.10, blurb: 'Lavandería de barrio con clientela fija. Las cuentas cuadran solas.' },
  lavadero: { name: 'Lavadero de coches', price: 25000, cap: 3000, fee: 0.08, blurb: 'Túnel de lavado y boxes. Mucho efectivo pequeño: ideal para mezclar el tuyo.' },
};
export const LAUNDER_HOUR = 9;
CONTACTS.gestor = { name: 'Paco (gestor)', icon: '🧾', color: '#2c6e49' };

const owned = () => (G.state.fronts ||= {});
export const ownsFront = (id) => !!owned()[id];
export const frontIds = () => Object.keys(FRONTS);

// Compra (desde la app): todo o nada, con dinero limpio
export function buyFront(id) {
  const f = FRONTS[id];
  if (!f) return { ok: false, msg: 'Ese negocio no existe.' };
  if (ownsFront(id)) return { ok: false, msg: `${f.name} ya es tuyo.` };
  const r = spend('clean', f.price, 'compra: ' + f.name, { key: 'front:' + id });
  if (!r.ok) return r;
  owned()[id] = true;
  G.state.frontsDay ??= dueDay(); // empieza a blanquear desde mañana
  save();
  return { ok: true };
}

// Último día de juego que ya toca liquidar (si aún no son las 9:00, el de ayer)
const dueDay = () => (G.state.minute >= LAUNDER_HOUR * 60 ? G.state.day : G.state.day - 1);

// Blanquea lo de un día: de cada negocio, lo que quepa en su tope con el efectivo que haya
export function launderDay() {
  let washed = 0, kept = 0;
  for (const id of frontIds()) {
    if (!ownsFront(id)) continue;
    const f = FRONTS[id], amount = Math.min(f.cap, Math.floor(G.state.money || 0));
    if (amount <= 0) continue;
    const net = Math.floor(amount * (1 - f.fee));
    const day = G.state.frontsDay;
    if (!spend('dirty', amount, 'blanqueo: ' + f.name, { key: `wash:${id}:${day}` }).ok) continue;
    earn('clean', net, 'blanqueo: ' + f.name, { key: `washed:${id}:${day}` });
    washed += net; kept += amount - net;
  }
  return { washed, kept };
}

// Se llama a menudo desde el bucle: liquida cada día pendiente una sola vez
export function tickFronts() {
  if (!G.state || !Object.keys(owned()).length) return;
  G.state.frontsDay ??= dueDay();
  let total = 0, fee = 0, days = 0;
  while (G.state.frontsDay < dueDay()) {
    G.state.frontsDay++;
    const r = launderDay();
    total += r.washed; fee += r.kept; days++;
  }
  if (!days) return;
  if (total > 0) {
    sendMsg('gestor', `Hecho: ${money(total)} limpios en tu cuenta${days > 1 ? ` (${days} días)` : ''}. La casa se queda ${money(fee)} de comisión.`);
    G.act.toast?.(`Blanqueo: +${money(total)} limpios`, '🧾');
  }
  save();
}

// Lo que blanquean en total al día y la comisión media (para la app)
export function launderStats() {
  const mine = frontIds().filter(ownsFront).map((id) => FRONTS[id]);
  return { cap: mine.reduce((a, f) => a + f.cap, 0), net: mine.reduce((a, f) => a + Math.floor(f.cap * (1 - f.fee)), 0), n: mine.length };
}
