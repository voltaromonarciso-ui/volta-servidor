// La Mansión: villa mediterránea de dos plantas con dos alas, tejados de teja a cuatro aguas,
// pórtico de columnas con balcón, contraventanas, sillares en las esquinas, cornisas, chimenea,
// fuente con estatua delante y piscina con terraza detrás.
// Por dentro (muebles fotoescaneados de Poly Haven, CC0):
//   planta baja — recibidor con escalera y lámpara de araña, comedor, salón en el ala izquierda
//                 (chimenea, sofás Chesterfield), bar para las fiestas, cocina y despacho en el
//                 ala derecha (mesa para los socios y caja fuerte grande);
//   planta alta — galería sobre el recibidor con salida al balcón, dormitorio principal con cama
//                 de dosel y biblioteca.
// Coordenadas locales: fachada hacia +z; cuerpo central x −8..8, z −6.5..6.5; alas x ±8..±14,
// z −5.5..5.5; pórtico hasta z 9; jardín delantero hasta z 19; piscina detrás (z −10..−16).
// Las cajas de colisión van con nivel: 'down' sólo abajo, 'up' sólo arriba (como la
// entreplanta de los almacenes); sin nivel, de arriba abajo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat } from './buildingkit.js';
import { slab, GLASS } from './realbuilding.js';
import { dims } from './interior.js';
import { prop } from '../entities/realprops.js';

export const UP = 3.6;                      // suelo de la planta alta
const T = 0.3, PT = 0.18;
const CX = 8, CZ = 6.5, WX = 14, WZ = 5.5;  // cuerpo central y alas (medias medidas)
const TOP1 = 7.0, TOPW = 3.9;               // remate de los muros del cuerpo central y de las alas
const ci = { x0: -CX + T, x1: CX - T, z0: -CZ + T, z1: CZ - T };

const mats = new Map();
const mat = (k, o) => { if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(o)); return mats.get(k); };
const texs = new Map();
function canvasTex(key, w, h, draw) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texs.set(key, t);
  }
  return texs.get(key);
}
function rbox(g, m, w, h, d, x, y, z, r = 0.03) {
  const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99), m);
  o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
}
function cyl(g, m, rt, rb, h, x, y, z, s = 18) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }
function lathe(g, m, prof, x, y, z, seg = 28) { const o = new THREE.Mesh(new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(r, h)), seg), m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true; g.add(o); return o; }

// Mármol con vetas en baldosas de 1 m (planta baja) y suelo de agua para la piscina
const marble = () => mat('mMarmol', {
  roughness: 0.16, metalness: 0.05,
  map: canvasTex('mMarmol', 512, 512, (c, w) => {
    let s = 17; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
      c.fillStyle = (x + y) % 2 ? '#ebe6de' : '#f4f1eb'; c.fillRect(x * 256, y * 256, 256, 256);
      for (let k = 0; k < 7; k++) { c.strokeStyle = `rgba(110,100,95,${0.06 + R() * 0.12})`; c.lineWidth = 0.6 + R() * 2; c.beginPath(); c.moveTo(x * 256 + R() * 256, y * 256); c.bezierCurveTo(x * 256 + R() * 256, y * 256 + 80, x * 256 + R() * 256, y * 256 + 170, x * 256 + R() * 256, y * 256 + 256); c.stroke(); }
    }
    c.fillStyle = 'rgba(150,140,130,0.7)'; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, w); c.fillRect(0, 255, w, 2); c.fillRect(255, 0, 2, w);
  }),
});
const water = () => mat('mAgua', {
  color: '#ffffff', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.88,
  map: canvasTex('mAgua', 256, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#2aa6d6'); gr.addColorStop(1, '#1b7fb8'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.22)'; c.lineWidth = 2;
    for (let k = 0; k < 40; k++) { const x = (k * 53) % w, y = (k * 97) % h; c.beginPath(); c.moveTo(x, y); c.bezierCurveTo(x + 20, y - 10, x + 30, y + 12, x + 50, y); c.stroke(); }
  }),
});

