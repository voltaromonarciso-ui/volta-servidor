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
import { G } from '../game.js';
import { W, B, TM, scene, K } from './world.js';
import * as SK from './streetkit.js';
import { createFurniture } from './streetfurniture.js';
import { hasBuilding, buildingModel, buildingSize } from './buildingkit.js';
import { shopBuilding, warehouseBuilding, bankBranch } from './realbuilding.js';
import { eclipse as eclipseFacade } from './facades.js';
import * as SKP from './streetkit.js';

// líneas de calle (centro de la calzada)
export const XL = [-210, -150, -90, -30, 30, 90, 150, 210];
export const ZL = [-120, -60, 0, 60, 120];
const COLS = XL.length - 1, ROWS = ZL.length - 1;
const N = { x0: -250, x1: 250, z0: -165, z1: 168 }; // costa (límite caminable)

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
const tree = (x, z, s = 1) => F.place('arbol', SK.arbol, x, z, R() * 6.28, { s: s * 1.25, hit: 0.5 });
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
  W.mapRects.push({ ...r, c: mapColor });
  if (label) W.mapLabels.push({ x, z, t: label });
  return r;
}
const HOUSES = ['h_house1', 'h_house2', 'h_house3', 'h_house4', 'h_house5', 'h_house6'];
// Casa con jardín: devuelve el punto de la puerta (como K.house) para los vecinos
function houseAt(x, z, front, seed) {
  const ry = front === '+z' ? 0 : Math.PI, f = front === '+z' ? 1 : -1;
  const r = modelBuilding(HOUSES[seed % HOUSES.length], x, z, ry, { mapColor: '#c9b28e' });
  if (!r) return K.house(x, z, front, seed);
  const zf = f > 0 ? r.z1 : r.z0;
  B.box('#d6cdb9', x, 0, zf + f * 1.6, 1.4, 0.05, 3.2, 0, { shadow: false, ao: 0 }); // camino a la puerta
  return { x, z: zf + f * 1.2 };
}

