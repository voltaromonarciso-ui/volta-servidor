import { ii } from './icons.js';
import { openLayoutEditor } from './layout.js';
import { G, on, money } from '../game.js';
import { STRAINS, RANKS } from '../data/items.js';
const nego = {}; // precio propuesto en cada negociación abierta
import { PEOPLE } from '../data/people.js';
import { QUESTS } from '../data/quests.js';
import { openBigMap } from './bigmap.js';
import { DELIVERY, dealAt, dealDue, whenLabel, hhmm, inCurfew, orderDrop, spend, balance } from '../systems/economy.js';
import { CONTACTS, customer, product, prodValue, acceptDeal, rejectDeal, negotiateDeal, orderSeeds, acceptChance, marketChance, priceLabel, trustLabel, addictionLabel, REP_TIERS, repTier } from '../systems/economy.js';
import { clock, dayName } from '../systems/time.js';
import { save, wipe, absNow } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { resetTouch, guardGhostClick } from '../core/input.js';
import { chips, confirmDialog, closePanel, stepper, chanceBar, meter } from './panels.js';
import { ITEMS } from '../data/items.js';
import { setWaypoint, clearWaypoint, getWaypoint } from './hud.js';
import { setShadows } from '../world/sky.js';
import { maxStaff, employees, candidate, hired, hire, fire, assign, setMode, payDebt, dailyCost, totalDebt, nextPayday, ownedProps, statusText, ROLES, CANDIDATES, STAFF, PACK_MODES } from '../systems/staff.js';

const APPS = [
  { id: 'msgs', name: 'Mensajes', icon: '💬', color: '#27ae60' },
  { id: 'clients', name: 'Clientes', icon: '👥', color: '#2980b9' },
  { id: 'deliveries', name: 'Entregas', icon: '📦', color: '#c0392b' },
  { id: 'products', name: 'Productos', icon: '🏷️', color: '#8e44ad' },
  { id: 'map', name: 'Mapa', icon: '🗺️', color: '#16a085' },
  { id: 'supplier', name: 'Proveedor', icon: '🌱', color: '#2e7d32' },
  { id: 'staff', name: 'Personal', icon: '👷', color: '#8e6e53' },
  { id: 'realty', name: 'Inmobiliaria', icon: '🏭', color: '#b8860b' },
  { id: 'quests', name: 'Objetivos', icon: '📋', color: '#e67e22' },
  { id: 'stats', name: 'Perfil', icon: '📊', color: '#34495e' },
  { id: 'settings', name: 'Ajustes', icon: '⚙️', color: '#7f8c8d' },
];

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
let root, screen, title, view = { app: null, arg: null };
let open = false;

export function initPhone() {
  root = document.getElementById('phone');
  root.innerHTML = `<div class="ph-frame"><div class="ph-status"><span id="ph-time">07:00</span><span id="ph-title"></span><span>📶 🔋</span></div>
    <div class="ph-screen"></div>
    <div class="ph-nav"><button data-a="back">‹</button><button data-a="home">●</button><button data-a="close">✕</button></div></div>`;
  screen = root.querySelector('.ph-screen');
  title = root.querySelector('#ph-title');
  root.querySelector('.ph-nav').addEventListener('click', (e) => {
    const a = e.target.dataset.a;
    if (a === 'close') closePhone();
    if (a === 'home') go(null);
    if (a === 'back') back();
  });
  root.addEventListener('pointerdown', (e) => { if (e.target === root) closePhone(); });
  on('messages', () => { if (open && (view.app === 'msgs' || view.app === 'chat')) render(); });
}

export const phoneOpen = () => open;

export function openPhone(app = null, arg = null) {
  if (G.uiOpen && !open) return;
  open = true;
  G.uiOpen = true;
  resetTouch();
  if (G.touch) guardGhostClick();
  if (document.pointerLockElement) document.exitPointerLock();
  root.classList.add('open');
  sfx('open');
  go(app, arg);
}

export function closePhone() {
  if (!open) return;
  open = false;
  G.uiOpen = false;
  root.classList.remove('open');
  sfx('close');
}

export function togglePhone() { open ? closePhone() : openPhone(); }

function go(app, arg = null) {
  if (app === 'map' && G.world.bounds) { closePhone(); if (openBigMap()) return; } // la isla: mapa a pantalla completa
  view = { app, arg };
  render();
}

function back() {
  if (view.app === 'chat') go('msgs');
  else if (view.app === 'realty' && view.arg) go('realty');
  else go(null);
}

export function tickPhone() {
  if (!open) return;
  root.querySelector('#ph-time').textContent = clock(G.state.minute);
  if (view.app === 'map') drawMap();
}

function render() {
  root.querySelector('#ph-time').textContent = clock(G.state.minute);
  screen.innerHTML = '';
  screen.scrollTop = 0;
  const app = APPS.find((a) => a.id === view.app);
  title.textContent = view.app === 'chat' ? CONTACTS[view.arg].name : app ? app.name : '';
  ({ msgs, chat, clients, deliveries, products, map, supplier, realty, staff, quests, stats, settings }[view.app] || home)();
}

// ------------------------------------------------------------------
function home() {
  const s = G.state;
  const top = h('div', 'ph-home-top', `<div class="ph-clock">${clock(s.minute)}</div><div class="ph-date">${dayName(s.day)} · Día ${s.day}</div>`);
  screen.appendChild(top);
  const grid = h('div', 'ph-apps');
  for (const a of APPS) {
    const unread = a.id === 'msgs' ? Object.values(s.unread || {}).reduce((x, y) => x + y, 0) : 0;
    const b = h('button', 'ph-app', `<span class="ai" style="background:${a.color}">${a.icon}${unread ? `<i class="badge">${unread}</i>` : ''}</span><span>${a.name}</span>`);
    b.onclick = () => { sfx('click'); go(a.id); };
    grid.appendChild(b);
  }
  screen.appendChild(grid);
}

function lastOf(id) {
  const m = G.state.messages[id];
  return m && m.length ? m[m.length - 1] : null;
}

