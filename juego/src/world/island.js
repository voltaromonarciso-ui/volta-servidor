// Isla de Rooktown (docs/referencias/11-mapa.png). Norte = +z, este = +x.
//
// Cuadrícula de 7 columnas × 4 filas de manzanas de 60 m (calles cada 60 m), una carretera
// de circunvalación (las calles exteriores) y, alrededor, la costa: Faro (NO), Puerto (N),
// Playa (NE), Urbanización (S) y Muelle de carga (SE).
//
// Fase 1 (esta): estructura completa — suelo, costa, calles y aceras, navegación de los
// peatones, tráfico, semáforos, farolas y edificios de cada barrio. Los locales en los que
// se entra (tiendas, propiedades, El Cartel…) se montan en la fase 2 sobre esta base.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { G } from '../game.js';
import { rackStore } from './racks.js';
import { W, B, TM, scene, K, removeBox } from './world.js';
import * as SK from './streetkit.js';
import { createFurniture } from './streetfurniture.js';
import { hasBuilding, buildingModel, buildingSize } from './buildingkit.js';
import { shopBuilding, warehouseBuilding, bankBranch, ownedWarehouse, naveFloorMat, FH } from './realbuilding.js';
import * as INT from './interior.js';
import { eclipse as eclipseFacade } from './facades.js';
import { cartelHQ } from './cartel.js';
import { mansionHQ, UP as MANSION_UP } from './mansion.js';
import { nearLoad } from '../entities/realprops.js';
import { RANKS } from '../data/items.js';
import { grassReady, islandLawn, tuft, fringeMesh } from './grass.js';
import * as SKP from './streetkit.js';
import { addPad, addFloor, drapeGeometry, allPads, H as groundH, Hlow, coastOutline, shoreDist } from './terrain.js';
import { starterFlat, FL, pisoWoodTex } from './starterflat.js';
import { pbrMat } from './buildingkit.js';
import { arbolCopa, arbusto, plantaHojas, flores, roca } from './vegetation.js';
import * as AL from './alleys.js';
import * as CO from './coast.js';

// líneas de calle (centro de la calzada)
export const XL = [-210, -150, -90, -30, 30, 90, 150, 210];
export const ZL = [-120, -60, 0, 60, 120];
const COLS = XL.length - 1, ROWS = ZL.length - 1;
export const N = {
  x0: -250, x1: 250, z0: -165, z1: 168, r: 34, // costa: rectángulo de esquinas redondeadas…
  // …con forma: cabos que salen al mar y alguna cala, donde no hay edificios [x, z, metros, ancho]
  blobs: [
    [-250, 146, 16, 20], [-236, 168, 11, 16],   // cabo del faro (noroeste)
    [-250, 22, 24, 34],                         // península del oeste
    [-250, -118, 13, 22],                       // punta suroeste
    [-118, -165, 20, 26], [130, -165, 22, 26],  // cabos del sur
    [32, -165, 11, 16],
    [250, -32, 26, 30],                         // cabo del este
    [250, 118, 12, 20], [222, 168, 14, 22],     // punta de la playa (noreste)
    [-172, 168, -7, 14],                        // calas
    [-32, -165, -6, 14], [80, -165, -6, 14],
  ],
};
// explanada del puerto, ganada al mar por el norte (sale de la isla hasta z1)
export const PORT = { x0: -120, x1: 100, z0: 132.5, z1: 222 };

// Barrio de cada manzana: ZONES[fila][columna], fila 0 = la más al norte.
export const ZONES = [
  ['gasNorte', 'bungalos', 'barrioAlto', 'eclipse', 'palmeras', 'taller', 'gasEste'],
  ['bosque', 'motel', 'parque', 'esquina', 'corteFino', 'lavanderia', 'lavadero'],
  ['cabanas', 'mansion', 'casino', 'ropa', 'oficinas', 'almacenAlfa', 'comisaria'],
  ['gasSur', 'apartamentos', 'almacenDelta', 'almacenBravo', 'cartel', 'muebles', 'mercado'],
];
export const ZONE_NAMES = {
  gasNorte: 'Gasolinera Norte', bungalos: 'Bungalós', barrioAlto: 'Barrio Alto', eclipse: 'El Eclipse',
  palmeras: 'Las Palmeras', taller: 'Taller', gasEste: 'Gasolinera Este', bosque: 'Bosque', motel: 'Motel',
  parque: 'Parque Central', esquina: 'La Esquina', corteFino: 'Corte Fino', lavanderia: 'Lavandería Espuma',
  lavadero: 'Lavadero de coches', cabanas: 'Cabañas', mansion: 'Mansión', casino: 'Casino Royal', ropa: 'Tienda de ropa',
  oficinas: 'Oficinas', almacenAlfa: 'Almacén Alfa', comisaria: 'Comisaría', gasSur: 'Gasolinera Sur',
  apartamentos: 'Apartamentos', almacenDelta: 'Almacén Delta', almacenBravo: 'Almacén Bravo', cartel: 'El Cartel',
  muebles: 'Tienda de muebles', mercado: 'Mercado',
};
// Color del barrio en el mapa
const ZONE_COLOR = {
  residencial: '#c9b28e', ocio: '#9b6bc9', comercio: '#c98a6b', industrial: '#8a9aa6', verde: '#5f9a55', servicio: '#6b8fb0',
};
const ZONE_KIND = {
  gasNorte: 'servicio', bungalos: 'residencial', barrioAlto: 'residencial', eclipse: 'ocio', palmeras: 'ocio', taller: 'servicio',
  gasEste: 'servicio', bosque: 'verde', motel: 'servicio', parque: 'verde', esquina: 'comercio', corteFino: 'comercio',
  lavanderia: 'comercio', lavadero: 'servicio', cabanas: 'residencial', mansion: 'residencial', casino: 'ocio', ropa: 'comercio',
  oficinas: 'comercio', almacenAlfa: 'industrial', comisaria: 'servicio', gasSur: 'servicio', apartamentos: 'residencial',
  almacenDelta: 'industrial', almacenBravo: 'industrial', cartel: 'ocio', muebles: 'comercio', mercado: 'comercio',
};

// Manzana (columna i, fila j desde el norte): límites del solar (por dentro de la acera).
export function block(i, j) {
  const x0 = XL[i] + K.SWO, x1 = XL[i + 1] - K.SWO;
  const zN = ZL[ROWS - j] - K.SWO, zS = ZL[ROWS - j - 1] + K.SWO; // fila 0 = norte (z alta)
  return { i, j, x0, x1, z0: zS, z1: zN, cx: (x0 + x1) / 2, cz: (zS + zN) / 2, zone: ZONES[j][i] };
}
export function blockOf(zone) {
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) if (ZONES[j][i] === zone) return block(i, j);
  return null;
}

let seedN = 1;
const R = () => { seedN = (seedN * 9301 + 49297) % 233280; return seedN / 233280; };
const rr = (a, b) => a + R() * (b - a);

// Mobiliario urbano nuevo (streetkit): se acumula durante la construcción y se funde al final
let F = null;
const palm = (x, z, h = rr(8, 11)) => F.place('palmera', () => SK.palmera(), x, z, R() * 6.28, { s: h / 6, hit: 0.6 });
// árbol de copa redonda (vegetation.js): tres tamaños y cuatro formas de cada uno
const tree = (x, z, s = 1, v = Math.floor(R() * 3)) => { const k = Math.floor(R() * 4); F.place(`copa${v}-${k}`, () => arbolCopa(v, k + 1), x, z, R() * 6.28, { s: s * rr(0.9, 1.1), hit: 0.55 }); };
const bench = (x, z, ry = 0) => F.place('banco', () => SK.banco(), x, z, ry);
const trashCan = (x, z) => F.place('papelera', SK.papelera, x, z, 0);

