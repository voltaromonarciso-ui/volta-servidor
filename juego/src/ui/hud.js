import { ii, icon as svgIcon } from './icons.js';
import { recognition, RECOG_LEVEL } from '../systems/appearance.js';
let knownT = 0;
import { G, on, emit, money } from '../game.js';
import { ITEMS, RANKS, STRAINS } from '../data/items.js';
import { QUESTS } from '../data/quests.js';
import { clock, dayName } from '../systems/time.js';
import { input } from '../core/input.js';
import { wanted, curfew } from '../systems/police.js';
import { CONTACTS, dealAt, hhmm, inCurfew } from '../systems/economy.js';
import { sfx } from '../core/audio.js';
import { ridingInfo } from '../systems/riding.js';
import { placingMode } from '../systems/objects.js';

const $ = (id) => document.getElementById(id);
let els = {};
let waypoint = null;
let mm, mctx, mmT = 0;

// Cambia un texto solo si es distinto (el HUD se refresca en cada fotograma).
// miles siempre con punto, también 1.000 (toLocaleString('es-ES') no agrupa 4 cifras)
const miles = (n) => (n < 0 ? '-' : '') + String(Math.abs(n)).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const txt = (el, v) => { v = String(v); if (el.textContent !== v) el.textContent = v; };

export function initHUD() {
  document.querySelector('#cash .cash-ic').innerHTML = svgIcon('cash');
  document.querySelector('#bank .cash-ic').innerHTML = svgIcon('card');
  els = {
    money: $('h-money'), clean: $('h-clean'), clock: $('h-clock'), day: $('h-day'), curfew: $('h-curfew'), next: $('h-next'),
    qTitle: $('q-title'), qDesc: $('q-desc'), quest: $('quest'),
    rankName: $('rank-name'), rankBar: $('rank-bar'), rankXp: $('rank-xp'),
    prompt: $('prompt'), info: $('info'),
    hotbar: $('hotbar'), toasts: $('toasts'), notify: $('notify'),
    wp: $('waypoint'), wpArrow: $('wp-arrow'), wpText: $('wp-text'),
    wanted: $('wanted'), wantedBar: $('wanted-bar'), phoneBadge: $('phone-badge'), water: $('h-water'),
    crouch: $('btn-crouch'), run: $('btn-run'),
    rideKmh: document.querySelector('#ride-kmh b'), rideBat: $('ride-bat'), rideBatI: document.querySelector('#ride-bat i'), rideBatT: document.querySelector('#ride-bat span'),
  };
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('div');
    d.className = 'slot';
    d.innerHTML = `<span class="k">${(i + 1) % 10}</span><span class="ic"></span><span class="q"></span>`;
    d.addEventListener('pointerdown', (e) => {
      e.stopPropagation();
      if (G.state.sel === i && G.touch) emit('btn', 'bag'); // tocar el objeto activo abre la mochila
      else emit('select', i);
    });
    els.hotbar.appendChild(d);
  }
  const btn = (id, fn) => $(id).addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); fn(e); });
  btn('btn-jump', () => { input.jump = true; });
  btn('btn-run', () => { input.sprintToggle = !input.sprintToggle; if (input.sprintToggle) input.crouch = false; });
  btn('btn-crouch', () => { input.crouch = !input.crouch; if (input.crouch) input.sprintToggle = false; });
  btn('btn-phone', () => emit('btn', 'phone'));
  btn('btn-dismount', () => emit('btn', 'dismount'));
  btn('btn-rotl', () => emit('btn', 'rot-left'));
  btn('btn-rotr', () => emit('btn', 'rot-right'));
  btn('btn-cancel', () => emit('btn', 'place-cancel'));
  btn('btn-store', () => emit('btn', 'place-store'));
  // frenar mientras se mantiene pulsado
  const br = $('btn-brake');
  br.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); br.setPointerCapture?.(e.pointerId); br.classList.add('on'); emit('btn', 'brake'); });
  for (const ev of ['pointerup', 'pointercancel', 'lostpointercapture']) br.addEventListener(ev, () => { br.classList.remove('on'); emit('btn', 'brake-off'); });
  btn('btn-pause', () => emit('btn', 'escape'));
  btn('minimap', () => G.act.openPhone('map'));
  // en móvil se interactúa tocando la etiqueta de acción (la principal o la secundaria)
  els.prompt.addEventListener('pointerdown', (e) => {
    e.stopPropagation();
    emit('btn', e.target.closest('.pp.sec') ? 'secondary' : 'primary');
  });
  els.quest.addEventListener('pointerdown', (e) => { e.stopPropagation(); els.quest.classList.toggle('open'); });
  on('select', (i) => { G.state.sel = i; sfx('click'); });
  on('money', (n) => floatMoney(n));
  mm = $('mm');
  mctx = mm.getContext('2d');
}

