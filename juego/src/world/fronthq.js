// Los negocios tapadera por dentro: la Lavandería Espuma y el Lavadero de coches. Locales
// huecos con puerta a la calle y, al fondo, una oficina con el ordenador desde el que se
// blanquea el dinero (la puerta de la oficina sólo se abre si el negocio es tuyo).
//   Lavandería (22 × 14): sala de autoservicio con lavadoras y columnas de lavadora-secadora,
//     mesa de doblar, bancos junto al escaparate y máquina de cambio; mostrador de encargos
//     con burra de ropa planchada; trastienda con estanterías, sacos y el calentador; oficina.
//   Lavadero (28 × 16): túnel de lavado automático con rodillos, arco de agua y secadores;
//     dos boxes de autoservicio con lanza y manguera; tienda con mostrador y nevera; oficina.
// Lavadoras y muebles de oficina: Kenney (CC0); mesa, portátil, flexo, ventilador, reloj,
// manguera, cestos y demás: Poly Haven (CC0, fotoescaneados).
// Coordenadas locales, fachada hacia +z. Devuelven el grupo, las cajas de colisión
// [x0, x1, z0, z1, alto], los muebles de interior.js, los modelos de Poly Haven (load), las
// hojas de las puertas, el ordenador, el interior y las luces.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat } from './buildingkit.js';
import { slab, GLASS } from './realbuilding.js';
import { dims } from './interior.js';
import { prop } from '../entities/realprops.js';

const T = 0.3, PT = 0.16;
const mats = new Map();
const mat = (k, o) => { if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(o)); return mats.get(k); };
const texs = new Map();
function canvasTex(key, w, h, draw, repeat = false) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texs.set(key, t);
  }
  return texs.get(key);
}
function rbox(g, m, w, h, d, x, y, z, r = 0.02) {
  const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99), m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
}
function cyl(g, m, rt, rb, h, x, y, z, s = 16) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
function plane(g, m, w, h, x, y, z, ry = 0, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); g.add(o); return o; }
// suelo de baldosa (canvas que se repite cada `tile` m)
function floorMat(key, draw, tile) {
  const m = mat(key, { roughness: 0.35, map: canvasTex(key, 256, 256, draw, true) });
  m.userData.tile = tile;
  return m;
}
function floor(g, m, x0, x1, z0, z1, y = 0.02) {
  if (m.normalMap) return slab(g, m, x0, x1, y - 0.02, y, z0, z1); // (material con relieve: UV en metros)
  const f = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), m.clone());
  f.material.map = m.map.clone(); f.material.map.needsUpdate = true; f.material.map.repeat.set((x1 - x0) / m.userData.tile, (z1 - z0) / m.userData.tile);
  f.rotation.x = -Math.PI / 2; f.position.set((x0 + x1) / 2, y, (z0 + z1) / 2); f.receiveShadow = true; g.add(f); return f;
}
// Rótulo de letras sobre fondo de color (con burbujas para la lavandería)
function signMat(key, text, bg, fg, { w = 1024, h = 160, bubbles = false, font = 'bold 96px "Arial Black", Impact, sans-serif' } = {}) {
  return mat('rot-' + key, {
    color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.25, roughness: 0.4,
    map: canvasTex('rot-' + key, w, h, (c) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      if (bubbles) for (let k = 0; k < 26; k++) { const x = (k * 97) % w, y = (k * 53) % h, r = 6 + (k % 5) * 5; c.strokeStyle = 'rgba(255,255,255,0.45)'; c.lineWidth = 3; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.5)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.2, 0, Math.PI * 2); c.fill(); }
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font;
      c.fillStyle = 'rgba(0,0,0,0.25)'; c.fillText(text, w / 2 + 4, h / 2 + 5); c.fillStyle = fg; c.fillText(text, w / 2, h / 2);
    }),
  });
}
// Carteles pequeños (avisos, precios, horarios) en la pared
function noteMat(key, lines, { bg = '#ffffff', fg = '#1d2b36', head = '#2b7bd1', w = 256, h = 320 } = {}) {
  return mat('nota-' + key, {
    roughness: 0.8,
    map: canvasTex('nota-' + key, w, h, (c) => {
      c.fillStyle = bg; c.fillRect(0, 0, w, h);
      c.fillStyle = head; c.fillRect(0, 0, w, 54); c.fillStyle = '#ffffff'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.fillText(lines[0], w / 2, 38);
      c.fillStyle = fg; c.font = '22px sans-serif'; c.textAlign = 'left';
      lines.slice(1).forEach((t, k) => c.fillText(t, 18, 92 + k * 34));
    }),
  });
}

// Montaje común: piezas de Kenney (put) y de Poly Haven (P, se montan al acercarse)
function kit() {
  const g = new THREE.Group(), boxes = [], items = [], later = [];
  const box = (x0, x1, z0, z1, h) => boxes.push([x0, x1, z0, z1, h]);
  const put = (name, x, y, z, ry = 0, s = 1, solid = true) => {
    const d = dims(name, s);
    if (!d[0]) return null;
    items.push({ name, x, y, z, ry, s });
    if (solid) { const turned = Math.abs(Math.sin(ry)) > 0.5, hw = (turned ? d[2] : d[0]) / 2, hd = (turned ? d[0] : d[2]) / 2; box(x - hw, x + hw, z - hd, z + hd, y + d[1]); }
    return d;
  };
  // (tamaños medidos de los modelos, para las colisiones)
  const SZ = { metal_office_desk: [2, 0.79, 0.95], plastic_monobloc_chair_01: [0.64, 0.88, 0.63], worn_metal_rack: [0.92, 1.9, 0.6], drawer_cabinet: [1.14, 1.88, 0.49], potted_plant_01: [0.58, 1.35, 0.63], power_box_01: [0.46, 0.5, 0.4], trashbag: [0.53, 0.57, 0.46], cardboard_box_01: [0.39, 0.34, 0.52], plastic_crate_02: [0.51, 0.25, 0.41] };
  const P = (name, x, y, z, ry = 0, h = null, solid = true, extra = {}) => {
    later.push((t) => prop(t, name, { x, y, z, ry, ...(h ? { h } : {}), ...extra }));
    const sz = SZ[name];
    if (solid && sz && h) {
      const s = h / sz[1], turned = Math.abs(Math.sin(ry)) > 0.5, hw = ((turned ? sz[2] : sz[0]) * s) / 2, hd = ((turned ? sz[0] : sz[2]) * s) / 2;
      box(x - hw, x + hw, z - hd, z + hd, y + h);
    }
  };
  return { g, boxes, items, later, box, put, P };
}

// Muro con huecos a lo largo de x (en z0..z1) o de z (en x0..x1), entre y0 e y1
function wallX(g, m, z0, z1, a0, a1, y0, y1, holes = []) {
  let a = a0;
  for (const [ha, hb, hy0, hy1] of [...holes].sort((p, q) => p[0] - q[0])) {
    slab(g, m, a, ha, y0, y1, z0, z1);
    if (hy0 > y0) slab(g, m, ha, hb, y0, hy0, z0, z1);
    if (hy1 < y1) slab(g, m, ha, hb, hy1, y1, z0, z1);
    a = hb;
  }
  slab(g, m, a, a1, y0, y1, z0, z1);
}
function wallZ(g, m, x0, x1, a0, a1, y0, y1, holes = []) {
  let a = a0;
  for (const [ha, hb, hy0, hy1] of [...holes].sort((p, q) => p[0] - q[0])) {
    slab(g, m, x0, x1, y0, y1, a, ha);
    if (hy0 > y0) slab(g, m, x0, x1, y0, hy0, ha, hb);
    if (hy1 < y1) slab(g, m, x0, x1, hy1, y1, ha, hb);
    a = hb;
  }
  slab(g, m, x0, x1, y0, y1, a, a1);
}
// cajas de colisión de un muro con pasos (los pasos van de 0 a 2.3 m: se cuela por debajo)
function wallBoxes(box, axis, c0, c1, a0, a1, h, doors = []) {
  let a = a0;
  for (const [ha, hb] of [...doors].sort((p, q) => p[0] - q[0])) { if (ha > a) axis === 'x' ? box(a, ha, c0, c1, h) : box(c0, c1, a, ha, h); a = hb; }
  if (a1 > a) axis === 'x' ? box(a, a1, c0, c1, h) : box(c0, c1, a, a1, h);
}