// Edificio de relleno con modelo libre (buildingkit): se coloca con el mobiliario (fundido por
// sector), con su colisión y su rectángulo en el mapa. `w` = ancho deseado en metros.
// Devuelve la huella { x0, x1, z0, z1 } o null si el modelo no se ha cargado.
function modelBuilding(name, x, z, ry, { w, mapColor = '#b9a68a', label } = {}) {
  if (!hasBuilding(name)) return null;
  const sz = buildingSize(name), s = w ? w / sz.x : 1;
  F.place('bld:' + name, buildingModel(name), x, z, ry, { s });
  const turned = Math.abs(Math.sin(ry)) > 0.5, hw = ((turned ? sz.z : sz.x) * s) / 2, hd = ((turned ? sz.x : sz.z) * s) / 2;
  const r = { x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd };
  pad(r.x0, r.x1, r.z0, r.z1, ry, name); // solar llano en el relieve
  DOORS.push({ ...r, x, z, ry, house: /^(ks_|h_house)/.test(name) });
  W.mapRects.push({ ...r, c: mapColor });
  if (label) W.mapLabels.push({ x, z, t: label });
  return r;
}
// ------------------------------------------------------------------
//  Callejones (uno por barrio): el hueco estrecho entre dos edificios o, si el barrio tiene un
//  solo edificio grande, el paso de servicio pegado a su pared trasera
// ------------------------------------------------------------------
const NO_ALLEY = new Set(['bosque', 'parque']);
function findAlleys() {
  const out = [];
  const isHouse = (t) => /^(h_house|ks_)/.test(t);
  const hits = (r, except) => FOOT.some((q) => !except.includes(q) && q.x0 < r.x1 && q.x1 > r.x0 && q.z0 < r.z1 && q.z1 > r.z0);
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) {
    const b = block(i, j);
    if (NO_ALLEY.has(b.zone)) continue;
    const inB = FOOT.filter((r) => r.x0 >= b.x0 - 1 && r.x1 <= b.x1 + 1 && r.z0 >= b.z0 - 1 && r.z1 <= b.z1 + 1 && (r.x1 - r.x0) * (r.z1 - r.z0) > 30);
    if (!inB.length) continue;
    // 1) entre dos edificios (no entre casas: eso son jardines)
    let best = null;
    for (const a of inB) for (const c of inB) {
      if (a === c || (isHouse(a.tag) && isHouse(c.tag))) continue;
      const gx = c.x0 - a.x1, oz = Math.min(a.z1, c.z1) - Math.max(a.z0, c.z0);
      if (gx >= 3 && gx <= 10 && oz >= 8) {
        const r = { x0: a.x1, x1: c.x0, z0: Math.max(a.z0, c.z0), z1: Math.min(a.z1, c.z1) };
        if (!hits(r, [a, c]) && (!best || oz > best.len)) best = { ...r, run: 'z', len: oz, walls: [{ x: a.x1, f: 1 }, { x: c.x0, f: -1 }], kind: 'entre' };
      }
      const gz = c.z0 - a.z1, ox = Math.min(a.x1, c.x1) - Math.max(a.x0, c.x0);
      if (gz >= 3 && gz <= 10 && ox >= 8) {
        const r = { z0: a.z1, z1: c.z0, x0: Math.max(a.x0, c.x0), x1: Math.min(a.x1, c.x1) };
        if (!hits(r, [a, c]) && (!best || ox > best.len)) best = { ...r, run: 'x', len: ox, walls: [{ z: a.z1, f: 1 }, { z: c.z0, f: -1 }], kind: 'entre' };
      }
    }
    // 2) detrás del edificio más grande: el lado con sitio (4 m o más) y menos cosas puestas
    if (!best) {
      const big = inB.reduce((p, q) => ((q.x1 - q.x0) * (q.z1 - q.z0) > (p.x1 - p.x0) * (p.z1 - p.z0) ? q : p));
      const W_ = 5;
      // (nunca por la fachada: el lado de la puerta, según hacia dónde mira el edificio)
      const d = DOORS.find((q) => overlapArea(q, big) > 0.6 * (big.x1 - big.x0) * (big.z1 - big.z0));
      const front = d ? (Math.abs(Math.cos(d.ry)) > 0.5 ? (Math.cos(d.ry) > 0 ? 'N' : 'S') : (Math.sin(d.ry) > 0 ? 'E' : 'O')) : null;
      const sides = [
        { k: 'N', r: { x0: big.x0, x1: big.x1, z0: big.z1, z1: Math.min(b.z1, big.z1 + W_) }, run: 'x', walls: [{ z: big.z1, f: 1 }] },
        { k: 'S', r: { x0: big.x0, x1: big.x1, z0: Math.max(b.z0, big.z0 - W_), z1: big.z0 }, run: 'x', walls: [{ z: big.z0, f: -1 }] },
        { k: 'E', r: { x0: big.x1, x1: Math.min(b.x1, big.x1 + W_), z0: big.z0, z1: big.z1 }, run: 'z', walls: [{ x: big.x1, f: 1 }] },
        { k: 'O', r: { x0: Math.max(b.x0, big.x0 - W_), x1: big.x0, z0: big.z0, z1: big.z1 }, run: 'z', walls: [{ x: big.x0, f: -1 }] },
      ].filter((s) => s.k !== front && (s.run === 'x' ? s.r.z1 - s.r.z0 : s.r.x1 - s.r.x0) >= 4 && !hits(s.r, [big]));
      const crowd = (r) => F.items().filter((t) => t.x > r.x0 && t.x < r.x1 && t.z > r.z0 && t.z < r.z1).length;
      sides.sort((p, q) => crowd(p.r) - crowd(q.r));
      const s = sides[0];
      if (s) {
        const len = s.run === 'x' ? s.r.x1 - s.r.x0 : s.r.z1 - s.r.z0;
        // como mucho 26 m de largo, centrado
        if (len > 26) { const k = (len - 26) / 2; if (s.run === 'x') { s.r.x0 += k; s.r.x1 -= k; } else { s.r.z0 += k; s.r.z1 -= k; } }
        best = { ...s.r, run: s.run, len: Math.min(len, 26), walls: s.walls, kind: 'detras' };
      }
    }
    if (best) out.push({ ...best, zone: b.zone, block: [i, j] });
  }
  return out;
}
// El césped es una sola malla de cuadros de 2 m que sigue el relieve: un cuadro que cae a
// caballo entre el callejón y el edificio más alto se inclina y asoma sobre las losas junto a
// la pared. Se quitan los cuadros del callejón y los de sus paredes (no los de los extremos,
// por donde se entra desde el césped).
function cutLawnFromAlleys() {
  const rects = (W.alleys || []).map((a) => (a.run === 'z' ? { x0: a.x0 - 1.2, x1: a.x1 + 1.2, z0: a.z0, z1: a.z1 } : { x0: a.x0, x1: a.x1, z0: a.z0 - 1.2, z1: a.z1 + 1.2 }));
  if (!rects.length) return;
  const inside = (x, z) => rects.some((r) => x > r.x0 && x < r.x1 && z > r.z0 && z < r.z1);
  for (const g of LAWN_GEO) {
    const P = g.attributes.position;
    if (g.index) {
      const I = g.index.array, keep = [];
      for (let t = 0; t < I.length; t += 3) {
        const cx = (P.getX(I[t]) + P.getX(I[t + 1]) + P.getX(I[t + 2])) / 3, cz = (P.getZ(I[t]) + P.getZ(I[t + 1]) + P.getZ(I[t + 2])) / 3;
        if (!inside(cx, cz)) keep.push(I[t], I[t + 1], I[t + 2]);
      }
      g.setIndex(keep);
    } else {
      const n = P.count, ok = [];
      for (let t = 0; t < n; t += 3) {
        const cx = (P.getX(t) + P.getX(t + 1) + P.getX(t + 2)) / 3, cz = (P.getZ(t) + P.getZ(t + 1) + P.getZ(t + 2)) / 3;
        if (!inside(cx, cz)) ok.push(t);
      }
      for (const name of Object.keys(g.attributes)) {
        const A = g.attributes[name], k = A.itemSize, out = new A.array.constructor(ok.length * 3 * k);
        ok.forEach((t, j) => { for (let v = 0; v < 3; v++) for (let c = 0; c < k; c++) out[(j * 3 + v) * k + c] = A.array[(t + v) * k + c]; });
        g.setAttribute(name, new THREE.BufferAttribute(out, k, A.normalized));
      }
    }
  }
}
// El césped es una rejilla del tamaño de la caja de la isla: lo que cae fuera de la orilla
// taparía la arena. Se quitan los triángulos que quedan del todo fuera y los vértices que
// asoman se llevan a la orilla (así el borde sigue la costa en vez de ir a escalones).
function trimLawnAtShore(g) {
  const P = g.attributes.position, n = P.count, sd = new Float32Array(n);
  for (let i = 0; i < n; i++) sd[i] = shoreDist(P.getX(i), P.getZ(i));
  if (g.index) {
    const I = g.index.array, keep = [];
    for (let t = 0; t < I.length; t += 3) if (sd[I[t]] >= 0 || sd[I[t + 1]] >= 0 || sd[I[t + 2]] >= 0) keep.push(I[t], I[t + 1], I[t + 2]);
    g.setIndex(keep);
  }
  const e = 0.5;
  for (let i = 0; i < n; i++) {
    if (sd[i] >= 0) continue;
    const x = P.getX(i), z = P.getZ(i);
    const gx = (shoreDist(x + e, z) - shoreDist(x - e, z)) / (2 * e), gz = (shoreDist(x, z + e) - shoreDist(x, z - e)) / (2 * e), gl = Math.hypot(gx, gz) || 1;
    P.setX(i, x - (gx / gl) * sd[i]); P.setZ(i, z - (gz / gl) * sd[i]);
  }
  P.needsUpdate = true;
}
// Para que los peatones (y los clientes que van a una cita) entren al callejón: un nodo en
// el punto de encuentro, otro en cada boca y, desde la boca, uno en la línea de la acera que
// se engancha a las dos esquinas de ese tramo. Sólo las bocas que se ven libres desde la acera.
function linkAlleyNav(a, sp) {
  const Nv = W.nav, along = a.run === 'z', cx = (a.x0 + a.x1) / 2, cz = (a.z0 + a.z1) / 2;
  const lines = (along ? ZL : XL).flatMap((v) => [v - K.SWC, v + K.SWC]);
  let sNode = -1;
  let ok = false;
  for (const end of [-1, 1]) {
    const e = along ? { x: cx, z: end < 0 ? a.z0 : a.z1 } : { x: end < 0 ? a.x0 : a.x1, z: cz };
    const ev = along ? e.z : e.x;
    const cand = lines.filter((v) => (end < 0 ? v < ev + 0.5 : v > ev - 0.5)).sort((p, q) => Math.abs(p - ev) - Math.abs(q - ev))[0];
    if (cand === undefined || Math.abs(cand - ev) > 20) continue;
    const sw = along ? { x: cx, z: cand } : { x: cand, z: cz };
    if (!W.los(sp.x, sp.z, e.x, e.z) || !W.los(e.x, e.z, sw.x, sw.z)) continue;
    // las dos esquinas de la acera a cada lado de la boca
    const onLine = Nv.nodes.map((n, i) => [n, i]).filter(([n]) => Math.abs((along ? n.z : n.x) - cand) < 0.01);
    const pos = (n) => (along ? n.x : n.z), c0 = along ? cx : cz;
    const lo = onLine.filter(([n]) => pos(n) < c0).sort((p, q) => pos(q[0]) - pos(p[0]))[0];
    const hi = onLine.filter(([n]) => pos(n) > c0).sort((p, q) => pos(p[0]) - pos(q[0]))[0];
    if (!lo && !hi) continue;
    if (sNode < 0) sNode = Nv.add(sp.x, sp.z);
    const eN = Nv.add(e.x, e.z), wN = Nv.add(sw.x, sw.z);
    Nv.link(sNode, eN); Nv.link(eN, wN);
    if (lo) Nv.link(wN, lo[1]);
    if (hi) Nv.link(wN, hi[1]);
    ok = true;
  }
  return ok;
}
function buildAlleys() {
  W.alleys = []; W.alleyPeople = []; W.drops = [];
  let tag = 0;
  for (const a of findAlleys()) {
    F.clear(a); // fuera árboles, bancos o farolas que hubiera en el paso
    const along = a.run === 'z', L0 = along ? a.z0 : a.x0, L1 = along ? a.z1 : a.x1, len = L1 - L0;
    const at = (t, w) => (along ? { x: w.x + w.f * 0.6, z: L0 + t * len } : { x: L0 + t * len, z: w.z + w.f * 0.6 });
    // (frente de lo que va contra una pared: hacia el centro del callejón)
    const face = (w) => (along ? (w.f > 0 ? Math.PI / 2 : -Math.PI / 2) : (w.f > 0 ? 0 : Math.PI));
    const wallAt = (t, w, off) => (along ? { x: w.x + w.f * off, z: L0 + t * len } : { x: L0 + t * len, z: w.z + w.f * off });
    // suelo llano: un solar propio que se toca con el del edificio de al lado, así queda a su
    // misma altura (sin los baches del terreno natural que había entre los dos edificios)
    // (a la altura del edificio más bajo de los dos, como un callejón de verdad: el más alto
    // queda sobre su muro de contención)
    const hs = a.walls.map((w) => (along ? groundH(w.x - w.f * 1.5, (a.z0 + a.z1) / 2) : groundH((a.x0 + a.x1) / 2, w.z - w.f * 1.5)));
    addPad(a.x0, a.x1, a.z0, a.z1, { h: Math.min(...hs) });
    // las losas: junto a un edificio más alto (con su muro de contención delante), unos
    // centímetros antes del borde, que es de los dos solares y tomaría su altura; junto a uno a
    // la misma altura, hasta el borde (si no, asomaría el césped)
    const hA = Math.min(...hs), gap = hs.map((h) => (h - hA > 0.05 ? 0.06 : 0));
    const lo = along ? a.x0 : a.z0, hi = along ? a.x1 : a.z1;
    const side = (w, i) => (w.f > 0 ? [gap[i], 0] : [0, gap[i]]); // (la pared con f>0 es la del lado bajo de la coordenada)
    let g0 = 0, g1 = 0;
    a.walls.forEach((w, i) => { const [p0, p1] = side(w, i); g0 = Math.max(g0, p0); g1 = Math.max(g1, p1); });
    if (along) K.paving(lo + g0, hi - g1, a.z0, a.z1, '#86827a', null, 1.1); else K.paving(a.x0, a.x1, lo + g0, hi - g1, '#86827a', null, 1.1); // suelo de losas gastadas
    const g = 0.06;
    // y hasta la pared de verdad: la huella del edificio incluye el alero, así que entre el
    // callejón y la pared queda una franja de su solar (a su altura) que también lleva losas
    for (const w of a.walls) {
      if (along) K.paving(w.f > 0 ? w.x - 0.9 : w.x + g, w.f > 0 ? w.x - g : w.x + 0.9, a.z0, a.z1, '#86827a', null, 1.1);
      else K.paving(a.x0, a.x1, w.f > 0 ? w.z - 0.9 : w.z + g, w.f > 0 ? w.z - g : w.z + 0.9, '#86827a', null, 1.1);
    }
    const w0 = a.walls[0], w1 = a.walls[1] || a.walls[0];
    let p = at(0.18, w0); F.place('aContenedor', () => SK.contenedor('#2f4f3a'), p.x, p.z, face(w0));
    p = at(0.3, w0); F.place('aBolsas', () => AL.bolsasBasura(3), p.x, p.z, R() * 6.28, { solid: false });
    p = at(0.62, w1); F.place('aCartones', AL.cartones, p.x, p.z, face(w1), { solid: false });
    p = at(0.78, w1); F.place('aPalet', AL.palet, wallAt(0.78, w1, 0.15).x, wallAt(0.78, w1, 0.15).z, face(w1), { solid: false });
    p = at(0.86, w0); F.place('aCaja', () => SK.cajaMadera(0.8), p.x, p.z, R() * 6.28);
    p = at(0.89, w0); F.place('aCaja2', () => SK.cajaMadera(0.6), p.x + 0.3, p.z + 0.3, R() * 6.28);
    for (const [t, c] of [[0.07, '#2f9a3d'], [0.1, '#2b6cb0']]) { const q = at(t, w0); F.place('aCubo' + c, () => SK.cuboReciclaje(c), q.x, q.z, face(w0)); }
    { const q = wallAt(0.38, w1, 0.02); F.place('aAire', AL.aireAcondicionado, q.x, q.z, face(w1), { solid: false }); }
    { const q = wallAt(0.7, w0, 0.02); F.place('aAire', AL.aireAcondicionado, q.x, q.z, face(w0), { solid: false }); }
    { const q = wallAt(0.55, w0, 0.27); F.place('aCajaElec', SK.cajaElectrica, q.x, q.z, face(w0)); } // (armario eléctrico de pie contra la pared)
    p = at(0.92, w0); F.place('aBolsas2', () => AL.bolsasBasura(2), p.x, p.z, R() * 6.28, { solid: false });
    for (let k = 0; k < 2; k++) { const t = 0.35 + k * 0.3 + R() * 0.08; const c = { x: (a.x0 + a.x1) / 2, z: (a.z0 + a.z1) / 2 }; F.place('aCharco', () => AL.charco(), along ? c.x + (R() - 0.5) : L0 + t * len, along ? L0 + t * len : c.z + (R() - 0.5), R() * 6.28, { solid: false }); }
    // grafitis en las paredes y el farol en medio
    for (const [t, w] of [[0.45, w0], [0.25, w1]]) { const q = wallAt(t, w, 0.02); const n = tag++ % 4; F.place('aTag' + n, () => AL.grafiti(n), q.x, q.z, face(w), { solid: false }); }
    const lq = wallAt(0.5, w1, 0.02); F.place('aFarol', AL.farolPared, lq.x, lq.z, face(w1), { solid: false });
    // escalera de incendios en la pared de un edificio de varias plantas
    if (a.kind === 'entre' && len > 14) { const q = wallAt(0.62, w0, 0.02); F.place('aEscalera', () => AL.escaleraIncendios(3), q.x, q.z, face(w0), { solid: false }); }
    // gente haciendo tiempo: uno apoyado en la pared con el móvil y, en uno de cada dos
    // callejones, otro delante charlando con él
    { const q = wallAt(0.44, w1, 0.42); W.alleyPeople.push({ x: q.x, z: q.z, yaw: face(w1) + (R() - 0.5) * 0.5, pose: R() < 0.6 ? 'phone' : null });
      if (W.alleys.length % 2 === 0) { const o = wallAt(0.47, w1, 1.45); W.alleyPeople.push({ x: o.x, z: o.z, yaw: Math.atan2(q.x - o.x, q.z - o.z), pose: null }); } }
    // punto de encuentro: el cliente espera junto a la otra pared, lejos de los que charlan; el
    // del barrio (el que ya usaban los tratos) se muda aquí y, si hay un segundo callejón, otro
    const sp = wallAt(0.68, w0, 0.6), sid = `callejon-${a.zone}`, old = W.spots.find((q) => q.id === sid);
    const navOk = linkAlleyNav(a, sp);
    if (navOk) {
      const name = `Callejón de ${ZONE_NAMES[a.zone] || a.zone}`;
      if (old && !old.alley) Object.assign(old, { x: sp.x, z: sp.z, name, alley: true });
      else W.spots.push({ id: old ? `${sid}-2` : sid, name, x: sp.x, z: sp.z, discreet: true, zone: a.zone, alley: true });
      // y el contenedor sirve de buzón para los pedidos del proveedor
      const c = at(0.18, w0), id = `drop-${W.drops.length}`;
      W.drops.push({ id, name, x: c.x, z: c.z, zone: a.zone });
      K.hitbox(c.x, 0.7, c.z, 1.9, 1.4, 1.9, { actions: () => G.act.deadDropActions(id), info: () => `Contenedor · ${name}` });
    }
    W.alleys.push({ x0: a.x0, x1: a.x1, z0: a.z0, z1: a.z1, cx: (a.x0 + a.x1) / 2, cz: (a.z0 + a.z1) / 2, run: a.run, zone: a.zone, kind: a.kind });
  }
}
// Solar llano para un edificio (relieve) a la altura de la acera delante de su fachada, con
// un zócalo de piedra por debajo que tapa la junta con el talud alrededor
function pad(x0, x1, z0, z1, ry, tag = '', h) {
  FOOT.push({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), tag });
  const s = Math.round(Math.sin(ry)), c = Math.round(Math.cos(ry));
  addPad(x0, x1, z0, z1, { h, front: c > 0 ? '+z' : c < 0 ? '-z' : s > 0 ? '+x' : '-x' });
  // (la caja del modelo incluye aleros y porches: el zócalo queda bajo el césped y solo
  // asoma donde el terreno baja)
  B.box('#8a8176', (x0 + x1) / 2, -1.1, (z0 + z1) / 2, x1 - x0 - 1.2, 1.06, z1 - z0 - 1.2, 0, { ao: 0 });
}
const HOUSES = ['h_house1', 'h_house2', 'h_house3', 'h_house4', 'h_house5', 'h_house6'];
// Casa con jardín: devuelve el punto de la puerta (como K.house) para los vecinos
function houseAt(x, z, front, seed) {
  const ry = front === '+z' ? 0 : Math.PI, f = front === '+z' ? 1 : -1;
  const r = modelBuilding(HOUSES[seed % HOUSES.length], x, z, ry, { mapColor: '#c9b28e' });
  if (!r) return K.house(x, z, front, seed);
  const zf = f > 0 ? r.z1 : r.z0; // (el camino a la puerta lo pone buildPaths)
  return { x, z: zf + f * 1.2 };
}

// Local realista (realbuilding) con su colisión, su rectángulo y su nombre en el mapa.
// Devuelve el punto delante de la puerta o null si las texturas no están (se usa el de antes).
function realAt(key, make, x, z, ry, { label, mapColor = '#b9a68a' } = {}) {
  if (!hasBuilding('q_Flat')) return null; // sin modelos/texturas cargados: edificio clásico
  const r = make(), door = r.door;
  const box = F.place('real:' + key, () => r.group, x, z, ry);
  const turned = Math.abs(Math.sin(ry)) > 0.5, c = Math.cos(ry), sn = Math.sin(ry);
  const hw = (turned ? box.max.z - box.min.z : box.max.x - box.min.x) / 2, hd = (turned ? box.max.x - box.min.x : box.max.z - box.min.z) / 2;
  W.mapRects.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, c: mapColor });
  pad(x - hw, x + hw, z - hd, z + hd, ry, key);
  DOORS.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, x, z, ry, house: false });
  if (label) W.mapLabels.push({ x, z, t: label });
  return door ? { x: x + door.x * c + door.z * sn, z: z - door.x * sn + door.z * c } : { x, z };
}
// Cómo es cada local (paredes, piedra, toldo, rótulo, plantas)
const LOOK = {
  esquina: { wall: 'claro', stone: 'blanco', awning: '#2b7bd1', floors: 2 },
  corteFino: { wall: 'ladrilloOscuro', stone: 'claro', awning: '#2a2a2a', floors: 3 },
  lavanderia: { wall: 'blanco', stone: 'claro', awning: '#2b7bd1', floors: 2 },
  ropa: { wall: 'beige', stone: 'blanco', awning: '#8b5a2b', floors: 2 },
  muebles: { wall: 'ladrilloViejo', stone: 'claro', awning: '#6b4226', floors: 2 },
  oficinas: { wall: 'enfoscado', stone: 'blanco', floors: 4, kind: 'oficina', upKind: 'oficina' },
  mercado: { wall: 'ladrilloRojo', stone: 'claro', awning: '#c0392b', floors: 1 },
  palmeras: { wall: 'beige', stone: 'blanco', awning: '#c0662a', floors: 2, kind: 'bar' },
  casino: { wall: 'claro', stone: 'blanco', awning: '#7a1f1f', floors: 3, kind: 'bar' },
  cartel: { wall: 'ladrilloOscuro', stone: 'hormigon', awning: '#3a1010', floors: 2, kind: 'bar' },
  comisaria: { wall: 'enfoscado', stone: 'blanco', floors: 3, kind: 'oficina', upKind: 'oficina', shopFront: false },
};

