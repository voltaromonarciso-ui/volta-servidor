// Mapa a pantalla completa: de fondo, una foto aérea de la propia isla (se hace una vez, con
// luz de mediodía y un poco inclinada para que se vean las fachadas) y encima los sitios con
// su icono y su nombre, los tratos, los pedidos, los cajeros y tú.
//
// Coordenadas: igual que el mapa del móvil, +x a la derecha y +z (el puerto, el norte) arriba.
// La foto se voltea en horizontal para que coincida (los nombres de la isla, Norte/Este…,
// siguen ese mismo convenio).
import * as THREE from 'three';
import { G } from '../game.js';
import { clock, dayName } from '../systems/time.js';
import { getWaypoint, setWaypoint, clearWaypoint } from './hud.js';
import { orderDrop } from '../systems/economy.js';
import { sfx } from '../core/audio.js';

const TILT = 0.45; // inclinación de la cámara (rad): se ven un poco las fachadas
let photo = null; // { url, w, h } de la foto aérea
let root = null, open = false, stage = null, layer = null;

// ---------------------------------------------------------------
//  Foto aérea
// ---------------------------------------------------------------
// Pasa de mundo a la foto (0..1): el ancho es la isla de x0 a x1; el alto, su fondo visto
// con la cámara inclinada (lo alto, como una colina, sube un poco en la foto).
function toPhoto(x, z, y = G.world.groundAt?.(x, z) ?? 0) {
  const b = G.world.bounds, ct = Math.cos(TILT), st = Math.sin(TILT);
  const h = (b.z1 - b.z0) * ct, cz = (b.z0 + b.z1) / 2;
  return { u: (x - b.x0) / (b.x1 - b.x0), v: (h / 2 - ((z - cz) * ct + y * st)) / h };
}
// y al revés (para marcar un destino tocando el mapa): primero a ras de 0 y luego se corrige
// con la altura del suelo en ese punto
function fromPhoto(u, v) {
  const b = G.world.bounds, ct = Math.cos(TILT), st = Math.sin(TILT);
  const h = (b.z1 - b.z0) * ct, cz = (b.z0 + b.z1) / 2;
  const x = b.x0 + u * (b.x1 - b.x0);
  let z = cz + (h / 2 - v * h) / ct;
  for (let k = 0; k < 2; k++) z = cz + (h / 2 - v * h - (G.world.groundAt?.(x, z) ?? 0) * st) / ct;
  return { x, z };
}

export function makeAerial(px = G.touch ? 1536 : 2048) {
  const R = G.renderer, scene = G.scene, b = G.world.bounds;
  if (!R || !b) return null;
  const ct = Math.cos(TILT), st = Math.sin(TILT);
  const w = b.x1 - b.x0, h = (b.z1 - b.z0) * ct, PX = px, PY = Math.round((PX * h) / w);
  const cam = new THREE.OrthographicCamera(-w / 2, w / 2, h / 2, -h / 2, -400, 400);
  const cx = (b.x0 + b.x1) / 2, cz = (b.z0 + b.z1) / 2;
  cam.position.set(cx, 100 * ct, cz - 100 * st); cam.up.set(0, 0, 1); cam.lookAt(cx, 0, cz);
  // sin niebla ni nubes, y con luz de mediodía cálida pase lo que pase en el reloj
  const fog = scene.fog; scene.fog = null;
  const hid = [];
  for (const o of scene.children) if (o.visible && (o.position.y > 60 || (o.isGroup && o.children.length && o.children.every((c) => c.position.y > 60)))) { hid.push(o); o.visible = false; }
  const L = [];
  scene.traverse((o) => { if (o.isLight) L.push([o, o.intensity, o.color.clone(), o.groundColor?.clone(), o.position.clone(), o.castShadow]); });
  for (const [o] of L) {
    if (o.isHemisphereLight) { o.intensity = 1.6; o.color.set('#fff6e8'); o.groundColor.set('#8a8a62'); }
    else if (o.isDirectionalLight) { o.intensity = 2.8; o.color.set('#fff1dc'); o.position.set(o.target.position.x + 60, 200, o.target.position.z - 80); o.castShadow = false; }
    else if (!o.isAmbientLight) o.intensity = 0;
  }
  const exp = R.toneMappingExposure; R.toneMappingExposure = 1;
  // se dibuja en el propio lienzo del juego (así lleva el mismo tono y color que la pantalla)
  // y se copia en el acto, antes de que el navegador lo borre
  const size = R.getSize(new THREE.Vector2()), pr = R.getPixelRatio(), rt = R.getRenderTarget();
  R.setRenderTarget(null); R.setPixelRatio(1); R.setSize(PX, PY, false);
  R.render(scene, cam);
  const c = document.createElement('canvas'); c.width = PX; c.height = PY;
  const g = c.getContext('2d');
  g.filter = 'saturate(1.15) brightness(1.07) contrast(1.05)';
  g.translate(PX, 0); g.scale(-1, 1); g.drawImage(R.domElement, 0, 0);
  R.setPixelRatio(pr); R.setSize(size.x, size.y, false); R.setRenderTarget(rt);
  scene.fog = fog;
  for (const o of hid) o.visible = true;
  for (const [o, i, col, gc, p, cs] of L) { o.intensity = i; o.color.copy(col); if (gc) o.groundColor.copy(gc); o.position.copy(p); o.castShadow = cs; }
  R.toneMappingExposure = exp;
  photo = { url: c.toDataURL('image/jpeg', 0.86), w: PX, h: PY };
  return photo;
}