export function updateHUD(target, dt = 0.016) {
  const s = G.state;
  txt(els.money, miles(Math.round(s.money)));
  $('cash').classList.toggle('neg', s.money < 0);
  // dinero limpio = saldo del banco (tarjeta)
  txt(els.clean, miles(Math.floor(s.clean || 0)));
  txt(els.clock, clock(s.minute));
  txt(els.day, `${dayName(s.day).slice(0, 3)} · Día ${s.day}`);
  els.curfew.style.display = curfew() ? '' : 'none';
  // próxima entrega acordada (la más cercana en el tiempo)
  let nd = null;
  for (const d of s.deals) if (d.status === 'accepted' && (!nd || dealAt(d) < dealAt(nd))) nd = d;
  txt(els.next, nd ? `📦 ${hhmm(dealAt(nd))} ${CONTACTS[nd.npc]?.name.split(' ')[0] || ''}${inCurfew(dealAt(nd)) ? ' 🌙' : ''}` : '');
  const q = QUESTS[s.quest];
  txt(els.qTitle, q ? q.title : 'Expande tu negocio');
  txt(els.qDesc, q ? q.desc : 'Has completado la historia. ¡Sigue creciendo en Puerto Lomas!');
  const r = RANKS[s.rank], nx = RANKS[s.rank + 1];
  txt(els.rankName, r.name);
  txt(els.rankXp, nx ? `${s.xp - r.xp}/${nx.xp - r.xp}` : `${s.xp}`);
  els.rankBar.style.width = (nx ? ((s.xp - r.xp) / (nx.xp - r.xp)) * 100 : 100) + '%';
  const unread = Object.values(s.unread || {}).reduce((a, b) => a + b, 0);
  txt(els.phoneBadge, unread);
  els.phoneBadge.style.display = unread ? '' : 'none';
  els.crouch.classList.toggle('on', !!input.crouch);
  els.run.classList.toggle('on', !!input.sprintToggle);

  [...els.hotbar.children].forEach((d, i) => {
    const slot = s.inv[i];
    d.classList.toggle('sel', i === s.sel);
    d.classList.toggle('empty', !slot);
    d.classList.toggle('vacio', !!slot && slot.id === 'sobre_vacio');
    // solo se toca el DOM cuando cambia algo (esto corre en cada fotograma)
    const id = slot ? slot.id : '';
    if (d.dataset.id !== id) { d.dataset.id = id; d.querySelector('.ic').innerHTML = id ? ii(id) : ''; }
    const q = slot && ITEMS[slot.id].stack > 1 ? String(slot.q) : '';
    if (d.dataset.q !== q) { d.dataset.q = q; d.querySelector('.q').textContent = q; }
  });
  const held = s.inv[s.sel];
  els.water.style.display = held && held.id === 'regadera' ? '' : 'none';
  txt(els.water, `💧 ${s.water}/6`);

  const prim = target.actions.find((a) => !a.secondary);
  const sec = target.actions.find((a) => a.secondary);
  let html = '';
  if (prim) html += `<div class="pp">${G.touch ? '' : '<kbd>E</kbd>'}${prim.label}</div>`;
  if (sec) html += `<div class="pp sec">${G.touch ? '' : '<kbd>R</kbd>'}${sec.label}</div>`;
  if (html !== els.prompt._h) { els.prompt.innerHTML = html; els.prompt._h = html; }
  const info = target.info || (held ? itemLabel(held) : '');
  if (els.info.textContent !== info) els.info.textContent = info;
  els.info.classList.toggle('show', !!info);
  document.body.classList.toggle('aiming', !!prim);

  if (waypoint) {
    const p = G.player.pos;
    const dx = waypoint.x - p.x, dz = waypoint.z - p.z, d = Math.hypot(dx, dz);
    if (d < 4) clearWaypoint();
    else {
      const ang = Math.atan2(-dx, -dz) - G.player.yaw;
      els.wp.style.display = '';
      els.wpArrow.style.transform = `rotate(${-ang}rad)`;
      txt(els.wpText, `${waypoint.label} · ${Math.round(d)} m`);
    }
  } else els.wp.style.display = 'none';

  // colocando o moviendo un objeto: botones grandes de girar / cancelar / guardar
  const pm = placingMode();
  document.body.classList.toggle('placing', !!pm);
  document.body.classList.toggle('moving', pm === 'move');

  // velocímetro y batería al ir en vehículo
  const ri = ridingInfo();
  if (ri) {
    txt(els.rideKmh, String(ri.kmh));
    els.rideBat.style.display = ri.battery == null ? 'none' : '';
    if (ri.battery != null) {
      const pc = Math.round(ri.battery * 100);
      txt(els.rideBatT, pc ? `${pc}%` : 'Sin batería');
      els.rideBatI.style.width = pc + '%';
      els.rideBat.classList.toggle('low', pc <= 20);
    }
  }

  // aviso de que la policía te reconoce (se refresca dos veces por segundo)
  knownT -= dt;
  if (knownT <= 0) {
    knownT = 0.5;
    const r = wanted.level > 0 ? 0 : recognition();
    const k = $('known');
    k.style.display = r >= 0.3 ? '' : 'none';
    if (r >= 0.3) txt(k, `👁 ${r >= RECOG_LEVEL ? 'La policía te tiene fichado' : 'Te pareces al sospechoso'} · ${Math.round(r * 100)}%`);
  }
  if (wanted.level > 0) {
    els.wanted.style.display = '';
    els.wantedBar.style.width = (100 - (wanted.unseen / wanted.escape) * 100) + '%';
  } else els.wanted.style.display = 'none';

  mmT -= dt;
  if (mmT <= 0) { mmT = 0.1; drawMinimap(); }
}

