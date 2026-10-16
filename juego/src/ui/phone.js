import { G, on, money } from '../game.js';
import { STRAINS, RANKS } from '../data/items.js';
import { PEOPLE } from '../data/people.js';
import { QUESTS } from '../data/quests.js';
import { CONTACTS, customer, product, prodValue, acceptDeal, rejectDeal, counterDeal, orderSeeds } from '../systems/economy.js';
import { clock, dayName } from '../systems/time.js';
import { save, wipe } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { resetTouch } from '../core/input.js';
import { chips, confirmDialog } from './panels.js';
import { setWaypoint, clearWaypoint, getWaypoint } from './hud.js';
import { setShadows } from '../world/sky.js';

const APPS = [
  { id: 'msgs', name: 'Mensajes', icon: '💬', color: '#27ae60' },
  { id: 'clients', name: 'Clientes', icon: '👥', color: '#2980b9' },
  { id: 'products', name: 'Productos', icon: '🏷️', color: '#8e44ad' },
  { id: 'map', name: 'Mapa', icon: '🗺️', color: '#16a085' },
  { id: 'supplier', name: 'Proveedor', icon: '🌱', color: '#2e7d32' },
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
  view = { app, arg };
  render();
}

function back() {
  if (view.app === 'chat') go('msgs');
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
  ({ msgs, chat, clients, products, map, supplier, quests, stats, settings }[view.app] || home)();
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
        const info = h('div', 'deal-card', `<div><b>${d.qty}× ${prod ? prod.name : '?'}</b> · <span class="money">${money(d.price)}</span></div>`);
        if (d.status === 'offer') {
          const row = h('div', 'row');
          const ok = h('button', 'btn sm', 'Aceptar');
          ok.onclick = () => { acceptDeal(d); render(); };
          const ct = h('button', 'btn sm ghost', '+20%');
          ct.onclick = () => { counterDeal(d); render(); };
          const no = h('button', 'btn sm danger', 'Rechazar');
          no.onclick = () => { rejectDeal(d); render(); };
          row.append(ok, ct, no);
          info.appendChild(row);
        } else {
          const lab = { accepted: '🟢 Aceptado · ve al punto de encuentro', done: '✅ Completado', failed: '❌ Fallido', rejected: '🚫 Rechazado', expired: '⌛ Caducado' }[d.status];
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

function clients() {
  const list = h('div', 'ph-list');
  const known = PEOPLE.filter((p) => customer(p.id).unlocked);
  for (const p of known) {
    const c = customer(p.id);
    const row = h('div', 'ph-card', `<div class="rowsp"><b>${p.name}</b><small>${c.deals} tratos</small></div>
      <div class="meter"><span>Confianza</span><i style="width:${c.affinity}%"></i></div>
      <div class="meter add"><span>Enganche</span><i style="width:${Math.round(c.addiction * 100)}%"></i></div>
      <div class="small muted">Le gusta:</div><div class="chips">${chips(p.prefs)}</div>
      <div class="small muted">Presupuesto: ${money(p.budget[0])}–${money(p.budget[1])} · Exigencia: ${'★'.repeat(p.std + 1)}</div>`);
    list.appendChild(row);
  }
  const locked = PEOPLE.length - known.length;
  list.appendChild(h('div', 'muted center small', locked ? `Hay ${locked} vecinos más en Puerto Lomas. Regálales una muestra para hacerlos clientes.` : '¡Todo el pueblo es cliente tuyo!'));
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
    const price = h('div', 'qty');
    const minus = h('button', 'qb', '−'), plus = h('button', 'qb', '+'), val = h('span', 'qv', money(p.price));
    const ratio = () => { const r = p.price / v; val.className = 'qv ' + (r > 1.25 ? 'bad' : r < 0.9 ? 'cheap' : ''); };
    minus.onclick = () => { p.price = Math.max(1, p.price - Math.max(1, Math.round(v * 0.05))); val.textContent = money(p.price); ratio(); sfx('click'); };
    plus.onclick = () => { p.price += Math.max(1, Math.round(v * 0.05)); val.textContent = money(p.price); ratio(); sfx('click'); };
    ratio();
    price.append(minus, val, plus);
    const tog = h('button', 'toggle' + (p.listed ? ' on' : ''), p.listed ? 'A la venta' : 'Oculto');
    tog.onclick = () => { p.listed = !p.listed; render(); };
    row.append(price, tog);
    card.appendChild(row);
    card.querySelector('.pname').onclick = () => {
      const n = prompt('Nuevo nombre del producto:', p.name);
      if (n && n.trim()) { p.name = n.trim().slice(0, 22); render(); }
    };
    list.appendChild(card);
  }
  list.appendChild(h('div', 'muted small center', 'Los clientes rechazan precios muy por encima del valor de mercado (sube su tolerancia con la confianza).'));
  screen.appendChild(list);
}

// ------------------------------------------------------------------
let mapCanvas = null;
const MB = { x0: -118, x1: 118, z0: -118, z1: 132 };
function map() {
  const wrap = h('div', 'ph-map');
  mapCanvas = document.createElement('canvas');
  wrap.appendChild(mapCanvas);
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
  g.fillStyle = '#6aa84f'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#2f8fb3'; g.fillRect(0, 0, W, Y(105));
  for (const r of G.world.mapRects) {
    g.fillStyle = r.c;
    g.fillRect(X(r.x0), Y(r.z1), (r.x1 - r.x0) * sx, (r.z1 - r.z0) * sz);
  }
  g.font = `bold ${Math.round(W / 34)}px sans-serif`;
  g.textAlign = 'center';
  for (const l of G.world.mapLabels) {
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillText(l.t, X(l.x) + 1, Y(l.z) + 1);
    g.fillStyle = '#fff'; g.fillText(l.t, X(l.x), Y(l.z));
  }
  const dot = (x, z, color, r = W / 70, txt) => {
    g.fillStyle = color; g.beginPath(); g.arc(X(x), Y(z), r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 3; g.stroke();
    if (txt) { g.fillStyle = '#fff'; g.font = `bold ${Math.round(r * 1.2)}px sans-serif`; g.fillText(txt, X(x), Y(z) + r * 0.45); }
  };
  for (const d of G.state.deals.filter((x) => x.status === 'accepted')) {
    const s = G.world.spots.find((x) => x.id === d.spot);
    dot(s.x, s.z, '#27ae60', W / 50, '$');
  }
  if (G.state.orders.length) dot(G.world.pois.deadDrop.x, G.world.pois.deadDrop.z, '#e67e22', W / 55, '📦');
  const wp = getWaypoint();
  if (wp) dot(wp.x, wp.z, '#f1c40f', W / 70, '★');
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
  for (const [id, st] of Object.entries(STRAINS)) {
    const locked = st.rank > G.state.rank;
    const card = h('div', 'ph-card' + (locked ? ' locked' : ''));
    card.innerHTML = `<div class="rowsp"><b>🌰 ${st.name}</b><span class="money">${money(st.seed)}</span></div><div class="chips">${chips([st.effect])}</div>
      <div class="small muted">Precio base del producto: ${money(st.base)} · Cosecha ${st.yield[0]}–${st.yield[1]} cogollos</div>`;
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
  screen.appendChild(h('div', 'ph-list', `<div class="ph-card"><div class="rowsp"><b>Rango</b><span>${r.name}</span></div><div class="rowsp"><b>Experiencia</b><span>${s.xp} XP</span></div>
    <div class="rowsp"><b>Efectivo</b><span class="money">${money(s.money)}</span></div><div class="rowsp"><b>Ganado en total</b><span>${money(s.stats.earned)}</span></div>
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
    choice('Calidad gráfica', [['alta', 'Alta'], ['media', 'Media'], ['baja', 'Baja']], s.quality || 'alta', (v) => G.act.quality(v)),
    toggle('Sombras', s.shadows, (v) => { s.shadows = v; setShadows(v && s.quality !== 'baja'); }),
    toggle('Sonido', s.sound, (v) => { s.sound = v; }),
  );
  const sv = h('button', 'btn', '💾 Guardar partida');
  sv.onclick = () => { save(); G.act.toast('Partida guardada.', '💾'); };
  const del = h('button', 'btn danger', '🗑️ Borrar partida');
  del.onclick = () => confirmDialog('Borrar partida', 'Se perderá todo tu progreso. ¿Seguro?', 'Borrar', () => { wipe(); location.reload(); });
  box.append(sv, del);
  if (onExit) { const ex = h('button', 'btn ghost', '🏠 Salir al menú'); ex.onclick = onExit; box.appendChild(ex); }
  container.appendChild(box);
}

function settings() { settingsPanel(screen); }