// ---------------------------------------------------------------
//  Sitios con icono (el icono es un emoji pintado de blanco)
// ---------------------------------------------------------------
const ICONS = [
  [/gasolinera/i, '⛽'], [/bungal|barrio alto|cabañas|mansi|urbaniza/i, '🏠'], [/eclipse/i, '🍸'], [/palmeras|playa/i, '🌴'],
  [/taller/i, '🔧'], [/bosque|parque/i, '🌳'], [/motel|hotel/i, '🛏️'], [/esquina/i, '🍴'], [/corte fino/i, '✂️'],
  [/lavander/i, '🧺'], [/lavadero/i, '🚗'], [/casino/i, '🃏'], [/ropa/i, '👕'], [/muebles/i, '🛋️'], [/almac|naves/i, '📦'],
  [/cartel/i, '☠️'], [/apartamentos|oficinas/i, '🏢'], [/puerto|muelle|náutico/i, '⚓'], [/faro/i, '🗼'], [/comisar/i, '🚓'],
  [/mercado/i, '🛒'], [/paseo/i, '🌊'],
];
const iconFor = (t) => (ICONS.find(([re]) => re.test(t)) || [null, '📍'])[1];
// un rótulo por sitio (algunos salen dos veces en la lista del mundo); «Tu piso» va aparte
function places() {
  const seen = new Set(), out = [];
  for (const l of G.world.mapLabels || []) {
    if (!l.t || seen.has(l.t) || /tu piso/i.test(l.t)) continue;
    seen.add(l.t);
    out.push({ t: l.t, x: l.x, z: l.z, i: iconFor(l.t) });
  }
  return out;
}

// ---------------------------------------------------------------
//  Pantalla
// ---------------------------------------------------------------
function build() {
  root = document.createElement('div');
  root.id = 'bigmap';
  root.innerHTML = `
    <div class="bm-top"><span class="bm-clock"></span><b>Mapa</b><span class="bm-sig">📶 🔋</span></div>
    <div class="bm-view"><div class="bm-stage"><img class="bm-photo" alt=""><div class="bm-layer bm-fixed"></div><div class="bm-layer"></div></div></div>
    <div class="bm-compass"><span class="n">N</span><span class="e">E</span><span class="s">S</span><span class="o">O</span><i></i></div>
    <div class="bm-legend">
      <div class="bm-keys"><span><i style="background:#2ecc71"></i>Trato</span><span><i style="background:#f39c12"></i>Entregas</span><span><i style="background:#1e90ff"></i>Tú · Toca para marcar destino</span></div>
      <button class="bm-clear">📍 Quitar marca</button>
    </div>
    <button class="bm-close">✕ Cerrar</button>`;
  document.body.appendChild(root);
  stage = root.querySelector('.bm-stage');
  fixed = root.querySelector('.bm-fixed');
  layer = root.querySelector('.bm-layer:not(.bm-fixed)');
  root.querySelector('.bm-close').onclick = closeBigMap;
  root.querySelector('.bm-clear').onclick = () => { clearWaypoint(); sfx('click'); draw(); };
  stage.addEventListener('click', (e) => {
    const r = stage.getBoundingClientRect();
    const { x, z } = fromPhoto((e.clientX - r.left) / r.width, (e.clientY - r.top) / r.height);
    setWaypoint(x, z, 'Destino');
    sfx('click');
    draw();
  });
  window.addEventListener('resize', () => { if (open) { fit(); drawStatic(); } });
}