function msgs() {
  const s = G.state;
  const ids = [...s.contacts].sort((a, b) => (lastOf(b)?.t ?? -1) - (lastOf(a)?.t ?? -1));
  const list = h('div', 'ph-list');
  for (const id of ids) {
    const c = CONTACTS[id];
    const last = lastOf(id);
    const un = s.unread?.[id] || 0;
    const row = h('button', 'ph-row', `<span class="av" style="background:${c.color}">${c.icon}</span><span class="rt"><b>${c.name}</b><small>${last ? (last.me ? 'Tú: ' : '') + last.text : 'Sin mensajes'}</small></span>${un ? `<i class="badge">${un}</i>` : ''}`);
    row.onclick = () => { sfx('click'); go('chat', id); };
    list.appendChild(row);
  }
  screen.appendChild(list);
}

function chat() {
  const id = view.arg;
  G.state.unread[id] = 0;
  const box = h('div', 'ph-chat');
  const msgsArr = G.state.messages[id] || [];
  if (!msgsArr.length) box.appendChild(h('div', 'muted center', 'Aún no os habéis escrito.'));
  for (const m of msgsArr) {
    const b = h('div', 'bubble ' + (m.me ? 'me' : 'them'), `<div>${m.text}</div><small>${clock(m.t % 1440)}</small>`);
    if (m.deal) {
      const d = G.state.deals.find((x) => x.id === m.deal);
      if (d) {
        const prod = product(d.product);
        const info = h('div', 'deal-card', `<div><b>${d.qty}× ${prod ? prod.name : '?'}</b> · <span class="money">${money(d.price)}</span></div>${d.at !== undefined ? `<div class="small">🕘 ${whenLabel(d.at)}${inCurfew(d.at) ? ` · 🌙 toque de queda: +${Math.round(DELIVERY.curfewBonus * 100)}%` : ''}</div>` : ''}`);
        if (d.status === 'offer') {
          const row = h('div', 'row');
          const ok = h('button', 'btn sm', 'Aceptar');
          ok.onclick = () => { delete nego[d.id]; acceptDeal(d); render(); };
          const ct = h('button', 'btn sm ghost', nego[d.id] ? 'Cerrar' : 'Negociar');
          ct.onclick = () => { if (nego[d.id]) delete nego[d.id]; else nego[d.id] = Math.round(d.price * 1.15); render(); };
          const no = h('button', 'btn sm danger', 'Rechazar');
          no.onclick = () => { delete nego[d.id]; rejectDeal(d); render(); };
          row.append(ok, ct, no);
          info.appendChild(row);
          if (nego[d.id] && prod) {
            // propuesta de precio con la probabilidad de que acepte
            const box = h('div', 'nego');
            const bar = chanceBar();
            const upd = (v) => { nego[d.id] = v; bar.update(acceptChance(d.npc, prod, v / d.qty), priceLabel(prod, v / d.qty)); send.textContent = `Proponer ${money(v)}`; };
            const st = stepper(nego[d.id], { min: 1, max: d.price * 4, step: () => Math.max(1, Math.round(d.price * 0.05)), fmt: money, onChange: upd });
            const send = h('button', 'btn sm', '');
            send.onclick = () => { const v = nego[d.id]; delete nego[d.id]; negotiateDeal(d, v); render(); };
            box.append(h('div', 'small muted', `Su oferta: ${money(d.price)} (${money(Math.round(d.price / d.qty))}/ud.)${d.counters ? ' · ya habéis negociado' : ''}`), st, bar, send);
            info.appendChild(box);
            upd(nego[d.id]);
          }
        } else {
          const lab = { accepted: d.at !== undefined ? `🟢 Aceptado · cita ${whenLabel(d.at)}${inCurfew(d.at) ? ' 🌙 (+plus)' : ''}` : '🟢 Aceptado · ve al punto de encuentro', done: '✅ Completado', failed: '❌ Fallido', rejected: '🚫 Rechazado', expired: '⌛ Caducado' }[d.status];
          info.appendChild(h('div', 'muted small', lab));
          if (d.status === 'accepted') {
            const spot = G.world.spots.find((x) => x.id === d.spot);
            const wp = h('button', 'btn sm ghost', '📍 Marcar en el mapa');
            wp.onclick = () => { setWaypoint(spot.x, spot.z, CONTACTS[d.npc].name); sfx('click'); };
            info.appendChild(wp);
          }
        }
        b.appendChild(info);
      }
    }
    box.appendChild(b);
  }
  screen.appendChild(box);
  setTimeout(() => { screen.scrollTop = screen.scrollHeight; }, 0);
}