// ------------------------------------------------------------------
//  Césped: solares de las manzanas y matas de hierba por toda la isla
// ------------------------------------------------------------------
const LAWNS = [], HARD = [], DRAPE = [], LAWN_GEO = [], DOORS = [], PATH_ENDS = [];
// huellas de todos los edificios (para que ninguno se meta dentro de otro)
const FOOT = [];
const overlapArea = (a, b, m = 0) => Math.max(0, Math.min(a.x1, b.x1) - Math.max(a.x0, b.x0) + m) * Math.max(0, Math.min(a.z1, b.z1) - Math.max(a.z0, b.z0) + m);
const footFree = (r, m = 0) => !FOOT.some((q) => overlapArea(r, q, m) > 0);
let restoreK = () => {};
// Qué hay libre en cada punto (para repartir la vegetación sin tapar nada)
function freeMap() {
  const inRect = (x, z, r, m = 0) => x > r.x0 - m && x < r.x1 + m && z > r.z0 - m && z < r.z1 + m;
  const solid = W.mapRects.filter((r) => !r.road && !r.zone && (r.x1 - r.x0) * (r.z1 - r.z0) < 4000);
  const hard = HARD.map(([x0, x1, z0, z1]) => ({ x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1) }));
  const shape = islandShape(-3).getPoints(24);
  const inside = (x, z) => { let c = false; for (let i = 0, j = shape.length - 1; i < shape.length; j = i++) { const a = shape[i], b = shape[j]; if ((a.y > z) !== (b.y > z) && x < ((b.x - a.x) * (z - a.y)) / (b.y - a.y) + a.x) c = !c; } return c; };
  // distancia al eje de la calle más cercana (dentro de la cuadrícula y la circunvalación)
  const roadD = (x, z) => {
    let d = 1e9;
    if (z > ZL[0] - K.SWO - 1 && z < ZL[ROWS] + K.SWO + 1) for (const rx of XL) d = Math.min(d, Math.abs(x - rx));
    if (x > XL[0] - K.SWO - 1 && x < XL[COLS] + K.SWO + 1) for (const rz of ZL) d = Math.min(d, Math.abs(z - rz));
    return d;
  };
  const zoneAt = (x, z) => W.zones.find((zn) => inRect(x, z, zn, 0.5));
  // puertas y puntos de paso: alrededor y en el pasillo hasta la calle más cercana, nada
  const keep = [...W.homes, ...Object.values(W.pois), ...W.spots, ...(W.atms || [])].filter((p) => p && Number.isFinite(p.x));
  const blocked = (x, z, r) => keep.some((p) => {
    if (Math.hypot(p.x - x, p.z - z) < r) return true;
    const ax = Math.min(...XL.map((v) => Math.abs(p.x - v))), az = Math.min(...ZL.map((v) => Math.abs(p.z - v)));
    if (az <= ax) { const rz = ZL.reduce((a, v) => (Math.abs(p.z - v) < Math.abs(p.z - a) ? v : a)); return Math.abs(x - p.x) < 2.2 && (z - p.z) * (z - rz) <= 0; }
    const rx = XL.reduce((a, v) => (Math.abs(p.x - v) < Math.abs(p.x - a) ? v : a)); return Math.abs(z - p.z) < 2.2 && (x - p.x) * (x - rx) <= 0;
  });
  const nearSolid = (x, z, m) => solid.some((r) => inRect(x, z, r, m));
  const onHard = (x, z, m) => hard.some((r) => inRect(x, z, r, m));
  return { inside, roadD, zoneAt, blocked, nearSolid, onHard };
}
// Caminos: de la acera a la puerta de cada casa y edificio (baldosas), entrada de coche en los
// chalets y senderos de tierra en el parque y el bosque. Donde el camino cruza un escalón del
// terreno, el muro se abre y se ponen escalones (retainingWalls).
function buildPaths() {
  const edgeAlong = (v0, dir, lines) => { // borde de acera más cercano delante, en una dirección
    let best = null;
    for (const v of lines) for (const e of [v - K.SWO, v + K.SWO]) if ((e - v0) * dir > 0.2 && (best === null || Math.abs(e - v0) < Math.abs(best - v0))) best = e;
    return best;
  };
  for (const d of DOORS) {
    const fx = Math.round(Math.sin(d.ry)), fz = Math.round(Math.cos(d.ry));
    const front = fz ? (fz > 0 ? d.z1 : d.z0) : fx > 0 ? d.x1 : d.x0;
    const edge = fz ? edgeAlong(front, fz, ZL) : edgeAlong(front, fx, XL);
    if (edge === null || Math.abs(edge - front) > 26) continue;
    const strip = (lat, w, color) => { // franja de la fachada a la acera, desplazada `lat` a un lado
      if (fz) { const cx = d.x + lat; K.paving(cx - w / 2, cx + w / 2, Math.min(front, edge), Math.max(front, edge), color, null, 1.2); PATH_ENDS.push({ x: cx, z: edge, fx: 0, fz, w }); }
      else { const cz = d.z - lat; K.paving(Math.min(front, edge), Math.max(front, edge), cz - w / 2, cz + w / 2, color, null, 1.2); PATH_ENDS.push({ x: edge, z: cz, fx, fz: 0, w }); }
    };
    strip(0, 1.4, '#d6ccb8'); // a la puerta
    if (d.house) { const half = (fz ? d.x1 - d.x0 : d.z1 - d.z0) / 2; if (half > 3.5) strip(half - 1.9, 3, '#bdb7ad'); } // entrada de coche
  }
  // senderos de tierra: parque (anillo alrededor de la fuente) y bosque (ruta en zigzag)
  const trail = (pts) => {
    for (let i = 0; i + 1 < pts.length; i++) {
      const [ax, az] = pts[i], [bx, bz] = pts[i + 1], len = Math.hypot(bx - ax, bz - az);
      B.box('#b39b74', (ax + bx) / 2, 0, (az + bz) / 2, 1.7, 0.08, len + 0.8, Math.atan2(bx - ax, bz - az), { shadow: false, ao: 0 });
      for (let k = 0; k <= len; k += 1.5) { const x = ax + ((bx - ax) * k) / len, z = az + ((bz - az) * k) / len; HARD.push([x - 0.9, x + 0.9, z - 0.9, z + 0.9]); }
    }
  };
  const park = blockOf('parque');
  if (park) { const r = 13, pts = []; for (let k = 0; k <= 12; k++) { const a = (k / 12) * Math.PI * 2 + 0.26; pts.push([park.cx + Math.cos(a) * r, park.cz + Math.sin(a) * r]); } trail(pts); }
  const fo = blockOf('bosque');
  if (fo) trail([[fo.x0 + 3, fo.z1 - 4], [fo.cx - 10, fo.cz + 10], [fo.cx + 6, fo.cz + 4], [fo.cx - 4, fo.cz - 8], [fo.x1 - 4, fo.z0 + 4]]);
}

// Muros de contención: donde el suelo da un escalón (borde de manzana contra la acera, o entre
// dos solares a distinta altura) se levanta un muro de piedra que lo tapa, como en los pueblos
// en cuesta. Se calcula al final, con el relieve ya completo.
function retainingWalls() {
  const lines = [];
  for (const b of W.zones) lines.push([b.x1, b.z1, b.x0, b.z1], [b.x0, b.z1, b.x0, b.z0], [b.x0, b.z0, b.x1, b.z0], [b.x1, b.z0, b.x1, b.z1]);
  for (const p of allPads()) lines.push([p.x1, p.z1, p.x0, p.z1], [p.x0, p.z1, p.x0, p.z0], [p.x0, p.z0, p.x1, p.z0], [p.x1, p.z0, p.x1, p.z1]);
  const parts = [];
  for (const [x0, z0, x1, z1] of lines) {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.2)), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
    const nx = -dz, nz = dx; // hacia dentro
    for (let k = 0; k < n; k++) {
      const t = (k + 0.5) / n, mx = x0 + (x1 - x0) * t, mz = z0 + (z1 - z0) * t;
      const hin = groundH(mx + nx * 0.25, mz + nz * 0.25), hout = groundH(mx - nx * 0.25, mz - nz * 0.25);
      if (Math.abs(hin - hout) < 0.3) continue;
      if (PATH_ENDS.some((pe) => Math.hypot(pe.x - mx, pe.z - mz) < pe.w / 2 + 0.7)) continue; // aquí entra un camino
      const lo = Math.min(hin, hout) - 0.35, hi = Math.max(hin, hout) + 0.12, seg = len / n + 0.04;
      const g = new THREE.BoxGeometry(seg, hi - lo, 0.35);
      g.rotateY(Math.atan2(-dz, dx));
      g.translate(mx + nx * 0.1, (hi + lo) / 2, mz + nz * 0.1);
      const P = g.attributes.position, N = g.attributes.normal, uv = g.attributes.uv;
      for (let i = 0; i < P.count; i++) uv.setXY(i, Math.abs(N.getX(i)) > 0.5 ? P.getZ(i) / 3 : P.getX(i) / 3, Math.abs(N.getY(i)) > 0.5 ? P.getZ(i) / 3 : P.getY(i) / 3);
      parts.push(g);
    }
  }
  // escalones donde un camino a una puerta cruza un desnivel (en las entradas de coche, rampa)
  for (const pe of PATH_ENDS) {
    if (pe.w > 2) continue;
    const dx = pe.fx, dz = pe.fz; // del edificio hacia la calle
    const hin = groundH(pe.x - dx * 0.4, pe.z - dz * 0.4), hout = groundH(pe.x + dx * 0.4, pe.z + dz * 0.4);
    const diff = hin - hout;
    if (Math.abs(diff) < 0.25) continue;
    const n = Math.ceil(Math.abs(diff) / 0.17), rise = Math.abs(diff) / n, lo = Math.min(hin, hout);
    for (let i = 0; i < n; i++) {
      // por el lado bajo: en la acera si la manzana está más alta, dentro si está más baja
      const t = 0.15 + i * 0.3, sx = diff > 0 ? pe.x + dx * t : pe.x - dx * t, sz = diff > 0 ? pe.z + dz * t : pe.z - dz * t;
      const top = lo + (n - i) * rise, g = new THREE.BoxGeometry(dx ? 0.3 : pe.w + 0.2, top - lo + 0.1, dz ? 0.3 : pe.w + 0.2);
      g.translate(sx, (top + lo - 0.1) / 2, sz);
      parts.push(g);
    }
  }
  if (!parts.length) return;
  const m = new THREE.Mesh(mergeGeometries(parts), pbrMat('hormigon', '#b9ab95'));
  m.castShadow = m.receiveShadow = true; m.userData.terrainDone = true;
  scene.add(m);
  W.wallCount = parts.length;
}

// Bordes del césped (contra aceras, caminos y arena): trozos de ~1 m con el césped a la
// izquierda del sentido de avance; se quitan los que caen sobre asfalto, baldosas o edificios
function fringeLines() {
  const M = freeMap(), out = [];
  const piece = (x0, z0, x1, z1) => {
    const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.round(len / 1.1));
    for (let k = 0; k < n; k++) {
      const a = k / n, b = (k + 1) / n, mx = x0 + (x1 - x0) * (a + b) / 2, mz = z0 + (z1 - z0) * (a + b) / 2;
      if (M.onHard(mx, mz, 0.2) || M.nearSolid(mx, mz, 0.2) || !M.inside(mx, mz)) continue;
      out.push([x0 + (x1 - x0) * a, z0 + (z1 - z0) * a, x0 + (x1 - x0) * b, z0 + (z1 - z0) * b]);
    }
  };
  for (const b of W.zones) {
    if (b.kind === 'industrial') continue;
    piece(b.x1, b.z1, b.x0, b.z1); piece(b.x0, b.z1, b.x0, b.z0); piece(b.x0, b.z0, b.x1, b.z0); piece(b.x1, b.z0, b.x1, b.z1);
  }
  const zN = ZL[ROWS] + K.SWO, zS = ZL[0] - K.SWO, xW = XL[0] - K.SWO, xE = XL[COLS] + K.SWO;
  piece(xW, zN, xE, zN); piece(xE, zS, xW, zS); piece(xW, zS, xW, zN); piece(xE, zN, xE, zS);
  return out;
}

// ruido suave para agrupar la vegetación en manchas (nada de rejillas repetidas)
const clump = (x, z) => 0.5 + 0.25 * Math.sin(x * 0.083 + Math.sin(z * 0.061) * 2.1) + 0.25 * Math.sin(z * 0.071 - x * 0.033 + 0.7);

// Matas de hierba, plantas de hoja larga, flores y rocas por todo el césped
function scatterTufts() {
  const M = freeMap();
  const industrial = (x, z) => M.zoneAt(x, z)?.kind === 'industrial';
  let n = 0, plants = 0, flowers = 0, rocks = 0;
  for (let x = N.x0 - 28; x < N.x1 + 28; x += 2.6) for (let z = N.z0 - 24; z < N.z1 + 18; z += 2.6) {
    const px = x + R() * 2.4, pz = z + R() * 2.4, c = clump(px, pz);
    if (R() > 0.18 + c * 0.4 || !M.inside(px, pz) || M.roadD(px, pz) < K.SWO + 0.6 || industrial(px, pz)) continue;
    if (M.nearSolid(px, pz, 0.6) || M.onHard(px, pz, 0.4)) continue;
    const k = R();
    if (k < 0.06 && plants < 150 && !M.blocked(px, pz, 1.5)) { F.place('planta' + (plants % 4), () => plantaHojas((plants % 4) + 1), px, pz, R() * 6.28, { solid: false, s: rr(0.8, 1.2) }); plants++; continue; }
    if (k < 0.13 && flowers < 200) { F.place('flores' + (flowers % 3), () => flores((flowers % 3) + 1), px, pz, R() * 6.28, { solid: false, s: rr(0.85, 1.25) }); flowers++; continue; }
    if (k < 0.15 && rocks < 60 && !M.blocked(px, pz, 1.5)) { F.place('roca' + (rocks % 4), () => roca((rocks % 4) + 1), px, pz, R() * 6.28, { solid: false, s: rr(0.6, 1.3) }); rocks++; continue; }
    F.place('mata', tuft, px, pz, R() * 6.28, { solid: false, s: 0.7 + R() * 0.8 });
    n++;
  }
  W.tuftCount = n;
  W.greenCount = { ...(W.greenCount || {}), plants, flowers, rocks };
}

// Árboles y arbustos en los jardines y solares (nunca en las aceras, delante de una
// puerta ni en el camino de entrada): manchas irregulares, más en las zonas residenciales
function scatterGreens() {
  const M = freeMap();
  const P = { residencial: 0.34, comercio: 0.14, ocio: 0.2, servicio: 0.1, verde: 0.12, industrial: 0 };
  const trees = [];
  for (let x = N.x0 - 28; x < N.x1 + 28; x += 6.5) for (let z = N.z0 - 24; z < N.z1 + 18; z += 6.5) {
    const px = x + R() * 5, pz = z + R() * 5, zn = M.zoneAt(px, pz);
    const coast = !zn && (pz > ZL[ROWS] + 8 || pz < ZL[0] - 8 || px < XL[0] - 8 || px > XL[COLS] + 8);
    const p = zn ? P[zn.kind] ?? 0.1 : coast ? 0.22 : 0;
    if (R() > p * (0.35 + clump(px, pz) * 1.3)) continue;
    if (!M.inside(px, pz) || M.roadD(px, pz) < K.SWO + 2.4 || M.nearSolid(px, pz, 2.6) || M.onHard(px, pz, 1.8) || M.blocked(px, pz, 5)) continue;
    if (trees.some(([tx, tz]) => Math.hypot(tx - px, tz - pz) < 4.5)) continue;
    trees.push([px, pz]);
    // palmeras, pocas: algún jardín y la costa
    if ((coast && R() < 0.22) || (zn && zn.kind !== 'verde' && R() < 0.07)) palm(px, pz, rr(7, 10));
    else tree(px, pz, rr(0.85, 1.15), R() < 0.4 ? 0 : R() < 0.6 ? 1 : 2);
  }
  // arbustos: arrimados a las fachadas (como en la referencia) y alguno suelto
  let bushes = 0;
  for (let x = N.x0 - 28; x < N.x1 + 28; x += 3.1) for (let z = N.z0 - 24; z < N.z1 + 18; z += 3.1) {
    const px = x + R() * 2.2, pz = z + R() * 2.2, zn = M.zoneAt(px, pz);
    if (!M.inside(px, pz) || (zn && zn.kind === 'industrial')) continue;
    const hug = M.nearSolid(px, pz, 2.6);
    if (bushes >= 320 || R() > (hug ? 0.34 : 0.015 + clump(px, pz) * 0.02)) continue;
    if (M.roadD(px, pz) < K.SWO + 0.9 || M.nearSolid(px, pz, 0.9) || M.onHard(px, pz, 0.6) || M.blocked(px, pz, 2.4)) continue;
    if (trees.some(([tx, tz]) => Math.hypot(tx - px, tz - pz) < 1.8)) continue;
    const k = bushes % 6;
    F.place('arbusto' + k, () => arbusto(k + 1, k < 3 ? 1 : 0.75), px, pz, R() * 6.28, { solid: false, s: rr(0.8, 1.2) });
    bushes++;
  }
  W.greenCount = { ...(W.greenCount || {}), trees: trees.length, bushes };
  W.treeSpots = trees;
}

export function buildIsland() {
  seedN = 7;
  // objetos que se nivelan con base en las cuestas (o no se ponen si es demasiado fuerte)
  F = createFurniture({ addBox: K.addBox, removeBox, keep: /^(paradaBus|taxi|hidrante|noray)/, level: /^(banco|bancoParque|papelera|macetero|cabina|cartel|bici|aparcabicis|reciclaje|buzon|cajaElectrica|seto|seto3|jardin|fuenteAgua|taxi|bolardos|paradaBus|cono|vallaObra|cilindro|hidrante|noray|vallaMad|vallaMetal|caseta|sombrilla|tumbona|toalla|chiringuito|socorrista|kv_)/ });
  LAWNS.length = 0; HARD.length = 0; DRAPE.length = 0; LAWN_GEO.length = 0; DOORS.length = 0; PATH_ENDS.length = 0; FOOT.length = 0;
  const KB = K.building; // los edificios clásicos (fallback, mansión…) también dejan su huella
  K.building = (o) => { FOOT.push({ x0: o.x0, x1: o.x1, z0: o.z0, z1: o.z1, tag: 'kb:' + (o.label || o.sign || o.style || '') }); return KB(o); };
  // apunta el asfalto y las baldosas que se pintan sobre la hierba (ahí no van matas)
  const A = K.asphalt, Pv = K.paving;
  K.asphalt = (...a) => { HARD.push(a.slice(0, 4)); return A(...a); };
  K.paving = (...a) => { HARD.push(a.slice(0, 4)); return Pv(...a); };
  restoreK = () => { K.asphalt = A; K.paving = Pv; K.building = KB; };
  SK.setDetail(0.4); // versión ligera de los modelos para el mapa
  W.atms = [];
  W.roadsX = XL; W.roadsZ = ZL;
  W.bounds = { x0: N.x0 - 28, x1: N.x1 + 28, z0: N.z0 - 24, z1: PORT.z1 + 44 }; // incluye los cabos y el puerto ganado al mar
  W.zones = [];
  buildLandAndSea();
  buildRoadNet();
  buildNavNet();
  buildTraffic();
  buildLightsAndSigns();
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) buildBlock(block(i, j));
  buildCoast();
  buildStreetFurniture();
  buildPaths();
  buildAlleys();
  restoreK();
  // comprobación: edificios que se pisan (área común > 0,5 m²); las pruebas exigen que no haya
  W.footprints = FOOT.slice();
  W.pads = allPads(); // solares llanos (sus bordes con desnivel llevan muro: retainingWalls)
  W.footOverlaps = [];
  for (let i = 0; i < FOOT.length; i++) for (let j = i + 1; j < FOOT.length; j++) {
    const a = overlapArea(FOOT[i], FOOT[j]);
    if (a > 0.5) W.footOverlaps.push({ a: FOOT[i].tag, b: FOOT[j].tag, area: +a.toFixed(1), at: [+((Math.max(FOOT[i].x0, FOOT[j].x0) + Math.min(FOOT[i].x1, FOOT[j].x1)) / 2).toFixed(1), +((Math.max(FOOT[i].z0, FOOT[j].z0) + Math.min(FOOT[i].z1, FOOT[j].z1)) / 2).toFixed(1)] });
  }
  if (W.footOverlaps.length) console.warn('Edificios que se solapan:', W.footOverlaps);
  if (grassReady()) scatterTufts();
  scatterGreens();
  if (grassReady()) { const fr = fringeMesh(scene, fringeLines()); fr.userData.terrainDone = true; LAWN_GEO.push(fr.geometry); }
  const res = F.build(scene);
  cutLawnFromAlleys();
  for (const g of DRAPE) drapeGeometry(g); // calzadas y arena, sobre el relieve
  for (const g of LAWN_GEO) drapeGeometry(g, 0, Hlow); // el césped, por debajo en los escalones
  retainingWalls();
  W.glowMats = res.glowMats;
  W.furnitureStats = res;
  W.furnitureItems = F.items;
  W.furnitureReport = F.report();
  SK.setDetail(1);
  K.buildMountains(); // (sin el skyline de la ciudad antigua: en la isla quedaba flotando sobre el mar)
  W.interiorStats = INT.build(scene); // (las piezas pedidas por los almacenes)
  tempProps();
  if (Object.keys(WAREHOUSES).some((k) => W.props[k]) || W.cartel || W.mansion) warehouseLights();
}

