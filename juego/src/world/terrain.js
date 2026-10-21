// Relieve de la isla: una sola función de altura para todo el mapa.
//
// · baseH: lomas suaves (pendientes de hasta ~8 %) que se aplanan hacia la circunvalación,
//   así la costa, la playa y los muelles quedan a ras del mar.
// · Explanadas (pads): cada edificio tiene un solar llano a una sola altura; alrededor el
//   terreno se funde con las lomas en unos metros. Así los suelos, las puertas y los
//   interiores quedan a nivel y nada flota ni se entierra.
//
// Toda la lógica del juego sigue en el plano (colisiones, navegación, alturas relativas al
// suelo); la altura sólo se suma al dibujar: el suelo se deforma vértice a vértice y los
// objetos (edificios, mobiliario, gente, coches) se apoyan en H(x, z) de su punto de apoyo.
export const T = { on: false };

const pads = [];
const grid = new Map();
const CELL = 16;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

// límites de la zona con relieve (la circunvalación de la isla) y ejes de las calles: en la
// calzada y la acera manda el terreno natural (los solares no las deforman)
let RX = 210, RZ = 120, XS = [], ZS = [], WALK = 6.5, ISLE = null;
export function setRelief(on, { rx = 210, rz = 120, xs = [], zs = [], walk = 6.5, isle = null } = {}) {
  T.on = on; RX = rx; RZ = rz; XS = xs; ZS = zs; WALK = walk; ISLE = isle;
  pads.length = 0; grid.clear();
}
// 0 sobre calles y aceras, 1 a partir de metro y medio dentro de la manzana
function offRoad(x, z) {
  let d = 1e9;
  if (Math.abs(z) < RZ + WALK) for (const v of XS) d = Math.min(d, Math.abs(x - v));
  if (Math.abs(x) < RX + WALK) for (const v of ZS) d = Math.min(d, Math.abs(z - v));
  return smooth(WALK, WALK + 1.5, d);
}

export function baseH(x, z) {
  if (!T.on) return 0;
  const d = Math.min(RX - Math.abs(x), RZ - Math.abs(z));
  const m = smooth(-24, 70, d);
  const coast = d < 0 ? coastH(x, z, -d) : 0; // continuo: se suma a las lomas
  if (m <= 0) return coast;
  const h = 2.5 + 1.35 * Math.sin(x * 0.0115 + 0.6) + 1.0 * Math.sin(z * 0.016 - 0.4) + 0.55 * Math.sin((x + z) * 0.0085 + 2.0);
  return Math.max(0, h) * m + coast;
}

// Franja de costa (fuera de la circunvalación): dunas y lomas bajas que mueren en la orilla y
// junto a la acera de la circunvalación
function coastH(x, z, out) {
  if (!ISLE) return 0;
  const shore = Math.min(x - ISLE.x0, ISLE.x1 - x, z - ISLE.z0, ISLE.z1 - z);
  const band = smooth(WALK + 6, WALK + 16, out) * smooth(1, 12, shore);
  if (band <= 0) return 0;
  const n = 0.55 + 0.3 * Math.sin(x * 0.07 + Math.sin(z * 0.05) * 2) + 0.15 * Math.sin(z * 0.11 - x * 0.04);
  return band * n * 1.5;
}

// Solar llano: [x0,x1]×[z0,z1] a la altura h. Por defecto, la del terreno delante de la
// fachada (front: '+z' | '-z' | '+x' | '-x'), así la puerta queda a ras de la acera; sin
// fachada conocida, la del centro. m = metros de transición alrededor.
export function addPad(x0, x1, z0, z1, { h, m = 3, front } = {}) {
  if (!T.on) return 0;
  const p = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), m };
  const cx = (p.x0 + p.x1) / 2, cz = (p.z0 + p.z1) / 2;
  const at = { '+z': [cx, p.z1 + 1], '-z': [cx, p.z0 - 1], '+x': [p.x1 + 1, cz], '-x': [p.x0 - 1, cz] }[front] || [cx, cz];
  // terreno a lo largo del borde del solar
  const edge = [];
  for (let k = 0; k <= 8; k++) {
    const t = k / 8, ex = p.x0 + (p.x1 - p.x0) * t, ez = p.z0 + (p.z1 - p.z0) * t;
    edge.push(baseH(ex, p.z0), baseH(ex, p.z1), baseH(p.x0, ez), baseH(p.x1, ez));
  }
  const lo = Math.min(...edge), hi = Math.max(...edge);
  // los solares grandes, a media altura (el talud se reparte por todos los lados)
  p.h = h ?? ((p.x1 - p.x0) * (p.z1 - p.z0) > 400 ? (lo + hi) / 2 : baseH(at[0], at[1]));
  // cuanto más se separa el solar del terreno (edificios grandes en cuesta), más largo el talud
  const dev = Math.max(Math.abs(hi - p.h), Math.abs(lo - p.h));
  m = p.m = Math.min(12, Math.max(m, 1.5 + dev * 3.4));
  pads.push(p);
  for (let ix = Math.floor((p.x0 - m) / CELL); ix <= Math.floor((p.x1 + m) / CELL); ix++)
    for (let iz = Math.floor((p.z0 - m) / CELL); iz <= Math.floor((p.z1 + m) / CELL); iz++) {
      const k = ix + ',' + iz;
      if (!grid.has(k)) grid.set(k, []);
      grid.get(k).push(p);
    }
  return p.h;
}

// Altura final del suelo en (x, z): las lomas, con los solares mezclados por peso (dentro de
// un solar pesa 1; se desvanece en su franja de transición). Es continua en todas partes.
export function H(x, z) {
  if (!T.on) return 0;
  const b = baseH(x, z);
  const list = grid.get(Math.floor(x / CELL) + ',' + Math.floor(z / CELL));
  if (!list) return b;
  let ws = 0, hs = 0, wm = 0;
  for (const p of list) {
    const dx = Math.max(p.x0 - x, 0, x - p.x1), dz = Math.max(p.z0 - z, 0, z - p.z1);
    const d = dx === 0 && dz === 0 ? 0 : Math.hypot(dx, dz);
    if (d >= p.m) continue;
    const w = 1 - smooth(0, p.m, d);
    ws += w; hs += w * p.h; if (w > wm) wm = w;
  }
  if (!ws) return b;
  return b + (hs / ws - b) * wm * offRoad(x, z);
}

// Pendiente (dh/dx, dh/dz) por diferencias centradas
export function slope(x, z, e = 0.8) {
  return [(H(x + e, z) - H(x - e, z)) / (2 * e), (H(x, z + e) - H(x, z - e)) / (2 * e)];
}

// Deforma una geometría en coordenadas del mundo: cada vértice sube lo que mida el suelo
// debajo (para calzadas, aceras, césped y todo lo que es «suelo»)
export function drapeGeometry(geo, dy = 0) {
  if (!T.on) return geo;
  const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + H(P.getX(i), P.getZ(i)) + dy);
  P.needsUpdate = true;
  geo.computeBoundingSphere?.();
  return geo;
}
