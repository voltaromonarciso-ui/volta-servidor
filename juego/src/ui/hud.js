import { G, on, emit, money } from '../game.js';
import { ITEMS, RANKS } from '../data/items.js';
import { QUESTS } from '../data/quests.js';
import { clock, dayName } from '../systems/time.js';
import { input } from '../core/input.js';
import { wanted, curfew } from '../systems/police.js';
import { CONTACTS } from '../systems/economy.js';
import { sfx } from '../core/audio.js';

const $ = (id) => document.getElementById(id);
let els = {};
let waypoint = null;

export function initHUD() {
  els = {
    money: $('h-money'), clock: $('h-clock'), day: $('h-day'), curfew: $('h-curfew'),
    qTitle: $('q-title'), qDesc: $('q-desc'), quest: $('quest'),
    rankName: $('rank-name'), rankBar: $('rank-bar'), rankXp: $('rank-xp'),
    prompt: $('prompt'), info: $('info'), use: $('btn-use'), alt: $('btn-alt'),
    hotbar: $('hotbar'), toasts: $('toasts'), notify: $('notify'),
    wp: $('waypoint'), wpArrow: $('wp-arrow'), wpText: $('wp-text'),
    wanted: $('wanted'), wantedBar: $('wanted-bar'), phoneBadge: $('phone-badge'), water: $('h-water'),
  };
  // hotbar
  for (let i = 0; i < 10; i++) {
    const d = document.createElement('div');
    d.className = 'slot';
    d.innerHTML = `<span class="k">${(i + 1) % 10}</span><span class="ic"></span><span class="q"></span>`;
    d.addEventListener('pointerdown', (e) => { e.stopPropagation(); emit('select', i); });
    els.hotbar.appendChild(d);
  }
  const btn = (id, ev, fn) => $(id).addEventListener(ev, (e) => { e.preventDefault(); e.stopPropagation(); fn(e); });
  btn('btn-use', 'pointerdown', () => emit('btn', 'primary'));
  btn('btn-alt', 'pointerdown', () => emit('btn', 'secondary'));
  btn('btn-jump', 'pointerdown', () => { input.jump = true; });
  btn('btn-run', 'pointerdown', () => { input.sprintToggle = !input.sprintToggle; $('btn-run').classList.toggle('on', input.sprintToggle); });
  btn('btn-phone', 'pointerdown', () => emit('btn', 'phone'));
  btn('btn-pause', 'pointerdown', () => emit('btn', 'escape'));
  btn('btn-bag', 'pointerdown', () => emit('btn', 'bag'));
  els.quest.addEventListener('pointerdown', (e) => { e.stopPropagation(); els.quest.classList.toggle('min'); });
  on('select', (i) => { G.state.sel = i; sfx('click'); });
  on('money', (n) => floatMoney(n));
}

export function updateHUD(target) {
  const s = G.state;
  els.money.textContent = money(s.money);
  els.money.classList.toggle('neg', s.money < 0);
  els.clock.textContent = clock(s.minute);
  els.day.textContent = `${dayName(s.day)} · Día ${s.day}`;
  els.curfew.style.display = curfew() ? '' : 'none';
  const q = QUESTS[s.quest];
  els.qTitle.textContent = q ? q.title : '¡Objetivos completados!';
  els.qDesc.textContent = q ? q.desc : 'Sigue haciendo crecer tu negocio en Puerto Lomas.';
  const r = RANKS[s.rank], nx = RANKS[s.rank + 1];
  els.rankName.textContent = r.name;
  els.rankXp.textContent = nx ? `${s.xp - r.xp} / ${nx.xp - r.xp} XP` : `${s.xp} XP`;
  els.rankBar.style.width = (nx ? ((s.xp - r.xp) / (nx.xp - r.xp)) * 100 : 100) + '%';
  const unread = Object.values(s.unread || {}).reduce((a, b) => a + b, 0);
  els.phoneBadge.textContent = unread;
  els.phoneBadge.style.display = unread ? '' : 'none';

  // hotbar
  [...els.hotbar.children].forEach((d, i) => {
    const slot = s.inv[i];
    d.classList.toggle('sel', i === s.sel);
    d.querySelector('.ic').textContent = slot ? ITEMS[slot.id].icon : '';
    d.querySelector('.q').textContent = slot && (slot.q > 1 || ITEMS[slot.id].stack > 1) ? slot.q : '';
    d.title = slot ? itemLabel(slot) : '';
  });
  const held = s.inv[s.sel];
  els.water.style.display = held && held.id === 'regadera' ? '' : 'none';
  els.water.textContent = `💧 ${s.water}/6`;

  // acciones
  const prim = target.actions.find((a) => !a.secondary);
  const sec = target.actions.find((a) => a.secondary);
  els.prompt.innerHTML = '';
  if (!G.touch) {
    if (prim) els.prompt.innerHTML += `<div><kbd>E</kbd> ${prim.label}</div>`;
    if (sec) els.prompt.innerHTML += `<div><kbd>R</kbd> ${sec.label}</div>`;
  }
  els.info.textContent = target.info || (held ? itemLabel(held) : '');
  els.info.classList.toggle('show', !!(target.info || held));
  els.use.textContent = prim ? prim.label : 'Usar';
  els.use.classList.toggle('active', !!prim);
  els.alt.textContent = sec ? sec.label : '';
  els.alt.style.display = sec ? '' : 'none';
  document.body.classList.toggle('aiming', !!prim);

  // punto de ruta
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

  // policía
  if (wanted.level > 0) {
    els.wanted.style.display = '';
    els.wantedBar.style.width = (100 - (wanted.unseen / wanted.escape) * 100) + '%';
  } else els.wanted.style.display = 'none';
}

export function itemLabel(slot) {
  const it = ITEMS[slot.id];
  if (slot.p && G.state.products[slot.p]) return `${it.name} de ${G.state.products[slot.p].name}`;
  if (slot.id === 'semilla' && slot.p) return `Semilla de ${slotStrainName(slot.p)}`;
  return it.name;
}
import { STRAINS } from '../data/items.js';
const slotStrainName = (p) => (STRAINS[p] ? STRAINS[p].name : p);

export function setWaypoint(x, z, label) { waypoint = { x, z, label }; }
export function clearWaypoint() { waypoint = null; }
export function getWaypoint() { return waypoint; }

export function toast(text, icon = 'ℹ️') {
  const d = document.createElement('div');
  d.className = 'toast';
  d.innerHTML = `<span class="ti">${icon}</span><span>${text}</span>`;
  els.toasts.appendChild(d);
  while (els.toasts.children.length > 4) els.toasts.firstChild.remove();
  setTimeout(() => d.classList.add('out'), 3800);
  setTimeout(() => d.remove(), 4300);
}

export function bigToast(title, sub) {
  const d = document.createElement('div');
  d.className = 'bigtoast';
  d.innerHTML = `<div class="bt-t">${title}</div><div class="bt-s">${sub || ''}</div>`;
  document.body.appendChild(d);
  setTimeout(() => d.classList.add('out'), 4200);
  setTimeout(() => d.remove(), 4800);
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
  $('stats').appendChild(d);
  setTimeout(() => d.remove(), 1600);
}
