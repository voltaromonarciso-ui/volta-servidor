import { G, money, clamp } from '../game.js';
import { ITEMS, SHOPS, STRAINS, RANKS, FORMS } from '../data/items.js';
export { FORMS };
import { EFFECTS } from '../data/effects.js';
import { ii } from './icons.js';
import { wardrobeSection } from './dressing.js';
import { inv, slotsAdd, slotsRemove, illegalCount, save, absNow } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { guardGhostClick, resetTouch } from '../core/input.js';
import { product, prodValue, completeDeal, spend, canSpend, toSafe, fromSafe, PAY_ACCOUNT, addXP, customer, giveSample, GIFTABLE, canGift, directSale, saleChance, saleBudget, priceLabel, trustLabel, addictionLabel, prefMatches, inCurfew, DELIVERY, deliveryBonus } from '../systems/economy.js';
import { cooperate, flee } from '../systems/police.js';
import { GANG, resolveRobbery, robberyDemand } from '../systems/gangs.js';
import { VEHICLES, PARKING, RECOVER_PRICE, buyVehicle, recoverVehicle, ownsVehicle } from '../systems/riding.js';
import { CUSTOMER_LINES, GREETINGS } from '../data/people.js';
import { itemLabel } from './hud.js';
import { pick } from '../game.js';
import { ATM, atmMove, atmLeft } from '../systems/atm.js';
import { CASINO, casinoOpen, play as casinoPlay, REEL, rouletteColor } from '../systems/casino.js';

// Envases: qué producto suelto (src) se mete en qué envase, en qué máquina.
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
let current = null;

export function openPanel({ title, wide = false, cls = '', onClose }) {
  closePanel(true);
  G.uiOpen = true;
  resetTouch();
  if (G.touch) guardGhostClick();
  if (document.pointerLockElement) document.exitPointerLock();
  const wrap = h('div', 'panel-wrap');
  const p = h('div', `panel ${wide ? 'wide' : ''} ${cls}`);
  const head = h('header', '', `<h2>${title}</h2>`);
  const x = h('button', 'x', '✕');
  x.onclick = () => closePanel();
  head.appendChild(x);
  const body = h('div', 'body');
  const foot = h('div', 'foot'); // botones principales siempre visibles (no se cortan en pantallas bajas)
  p.append(head, body, foot);
  wrap.appendChild(p);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) closePanel(); });
  document.getElementById('ui-layer').appendChild(wrap);
  current = { wrap, body, foot, onClose, title: head.querySelector('h2') };
  sfx('open');
  return current;
}

export function closePanel(silent) {
  if (!current) return;
  const c = current;
  current = null;
  c.wrap.remove();
  G.uiOpen = false;
  if (!silent) sfx('close');
  c.onClose && c.onClose();
  G.act.pokeStaff?.(); // por si han cambiado las estanterías: los empleados vuelven a mirar
}
export const panelOpen = () => !!current;

export function confirmDialog(title, text, okLabel, onOk, cancelLabel = 'Cancelar') {
  const p = openPanel({ title });
  p.body.appendChild(h('p', 'txt', text));
  const row = h('div', 'row end');
  const no = h('button', 'btn ghost', cancelLabel);
  no.onclick = () => closePanel();
  const ok = h('button', 'btn', okLabel);
  ok.onclick = () => { closePanel(true); onOk(); };
  row.append(no, ok);
  p.body.appendChild(row);
}

export function messageDialog(title, html, btn = 'Vale', onClose) {
  const p = openPanel({ title, onClose });
  p.body.appendChild(h('div', 'txt', html));
  const row = h('div', 'row end');
  const ok = h('button', 'btn', btn);
  ok.onclick = () => closePanel();
  row.appendChild(ok);
  p.body.appendChild(row);
  return p;
}

function chip(effect) {
  const e = EFFECTS[effect];
  return `<span class="chip" style="--c:${e.color}">${e.name}</span>`;
}
export const chips = (effects) => effects.map(chip).join('');

// ---- piezas de interfaz reutilizables ----
// Selector − valor + (cantidades y precios).
export function stepper(val, { min = 1, max = 99, step = 1, fmt = (v) => v, onChange = () => {} } = {}) {
  const box = h('div', 'qty');
  const m = h('button', 'qb', '−'), pl = h('button', 'qb', '+'), v = h('span', 'qv', fmt(val));
  const set = (n) => { val = clamp(Math.round(n), min, max); v.textContent = fmt(val); onChange(val); };
  m.onclick = () => { set(val - (typeof step === 'function' ? step(val) : step)); sfx('click'); };
  pl.onclick = () => { set(val + (typeof step === 'function' ? step(val) : step)); sfx('click'); };
  box.append(m, v, pl);
  box.set = set;
  box.value = () => val;
  return box;
}
// Barra de probabilidad de que el cliente acepte.
export function chanceBar() {
  const e = h('div', 'chance', '<div class="cb-bar"><i></i></div><span></span>');
  e.update = (p, extra = '') => {
    const pc = Math.round(p * 100);
    const col = p >= 0.7 ? 'var(--acc)' : p >= 0.4 ? 'var(--gold)' : 'var(--red)';
    e.querySelector('i').style.cssText = `width:${pc}%;background:${col}`;
    e.querySelector('span').innerHTML = `Probabilidad de que acepte: <b style="color:${col}">${pc}%</b>${extra ? ' · ' + extra : ''}`;
  };
  return e;
}
// Medidor con etiqueta (confianza, adicción, reputación…).
export function meter(label, v01, text, color = 'var(--acc)') {
  return `<div class="meter2"><div class="m-top"><span>${label}</span><b>${text}</b></div><div class="m-bar"><i style="width:${Math.round(clamp(v01, 0, 1) * 100)}%;background:${color}"></i></div></div>`;
}

