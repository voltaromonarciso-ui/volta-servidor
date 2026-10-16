import { G, on, emit, money } from '../game.js';
import { ITEMS, RANKS, STRAINS } from '../data/items.js';
import { QUESTS } from '../data/quests.js';
import { clock, dayName } from '../systems/time.js';
import { input } from '../core/input.js';
import { wanted, curfew } from '../systems/police.js';
import { CONTACTS } from '../systems/economy.js';
import { sfx } from '../core/audio.js';

const $ = (id) => document.getElementById(id);
let els = {};
let waypoint = null;
let mm, mctx, mmT = 0;

export function initHUD() {
  els = {
    money: $('h-money'), clock: $('h-clock'), day: $('h-day'), curfew: $('h-curfew'),
    qTitle: $('q-title'), qDesc: $('q-desc'), quest: $('quest'),
    rankName: $('rank-name'), rankBar: $('rank-bar'), rankXp: $('rank-xp'),
    prompt: $('prompt'), info: $('info'), use: $('btn-use'), alt: $('btn-alt'), altLabel: $('alt-label'),
    hotbar: $('hotbar'), toasts: $('toasts'), notify: $('notify'),
    wp: $('waypoint'), wpArrow: $('wp-arrow'), wpText: $('wp-text'),
    wanted: $('wanted'), wantedBar: $('wanted-bar'), phoneBadge: $('phone-badge'), water: $('h-water'),
    crouch: $('btn-crouch'), run: $('btn-run'),
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
  btn('btn-use', () => emit('btn', 'primary'));
  btn('btn-alt', () => emit('btn', 'secondary'));
  btn('btn-jump', () => { input.jump = true; });
  btn('btn-run', () => { input.sprintToggle = !input.sprintToggle; if (input.sprintToggle) input.crouch = false; });
  btn('btn-crouch', () => { input.crouch = !input.crouch; if (input.crouch) input.sprintToggle = false; });
  btn('btn-phone', () => emit('btn', 'phone'));
  btn('btn-pause', () => emit('btn', 'escape'));
  btn('btn-bag', () => emit('btn', 'bag'));
  btn('minimap', () => G.act.openPhone('map'));
  // en móvil, tocar la etiqueta de acción también la ejecuta
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
  els.money.textContent = Math.round(s.money).toLocaleString('es-ES');
  $('cash').classList.toggle('neg', s.money < 0);
  els.clock.textContent = clock(s.minute);
  els.day.textContent = `${dayName(s.day).slice(0, 3)} · Día ${s.day}`;
  els.curfew.style.display = curfew() ? '' : 'none';
  const q = QUESTS[s.quest];
  els.qTitle.textContent = q ? q.title : 'Expande tu negocio';
  els.qDesc.textContent = q ? q.desc : 'Has completado la historia. ¡Sigue creciendo en Puerto Lomas!';
  const r = RANKS[s.rank], nx = RANKS[s.rank + 1];
  els.rankName.textContent = r.name;
  els.rankXp.textContent = nx ? `${s.xp - r.xp}/${nx.xp - r.xp}` : `${s.xp}`;
  els.rankBar.style.width = (nx ? ((s.xp - r.xp) / (nx.xp - r.xp)) * 100 : 100) + '%';
  const unread = Object.values(s.unread || {}).reduce((a, b) => a + b, 0);
  els.phoneBadge.textContent = unread;
  els.phoneBadge.style.display = unread ? '' : 'none';
  els.crouch.classList.toggle('on', !!input.crouch);
  els.run.classList.toggle('on', !!input.sprintToggle);

  [...els.hotbar.children].forEach((d, i) => {
    const slot = s.inv[i];
    d.classList.toggle('sel', i === s.sel);
    d.classList.toggle('empty', !slot);
    d.querySelector('.ic').textContent = slot ? ITEMS[slot.id].icon : '';
    d.querySelector('.q').textContent = slot && ITEMS[slot.id].stack > 1 ? slot.q : '';
  });
  const held = s.inv[s.sel];
  els.water.style.display = held && held.id === 'regadera' ? '' : 'none';
  els.water.textContent = `💧 ${s.water}/6`;

  const prim = target.actions.find((a) => !a.secondary);
  const sec = target.actions.find((a) => a.secondary);
  let html = '';
  if (prim) html += `<div class="pp">${G.touch ? '' : '<kbd>E</kbd>'}${prim.label}</div>`;
  if (sec) html += `<div class="pp sec">${G.touch ? '' : '<kbd>R</kbd>'}${sec.label}</div>`;
  if (html !== els.prompt._h) { els.prompt.innerHTML = html; els.prompt._h = html; }
  const info = target.info || (held ? itemLabel(held) : '');
  if (els.info.textContent !== info) els.info.textContent = info;
  els.info.classList.toggle('show', !!info);
  els.use.classList.toggle('active', !!prim);
  els.alt.style.display = sec ? '' : 'none';
  els.altLabel.textContent = sec ? sec.label : '';
  document.body.classList.toggle('aiming', !!prim);

  if (waypoint) {
    const p = G.player.pos;
    const dx = waypoint.x - p.x, dz = waypoint.z - p.z, d = Math.hypot(dx, dz);
    if (d < 4) clearWaypoint();
    else {
      const ang = Math.atan2(-dx, -dz) - G.player.yaw;
      els.wp.style.display = '';
      els.wpArrow.style.transform = `rotate(${-ang}rad)`;
      els.wpText.textContent = `${waypoint.label} · ${Math.round(d)} m`;
    }
  } else els.wp.style.display = 'none';

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
  icon(W.pois.nave.x, W.pois.nave.z, '#2b3540', '⌂');
  if (G.state.props.bungalow) icon(W.pois.bungalow.x, W.pois.bungalow.z, '#2e7d4f', '⌂');
  icon(W.pois.ferreteria.x, W.pois.ferreteria.z, '#b0302a', '⚒', false);
  icon(W.pois.gasolinera.x, W.pois.gasolinera.z, '#2e86de', '⛽', false);
  if (G.state.orders.length) icon(W.pois.deadDrop.x, W.pois.deadDrop.z, '#c77d2a', '▣');
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
  if (slot.p && G.state.products[slot.p]) return `${it.name} de ${G.state.products[slot.p].name}`;
  if (slot.id === 'semilla' && slot.p) return `Semilla de ${STRAINS[slot.p] ? STRAINS[slot.p].name : slot.p}`;
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
  els.notify.innerHTML = `<div class="n-ic">${c.icon}</div><div><b>${c.name}</b><div class="n-t">${text}</div></div>`;
  els.notify.classList.add('show');
  els.notify.onclick = () => { els.notify.classList.remove('show'); G.act.openPhone('chat', from); };
  clearTimeout(notifyT);
  notifyT = setTimeout(() => els.notify.classList.remove('show'), 5000);
}

function floatMoney(n) {
  const d = document.createElement('div');
  d.className = 'floatmoney ' + (n >= 0 ? 'pos' : 'neg');
  d.textContent = (n >= 0 ? '+' : '−') + money(Math.abs(n));
  $('tr').appendChild(d);
  setTimeout(() => d.remove(), 1600);
}
