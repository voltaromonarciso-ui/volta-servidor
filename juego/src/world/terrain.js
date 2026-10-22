// Relieve de la isla: una sola función de altura para todo el mapa.
//
// · baseH: una colina clara en el centro (~12 m) con ondulaciones suaves, que se aplana hacia
//   la circunvalación (la costa, la playa y los muelles quedan a ras del mar). Las calles van
//   por su cuenta: cada cruce es llano y entre cruces la calle sube o baja en rampa recta.
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
  nodeH.clear();
  pads.length = 0; grid.clear(); floors.length = 0;
}
// 0 sobre calles y aceras, 1 justo dentro de la manzana
function offRoad(x, z) {
  let d = 1e9;
  if (Math.abs(z) < RZ + WALK) for (const v of XS) d = Math.min(d, Math.abs(x - v));
  if (Math.abs(x) < RX + WALK) for (const v of ZS) d = Math.min(d, Math.abs(z - v));
  return smooth(WALK, WALK + 0.3, d); // el escalón con la acera lo tapa un muro (island.retainingWalls)
}

// Terreno natural (sin calles)
function naturalH(x, z) {
  const d = Math.min(RX - Math.abs(x), RZ - Math.abs(z));
  const m = smooth(-30, 115, d); // transición larga: la colina baja hacia la costa sin tramos de más del ~20 %
  const coast = d < 0 ? coastH(x, z, -d) : 0; // continuo: se suma a las lomas
  if (m <= 0) return coast;
  // colina clara en el centro (Barrio Alto, Parque, Mansión): ~12 m arriba, bajando hacia la
  // costa; encima, ondulaciones suaves para que las calles no sean planos inclinados
  const hill = 12.5 * Math.exp(-(((x + 60) / 115) ** 2) - (((z - 8) / 80) ** 2));
  const h = hill + 0.9 + 0.8 * Math.sin(x * 0.021 + 0.6) + 0.6 * Math.sin(z * 0.027 - 0.4);
  return Math.max(0, h) * m + coast;
}
// Calles: como en la vida real, cada cruce es llano (el cruce y los pasos de cebra) y entre
// dos cruces la calle sube o baja en rampa recta, con un acuerdo suave al empezar y acabar.
const FLAT = 8, KNEE = 3;
function ramp(s, L) { // 0 → 1 a lo largo del tramo [0, L]
  const a = FLAT, b = L - FLAT;
  if (s <= a) return 0;
  if (s >= b) return 1;
  const lin = (t) => (t - a - KNEE / 2) / (b - a - KNEE);
  if (s < a + KNEE) { const u = (s - a) / KNEE; return (u * u * KNEE) / 2 / (b - a - KNEE); } // acuerdo de entrada
  if (s > b - KNEE) { const u = (b - s) / KNEE; return 1 - (u * u * KNEE) / 2 / (b - a - KNEE); } // acuerdo de salida
  return lin(s);
}
const nodeH = new Map();
const node = (x, z) => { const k = x + ',' + z; if (!nodeH.has(k)) nodeH.set(k, naturalH(x, z)); return nodeH.get(k); };
function streetH(x, z) {
  if (!XS.length || Math.abs(x) > RX + WALK || Math.abs(z) > RZ + WALK) return null;
  let ix = 0, iz = 0;
  for (let k = 1; k < XS.length; k++) if (Math.abs(x - XS[k]) < Math.abs(x - XS[ix])) ix = k;
  for (let k = 1; k < ZS.length; k++) if (Math.abs(z - ZS[k]) < Math.abs(z - ZS[iz])) iz = k;
  const onX = Math.abs(x - XS[ix]) < WALK, onZ = Math.abs(z - ZS[iz]) < WALK; // calle N-S / calle E-O
  if (!onX && !onZ) return null;
  if (onX && onZ) return node(XS[ix], ZS[iz]);
  if (onZ) { // calle este-oeste: entre los cruces a la izquierda y a la derecha
    let a = XS.findLastIndex((v) => v <= x); a = Math.max(0, Math.min(XS.length - 2, a));
    const L = XS[a + 1] - XS[a], f = ramp(x - XS[a], L);
    return node(XS[a], ZS[iz]) + (node(XS[a + 1], ZS[iz]) - node(XS[a], ZS[iz])) * f;
  }
  let a = ZS.findLastIndex((v) => v <= z); a = Math.max(0, Math.min(ZS.length - 2, a));
  const L = ZS[a + 1] - ZS[a], f = ramp(z - ZS[a], L);
  return node(XS[ix], ZS[a]) + (node(XS[ix], ZS[a + 1]) - node(XS[ix], ZS[a])) * f;
}
export function baseH(x, z) {
  if (!T.on) return 0;
  const st = streetH(x, z);
  return st ?? naturalH(x, z);
}