// ------------------------------------------------------------------
//  Tienda
// ------------------------------------------------------------------
export function openShop(id) {
  const shop = SHOPS[id];
  const hr = G.state.minute / 60;
  if (hr < shop.open[0] || hr >= shop.open[1]) {
    return messageDialog(shop.name, `Está cerrado. Horario: ${shop.open[0]}:00 – ${shop.open[1]}:00.`);
  }
  // catálogo con carrito: eliges cantidades y pagas todo junto al dependiente
  const p = openPanel({ title: shop.name, wide: true, cls: 'shop' });
  const cart = new Map();
  const top = h('div', 'shop-top');
  const cash = h('div', 'cash', money(G.state.money));
  top.append(h('div', 'muted', `Dependiente: «${pick(shop.greet || (id === 'ferreteria' ? ['Buenas. ¿Qué necesitas para tu huerto?', '¿Qué te pongo? Tenemos de todo.', 'Hola de nuevo. Mira el catálogo.'] : ['¿Algo más con la gasolina?', 'Bienvenido a Gas&Go. ¿Qué te llevas?', 'Buenas. Todo lo que ves está a la venta.']))}»`), cash);
  p.body.appendChild(top);
  const grid = h('div', 'shop-grid');
  p.body.appendChild(grid);
  const sum = h('div', 'cart-sum');
  const clear = h('button', 'btn ghost', 'Vaciar');
  const pay = h('button', 'btn', 'Pagar');
  p.foot.append(sum, clear, pay);
  const steppers = [];
  const total = () => [...cart].reduce((a, [k, q]) => a + ITEMS[k].price * q, 0);
  const upd = () => {
    const n = [...cart.values()].reduce((a, q) => a + q, 0);
    const t = total();
    sum.innerHTML = n ? `🛒 ${n} artículo${n > 1 ? 's' : ''} · <b class="money">${money(t)}</b>` : '<span class="muted">El carrito está vacío</span>';
    pay.textContent = n ? `Pagar ${money(t)}` : 'Pagar';
    pay.classList.toggle('dim', !n || t > G.state.money);
    cash.textContent = money(G.state.money);
  };
  for (const itemId of shop.stock) {
    const it = ITEMS[itemId];
    const locked = (it.rank || 0) > G.state.rank;
    const card = h('div', 'card' + (locked ? ' locked' : ''));
    card.innerHTML = `<div class="c-ic">${ii(itemId)}</div><div class="c-info"><div class="c-n">${it.name} <span class="c-p">${locked ? '🔒 ' + RANKS[it.rank].name : money(it.price)}</span></div><div class="c-d">${it.desc || ''}</div></div>`;
    if (!locked) {
      const st = stepper(0, { min: 0, max: it.stack * 2, step: (v) => (v >= 10 ? 5 : 1), onChange: (n) => { if (n) cart.set(itemId, n); else cart.delete(itemId); card.classList.toggle('in', n > 0); upd(); } });
      steppers.push(st);
      card.appendChild(st);
    }
    grid.appendChild(card);
  }
  clear.onclick = () => { steppers.forEach((st) => st.set(0)); sfx('click'); };
  pay.onclick = () => {
    if (!cart.size) return fail('Elige algo del catálogo.');
    const t = total();
    if (!canSpend('dirty', t)) return fail('No tienes suficiente dinero.');
    let refund = 0;
    const bought = [], added = [];
    for (const [k, q] of cart) {
      const left = inv.add(k, q);
      refund += left * ITEMS[k].price;
      if (q - left > 0) { bought.push(`${q - left}× ${ITEMS[k].name}`); added.push([k, q - left]); }
    }
    // solo se cobra lo que de verdad te llevas; si el cobro fallara, se devuelve la mercancía
    if (t - refund > 0) {
      const r = spend('dirty', t - refund, `tienda: ${shop.name}`);
      if (!r.ok) { for (const [k, q] of added) inv.remove(k, q); return fail(r.msg); }
    }
    sfx('cash');
    if (refund) G.act.toast(`No te cabía todo en la mochila: te devuelven ${money(refund)}.`, '🎒');
    if (bought.length) G.act.toast(`Comprado: ${bought.join(', ')}`, '🛍️');
    save();
    steppers.forEach((st) => st.set(0));
    upd();
  };
  upd();
}

function fail(msg) { sfx('error'); G.act.toast(msg, '⚠️'); }