// Escaparate de aluminio: cristal con montantes cada `step` m
function shopWindow(g, frameM, x0, x1, y0, y1, z, step = 2.2) {
  slab(g, GLASS(), x0, x1, y0, y1, z - 0.02, z + 0.02);
  const f = (a, b, p, q) => slab(g, frameM, a, b, p, q, z - 0.05, z + 0.05);
  f(x0, x1, y0 - 0.06, y0); f(x0, x1, y1, y1 + 0.06);
  const n = Math.max(1, Math.round((x1 - x0) / step));
  for (let k = 0; k <= n; k++) { const x = x0 + ((x1 - x0) * k) / n; f(x - 0.04, x + 0.04, y0, y1); }
}
// Oficina del negocio: mesa con el portátil (el ordenador del blanqueo), flexo, libretas,
// silla, archivador, reloj, corcho con papeles, cuadro eléctrico, papelera y planta.
// (x0..x1, z0..z1: la habitación; la mesa contra la pared del fondo z0)
function office(K, x0, x1, z0, z1, H, M) {
  const { g, put, P } = K;
  floor(g, M.wood, x0, x1, z0, z1, 0.025);
  const dx = (x0 + x1) / 2 + 0.3, dz = z0 + 0.6;
  P('metal_office_desk', dx, 0, dz, 0, 0.79);
  P('classic_laptop', dx - 0.2, 0.79, dz - 0.05, 0.25, 0.3, false);
  P('desk_lamp_arm_01', dx + 0.7, 0.79, dz - 0.25, -0.6, 0.6, false);
  P('office_notepads', dx + 0.25, 0.79, dz + 0.1, 0.2, null, false, { w: 0.5 });
  put('furniture/chairDesk', dx - 0.2, 0, dz + 0.95, Math.PI, 1, false);
  P('plastic_monobloc_chair_01', dx + 0.2, 0, z1 - 0.7, Math.PI + 0.3, 0.88);
  P('drawer_cabinet', x0 + 0.3, 0, z0 + 1.6, Math.PI / 2, 1.5);
  P('potted_plant_01', x1 - 0.45, 0, z1 - 0.45, 0, 1.1);
  P('power_box_01', x1 - 0.02 - 0.2, 1.4, z0 + 1.5, -Math.PI / 2, 0.45, false);
  P('wall_clock', dx, 2.35, z0 + 0.04, 0, 0.32, false);
  put('furniture/trashcan', x1 - 0.4, 0, z0 + 0.4, 0, 1, false);
  // corcho con papeles y una foto, y la caja fuerte pequeña bajo la mesa
  const cork = mat('corcho', { roughness: 0.95, map: canvasTex('corcho', 256, 160, (c, w, h) => {
    c.fillStyle = '#b58a5a'; c.fillRect(0, 0, w, h);
    for (let k = 0; k < 600; k++) { c.fillStyle = `rgba(${90 + (k % 40)},${60 + (k % 30)},30,0.35)`; c.fillRect((k * 37) % w, (k * 61) % h, 2, 2); }
    const paper = (x, y, pw, ph, col) => { c.fillStyle = col; c.fillRect(x, y, pw, ph); c.fillStyle = 'rgba(40,40,60,0.6)'; for (let l = 0; l < 5; l++) c.fillRect(x + 6, y + 10 + l * 9, pw - 14, 2); c.fillStyle = '#d33'; c.beginPath(); c.arc(x + pw / 2, y + 4, 4, 0, 7); c.fill(); };
    paper(14, 16, 60, 70, '#ffffff'); paper(86, 30, 54, 60, '#fff6a8'); paper(152, 12, 64, 80, '#ffffff'); paper(40, 100, 70, 46, '#cfe8ff'); paper(170, 104, 60, 44, '#ffd3d3');
  }) });
  plane(g, cork, 1.2, 0.75, x0 + 0.04, 1.75, z0 + 1.7 + 1.1, Math.PI / 2);
  rbox(g, mat('marcoCorcho', { color: '#6b4a2c', roughness: 0.6 }), 0.03, 0.81, 1.26, x0 + 0.02, 1.75, z0 + 2.8, 0.01);
  rbox(g, mat('cajaFuerteP', { color: '#2f3338', roughness: 0.35, metalness: 0.75 }), 0.45, 0.45, 0.42, dx - 0.65, 0.23, dz - 0.08, 0.03);
  cyl(g, mat('ruedaCaja', { color: '#c9a24a', roughness: 0.3, metalness: 0.9 }), 0.05, 0.05, 0.03, dx - 0.65, 0.27, dz + 0.14, 18).rotation.x = Math.PI / 2;
  // lámpara de techo
  slab(g, M.panel, dx - 0.6, dx + 0.6, H - 0.06, H - 0.03, (z0 + z1) / 2 - 0.3, (z0 + z1) / 2 + 0.3);
  return { pc: { x: dx - 0.2, z: dz + 0.1 } };
}