// Agenda de entregas: lo que hay que entregar (con su hora), las propuestas por
// responder y lo entregado hoy, con el plus de toque de queda si lo hubo.
function deliveries() {
  const s = G.state, now = absNow();
  const list = h('div', 'ph-list');
  const sec = (t) => list.appendChild(h('div', 'dl-sec', t));
  const row = (d, state) => {
    const pr = s.products[d.product];
    const spot = G.world.spots.find((x) => x.id === d.spot);
    const at = dealAt(d), night = inCurfew(at);
    const r = h('div', 'ph-card dl-row', `<div class="rowsp"><span class="when${night ? ' night' : ''}">${hhmm(at)}${night ? ' 🌙' : ''}</span><small>${state}</small></div>
      <div><b>${CONTACTS[d.npc].name}</b> · ${d.qty}× ${pr ? pr.name : '?'} en ${ITEMS[d.form]?.form || 'sobres'}</div>
      <div class="small muted">${spot ? spot.name : ''} · ${money(d.price)}${night ? ` + ${Math.round(DELIVERY.curfewBonus * 100)}% de plus si entregas en toque de queda` : ''}</div>`);
    if (d.status === 'accepted') {
      const wp = h('button', 'btn sm ghost', '📍 Marcar en el mapa');
      wp.onclick = () => { setWaypoint(spot.x, spot.z, CONTACTS[d.npc].name); sfx('click'); };
      r.appendChild(wp);
    } else if (d.status === 'offer') {
      const go2 = h('button', 'btn sm ghost', '💬 Responder');
      go2.onclick = () => { sfx('click'); go('chat', d.npc); };
      r.appendChild(go2);
    }
    list.appendChild(r);
  };
  const byTime = (a, b) => dealAt(a) - dealAt(b);
  const acc = s.deals.filter((d) => d.status === 'accepted').sort(byTime);
  const off = s.deals.filter((d) => d.status === 'offer').sort(byTime);
  const done = s.deals.filter((d) => d.status === 'done' && d.doneAt !== undefined && Math.floor(d.doneAt / 1440) === Math.floor(now / 1440));
  sec(`Pendientes (${acc.length})`);
  if (!acc.length) list.appendChild(h('div', 'small muted', 'No tienes entregas acordadas.'));
  for (const d of acc) row(d, dealDue(d, now) ? `te espera hasta las ${hhmm(d.expires)}` : whenLabel(dealAt(d), now));
  if (off.length) { sec(`Propuestas sin responder (${off.length})`); for (const d of off) row(d, 'por responder'); }
  sec(`Entregadas hoy (${done.length})`);
  if (!done.length) list.appendChild(h('div', 'small muted', 'Aún ninguna.'));
  for (const d of done) list.appendChild(h('div', 'ph-card dl-row', `<div class="rowsp"><b>${CONTACTS[d.npc].name}</b><small>${hhmm(d.doneAt)}</small></div><div>Cobrado ${money(d.paid || d.price)}${d.bonus ? ` · 🌙 plus toque de queda +${money(d.bonus)}` : ''}</div>`));
  screen.appendChild(list);
}

function clients() {
  const list = h('div', 'ph-list');
  const known = PEOPLE.filter((p) => customer(p.id).unlocked).sort((a, b) => customer(b.id).affinity - customer(a.id).affinity);
  for (const p of known) {
    const c = customer(p.id);
    const pend = G.state.deals.find((d) => d.npc === p.id && (d.status === 'offer' || d.status === 'accepted'));
    const last = c.lastBuy ? (G.state.day - c.lastBuy === 0 ? 'hoy' : `hace ${G.state.day - c.lastBuy} día(s)`) : 'nunca';
    const row = h('div', 'ph-card', `<div class="rowsp"><b>${p.name}</b><small>${c.deals} compras · última ${last}</small></div>
      ${meter('Confianza', c.affinity / 100, trustLabel(c.affinity))}
      ${meter('Adicción', c.addiction, addictionLabel(c.addiction), '#e67e22')}
      <div class="small muted">Le gusta:</div><div class="chips">${chips(p.prefs)}</div>
      <div class="small muted">Prefiere ${ii(p.form)} ${ITEMS[p.form].form} · Gasta ${money(p.budget[0])}–${money(p.budget[1])} · Exigencia ${'★'.repeat(p.std + 1)}</div>
      ${pend ? `<div class="small" style="color:var(--gold)">● ${pend.status === 'offer' ? 'Te ha pedido algo (mira Mensajes)' : 'Pedido aceptado pendiente de entregar'}</div>` : ''}`);
    list.appendChild(row);
  }
  const locked = PEOPLE.length - known.length;
  list.appendChild(h('div', 'muted center small', locked ? `Hay ${locked} vecinos más en Puerto Lomas. Háblales y regálales una muestra para hacerlos clientes.` : '¡Todo el pueblo es cliente tuyo!'));
  screen.appendChild(list);
}

function products() {
  const list = h('div', 'ph-list');
  const all = Object.values(G.state.products);
  if (!all.length) list.appendChild(h('div', 'muted center', 'Aún no tienes productos. Cosecha tu primera planta.'));
  for (const p of all) {
    const v = prodValue(p);
    const card = h('div', 'ph-card');
    card.innerHTML = `<div class="rowsp"><b class="pname">${p.name}</b><small>${STRAINS[p.strain].name}</small></div><div class="chips">${chips(p.effects)}</div>
      <div class="small muted">Valor de mercado: <b>${money(v)}</b> por unidad</div>`;
    const row = h('div', 'rowsp');
    const bar = chanceBar();
    const upd = (n) => { p.price = n; bar.update(marketChance(p, n), priceLabel(p, n)); };
    const price = stepper(p.price, { min: 1, max: v * 4, step: () => Math.max(1, Math.round(v * 0.05)), fmt: money, onChange: upd });
    const fair = h('button', 'btn sm ghost', 'Precio justo');
    fair.onclick = () => { price.set(v); sfx('click'); };
    const tog = h('button', 'toggle' + (p.listed ? ' on' : ''), p.listed ? 'A la venta' : 'Oculto');
    tog.onclick = () => { p.listed = !p.listed; render(); };
    row.append(price, fair, tog);
    card.append(row, bar);
    bar.update(marketChance(p, p.price), priceLabel(p, p.price));
    card.querySelector('.pname').onclick = () => {
      const row2 = h('div', 'row');
      const inp = h('input', 'name-in');
      inp.value = p.name; inp.maxLength = 22;
      const ok = h('button', 'btn sm', 'Guardar');
      ok.onclick = () => { if (inp.value.trim()) p.name = inp.value.trim().slice(0, 22); render(); };
      row2.append(inp, ok);
      card.appendChild(row2);
      inp.focus();
    };
    list.appendChild(card);
  }
  list.appendChild(h('div', 'muted small center', 'Este es tu precio base por unidad. La probabilidad es la media de tus clientes: los que más confían en ti y los más enganchados aceptan precios más altos. En cada pedido puedes negociar.'));
  screen.appendChild(list);
}