// ---------- piezas de arquitectura ----------
// Muro con huecos a lo largo de x o de z, entre las alturas y0 e y1: deja trozos macizos
// alrededor de cada hueco; las ventanas llevan cristal y marco. holes: [[a, b, hy0, hy1, kind]]
// (hy relativas a y0). Las colisiones van aparte (boxes), con el nivel que se indique.
function wallAlong(g, m, axis, c0, c1, a0, a1, y0, y1, holes, frame) {
  const piece = (a, b, p, q) => (axis === 'x' ? slab(g, m, a, b, y0 + p, y0 + q, c0, c1) : slab(g, m, c0, c1, y0 + p, y0 + q, a, b));
  const H = y1 - y0;
  let a = a0;
  for (const [ha, hb, hy0, hy1, kind] of [...holes].sort((p, q) => p[0] - q[0])) {
    piece(a, ha, 0, H);
    if (hy0 > 0) piece(ha, hb, 0, hy0);
    piece(ha, hb, hy1, H);
    if (kind === 'win') {
      const at = (c0 + c1) / 2;
      const f = (p, q, s, t, th = 0.05) => (axis === 'x' ? slab(g, frame, p, q, y0 + s, y0 + t, at - th, at + th) : slab(g, frame, at - th, at + th, y0 + s, y0 + t, p, q));
      if (axis === 'x') slab(g, GLASS(), ha, hb, y0 + hy0, y0 + hy1, at - 0.015, at + 0.015); else slab(g, GLASS(), at - 0.015, at + 0.015, y0 + hy0, y0 + hy1, ha, hb);
      f(ha, hb, hy0, hy0 + 0.07); f(ha, hb, hy1 - 0.07, hy1); f(ha, ha + 0.07, hy0, hy1); f(hb - 0.07, hb, hy0, hy1);
      f((ha + hb) / 2 - 0.03, (ha + hb) / 2 + 0.03, hy0, hy1, 0.04);                                   // parteluz
      for (const t of [0.36, 0.7]) f(ha, hb, hy0 + (hy1 - hy0) * t - 0.02, hy0 + (hy1 - hy0) * t + 0.02, 0.035); // cuarterones
    }
    a = hb;
  }
  piece(a, a1, 0, H);
}
// Por fuera de cada ventana: alféizar y dintel de piedra con clave, y contraventanas abiertas.
// n = hacia dónde mira la fachada: '+z', '-z', '+x', '-x'; face = coordenada de la cara exterior
function dressWindow(g, n, face, a, b, y0, y1, M) {
  const s = n[0] === '+' ? 1 : -1, ax = n[1];
  const P = (p, q, yy0, yy1, d0, d1) => (ax === 'z' ? slab(g, M.stone, p, q, yy0, yy1, face + s * d0, face + s * d1) : slab(g, M.stone, face + s * d0, face + s * d1, yy0, yy1, p, q));
  const sh = (p, q, yy0, yy1, d0, d1, m) => (ax === 'z' ? slab(g, m, p, q, yy0, yy1, Math.min(face + s * d0, face + s * d1), Math.max(face + s * d0, face + s * d1)) : slab(g, m, Math.min(face + s * d0, face + s * d1), Math.max(face + s * d0, face + s * d1), yy0, yy1, p, q));
  const lo = (u, v, yy0, yy1, d0, d1) => P(Math.min(u, v), Math.max(u, v), yy0, yy1, Math.min(d0, d1), Math.max(d0, d1));
  if (y0 > 0.3) lo(a - 0.14, b + 0.14, y0 - 0.1, y0, 0, 0.16);   // alféizar
  lo(a - 0.18, b + 0.18, y1, y1 + 0.2, 0, 0.1);                   // dintel
  lo((a + b) / 2 - 0.13, (a + b) / 2 + 0.13, y1, y1 + 0.28, 0, 0.14); // clave
  const w = (b - a) / 2;
  for (const [p, q] of [[a - w - 0.06, a - 0.06], [b + 0.06, b + w + 0.06]]) {
    sh(p, q, y0, y1, 0.02, 0.07, M.shutter);
    for (let k = 1; k < 8; k++) sh(p + 0.04, q - 0.04, y0 + ((y1 - y0) * k) / 8 - 0.015, y0 + ((y1 - y0) * k) / 8 + 0.015, 0.07, 0.085, M.shutterDark); // lamas
  }
}
// Tejado a cuatro aguas (con alero): caballete a lo largo del lado largo
function hipRoof(g, m, x0, x1, z0, z1, y, rise, o = 0.5) {
  x0 -= o; x1 += o; z0 -= o; z1 += o;
  const alongX = x1 - x0 >= z1 - z0, half = (alongX ? z1 - z0 : x1 - x0) / 2, top = y + rise;
  const r0 = alongX ? [x0 + half, top, (z0 + z1) / 2] : [(x0 + x1) / 2, top, z0 + half];
  const r1 = alongX ? [x1 - half, top, (z0 + z1) / 2] : [(x0 + x1) / 2, top, z1 - half];
  const A = [x0, y, z0], B = [x1, y, z0], C = [x1, y, z1], D = [x0, y, z1];
  const tris = alongX ? [[D, C, r1], [D, r1, r0], [B, A, r0], [B, r0, r1], [A, D, r0], [C, B, r1]] : [[A, D, r0], [D, r1, r0], [C, B, r1], [B, r0, r1], [D, C, r1], [B, A, r0]];
  const pos = [], uv = [], tile = m.userData.tile || 2.5, slope = Math.hypot(half, rise) / half;
  for (const t of tris) for (const p of t) {
    pos.push(...p);
    // proyección en planta, estirada a lo largo de la pendiente para que la teja no se deforme
    uv.push(p[0] / tile, (p[2] * slope) / tile);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  geo.computeVertexNormals();
  const mesh = new THREE.Mesh(geo, m); mesh.castShadow = true; mesh.receiveShadow = true; g.add(mesh);
  return mesh;
}
// Balaustrada de piedra: balaustres torneados (instanciados), pasamanos y zócalo
const balG = new THREE.LatheGeometry([[0, 0], [0.07, 0], [0.07, 0.05], [0.045, 0.09], [0.07, 0.25], [0.075, 0.33], [0.04, 0.5], [0.06, 0.56], [0.06, 0.62], [0, 0.62]].map(([r, h]) => new THREE.Vector2(r, h)), 12);
function balustrade(g, m, axis, at, a0, a1, y) {
  const n = Math.max(2, Math.floor((a1 - a0) / 0.24)), inst = new THREE.InstancedMesh(balG, m, n), M4 = new THREE.Matrix4();
  for (let k = 0; k < n; k++) { const t = a0 + ((k + 0.5) * (a1 - a0)) / n; M4.makeTranslation(axis === 'x' ? t : at, y + 0.1, axis === 'x' ? at : t); inst.setMatrixAt(k, M4); }
  inst.castShadow = true; g.add(inst);
  const run = (yy0, yy1, th) => (axis === 'x' ? slab(g, m, a0, a1, y + yy0, y + yy1, at - th, at + th) : slab(g, m, at - th, at + th, y + yy0, y + yy1, a0, a1));
  run(0, 0.1, 0.12); run(0.72, 0.86, 0.14);
}

export function mansionHQ() {
  const g = new THREE.Group(), boxes = [], items = [], later = [];
  const box = (x0, x1, z0, z1, h, lv) => boxes.push(lv ? [x0, x1, z0, z1, h, lv] : [x0, x1, z0, z1, h]);
  // modelos de interior.js (kits de Kenney y Quaternius)
  const put = (name, x, y, z, ry = 0, s = 1, lv = 'down') => {
    const d = dims(name, s);
    if (!d[0]) return null;
    items.push({ name, x, y, z, ry, s });
    if (lv) { const turned = Math.abs(Math.sin(ry)) > 0.5, hw = (turned ? d[2] : d[0]) / 2, hd = (turned ? d[0] : d[2]) / 2; box(x - hw, x + hw, z - hd, z + hd, y + d[1] - (lv === 'up' ? UP : 0), lv); }
    return d;
  };
  // modelos fotoescaneados (realprops): se encajan a un alto; colisión con su planta
  const SZ = {
    Chandelier_01: [0.75, 0.8, 0.82], Chandelier_02: [0.68, 0.85, 0.62], Chandelier_03: [0.78, 1.04, 0.79], ClassicConsole_01: [1.54, 0.95, 0.59], ClassicNightstand_01: [0.57, 0.7, 0.42],
    CoffeeTable_01: [1.54, 0.52, 0.97], GothicBed_01: [1.49, 1.53, 2.04], GothicCabinet_01: [1.72, 2.36, 1.13], ArmChair_01: [0.85, 1.07, 0.77], Ottoman_01: [0.88, 0.62, 0.62], Sofa_01: [1.57, 0.8, 0.66],
    sofa_02: [1.81, 0.71, 0.82], sofa_03: [2.73, 1.12, 0.93], antique_ceramic_vase_01: [0.26, 0.44, 0.26], brass_vase_01: [0.23, 0.69, 0.23], ceramic_vase_01: [0.2, 0.4, 0.2], book_encyclopedia_set_01: [0.55, 0.24, 0.16],
    dining_chair_02: [0.43, 0.97, 0.58], dining_table: [2.26, 0.88, 1.39], fancy_picture_frame_01: [0.6, 0.46, 0.02], fancy_picture_frame_02: [0.66, 0.77, 0.09], hanging_picture_frame_01: [0.59, 0.84, 0.02],
    hanging_picture_frame_02: [0.75, 0.5, 0.03], marble_bust_01: [0.27, 0.51, 0.3], mantel_clock_01: [0.34, 0.16, 0.13], mid_century_lounge_chair: [1.01, 1.17, 1.19], ornate_mirror_01: [0.49, 0.74, 0.03],
    outdoor_table_chair_set_01: [0.78, 0.86, 1.83], potted_plant_01: [0.59, 1.35, 0.63], potted_plant_02: [0.7, 0.84, 0.66], potted_plant_04: [0.17, 0.27, 0.18], shrub_02: [6.57, 2.55, 2.54],
    side_table_tall_01: [0.38, 0.76, 0.38], vintage_grandfather_clock_01: [0.63, 2.19, 0.43], wine_bottles_01: [0.68, 0.33, 0.08], bar_chair_round_01: [0.48, 0.75, 0.49], coffee_table_round_01: [1.3, 0.49, 1.3],
    street_lamp_02: [0.39, 1.68, 0.81], brass_candleholders: [1.05, 0.84, 0.36], lantern_chandelier_01: [0.58, 0.88, 0.57],
    gothic_statue: [1.48, 1.74, 1.56], vintage_cabinet_01: [2.02, 2.24, 0.67], modern_wooden_cabinet: [2.44, 0.68, 0.52], throw_pillows_01: [1.02, 0.45, 0.63], mid_century_lounge_chair2: [1.01, 1.17, 1.19],
  };
  const P = (name, x, y, z, ry = 0, h = null, lv = 'down') => {
    const sz = SZ[name], s = h ? h / sz[1] : 1;
    later.push(() => prop(g, name, { x, y, z, ry, s })); // (se cargan al acercarse)
    if (lv) {
      const turned = Math.abs(Math.sin(ry)) > 0.5, hw = ((turned ? sz[2] : sz[0]) * s) / 2, hd = ((turned ? sz[0] : sz[2]) * s) / 2;
      box(x - hw, x + hw, z - hd, z + hd, y + sz[1] * s - (lv === 'up' ? UP : 0), lv);
    }
    return s;
  };
  const hang = (name, x, z, h, ceil) => P(name, x, ceil - h, z, 0, h, null); // lámparas colgadas del techo

  // ---------------- materiales ----------------
  const M = {
    stucco: pbrMat('beige', '#f3e7d3'), stone: pbrMat('hormigon', '#e6dccb'), tiles: pbrMat('tejas', '#c9754e'),
    inner: pbrMat('claro', '#f5ecdd'), wood: pbrMat('madera', '#7a4b2c'),
    shutter: mat('mPersiana', { color: '#55705e', roughness: 0.7 }), shutterDark: mat('mPersianaLama', { color: '#46604f', roughness: 0.75 }),
    frame: mat('mMarco', { color: '#f2efe8', roughness: 0.45 }), trim: mat('mMoldura', { color: '#fbf7ef', roughness: 0.6 }),
    walnut: mat('mNogal', { color: '#3b2518', roughness: 0.45 }), gold: mat('mOro', { color: '#c9a24a', roughness: 0.25, metalness: 0.9 }),
    lamp: mat('mFoco', { color: '#fff4dc', emissive: '#ffd9a0', emissiveIntensity: 1.6 }), iron: mat('mHierro', { color: '#1d1f22', roughness: 0.45, metalness: 0.7 }),
  };

  // ======================================================================
  //  FUERA
  // ======================================================================
  // --- cuerpo central: dos plantas ---
  const winF = (a, b) => [a, b, 0.8, 2.85, 'win'], winU = (a, b) => [a, b, 0.75, 2.6, 'win'];
  const frontG = [winF(-6.8, -5.2), winF(-4.2, -2.8), [-0.95, 0.95, 0, 2.75, 'door'], winF(2.8, 4.2), winF(5.2, 6.8)];
  const frontU = [winU(-6.8, -5.2), winU(-4.2, -2.8), [-0.8, 0.8, 0, 2.5, 'door'], winU(2.8, 4.2), winU(5.2, 6.8)];
  const backG = [winF(-6.8, -4.2), winF(3.4, 6.6)], backU = [winU(-6.8, -5.2), winU(-4.4, -3.2), winU(3.2, 4.4), winU(5.2, 6.8)];
  wallAlong(g, M.stucco, 'x', CZ - T, CZ, -CX, CX, 0, UP, frontG, M.frame);
  wallAlong(g, M.stucco, 'x', CZ - T, CZ, -CX, CX, UP, TOP1, frontU, M.frame);
  wallAlong(g, M.stucco, 'x', -CZ, -CZ + T, -CX, CX, 0, UP, backG, M.frame);
  wallAlong(g, M.stucco, 'x', -CZ, -CZ + T, -CX, CX, UP, TOP1, backU, M.frame);
  // costados del cuerpo central: abajo dan a las alas (paso en el centro), arriba ventanas
  for (const s of [-1, 1]) {
    const c0 = s < 0 ? -CX : CX - T, c1 = c0 + T;
    wallAlong(g, M.stucco, 'z', c0, c1, -CZ, CZ, 0, UP, [[-1.0, 1.0, 0, 2.6, 'door']], M.frame);
    wallAlong(g, M.stucco, 'z', c0, c1, -CZ, CZ, UP, TOP1, [winU(-3.6, -2.2), winU(2.2, 3.6)], M.frame);
    for (const [a, b] of [[-3.6, -2.2], [2.2, 3.6]]) dressWindow(g, s < 0 ? '-x' : '+x', s < 0 ? -CX : CX, a, b, UP + 0.75, UP + 2.6, M);
  }
  for (const [a, b, , , k] of frontG) if (k === 'win') dressWindow(g, '+z', CZ, a, b, 0.8, 2.85, M);
  for (const [a, b, , , k] of frontU) if (k === 'win') dressWindow(g, '+z', CZ, a, b, UP + 0.75, UP + 2.6, M);
  for (const [a, b] of [[-6.8, -4.2], [3.4, 6.6]]) dressWindow(g, '-z', -CZ, a, b, 0.8, 2.85, M);
  for (const [a, b, , , k] of backU) if (k === 'win') dressWindow(g, '-z', -CZ, a, b, UP + 0.75, UP + 2.6, M);
  // muros del cuerpo central: colisión de arriba abajo, con el paso de la puerta (y del balcón)
  box(-CX, -0.95, CZ - T, CZ, TOP1); box(0.95, CX, CZ - T, CZ, TOP1);
  box(-CX, CX, -CZ, -CZ + T, TOP1);
  for (const s of [-1, 1]) { const c0 = s < 0 ? -CX : CX - T; box(c0, c0 + T, -CZ, -1.0, TOP1); box(c0, c0 + T, 1.0, CZ, TOP1); box(c0, c0 + T, -1.0, 1.0, TOP1 - UP, 'up'); }
  // --- alas (una planta) ---
  for (const s of [-1, 1]) {
    const xa = s < 0 ? -WX : CX, xb = s < 0 ? -CX : WX;               // de fuera a dentro
    const fw = s < 0 ? [winF(-12.6, -11.0), winF(-10.2, -8.6)] : [winF(8.6, 10.2), winF(11.0, 12.6)];
    const bw = s < 0 ? [[-12.9, -9.1, 0.12, 2.9, 'win']] : [winF(9.4, 12.6)];
    wallAlong(g, M.stucco, 'x', WZ - T, WZ, xa, xb, 0, TOPW, fw, M.frame);
    wallAlong(g, M.stucco, 'x', -WZ, -WZ + T, xa, xb, 0, TOPW, bw, M.frame);
    const ex0 = s < 0 ? -WX : WX - T;
    wallAlong(g, M.stucco, 'z', ex0, ex0 + T, -WZ, WZ, 0, TOPW, [winF(-2.6, -0.8), winF(0.8, 2.6)], M.frame);
    for (const [a, b] of fw.map((h) => [h[0], h[1]])) dressWindow(g, '+z', WZ, a, b, 0.8, 2.85, M);
    for (const [a, b] of [[-2.6, -0.8], [0.8, 2.6]]) dressWindow(g, s < 0 ? '-x' : '+x', s < 0 ? -WX : WX, a, b, 0.8, 2.85, M);
    if (s > 0) dressWindow(g, '-z', -WZ, 9.4, 12.6, 0.8, 2.85, M);
    box(xa, xb, WZ - T, WZ, TOPW); box(xa, xb, -WZ, -WZ + T, TOPW); box(ex0, ex0 + T, -WZ, WZ, TOPW);
    slab(g, M.stucco, Math.min(xa, xb), Math.max(xa, xb), TOPW - 0.4, TOPW, -WZ, WZ);  // forjado del ala
    // sillares en las esquinas de las alas
    for (const zc of [WZ, -WZ]) for (let k = 0, y = 0.5; y < TOPW - 0.3; k++, y += 0.42) {
      const L = k % 2 ? 0.5 : 0.32, xo = s < 0 ? -WX : WX;
      slab(g, M.stone, s < 0 ? xo - 0.04 : xo - L, s < 0 ? xo + L : xo + 0.04, y, y + 0.36, zc > 0 ? zc - 0.02 : zc - 0.04, zc > 0 ? zc + 0.04 : zc + 0.02);
    }
    slab(g, M.trim, Math.min(xa, xb) - (s < 0 ? 0.25 : 0), Math.max(xa, xb) + (s > 0 ? 0.25 : 0), TOPW - 0.05, TOPW + 0.18, -WZ - 0.25, WZ + 0.25); // cornisa
    hipRoof(g, M.tiles, Math.min(xa, xb), Math.max(xa, xb), -WZ, WZ, TOPW + 0.18, 1.6, 0.45);
  }
  // --- zócalo, impostas, cornisas y sillares del cuerpo central ---
  slab(g, M.stone, -WX - 0.06, WX + 0.06, 0, 0.5, WZ, WZ + 0.06); slab(g, M.stone, -CX - 0.06, CX + 0.06, 0, 0.5, CZ, CZ + 0.06);
  slab(g, M.stone, -WX - 0.06, WX + 0.06, 0, 0.5, -WZ - 0.06, -WZ); slab(g, M.stone, -CX - 0.06, CX + 0.06, 0, 0.5, -CZ - 0.06, -CZ);
  for (const z of [CZ, -CZ]) slab(g, M.trim, -CX - 0.12, CX + 0.12, UP - 0.2, UP + 0.02, z > 0 ? z : z - 0.12, z > 0 ? z + 0.12 : z);   // imposta entre plantas
  slab(g, M.trim, -CX - 0.3, CX + 0.3, TOP1 - 0.06, TOP1 + 0.12, -CZ - 0.3, CZ + 0.3);
  slab(g, M.trim, -CX - 0.42, CX + 0.42, TOP1 + 0.12, TOP1 + 0.24, -CZ - 0.42, CZ + 0.42);
  for (const xs of [-1, 1]) for (const zs of [-1, 1]) for (let k = 0, y = 0.5; y < TOP1 - 0.4; k++, y += 0.42) {
    const L = k % 2 ? 0.55 : 0.35, xo = xs * CX, zo = zs * CZ;
    slab(g, M.stone, xs < 0 ? xo - 0.04 : xo - L, xs < 0 ? xo + L : xo + 0.04, y, y + 0.36, zs > 0 ? zo - 0.02 : zo - 0.04, zs > 0 ? zo + 0.04 : zo + 0.02);
    slab(g, M.stone, xs < 0 ? xo - 0.04 : xo - 0.02, xs < 0 ? xo + 0.02 : xo + 0.04, y, y + 0.36, zs > 0 ? zo - (k % 2 ? 0.35 : 0.55) : zo, zs > 0 ? zo : zo + (k % 2 ? 0.35 : 0.55));
  }
  slab(g, M.stucco, -CX, CX, UP - 0.2, UP, -CZ, CZ);   // forjado entre plantas (por dentro va tapado)
  slab(g, M.stucco, -CX, CX, TOP1 - 0.3, TOP1, -CZ, CZ);
  hipRoof(g, M.tiles, -CX, CX, -CZ, CZ, TOP1 + 0.24, 2.6, 0.55);
  // chimenea
  slab(g, M.stucco, -5.6, -4.6, TOP1, TOP1 + 3.3, -2.4, -1.5); slab(g, M.trim, -5.75, -4.45, TOP1 + 3.3, TOP1 + 3.45, -2.55, -1.35);
  for (const x of [-5.35, -4.85]) cyl(g, M.iron, 0.12, 0.12, 0.35, x, TOP1 + 3.6, -1.95, 10);
  // --- pórtico: escalinata, cuatro columnas toscanas y balcón con balaustrada ---
  const PX = 3.6, PZ = 9.0;
  slab(g, marble(), -PX, PX, 0, 0.42, CZ, PZ);
  for (let k = 0; k < 3; k++) slab(g, M.stone, -PX + 0.5 + k * 0.25, PX - 0.5 - k * 0.25, 0, 0.42 - k * 0.14, PZ + 0.36 * (2 - k), PZ + 0.36 * (3 - k));
  for (const x of [-3.2, -1.2, 1.2, 3.2]) {
    lathe(g, M.trim, [[0, 0], [0.32, 0], [0.32, 0.12], [0.26, 0.18], [0.24, 0.26], [0.22, UP - 0.9], [0.24, UP - 0.78], [0.3, UP - 0.7], [0.3, UP - 0.62], [0, UP - 0.62]], x, 0.42, PZ - 0.45, 24);
    box(x - 0.3, x + 0.3, PZ - 0.75, PZ - 0.15, UP);
  }
  slab(g, M.trim, -PX - 0.1, PX + 0.1, UP - 0.25, UP, CZ, PZ + 0.1);                // arquitrabe y suelo del balcón
  slab(g, marble(), -PX, PX, UP - 0.02, UP + 0.02, CZ, PZ);
  for (let x = -PX + 0.7; x < PX; x += 1.2) slab(g, M.lamp, x - 0.2, x + 0.2, UP - 0.27, UP - 0.25, PZ - 1.5, PZ - 1.2);
  balustrade(g, M.trim, 'x', PZ - 0.12, -PX + 0.1, PX - 0.1, UP);
  balustrade(g, M.trim, 'z', -PX + 0.12, CZ + 0.1, PZ - 0.1, UP); balustrade(g, M.trim, 'z', PX - 0.12, CZ + 0.1, PZ - 0.1, UP);
  box(-PX, PX, PZ - 0.25, PZ, 1.0, 'up'); box(-PX, -PX + 0.25, CZ, PZ, 1.0, 'up'); box(PX - 0.25, PX, CZ, PZ, 1.0, 'up');
  // puerta de la calle: marco de nogal, faroles a los lados y un escudo encima
  slab(g, M.walnut, -1.1, -0.95, 0, 2.95, CZ - 0.02, CZ + 0.1); slab(g, M.walnut, 0.95, 1.1, 0, 2.95, CZ - 0.02, CZ + 0.1); slab(g, M.walnut, -1.1, 1.1, 2.75, 2.95, CZ - 0.02, CZ + 0.1);
  for (const x of [-1.7, 1.7]) P('street_lamp_02', x, 1.45, CZ + 0.25, Math.PI, 0.95, null);
  lathe(g, M.stone, [[0, 0], [0.4, 0], [0.42, 0.06], [0.42, 0.5], [0.3, 0.62], [0, 0.62]], 0, 3.05, CZ + 0.02, 6).rotation.x = Math.PI / 2;
  // --- jardín delantero: camino de piedra, fuente con estatua, setos, olivos y macetones ---
  slab(g, M.stone, -1.5, 1.5, 0, 0.04, PZ + 1.1, 19);
  const FZ = 14.6;
  lathe(g, M.stone, [[0, 0], [2.0, 0], [2.05, 0.12], [2.05, 0.55], [1.85, 0.6], [1.8, 0.18], [0, 0.18]], 0, 0, FZ, 40);
  const pond = new THREE.Mesh(new THREE.CircleGeometry(1.8, 36), water()); pond.rotation.x = -Math.PI / 2; pond.position.set(0, 0.45, FZ); g.add(pond);
  lathe(g, M.stone, [[0, 0], [0.45, 0], [0.32, 0.25], [0.28, 0.8], [0.9, 0.95], [0.95, 1.05], [0.3, 1.1], [0.32, 1.25], [0, 1.25]], 0, 0.18, FZ, 28);
  P('gothic_statue', 0, 1.43, FZ, Math.PI, 1.6, null);
  box(-2.05, 2.05, FZ - 2.05, FZ + 2.05, 1.2);
  for (const s of [-1, 1]) {
    P('shrub_02', s * 6.2, 0, CZ + 1.4, 0, 1.0, null);
    P('shrub_02', s * 4.0, 0, 18.2, 0, 0.9, null);
    P('potted_plant_01', s * 2.4, 0.42, PZ + 0.2, 0, 1.2);
  }
  // --- detrás: terraza de piedra y piscina con borde, mesas y olivo ---
  slab(g, M.stone, -11, 11, 0, 0.06, -17.5, -CZ);
  const POX = 6.5, PZ0 = -15.8, PZ1 = -9.8;
  for (const [x0, x1, z0, z1] of [[-POX - 0.4, POX + 0.4, PZ0 - 0.4, PZ0], [-POX - 0.4, POX + 0.4, PZ1, PZ1 + 0.4], [-POX - 0.4, -POX, PZ0, PZ1], [POX, POX + 0.4, PZ0, PZ1]]) { slab(g, marble(), x0, x1, 0, 0.2, z0, z1); box(x0, x1, z0, z1, 0.25); }
  const pool = new THREE.Mesh(new THREE.PlaneGeometry(POX * 2, PZ1 - PZ0), water()); pool.material.map.repeat.set(3, 1.5); pool.rotation.x = -Math.PI / 2; pool.position.set(0, 0.12, (PZ0 + PZ1) / 2); g.add(pool);
  slab(g, mat('mFondoPiscina', { color: '#6fc3e0', roughness: 0.4 }), -POX, POX, 0.06, 0.08, PZ0, PZ1);
  box(-POX, POX, PZ0, PZ1, 0.6);
  for (const x of [-9, 9]) P('outdoor_table_chair_set_01', x, 0.06, -12.8, Math.PI / 2, 0.86);
  for (const x of [-2.5, 2.5]) P('potted_plant_02', x, 0.06, -CZ - 0.8, 0, 0.9);

  // ======================================================================
  //  DENTRO — planta baja
  // ======================================================================
  const marbleFloor = (x0, x1, z0, z1) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), marble()); m.material.map.repeat.set(4, 4); m.rotation.x = -Math.PI / 2; m.position.set((x0 + x1) / 2, 0.02, (z0 + z1) / 2); m.receiveShadow = true; g.add(m); };
  marbleFloor(ci.x0, ci.x1, ci.z0, ci.z1);
  marbleFloor(-WX + T, -CX, -WZ + T, WZ - T); marbleFloor(CX, WX - T, -WZ + T, WZ - T);
  slab(g, M.wood, CX + 0.02, WX - T, 0.02, 0.04, -WZ + T, WZ - T);                   // parqué en el despacho
  const ceil = mat('mTecho', { color: '#fbf8f2', roughness: 0.9 });
  slab(g, ceil, ci.x0, ci.x1, UP - 0.22, UP - 0.2, ci.z0, ci.z1);
  slab(g, ceil, -WX + T, -CX, TOPW - 0.42, TOPW - 0.4, -WZ + T, WZ - T); slab(g, ceil, CX, WX - T, TOPW - 0.42, TOPW - 0.4, -WZ + T, WZ - T);
  // forros de dentro y friso de madera noble hasta 1 m
  const liner = (x0, x1, y0, y1, z0, z1) => slab(g, M.inner, x0, x1, y0, y1, z0, z1);
  const wain = (x0, x1, y0, z0, z1) => { slab(g, M.walnut, x0, x1, y0, y0 + 1.0, z0, z1); slab(g, M.gold, x0, x1, y0 + 1.0, y0 + 1.03, z0, z1); };
  const ROOMH = UP - 0.22;
  for (const [x0, x1, z0, z1] of [[ci.x0, ci.x1, ci.z1 - 0.02, ci.z1], [ci.x0, ci.x1, ci.z0, ci.z0 + 0.02]]) { liner(x0, x1, 0, ROOMH, z0, z1); wain(x0, x1, 0, z0 + (z0 > 0 ? -0.01 : 0), z1 + (z0 > 0 ? 0 : 0.01)); }
  // tabiques de la planta baja (con sus pasos)
  const part = (axis, c, a0, a1, holes, y0, y1, lv) => {
    wallAlong(g, M.inner, axis, c - PT / 2, c + PT / 2, a0, a1, y0, y1, holes, M.frame);
    const H = y1 - y0 + (lv === 'up' ? 0.4 : 0);
    let a = a0;
    for (const [ha, hb] of [...holes].sort((p, q) => p[0] - q[0])) { if (ha > a) box(axis === 'x' ? a : c - PT / 2, axis === 'x' ? ha : c + PT / 2, axis === 'x' ? c - PT / 2 : a, axis === 'x' ? c + PT / 2 : ha, H, lv); a = hb; }
    if (a1 > a) box(axis === 'x' ? a : c - PT / 2, axis === 'x' ? a1 : c + PT / 2, axis === 'x' ? c - PT / 2 : a, axis === 'x' ? c + PT / 2 : a1, H, lv);
    for (const side of [-1, 1]) (axis === 'x' ? slab(g, M.walnut, a0, a1, y0, y0 + 0.14, c + side * (PT / 2 + 0.01) - 0.01, c + side * (PT / 2 + 0.01) + 0.01) : slab(g, M.walnut, c + side * (PT / 2 + 0.01) - 0.01, c + side * (PT / 2 + 0.01) + 0.01, y0, y0 + 0.14, a0, a1)); // rodapié
  };
  part('z', -3, ci.z0, ci.z1, [[0.8, 2.6, 0, 2.6, 'door']], 0, ROOMH, 'down');          // recibidor | comedor
  part('z', 3, ci.z0, ci.z1, [[1.6, 3.4, 0, 2.6, 'door']], 0, ROOMH, 'down');           // recibidor | bar
  part('x', 0, 3 + PT / 2, ci.x1, [[4.4, 5.6, 0, 2.4, 'door']], 0, ROOMH, 'down');      // bar | cocina
  // cornisa de escayola en el techo de las salas grandes
  for (const [x0, x1, z0, z1] of [[-WX + T, -CX, -WZ + T, WZ - T], [ci.x0, -3, ci.z0, ci.z1], [-3, 3, ci.z0, ci.z1]]) {
    slab(g, M.trim, x0, x1, ROOMH - 0.14, ROOMH, z0, z0 + 0.1); slab(g, M.trim, x0, x1, ROOMH - 0.14, ROOMH, z1 - 0.1, z1);
  }
  const L1 = (x, z, ceilY = ROOMH) => cyl(g, M.lamp, 0.08, 0.08, 0.02, x, ceilY - 0.01, z, 14);

  // --- recibidor y escalera ---
  // escalera recta pegada al fondo: sube hacia +x desde x −2.6 (abajo) hasta x 2.4 (arriba)
  const SX0 = -2.6, SX1 = 2.4, SZ0 = ci.z0, SZ1 = ci.z0 + 1.25, N = 18, run = (SX1 - SX0) / N;
  for (let i = 0; i < N; i++) {
    const y = ((i + 1) * UP) / N, x = SX0 + i * run;
    slab(g, marble(), x, x + run + 0.03, y - 0.05, y, SZ0, SZ1);
    slab(g, M.walnut, x, x + 0.02, y - UP / N, y - 0.05, SZ0, SZ1);           // tabica
    slab(g, mat('mAlfombraEsc', { color: '#7a1f2a', roughness: 0.9 }), x + 0.02, x + run, y + 0.001, y + 0.01, SZ0 + 0.25, SZ1 - 0.25); // alfombra roja
  }
  // zanca de abajo y barandilla de hierro con pasamanos de nogal (inclinadas)
  const slope = new THREE.Group(); slope.position.set(SX0, 0, 0); slope.rotation.z = Math.atan2(UP, SX1 - SX0); g.add(slope);
  const SL = Math.hypot(UP, SX1 - SX0);
  slab(slope, M.walnut, 0, SL, -0.3, 0.02, SZ1 - 0.05, SZ1 + 0.03);
  slab(slope, M.walnut, 0, SL, 0.92, 0.98, SZ1 - 0.02, SZ1 + 0.05);
  for (let k = 0; k <= 12; k++) { const x = SX0 + ((SX1 - SX0) * k) / 12; slab(g, M.iron, x - 0.015, x + 0.015, (UP * k) / 12, (UP * k) / 12 + 0.95, SZ1, SZ1 + 0.03); }
  box(SX0 + 1.2, SX1, SZ0, SZ1 + 0.05, UP - 0.25, 'low');                          // debajo de la escalera no se pasa
  box(SX0, SX1, SZ1, SZ1 + 0.08, 1.1);                                                // barandilla de la escalera
  const stairs = { x0: SX0, x1: SX1, z0: SZ0, z1: SZ1, h: (lx) => Math.max(0, Math.min(UP, ((lx - SX0) / (SX1 - SX0)) * UP)) };
  // muebles del recibidor
  hang('Chandelier_03', 0, 1.8, 1.3, ROOMH);
  P('ClassicConsole_01', 0.2, 0.02, -3.5, 0, 0.95);
  P('brass_candleholders', 0.2, 0.97, -3.55, 0, 0.6, null);
  P('ornate_mirror_01', 0.2, 1.35, -3.84, 0, 1.15, null);
  P('vintage_grandfather_clock_01', -2.55, 0.02, 4.6, Math.PI / 2, 2.2);
  P('side_table_tall_01', 2.5, 0.02, 4.9, 0, 0.9);
  P('marble_bust_01', 2.5, 0.92, 4.9, -Math.PI / 2, 0.55, null);
  P('potted_plant_01', -2.3, 0.02, ci.z1 - 0.5, 0, 1.4);
  P('antique_ceramic_vase_01', 2.55, 0.02, ci.z1 - 0.4, 0, 0.6);
  const runner = mat('mAlfombraRoja', { color: '#7a1f2a', roughness: 0.92, map: canvasTex('mAlfombra', 64, 256, (c, w, h) => { c.fillStyle = '#7a1f2a'; c.fillRect(0, 0, w, h); c.strokeStyle = '#c9a24a'; c.lineWidth = 3; c.strokeRect(5, 5, w - 10, h - 10); c.strokeStyle = 'rgba(201,162,74,0.5)'; for (let y = 30; y < h; y += 40) { c.beginPath(); c.moveTo(w / 2, y - 12); c.lineTo(w / 2 + 14, y); c.lineTo(w / 2, y + 12); c.lineTo(w / 2 - 14, y); c.closePath(); c.stroke(); } }) });
  slab(g, runner, -0.9, 0.9, 0.02, 0.035, -2.5, ci.z1 - 0.3);
  P('hanging_picture_frame_01', -2.88, 1.75, -2.2, Math.PI / 2, 1.1, null);
  P('hanging_picture_frame_01', 2.88, 1.75, -2.2, -Math.PI / 2, 1.1, null);

  // --- comedor ---
  const dx = (ci.x0 - 3) / 2 - 0.1, dz = -0.2;
  P('dining_table', dx, 0.02, dz, Math.PI / 2, 0.8);
  for (const k of [-1, 0, 1]) for (const s of [-1, 1]) P('dining_chair_02', dx + s * 0.95, 0.02, dz + k * 0.72, s > 0 ? -Math.PI / 2 : Math.PI / 2, 1.0, null);
  for (const k of [-0.6, 0.6]) cyl(g, mat('mPlato', { color: '#f6f6f2', roughness: 0.2 }), 0.14, 0.12, 0.02, dx, 0.84, dz + k, 18);
  P('brass_vase_01', dx, 0.82, dz, 0, 0.45, null);
  hang('Chandelier_01', dx, dz, 0.9, ROOMH);
  P('vintage_cabinet_01', dx, 0.02, ci.z0 + 0.4, 0, 2.1);
  P('wine_bottles_01', dx, 0.95, ci.z0 + 0.4, 0, 0.3, null);
  P('fancy_picture_frame_02', ci.x0 + 0.05, 1.7, dz, Math.PI / 2, 0.95, null);
  P('potted_plant_02', -3.5, 0.02, ci.z1 - 0.5, 0, 0.85);
  L1(dx, 3.5);

  // --- salón (ala izquierda) ---
  const lx0 = -WX + T, lx1 = -CX, lcx = (lx0 + lx1) / 2;
  wain(lx0, lx1, 0, WZ - T - 0.02, WZ - T); wain(lx0, lx1, 0, -WZ + T, -WZ + T + 0.02);
  slab(g, M.trim, lx0, lx1, TOPW - 0.56, TOPW - 0.42, -WZ + T, -WZ + T + 0.1); slab(g, M.trim, lx0, lx1, TOPW - 0.56, TOPW - 0.42, WZ - T - 0.1, WZ - T);
  put('luxhi/Fireplace', lx0 + 0.35, 0.02, 0, Math.PI / 2, 1.2);
  P('mantel_clock_01', lx0 + 0.3, 1.25, 0, Math.PI / 2, 0.2, null);
  P('fancy_picture_frame_01', lx0 + 0.04, 2.1, 0, Math.PI / 2, 0.95, null);
  put('luxhi/Carpet_Round', lcx + 0.4, 0.03, 0, 0, 3.2, null);
  P('sofa_03', lcx + 2.2, 0.02, 0, -Math.PI / 2, 1.05);
  P('ArmChair_01', lcx - 0.4, 0.02, 2.0, Math.PI * 0.85, 1.05);
  P('ArmChair_01', lcx - 0.4, 0.02, -2.0, Math.PI * 0.15, 1.05);
  P('CoffeeTable_01', lcx + 0.6, 0.02, 0, Math.PI / 2, 0.5);
  P('throw_pillows_01', lcx + 2.2, 0.5, 0, -Math.PI / 2, 0.4, null);
  P('ceramic_vase_01', lcx + 0.6, 0.52, 0.3, 0, 0.35, null);
  P('sofa_02', lcx, 0.02, -WZ + T + 0.55, 0, 0.75);
  P('Ottoman_01', lcx - 1.5, 0.02, -WZ + T + 1.5, 0.4, 0.5);
  P('potted_plant_01', lx0 + 0.5, 0.02, WZ - T - 0.5, 0, 1.4);
  P('potted_plant_01', lx0 + 0.5, 0.02, -WZ + T + 0.5, 0, 1.4);
  P('modern_wooden_cabinet', lcx, 0.02, WZ - T - 0.3, Math.PI, 0.7);
  P('book_encyclopedia_set_01', lcx - 0.5, 0.72, WZ - T - 0.3, Math.PI, 0.24, null);
  P('antique_ceramic_vase_01', lcx + 0.6, 0.72, WZ - T - 0.3, 0, 0.42, null);
  hang('Chandelier_03', lcx + 0.4, 0, 1.1, TOPW - 0.42);

  // --- bar para las fiestas (delante a la derecha) ---
  const bx = 6.6, bz0 = 1.0, bz1 = 4.6;
  rbox(g, M.walnut, 0.65, 1.05, bz1 - bz0, bx, 0.53, (bz0 + bz1) / 2, 0.03);
  rbox(g, marble(), 0.8, 0.06, bz1 - bz0 + 0.1, bx, 1.08, (bz0 + bz1) / 2, 0.02);
  slab(g, M.gold, bx - 0.33, bx - 0.31, 0.1, 0.16, bz0, bz1);
  box(bx - 0.4, bx + 0.4, bz0, bz1, 1.1, 'down');
  P('wine_bottles_01', bx + 0.05, 1.11, 2.0, Math.PI / 2, 0.32, null);
  P('wine_bottles_01', bx + 0.05, 1.11, 3.4, Math.PI / 2, 0.32, null);
  // estantería de botellas detrás de la barra, con luz
  slab(g, M.walnut, ci.x1 - 0.35, ci.x1, 0, 2.6, bz0, bz1); box(ci.x1 - 0.35, ci.x1, bz0, bz1, 2.6, 'down');
  for (const y of [1.2, 1.7, 2.2]) { slab(g, M.gold, ci.x1 - 0.38, ci.x1 - 0.34, y - 0.02, y, bz0, bz1); for (let z = bz0 + 0.35; z < bz1; z += 1.1) P('wine_bottles_01', ci.x1 - 0.18, y, z, Math.PI / 2, 0.3, null); }
  slab(g, M.lamp, ci.x1 - 0.34, ci.x1 - 0.3, 2.45, 2.5, bz0, bz1);
  for (const z of [1.6, 2.8, 4.0]) P('bar_chair_round_01', bx - 0.85, 0.02, z, Math.PI / 2, 0.8, null);
  put('luxuf/Sofa_individual', 3.9, 0.02, 5.5, Math.PI, 0.6);
  P('coffee_table_round_01', 4.5, 0.02, 4.2, 0, 0.45);
  put('furniture/speakerSmall', 3.5, 0.02, 0.5, 0, 2.4);
  hang('Chandelier_02', 5.0, 3.0, 0.8, ROOMH);

  // --- cocina (detrás a la derecha): encimera en L de mármol con armarios de nogal ---
  const kx0 = 3 + PT / 2, kx1 = ci.x1, kz0 = ci.z0;
  rbox(g, M.walnut, kx1 - kx0 - 0.1, 0.88, 0.6, (kx0 + kx1) / 2, 0.44, kz0 + 0.3, 0.02);
  rbox(g, marble(), kx1 - kx0, 0.05, 0.66, (kx0 + kx1) / 2, 0.905, kz0 + 0.33, 0.01);
  for (let x = kx0 + 0.3; x < kx1 - 0.2; x += 0.6) { slab(g, M.gold, x - 0.1, x + 0.1, 0.72, 0.74, kz0 + 0.6, kz0 + 0.62); rbox(g, M.walnut, 0.56, 0.7, 0.34, x, 2.0, kz0 + 0.17, 0.02); }
  box(kx0, kx1, kz0, kz0 + 0.65, 0.95, 'down');
  rbox(g, mat('mAceroCocina', { color: '#c9cdd1', roughness: 0.25, metalness: 0.85 }), 0.6, 0.02, 0.4, kx0 + 2.0, 0.94, kz0 + 0.33, 0.01); // fregadero
  rbox(g, mat('mVitro', { color: '#111316', roughness: 0.1, metalness: 0.2 }), 0.6, 0.01, 0.5, kx0 + 3.4, 0.935, kz0 + 0.33, 0.01);   // placa
  rbox(g, M.walnut, 2.2, 0.88, 0.9, (kx0 + kx1) / 2, 0.44, -2.4, 0.02); rbox(g, marble(), 2.35, 0.05, 1.05, (kx0 + kx1) / 2, 0.905, -2.4, 0.01); // isla
  box((kx0 + kx1) / 2 - 1.15, (kx0 + kx1) / 2 + 1.15, -2.9, -1.9, 0.95, 'down');
  for (const x of [-0.6, 0.6]) P('bar_chair_round_01', (kx0 + kx1) / 2 + x, 0.02, -1.4, Math.PI, 0.8, null);
  P('ceramic_vase_01', (kx0 + kx1) / 2, 0.93, -2.4, 0, 0.3, null);
  L1(5.3, -2.5); L1(5.3, -4.8);

  // --- despacho (ala derecha) ---
  const ox0 = CX, ox1 = WX - T, ocx = (ox0 + ox1) / 2;
  wain(ox0, ox1, 0, WZ - T - 0.02, WZ - T); wain(ox0, ox1, 0, -WZ + T, -WZ + T + 0.02);
  put('luxhi/Carpet_1', ocx, 0.05, 0, Math.PI / 2, 2.4, null);
  const dk = put('luxuf/Desk', ocx + 0.6, 0.04, 0, -Math.PI / 2, 1.1);
  const dy = 0.04 + (dk ? dk[1] : 0.92);
  put('luxuf/OfficeChair', ocx + 1.5, 0.04, 0, -Math.PI / 2, 1.05, null);
  put('furniture/laptop', ocx + 0.6, dy, -0.3, -Math.PI / 2 + 0.3, 1, null);
  put('luxhi/Light_Desk', ocx + 0.6, dy, 0.55, -Math.PI / 2, 1.6, null);
  P('mid_century_lounge_chair', ocx - 0.9, 0.04, 0.9, Math.PI / 2 + 0.3, 1.05);
  P('mid_century_lounge_chair', ocx - 0.9, 0.04, -0.9, Math.PI / 2 - 0.3, 1.05);
  put('luxuf/Bookcase_Books', ox1 - 0.3, 0.04, -3.4, -Math.PI / 2, 0.66);
  put('luxuf/Bookcase_Books', ox1 - 0.3, 0.04, 3.4, -Math.PI / 2, 0.66);
  P('GothicCabinet_01', ocx, 0.04, -WZ + T + 0.6, 0, 2.2);
  P('potted_plant_02', ox0 + 0.5, 0.04, WZ - T - 0.5, 0, 0.9);
  hang('lantern_chandelier_01', ocx, 0, 0.9, TOPW - 0.42);
  // caja fuerte grande empotrada en la pared de delante
  const sfx = ocx + 1.3, sfz = WZ - T - 0.45;
  rbox(g, mat('mCajaFuerte', { color: '#2f3338', roughness: 0.35, metalness: 0.75 }), 0.9, 1.3, 0.8, sfx, 0.69, sfz, 0.05);
  const face = new THREE.Group(); face.position.set(sfx, 0.69, sfz - 0.41); face.rotation.y = Math.PI; g.add(face);
  rbox(face, mat('mCajaPuerta', { color: '#3c4148', roughness: 0.3, metalness: 0.8 }), 0.72, 1.1, 0.04, 0, 0, 0, 0.02);
  cyl(face, M.gold, 0.07, 0.07, 0.04, 0.15, 0.25, 0.04, 20).rotation.x = Math.PI / 2;
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; const sp = cyl(face, mat('mCromo', { color: '#dfe3e6', roughness: 0.15, metalness: 1 }), 0.012, 0.012, 0.26, 0.05 + Math.cos(a) * 0.06, -0.1 + Math.sin(a) * 0.06, 0.06, 8); sp.rotation.z = a + Math.PI / 2; }
  box(sfx - 0.47, sfx + 0.47, sfz - 0.42, sfz + 0.42, 1.35, 'down');

  // ======================================================================
  //  DENTRO — planta alta
  // ======================================================================
  const wood = (x0, x1, z0, z1) => slab(g, M.wood, x0, x1, UP - 0.02, UP, z0, z1);
  wood(ci.x0, SX0, ci.z0, ci.z1); wood(SX1, ci.x1, ci.z0, ci.z1); wood(SX0, SX1, SZ1, ci.z1);
  const floorsUp = [
    { x0: ci.x0, x1: SX0, z0: ci.z0, z1: ci.z1, h: () => UP }, { x0: SX1, x1: ci.x1, z0: ci.z0, z1: ci.z1, h: () => UP },
    { x0: SX0, x1: SX1, z0: SZ1, z1: ci.z1, h: () => UP }, { x0: -PX, x1: PX, z0: ci.z1, z1: PZ, h: () => UP },
    stairs,
  ];
  const U = UP, UH = TOP1 - 0.3;
  slab(g, ceil, ci.x0, ci.x1, UH - 0.02, UH, ci.z0, ci.z1);
  for (const [x0, x1, z0, z1] of [[ci.x0, ci.x1, ci.z1 - 0.02, ci.z1], [ci.x0, ci.x1, ci.z0, ci.z0 + 0.02], [ci.x0, ci.x0 + 0.02, ci.z0, ci.z1], [ci.x1 - 0.02, ci.x1, ci.z0, ci.z1]]) liner(x0, x1, U, UH, z0, z1);
  part('z', -3, ci.z0, ci.z1, [[1.8, 3.2, 0, 2.4, 'door']], U, UH, 'up');   // dormitorio
  part('z', 3, ci.z0, ci.z1, [[1.8, 3.2, 0, 2.4, 'door']], U, UH, 'up');    // biblioteca
  // barandilla del hueco de la escalera (hierro y nogal)
  const rail = (axis, at, a0, a1) => {
    if (axis === 'x') { slab(g, M.walnut, a0, a1, U + 0.92, U + 0.98, at - 0.035, at + 0.035); for (let t = a0; t <= a1; t += 0.14) slab(g, M.iron, t - 0.012, t + 0.012, U, U + 0.92, at - 0.012, at + 0.012); box(a0, a1, at - 0.06, at + 0.06, 1.1, 'up'); }
    else { slab(g, M.walnut, at - 0.035, at + 0.035, U + 0.92, U + 0.98, a0, a1); for (let t = a0; t <= a1; t += 0.14) slab(g, M.iron, at - 0.012, at + 0.012, U, U + 0.92, t - 0.012, t + 0.012); box(at - 0.06, at + 0.06, a0, a1, 1.1, 'up'); }
  };
  rail('x', SZ1 + 0.04, SX0, SX1 - 0.9); rail('z', SX0 - 0.04, ci.z0, SZ1 + 0.04);
  // galería: alfombra, consola, cuadros y la lámpara de araña del recibidor vista desde arriba
  slab(g, runner, -0.9, 0.9, U + 0.001, U + 0.012, SZ1 + 0.4, ci.z1 - 0.2);
  P('Sofa_01', 0, U, ci.z1 - 1.7, Math.PI, 0.8, 'up');
  P('hanging_picture_frame_02', -2.88, U + 1.6, 4.4, Math.PI / 2, 0.7, null);
  P('hanging_picture_frame_02', 2.88, U + 1.6, 4.4, -Math.PI / 2, 0.7, null);
  P('potted_plant_01', 2.3, U, -3.6, 0, 1.3, 'up');
  L1(0, 2, UH); L1(0, -2, UH);
  // --- dormitorio principal ---
  const rx = (ci.x0 - 3) / 2;
  P('GothicBed_01', rx, U, ci.z0 + 1.3, 0, 1.75, 'up');
  for (const s of [-1, 1]) { P('ClassicNightstand_01', rx + s * 1.35, U, ci.z0 + 0.3, 0, 0.62, 'up'); put('luxhi/Light_Desk', rx + s * 1.35, U + 0.62, ci.z0 + 0.3, 0, 1.4, null); }
  P('Ottoman_01', rx, U, ci.z0 + 3.0, 0, 0.45, 'up');
  P('GothicCabinet_01', ci.x0 + 0.65, U, 3.4, Math.PI / 2, 2.3, 'up');
  P('ArmChair_01', -3.9, U, 4.9, -Math.PI * 0.75, 1.0, 'up');
  P('side_table_tall_01', -4.9, U, ci.z1 - 0.4, 0, 0.75, 'up');
  P('ceramic_vase_01', -4.9, U + 0.75, ci.z1 - 0.4, 0, 0.35, null);
  P('fancy_picture_frame_02', ci.x0 + 0.05, U + 1.6, -1.2, Math.PI / 2, 0.85, null);
  put('luxhi/Carpet_1', rx, U + 0.01, ci.z0 + 2.0, 0, 2.0, null);
  hang('Chandelier_02', rx, 0, 0.85, UH);
  // --- biblioteca ---
  const lbx = (3 + ci.x1) / 2;
  put('luxuf/Bookcase_Books', ci.x1 - 0.3, U, -2.0, -Math.PI / 2, 0.66, 'up');
  put('luxuf/Bookcase_Books', ci.x1 - 0.3, U, 1.6, -Math.PI / 2, 0.66, 'up');
  put('luxhi/Bookshelf', lbx, U, ci.z0 + 0.3, 0, 1.2, 'up');
  P('mid_century_lounge_chair', lbx - 0.6, U, 0, Math.PI / 2 - 0.3, 1.05, 'up');
  P('Ottoman_01', lbx + 0.5, U, 0.4, 0, 0.45, 'up');
  P('side_table_tall_01', lbx - 0.4, U, -1.2, 0, 0.7, 'up');
  P('mantel_clock_01', lbx - 0.4, U + 0.7, -1.2, 0, 0.16, null);
  P('book_encyclopedia_set_01', lbx, U + 0.02, ci.z1 - 0.3, Math.PI, 0.24, null);
  P('potted_plant_02', ci.x1 - 0.5, U, ci.z1 - 0.5, 0, 0.9, 'up');
  hang('lantern_chandelier_01', lbx, 0, 0.8, UH);

  return {
    group: g, boxes, items, floors: floorsUp, load: () => { for (const f of later.splice(0)) f(); },
    door: { x: 0, z: PZ + 1.6 }, trees: [[-10.5, 13.5, 'tree'], [10.5, 13.5, 'tree'], [-17.5, 1, 'palm'], [17.5, 1, 'palm'], [-10, -16.5, 'tree'], [16, -14, 'palm'], [-16.5, 16, 'palm'], [16.5, 16, 'palm']],                         // delante de la escalinata
    leaf: { x: -0.95, z: CZ - T / 2, width: 1.9 },
    officeLeaf: { x: CX - T / 2, z: -1.0, width: 2.0 },
    inside: { x0: -WX + T, x1: WX - T, z0: -CZ + T, z1: CZ - T },
    entry: { x: 0, z: ci.z1 - 1.0 },
    bed: { x: rx, z: ci.z0 + 1.3, y: U }, safe: { x: sfx, z: sfz - 0.75 }, desk: { x: ocx + 0.6, z: 0 }, party: { x: bx - 0.7, z: (bz0 + bz1) / 2 },
    lights: { down: [{ x: 0, z: 0, c: '#ffe2b8' }, { x: lcx, z: 0, c: '#ffd9a8' }], up: [{ x: rx, z: 0, c: '#ffe2b8' }, { x: lbx, z: 0, c: '#ffe2b8' }] },
  };
}