// Tu piso (starterflat.js): bloque de 4 plantas con portal, escalera y el estudio en la
// 1.ª planta. Paredes huecas con sus colisiones, suelo elevado en la escalera y el piso,
// puertas, luces y los puntos de uso (fregadero, nevera, cama, armario).
function starterBuilding(x, z, walkZ) {
  if (!hasBuilding('q_Flat')) return false; // sin texturas: el edificio de relleno de antes
  const f = starterFlat(), at = (o) => ({ x: x + o.x, z: z + o.z });
  F.place('pisoInicial', () => f.group, x, z, 0, { solid: false });
  for (const [x0, x1, z0, z1, h] of f.boxes) K.addBox(x + x0, x + x1, z + z0, z + z1, h);
  // el portal, a ras de la acera (sin escalones ni muro delante)
  const hs = groundH(x + f.portal.x, walkZ + 0.6);
  pad(x - 7, x + 7, z - 6, z + 6, 0, 'piso', hs);
  addPad(x + f.portal.x - 1.2, x + f.portal.x + 1.2, z + 6, walkZ - 0.4, { h: hs, m: 1.5 }); // la entrada, llana
  K.paving(x + f.portal.x - 0.8, x + f.portal.x + 0.8, z + 6, walkZ, '#d6ccb8', null, 1.2); // camino al portal
  let base = null; // altura del solar (se lee la primera vez, con el relieve ya montado)
  for (const fl of f.floors) addFloor(x + fl.x0, x + fl.x1, z + fl.z0, z + fl.z1, (px, pz) => (base ??= groundH(x, z)) + fl.h(px - x, pz - z));
  // suelo de madera (donde se colocan las macetas y las mesas)
  for (const p of f.floorPlanes) {
    const map = pisoWoodTex().clone(); map.needsUpdate = true;
    map.repeat.set((p.x1 - p.x0) / 1.6, (p.z1 - p.z0) / 1.6); // tablas de ~20 cm × 1,2 m
    const m = new THREE.Mesh(new THREE.PlaneGeometry(p.x1 - p.x0, p.z1 - p.z0), new THREE.MeshStandardMaterial({ map, roughness: 0.5, emissive: '#ffffff', emissiveMap: map, emissiveIntensity: 0.18 }));
    m.rotation.x = -Math.PI / 2;
    m.position.set(x + (p.x0 + p.x1) / 2, FL + 0.012, z + (p.z0 + p.z1) / 2);
    m.receiveShadow = true;
    m.userData.prop = 'piso';
    scene.add(m);
    W.floors.push(m);
  }
  for (const d of f.doors) {
    const door = K.makeDoor({ x: x + d.x, z: z + d.z, axis: d.axis, width: d.width, h: d.h, color: d.color, flip: d.flip, locked: null }); // se abren siempre (también sin ser tuya: puedes verla por dentro)
    door.pivot.position.y += d.y; door.hit.position.y += d.y; door.hit.updateMatrixWorld();
  }
  for (const l of f.lights) {
    const pl = new THREE.PointLight(l.color, l.i, l.d, 1.6);
    pl.position.set(x + l.x, l.y, z + l.z);
    scene.add(pl);
    W.lights.push(pl);
  }
  const hit = (o, actions) => K.hitbox(x + o.x, o.y, z + o.z, o.w, o.h, o.d, { actions });
  hit(f.acts.sink, () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }]);
  hit(f.acts.basin, () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }]);
  hit(f.acts.fridge, () => [{ label: 'Abrir la nevera', fn: () => { G.act.sfx?.('door'); G.act.toast('Dos cervezas, medio limón y un táper de Leo. Habrá que hacer la compra.', '🧊'); } }]);
  hit(f.acts.bed, () => [{ label: 'Dormir', fn: () => G.act.sleep('piso') }]);
  hit(f.acts.wardrobe, () => [{ label: 'Abrir el armario', fn: () => G.act.openBag?.() }]);
  const r = f.flat;
  W.props.piso = { x0: x + r.x0, x1: x + r.x1, z0: z + r.z0, z1: z + r.z1, name: 'Tu piso', spawn: { ...at(f.spawn), yaw: f.spawn.yaw }, indoor: true };
  W.pois.piso = at(f.portal);
  W.pisoLeo = { ...at(f.leo), yaw: f.leo.yaw };
  W.mapRects.push({ x0: x - 7, x1: x + 7, z0: z - 6, z1: z + 6, c: '#5f7f9a' });
  W.mapLabels.push({ x, z, t: 'Tu piso' });
  W.spots.push({ id: 'piso', name: 'Delante de tu portal', x: x + f.portal.x, z: z + f.portal.z + 1.5 });
  DOORS.push({ x0: x - 7, x1: x + 7, z0: z - 6, z1: z + 6, x: x + f.portal.x, z, ry: 0, house: false });
  return true;
}

// PROVISIONAL (fase 1): propiedades y puntos que el resto del juego espera encontrar.
// En la fase 2 se sustituyen por los locales reales (piso inicial, almacenes, etc.).
function tempProps() {
  const a = blockOf('apartamentos'), w = blockOf('almacenBravo');
  // la nave de Leo es ahora el Almacén Bravo (se compra más adelante; no es tuya al empezar)
  if (!W.props.almacenBravo) { // (sin el almacén de verdad, la nave provisional de antes)
    W.props.nave = { x0: w.x0 + 4, x1: w.x1 - 4, z0: w.cz - 8, z1: w.cz + 14, name: 'Almacén Bravo', spawn: { x: w.cx, z: w.z1 + 2, yaw: Math.PI } };
    W.pois.nave = { x: w.cx, z: w.z1 + 2 };
  }
  W.pois.deadDrop = { x: w.x0 + 8, z: w.z0 + 3.2 };
  W.pois.bungalow = { x: a.cx, z: a.z1 + 2 };
  W.pois.inicio = W.props.piso ? { ...W.props.piso.spawn } : { x: a.cx, z: a.z1 + 2 };
  W.worker = W.pisoLeo || { x: w.cx + 3, z: w.z1 + 3, yaw: 0 }; // Leo te espera en tu piso
}

// ------------------------------------------------------------------
//  Tierra, playa y mar
// ------------------------------------------------------------------
function islandShape(pad = 0) {
  // la orilla con sus cabos y calas (terrain.coastOutline), desplazada `pad` metros al mar
  const pts = coastOutline(pad);
  const s = new THREE.Shape();
  s.moveTo(pts[0][0], pts[0][1]);
  for (let k = 1; k < pts.length; k++) s.lineTo(pts[k][0], pts[k][1]);
  s.closePath();
  return s;
}
function buildLandAndSea() {
  const flat = (shape, color, y, map) => {
    const g = new THREE.ShapeGeometry(shape, 24);
    g.rotateX(Math.PI / 2); // la forma está en XY: pasa a XZ (y→z)
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, map, roughness: 1, side: THREE.DoubleSide }));
    m.position.y = y;
    m.receiveShadow = true;
    scene.add(m);
    return m;
  };
  // arena (borde de toda la isla) y hierba encima
  flat(islandShape(10), 0xe2cf9a, -0.06);
  if (grassReady()) { const lawn = islandLawn(scene, islandShape(0), -0.05); lawn.userData.terrainDone = true; trimLawnAtShore(lawn.geometry); LAWN_GEO.push(lawn.geometry); } // césped realista en toda la isla
  else {
    const gt = K.TX.groundTex('#7d9a4c', 3);
    gt.repeat.set(0.18, 0.18);
    gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
    flat(islandShape(0), 0xffffff, -0.01, gt);
  }
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x24688f, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.94 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.35;
  water.userData.terrainDone = true;
  scene.add(water);
  W.water = water;
  // límites: no se puede salir al mar más de unos metros (siguiendo la orilla con sus cabos);
  // el puerto, que sale al mar, tiene su propio cierre
  const inPort = (x, z) => x > PORT.x0 - 1.5 && x < PORT.x1 + 1.5 && z > N.z1 - 12;
  W.coastClamp = (pos) => {
    const sd = shoreDist(pos.x, pos.z);
    if (sd >= -7 || inPort(pos.x, pos.z)) return false;
    const e = 0.5, gx = (shoreDist(pos.x + e, pos.z) - shoreDist(pos.x - e, pos.z)) / (2 * e), gz = (shoreDist(pos.x, pos.z + e) - shoreDist(pos.x, pos.z - e)) / (2 * e);
    const gl = Math.hypot(gx, gz) || 1;
    pos.x += (gx / gl) * (-7 - sd); pos.z += (gz / gl) * (-7 - sd); // de vuelta hacia la orilla
    return true;
  };
  W.coastPoly = { sand: coastOutline(10, 6), land: coastOutline(0, 6) };
  W.shoreDist = shoreDist;
  W.mapRects.push({ x0: N.x0 - 10, x1: N.x1 + 10, z0: N.z0 - 10, z1: N.z1 + 10, c: '#e6d39c', coast: 'sand' });
  W.mapRects.push({ x0: N.x0, x1: N.x1, z0: N.z0, z1: N.z1, c: '#6f9a55', coast: 'land' });
}

// ------------------------------------------------------------------
//  Calles, cruces, pasos de cebra y aceras
// ------------------------------------------------------------------
function buildRoadNet() {
  const { RH } = K;
  const rt = K.TX.roadTex();
  const zLen = ZL[ROWS] - ZL[0] + 2 * RH, xLen = XL[COLS] - XL[0] + 2 * RH;
  const matZ = new THREE.MeshStandardMaterial({ map: rt, roughness: 0.95 });
  rt.repeat.set(1, zLen / 12);
  const rt2 = rt.clone(); rt2.needsUpdate = true; rt2.repeat.set(1, xLen / 12);
  const matX = new THREE.MeshStandardMaterial({ map: rt2, roughness: 0.95 });
  const zc = (ZL[0] + ZL[ROWS]) / 2, xc = (XL[0] + XL[COLS]) / 2;
  // calzadas subdivididas cada 3 m para seguir el relieve (se doblan al final, ya con
  // todos los solares de los edificios puestos)
  const road = (w, len, x, y, z, alongX) => {
    const g = new THREE.PlaneGeometry(w, len, 2, Math.ceil(len / 3));
    g.rotateX(-Math.PI / 2);
    if (alongX) g.rotateY(Math.PI / 2);
    g.translate(x, y, z);
    const m = new THREE.Mesh(g, alongX ? matX : matZ);
    m.receiveShadow = true; m.userData.terrainDone = true; scene.add(m);
    DRAPE.push(g);
  };
  for (const x of XL) {
    road(RH * 2, zLen, x, 0.02, zc, false);
    W.mapRects.push({ x0: x - RH, x1: x + RH, z0: ZL[0] - RH, z1: ZL[ROWS] + RH, c: '#3b3f45', road: true });
  }
  for (const z of ZL) {
    road(RH * 2, xLen, xc, 0.021, z, true);
    W.mapRects.push({ x0: XL[0] - RH, x1: XL[COLS] + RH, z0: z - RH, z1: z + RH, c: '#3b3f45', road: true });
  }
  // cruces y pasos de cebra (los de la circunvalación solo hacia dentro)
  for (const x of XL) for (const z of ZL) {
    B.box('#3c3f44', x, 0.0, z, RH * 2, 0.04, RH * 2, 0, { shadow: false, ao: 0 });
    for (let k = -3; k <= 3; k++) {
      if (z < ZL[ROWS]) B.box('#e4e2da', x + k * 1.05, 0, z + RH + 1.0, 0.55, 0.045, 1.6, 0, { shadow: false, ao: 0 });
      if (z > ZL[0]) B.box('#e4e2da', x + k * 1.05, 0, z - RH - 1.0, 0.55, 0.045, 1.6, 0, { shadow: false, ao: 0 });
      if (x < XL[COLS]) B.box('#e4e2da', x + RH + 1.0, 0, z + k * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false, ao: 0 });
      if (x > XL[0]) B.box('#e4e2da', x - RH - 1.0, 0, z + k * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false, ao: 0 });
    }
  }
  // aceras a los dos lados de cada tramo (con bordillo)
  const walk = (ax, az, bx, bz) => { // tramo de acera de A a B (alineado con un eje)
    const len = Math.abs(bx - ax) + Math.abs(bz - az);
    if (len < 0.5) return;
    const alongX = Math.abs(bx - ax) > Math.abs(bz - az);
    const cx = (ax + bx) / 2, cz = (az + bz) / 2;
    if (alongX) B.box('#d2ccc1', cx, 0, cz, len, 0.14, 2.5, 0, { shadow: false, ao: 0, mat: TM.slab, uvScale: [len / 2.5, 1] });
    else B.box('#d2ccc1', cx, 0, cz, 2.5, 0.14, len, 0, { shadow: false, ao: 0, mat: TM.slab, uvScale: [1, len / 2.5] });
  };
  const curb = (ax, az, bx, bz) => {
    const len = Math.abs(bx - ax) + Math.abs(bz - az);
    if (len < 0.5) return;
    if (Math.abs(bx - ax) > Math.abs(bz - az)) B.box('#9a958c', (ax + bx) / 2, 0, az, len, 0.16, 0.14, 0, { shadow: false, ao: 0 });
    else B.box('#9a958c', ax, 0, (az + bz) / 2, 0.14, 0.16, len, 0, { shadow: false, ao: 0 });
  };
  const off = RH + 1.25;
  for (const x of XL) for (let j = 0; j < ROWS; j++) {
    const a = ZL[j] + RH, b = ZL[j + 1] - RH;
    for (const s of [-1, 1]) { walk(x + s * off, a, x + s * off, b); curb(x + s * (RH + 0.06), a, x + s * (RH + 0.06), b); }
  }
  for (const z of ZL) for (let i = 0; i < COLS; i++) {
    const a = XL[i] + RH, b = XL[i + 1] - RH;
    for (const s of [-1, 1]) { walk(a, z + s * off, b, z + s * off); curb(a, z + s * (RH + 0.06), b, z + s * (RH + 0.06)); }
  }
  // esquinas de acera (los cuadrados que unen los tramos)
  for (const x of XL) for (const z of ZL) for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    B.box('#d2ccc1', x + sx * off, 0, z + sz * off, 2.5, 0.14, 2.5, 0, { shadow: false, ao: 0, mat: TM.slab });
  }
}

// Grafo de navegación: las cuatro esquinas de acera de cada cruce, unidas por las aceras
// y por los pasos de cebra (también por fuera de la circunvalación).
function buildNavNet() {
  const Nv = W.nav, id = {};
  const key = (i, j, sx, sz) => `${i},${j},${sx},${sz}`;
  XL.forEach((x, i) => ZL.forEach((z, j) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) id[key(i, j, sx, sz)] = Nv.add(x + sx * K.SWC, z + sz * K.SWC);
  }));
  for (let i = 0; i <= COLS; i++) for (let j = 0; j <= ROWS; j++) {
    for (const s of [-1, 1]) {
      if (i < COLS) Nv.link(id[key(i, j, 1, s)], id[key(i + 1, j, -1, s)]);
      if (j < ROWS) Nv.link(id[key(i, j, s, 1)], id[key(i, j + 1, s, -1)]);
      Nv.link(id[key(i, j, -1, s)], id[key(i, j, 1, s)]); // pasos de cebra
      Nv.link(id[key(i, j, s, -1)], id[key(i, j, s, 1)]);
    }
  }
}

// ------------------------------------------------------------------
//  Tráfico: bucles por la circunvalación y por las calles interiores
// ------------------------------------------------------------------
function buildTraffic() {
  const L = (xs, zs) => [[xs[0], zs[0]], [xs[1], zs[0]], [xs[1], zs[1]], [xs[0], zs[1]]];
  W.trafficLoops = [
    L([XL[0], XL[COLS]], [ZL[0], ZL[ROWS]]),                 // circunvalación
    L([XL[0], XL[COLS]], [ZL[0], ZL[ROWS]]).reverse(),       // y en sentido contrario
    L([XL[1], XL[4]], [ZL[1], ZL[3]]),
    L([XL[3], XL[6]], [ZL[1], ZL[3]]).reverse(),
    L([XL[2], XL[5]], [ZL[0], ZL[2]]),
    L([XL[2], XL[5]], [ZL[2], ZL[4]]).reverse(),
  ];
  W.crosses = [];
  for (const x of XL) for (const z of ZL) W.crosses.push({ x, z });
}

