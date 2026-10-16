import { G, money, clamp } from '../game.js';
import { ITEMS, SHOPS, STRAINS, RANKS } from '../data/items.js';
import { EFFECTS, INGREDIENTS } from '../data/effects.js';
import { inv, slotsAdd, slotsRemove, illegalCount, save } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { resetTouch } from '../core/input.js';
import { product, prodValue, previewMix, registerMix, completeDeal, addMoney, addXP, customer, giveSample, GIFTABLE, canGift, directSale, saleChance, saleBudget, priceLabel, trustLabel, addictionLabel, prefMatches } from '../systems/economy.js';
import { cooperate, flee } from '../systems/police.js';
import { CUSTOMER_LINES, GREETINGS } from '../data/people.js';
import { itemLabel } from './hud.js';
import { pick } from '../game.js';

export const FORMS = [
  { id: 'bolsa', pack: 'bolsita', per: 1 },
  { id: 'tarro', pack: 'tarro_v', per: 5 },
  { id: 'gomi', pack: 'molde', per: 3 },
];
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
    card.innerHTML = `<div class="c-ic">${it.icon}</div><div class="c-info"><div class="c-n">${it.name} <span class="c-p">${locked ? '🔒 ' + RANKS[it.rank].name : money(it.price)}</span></div><div class="c-d">${it.desc || ''}</div></div>`;
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
      row.append(minus, q, plus, buy);
      card.append(row);
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
      p.foot.innerHTML = '';
      p.body.appendChild(h('p', 'txt', 'No llevas pétalos de Lumaflor. Cosecha tus plantas y vuelve.'));
      return;
    }
    if (!sel || !buds.find((b) => b.p === sel)) sel = buds[0].p;
    p.body.appendChild(h('div', 'label', '1. Elige el producto'));
    const list = h('div', 'pick-row');
    for (const b of buds) {
      const prod = product(b.p);
      const e = h('button', 'pick' + (b.p === sel ? ' on' : ''), `<b>${prod.name}</b><small>${b.q} pétalos</small>`);
      e.onclick = () => { sel = b.p; render(); sfx('click'); };
      list.appendChild(e);
    }
    p.body.appendChild(list);
    p.body.appendChild(h('div', 'label', '2. Elige el envase'));
    const m = h('div', 'pick-row');
    for (const [k, label, has] of FORMS.map((f) => [f.id, `${ITEMS[f.id].icon} ${ITEMS[f.id].name} · ${f.per} pétalo${f.per > 1 ? 's' : ''} + ${ITEMS[f.pack].name.toLowerCase()} (tienes ${inv.count(f.pack)})`, inv.count(f.pack)])) {
      const e = h('button', 'pick' + (mode === k ? ' on' : ''), label);
      e.onclick = () => { mode = k; render(); sfx('click'); };
      if (!has) e.classList.add('dim');
      m.appendChild(e);
    }
    p.body.appendChild(m);
    const F = FORMS.find((f) => f.id === mode);
    const per = F.per, pack = F.pack;
    const max = Math.min(Math.floor(inv.count('cogollo', sel) / per), inv.count(pack));
    const bar = h('div', 'progress', '<i></i>');
    const row = p.foot;
    row.innerHTML = '';
    const one = h('button', 'btn ghost', 'Empaquetar 1');
    const all = h('button', 'btn', `Empaquetar todo (${max})`);
    const go = (n) => {
      if (busy) return;
      if (n <= 0) return fail(max === 0 ? (inv.count(pack) ? 'No tienes suficientes pétalos.' : `Te faltan envases (${ITEMS[pack].name}).`) : 'Nada que empaquetar.');
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
    p.body.append(bar);
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
      p.body.appendChild(h('p', 'txt', 'Necesitas <b>pétalos de Lumaflor</b> y al menos un <b>ingrediente</b> (de la gasolinera Gas&Go) en el inventario.'));
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
    const go = h('button', 'btn', `Mezclar ${qty} pétalo${qty > 1 ? 's' : ''}`);
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
    p.body.appendChild(h('div', 'muted small', 'Toca dos huecos para intercambiarlos.'));
    const cols = h('div', 'bag-cols');
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
      d.innerHTML = `<div class="d-h">${it.icon} <b>${itemLabel(s)}</b> ×${s.q}</div><div class="muted">${it.desc || (it.illegal ? '⚠️ Ilegal: si te cachean, te lo quitarán.' : '')}</div>${extra}`;
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
const PACKED = ['bolsa', 'tarro', 'gomi'];

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
      p.body.appendChild(h('div', 'small', `<span class="muted">Le gusta:</span><div class="chips">${chips(npc.person.prefs)}</div><span class="muted">Lo prefiere en ${ITEMS[npc.person.form].icon} ${ITEMS[npc.person.form].form}</span>`));
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
      act('💵', 'Vender', why || 'Ofrécele producto a tu precio', () => show('sell'), !!why);
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
      const b = h('button', 'pick' + (x === sel || (x.id === sel.id && x.p === sel.p) ? ' on' : ''), `<b>${ITEMS[x.id].icon} ${pr.name}</b><small>${ITEMS[x.id].name} · tienes ${x.q}</small>`);
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
      G.act.toast(`${r.msg} +${money(r.total)}`, '💵');
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
      const b = h('button', 'pick' + (x.id === sel.id && x.p === sel.p ? ' on' : ''), `<b>${ITEMS[x.id].icon} ${pr.name}${likes}</b><small>1 ${ITEMS[x.id].name.toLowerCase()} · tienes ${x.q}</small>`);
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
    const order = [...new Set([deal.form, 'tarro', 'gomi', 'bolsa'])].filter(Boolean);
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
    const fav = deal.form ? ` · lo prefiere en <b>${ITEMS[deal.form].icon} ${ITEMS[deal.form].form}</b> (+10% propina)` : '';
    p.body.appendChild(h('div', 'deal-req', `Pide <b>${deal.qty}×</b> <b>${prod.name}</b> por <b class="money">${money(deal.price)}</b><div class="small muted">${chips(prod.effects)}${fav}</div>`));
    const got = units();
    const ok = got >= deal.qty;
    const lines = [...offer.values()].map((o) => `${ITEMS[o.id].icon} ${o.q} ${ITEMS[o.id].name.toLowerCase()}${o.q > 1 ? 's' : ''} de ${product(o.p).name}`).join('<br>') || 'Nada';
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
        const b = h('button', 'pick' + (s.p === deal.product ? ' match' : ''), `<b>${ITEMS[s.id].icon} ${product(s.p).name}</b><small>${ITEMS[s.id].name} · +1 (quedan ${have})${inOffer ? ` · −1 manteniendo` : ''}</small>`);
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
      G.act.toast(`Trato cerrado: +${money(r.pay)}${r.tip ? ` (propina ${money(r.tip)})` : ''}`, '💵');
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
