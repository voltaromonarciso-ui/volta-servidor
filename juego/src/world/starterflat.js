// Piso inicial: bloque de 4 plantas en los Apartamentos con portal, escalera y un estudio
// en la 1.ª planta (cama y armario, cocina americana con fregadero y nevera, baño con puerta
// y un hueco libre para las primeras mesas).
//
// Todo en coordenadas locales: frente hacia +z, origen en el centro de la planta y en el
// suelo. La planta (2D) es así (vista desde arriba, +z abajo):
//
//   x: -7 ─ -4.6 ─────────────────────────────── 7
//   z -6 ┌─ rellano ─┬─ cocina americana ──┬ baño ┐
//        │  (1.ª)   puerta                 │      │
//        │ escalera  │  isla      cama ventanas   │
//        │  sube ↑   │  hueco libre  armario      │
//   z 3  │ portal    ├──── (pared con el vecino) ─┤
//   z 6  └─ portal ──┴────────────────────────────┘
//
// El juego es 2D con alturas: la escalera y el piso son zonas de suelo elevado (floors) que
// el jugador pisa; debajo del piso no se puede llegar (está cerrado), así que las colisiones
// en planta sirven para las dos plantas.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat, plainMat, FRAME } from './buildingkit.js';
import { slab, windowAt, GLASS } from './realbuilding.js';

export const FL = 3.3;                  // altura de cada planta
const W2 = 7, D2 = 6, T = 0.3;          // media planta (14 × 12 m) y grueso de los muros
const FLOORS = 4, HT = FLOORS * FL;
const COL = { x0: -6.7, x1: -4.7 };     // franja del portal y la escalera
const PW = { x0: -4.7, x1: -4.5 };      // tabique entre la escalera y el piso
const ST = { z0: -2.5, z1: 3 };         // tramo de escalera (sube hacia -z)
const DOOR = { z0: -4.55, z1: -3.25 };  // puerta del piso, en el rellano
const FLAT = { x0: -4.5, x1: 6.7, z0: -5.7, z1: 2.8 };
const BATH = { x0: 4.3, x1: 6.7, z0: -5.7, z1: -3.0, d0: 4.8, d1: 5.6 };
const PORTAL = { x0: -6.35, x1: -5.05 };

const rb = new Map();
const rbox = (w, h, d, r) => { const k = [w, h, d, r].join(); if (!rb.has(k)) rb.set(k, new RoundedBoxGeometry(w, h, d, 2, r)); return rb.get(k); };
// (sin luces puntuales: cada una encarece el dibujo de todo el mapa; el interior se ve con un
// poco de brillo propio cálido en sus materiales)
const pm = (k, color, o = {}) => plainMat('piso-' + k, { color, roughness: 0.8, emissive: color, emissiveIntensity: 0.22, ...o });
function add(g, geo, mat, x, y, z, { rx = 0, ry = 0, rz = 0 } = {}) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
}
// caja redondeada apoyada: (x0..x1, y0..y1, z0..z1)
const rslab = (g, mat, x0, x1, y0, y1, z0, z1, r = 0.03) => add(g, rbox(x1 - x0, y1 - y0, z1 - z0, Math.min(r, (Math.min(x1 - x0, y1 - y0, z1 - z0) / 2) * 0.9)), mat, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2);
const cyl = (g, mat, x, y, z, r, h, n = 16, o) => add(g, new THREE.CylinderGeometry(r, r, h, n), mat, x, y, z, o);

// Muro con huecos: corre por `axis` ('x' o 'z') de a0 a a1, grueso t0..t1 en el otro eje,
// de y0 a y1. holes: [[a0, a1, y0, y1]].
function wall(g, mat, axis, a0, a1, t0, t1, y0, y1, holes = []) {
  const put = (a, b, ya, yb) => { if (b - a > 0.001 && yb - ya > 0.001) (axis === 'x' ? slab(g, mat, a, b, ya, yb, t0, t1) : slab(g, mat, t0, t1, ya, yb, a, b)); };
  const hs = [...holes].sort((p, q) => p[0] - q[0]);
  let a = a0;
  for (const [h0, h1, hy0, hy1] of hs) {
    put(a, h0, y0, y1);
    put(h0, h1, y0, hy0);
    put(h0, h1, hy1, y1);
    a = h1;
  }
  put(a, a1, y0, y1);
}