// ------------------------------------------------------------------
//  Minimapa circular (gira con el jugador)
// ------------------------------------------------------------------
function drawMinimap() {
  const size = mm.clientWidth * 2 || 300;
  if (mm.width !== size) { mm.width = mm.height = size; }
  const g = mctx, S = size, c = S / 2;
  const scale = S / 110;
  const p = G.player.pos;
  g.setTransform(1, 0, 0, 1, 0, 0);
  g.clearRect(0, 0, S, S);
  g.save();
  g.beginPath(); g.arc(c, c, c - 2, 0, Math.PI * 2); g.clip();
  g.fillStyle = '#26303a'; g.fillRect(0, 0, S, S);
  g.translate(c, c);
  g.rotate(G.player.yaw);
  g.scale(scale, scale);
  g.translate(-p.x, -p.z);
  // agua
  g.fillStyle = '#1f4b66'; g.fillRect(-300, 105, 600, 400);
  for (const r of G.world.mapRects) {
    if (r.road) continue;
    g.fillStyle = r.c === '#79ad58' ? '#33473a' : r.c === '#e6d39c' ? '#6d6550' : '#1b2229';
    g.fillRect(r.x0, r.z0, r.x1 - r.x0, r.z1 - r.z0);
  }
  g.fillStyle = '#5c6874';
  for (const r of G.world.mapRects) if (r.road) g.fillRect(r.x0, r.z0, r.x1 - r.x0, r.z1 - r.z0);
  g.restore();

  // iconos (sin rotar el propio icono)
  const toScreen = (x, z) => {
    const dx = x - p.x, dz = z - p.z, cy = Math.cos(G.player.yaw), sy = Math.sin(G.player.yaw);
    let sx = (dx * cy - dz * sy) * scale, sz = (dx * sy + dz * cy) * scale;
    const d = Math.hypot(sx, sz), max = c - S * 0.08;
    const clamped = d > max;
    if (clamped) { sx *= max / d; sz *= max / d; }
    return [c + sx, c + sz, clamped];
  };
  const icon = (x, z, bg, glyph, always = true) => {
    const [sx, sz, cl] = toScreen(x, z);
    if (cl && !always) return;
    const r = S * 0.055;
    g.fillStyle = bg; g.beginPath(); g.arc(sx, sz, r, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(255,255,255,0.9)'; g.lineWidth = S * 0.008; g.stroke();
    g.fillStyle = '#fff'; g.font = `bold ${Math.round(r * 1.25)}px sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(glyph, sx, sz + r * 0.06);
  };
  const W = G.world;
  const P = W.pois, at = (p, ...a) => { if (p) icon(p.x, p.z, ...a); }; // un sitio que no exista no rompe el minimapa
  if (G.state.props.piso) at(P.piso, '#2b3540', '⌂');
  if (G.state.props.nave) at(P.nave, '#2b3540', '⌂');
  if (G.state.props.bungalow) at(P.bungalow, '#2e7d4f', '⌂');
  at(P.ferreteria, '#b0302a', '⚒', false);
  at(P.gasolinera, '#2e86de', '⛽', false);
  if (G.state.orders.length) at(P.deadDrop, '#c77d2a', '▣');
  for (const a of W.atms || []) icon(a.x, a.z, '#1e6fd9', '$', false); // cajeros (solo los que caen dentro)
  for (const d of G.state.deals) {
    if (d.status !== 'accepted') continue;
    const spot = W.spots.find((x) => x.id === d.spot);
    icon(spot.x, spot.z, '#27ae60', '$');
  }
  if (waypoint) icon(waypoint.x, waypoint.z, '#d4a017', '★');
  for (const cop of G.police) {
    const [sx, sz, cl] = toScreen(cop.pos.x, cop.pos.z);
    if (cl) continue;
    g.fillStyle = wanted.level ? '#ff3b30' : '#e05a50';
    g.beginPath(); g.arc(sx, sz, S * 0.022, 0, Math.PI * 2); g.fill();
  }
  // flecha del jugador
  g.save();
  g.translate(c, c);
  const a = S * 0.06;
  g.fillStyle = '#ffffff'; g.strokeStyle = 'rgba(0,0,0,0.5)'; g.lineWidth = S * 0.01;
  g.beginPath(); g.moveTo(0, -a); g.lineTo(a * 0.75, a * 0.8); g.lineTo(0, a * 0.35); g.lineTo(-a * 0.75, a * 0.8); g.closePath();
  g.fill(); g.stroke();
  g.restore();
  // norte
  const nEl = document.querySelector('.mm-n');
  const R_ = mm.clientWidth / 2 - 10;
  if (nEl) nEl.style.transform = `translate(${-Math.sin(G.player.yaw) * R_}px, ${Math.cos(G.player.yaw) * R_}px)`;
}

export function itemLabel(slot) {
  const it = ITEMS[slot.id];
  if (slot.p && G.state.products[slot.p]) {
    const pn = G.state.products[slot.p].name;
    if (pn === it.name) return it.name;
    return `${it.name.replace(/ de Lumaflor$/, '')} de ${pn}`;
  }
  const sn = slot.p ? (STRAINS[slot.p] ? STRAINS[slot.p].name : slot.p) : '';
  if (slot.id === 'semilla' && slot.p) return `Sobre de ${sn} (${slot.q}/${it.stack} semillas)`;
  if (slot.id === 'sobre_vacio') return sn ? `Sobre de ${sn} vacío` : it.name;
  return it.name;
}

export function setWaypoint(x, z, label) { waypoint = { x, z, label }; }
export function clearWaypoint() { waypoint = null; }
export function getWaypoint() { return waypoint; }

export function toast(text, icon = 'ℹ️') {
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = `<span class="ti">${icon}</span><span>${text}</span>`;
  els.toasts.appendChild(d);
  while (els.toasts.children.length > 3) els.toasts.firstChild.remove();
  setTimeout(() => d.classList.add('out'), 3800);
  setTimeout(() => d.remove(), 4300);
}

export function bigToast(title, sub) {
  const d = document.createElement('div');
  d.className = 'bigtoast';
  d.innerHTML = `<div class="bt-t">${title}</div><div class="bt-s">${sub || ''}</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add('out'), 3800);
  setTimeout(() => d.remove(), 4400);
}

let notifyT;
export function notify(from, text) {
  const c = CONTACTS[from] || { name: from, icon: '💬' };
  const first = c.name.split(' (')[0];
  els.notify.innerHTML = `<div class="n-ic">${c.icon}</div><div class="n-l">Mensaje de <b>${first}</b></div>`;
  els.notify.classList.add('show');
  els.notify.onclick = () => { els.notify.classList.remove('show'); G.act.openPhone('chat', from); };
  clearTimeout(notifyT);
  notifyT = setTimeout(() => els.notify.classList.remove('show'), 2600);
}

function floatMoney(n) {
  const d = document.createElement('div');
  d.className = 'floatmoney ' + (n >= 0 ? 'pos' : 'neg');
  d.textContent = (n >= 0 ? '+' : '−') + money(Math.abs(n));
  $('tr').appendChild(d);
  setTimeout(() => d.remove(), 1600);
}