// Orilla con forma: el rectángulo de esquinas redondeadas de la isla (ISLE, radio r) con cabos
// que salen al mar (amp > 0) y calas (amp < 0) repartidos por la costa: blobs [x, z, amp, ancho]
// centrados en un punto de la orilla original.
const CLAMP = (v, a, b) => Math.max(a, Math.min(b, v));
function onRect(x, z) { // punto más cercano de la orilla rectangular y distancia con signo (+ fuera)
  const { x0, x1, z0, z1, r } = ISLE;
  const qx = CLAMP(x, x0 + r, x1 - r), qz = CLAMP(z, z0 + r, z1 - r);
  let dx = x - qx, dz = z - qz, l = Math.hypot(dx, dz);
  if (l < 1e-6) { // dentro del rectángulo interior: hacia el lado más cercano
    const ds = [[x - (x0 + r), -1, 0], [x1 - r - x, 1, 0], [z - (z0 + r), 0, -1], [z1 - r - z, 0, 1]].sort((a, b) => a[0] - b[0])[0];
    return { d: -ds[0] - r, sx: x + ds[1] * (ds[0] + r), sz: z + ds[2] * (ds[0] + r), nx: ds[1], nz: ds[2] };
  }
  return { d: l - r, sx: qx + (dx / l) * r, sz: qz + (dz / l) * r, nx: dx / l, nz: dz / l };
}
function bulge(sx, sz) {
  let b = 0;
  for (const [bx, bz, amp, w] of ISLE.blobs || []) b += amp * Math.exp(-((sx - bx) ** 2 + (sz - bz) ** 2) / (w * w));
  return b;
}
// Metros tierra adentro desde la orilla (negativo: en el mar)
export function shoreDist(x, z) {
  if (!ISLE) return 1e9;
  const o = onRect(x, z);
  return bulge(o.sx, o.sz) - o.d;
}
// Contorno de la orilla desplazado `pad` metros hacia el mar (puntos [x, z] en orden)
export function coastOutline(pad = 0, step = 3) {
  const { x0, x1, z0, z1, r } = ISLE, out = [];
  const push = (x, z, nx, nz) => { const b = bulge(x, z) + pad; out.push([x + nx * b, z + nz * b]); };
  const side = (ax, az, bx, bz, nx, nz) => { const L = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.round(L / step)); for (let k = 0; k < n; k++) push(ax + ((bx - ax) * k) / n, az + ((bz - az) * k) / n, nx, nz); };
  const arc = (cx, cz, a0) => { const n = Math.max(4, Math.round((Math.PI * r) / 2 / step)); for (let k = 0; k < n; k++) { const a = a0 + ((Math.PI / 2) * k) / n, nx = Math.cos(a), nz = Math.sin(a); push(cx + nx * r, cz + nz * r, nx, nz); } };
  side(x0 + r, z0, x1 - r, z0, 0, -1); arc(x1 - r, z0 + r, -Math.PI / 2);
  side(x1, z0 + r, x1, z1 - r, 1, 0); arc(x1 - r, z1 - r, 0);
  side(x1 - r, z1, x0 + r, z1, 0, 1); arc(x0 + r, z1 - r, Math.PI / 2);
  side(x0, z1 - r, x0, z0 + r, -1, 0); arc(x0 + r, z0 + r, Math.PI);
  return out;
}