// Ventana de verdad (hueco en el muro): marco, cristal y alféizar por fuera y por dentro.
// axis/face/out: muro a lo largo de axis, cara exterior en `face`, normal exterior `out` (±1).
function realWindow(g, axis, c, w, y0, y1, face, out, stone) {
  const frame = FRAME(), h = y1 - y0, ym = (y0 + y1) / 2;
  const box = (a0, a1, ya, yb, n0, n1) => (axis === 'x' ? slab(g, frame, a0, a1, ya, yb, Math.min(n0, n1), Math.max(n0, n1)) : slab(g, frame, Math.min(n0, n1), Math.max(n0, n1), ya, yb, a0, a1));
  const n = (d) => face + out * d; // distancia hacia fuera desde la cara exterior
  box(c - w / 2, c + w / 2, y1 - 0.07, y1, n(-0.2), n(0.02));
  box(c - w / 2, c + w / 2, y0, y0 + 0.07, n(-0.2), n(0.02));
  box(c - w / 2, c - w / 2 + 0.07, y0, y1, n(-0.2), n(0.02));
  box(c + w / 2 - 0.07, c + w / 2, y0, y1, n(-0.2), n(0.02));
  box(c - 0.025, c + 0.025, y0, y1, n(-0.14), n(-0.08));      // parteluz
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.12, h - 0.12), GLASS());
  gl.position.set(axis === 'x' ? c : n(-0.11), ym, axis === 'x' ? n(-0.11) : c);
  gl.rotation.y = axis === 'x' ? 0 : Math.PI / 2;
  g.add(gl);
  // alféizar de piedra por fuera y vierteaguas por dentro
  if (axis === 'x') { slab(g, stone, c - w / 2 - 0.12, c + w / 2 + 0.12, y0 - 0.12, y0, Math.min(n(-0.05), n(0.22)), Math.max(n(-0.05), n(0.22))); slab(g, pm('alfeizar', '#e8e2d6'), c - w / 2, c + w / 2, y0 - 0.04, y0, Math.min(n(-0.3), n(-0.48)), Math.max(n(-0.3), n(-0.48))); }
  else { slab(g, stone, Math.min(n(-0.05), n(0.22)), Math.max(n(-0.05), n(0.22)), y0 - 0.12, y0, c - w / 2 - 0.12, c + w / 2 + 0.12); slab(g, pm('alfeizar', '#e8e2d6'), Math.min(n(-0.3), n(-0.48)), Math.max(n(-0.3), n(-0.48)), y0 - 0.04, y0, c - w / 2, c + w / 2); }
}

let woodTexC = null, tileTexC = null;
function floorTex(kind) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const x = c.getContext('2d');
  if (kind === 'wood') {
    for (let r = 0; r < 8; r++) {
      const off = (r % 2) * 96;
      for (let k = -1; k < 3; k++) {
        const l = 50 + ((r * 37 + k * 23) % 20);
        x.fillStyle = `hsl(32, ${26 + ((r + k) % 3) * 4}%, ${l + 4}%)`;
        x.fillRect(off + k * 192, r * 32, 190, 31);
        x.strokeStyle = 'rgba(70,40,20,0.12)';
        for (let s = 0; s < 4; s++) { x.beginPath(); x.moveTo(off + k * 192, r * 32 + 6 + s * 7); x.bezierCurveTo(off + k * 192 + 60, r * 32 + 3 + s * 7, off + k * 192 + 120, r * 32 + 10 + s * 7, off + k * 192 + 190, r * 32 + 6 + s * 7); x.stroke(); }
      }
      x.fillStyle = 'rgba(40,25,15,0.28)'; x.fillRect(0, r * 32 + 31, 256, 1);
      x.fillStyle = 'rgba(40,25,15,0.22)'; for (let k = -1; k < 3; k++) x.fillRect(off + k * 192 + 190, r * 32, 1, 31);
    }
  } else {
    x.fillStyle = '#d9dcdc'; x.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) { x.fillStyle = `hsl(195, 8%, ${84 + ((i * 3 + j) % 3)}%)`; x.fillRect(i * 64 + 2, j * 64 + 2, 60, 60); }
  }
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}
export const pisoWoodTex = () => (woodTexC ||= floorTex('wood'));
export const pisoTileTex = () => (tileTexC ||= floorTex('tile'));