// ------------------------------------------------------------------
let mapCanvas = null;
// límites del mapa: los de la isla (con sus cabos y el puerto); el mapa antiguo, los suyos
let MB = { x0: -118, x1: 118, z0: -118, z1: 132 };
function map() {
  const wrap = h('div', 'ph-map');
  mapCanvas = document.createElement('canvas');
  wrap.appendChild(mapCanvas);
  if (G.world.bounds) MB = G.world.bounds;
  const legend = h('div', 'map-legend small', '🟢 Trato · 📦 Entregas · 🔵 Tú · Toca el mapa para marcar un destino');
  const clr = h('button', 'btn sm ghost', 'Quitar marca');
  clr.onclick = () => { clearWaypoint(); drawMap(); };
  screen.append(wrap, legend, clr);
  requestAnimationFrame(() => {
    const w = wrap.clientWidth;
    const hgt = Math.round(w * ((MB.z1 - MB.z0) / (MB.x1 - MB.x0)));
    mapCanvas.width = w * 2; mapCanvas.height = hgt * 2;
    mapCanvas.style.height = hgt + 'px';
    drawMap();
  });
  mapCanvas.addEventListener('pointerdown', (e) => {
    const r = mapCanvas.getBoundingClientRect();
    const x = MB.x0 + ((e.clientX - r.left) / r.width) * (MB.x1 - MB.x0);
    const z = MB.z1 - ((e.clientY - r.top) / r.height) * (MB.z1 - MB.z0);
    setWaypoint(x, z, 'Destino');
    sfx('click');
    drawMap();
  });
}

function drawMap() {
  if (!mapCanvas || !mapCanvas.width) return;
  const g = mapCanvas.getContext('2d');
  const W = mapCanvas.width, H = mapCanvas.height;
  const sx = W / (MB.x1 - MB.x0), sz = H / (MB.z1 - MB.z0);
  const X = (x) => (x - MB.x0) * sx, Y = (z) => (MB.z1 - z) * sz;
  if (G.world.bounds) { g.fillStyle = '#2f8fb3'; g.fillRect(0, 0, W, H); } // la isla: todo mar y encima la tierra
  else { g.fillStyle = '#6aa84f'; g.fillRect(0, 0, W, H); g.fillStyle = '#2f8fb3'; g.fillRect(0, 0, W, Y(105)); }
  for (const r of G.world.mapRects) {
    g.fillStyle = r.c;
    if (r.coast && G.world.coastPoly) { // la orilla con sus cabos
      g.beginPath(); G.world.coastPoly[r.coast].forEach(([x, z], i) => (i ? g.lineTo(X(x), Y(z)) : g.moveTo(X(x), Y(z)))); g.closePath(); g.fill();
    } else g.fillRect(X(r.x0), Y(r.z1), (r.x1 - r.x0) * sx, (r.z1 - r.z0) * sz);
  }
  const dot = (x, z, color, r = W / 70, txt) => {
    g.fillStyle = color; g.beginPath(); g.arc(X(x), Y(z), r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    if (txt) { g.fillStyle = '#fff'; g.font = `bold ${Math.round(r * 1.2)}px sans-serif`; g.fillText(txt, X(x), Y(z) + r * 0.45); }
  };
  g.textAlign = 'center';
  for (const a of G.world.atms || []) dot(a.x, a.z, '#1e6fd9', W / 70, '$'); // cajeros
  for (const d of G.state.deals.filter((x) => x.status === 'accepted')) {
    const s = G.world.spots.find((x) => x.id === d.spot);
    dot(s.x, s.z, '#27ae60', W / 50, '$');
  }
  const wp = getWaypoint();
  if (wp) dot(wp.x, wp.z, '#f1c40f', W / 70, '★');
  for (const o of G.state.orders) { const d = orderDrop(o); dot(d.x, d.z, '#e67e22', W / 55, '📦'); }
  // nombres encima de los puntos, para que se lean
  g.font = `bold ${Math.round(W / (G.world.bounds ? 52 : 34))}px sans-serif`; // (la isla es más grande: letra más pequeña)
  g.textAlign = 'center';
  const seen = new Set();
  for (const l of G.world.mapLabels) {
    if (seen.has(l.t)) continue; // (algunos sitios se rotulan dos veces)
    seen.add(l.t);
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(l.t, X(l.x) + 1, Y(l.z) + 1);
    g.fillStyle = '#fff'; g.fillText(l.t, X(l.x), Y(l.z));
  }
  // jugador
  const p = G.player.pos;
  g.save();
  g.translate(X(p.x), Y(p.z));
  g.rotate(Math.PI + G.player.yaw);
  const s = W / 45;
  g.fillStyle = '#2e86de'; g.strokeStyle = '#fff'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(0, -s); g.lineTo(s * 0.7, s * 0.8); g.lineTo(0, s * 0.4); g.lineTo(-s * 0.7, s * 0.8); g.closePath();
  g.fill(); g.stroke();
  g.restore();
  for (const cop of G.police) if (cop.distToPlayer() < 30) dot(cop.pos.x, cop.pos.z, '#c0392b', W / 110);
}

// ------------------------------------------------------------------
function supplier() {
  const box = h('div', 'ph-list');
  box.appendChild(h('div', 'ph-card', '<b>Rubio</b><div class="small muted">«Semillas de calidad, sin preguntas. Te lo dejo en el contenedor verde del polígono.» (7:00–23:00)</div>'));
  for (const [id, st] of Object.entries(STRAINS).filter(([, x]) => !x.noSeed && !x.cartel)) {
    const locked = st.rank > G.state.rank;
    const card = h('div', 'ph-card' + (locked ? ' locked' : ''));
    card.innerHTML = `<div class="rowsp"><b>🌰 ${st.name}</b><span class="money">${money(st.seed)}</span></div><div class="chips">${chips([st.effect])}</div>
      <div class="small muted">${st.leaf ? `Da ${st.yield[0]}–${st.yield[1]} hojas para hacer polvo (Nieve) en la mesa de polvos` : `Precio base del producto: ${money(st.base)} · Cosecha ${st.yield[0]}–${st.yield[1]} cogollos`}</div>`;
    if (locked) card.appendChild(h('div', 'small', `🔒 Requiere rango ${RANKS[st.rank].name}`));
    else {
      let q = 3;
      const row = h('div', 'rowsp');
      const qty = h('div', 'qty');
      const minus = h('button', 'qb', '−'), plus = h('button', 'qb', '+'), v = h('span', 'qv', q);
      const buy = h('button', 'btn sm', `Pedir · ${money(st.seed * q)}`);
      const upd = () => { v.textContent = q; buy.textContent = `Pedir · ${money(st.seed * q)}`; };
      minus.onclick = () => { q = Math.max(1, q - 1); upd(); };
      plus.onclick = () => { q = Math.min(10, q + 1); upd(); };
      buy.onclick = () => {
        const r = orderSeeds(id, q);
        if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); return; }
        sfx('cash');
        render();
      };
      qty.append(minus, v, plus);
      row.append(qty, buy);
      card.appendChild(row);
    }
    box.appendChild(card);
  }
  const pending = G.state.orders.length;
  if (pending) box.appendChild(h('div', 'muted small center', `📦 Tienes ${pending} pedido(s) pendiente(s) de recoger.`));
  screen.appendChild(box);
}