// ------------------------------------------------------------------
//  Semáforos, nombres de calles, farolas y palmeras
// ------------------------------------------------------------------
const STREET_X = ['Av. del Faro', 'C/ Coral', 'C/ Gaviota', 'Av. Central', 'C/ Marina', 'C/ Lonja', 'Av. del Puerto', 'Ronda Este'];
const STREET_Z = ['Ronda Sur', 'C/ Arena', 'Av. Palmeras', 'C/ Mayor', 'Ronda Norte'];
function buildLightsAndSigns() {
  const mk = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  W.tl = { A: { r: mk(0x330000), y: mk(0x332200), g: mk(0x003310) }, B: { r: mk(0x330000), y: mk(0x332200), g: mk(0x003310) } };
  const head = (x, y, z, set, ry) => {
    B.add(K.GEO.box, '#1a1c1f', x, y, z, 0.32, 0.95, 0.28, ry, { mat: 'metal', ao: 0 });
    const fx = Math.sin(ry) * 0.15, fz = Math.cos(ry) * 0.15;
    for (const [c, dy] of [['r', 0.28], ['y', 0], ['g', -0.28]]) B.add(K.GEO.cyl8, '#ffffff', x + fx, y + dy, z + fz, 0.18, 0.06, 0.18, ry - Math.PI / 2, { rz: Math.PI / 2, mat: set[c], ao: 0, shadow: false, global: true });
  };
  XL.forEach((rx, i) => ZL.forEach((rz, j) => {
    const ring = i === 0 || i === COLS || j === 0 || j === ROWS;
    const px = rx + 5.6, pz = rz + 5.6;
    if (!ring) {
      B.add(K.GEO.cyl8, '#2b2e32', px, 2.9, pz, 0.2, 5.8, 0.2, 0, { mat: 'metal' });
      B.box('#2b2e32', px - 2.6, 5.6, pz, 5.2, 0.12, 0.12, 0, { mat: 'metal', ao: 0 });
      head(px - 4.2, 5.1, pz, W.tl.B, 0);
      head(px, 3.6, pz - 0.2, W.tl.A, Math.PI / 2);
      K.addBox(px - 0.15, px + 0.15, pz - 0.15, pz + 0.15, 6);
      const qx = rx - 5.6, qz = rz - 5.6;
      B.add(K.GEO.cyl8, '#2b2e32', qx, 2.9, qz, 0.2, 5.8, 0.2, 0, { mat: 'metal' });
      B.box('#2b2e32', qx + 2.6, 5.6, qz, 5.2, 0.12, 0.12, 0, { mat: 'metal', ao: 0 });
      head(qx + 4.2, 5.1, qz, W.tl.B, Math.PI);
      head(qx, 3.6, qz + 0.2, W.tl.A, -Math.PI / 2);
      K.addBox(qx - 0.15, qx + 0.15, qz - 0.15, qz + 0.15, 6);
      K.streetSign(STREET_Z[j], px, 6.05, pz, 0);
      K.streetSign(STREET_X[i], px, 6.5, pz, Math.PI / 2);
    } else if (i !== 0 && i !== COLS && j !== 0 && j !== ROWS) { /* nada */ } else {
      // poste con señal en los cruces de la circunvalación
      B.add(K.GEO.cyl8, '#5a5f66', px, 1.5, pz, 0.08, 3, 0.08, 0, { mat: 'metal' });
      K.streetSign(STREET_Z[j], px, 2.9, pz, 0);
      K.streetSign(STREET_X[i], px, 3.35, pz, Math.PI / 2);
    }
  }));
}

// ------------------------------------------------------------------
//  Manzanas: el edificio principal del barrio (el del mapa) destaca, y alrededor hay
//  edificios secundarios, un callejón de servicio y algo de verde. Cada manzana deja un
//  rincón discreto (W.spots con discreet: true) para los encuentros con clientes.
// ------------------------------------------------------------------
// ------------------------------------------------------------------
//  Mobiliario de las aceras: farolas alternas y, entre medias, lo propio de cada barrio
// ------------------------------------------------------------------
const CURB = 4.75, WALLSIDE = 5.95; // línea de farolas/árboles (junto al bordillo) y de bancos/cabinas (junto a fachada)
// Un cajero por barrio, en la acera norte de la manzana (la de la entrada principal)
const ATM_ZONES = ['esquina', 'corteFino', 'oficinas', 'casino', 'apartamentos', 'barrioAlto', 'mercado', 'bungalos', 'motel', 'eclipse'];
// Qué se pone en cada barrio, por orden; [modelo, lado ('c' bordillo / 'w' fachada)]
// Dos piezas entre farola y farola, en parejas que tienen sentido (banco y papelera, cabina y
// cartel…). Sin árboles ni palmeras en las aceras: la vegetación va en el césped (scatterGreens)
const RECIPE = {
  residencial: [['banco', 'w'], ['papelera', 'c'], ['buzon', 'w'], ['hidrante', 'c'], ['reciclaje', 'w'], ['macetero', 'w']],
  comercio: [['banco', 'w'], ['papelera', 'c'], ['aparcabicis', 'w'], ['macetero', 'w'], ['cabina', 'w'], ['hidrante', 'c'], ['cartel', 'w'], ['bici', 'w']],
  ocio: [['banco', 'w'], ['papelera', 'c'], ['taxi', 'w'], ['macetero', 'w'], ['cartel', 'w'], ['bolardos', 'c']],
  industrial: [['cajaElectrica', 'w'], ['cono', 'c'], ['vallaObra', 'w'], ['hidrante', 'c'], ['poste', 'c'], ['papelera', 'c']],
  verde: [['bancoParque', 'w'], ['papelera', 'c'], ['fuenteAgua', 'w'], ['seto', 'w'], ['jardin', 'w'], ['papelera', 'c']],
  servicio: [['papelera', 'c'], ['cajaElectrica', 'w'], ['banco', 'w'], ['hidrante', 'c']],
  costa: [['bancoParque', 'w'], ['papelera', 'c']],
};
const MODEL = {
  arbol: [SK.arbol, { hit: 0.5 }], palmera: [() => SK.palmera(), { hit: 0.6 }], banco: [() => SK.banco()], bancoParque: [() => SK.bancoParque()],
  buzon: [SK.buzon], reciclaje: [() => SK.cuboReciclaje()], hidrante: [SK.hidrante], macetero: [SK.macetero], aparcabicis: [() => SK.aparcabicis()],
  papelera: [SK.papelera], cabina: [SK.cabinaTelefono], cartel: [SK.cartelPublicitario], bici: [SK.biciPublica], taxi: [SK.paradaTaxi],
  bolardos: [SK.bolardos], cajaElectrica: [SK.cajaElectrica], cono: [SK.cono], vallaObra: [SK.vallaObra], cilindro: [SK.cilindro],
  poste: [SK.poste, { hit: 0.4 }], fuenteAgua: [SK.fuenteAgua], seto: [() => SK.seto()], jardin: [SK.jardinUrbano],
};
function buildStreetFurniture() {
  const kindAt = (i, j) => (i < 0 || i >= COLS || j < 0 || j >= ROWS ? 'costa' : ZONE_KIND[ZONES[j][i]]);
  const put = (name, x, z, ry, extra = {}) => { const [fn, o] = MODEL[name]; F.place(name, fn, x, z, ry, { ...o, ...extra }); };
  // sucursales del Banco Rooktown (con el cajero empotrado), en la esquina noreste de cada
  // barrio que tiene cajero; si los modelos no cargaron, cajero suelto en la acera como antes
  const reserved = [];
  let BANK = null;
  for (const zone of ATM_ZONES) {
    const b = blockOf(zone), zN = ZL[ROWS - b.j];
    let x = b.cx + 14, z = zN - WALLSIDE;
    if (hasBuilding('q_Flat')) {
      // en la esquina noreste; si ahí ya hay un edificio, en la noroeste (nunca uno dentro de otro)
      const spots = [[b.x1 - 4.6, b.z1 - 3.9], [b.x0 + 4.6, b.z1 - 3.9], [b.cx, b.z1 - 3.9]];
      const [bx, bz] = spots.find(([sx, sz]) => footFree({ x0: sx - 4, x1: sx + 4, z0: sz - 3.5, z1: sz + 3.5 }, 0.3)) || spots[0];
      const info = BANK || (BANK = bankBranch()); // una sola sucursal modelo (el colocador la reutiliza)
      F.place('sucursal', () => info.group, bx, bz, 0); // (clave propia: «banco» es el banco de sentarse)
      pad(bx - 4, bx + 4, bz - 3.5, bz + 3.5, 0, 'sucursal:' + zone);
      W.mapRects.push({ x0: bx - 4, x1: bx + 4, z0: bz - 3.5, z1: bz + 3.5, c: '#1f5fbf' });
      x = bx + info.atm.x; z = bz + info.atm.z;
    }
    F.place('cajero', SK.cajero, x, z, 0, { solid: false });
    K.addBox(x - 0.5, x + 0.5, z - 0.4, z + 0.4, 2.2);
    W.atms.push({ x, z, zone, name: ZONE_NAMES[zone], face: { x, z: z + 1.1 } });
    const atm = W.atms.at(-1);
    K.hitbox(x, 1.1, z + 0.1, 0.9, 2.0, 0.7, { actions: () => [{ label: 'Usar el cajero', fn: () => G.act.openAtm(atm) }], info: () => 'Cajero automático · Banco Rooktown' });
    reserved.push([x, z]);
  }
  // una calle: tramo entre dos cruces; lado s = -1/+1; (along, across) → mundo
  let benchN = 0;
  const segment = (kind, at, faceRy, seed, lampRy) => {
    const len = 46, n = 13, step = len / (n - 1); // un hueco cada ~3,8 m
    const rec = RECIPE[kind];
    let r = seed;
    for (let k = 0; k < n; k++) {
      const t = k * step;
      if (k % 6 === (seed % 2 ? 3 : 0)) { // farola cada ~23 m, al tresbolillo entre aceras
        const [x, z] = at(t, CURB - 0.2);
        F.place('farola', SK.farola, x, z, lampRy, { hit: 0.4 });
        const [lx, lz] = at(t, CURB - 0.2 - 1.6);
        W.lampPools.push([lx, lz]);
        continue;
      }
      // entre dos farolas, solo dos piezas (antes, una cada 3,8 m: demasiadas); el resto, libre
      const slot = (k - (seed % 2 ? 3 : 0) + 6) % 6;
      if (slot !== 2 && slot !== 4) continue;
      const [name, side] = rec[r++ % rec.length];
      if (!name) continue; // hueco libre en la acera
      // bancos de sentarse: solo uno de cada tres huecos que les tocan (había demasiados)
      if ((name === 'banco' || name === 'bancoParque') && (benchN++ % 3)) continue;
      const [x, z] = at(t, side === 'c' ? CURB : WALLSIDE);
      if (reserved.some(([qx, qz]) => Math.hypot(qx - x, qz - z) < 3.5)) continue;
      const ry = name === 'arbol' || name === 'palmera' ? r * 1.7 : name === 'bici' ? faceRy + Math.PI / 2 : faceRy; // la bici, paralela a la calle
      put(name, x, z, ry, name === 'palmera' ? { s: rr(1.3, 1.8) } : name === 'arbol' ? { s: rr(1.1, 1.4) } : {});
    }
  };
  // calles norte-sur
  XL.forEach((x, i) => { for (let j = 0; j < ROWS; j++) for (const s of [-1, 1]) {
    const za = ZL[j] + K.RH + 3, bi = s > 0 ? i : i - 1, bj = ROWS - 1 - j;
    segment(kindAt(bi, bj), (t, d) => [x + s * d, za + t], -s * Math.PI / 2, i * 7 + j * 3 + (s > 0 ? 1 : 0), s > 0 ? Math.PI : 0);
  } });
  // calles este-oeste
  ZL.forEach((z, j) => { for (let i = 0; i < COLS; i++) for (const s of [-1, 1]) {
    const xa = XL[i] + K.RH + 3, bj = s > 0 ? ROWS - 1 - j : ROWS - j;
    segment(kindAt(i, bj), (t, d) => [xa + t, z + s * d], s > 0 ? Math.PI : 0, i * 5 + j * 11 + (s > 0 ? 1 : 0), s > 0 ? Math.PI / 2 : -Math.PI / 2);
  } });
  // paradas de autobús en la acera de algunas avenidas
  for (const [x, z, ry] of [[XL[3] + WALLSIDE - 0.3, -30, -Math.PI / 2], [XL[4] - WALLSIDE + 0.3, 30, Math.PI / 2], [-120, ZL[2] + WALLSIDE - 0.3, Math.PI], [120, ZL[2] - WALLSIDE + 0.3, 0]]) F.place('paradaBus', SK.paradaBus, x, z, ry);
}

function buildBlock(b) {
  const kind = ZONE_KIND[b.zone];
  W.zones.push({ id: b.zone, name: ZONE_NAMES[b.zone], kind, ...b });
  W.mapLabels.push({ x: b.cx, z: b.cz, t: ZONE_NAMES[b.zone], zone: b.zone });
  W.mapRects.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1, c: ZONE_COLOR[kind], zone: true });
  // césped / suelo del solar
  const ground = kind === 'industrial' ? '#8d8f8c' : kind === 'verde' ? '#6e9a4d' : '#86a35a';
  if (kind !== 'industrial' && grassReady()) LAWNS.push({ x0: b.x0, x1: b.x1, z0: b.z0, z1: b.z1 }); // césped (se monta junto al final)
  else B.box(ground, b.cx, 0, b.cz, b.x1 - b.x0, 0.06, b.z1 - b.z0, 0, { shadow: false, ao: 0 });
  const fn = FILL[kind] || FILL.comercio;
  fn(b);
  // callejón de servicio por detrás (lado sur de la manzana) con contenedores: rincón
  // discreto para encuentros (no en todas: los parques y el bosque no tienen)
  if (kind !== 'verde') alley(b);
  W.wander.push({ x: b.cx, z: b.z1 + 1.2 }); // los peatones pasean por delante de cada manzana
}

// Calle sin salida / callejón: franja de asfalto de 5 m por el lado sur de la manzana,
// con contenedores, cajas y una farola tenue. Deja un punto de encuentro discreto.
function alley(b) {
  const z0 = b.z0, z1 = b.z0 + 5;
  K.asphalt(b.x0 + 4, b.x1 - 4, z0 + 0.2, z1, '#3f4247');
  K.dumpster(b.x0 + 8, z0 + 1.6, 0, ['#2e6b4a', '#3b6e8f', '#6b3b3b'][b.i % 3]);
  K.cardBox(b.x0 + 10.6, 0, z0 + 1.3, 0.7, 0.55, 0.6, 0.3, true);
  K.cardBox(b.x1 - 9, 0, z0 + 1.2, 0.6, 0.45, 0.5, -0.2, true);
  W.spots.push({ id: `callejon-${b.zone}`, name: `Callejón de ${ZONE_NAMES[b.zone]}`, x: (b.x0 + b.x1) / 2, z: z0 + 2.5, discreet: true, zone: b.zone });
}

