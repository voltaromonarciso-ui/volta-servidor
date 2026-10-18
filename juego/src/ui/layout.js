import { G } from '../game.js';
import { save } from '../core/state.js';
import { input } from '../core/input.js';

// Disposición de los controles táctiles: tamaño automático para que nada se
// solape y un editor para que cada jugador coloque los botones a su gusto.
export const CONTROLS = [
  { id: 'joy', sel: '#joy', label: 'Joystick' },
  { id: 'crouch', sel: '#btn-crouch', label: 'Agacharse' },
  { id: 'run', sel: '#btn-run', label: 'Correr' },
  { id: 'jump', sel: '#btn-jump', label: 'Saltar' },
  { id: 'hotbar', sel: '#hotbar', label: 'Objetos' },
  { id: 'map', sel: '#tl', label: 'Mapa' },
  { id: 'menu', sel: '#tr .tr-btns', label: 'Móvil' },
];
const el = (c) => document.querySelector(c.sel);
const settings = () => G.state?.settings || {};

// --- aplicar la disposición guardada ---
export function applyLayout() {
  const s = settings();
  const lay = s.layout || {};
  const root = document.documentElement.style;
  root.setProperty('--ctl-op', String(s.ctlOpacity ?? 1));
  for (const c of CONTROLS) {
    const e = el(c);
    if (!e) continue;
    const p = lay[c.id];
    if (p) {
      e.style.position = c.id === 'menu' ? 'fixed' : '';
      e.style.left = (p.x * 100) + 'vw';
      e.style.top = (p.y * 100) + 'vh';
      e.style.right = 'auto';
      e.style.bottom = 'auto';
      e.style.transform = `translate(-50%, -50%) scale(${p.s || 1})`;
      e.classList.add('lay-custom');
    } else {
      for (const k of ['position', 'left', 'top', 'right', 'bottom', 'transform']) e.style[k] = '';
      e.classList.remove('lay-custom');
    }
  }
  fitHud();
}

// Ajusta el tamaño de las casillas para que la barra quepa entre el mapa y el dinero.
export function fitHud() {
  const hb = document.getElementById('hotbar');
  if (!hb) return;
  const n = hb.children.length || 10;
  const vw = window.innerWidth;
  let free = vw;
  if (!settings().layout?.hotbar && document.body.classList.contains('touch')) {
    const tl = document.getElementById('tl')?.getBoundingClientRect();
    const cash = document.getElementById('cash')?.getBoundingClientRect();
    const left = tl && tl.width ? tl.right : 0;
    const right = cash && cash.width ? vw - cash.left : 0;
    free = vw - 2 * Math.max(left, right) - 20;
  }
  const gap = free < 420 ? 3 : 4;
  const fit = (k) => Math.min(48, Math.floor((free - 10 - (k - 1) * gap) / k));
  // en táctil, si en una fila las casillas quedan por debajo de 44 pt, van en dos filas
  const two = document.body.classList.contains('touch') && !settings().layout?.hotbar && fit(n) < 44;
  const slot = Math.max(24, two ? fit(Math.ceil(n / 2)) : fit(n));
  hb.classList.toggle('rows2', two);
  const root = document.documentElement.style;
  root.setProperty('--slot', slot + 'px');
  root.setProperty('--hb-h', ((two ? 2 : 1) * slot + (two ? gap : 0) + 8) + 'px');
  hb.style.gap = gap + 'px';
}

// --- editor ---
let ed = null;
export function openLayoutEditor(onClose) {
  if (ed) return;
  const s = settings();
  s.layout = { ...(s.layout || {}) };
  const wasPaused = G.paused;
  G.paused = true;
  document.body.classList.add('lay-edit');
  document.getElementById('hud').classList.remove('hide');
  const root = document.createElement('div');
  root.id = 'lay-editor';
  root.innerHTML = `
    <div class="le-bar">
      <div class="le-t">Arrastra cada control a donde quieras</div>
      <div class="le-row"><span>Tamaño <b class="le-sel">—</b></span><input class="le-size" type="range" min="0.6" max="1.6" step="0.05" value="1"></div>
      <div class="le-row"><span>Opacidad</span><input class="le-op" type="range" min="0.25" max="1" step="0.05" value="${s.ctlOpacity ?? 1}"></div>
      <div class="le-btns"><button class="btn ghost sm le-reset">Restablecer</button><button class="btn sm le-ok">Listo</button></div>
    </div>`;
  document.body.appendChild(root);
  const handles = [];
  let selected = null;
  const sizeIn = root.querySelector('.le-size'), selLbl = root.querySelector('.le-sel');
  const place = () => {
    for (const hd of handles) {
      const r = el(hd.c)?.getBoundingClientRect();
      if (!r || !r.width) { hd.d.style.display = 'none'; continue; }
      Object.assign(hd.d.style, { display: '', left: r.left - 4 + 'px', top: r.top - 4 + 'px', width: r.width + 8 + 'px', height: r.height + 8 + 'px' });
    }
  };
  const select = (hd) => {
    selected = hd;
    handles.forEach((x) => x.d.classList.toggle('on', x === hd));
    selLbl.textContent = hd ? hd.c.label : '—';
    sizeIn.value = hd ? (s.layout[hd.c.id]?.s || 1) : 1;
  };
  // fija la posición actual (centro) de un control como personalizada
  const pin = (c) => {
    if (s.layout[c.id]) return s.layout[c.id];
    const r = el(c).getBoundingClientRect();
    s.layout[c.id] = { x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height / 2) / innerHeight, s: 1 };
    return s.layout[c.id];
  };
  for (const c of CONTROLS) {
    if (!el(c)) continue;
    const d = document.createElement('div');
    d.className = 'le-h';
    d.innerHTML = `<span>${c.label}</span>`;
    root.appendChild(d);
    const hd = { c, d };
    handles.push(hd);
    let drag = null;
    d.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      select(hd);
      const p = pin(c);
      drag = { id: e.pointerId, sx: e.clientX, sy: e.clientY, x: p.x, y: p.y };
      d.setPointerCapture(e.pointerId);
    });
    d.addEventListener('pointermove', (e) => {
      if (!drag || e.pointerId !== drag.id) return;
      const p = s.layout[c.id];
      p.x = Math.max(0.03, Math.min(0.97, drag.x + (e.clientX - drag.sx) / innerWidth));
      p.y = Math.max(0.05, Math.min(0.95, drag.y + (e.clientY - drag.sy) / innerHeight));
      applyLayout(); place();
    });
    const up = () => { drag = null; };
    d.addEventListener('pointerup', up);
    d.addEventListener('pointercancel', up);
  }
  sizeIn.oninput = () => {
    if (!selected) return;
    pin(selected.c).s = parseFloat(sizeIn.value);
    applyLayout(); place();
  };
  root.querySelector('.le-op').oninput = (e) => { s.ctlOpacity = parseFloat(e.target.value); applyLayout(); };
  root.querySelector('.le-reset').onclick = () => { s.layout = {}; s.ctlOpacity = 1; root.querySelector('.le-op').value = 1; applyLayout(); select(null); requestAnimationFrame(place); };
  root.querySelector('.le-ok').onclick = () => {
    root.remove();
    window.removeEventListener('resize', place);
    document.body.classList.remove('lay-edit');
    ed = null;
    G.paused = wasPaused;
    save();
    onClose?.();
  };
  window.addEventListener('resize', place);
  applyLayout();
  requestAnimationFrame(place);
  ed = root;
}

window.addEventListener('resize', () => fitHud());
// el joystick vuelve a su sitio personalizado al soltarlo
input.onJoyReset = () => applyLayout();