// ------------------------------------------------------------------
//  Inmobiliaria: portal de naves en venta (fotos sacadas del juego, ficha y compra con dinero limpio)
// ------------------------------------------------------------------
const RE_PICS = import.meta.glob('../assets/realty/*.jpg', { query: '?url', import: 'default', eager: true });
const rePics = (id) => ['fachada', 'interior'].map((k) => ({ src: RE_PICS[`../assets/realty/${id}-${k}.jpg`], cap: k === 'fachada' ? 'Fachada y patio' : 'Interior de la nave' })).filter((p) => p.src);
// iconos de línea (24×24) para las características
const RE_ICO = {
  area: '<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/><path d="M8 12h8M12 8v8" opacity=".55"/>',
  height: '<path d="M12 3v18M8 7l4-4 4 4M8 17l4 4 4-4"/><path d="M3 21h4M17 21h4" opacity=".55"/>',
  door: '<rect x="4" y="5" width="16" height="15" rx="1"/><path d="M4 9h16M4 12h16M4 15h16M2 5h20"/>',
  office: '<path d="M3 20h18M5 20V11h14v9M8 11V6h8v5"/><path d="M10 8h4" opacity=".55"/><path d="M7 20v-5M17 20v-5"/>',
  rack: '<path d="M4 3v18M20 3v18M4 8h16M4 14h16M4 20h16"/><rect x="7" y="10" width="4" height="4" opacity=".55"/><rect x="13" y="4" width="4" height="4" opacity=".55"/>',
  lift: '<path d="M5 18V8h6l2 4v6"/><circle cx="7" cy="19" r="1.6"/><circle cx="13" cy="19" r="1.6"/><path d="M17 4v15h4"/>',
  fence: '<path d="M4 6v14M10 6v14M16 6v14M2 10h20M2 16h20"/><path d="M4 6l1-2M10 6l1-2M16 6l1-2" opacity=".55"/>',
  key: '<circle cx="8" cy="12" r="4"/><path d="M12 12h9M18 12v3M21 12v2"/>',
  bolt: '<path d="M13 2L5 14h6l-1 8 8-12h-6z"/>',
  light: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9V16h7v-2.1A6 6 0 0 0 12 3z"/>',
  pin: '<path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21z"/><circle cx="12" cy="9.5" r="2.5"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
};
const reIco = (k, cls = 're-ico') => `<svg class="${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${RE_ICO[k]}</svg>`;
const thousands = (n) => n.toLocaleString('es-ES').replace(/\s/g, '.');
function reDist(id) {
  const q = G.world.pois[id], P = G.player?.pos;
  if (!q || !P) return 'Polígono industrial';
  const d = Math.hypot(q.x - P.x, q.z - P.z);
  return `Polígono industrial · ${d < 1000 ? `a ${Math.round(d / 10) * 10} m` : `a ${(d / 1000).toFixed(1)} km`}`;
}
function reFeats(p) {
  return [
    ['area', 'Superficie', `${p.area} m²`],
    ['height', 'Altura libre', `${p.height || 8} m`],
    ['door', 'Portones de carga', `${p.doors || 1} enrollable${(p.doors || 1) > 1 ? 's' : ''}`],
    ['office', 'Oficina en altillo', `${p.office || 35} m² acristalada`],
    ['rack', 'Estanterías', 'Racks de palés'],
    ['lift', 'Maquinaria', (p.level || 0) > 0 ? 'Carretilla y transpalé' : 'Carretilla elevadora'],
    ['fence', 'Patio exterior', 'Vallado con portón'],
    ['key', 'Acceso', 'Puerta de oficina con llave'],
    ['bolt', 'Instalación', 'Trifásica y cuadro propio'],
    ['light', 'Iluminación', 'Campanas industriales LED'],
  ];
}
// galería deslizable con puntos, contador y pie de foto
function reGallery(id, big = false) {
  const pics = rePics(id);
  const g = h('div', 're-gal' + (big ? ' big' : ''));
  const track = h('div', 're-track');
  for (const p of pics) track.appendChild(h('figure', 're-slide', `<img src="${p.src}" alt="" loading="lazy" draggable="false">${big ? `<figcaption>${p.cap}</figcaption>` : ''}`));
  if (!pics.length) track.appendChild(h('figure', 're-slide empty', reIco('office', 're-ico xl')));
  const dots = h('div', 're-dots', pics.map((_, i) => `<i${i ? '' : ' class="on"'}></i>`).join(''));
  const count = h('span', 're-count', `1/${pics.length || 1}`);
  track.addEventListener('scroll', () => {
    const i = Math.round(track.scrollLeft / Math.max(1, track.clientWidth));
    dots.querySelectorAll('i').forEach((d, k) => d.classList.toggle('on', k === i));
    count.textContent = `${i + 1}/${pics.length || 1}`;
  }, { passive: true });
  g.append(track, dots, count);
  g.show = (i) => track.scrollTo({ left: i * track.clientWidth, behavior: 'smooth' });
  return g;
}
function reBuy(id) {
  const p = G.world.props[id];
  confirmDialog(`Comprar ${p.name}`, `<p>${p.blurb || ''}</p><p>${p.area} m² · Precio: <b>${money(p.price)}</b> · se paga con dinero limpio.</p><p class="small">Podrás entrar por la puerta de la oficina, cultivar, montar mesas de trabajo, almacenar y asignar empleados.</p>`, 'Comprar', () => {
    if (G.state.props[id]) return;
    const r = spend('clean', p.price, id, { key: 'prop:' + id });
    if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); return; }
    G.state.props[id] = true;
    sfx('level');
    G.act.bigToast(`¡${p.name} es tuyo!`, 'La puerta de la oficina ya está abierta. Te lo he marcado en el mapa.');
    const q = G.world.pois[id];
    if (q) setWaypoint(q.x, q.z, p.name);
    save();
    render();
  });
}
function reMark(id) {
  const q = G.world.pois[id], p = G.world.props[id];
  if (!q) return;
  setWaypoint(q.x, q.z, p.name); sfx('click'); G.act.toast(`Destino: ${p.name}`, '📍');
}
function realty() {
  if (view.arg && G.world.props[view.arg]) return realtyDetail(view.arg);
  const list = Object.entries(G.world.props).filter(([, p]) => p.warehouse).sort((a, b) => a[1].price - b[1].price);
  const box = h('div', 're');
  box.appendChild(h('div', 're-head', `<div class="re-logo">NL</div><div class="re-brand"><b>Naves Lomas</b><small>Inmobiliaria industrial · Rooktown</small></div>
    <div class="re-bal"><small>Saldo limpio</small><b>${money(balance('clean'))}</b></div>`));
  const avail = list.filter(([id]) => !G.state.props[id]).length;
  box.appendChild(h('div', 're-sub', `<b>${list.length} naves</b> en el polígono · ${avail ? `${avail} disponible${avail > 1 ? 's' : ''}` : 'todas son tuyas'}<span>Por precio ↑</span>`));
  for (const [id, p] of list) {
    const owned = !!G.state.props[id];
    const card = h('div', 're-card' + (owned ? ' owned' : ''));
    const gal = reGallery(id);
    gal.appendChild(h('span', 're-tag' + (owned ? ' own' : ''), owned ? `${reIco('check', 're-ico s')} Tuya` : 'En venta'));
    card.appendChild(gal);
    const body = h('div', 're-body', `<div class="re-price">${money(p.price)}<small>${thousands(Math.round(p.price / p.area))} $/m²</small></div>
      <div class="re-title">${p.name}</div>
      <div class="re-loc">${reIco('pin', 're-ico s')}${reDist(id)}</div>
      <div class="re-chips"><span>${reIco('area', 're-ico s')}${p.area} m²</span><span>${reIco('door', 're-ico s')}${p.doors || 1} portón${(p.doors || 1) > 1 ? 'es' : ''}</span><span>${reIco('office', 're-ico s')}Altillo ${p.office || 35} m²</span></div>`);
    card.appendChild(body);
    card.onclick = (e) => { if (e.target.closest('.re-track') && e.target.closest('.re-gal').querySelector('.re-track').scrollLeft % 1) return; sfx('click'); go('realty', id); };
    box.appendChild(card);
  }
  if (!list.length) box.appendChild(h('div', 'muted small center', 'No hay naves en venta en esta zona.'));
  box.appendChild(h('div', 're-foot', '💡 Solo aceptamos transferencia: blanquea efectivo en un cajero del Banco Rooktown.'));
  screen.appendChild(box);
}
function realtyDetail(id) {
  const p = G.world.props[id], owned = !!G.state.props[id], clean = balance('clean');
  const box = h('div', 're re-detail');
  const gal = reGallery(id, true);
  gal.appendChild(h('span', 're-tag' + (owned ? ' own' : ''), owned ? `${reIco('check', 're-ico s')} Tuya` : 'En venta'));
  box.appendChild(gal);
  const pics = rePics(id);
  if (pics.length > 1) {
    const th = h('div', 're-thumbs');
    pics.forEach((q, i) => { const b = h('button', '', `<img src="${q.src}" alt=""><span>${q.cap}</span>`); b.onclick = () => gal.show(i); th.appendChild(b); });
    box.appendChild(th);
  }
  box.appendChild(h('div', 're-info', `<div class="re-title big">${p.name}</div><div class="re-loc">${reIco('pin', 're-ico s')}${reDist(id)}</div>
    <div class="re-price big">${money(p.price)}<small>${thousands(Math.round(p.price / p.area))} $/m²</small></div>`));
  const feats = h('div', 're-sec', '<h4>Características</h4>');
  const grid = h('div', 're-feats');
  for (const [k, label, val] of reFeats(p)) grid.appendChild(h('div', 're-feat', `${reIco(k)}<div><small>${label}</small><b>${val}</b></div>`));
  feats.appendChild(grid);
  box.appendChild(feats);
  box.appendChild(h('div', 're-sec', `<h4>Descripción</h4><p>${p.blurb || ''} Nave de bloque y chapa con ${p.doors > 1 ? 'dos portones enrollables' : 'portón enrollable'} a la zona de carga, oficina acristalada en altillo con escalera metálica y zona de descanso, y patio vallado para la furgoneta. Se entrega tal cual: con estanterías y maquinaria.</p>`));
  const bar = h('div', 're-bar');
  const mk = h('button', 'btn ghost', `${reIco('pin', 're-ico s')} Cómo llegar`);
  mk.onclick = () => reMark(id);
  bar.appendChild(mk);
  if (owned) bar.appendChild(h('div', 're-owned', `${reIco('check', 're-ico s')} Es tuya`));
  else {
    const short = clean < p.price;
    const buy = h('button', 'btn', short ? `Faltan ${money(p.price - clean)}` : `Comprar · ${money(p.price)}`);
    buy.disabled = short;
    buy.onclick = () => reBuy(id);
    bar.appendChild(buy);
  }
  box.appendChild(bar);
  screen.appendChild(box);
}