// ------------------------------------------------------------------
//  Almacenes que se pueden comprar (app Inmobiliaria del móvil): nave hueca con su interior,
//  puerta de la oficina (cerrada con llave si no es tuyo), suelo de hormigón donde se
//  colocan macetas y mesas, estanterías al fondo para guardar mercancía.
// ------------------------------------------------------------------
export const WAREHOUSES = {
  almacenDelta: { w: 20, d: 14, doors: 1, level: 0, price: 6000, blurb: 'El más pequeño: buena nave para empezar a cultivar en serio.' },
  almacenBravo: { w: 26, d: 16, doors: 2, level: 1, price: 12000, blurb: 'Nave mediana con estanterías al fondo y sitio de sobra para mesas.' },
  almacenAlfa: { w: 30, d: 16, doors: 2, level: 2, price: 20000, blurb: 'La más grande de la isla: para montar un negocio con empleados.' },
};
function warehouseFor(b) {
  if (!hasBuilding('q_Flat')) return false; // sin texturas: la nave de relleno de siempre
  const spec = WAREHOUSES[b.zone], id = b.zone, name = ZONE_NAMES[id];
  const w = spec.w, d = spec.d, x = b.cx, z = b.cz + 3 + (22 - d) / 2; // (la fachada sigue en el mismo sitio)
  const r = ownedWarehouse({ w, d, h: 9, sign: name.toUpperCase(), signBg: '#34495e', doors: spec.doors, level: spec.level });
  F.place('real:' + id, () => r.group, x, z, 0, { solid: false });
  pad(x - w / 2 - 0.3, x + w / 2 + 0.3, z - d / 2 - 0.3, z + d / 2 + 0.3, 0, id);
  // colisiones con nivel (entreplanta): 'up' sólo arriba, 'down' sólo abajo, 'low' a ras de suelo
  const gy = groundH(x, z);
  for (const [x0, x1, z0, z1, h, lv] of r.boxes) {
    const c = K.addBox(x + x0, x + x1, z + z0, z + z1, h);
    if (lv === 'up') c.yMin = gy + FH - 0.6;
    else if (lv === 'down') c.yMax = gy + FH - 0.8;
    else if (lv === 'low') c.yMax = gy + 0.45;
  }
  // muebles y cosas (modelos de interior.js), en coordenadas del mundo
  for (const it of r.items) INT.place(it.name, x + it.x, it.y, z + it.z, it.ry, it.s);
  // suelos de arriba: la entreplanta y la escalera (sólo se pisan llegando desde arriba)
  for (const f of r.floors) addFloor(x + f.x0, x + f.x1, z + f.z0, z + f.z1, (px, pz) => gy + f.h(px - x, pz - z), { upper: true });
  W.mapRects.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, c: '#8a9aa6' });
  W.mapLabels.push({ x, z, t: name });
  DOORS.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2, x, z, ry: 0, house: false });
  // carretilla, transpaleta y palés sueltos dentro de la nave
  const ge = r.gear;
  if (ge.forklift) { K.forklift(x + ge.forklift.x, z + ge.forklift.z, ge.forklift.ry); K.addBox(x + ge.forklift.x - 0.7, x + ge.forklift.x + 0.7, z + ge.forklift.z - 1.4, z + ge.forklift.z + 1.4, 2.2); }
  if (ge.jack) K.palletJack(x + ge.jack.x, z + ge.jack.z, ge.jack.ry);
  for (const [px, pz, n] of ge.pallets) K.pallet(x + px, z + pz, 0, n); // (cada palé ya lleva su colisión)
  // las estanterías del fondo: un almacén grande (se abre desde el pasillo de delante)
  const rk = r.rack;
  K.hitbox(x + (rk.x0 + rk.x1) / 2, 1.4, z + rk.z1 + 0.2, rk.x1 - rk.x0, 2.8, 0.5, {
    actions: () => (G.state.props[id]
      ? [{ label: 'Abrir estanterías', fn: () => G.act.openShelf(rackStore(id)) }]
      : [{ label: 'Estanterías', fn: () => G.act.toast?.('El almacén no es tuyo.') }]),
  });
  // el sofá de la oficina: se puede dormir
  const so = r.office.sofa;
  if (so) K.hitbox(x + so.x, so.y + 0.5, z + so.z, 1.0, 1.0, 2.2, {
    actions: () => (G.state.props[id] ? [{ label: 'Dormir en el sofá', fn: () => G.act.sleep(id, { wake: 7 * 60 }) }] : []),
  });
  // la puerta de la oficina: sólo se abre si el almacén es tuyo
  K.makeDoor({ x: x + r.leaf.x, z: z + r.leaf.z, axis: 'x', width: r.leaf.width, h: 2.25, color: '#5d6670', locked: () => !G.state.props[id] });
  // suelo de hormigón (es el que recibe macetas y mesas)
  const f = r.floor, fw = f.x1 - f.x0, fd = f.z1 - f.z0;
  const geo = new THREE.PlaneGeometry(fw, fd);
  const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (uv.getX(i) * fw) / 6, (uv.getY(i) * fd) / 6); // (cuadros de 6 m)
  const fm = new THREE.Mesh(geo, naveFloorMat());
  fm.rotation.x = -Math.PI / 2;
  fm.position.set(x + (f.x0 + f.x1) / 2, 0.02, z + (f.z0 + f.z1) / 2);
  fm.receiveShadow = true;
  fm.userData.prop = id;
  scene.add(fm);
  W.floors.push(fm);
  const i = r.inside;
  W.props[id] = {
    x0: x + i.x0, x1: x + i.x1, z0: z + i.z0, z1: z + i.z1, name, price: spec.price, blurb: spec.blurb, warehouse: true, indoor: true, doors: spec.doors, level: spec.level, height: 8, office: Math.round([8, 9.5, 10.5][spec.level] * 4.35),
    spawn: { x: x + r.entry.x, z: z + r.entry.z, yaw: Math.PI }, area: Math.round((i.x1 - i.x0) * (i.z1 - i.z0)),
    rack: { x0: x + rk.x0, x1: x + rk.x1, z0: z + rk.z0, z1: z + rk.z1 }, lamps: r.lamps.map((l) => ({ x: x + l.x, y: l.y, z: z + l.z })),
  };
  W.pois[id] = { x: x + r.door.x, z: z + r.door.z };
  return true;
}
// Luz de dentro: dos luces para todos los almacenes, que se van al almacén en el que estás
// y se apagan fuera (siempre las mismas dos: cambiar el número de luces recompila los shaders)
// El Cartel: cuartel hueco con recibidor, sala y despacho (world/cartel.js). El portero sólo
// deja pasar desde Trapichero (rango 2).
export const CARTEL_RANK = 2;
function cartelFor(b) {
  if (!hasBuilding('q_Flat')) return false;
  const r = cartelHQ(), x = b.cx, z = b.cz + 2;
  F.place('real:cartel', () => r.group, x, z, 0, { solid: false });
  pad(x - 12.3, x + 12.3, z - 9.3, z + 9.3, 0, 'cartel');
  for (const [x0, x1, z0, z1, h] of r.boxes) K.addBox(x + x0, x + x1, z + z0, z + z1, h);
  for (const it of r.items) INT.place(it.name, x + it.x, it.y, z + it.z, it.ry, it.s);
  K.makeDoor({ x: x + r.leaf.x, z: z + r.leaf.z, axis: 'x', width: r.leaf.width, h: 2.45, color: '#1d1f22', locked: () => (G.state.rank || 0) < CARTEL_RANK,
    lockLabel: 'Llamar a la puerta', lockMsg: () => `El portero te mira de arriba abajo: «Aquí no entra cualquiera. Vuelve cuando seas ${RANKS[CARTEL_RANK].name}.»` });
  K.makeDoor({ x: x + r.officeLeaf.x, z: z + r.officeLeaf.z, axis: 'z', width: r.officeLeaf.width, h: 2.35, color: '#3a2418' });
  // gente del cártel (quietos como los dependientes) y con quién se habla
  for (const p of r.people) (W.clerks ||= []).push({ x: x + p.x, z: z + p.z, yaw: p.yaw, kind: 'cartel', role: p.role });
  K.hitbox(x + r.counter.x, 1.4, z + r.counter.z - 0.3, 1.6, 1.2, 0.4, { actions: () => [{ label: 'Comprar al cártel', fn: () => (G.act.openCartelShop ? G.act.openCartelShop() : G.act.toast?.('«Todavía no tengo nada para ti.»', '💀')) }] });
  K.hitbox(x + r.boss.x, 1.1, z + r.boss.z + 0.6, 1.6, 2.2, 0.8, { actions: () => [{ label: 'Hablar con el jefe', fn: () => (G.act.cartelBoss ? G.act.cartelBoss() : G.act.toast?.('El jefe ni levanta la vista: «Ahora no. Ya te llamaré.»', '💀')) }] });
  const i = r.inside;
  W.cartel = { x0: x + i.x0, x1: x + i.x1, z0: z + i.z0, z1: z + i.z1, lights: r.lights.map((l) => ({ x: x + l.x, z: z + l.z, c: l.c })) };
  W.pois.cartel = { x: x + r.door.x, z: z + r.door.z };
  W.mapRects.push({ x0: x - 12, x1: x + 12, z0: z - 9, z1: z + 9, c: '#9b6bc9' });
  W.mapLabels.push({ x, z, t: ZONE_NAMES[b.zone] });
  DOORS.push({ x0: x - 12, x1: x + 12, z0: z - 9, z1: z + 9, x, z, ry: 0, house: false });
  return true;
}
// La Mansión: villa hueca con salón, comedor, dormitorio, cocina y despacho (world/mansion.js).
// Se compra en la app Inmobiliaria; dentro se duerme, se guarda dinero en la caja fuerte
// grande, se organizan fiestas y se reúne uno con los socios.
export const MANSION = { price: 60000, blurb: 'Villa de lujo con piscina: dormitorio, despacho con caja fuerte, cocina y un salón para dar fiestas. La policía no entra sin orden.' };
function mansionFor(b) {
  if (!hasBuilding('q_Flat')) return false;
  const r = mansionHQ(), x = b.cx, z = b.cz - 2, id = 'mansion';
  F.place('real:mansion', () => r.group, x, z, 0, { solid: false });
  pad(x - 20, x + 20, z - 18, z + 20, 0, id);
  // colisiones con nivel: 'up' sólo en la planta alta, 'down' sólo abajo, 'low' a ras de suelo
  const gy = groundH(x, z);
  for (const [x0, x1, z0, z1, h, lv] of r.boxes) {
    const c = K.addBox(x + x0, x + x1, z + z0, z + z1, h);
    if (lv === 'up') c.yMin = gy + MANSION_UP - 0.6;
    else if (lv === 'down') c.yMax = gy + MANSION_UP - 0.8;
    else if (lv === 'low') c.yMax = gy + 0.45;
  }
  for (const it of r.items) INT.place(it.name, x + it.x, it.y, z + it.z, it.ry, it.s);
  for (const f of r.floors) addFloor(x + f.x0, x + f.x1, z + f.z0, z + f.z1, (px, pz) => gy + f.h(px - x, pz - z), { upper: true });
  nearLoad(x, z, 95, r.load);
  for (const [tx, tz, k] of r.trees) (k === 'palm' ? palm(x + tx, z + tz, rr(8, 10)) : tree(x + tx, z + tz, 1.1, 1));
  const mine = () => !!G.state.props[id];
  K.makeDoor({ x: x + r.leaf.x, z: z + r.leaf.z, axis: 'x', width: r.leaf.width, h: 2.7, color: '#3b2518', locked: () => !mine(),
    lockLabel: 'Llamar al timbre', lockMsg: () => 'Nadie abre. La mansión está en venta: mírala en la app Inmobiliaria.' });
  K.makeDoor({ x: x + r.officeLeaf.x, z: z + r.officeLeaf.z, axis: 'z', width: r.officeLeaf.width, h: 2.55, color: '#3b2518' });
  K.hitbox(x + r.bed.x, r.bed.y + 0.6, z + r.bed.z, 2.0, 1.0, 2.4, { actions: () => (mine() ? [{ label: 'Dormir', fn: () => G.act.sleep(id, { wake: 7 * 60 }) }] : []) });
  K.hitbox(x + r.safe.x, 0.7, z + r.safe.z + 0.35, 0.9, 1.3, 0.3, { actions: () => (mine() ? [{ label: 'Abrir la caja fuerte', fn: () => G.act.openSafe({ entry: { type: 'safe', data: (G.state.mansionSafe ||= { cash: 0 }) } }) }] : []) });
  K.hitbox(x + r.desk.x, 1.0, z + r.desk.z, 0.8, 1.2, 1.6, { actions: () => (mine() ? [{ label: 'Reunirse con los socios', fn: () => (G.act.mansionPartners ? G.act.mansionPartners() : G.act.toast?.('Hoy no ha venido nadie.', '🤝')) }] : []) });
  K.hitbox(x + r.party.x, 1.1, z + r.party.z, 0.6, 1.2, 3.4, { actions: () => (mine() ? [{ label: 'Fiestas en la mansión', fn: () => (G.act.mansionParty ? G.act.mansionParty() : G.act.toast?.('Todavía no hay fiestas.', '🍾')) }] : []) });
  const i = r.inside;
  W.props[id] = {
    x0: x + i.x0, x1: x + i.x1, z0: z + i.z0, z1: z + i.z1, name: 'La Mansión', price: MANSION.price, blurb: MANSION.blurb, luxury: true, indoor: true, height: 3.2,
    spawn: { x: x + r.entry.x, z: z + r.entry.z, yaw: Math.PI }, area: Math.round((i.x1 - i.x0) * (i.z1 - i.z0) + (16 - 0.6) * (13 - 0.6)),
  };
  const L = (l) => ({ x: x + l.x, z: z + l.z, c: l.c });
  W.mansion = { x0: x + i.x0, x1: x + i.x1, z0: z + i.z0, z1: z + i.z1, gy, down: r.lights.down.map(L), up: r.lights.up.map(L) };
  W.pois[id] = { x: x + r.door.x, z: z + r.door.z };
  W.mapRects.push({ x0: x - 14, x1: x + 14, z0: z - 6.5, z1: z + 9, c: '#d8c8a8' });
  W.mapLabels.push({ x, z, t: 'La Mansión' });
  DOORS.push({ x0: x - 14, x1: x + 14, z0: z - 6.5, z1: z + 6.5, x, z, ry: 0, house: false });
  return true;
}
function warehouseLights() {
  const L = [0, 1].map(() => { const l = new THREE.PointLight('#ffe6c0', 0, 34, 1.15); l.userData.terrainDone = true; scene.add(l); return l; });
  let at = null;
  W.onUpdate = () => {
    const p = G.player?.pos;
    let id = p && Object.keys(WAREHOUSES).find((k) => { const r = W.props[k]; return r && p.x > r.x0 - 1 && p.x < r.x1 + 1 && p.z > r.rack.z0 - 1 && p.z < r.z1 + 2; });
    const C = W.cartel;
    if (!id && C && p && p.x > C.x0 - 1 && p.x < C.x1 + 1 && p.z > C.z0 - 1 && p.z < C.z1 + 2) id = 'cartel';
    const MN = W.mansion;
    if (!id && MN && p && p.x > MN.x0 - 1 && p.x < MN.x1 + 1 && p.z > MN.z0 - 1 && p.z < MN.z1 + 2) id = p.y > MN.gy + MANSION_UP - 1 ? 'mansionUp' : 'mansionIn';
    if (id === at) return;
    at = id;
    if (id === 'cartel') {
      const y = groundH((C.x0 + C.x1) / 2, (C.z0 + C.z1) / 2) + 2.6; // (bajas: que no quemen el techo)
      C.lights.forEach((l, k) => { L[k].position.set(l.x, y, l.z); L[k].color.set(l.c); L[k].intensity = 14; });
      return;
    }
    if (id === 'mansionIn' || id === 'mansionUp') {
      const up = id === 'mansionUp', y = MN.gy + (up ? MANSION_UP + 2.6 : 2.7);
      MN[up ? 'up' : 'down'].forEach((l, k) => { L[k].position.set(l.x, y, l.z); L[k].color.set(l.c); L[k].intensity = 16; });
      return;
    }
    for (const l of L) l.color.set('#ffe6c0');
    if (!id) { for (const l of L) l.intensity = 0; return; }
    const r = W.props[id], cx = (r.x0 + r.x1) / 2, y = groundH(cx, (r.z0 + r.z1) / 2) + 6.5;
    L[0].position.set(r.x0 + (r.x1 - r.x0) * 0.27, y, (r.rack.z0 + r.z1) / 2);
    L[1].position.set(r.x0 + (r.x1 - r.x0) * 0.73, y, (r.rack.z0 + r.z1) / 2);
    for (const l of L) l.intensity = 22;
  };
}
// el patio delantero: asfalto, valla con hueco, palés y la carretilla
function warehouseYard(b) {
  K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 14, b.z1 - 1, '#5a5d61');
  K.chainFence(b.x0 + 1, b.z1 - 0.5, b.cx - 4, b.z1 - 0.5);
  K.chainFence(b.cx + 4, b.z1 - 0.5, b.x1 - 1, b.z1 - 0.5);
  for (let k = 0; k < 3; k++) K.pallet(b.x0 + 6 + k * 2.2, b.cz + 17, 0, k % 3);
  K.forklift(b.x1 - 10, b.cz + 18, 0.4);
}