// ------------------------------------------------------------------
//  Tienda de vehículos (Rueda Libre)
// ------------------------------------------------------------------
const VEH_SVG = {
  bike: '<svg viewBox="0 0 64 40" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="14" cy="27" r="10" stroke="#222" stroke-width="3.2"/><circle cx="50" cy="27" r="10" stroke="#222" stroke-width="3.2"/><path d="M14 27l10-14h16l10 14M24 13l8 14h-18M32 27l8-14M40 13l-2-6h-5M22 10h7" stroke="#c0392b" stroke-width="3"/><path d="M38 7h6" stroke="#222" stroke-width="3"/></svg>',
  scooter: '<svg viewBox="0 0 64 40" fill="none" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="32" r="5.5" stroke="#222" stroke-width="3"/><circle cx="52" cy="32" r="5.5" stroke="#222" stroke-width="3"/><path d="M12 29h32l4-23" stroke="#2e86de" stroke-width="3.6"/><path d="M42 6h12M48 6l4 26" stroke="#222" stroke-width="3"/><circle cx="47" cy="12" r="1.6" fill="#2ecc71" stroke="none"/></svg>',
};
// ------------------------------------------------------------------
//  Casino Royal: tragaperras y ruleta (con el efectivo; las ganancias no se blanquean)
// ------------------------------------------------------------------
export function openCasino() {
  if (!casinoOpen()) return messageDialog('Casino Royal', `Está cerrado. Horario: ${CASINO.open}:00 – ${CASINO.close}:00.`);
  const p = openPanel({ title: 'Casino Royal', wide: true, cls: 'casino' });
  let game = 'slots', bet = 10, pickR = 'rojo', busy = false, last = null;
  const render = () => {
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    const top = h('div', 'shop-top');
    top.append(h('div', 'muted', 'Se juega con tu efectivo. Lo que ganes vuelve al efectivo: aquí no se blanquea nada.'), h('div', 'cash', money(G.state.money)));
    p.body.appendChild(top);
    const tabs = h('div', 'row cz-tabs');
    for (const [id, label] of [['slots', '🎰 Tragaperras'], ['roulette', '🎡 Ruleta']]) {
      const t = h('button', 'btn' + (game === id ? '' : ' ghost'), label);
      t.onclick = () => { if (busy) return; game = id; last = null; sfx('click'); render(); };
      tabs.appendChild(t);
    }
    p.body.appendChild(tabs);
    if (game === 'slots') {
      const r = last && last.game === 'slots' ? last.result : ['❔', '❔', '❔'];
      p.body.appendChild(h('div', 'cz-reels', r.map((x) => `<span>${x}</span>`).join('')));
      p.body.appendChild(h('div', 'small muted', '7️⃣7️⃣7️⃣ ×25 · tres iguales ×8 · dos 🍒 ×3 · una 🍒 recuperas la apuesta'));
    } else {
      const n = last && last.game === 'roulette' ? last.result : null;
      p.body.appendChild(h('div', 'cz-wheel ' + (n === null ? '' : rouletteColor(n)), n === null ? '?' : String(n)));
      const picks = h('div', 'row cz-picks');
      for (const [id, label] of [['rojo', '🔴 Rojo ×2'], ['negro', '⚫ Negro ×2']]) {
        const b = h('button', 'btn' + (pickR === id ? '' : ' ghost'), label);
        b.onclick = () => { pickR = id; sfx('click'); render(); };
        picks.appendChild(b);
      }
      const num = h('div', 'cz-num');
      const isNum = !(pickR === 'rojo' || pickR === 'negro');
      num.appendChild(h('span', 'small', 'o un número (×36):'));
      num.appendChild(stepper(isNum ? Number(pickR) : 17, { min: 0, max: 36, step: () => 1, onChange: (v) => { pickR = String(v); render(); } }));
      if (isNum) num.appendChild(h('b', '', `Apuestas al ${pickR}`));
      p.body.append(picks, num);
    }
    const bets = h('div', 'row cz-bets');
    for (const v of CASINO.bets) {
      const b = h('button', 'btn sm' + (bet === v ? '' : ' ghost') + (v > G.state.money ? ' dim' : ''), money(v));
      b.onclick = () => { bet = v; sfx('click'); render(); };
      bets.appendChild(b);
    }
    p.body.appendChild(h('div', 'small muted', 'Apuesta:'));
    p.body.appendChild(bets);
    if (last) p.body.appendChild(h('div', 'cz-res ' + (last.win > 0 ? 'win' : 'lose'), last.win > 0 ? `¡Ganas ${money(last.win)}! (${last.net >= 0 ? '+' : ''}${money(last.net)})` : `Pierdes ${money(last.bet)}.`));
    const go = h('button', 'btn', game === 'slots' ? `Tirar · ${money(bet)}` : `Girar · ${money(bet)}`);
    go.classList.toggle('dim', bet > G.state.money);
    go.onclick = () => {
      if (busy) return; // un solo toque por jugada
      const r = casinoPlay(game, bet, game === 'roulette' ? pickR : null);
      if (!r.ok) return fail(r.msg);
      busy = true;
      go.classList.add('dim');
      sfx('click');
      setTimeout(() => { busy = false; last = { ...r, game, bet }; sfx(r.win > 0 ? 'cash' : 'error'); render(); }, 650);
    };
    p.foot.appendChild(go);
  };
  render();
}

export function openVehicleShop() {
  const hr = G.state.minute / 60;
  if (hr < 10 || hr >= 20) return messageDialog('Rueda Libre', 'Está cerrado. Horario: 10:00 – 20:00.');
  const p = openPanel({ title: 'Rueda Libre · Bicis y patinetes', wide: true, cls: 'shop vshop' });
  const render = () => {
    p.body.innerHTML = '';
    const top = h('div', 'shop-top');
    top.append(h('div', 'muted', 'Dependiente: «Te lo dejo aparcado en la acera, aquí delante. Si algún día lo pierdes, te lo traemos con la grúa.»'), h('div', 'cash', money(G.state.money)));
    p.body.appendChild(top);
    const grid = h('div', 'shop-grid');
    for (const [id, v] of Object.entries(VEHICLES)) {
      const owned = ownsVehicle(id);
      const card = h('div', 'card veh' + (owned ? ' in' : ''));
      const stats = `<div class="v-stats"><span>🏁 ${Math.round(v.max * 3.6)} km/h</span>${v.battery ? `<span>🔋 ${(v.battery / 1000).toFixed(1)} km</span><span>⚡ ${Math.round(v.chargeMin / 60)} h de carga</span>` : '<span>🦵 A pedal, sin cargar</span>'}</div>`;
      card.innerHTML = `<div class="c-ic v-ic">${VEH_SVG[v.kind]}</div><div class="c-info"><div class="c-n">${v.name} <span class="c-p">${owned ? 'Ya es tuyo' : money(v.price)}</span></div><div class="c-d">${v.desc}</div>${stats}</div>`;
      const row = h('div', 'row end');
      if (!owned) {
        const buy = h('button', 'btn' + (G.state.money < v.price ? ' dim' : ''), `Comprar · ${money(v.price)}`);
        buy.onclick = () => {
          const r = buyVehicle(id);
          if (!r.ok) return fail(r.msg);
          sfx('cash');
          G.act.toast(`${v.kind === 'bike' ? 'Bici comprada' : 'Patinete comprado'}. Está aparcado en la acera de la tienda.`, '🛵');
          G.act.setWaypoint(PARKING[id].x, PARKING[id].z, v.kind === 'bike' ? 'Tu bici' : 'Tu patinete');
          render();
        };
        row.appendChild(buy);
      } else {
        const rec = h('button', 'btn ghost' + (G.state.money < RECOVER_PRICE ? ' dim' : ''), `Traer al aparcamiento · ${money(RECOVER_PRICE)}`);
        rec.onclick = () => {
          const r = recoverVehicle(id);
          if (!r.ok) return fail(r.msg);
          sfx('cash');
          G.act.toast('La grúa lo ha dejado en la acera de la tienda.', '🚚');
          render();
        };
        row.appendChild(rec);
      }
      card.appendChild(row);
      grid.appendChild(card);
    }
    p.body.appendChild(grid);
  };
  render();
}