// la foto entera cabe en la pantalla (como «contain»)
function fit() {
  const v = root.querySelector('.bm-view'), W = v.clientWidth, H = v.clientHeight;
  const k = Math.min(W / photo.w, H / photo.h);
  stage.style.width = `${photo.w * k}px`;
  stage.style.height = `${photo.h * k}px`;
}

const pos = (u, v) => `left:${(u * 100).toFixed(3)}%;top:${(v * 100).toFixed(3)}%`;
const pct = (x, z) => { const p = toPhoto(x, z); return pos(p.u, p.v); };

// Lo que no se mueve (sitios, cajeros, tu casa) se coloca una vez al abrir
let fixed = null;
function drawStatic() {
  const W = G.world, S = G.state;
  let h = places().map((p) => `<div class="bm-place" style="${pct(p.x, p.z)}"><span class="ic">${p.i}</span><span class="tx">${p.t}</span></div>`).join('');
  for (const a of W.atms || []) h += `<div class="bm-dot atm" style="${pct(a.x, a.z)}">$</div>`;
  const home = W.props?.[S.home];
  if (home) h += `<div class="bm-dot home" style="${pct((home.x0 + home.x1) / 2, (home.z0 + home.z1) / 2)}">⌂</div>`;
  fixed.innerHTML = h;
}
function draw() {
  if (!open) return;
  const W = G.world, S = G.state;
  root.querySelector('.bm-clock').textContent = `${S.minute >= 7 * 60 && S.minute < 20 * 60 ? '☀' : '☾'} ${clock(S.minute)}   |   Día ${S.day} · ${dayName(S.day).slice(0, 3)}`;
  let h = '';
  for (const d of S.deals) {
    if (d.status !== 'accepted') continue;
    const s = W.spots.find((x) => x.id === d.spot);
    if (!s) continue;
    h += `<div class="bm-dot deal" style="${pct(s.x, s.z)}">$</div>`;
  }
  const wp = getWaypoint();
  if (wp) h += `<div class="bm-dot wp" style="${pct(wp.x, wp.z)}">★</div>`;
  for (const o of S.orders) { const d = orderDrop(o); h += `<div class="bm-dot drop" style="${pct(d.x, d.z)}">📦</div>`; }
  for (const c of G.police) if (c.distToPlayer() < 30) h += `<div class="bm-dot cop" style="${pct(c.pos.x, c.pos.z)}"></div>`;
  // tú: la flecha apunta hacia donde miras (en el mapa, +x a la derecha y +z arriba)
  const P = G.player, ang = Math.atan2(-Math.sin(P.yaw), -Math.cos(P.yaw));
  h += `<div class="bm-me" style="${pct(P.pos.x, P.pos.z)};transform:translate(-50%,-50%) rotate(${ang}rad)"></div>`;
  layer.innerHTML = h;
}

export const bigMapOpen = () => open;
export function openBigMap() {
  if (!G.world?.bounds) return false; // (el mapa antiguo sigue con el del móvil)
  if (!photo) makeAerial();
  if (!root) build();
  root.querySelector('.bm-photo').src = photo.url;
  open = true;
  G.uiOpen = true;
  if (document.pointerLockElement) document.exitPointerLock();
  root.classList.add('open');
  fit();
  drawStatic();
  draw();
  sfx('open');
  return true;
}
export function closeBigMap() {
  if (!open) return;
  open = false;
  G.uiOpen = false;
  root.classList.remove('open');
  sfx('close');
}
let acc = 0;
export function tickBigMap(dt) {
  if (!open) return;
  acc += dt;
  if (acc > 0.25) { acc = 0; draw(); }
}