const FILL = {
  residencial(b) {
    // casas alrededor de una calle interior en U (Bungalós, Barrio Alto, Cabañas, Apartamentos, Mansión)
    const z = b.z1 - 9;
    const n = b.zone === 'barrioAlto' || b.zone === 'apartamentos' ? 2 : 3;
    if (b.zone === 'mansion') {
      if (mansionFor(b)) { K.asphalt(b.cx - 3, b.cx + 3, b.cz + 17, b.z1, '#c9c2b4'); return; }
      addPad(b.cx - 8, b.cx + 8, b.cz - 15, b.cz - 7); // piscina a nivel
      K.building({ x0: b.cx - 13, x1: b.cx + 13, z0: b.cz - 4, z1: b.cz + 10, h: 9, wall: '#f2e6cf', trim: '#ffffff', roof: '#8c4a32', style: 'house', front: '+z', roofType: 'gable', seed: 951, mapColor: '#d8c8a8', label: 'Mansión' });
      K.asphalt(b.cx - 2.5, b.cx + 2.5, b.cz + 10, b.z1, '#c9c2b4');
      B.box('#2f8fc9', b.cx, 0, b.cz - 11, 12, 0.08, 6, 0, { mat: 'glass', ao: 0 }); // piscina
      for (const x of [-16, 16]) palm(b.cx + x, b.cz + 13, 9);
      return;
    }
    if (b.zone === 'apartamentos' || b.zone === 'barrioAlto') {
      const pair = b.zone === 'apartamentos' ? [['cb_Building_5_A', 22], ['piso', 14]] : [['q_Flat', 16], ['q_Flat2', 16]];
      let x = b.x0 + 3, ok = true;
      for (const [nm, w] of pair) {
        if (nm === 'piso') { if (!starterBuilding(x + w / 2, b.z1 - 9, b.z1)) ok = false; x += w + 4; continue; } // tu piso (portal 7)
        if (!modelBuilding(nm, x + w / 2, b.cz + 3, 0, { w, mapColor: '#b9a68a', label: x === b.x0 + 3 ? ZONE_NAMES[b.zone] : undefined })) ok = false;
        x += w + 4;
      }
      if (ok) return;
      for (let k = 0; k < n; k++) {
        const x0 = b.x0 + 3 + k * 23;
        K.building({ x0, x1: x0 + 18, z0: b.cz - 6, z1: b.cz + 12, h: b.zone === 'barrioAlto' ? 12 : 13, wall: b.zone === 'barrioAlto' ? '#d9d4cc' : ['#e7b89a', '#c9d6e3'][k], trim: '#ffffff', roof: '#4a4744', style: b.zone === 'barrioAlto' ? 'office' : 'brick', front: '+z', seed: 700 + b.i * 13 + k, mapColor: '#b9a68a', label: k === 0 ? ZONE_NAMES[b.zone] : undefined });
      }
      return;
    }
    for (let k = 0; k < (ATM_ZONES.includes(b.zone) ? n - 1 : n); k++) W.homes.push(houseAt(b.x0 + 8 + k * 15.5, z, '+z', 30 + b.i * 7 + b.j * 3 + k));
    for (let k = 0; k < n; k++) W.homes.push(houseAt(b.x0 + 8 + k * 15.5, b.cz - 4, '-z', 50 + b.i * 7 + b.j * 3 + k));
    W.mapLabels.push({ x: b.cx, z: b.cz, t: '' });
  },
  comercio(b) {
    // el local principal da a la calle norte; a los lados, edificios de 2–3 plantas
    const main = { x0: b.cx - 11, x1: b.cx + 11, z0: b.z1 - 16, z1: b.z1 - 2, h: 6.5, front: '+z' };
    const lk = LOOK[b.zone] || { wall: 'claro', stone: 'blanco', floors: 2 };
    if (!realAt(b.zone, () => shopBuilding({ w: 22, d: 14, sign: SIGN[b.zone]?.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: SIGN[b.zone]?.bg || '#1e2a33', ...lk }), b.cx, b.z1 - 9, 0, { label: ZONE_NAMES[b.zone], mapColor: '#c98a6b' })) K.building({ ...main, wall: SIGN[b.zone]?.wall || '#d6c3a5', trim: '#ffffff', roof: '#5a5a5a', style: 'shop', sign: SIGN[b.zone]?.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: SIGN[b.zone]?.bg || '#1e2a33', awning: SIGN[b.zone]?.awning, seed: 300 + b.i * 11 + b.j, mapColor: '#c98a6b', label: ZONE_NAMES[b.zone] });
    const SIDE = ['q_Flat', 'cb_Building_2_A', 'q_Flat2', 'cb_Building_1_D', 'q_Shop', 'cb_Building_1_A'];
    const bankHere = ATM_ZONES.includes(b.zone); // deja la esquina noreste a la sucursal del banco
    for (const [x0, x1] of [[b.x0 + 1, b.cx - 13], [b.cx + 13, bankHere ? b.x1 - 10 : b.x1 - 1]]) {
      if (x1 - x0 < 6) continue; // hueco demasiado estrecho (ahí va la sucursal): nada, mejor que un edificio metido en otro
      if (modelBuilding(SIDE[Math.floor(R() * SIDE.length)], (x0 + x1) / 2, b.z1 - 8, 0, { w: x1 - x0 - 0.5 })) continue;
      K.building({ x0, x1, z0: b.z1 - 14, z1: b.z1 - 2, h: rr(6.5, 10), wall: K.HOUSE_COLORS[Math.floor(R() * 10)], trim: '#f4eee2', roof: '#4d4d4d', style: R() < 0.5 ? 'brick' : 'office', front: '+z', seed: 400 + Math.floor(R() * 999), mapColor: '#b9a68a' });
    }
    if (!modelBuilding(R() < 0.5 ? 'cb_Building_5_A' : 'cb_Building_3_A', b.cx, b.z0 + 13.5, Math.PI, { w: 30 })) K.building({ x0: b.x0 + 2, x1: b.x1 - 2, z0: b.z0 + 7, z1: b.z0 + 20, h: rr(7, 11), wall: K.HOUSE_COLORS[Math.floor(R() * 10)], trim: '#f4eee2', roof: '#4d4d4d', style: 'brick', front: '-z', seed: 500 + Math.floor(R() * 999), mapColor: '#b9a68a' });
    bench(b.cx - 6, b.z1 - 0.5); trashCan(b.cx + 6, b.z1 - 0.5);
  },
  ocio(b) {
    const s = SIGN[b.zone] || {};
    if (b.zone === 'eclipse' && hasBuilding('q_Flat')) {
      // El Eclipse: fachada propia (disco con portal, torre del logo, ala con terraza)
      const info = eclipseFacade();
      F.place('eclipse', () => info.group, b.cx - 1, b.cz + 6, 0, { solid: false });
      for (const [x0, x1, z0, z1, h] of info.boxes) K.addBox(b.cx - 1 + x0, b.cx - 1 + x1, b.cz + 6 + z0, b.cz + 6 + z1, h);
      for (const [x, z] of info.planters || []) { F.place('macetero', SKP.macetero, b.cx - 1 + x, b.cz + 6 + z, 0); F.place('palmera', () => SKP.palmera(), b.cx - 1 + x, b.cz + 6 + z, 0, { y: 0.55, s: 1.1 }); }
      W.mapRects.push({ x0: b.cx - 17, x1: b.cx + 19, z0: b.cz - 8, z1: b.cz + 8, c: '#9b6bc9' });
      pad(b.cx - 19, b.cx + 21, b.cz - 10, b.cz + 16, 0, 'eclipse'); // la disco y su terraza, llanas
      W.mapLabels.push({ x: b.cx, z: b.cz, t: ZONE_NAMES[b.zone] });
      W.pois.eclipse = { x: b.cx - 1 + info.door.x, z: b.cz + 6 + info.door.z };
      for (let k = 0; k < 3; k++) K.parkedCar(b.x0 + 8 + k * 9, b.z1 - 5, Math.PI / 2);
      return;
    }
    if (b.zone === 'cartel' && cartelFor(b)) { K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 12, b.z1 - 1, '#45484d'); for (let k = 0; k < 4; k++) K.parkedCar(b.x0 + 8 + k * 9, b.z1 - 5, Math.PI / 2); return; }
    if (b.zone === 'eclipse' || !realAt(b.zone, () => shopBuilding({ w: 30, d: 20, sign: s.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: s.bg || '#1e2a33', ...(LOOK[b.zone] || { wall: 'claro', stone: 'blanco', floors: 2 }) }), b.cx, b.cz + 2, 0, { label: ZONE_NAMES[b.zone], mapColor: '#9b6bc9' })) K.building({ x0: b.cx - 15, x1: b.cx + 15, z0: b.cz - 8, z1: b.cz + 12, h: s.h || 9, wall: s.wall || '#3a2a4a', trim: s.trim || '#ffd34d', roof: '#2b2b30', style: 'shop', front: '+z', sign: s.text, signBg: s.bg, awning: s.awning, seed: 800 + b.i, mapColor: '#9b6bc9', label: ZONE_NAMES[b.zone] });
    K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 12, b.z1 - 1, '#45484d');
    for (let k = 0; k < 4; k++) K.parkedCar(b.x0 + 8 + k * 9, b.z1 - 5, Math.PI / 2);
    for (const x of [b.x0 + 3, b.x1 - 3]) (R() < 0.5 ? palm(x, b.cz, rr(8, 11)) : tree(x, b.cz, 1, 1));
  },
  industrial(b) {
    if (WAREHOUSES[b.zone] && warehouseFor(b)) { warehouseYard(b); return; }
    if (!realAt(b.zone, () => warehouseBuilding({ w: b.x1 - b.x0 - 8, d: 22, h: 9, sign: ZONE_NAMES[b.zone].toUpperCase(), signBg: '#34495e', doors: 2 }), b.cx, b.cz + 3, 0, { label: ZONE_NAMES[b.zone], mapColor: '#8a9aa6' })) K.building({ x0: b.x0 + 4, x1: b.x1 - 4, z0: b.cz - 8, z1: b.cz + 14, h: 9, wall: '#8a949e', trim: '#d0d6dc', roof: '#4d4d4d', style: 'warehouse', front: '+z', sign: ZONE_NAMES[b.zone].toUpperCase(), signBg: '#34495e', seed: 900 + b.i, mapColor: '#8a9aa6', label: ZONE_NAMES[b.zone] });
    warehouseYard(b);
  },
  verde(b) {
    if (b.zone === 'bosque') {
      for (let k = 0; k < 40; k++) tree(rr(b.x0 + 2, b.x1 - 2), rr(b.z0 + 2, b.z1 - 2), rr(0.9, 1.6));
      return;
    }
    // Parque Central: paseos en cruz, fuente y bancos
    K.paving(b.cx - 2, b.cx + 2, b.z0 + 1, b.z1 - 1);
    K.paving(b.x0 + 1, b.x1 - 1, b.cz - 2, b.cz + 2);
    addPad(b.cx - 4, b.cx + 4, b.cz - 4, b.cz + 4, { m: 4 }); // la fuente, a nivel
    B.add(K.GEO.cyl16, '#cfd6dc', b.cx, 0.35, b.cz, 7, 0.7, 7);
    B.add(K.GEO.cyl16, '#3a8fc0', b.cx, 0.72, b.cz, 6.2, 0.06, 6.2, 0, { mat: 'glass', ao: 0 });
    K.addBox(b.cx - 3.4, b.cx + 3.4, b.cz - 3.4, b.cz + 3.4, 0.8);
    for (const [x, z, r] of [[-6, 4, 0], [6, -4, Math.PI], [4, 6, Math.PI / 2], [-4, -6, -Math.PI / 2]]) bench(b.cx + x, b.cz + z, r);
    for (let k = 0; k < 22; k++) {
      const x = rr(b.x0 + 2, b.x1 - 2), z = rr(b.z0 + 2, b.z1 - 2);
      if (Math.abs(x - b.cx) < 4 || Math.abs(z - b.cz) < 4) continue;
      R() < 0.15 ? palm(x, z) : tree(x, z, rr(0.9, 1.25));
    }
    W.spots.push({ id: 'parque', name: 'Banco del Parque Central', x: b.cx + 6, z: b.cz - 6 });
  },
  servicio(b) {
    const s = SIGN[b.zone] || {};
    if (b.zone.startsWith('gas')) {
      // marquesina, surtidores y tienda (el interior se monta en la fase 2)
      addPad(b.cx - 10, b.cx + 10, b.cz + 2, b.cz + 14, { m: 5 });
      B.box('#e8e8e8', b.cx, 5.2, b.cz + 8, 18, 0.6, 10, 0, { ao: 0 });
      B.box('#c0392b', b.cx, 5.8, b.cz + 8, 18.2, 0.5, 10.2, 0, { ao: 0 });
      for (const x of [-5, 0, 5]) { B.box('#d0d4d8', b.cx + x, 0, b.cz + 8, 0.4, 5.2, 0.4, 0, { mat: 'metal' }); B.box('#c0392b', b.cx + x, 0, b.cz + 6, 0.8, 1.6, 0.6); K.addBox(b.cx + x - 0.4, b.cx + x + 0.4, b.cz + 5.7, b.cz + 6.3, 1.6); }
      if (!realAt(b.zone, () => shopBuilding({ w: 20, d: 12, floors: 1, wall: 'blanco', stone: 'claro', awning: '#c0392b', sign: 'GAS · TIENDA', signBg: '#c0392b' }), b.cx, b.z0 + 14, 0, { label: ZONE_NAMES[b.zone], mapColor: '#e05050' })) K.building({ x0: b.cx - 10, x1: b.cx + 10, z0: b.z0 + 8, z1: b.z0 + 20, h: 4.6, wall: '#f4f4f4', trim: '#c0392b', roof: '#5a5a5a', style: 'shop', front: '+z', sign: 'GAS · TIENDA', signBg: '#c0392b', seed: 1000 + b.i, mapColor: '#e05050', label: ZONE_NAMES[b.zone] });
      return;
    }
    if (b.zone === 'motel' && modelBuilding('cb_Building_3_A', b.cx, b.cz + 2, 0, { w: 30, mapColor: '#6b8fb0', label: ZONE_NAMES[b.zone] })) { /* motel con escaleras exteriores */ } else if (realAt(b.zone, () => (b.zone === 'comisaria' ? shopBuilding({ w: 28, d: 16, sign: s.text || 'POLICÍA', signBg: s.bg || '#1f3a6b', ...LOOK.comisaria }) : warehouseBuilding({ w: 28, d: 16, h: 7, sign: s.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: s.bg || '#34495e', doors: 3 })), b.cx, b.cz + 2, 0, { label: ZONE_NAMES[b.zone], mapColor: '#6b8fb0' })) { /* local realista */ } else K.building({ x0: b.cx - 14, x1: b.cx + 14, z0: b.cz - 6, z1: b.cz + 10, h: s.h || 7, wall: s.wall || '#9fb1bd', trim: '#e8eef2', roof: '#4d4d4d', style: b.zone === 'motel' ? 'motel' : 'warehouse', front: '+z', sign: s.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: s.bg || '#34495e', seed: 1100 + b.i * 3 + b.j, mapColor: '#6b8fb0', label: ZONE_NAMES[b.zone] });
    K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 10, b.z1 - 1, '#4a4d52');
    for (let k = 0; k < 3; k++) K.parkedCar(b.x0 + 10 + k * 10, b.z1 - 5, Math.PI / 2);
  },
};
// Rótulos y colores de los locales (según las referencias de fachada 01/02-locales)
const SIGN = {
  eclipse: { text: 'EL ECLIPSE', bg: '#2a0f3e', wall: '#1f1a3a', trim: '#b14dff', h: 10 },
  palmeras: { text: 'LAS PALMERAS', bg: '#1f6f5c', wall: '#e9d6b0', trim: '#ffffff', awning: '#c0662a', h: 7 },
  casino: { text: 'CASINO ROYAL', bg: '#5b0f5e', wall: '#2a0f2e', trim: '#ffd700', h: 10 },
  cartel: { text: 'EL CARTEL', bg: '#5a0f0f', wall: '#2a1414', trim: '#c0392b', h: 9 },
  esquina: { text: 'LA ESQUINA', bg: '#1d4fa8', wall: '#e9e4dc', awning: '#2b7bd1' },
  corteFino: { text: 'CORTE FINO', bg: '#1e1e1e', wall: '#3a3d42', awning: '#1e1e1e' },
  lavanderia: { text: 'LAVANDERÍA ESPUMA', bg: '#2b7bd1', wall: '#d6e6ef' },
  ropa: { text: 'TIENDA DE ROPA', bg: '#2c3e50', wall: '#efe4d2', awning: '#8b5a2b' },
  muebles: { text: 'MUEBLES', bg: '#6b4226', wall: '#e9dcc8' },
  oficinas: { text: 'OFICINAS', bg: '#34495e', wall: '#cfd6dc' },
  mercado: { text: 'MERCADO', bg: '#2e7d32', wall: '#f0e2c0', awning: '#c0392b' },
  taller: { text: 'TALLER', bg: '#1f3a6b', wall: '#9fb1bd', h: 7 },
  lavadero: { text: 'LAVADERO', bg: '#1d6fd1', wall: '#d6e6ef', h: 6 },
  motel: { text: 'MOTEL', bg: '#b0237a', wall: '#f0c4b0', h: 7 },
  comisaria: { text: 'POLICÍA', bg: '#1f3a6b', wall: '#e8eef2', h: 8 },
};