// ------------------------------------------------------------------
//  Mesa de empaquetado
// ------------------------------------------------------------------
export function openPacker(obj) {
  const at = obj?.entry?.type === 'jarpacker' ? 'jarpacker' : 'packer';
  const forms = FORMS.filter((f) => f.at === at);
  const srcs = [...new Set(forms.map((f) => f.src))];
  const p = openPanel({ title: at === 'jarpacker' ? 'Envasadora de tarros' : 'Mesa de empaquetado', wide: true });
  let sel = null, mode = null;
  const render = () => {
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    const stacks = srcs.flatMap((id) => productStacks(id).map((x) => ({ ...x, id })));
    if (!stacks.length) {
      p.body.appendChild(h('p', 'txt', at === 'jarpacker'
        ? 'No llevas cogollos. Cosecha tus plantas y vuelve: cada tarro lleva 5 cogollos y un tarro vacío.'
        : 'No llevas cogollos ni cristales. Cosecha tus plantas (o cocina cristales en el hornillo) y vuelve.'));
      return;
    }
    if (!sel || !stacks.find((b) => b.p === sel.p && b.id === sel.id)) sel = stacks[0];
    const valid = forms.filter((f) => f.src === sel.id);
    if (!mode || !valid.find((f) => f.id === mode)) mode = valid[0].id;
    p.body.appendChild(h('div', 'label', '1. Elige el producto'));
    const list = h('div', 'pick-row');
    for (const b of stacks) {
      const prod = product(b.p);
      const e = h('button', 'pick' + (b.p === sel.p && b.id === sel.id ? ' on' : ''), `<b>${ii(b.id)} ${prod.name}</b><small>${b.q} ${b.id === 'cristal' ? 'cristales' : 'cogollos'}</small>`);
      e.onclick = () => { sel = b; render(); sfx('click'); };
      list.appendChild(e);
    }
    p.body.appendChild(list);
    p.body.appendChild(h('div', 'label', '2. Envase'));
    const m = h('div', 'pick-row');
    for (const f of valid) {
      const have = inv.count(f.pack);
      const e = h('button', 'pick' + (mode === f.id ? ' on' : '') + (have ? '' : ' dim'), `<b>${ii(f.id)} ${ITEMS[f.id].name}</b><small>${f.per} ${sel.id === 'cristal' ? 'cristal' : f.per > 1 ? 'cogollos' : 'cogollo'} + 1 envase · tienes ${have} ${ITEMS[f.pack].name.toLowerCase()}</small>`);
      e.onclick = () => { mode = f.id; render(); sfx('click'); };
      m.appendChild(e);
    }
    p.body.appendChild(m);
    if (at === 'packer' && sel.id === 'cogollo') p.body.appendChild(h('div', 'small muted', G.state.flags.jars ? 'Para tarros usa la envasadora de tarros.' : '🔒 Tarros: compra la envasadora de tarros en la ferretería (rango Buscavidas). Los clientes pagan más por los tarros.'));
    const F = forms.find((f) => f.id === mode);
    const max = Math.min(Math.floor(inv.count(sel.id, sel.p) / F.per), inv.count(F.pack));
    p.body.appendChild(h('div', 'small muted', `Podrás hacer ${max}. En la mesa: arrastra el envase vacío, mete ${F.per > 1 ? `${F.per} cogollos` : sel.id === 'cristal' ? 'los cristales' : 'el cogollo'} y ciérralo.`));
    const go = h('button', 'btn', 'Ponerse a envasar');
    go.onclick = () => {
      if (max <= 0) return fail(!inv.count(F.pack) ? `Te faltan envases (${ITEMS[F.pack].name}).` : `Necesitas ${F.per} unidades para cada ${ITEMS[F.id].name.toLowerCase()}.`);
      if (!inv.room(F.id, sel.p)) return fail('No tienes hueco en el inventario.');
      closePanel(true);
      G.act.startStation(obj, { id: sel.id, p: sel.p }, F);
    };
    p.foot.append(go);
  };
  render();
}

function productStacks(id) {
  const map = new Map();
  for (const s of G.state.inv) if (s && s.id === id) map.set(s.p, (map.get(s.p) || 0) + s.q);
  return [...map].map(([p, q]) => ({ p, q }));
}

// ------------------------------------------------------------------
//  Estantería (transferir objetos)
// ------------------------------------------------------------------
// ------------------------------------------------------------------
//  Caja fuerte: el dinero de dentro no se pierde si te detienen
// ------------------------------------------------------------------
// Mueve efectivo entre lo que llevas y la caja (transferencia: no es ingreso ni gasto).
// «Todo» y las cantidades mayores que lo disponible se ajustan a lo que hay.
export function moveCash(obj, n) {
  const d = obj.entry.data;
  d.cash ||= 0;
  n = Math.round(n);
  if (n > 0) n = Math.min(n, Math.max(0, Math.floor(G.state.money)));
  else n = -Math.min(-n, Math.floor(d.cash));
  if (!n) return 0;
  const r = n > 0 ? toSafe(d, n) : fromSafe(d, -n);
  if (!r.ok) return 0;
  save();
  return n;
}
export function openSafe(obj) {
  const p = openPanel({ title: '🔒 Caja fuerte', cls: 'safe' });
  const render = () => {
    const d = obj.entry.data;
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    p.body.appendChild(h('div', 'sum', `<div><small>Efectivo encima</small><b class="money">${money(G.state.money)}</b></div><div><small>Efectivo guardado en la caja</small><b class="money">${money(d.cash || 0)}</b></div>`));
    p.body.appendChild(h('p', 'muted', 'Si te detienen, la multa solo sale del efectivo que llevas encima. En la caja solo se guarda efectivo.'));
    const row = (label, list) => {
      const r = h('div', 'row safe-row');
      r.appendChild(h('div', 'label', label));
      for (const [txt, n] of list) {
        const b = h('button', 'btn' + (n < 0 ? ' ghost' : ''), txt);
        b.onclick = () => { if (!moveCash(obj, n)) return fail(n > 0 ? 'No llevas dinero encima.' : 'La caja está vacía.'); sfx('cash'); render(); };
        r.appendChild(b);
      }
      p.body.appendChild(r);
    };
    row('Guardar', [['100 $', 100], ['500 $', 500], ['Todo', 1e9]]);
    row('Sacar', [['100 $', -100], ['500 $', -500], ['Todo', -1e9]]);
  };
  render();
}

