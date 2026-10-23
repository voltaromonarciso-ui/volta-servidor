// Negocios tapadera: la Lavandería Espuma y el Lavadero de coches. Se compran en la app
// Inmobiliaria con dinero limpio. El dinero sólo se blanquea a mano, sentado al ordenador de
// una oficina tuya (la del altillo de un almacén o el despacho de la mansión): eliges cuánto
// efectivo pasa por las cuentas de cada negocio, hasta su tope del día, y el negocio se queda
// su comisión. El tope se renueva cada día de juego.
import { G, money } from '../game.js';
import { spend, earn, CONTACTS } from './economy.js';
import { save } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { openPanel } from '../ui/panels.js';

export const FRONTS = {
  lavanderia: { name: 'Lavandería Espuma', price: 12000, cap: 1500, fee: 0.10, blurb: 'Lavandería de barrio con clientela fija. Las cuentas cuadran solas.' },
  lavadero: { name: 'Lavadero de coches', price: 25000, cap: 3000, fee: 0.08, blurb: 'Túnel de lavado y boxes. Mucho efectivo pequeño: ideal para mezclar el tuyo.' },
};
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
  save();
  return { ok: true };
}

// Lo que ya ha pasado hoy por cada negocio (se vacía al cambiar de día)
function today() {
  const w = (G.state.washed ||= { day: 0, by: {}, n: 0 });
  if (w.day !== G.state.day) { w.day = G.state.day; w.by = {}; }
  return w;
}
export const leftToday = (id) => (ownsFront(id) ? Math.max(0, FRONTS[id].cap - (today().by[id] || 0)) : 0);

// Blanquear `amount` de efectivo por las cuentas de un negocio: sale del efectivo, entra en
// limpio menos la comisión
export function launder(id, amount) {
  const f = FRONTS[id];
  if (!f || !ownsFront(id)) return { ok: false, msg: 'Ese negocio no es tuyo.' };
  amount = Math.floor(amount);
  if (!(amount > 0)) return { ok: false, msg: 'Elige una cantidad.' };
  const left = leftToday(id);
  if (left <= 0) return { ok: false, msg: `${f.name} ya ha movido hoy todo lo que puede sin levantar sospechas. Mañana más.` };
  if (amount > left) return { ok: false, msg: `Hoy ${f.name} sólo puede mover ${money(left)} más.` };
  if (amount > Math.floor(G.state.money || 0)) return { ok: false, msg: 'No llevas tanto efectivo encima.' };
  const w = today(), n = ++w.n, net = Math.floor(amount * (1 - f.fee));
  const r = spend('dirty', amount, 'blanqueo: ' + f.name, { key: `wash:${id}:${w.day}:${n}` });
  if (!r.ok) { w.n--; return r; }
  earn('clean', net, 'blanqueo: ' + f.name, { key: `washed:${id}:${w.day}:${n}` });
  w.by[id] = (w.by[id] || 0) + amount;
  save();
  return { ok: true, net, fee: amount - net };
}

// Lo que blanquean en total al día y lo que te llega limpio (para la app)
export function launderStats() {
  const mine = frontIds().filter(ownsFront).map((id) => FRONTS[id]);
  return { cap: mine.reduce((a, f) => a + f.cap, 0), net: mine.reduce((a, f) => a + Math.floor(f.cap * (1 - f.fee)), 0), n: mine.length };
}

// ------------------------------------------------------------------
//  El programa del ordenador de la oficina
// ------------------------------------------------------------------
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
export function openLaunder() {
  const panel = openPanel({ title: '💻 Contabilidad · blanqueo', cls: 't-acero' });
  const amt = {};
  const render = () => {
    panel.body.innerHTML = ''; panel.foot.innerHTML = '';
    const mine = frontIds().filter(ownsFront);
    if (!mine.length) {
      panel.body.appendChild(h('p', 'muted', 'No tienes ningún negocio por el que pasar el dinero. Compra uno en la app Inmobiliaria (pestaña Negocios).'));
      return;
    }
    panel.body.appendChild(h('div', 'rowsp', `<span>Efectivo encima</span><b class="money">${money(G.state.money || 0)}</b>`));
    for (const id of mine) {
      const f = FRONTS[id], left = leftToday(id), cash = Math.floor(G.state.money || 0);
      const max = Math.min(left, cash);
      amt[id] = Math.min(amt[id] ?? max, max);
      const card = h('div', 'boss-job' + (left ? ' on' : ''));
      card.appendChild(h('div', 'rowsp', `<b>${f.name}</b><small>comisión ${Math.round(f.fee * 100)} %</small>`));
      card.appendChild(h('div', 'small muted', left ? `Hoy puede mover ${money(left)} más (tope ${money(f.cap)} al día).` : 'Hoy ya ha movido su tope. Mañana más.'));
      if (max > 0) {
        const row = h('div', 'row');
        for (const [t, v] of [['−100', -100], ['+100', 100], ['Todo', Infinity]]) {
          const b = h('button', 'chip', t);
          b.onclick = () => { amt[id] = v === Infinity ? max : Math.max(0, Math.min(max, amt[id] + v)); sfx('click'); render(); };
          row.appendChild(b);
        }
        card.appendChild(row);
        const net = Math.floor(amt[id] * (1 - f.fee));
        card.appendChild(h('div', 'rowsp', `<span>Metes ${money(amt[id])}</span><span>te llegan <b class="money">${money(net)}</b> limpios</span>`));
        const go = h('button', 'btn' + (amt[id] > 0 ? '' : ' dim'), `Blanquear ${money(amt[id])}`);
        go.onclick = () => {
          const r = launder(id, amt[id]);
          if (!r.ok) { sfx('error'); return G.act.toast?.(r.msg, '⚠️'); }
          sfx('cash'); G.act.toast?.(`${f.name}: +${money(r.net)} limpios (comisión ${money(r.fee)})`, '🧾');
          delete amt[id]; render();
        };
        card.appendChild(go);
      }
      panel.body.appendChild(card);
    }
  };
  render();
}
