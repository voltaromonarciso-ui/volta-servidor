// Encargos de la mansión (sólo si es tuya):
//   - Fiestas privadas (en el bar del salón): pagas el catering y esa noche, de 22:00 a 2:00,
//     los invitados ricos compran producto envasado un 60 % más caro, hasta lo que pidan.
//   - Reuniones con los socios (en la mesa del despacho): una propuesta al día de compra al por
//     mayor de un producto tuyo; pagan por transferencia, en dinero LIMPIO.
// Una fiesta y una reunión por día de juego; todo se guarda en G.state.mansionJobs.
import { G, money, pick } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { earn, spend, product, prodValue, addXP, sendMsg, CONTACTS } from './economy.js';
import { inv, save, absNow } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { openPanel, closePanel } from '../ui/panels.js';

export const PARTY = { cost: 400, from: 22 * 60, hours: 4, premium: 1.6 };
export const PARTNERS = { premium: 1.15 };
CONTACTS.socio = { name: 'Don Aurelio (socio)', icon: '🎩', color: '#6b4f2a' };

const S = () => (G.state.mansionJobs ||= { party: null, partner: null, partnerDay: 0 });
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const fail = (msg) => { sfx('error'); G.act.toast?.(msg, '⚠️'); };
const dayStart = (day) => (day - 1) * 1440;
const inMansion = () => { const r = G.world.props.mansion, p = G.player.pos; return r && p.x > r.x0 && p.x < r.x1 && p.z > r.z0 && p.z < r.z1; };

// Producto envasado que llevas (unidades por variedad) y cómo sacarlo del inventario
function packedStacks() {
  const out = [];
  G.state.inv.forEach((s, i) => { if (s && ITEMS[s.id]?.packed && product(s.p)) out.push({ i, s, u: ITEMS[s.id].units || 1 }); });
  return out;
}
const packedUnits = (strain) => packedStacks().filter((x) => !strain || product(x.s.p).strain === strain).reduce((a, x) => a + x.s.q * x.u, 0);
// Saca envases hasta `units` unidades (de lo más pequeño a lo más grande, sin pasarse si se
// puede) y devuelve [unidades, valor] de lo que ha salido
function takeUnits(units, strain) {
  let got = 0, value = 0;
  const list = packedStacks().filter((x) => !strain || product(x.s.p).strain === strain).sort((a, b) => a.u - b.u);
  for (const x of list) {
    while (x.s.q > 0 && got + x.u <= units) {
      x.s.q--; got += x.u; value += prodValue(product(x.s.p)) * x.u;
      if (x.s.q <= 0) G.state.inv[x.i] = null;
    }
  }
  return [got, value];
}

// ------------------------------------------------------------------
//  Fiestas
// ------------------------------------------------------------------
export function partyNow() {
  const p = S().party;
  if (!p) return null;
  const t = absNow(), start = dayStart(p.day) + PARTY.from, end = start + PARTY.hours * 60;
  return { ...p, start, end, state: t < start ? 'pronto' : t < end ? 'en marcha' : 'acabada' };
}
export function organizeParty() {
  const s = S(), cur = partyNow();
  if (cur && cur.state !== 'acabada') return { ok: false, msg: 'Ya hay una fiesta organizada para esta noche.' };
  if (cur && cur.day === G.state.day) return { ok: false, msg: 'Hoy ya ha habido fiesta. Mañana más.' };
  if (G.state.minute >= PARTY.from) return { ok: false, msg: 'Es muy tarde para organizar la de hoy: mañana antes de las 22:00.' };
  const r = spend('dirty', PARTY.cost, 'fiesta: catering', { key: `party:${G.state.day}` });
  if (!r.ok) return r;
  const want = 12 + (G.state.rank || 0) * 4;
  s.party = { day: G.state.day, want, sold: 0, earned: 0 };
  save();
  return { ok: true, want };
}
// Vender a los invitados: lo que pidan (hasta que se acabe la fiesta), al precio de fiesta
export function sellToGuests() {
  const p = partyNow();
  if (!p || p.state !== 'en marcha') return { ok: false, msg: p?.state === 'pronto' ? 'Los invitados llegan a las 22:00.' : 'No hay ninguna fiesta en marcha.' };
  if (!inMansion()) return { ok: false, msg: 'Tienes que estar en la mansión.' };
  const left = p.want - p.sold;
  if (left <= 0) return { ok: false, msg: 'Los invitados ya tienen todo lo que querían.' };
  const [units, value] = takeUnits(left);
  if (!units) return { ok: false, msg: 'No llevas nada envasado para vender.' };
  const pay = Math.round(value * PARTY.premium);
  earn('dirty', pay, 'fiesta: ventas', { sale: true });
  const s = S().party; s.sold += units; s.earned += pay;
  addXP(units * 2);
  save();
  return { ok: true, units, pay };
}