// Cajero automático: efectivo encima ↔ tarjeta, con límite semanal
export function openAtm(atm) {
  const p = openPanel({ title: '🏧 Cajero · ' + (atm?.name || 'Rooktown'), cls: 'safe' });
  const render = () => {
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    p.body.appendChild(h('div', 'sum', `<div><small>Efectivo encima</small><b class="money">${money(G.state.money)}</b></div><div><small>Saldo en la tarjeta</small><b class="money">${money(G.state.clean || 0)}</b></div><div><small>Puedes ingresar esta semana</small><b class="money">${money(atmLeft())}</b></div>`));
    p.body.appendChild(h('p', 'muted', `Puedes ingresar hasta ${money(ATM.weekLimit)} por semana. Sacar dinero no tiene límite.`));
    const row = (label, dir, list) => {
      const r = h('div', 'row safe-row');
      r.appendChild(h('div', 'label', label));
      for (const [txt, n] of list) {
        const b = h('button', 'btn' + (dir === 'out' ? ' ghost' : ''), txt);
        b.onclick = () => {
          const res = atmMove(dir, n);
          if (!res.ok) return fail(res.msg);
          sfx('cash'); save();
          render();
        };
        r.appendChild(b);
      }
      p.body.appendChild(r);
    };
    row('Ingresar', 'in', [['100 $', 100], ['500 $', 500], ['1.000 $', 1000], ['Todo', 1e9]]);
    row('Sacar', 'out', [['100 $', 100], ['500 $', 500], ['1.000 $', 1000], ['Todo', 1e9]]);
  };
  render();
}

export function openShelf(obj) {
  const locker = obj.entry.type === 'locker';
  const p = openPanel({ title: locker ? 'Armario de almacenaje' : 'Estantería', wide: true });
  const slots = obj.entry.data.slots;
  const render = () => {
    p.body.innerHTML = '';
    p.body.appendChild(h('div', 'muted', 'Toca un objeto para moverlo de un lado a otro.'));
    const cols = h('div', 'mix-cols two');
    const make = (title, from, to) => {
      const col = h('div', 'mix-col');
      col.appendChild(h('div', 'label', title));
      const grid = h('div', 'inv-grid');
      from.forEach((s, i) => {
        const cell = h('button', 'inv-cell' + (s ? '' : ' empty'), s ? `<span>${ii(s.id)}</span><small>${s.q}</small>` : '');
        if (s) cell.title = itemLabel(s);
        cell.onclick = () => {
          if (!s) return;
          const left = slotsAdd(to, s.id, s.q, s.p);
          if (left === s.q) return fail('No hay hueco.');
          if (left > 0) s.q = left; else from[i] = null;
          sfx('pop');
          render();
        };
        grid.appendChild(cell);
      });
      col.appendChild(grid);
      return col;
    };
    cols.append(make('Tu inventario', G.state.inv, slots), make(locker ? 'Armario' : 'Estantería', slots, G.state.inv));
    p.body.appendChild(cols);
  };
  render();
}

// ------------------------------------------------------------------
//  Mochila (gestionar inventario)
// ------------------------------------------------------------------
export function openBag() {
  const p = openPanel({ title: 'Mochila', wide: true });
  let picked = -1;
  const render = () => {
    p.body.innerHTML = '';
    p.body.appendChild(h('div', 'muted small', 'Toca dos huecos para intercambiarlos.'));
    const cols = h('div', 'bag-cols');
    const grid = h('div', 'inv-grid big');
    G.state.inv.forEach((s, i) => {
      const cell = h('button', 'inv-cell' + (s ? '' : ' empty') + (i === picked ? ' on' : '') + (i === G.state.sel ? ' held' : ''), s ? `<span>${ii(s.id)}</span><small>${s.q}</small>` : `<em>${(i + 1) % 10}</em>`);
      cell.onclick = () => {
        sfx('click');
        if (picked >= 0 && picked !== i) {
          const a = G.state.inv[picked];
          G.state.inv[picked] = G.state.inv[i];
          G.state.inv[i] = a;
          picked = -1;
        } else picked = picked === i ? -1 : i;
        render();
      };
      grid.appendChild(cell);
    });
    cols.appendChild(grid);
    p.body.appendChild(cols);
    const s = G.state.inv[picked];
    if (s) {
      const it = ITEMS[s.id];
      const d = h('div', 'detail');
      let extra = '';
      if (s.p && G.state.products[s.p]) {
        const pr = product(s.p);
        extra = `<div class="chips">${chips(pr.effects)}</div><div class="muted">Valor por unidad: ${money(prodValue(pr))} · Tu precio: ${money(pr.price)}</div>`;
      }
      d.innerHTML = `<div class="d-h">${ii(s.id)} <b>${itemLabel(s)}</b> ×${s.q}</div><div class="muted">${it.desc || (it.illegal ? '⚠️ Ilegal: si te cachean, te lo quitarán.' : '')}</div>${extra}`;
      const row = h('div', 'row end');
      const hold = h('button', 'btn ghost', 'Llevar en la mano');
      hold.onclick = () => { G.state.sel = picked; render(); };
      const drop = h('button', 'btn danger', 'Tirar');
      drop.onclick = () => { G.state.inv[picked] = null; picked = -1; sfx('pop'); render(); };
      row.append(hold, drop);
      d.appendChild(row);
      cols.appendChild(d);
    } else cols.appendChild(h('div', 'detail muted', 'Toca un objeto para ver qué es, llevarlo en la mano o tirarlo.'));
    const st = h('div', 'muted small', `💧 Agua en la regadera: ${G.state.water}/6 · Producto ilegal encima: ${illegalCount()}`);
    p.body.appendChild(st);
    p.body.appendChild(wardrobeSection(render));
  };
  render();
}

// ------------------------------------------------------------------
//  Vecinos: ficha con entregar, vender, regalar y hablar
// ------------------------------------------------------------------
const firstName = (npc) => npc.person.name.split(' ')[0];
const stacksOf = (ids) => {
  const map = new Map();
  for (const s of G.state.inv) if (s && ids.includes(s.id) && s.p) map.set(s.id + '|' + s.p, { id: s.id, p: s.p, q: (map.get(s.id + '|' + s.p)?.q || 0) + s.q });
  return [...map.values()];
};
const PACKED = ['bolsa', 'tarro', 'shards'];