// ------------------------------------------------------------------
//  Personal: contratar, asignar, pagar y despedir
// ------------------------------------------------------------------
const STATUS_COLOR = { trabajando: '#2ecc71', descanso: '#95a5a6', material: '#f39c12', espacio: '#f39c12', sin_tarea: '#95a5a6', sin_pago: '#e74c3c', sin_propiedad: '#e74c3c' };
const propName = (id) => G.world.props[id]?.name || id;
const discretion = (l) => (l >= 0.65 ? 'alta' : l >= 0.45 ? 'media' : 'baja');
let staffConfirm = null;
function staffAct(r, okSfx = 'click') {
  if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); return; }
  sfx(okSfx);
  render();
}
function staff() {
  const s = G.state;
  const list = h('div', 'ph-list staff');
  const cost = dailyCost(), debt = totalDebt(), nx = nextPayday();
  const short = cost + debt > s.money;
  list.appendChild(h('div', 'ph-card', `<div class="rowsp"><b>Plantilla</b><span>${employees().length}/${maxStaff()}</span></div>${maxStaff() ? '' : `<div class="small">Sube a ${RANKS[1].name} para poder contratar.</div>`}
    <div class="rowsp"><b>Nómina diaria</b><span class="money">${money(cost)}</span></div>
    <div class="rowsp"><span>Próximo pago</span><span>${dayName(nx.day)} ${String(nx.hour).padStart(2, '0')}:00</span></div>
    ${debt ? `<div class="rowsp"><span>Deudas con tu personal</span><b class="neg">${money(debt)}</b></div>` : ''}
    ${employees().length && short ? `<div class="warn">⚠️ Con ${money(s.money)} no te llega para la próxima nómina (${money(cost + debt)}). Quien no cobre deja de trabajar; a los ${STAFF.quitAfterDays} días se va.</div>` : ''}
    <div class="small muted">Trabajan de ${STAFF.workFrom}:00 a ${STAFF.workTo}:00 con lo que haya en las estanterías y armarios de su propiedad, y dejan ahí lo que hacen.</div>`));
  // contratados
  for (const e of employees()) {
    const c = candidate(e.cid), role = ROLES[e.role];
    const card = h('div', 'ph-card emp');
    card.dataset.cid = e.cid;
    card.innerHTML = `<div class="rowsp"><b>${role.icon} ${c.name}</b><span class="chip" style="--c:${STATUS_COLOR[e.status] || '#95a5a6'}">${statusText(e)}</span></div>
      <div class="small muted">${role.name} · ${money(c.wage)}/día · ${propName(e.prop)} · Hecho: ${e.made || 0} uds.</div>
      ${e.reason ? `<div class="small">${e.reason}</div>` : ''}`;
    const props = ownedProps();
    if (props.length > 1) {
      const row = h('div', 'chips big');
      for (const id of props) {
        const b = h('button', 'chip' + (id === e.prop ? ' on' : ''), propName(id));
        b.onclick = () => { if (id !== e.prop) staffAct(assign(e.uid, id)); };
        row.appendChild(b);
      }
      card.appendChild(row);
    }
    if (e.role === 'envasado') {
      const row = h('div', 'chips big');
      for (const [m, { label }] of Object.entries(PACK_MODES)) {
        const b = h('button', 'chip' + (e.mode === m ? ' on' : ''), label);
        b.onclick = () => { setMode(e.uid, m); sfx('click'); render(); };
        row.appendChild(b);
      }
      card.appendChild(row);
    }
    const row = h('div', 'rowsp');
    if (e.debt) { const pay = h('button', 'btn sm', `Pagar deuda · ${money(e.debt)}`); pay.onclick = () => staffAct(payDebt(e.uid), 'cash'); row.appendChild(pay); }
    if (staffConfirm === e.uid) {
      const no = h('button', 'btn sm ghost', 'No'), yes = h('button', 'btn sm danger', 'Sí, despedir');
      no.onclick = () => { staffConfirm = null; render(); };
      yes.onclick = () => { staffConfirm = null; staffAct(fire(e.uid)); };
      row.append(h('span', 'small', e.debt ? `Se irá sin cobrar ${money(e.debt)} y podría hablar.` : '¿Despedir?'), no, yes);
    } else {
      const f = h('button', 'btn sm ghost', 'Despedir');
      f.onclick = () => { staffConfirm = e.uid; render(); };
      row.appendChild(f);
    }
    card.appendChild(row);
    list.appendChild(card);
  }
  // candidatos
  const free = CANDIDATES.filter((c) => !hired(c.id));
  if (free.length) list.appendChild(h('div', 'label', 'Buscan trabajo'));
  const props = ownedProps();
  for (const c of free) {
    const role = ROLES[c.role];
    const locked = (c.rank || 0) > s.rank;
    const card = h('div', 'ph-card cand' + (locked ? ' locked' : ''));
    card.dataset.cid = c.id;
    card.innerHTML = `<div class="rowsp"><b>${role.icon} ${c.name}</b><span class="small">${role.name}</span></div>
      <div class="small muted">${c.bio}</div><div class="small">${role.does}</div>
      <div class="rowsp small"><span>Contratar: <b class="money">${money(c.hire)}</b></span><span>Sueldo: <b class="money">${money(c.wage)}</b>/día</span><span>Discreción: ${discretion(c.loyalty)}</span></div>`;
    if (locked) card.appendChild(h('div', 'small', `🔒 Requiere rango ${RANKS[c.rank].name}`));
    else {
      const row = h('div', 'rowsp');
      let target = props.includes(s.home) ? s.home : props[0];
      if (props.length > 1) {
        const ch = h('div', 'chips big');
        const draw = () => { ch.innerHTML = ''; for (const id of props) { const b = h('button', 'chip' + (id === target ? ' on' : ''), propName(id)); b.onclick = () => { target = id; draw(); }; ch.appendChild(b); } };
        draw();
        card.appendChild(ch);
      }
      const b = h('button', 'btn sm' + (s.money < c.hire ? ' dim' : ''), `Contratar · ${money(c.hire)}`);
      b.onclick = () => staffAct(hire(c.id, target), 'cash');
      row.append(h('span', 'small muted', props.length > 1 ? '' : `Para: ${propName(target)}`), b);
      card.appendChild(row);
    }
    list.appendChild(card);
  }
  screen.appendChild(list);
}