export function openParty() {
  const panel = openPanel({ title: '🍾 Fiestas en la mansión', cls: 't-cartel' });
  const render = () => {
    panel.body.innerHTML = ''; panel.foot.innerHTML = '';
    const p = partyNow();
    if (!p || (p.state === 'acabada' && p.day !== G.state.day) || (p.state === 'acabada' && G.state.minute < PARTY.from && p.day !== G.state.day)) {
      panel.body.appendChild(h('p', '', `Monta una fiesta privada esta noche: la gente con dinero viene a por producto envasado y paga un <b>${Math.round((PARTY.premium - 1) * 100)} % más</b>.`));
      panel.body.appendChild(h('div', 'rowsp', `<span>Catering y seguridad</span><b class="money">${money(PARTY.cost)}</b>`));
      panel.body.appendChild(h('div', 'small muted', `Los invitados llegan a las 22:00 y se van a las 2:00. Querrán unas ${12 + (G.state.rank || 0) * 4} unidades.`));
      const b = h('button', 'btn', 'Organizar la fiesta de esta noche');
      b.onclick = () => { const r = organizeParty(); if (!r.ok) return fail(r.msg); sfx('cash'); G.act.toast?.(`Fiesta organizada: esta noche a las 22:00.`, '🍾'); render(); };
      panel.foot.appendChild(b);
      return;
    }
    panel.body.appendChild(h('div', 'boss-job on', `<div class="rowsp"><b>Fiesta del día ${p.day}</b><small>${p.state}</small></div>
      <div class="rowsp"><span>Vendido</span><b>${p.sold} / ${p.want} unidades</b></div><div class="rowsp"><span>Ganado</span><b class="money">${money(p.earned)}</b></div>`));
    if (p.state === 'pronto') panel.body.appendChild(h('div', 'small muted', 'Los invitados llegan a las 22:00. Ten producto envasado encima.'));
    if (p.state === 'en marcha') {
      panel.body.appendChild(h('div', 'small muted', `Llevas ${packedUnits()} unidades envasadas.`));
      const b = h('button', 'btn' + (packedUnits() ? '' : ' dim'), 'Vender a los invitados');
      b.onclick = () => { const r = sellToGuests(); if (!r.ok) return fail(r.msg); sfx('cash'); G.act.toast?.(`Los invitados compran ${r.units} unidades: +${money(r.pay)}`, '🍾'); render(); };
      panel.foot.appendChild(b);
    }
    if (p.state === 'acabada') panel.body.appendChild(h('div', 'small muted', 'La fiesta ya terminó. Puedes montar otra mañana.'));
  };
  render();
}

// ------------------------------------------------------------------
//  Socios
// ------------------------------------------------------------------
// La propuesta del día: un producto que ya hayas fabricado, al por mayor, pagado en limpio
export function partnerOffer() {
  const s = S();
  if (s.partnerDay === G.state.day && s.partner) return s.partner;
  if (s.partnerDay === G.state.day) return null; // (hoy ya se cerró el trato)
  const mine = Object.values(G.state.products || {}).filter((p) => STRAINS[p.strain] && p.base);
  if (!mine.length) return null;
  const p = mine[(G.state.day * 7 + (s.done || 0)) % mine.length];
  const units = 20 + Math.min(40, (G.state.rank || 0) * 6);
  const price = Math.round(prodValue(p) * PARTNERS.premium);
  s.partner = { day: G.state.day, strain: p.strain, pid: p.id, name: p.name, units, price, total: units * price };
  s.partnerDay = G.state.day;
  save();
  return s.partner;
}
export function closeDeal() {
  const s = S(), o = s.partnerDay === G.state.day ? s.partner : null;
  if (!o) return { ok: false, msg: 'Hoy no hay ninguna propuesta abierta.' };
  if (packedUnits(o.strain) < o.units) return { ok: false, msg: `Te faltan ${o.units - packedUnits(o.strain)} unidades envasadas de ${o.name}.` };
  const [units] = takeUnits(o.units, o.strain);
  if (units < o.units) { save(); return { ok: false, msg: 'Con esos envases no sale la cantidad justa: prueba con sobres sueltos.' }; }
  earn('clean', o.total, `socios: ${o.units}× ${o.name}`, { key: `deal:${o.day}` });
  s.partner = null; s.done = (s.done || 0) + 1;
  addXP(o.units);
  sendMsg('socio', pick(['Un placer hacer negocios. El dinero ya está en tu cuenta.', 'Transferencia hecha. Mañana te llamo.', 'Limpio y a tiempo. Así da gusto.']));
  save();
  return { ok: true, total: o.total };
}

export function openPartners() {
  const panel = openPanel({ title: '🎩 Reunión con los socios', cls: 't-cartel' });
  const render = () => {
    panel.body.innerHTML = ''; panel.foot.innerHTML = '';
    const o = partnerOffer();
    if (!o) {
      panel.body.appendChild(h('p', 'muted', S().partnerDay === G.state.day ? 'Hoy ya cerraste el trato. Vuelve mañana.' : 'Todavía no tienes producto propio que ofrecer: fabrica algo primero.'));
      return;
    }
    panel.body.appendChild(h('div', 'shop-hello', `Don Aurelio: <b>«Mis clientes quieren ${o.units} unidades de ${o.name}. Pago por transferencia, todo limpio.»</b>`));
    panel.body.appendChild(h('div', 'boss-job', `<div class="rowsp"><span>Precio por unidad</span><b class="money">${money(o.price)}</b></div>
      <div class="rowsp"><span>Total (dinero limpio)</span><b class="money">${money(o.total)}</b></div>
      <div class="small">Llevas ${packedUnits(o.strain)} de ${o.units} unidades envasadas.</div>`));
    const b = h('button', 'btn' + (packedUnits(o.strain) >= o.units ? '' : ' dim'), 'Cerrar el trato');
    b.onclick = () => { const r = closeDeal(); if (!r.ok) return fail(r.msg); sfx('level'); G.act.bigToast?.('Trato cerrado', `+${money(r.total)} limpios en tu cuenta`); closePanel(); };
    panel.foot.appendChild(b);
  };
  render();
}