// ------------------------------------------------------------------
//  Costa: Faro (NO), Puerto (N), Playa (NE), Urbanización (S), Muelle de carga (SE)
// ------------------------------------------------------------------
// Relleno de la costa con modelos ya hechos (casas de Kenney re-texturizadas y las de siempre):
// filas de chalets con jardín en las franjas oeste, este y sur, y bloques de apartamentos de
// 3–5 plantas frente a la playa (noreste)
const CHALETS = ['ks_a', 'ks_b', 'ks_c', 'ks_d', 'ks_f', 'ks_k', 'ks_o', 'ks_q', 'ks_s', 'ks_u', 'h_house2', 'h_house4'];
function coastFill(zN, zS) {
  const xW = XL[0] - K.SWO, xE = XL[COLS] + K.SWO;
  let n = 0;
  const chalet = (x, z, ry) => {
    const nm = CHALETS[n++ % CHALETS.length];
    const r = modelBuilding(nm, x, z, ry, { mapColor: '#c9b28e' });
    if (!r) return;
    W.homes.push({ x: x + Math.round(Math.sin(ry)) * ((r.x1 - r.x0) / 2 + 1.2), z: z + Math.round(Math.cos(ry)) * ((r.z1 - r.z0) / 2 + 1.2) });
  };
  // oeste (entre la circunvalación y el mar), mirando a la calle (+x)
  for (let z = -104; z <= 108; z += 21) chalet(xW - 15, z, Math.PI / 2);
  // este, mirando a la calle (-x); al norte, bloques de apartamentos
  for (let z = -104; z <= 40; z += 21) chalet(xE + 15, z, -Math.PI / 2);
  ['kc_a', 'kc_d', 'kc_h', 'kc_b'].forEach((nm, k) => modelBuilding(nm, xE + 16, 62 + k * 17, -Math.PI / 2, { mapColor: '#b9a68a', label: k === 1 ? 'Apartamentos del mar' : undefined }));
  // frente a la playa, al este de la arena, mirando al mar (norte)
  ['kc_f', 'kc_g'].forEach((nm, k) => modelBuilding(nm, xE + 12 + k * 13, zN + 22, 0, { mapColor: '#b9a68a' }));
  // sur: más chalets a los lados de la urbanización
  for (const x of [-232, -210, -188, -166]) chalet(x, zS - 16, 0);
}
const noray = () => { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.16, 0.45, 10), new THREE.MeshStandardMaterial({ color: '#2b2e33', roughness: 0.5, metalness: 0.6 })); m.position.y = 0.34; g.add(m); return g; };
function buildCoast() {
  const zN = ZL[ROWS] + K.SWO, zS = ZL[0] - K.SWO;
  // Faro sobre una loma de rocas (noroeste)
  const fx = XL[0] - 12, fz = zN + 26;
  // faro torneado con linterna y casa del farero, entre rocas
  F.place('faro', CO.faro, fx, fz, 0, { solid: false });
  for (let k = 0; k < 11; k++) { const a = (k / 11) * Math.PI * 2 + R(), d = rr(6.5, 11); F.place('rocaC' + (k % 4), () => CO.rocaCosta((k % 4) + 1, rr(0.9, 1.5)), fx + Math.cos(a) * d, fz + Math.sin(a) * d, R() * 6.28, { solid: false }); }
  K.addBox(fx - 2.6, fx + 2.6, fz - 2.6, fz + 2.6, 14);
  K.addBox(fx + 2.7, fx + 7.7, fz - 3.2, fz + 0.8, 4); // casa del farero
  addPad(fx - 3, fx + 8.5, fz - 4, fz + 3, { m: 6 }); // faro y casa, a nivel sobre la loma
  // entorno: camino vallado desde la circunvalación, farolillos, mirador con bancos al mar
  K.paving(XL[0] - 4.5, XL[0] - 1.5, zN, fz - 4, '#cbbfa8');
  K.paving(XL[0] - 4.5, fx + 1, fz - 4, fz - 1.5, '#cbbfa8');
  for (let z = zN + 2; z < fz - 5; z += 2.2) for (const x of [XL[0] - 5, XL[0] - 1]) F.place('vallaMad', () => CO.vallaMadera(2), x, z, Math.PI / 2, { solid: false });
  for (const z of [zN + 6, zN + 16]) F.place('farolDeco', SKP.farolDecorativo, XL[0] - 5.4, z, 0, { hit: 0.3 });
  K.paving(fx - 9, fx + 3, fz + 4, fz + 9, '#cbbfa8'); // mirador
  for (let x = fx - 8; x <= fx + 2; x += 2) F.place('vallaMad', () => CO.vallaMadera(2), x, fz + 9.2, 0, { solid: false });
  K.addBox(fx - 9, fx + 3, fz + 9.1, fz + 9.4, 1.1);
  for (const x of [fx - 6, fx - 1.5]) F.place('bancoParque', () => SKP.bancoParque(), x, fz + 7.5, 0);
  W.mapLabels.push({ x: fx, z: fz, t: 'Faro' });
  // Puerto moderno (norte), ganado al mar: explanada de hormigón PORT con, al oeste, la
  // terminal de contenedores (pilas de 2–4 alturas, dos grúas de muelle y un buque atracado);
  // al este, el puerto deportivo (pantalanes con yates y veleros y el club náutico); y junto a
  // la circunvalación, naves y oficinas con su aparcamiento.
  const px = -10, P = PORT, cols = ['#b5402f', '#2c6e9e', '#2e7d32', '#d9822b', '#7f8c8d', '#6d6f73'];
  const pcx = (P.x0 + P.x1) / 2, pcz = (P.z0 + P.z1) / 2;
  addPad(P.x0, P.x1, zN + 4, N.z1 + 2, { h: 0, m: 8 }); // dentro de la isla, a nivel del muelle
  B.box('#9c988f', pcx, -3.2, pcz, P.x1 - P.x0, 3.2, P.z1 - P.z0, 0, { ao: 0 }); // losa con su canto en el agua
  // suelo: asfalto con textura (una sola superficie, por encima de la losa: nada parpadea)
  const asph = new THREE.Mesh(CO.planeM(P.x0, P.x1, P.z0, P.z1, 6), CO.COAST_MAT.asphalt());
  asph.position.y = 0.05; asph.receiveShadow = true; asph.userData.terrainDone = true; scene.add(asph);
  HARD.push([P.x0, P.x1, P.z0, P.z1]);
  // marcas pintadas: calles de la terminal, bandas de seguridad del cantil y plazas
  const paint = (c, x0, x1, z0, z1) => B.box(c, (x0 + x1) / 2, 0.06, (z0 + z1) / 2, x1 - x0, 0.015, z1 - z0, 0, { shadow: false, ao: 0 });
  paint('#e9c43a', P.x0 + 1, P.x1 - 1, P.z1 - 2.2, P.z1 - 2.0);            // línea amarilla del cantil
  for (const z of [P.z0 + 29, P.z0 + 70]) for (let x = P.x0 + 4; x < -16; x += 6) paint('#efefe8', x, x + 3, z - 0.1, z + 0.1); // ejes discontinuos
  for (const z of [P.z0 + 22, P.z0 + 76]) paint('#efefe8', P.x0 + 4, -16, z - 0.08, z + 0.08); // bordes de calle
  for (let x = 48; x < P.x1 - 4; x += 3.2) paint('#efefe8', x, x + 0.12, P.z0 + 6, P.z0 + 11); // plazas del aparcamiento
  for (let x = 48; x < P.x1 - 4; x += 3.2) paint('#efefe8', x, x + 0.12, P.z0 + 14, P.z0 + 19);
  W.mapRects.push({ x0: P.x0, x1: P.x1, z0: P.z0, z1: P.z1, c: '#a9a59d' });
  // cierre: borde del muelle (norte, salvo los pantalanes) y costados
  K.addBox(P.x0 - 1, P.x0, P.z0, P.z1 + 1, 10); K.addBox(P.x1, P.x1 + 1, P.z0, P.z1 + 1, 10);
  K.addBox(P.x0, 18, P.z1, P.z1 + 1, 10);
  // --- terminal de contenedores (oeste) ---
  const cont = (c, x, z, y = 0) => F.place('cont' + c, () => CO.contenedor(c), x, z, 0, { solid: false, y });
  let ck = 0;
  for (let row = 0; row < 4; row++) for (let col = 0; col < 7; col++) {
    const x = P.x0 + 14 + col * 12.5, z = P.z0 + 34 + row * 9;
    for (const dz of [0, 2.6]) {
      const hgt = 2 + ((row * 7 + col * 3 + (dz ? 1 : 0)) % 3);
      for (let k = 0; k < hgt; k++) cont(cols[(ck++ * 7 + k) % cols.length], x, z + dz, k * 2.62);
    }
    K.addBox(x - 3.1, x + 3.1, z - 1.3, z + 3.9, 11);
  }
  for (const x of [P.x0 + 30, P.x0 + 70]) {
    F.place('sts', CO.gruaSTS, x, P.z1 - 12, 0, { solid: false });
    for (const lx of [-7, 7]) for (const lz of [-8, 8]) K.addBox(x + lx - 0.9, x + lx + 0.9, P.z1 - 12 + lz - 1.3, P.z1 - 12 + lz + 1.3, 26);
  }
  F.place('buque', () => CO.buque(110, 3), P.x0 + 58, P.z1 + 13, 0, { solid: false });
  for (let k = 0; k < 4; k++) F.place('kv_truck', () => buildingModel('kv_truck')(), P.x0 + 16 + k * 16, P.z0 + 26, Math.PI / 2, { hit: 2.2 });
  for (let x = P.x0 + 4; x < -16; x += 5) F.place('noray', noray, x, P.z1 - 0.6, 0, { solid: false });
  // --- puerto deportivo (este): pantalanes que salen al mar con yates y veleros ---
  // 6 barcos en total, no más: [pantalán, amarre, lado, tipo]
  const BOATS = [[0, 0, -1, 'yate'], [0, 1, 1, 'velero'], [0, 2, -1, 'velero'], [1, 0, 1, 'yate'], [1, 1, -1, 'yate'], [1, 3, 1, 'velero']];
  for (let k = 0; k < 2; k++) {
    const x = 34 + k * 30;
    F.place('flotante', () => CO.pantalanFlotante(42), x, P.z1, 0, { solid: false, y: -0.18 });
    K.addBox(x - 1.4, x - 1.2, P.z1, P.z1 + 42, 10); K.addBox(x + 1.2, x + 1.4, P.z1, P.z1 + 42, 10); K.addBox(x - 1.4, x + 1.4, P.z1 + 42, P.z1 + 42.4, 10);
    for (const [pk, jj, sd, kind] of BOATS) {
      if (pk !== k) continue;
      F.place(kind, kind === 'velero' ? () => CO.velero(10) : () => CO.yate(14), x + sd * 5.4, P.z1 + 8 + jj * 9, Math.PI / 2 + (sd > 0 ? 0 : Math.PI), { solid: false, y: kind === 'velero' ? -0.2 : -0.35 });
    }
  }
  K.addBox(18, P.x1, P.z1, P.z1 + 0.3, 1.1); // barandilla del paseo (entre pantalanes se baja por ellos)
  K.paving(18, P.x1, P.z1 - 7, P.z1, '#cfc6b6', null, 2); // paseo del puerto deportivo
  for (let x = 20; x < P.x1; x += 3) if (![34, 64].some((v) => Math.abs(v - x) < 2)) F.place('vallaMetal', () => SKP.valla(3), x + 1.5, P.z1 - 0.3, 0, { solid: false });
  // club náutico y bares del paseo
  modelBuilding('kc_j', 58, P.z1 - 14, Math.PI, { mapColor: '#c9b28e', label: 'Club náutico' });
  [['marisqueria', 'MARISQUERÍA', '#1f5f8b'], ['cafeMarina', 'CAFÉ MARINA', '#6b4226']].forEach(([key, text, bg], k) => {
    realAt(key, () => shopBuilding({ w: 11, d: 8, floors: 1, sign: text, signBg: bg, wall: 'blanco', stone: 'claro', awning: bg }), 30 + k * 56, P.z1 - 12, Math.PI, { mapColor: '#c98a6b' });
  });
  for (let x = 24; x < P.x1 - 4; x += 30) F.place('bancoParque', () => SKP.bancoParque(), x, P.z1 - 2.2, Math.PI); // uno cada 30 m
  // --- naves y oficinas junto a la circunvalación, con aparcamiento ---
  const naves = ['ki_a', 'ki_c', 'ki_l', 'ki_e', 'ki_b'];
  naves.forEach((nm, k) => modelBuilding(nm, P.x0 + 14 + k * 21, P.z0 + 12, 0, { mapColor: '#8a9aa6', label: k === 2 ? 'Naves del puerto' : undefined }));
  modelBuilding('kc_i', 8, P.z0 + 12, 0, { mapColor: '#b9a68a', label: 'Oficinas del puerto' });
  modelBuilding('kc_k', 32, P.z0 + 12, 0, { mapColor: '#b9a68a' });
  for (let k = 0; k < 6; k++) K.parkedCar(49.6 + k * 6.4, P.z0 + 8.5, 0);
  F.place('kv_delivery', () => buildingModel('kv_delivery')(), 92, P.z0 + 20, Math.PI / 2, { hit: 1.8 });
  W.spots.push({ id: 'muelle', name: 'Muelle del puerto', x: P.x0 + 6, z: P.z1 - 4, discreet: true });
  W.mapLabels.push({ x: pcx, z: pcz + 10, t: 'Puerto' });
  // Playa (noreste): arena, sombrillas y palmeras
  const bx = XL[COLS] - 30;
  // arena con textura, sombrillas a rayas con sus tumbonas y toallas, chiringuito y socorrista
  const sand = new THREE.Mesh(CO.sandGeometry([[bx - 40, bx + 40, zN + 4, zN + 40]]), CO.COAST_MAT.sand());
  // por encima del césped aunque la malla de este sea más gruesa
  sand.position.y = 0.12; sand.receiveShadow = true; sand.userData.terrainDone = true; scene.add(sand);
  DRAPE.push(sand.geometry); // las dunas: la arena sigue el relieve de la costa
  // paseo marítimo: baldosas junto a la arena, bancos mirando al mar y locales (heladería, bar, surf)
  K.paving(bx - 88, bx + 40, zN + 0.6, zN + 4, '#d8ccb2');
  for (let x = bx - 84; x <= bx + 36; x += 36) { F.place('bancoParque', () => SKP.bancoParque(), x, zN + 3.3, 0); F.place('papelera', SK.papelera, x + 2, zN + 3.5, 0); } // un banco cada 36 m
  [['heladeria', 'HELADERÍA', '#e05a8a', 'blanco'], ['barOla', 'BAR LA OLA', '#1f6f8b', 'beige'], ['surf', 'SURF', '#e67e22', 'claro']].forEach(([key, text, bg, wall], k) => {
    realAt(key, () => shopBuilding({ w: 11, d: 8, floors: 1, sign: text, signBg: bg, wall, stone: 'blanco', awning: bg }), PORT.x1 + 6 + k * 13, zN + 10, Math.PI, { label: k === 1 ? 'Paseo marítimo' : undefined, mapColor: '#c98a6b' });
  });
  // hoteles de 5 plantas detrás, mirando al mar
  [['hotelMarina', 'HOTEL MARINA', '#1f4f7a', 'blanco'], ['hotelSol', 'HOTEL SOL', '#c0662a', 'beige']].forEach(([key, text, bg, wall], k) => {
    realAt(key, () => shopBuilding({ w: 16, d: 11, floors: 5, sign: text, signBg: bg, wall, stone: 'blanco', awning: bg }), PORT.x1 + 11 + k * 19, zN + 27, 0, { label: text === 'HOTEL MARINA' ? 'Hoteles' : undefined, mapColor: '#c9b28e' });
  });
  HARD.push([bx - 40, bx + 40, zN + 4, zN + 40]);
  for (const [x, z, c] of [[-14, 14, '#e74c3c'], [-4, 22, '#2c7fb8'], [8, 13, '#f1c40f'], [20, 23, '#27ae60'], [30, 15, '#e74c3c']]) {
    F.place('sombrilla' + c, () => CO.sombrilla(c), bx + x, zN + z, R() * 6, { hit: 0.2 });
    for (const dx of [-0.9, 0.9]) F.place('tumbona' + c, () => CO.tumbona(c === '#f1c40f' ? '#2c7fb8' : c), bx + x + dx, zN + z + 1.3, Math.PI + rr(-0.1, 0.1), { solid: false });
    if (R() < 0.6) F.place('toalla' + c, () => CO.toalla(c), bx + x + rr(2.5, 3.5), zN + z + rr(-1, 1), R() * 6, { solid: false });
  }
  F.place('chiringuito', CO.chiringuito, bx - 30, zN + 26, 0, { solid: false });
  K.addBox(bx - 33.2, bx + -26.8, zN + 24.2, zN + 27.3, 3);
  F.place('socorrista', CO.torreSocorrista, bx + 14, zN + 33, Math.PI, { hit: 2 });
  for (let k = 0; k < 7; k++) palm(bx + rr(-38, 38), zN + rr(6, 12), rr(8, 11));
  W.spots.push({ id: 'playa', name: 'Chiringuito de la playa', x: bx - 30, z: zN + 30 });
  W.mapLabels.push({ x: bx, z: zN + 22, t: 'Playa' });
  // Urbanización (sur): fila de casas frente al mar
  for (let k = 0; k < 12; k++) {
    const x = XL[1] + 10 + k * 24;
    W.homes.push(houseAt(x, zS - 16, '+z', 120 + k));
    // jardín: seto delante (con hueco para el camino) y, en algunos, piscina detrás
    for (const dx of [-6.6, -3.6, 3.6, 6.6]) F.place('seto3', () => SKP.seto(3), x + dx, zS - 2.4, 0);
    if (k % 3 === 1) { addPad(x - 4, x + 4, zS - 30, zS - 25, { m: 3 }); B.box('#2f8fc9', x, 0, zS - 27.5, 7, 0.1, 4, 0, { mat: 'glass', ao: 0 }); B.box('#e9e3d6', x, 0, zS - 27.5, 8, 0.08, 5, 0, { ao: 0 }); }
  }
  W.mapLabels.push({ x: 0, z: zS - 16, t: 'Urbanización' });
  coastFill(zN, zS);
  // Muelle de carga (sureste)
  const mx = XL[COLS] - 25;
  K.paving(mx - 20, mx + 20, zS - 30, zS - 6, '#a8a49c');
  addPad(mx - 20, mx + 20, zS - 30.5, zS - 6, { h: 0, m: 8 });
  realAt('naveCarga', () => warehouseBuilding({ w: 22, d: 12, h: 7, sign: 'MUELLE DE CARGA', signBg: '#34495e', doors: 2 }), mx + 28, zS - 18, -Math.PI / 2, { label: undefined, mapColor: '#8a9aa6' });
  for (let k = 0; k < 6; k++) {
    const x = mx - 15 + k * 6.3; cont(cols[k % 5], x, zS - 18);
    if (k % 2) cont(cols[(k + 3) % 5], x, zS - 18, 2.62);
    K.addBox(x - 3, x + 3, zS - 19.3, zS - 16.7, k % 2 ? 5.4 : 3);
  }
  for (let k = 0; k < 4; k++) K.pallet(mx - 14 + k * 2.4, zS - 12, 0, k % 3);
  K.forklift(mx + 8, zS - 11, 0.6);
  // bordillo del muelle con norays
  for (let x = mx - 18; x <= mx + 18; x += 6) F.place('noray', noray, x, zS - 29.3, 0, { solid: false });
  W.spots.push({ id: 'muelleCarga', name: 'Muelle de carga', x: mx + 12, z: zS - 26, discreet: true });
  W.mapLabels.push({ x: mx, z: zS - 22, t: 'Muelle de carga' });
  // paseo para los peatones
  W.wander.push({ x: px, z: zN + 18 }, { x: bx, z: zN + 18 }, { x: 0, z: zS - 8 });
}