function quests() {
  const list = h('div', 'ph-list');
  QUESTS.forEach((q, i) => {
    const st = i < G.state.quest ? 'done' : i === G.state.quest ? 'cur' : 'lock';
    list.appendChild(h('div', `ph-card quest ${st}`, `<b>${st === 'done' ? '✅' : st === 'cur' ? '👉' : '🔒'} ${q.title}</b>${st !== 'lock' ? `<div class="small muted">${q.desc}</div>` : ''}`));
  });
  screen.appendChild(list);
}

function stats() {
  const s = G.state;
  const r = RANKS[s.rank];
  const rt = repTier(s.rep || 0), next = REP_TIERS[rt + 1];
  const repTxt = next ? `${Math.round(s.rep || 0)}/${next.min} para «${next.name}»` : 'Máxima';
  screen.appendChild(h('div', 'ph-list', `<div class="ph-card"><div class="rowsp"><b>Reputación</b><span>${REP_TIERS[rt].name}</span></div>${meter('En Puerto Lomas', (s.rep || 0) / 100, repTxt, '#9b59b6')}
    <div class="small muted">Sube cerrando tratos, cumpliendo y regalando muestras. Baja si fallas un pedido o te detienen. Con más reputación, más vecinos aceptan tus muestras y te llegan más pedidos.</div></div>
    <div class="ph-card"><div class="rowsp"><b>Rango</b><span>${r.name}</span></div><div class="rowsp"><b>Experiencia</b><span>${s.xp} XP</span></div>
    <div class="rowsp"><b>Efectivo (sucio)</b><span class="money">${money(s.money)}</span></div><div class="rowsp"><b>Dinero limpio</b><span class="money">${money(s.clean || 0)}</span></div><div class="rowsp"><b>Ganado en total</b><span>${money(s.stats.earned)}</span></div>
    <div class="rowsp"><b>Tratos cerrados</b><span>${s.stats.deals}</span></div><div class="rowsp"><b>Mejor trato</b><span>${money(s.stats.best)}</span></div>
    <div class="rowsp"><b>Clientes</b><span>${PEOPLE.filter((p) => customer(p.id).unlocked).length}/${PEOPLE.length}</span></div>
    <div class="rowsp"><b>Productos</b><span>${Object.keys(s.products).length}</span></div><div class="rowsp"><b>Días en Puerto Lomas</b><span>${s.day}</span></div></div>`));
}