export function npcActions(npc) {
  const deal = npc.deal;
  const c = customer(npc.id);
  const who = c.unlocked ? firstName(npc) : 'el vecino';
  if (deal) {
    return [
      { label: `Entregar pedido a ${firstName(npc)}`, fn: () => openHandover(npc, deal) },
      { label: 'Más opciones', fn: () => openNpc(npc), secondary: true },
    ];
  }
  return [{ label: `Hablar con ${who}`, fn: () => openNpc(npc) }];
}

export function openNpc(npc, view = 'main') {
  const c = customer(npc.id);
  const name = c.unlocked ? npc.person.name : 'Vecino';
  const p = openPanel({ title: name, cls: 'npc', onClose: () => { npc.talkT = 1; } });
  npc.talk(999);
  npc.lookAt(G.player.pos.x, G.player.pos.z);
  let sel = null, qty = 1, unit = 0, note = '';
  const show = (v) => { view = v; sel = null; note = ''; render(); };
  const render = () => {
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    p.title.textContent = view === 'sell' ? `Vender a ${firstName(npc)}` : view === 'gift' ? `Regalar a ${c.unlocked ? firstName(npc) : 'este vecino'}` : name;
    ({ main, sell, gift }[view])();
  };

  // ---- vista principal ----
  const main = () => {
    if (c.unlocked) {
      p.body.appendChild(h('div', 'npc-stats', meter('Confianza', c.affinity / 100, trustLabel(c.affinity)) + meter('Adicción', c.addiction, addictionLabel(c.addiction), '#e67e22')));
      p.body.appendChild(h('div', 'small', `<span class="muted">Le gusta:</span><div class="chips">${chips(npc.person.prefs)}</div><span class="muted">Lo prefiere en ${ii(npc.person.form)} ${ITEMS[npc.person.form].form}</span>`));
    } else {
      p.body.appendChild(h('div', 'txt', 'Aún no es cliente tuyo. <b>Regálale una muestra</b>: si le gusta, te dará su número y empezará a hacerte pedidos.'));
    }
    const grid = h('div', 'act-grid');
    const act = (icon, title, sub, fn, off) => {
      const b = h('button', 'act' + (off ? ' off' : ''), `<span class="a-ic">${icon}</span><span class="a-t"><b>${title}</b><small>${sub}</small></span>`);
      b.onclick = () => { if (off) { sfx('error'); G.act.toast(sub, 'ℹ️'); return; } sfx('click'); fn(); };
      grid.appendChild(b);
    };
    const deal = npc.deal;
    if (deal) act('📦', 'Entregar pedido', `${deal.qty}× ${product(deal.product).name} · ${money(deal.price)}`, () => { closePanel(true); openHandover(npc, deal); });
    if (c.unlocked) {
      const packed = stacksOf(PACKED);
      const why = deal ? 'Primero entrégale su pedido.' : c.walkDay === G.state.day ? 'Ya te ha comprado hoy. Vuelve mañana.' : !packed.length ? 'No llevas producto empaquetado.' : '';
      act(ii('cash'), 'Vender', why || 'Ofrécele producto a tu precio', () => show('sell'), !!why);
    }
    const gifts = stacksOf(GIFTABLE);
    const gwhy = !canGift(npc) ? 'Ya le has regalado algo hoy.' : !gifts.length ? 'No llevas producto para regalar.' : '';
    act('🎁', 'Regalar', gwhy || (c.unlocked ? '+ confianza y reputación' : 'Puede hacerse cliente'), () => show('gift'), !!gwhy);
    act('💬', 'Hablar', c.unlocked ? 'Charlar un rato' : 'Saludar', () => {
      G.act.toast(`${c.unlocked ? firstName(npc) : 'Vecino'}: «${c.unlocked ? pick(CUSTOMER_LINES) : pick(GREETINGS)}»`, '💬');
      closePanel();
    });
    p.body.appendChild(grid);
  };

  // ---- vender en mano ----
  const sell = () => {
    const packed = stacksOf(PACKED);
    if (!sel || !packed.find((x) => x.id === sel.id && x.p === sel.p)) {
      sel = packed.find((x) => x.p && prefMatches(npc.person, product(x.p))) || packed[0];
      qty = 1;
      unit = product(sel.p).price;
    }
    p.body.appendChild(h('div', 'label', 'Producto'));
    const row = h('div', 'pick-row');
    for (const x of packed) {
      const pr = product(x.p);
      const b = h('button', 'pick' + (x === sel || (x.id === sel.id && x.p === sel.p) ? ' on' : ''), `<b>${ii(x.id)} ${pr.name}</b><small>${ITEMS[x.id].name} · tienes ${x.q}</small>`);
      b.onclick = () => { sel = x; qty = 1; unit = pr.price; render(); sfx('click'); };
      row.appendChild(b);
    }
    p.body.appendChild(row);
    const pr = product(sel.p), per = ITEMS[sel.id].units || 1, v = prodValue(pr);
    const total = () => Math.round(qty * per * unit);
    const line = h('div', 'sale-grid');
    const qBox = stepper(qty, { min: 1, max: sel.q, onChange: (n) => { qty = n; upd(); } });
    const pBox = stepper(unit, { min: 1, max: Math.round(v * 4), step: () => Math.max(1, Math.round(v * 0.05)), fmt: money, onChange: (n) => { unit = n; upd(); } });
    line.append(h('div', 'label', `Cantidad (${ITEMS[sel.id].form})`), qBox, h('div', 'label', 'Precio por unidad'), pBox);
    p.body.appendChild(line);
    const info = h('div', 'small muted');
    const bar = chanceBar();
    p.body.append(info, bar);
    if (note) p.body.appendChild(h('div', 'txt', note));
    const back = h('button', 'btn ghost', '‹ Atrás');
    back.onclick = () => show('main');
    const go = h('button', 'btn', '');
    const upd = () => {
      info.innerHTML = `Valor de mercado ${money(v)} · <b>${priceLabel(pr, unit)}</b> · Lleva unos ${money(saleBudget(npc))} encima`;
      bar.update(saleChance(npc, sel, unit));
      go.textContent = `Ofrecer por ${money(total())}`;
    };
    go.onclick = () => {
      const r = directSale(npc, sel, qty, unit);
      if (!r.ok) { sfx('error'); note = r.msg; return render(); }
      if (!r.accepted) { sfx('error'); G.act.toast(r.msg, '😕'); return show('main'); }
      closePanel(true);
      npc.talkT = 0;
      npc.playExchange({ id: sel.id, p: sel.p }, true);
      G.player.vm.give();
      setTimeout(() => G.player.vm.flash('cash', 1.6), 550);
      G.act.toast(`${r.msg} +${money(r.total)}`, ii('cash'));
      save();
    };
    upd();
    p.foot.append(back, go);
  };

  // ---- regalar ----
  const gift = () => {
    const list = stacksOf(GIFTABLE);
    if (!sel || !list.find((x) => x.id === sel.id && x.p === sel.p)) sel = list[0];
    p.body.appendChild(h('div', 'small muted', c.unlocked
      ? 'Regalar sube su confianza (mejores precios y más pedidos) y tu reputación en la ciudad.'
      : 'Si le gusta, te dará su número. Acertarás más si tiene efectos de los que le gustan a la gente y si tienes buena reputación.'));
    const row = h('div', 'pick-row');
    for (const x of list) {
      const pr = product(x.p);
      const likes = c.unlocked && prefMatches(npc.person, pr) ? ' ★' : '';
      const b = h('button', 'pick' + (x.id === sel.id && x.p === sel.p ? ' on' : ''), `<b>${ii(x.id)} ${pr.name}${likes}</b><small>1 ${ITEMS[x.id].name.toLowerCase()} · tienes ${x.q}</small>`);
      b.onclick = () => { sel = x; render(); sfx('click'); };
      row.appendChild(b);
    }
    p.body.appendChild(row);
    const back = h('button', 'btn ghost', '‹ Atrás');
    back.onclick = () => show('main');
    const go = h('button', 'btn', `Regalar 1 ${ITEMS[sel.id].name.toLowerCase()}`);
    go.onclick = () => {
      const spec = sel;
      closePanel(true);
      npc.talkT = 1.5;
      giveSample(npc, spec);
      save();
    };
    p.foot.append(back, go);
  };
  render();
}