// Local realista (realbuilding) con su colisión, su rectángulo y su nombre en el mapa.
// Devuelve el punto delante de la puerta o null si las texturas no están (se usa el de antes).
function realAt(key, make, x, z, ry, { label, mapColor = '#b9a68a' } = {}) {
  if (!hasBuilding('q_Flat')) return null; // sin modelos/texturas cargados: edificio clásico
  let door = null;
  const box = F.place('real:' + key, () => { const r = make(); door = r.door; return r.group; }, x, z, ry);
  const turned = Math.abs(Math.sin(ry)) > 0.5, c = Math.cos(ry), sn = Math.sin(ry);
  const hw = (turned ? box.max.z - box.min.z : box.max.x - box.min.x) / 2, hd = (turned ? box.max.x - box.min.x : box.max.z - box.min.z) / 2;
  W.mapRects.push({ x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, c: mapColor });
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

export function buildIsland() {
  seedN = 7;
  F = createFurniture({ addBox: K.addBox });
  SK.setDetail(0.4); // versión ligera de los modelos para el mapa
  W.atms = [];
  W.roadsX = XL; W.roadsZ = ZL;
  W.bounds = N;
  W.zones = [];
  buildLandAndSea();
  buildRoadNet();
  buildNavNet();
  buildTraffic();
  buildLightsAndSigns();
  for (let j = 0; j < ROWS; j++) for (let i = 0; i < COLS; i++) buildBlock(block(i, j));
  buildCoast();
  buildStreetFurniture();
  const res = F.build(scene);
  W.glowMats = res.glowMats;
  W.furnitureStats = res;
  SK.setDetail(1);
  K.buildSkyline();
  K.buildMountains();
  tempProps();
}

// PROVISIONAL (fase 1): propiedades y puntos que el resto del juego espera encontrar.
// En la fase 2 se sustituyen por los locales reales (piso inicial, almacenes, etc.).
function tempProps() {
  const a = blockOf('apartamentos'), w = blockOf('almacenBravo');
  W.props.nave = { x0: w.x0 + 4, x1: w.x1 - 4, z0: w.cz - 8, z1: w.cz + 14, spawn: { x: w.cx, z: w.z1 + 2, yaw: Math.PI } };
  W.pois.nave = { x: w.cx, z: w.z1 + 2 };
  W.pois.deadDrop = { x: w.x0 + 8, z: w.z0 + 3.2 };
  W.pois.bungalow = { x: a.cx, z: a.z1 + 2 };
  W.pois.inicio = { x: a.cx, z: a.z1 + 2 };
  W.worker = { x: w.cx + 3, z: w.z1 + 3, yaw: 0 };
}

// ------------------------------------------------------------------
//  Tierra, playa y mar
// ------------------------------------------------------------------
function islandShape(pad = 0) {
  // rectángulo de esquinas redondeadas con entrantes suaves (la costa de la referencia)
  const x0 = N.x0 - pad, x1 = N.x1 + pad, z0 = N.z0 - pad, z1 = N.z1 + pad, r = 34 + pad;
  const s = new THREE.Shape();
  s.moveTo(x0 + r, z0);
  s.lineTo(x1 - r, z0); s.quadraticCurveTo(x1, z0, x1, z0 + r);
  s.lineTo(x1, z1 - r); s.quadraticCurveTo(x1, z1, x1 - r, z1);
  s.lineTo(x0 + r, z1); s.quadraticCurveTo(x0, z1, x0, z1 - r);
  s.lineTo(x0, z0 + r); s.quadraticCurveTo(x0, z0, x0 + r, z0);
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
  const gt = K.TX.groundTex('#7d9a4c', 3);
  gt.repeat.set(0.18, 0.18);
  gt.wrapS = gt.wrapT = THREE.RepeatWrapping;
  flat(islandShape(0), 0xffffff, -0.01, gt);
  const water = new THREE.Mesh(new THREE.PlaneGeometry(2400, 2400), new THREE.MeshStandardMaterial({ color: 0x24688f, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.94 }));
  water.rotation.x = -Math.PI / 2;
  water.position.y = -0.35;
  scene.add(water);
  W.water = water;
  // límites: no se puede salir al mar (salvo por los muelles, que tienen su propio cierre)
  const t = 3;
  K.addBox(N.x0 - 8 - t, N.x0 - 8, N.z0 - 12, N.z1 + 12, 10);
  K.addBox(N.x1 + 8, N.x1 + 8 + t, N.z0 - 12, N.z1 + 12, 10);
  K.addBox(N.x0 - 12, N.x1 + 12, N.z0 - 8 - t, N.z0 - 8, 10);
  K.addBox(N.x0 - 12, N.x1 + 12, N.z1 + 8, N.z1 + 8 + t, 10);
  W.mapRects.push({ x0: N.x0 - 10, x1: N.x1 + 10, z0: N.z0 - 10, z1: N.z1 + 10, c: '#e6d39c' });
  W.mapRects.push({ x0: N.x0, x1: N.x1, z0: N.z0, z1: N.z1, c: '#6f9a55' });
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
  for (const x of XL) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, zLen), matZ);
    a.rotation.x = -Math.PI / 2; a.position.set(x, 0.02, zc); a.receiveShadow = true; scene.add(a);
    W.mapRects.push({ x0: x - RH, x1: x + RH, z0: ZL[0] - RH, z1: ZL[ROWS] + RH, c: '#3b3f45', road: true });
  }
  for (const z of ZL) {
    const b = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, xLen), matX);
    b.rotation.set(-Math.PI / 2, 0, Math.PI / 2); b.position.set(xc, 0.021, z); b.receiveShadow = true; scene.add(b);
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
const RECIPE = {
  residencial: [['arbol', 'c'], ['banco', 'w'], ['buzon', 'w'], ['arbol', 'c'], ['reciclaje', 'w'], ['hidrante', 'c'], ['macetero', 'w'], ['arbol', 'c']],
  comercio: [['palmera', 'c'], ['banco', 'w'], ['aparcabicis', 'w'], ['papelera', 'c'], ['cabina', 'w'], ['palmera', 'c'], ['cartel', 'w'], ['hidrante', 'c'], ['bici', 'w'], ['macetero', 'w']],
  ocio: [['palmera', 'c'], ['taxi', 'w'], ['papelera', 'c'], ['cartel', 'w'], ['palmera', 'c'], ['bolardos', 'c'], ['banco', 'w']],
  industrial: [['cajaElectrica', 'w'], ['cono', 'c'], ['vallaObra', 'w'], ['cilindro', 'c'], ['poste', 'c'], ['hidrante', 'c'], ['papelera', 'c']],
  verde: [['arbol', 'c'], ['bancoParque', 'w'], ['papelera', 'c'], ['arbol', 'c'], ['fuenteAgua', 'w'], ['seto', 'w'], ['arbol', 'c'], ['jardin', 'w']],
  servicio: [['palmera', 'c'], ['papelera', 'c'], ['cajaElectrica', 'w'], ['hidrante', 'c'], ['banco', 'w'], ['bolardos', 'c']],
  costa: [['palmera', 'c'], ['bancoParque', 'w'], ['palmera', 'c'], ['papelera', 'c']],
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
  for (const zone of ATM_ZONES) {
    const b = blockOf(zone), zN = ZL[ROWS - b.j];
    let x = b.cx + 14, z = zN - WALLSIDE;
    if (hasBuilding('q_Flat')) {
      const bx = b.x1 - 4.6, bz = b.z1 - 3.9;
      let info = null;
      F.place('banco', () => { info = bankBranch(); return info.group; }, bx, bz, 0);
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
      const [name, side] = rec[r++ % rec.length];
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
  B.box(ground, b.cx, 0, b.cz, b.x1 - b.x0, 0.06, b.z1 - b.z0, 0, { shadow: false, ao: 0 });
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

const FILL = {
  residencial(b) {
    // casas alrededor de una calle interior en U (Bungalós, Barrio Alto, Cabañas, Apartamentos, Mansión)
    const z = b.z1 - 9;
    const n = b.zone === 'barrioAlto' || b.zone === 'apartamentos' ? 2 : 3;
    if (b.zone === 'mansion') {
      K.building({ x0: b.cx - 13, x1: b.cx + 13, z0: b.cz - 4, z1: b.cz + 10, h: 9, wall: '#f2e6cf', trim: '#ffffff', roof: '#8c4a32', style: 'house', front: '+z', roofType: 'gable', seed: 951, mapColor: '#d8c8a8', label: 'Mansión' });
      K.asphalt(b.cx - 2.5, b.cx + 2.5, b.cz + 10, b.z1, '#c9c2b4');
      B.box('#2f8fc9', b.cx, 0, b.cz - 11, 12, 0.08, 6, 0, { mat: 'glass', ao: 0 }); // piscina
      for (const x of [-16, 16]) palm(b.cx + x, b.cz + 13, 9);
      return;
    }
    if (b.zone === 'apartamentos' || b.zone === 'barrioAlto') {
      const pair = b.zone === 'apartamentos' ? [['cb_Building_5_A', 22], ['cb_Building_2_A', 14]] : [['q_Flat', 16], ['q_Flat2', 16]];
      let x = b.x0 + 3, ok = true;
      for (const [nm, w] of pair) { if (!modelBuilding(nm, x + w / 2, b.cz + 3, 0, { w, mapColor: '#b9a68a', label: x === b.x0 + 3 ? ZONE_NAMES[b.zone] : undefined })) ok = false; x += w + 4; }
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
      let info = null;
      F.place('eclipse', () => { info = eclipseFacade(); return info.group; }, b.cx - 1, b.cz + 6, 0, { solid: false });
      for (const [x0, x1, z0, z1, h] of info.boxes) K.addBox(b.cx - 1 + x0, b.cx - 1 + x1, b.cz + 6 + z0, b.cz + 6 + z1, h);
      for (const [x, z] of info.planters || []) { F.place('macetero', SKP.macetero, b.cx - 1 + x, b.cz + 6 + z, 0); F.place('palmera', () => SKP.palmera(), b.cx - 1 + x, b.cz + 6 + z, 0, { y: 0.55, s: 1.1 }); }
      W.mapRects.push({ x0: b.cx - 17, x1: b.cx + 19, z0: b.cz - 8, z1: b.cz + 8, c: '#9b6bc9' });
      W.mapLabels.push({ x: b.cx, z: b.cz, t: ZONE_NAMES[b.zone] });
      W.pois.eclipse = { x: b.cx - 1 + info.door.x, z: b.cz + 6 + info.door.z };
      for (let k = 0; k < 3; k++) K.parkedCar(b.x0 + 8 + k * 9, b.z1 - 5, Math.PI / 2);
      return;
    }
    if (b.zone === 'eclipse' || !realAt(b.zone, () => shopBuilding({ w: 30, d: 20, sign: s.text || ZONE_NAMES[b.zone].toUpperCase(), signBg: s.bg || '#1e2a33', ...(LOOK[b.zone] || { wall: 'claro', stone: 'blanco', floors: 2 }) }), b.cx, b.cz + 2, 0, { label: ZONE_NAMES[b.zone], mapColor: '#9b6bc9' })) K.building({ x0: b.cx - 15, x1: b.cx + 15, z0: b.cz - 8, z1: b.cz + 12, h: s.h || 9, wall: s.wall || '#3a2a4a', trim: s.trim || '#ffd34d', roof: '#2b2b30', style: 'shop', front: '+z', sign: s.text, signBg: s.bg, awning: s.awning, seed: 800 + b.i, mapColor: '#9b6bc9', label: ZONE_NAMES[b.zone] });
    K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 12, b.z1 - 1, '#45484d');
    for (let k = 0; k < 4; k++) K.parkedCar(b.x0 + 8 + k * 9, b.z1 - 5, Math.PI / 2);
    for (const x of [b.x0 + 3, b.x1 - 3]) palm(x, b.cz, rr(8, 11));
  },
  industrial(b) {
    if (!realAt(b.zone, () => warehouseBuilding({ w: b.x1 - b.x0 - 8, d: 22, h: 9, sign: ZONE_NAMES[b.zone].toUpperCase(), signBg: '#34495e', doors: 2 }), b.cx, b.cz + 3, 0, { label: ZONE_NAMES[b.zone], mapColor: '#8a9aa6' })) K.building({ x0: b.x0 + 4, x1: b.x1 - 4, z0: b.cz - 8, z1: b.cz + 14, h: 9, wall: '#8a949e', trim: '#d0d6dc', roof: '#4d4d4d', style: 'warehouse', front: '+z', sign: ZONE_NAMES[b.zone].toUpperCase(), signBg: '#34495e', seed: 900 + b.i, mapColor: '#8a9aa6', label: ZONE_NAMES[b.zone] });
    K.asphalt(b.x0 + 2, b.x1 - 2, b.cz + 14, b.z1 - 1, '#5a5d61');
    K.chainFence(b.x0 + 1, b.z1 - 0.5, b.cx - 4, b.z1 - 0.5);
    K.chainFence(b.cx + 4, b.z1 - 0.5, b.x1 - 1, b.z1 - 0.5);
    for (let k = 0; k < 3; k++) K.pallet(b.x0 + 6 + k * 2.2, b.cz + 17, 0, k % 3);
    K.forklift(b.x1 - 10, b.cz + 18, 0.4);
  },
  verde(b) {
    if (b.zone === 'bosque') {
      for (let k = 0; k < 40; k++) tree(rr(b.x0 + 2, b.x1 - 2), rr(b.z0 + 2, b.z1 - 2), rr(0.9, 1.6));
      return;
    }
    // Parque Central: paseos en cruz, fuente y bancos
    K.paving(b.cx - 2, b.cx + 2, b.z0 + 1, b.z1 - 1);
    K.paving(b.x0 + 1, b.x1 - 1, b.cz - 2, b.cz + 2);
    B.add(K.GEO.cyl16, '#cfd6dc', b.cx, 0.35, b.cz, 7, 0.7, 7);
    B.add(K.GEO.cyl16, '#3a8fc0', b.cx, 0.72, b.cz, 6.2, 0.06, 6.2, 0, { mat: 'glass', ao: 0 });
    K.addBox(b.cx - 3.4, b.cx + 3.4, b.cz - 3.4, b.cz + 3.4, 0.8);
    for (const [x, z, r] of [[-6, 4, 0], [6, -4, Math.PI], [4, 6, Math.PI / 2], [-4, -6, -Math.PI / 2]]) bench(b.cx + x, b.cz + z, r);
    for (let k = 0; k < 22; k++) {
      const x = rr(b.x0 + 2, b.x1 - 2), z = rr(b.z0 + 2, b.z1 - 2);
      if (Math.abs(x - b.cx) < 4 || Math.abs(z - b.cz) < 4) continue;
      R() < 0.5 ? palm(x, z) : tree(x, z, rr(0.9, 1.3));
    }
    W.spots.push({ id: 'parque', name: 'Banco del Parque Central', x: b.cx + 6, z: b.cz - 6 });
  },
  servicio(b) {
    const s = SIGN[b.zone] || {};
    if (b.zone.startsWith('gas')) {
      // marquesina, surtidores y tienda (el interior se monta en la fase 2)
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
function buildCoast() {
  const zN = ZL[ROWS] + K.SWO, zS = ZL[0] - K.SWO;
  // Faro sobre una loma de rocas (noroeste)
  const fx = XL[0] - 12, fz = zN + 26;
  for (let k = 0; k < 9; k++) B.add(K.GEO.ico1, '#7d7a72', fx + rr(-10, 10), 0.2, fz + rr(-8, 8), rr(5, 9), rr(2, 4), rr(5, 9), R() * 3, { jitter: 0.1 });
  B.add(K.GEO.cyl16, '#ecf0f1', fx, 6, fz, 3.4, 12, 3.4);
  for (let y = 1.5; y < 12; y += 3) B.add(K.GEO.cyl16, '#c0392b', fx, y, fz, 3.45, 1.2, 3.45, 0, { ao: 0 });
  B.add(K.GEO.cyl8, '#2c3e50', fx, 12.6, fz, 2.2, 1.2, 2.2);
  B.add(K.GEO.cone8, '#c0392b', fx, 13.8, fz, 2.6, 1.4, 2.6);
  W.bulbPositions.push([fx, 12.6, fz - 1.2]);
  K.addBox(fx - 2, fx + 2, fz - 2, fz + 2, 14);
  W.mapLabels.push({ x: fx, z: fz, t: 'Faro' });
  // Puerto (norte): muelles de madera, contenedores y grúas
  const px = -10;
  K.paving(px - 60, px + 60, zN + 6, zN + 30, '#b9b2a5');
  for (let k = 0; k < 4; k++) {
    const x = px - 45 + k * 30;
    for (let z = zN + 30; z <= zN + 60; z += 0.9) B.box('#9c7a52', x, -0.1, z, 4, 0.18, 0.8, 0, { jitter: 0.12, ao: 0 });
    K.addBox(x - 2.4, x - 2.1, zN + 30, zN + 60.5, 10); K.addBox(x + 2.1, x + 2.4, zN + 30, zN + 60.5, 10); K.addBox(x - 2.4, x + 2.4, zN + 60.4, zN + 61, 10);
  }
  K.addBox(px - 64, px + 64, zN + 30.4, zN + 31, 10); // borde del muelle (salvo pasarelas)
  const cols = ['#c0392b', '#2c6e9e', '#2e7d32', '#e67e22', '#7f8c8d'];
  for (let k = 0; k < 10; k++) {
    const x = px - 52 + (k % 5) * 6.5, z = zN + 12 + Math.floor(k / 5) * 3.2;
    B.box(cols[k % 5], x, 0, z, 6, 2.6, 2.6, 0, { mat: 'metal' });
    K.addBox(x - 3, x + 3, z - 1.3, z + 1.3, 3);
  }
  for (const x of [px + 25, px + 45]) {
    B.box('#e8b923', x, 0, zN + 24, 1, 16, 1, 0, { mat: 'metal' });
    B.box('#e8b923', x - 5, 15, zN + 24, 14, 0.8, 0.8, 0, { mat: 'metal' });
    K.addBox(x - 0.5, x + 0.5, zN + 23.5, zN + 24.5, 16);
  }
  W.spots.push({ id: 'muelle', name: 'Muelle del puerto', x: px - 15, z: zN + 50, discreet: true });
  W.mapLabels.push({ x: px, z: zN + 20, t: 'Puerto' });
  // Playa (noreste): arena, sombrillas y palmeras
  const bx = XL[COLS] - 30;
  B.box('#e8d5a0', bx, 0, zN + 22, 80, 0.07, 36, 0, { shadow: false, ao: 0 });
  for (const [x, z, c] of [[-20, 15, '#e74c3c'], [-5, 22, '#3498db'], [10, 14, '#f1c40f'], [24, 24, '#2ecc71']]) {
    B.add(K.GEO.cyl6, '#ffffff', bx + x, 1.2, zN + z, 0.08, 2.4, 0.08);
    B.add(K.GEO.cone8, c, bx + x, 2.5, zN + z, 3, 0.7, 3, 0, { ao: 0 });
    B.box('#ffffff', bx + x + 1.2, 0, zN + z + 1, 0.7, 0.3, 1.8);
  }
  for (let k = 0; k < 14; k++) palm(bx + rr(-38, 38), zN + rr(6, 34), rr(8, 12));
  W.spots.push({ id: 'playa', name: 'Chiringuito de la playa', x: bx - 30, z: zN + 30 });
  W.mapLabels.push({ x: bx, z: zN + 22, t: 'Playa' });
  // Urbanización (sur): fila de casas frente al mar
  for (let k = 0; k < 9; k++) W.homes.push(houseAt(XL[1] + 10 + k * 24, zS - 16, '+z', 120 + k));
  W.mapLabels.push({ x: 0, z: zS - 16, t: 'Urbanización' });
  // Muelle de carga (sureste)
  const mx = XL[COLS] - 25;
  K.paving(mx - 20, mx + 20, zS - 30, zS - 6, '#a8a49c');
  for (let k = 0; k < 6; k++) { const x = mx - 15 + k * 6; B.box(cols[k % 5], x, 0, zS - 18, 5.4, 2.6, 2.6, 0, { mat: 'metal' }); K.addBox(x - 2.7, x + 2.7, zS - 19.3, zS - 16.7, 3); }
  W.spots.push({ id: 'muelleCarga', name: 'Muelle de carga', x: mx + 12, z: zS - 26, discreet: true });
  W.mapLabels.push({ x: mx, z: zS - 22, t: 'Muelle de carga' });
  // paseo para los peatones
  W.wander.push({ x: px, z: zN + 18 }, { x: bx, z: zN + 18 }, { x: 0, z: zS - 8 });
}