export function settingsPanel(container, onExit) {
  const s = G.state.settings;
  const box = h('div', 'ph-list');
  const slider = (label, min, max, step, val, fn) => {
    const r = h('div', 'ph-card', `<div class="rowsp"><b>${label}</b><span class="v">${val}</span></div>`);
    const i = h('input'); i.type = 'range'; i.min = min; i.max = max; i.step = step; i.value = val;
    i.oninput = () => { r.querySelector('.v').textContent = i.value; fn(parseFloat(i.value)); };
    r.appendChild(i);
    return r;
  };
  const choice = (label, opts, val, fn) => {
    const r = h('div', 'ph-card', `<b>${label}</b>`);
    const row = h('div', 'row');
    for (const [k, t] of opts) {
      const b = h('button', 'toggle' + (k === val ? ' on' : ''), t);
      b.onclick = () => { val = k; [...row.children].forEach((x) => x.classList.remove('on')); b.classList.add('on'); fn(k); };
      row.appendChild(b);
    }
    r.appendChild(row);
    return r;
  };
  const toggle = (label, val, fn) => {
    const r = h('div', 'ph-card rowsp', `<b>${label}</b>`);
    const t = h('button', 'toggle' + (val ? ' on' : ''), val ? 'Sí' : 'No');
    t.onclick = () => { val = !val; t.className = 'toggle' + (val ? ' on' : ''); t.textContent = val ? 'Sí' : 'No'; fn(val); };
    r.appendChild(t);
    return r;
  };
  box.append(
    slider('Sensibilidad de cámara', 0.3, 3, 0.1, s.sens, (v) => { s.sens = v; }),
    slider('Resolución', 0.5, 1, 0.05, s.res, (v) => { s.res = v; G.act.resize(); }),
    toggle('Ajuste automático (prioriza la fluidez)', s.autoQ !== false, (v) => { s.autoQ = v; s.autoStack = []; }),
    choice('Calidad gráfica', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], s.quality || 'alta', (v) => { s.autoQ = false; s.autoStack = []; G.act.quality(v); }),
    toggle('Sombras', s.shadows, (v) => { s.shadows = v; setShadows(v && s.quality !== 'baja'); }),
    choice('Distancia de dibujo', [['corta', 'Corta'], ['media', 'Media'], ['larga', 'Larga']], s.draw || 'larga', (v) => G.act.drawDistance(v)),
    choice('Tráfico', [['poco', 'Poco'], ['normal', 'Normal'], ['mucho', 'Mucho']], s.traffic || 'normal', (v) => G.act.traffic(v)),
    toggle('Sonido', s.sound, (v) => { s.sound = v; }),
  );
  const lay = h('button', 'btn ghost', '🎮 Editar controles');
  lay.onclick = () => {
    closePanel(true);
    if (phoneOpen()) closePhone();
    openLayoutEditor();
  };
  box.appendChild(lay);
  const sv = h('button', 'btn', '💾 Guardar partida');
  sv.onclick = () => { save(); G.act.toast('Partida guardada.', '💾'); };
  const del = h('button', 'btn danger', '🗑️ Borrar partida');
  del.onclick = () => confirmDialog('Borrar partida', 'Se perderá todo tu progreso. ¿Seguro?', 'Borrar', () => { wipe().then(() => location.reload()); });
  box.append(sv, del);
  if (onExit) { const ex = h('button', 'btn ghost', '🏠 Salir al menú'); ex.onclick = onExit; box.appendChild(ex); }
  container.appendChild(box);
}

function settings() { settingsPanel(screen); }