// Entrega de un pedido: se prepara sola con lo que llevas (en el envase que
// prefiere si lo tienes). Un toque para entregar; "Cambiar" para elegir a mano.
export function openHandover(npc, deal) {
  const prod = product(deal.product);
  const p = openPanel({ title: `Pedido de ${firstName(npc)}`, onClose: () => { npc.talkT = 1; } });
  npc.talk(999);
  npc.lookAt(G.player.pos.x, G.player.pos.z);
  const offer = new Map(); // key -> {id,p,q}
  const units = () => [...offer.values()].reduce((a, o) => a + o.q * ITEMS[o.id].units, 0);
  let manual = false;
  const autoFill = () => {
    offer.clear();
    let need = deal.qty;
    const order = [...new Set([deal.form, 'tarro', 'shards', 'bolsa'])].filter(Boolean);
    for (const id of order) {
      if (need <= 0) break;
      const u = ITEMS[id].units;
      const have = inv.count(id, deal.product);
      const n = Math.min(have, id === deal.form || u === 1 ? Math.ceil(need / u) : Math.floor(need / u));
      if (n > 0) { offer.set(id + '|' + deal.product, { id, p: deal.product, q: n }); need -= n * u; }
    }
  };
  autoFill();
  const render = () => {
    p.body.innerHTML = '';
    p.foot.innerHTML = '';
    const fav = deal.form ? ` · lo prefiere en <b>${ii(deal.form)} ${ITEMS[deal.form].form}</b> (+10% propina)` : '';
    p.body.appendChild(h('div', 'deal-req', `Pide <b>${deal.qty}×</b> <b>${prod.name}</b> por <b class="money">${money(deal.price)}</b><div class="small muted">${chips(prod.effects)}${fav}</div>`));
    if (inCurfew(absNow())) p.body.appendChild(h('div', 'deal-req night', `🌙 Toque de queda: te paga un <b>${Math.round(DELIVERY.curfewBonus * 100)}% más</b> (≈ ${money(deliveryBonus(deal, deal.price))}) por el riesgo.`));
    const got = units();
    const ok = got >= deal.qty;
    const lines = [...offer.values()].map((o) => `${ii(o.id)} ${o.q} ${ITEMS[o.id].name.toLowerCase()}${o.q > 1 ? 's' : ''} de ${product(o.p).name}`).join('<br>') || 'Nada';
    p.body.appendChild(h('div', 'give-box ' + (ok ? 'ok' : 'bad'), `<div class="label">Le das (${got}/${deal.qty} uds.)</div><div>${lines}</div>${ok ? '' : `<div class="warn">Te faltan ${deal.qty - got} unidades empaquetadas de ${prod.name}.</div>`}`));
    if (manual) {
      const packed = G.state.inv.filter((s) => s && ITEMS[s.id].packed);
      const seen = new Set();
      const row = h('div', 'pick-row');
      for (const s of packed) {
        const k = s.id + '|' + s.p;
        if (seen.has(k)) continue;
        seen.add(k);
        const inOffer = offer.get(k)?.q || 0;
        const have = inv.count(s.id, s.p) - inOffer;
        const b = h('button', 'pick' + (s.p === deal.product ? ' match' : ''), `<b>${ii(s.id)} ${product(s.p).name}</b><small>${ITEMS[s.id].name} · +1 (quedan ${have})${inOffer ? ` · −1 manteniendo` : ''}</small>`);
        b.onclick = () => {
          if (have <= 0) return fail('No te quedan más.');
          const o = offer.get(k) || { id: s.id, p: s.p, q: 0 };
          o.q++;
          offer.set(k, o);
          sfx('click');
          render();
        };
        row.appendChild(b);
      }
      p.body.appendChild(h('div', 'small muted', 'Toca para añadir. Usa "Vaciar" para empezar de nuevo.'));
      p.body.appendChild(row);
      const clr = h('button', 'btn ghost', 'Vaciar');
      clr.onclick = () => { offer.clear(); render(); };
      p.foot.appendChild(clr);
    } else {
      const chg = h('button', 'btn ghost', 'Cambiar');
      chg.onclick = () => { manual = true; render(); };
      p.foot.appendChild(chg);
    }
    const give = h('button', 'btn', `Entregar y cobrar ${money(deal.price)}`);
    if (!ok) give.classList.add('dim');
    give.onclick = () => {
      const r = completeDeal(deal, [...offer.values()]);
      if (!r.ok) return fail(`${firstName(npc)}: «${r.msg}»`);
      const first = [...offer.values()][0];
      closePanel(true);
      npc.talkT = 0;
      npc.playExchange({ id: first.id, p: first.p }, true);
      G.player.vm.give();
      setTimeout(() => G.player.vm.flash('cash', 1.6), 550);
      G.act.toast(`Trato cerrado: +${money(r.pay)}${r.tip ? ` (propina ${money(r.tip)})` : ''}`, ii('cash'));
      save();
    };
    p.foot.appendChild(give);
  };
  render();
}