// ======================================================================
//  Lavandería Espuma
// ======================================================================
export function laundromatHQ() {
  const K = kit(), { g, boxes, items, later, box, put, P } = K;
  const W = 22, D = 14, GH = 4.0, FH = 3.1, H = GH + 2 * FH; // local abajo y dos plantas de pisos
  const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
  const ix0 = X0 + T, ix1 = X1 - T, iz0 = Z0 + T, iz1 = Z1 - T;
  const CH = GH - 0.25; // techo de dentro
  const M = {
    wall: pbrMat('estuco', '#f3e8d6'), back: pbrMat('claro', '#efe6d8'), tile: pbrMat('fachadaAzulejo', '#d9e9f6'), plinth: pbrMat('hormigon', '#5d6168'),
    stone: pbrMat('blanco', '#f7f4ee'), inner: pbrMat('yesoInt', '#f6f9fb'), alu: mat('lavAlu', { color: '#c9ced3', roughness: 0.35, metalness: 0.7 }),
    wood: floorMat('lavParque', (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#8a6343' : '#946c4a'; c.fillRect(0, k * 32, w, 32); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, k * 32, w, 2); c.fillRect(((k * 97) % w), k * 32, 2, 32); } }, 1.6),
    panel: mat('lavPanelLuz', { color: '#ffffff', emissive: '#f4fbff', emissiveIntensity: 1.2 }),
    blue: mat('lavAzul', { color: '#2b7bd1', roughness: 0.5 }), navy: mat('lavMarino', { color: '#173f73', roughness: 0.45 }), white: mat('lavBlanco', { color: '#f7f7f5', roughness: 0.5 }),
    laminate: mat('lavLaminado', { color: '#e9edf0', roughness: 0.4 }), steel: mat('lavAcero', { color: '#a9b0b6', roughness: 0.3, metalness: 0.8 }),
    iron: mat('lavHierro', { color: '#1f2226', roughness: 0.4, metalness: 0.75 }), shutter: mat('lavContraventana', { color: '#2f6fae', roughness: 0.6 }), shutterDark: mat('lavLama', { color: '#255a8f', roughness: 0.65 }),
    glassUp: mat('lavCristalArriba', { color: '#3a4b5a', roughness: 0.06, metalness: 0.75 }),
  };
  const tiles = pbrMat('terrazo', '#f4f2ee');
  const wainTile = pbrMat('azulejo', '#ffffff');

  // ---------------- fachada y muros ----------------
  const DX = -5.4, DW = 0.8;                  // puerta de la calle (centro x −5,4, 1,6 m)
  const WX0 = -3.9, WX1 = 10.3;               // escaparate
  slab(g, M.back, X0, X1, 0, H, Z0, Z0 + T);
  slab(g, M.back, X0, X0 + T, 0, H, Z0, Z1); slab(g, M.back, X1 - T, X1, 0, H, Z0, Z1);
  wallX(g, M.tile, Z1 - T, Z1, X0, X1, 0, GH, [[DX - DW, DX + DW, 0, 2.5], [WX0, WX1, 0.6, 3.2]]);
  slab(g, M.wall, X0, X1, GH - 0.1, GH, Z0, Z1);                   // forjado
  boxes.push([X0, X1, Z0, Z0 + T, H], [X0, X0 + T, Z0, Z1, H], [X1 - T, X1, Z0, Z1, H], [X0, DX - DW, Z1 - T, Z1, H], [DX + DW, X1, Z1 - T, Z1, H]);
  // bajo: zócalo de piedra oscura, pilastras de azulejo y la banda del rótulo
  slab(g, M.plinth, X0 - 0.06, DX - DW, 0, 0.6, Z1, Z1 + 0.06); slab(g, M.plinth, DX + DW, X1 + 0.06, 0, 0.6, Z1, Z1 + 0.06);
  for (const x of [X0 + 0.25, DX - DW - 0.2, DX + DW + 0.2, WX0 - 0.15, X1 - 0.25]) slab(g, M.tile, x - 0.22, x + 0.22, 0.6, GH - 0.55, Z1, Z1 + 0.09);
  slab(g, M.navy, X0 - 0.06, X1 + 0.06, GH - 0.55, GH + 0.25, Z1, Z1 + 0.12);   // banda azul marino del rótulo
  slab(g, M.stone, X0 - 0.1, X1 + 0.1, GH + 0.25, GH + 0.38, Z1, Z1 + 0.2);    // cornisa del local
  slab(g, M.stone, X0 - 0.06, X1 + 0.06, GH - 0.62, GH - 0.55, Z1, Z1 + 0.16);
  const sign = new THREE.Group(); sign.position.set(2.0, GH - 0.15, Z1 + 0.13); g.add(sign);
  plane(sign, signMat('lavanderia', 'LAVANDERÍA ESPUMA', '#173f73', '#ffffff', { bubbles: true }), 9.6, 0.72, 0, 0, 0);
  plane(g, signMat('lavAbierto', 'ABIERTO', 'rgba(0,0,0,0)', '#ff4d6a', { w: 256, h: 80, font: 'bold 54px "Arial Black", sans-serif' }), 0.9, 0.28, WX0 + 0.9, 2.75, Z1 - T / 2 - 0.04, 0);
  shopWindow(g, M.alu, WX0, WX1, 0.6, 3.2, Z1 - T / 2);
  // vinilos del escaparate: burbujas y lo que se hace
  const vinyl = mat('lavVinilo', { transparent: true, depthWrite: false, map: canvasTex('lavVinilo', 1024, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.font = 'bold 54px sans-serif'; c.fillStyle = 'rgba(255,255,255,0.92)'; c.fillText('LAVADO · SECADO · PLANCHADO', w / 2, 200);
    for (let k = 0; k < 18; k++) { const x = 40 + ((k * 151) % (w - 80)), y = 30 + ((k * 67) % 120), r = 10 + (k % 4) * 9; c.strokeStyle = 'rgba(255,255,255,0.8)'; c.lineWidth = 4; c.beginPath(); c.arc(x, y, r, 0, 7); c.stroke(); c.fillStyle = 'rgba(255,255,255,0.7)'; c.beginPath(); c.arc(x - r * 0.35, y - r * 0.35, r * 0.22, 0, 7); c.fill(); }
  }) });
  plane(g, vinyl, WX1 - WX0 - 0.6, (WX1 - WX0 - 0.6) / 4, (WX0 + WX1) / 2, 1.55, Z1 - T / 2 + 0.03);
  for (const s of [-1, 1]) slab(g, M.alu, DX + s * DW - 0.06, DX + s * DW + 0.06, 0, 2.56, Z1 - 0.05, Z1 + 0.06);
  slab(g, M.alu, DX - DW - 0.06, DX + DW + 0.06, 2.5, 2.56, Z1 - 0.05, Z1 + 0.06);
  slab(g, M.alu, DX - DW, DX + DW, 2.56, 3.3, Z1 - T / 2 - 0.02, Z1 - T / 2 + 0.02); // montante de cristal sobre la puerta
  slab(g, GLASS(), DX - DW + 0.04, DX + DW - 0.04, 2.6, 3.26, Z1 - T / 2 - 0.03, Z1 - T / 2 + 0.03);
  // número, timbre y apliques junto a la puerta; escalón de piedra
  plane(g, signMat('lavNum12', '12', '#f7f4ee', '#173f73', { w: 128, h: 96, font: 'bold 64px sans-serif' }), 0.22, 0.16, DX + DW + 0.2, 2.2, Z1 + 0.1);
  rbox(g, M.alu, 0.07, 0.12, 0.02, DX + DW + 0.2, 1.35, Z1 + 0.1, 0.01);
  for (const s of [-1, 1]) {
    const lamp = new THREE.Group(); lamp.position.set(DX + s * (DW + 0.2), 2.75, Z1 + 0.1); g.add(lamp);
    rbox(lamp, M.iron, 0.1, 0.16, 0.06, 0, 0, 0, 0.02); cyl(lamp, M.iron, 0.012, 0.012, 0.18, 0, 0, 0.1, 6).rotation.x = Math.PI / 2;
    cyl(lamp, mat('lavFarol', { color: '#fff3d6', emissive: '#ffd590', emissiveIntensity: 1.3, roughness: 0.3 }), 0.07, 0.05, 0.2, 0, -0.06, 0.2, 12);
    cyl(lamp, M.iron, 0.09, 0.07, 0.04, 0, 0.06, 0.2, 12);
  }
  slab(g, M.stone, DX - DW - 0.2, DX + DW + 0.2, 0, 0.12, Z1, Z1 + 0.45);
  // toldo enrollable a rayas con faldón ondulado y brazos articulados
  const awn = mat('lavToldo', { roughness: 0.85, side: THREE.DoubleSide, map: canvasTex('lavToldo', 256, 64, (c, w, h) => { for (let k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#2b7bd1'; c.fillRect(k * 16, 0, 16, h); } c.fillStyle = 'rgba(0,0,0,0.1)'; c.fillRect(0, h - 8, w, 8); }, true) });
  awn.map.repeat.set(5, 1);
  const valance = mat('lavFaldon', { transparent: true, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.85, map: canvasTex('lavFaldon', 256, 64, (c, w, h) => { c.clearRect(0, 0, w, h); for (let k = 0; k < 16; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#2b7bd1'; c.beginPath(); c.moveTo(k * 16, 0); c.lineTo(k * 16 + 16, 0); c.lineTo(k * 16 + 16, h * 0.55); c.arc(k * 16 + 8, h * 0.55, 8, 0, Math.PI); c.closePath(); c.fill(); } }, true) });
  valance.map.repeat.set(5, 1);
  const AW0 = WX0 - 0.3, AW1 = WX1 + 0.3, AL = 1.6, AT = 0.32; // largo y caída del toldo
  const ag = new THREE.Group(); ag.position.set((AW0 + AW1) / 2, GH - 0.62, Z1 + 0.12); g.add(ag);
  cyl(ag, M.white, 0.08, 0.08, AW1 - AW0, 0, 0, 0, 16).rotation.z = Math.PI / 2;            // cofre del rollo
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(AW1 - AW0, AL), awn); cloth.rotation.x = -Math.PI / 2 + AT; cloth.position.set(0, -Math.sin(AT) * AL / 2, Math.cos(AT) * AL / 2); ag.add(cloth);
  const ay = -Math.sin(AT) * AL, az = Math.cos(AT) * AL;
  cyl(ag, M.alu, 0.025, 0.025, AW1 - AW0, 0, ay, az, 8).rotation.z = Math.PI / 2;            // barra de carga
  const fal = new THREE.Mesh(new THREE.PlaneGeometry(AW1 - AW0, 0.28), valance); fal.position.set(0, ay - 0.14, az + 0.01); ag.add(fal);
  for (const x of [-(AW1 - AW0) / 2 + 0.3, (AW1 - AW0) / 2 - 0.3]) { const arm = cyl(ag, M.alu, 0.018, 0.018, AL * 0.98, x, ay / 2 - 0.05, az / 2, 6); arm.rotation.x = Math.PI / 2 - AT; }
  // pisos de arriba: estuco, ventanas con recercado de piedra, contraventanas y balcones de hierro
  wallX(g, M.wall, Z1 - T, Z1, X0, X1, GH, H, [-8.1, -4.3, 0, 4.3, 8.1].flatMap((wx, k) => [[wx - 0.65, wx + 0.65, GH + (k % 2 ? 0.9 : 0.15) + 0, GH + 2.45], [wx - 0.65, wx + 0.65, GH + FH + (k % 2 ? 0.9 : 0.15), GH + FH + 2.45]]));
  for (let f = 0; f < 2; f++) for (const [k, wx] of [-8.1, -4.3, 0, 4.3, 8.1].entries()) {
    const y0 = GH + f * FH + (k % 2 ? 0.9 : 0.15), y1 = GH + f * FH + 2.45, balcony = k % 2 === 0;
    slab(g, M.glassUp, wx - 0.65, wx + 0.65, y0, y1, Z1 - T / 2 - 0.02, Z1 - T / 2 + 0.02);
    for (const x of [wx - 0.63, wx - 0.02, wx + 0.57]) slab(g, M.white, x, x + 0.06, y0, y1, Z1 - T / 2 - 0.04, Z1 - T / 2 + 0.04);
    slab(g, M.white, wx - 0.65, wx + 0.65, y0 + (y1 - y0) * 0.62, y0 + (y1 - y0) * 0.62 + 0.05, Z1 - T / 2 - 0.04, Z1 - T / 2 + 0.04);
    for (const x of [wx - 0.82, wx + 0.65]) slab(g, M.stone, x, x + 0.17, y0, y1 + 0.18, Z1, Z1 + 0.06);   // jambas
    slab(g, M.stone, wx - 0.85, wx + 0.85, y1, y1 + 0.2, Z1, Z1 + 0.1);                                        // dintel
    for (const s of [-1, 1]) {                                                                                   // contraventanas de lamas
      const sx0 = s < 0 ? wx - 1.5 : wx + 0.85, sx1 = s < 0 ? wx - 0.85 : wx + 1.5;
      slab(g, M.shutter, sx0, sx1, y0, y1, Z1 + 0.02, Z1 + 0.06);
      for (let l = 1; l < 10; l++) slab(g, M.shutterDark, sx0 + 0.04, sx1 - 0.04, y0 + ((y1 - y0) * l) / 10 - 0.012, y0 + ((y1 - y0) * l) / 10 + 0.012, Z1 + 0.06, Z1 + 0.075);
    }
    if (balcony) {
      const by = y0, bz = 0.55;
      slab(g, M.stone, wx - 1.0, wx + 1.0, by - 0.14, by, Z1, Z1 + bz);                                      // losa del balcón
      slab(g, M.stone, wx - 1.0, wx + 1.0, by - 0.2, by - 0.14, Z1, Z1 + bz - 0.05);
      for (let x = wx - 0.95; x <= wx + 0.95; x += 0.12) slab(g, M.iron, x - 0.01, x + 0.01, by, by + 0.95, Z1 + bz - 0.06, Z1 + bz - 0.04);
      for (let zz = Z1 + 0.1; zz < Z1 + bz - 0.05; zz += 0.12) for (const x of [wx - 0.97, wx + 0.97]) slab(g, M.iron, x - 0.01, x + 0.01, by, by + 0.95, zz - 0.01, zz + 0.01);
      slab(g, M.iron, wx - 1.0, wx + 1.0, by + 0.95, by + 1.0, Z1 + bz - 0.08, Z1 + bz - 0.02);
      for (const x of [wx - 1.0, wx + 0.98]) slab(g, M.iron, x, x + 0.02, by + 0.95, by + 1.0, Z1, Z1 + bz - 0.02);
      if ((k + f) % 2 === 0) P('potted_plant_01', wx + 0.6, by, Z1 + 0.28, k, 0.75, false);
    } else slab(g, M.stone, wx - 0.85, wx + 0.85, y0 - 0.08, y0, Z1, Z1 + 0.14);                              // alféizar
    if ((k * 3 + f) % 4 === 1) { rbox(g, M.white, 0.8, 0.55, 0.28, wx + 1.0, y0 - 0.55, Z1 + 0.18, 0.04); cyl(g, mat('lavRejillaAC', { color: '#9aa1a8', roughness: 0.5 }), 0.18, 0.18, 0.02, wx + 1.0, y0 - 0.55, Z1 + 0.33, 20).rotation.x = Math.PI / 2; }
  }
  slab(g, M.stone, X0 - 0.06, X1 + 0.06, GH + FH - 0.08, GH + FH + 0.06, Z1, Z1 + 0.1);        // imposta entre pisos
  slab(g, M.stone, X0 - 0.18, X1 + 0.18, H, H + 0.3, Z0 - 0.18, Z1 + 0.18);                    // cornisa
  slab(g, M.stone, X0 - 0.1, X1 + 0.1, H + 0.3, H + 0.85, Z1 - 0.15, Z1 + 0.1);                // peto
  slab(g, M.back, X0, X1, H - 0.25, H, Z0, Z1);                                                // cubierta
  for (const z of [Z0 + 2.5, Z1 - 3]) { cyl(g, M.white, 0.35, 0.35, 0.9, X1 - 2.5, H + 0.45, z, 16); }            // depósitos de la azotea
  const dish = cyl(g, M.white, 0.45, 0.05, 0.12, X0 + 2.5, H + 1.1, Z1 - 1.0, 20); dish.rotation.x = -1.0; cyl(g, M.iron, 0.02, 0.02, 0.8, X0 + 2.5, H + 0.5, Z1 - 1.0, 6);
  for (const x of [X0 + 0.12, X1 - 0.12]) { cyl(g, mat('lavBajante', { color: '#7d8186', roughness: 0.5, metalness: 0.5 }), 0.05, 0.05, H, x, H / 2, Z1 + 0.08, 10); }
  // en la acera: macetas a la puerta y caballete con el horario
  P('potted_plant_01', DX - DW - 0.55, 0.12, Z1 + 0.4, 0, 1.15, false); P('potted_plant_01', DX + DW + 0.55, 0.12, Z1 + 0.4, 1, 1.15, false);
  const easel = new THREE.Group(); easel.position.set(WX0 + 1.4, 0, Z1 + 0.9); easel.rotation.y = 0.25; g.add(easel);
  const board = noteMat('lavCaballete', ['AUTOSERVICIO', 'Todos los días', '8:00 - 22:00', 'Lavado 8 kg 4,50', 'Secado 1,00'], { head: '#173f73', bg: '#1d2124', fg: '#ffffff' });
  for (const s of [-1, 1]) { const b = plane(easel, board, 0.58, 0.8, 0, 0.5, s * 0.15, s < 0 ? Math.PI : 0, s * 0.18); b.material.side = THREE.FrontSide; rbox(easel, M.iron, 0.62, 0.86, 0.02, 0, 0.5, s * 0.14, 0.01).rotation.x = s * 0.18; }

  // ---------------- interior: suelos, techo, forros ----------------
  floor(g, tiles, ix0, ix1, iz0, iz1);
  const grid = mat('falsoTecho', { roughness: 0.9, map: canvasTex('falsoTecho', 128, 128, (c, w, h) => { c.fillStyle = '#f4f5f3'; c.fillRect(0, 0, w, h); for (let k = 0; k < 500; k++) { c.fillStyle = 'rgba(150,150,140,0.25)'; c.fillRect((k * 37) % w, (k * 71) % h, 1, 1); } c.fillStyle = '#c9cdd1'; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h); }, true) });
  grid.userData.tile = 0.6;
  slab(g, grid, ix0, ix1, CH, CH + 0.05, iz0, iz1);
  const liner = (x0, x1, z0, z1, holes) => (x1 - x0 > z1 - z0 ? wallX(g, M.inner, z0, z1, x0, x1, 0, CH, holes) : wallZ(g, M.inner, x0, x1, z0, z1, 0, CH, holes));
  liner(ix0, ix1, iz0, iz0 + 0.02); liner(ix0, ix0 + 0.02, iz0, iz1); liner(ix1 - 0.02, ix1, iz0, iz1);
  liner(ix0, ix1, iz1 - 0.02, iz1, [[DX - DW, DX + DW, 0, 2.5], [WX0, WX1, 0.6, 3.2]]);
  // tabiques: trastienda (detrás, z < BZ) y oficina (detrás a la derecha, x > OX, z < OZ)
  const BZ = -2.6, OX = 4.0, OZ = 0.5;
  const TD = [-2.5, -1.5], OD = [9.0, 10.0];  // puertas: trastienda y oficina
  wallX(g, M.inner, BZ - PT / 2, BZ + PT / 2, ix0, OX, 0, CH, [[TD[0], TD[1], 0, 2.3]]);
  wallZ(g, M.inner, OX - PT / 2, OX + PT / 2, iz0, OZ + PT / 2, 0, CH);
  wallX(g, M.inner, OZ - PT / 2, OZ + PT / 2, OX, ix1, 0, CH, [[OD[0], OD[1], 0, 2.3]]);
  wallBoxes(box, 'x', BZ - PT / 2, BZ + PT / 2, ix0, OX, CH, [TD]);
  box(OX - PT / 2, OX + PT / 2, iz0, OZ + PT / 2, CH);
  wallBoxes(box, 'x', OZ - PT / 2, OZ + PT / 2, OX, ix1, CH, [OD]);
  // azulejo blanco con cenefa azul hasta 1,2 m en la sala
  const wain = (x0, x1, z0, z1) => { slab(g, wainTile, x0, x1, 0, 1.45, z0, z1); slab(g, M.blue, x0 - 0.005, x1 + 0.005, 1.45, 1.52, z0 - 0.005, z1 + 0.005); };
  wain(ix0 + 0.02, ix0 + 0.04, BZ + PT / 2, iz1 - 0.02);
  wain(ix0 + 0.02, TD[0], BZ + PT / 2, BZ + PT / 2 + 0.02); wain(TD[1], OX - PT / 2, BZ + PT / 2, BZ + PT / 2 + 0.02);
  // luces del techo: paneles por la sala y la trastienda
  for (const [x, z] of [[-7.5, 0.5], [-7.5, 4.5], [-2.5, 0.5], [-2.5, 4.5], [2.0, 2.5], [7.2, 3.6], [-6.5, -4.6], [-0.5, -4.6]]) slab(g, M.panel, x - 0.6, x + 0.6, CH - 0.03, CH, z - 0.3, z + 0.3);
  P('ceiling_fan', -5.0, CH - 0.52, 2.5, 0, 0.5, false);

  // ---------------- sala de autoservicio ----------------
  const towel = (col) => mat('toalla' + col, { color: col, roughness: 0.95 });
  // lavadoras a lo largo de la pared izquierda (mirando a la sala) con su número
  const num = (n) => mat('lavNum' + n, { roughness: 0.5, map: canvasTex('lavNum' + n, 64, 64, (c) => { c.fillStyle = '#2b7bd1'; c.beginPath(); c.arc(32, 32, 30, 0, 7); c.fill(); c.fillStyle = '#fff'; c.font = 'bold 36px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(String(n), 32, 34); }) });
  let n = 1;
  for (let z = BZ + 1.0; z < iz1 - 0.9; z += 0.78) { put('furniture/washer', ix0 + 0.4, 0, z, Math.PI / 2, 0.92); plane(g, num(n++), 0.16, 0.16, ix0 + 0.06, 1.55, z, Math.PI / 2); }
  // columnas de lavadora y secadora contra la pared de la trastienda (mirando a la sala)
  for (let x = ix0 + 1.25; x < TD[0] - 0.4; x += 0.78) { put('furniture/washerDryerStacked', x, 0, BZ + PT / 2 + 0.4, 0, 0.92); plane(g, num(n++), 0.16, 0.16, x, 1.98, BZ + PT / 2 + 0.03); }
  // franja iluminada sobre las lavadoras con lo que se puede hacer en cada zona
  slab(g, M.navy, ix0 + 0.02, ix0 + 0.5, CH - 0.5, CH, BZ + 0.6, iz1 - 0.6);
  plane(g, signMat('lavFranjaL', 'LAVADORAS · 8 kg · 14 kg', '#173f73', '#ffffff', { w: 1024, h: 96, font: 'bold 56px sans-serif' }), iz1 - BZ - 1.4, 0.38, ix0 + 0.51, CH - 0.25, (BZ + iz1) / 2, Math.PI / 2);
  slab(g, M.navy, ix0 + 0.6, TD[0] - 0.2, CH - 0.5, CH, BZ + PT / 2, BZ + PT / 2 + 0.48);
  plane(g, signMat('lavFranjaS', 'LAVADORA + SECADORA', '#173f73', '#ffffff', { w: 1024, h: 96, font: 'bold 56px sans-serif' }), TD[0] - ix0 - 1.0, 0.38, (ix0 + TD[0]) / 2 + 0.2, CH - 0.25, BZ + PT / 2 + 0.49);
  for (const [x0, x1, z0, z1] of [[ix0 + 0.5, ix0 + 0.52, BZ + 0.6, iz1 - 0.6], [ix0 + 0.6, TD[0] - 0.2, BZ + PT / 2 + 0.48, BZ + PT / 2 + 0.5]]) slab(g, M.panel, x0, x1, CH - 0.53, CH - 0.5, z0, z1);
  // máquina expendedora de detergente y suavizante
  const vend = mat('lavExpendedora', { roughness: 0.3, emissive: '#ffffff', emissiveIntensity: 0.15, map: canvasTex('lavExpendedora', 128, 256, (c, w, h) => {
    c.fillStyle = '#e8edf1'; c.fillRect(0, 0, w, h); c.fillStyle = '#2b7bd1'; c.fillRect(0, 0, w, 34); c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('DETERGENTE', w / 2, 22);
    c.fillStyle = '#cfe3f3'; c.fillRect(10, 44, 80, 150);
    const cols = ['#ff7b2e', '#2fb0e8', '#7ad14d', '#f2d14b', '#d24bd6', '#ffffff'];
    for (let r = 0; r < 4; r++) for (let k = 0; k < 3; k++) { c.fillStyle = cols[(r * 3 + k) % cols.length]; c.fillRect(16 + k * 25, 52 + r * 36, 18, 26); c.fillStyle = '#555'; c.fillRect(14 + k * 25, 80 + r * 36, 22, 3); }
    c.fillStyle = '#333'; c.fillRect(98, 60, 22, 40); c.fillStyle = '#10261a'; c.fillRect(98, 108, 22, 14); c.fillStyle = '#222'; c.fillRect(20, 210, 70, 30);
  }) });
  rbox(g, M.steel, 0.75, 1.85, 0.7, 3.4, 0.925, iz1 - 1.6, 0.03);
  plane(g, vend, 0.7, 1.4, 3.4 - 0.38, 1.05, iz1 - 1.6, -Math.PI / 2);
  box(3.0, 3.8, iz1 - 1.95, iz1 - 1.25, 1.85);
  // tele en la pared (con el canal de noticias) y carros de ropa de rejilla
  const tv = new THREE.Group(); tv.position.set(-0.6, 2.75, BZ + PT / 2 + 0.06); g.add(tv);
  rbox(tv, M.iron, 1.1, 0.66, 0.06, 0, 0, 0, 0.02);
  plane(tv, mat('lavTele', { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.55, map: canvasTex('lavTele', 256, 144, (c, w, h) => { const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1b4f8a'); gr.addColorStop(1, '#0d2a4a'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, h - 30, w, 30); c.fillStyle = '#fff'; c.font = 'bold 16px sans-serif'; c.fillText('ÚLTIMA HORA · Rooktown', 10, h - 10); c.fillStyle = 'rgba(255,255,255,0.85)'; c.fillRect(150, 20, 90, 70); c.fillStyle = '#e8b27a'; c.beginPath(); c.arc(195, 50, 18, 0, 7); c.fill(); }) }), 1.02, 0.58, 0, 0, 0.035);
  const cart = (x, z, ry) => {
    const cg = new THREE.Group(); cg.position.set(x, 0, z); cg.rotation.y = ry; g.add(cg);
    for (const sx of [-0.3, 0.3]) for (const sz of [-0.22, 0.22]) { cyl(cg, M.steel, 0.012, 0.012, 0.9, sx, 0.5, sz, 6); cyl(cg, M.iron, 0.04, 0.04, 0.03, sx, 0.04, sz, 10).rotation.x = Math.PI / 2; }
    for (const y of [0.55, 0.95]) { slab(cg, M.steel, -0.31, 0.31, y - 0.008, y + 0.008, -0.23, 0.23); }
    for (let k = -5; k <= 5; k++) { slab(cg, M.steel, k * 0.06 - 0.004, k * 0.06 + 0.004, 0.55, 0.95, -0.23, -0.222); slab(cg, M.steel, k * 0.06 - 0.004, k * 0.06 + 0.004, 0.55, 0.95, 0.222, 0.23); }
    for (let k = -3; k <= 3; k++) { slab(cg, M.steel, -0.31, -0.302, 0.55, 0.95, k * 0.065 - 0.004, k * 0.065 + 0.004); slab(cg, M.steel, 0.302, 0.31, 0.55, 0.95, k * 0.065 - 0.004, k * 0.065 + 0.004); }
    cyl(cg, M.blue, 0.018, 0.018, 0.6, 0, 1.25, -0.23, 8).rotation.z = Math.PI / 2; for (const sx of [-0.3, 0.3]) cyl(cg, M.steel, 0.012, 0.012, 0.3, sx, 1.1, -0.23, 6);
    rbox(cg, towel('#9ec9f0'), 0.5, 0.18, 0.36, 0, 0.66, 0, 0.06); rbox(cg, towel('#f2f2ee'), 0.4, 0.12, 0.3, 0.02, 0.78, 0.02, 0.05);
    box(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 1.0);
  };
  // fregadero, estante de detergentes y armario alto junto a la puerta de la trastienda
  put('furniture/bathroomSink', 0.0, 0, BZ + PT / 2 + 0.32, 0, 1.6);
  put('furniture/kitchenCabinetUpper', 0.0, 1.55, BZ + PT / 2 + 0.22, 0, 1.4, false);
  slab(g, M.white, 1.0, 3.6, 1.2, 1.24, BZ + PT / 2, BZ + PT / 2 + 0.32);
  slab(g, M.white, 1.0, 3.6, 1.75, 1.79, BZ + PT / 2, BZ + PT / 2 + 0.32);
  for (const [k, nm] of [[0, 'bleach_bottle'], [1, 'multi_cleaner_bottle'], [2, 'bleach_bottle'], [3, 'multi_cleaner_bottle'], [4, 'plastic_bottle_gallon'], [5, 'bleach_bottle']]) {
    P(nm, 1.2 + k * 0.42, 1.24, BZ + PT / 2 + 0.16, 0.3 * k, 0.26, false);
    P(nm === 'plastic_bottle_gallon' ? 'multi_cleaner_bottle' : nm, 1.35 + k * 0.42, 1.79, BZ + PT / 2 + 0.16, -0.2 * k, 0.24, false);
  }
  plane(g, noteMat('lavPrecios', ['PRECIOS', 'Lavado 8 kg ..... 4,50', 'Lavado 14 kg ... 7,00', 'Secado 10 min .. 1,00', 'Detergente ....... 0,80', 'Abierto 8 - 22 h']), 0.6, 0.75, 2.3, 2.45, BZ + PT / 2 + 0.02, 0);
  // mesa de doblar en el centro: tablero laminado y patas de acero, con cestos y toallas
  const fx0 = -6.6, fx1 = -2.0, fz = 1.9;
  rbox(g, M.laminate, fx1 - fx0, 0.05, 1.0, (fx0 + fx1) / 2, 0.86, fz, 0.015);
  for (const x of [fx0 + 0.1, fx1 - 0.1]) for (const s of [-1, 1]) cyl(g, M.steel, 0.025, 0.025, 0.84, x, 0.42, fz + s * 0.42, 8);
  slab(g, M.steel, fx0 + 0.1, fx1 - 0.1, 0.18, 0.21, fz - 0.02, fz + 0.02);
  box(fx0, fx1, fz - 0.5, fz + 0.5, 0.9);
  P('wicker_basket_01', fx0 + 0.6, 0.885, fz - 0.15, 0.3, null, false, { w: 0.55 });
  P('wicker_basket_01', fx1 - 0.8, 0.885, fz + 0.1, -0.2, null, false, { w: 0.55 });
  for (const [x, cols] of [[fx0 + 1.6, ['#f2f2ee', '#9ec9f0', '#f2f2ee', '#f6c5c5']], [fx0 + 2.4, ['#c9e7c5', '#ffffff', '#ffe5a8']]]) cols.forEach((c, k) => rbox(g, towel(c), 0.4, 0.06, 0.3, x, 0.915 + k * 0.062, fz + 0.05, 0.025));
  cart(-8.6, 4.6, 0.3); cart(-1.2, 0.2, -0.5);
  // bancos junto al escaparate, mirando a las lavadoras; sillas y planta
  for (const x of [-2.6, -0.4, 1.8]) put('furniture/benchCushion', x, 0, iz1 - 0.55, Math.PI, 2.0);
  P('plastic_monobloc_chair_01', 3.3, 0, iz1 - 0.7, Math.PI + 0.4, 0.82);
  P('potted_plant_01', -4.2, 0, iz1 - 0.5, 0, 1.2);
  // máquina de cambio de monedas a la izquierda de la puerta, y papelera
  const chM = mat('lavCambio', { roughness: 0.4, map: canvasTex('lavCambio', 128, 256, (c, w, h) => {
    c.fillStyle = '#d8dde2'; c.fillRect(0, 0, w, h); c.fillStyle = '#2b7bd1'; c.fillRect(0, 0, w, 40); c.fillStyle = '#fff'; c.font = 'bold 20px sans-serif'; c.textAlign = 'center'; c.fillText('CAMBIO', w / 2, 27);
    c.fillStyle = '#10261a'; c.fillRect(20, 56, 88, 30); c.fillStyle = '#4dff8a'; c.font = '18px monospace'; c.fillText('0,00 €', w / 2, 77);
    c.fillStyle = '#333'; c.fillRect(44, 110, 40, 6); c.fillStyle = '#555'; c.fillRect(30, 140, 68, 30); c.fillStyle = '#222'; c.fillRect(34, 200, 60, 36);
  }) });
  rbox(g, M.steel, 0.55, 1.6, 0.4, -8.0, 0.8, iz1 - 0.24, 0.03);
  plane(g, chM, 0.5, 1.0, -8.0, 1.05, iz1 - 0.45, Math.PI);
  box(-8.3, -7.7, iz1 - 0.45, iz1, 1.6);
  put('furniture/trashcan', -6.9, 0, iz1 - 0.35, 0, 1, false);
  plane(g, noteMat('lavNormas', ['NORMAS', 'No sobrecargar', 'Retire su ropa', 'al terminar', 'Prohibido fumar'], { head: '#c0392b' }), 0.42, 0.52, ix0 + 0.05, 1.75, BZ + 0.6, Math.PI / 2);
  put('furniture/rugDoormat', DX, 0.02, iz1 - 0.6, 0, 3.0, false);

  // ---------------- mostrador de encargos (delante a la derecha) ----------------
  const cz = 2.6, cx0 = OX + 0.5, cx1 = ix1 - 1.2;
  rbox(g, M.blue, cx1 - cx0, 1.0, 0.6, (cx0 + cx1) / 2, 0.5, cz, 0.02);
  rbox(g, M.laminate, cx1 - cx0 + 0.1, 0.05, 0.72, (cx0 + cx1) / 2, 1.025, cz, 0.01);
  box(cx0, cx1, cz - 0.35, cz + 0.35, 1.05);
  // caja registradora y timbre
  const reg = new THREE.Group(); reg.position.set(cx1 - 0.8, 1.05, cz); reg.rotation.y = Math.PI; g.add(reg);
  rbox(reg, mat('regGris', { color: '#3c4148', roughness: 0.4 }), 0.42, 0.12, 0.38, 0, 0.06, 0, 0.02);
  rbox(reg, mat('regPantalla', { color: '#0d1f16', emissive: '#40ff90', emissiveIntensity: 0.5 }), 0.3, 0.12, 0.03, 0, 0.2, 0.12, 0.01).rotation.x = -0.3;
  for (let k = 0; k < 12; k++) rbox(reg, M.white, 0.05, 0.015, 0.05, -0.1 + (k % 4) * 0.065, 0.125, -0.12 + Math.floor(k / 4) * 0.065, 0.005);
  cyl(g, M.steel, 0.05, 0.06, 0.04, cx0 + 0.5, 1.07, cz, 16); cyl(g, M.steel, 0.006, 0.006, 0.04, cx0 + 0.5, 1.11, cz, 6);
  // burra con ropa planchada en fundas, detrás del mostrador
  const rack = (x0, x1, z) => {
    for (const x of [x0, x1]) cyl(g, M.steel, 0.02, 0.02, 1.8, x, 0.9, z, 8);
    cyl(g, M.steel, 0.015, 0.015, x1 - x0, (x0 + x1) / 2, 1.78, z, 8).rotation.z = Math.PI / 2;
    const cols = ['#3a4a6b', '#f4f4f2', '#7a2f35', '#2f2f33', '#d9c9a8', '#5c7f5a', '#f4f4f2', '#40506b'];
    const film = mat('lavFunda', { color: '#e9f2f8', transparent: true, opacity: 0.45, roughness: 0.1 });
    for (let k = 0, x = x0 + 0.15; x < x1 - 0.1; k++, x += 0.13) {
      cyl(g, M.steel, 0.004, 0.004, 0.08, x, 1.74, z, 4);
      rbox(g, mat('prenda' + cols[k % cols.length], { color: cols[k % cols.length], roughness: 0.85 }), 0.05, 0.95, 0.46, x, 1.2, z, 0.02);
      rbox(g, film, 0.07, 1.0, 0.5, x, 1.18, z, 0.02);
    }
  };
  rack(OX + 0.6, OX + 3.2, OZ + 0.55);
  box(OX + 0.5, OX + 3.3, OZ + 0.25, OZ + 0.85, 1.8);
  // sacos de ropa de los clientes con su ticket
  P('trashbag', cx1 - 0.2, 0, OZ + 0.5, 0.4, 0.5, false, { onload: (m) => m.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set('#d8e6f2'); } }) });
  P('trashbag', cx1 + 0.45, 0, OZ + 0.55, -0.6, 0.45, false, { onload: (m) => m.traverse((o) => { if (o.isMesh) { o.material = o.material.clone(); o.material.color.set('#f0d7a8'); } }) });
  plane(g, noteMat('lavEncargos', ['ENCARGOS', 'Lavado y planchado', 'Tintorería', 'Recogida en 24 h'], { head: '#1d4fa8' }), 0.5, 0.62, ix1 - 0.05, 2.0, 3.6, -Math.PI / 2);

  // ---------------- trastienda ----------------
  floor(g, M.wood, ix0, OX - PT / 2, iz0, BZ - PT / 2, 0.025);
  for (const x of [-9.6, -8.4, -7.2]) {
    P('worn_metal_rack', x, 0, iz0 + 0.35, 0, 1.9);
    for (const [y, k] of [[0.05, 0], [0.72, 1], [1.38, 2]]) P(k === 1 ? 'plastic_crate_02' : 'cardboard_box_01', x + (k - 1) * 0.15, y, iz0 + 0.35, 0.2 * k, k === 1 ? 0.22 : 0.3, false);
  }
  P('trashbag', -5.6, 0, iz0 + 0.5, 0.3, 0.55); P('trashbag', -4.9, 0, iz0 + 0.45, -0.5, 0.5); P('trashbag', -5.3, 0, iz0 + 1.1, 1.2, 0.48);
  // calentador de agua con sus tubos y el extintor
  cyl(g, M.white, 0.3, 0.3, 1.5, 2.8, 1.2, iz0 + 0.4, 24); cyl(g, M.steel, 0.32, 0.32, 0.06, 2.8, 1.97, iz0 + 0.4, 24);
  for (const x of [2.7, 2.9]) cyl(g, mat('cobre', { color: '#b87333', roughness: 0.35, metalness: 0.9 }), 0.02, 0.02, 1.4, x, 2.6, iz0 + 0.4, 8);
  box(2.45, 3.15, iz0, iz0 + 0.75, 2.0);
  P('korean_fire_extinguisher_01', 3.5, 0, BZ - PT / 2 - 0.25, 0, 0.6, false);
  P('plastic_crate_02', 0.5, 0, iz0 + 0.4, 0.1, 0.25); P('plastic_crate_02', 0.5, 0.25, iz0 + 0.4, -0.2, 0.25, false);

  // ---------------- oficina ----------------
  const of = office(K, OX + PT / 2, ix1, iz0, OZ - PT / 2, CH, M);

  return {
    group: g, boxes, items, load: (t) => { for (const f of later.splice(0)) f(t); },
    leaf: { x: DX - DW, z: Z1 - T / 2, width: DW * 2 }, officeLeaf: { x: OD[0], z: OZ, width: OD[1] - OD[0] }, backLeaf: { x: TD[0], z: BZ, width: TD[1] - TD[0] },
    pc: of.pc, inside: { x0: ix0, x1: ix1, z0: iz0, z1: iz1 }, door: { x: DX, z: Z1 + 1.2 }, size: { w: W, d: D },
    clerk: { x: (cx0 + cx1) / 2, z: cz - 0.8, yaw: 0 },
    lights: [{ x: -5, z: 2, c: '#f2f8ff' }, { x: 6.5, z: -2.5, c: '#fff1dc' }],
  };
}

// ======================================================================
//  Lavadero de coches
// ======================================================================
export function carwashHQ() {
  const K = kit(), { g, boxes, items, later, box, put, P } = K;
  const W = 28, D = 16, GH = 5.0;
  const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
  const ix0 = X0 + T, ix1 = X1 - T, iz0 = Z0 + T, iz1 = Z1 - T;
  const CH = GH - 0.3;
  const M = {
    wall: pbrMat('panelMetal', '#dfe7ee'), plinth: pbrMat('hormigon', '#5d6168'), concrete: pbrMat('hormigonPintado', '#c9ccce'), tunnel: pbrMat('azulejoLargo', '#ffffff'),
    inner: mat('lvYeso', { color: '#eef2f5', roughness: 0.9 }), panelBlue: mat('lvPanelAzul', { color: '#1d6fd1', roughness: 0.45, metalness: 0.2 }),
    steel: mat('lvAcero', { color: '#b9c0c6', roughness: 0.3, metalness: 0.85 }), yellow: mat('lvAmarillo', { color: '#f2c230', roughness: 0.5 }),
    dark: mat('lvOscuro', { color: '#24282d', roughness: 0.5 }), white: mat('lvBlanco', { color: '#f7f7f5', roughness: 0.5 }),
    panel: mat('lvPanelLuz', { color: '#ffffff', emissive: '#f4fbff', emissiveIntensity: 1.3 }),
    wood: floorMat('lvParque', (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#7d5a3d' : '#886445'; c.fillRect(0, k * 32, w, 32); c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(0, k * 32, w, 2); c.fillRect(((k * 97) % w), k * 32, 2, 32); } }, 1.6),
  };
  const wetFloor = pbrMat('sueloGaraje', '#c4c6c8');
  const tiles = pbrMat('baldosaGris', '#e8eaec');

  // ---------------- muros ----------------
  // túnel (x −13,7..−4,5) abierto delante y detrás; boxes (−4,5..6) abiertos delante; tienda (6..13,7)
  const TX0 = ix0, TX1 = -4.5, BX1 = 6.0, SX0 = BX1;
  const TO = [-12.2, -6.0], BO = [TX1 + 0.2, BX1 - 0.2];   // bocas del túnel y de los boxes
  const SD = [8.0, 9.4], OD = [11.6, 12.6], OZ = -1.2;      // puerta de la tienda y de la oficina
  slab(g, M.wall, X0, X0 + T, 0, GH, Z0, Z1); slab(g, M.wall, X1 - T, X1, 0, GH, Z0, Z1);
  wallX(g, M.wall, Z0, Z0 + T, X0, X1, 0, GH, [[TO[0], TO[1], 0, 3.8]]);
  wallX(g, M.wall, Z1 - T, Z1, X0, X1, 0, GH, [[TO[0], TO[1], 0, 3.8], [BO[0], BO[1], 0, 3.6], [SD[0], SD[1], 0, 2.5], [10.0, 13.2, 0.9, 2.8]]);
  slab(g, M.wall, X0, X1, GH - 0.2, GH, Z0, Z1);                                  // cubierta
  slab(g, M.panelBlue, X0 - 0.05, X1 + 0.05, GH - 1.2, GH - 0.2, Z1, Z1 + 0.08);   // banda azul de la fachada
  slab(g, M.white, X0 - 0.2, X1 + 0.2, GH, GH + 0.35, Z0 - 0.2, Z1 + 0.2);         // peto
  boxes.push([X0, X0 + T, Z0, Z1, GH], [X1 - T, X1, Z0, Z1, GH]);
  wallBoxes(box, 'x', Z0, Z0 + T, X0, X1, GH, [TO]);
  wallBoxes(box, 'x', Z1 - T, Z1, X0, X1, GH, [TO, BO, SD]);
  shopWindow(g, M.steel, 10.0, 13.2, 0.9, 2.8, Z1 - T / 2, 1.6);
  for (const s of [-1, 1]) slab(g, M.steel, (s < 0 ? SD[0] : SD[1]) - 0.06, (s < 0 ? SD[0] : SD[1]) + 0.06, 0, 2.56, Z1 - 0.05, Z1 + 0.06);
  // rótulos: LAVADERO grande y AUTOLAVADO / BOXES sobre cada boca
  const sign = new THREE.Group(); sign.position.set(4.0, GH - 0.7, Z1 + 0.1); g.add(sign);
  plane(sign, signMat('lavadero', 'LAVADERO', '#1d6fd1', '#ffffff', { bubbles: true }), 9.0, 0.95, 0, 0, 0);
  plane(g, signMat('autolavado', 'AUTOLAVADO →', '#f2c230', '#1d2b36', { w: 512, h: 96, font: 'bold 60px "Arial Black", sans-serif' }), 3.6, 0.6, (TO[0] + TO[1]) / 2, 4.15, Z1 + 0.1);
  plane(g, signMat('boxes', 'BOXES 24 H', '#f2c230', '#1d2b36', { w: 512, h: 96, font: 'bold 60px "Arial Black", sans-serif' }), 3.2, 0.56, (BO[0] + BO[1]) / 2, 3.85, Z1 + 0.1);
  // semáforo de entrada al túnel
  const sem = new THREE.Group(); sem.position.set(TO[1] + 0.45, 2.6, Z1 + 0.2); g.add(sem);
  rbox(sem, M.dark, 0.3, 0.7, 0.2, 0, 0, 0, 0.04);
  cyl(sem, mat('semRojo', { color: '#5a1010', emissive: '#ff2020', emissiveIntensity: 0.25 }), 0.09, 0.09, 0.03, 0, 0.17, 0.11, 16).rotation.x = Math.PI / 2;
  cyl(sem, mat('semVerde', { color: '#20ff60', emissive: '#20ff60', emissiveIntensity: 1.8 }), 0.09, 0.09, 0.03, 0, -0.17, 0.11, 16).rotation.x = Math.PI / 2;

  // marco de la boca del túnel con franjas de aviso y cortina de tiras de goma
  const chev = mat('lvChevron', { roughness: 0.5, map: canvasTex('lvChevron', 64, 256, (c, w, h) => { c.fillStyle = '#f2c230'; c.fillRect(0, 0, w, h); c.fillStyle = '#1d2124'; for (let y = -64; y < h; y += 48) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + 32); c.lineTo(w, y + 56); c.lineTo(0, y + 24); c.fill(); } }) });
  for (const x of [TO[0] - 0.25, TO[1]]) slab(g, chev, x, x + 0.25, 0, 3.95, Z1, Z1 + 0.12);
  slab(g, chev, TO[0] - 0.25, TO[1] + 0.25, 3.8, 4.0, Z1, Z1 + 0.12);
  for (const zf of [Z1 - T / 2, Z0 + T / 2]) {
    const strip = mat('lvTiraGoma', { color: '#2b5f9e', transparent: true, opacity: 0.82, roughness: 0.35, side: THREE.DoubleSide });
    for (let x = TO[0] + 0.12, k = 0; x < TO[1]; x += 0.24, k++) { const st = plane(g, strip, 0.2, 1.6, x, 3.0, zf + 0.04, 0); st.rotation.z = (k % 3 - 1) * 0.02; }
    slab(g, M.steel, TO[0], TO[1], 3.75, 3.82, zf - 0.04, zf + 0.04);
  }
  // marquesina sobre la boca de los boxes
  slab(g, M.panelBlue, BO[0] - 0.2, BO[1] + 0.2, 3.9, 4.05, Z1, Z1 + 1.4);
  slab(g, M.white, BO[0] - 0.2, BO[1] + 0.2, 3.85, 3.9, Z1 + 1.3, Z1 + 1.4);
  for (let x = BO[0] + 0.6; x < BO[1]; x += 2.6) slab(g, M.panel, x - 0.4, x + 0.4, 3.83, 3.85, Z1 + 0.5, Z1 + 0.9);
  // tótem con el nombre y los precios junto a la calle
  const tot = new THREE.Group(); tot.position.set(X1 - 1.2, 0, Z1 + 3.2); g.add(tot);
  rbox(tot, M.dark, 1.6, 0.4, 0.6, 0, 0.2, 0, 0.04);
  rbox(tot, M.panelBlue, 1.3, 5.6, 0.36, 0, 3.1, 0, 0.05);
  for (const zz of [0.185, -0.185]) {
    const ry = zz > 0 ? 0 : Math.PI;
    plane(tot, signMat('lvTotemCab', 'LAVADERO', '#1d6fd1', '#ffffff', { w: 512, h: 128, bubbles: true, font: 'bold 84px "Arial Black", sans-serif' }), 1.2, 0.32, 0, 5.4, zz, ry);
    plane(tot, noteMat('lvTotemPrecios', ['PRECIOS', 'Básico ........ 6', 'Espuma ........ 9', 'Cera ........... 12', 'Total ........... 15', 'Box 1 € / 4 min'], { head: '#f2c230', bg: '#ffffff', fg: '#1d2b36', w: 256, h: 320 }), 1.1, 1.4, 0, 4.2, zz, ry);
    plane(tot, signMat('lvTotem24', 'ABIERTO 24 H', '#1d2124', '#4dff8a', { w: 512, h: 96, font: 'bold 60px sans-serif' }), 1.1, 0.22, 0, 3.25, zz, ry);
  }
  box(X1 - 2.0, X1 - 0.4, Z1 + 2.9, Z1 + 3.5, 5.9);
  // bolardos y flechas pintadas en el suelo de la entrada
  for (const x of [TO[0] - 0.5, TO[1] + 0.25, BO[0] - 0.1, BO[1] + 0.1]) { cyl(g, M.yellow, 0.1, 0.1, 0.9, x, 0.45, Z1 + 0.5, 14); cyl(g, M.dark, 0.105, 0.105, 0.08, x, 0.7, Z1 + 0.5, 14); box(x - 0.1, x + 0.1, Z1 + 0.4, Z1 + 0.6, 0.9); }
  const arrow = mat('lvFlecha', { transparent: true, depthWrite: false, map: canvasTex('lvFlecha', 128, 256, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(255,255,255,0.85)'; c.beginPath(); c.moveTo(w / 2, 10); c.lineTo(w - 14, 90); c.lineTo(w * 0.65, 90); c.lineTo(w * 0.65, h - 10); c.lineTo(w * 0.35, h - 10); c.lineTo(w * 0.35, 90); c.lineTo(14, 90); c.closePath(); c.fill(); }) });
  for (const z of [Z1 + 2.2, Z1 + 4.6]) plane(g, arrow, 1.0, 2.0, (TO[0] + TO[1]) / 2, 0.035, z, Math.PI, -Math.PI / 2);
  plane(g, signMat('lvEntrada', 'ENTRADA', 'rgba(0,0,0,0)', 'rgba(255,255,255,0.85)', { w: 512, h: 128, font: 'bold 90px sans-serif' }), 2.6, 0.65, (TO[0] + TO[1]) / 2, 0.035, Z1 + 6.3, Math.PI, -Math.PI / 2);
  // zócalo oscuro bajo las chapas y canalón
  slab(g, M.plinth, SX0, X1 + 0.05, 0, 0.5, Z1, Z1 + 0.07);
  cyl(g, mat('lvBajante', { color: '#7d8186', roughness: 0.5, metalness: 0.5 }), 0.05, 0.05, GH, X1 - 0.12, GH / 2, Z1 + 0.08, 10);

  // ---------------- túnel de lavado ----------------
  floor(g, wetFloor, TX0, TX1, iz0, iz1);
  slab(g, mat('lvTechoT', { color: '#dfe5ea', roughness: 0.8 }), TX0, TX1, CH, CH + 0.05, iz0, iz1);
  wallZ(g, M.tunnel, TX0, TX0 + 0.03, iz0, iz1, 0, CH); wallZ(g, M.tunnel, TX1 - 0.18, TX1 - 0.15, iz0, iz1, 0, CH);
  for (const x of [TX0 + 0.03, TX1 - 0.18]) slab(g, M.panelBlue, x - 0.01, x + 0.01, 1.2, 1.35, iz0, iz1); // franja azul
  slab(g, M.wall, TX1 - 0.15, TX1 + 0.15, 0, CH, iz0, iz1); box(TX1 - 0.15, TX1 + 0.15, iz0, iz1, CH);
  // carriles guía del coche y rejillas del desagüe
  for (const x of [-10.2, -7.9]) { slab(g, M.steel, x - 0.06, x + 0.06, 0.02, 0.12, iz0 + 0.5, iz1 - 0.5); slab(g, M.yellow, x - 0.07, x + 0.07, 0.02, 0.04, iz1 - 0.5, iz1 - 0.2); }
  const grate = mat('rejilla', { roughness: 0.5, metalness: 0.7, map: canvasTex('rejilla', 128, 32, (c, w, h) => { c.fillStyle = '#2a2d30'; c.fillRect(0, 0, w, h); c.fillStyle = '#0b0c0d'; for (let x = 4; x < w; x += 8) c.fillRect(x, 4, 4, h - 8); }) });
  for (const z of [-4.5, 0, 4.5]) slab(g, grate, TX0 + 0.4, TX1 - 0.4, 0.021, 0.03, z - 0.15, z + 0.15);
  // pórticos de acero con los rodillos verticales, el rodillo de arriba y el arco de agua
  const bristle = (col) => mat('cerda' + col, { roughness: 0.95, map: canvasTex('cerda' + col, 64, 256, (c, w, h) => { c.fillStyle = col; c.fillRect(0, 0, w, h); for (let k = 0; k < 400; k++) { c.fillStyle = k % 3 ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)'; c.fillRect((k * 13) % w, (k * 29) % h, 1, 10); } }) });
  const frame = (z) => {
    for (const x of [TX0 + 0.35, TX1 - 0.5]) { rbox(g, M.steel, 0.22, CH - 0.2, 0.22, x, (CH - 0.2) / 2, z, 0.02); box(x - 0.12, x + 0.12, z - 0.12, z + 0.12, CH); }
    rbox(g, M.steel, TX1 - TX0 - 0.6, 0.25, 0.25, (TX0 + TX1) / 2 - 0.08, CH - 0.32, z, 0.02);
  };
  frame(1.2); frame(-3.0);
  for (const [x, col] of [[-11.3, '#1d6fd1'], [-6.8, '#d63c3c']]) {
    const br = cyl(g, bristle(col), 0.55, 0.55, 2.6, x, 1.55, 1.2, 28); br.castShadow = true;
    cyl(g, M.steel, 0.05, 0.05, 3.2, x, 1.75, 1.2, 8);
    box(x - 0.55, x + 0.55, 0.65, 1.75, 2.9);
  }
  const top = cyl(g, bristle('#1d6fd1'), 0.45, 0.45, TX1 - TX0 - 1.4, (TX0 + TX1) / 2 - 0.08, CH - 1.3, -3.0, 28); top.rotation.z = Math.PI / 2;
  // arco de agua (tubo con boquillas) y secadores
  const pipe = mat('tuboAgua', { color: '#d9dde0', roughness: 0.3, metalness: 0.8 });
  const arch = new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.05, 8, 24, Math.PI), pipe); arch.position.set((TX0 + TX1) / 2 - 0.08, 0.6, 4.4); g.add(arch);
  for (let k = 0; k <= 10; k++) { const a = (k / 10) * Math.PI; cyl(g, M.dark, 0.03, 0.02, 0.08, (TX0 + TX1) / 2 - 0.08 + Math.cos(a) * 2.55, 0.6 + Math.sin(a) * 2.55, 4.4, 6); }
  for (const x of [TX0 + 0.5, TX1 - 0.65]) box(x - 0.08, x + 0.08, 4.3, 4.5, 1.0);
  for (const x of [-11.6, -6.5]) { rbox(g, M.white, 0.9, 1.1, 0.7, x, 3.4, -5.4, 0.06); rbox(g, M.dark, 0.7, 0.12, 0.5, x, 2.8, -5.4, 0.03); }
  rbox(g, M.steel, TX1 - TX0 - 0.6, 0.2, 0.2, (TX0 + TX1) / 2 - 0.08, 3.95, -5.4, 0.02);
  // panel de mando a la entrada y luces
  rbox(g, M.yellow, 0.35, 1.3, 0.3, TO[1] + 0.5, 0.65, iz1 - 0.6, 0.03);
  plane(g, noteMat('lvPrograma', ['PROGRAMAS', '1 Básico ... 6', '2 Espuma ... 9', '3 Cera ...... 12', '4 Total ...... 15'], { head: '#1d6fd1', w: 256, h: 256 }), 0.3, 0.3, TO[1] + 0.5, 1.05, iz1 - 0.44, 0);
  box(TO[1] + 0.3, TO[1] + 0.7, iz1 - 0.8, iz1 - 0.4, 1.3);
  for (const z of [-5, -1, 3]) slab(g, M.panel, -10.0, -8.0, CH - 0.03, CH, z - 0.25, z + 0.25);

  // ---------------- boxes de autoservicio ----------------
  floor(g, wetFloor, TX1 + 0.15, BX1, iz0, iz1);
  slab(g, mat('lvTechoB', { color: '#dfe5ea', roughness: 0.8 }), TX1 + 0.15, BX1, CH, CH + 0.05, iz0, iz1);
  const MID = (TX1 + BX1) / 2;
  slab(g, M.panelBlue, MID - 0.1, MID + 0.1, 0, 3.0, iz0, iz1 - 2.0); box(MID - 0.1, MID + 0.1, iz0, iz1 - 2.0, 3.0);
  wallX(g, M.concrete, iz0, iz0 + 0.03, TX1 + 0.15, BX1, 0, CH);
  wallZ(g, M.concrete, TX1 + 0.15, TX1 + 0.18, iz0, iz1, 0, CH);
  slab(g, M.yellow, TX1 + 0.15, BX1, 0.02, 0.03, iz1 - 0.35, iz1 - 0.2); // línea amarilla de la boca
  for (const [k, bx] of [[1, (TX1 + MID) / 2], [2, (MID + BX1) / 2]]) {
    plane(g, signMat('box' + k, 'BOX ' + k, '#1d6fd1', '#ffffff', { w: 256, h: 96, font: 'bold 64px "Arial Black", sans-serif' }), 1.4, 0.52, bx, 3.4, iz0 + 0.05);
    // consola de monedas y programas, lanza colgada y manguera enrollada
    rbox(g, M.dark, 0.55, 1.4, 0.3, bx - 1.2, 0.7, iz0 + 0.2, 0.03);
    plane(g, noteMat('lvConsola' + k, ['BOX ' + k, 'Prelavado', 'Agua a presión', 'Espuma', 'Aclarado', 'Cera'], { head: '#f2c230', fg: '#ffffff', bg: '#24282d', w: 200, h: 256 }), 0.42, 0.55, bx - 1.2, 1.05, iz0 + 0.36, 0);
    box(bx - 1.5, bx - 0.9, iz0, iz0 + 0.4, 1.4);
    const lance = new THREE.Group(); lance.position.set(bx - 0.4, 1.35, iz0 + 0.12); lance.rotation.z = -0.15; g.add(lance);
    cyl(lance, M.dark, 0.025, 0.025, 1.0, 0, -0.4, 0, 8); rbox(lance, M.yellow, 0.06, 0.18, 0.12, 0, 0.12, 0.03, 0.02);
    P('garden_hose_wall_mounted_01', bx + 0.6, 0.9, iz0 + 0.12, 0, 0.6, false);
    P('tire_pump', bx + 1.3, 0, iz0 + 0.35, -0.3, 0.6, false);
    P('multi_cleaner_bottle', bx + 1.0, 0, iz0 + 0.3, 0.5, 0.25, false);
    slab(g, grate, bx - 1.6, bx + 1.6, 0.021, 0.03, -0.15, 0.15);
    slab(g, M.panel, bx - 0.8, bx + 0.8, CH - 0.03, CH, -0.3, 0.3);
  }
  // aspirador junto a la boca de los boxes (fuera)
  const vac = new THREE.Group(); vac.position.set(BX1 + 0.9, 0, Z1 + 1.2); g.add(vac);
  cyl(vac, M.yellow, 0.3, 0.32, 1.2, 0, 0.6, 0, 20); cyl(vac, M.dark, 0.31, 0.31, 0.08, 0, 1.24, 0, 20);
  const hose = new THREE.Mesh(new THREE.TorusGeometry(0.28, 0.035, 8, 20, Math.PI * 1.4), M.dark); hose.position.set(0, 1.35, 0.18); hose.rotation.y = 0.4; vac.add(hose);
  plane(vac, signMat('aspirador', 'ASPIRADOR', '#1d2b36', '#f2c230', { w: 256, h: 64, font: 'bold 40px sans-serif' }), 0.5, 0.13, 0, 0.95, 0.32);
  box(BX1 + 0.55, BX1 + 1.25, Z1 + 0.85, Z1 + 1.55, 1.3);
  const vac2 = vac.clone(); vac2.position.set(TX1 + 1.2, 0, Z1 + 1.6); g.add(vac2); box(TX1 + 0.85, TX1 + 1.55, Z1 + 1.25, Z1 + 1.95, 1.3);

  // ---------------- tienda (delante) y oficina (detrás) ----------------
  floor(g, tiles, SX0 + 0.15, ix1, OZ + PT / 2, iz1);
  slab(g, mat('lvTechoS', { color: '#f6f8f9', roughness: 0.9 }), SX0, ix1, 3.0, 3.05, iz0, iz1);
  wallZ(g, M.inner, SX0 - 0.15, SX0 + 0.15, iz0, iz1, 0, CH); box(SX0 - 0.15, SX0 + 0.15, iz0, iz1, CH);
  wallX(g, M.inner, OZ - PT / 2, OZ + PT / 2, SX0 + 0.15, ix1, 0, 3.0, [[OD[0], OD[1], 0, 2.3]]);
  wallBoxes(box, 'x', OZ - PT / 2, OZ + PT / 2, SX0 + 0.15, ix1, 3.0, [OD]);
  wallX(g, M.inner, iz1 - 0.02, iz1, SX0 + 0.15, ix1, 0, 3.0, [[SD[0], SD[1], 0, 2.5], [10.0, 13.2, 0.9, 2.8]]);
  wallZ(g, M.inner, ix1 - 0.02, ix1, iz0, iz1, 0, 3.0);
  // mostrador con la caja, nevera de bebidas, estante de productos para el coche y sillas
  const cz = 2.2, cx0 = SX0 + 0.6, cx1 = SX0 + 4.0;
  rbox(g, M.panelBlue, cx1 - cx0, 1.0, 0.6, (cx0 + cx1) / 2, 0.5, cz, 0.02);
  rbox(g, mat('lvEncimera', { color: '#e9edf0', roughness: 0.4 }), cx1 - cx0 + 0.1, 0.05, 0.72, (cx0 + cx1) / 2, 1.025, cz, 0.01);
  box(cx0, cx1, cz - 0.35, cz + 0.35, 1.05);
  rbox(g, mat('regGris', { color: '#3c4148', roughness: 0.4 }), 0.42, 0.12, 0.38, cx1 - 0.6, 1.11, cz, 0.02);
  rbox(g, mat('regPantalla', { color: '#0d1f16', emissive: '#40ff90', emissiveIntensity: 0.5 }), 0.3, 0.12, 0.03, cx1 - 0.6, 1.25, cz - 0.12, 0.01);
  put('furniture/kitchenFridgeSmall', ix1 - 0.45, 0, iz1 - 2.2, -Math.PI / 2, 1.3);
  slab(g, M.white, ix1 - 0.4, ix1 - 0.02, 1.0, 1.04, -0.2, 1.6); slab(g, M.white, ix1 - 0.4, ix1 - 0.02, 1.6, 1.64, -0.2, 1.6);
  for (let k = 0; k < 5; k++) { P(k % 2 ? 'multi_cleaner_bottle' : 'lubricant_spray', ix1 - 0.2, 1.04, -0.05 + k * 0.33, 0, 0.22, false); P(k % 2 ? 'spray_paint_bottles' : 'multi_cleaner_bottle', ix1 - 0.2, 1.64, 0.05 + k * 0.33, 0, 0.2, false); }
  for (const x of [SX0 + 4.8, SX0 + 5.6]) P('plastic_monobloc_chair_01', x, 0, iz1 - 0.7, Math.PI, 0.82);
  plane(g, noteMat('lvTarifas', ['TARIFAS', 'Lavado exterior . 9', 'Interior .......... 12', 'Completo ......... 18', 'Encerado .......... 6'], { head: '#1d6fd1' }), 0.55, 0.68, SX0 + 0.17, 1.9, 0.6, Math.PI / 2);
  put('furniture/rugDoormat', (SD[0] + SD[1]) / 2, 0.02, iz1 - 0.6, 0, 2.6, false);
  slab(g, M.panel, SX0 + 2.5, SX0 + 3.7, 2.97, 3.0, 2.0, 2.6);
  // oficina
  const of = office(K, SX0 + 0.15, ix1, iz0, OZ - PT / 2, 3.0, M);

  return {
    group: g, boxes, items, load: (t) => { for (const f of later.splice(0)) f(t); },
    leaf: { x: SD[0], z: Z1 - T / 2, width: SD[1] - SD[0] }, officeLeaf: { x: OD[0], z: OZ, width: OD[1] - OD[0] },
    pc: of.pc, inside: { x0: ix0, x1: ix1, z0: iz0, z1: iz1 }, door: { x: (SD[0] + SD[1]) / 2, z: Z1 + 1.2 }, size: { w: W, d: D },
    clerk: { x: (cx0 + cx1) / 2, z: cz - 0.8, yaw: 0 }, bay: { x: (TX1 + MID) / 2, z: 1.0 },
    lights: [{ x: -9, z: 0, c: '#eef6ff' }, { x: 9.5, z: 0.5, c: '#fff1dc' }],
  };
}
