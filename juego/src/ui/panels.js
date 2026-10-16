import { G, money, clamp } from '../game.js';
import { ITEMS, SHOPS, STRAINS, RANKS } from '../data/items.js';
import { EFFECTS, INGREDIENTS } from '../data/effects.js';
import { inv, slotsAdd, slotsRemove, illegalCount, save } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { resetTouch } from '../core/input.js';
import { product, prodValue, previewMix, registerMix, completeDeal, addMoney, addXP, customer, giveSample } from '../systems/economy.js';
import { cooperate, flee } from '../systems/police.js';
import { CUSTOMER_LINES, GREETINGS } from '../data/people.js';
import { itemLabel } from './hud.js';
import { pick } from '../game.js';

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
let current = null;

export function openPanel({ title, wide = false, cls = '', onClose }) {
  closePanel(true);
  G.uiOpen = true;
  resetTouch();
  if (document.pointerLockElement) document.exitPointerLock();
  const wrap = h('div', 'panel-wrap');
  const p = h('div', `panel ${wide ? 'wide' : ''} ${cls}`);
  const head = h('header', '', `<h2>${title}</h2>`);
  const x = h('button', 'x', '✕');
  x.onclick = () => closePanel();
  head.appendChild(x);
  const body = h('div', 'body');
  p.append(head, body);
  wrap.appendChild(p);
  wrap.addEventListener('pointerdown', (e) => { if (e.target === wrap) closePanel(); });
  document.getElementById('ui-layer').appendChild(wrap);
  current = { wrap, body, onClose, title: head.querySelector('h2') };
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

// ------------------------------------------------------------------
//  Tienda
// ------------------------------------------------------------------
export function openShop(id) {
  const shop = SHOPS[id];
  const hr = G.state.minute / 60;
  if (hr < shop.open[0] || hr >= shop.open[1]) {
    return messageDialog(shop.name, `Está cerrado. Horario: ${shop.open[0]}:00 – ${shop.open[1]}:00.`);
  }
  const p = openPanel({ title: shop.name, wide: true, cls: 'shop' });
  const top = h('div', 'shop-top');
  const cash = h('div', 'cash', money(G.state.money));
  top.append(h('div', 'muted', id === 'ferreteria' ? 'Todo para tu "huerto urbano".' : 'Snacks, bebidas y cosas raras.'), cash);
  p.body.appendChild(top);
  const grid = h('div', 'shop-grid');
  p.body.appendChild(grid);
  for (const itemId of shop.stock) {
    const it = ITEMS[itemId];
    const locked = (it.rank || 0) > G.state.rank;
    const card = h('div', 'card' + (locked ? ' locked' : ''));
    let qty = 1;
    card.innerHTML = `<div class="c-ic">${it.icon}</div><div class="c-n">${it.name}</div><div class="c-d">${it.desc || ''}</div>
      <div class="c-p">${locked ? '🔒 ' + RANKS[it.rank].name : money(it.price)}</div>`;
    if (!locked) {
      const row = h('div', 'qty');
      const minus = h('button', 'qb', '−'), plus = h('button', 'qb', '+'), q = h('span', 'qv', '1');
      const buy = h('button', 'btn sm', 'Comprar');
      const upd = () => { q.textContent = qty; buy.textContent = `Comprar ${money(it.price * qty)}`; };
      minus.onclick = () => { qty = Math.max(1, qty - (qty > 10 ? 5 : 1)); upd(); sfx('click'); };
      plus.onclick = () => { qty = Math.min(it.stack * 2, qty + (qty >= 10 ? 5 : 1)); upd(); sfx('click'); };
      buy.onclick = () => {
        const cost = it.price * qty;
        if (G.state.money < cost) return fail('No tienes suficiente dinero.');
        if (inv.room(itemId) < qty) return fail('No te cabe en el inventario.');
        addMoney(-cost);
        inv.add(itemId, qty);
        sfx('cash');
        cash.textContent = money(G.state.money);
        G.act.toast(`Comprado: ${qty}× ${it.name}`, it.icon);
        save();
      };
      row.append(minus, q, plus);
      card.append(row, buy);
      upd();
    }
    grid.appendChild(card);
  }
}

function fail(msg) { sfx('error'); G.act.toast(msg, '⚠️'); }

// ------------------------------------------------------------------
//  Mesa de empaquetado
// ------------------------------------------------------------------
export function openPacker() {
  const p = openPanel({ title: 'Mesa de empaquetado', wide: true });
  let sel = null, mode = 'bolsa', busy = false;
  const render = () => {
    p.body.innerHTML = '';
    const buds = productStacks('cogollo');
    if (!buds.length) {
      p.body.appendChild(h('p', 'txt', 'No llevas cogollos. Cosecha tus plantas y vuelve.'));
      return;
    }
    if (!sel || !buds.find((b) => b.p === sel)) sel = buds[0].p;
    p.body.appendChild(h('div', 'label', '1. Elige el producto'));
    const list = h('div', 'pick-row');
    for (const b of buds) {
      const prod = product(b.p);
      const e = h('button', 'pick' + (b.p === sel ? ' on' : ''), `<b>${prod.name}</b><small>${b.q} cogollos</small>`);
      e.onclick = () => { sel = b.p; render(); sfx('click'); };
      list.appendChild(e);
    }
    p.body.appendChild(list);
    p.body.appendChild(h('div', 'label', '2. Elige el envase'));
    const m = h('div', 'pick-row');
    const bolsitas = inv.count('bolsita'), tarros = inv.count('tarro_v');
    for (const [k, label, has] of [['bolsa', `🛍️ Bolsita (1 ud.) · tienes ${bolsitas}`, bolsitas], ['tarro', `🫙 Tarro (5 uds.) · tienes ${tarros}`, tarros]]) {
      const e = h('button', 'pick' + (mode === k ? ' on' : ''), label);
      e.onclick = () => { mode = k; render(); sfx('click'); };
      if (!has) e.classList.add('dim');
      m.appendChild(e);
    }
    p.body.appendChild(m);
    const per = mode === 'bolsa' ? 1 : 5;
    const pack = mode === 'bolsa' ? 'bolsita' : 'tarro_v';
    const max = Math.min(Math.floor(inv.count('cogollo', sel) / per), inv.count(pack));
    const bar = h('div', 'progress', '<i></i>');
    const row = h('div', 'row end');
    const one = h('button', 'btn', 'Empaquetar 1');
    const all = h('button', 'btn', `Empaquetar todo (${max})`);
    const go = (n) => {
      if (busy) return;
      if (n <= 0) return fail(max === 0 ? (inv.count(pack) ? 'No tienes suficientes cogollos.' : `Te faltan envases (${ITEMS[pack].name}).`) : 'Nada que empaquetar.');
      busy = true;
      const steps = Math.min(n, 8);
      let k = 0;
      const tick = () => {
        k++;
        bar.firstChild.style.width = (k / steps) * 100 + '%';
        sfx('pack');
        if (k < steps) return setTimeout(tick, 220);
        const room = inv.room(mode, sel);
        const done = Math.min(n, room);
        if (!done) { busy = false; return fail('No tienes hueco en el inventario.'); }
        inv.remove('cogollo', done * per, sel);
        inv.remove(pack, done);
        inv.add(mode, done, sel);
        G.act.flag('packed');
        G.act.toast(`Empaquetado: ${done}× ${ITEMS[mode].name}`, '📦');
        addXP(done * 0.5);
        busy = false;
        render();
      };
      tick();
    };
    one.onclick = () => go(Math.min(1, max));
    all.onclick = () => go(max);
    row.append(one, all);
    p.body.append(bar, row);
  };
  render();
}

function productStacks(id) {
  const map = new Map();
  for (const s of G.state.inv) if (s && s.id === id) map.set(s.p, (map.get(s.p) || 0) + s.q);
  return [...map].map(([p, q]) => ({ p, q }));
}

// ------------------------------------------------------------------
//  Mezcladora
// ------------------------------------------------------------------
export function openMixer(obj) {
  const p = openPanel({ title: 'Mezcladora', wide: true });
  let sel = null, ing = null, busy = false, name = '';
  const render = () => {
    p.body.innerHTML = '';
    const buds = productStacks('cogollo');
    const ings = Object.keys(INGREDIENTS).filter((k) => inv.count(k) > 0);
    if (!buds.length || !ings.length) {
      p.body.appendChild(h('p', 'txt', 'Necesitas <b>cogollos</b> y al menos un <b>ingrediente</b> (de la gasolinera Gas&Go) en el inventario.'));
      return;
    }
    if (!sel || !buds.find((b) => b.p === sel)) sel = buds[0].p;
    if (!ing || !ings.includes(ing)) ing = ings[0];
    const cols = h('div', 'mix-cols');
    const a = h('div', 'mix-col'), b = h('div', 'mix-col'), c = h('div', 'mix-col result');
    a.appendChild(h('div', 'label', 'Producto'));
    for (const bd of buds) {
      const pr = product(bd.p);
      const e = h('button', 'pick block' + (bd.p === sel ? ' on' : ''), `<b>${pr.name}</b> <small>×${bd.q}</small><div class="chips">${chips(pr.effects)}</div>`);
      e.onclick = () => { sel = bd.p; name = ''; render(); sfx('click'); };
      a.appendChild(e);
    }
    b.appendChild(h('div', 'label', 'Ingrediente'));
    for (const k of ings) {
      const it = INGREDIENTS[k];
      const e = h('button', 'pick block' + (k === ing ? ' on' : ''), `${it.icon} <b>${it.name}</b> <small>×${inv.count(k)}</small>`);
      e.onclick = () => { ing = k; name = ''; render(); sfx('click'); };
      b.appendChild(e);
    }
    const prev = previewMix(sel, ing);
    const base = product(sel);
    const qty = Math.min(inv.count('cogollo', sel), inv.count(ing), 10);
    c.appendChild(h('div', 'label', 'Resultado'));
    const known = G.state.products[prev.id];
    const same = prev.id === sel;
    c.appendChild(h('div', 'chips big', chips(prev.effects)));
    c.appendChild(h('div', 'val', `Valor: <b>${money(prev.value)}</b> <small>(antes ${money(prodValue(base))})</small>`));
    if (same) c.appendChild(h('div', 'muted', 'Este ingrediente no cambia nada.'));
    else if (known) c.appendChild(h('div', 'muted', `Ya conoces esta mezcla: <b>${known.name}</b>`));
    else {
      c.appendChild(h('div', 'new', '✨ ¡Producto nuevo!'));
      const inp = h('input', 'name-in');
      inp.placeholder = 'Ponle nombre';
      inp.maxLength = 22;
      inp.value = name;
      inp.oninput = () => { name = inp.value; };
      c.appendChild(inp);
    }
    const bar = h('div', 'progress', '<i></i>');
    const go = h('button', 'btn', `Mezclar ${qty} cogollo${qty > 1 ? 's' : ''}`);
    go.onclick = () => {
      if (busy || same) return same && fail('No tendría ningún efecto.');
      busy = true; obj.busy = true;
      sfx('mix');
      let k = 0;
      const tick = () => {
        k++;
        bar.firstChild.style.width = k * 10 + '%';
        if (k < 10) return setTimeout(tick, 150);
        const id = registerMix(sel, ing, name.trim() || undefined);
        inv.remove('cogollo', qty, sel);
        inv.remove(ing, qty);
        const left = inv.add('cogollo', qty, id);
        busy = false; obj.busy = false;
        if (left) {
          inv.remove('cogollo', qty - left, id);
          inv.add('cogollo', qty, sel);
          inv.add(ing, qty);
          render();
          return fail('No tienes hueco en el inventario para el resultado.');
        }
        G.act.flag('mixed');
        addXP(qty * 2 + (known ? 0 : 15));
        G.act.toast(`Has creado ${qty}× ${product(id).name}`, '⚗️');
        sel = id;
        name = '';
        render();
      };
      tick();
    };
    c.append(bar, go);
    cols.append(a, b, c);
    p.body.appendChild(cols);
  };
  render();
}

// ------------------------------------------------------------------
//  Estantería (transferir objetos)
// ------------------------------------------------------------------
export function openShelf(obj) {
  const p = openPanel({ title: 'Estantería', wide: true });
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
        const cell = h('button', 'inv-cell' + (s ? '' : ' empty'), s ? `<span>${ITEMS[s.id].icon}</span><small>${s.q}</small>` : '');
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
    cols.append(make('Tu inventario', G.state.inv, slots), make('Estantería', slots, G.state.inv));
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
    p.body.appendChild(h('div', 'muted', 'Toca dos huecos para intercambiarlos. Toca un objeto para ver detalles.'));
    const grid = h('div', 'inv-grid big');
    G.state.inv.forEach((s, i) => {
      const cell = h('button', 'inv-cell' + (s ? '' : ' empty') + (i === picked ? ' on' : '') + (i === G.state.sel ? ' held' : ''), s ? `<span>${ITEMS[s.id].icon}</span><small>${s.q}</small>` : `<em>${(i + 1) % 10}</em>`);
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
    p.body.appendChild(grid);
    const s = G.state.inv[picked];
    if (s) {
      const it = ITEMS[s.id];
      const d = h('div', 'detail');
      let extra = '';
      if (s.p && G.state.products[s.p]) {
        const pr = product(s.p);
        extra = `<div class="chips">${chips(pr.effects)}</div><div class="muted">Valor por unidad: ${money(prodValue(pr))} · Tu precio: ${money(pr.price)}</div>`;
      }
      d.innerHTML = `<div class="d-h">${it.icon} <b>${itemLabel(s)}</b> ×${s.q}</div><div class="muted">${it.desc || (it.illegal ? '⚠️ Ilegal: si te cachean, te lo quitarán.' : '')}</div>${extra}`;
      const row = h('div', 'row end');
      const hold = h('button', 'btn ghost', 'Llevar en la mano');
      hold.onclick = () => { G.state.sel = picked; render(); };
      const drop = h('button', 'btn danger', 'Tirar');
      drop.onclick = () => { G.state.inv[picked] = null; picked = -1; sfx('pop'); render(); };
      row.append(hold, drop);
      d.appendChild(row);
      p.body.appendChild(d);
    }
    const st = h('div', 'muted small', `💧 Agua en la regadera: ${G.state.water}/6 · Producto ilegal encima: ${illegalCount()}`);
    p.body.appendChild(st);
  };
  render();
}

// ------------------------------------------------------------------
//  Vecinos y entregas
// ------------------------------------------------------------------
export function npcActions(npc) {
  const deal = npc.deal;
  const c = customer(npc.id);
  const held = inv.held();
  const acts = [];
  if (deal) acts.push({ label: `Entregar pedido a ${npc.person.name.split(' ')[0]}`, fn: () => openHandover(npc, deal) });
  if (!c.unlocked && held && ['cogollo', 'bolsa'].includes(held.id)) acts.push({ label: `Ofrecer muestra a ${npc.person.name.split(' ')[0]}`, fn: () => giveSample(npc) });
  acts.push({
    label: `Hablar con ${c.unlocked ? npc.person.name.split(' ')[0] : 'el vecino'}`,
    fn: () => { npc.talk(3); G.act.toast(`${c.unlocked ? npc.person.name : 'Vecino'}: «${c.unlocked ? pick(CUSTOMER_LINES) : pick(GREETINGS)}»`, '💬'); },
    secondary: acts.length > 0,
  });
  return acts;
}

export function openHandover(npc, deal) {
  const prod = product(deal.product);
  const p = openPanel({ title: `Trato con ${npc.person.name}`, wide: true });
  npc.talk(999);
  const offer = new Map(); // key -> {id,p,q}
  const key = (s) => s.id + '|' + s.p;
  const units = () => [...offer.values()].reduce((a, o) => a + o.q * ITEMS[o.id].units, 0);
  const render = () => {
    p.body.innerHTML = '';
    p.body.appendChild(h('div', 'deal-req', `Pide <b>${deal.qty}×</b> <b>${prod.name}</b> por <b class="money">${money(deal.price)}</b><div class="chips">${chips(prod.effects)}</div>`));
    const cols = h('div', 'mix-cols two');
    const a = h('div', 'mix-col'), b = h('div', 'mix-col');
    a.appendChild(h('div', 'label', 'Tu producto empaquetado'));
    const packed = G.state.inv.filter((s) => s && ITEMS[s.id].packed);
    if (!packed.length) a.appendChild(h('div', 'muted', 'No llevas nada empaquetado. Solo aceptan bolsitas o tarros.'));
    const seen = new Set();
    for (const s of packed) {
      const k = key(s);
      if (seen.has(k)) continue;
      seen.add(k);
      const have = inv.count(s.id, s.p) - (offer.get(k)?.q || 0);
      const e = h('button', 'pick block' + (s.p === deal.product ? ' match' : ''), `${ITEMS[s.id].icon} <b>${product(s.p).name}</b> <small>${ITEMS[s.id].name} · quedan ${have}</small>`);
      e.onclick = () => {
        if (have <= 0) return;
        const o = offer.get(k) || { id: s.id, p: s.p, q: 0 };
        o.q++;
        offer.set(k, o);
        sfx('click');
        render();
      };
      a.appendChild(e);
    }
    b.appendChild(h('div', 'label', `Le das: ${units()} / ${deal.qty} uds.`));
    for (const [k, o] of offer) {
      const e = h('button', 'pick block on', `${ITEMS[o.id].icon} ${o.q}× ${product(o.p).name} <small>(tocar para quitar)</small>`);
      e.onclick = () => { o.q--; if (o.q <= 0) offer.delete(k); render(); };
      b.appendChild(e);
    }
    const row = h('div', 'row end');
    const auto = h('button', 'btn ghost', 'Rellenar');
    auto.onclick = () => {
      offer.clear();
      let need = deal.qty;
      for (const id of ['tarro', 'bolsa']) {
        const u = ITEMS[id].units;
        const n = Math.min(inv.count(id, deal.product), Math.floor(need / u));
        if (n > 0) { offer.set(id + '|' + deal.product, { id, p: deal.product, q: n }); need -= n * u; }
      }
      if (need > 0) {
        const n = Math.min(inv.count('bolsa', deal.product) - (offer.get('bolsa|' + deal.product)?.q || 0), need);
        if (n > 0) { const o = offer.get('bolsa|' + deal.product) || { id: 'bolsa', p: deal.product, q: 0 }; o.q += n; offer.set('bolsa|' + deal.product, o); }
      }
      render();
    };
    const give = h('button', 'btn', `Entregar y cobrar ${money(deal.price)}`);
    give.onclick = () => {
      const r = completeDeal(deal, [...offer.values()]);
      if (!r.ok) return fail(`${npc.person.name.split(' ')[0]}: «${r.msg}»`);
      closePanel(true);
      npc.talk(3);
      G.act.toast(`Trato cerrado: +${money(r.pay)}`, '💵');
      save();
    };
    row.append(auto, give);
    b.appendChild(row);
    cols.append(a, b);
    p.body.appendChild(cols);
  };
  current.onClose = () => { npc.talkT = 1; };
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
    <div class="sum"><div><small>Ganado hoy</small><b class="money">${money(sum.earned)}</b></div><div><small>Tratos</small><b>${sum.deals}</b></div><div><small>Efectivo</small><b>${money(G.state.money)}</b></div></div>
    <p class="muted">Amanece el ${DAYS[(G.state.day - 1) % 7]} (día ${G.state.day}). Las plantas han seguido creciendo mientras dormías.</p>`, 'Empezar el día');
}

// ------------------------------------------------------------------
//  Bungalow
// ------------------------------------------------------------------
export function bungalowActions() {
  if (G.state.props.bungalow) return [{ label: 'Tu bungalow', fn: () => G.act.toast('Es tuyo. Puedes cultivar y dormir aquí.') }];
  const price = G.world.props.bungalow.price;
  return [{
    label: `Comprar bungalow (${money(price)})`,
    fn: () => confirmDialog('Bungalow en venta', `<p>Bungalow con jardín en el Barrio Alto. Casi el triple de espacio que tu habitación del motel y sin alquiler.</p><p>Precio: <b>${money(price)}</b></p>`, 'Comprar', () => {
      if (G.state.money < price) return fail('No tienes suficiente dinero.');
      addMoney(-price);
      G.state.props.bungalow = true;
      G.state.home = 'bungalow';
      if (G.world.saleSign) G.world.saleSign.visible = false;
      sfx('level');
      G.act.bigToast('¡Bungalow comprado!', 'Ahora es tu casa. Ya no pagas alquiler en el motel.');
      save();
    }),
  }];
}

export { clamp, STRAINS };