// Franja de costa (fuera de la circunvalación): dunas y lomas bajas que mueren en la orilla y
// junto a la acera de la circunvalación
function coastH(x, z, out) {
  if (!ISLE) return 0;
  const shore = shoreDist(x, z);
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
  // el solar nunca entra en la acera ni en la calzada (los toldos y rótulos de un modelo
  // pueden volar sobre la acera, pero el suelo de la acera es el de la calle)
  const cut = WALK + 0.3;
  if (Math.abs((p.z0 + p.z1) / 2) < RZ + WALK) for (const v of XS) if (p.x0 < v + cut && p.x1 > v - cut) { if ((p.x0 + p.x1) / 2 > v) p.x0 = v + cut; else p.x1 = v - cut; }
  if (Math.abs((p.x0 + p.x1) / 2) < RX + WALK) for (const v of ZS) if (p.z0 < v + cut && p.z1 > v - cut) { if ((p.z0 + p.z1) / 2 > v) p.z0 = v + cut; else p.z1 = v - cut; }
  if (p.x1 - p.x0 < 0.5 || p.z1 - p.z0 < 0.5) return baseH((x0 + x1) / 2, (z0 + z1) / 2);
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
  // si se solapa con otro solar, a su misma altura (dos alturas en el mismo suelo = escalón)
  const over = h == null && pads.find((q) => q.x0 < p.x1 && q.x1 > p.x0 && q.z0 < p.z1 && q.z1 > p.z0);
  if (over) p.h = over.h;
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
    if (dx === 0 && dz === 0) return p.h; // dentro del solar: llano siempre (también junto a la acera)
    const d = Math.hypot(dx, dz);
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

// Suelos elevados dentro de los edificios (escaleras, plantas altas): donde los hay, el
// jugador y los objetos pisan esa altura en vez del terreno. h(x, z) da la altura absoluta.
// Con { upper: true } es una planta con hueco debajo (entreplanta, escalera): sólo se pisa si
// se llega desde arriba (los pies a menos de medio metro por debajo); quien va por debajo
// sigue en el suelo de abajo. Sin `y` (otros usos: objetos, cámara…) no cuentan.
const floors = [];
export function addFloor(x0, x1, z0, z1, h, { upper = false } = {}) { floors.push({ x0, x1, z0, z1, h, upper }); }
export function floorAt(x, z, y) {
  for (const f of floors) {
    if (x < f.x0 || x > f.x1 || z < f.z0 || z > f.z1) continue;
    const fh = f.h(x, z);
    if (f.upper && (y === undefined || y < fh - 0.5)) continue;
    return fh;
  }
  return null;
}
// Altura donde se pisa: el suelo elevado si lo hay, si no el terreno
export const groundAt = (x, z, y) => (floors.length ? floorAt(x, z, y) ?? H(x, z) : H(x, z));

// Solares registrados (para levantar muros de contención en sus bordes)
export const allPads = () => pads;
// Altura «por debajo»: la menor alrededor (radio r). El césped la usa para no asomar por
// encima de aceras, caminos o muros donde el suelo da un escalón.
export const Hlow = (x, z, r = 1.1) => Math.min(H(x, z), H(x + r, z), H(x - r, z), H(x, z + r), H(x, z - r));
// Deforma una geometría en coordenadas del mundo: cada vértice sube lo que mida el suelo
// debajo (para calzadas, aceras, césped y todo lo que es «suelo»)
export function drapeGeometry(geo, dy = 0, fn = H) {
  if (!T.on) return geo;
  const P = geo.attributes.position;
  for (let i = 0; i < P.count; i++) P.setY(i, P.getY(i) + fn(P.getX(i), P.getZ(i)) + dy);
  P.needsUpdate = true;
  geo.computeBoundingSphere?.();
  return geo;
}