export function starterFlat() {
  const g = new THREE.Group(), boxes = [];
  const outer = pbrMat('enfoscado', '#f1e2c8'), stone = pbrMat('blanco'), plinth = pbrMat('hormigon', '#8f8b86');
  const paint = pm('pintura', '#efe9df', { roughness: 0.95 }), lobby = pm('portal', '#e2d9c8', { roughness: 0.9 });
  const tiles = new THREE.MeshStandardMaterial({ map: pisoTileTex(), roughness: 0.35, emissive: '#ffffff', emissiveMap: pisoTileTex(), emissiveIntensity: 0.2 });
  const ceil = pm('techo', '#f6f3ee', { roughness: 1 });
  const sx = -W2, ex = W2, sz = -D2, ez = D2;

  // ---------------- volumen exterior ----------------
  // muros perimetrales por bandas (planta baja, 1.ª planta con huecos reales, resto)
  wall(g, outer, 'x', sx, ex, ez - T, ez, 0, FL, [[PORTAL.x0, PORTAL.x1, 0, 2.5]]);            // fachada: portal
  wall(g, outer, 'x', sx, ex, ez - T, ez, FL, HT);
  wall(g, outer, 'x', sx, ex, sz, sz + T, 0, FL);                                                 // trasera
  wall(g, outer, 'x', sx, ex, sz, sz + T, FL, 2 * FL, [[-1.6, -0.4, FL + 1.1, FL + 2.3]]);         // ventana de la cocina
  wall(g, outer, 'x', sx, ex, sz, sz + T, 2 * FL, HT);
  wall(g, outer, 'z', sz + T, ez - T, sx, sx + T, 0, HT);                                         // izquierda (escalera)
  wall(g, outer, 'z', sz + T, ez - T, ex - T, ex, 0, FL);                                         // derecha
  const RW = [[-1.8, -0.6], [0.4, 1.6]];
  wall(g, outer, 'z', sz + T, ez - T, ex - T, ex, FL, 2 * FL, RW.map(([a, b]) => [a, b, FL + 1.0, FL + 2.3]));
  wall(g, outer, 'z', sz + T, ez - T, ex - T, ex, 2 * FL, HT);
  boxes.push([sx, ex, sz, sz + T, HT], [sx, sx + T, sz, ez, HT], [ex - T, ex, sz, ez, HT], [sx, PORTAL.x0, ez - T, ez, HT], [PORTAL.x1, ex, ez - T, ez, HT]);
  // ventanas reales del piso
  realWindow(g, 'x', -1.0, 1.2, FL + 1.1, FL + 2.3, sz, -1, stone);
  for (const [a, b] of RW) realWindow(g, 'z', (a + b) / 2, b - a, FL + 1.0, FL + 2.3, ex, 1, stone);
  // zócalo, impostas, cornisa y peto
  for (const [x0, x1, z0, z1] of [[sx - 0.05, PORTAL.x0, ez - 0.02, ez + 0.05], [PORTAL.x1, ex + 0.05, ez - 0.02, ez + 0.05], [sx - 0.05, ex + 0.05, sz - 0.05, sz + 0.02], [sx - 0.05, sx + 0.02, sz, ez], [ex - 0.02, ex + 0.05, sz, ez]]) slab(g, plinth, x0, x1, 0, 0.5, z0, z1); // zócalo
  // impostas: solo una franja por fuera de los muros (no una losa: cortaría el hueco de la escalera)
  for (let f = 1; f < FLOORS; f++) {
    const y0 = f * FL - 0.14, y1 = f * FL, o = 0.06;
    slab(g, stone, sx - o, ex + o, y0, y1, ez - 0.02, ez + o);
    slab(g, stone, sx - o, ex + o, y0, y1, sz - o, sz + 0.02);
    slab(g, stone, sx - o, sx + 0.02, y0, y1, sz, ez);
    slab(g, stone, ex - 0.02, ex + o, y0, y1, sz, ez);
  }
  // cubierta (con el hueco de la claraboya sobre la escalera)
  const ring = (mat, y0, y1, o) => {
    slab(g, mat, PW.x0, ex + o, y0, y1, sz - o, ez + o);
    slab(g, mat, sx - o, COL.x0, y0, y1, sz - o, ez + o);
    slab(g, mat, COL.x0, PW.x0, y0, y1, sz - o, sz + T);
    slab(g, mat, COL.x0, PW.x0, y0, y1, ez - T, ez + o);
  };
  ring(stone, HT, HT + 0.35, 0.25);
  ring(outer, HT + 0.35, HT + 1.0, 0);
  ring(stone, HT + 1.0, HT + 1.12, 0.1);
  // claraboya: marco y cristal a cuatro aguas sobre el patio de la escalera
  const fr = FRAME(), cx = (COL.x0 + PW.x0) / 2, cz = (sz + T + ez - T) / 2, lx = PW.x0 - COL.x0, lz = ez - sz - 2 * T;
  for (const [x0, x1, z0, z1] of [[COL.x0, PW.x0, sz + T, sz + T + 0.08], [COL.x0, PW.x0, ez - T - 0.08, ez - T], [COL.x0, COL.x0 + 0.08, sz + T, ez - T], [PW.x0 - 0.08, PW.x0, sz + T, ez - T]]) slab(g, fr, x0, x1, HT + 1.12, HT + 1.3, z0, z1);
  for (let k = 1; k < 6; k++) slab(g, fr, COL.x0, PW.x0, HT + 1.12, HT + 1.4, sz + T + (k * lz) / 6 - 0.03, sz + T + (k * lz) / 6 + 0.03);
  const sky = new THREE.Mesh(new THREE.PlaneGeometry(lx, lz), GLASS());
  sky.rotation.x = -Math.PI / 2; sky.position.set(cx, HT + 1.3, cz); g.add(sky);
  slab(g, fr, cx - 0.03, cx + 0.03, HT + 1.3, HT + 1.42, sz + T, ez - T); // cumbrera
  slab(g, plainMat('maquina', { color: '#a7adb3', roughness: 0.45, metalness: 0.5 }), 1, 2.6, HT + 1.0, HT + 1.9, -3, -1.8);
  // ventanas falsas (con interior iluminado) donde no hay estancia de verdad
  const fake = (x, y, z, rot = 0, w = 1.3, h = 1.5) => windowAt(g, x, y, z, w, h, { stone, kind: 'casa', rot });
  for (let f = 0; f < FLOORS; f++) {
    const y = f * FL + (f ? FL * 0.55 : 1.7);
    for (const x of [-2.6, 0.4, 3.4, 5.6]) fake(x, y, ez);                    // fachada (vecinos)
    if (f >= 2) fake(-5.7, y, ez);                                                                  // sobre el portal
    if (f !== 1) for (const z of [-1.2, 1.0, 3.6]) windowAt(g, ex, y, z, 1.2, 1.5, { stone, kind: 'casa', rot: Math.PI / 2 });
    if (f !== 1) for (const x of [-3, 1, 4.6]) windowAt(g, x, y, sz, 1.2, 1.5, { stone, kind: 'casa', rot: Math.PI });
    if (f === 1) windowAt(g, ex, y, 3.9, 1.2, 1.5, { stone, kind: 'casa', rot: Math.PI / 2 });
    if (f >= 1) for (const z of [-3, 2]) windowAt(g, sx, y, z, 1.0, 1.3, { stone, kind: 'casa', rot: -Math.PI / 2 });
    // balcones en la fachada de las plantas altas
    if (f >= 2) for (const x of [0.4, 3.4]) {
      slab(g, stone, x - 1.1, x + 1.1, f * FL - 0.05, f * FL + 0.1, ez, ez + 0.9);
      const rail = pm('barandilla', '#2f3337', { roughness: 0.5, metalness: 0.6 });
      slab(g, rail, x - 1.1, x + 1.1, f * FL + 0.95, f * FL + 1.0, ez + 0.85, ez + 0.9);
      for (let k = 0; k <= 10; k++) slab(g, rail, x - 1.1 + k * 0.22 - 0.012, x - 1.1 + k * 0.22 + 0.012, f * FL + 0.1, f * FL + 0.95, ez + 0.86, ez + 0.89);
    }
  }
  // portal: marco de piedra, marquesina, número, timbres y escalón
  slab(g, stone, PORTAL.x0 - 0.3, PORTAL.x1 + 0.3, 2.5, 2.85, ez, ez + 0.12);
  for (const x of [PORTAL.x0 - 0.3, PORTAL.x1]) slab(g, stone, x, x + 0.3, 0, 2.5, ez, ez + 0.12);
  slab(g, pm('marquesina', '#3a3d42', { metalness: 0.5, roughness: 0.4 }), PORTAL.x0 - 0.6, PORTAL.x1 + 0.6, 2.95, 3.05, ez, ez + 1.1);
  slab(g, plinth, PORTAL.x0 - 0.4, PORTAL.x1 + 0.4, 0, 0.06, ez, ez + 0.8);
  rslab(g, pm('timbres', '#b9bec4', { metalness: 0.7, roughness: 0.3 }), PORTAL.x1 + 0.35, PORTAL.x1 + 0.6, 1.2, 1.6, ez, ez + 0.04, 0.01);
  const num = numberPlate('7');
  num.position.set((PORTAL.x0 + PORTAL.x1) / 2, 2.67, ez + 0.13); g.add(num);

  // ---------------- forjados, suelos y techos ----------------
  const slabH = 0.25;
  slab(g, plinth, PW.x0, ex - T, FL - slabH, FL, sz + T, ez - T);                 // forjado de la 1.ª (piso y vecino)
  slab(g, plinth, COL.x0, PW.x0, FL - slabH, FL, sz + T, ST.z0);                  // rellano
  slab(g, plinth, COL.x0, PW.x0, 0, FL - slabH, sz + T, ST.z0);                   // macizo bajo el rellano
  slab(g, plinth, COL.x0, PW.x0, FL - slabH, FL, ST.z1, ez - T);                  // techo del portal
  slab(g, plinth, PW.x0, ex - T, 2 * FL - slabH, 2 * FL, sz + T, ez - T);        // forjado de la 2.ª (techo del piso; la escalera es un patio abierto)
  slab(g, ceil, PW.x1, ex - T, 2 * FL - slabH - 0.02, 2 * FL - slabH, sz + T, FLAT.z1); // techo del piso
  slab(g, ceil, COL.x0, PW.x0, FL - slabH - 0.02, FL - slabH, ST.z1, ez - T);           // techo del portal
  // suelo del portal y del rellano (terrazo)
  const terr = new THREE.MeshStandardMaterial({ map: pisoTileTex(), color: '#e8dcc8', roughness: 0.3, emissive: '#e8dcc8', emissiveMap: pisoTileTex(), emissiveIntensity: 0.2 });
  slab(g, terr, COL.x0, PW.x0, 0, 0.03, ST.z1, ez - T);
  slab(g, terr, COL.x0, PW.x0, FL, FL + 0.02, sz + T, ST.z0);
  // escalera: 18 peldaños de piedra con zanquín
  const N = 18, rise = FL / N, tread = (ST.z1 - ST.z0) / N, step = pm('peldano', '#d8d0c2', { roughness: 0.6 });
  for (let k = 0; k < N; k++) {
    slab(g, step, COL.x0, PW.x0, 0, (k + 1) * rise, ST.z1 - (k + 1) * tread, ST.z1 - k * tread);
    slab(g, pm('mamperlan', '#b8ae9e', { roughness: 0.5 }), COL.x0, PW.x0, (k + 1) * rise - 0.02, (k + 1) * rise + 0.005, ST.z1 - k * tread - 0.03, ST.z1 - k * tread + 0.01);
  }
  // pasamanos sobre el tabique
  const L = Math.hypot(ST.z1 - ST.z0, FL), ang = Math.atan2(FL, ST.z1 - ST.z0);
  const hand = pm('pasamanos', '#6b4a2f', { roughness: 0.5 });
  add(g, new THREE.CylinderGeometry(0.03, 0.03, L, 10), hand, PW.x0 - 0.09, 0.9 + FL / 2, (ST.z0 + ST.z1) / 2, { rx: ang - Math.PI / 2 });
  for (const t of [0.08, 0.5, 0.92]) { const z = ST.z1 - t * (ST.z1 - ST.z0); cyl(g, hand, PW.x0 - 0.05, 0.9 + t * FL, z, 0.015, 0.1, 6, { rz: Math.PI / 2 }); }

  // ---------------- tabiques ----------------
  // entre la escalera y el piso (con la puerta del piso en el rellano)
  wall(g, paint, 'z', sz + T, ez - T, PW.x0, PW.x1, 0, HT, [[DOOR.z0, DOOR.z1, FL, FL + 2.2]]);
  boxes.push([PW.x0, PW.x1, sz, DOOR.z0, HT], [PW.x0, PW.x1, DOOR.z1, ez, HT]);
  // con el vecino (delante del piso)
  wall(g, paint, 'x', PW.x1, ex - T, FLAT.z1, FLAT.z1 + 0.2, FL, 2 * FL);
  boxes.push([PW.x1, ex, FLAT.z1, FLAT.z1 + 0.2, HT]);
  // baño
  wall(g, paint, 'z', BATH.z0, BATH.z1 + 0.2, BATH.x0 - 0.2, BATH.x0, FL, 2 * FL - slabH);
  wall(g, paint, 'x', BATH.x0 - 0.2, BATH.x1, BATH.z1, BATH.z1 + 0.2, FL, 2 * FL - slabH, [[BATH.d0, BATH.d1, FL, FL + 2.1]]);
  boxes.push([BATH.x0 - 0.2, BATH.x0, BATH.z0, BATH.z1 + 0.2, 3], [BATH.x0 - 0.2, BATH.d0, BATH.z1, BATH.z1 + 0.2, 3], [BATH.d1, BATH.x1, BATH.z1, BATH.z1 + 0.2, 3]);
  // marcos de las puertas
  const jamb = pm('jamba', '#f4f1ea', { roughness: 0.6 });
  for (const z of [DOOR.z0 - 0.07, DOOR.z1]) slab(g, jamb, PW.x0 - 0.03, PW.x1 + 0.03, FL, FL + 2.25, z, z + 0.07);
  slab(g, jamb, PW.x0 - 0.03, PW.x1 + 0.03, FL + 2.2, FL + 2.27, DOOR.z0 - 0.07, DOOR.z1 + 0.07);
  for (const x of [BATH.d0 - 0.06, BATH.d1]) slab(g, jamb, x, x + 0.06, FL, FL + 2.15, BATH.z1 - 0.02, BATH.z1 + 0.22);
  // forro interior del piso: pintura en las paredes exteriores (con los huecos de las ventanas)
  wall(g, paint, 'x', PW.x1, BATH.x0 - 0.2, sz + T, sz + T + 0.03, FL, 2 * FL - slabH, [[-1.6, -0.4, FL + 1.1, FL + 2.3]]);
  wall(g, paint, 'z', BATH.z1 + 0.2, FLAT.z1, ex - T - 0.03, ex - T, FL, 2 * FL - slabH, RW.map(([a, b]) => [a, b, FL + 1.0, FL + 2.3]));
  // azulejos del baño
  wall(g, tiles, 'x', BATH.x0, BATH.x1, sz + T, sz + T + 0.02, FL, 2 * FL - slabH);
  wall(g, tiles, 'z', BATH.z0, BATH.z1, ex - T - 0.02, ex - T, FL, 2 * FL - slabH);
  slab(g, tiles, BATH.x0, BATH.x1, FL, FL + 0.015, BATH.z0, BATH.z1);
  // rodapié
  const skirt = pm('rodapie', '#e9e3d6', { roughness: 0.6 });
  slab(g, skirt, PW.x1, BATH.x0 - 0.2, FL, FL + 0.08, sz + T + 0.03, sz + T + 0.045);
  slab(g, skirt, ex - T - 0.045, ex - T - 0.03, FL, FL + 0.08, BATH.z1 + 0.2, FLAT.z1);
  slab(g, skirt, PW.x1, ex - T, FL, FL + 0.08, FLAT.z1 - 0.015, FLAT.z1);
  slab(g, skirt, PW.x1, PW.x1 + 0.015, FL, FL + 0.08, sz + T, FLAT.z1);

  // ---------------- cocina americana (fondo) ----------------
  const white = pm('mueble', '#f2efe8', { roughness: 0.45 }), top = pm('encimera', '#3b3936', { roughness: 0.3 });
  const steel = pm('acero', '#c9cdd1', { roughness: 0.25, metalness: 0.8 }), dark = pm('oscuro', '#1d1f22', { roughness: 0.2 });
  const kz0 = sz + T + 0.03, kz1 = kz0 + 0.62;
  rslab(g, white, -3.0, 1.35, FL + 0.08, FL + 0.86, kz0, kz1 - 0.04, 0.01);
  slab(g, dark, -3.0, 1.35, FL, FL + 0.08, kz0, kz1 - 0.1);                                      // zócalo
  slab(g, top, -3.05, 1.4, FL + 0.86, FL + 0.9, kz0, kz1 + 0.02);
  for (let k = 0; k < 6; k++) { const x = -3.0 + (k + 0.5) * (4.35 / 6); slab(g, steel, x - 0.12, x + 0.12, FL + 0.74, FL + 0.76, kz1 - 0.04, kz1 - 0.02); slab(g, pm('junta', '#d9d4ca'), x + 0.36, x + 0.365, FL + 0.1, FL + 0.86, kz1 - 0.045, kz1 - 0.035); }
  // fregadero bajo la ventana, con grifo
  slab(g, steel, -1.4, -0.6, FL + 0.885, FL + 0.905, kz0 + 0.1, kz1 - 0.08);
  slab(g, pm('seno', '#8d949a', { roughness: 0.3, metalness: 0.7 }), -1.32, -0.68, FL + 0.9, FL + 0.91, kz0 + 0.15, kz1 - 0.13);
  cyl(g, steel, -1.0, FL + 1.05, kz0 + 0.08, 0.02, 0.3, 8);
  add(g, new THREE.TorusGeometry(0.12, 0.018, 6, 12, Math.PI), steel, -1.0, FL + 1.2, kz0 + 0.2, { ry: Math.PI / 2 });
  // placa de inducción
  slab(g, dark, 0.2, 0.85, FL + 0.9, FL + 0.91, kz0 + 0.06, kz1 - 0.06);
  for (const [dx, dz] of [[-0.15, -0.12], [0.15, -0.12], [-0.15, 0.12], [0.15, 0.12]]) add(g, new THREE.RingGeometry(0.07, 0.085, 20), pm('aro', '#5c5f63'), 0.525 + dx, FL + 0.913, (kz0 + kz1) / 2 + dz, { rx: -Math.PI / 2 });
  // muebles altos y campana
  for (const [a, b] of [[-3.0, -1.85], [-0.15, 1.35]]) { rslab(g, white, a, b, FL + 1.5, FL + 2.25, kz0, kz0 + 0.36, 0.01); slab(g, steel, (a + b) / 2 - 0.1, (a + b) / 2 + 0.1, FL + 1.53, FL + 1.55, kz0 + 0.36, kz0 + 0.38); }
  slab(g, steel, 0.15, 0.9, FL + 1.38, FL + 1.5, kz0, kz0 + 0.5);
  // nevera de acero
  rslab(g, steel, 1.45, 2.25, FL, FL + 1.9, kz0, kz0 + 0.7, 0.04);
  slab(g, pm('junta2', '#9aa0a6'), 1.46, 2.24, FL + 1.25, FL + 1.27, kz0 + 0.7, kz0 + 0.71);
  for (const y of [FL + 0.75, FL + 1.45]) slab(g, pm('asa', '#7d8388', { metalness: 0.8, roughness: 0.3 }), 1.52, 1.56, y, y + 0.35, kz0 + 0.71, kz0 + 0.75);
  boxes.push([-3.05, 2.3, sz, kz1 + 0.05, 1.9]);
  // isla con barra y dos taburetes
  const iz0 = -3.75, iz1 = -3.15;
  rslab(g, white, -2.6, 0.6, FL, FL + 0.9, iz0, iz1, 0.02);
  slab(g, top, -2.7, 0.7, FL + 0.9, FL + 0.95, iz0 - 0.05, iz1 + 0.3);
  boxes.push([-2.7, 0.7, iz0 - 0.05, iz1 + 0.3, 1]);
  const wood = pm('madera', '#8a5a36', { roughness: 0.6 });
  for (const x of [-1.6, -0.3]) {
    cyl(g, wood, x, FL + 0.7, iz1 + 0.6, 0.19, 0.06, 16);
    cyl(g, pm('pata', '#2b2d30', { metalness: 0.6, roughness: 0.4 }), x, FL + 0.35, iz1 + 0.6, 0.025, 0.7, 8);
    add(g, new THREE.TorusGeometry(0.14, 0.012, 6, 16), pm('pata', '#2b2d30'), x, FL + 0.28, iz1 + 0.6, { rx: Math.PI / 2 });
  }
  // frutero y cafetera
  add(g, new THREE.SphereGeometry(0.13, 12, 6, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), pm('frutero', '#e9e2d4'), -1.0, FL + 1.08, iz0 + 0.3, { rx: Math.PI });
  for (const [dx, c] of [[-0.05, '#e8a33a'], [0.06, '#c0392b'], [0.0, '#e8a33a']]) add(g, new THREE.SphereGeometry(0.045, 10, 8), pm('fruta' + c, c, { roughness: 0.5 }), -1.0 + dx, FL + 1.0 + (dx === 0 ? 0.05 : 0), iz0 + 0.3 + dx);
  rslab(g, dark, -2.5, -2.28, FL + 0.9, FL + 1.22, kz0 + 0.08, kz0 + 0.3, 0.02);

  // ---------------- baño ----------------
  const porc = pm('porcelana', '#fbfbf8', { roughness: 0.2 });
  // inodoro contra el fondo
  rslab(g, porc, 4.55, 5.05, FL, FL + 0.42, sz + T + 0.18, sz + T + 0.68, 0.08);
  rslab(g, porc, 4.55, 5.05, FL + 0.4, FL + 0.8, sz + T + 0.02, sz + T + 0.2, 0.03);
  rslab(g, pm('tapa', '#f0f0ec', { roughness: 0.3 }), 4.57, 5.03, FL + 0.42, FL + 0.46, sz + T + 0.2, sz + T + 0.7, 0.02);
  // lavabo con espejo
  rslab(g, porc, 5.85, 6.55, FL + 0.78, FL + 0.9, sz + T + 0.02, sz + T + 0.5, 0.05);
  cyl(g, porc, 6.2, FL + 0.39, sz + T + 0.2, 0.08, 0.78, 12);
  cyl(g, steel, 6.2, FL + 0.98, sz + T + 0.08, 0.015, 0.16, 8);
  slab(g, pm('espejo', '#cfe0ea', { roughness: 0.05, metalness: 0.9 }), 5.85, 6.55, FL + 1.25, FL + 2.0, sz + T + 0.02, sz + T + 0.04);
  // plato de ducha con mampara
  slab(g, porc, 5.75, ex - T - 0.02, FL, FL + 0.06, -4.35, BATH.z1 - 0.05);
  slab(g, plainMat('mampara', { color: '#d6e7ee', roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.35, depthWrite: false }), 5.73, 5.76, FL + 0.06, FL + 2.0, -4.35, -3.4);
  cyl(g, steel, 6.45, FL + 2.05, -3.75, 0.1, 0.02, 16);
  cyl(g, steel, 6.62, FL + 1.6, -3.75, 0.012, 0.9, 6);
  boxes.push([4.5, 5.1, sz, sz + T + 0.7, 1], [5.8, 6.6, sz, sz + T + 0.5, 1], [5.72, 5.78, -4.35, -3.4, 2]);
  // toallero y alfombrilla
  slab(g, pm('toalla', '#5b8fb0', { roughness: 0.95 }), BATH.x0 + 0.02, BATH.x0 + 0.06, FL + 1.0, FL + 1.55, -4.6, -4.0);
  slab(g, pm('alfombrilla', '#e9e0cf', { roughness: 1 }), 5.0, 5.6, FL + 0.016, FL + 0.03, -4.0, -3.5);

  // ---------------- dormitorio: cama individual y armario ----------------
  const bx0 = 4.6, bx1 = ex - T - 0.02, bz0 = 0.35, bz1 = 1.4;
  rslab(g, wood, bx0, bx1, FL + 0.12, FL + 0.32, bz0, bz1, 0.03);
  for (const x of [bx0 + 0.06, bx1 - 0.06]) for (const z of [bz0 + 0.06, bz1 - 0.06]) cyl(g, wood, x, FL + 0.06, z, 0.03, 0.12, 8);
  rslab(g, wood, bx1 - 0.06, bx1, FL + 0.12, FL + 1.05, bz0 - 0.02, bz1 + 0.02, 0.02);              // cabecero
  rslab(g, pm('colchon', '#f4f4f1', { roughness: 0.9 }), bx0 + 0.03, bx1 - 0.07, FL + 0.32, FL + 0.52, bz0 + 0.03, bz1 - 0.03, 0.07);
  rslab(g, pm('almohada', '#ffffff', { roughness: 0.95 }), bx1 - 0.55, bx1 - 0.12, FL + 0.52, FL + 0.64, bz0 + 0.12, bz1 - 0.12, 0.05);
  rslab(g, pm('nordico', '#5f7f8f', { roughness: 0.95 }), bx0 + 0.0, bx1 - 0.6, FL + 0.5, FL + 0.58, bz0 - 0.02, bz1 + 0.02, 0.03);
  rslab(g, pm('nordico2', '#4f6d7c', { roughness: 0.95 }), bx0 + 0.0, bx0 + 0.02, FL + 0.3, FL + 0.58, bz0 - 0.02, bz1 + 0.02, 0.01);
  boxes.push([bx0, bx1 + 0.02, bz0 - 0.05, bz1 + 0.05, 0.7]);
  // mesilla con lámpara
  rslab(g, wood, bx1 - 0.45, bx1, FL, FL + 0.5, bz1 + 0.12, bz1 + 0.55, 0.02);
  cyl(g, pm('pie', '#2b2d30'), bx1 - 0.22, FL + 0.62, bz1 + 0.33, 0.015, 0.25, 6);
  add(g, new THREE.CylinderGeometry(0.08, 0.12, 0.16, 14, 1, true), plainMat('pantalla', { color: '#fff1d6', emissive: '#ffcf8a', emissiveIntensity: 0.5, side: THREE.DoubleSide }), bx1 - 0.22, FL + 0.8, bz1 + 0.33);
  // armario de dos puertas contra la pared del vecino
  const ax0 = 2.4, ax1 = 4.3, az1 = FLAT.z1 - 0.02, az0 = az1 - 0.6;
  rslab(g, pm('armario', '#d9c7a6', { roughness: 0.55 }), ax0, ax1, FL, FL + 2.2, az0, az1, 0.02);
  slab(g, pm('junta3', '#a8977a'), (ax0 + ax1) / 2 - 0.005, (ax0 + ax1) / 2 + 0.005, FL + 0.05, FL + 2.15, az0 - 0.005, az0);
  for (const d of [-0.12, 0.08]) slab(g, steel, (ax0 + ax1) / 2 + d, (ax0 + ax1) / 2 + d + 0.03, FL + 0.95, FL + 1.35, az0 - 0.04, az0);
  boxes.push([ax0, ax1, az0, az1, 2.2]);
  // alfombra junto a la cama, cuadro y percha junto a la puerta
  slab(g, pm('alfombra', '#b7653f', { roughness: 1 }), 3.3, 4.5, FL + 0.005, FL + 0.015, -0.3, 2.0);
  slab(g, pm('cuadro', '#2f5d7c', { roughness: 0.7 }), ex - T - 0.04, ex - T - 0.02, FL + 1.3, FL + 2.0, -0.35, 0.2);
  slab(g, wood, PW.x1, PW.x1 + 0.05, FL + 1.6, FL + 1.7, -2.6, -1.6);
  for (const z of [-2.4, -2.1, -1.8]) cyl(g, steel, PW.x1 + 0.1, FL + 1.62, z, 0.015, 0.12, 6, { rz: Math.PI / 2 });
  slab(g, pm('chaqueta', '#3b4a5a', { roughness: 0.95 }), PW.x1 + 0.08, PW.x1 + 0.2, FL + 0.95, FL + 1.6, -2.2, -1.9);

  // ---------------- portal: buzones y felpudo ----------------
  slab(g, lobby, COL.x0, COL.x0 + 0.02, 0, FL - slabH, ST.z1, ez - T);
  rslab(g, pm('buzon', '#8a6a3d', { roughness: 0.5 }), COL.x0, COL.x0 + 0.25, 1.1, 1.9, 3.8, 5.0, 0.02);
  for (let r = 0; r < 3; r++) for (let c = 0; c < 4; c++) slab(g, pm('ranura', '#2b2b2b'), COL.x0 + 0.25, COL.x0 + 0.26, 1.2 + r * 0.26 + 0.12, 1.2 + r * 0.26 + 0.14, 3.88 + c * 0.29, 3.88 + c * 0.29 + 0.2);
  slab(g, pm('felpudo', '#5a4632', { roughness: 1 }), COL.x0 + 0.3, PW.x0 - 0.3, 0.03, 0.045, ez - T - 1.0, ez - T - 0.1);
  // puerta del vecino en el rellano (1.º B, cerrada)
  slab(g, pm('puertaB', '#6e4a2c', { roughness: 0.55 }), COL.x0 + 0.35, PW.x0 - 0.35, FL, FL + 2.15, sz + T, sz + T + 0.05);
  slab(g, jamb, COL.x0 + 0.28, PW.x0 - 0.28, FL + 2.15, FL + 2.22, sz + T, sz + T + 0.06);
  const b = numberPlate('1.º B', 0.32); b.position.set((COL.x0 + PW.x0) / 2, FL + 1.65, sz + T + 0.06); g.add(b);
  const a = numberPlate('1.º A', 0.32); a.position.set(PW.x0 - 0.02, FL + 2.45, (DOOR.z0 + DOOR.z1) / 2); a.rotation.y = -Math.PI / 2; g.add(a);
  // apliques de luz
  const glow = plainMat('piso-luz', { color: '#fff4dc', emissive: '#ffe2b0', emissiveIntensity: 1.2 });
  cyl(g, glow, (COL.x0 + PW.x0) / 2, FL - slabH - 0.04, (ST.z1 + ez) / 2, 0.18, 0.04, 16);
  slab(g, glow, PW.x0 - 0.05, PW.x0 - 0.02, FL + 2.3, FL + 2.5, -4.6, -3.2); // aplique sobre la puerta del piso
  for (const [x, z] of [[0.6, -1.0], [-1.0, -4.3], [5.5, -4.3]]) cyl(g, glow, x, 2 * FL - slabH - 0.05, z, x === 0.6 ? 0.3 : 0.16, 0.05, 20);

  // ---------------- datos para el juego ----------------
  return {
    group: g, boxes,
    // zonas de suelo elevado (alturas sobre el solar)
    floors: [
      { x0: COL.x0, x1: PW.x0, z0: ST.z0, z1: ST.z1, h: (x, z) => FL * Math.min(1, Math.max(0, (ST.z1 - z) / (ST.z1 - ST.z0))) },
      { x0: COL.x0, x1: PW.x1, z0: sz + T, z1: ST.z0, h: () => FL },
      { x0: PW.x1, x1: ex - T, z0: sz + T, z1: FLAT.z1, h: () => FL },
    ],
    flat: { x0: FLAT.x0 + 0.1, x1: ex - T - 0.1, z0: sz + T + 0.1, z1: FLAT.z1 - 0.1 },
    floorPlanes: [
      { x0: PW.x1, x1: BATH.x0 - 0.2, z0: sz + T, z1: FLAT.z1 },
      { x0: BATH.x0 - 0.2, x1: ex - T, z0: BATH.z1, z1: FLAT.z1 },
    ],
    doors: [
      { x: PORTAL.x0, z: ez - 0.15, axis: 'x', width: PORTAL.x1 - PORTAL.x0, h: 2.45, y: 0, color: '#3d2a1c', flip: 1, portal: true },
      { x: (PW.x0 + PW.x1) / 2, z: DOOR.z0, axis: 'z', width: DOOR.z1 - DOOR.z0, h: 2.15, y: FL, color: '#7a5636', flip: 1, flat: true },
      { x: BATH.d0, z: BATH.z1 + 0.1, axis: 'x', width: BATH.d1 - BATH.d0, h: 2.05, y: FL, color: '#f1ede4', flip: 1 },
    ],
    acts: {
      sink: { x: -1.0, y: FL + 0.6, z: kz0 + 0.35, w: 0.9, h: 1.2, d: 0.8 },
      fridge: { x: 1.85, y: FL + 0.95, z: kz0 + 0.4, w: 0.85, h: 1.9, d: 0.8 },
      bed: { x: (bx0 + bx1) / 2, y: FL + 0.4, z: (bz0 + bz1) / 2, w: bx1 - bx0, h: 0.8, d: bz1 - bz0 + 0.1 },
      wardrobe: { x: (ax0 + ax1) / 2, y: FL + 1.1, z: (az0 + az1) / 2, w: ax1 - ax0, h: 2.2, d: 0.7 },
      basin: { x: 6.2, y: FL + 0.85, z: sz + T + 0.3, w: 0.8, h: 0.5, d: 0.6 },
    },
    lights: [],
    spawn: { x: 0.8, z: 0.6, yaw: 0 },
    leo: { x: -2.4, z: 0.4, yaw: Math.PI / 2 },
    portal: { x: (PORTAL.x0 + PORTAL.x1) / 2, z: ez + 1.6 },
  };
}

// Placa con texto (número del portal, letra de la puerta)
function numberPlate(text, w = 0.42) {
  const c = document.createElement('canvas'); c.width = 256; c.height = 128;
  const x = c.getContext('2d');
  x.fillStyle = '#1f3a5a'; x.fillRect(0, 0, 256, 128);
  x.strokeStyle = '#e8e2d0'; x.lineWidth = 8; x.strokeRect(8, 8, 240, 112);
  x.fillStyle = '#f4efe2'; x.font = 'bold 72px sans-serif'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText(text, 128, 68);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 }));
}