// ------------------------------------------------------------------
//  Policía
// ------------------------------------------------------------------
export function friskDialog(cop) {
  const n = illegalCount();
  const p = openPanel({ title: `👮 ${cop.name}`, onClose: () => { if (cop.mode === 'approach') cooperate(cop); } });
  p.body.appendChild(h('div', 'txt', `«Cacheo rutinario. Las manos donde pueda verlas.»${n ? `<div class="warn">⚠️ Llevas ${n} objeto${n > 1 ? 's' : ''} ilegal${n > 1 ? 'es' : ''} encima.</div>` : ''}`));
  const row = h('div', 'row end');
  const run = h('button', 'btn danger', '🏃 Huir');
  run.onclick = () => { cop.mode = 'chase'; closePanel(true); flee(cop); };
  const ok = h('button', 'btn', '🙌 Cooperar');
  ok.onclick = () => { cop.mode = 'return'; closePanel(true); cooperate(cop); };
  row.append(run, ok);
  p.body.appendChild(row);
}

// Atraco de una banda: eliges qué hacer. Cerrar el panel equivale a pagar.
export function robberyDialog() {
  const want = robberyDemand();
  let done = false;
  const finish = (choice) => {
    if (done) return;
    const r = resolveRobbery(choice);
    if (!r.ok) return fail(r.msg);
    done = true;
    closePanel(true);
    sfx(r.lost ? 'error' : 'cash');
    G.act.toast(r.msg, r.lost ? '💸' : '💪');
  };
  const p = openPanel({ title: `🐦‍⬛ ${GANG.name}`, cls: 'robbery', onClose: () => finish('pay') });
  p.body.appendChild(h('div', 'txt', want
    ? `«Quieto. Danos <b>${money(want)}</b> y aquí no ha pasado nada.»<div class="small muted">Llevas ${money(G.state.money)} en efectivo. El dinero limpio del banco no te lo pueden quitar.</div>`
    : '«¿No llevas nada? Pues lárgate.»'));
  const row = h('div', 'row end wrap');
  const add = (label, choice, cls = 'btn ghost') => { const b = h('button', cls, label); b.onclick = () => finish(choice); row.appendChild(b); };
  if (inv.count('pistola')) add('🔫 Enseñar la pistola', 'pistola', 'btn');
  if (inv.count('spray')) add('🧯 Spray de pimienta', 'spray', 'btn');
  if (inv.count('porra')) add('🦯 Sacar la porra (60 %)', 'porra');
  add('🏃 Intentar escapar (45 %)', 'run', 'btn danger');
  add(want ? `💵 Darles ${money(want)}` : 'Seguir mi camino', 'pay');
  p.body.appendChild(row);
}

export function arrestedDialog({ lost, fine, officer }) {
  messageDialog('🚔 Detenido', `<p>${officer} te ha detenido.</p><p>Te han requisado <b>${lost}</b> objeto(s) ilegal(es) y has pagado una multa de <b>${money(fine)}</b>.</p><p class="muted">Tras unas horas en comisaría, te dejan marchar.</p>`, 'Salir de comisaría');
}

// ------------------------------------------------------------------
//  Resumen del día
// ------------------------------------------------------------------
export function daySummary(sum, forced) {
  const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
  messageDialog(forced ? '😵 Caíste rendido' : `🌙 Fin del día ${sum.day}`, `
    ${forced ? '<p>Eran las 4:00 y no pudiste más. Despiertas en casa.</p>' : ''}
    <div class="sum"><div><small>Ganado hoy</small><b class="money">${money(sum.earned)}</b></div><div><small>Tratos</small><b>${sum.deals}</b></div><div><small>Efectivo</small><b>${money(G.state.money)}</b></div><div><small>Limpio</small><b>${money(G.state.clean || 0)}</b></div></div>
    <p class="muted">Amanece el ${DAYS[(G.state.day - 1) % 7]} (día ${G.state.day}). Las plantas han seguido creciendo mientras dormías.</p>`, 'Empezar el día');
}

// ------------------------------------------------------------------
//  Bungalow
// ------------------------------------------------------------------
export function bungalowActions() {
  if (G.state.props.bungalow) return [{ label: 'Tu bungalow', fn: () => G.act.toast('Es tuyo. Puedes cultivar y dormir aquí.') }];
  const price = G.world.props.bungalow.price;
  const acc = PAY_ACCOUNT.bungalow;
  const accName = acc === 'clean' ? 'dinero limpio' : 'efectivo';
  return [{
    label: `Comprar bungalow (${money(price)})`,
    fn: () => confirmDialog('Bungalow en venta', `<p>Bungalow con jardín en el Barrio Alto, sin alquiler: es tuyo para siempre. La nave la sigues teniendo alquilada.</p><p>Precio: <b>${money(price)}</b> · se paga con ${accName}.</p>`, 'Comprar', () => {
      if (G.state.props.bungalow) return;
      const r = spend(acc, price, 'bungalow', { key: 'bungalow' });
      if (!r.ok) return fail(r.msg);
      G.state.props.bungalow = true;
      G.state.home = 'bungalow';
      if (G.world.saleSign) G.world.saleSign.visible = false;
      sfx('level');
      G.act.bigToast('¡Bungalow comprado!', 'Ahora es tu casa: puedes cultivar y dormir aquí. La nave sigue alquilada.');
      save();
    }),
  }];
}

export { clamp, STRAINS };
