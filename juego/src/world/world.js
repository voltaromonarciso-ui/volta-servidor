import * as THREE from 'three';
import { G } from '../game.js';
import { StaticBatch, GEO, MAT } from './batch.js';
import { makeCar, vehiclesReady, CAR_MODELS } from '../entities/vehicles.js';
import { propsReady, propSize, addProp, buildProps } from './props.js';
import * as TX from './textures.js';
import { buildBike, buildScooter } from '../entities/rideables.js';
import { PARKING } from '../data/vehicles.js';
import { Nav } from './nav.js';

// ------------------------------------------------------------------
//  PUERTO LOMAS — ciudad costera con palmeras. 9 manzanas, bahía al norte
//  y el skyline de la gran ciudad al otro lado del agua.
// ------------------------------------------------------------------
export const ROADS = [-90, -30, 30, 90];
export const LIMIT = 112;
const RH = 4;          // media calzada
const SWO = 6.5;       // borde exterior de la acera
const SWC = 5.25;      // línea central de la acera (para la navegación)
const CELL = 8;

let W, B, scene, TM;
const roofGeoCache = new Map();
const rnd = (a, b) => a + Math.random() * (b - a);

function makeTexMats() {
  const tm = (map, o = {}) => new THREE.MeshStandardMaterial({ map, vertexColors: true, roughness: 0.92, ...o });
  return {
    slab: tm(TX.slabTex()),
    concrete: tm(TX.concreteTex('#9a9ea3', 4)),
    concreteOut: tm(TX.concreteTex('#a8a49c', 2, 0.18)),
    stucco: tm(TX.stuccoTex()),
    card: tm(TX.cardboardTex(), { roughness: 0.95 }),
    shutter: tm(TX.corrugatedTex('#8a949e'), { roughness: 0.55, metalness: 0.45 }),
    chain: new THREE.MeshStandardMaterial({ map: TX.chainTex(), vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.6 }),
  };
}

export function createWorld(sc) {
  scene = sc;
  W = {
    colliders: [], grid: new Map(), nav: new Nav(),
    pois: {}, homes: [], spots: [], wander: [], floors: [], mapRects: [], mapLabels: [],
    props: {}, winMats: [], doors: [], shutters: [], bulbPositions: [], lampPools: [], water: null, boxes: [], lights: [],
    resolve, los, addBox, inProperty, update, groundAt: () => 0,
  };
  B = new StaticBatch(120); // bloques grandes: menos llamadas de dibujo (lo que más pesa en móvil)
  TM = makeTexMats();

  buildGround();
  buildRoads();
  buildNav();
  buildNave();
  buildIndustrial();
  buildMotel();
  buildPlaza();
  buildShops();
  buildEastShops();
  buildPolice();
  buildCommercial();
  buildResidential();
  buildBeach();
  buildSkyline();
  buildOutskirts();
  buildStreetFurniture();
  buildTrafficLights();
  buildRoadDetails();
  buildMountains();

  W.static = B.build(scene);
  buildProps(scene);
  buildBulbs();
  buildBoxes();
  return W;
}

// ------------------------------------------------------------------
//  Colisiones (cajas alineadas en XZ con altura)
// ------------------------------------------------------------------
function cellKeys(x0, x1, z0, z1) {
  const out = [];
  for (let ix = Math.floor(x0 / CELL); ix <= Math.floor(x1 / CELL); ix++)
    for (let iz = Math.floor(z0 / CELL); iz <= Math.floor(z1 / CELL); iz++) out.push(ix + ',' + iz);
  return out;
}

function addBox(x0, x1, z0, z1, h = 4, tag = null) {
  const c = { x0: Math.min(x0, x1), x1: Math.max(x0, x1), z0: Math.min(z0, z1), z1: Math.max(z0, z1), h, on: true, tag };
  c.keys = cellKeys(c.x0, c.x1, c.z0, c.z1);
  for (const k of c.keys) {
    if (!W.grid.has(k)) W.grid.set(k, []);
    W.grid.get(k).push(c);
  }
  W.colliders.push(c);
  return c;
}

export function removeBox(c) {
  for (const k of c.keys) {
    const arr = W.grid.get(k);
    const i = arr.indexOf(c);
    if (i >= 0) arr.splice(i, 1);
  }
  const i = W.colliders.indexOf(c);
  if (i >= 0) W.colliders.splice(i, 1);
}

const _seen = new Set();
function nearby(x0, x1, z0, z1) {
  _seen.clear();
  const out = [];
  for (const k of cellKeys(x0, x1, z0, z1)) {
    const arr = W.grid.get(k);
    if (!arr) continue;
    for (const c of arr) if (!_seen.has(c)) { _seen.add(c); out.push(c); }
  }
  return out;
}

function resolve(pos, r, y = 0) {
  let hit = false;
  for (let pass = 0; pass < 2; pass++) {
    for (const c of nearby(pos.x - r, pos.x + r, pos.z - r, pos.z + r)) {
      if (!c.on || y > c.h - 0.05) continue;
      const px = Math.max(c.x0, Math.min(pos.x, c.x1));
      const pz = Math.max(c.z0, Math.min(pos.z, c.z1));
      const dx = pos.x - px, dz = pos.z - pz;
      const d2 = dx * dx + dz * dz;
      if (d2 >= r * r) continue;
      hit = true;
      if (d2 > 1e-8) {
        const d = Math.sqrt(d2);
        pos.x += (dx / d) * (r - d);
        pos.z += (dz / d) * (r - d);
      } else {
        const l = pos.x - c.x0, rr = c.x1 - pos.x, t = pos.z - c.z0, b = c.z1 - pos.z;
        const m = Math.min(l, rr, t, b);
        if (m === l) pos.x = c.x0 - r; else if (m === rr) pos.x = c.x1 + r;
        else if (m === t) pos.z = c.z0 - r; else pos.z = c.z1 + r;
      }
    }
  }
  return hit;
}

function los(ax, az, bx, bz, minH = 1.8) {
  const d = Math.hypot(bx - ax, bz - az);
  const n = Math.ceil(d / 0.7);
  const list = nearby(Math.min(ax, bx), Math.max(ax, bx), Math.min(az, bz), Math.max(az, bz));
  for (let i = 1; i < n; i++) {
    const x = ax + ((bx - ax) * i) / n, z = az + ((bz - az) * i) / n;
    for (const c of list) {
      if (c.on && c.h >= minH && x > c.x0 && x < c.x1 && z > c.z0 && z < c.z1) return false;
    }
  }
  return true;
}

function inProperty(x, z) {
  for (const [id, p] of Object.entries(W.props)) {
    if (x >= p.x0 && x <= p.x1 && z >= p.z0 && z <= p.z1) return id;
  }
  return null;
}

// ------------------------------------------------------------------
//  Ayudantes de construcción
// ------------------------------------------------------------------
const hitMat = new THREE.MeshBasicMaterial({ visible: false });
function hitbox(x, y, z, w, h, d, ia) {
  const m = new THREE.Mesh(GEO.box, hitMat);
  m.position.set(x, y, z);
  m.scale.set(w, h, d);
  m.userData.ia = ia;
  m.updateMatrixWorld();
  scene.add(m);
  G.interactables.push(m);
  return m;
}

function roofGeo(len, span, h) {
  const k = [len, span, h].join(',');
  if (!roofGeoCache.has(k)) {
    const s = new THREE.Shape();
    s.moveTo(-span / 2, 0); s.lineTo(span / 2, 0); s.lineTo(0, h); s.lineTo(-span / 2, 0);
    const g = new THREE.ExtrudeGeometry(s, { depth: len, bevelEnabled: false });
    g.translate(0, 0, -len / 2);
    roofGeoCache.set(k, g);
  }
  return roofGeoCache.get(k);
}

const plainCache = new Map();
function plainMat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!plainCache.has(k)) plainCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.9, ...o }));
  return plainCache.get(k);
}

function frontPoint(o, out) {
  const { x0, x1, z0, z1, front = '+z' } = o;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (front === '+z') return { x: cx, z: z1 + out };
  if (front === '-z') return { x: cx, z: z0 - out };
  if (front === '+x') return { x: x1 + out, z: cz };
  return { x: x0 - out, z: cz };
}

function signMesh(text, w, h, opts) {
  const tex = TX.signTex(text, opts);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.2, roughness: 0.5 }));
  W.winMats.push(m.material);
  m.userData.sign = true;
  scene.add(m);
  return m;
}

// Edificio macizo con fachadas texturizadas. front: '+x' | '-x' | '+z' | '-z'
function building(o) {
  const { x0, x1, z0, z1, h, wall = '#d9c6a5', trim = '#f2ece0', roof = '#6d6d6d', style = 'house', front = '+z',
    sign, signBg = '#1e2a33', signFg = '#fff', signBorder = '#f4c542', awning, roofType = 'flat', seed = Math.floor(Math.random() * 9999),
    sideStyle, labels, mapColor, noDoor, label } = o;
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  const rows = Math.max(1, Math.round(h / 3.2));
  const face = (len, isFront) => {
    const cols = isFront && labels ? labels.length : Math.max(1, Math.round(len / 3.2));
    const st = isFront ? style : sideStyle || (style === 'shop' ? 'house' : style === 'motel' ? 'plain' : style);
    if (st === 'plain') return plainMat(wall);
    const f = TX.facade({ wall, trim, cols, rows, door: isFront && !noDoor ? Math.floor(cols / 2) : -1, style: st, seed: seed + len * 7 + (isFront ? 1 : 0), awning, labels: isFront ? labels : null });
    const m = new THREE.MeshStandardMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.88 });
    W.winMats.push(m);
    return m;
  };
  const roofM = plainMat(roof);
  const mats = [
    face(d, front === '+x'), face(d, front === '-x'),
    roofM, roofM,
    face(w, front === '+z'), face(w, front === '-z'),
  ];
  const mesh = new THREE.Mesh(GEO.box, mats);
  mesh.position.set(cx, h / 2, cz);
  mesh.scale.set(w, h, d);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.matrixAutoUpdate = false;
  mesh.updateMatrix();
  scene.add(mesh);
  addBox(x0, x1, z0, z1, h + 2);
  W.mapRects.push({ x0, x1, z0, z1, c: mapColor || '#8b8f99' });
  if (label) W.mapLabels.push({ x: cx, z: cz, t: label });
  // zócalo oscuro (contacto con el suelo)
  B.box('#5e5a55', cx, 0, cz, w + 0.08, 0.35, d + 0.08, 0, { ao: 0.2 });

  if (roofType === 'flat') {
    const t = 0.25;
    B.box('#8a8580', cx, h, z0 + t / 2, w + 0.1, 0.5, t);
    B.box('#8a8580', cx, h, z1 - t / 2, w + 0.1, 0.5, t);
    B.box('#8a8580', x0 + t / 2, h, cz, t, 0.5, d);
    B.box('#8a8580', x1 - t / 2, h, cz, t, 0.5, d);
    if (w * d > 120) {
      B.box('#a7adb3', cx + w * 0.2, h, cz - d * 0.15, 1.6, 1.0, 1.2, 0, { mat: 'metal', ao: 0 });
      B.box('#a7adb3', cx - w * 0.25, h, cz + d * 0.2, 1.2, 0.8, 1.2, 0, { mat: 'metal', ao: 0 });
    }
  } else {
    const alongX = front === '+z' || front === '-z';
    const len = (alongX ? w : d) + 0.9, span = (alongX ? d : w) + 0.9;
    B.add(roofGeo(len, span, Math.min(1.8, span * 0.24)), roof, cx, h, cz, 1, 1, 1, alongX ? Math.PI / 2 : 0, { ao: 0 });
    B.box('#3a3633', cx, h - 0.12, cz, (alongX ? w : w) + 0.9, 0.12, d + 0.9, 0, { ao: 0 });
  }

  const door = frontPoint(o, 1.3);
  if (sign) {
    const len = front === '+z' || front === '-z' ? w : d;
    const sw = Math.min(len * 0.75, 9), sh = sw / 4;
    const sm = signMesh(sign, sw, sh, { bg: signBg, fg: signFg, border: signBorder });
    const p = frontPoint(o, 0.06);
    const yy = style === 'shop' ? 3.9 : Math.min(h - sh / 2 - 0.3, 3.6);
    sm.position.set(p.x, Math.max(yy, sh / 2 + 2.4), p.z);
    sm.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[front];
  }
  return door;
}

// ------------------------------------------------------------------
//  Atrezo
// ------------------------------------------------------------------
// Fronda de palmera: hoja en V con foliolos, curvada hacia abajo.
let _frond;
function frondGeo() {
  if (_frond) return _frond;
  const L = 3.4, S = 10, pos = [];
  const pt = (t, side) => {
    const w = Math.sin(Math.PI * Math.min(1, t * 1.15)) * 0.75 * (side === 0 ? 0 : 1);
    const y = 0.9 * t - 2.0 * t * t;
    return [side * w, y - (side ? w * 0.35 : 0), t * L];
  };
  for (let i = 0; i < S; i++) {
    const t0 = i / S, t1 = (i + 1) / S;
    for (const side of [-1, 1]) {
      const a = pt(t0, 0), b = pt(t1, 0), c = pt((t0 + t1) / 2 + 0.03, side);
      pos.push(...a, ...b, ...c);
    }
  }
  _frond = new THREE.BufferGeometry();
  _frond.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  _frond.computeVertexNormals();
  return _frond;
}

function palm(x, z, h = rnd(7, 11)) {
  const lean = rnd(0, Math.PI * 2), amt = rnd(0.25, 0.9);
  const segs = 6; // menos tramos: mismo aspecto a distancia, la mitad de triángulos
  let px = x, pz = z, py = 0;
  for (let i = 0; i < segs; i++) {
    const t = i / segs, sh = h / segs;
    const r = 0.36 - t * 0.14;
    const dx = Math.cos(lean) * amt * (t * t) * 0.25, dz = Math.sin(lean) * amt * (t * t) * 0.25;
    B.add(GEO.cyl6, i % 2 ? '#7d6447' : '#8f7556', px + dx, py + sh / 2, pz + dz, r * 2, sh * 1.02, r * 2, i, { ao: 0.25, aoH: 2 });
    B.add(GEO.cyl6, '#6b543a', px + dx, py + sh * 0.95, pz + dz, r * 2.15, sh * 0.12, r * 2.15, 0, { ao: 0 });
    px += dx; pz += dz; py += sh;
  }
  // corona
  B.add(GEO.ico1, '#5c6b2e', px, py + 0.15, pz, 0.9, 0.7, 0.9, 0, { ao: 0 });
  const n = 9;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + rnd(-0.2, 0.2);
    B.add(frondGeo(), i % 3 ? '#4f7f2e' : '#5d8f35', px, py + 0.2, pz, 1, 1, rnd(0.85, 1.1), a, { mat: 'foliage', jitter: 0.1, ao: 0, rx: rnd(-0.15, 0.25) });
  }
  for (let i = 0; i < 3; i++) {
    const a = rnd(0, 6.28);
    B.add(frondGeo(), '#8a7a45', px, py - 0.1, pz, 0.8, 1.4, 0.7, a, { mat: 'foliage', ao: 0, rx: 0.6 });
  }
  for (let i = 0; i < 4; i++) B.add(GEO.ico, '#5b4426', px + Math.cos(i * 1.6) * 0.3, py - 0.15, pz + Math.sin(i * 1.6) * 0.3, 0.24, 0.26, 0.24, 0, { ao: 0, shadow: false });
  addBox(x - 0.35, x + 0.35, z - 0.35, z + 0.35, 6);
}

function tree(x, z, s = 1) {
  const trunkH = 1.6 * s;
  B.add(GEO.cyl6, '#6b4a2f', x, trunkH / 2, z, 0.35 * s, trunkH, 0.35 * s);
  B.add(GEO.ico1, '#4f8a3a', x, trunkH + 1.2 * s, z, 3.0 * s, 2.5 * s, 3.0 * s, Math.random() * 3, { jitter: 0.12, ao: 0.3, aoH: 4 });
  B.add(GEO.ico1, '#5b9a44', x + 0.4 * s, trunkH + 2.1 * s, z - 0.3 * s, 2.1 * s, 1.9 * s, 2.1 * s, Math.random() * 3, { jitter: 0.12, ao: 0 });
  addBox(x - 0.3 * s, x + 0.3 * s, z - 0.3 * s, z + 0.3 * s, 5);
}

function bush(x, z, s = 1, color = '#3f7a35') {
  B.add(GEO.ico1, color, x, 0.4 * s, z, 1.4 * s, 1.0 * s, 1.4 * s, Math.random() * 3, { jitter: 0.12, ao: 0.4, aoH: 0.8 });
}

function lamp(x, z, dir = 0) {
  B.add(GEO.cyl8, '#5a5f66', x, 3.4, z, 0.16, 6.8, 0.16, 0, { mat: 'metal', ao: 0 });
  B.add(GEO.cyl8, '#4a4f55', x, 0.3, z, 0.34, 0.6, 0.34, 0, { mat: 'metal' });
  const ax = Math.cos(dir), az = Math.sin(dir);
  B.add(GEO.box, '#5a5f66', x + ax * 0.9, 6.75, z + az * 0.9, Math.abs(ax) * 1.8 + 0.1, 0.09, Math.abs(az) * 1.8 + 0.1, 0, { mat: 'metal', ao: 0 });
  B.add(GEO.box, '#3a3e43', x + ax * 1.9, 6.68, z + az * 1.9, Math.abs(ax) * 0.7 + 0.3, 0.16, Math.abs(az) * 0.7 + 0.3, 0, { mat: 'metal', ao: 0 });
  W.bulbPositions.push([x + ax * 1.9, 6.56, z + az * 1.9]);
  W.lampPools.push([x + ax * 1.9, z + az * 1.9]);
  addBox(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 7);
}

function bench(x, z, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  let p = at(0, 0); B.box('#9c6b3e', p[0], 0.45, p[1], 1.8, 0.08, 0.5, ry);
  p = at(0, -0.25); B.box('#9c6b3e', p[0], 0.55, p[1], 1.8, 0.45, 0.08, ry);
  for (const lx of [-0.75, 0.75]) { p = at(lx, 0); B.box('#3d3f42', p[0], 0, p[1], 0.08, 0.45, 0.5, ry, { mat: 'metal' }); }
  addBox(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 0.6);
}

export const CAR_COLORS = ['#b0302a', '#2c5f9e', '#e8e8e4', '#2e6b4a', '#d9b43a', '#5e3a7a', '#2a3440', '#c86a2a', '#8a9096', '#1c1c1e'];
export function carParts(add, color, x, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * s + lz * c, z + lx * c - lz * s];
  let p = at(0, 0);
  add('box', color, p[0], 0.72, p[1], 4.3, 0.62, 1.88);
  p = at(0.12, 0); add('box', color, p[0], 0.46, p[1], 4.4, 0.24, 1.92);
  p = at(-0.35, 0); add('box', color, p[0], 1.3, p[1], 2.3, 0.55, 1.72);
  p = at(-0.35, 0); add('glass', '#1d2a33', p[0], 1.32, p[1], 2.36, 0.44, 1.76);
  p = at(1.6, 0); add('box', color, p[0], 1.05, p[1], 1.0, 0.06, 1.84);
  for (const [lx, lz] of [[1.35, 0.9], [-1.35, 0.9], [1.35, -0.9], [-1.35, -0.9]]) {
    p = at(lx, lz); add('wheel', '#161616', p[0], 0.36, p[1], 0.72, 0.28, 0.72);
    p = at(lx, lz * 1.03); add('wheel', '#b8bcc0', p[0], 0.36, p[1], 0.36, 0.3, 0.36);
  }
  for (const lz of [0.62, -0.62]) {
    p = at(2.16, lz); add('light', '#fff3c8', p[0], 0.8, p[1], 0.05, 0.16, 0.38);
    p = at(-2.16, lz); add('light', '#d0202a', p[0], 0.85, p[1], 0.05, 0.14, 0.36);
  }
  p = at(2.2, 0); add('box', '#2a2a2a', p[0], 0.5, p[1], 0.08, 0.18, 1.86);
  p = at(-2.2, 0); add('box', '#2a2a2a', p[0], 0.5, p[1], 0.08, 0.18, 1.86);
}

function carAdd(kind, col, px, py, pz, sx, sy, sz, ry) {
  if (kind === 'wheel') B.add(GEO.cyl12, col, px, py, pz, sx, sy, sz, ry, { rz: Math.PI / 2, mat: 'metal', ao: 0 });
  else B.add(GEO.box, col, px, py, pz, sx, sy, sz, ry - Math.PI / 2, { mat: kind === 'glass' ? 'glass' : kind === 'light' ? 'glow' : 'metal', ao: 0.15, aoH: 0.8 });
}

let parkedN = 0;
function parkedCar(x, z, ry, color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)], model) {
  if (vehiclesReady()) {
    const car = makeCar(model || CAR_MODELS[parkedN++ % CAR_MODELS.length], color);
    car.position.set(x, 0, z);
    car.rotation.y = ry;
    car.updateMatrixWorld(true);
    car.matrixAutoUpdate = false;
    scene.add(car);
  } else carParts((k, c, a, b, d, e, f, g) => carAdd(k, c, a, b, d, e, f, g, ry), color, x, z, ry);
  const alongX = Math.abs(Math.sin(ry)) > 0.5;
  if (alongX) addBox(x - 2.2, x + 2.2, z - 1, z + 1, 1.6); else addBox(x - 1, x + 1, z - 2.2, z + 2.2, 1.6);
}

// Furgoneta blanca de reparto (con las puertas traseras abiertas y cajas dentro).
function van(x, z, ry, { open = true, color = '#eceeed' } = {}) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * s + lz * c, z + lx * c - lz * s];
  const add = (kind, col, lx, y, lz, len, h, wid) => {
    const p = at(lx, lz);
    carAdd(kind, col, p[0], y, p[1], len, h, wid, ry);
  };
  add('box', color, -0.35, 1.45, 0, 4.0, 2.0, 2.05);           // caja de carga
  add('box', color, 1.95, 1.05, 0, 1.0, 1.2, 2.0);             // morro
  add('box', color, 1.55, 2.0, 0, 0.6, 0.9, 1.96);
  add('glass', '#1b2630', 1.9, 1.95, 0, 0.55, 0.62, 1.9);       // parabrisas
  add('glass', '#1b2630', 1.5, 2.0, 0, 0.4, 0.5, 2.07);         // ventanillas
  add('box', '#2c2c2c', 2.47, 0.62, 0, 0.12, 0.3, 2.0);         // parachoques
  add('box', '#2c2c2c', -2.37, 0.55, 0, 0.12, 0.25, 2.05);
  add('box', '#bfc4c8', 0, 0.42, 0, 4.9, 0.08, 2.0);
  for (const lz of [0.7, -0.7]) { add('light', '#fff3c8', 2.47, 1.0, lz, 0.04, 0.18, 0.32); add('light', '#c81e28', -2.36, 1.2, lz * 1.25, 0.04, 0.5, 0.14); }
  for (const [lx, lz] of [[1.6, 0.95], [-1.5, 0.95], [1.6, -0.95], [-1.5, -0.95]]) {
    add('wheel', '#161616', lx, 0.38, lz, 0.76, 0.3, 0.76);
    add('wheel', '#9ea4aa', lx, 0.38, lz * 1.03, 0.38, 0.3, 0.38);
  }
  if (open) {
    // interior oscuro y puertas abiertas
    add('box', '#3a3a3a', -2.36, 1.45, 0, 0.04, 1.8, 1.85);
    add('box', '#dcdfe0', -2.6, 1.45, 1.0, 0.5, 1.9, 0.05);
    add('box', '#dcdfe0', -2.6, 1.45, -1.0, 0.5, 1.9, 0.05);
    for (const [lx, lz, sz] of [[-1.9, 0.45, 0.6], [-1.9, -0.4, 0.55], [-1.3, 0.1, 0.6], [-1.9, 0.0, 0.5]]) {
      const p = at(lx, lz);
      W.boxes.push({ x: p[0], y: 0.5 + (lx === -1.9 && lz === 0 ? 0.6 : 0), z: p[1], w: sz, h: sz * 0.8, d: sz, ry: ry + rnd(-0.2, 0.2) });
    }
  }
  const alongX = Math.abs(Math.sin(ry)) > 0.5;
  if (alongX) addBox(x - 2.6, x + 2.6, z - 1.1, z + 1.1, 2.6); else addBox(x - 1.1, x + 1.1, z - 2.6, z + 2.6, 2.6);
}

function asphalt(x0, x1, z0, z1, color = '#45484d') {
  B.box(color, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.03, z1 - z0, 0, { shadow: false, ao: 0 });
}
function paving(x0, x1, z0, z1, color = '#c9c2b4', mat = null, tile = 2.5) {
  B.box(color, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0, 0, { shadow: false, ao: 0, mat: mat || TM.slab, uvScale: [(x1 - x0) / tile, (z1 - z0) / tile] });
}

// Cajas de cartón (todas en un solo InstancedMesh con textura).
function cardBox(x, y, z, w = 0.6, h = 0.45, d = 0.5, ry = 0, collide = false) {
  W.boxes.push({ x, y, z, w, h, d, ry });
  if (collide) addBox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, y + h);
}

function pallet(x, z, ry = 0, stack = 0) {
  const along = Math.abs(Math.sin(ry)) > 0.5;
  const w = along ? 1.0 : 1.2, d = along ? 1.2 : 1.0;
  for (let i = -1; i <= 1; i++) B.box('#a07c50', x + (along ? 0 : i * 0.5), 0, z + (along ? i * 0.5 : 0), along ? 1.0 : 0.12, 0.1, along ? 0.12 : 1.0, 0, { jitter: 0.08 });
  for (let i = -2; i <= 2; i++) B.box('#b48c5a', x + (along ? i * 0.24 : 0), 0.1, z + (along ? 0 : i * 0.24), along ? 0.18 : w, 0.04, along ? d : 0.18, 0, { jitter: 0.1 });
  let top = 0.14;
  for (let k = 0; k < stack; k++) {
    for (const [ox, oz] of [[-0.28, -0.24], [0.28, -0.24], [-0.28, 0.24], [0.28, 0.24]]) {
      if (k === stack - 1 && Math.random() < 0.25) continue;
      cardBox(x + ox, top, z + oz, 0.54, 0.42, 0.46, rnd(-0.06, 0.06));
    }
    top += 0.42;
  }
  addBox(x - w / 2, x + w / 2, z - d / 2, z + d / 2, Math.max(0.3, top));
}

function palletJack(x, z, ry, color = '#e8b923') {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * s + lz * c, z + lx * c - lz * s];
  for (const lz of [-0.28, 0.28]) { const p = at(0.2, lz); B.add(GEO.box, color, p[0], 0.06, p[1], 1.15, 0.08, 0.16, ry - Math.PI / 2, { mat: 'metal', ao: 0 }); }
  let p = at(-0.45, 0); B.add(GEO.box, color, p[0], 0.25, p[1], 0.3, 0.35, 0.7, ry - Math.PI / 2, { mat: 'metal' });
  p = at(-0.6, 0); B.add(GEO.cyl8, '#222', p[0], 0.75, p[1], 0.07, 1.1, 0.07, ry, { rx: 0.25, mat: 'metal', ao: 0 });
  p = at(-0.75, 0); B.add(GEO.box, '#222', p[0], 1.28, p[1], 0.06, 0.06, 0.45, ry - Math.PI / 2, { mat: 'metal', ao: 0 });
  p = at(-0.5, 0); B.add(GEO.cyl12, '#1a1a1a', p[0], 0.1, p[1], 0.2, 0.12, 0.2, ry, { rz: Math.PI / 2, ao: 0 });
  addBox(x - 0.6, x + 0.6, z - 0.6, z + 0.6, 0.5);
}

function forklift(x, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * s + lz * c, z + lx * c - lz * s];
  const bx = (col, lx, y, lz, len, h, wid, mat = 'metal') => { const p = at(lx, lz); B.add(GEO.box, col, p[0], y, p[1], len, h, wid, ry - Math.PI / 2, { mat, ao: 0.15 }); };
  bx('#e8b923', 0, 0.75, 0, 1.8, 0.8, 1.15);
  bx('#3a3a3a', -0.75, 0.95, 0, 0.5, 0.75, 1.05);
  bx('#2b2b2b', -0.1, 1.35, 0, 0.5, 0.4, 0.5);
  for (const lz of [-0.5, 0.5]) for (const lx of [0.45, -0.4]) bx('#3a3a3a', lx, 1.9, lz, 0.06, 1.4, 0.06);
  bx('#3a3a3a', 0.0, 2.6, 0, 1.0, 0.06, 1.1);
  for (const lz of [-0.35, 0.35]) bx('#4a4a4a', 1.0, 1.6, lz, 0.1, 2.9, 0.1);
  bx('#4a4a4a', 1.05, 0.5, 0, 0.08, 0.6, 0.85);
  for (const lz of [-0.25, 0.25]) bx('#555', 1.6, 0.09, lz, 1.1, 0.06, 0.13);
  for (const [lx, lz] of [[0.55, 0.55], [0.55, -0.55], [-0.6, 0.55], [-0.6, -0.55]]) { const p = at(lx, lz); B.add(GEO.cyl12, '#161616', p[0], 0.3, p[1], 0.6, 0.25, 0.6, ry, { rz: Math.PI / 2, ao: 0 }); }
  addBox(x - 1.3, x + 1.3, z - 1.3, z + 1.3, 2.7);
}

// Estantería metálica con largueros naranjas y carga variada.
function shelving(x, z, len, axis = 'x', { depth = 0.9, height = 3.0, levels = 4, fill = 0.8, collide = true } = {}) {
  const ax = axis === 'x';
  const W_ = ax ? len : depth, D_ = ax ? depth : len;
  const up = '#2f4a6b', beam = '#e06a2b';
  const n = Math.max(2, Math.round(len / 1.4) + 1);
  for (let i = 0; i < n; i++) {
    const t = -len / 2 + (i * len) / (n - 1);
    for (const sd of [-1, 1]) {
      const px = x + (ax ? t : sd * (depth / 2 - 0.04)), pz = z + (ax ? sd * (depth / 2 - 0.04) : t);
      B.box(up, px, 0, pz, 0.08, height, 0.08, 0, { mat: 'metal' });
    }
  }
  for (let l = 0; l < levels; l++) {
    const y = 0.15 + (l * (height - 0.3)) / (levels - 1);
    for (const sd of [-1, 1]) B.box(beam, x + (ax ? 0 : sd * (depth / 2 - 0.04)), y, z + (ax ? sd * (depth / 2 - 0.04) : 0), ax ? len : 0.07, 0.11, ax ? 0.07 : len, 0, { mat: 'metal', ao: 0 });
    B.box('#8d7552', x, y + 0.1, z, W_ - 0.05, 0.03, D_ - 0.05, 0, { ao: 0, jitter: 0.04 });
    if (l === levels - 1) continue;
    // carga
    const gap = (height - 0.3) / (levels - 1) - 0.15;
    let t = -len / 2 + 0.1;
    while (t < len / 2 - 0.35) {
      const kind = Math.random();
      const sz = rnd(0.35, 0.6);
      const px = x + (ax ? t + sz / 2 : 0), pz = z + (ax ? 0 : t + sz / 2);
      if (Math.random() < fill) {
        if (kind < 0.6) cardBox(px, y + 0.13, pz, ax ? sz : depth * 0.75, Math.min(gap, rnd(0.3, 0.55)), ax ? depth * 0.75 : sz, rnd(-0.05, 0.05));
        else if (kind < 0.75) {
          const col = ['#e9e9e4', '#3d8b3d', '#2e7fbf'][Math.floor(Math.random() * 3)];
          B.box(col, px, y + 0.13, pz, 0.28, 0.42, 0.18, 0, { ao: 0.1, aoH: 0.3 });
          B.box(col, px, y + 0.55, pz + 0.04, 0.08, 0.08, 0.08, 0, { ao: 0 });
        } else if (kind < 0.9) {
          const col = ['#3b6fb6', '#2a2a2a', '#c0392b', '#e9e9e4'][Math.floor(Math.random() * 4)];
          B.box(col, px, y + 0.13, pz, ax ? sz : depth * 0.7, Math.min(gap, 0.3), ax ? depth * 0.7 : sz, 0, { ao: 0.1, aoH: 0.3 });
        } else {
          B.add(GEO.cyl12, '#b5602a', px, y + 0.25, pz, 0.3, 0.24, 0.3, 0, { ao: 0 });
          B.add(GEO.ico1, '#4f8f35', px, y + 0.5, pz, 0.45, 0.4, 0.45, Math.random() * 3, { mat: 'foliage', ao: 0, jitter: 0.1 });
        }
      }
      t += sz + 0.08;
    }
  }
  if (collide) addBox(x - W_ / 2, x + W_ / 2, z - D_ / 2, z + D_ / 2, height);
}

function dumpster(x, z, ry = 0, color = '#2e6b4a') {
  const along = Math.abs(Math.sin(ry)) > 0.5;
  const w = along ? 1.4 : 2.1, d = along ? 2.1 : 1.4;
  B.box(color, x, 0.18, z, w, 1.2, d, 0, { mat: 'metal' });
  B.box('#1f4a33', x, 1.38, z, w + 0.06, 0.08, d + 0.06, 0, { mat: 'metal', ao: 0 });
  B.box('#24543a', x, 1.4, z + (along ? 0 : -0.2), w * 0.98, 0.06, d * 0.6, 0, { mat: 'metal', ao: 0, rx: -0.15 });
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) B.add(GEO.cyl8, '#1a1a1a', x + sx * (w / 2 - 0.2), 0.09, z + sz * (d / 2 - 0.2), 0.18, 0.18, 0.18, 0, { rz: Math.PI / 2, ao: 0 });
  addBox(x - w / 2 - 0.05, x + w / 2 + 0.05, z - d / 2 - 0.05, z + d / 2 + 0.05, 1.5);
}

function fenceLine(x0, z0, x1, z1, color = '#8a6a4a') {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 2.5);
  const ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) B.box(color, x0 + ((x1 - x0) * i) / n, 0, z0 + ((z1 - z0) * i) / n, 0.15, 1.3, 0.15);
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  B.box(color, cx, 0.45, cz, 0.08, 0.12, len, ry, { ao: 0 });
  B.box(color, cx, 1.0, cz, 0.08, 0.12, len, ry, { ao: 0 });
  const t = 0.15;
  addBox(Math.min(x0, x1) - t, Math.max(x0, x1) + t, Math.min(z0, z1) - t, Math.max(z0, z1) + t, 1.4);
}

// Valla metálica de rombos.
function chainFence(x0, z0, x1, z1, h = 2.2) {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(len / 3));
  const ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) B.add(GEO.cyl8, '#9aa1a8', x0 + ((x1 - x0) * i) / n, h / 2, z0 + ((z1 - z0) * i) / n, 0.08, h, 0.08, 0, { mat: 'metal', ao: 0 });
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  B.add(GEO.cyl8, '#9aa1a8', cx, h, cz, 0.06, len, 0.06, ry, { rx: Math.PI / 2, mat: 'metal', ao: 0 });
  B.add(GEO.box, '#c7ccd1', cx, h / 2, cz, 0.02, h, len, ry, { mat: TM.chain, uvScale: [len / 0.18, h / 0.18], ao: 0.2, aoH: 1 });
  const t = 0.1;
  addBox(Math.min(x0, x1) - t, Math.max(x0, x1) + t, Math.min(z0, z1) - t, Math.max(z0, z1) + t, h);
}

// Postes de luz de madera con cables combados entre ellos.
const wirePts = [];
function utilityPoles(points) {
  let prev = null;
  for (const [x, z, ry] of points) {
    B.add(GEO.cyl8, '#5d4630', x, 4.6, z, 0.28, 9.2, 0.28, 0, { ao: 0.2, aoH: 2 });
    B.box('#4b3826', x, 8.3, z, Math.abs(Math.cos(ry)) * 2.2 + 0.14, 0.14, Math.abs(Math.sin(ry)) * 2.2 + 0.14);
    const tops = [-0.95, 0, 0.95].map((o) => [x + Math.cos(ry) * o, 8.5, z + Math.sin(ry) * o]);
    for (const tp of tops) B.add(GEO.cyl8, '#d9d4c7', tp[0], tp[1] - 0.05, tp[2], 0.08, 0.16, 0.08, 0, { ao: 0 });
    B.add(GEO.cyl12, '#6f7479', x + 0.3, 7.4, z + 0.3, 0.5, 0.8, 0.5, 0, { mat: 'metal', ao: 0 });
    if (prev) {
      for (let k = 0; k < 3; k++) {
        const a = prev[k], b = tops[k];
        const N = 10;
        for (let i = 0; i < N; i++) {
          const t0 = i / N, t1 = (i + 1) / N;
          const sag = (t) => -Math.sin(Math.PI * t) * 0.9;
          wirePts.push(a[0] + (b[0] - a[0]) * t0, a[1] + (b[1] - a[1]) * t0 + sag(t0), a[2] + (b[2] - a[2]) * t0);
          wirePts.push(a[0] + (b[0] - a[0]) * t1, a[1] + (b[1] - a[1]) * t1 + sag(t1), a[2] + (b[2] - a[2]) * t1);
        }
      }
    }
    prev = tops;
    addBox(x - 0.16, x + 0.16, z - 0.16, z + 0.16, 9);
  }
}

// Puerta con bisagra. axis 'x': la puerta está en un muro paralelo a X.
function makeDoor({ x, z, axis, width = 1.3, h = 2.2, color = '#7a4e2d', locked = null, flip = 1 }) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, z);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? width : 0.08, h, axis === 'x' ? 0.08 : width), plainMat(color, { roughness: 0.6 }));
  leaf.position.set(axis === 'x' ? width / 2 : 0, h / 2, axis === 'x' ? 0 : width / 2);
  leaf.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), plainMat('#d8b45a', { metalness: 0.8, roughness: 0.3 }));
  knob.position.set(axis === 'x' ? width - 0.15 : 0.07, 1.0, axis === 'x' ? 0.07 : width - 0.15);
  const knob2 = knob.clone();
  knob2.position.set(axis === 'x' ? width - 0.15 : -0.07, 1.0, axis === 'x' ? -0.07 : width - 0.15);
  pivot.add(leaf, knob, knob2);
  scene.add(pivot);
  const col = axis === 'x' ? addBox(x, x + width, z - 0.06, z + 0.06, h + 1) : addBox(x - 0.06, x + 0.06, z, z + width, h + 1);
  const door = { pivot, col, open: false, ang: 0, flip, locked };
  const ia = {
    actions: () => {
      if (door.locked && door.locked()) return [{ label: 'Cerrada con llave', fn: () => G.act.toast?.('Está cerrada con llave.') }];
      return [{ label: door.open ? 'Cerrar puerta' : 'Abrir puerta', fn: () => toggleDoor(door) }];
    },
  };
  door.hit = axis === 'x' ? hitbox(x + width / 2, h / 2, z, width, h, 0.25, ia) : hitbox(x, h / 2, z + width / 2, 0.25, h, width, ia);
  W.doors.push(door);
  return door;
}

function toggleDoor(door) {
  door.open = !door.open;
  door.col.on = !door.open;
  G.act.sfx?.('door');
}

// Persiana enrollable de la nave (ancho w, en un muro paralelo a X).
function makeShutter(x0, x1, z, h) {
  const w = x1 - x0;
  const geo = new THREE.BoxGeometry(w, h, 0.08);
  const tex = TM.shutter.map.clone();
  tex.needsUpdate = true;
  tex.repeat.set(w / 2, h / 0.9);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.5, metalness: 0.45, color: 0xc8cdd2 }));
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.position.set((x0 + x1) / 2, h / 2, z);
  scene.add(mesh);
  // rodillo
  B.add(GEO.cyl12, '#6f7a86', (x0 + x1) / 2, h + 0.35, z + 0.25, 0.7, w + 0.3, 0.7, 0, { rz: Math.PI / 2, mat: 'metal', ao: 0 });
  const col = addBox(x0, x1, z - 0.1, z + 0.1, h + 2);
  const sh = { mesh, col, open: true, t: 1, h };
  const ia = {
    actions: () => [{ label: sh.open ? 'Bajar persiana' : 'Subir persiana', fn: () => { sh.open = !sh.open; G.act.sfx?.('door'); } }],
    enabled: () => !sh.open || true,
  };
  sh.hit = hitbox((x0 + x1) / 2, 0.9, z, w, 1.8, 0.4, ia);
  W.shutters.push(sh);
  return sh;
}

function update(dt) {
  for (const d of W.doors) {
    const target = d.open ? (Math.PI / 2) * 0.95 * d.flip : 0;
    d.ang += (target - d.ang) * Math.min(1, dt * 8);
    d.pivot.rotation.y = d.ang;
  }
  for (const s of W.shutters) {
    s.t += ((s.open ? 1 : 0) - s.t) * Math.min(1, dt * 3);
    const k = Math.max(0.03, 1 - s.t);
    s.mesh.scale.y = k;
    s.mesh.position.y = s.h - (s.h * k) / 2;
    s.col.on = s.t < 0.7;
    s.hit.position.y = s.open ? s.h - 0.6 : 0.9;
    s.hit.updateMatrixWorld();
  }
  // puertas automáticas de las tiendas: se abren si estás cerca y está abierto
  for (const d of W.autoDoors || []) {
    const p = G.player?.pos;
    const near = p && Math.hypot(p.x - d.x, p.z - d.z) < 3.4 && d.open();
    const before = d.k;
    d.k += ((near ? 1 : 0) - d.k) * Math.min(1, dt * 5);
    for (const { leaf, side } of d.leaves) leaf.position.z = d.z + side * (0.55 + d.k * 0.95);
    d.col.on = d.k < 0.6;
    if (before < 0.05 && d.k >= 0.05) G.act.sfx?.('door');
  }
  if (W.water) W.water.position.y = -0.35 + Math.sin(G.time * 0.6) * 0.04;
  updateTrafficLights();
}

// Habitación hueca (bungalow).
function room(o) {
  const { x0, x1, z0, z1, h = 3, wall, inner = '#efe6d2', floorTex, front, doorAt, ceiling = '#f4f1ea' } = o;
  const t = 0.2, dw = 1.3;
  const wallSeg = (ax0, ax1, az0, az1) => {
    B.box(wall, (ax0 + ax1) / 2, 0, (az0 + az1) / 2, ax1 - ax0, h, az1 - az0, 0, { mat: TM.stucco, uvScale: [1, 1] });
    addBox(ax0, ax1, az0, az1, h + 1);
  };
  let door;
  const sides = {
    '-x': [x0 - t, x0, z0, z1], '+x': [x1, x1 + t, z0, z1],
    '-z': [x0 - t, x1 + t, z0 - t, z0], '+z': [x0 - t, x1 + t, z1, z1 + t],
  };
  for (const [side, [a0, a1, b0, b1]] of Object.entries(sides)) {
    if (side !== front) { wallSeg(a0, a1, b0, b1); continue; }
    const d0 = doorAt - dw / 2, d1 = doorAt + dw / 2;
    if (side === '+x' || side === '-x') {
      wallSeg(a0, a1, b0, d0); wallSeg(a0, a1, d1, b1);
      B.box(wall, (a0 + a1) / 2, 2.2, doorAt, a1 - a0, h - 2.2, dw);
      door = makeDoor({ x: (a0 + a1) / 2, z: d0, axis: 'z', width: dw, color: o.doorColor, locked: o.locked, flip: side === '+x' ? -1 : 1 });
    } else {
      wallSeg(a0, d0, b0, b1); wallSeg(d1, a1, b0, b1);
      B.box(wall, doorAt, 2.2, (b0 + b1) / 2, dw, h - 2.2, b1 - b0);
      door = makeDoor({ x: d0, z: (b0 + b1) / 2, axis: 'x', width: dw, color: o.doorColor, locked: o.locked, flip: side === '+z' ? -1 : 1 });
    }
  }
  const it = 0.04;
  B.box(inner, x0 + it / 2, 0, (z0 + z1) / 2, it, h - 0.05, z1 - z0, 0, { shadow: false });
  B.box(inner, x1 - it / 2, 0, (z0 + z1) / 2, it, h - 0.05, z1 - z0, 0, { shadow: false });
  B.box(inner, (x0 + x1) / 2, 0, z0 + it / 2, x1 - x0, h - 0.05, it, 0, { shadow: false });
  B.box(inner, (x0 + x1) / 2, 0, z1 - it / 2, x1 - x0, h - 0.05, it, 0, { shadow: false });
  B.box(ceiling, (x0 + x1) / 2, h - 0.05, (z0 + z1) / 2, x1 - x0 + 0.4, 0.06, z1 - z0 + 0.4, 0, { shadow: false, ao: 0 });
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshStandardMaterial({ map: floorTex, roughness: 0.7 }));
  floorTex.repeat.set((x1 - x0) / 2, (z1 - z0) / 2);
  fl.rotation.x = -Math.PI / 2;
  fl.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2);
  fl.receiveShadow = true;
  scene.add(fl);
  fl.userData.prop = o.id;
  W.floors.push(fl);
  B.add(GEO.cyl12, '#fff7d6', (x0 + x1) / 2, h - 0.15, (z0 + z1) / 2, 0.6, 0.1, 0.6, 0, { mat: 'glow' });
  const light = new THREE.PointLight(0xffe2b0, 14, 12, 1.6);
  light.position.set((x0 + x1) / 2, h - 0.4, (z0 + z1) / 2);
  scene.add(light);
  W.lights.push(light);
  return door;
}

// ------------------------------------------------------------------
//  Suelo, carreteras y aceras
// ------------------------------------------------------------------
function buildGround() {
  const gt = TX.groundTex('#7d9a4c', 3);
  gt.repeat.set(90, 61);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 406), new THREE.MeshStandardMaterial({ map: gt, roughness: 1 }));
  g.rotation.x = -Math.PI / 2;
  g.position.z = -97;
  g.receiveShadow = true;
  scene.add(g);
  addBox(-LIMIT - 3, -LIMIT, -LIMIT, 130, 10);
  addBox(LIMIT, LIMIT + 3, -LIMIT, 130, 10);
  addBox(-LIMIT, LIMIT, -LIMIT - 3, -LIMIT, 10);
}

function buildRoads() {
  const rt = TX.roadTex();
  rt.repeat.set(1, (LIMIT * 2) / 12);
  const rmat = new THREE.MeshStandardMaterial({ map: rt, roughness: 0.95 });
  const len = LIMIT * 2;
  for (const r of ROADS) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, len), rmat);
    a.rotation.x = -Math.PI / 2;
    a.position.set(r, 0.02, 0);
    a.receiveShadow = true;
    scene.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, len), rmat);
    b.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    b.position.set(0, 0.021, r);
    b.receiveShadow = true;
    scene.add(b);
  }
  for (const rx of ROADS) for (const rz of ROADS) {
    B.box('#3c3f44', rx, 0.0, rz, RH * 2, 0.04, RH * 2, 0, { shadow: false, ao: 0 });
    for (let i = -3; i <= 3; i++) {
      B.box('#e4e2da', rx + i * 1.05, 0, rz + RH + 1.0, 0.55, 0.045, 1.6, 0, { shadow: false, ao: 0 });
      B.box('#e4e2da', rx + i * 1.05, 0, rz - RH - 1.0, 0.55, 0.045, 1.6, 0, { shadow: false, ao: 0 });
      B.box('#e4e2da', rx + RH + 1.0, 0, rz + i * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false, ao: 0 });
      B.box('#e4e2da', rx - RH - 1.0, 0, rz + i * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false, ao: 0 });
    }
  }
  const edges = [-LIMIT, ...ROADS, LIMIT];
  for (const r of ROADS) {
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i] + (edges[i] === -LIMIT ? 0 : RH), b = edges[i + 1] - (edges[i + 1] === LIMIT ? 0 : RH);
      if (b - a < 0.5) continue;
      for (const s of [-1, 1]) {
        const c = r + s * (RH + 1.25);
        B.box('#d2ccc1', (a + b) / 2, 0, c, b - a, 0.14, 2.5, 0, { shadow: false, ao: 0, mat: TM.slab, uvScale: [(b - a) / 2.5, 1] });
        B.box('#d2ccc1', c, 0, (a + b) / 2, 2.5, 0.14, b - a, 0, { shadow: false, ao: 0, mat: TM.slab, uvScale: [1, (b - a) / 2.5] });
        B.box('#9a958c', (a + b) / 2, 0, r + s * (RH + 0.06), b - a, 0.16, 0.14, 0, { shadow: false, ao: 0 });
        B.box('#9a958c', r + s * (RH + 0.06), 0, (a + b) / 2, 0.14, 0.16, b - a, 0, { shadow: false, ao: 0 });
      }
    }
  }
  for (const r of ROADS) {
    W.mapRects.push({ x0: r - RH, x1: r + RH, z0: -LIMIT, z1: LIMIT + 8, c: '#3b3f45', road: true });
    W.mapRects.push({ x0: -LIMIT, x1: LIMIT, z0: r - RH, z1: r + RH, c: '#3b3f45', road: true });
  }
}

function buildNav() {
  const N = W.nav, id = {};
  const key = (i, j, sx, sz) => `${i},${j},${sx},${sz}`;
  ROADS.forEach((rx, i) => ROADS.forEach((rz, j) => {
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) id[key(i, j, sx, sz)] = N.add(rx + sx * SWC, rz + sz * SWC);
  }));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 4; j++) {
    for (const s of [-1, 1]) {
      if (i < 3) N.link(id[key(i, j, 1, s)], id[key(i + 1, j, -1, s)]);
      if (j < 3) N.link(id[key(i, j, s, 1)], id[key(i, j + 1, s, -1)]);
      N.link(id[key(i, j, -1, s)], id[key(i, j, 1, s)]);
      N.link(id[key(i, j, s, -1)], id[key(i, j, s, 1)]);
    }
  }
}

// ------------------------------------------------------------------
//  LA NAVE (tu base inicial)
// ------------------------------------------------------------------
export const NAVE = { x0: -80, x1: -60, z0: -64, z1: -46, h: 6.5, dx0: -68.5, dx1: -63.5, dh: 4.4 };

function buildNave() {
  const { x0, x1, z0, z1, h, dx0, dx1, dh } = NAVE;
  const t = 0.3, wallC = '#cfc6b6';
  const wall = (a0, a1, b0, b1, y0 = 0, hh = h) => {
    B.box(wallC, (a0 + a1) / 2, y0, (b0 + b1) / 2, a1 - a0, hh, b1 - b0, 0, { mat: TM.stucco, uvScale: [Math.max(1, (a1 - a0) / 3), hh / 3], ao: y0 ? 0 : 0.3 });
    if (!y0) addBox(a0, a1, b0, b1, 9);
  };
  wall(x0 - t, x1 + t, z0 - t, z0);         // fondo
  wall(x0 - t, x0, z0, z1);                 // izquierda
  wall(x1, x1 + t, z0, z1);                 // derecha
  wall(x0 - t, dx0, z1, z1 + t);            // frente izq.
  wall(dx1, x1 + t, z1, z1 + t);            // frente der.
  wall(dx0, dx1, z1, z1 + t, dh, h - dh);   // dintel
  // franja de color en la fachada + marco de la puerta
  B.box('#3d5a73', (x0 + x1) / 2, h - 0.9, z1 + t + 0.02, x1 - x0 + 0.6, 0.5, 0.04, 0, { ao: 0 });
  for (const xx of [dx0 - 0.12, dx1 + 0.12]) B.box('#e8b923', xx, 0, z1 + t + 0.03, 0.18, dh, 0.06, 0, { mat: 'metal', ao: 0 });
  // cubierta
  B.box('#55595f', (x0 + x1) / 2, h, (z0 + z1) / 2, x1 - x0 + 1.2, 0.35, z1 - z0 + 1.2, 0, { ao: 0 });
  B.box('#3b3f44', (x0 + x1) / 2, h - 0.02, (z0 + z1) / 2, x1 - x0, 0.04, z1 - z0, 0, { ao: 0, shadow: false });
  // cerchas y correas metálicas
  for (let z = z0 + 2; z < z1; z += 3) {
    B.box('#3d434b', (x0 + x1) / 2, h - 0.55, z, x1 - x0, 0.14, 0.14, 0, { mat: 'metal', ao: 0, shadow: false });
    for (let x = x0 + 1; x < x1; x += 2) B.add(GEO.box, '#3d434b', x, h - 0.33, z, 0.06, 0.5, 0.06, 0, { rz: (x % 4 ? 0.7 : -0.7), mat: 'metal', ao: 0, shadow: false });
  }
  for (const x of [x0 + 4, x0 + 10, x0 + 16]) B.box('#4a5058', x, h - 0.25, (z0 + z1) / 2, 0.12, 0.12, z1 - z0, 0, { mat: 'metal', ao: 0, shadow: false });
  // fluorescentes
  for (const x of [x0 + 4.5, x0 + 10, x0 + 15.5]) for (const z of [z0 + 3.5, z0 + 9, z0 + 14.5]) {
    B.box('#2d3238', x, h - 0.85, z, 1.7, 0.08, 0.26, 0, { mat: 'metal', ao: 0, shadow: false });
    B.box('#fff6e6', x, h - 0.9, z, 1.6, 0.05, 0.16, 0, { mat: 'glow' });
  }
  // ventanas altas en el fondo y la izquierda
  for (let x = x0 + 2; x < x1 - 1; x += 3.2) B.box('#a9c7d8', x + 1.2, 3.9, z0 + 0.02, 2.4, 1.2, 0.04, 0, { mat: 'glass', ao: 0, shadow: false });
  for (let z = z0 + 2; z < z1 - 2; z += 3.4) B.box('#a9c7d8', x0 + 0.02, 3.9, z + 1.4, 0.04, 1.2, 2.4, 0, { mat: 'glass', ao: 0, shadow: false });
  for (let x = x0 + 2; x < x1 - 1; x += 3.2) B.box('#7e9cad', x + 1.2, 3.9, z0 - t - 0.02, 2.4, 1.2, 0.04, 0, { mat: 'glass', ao: 0, shadow: false });

  // suelo de hormigón
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), TM.concrete.clone());
  fl.material.vertexColors = false;
  fl.material.map = TM.concrete.map.clone();
  fl.material.map.needsUpdate = true;
  fl.material.map.repeat.set((x1 - x0) / 8, (z1 - z0) / 8);
  fl.material.roughness = 0.55;
  fl.rotation.x = -Math.PI / 2;
  fl.position.set((x0 + x1) / 2, 0.025, (z0 + z1) / 2);
  fl.receiveShadow = true;
  fl.userData.prop = 'nave';
  scene.add(fl);
  W.floors.push(fl);
  // líneas de seguridad amarillas y negras
  const hz = TX.hazardTex();
  const stripe = (cx, cz, w, d, rot = 0) => {
    const tex = hz.clone(); tex.needsUpdate = true; tex.repeat.set(Math.max(w, d) / 0.5, 1);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(Math.max(w, d), Math.min(w, d)), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }));
    m.rotation.set(-Math.PI / 2, 0, w >= d ? 0 : Math.PI / 2);
    m.position.set(cx, 0.03, cz);
    m.receiveShadow = true;
    scene.add(m);
  };
  stripe((dx0 + dx1) / 2, z1 - 0.3, dx1 - dx0 + 0.4, 0.16);
  stripe(dx0 - 0.2, z1 - 4, 0.12, 7.4);
  stripe(dx1 + 0.2, z1 - 4, 0.12, 7.4);

  // persiana enrollable (abierta)
  const shutter = makeShutter(dx0, dx1, z1 + 0.15, dh);

  // --- mobiliario ---
  // estanterías izquierda y derecha
  shelving(x0 + 0.55, z0 + 2.2, 3.4, 'z', { height: 3.2 });
  shelving(x0 + 0.55, z0 + 5.9, 3.4, 'z', { height: 3.2 });
  shelving(x0 + 0.55, z0 + 9.6, 3.4, 'z', { height: 3.2, fill: 0.6 });
  shelving(x1 - 0.55, z0 + 2.2, 3.4, 'z', { height: 3.2 });
  shelving(x1 - 0.55, z0 + 5.9, 3.4, 'z', { height: 3.2, fill: 0.7 });
  // banco de trabajo con tablero de herramientas
  const wbx = x0 + 6.2, wbz = z0 + 0.5;
  B.box('#7b6a55', wbx, 0.88, wbz, 3.4, 0.08, 0.9, 0, { ao: 0 });
  B.box('#c8c2b6', wbx, 0.94, wbz, 3.3, 0.02, 0.82, 0, { ao: 0, shadow: false });
  for (const sx of [-1.6, 1.6]) for (const sz of [-0.38, 0.38]) B.box('#2f3a45', wbx + sx, 0, wbz + sz, 0.08, 0.88, 0.08, 0, { mat: 'metal' });
  B.box('#2f3a45', wbx, 0.25, wbz, 3.2, 0.05, 0.8, 0, { mat: 'metal' });
  addBox(wbx - 1.7, wbx + 1.7, wbz - 0.45, wbz + 0.45, 1);
  const peg = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 1.6), new THREE.MeshStandardMaterial({ map: TX.pegboardTex(), roughness: 0.8 }));
  peg.position.set(wbx, 2.0, z0 + 0.04); scene.add(peg);
  const clip = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), new THREE.MeshStandardMaterial({ map: TX.clipboardTex(), roughness: 0.7 }));
  clip.position.set(wbx - 2.2, 1.9, z0 + 0.05); scene.add(clip);
  // objetos sobre el banco: báscula, tarros, cinta, portátil
  B.box('#d9dcdf', wbx - 1.1, 0.96, wbz + 0.05, 0.42, 0.08, 0.32, 0, { mat: 'metal', ao: 0 });
  B.box('#26313a', wbx - 1.1, 1.04, wbz - 0.08, 0.2, 0.06, 0.04, 0, { mat: 'glow', ao: 0 });
  for (const ox of [-0.5, -0.3]) { B.add(GEO.cyl12, '#cfe6ee', wbx + ox, 1.08, wbz - 0.1, 0.16, 0.24, 0.16, 0, { mat: 'glass', ao: 0 }); B.add(GEO.ico1, '#5a8f34', wbx + ox, 1.04, wbz - 0.1, 0.12, 0.12, 0.12, 0, { ao: 0 }); }
  B.add(GEO.cyl12, '#c9a46a', wbx + 0.5, 0.99, wbz + 0.15, 0.18, 0.08, 0.18, 0, { ao: 0 });
  // lámpara colgante sobre el banco
  B.add(GEO.cyl6, '#222', wbx, h - 1.1, wbz + 0.3, 0.02, 2.0, 0.02, 0, { ao: 0, shadow: false });
  B.add(GEO.cone8, '#2b2f34', wbx, h - 2.2, wbz + 0.3, 0.6, 0.35, 0.6, 0, { mat: 'metal', ao: 0, shadow: false });
  B.add(GEO.sphere, '#fff1cf', wbx, h - 2.32, wbz + 0.3, 0.2, 0.12, 0.2, 0, { mat: 'glow' });
  // carro de herramientas rojo
  B.box('#b8292b', x0 + 9.2, 0.1, z0 + 0.5, 0.9, 1.0, 0.55, 0, { mat: 'metal' });
  for (let i = 0; i < 4; i++) B.box('#d8d8d8', x0 + 9.2, 0.3 + i * 0.22, z0 + 0.78, 0.5, 0.03, 0.02, 0, { mat: 'metal', ao: 0 });
  addBox(x0 + 8.7, x0 + 9.7, z0, z0 + 0.8, 1.1);
  // fregadero (rellenar regadera)
  const skx = x0 + 11.2;
  B.box('#c9ccd0', skx, 0, z0 + 0.45, 0.9, 0.85, 0.7, 0, { mat: 'metal' });
  B.box('#9aa3aa', skx, 0.85, z0 + 0.45, 0.8, 0.05, 0.6, 0, { mat: 'metal', ao: 0 });
  B.box('#b7bcc0', skx, 0.9, z0 + 0.12, 0.06, 0.4, 0.06, 0, { mat: 'metal', ao: 0 });
  B.box('#b7bcc0', skx, 1.28, z0 + 0.25, 0.05, 0.05, 0.3, 0, { mat: 'metal', ao: 0 });
  addBox(skx - 0.45, skx + 0.45, z0, z0 + 0.8, 1);
  hitbox(skx, 0.6, z0 + 0.45, 1, 1.2, 0.9, { actions: () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }] });
  // mesa con portátil
  const dkx = x0 + 13.6;
  B.box('#a57c4d', dkx, 0.75, z0 + 0.6, 1.6, 0.06, 0.8, 0, { ao: 0 });
  for (const sx of [-0.75, 0.75]) B.box('#333', dkx + sx, 0, z0 + 0.6, 0.06, 0.75, 0.7, 0, { mat: 'metal' });
  B.box('#2b2d31', dkx, 0.81, z0 + 0.6, 0.5, 0.02, 0.36, 0, { mat: 'metal', ao: 0 });
  B.box('#2b2d31', dkx, 0.82, z0 + 0.42, 0.5, 0.34, 0.02, 0, { mat: 'metal', ao: 0, rx: -0.2 });
  B.box('#7fc8ff', dkx, 0.85, z0 + 0.44, 0.44, 0.27, 0.01, 0, { mat: 'glow', rx: -0.2 });
  addBox(dkx - 0.8, dkx + 0.8, z0 + 0.2, z0 + 1.0, 1);
  // catre para dormir
  const cx_ = x1 - 1.9, cz_ = z0 + 9.4;
  B.box('#3d4a3a', cx_, 0, cz_, 0.95, 0.42, 2.1, 0, { mat: 'metal' });
  B.box('#6b7a5a', cx_, 0.42, cz_, 0.9, 0.12, 2.0, 0, { ao: 0 });
  B.box('#e8e2d6', cx_, 0.54, cz_ - 0.8, 0.6, 0.12, 0.35, 0, { ao: 0 });
  B.box('#7b3f3f', cx_, 0.54, cz_ + 0.3, 0.92, 0.06, 1.3, 0, { ao: 0 });
  addBox(cx_ - 0.5, cx_ + 0.5, cz_ - 1.05, cz_ + 1.05, 0.7);
  hitbox(cx_, 0.4, cz_, 1, 0.8, 2.1, { actions: () => [{ label: 'Dormir', fn: () => G.act.sleep('nave') }] });
  // palés, transpaleta y carretilla elevadora
  pallet(x1 - 1.3, z1 - 1.6, 0, 3);
  pallet(x1 - 1.3, z1 - 3.0, 0, 2);
  palletJack(dx1 + 1.2, z1 - 3.5, -0.4);
  forklift(x1 - 2.2, z0 + 12.6, Math.PI / 2 + 0.3);
  pallet(x0 + 1.4, z1 - 1.4, 0, 2);
  cardBox(x0 + 2.6, 0, z1 - 1.2, 0.6, 0.45, 0.5, 0.3, true);
  // cartel de palmeras
  const poster = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 1.2), new THREE.MeshStandardMaterial({ map: TX.posterTex(), roughness: 0.6 }));
  poster.position.set(x0 + 3.2, 2.2, z0 + 0.04); scene.add(poster);
  // cubos y garrafas
  for (let i = 0; i < 3; i++) { B.box(['#e9e9e4', '#3d8b3d', '#3d8b3d'][i], x0 + 1.4 + i * 0.36, 0, z1 - 3.0, 0.3, 0.48, 0.2, 0, { ao: 0.15, aoH: 0.4 }); }

  // luces interiores
  for (const [lx, lz] of [[x0 + 5, (z0 + z1) / 2], [x1 - 5, (z0 + z1) / 2]]) {
    const l = new THREE.PointLight(0xfff0dc, 38, 20, 1.5);
    l.position.set(lx, h - 1.2, lz);
    scene.add(l);
    W.lights.push(l);
  }
  const wl = new THREE.PointLight(0xffd9a0, 6, 5, 1.8);
  wl.position.set(wbx, h - 2.6, wbz + 0.5);
  scene.add(wl);
  W.lights.push(wl);

  W.props.nave = { x0: x0 + 0.2, x1: x1 - 0.2, z0: z0 + 0.2, z1: z1 - 0.2, name: 'Nave 7', spawn: { x: (dx0 + dx1) / 2, z: z1 - 4, yaw: 0 }, door: shutter, indoor: true };
  W.pois.nave = { x: (dx0 + dx1) / 2, z: z1 + 3 };
  W.mapRects.push({ x0, x1, z0, z1, c: '#5f7f9a' });
  W.mapLabels.push({ x: (x0 + x1) / 2, z: (z0 + z1) / 2, t: 'Tu nave' });
  W.worker = { x: wbx + 0.4, z: wbz + 0.95, yaw: Math.PI };

  // --- exterior: explanada, furgoneta, palés y vallas ---
  B.box('#bdb7ac', (x0 + x1) / 2 + 1, 0, (z1 + -36.5) / 2, x1 - x0 + 6, 0.05, -36.5 - z1, 0, { shadow: false, ao: 0, mat: TM.concreteOut, uvScale: [3, 1.5] });
  van(-55.6, -41.6, Math.PI + 0.12);
  pallet(-75, -43.6, 0.1, 2);
  pallet(-73.4, -43.2, 0, 1);
  palletJack(-77.4, -42.6, 0.8, '#e07a2b');
  cardBox(-71.6, 0, -43.4, 0.6, 0.45, 0.5, 0.2, true);
  cardBox(-71.5, 0.45, -43.4, 0.5, 0.4, 0.45, -0.1, false);
  chainFence(-58.2, -46.5, -58.2, -63.5);
  chainFence(-58.2, -63.5, -38, -63.5);
  W.spots.push({ id: 'nave', name: 'Delante de tu nave', x: -61, z: -39.5 });
}

function buildIndustrial() {
  building({ x0: -82, x1: -62, z0: -83, z1: -68, h: 8, wall: '#a8aeb2', trim: '#d0d6da', roof: '#6f777c', style: 'warehouse', front: '-z', sign: 'CONSERVAS LOMAS', signBg: '#5d6d7e', seed: 501, mapColor: '#7f8a90', label: 'Polígono' });
  building({ x0: -56, x1: -40, z0: -82, z1: -66, h: 7, wall: '#c2b089', trim: '#e0d6b8', roof: '#6f777c', style: 'warehouse', front: '+z', seed: 502, mapColor: '#9c8f6a' });
  asphalt(-58, -36.5, -63.4, -36.5, '#4b4e53');
  const cont = (x, z, c) => {
    B.box(c, x, 0, z, 6, 2.6, 2.5, 0, { mat: 'metal' });
    for (let i = -2.7; i <= 2.7; i += 0.45) B.box(c, x + i, 0.1, z + 1.27, 0.08, 2.4, 0.04, 0, { mat: 'metal', jitter: 0.1, ao: 0 });
    addBox(x - 3, x + 3, z - 1.25, z + 1.25, 2.6);
  };
  cont(-47, -60, '#b0392e'); cont(-47, -56.6, '#2b6ca3');
  B.box('#cf7a2b', -47, 2.6, -58.3, 6, 2.6, 2.5, 0, { mat: 'metal' });
  for (let i = 0; i < 5; i++) B.add(GEO.cyl12, '#2c3e50', -53 + i * 1.1, 0.6, -52.5, 0.8, 1.2, 0.8, 0, { mat: 'metal' });
  addBox(-53.5, -48, -53, -52, 1.2);
  dumpster(-44, -40.5, 0, '#2e6b4a');
  hitbox(-44, 0.8, -40.5, 2.3, 1.6, 1.5, { actions: () => G.act.deadDropActions() });
  W.pois.deadDrop = { x: -44, z: -38.6 };
  W.spots.push({ id: 'callejon', name: 'Callejón del polígono', x: -59, z: -66 });
  W.mapLabels.push({ x: -44, z: -42, t: 'Entregas' });
  palm(-37.8, -61, 8.5);
  palm(-37.8, -50, 9.5);
}

function buildMotel() {
  const wall = '#e9c49a', trim = '#fff3e0', roof = '#a0522d';
  building({ x0: -72, x1: -64, z0: -18, z1: 0, h: 3.2, wall, trim, roof, style: 'motel', front: '+x', labels: ['3', '2', '1'], seed: 101, mapColor: '#d59a6a' });
  building({ x0: -72, x1: -64, z0: 0, z1: 18, h: 3.2, wall, trim, roof, style: 'motel', front: '+x', labels: ['6', '5', '4'], seed: 102, mapColor: '#d59a6a' });
  building({ x0: -72, x1: -63, z0: 19.5, z1: 23.5, h: 3.4, wall: '#f0d2a8', trim, roof, style: 'shop', front: '+x', sign: 'RECEPCIÓN', awning: '#c0392b', seed: 103, mapColor: '#d59a6a' });
  B.box(roof, -66.9, 3.2, 0, 10.8, 0.3, 36.8);
  for (let z = -18; z <= 18; z += 6) B.box('#f3e5d0', -61.9, 0, z, 0.25, 3.2, 0.25);
  paving(-64, -61.5, -18.2, 18.2);
  W.mapLabels.push({ x: -66, z: -4, t: 'Motel' });
  asphalt(-61.5, -37, -21, 21);
  for (let z = -18; z <= 18; z += 3.2) B.box('#e8e8e8', -52, 0, z, 6, 0.04, 0.12, 0, { shadow: false, ao: 0 });
  parkedCar(-55, -13.5, Math.PI / 2, '#b03a2e');
  parkedCar(-55, 6.6, Math.PI / 2);
  parkedCar(-48.6, 16.2, -Math.PI / 2, '#e8e8e4');
  // cartel vintage
  B.add(GEO.cyl8, '#5a5f66', -38.5, 4, -19, 0.3, 8, 0.3, 0, { mat: 'metal' });
  const st = TX.signTex('MOTEL SOL PONIENTE', { bg: '#c0392b', fg: '#fff8e1', border: '#f9e79f', w: 512, h: 192, font: 'bold 70px sans-serif' });
  const sm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 6), [new THREE.MeshStandardMaterial({ map: st, emissiveMap: st, emissive: 0xffffff, emissiveIntensity: 0.25 }), new THREE.MeshStandardMaterial({ map: st }), plainMat('#8e2b20'), plainMat('#8e2b20'), plainMat('#8e2b20'), plainMat('#8e2b20')]);
  W.winMats.push(sm.material[0]);
  sm.position.set(-38.5, 8.4, -19);
  sm.castShadow = true;
  scene.add(sm);
  addBox(-38.8, -38.2, -19.3, -18.7, 6);
  for (let z = -20; z <= 20; z += 8) palm(-77 + Math.random() * 3, z + Math.random() * 2);
  chainFence(-83, -23, -83, 23);
  W.spots.push({ id: 'motel', name: 'Aparcamiento del motel', x: -44, z: 2 });
  W.wander.push({ x: -60, z: 21 });
}

function buildPlaza() {
  paving(-23.5, 23.5, -23.5, 23.5, '#cfc6b4', null, 3);
  B.box('#7a9a48', -12, 0, -12, 18, 0.08, 18, 0, { shadow: false, ao: 0 });
  B.box('#7a9a48', 12, 0, -12, 18, 0.08, 18, 0, { shadow: false, ao: 0 });
  B.box('#7a9a48', -12, 0, 12, 18, 0.08, 18, 0, { shadow: false, ao: 0 });
  B.box('#7a9a48', 12, 0, 12, 18, 0.08, 18, 0, { shadow: false, ao: 0 });
  B.add(GEO.cyl16, '#b6ad9b', 0, 0.35, 0, 7, 0.7, 7);
  B.add(GEO.cyl16, '#3f8fc0', 0, 0.62, 0, 6.2, 0.06, 6.2, 0, { mat: 'glass', shadow: false, ao: 0 });
  B.add(GEO.cyl8, '#c9c0ae', 0, 1.3, 0, 0.8, 2.2, 0.8);
  B.add(GEO.cyl16, '#c9c0ae', 0, 2.45, 0, 2.4, 0.3, 2.4);
  B.add(GEO.cyl16, '#5fb1e0', 0, 2.62, 0, 2.0, 0.05, 2.0, 0, { mat: 'glass', shadow: false, ao: 0 });
  addBox(-3.5, 3.5, -3.5, 3.5, 0.9);
  for (const [x, z, r] of [[0, 6.5, Math.PI], [0, -6.5, 0], [6.5, 0, -Math.PI / 2], [-6.5, 0, Math.PI / 2]]) bench(x + (x ? 0 : 3.2), z + (z ? 0 : 3.2), r);
  for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14], [-19, 6], [19, -6], [6, 19], [-6, -19], [-8, 8], [8, -8]]) palm(x, z);
  for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) { for (let k = 0; k < 6; k++) bush(x + Math.cos(k) * 1.2, z + Math.sin(k) * 1.2, 0.7, k % 2 ? '#3f7a35' : '#4c8a3a'); }
  for (const [x, z] of [[2.6, 12], [-2.6, -12], [12, -2.6], [-12, 2.6]]) lamp(x, z, Math.PI / 2);
  W.spots.push({ id: 'plaza', name: 'Fuente de la plaza', x: 3.2, z: 5.2 });
  W.wander.push({ x: -3, z: 5 }, { x: 5, z: -4 }, { x: 10, z: 10 });
  W.mapLabels.push({ x: 0, z: 0, t: 'Plaza' });
  W.mapRects.push({ x0: -23.5, x1: 23.5, z0: -23.5, z1: 23.5, c: '#79ad58' });
}

// ------------------------------------------------------------------
//  Tiendas en las que se entra (ferretería y tienda de la gasolinera)
// ------------------------------------------------------------------
// Edificio hueco con el frente hacia -x: escaparates, puertas de cristal que se
// abren solas, mostrador con dependiente y estanterías. Al hablar con el
// dependiente se abre el catálogo. Fuera de horario las puertas no se abren.
const glassMat = () => new THREE.MeshStandardMaterial({ color: 0xbfd2de, transparent: true, opacity: 0.18, roughness: 0.03, metalness: 0.9, depthWrite: false });
function walkInShop(o) {
  const { id, x0, x1, z0, z1, h, wall, trim = '#ffffff', roof = '#5b5b5b', sign, signBg, awning, tint = '#f4efe6', floor = '#cfc9bd', seed = 1, label, mapColor } = o;
  const t = 0.25, cz = (z0 + z1) / 2, w = x1 - x0, d = z1 - z0;
  const dw = 2.2, d0 = cz - dw / 2, d1 = cz + dw / 2; // hueco de la puerta doble
  const gh = 3.0; // altura de escaparates y puerta
  const ext = { ao: 0.25, aoH: 1.4 };
  const seg = (ax0, ax1, az0, az1, y0, y1, col = wall, opts = ext) => {
    B.box(col, (ax0 + ax1) / 2, y0, (az0 + az1) / 2, ax1 - ax0, y1 - y0, az1 - az0, 0, opts);
    if (y0 < 2) addBox(ax0, ax1, az0, az1, y1 + 1);
  };
  // paredes exteriores (detrás, lados) y fachada con escaparates
  seg(x1, x1 + t, z0 - t, z1 + t, 0, h);
  seg(x0 - t, x1 + t, z0 - t, z0, 0, h);
  seg(x0 - t, x1 + t, z1, z1 + t, 0, h);
  for (const [a, b] of [[z0 - t, d0], [d1, z1 + t]]) {
    seg(x0 - t, x0, a, b, 0, 0.55, '#3a3d42');           // zócalo del escaparate
    seg(x0 - t, x0, a, b, gh, h);                          // pared sobre el escaparate
    for (const zz of [a + 0.2, b - 0.2, (a + b) / 2]) seg(x0 - t, x0, zz - 0.1, zz + 0.1, 0.55, gh, '#2a2d31', { mat: 'metal', ao: 0 });
    addBox(x0 - t, x0, a, b, gh + 1); // el cristal no se atraviesa
    const g = new THREE.Mesh(new THREE.PlaneGeometry(b - a - 0.4, gh - 0.55), glassMat());
    g.rotation.y = -Math.PI / 2;
    g.position.set(x0 - t / 2, 0.55 + (gh - 0.55) / 2, (a + b) / 2);
    scene.add(g);
  }
  seg(x0 - t, x0, d0, d1, gh, h); // dintel de la puerta
  B.box('#2a2d31', x0 - t / 2, gh - 0.12, cz, t + 0.04, 0.12, dw, 0, { mat: 'metal', ao: 0 });
  // tejado plano con pretil
  B.box(roof, (x0 + x1) / 2, h, cz, w + 2 * t, 0.3, d + 2 * t, 0, { ao: 0 });
  B.box(trim, x0 - t - 0.05, h - 0.2, cz, 0.12, 0.7, d + 2 * t + 0.1, 0, { ao: 0 });
  B.box('#a7adb3', (x0 + x1) / 2 + w * 0.2, h + 0.3, cz - d * 0.2, 1.6, 1.0, 1.2, 0, { mat: 'metal', ao: 0 });
  W.mapRects.push({ x0, x1, z0, z1, c: mapColor || '#8b8f99' });
  if (label) W.mapLabels.push({ x: (x0 + x1) / 2, z: cz, t: label });
  // rótulo, toldo y luz de la fachada
  if (sign) {
    const sm = signMesh(sign, Math.min(d * 0.7, 8), Math.min(d * 0.7, 8) / 4.5, { bg: signBg, fg: '#fff', border: '#ffffff' });
    sm.rotation.y = -Math.PI / 2;
    sm.position.set(x0 - t - 0.04, Math.min(h - 0.9, gh + 1.25), cz);
    W.signMats = W.signMats || [];
    W.signMats.push(sm.material);
  }
  if (awning) {
    for (const [a, b] of [[z0, d0 - 0.2], [d1 + 0.2, z1]]) {
      B.add(GEO.box, awning, x0 - t - 0.7, gh + 0.35, (a + b) / 2, 1.4, 0.07, b - a, 0, { rz: 0.28, ao: 0 });
      B.box(awning, x0 - t - 1.38, gh - 0.05, (a + b) / 2, 0.05, 0.28, b - a, 0, { ao: 0 });
    }
  }
  // interior: suelo de baldosa, paredes claras iluminadas, techo con paneles de luz
  const { rand, L, LM, shelfUnit, counter, register, fridge } = interiorKit(seed);
  const ft = TX.tileTex(floor, new THREE.Color(floor).multiplyScalar(0.82).getStyle(), 4);
  ft.repeat.set(w / 2.4, d / 2.4);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: ft, roughness: 0.45, emissiveMap: ft, emissive: 0xffffff, emissiveIntensity: 0.18 }));
  fl.rotation.x = -Math.PI / 2;
  fl.position.set((x0 + x1) / 2, 0.025, cz);
  fl.receiveShadow = true;
  scene.add(fl);
  const ih = h - 0.35;
  B.box(tint, x1 - 0.04, 0, cz, 0.08, ih, d, 0, L);
  B.box(tint, (x0 + x1) / 2, 0, z0 + 0.04, w, ih, 0.08, 0, L);
  B.box(tint, (x0 + x1) / 2, 0, z1 - 0.04, w, ih, 0.08, 0, L);
  for (const [a, b] of [[z0, d0], [d1, z1]]) B.box(tint, x0 + 0.04, gh, (a + b) / 2, 0.08, ih - gh, b - a, 0, L);
  B.box('#ece9e2', (x0 + x1) / 2, ih, cz, w, 0.06, d, 0, L);
  for (const zz of [cz - d * 0.25, cz + d * 0.25]) for (let x = x0 + 2; x < x1 - 1; x += 3.2) B.box('#fffaf0', x, ih - 0.05, zz, 1.6, 0.04, 0.4, 0, { mat: 'glow' });
  for (const zz of [z0 + 0.1, z1 - 0.1]) B.box('#3a3d42', (x0 + x1) / 2, 0.02, zz, w, 0.14, 0.05, 0, L); // rodapié
  // mostrador al fondo y dependiente detrás
  const kx = x1 - 2.6, kz0 = cz - 2.4, kz1 = cz + 0.6;
  counter(kx, (kz0 + kz1) / 2, kz1 - kz0, o.counterColor || '#6b4f3a', '#d9d4cc', Math.PI / 2);
  addBox(kx - 0.35, kx + 0.35, kz0, kz1, 1.2);
  register(kx, kz1 - 0.5);
  (W.clerks = W.clerks || []).push({ x: x1 - 1.6, z: (kz0 + kz1) / 2, yaw: -Math.PI / 2, kind: id });
  hitbox(kx, 1.3, (kz0 + kz1) / 2, 1.0, 1.4, kz1 - kz0, {
    actions: () => [{ label: o.buyLabel || 'Comprar', fn: o.onBuy || (() => G.act.openShop(id)) }],
  });
  // puertas de cristal correderas que se abren al acercarse
  const leaves = [];
  for (const side of [-1, 1]) {
    const leaf = new THREE.Group();
    const gl = new THREE.Mesh(new THREE.BoxGeometry(0.04, gh - 0.15, dw / 2), glassMat());
    gl.position.y = (gh - 0.15) / 2;
    const fr = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.08, dw / 2), plainMat('#2a2d31', { metalness: 0.6, roughness: 0.4 }));
    fr.position.y = 0.04;
    const fr2 = fr.clone(); fr2.position.y = gh - 0.15;
    const handle = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.5, 0.04), plainMat('#c8ccd0', { metalness: 0.8, roughness: 0.3 }));
    handle.position.set(-0.05, 1.05, -side * (dw / 4 - 0.08));
    leaf.add(gl, fr, fr2, handle);
    leaf.position.set(x0 - t / 2, 0, cz + side * dw / 4);
    scene.add(leaf);
    leaves.push({ leaf, side });
  }
  const col = addBox(x0 - t, x0, d0, d1, gh + 1);
  const shopDef = o.hours || [0, 24];
  const door = { x: x0, z: cz, leaves, col, k: 0, open: () => { const hr = G.state.minute / 60; return hr >= shopDef[0] && hr < shopDef[1]; } };
  (W.autoDoors = W.autoDoors || []).push(door);
  hitbox(x0 - t - 0.3, 1.2, cz, 0.3, 2.4, dw, {
    enabled: () => !door.open(),
    actions: () => [{ label: `Cerrado · abre a las ${shopDef[0]}:00`, fn: () => G.act.toast?.(`${label || 'La tienda'} abre de ${shopDef[0]}:00 a ${shopDef[1]}:00.`, '🕖') }],
  });
  return { x: x0 - 1.5, z: cz, rand, L, LM, shelfUnit, fridge, counter, kx, kz0, kz1, door };
}

// Productos de ferretería hechos a mano (botes de pintura, cajas, macetas, sacos).
function hardwareItems(rand, L, LM) {
  return (P, len, y, ry) => {
    let u = -len / 2 + 0.08;
    while (u < len / 2 - 0.12) {
      const k = rand();
      const [px, pz] = P(u + 0.1, (rand() - 0.5) * 0.04);
      if (k < 0.3) { // botes de pintura
        const col = ['#c0392b', '#2e86de', '#f1c40f', '#ecf0f1', '#27ae60'][Math.floor(rand() * 5)];
        B.add(GEO.cyl12, '#b8bcc0', px, y + 0.09, pz, 0.17, 0.18, 0.17, 0, LM);
        B.add(GEO.cyl12, col, px, y + 0.09, pz, 0.175, 0.1, 0.175, 0, L);
        u += 0.2;
      } else if (k < 0.55) { // cajas de herramienta / tornillería
        const col = ['#e67e22', '#2c3e50', '#16a085', '#8e44ad', '#d35400'][Math.floor(rand() * 5)];
        B.box(col, px, y, pz, 0.24, 0.12 + rand() * 0.12, 0.2, ry, L);
        u += 0.27;
      } else if (k < 0.8) { // macetas
        B.add(GEO.cyl8, '#b5653a', px, y + 0.1, pz, 0.2, 0.2, 0.2, 0, L);
        B.add(GEO.cyl8, '#8d4a28', px, y + 0.2, pz, 0.23, 0.03, 0.23, 0, L);
        u += 0.24;
      } else { // sacos de tierra
        B.box('#6b4a2f', px, y, pz, 0.32, 0.22, 0.22, ry, L);
        B.box('#e8d9b8', px, y + 0.08, pz, 0.2, 0.08, 0.225, ry, L);
        u += 0.36;
      }
    }
  };
}

function buildShops() {
  const fer = walkInShop({ id: 'ferreteria', x0: 38, x1: 54, z0: -20, z1: -4, h: 6.4, wall: '#e8dcc6', trim: '#ffffff', sign: 'FERRETERÍA TORNILLO', signBg: '#b0302a', awning: '#c0392b', seed: 201, mapColor: '#c25b4e', label: 'Ferretería', tint: '#f3ede2', floor: '#c9c3b8', counterColor: '#b0302a', hours: [7, 21], buyLabel: 'Comprar en la ferretería' });
  W.pois.ferreteria = fer;
  {
    // pasillos con estanterías de ferretería y expositor junto a la entrada
    const items = hardwareItems(fer.rand, fer.L, fer.LM);
    for (const z of [-16.4, -7.6]) {
      fer.shelfUnit(44, z - 0.2, 7, 4, 0.42, 0, '#d0d3d6', true, items);
      fer.shelfUnit(44, z + 0.2, 7, 4, 0.42, Math.PI, '#d0d3d6', true, items);
      addBox(40.4, 47.6, z - 0.45, z + 0.45, 2);
    }
    fer.shelfUnit(44, -19.6, 9, 5, 0.45, 0, '#c0392b', true, items);
    fer.shelfUnit(44, -4.4, 9, 5, 0.45, Math.PI, '#c0392b', true, items);
    fer.shelfUnit(53.4, -12, 5, 5, 0.45, -Math.PI / 2, '#c0392b', true, items);
    // palé con sacos de tierra y macetas apiladas
    B.box('#a07a4f', 40.2, 0, -10.2, 1.2, 0.14, 1.0, 0, fer.L);
    for (let i = 0; i < 6; i++) B.box('#6b4a2f', 39.9 + (i % 2) * 0.55, 0.14 + Math.floor(i / 2) * 0.24, -10.2, 0.5, 0.22, 0.85, 0, fer.L);
    for (let i = 0; i < 5; i++) B.add(GEO.cyl8, '#b5653a', 40.2, 0.15 + i * 0.12, -13.8, 0.42 - i * 0.01, 0.26, 0.42 - i * 0.01, 0, fer.L);
    addBox(39.5, 40.9, -10.8, -9.6, 1.2);
  }
  for (const x of [37.6, 46.4]) for (const z of [6, 18]) { B.box('#ecf0f1', x, 0, z, 0.4, 4.6, 0.4, 0, { mat: 'metal' }); addBox(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 4.6); }
  B.box('#ecf0f1', 42, 4.6, 12, 11.5, 0.5, 14.5);
  B.box('#d63031', 42, 4.85, 12, 11.6, 0.3, 14.6, 0, { ao: 0 });
  B.box('#fffbe8', 42, 4.58, 12, 10, 0.03, 12.5, 0, { mat: 'glow' });
  for (const z of [9, 15]) {
    B.box('#7f8c8d', 42, 0, z, 1.2, 0.2, 2.4);
    B.box('#d63031', 42, 0.2, z, 0.8, 1.6, 0.6, 0, { mat: 'metal' });
    B.box('#2d3436', 41.58, 1.1, z, 0.04, 0.4, 0.4, 0, { mat: 'glow' });
    addBox(41.4, 42.6, z - 1.2, z + 1.2, 1.8);
  }
  asphalt(36.5, 49.5, 2, 22, '#4f5257');
  const gas = walkInShop({ id: 'gasolinera', x0: 50, x1: 62, z0: 6, z1: 18, h: 4.2, wall: '#f4f4f4', trim: '#2e86de', sign: 'GAS&GO 24H', signBg: '#2e86de', awning: '#2e86de', seed: 202, mapColor: '#4f8fd0', label: 'Gasolinera', tint: '#f6f6f2', floor: '#dcd8cf', counterColor: '#2e86de', hours: [0, 24], buyLabel: 'Comprar en Gas&Go' });
  W.pois.gasolinera = gas;
  {
    // neveras al fondo, góndola de snacks y estantería lateral
    for (let i = 0; i < 4; i++) gas.fridge(61.5, 13.2 + i * 0.92, -Math.PI / 2);
    addBox(61, 62, 12.6, 17.4, 2.2);
    const SNACKS = ['bag', 'chocolate', 'candy-bar', 'soda-can', 'soda-bottle', 'peanut-butter', 'honey', 'can-small', 'loaf', 'donut-chocolate', 'muffin'];
    gas.shelfUnit(55, 14.6, 4.5, 4, 0.38, 0, '#f0f0f0', true, SNACKS);
    gas.shelfUnit(55, 15.0, 4.5, 4, 0.38, Math.PI, '#f0f0f0', true, SNACKS);
    addBox(52.7, 57.3, 14.4, 15.2, 2);
    gas.shelfUnit(55, 6.4, 6, 4, 0.4, 0, '#2e86de', true, ['soda-bottle', 'bottle-oil', 'carton', 'can', 'bag', 'wine-red']);
    const D = decorKit(gas.L, gas.LM);
    // cajero, arcón de hielos, revistero, máquina de café y carteles
    B.box('#2c3e50', 50.55, 0, 16.9, 0.5, 1.6, 0.7, 0, gas.LM);
    B.box('#7fc8ff', 50.82, 1.05, 16.9, 0.02, 0.35, 0.5, 0, { mat: 'glow' });
    addBox(50.25, 50.85, 16.5, 17.3, 1.6);
    B.box('#ecf0f1', 57.6, 0, 17.4, 1.6, 0.85, 0.7, 0, gas.LM);
    B.box('#2e86de', 57.6, 0.6, 17.06, 1.5, 0.18, 0.02, 0, { mat: 'glow' });
    addBox(56.8, 58.4, 17, 17.8, 0.9);
    B.box('#3a3d42', 50.6, 0, 8.2, 0.5, 1.2, 1.2, 0, gas.L);
    for (let i = 0; i < 6; i++) B.box(['#c0392b', '#f1c40f', '#2e86de', '#27ae60', '#ecf0f1', '#8e44ad'][i], 50.9, 0.3 + (i % 3) * 0.32, 7.8 + Math.floor(i / 3) * 0.6, 0.02, 0.28, 0.42, 0, { mat: 'glow' });
    addBox(50.3, 50.9, 7.6, 8.8, 1.2);
    B.box('#3a3d42', 61.6, 0, 7.2, 0.7, 0.95, 0.6, 0, gas.L); addBox(61.25, 61.95, 6.9, 7.5, 1);
    B.box('#2a2d31', 61.6, 0.95, 7.2, 0.5, 0.55, 0.5, 0, gas.LM);
    B.box('#c0392b', 61.35, 1.2, 7.2, 0.02, 0.2, 0.3, 0, { mat: 'glow' });
    D.poster(56, 2.2, 17.94, Math.PI, 2.0, 0.7, ['#2e86de', '#f1c40f', '#ffffff', '#c0392b']);
    D.plant(50.7, 15.4, 0.8);
  }
  B.add(GEO.cyl8, '#5a5f66', 37, 4, 21.5, 0.3, 8, 0.3, 0, { mat: 'metal' });
  const pt = TX.signTex('GAS&GO', { bg: '#2e86de', fg: '#fff', border: '#fff', w: 256, h: 256, font: 'bold 64px sans-serif' });
  const pm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 2.6), new THREE.MeshStandardMaterial({ map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0.25 }));
  W.winMats.push(pm.material);
  pm.position.set(37, 8.6, 21.5); scene.add(pm);
  addBox(36.7, 37.3, 21.2, 21.8, 8);
  building({ x0: 66, x1: 82, z0: -20, z1: -2, h: 6.5, wall: '#9fb1bd', trim: '#e8eef2', roof: '#4d4d4d', style: 'warehouse', front: '-x', sign: 'TALLER MECÁNICO PEPE', signBg: '#34495e', seed: 203, mapColor: '#8a9aa6' });
  building({ x0: 66, x1: 82, z0: 4, z1: 21, h: 9.6, wall: '#c98a6b', trim: '#f1e3d3', roof: '#5a5a5a', style: 'house', front: '-x', seed: 204, mapColor: '#9e5e48' });
  asphalt(36.5, 37.9, -22, -2);
  parkedCar(46, -1.5, 0, '#2e6b4a');
  palm(64, -22); palm(58, -3);
  storefront({ x0: 48.5, x1: 56.5, zf: 23.2, depth: 4, h: 4.6, wall: '#f1efe9', name: 'Farmacia', sign: 'FARMACIA', signColor: '#1e8e4f', neon: { text: '+', color: '#6dff8a', glow: '#00ff55', border: '#00ff55' }, seed: 21, tint: '#f4f8f6' });
  storefront({ x0: 57, x1: 65, zf: 23.2, depth: 4, h: 5.2, wall: '#b8452f', name: 'Taquería', sign: 'TAQUERÍA EL GÜERO', signStyle: 'letters', awning: '#2f8f4f', neon: { text: 'TACOS', color: '#ffe066', glow: '#ff9900', border: '#ff3d3d' }, seed: 22, tint: '#ffd9a6' });
  trashCan(52, 24.6); hydrant(60.5, 24.4);
  W.spots.push({ id: 'gasolinera', name: 'Detrás de la gasolinera', x: 64, z: 12 });
  W.wander.push({ x: 35.5, z: -12 }, { x: 47.5, z: 12 });
}

// ------------------------------------------------------------------
//  Avenida del Este: peluquería y tienda de ropa (locales en los que se entra)
// ------------------------------------------------------------------
function buildEastShops() {
  W.lots = W.lots || [];
  const lot = (x0, x1, z0, z1) => { W.lots.push({ x0, x1, z0, z1 }); paving(96.5, x0, z0 - 1, z1 + 1); };

  // --- Peluquería: dos sillones frente al espejo de la pared del fondo (z0)
  {
    const x0 = 98, x1 = 110, z0 = -24, z1 = -10;
    lot(x0, x1, z0, z1);
    const sh = walkInShop({ id: 'peluqueria', x0, x1, z0, z1, h: 4.6, wall: '#2c2f36', trim: '#e8e2d6', sign: 'BARBERÍA NAVAJA', signBg: '#8c1d22', awning: '#202326', seed: 205, mapColor: '#7a3a3e', label: 'Peluquería', tint: '#efe9df', floor: '#2e2e33', counterColor: '#8c1d22', hours: [9, 21], buyLabel: 'Hablar con el peluquero', onBuy: () => G.act.toast?.('Peluquero: «Siéntate en el sillón libre, ahora te atiendo.»', '💈') });
    W.pois.peluqueria = sh;
    const { L, LM } = sh;
    // poste de barbero en la fachada
    B.add(GEO.cyl12, '#f4f4f4', x0 - 0.6, 2.2, z0 + 1.6, 0.22, 1.2, 0.22, 0, { ao: 0 });
    for (let i = 0; i < 4; i++) B.box(i % 2 ? '#c0392b' : '#2e5fa8', x0 - 0.6, 1.65 + i * 0.28, z0 + 1.6, 0.235, 0.12, 0.235, i * 0.6, { ao: 0 });
    // espejo corrido y encimera
    B.box('#cfd8dc', 103, 1.0, z0 + 0.08, 7, 1.35, 0.04, 0, { mat: 'litMetal', shadow: false, ao: 0 });
    B.box('#2a2d31', 103, 0.8, z0 + 0.32, 7.2, 0.08, 0.5, 0, LM);
    B.box('#3a3d42', 103, 0, z0 + 0.32, 7.2, 0.8, 0.45, 0, L);
    for (const x of [100.4, 103, 105.6]) { B.add(GEO.cyl8, '#e8e8e8', x + 0.4, 0.95, z0 + 0.3, 0.07, 0.22, 0.07, 0, L); B.add(GEO.cyl8, '#2e86de', x - 0.3, 0.92, z0 + 0.32, 0.06, 0.16, 0.06, 0, L); }
    addBox(99.4, 106.6, z0, z0 + 0.6, 1.2);
    // sillones (el de la izquierda es el del jugador)
    const chair = (x, z) => {
      B.add(GEO.cyl16, '#bfc4c8', x, 0.05, z, 0.62, 0.1, 0.62, 0, LM);
      B.add(GEO.cyl12, '#bfc4c8', x, 0.3, z, 0.12, 0.4, 0.12, 0, LM);
      B.box('#1b1b1e', x, 0.48, z, 0.62, 0.14, 0.6, 0, L);
      B.box('#1b1b1e', x, 0.6, z + 0.28, 0.62, 0.72, 0.12, 0, L);       // respaldo (detrás del cliente)
      B.box('#1b1b1e', x, 1.32, z + 0.3, 0.3, 0.2, 0.1, 0, L);          // reposacabezas
      for (const s of [-1, 1]) B.box('#bfc4c8', x + s * 0.34, 0.66, z, 0.06, 0.06, 0.5, 0, LM);
      B.box('#bfc4c8', x, 0.18, z - 0.42, 0.4, 0.04, 0.22, 0, LM);       // reposapiés
      addBox(x - 0.36, x + 0.36, z - 0.35, z + 0.36, 1.2);
    };
    const seat = { x: 101.2, z: z0 + 1.55, yaw: Math.PI };
    chair(seat.x, seat.z);
    chair(104.8, z0 + 1.55);
    W.barber = { seat, mirrorZ: z0 + 0.1, hours: [9, 21] };
    hitbox(seat.x, 0.8, seat.z, 0.8, 1.6, 0.8, {
      actions: () => [{ label: 'Sentarse en el sillón', fn: () => G.act.openBarber?.() }],
    });
    // banco de espera y revistero
    B.box('#5a3d2b', 100.5, 0.42, z1 - 0.6, 3.2, 0.08, 0.5, 0, L);
    for (const x of [99.1, 101.9]) B.box('#2a2d31', x, 0, z1 - 0.6, 0.08, 0.42, 0.45, 0, LM);
    addBox(98.8, 102.2, z1 - 0.9, z1 - 0.3, 0.6);
    sh.shelfUnit(108.6, z0 + 0.35, 2.2, 4, 0.35, 0, '#2a2d31', true);
    const D = decorKit(L, LM);
    // lavacabezas en la pared de enfrente, carritos de herramientas, plantas y cuadros
    B.box('#e8e8e8', 106.4, 0.62, z1 - 0.45, 1.6, 0.28, 0.6, 0, LM);
    B.box('#3a3d42', 106.4, 0, z1 - 0.45, 1.6, 0.62, 0.55, 0, L);
    for (const x of [105.9, 106.9]) { B.add(GEO.cyl12, '#f4f4f4', x, 0.86, z1 - 0.45, 0.42, 0.12, 0.34, 0, LM); B.add(GEO.cyl8, '#c8ccd0', x, 1.05, z1 - 0.2, 0.03, 0.3, 0.03, 0, LM); }
    addBox(105.5, 107.3, z1 - 0.8, z1, 1);
    for (const x of [102.9, 106.6]) { B.box('#2a2d31', x, 0, z0 + 2.4, 0.4, 0.75, 0.35, 0, LM); for (let i = 0; i < 4; i++) B.box(['#e74c3c', '#ecf0f1', '#3498db', '#f1c40f'][i], x - 0.12 + i * 0.08, 0.75, z0 + 2.4, 0.05, 0.12 + (i % 2) * 0.05, 0.05, 0, L); addBox(x - 0.22, x + 0.22, z0 + 2.2, z0 + 2.6, 1); }
    D.table(100.5, z1 - 1.5, 1.0, 0.5, 0.42, '#2a2d31');
    for (let i = 0; i < 3; i++) B.box(['#c0392b', '#2e86de', '#f39c12'][i], 100.2 + i * 0.3, 0.42, z1 - 1.5, 0.22, 0.02, 0.3, 0.2 * i, L);
    D.plant(98.7, z0 + 0.7); D.plant(109.3, z1 - 0.6, 1.1); D.plant(109.3, z0 + 2.4, 0.9);
    D.coatRack(98.6, z1 - 2.4);
    D.tv(100.5, 2.1, z1 - 0.06, Math.PI);
    D.poster(103.5, 1.6, z1 - 0.06, Math.PI, 0.7, 0.9, ['#2b2b30', '#c0392b', '#e8e2d6']);
    D.poster(104.5, 1.6, z1 - 0.06, Math.PI, 0.7, 0.9, ['#2b2b30', '#f1c40f', '#e8e2d6']);
    D.poster(x1 - 0.06, 1.8, -16, -Math.PI / 2, 1.2, 0.8, ['#1f2a44', '#e74c3c', '#ecf0f1', '#f1c40f']);
    D.rug(101.2, z0 + 1.55, 1.6, 1.6, '#1b1b1e');
    // centro: alfombra, expositor de productos y sillas de espera
    D.rug(103.8, -15.6, 4.2, 3.2, '#5a2a2e');
    B.add(GEO.cyl16, '#2a2d31', 104.6, 0.45, -13.2, 0.9, 0.9, 0.9, 0, LM);
    for (let i = 0; i < 8; i++) { const a = i * 0.785; B.add(GEO.cyl8, ['#e74c3c', '#ecf0f1', '#3498db', '#f1c40f', '#2ecc71', '#9b59b6'][i % 6], 104.6 + Math.cos(a) * 0.28, 0.98, -13.2 + Math.sin(a) * 0.28, 0.09, 0.16 + (i % 3) * 0.04, 0.09, 0, L); }
    addBox(104.15, 105.05, -13.65, -12.75, 1);
    for (const x of [99.4, 100.2]) D.chair(x, -20.2, 0, '#8c1d22');
    D.poster(x1 - 0.06, 1.9, -12.2, -Math.PI / 2, 1.0, 0.7, ['#8c1d22', '#e8e2d6', '#2b2b30']);
  }

  // --- Ropa: percheros, mesa con prendas dobladas y probador con espejo
  {
    const x0 = 98, x1 = 110, z0 = 6, z1 = 22;
    lot(x0, x1, z0, z1);
    const sh = walkInShop({ id: 'ropa', x0, x1, z0, z1, h: 4.8, wall: '#e9e4dc', trim: '#1d1d1f', sign: 'BOUTIQUE MAREA', signBg: '#1d1d1f', awning: '#c9a227', seed: 206, mapColor: '#a88c3a', label: 'Tienda de ropa', tint: '#f7f4ee', floor: '#d6cfc2', counterColor: '#1d1d1f', hours: [10, 21], buyLabel: 'Ver la ropa', onBuy: () => G.act.openClothes?.() });
    W.pois.ropa = sh;
    const { L, LM } = sh;
    const COLS = ['#1d1e22', '#7d8085', '#1f2a44', '#a8794a', '#b3262b', '#e9e6df', '#2f4a73', '#4a5434', '#b49a72'];
    const rack = (x, z, len, ry) => {
      const c = Math.cos(ry), sn = Math.sin(ry);
      for (const u of [-len / 2, len / 2]) B.add(GEO.cyl8, '#9aa0a6', x + u * c, 0.75, z - u * sn, 0.04, 1.5, 0.04, 0, LM);
      B.add(GEO.cyl8, '#9aa0a6', x, 1.48, z, 0.03, len, 0.03, ry, { ...LM, rz: Math.PI / 2 });
      let k = 0;
      for (let u = -len / 2 + 0.15; u < len / 2 - 0.1; u += 0.13) {
        const col = COLS[(k++ * 7 + Math.floor(x + z)) % COLS.length];
        B.box(col, x + u * c, 0.72, z - u * sn, 0.04, 0.72, 0.46, ry, L);
      }
    };
    rack(100.6, z0 + 0.6, 4, 0);
    rack(104.2, z0 + 0.6, 3, 0);
    rack(100.6, z1 - 0.6, 4, 0);
    // mesa central con prendas dobladas
    B.box('#6b4f3a', 102.4, 0, 14, 2.2, 0.82, 1.1, 0, L);
    for (let i = 0; i < 8; i++) B.box(COLS[i % COLS.length], 101.6 + (i % 4) * 0.52, 0.82, 13.75 + Math.floor(i / 4) * 0.5, 0.42, 0.08 + (i % 3) * 0.04, 0.34, 0, L);
    addBox(101.3, 103.5, 13.45, 14.55, 1);
    // probador con cortina y espejo grande
    const fx0 = 104.6, fx1 = 107.4, fz0 = 18.6, fz1 = z1;
    B.box('#3a3d42', fx1 - 0.04, 0, (fz0 + fz1) / 2, 0.08, 2.4, fz1 - fz0, 0, L);
    B.box('#3a3d42', (fx0 + fx1) / 2, 0, fz0 + 0.04, fx1 - fx0, 2.4, 0.08, 0, L);
    B.box('#cfd8dc', fx1 - 0.1, 0.25, (fz0 + fz1) / 2, 0.03, 1.9, 1.1, 0, { mat: 'litMetal', shadow: false, ao: 0 });
    B.box('#8c1d22', fx0 + 0.05, 0.1, fz0 + 0.5, 0.06, 2.2, 0.9, 0, L); // cortina recogida
    B.box('#9aa0a6', (fx0 + fx1) / 2, 2.35, (fz0 + fz1) / 2, fx1 - fx0, 0.04, 0.04, 0, LM);
    addBox(fx1 - 0.15, fx1, fz0, fz1, 2.4);
    addBox(fx0, fx1, fz0, fz0 + 0.12, 2.4);
    W.fitting = { x: 106.4, z: 20.3, yaw: -Math.PI / 2 };
    const D = decorKit(L, LM);
    // maniquíes junto al escaparate, mesa redonda, zapatero, puf, plantas y cuadros
    D.mannequin(99.1, 10.4, -Math.PI / 2, '#a8794a', '#1d1e22');
    D.mannequin(99.1, 17.6, -Math.PI / 2, '#2f4a73', '#b49a72');
    D.mannequin(104.6, 17.4, Math.PI, '#b3262b', '#1f2a44');
    B.add(GEO.cyl16, '#6b4f3a', 104.8, 0.4, 9.8, 1.3, 0.8, 1.3, 0, L);
    for (let i = 0; i < 6; i++) { const a = i * 1.05; B.box(COLS[(i * 3) % COLS.length], 104.8 + Math.cos(a) * 0.35, 0.8 + (i % 2) * 0.06, 9.8 + Math.sin(a) * 0.35, 0.34, 0.06, 0.28, a, L); }
    addBox(104.15, 105.45, 9.15, 10.45, 1);
    // zapatero contra la pared del fondo
    B.box('#e9e4dc', 108.3, 0, z0 + 0.3, 2.4, 1.6, 0.4, 0, L);
    for (let l = 0; l < 4; l++) for (let i = 0; i < 6; i++) B.box(['#1d1e22', '#e9e6df', '#a8794a', '#b3262b'][(i + l) % 4], 107.3 + i * 0.38, 0.12 + l * 0.38, z0 + 0.42, 0.26, 0.1, 0.28, 0, L);
    addBox(107.1, 109.5, z0, z0 + 0.6, 1.6);
    B.box('#c9a227', 103.6, 0, 20.6, 0.9, 0.42, 0.9, 0, L); addBox(103.15, 104.05, 20.15, 21.05, 0.5);
    D.plant(109.2, 21.2); D.plant(109.2, 16.4, 0.9);
    D.rug(102, 14, 3.2, 2.6, '#c9b79c');
    D.poster(100.6, 2.35, z1 - 0.06, Math.PI, 2.2, 0.8, ['#1d1d1f', '#c9a227', '#e9e4dc']);
    D.poster(100.6, 2.35, z0 + 0.06, 0, 2.2, 0.8, ['#c9a227', '#1d1d1f', '#e9e4dc']);
    D.poster(x1 - 0.06, 2.3, 9, -Math.PI / 2, 1.4, 0.9, ['#2f4a73', '#e9e4dc', '#b3262b']);
    hitbox(106.0, 1.1, 20.3, 1.6, 2.2, 2.4, {
      actions: () => [{ label: 'Entrar en el probador', fn: () => G.act.openClothes?.() }],
    });
  }

  // --- Vehículos: bici y patinete de exposición; los comprados salen al aparcamiento de la acera
  {
    const x0 = 98, x1 = 110, z0 = 38, z1 = 54;
    lot(x0, x1, z0, z1);
    const sh = walkInShop({ id: 'vehiculos', x0, x1, z0, z1, h: 5, wall: '#1f3b4d', trim: '#f2c14e', sign: 'RUEDA LIBRE', signBg: '#1f6f8b', awning: '#f2c14e', seed: 207, mapColor: '#2f6f8f', label: 'Bicis y patinetes', tint: '#eef2f4', floor: '#9aa4ab', counterColor: '#1f6f8b', hours: [10, 20], buyLabel: 'Ver bicis y patinetes', onBuy: () => G.act.openVehicleShop?.() });
    W.pois.vehiculos = sh;
    const { L, LM } = sh;
    // tarimas de exposición con un modelo de cada
    for (const [z, mk] of [[41.2, () => buildBike('#c0392b')], [50.8, () => buildScooter('#2e86de')]]) {
      B.add(GEO.cyl16, '#d9dde0', 103, 0.06, z, 2.2, 0.12, 2.2, 0, LM);
      const m = mk();
      m.position.set(103, 0.12, z);
      m.rotation.y = Math.PI / 2.6;
      m.userData.display = true;
      scene.add(m);
      addBox(101.9, 104.1, z - 1.1, z + 1.1, 0.8);
    }
    // pared de cascos y repuestos
    sh.shelfUnit(108.6, z1 - 0.35, 2.2, 4, 0.35, Math.PI, '#2a2d31', true);
    const HC = ['#e74c3c', '#f1c40f', '#2ecc71', '#ecf0f1', '#34495e', '#9b59b6'];
    B.box('#5a5f66', 102, 1.74, z0 + 0.3, 5.2, 0.05, 0.42, 0, LM); // balda de los cascos
    for (let i = 0; i < 6; i++) B.add(GEO.sphere, HC[i], 100 + i * 0.8, 1.9, z0 + 0.3, 0.32, 0.26, 0.34, 0, L);
    // señal de aparcamiento en la acera
    for (const k of ['bici', 'patinete']) { const p = PARKING[k]; B.box('#f2f2f2', p.x, 0.012, p.z, 1.0, 0.01, 1.8, 0, { ao: 0 }); }
    const D = decorKit(L, LM);
    // bicis colgadas en la pared, taller de reparación, neumáticos, plantas y carteles
    for (const [x, col] of [[100.2, '#27ae60'], [102.2, '#f39c12']]) {
      const b = buildBike(col);
      b.position.set(x, 0.9, z1 - 0.35); b.rotation.set(0, Math.PI / 2, 0); b.scale.setScalar(0.95);
      b.userData.display = true; scene.add(b);
      B.box('#2a2d31', x, 1.95, z1 - 0.1, 0.1, 0.06, 0.4, 0, LM);
    }
    addBox(99, 103.4, z1 - 0.7, z1, 2.2);
    D.toolboard(107.6, 1.25, z0 + 0.06, 0, 2.4);
    B.box('#5a5f66', 107.6, 0.85, z0 + 0.45, 2.4, 0.06, 0.7, 0, LM);
    B.box('#3a3d42', 107.6, 0, z0 + 0.45, 2.3, 0.85, 0.6, 0, L);
    addBox(106.4, 108.8, z0, z0 + 0.8, 1);
    // soporte de reparación con una bici de verdad
    B.add(GEO.cyl8, '#c0392b', 105.4, 0.65, z0 + 1.6, 0.05, 1.3, 0.05, 0, LM);
    { const b = buildBike('#2e86de'); b.position.set(105.4, 0.35, z0 + 1.6); b.rotation.y = Math.PI / 2; b.userData.display = true; scene.add(b); addBox(104.8, 106, z0 + 1, z0 + 2.2, 1.2); }
    D.tires(109.3, 40.6, 5); D.tires(109.3, 41.4, 3);
    D.plant(98.7, z0 + 0.7); D.plant(98.7, z1 - 0.7);
    D.poster(x1 - 0.06, 2.2, 50.5, -Math.PI / 2, 1.6, 1.0, ['#1f6f8b', '#f2c14e', '#ecf0f1', '#2e86de']);
    D.poster(105.5, 2.4, z1 - 0.06, Math.PI, 1.4, 0.8, ['#f2c14e', '#1f3b4d', '#ecf0f1']);
    D.rug(103, 46, 3.4, 2.2, '#2a3a46');
    // fila de bicis nuevas a la venta junto a la pared
    [['#8e44ad', 104.3], ['#2c3e50', 105.3], ['#e67e22', 106.3]].forEach(([col, x]) => { const b = buildBike(col); b.position.set(x, 0, z1 - 1.45); b.userData.display = true; scene.add(b); });
    addBox(103.9, 106.7, z1 - 2.2, z1 - 0.7, 1.1);
    B.box('#f2c14e', 105.3, 0, z1 - 2.45, 2.6, 0.04, 0.3, 0, { mat: 'glow' }); // franja en el suelo
    // banco para probarse los cascos
    B.box('#2a3a46', 100.2, 0.4, 40.6, 0.5, 0.08, 2, 0, L); for (const z of [39.8, 41.4]) B.box('#5a5f66', 100.2, 0, z, 0.4, 0.4, 0.06, 0, LM); addBox(99.95, 100.45, 39.6, 41.6, 0.5);
  }

  // --- Muebles: exposición con un ejemplar de cada mueble (los modelos los pone objects.js)
  {
    const x0 = 98, x1 = 110, z0 = 62, z1 = 78;
    lot(x0, x1, z0, z1);
    const sh = walkInShop({ id: 'muebles', x0, x1, z0, z1, h: 4.8, wall: '#c9b79c', trim: '#3b2f25', sign: 'MUEBLES NIDO', signBg: '#5a3d2b', awning: '#7a9a5a', seed: 208, mapColor: '#9a7a52', label: 'Muebles', tint: '#f3eee6', floor: '#b89a74', counterColor: '#5a3d2b', hours: [10, 21], buyLabel: 'Ver el catálogo' });
    W.pois.muebles = sh;
    const { L, LM } = sh;
    // alfombras bajo cada pieza expuesta
    W.showroom = [
      { type: 'bed', x: 101.6, z: 64.3, r: Math.PI / 2, rug: [2.6, 1.6] },
      { type: 'locker', x: 104.6, z: 77.4, r: Math.PI, rug: [1.6, 1.0] },
      { type: 'safe', x: 106.8, z: 77.2, r: Math.PI, rug: [1.0, 1.0] },
      { type: 'humid', x: 100.8, z: 76.6, r: 0, rug: [1.0, 1.0] },
    ];
    for (const it of W.showroom) {
      B.box('#8c5a3c', it.x, 0.02, it.z, it.rug[0], 0.015, it.rug[1], 0, L);
      const [w, d] = { bed: [1.1, 2.1], locker: [1.2, 0.6], safe: [0.7, 0.7], humid: [0.5, 0.5] }[it.type];
      const [fw, fd] = Math.abs(Math.sin(it.r)) > 0.5 ? [d, w] : [w, d];
      addBox(it.x - fw / 2, it.x + fw / 2, it.z - fd / 2, it.z + fd / 2, 1.1);
    }
    const D = decorKit(L, LM);
    // salón de exposición: sofá, sillón, mesa baja, lámpara y alfombra
    D.rug(102, 73.2, 3.4, 2.4, '#b5654a');
    D.sofa(102, 74.4, Math.PI, '#5b6b7d');
    D.armchair(99.5, 72.9, -Math.PI / 2, '#8a5a44');
    D.table(102, 72.7, 1.1, 0.6, 0.42, '#6b4f3a');
    D.floorLamp(99.3, 74.5);
    // comedor: mesa y cuatro sillas
    D.table(105.4, 64.8, 1.6, 0.9, 0.75, '#a57c4d');
    for (const [dx, dz, r] of [[-0.45, -0.75, 0], [0.45, -0.75, 0], [-0.45, 0.75, Math.PI], [0.45, 0.75, Math.PI]]) D.chair(105.4 + dx, 64.8 + dz, r, '#4a3524');
    addBox(104.4, 106.4, 63.8, 65.8, 0.9);
    D.bookcase(108.2, z0 + 0.2, 0, 1.8);
    D.bookcase(x1 - 0.2, 74.5, -Math.PI / 2, 1.6, 2, '#3a3d42');
    D.plant(98.7, z0 + 0.7, 1.1); D.plant(109.3, z1 - 0.7); D.plant(98.7, z1 - 2.2, 0.9);
    D.poster(102, 2.2, z1 - 0.06, Math.PI, 1.6, 0.9, ['#7a9a5a', '#e9e4dc', '#5a3d2b']);
    D.poster(x1 - 0.06, 2.3, 64.5, -Math.PI / 2, 1.2, 0.8, ['#5a3d2b', '#c9b79c', '#7a9a5a']);
    D.poster(101.6, 1.9, z0 + 0.06, 0, 1.0, 0.7, ['#e9e4dc', '#3f78c4', '#c0392b']);
  }
}

function buildPolice() {
  const com = building({ x0: -20, x1: -2, z0: -62, z1: -46, h: 7, wall: '#e8eaec', trim: '#2c4a7a', roof: '#4f5a66', style: 'office', front: '+z', sign: 'COMISARÍA', signBg: '#1f3a6b', signBorder: '#ffffff', seed: 301, mapColor: '#3d5f99', label: 'Comisaría' });
  W.pois.comisaria = com;
  building({ x0: 4, x1: 20, z0: -64, z1: -46, h: 9.6, wall: '#e3c9a0', trim: '#f3e7d4', roof: '#9a5b3c', style: 'office', front: '+z', sign: 'AYUNTAMIENTO', signBg: '#6e2c1f', seed: 302, mapColor: '#b48a64', label: 'Ayuntamiento' });
  paving(-23.5, 23.5, -46, -36.5);
  for (let x = -20; x <= -4; x += 4) B.box('#bdb6a8', x, 0, -45.6, 2.6, 0.2, 0.8);
  B.add(GEO.cyl8, '#d0d3d4', 1, 4, -42, 0.15, 8, 0.15, 0, { mat: 'metal' });
  B.box('#f1c40f', 1.8, 6.6, -42, 1.6, 0.5, 0.05, 0, { ao: 0 });
  B.box('#c0392b', 1.8, 7.1, -42, 1.6, 0.5, 0.05, 0, { ao: 0 });
  addBox(0.8, 1.2, -42.2, -41.8, 8);
  parkedCar(-16, -40, Math.PI / 2, '#1f3a6b', 'CopCar');
  parkedCar(-9, -40, Math.PI / 2, '#e8e8e4', 'CopCar');
  asphalt(-23.5, 23.5, -83.5, -66);
  for (let x = -18; x <= 18; x += 9) palm(x, -78);
  W.wander.push({ x: 10, z: -42 }, { x: -11, z: -44 });
  W.policeHQ = { x: -11, z: -43.5 };
}

// ------------------------------------------------------------------
//  Calle comercial: escaparates iluminados, neones y rótulos
// ------------------------------------------------------------------
const glowCache = new Map();
function glowPlane(text, w, h, opts) {
  const key = text + JSON.stringify(opts);
  if (!glowCache.has(key)) glowCache.set(key, new THREE.MeshBasicMaterial({ map: TX.glowTextTex(text, opts), transparent: true, depthWrite: false, toneMapped: false }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowCache.get(key));
  scene.add(m);
  return m;
}

// Tienda con fachada; el frente mira a +z (z = zf). Los locales se colocan en fila.
function storefront({ x0, x1, zf, depth = 12, h = 5, wall = '#3a3d42', name, sign, signStyle = 'box', signColor = '#1f9d55', signFg = '#ffffff', neon, awning, tint, seed = 1, upper = false }) {
  const w = x1 - x0, cx = (x0 + x1) / 2;
  const gh = 3.4; // altura del escaparate
  const R = Math.min(3.4, depth - 0.8); // fondo del local visible tras el cristal
  const zi = zf - R;
  // el edificio empieza detrás del local; encima del local, la fachada continúa
  building({ x0, x1, z0: zf - depth, z1: zi, h, wall, trim: '#5a5e64', roof: '#3b3e42', style: upper ? 'office' : 'plain', sideStyle: 'plain', front: '+z', noDoor: true, seed, mapColor: '#5a4f45', label: name });
  W.mapRects.push({ x0, x1, z0: zi, z1: zf, c: '#5a4f45' });
  addBox(x0, x1, zi, zf, gh + 1);
  B.box(wall, cx, gh, zf - R / 2, w, h - gh, R, 0, { ao: 0 });
  B.box(wall, x0 + 0.15, 0, zf - R / 2, 0.3, gh, R, 0, { ao: 0.2 });
  B.box(wall, x1 - 0.15, 0, zf - R / 2, 0.3, gh, R, 0, { ao: 0.2 });
  B.box('#1d2024', cx, gh - 0.1, zf + 0.04, w, 0.6, 0.12, 0, { ao: 0 }); // dintel
  shopInterior({ x0: x0 + 0.3, x1: x1 - 0.3, z0: zi, z1: zf - 0.1, hgt: gh - 0.1, name, tint: tint || '#f2efe8', seed });
  const glassW = w - 0.6;
  const glass = new THREE.Mesh(new THREE.PlaneGeometry(glassW, gh - 0.5), new THREE.MeshStandardMaterial({ color: 0xbfd2de, transparent: true, opacity: 0.16, roughness: 0.03, metalness: 0.9, depthWrite: false }));
  glass.position.set(cx, 0.35 + (gh - 0.5) / 2, zf + 0.2);
  scene.add(glass);
  W.shopGlass = W.shopGlass || [];
  W.shopGlass.push(glass);
  // carpintería metálica
  const n = Math.max(2, Math.round(glassW / 2.2));
  for (let i = 0; i <= n; i++) B.box('#121417', x0 + 0.3 + (i * glassW) / n, 0.3, zf + 0.22, 0.09, gh - 0.4, 0.08, 0, { mat: 'metal', ao: 0 });
  B.box('#121417', cx, 0.3, zf + 0.22, glassW, 0.09, 0.08, 0, { mat: 'metal', ao: 0 });
  B.box('#121417', cx, gh - 0.2, zf + 0.22, glassW, 0.12, 0.08, 0, { mat: 'metal', ao: 0 });
  // puerta de cristal con tirador
  const dx = x0 + 0.3 + glassW / n * 0.5;
  B.box('#c8ccd0', dx + 0.35, 1.0, zf + 0.26, 0.04, 0.5, 0.04, 0, { mat: 'metal', ao: 0 });
  // fluorescente de pared sobre el escaparate
  B.box('#2a2d31', cx, gh + 0.05, zf + 0.35, glassW * 0.6, 0.1, 0.25, 0, { mat: 'metal', ao: 0 });
  B.box('#fff7e6', cx, gh - 0.01, zf + 0.35, glassW * 0.58, 0.05, 0.18, 0, { mat: 'glow' });
  // toldo
  if (awning) {
    B.add(GEO.box, awning, cx, gh + 0.55, zf + 0.75, w - 0.2, 0.08, 1.5, 0, { rx: 0.28, ao: 0 });
    B.box(awning, cx, gh + 0.2, zf + 1.45, w - 0.2, 0.3, 0.05, 0, { ao: 0 });
  }
  // rótulo
  if (sign && signStyle === 'box') {
    const sm = signMesh(sign, Math.min(w * 0.7, 6), 1.1, { bg: signColor, fg: signFg, border: signColor, w: 512, h: 96, font: 'bold 62px sans-serif' });
    sm.position.set(cx, gh + 0.95, zf + 0.12);
    sm.material.emissiveIntensity = 0.6;
    W.signMats = W.signMats || [];
    W.signMats.push(sm.material);
  } else if (sign && signStyle === 'blade') {
    // cartel saliente tipo "24/7"
    const t = TX.signTex(sign, { bg: signColor, fg: signFg, border: '#ffffff', w: 256, h: 512, font: 'bold 150px sans-serif' });
    const mm = new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.7 });
    W.signMats = W.signMats || [];
    W.signMats.push(mm);
    const bm = new THREE.Mesh(new THREE.BoxGeometry(0.25, 2.4, 1.3), [plainMat('#222'), plainMat('#222'), plainMat('#222'), plainMat('#222'), mm, mm]);
    bm.rotation.y = Math.PI / 2;
    bm.position.set(x1 - 0.8, gh + 1.6, zf + 0.75);
    scene.add(bm);
    B.box('#222', x1 - 0.8, gh + 0.35, zf + 0.25, 0.08, 0.08, 1.1, 0, { mat: 'metal', ao: 0 });
  } else if (sign && signStyle === 'letters') {
    const lm = glowPlane(sign, Math.min(w * 0.9, 9), 1.5, { color: '#ffd84d', glow: '#ffae00', font: 'bold 120px sans-serif' });
    lm.position.set(cx, gh + 1.1, zf + 0.14);
  }
  if (neon) {
    const nm = glowPlane(neon.text, 1.2, 0.55, { color: neon.color || '#ff4d5e', glow: neon.glow || '#ff1f3d', border: neon.border || '#4da6ff', font: 'bold 120px sans-serif', w: 512, h: 240 });
    nm.position.set(x0 + 1.4, 1.9, zf + 0.15);
  }
  return { x: cx, z: zf + 1.3 };
}

// ------------------------------------------------------------------
//  Interiores de las tiendas (visibles a través del escaparate)
// ------------------------------------------------------------------
const PRODUCT_COLS = ['#d8402f', '#f2c230', '#2f7fd8', '#3fae5a', '#f28c28', '#ffffff', '#8e44ad', '#1abc9c', '#e84393', '#c0392b', '#f5e6c8', '#2c3e50'];
// Piezas para amueblar interiores de tiendas (estanterías con producto,
// mostrador, caja registradora, taburetes, mesas, neveras).
// ------------------------------------------------------------------
//  Decoración de interiores (muebles hechos con cajas y cilindros del lote estático:
//  apenas cuestan en el móvil). Giros en múltiplos de 90°; cada pieza grande choca.
// ------------------------------------------------------------------
function decorKit(L, LM) {
  const P = (x, z, ry) => { const c = Math.cos(ry), sn = Math.sin(ry); return (u, v) => [x + u * c + v * sn, z - u * sn + v * c]; };
  const solid = (x, z, w, d, ry, h = 1.1) => { const sw = Math.abs(Math.sin(ry)) > 0.5; addBox(x - (sw ? d : w) / 2, x + (sw ? d : w) / 2, z - (sw ? w : d) / 2, z + (sw ? w : d) / 2, h); };
  const k = {
    // planta grande en maceta
    plant(x, z, s = 1) {
      B.add(GEO.cyl12, '#d8d2c6', x, 0.22 * s, z, 0.42 * s, 0.44 * s, 0.42 * s, 0, L);
      B.add(GEO.cyl12, '#4a3524', x, 0.43 * s, z, 0.38 * s, 0.03, 0.38 * s, 0, L);
      for (let i = 0; i < 7; i++) { const a = i * 0.9; B.add(GEO.sphere, i % 2 ? '#3f7d3a' : '#4f9446', x + Math.cos(a) * 0.12 * s, (0.75 + (i % 3) * 0.22) * s, z + Math.sin(a) * 0.12 * s, 0.42 * s, 0.5 * s, 0.42 * s, a, { mat: 'foliage', ao: 0 }); }
      solid(x, z, 0.45 * s, 0.45 * s, 0, 1);
    },
    // cuadro o póster en una pared (ry = hacia dónde mira)
    poster(x, y, z, ry, w, h, cols) {
      const f = P(x, z, ry);
      B.box('#1d1f22', x, y - 0.03, z, w + 0.06, h + 0.06, 0.03, ry, L);
      const [a, b] = f(0, 0.02);
      B.box(cols[0], a, y, b, w, h, 0.02, ry, { mat: 'glow' });
      for (let i = 1; i < cols.length; i++) { const [cx, cz] = f((i - cols.length / 2) * w / cols.length * 0.9, 0.03); B.box(cols[i], cx, y + h * (0.15 + 0.15 * (i % 3)), cz, w / cols.length * 0.7, h * 0.35, 0.01, ry, { mat: 'glow' }); }
    },
    rug(x, z, w, d, col, ry = 0) { B.box(col, x, 0.026, z, w, 0.012, d, ry, { ...L, ao: 0 }); },
    sofa(x, z, ry, col = '#5b6b7d', seats = 3) {
      const f = P(x, z, ry), w = 0.75 * seats + 0.3;
      B.box(col, x, 0.12, z, w, 0.32, 0.9, ry, L);
      const [bx, bz] = f(0, -0.36); B.box(col, bx, 0.12, bz, w, 0.78, 0.2, ry, L);
      for (const s of [-1, 1]) { const [ax, az] = f(s * (w / 2 - 0.1), 0); B.box(col, ax, 0.12, az, 0.2, 0.55, 0.9, ry, L); }
      for (let i = 0; i < seats; i++) { const [cx, cz] = f(-w / 2 + 0.15 + 0.375 + i * 0.75, 0.05); B.box(new THREE.Color(col).offsetHSL(0, 0, 0.06).getStyle(), cx, 0.44, cz, 0.7, 0.12, 0.7, ry, L); }
      for (const s of [-1, 1]) for (const t of [-1, 1]) { const [lx, lz] = f(s * (w / 2 - 0.1), t * 0.35); B.box('#2a2d31', lx, 0, lz, 0.06, 0.12, 0.06, ry, LM); }
      solid(x, z, w, 0.9, ry, 0.8);
    },
    armchair(x, z, ry, col = '#8a5a44') { k.sofa(x, z, ry, col, 1); },
    table(x, z, w, d, h = 0.75, col = '#8a6a4a', ry = 0) {
      const f = P(x, z, ry);
      B.box(col, x, h - 0.05, z, w, 0.05, d, ry, L);
      for (const s of [-1, 1]) for (const t of [-1, 1]) { const [lx, lz] = f(s * (w / 2 - 0.06), t * (d / 2 - 0.06)); B.box('#3a3d42', lx, 0, lz, 0.05, h - 0.05, 0.05, ry, LM); }
      solid(x, z, w, d, ry, h);
    },
    chair(x, z, ry, col = '#3a3d42') {
      const f = P(x, z, ry);
      B.box(col, x, 0.44, z, 0.44, 0.05, 0.44, ry, L);
      const [bx, bz] = f(0, -0.2); B.box(col, bx, 0.44, bz, 0.44, 0.5, 0.05, ry, L);
      for (const s of [-1, 1]) for (const t of [-1, 1]) { const [lx, lz] = f(s * 0.18, t * 0.18); B.box('#2a2d31', lx, 0, lz, 0.04, 0.44, 0.04, ry, LM); }
    },
    floorLamp(x, z, shade = '#f3e6c4') {
      B.add(GEO.cyl12, '#2a2d31', x, 0.02, z, 0.32, 0.04, 0.32, 0, LM);
      B.add(GEO.cyl8, '#2a2d31', x, 0.8, z, 0.03, 1.6, 0.03, 0, LM);
      B.add(GEO.cyl12, shade, x, 1.65, z, 0.42, 0.3, 0.42, 0, { mat: 'glow' });
      solid(x, z, 0.3, 0.3, 0, 1.8);
    },
    // estantería de libros/objetos contra una pared
    bookcase(x, z, ry, w = 1.6, h = 2, col = '#6b4f3a') {
      const f = P(x, z, ry);
      B.box(col, x, 0, z, w, h, 0.36, ry, L);
      const BOOK = ['#c0392b', '#2e86de', '#f1c40f', '#27ae60', '#8e44ad', '#ecf0f1', '#d35400', '#34495e'];
      for (let l = 0; l < 4; l++) {
        const y = 0.12 + l * (h / 4);
        let u = -w / 2 + 0.1, i = l * 3;
        while (u < w / 2 - 0.12) { const bw = 0.05 + ((i * 37) % 5) * 0.012, bh = 0.22 + ((i * 13) % 4) * 0.03; const [bx, bz] = f(u + bw / 2, 0.19); B.box(BOOK[i % BOOK.length], bx, y, bz, bw, bh, 0.2, ry, L); u += bw + 0.01; i++; if (i % 7 === 0) u += 0.15; }
      }
      solid(x, z, w, 0.36, ry, h);
    },
    // maniquí con la ropa puesta
    mannequin(x, z, ry, top = '#b3262b', legs = '#1f2a44') {
      B.add(GEO.cyl12, '#2a2d31', x, 0.02, z, 0.4, 0.04, 0.4, 0, LM);
      B.add(GEO.cyl8, '#9aa0a6', x, 0.45, z, 0.03, 0.9, 0.03, 0, LM);
      for (const s of [-1, 1]) { const [lx, lz] = P(x, z, ry)(s * 0.1, 0); B.add(GEO.cyl8, legs, lx, 0.62, lz, 0.13, 0.8, 0.13, 0, L); }
      B.add(GEO.cyl12, top, x, 1.28, z, 0.42, 0.62, 0.26, ry, L);
      for (const s of [-1, 1]) { const [ax, az] = P(x, z, ry)(s * 0.25, 0); B.add(GEO.cyl8, top, ax, 1.22, az, 0.1, 0.55, 0.1, 0, L); }
      B.add(GEO.sphere, '#e8e2d6', x, 1.78, z, 0.22, 0.26, 0.22, 0, L);
      solid(x, z, 0.5, 0.5, 0, 1.9);
    },
    // perchero de pared con prendas colgadas
    wallRail(x, z, ry, len, cols) {
      const f = P(x, z, ry);
      const [rx, rz] = f(0, 0.3);
      B.add(GEO.cyl8, '#9aa0a6', rx, 1.55, rz, 0.03, len, 0.03, ry + Math.PI / 2, { ...LM, rz: Math.PI / 2 });
      let i = 0;
      for (let u = -len / 2 + 0.12; u < len / 2 - 0.08; u += 0.12) { const [cx, cz] = f(u, 0.3); B.box(cols[(i++ * 5) % cols.length], cx, 0.85, cz, 0.04, 0.68, 0.44, ry + Math.PI / 2, L); }
      solid(x + (f(0, 0.3)[0] - x), z + (f(0, 0.3)[1] - z), len, 0.5, ry, 1.6);
    },
    tv(x, y, z, ry) { B.box('#111316', x, y, z, 1.2, 0.7, 0.05, ry, LM); const [a, b] = P(x, z, ry)(0, 0.03); B.box('#2b5f8a', a, y + 0.04, b, 1.1, 0.62, 0.01, ry, { mat: 'glow' }); },
    tires(x, z, n = 4) { for (let i = 0; i < n; i++) B.add(GEO.cyl16, '#1b1c1e', x, 0.1 + i * 0.2, z, 0.62, 0.18, 0.62, 0, L); solid(x, z, 0.62, 0.62, 0, n * 0.2); },
    // tablero de herramientas en una pared
    toolboard(x, y, z, ry, w = 1.6) {
      B.box('#c9a477', x, y, z, w, 0.9, 0.03, ry, L);
      const f = P(x, z, ry);
      for (let i = 0; i < 7; i++) { const [tx, tz] = f(-w / 2 + 0.18 + i * (w - 0.3) / 6, 0.03); B.box(['#c0392b', '#2c3e50', '#f39c12', '#7f8c8d'][i % 4], tx, y + 0.15 + (i % 3) * 0.12, tz, 0.05, 0.3 + (i % 2) * 0.15, 0.03, ry, LM); }
    },
    coatRack(x, z) { B.add(GEO.cyl8, '#4a3524', x, 0.9, z, 0.04, 1.8, 0.04, 0, L); B.add(GEO.cyl12, '#4a3524', x, 0.02, z, 0.36, 0.04, 0.36, 0, L); B.box('#2c3e50', x + 0.08, 1.2, z, 0.08, 0.5, 0.3, 0, L); solid(x, z, 0.36, 0.36, 0, 1.8); },
  };
  return k;
}

function interiorKit(seed) {
  let r = seed * 9301 + 49297;
  const rand = () => { r = (r * 9301 + 49297) % 233280; return r / 233280; };
  const L = { mat: 'lit', shadow: false, ao: 0.15 };
  const LM = { mat: 'litMetal', shadow: false, ao: 0 };
  // balda llena de productos reales: grupos de 1-4 iguales, de cara al pasillo
  const stockShelf = (P, len, y, ry, pool) => {
    let u = -len / 2 + 0.05;
    while (u < len / 2 - 0.08) {
      const name = pool[Math.floor(rand() * pool.length)], sz = propSize(name);
      const w = sz.x + 0.012, n = 1 + Math.floor(rand() * 4);
      for (let k = 0; k < n && u + w < len / 2 - 0.03; k++) {
        const [px, pz] = P(u + w / 2, (rand() - 0.5) * 0.04);
        addProp(name, px, y, pz, ry + (rand() - 0.5) * 0.15);
        u += w;
      }
      u += 0.03 + rand() * 0.04;
    }
  };
  const shelfUnit = (x, z, len, levels, depthS, ry, color = '#e8e8e8', items = true, pool = null) => {
    // estantería con baldas y productos
    const c = Math.cos(ry), sn = Math.sin(ry);
    const P = (u, v) => [x + u * c + v * sn, z - u * sn + v * c];
    for (const u of [-len / 2, len / 2]) { const [px, pz] = P(u, 0); B.box('#9aa0a6', px, 0, pz, 0.05, levels * 0.42 + 0.2, depthS, ry, LM); }
    for (let l = 0; l < levels; l++) {
      const y = 0.12 + l * 0.42;
      B.box(color, x, y, z, len, 0.04, depthS, ry, LM);
      if (!items) continue;
      if (typeof pool === 'function') { pool(P, len, y + 0.02, ry); continue; }
      if (pool && propsReady()) { stockShelf(P, len, y + 0.02, ry, pool); continue; }
      let u = -len / 2 + 0.06;
      while (u < len / 2 - 0.08) {
        const bw = 0.07 + rand() * 0.1, bh = 0.12 + rand() * 0.2, col = PRODUCT_COLS[Math.floor(rand() * PRODUCT_COLS.length)];
        const n = 1 + Math.floor(rand() * 3);
        for (let k = 0; k < n && u < len / 2 - 0.08; k++) {
          const [px, pz] = P(u + bw / 2, (rand() - 0.5) * 0.05);
          if (rand() < 0.3) B.add(GEO.cyl8, col, px, y + 0.02 + bh / 2, pz, bw, bh, bw, 0, L);
          else B.box(col, px, y + 0.02, pz, bw, bh, depthS * 0.7, ry, L);
          u += bw + 0.012;
        }
        u += 0.02;
      }
    }
  };
  const counter = (x, z, len, color = '#6b4f3a', top = '#d9d4cc', ry = 0) => {
    B.box(color, x, 0, z, len, 0.95, 0.6, ry, L);
    B.box(top, x, 0.95, z, len + 0.06, 0.05, 0.66, ry, LM);
  };
  const register = (x, z) => {
    B.box('#2b2e33', x, 1.0, z, 0.38, 0.12, 0.32, 0, LM);
    B.box('#1d2024', x, 1.12, z - 0.05, 0.3, 0.2, 0.04, -0.3, LM);
    B.box('#5fd0ff', x, 1.14, z - 0.03, 0.26, 0.15, 0.01, -0.3, { mat: 'glow' });
  };
  const stool = (x, z, h = 0.75, seat = '#b03a2e') => {
    B.add(GEO.cyl8, '#8a8f96', x, h / 2, z, 0.06, h, 0.06, 0, LM);
    B.add(GEO.cyl12, seat, x, h, z, 0.36, 0.07, 0.36, 0, L);
  };
  const table = (x, z, top = '#e0d6c4', item = null) => {
    if (item && propsReady()) addProp(item, x + 0.1, 0.77, z - 0.05, rand() * 6);
    B.add(GEO.cyl8, '#3a3d42', x, 0.37, z, 0.07, 0.74, 0.07, 0, LM);
    B.add(GEO.cyl16, top, x, 0.75, z, 0.75, 0.04, 0.75, 0, L);
    for (const a of [0.6, 0.6 + Math.PI]) {
      const sx = x + Math.cos(a) * 0.55, sz = z + Math.sin(a) * 0.55;
      B.box('#4a3628', sx, 0.44, sz, 0.38, 0.04, 0.38, a, L);
      B.box('#4a3628', sx + Math.cos(a) * 0.17, 0.44, sz + Math.sin(a) * 0.17, 0.04, 0.42, 0.38, a, L);
      for (const o of [-0.15, 0.15]) B.box('#2a2d31', sx + o, 0, sz, 0.03, 0.44, 0.03, 0, LM);
    }
  };

  // nevera de bebidas con puerta de cristal iluminada (frente hacia ry)
  const fridge = (x, z, ry = 0) => {
    const c = Math.cos(ry), sn = Math.sin(ry);
    const P = (u, v) => [x + u * c + v * sn, z - u * sn + v * c];
    B.box('#d9dde1', x, 0, z, 0.88, 2.1, 0.7, ry, LM);
    const [gx, gz] = P(0, 0.36);
    B.box('#bfe6ff', gx, 0.15, gz, 0.78, 1.8, 0.02, ry, { mat: 'glow' });
    for (let l = 0; l < 5; l++) {
      const [bx, bz] = P(0, 0.05);
      B.box('#cfd6dc', bx, 0.18 + l * 0.36, bz, 0.8, 0.02, 0.5, ry, LM);
      const kind = ['soda-can', 'soda-bottle', 'carton-small', 'soda-can', 'carton'][l];
      if (propsReady()) { const sw = propSize(kind).x + 0.01; for (let k = 0; (k + 1) * sw < 0.72; k++) { const [px, pz] = P(-0.34 + sw / 2 + k * sw, 0.15); addProp(kind, px, 0.2 + l * 0.36, pz, ry); } }
    }
  };
  return { rand, L, LM, stockShelf, shelfUnit, counter, register, stool, table, fridge };
}

function shopInterior({ x0, x1, z0, z1, hgt, name, tint, seed }) {
  const w = x1 - x0, d = z1 - z0, cx = (x0 + x1) / 2;
  const { rand, L, LM, stockShelf, shelfUnit, counter, register, stool, table, fridge } = interiorKit(seed);
  const kind = /Súper|24/.test(name) ? 'super' : /Bar/.test(name) ? 'bar' : /Empeñ/.test(name) ? 'pawn' : /Armer/.test(name) ? 'gun' : /Casino/.test(name) ? 'casino' : /Café/.test(name) ? 'cafe' : /Lava/.test(name) ? 'laundry' : /Farmac/.test(name) ? 'pharma' : /Taquer/.test(name) ? 'taco' : 'super';
  const floor = { super: '#d9d4c8', bar: '#5a3a24', pawn: '#6b5a48', gun: '#5b5346', casino: '#7a1022', cafe: '#a87a50', laundry: '#e6e9ec', pharma: '#eef1f0', taco: '#c9b28c' }[kind];
  // suelo (baldosas a cuadros), paredes y techo
  for (let i = 0; i < Math.ceil(w / 0.6); i++) for (let j = 0; j < Math.ceil(d / 0.6); j++) {
    const c = (i + j) % 2 ? floor : new THREE.Color(floor).multiplyScalar(0.86).getStyle();
    B.box(c, x0 + 0.3 + i * 0.6, 0.0, z0 + 0.3 + j * 0.6, 0.6, 0.03, 0.6, 0, L);
  }
  const wallC = new THREE.Color(tint).multiplyScalar(0.92).getStyle();
  B.box(wallC, cx, 0, z0 + 0.05, w, hgt, 0.1, 0, L); // fondo
  B.box(wallC, x0 + 0.05, 0, (z0 + z1) / 2, 0.1, hgt, d, 0, L);
  B.box(wallC, x1 - 0.05, 0, (z0 + z1) / 2, 0.1, hgt, d, 0, L);
  B.box('#e9e6df', cx, hgt - 0.06, (z0 + z1) / 2, w, 0.06, d, 0, L); // techo
  B.box('#3a3d42', cx, 0.03, z0 + 0.12, w, 0.14, 0.04, 0, L); // rodapié
  // paneles de luz en el techo
  for (let i = 0; i < Math.max(1, Math.floor(w / 2.6)); i++) {
    const lx = x0 + (i + 0.5) * (w / Math.max(1, Math.floor(w / 2.6)));
    B.box('#fffaf0', lx, hgt - 0.1, (z0 + z1) / 2, 1.2, 0.04, 0.3, 0, { mat: 'glow' });
  }
  const clerk = (x, z) => { (W.clerks = W.clerks || []).push({ x, z, yaw: 0, kind }); };
  if (kind === 'super') {
    // neveras al fondo con puertas de cristal iluminadas
    const nf = Math.floor((w - 2.2) / 0.9);
    for (let i = 0; i < nf; i++) {
      const fx = x0 + 0.5 + i * 0.9 + 0.45;
      B.box('#d9dde1', fx, 0, z0 + 0.45, 0.88, 2.1, 0.7, 0, LM);
      B.box('#bfe6ff', fx, 0.15, z0 + 0.81, 0.78, 1.8, 0.02, 0, { mat: 'glow' });
      if (propsReady()) {
        for (let l = 0; l < 5; l++) { const kind = ['soda-can', 'soda-bottle', 'carton-small', 'soda-can', 'carton'][l]; const sw = propSize(kind).x + 0.01; for (let k = 0; k * sw < 0.7; k++) addProp(kind, fx - 0.33 + sw / 2 + k * sw, 0.2 + l * 0.36, z0 + 0.6, 0); }
        for (let l = 0; l < 5; l++) B.box('#cfd6dc', fx, 0.18 + l * 0.36, z0 + 0.5, 0.8, 0.02, 0.5, 0, LM); // baldas de la nevera
      } else for (let l = 0; l < 5; l++) for (let k = 0; k < 5; k++) B.add(GEO.cyl8, PRODUCT_COLS[Math.floor(rand() * 12)], fx - 0.3 + k * 0.15, 0.3 + l * 0.36, z0 + 0.62, 0.08, 0.24, 0.08, 0, L);
    }
    // góndolas
    // góndola de doble cara paralela al escaparate
    const gl = w - 3.6, gx = x0 + 0.4 + gl / 2;
    const SUPER = ['soda-can', 'soda-bottle', 'bottle-ketchup', 'bottle-musterd', 'bottle-oil', 'carton', 'carton-small', 'can', 'can-small', 'peanut-butter', 'honey', 'bag', 'chocolate', 'candy-bar', 'loaf'];
    shelfUnit(gx, z0 + 2.05, gl, 4, 0.36, 0, '#f0f0f0', true, SUPER);
    shelfUnit(gx, z0 + 1.66, gl, 4, 0.36, Math.PI, '#f0f0f0', true, SUPER);
    B.box('#d8402f', gx, 1.75, z0 + 1.86, gl, 0.22, 0.04, 0, L); // cartel de pasillo
    counter(x1 - 1.2, z1 - 1.0, 1.6, '#2e7d4f', '#e8e8e8');
    register(x1 - 0.9, z1 - 1.0);
    clerk(x1 - 1.2, z1 - 1.75);
    if (propsReady()) for (let i = 0; i < 4; i++) addProp(i % 2 ? 'candy-bar' : 'chocolate', x1 - 1.75 + (i % 2) * 0.12, 0.98 + Math.floor(i / 2) * 0.03, z1 - 1.05 + Math.floor(i / 2) * 0.1, 0.1); // chocolatinas junto a la caja
    else B.box('#f2c230', x1 - 1.6, 1.0, z1 - 1.0, 0.5, 0.25, 0.35, 0, L); // chicles
    B.box('#ffd84d', cx, hgt - 0.6, z0 + 0.12, Math.min(3, w * 0.4), 0.35, 0.02, 0, { mat: 'glow' }); // cartel ofertas
  } else if (kind === 'bar') {
    counter(cx + 0.6, z0 + 1.4, w - 2.4, '#4a2c1a', '#2b1a10');
    clerk(cx + 0.2, z0 + 0.75);
    for (let i = 0; i < 4; i++) stool(x0 + 1.6 + i * ((w - 3) / 3), z0 + 2.05);
    // botellero iluminado
    B.box('#2b1a10', cx + 0.6, 1.0, z0 + 0.2, w - 2.4, 1.6, 0.3, 0, L);
    B.box('#ffb347', cx + 0.6, 1.02, z0 + 0.36, w - 2.5, 0.02, 0.02, 0, { mat: 'glow' });
    for (let l = 0; l < 3; l++) for (let x = x0 + 1.5; x < x1 - 0.5; x += 0.13) {
      if (propsReady()) { addProp(['wine-red', 'wine-white', 'soda-bottle', 'bottle-oil'][Math.floor(rand() * 4)], x, 1.04 + l * 0.5, z0 + 0.25, rand() * 6); continue; }
      const col = ['#2e6b30', '#7a3b12', '#c9c9c9', '#3d2a14', '#9b1b30', '#e3c46a'][Math.floor(rand() * 6)];
      B.add(GEO.cyl8, col, x, 1.17 + l * 0.5, z0 + 0.25, 0.07, 0.28, 0.07, 0, L);
      B.add(GEO.cyl8, col, x, 1.36 + l * 0.5, z0 + 0.25, 0.025, 0.1, 0.025, 0, L);
    }
    if (propsReady()) for (let i = 0; i < 5; i++) addProp('glass', x0 + 1.4 + i * ((w - 3) / 4), 0.98, z0 + 1.45, rand() * 6); // vasos en la barra
    B.box('#16191c', x0 + 0.6, 1.4, z0 + 0.1, 1.0, 0.6, 0.06, 0, LM); // tele
    B.box('#3a7bd5', x0 + 0.6, 1.43, z0 + 0.14, 0.92, 0.52, 0.01, 0, { mat: 'glow' });
    table(x0 + 1.0, z1 - 0.9, '#3d2a14', 'glass');
  } else if (kind === 'pawn') {
    // vitrinas con objetos y guitarras colgadas
    for (const vx of [x0 + 1.4, cx + 0.9]) {
      B.box('#3a2a1e', vx, 0, z1 - 1.2, 2.2, 0.55, 0.6, 0, L);
      B.box('#cfe6f0', vx, 0.55, z1 - 1.2, 2.2, 0.4, 0.6, 0, { mat: 'glass', shadow: false, ao: 0 });
      for (let i = 0; i < 6; i++) B.box(['#d4af37', '#c0c0c0', '#1d1d1d', '#8e44ad'][i % 4], vx - 0.9 + i * 0.36, 0.6, z1 - 1.2 + (rand() - 0.5) * 0.3, 0.14, 0.05, 0.1, rand(), LM);
    }
    for (let i = 0; i < 4; i++) {
      const gx = x0 + 0.8 + i * 0.75, col = ['#a0522d', '#c0392b', '#1d1d1d', '#e3c46a'][i];
      B.add(GEO.cyl16, col, gx, 1.25, z0 + 0.18, 0.38, 0.08, 0.46, 0, { ...L, rx: Math.PI / 2 });
      B.add(GEO.cyl16, col, gx, 1.6, z0 + 0.18, 0.3, 0.08, 0.34, 0, { ...L, rx: Math.PI / 2 });
      B.box('#3a2a1e', gx, 1.7, z0 + 0.18, 0.06, 0.75, 0.04, 0, L);
    }
    shelfUnit(x1 - 1.4, z0 + 0.35, 2.2, 4, 0.4, 0, '#5a4636', true, ['glass', 'wine-red', 'wine-white', 'cup-coffee', 'honey']);
    B.box('#16191c', x1 - 1.4, 1.75, z0 + 0.4, 0.8, 0.5, 0.25, 0, LM);
  } else if (kind === 'gun') {
    // armero: panel de rifles al fondo, vitrina-mostrador con armas cortas y cajas
    B.box('#6b5236', cx, 0.9, z0 + 0.12, w - 1.2, 1.9, 0.06, 0, L); // panel de madera
    for (let i = 0; i < 7; i++) {
      const gx = x0 + 1.0 + i * ((w - 2) / 6);
      B.box('#2b2e33', gx, 1.0, z0 + 0.2, 0.07, 1.25, 0.06, 0.06, LM); // cañón
      B.box('#4a3322', gx, 0.95, z0 + 0.2, 0.12, 0.42, 0.07, 0, L); // culata
    }
    B.box('#c9a227', cx, 2.25, z0 + 0.14, 2.2, 0.25, 0.03, 0, { mat: 'glow' }); // rótulo interior
    counter(cx + 0.6, z1 - 1.4, 3.4, '#3a2a1e', '#2c2f33');
    B.box('#cfe6f0', cx + 0.6, 0.95, z1 - 1.4, 3.2, 0.3, 0.5, 0, { mat: 'glass', shadow: false, ao: 0 });
    for (let i = 0; i < 6; i++) B.box('#1d1f22', cx - 0.8 + i * 0.5, 0.9, z1 - 1.4 + (i % 2 ? 0.1 : -0.1), 0.28, 0.05, 0.14, rand() * 0.6, LM);
    for (let i = 0; i < 4; i++) B.box(['#4b5320', '#6b6b3a', '#3d4136', '#556b2f'][i], x1 - 0.7, i * 0.32, z0 + 0.9 + (i % 2) * 0.1, 0.6, 0.3, 0.45, rand() * 0.3, L); // cajas de munición
    clerk(cx + 0.6, z1 - 2.1);
  } else if (kind === 'casino') {
    // moqueta roja, tragaperras con pantallas encendidas y una mesa de ruleta
    for (let i = 0; i < Math.floor((w - 1) / 1.05); i++) {
      const sx = x0 + 0.8 + i * 1.05;
      B.box('#1c1c22', sx, 0, z0 + 0.45, 0.8, 1.55, 0.6, 0, LM);
      B.box(['#ff2d95', '#ffd700', '#21d4fd', '#7dff6a'][i % 4], sx, 1.0, z0 + 0.76, 0.6, 0.38, 0.02, 0, { mat: 'glow' });
      B.box('#d4af37', sx, 1.55, z0 + 0.45, 0.8, 0.12, 0.6, 0, LM);
      B.box('#2b2b30', sx, 0.55, z0 + 0.8, 0.7, 0.08, 0.2, 0, LM);
    }
    B.add(GEO.cyl16, '#5a3a24', cx + 0.4, 0, z1 - 1.3, 1.9, 0.82, 1.2, 0, L);
    B.add(GEO.cyl16, '#0d6b3a', cx + 0.4, 0.82, z1 - 1.3, 1.8, 0.04, 1.1, 0, L);
    B.add(GEO.cyl16, '#3a2a1e', cx + 0.9, 0.86, z1 - 1.3, 0.5, 0.06, 0.5, 0, LM);
    B.add(GEO.cyl16, '#d4af37', cx + 0.9, 0.92, z1 - 1.3, 0.12, 0.08, 0.12, 0, LM);
    for (let i = 0; i < 3; i++) { B.add(GEO.cyl8, '#2b2b2b', x0 + 1.2 + i * 2.2, hgt - 0.4, (z0 + z1) / 2, 0.02, 0.6, 0.02, 0, LM); B.add(GEO.sphere, '#ffcf7a', x0 + 1.2 + i * 2.2, hgt - 0.75, (z0 + z1) / 2, 0.3, 0.16, 0.3, 0, { mat: 'glow' }); }
    clerk(cx + 0.4, z1 - 2.2);
  } else if (kind === 'cafe') {
    counter(x1 - 1.8, z0 + 1.2, 2.6, '#6b4226', '#e8e0d4');
    B.box('#b0b5ba', x1 - 2.4, 1.0, z0 + 1.2, 0.5, 0.45, 0.4, 0, LM); // cafetera
    clerk(x1 - 1.6, z0 + 0.6);
    B.box('#2b2e33', x1 - 2.4, 1.15, z0 + 1.41, 0.4, 0.06, 0.02, 0, LM);
    B.box('#cfe6f0', x1 - 1.2, 0.95, z0 + 1.2, 1.0, 0.35, 0.5, 0, { mat: 'glass', shadow: false, ao: 0 }); // vitrina
    if (propsReady()) { const P2 = ['croissant', 'donut-chocolate', 'donut-sprinkles', 'muffin', 'cupcake', 'croissant']; for (let i = 0; i < 6; i++) addProp(P2[i], x1 - 1.62 + i * 0.16, 0.99, z0 + 1.2 + (i % 2 ? 0.08 : -0.08), rand() * 6); }
    else for (let i = 0; i < 5; i++) B.add(GEO.cyl12, ['#c68642', '#f5deb3', '#8b4513', '#e8b4b8'][i % 4], x1 - 1.6 + i * 0.2, 1.02, z0 + 1.2, 0.14, 0.06, 0.14, 0, L);
    B.box('#1d2a22', x1 - 1.8, 1.7, z0 + 0.12, 1.8, 0.8, 0.04, 0, L); // pizarra menú
    for (let i = 0; i < 4; i++) B.box('#f0ede6', x1 - 2.4 + (i % 2) * 0.9, 1.8 + Math.floor(i / 2) * 0.3, z0 + 0.15, 0.6, 0.04, 0.01, 0, { mat: 'glow' });
    table(x0 + 1.0, z1 - 0.9, '#f0ede6', 'cup-coffee');
    table(x0 + 2.6, z0 + 1.1, '#f0ede6', 'cup-coffee');
    for (let i = 0; i < 3; i++) { B.add(GEO.cyl8, '#2b2b2b', x0 + 1 + i * 1.3, hgt - 0.5, z1 - 1.0, 0.02, 0.8, 0.02, 0, LM); B.add(GEO.sphere, '#ffcf7a', x0 + 1 + i * 1.3, hgt - 0.95, z1 - 1.0, 0.22, 0.2, 0.22, 0, { mat: 'glow' }); }
  } else if (kind === 'laundry') {
    for (let i = 0; i < Math.floor((w - 0.6) / 0.72); i++) {
      const mx = x0 + 0.45 + i * 0.72;
      for (const yy of [0, 0.86]) {
        B.box('#f4f6f8', mx, yy, z0 + 0.45, 0.68, 0.84, 0.66, 0, LM);
        B.add(GEO.cyl16, '#3b4a57', mx, yy + 0.44, z0 + 0.79, 0.44, 0.03, 0.44, 0, { ...LM, rx: Math.PI / 2 });
        B.add(GEO.cyl16, '#8fc7e8', mx, yy + 0.44, z0 + 0.8, 0.34, 0.02, 0.34, 0, { mat: 'glow', rx: Math.PI / 2 });
        B.box('#2b2e33', mx, yy + 0.74, z0 + 0.79, 0.5, 0.06, 0.01, 0, LM);
      }
    }
    B.box('#2b7bd1', cx, 0, z1 - 0.9, w - 2, 0.45, 0.45, 0, L); // banco
    B.box('#d6e6ef', cx, 0.9, z1 - 0.5, 1.4, 0.04, 0.5, 0, L); // mesa plegar
    for (let i = 0; i < 3; i++) B.box(['#e74c3c', '#f1c40f', '#ecf0f1'][i], cx - 0.4 + i * 0.35, 0.94, z1 - 0.5, 0.3, 0.1 + i * 0.03, 0.3, rand(), L);
  } else if (kind === 'pharma') {
    shelfUnit(cx, z0 + 0.35, w - 0.8, 5, 0.38, 0, '#ffffff');
    counter(cx, z1 - 1.2, w - 2.4, '#ffffff', '#1e8e4f');
    register(cx + 0.8, z1 - 1.2);
    clerk(cx + 0.4, z1 - 1.9);
    B.box('#2ecc71', cx - 0.8, 1.9, z0 + 0.12, 0.5, 0.15, 0.02, 0, { mat: 'glow' });
    B.box('#2ecc71', cx - 0.8, 1.725, z0 + 0.12, 0.15, 0.5, 0.02, 0, { mat: 'glow' });
  } else if (kind === 'taco') {
    counter(cx, z0 + 1.1, w - 1.6, '#c0392b', '#e0e0e0');
    B.box('#7f8c8d', cx - 1.2, 0.98, z0 + 0.4, 1.4, 0.06, 0.5, 0, LM); // plancha
    B.add(GEO.cyl8, '#8b4513', cx + 1.2, 1.4, z0 + 0.5, 0.35, 0.7, 0.35, 0, L); // trompo
    clerk(cx, z0 + 0.5);
    B.box('#ffd84d', cx, hgt - 0.85, z0 + 0.12, w - 1.6, 0.55, 0.03, 0, { mat: 'glow' }); // menú
    for (let i = 0; i < 4; i++) B.box(['#c0392b', '#2f8f4f', '#f39c12', '#ffffff'][i], cx - 1.8 + i * 1.2, hgt - 0.78, z0 + 0.15, 0.9, 0.08, 0.01, 0, L);
    table(x0 + 1.0, z1 - 0.8, '#2f8f4f', 'taco');
    table(x1 - 1.0, z1 - 0.8, '#2f8f4f', 'taco');
  }
}

function trashCan(x, z) {
  B.add(GEO.cyl12, '#23272b', x, 0.5, z, 0.62, 1.0, 0.62, 0, { mat: 'metal' });
  B.add(GEO.cyl12, '#16191c', x, 1.03, z, 0.68, 0.08, 0.68, 0, { mat: 'metal', ao: 0 });
  addBox(x - 0.32, x + 0.32, z - 0.32, z + 0.32, 1.1);
}

function hydrant(x, z) {
  B.add(GEO.cyl12, '#e2b021', x, 0.38, z, 0.32, 0.76, 0.32, 0, { mat: 'metal' });
  B.add(GEO.sphere, '#e2b021', x, 0.8, z, 0.34, 0.26, 0.34, 0, { mat: 'metal', ao: 0 });
  B.add(GEO.cyl8, '#e2b021', x, 0.52, z, 0.56, 0.12, 0.12, 0, { mat: 'metal', ao: 0 });
  B.add(GEO.cyl8, '#c99a1a', x, 0.05, z, 0.42, 0.1, 0.42, 0, { mat: 'metal', ao: 0 });
  addBox(x - 0.2, x + 0.2, z - 0.2, z + 0.2, 0.9);
}

// Marquesina de autobús (frente hacia +z).
function busStop(x, z) {
  for (const sx of [-1.7, 1.7]) B.box('#22262b', x + sx, 0, z - 0.6, 0.1, 2.5, 0.1, 0, { mat: 'metal' });
  B.box('#22262b', x, 2.5, z - 0.1, 3.8, 0.12, 1.5, 0, { mat: 'metal', ao: 0 });
  B.box('#9fb8c8', x - 0.4, 0.3, z - 0.62, 2.6, 2.0, 0.03, 0, { mat: 'glass', ao: 0 });
  const ad = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.5), new THREE.MeshStandardMaterial({ map: TX.posterTex(), emissiveMap: TX.posterTex(), emissive: 0xffffff, emissiveIntensity: 0.5 }));
  W.winMats.push(ad.material);
  ad.position.set(x + 1.2, 1.3, z - 0.58); scene.add(ad);
  B.box('#2a2d31', x + 1.2, 0.5, z - 0.62, 1.0, 1.7, 0.08, 0, { mat: 'metal' });
  B.box('#7a5a3c', x - 0.5, 0.45, z - 0.25, 2.0, 0.07, 0.42, 0);
  B.box('#22262b', x - 0.5, 0, z - 0.25, 0.06, 0.45, 0.4, 0, { mat: 'metal' });
  addBox(x - 1.8, x + 1.8, z - 0.7, z - 0.5, 2.5);
}

// Valla publicitaria sobre postes.
function billboard(x, z, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  for (const o of [-2.2, 2.2]) B.add(GEO.cyl8, '#3a3e43', x + o * c, 3.5, z - o * s, 0.32, 7, 0.32, 0, { mat: 'metal' });
  B.add(GEO.box, '#2a2d31', x, 9.5, z, 7.6, 4.2, 0.35, ry, { mat: 'metal', ao: 0 });
  B.add(GEO.box, '#3a3e43', x, 7.2, z + 0.5 * c, 7.2, 0.12, 0.8, ry, { mat: 'metal', ao: 0 });
  const t = TX.billboardTex(7);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 3.8), new THREE.MeshStandardMaterial({ map: t, emissiveMap: t, emissive: 0xffffff, emissiveIntensity: 0.55, roughness: 0.6 }));
  W.signMats = W.signMats || [];
  W.signMats.push(m.material);
  m.position.set(x + Math.sin(ry) * 0.19, 9.5, z + Math.cos(ry) * 0.19);
  m.rotation.y = ry;
  scene.add(m);
  for (const o of [-2.4, 0, 2.4]) B.box('#fff4d6', x + o * c + s * 0.55, 7.35, z - o * s + c * 0.55, 0.5, 0.08, 0.15, ry, { mat: 'glow' });
  addBox(x - 2.6, x + 2.6, z - 0.4, z + 0.4, 7);
}

function buildCommercial() {
  // fila de locales mirando a la calle principal (z = -30)
  const zf = -37.2;
  storefront({ x0: 37.5, x1: 46, zf, h: 5.5, wall: '#3b3f45', name: 'Súper 24/7', sign: '24/7', signStyle: 'blade', signColor: '#1f9d55', neon: { text: 'OPEN' }, seed: 11, tint: '#f6f0dc' });
  const bar = storefront({ x0: 46.5, x1: 55, zf, h: 4.8, wall: '#2f4f4f', name: 'Bar', sign: 'BAR EL ANCLA', signColor: '#0f2d2d', signFg: '#f6d78b', awning: '#1f6f5c', seed: 12, tint: '#f0c890' });
  const gun = storefront({ x0: 55.5, x1: 64, zf, h: 6.5, wall: '#3d4136', name: 'Armería', sign: 'ARMERÍA LOMAS', signStyle: 'letters', awning: '#4b5320', seed: 13, tint: '#d8d2c0', upper: true });
  const casino = storefront({ x0: 64.5, x1: 73, zf, h: 5.4, wall: '#2a0f2e', name: 'Casino', sign: 'CASINO ROYAL', signColor: '#5b0f5e', signFg: '#ffd700', neon: { text: '777', color: '#ffe066', glow: '#ffb300', border: '#ff2d95' }, seed: 14, tint: '#3a1838' });
  // se entra tocando la puerta del local (el panel hace de interior)
  hitbox(gun.x, 1.3, zf + 0.25, 2.4, 2.6, 0.5, { actions: () => [{ label: 'Entrar en la Armería', fn: () => G.act.openShop('armeria') }] });
  hitbox(casino.x, 1.3, zf + 0.25, 2.4, 2.6, 0.5, { actions: () => [{ label: 'Entrar en el Casino', fn: () => G.act.openCasino() }] });
  W.pois.armeria = gun;
  W.pois.casino = casino;
  storefront({ x0: 73.5, x1: 83, zf, h: 5.2, wall: '#d6e6ef', name: 'Lavandería', sign: 'LAVA-YA', signColor: '#2b7bd1', seed: 15, tint: '#e8f2f8' });
  building({ x0: 38, x1: 82, z0: -82, z1: -66, h: 12.8, wall: '#d29b77', trim: '#f2e2d2', roof: '#555', style: 'house', front: '+z', seed: 404, mapColor: '#a7735a' });
  asphalt(36.5, 83.5, -65.5, -50.5);
  dumpster(56, -55, 0, '#3b6e8f');
  dumpster(74, -55, 0);
  cardBox(52.5, 0, -53.5, 0.7, 0.55, 0.6, 0.3, true);
  cardBox(53.4, 0, -53.9, 0.6, 0.45, 0.5, -0.2, true);
  // mobiliario de la acera (lado de la tienda)
  busStop(50.5, -34.6);
  for (const x of [41.5, 60.2, 78]) trashCan(x, -36.0);
  hydrant(46.3, -34.2);
  hydrant(69, -34.2);
  billboard(61.8, -20.6, Math.PI);
  W.spots.push({ id: 'bar', name: 'Trasera del bar El Ancla', x: 50, z: -57 });
  W.wander.push({ x: 42, z: -35.5 }, { x: 60, z: -35.5 }, { x: 75, z: -35.5 }, { x: 50.5, z: -35 });
  W.pois.bar = bar;
}

// Semáforos en todos los cruces (fase A = calles en X, fase B = calles en Z).
function buildRoadDetails() {
  for (const r of ROADS) {
    for (let t = -100; t <= 100; t += 20) {
      if (ROADS.some((q) => Math.abs(t - q) < 8)) continue;
      B.add(GEO.cyl16, '#2a2c2f', r + 1.6, 0.03, t + 4, 0.8, 0.02, 0.8, 0, { mat: 'metal', ao: 0, shadow: false });
      B.add(GEO.cyl16, '#2a2c2f', t - 4, 0.03, r - 1.6, 0.8, 0.02, 0.8, 0, { mat: 'metal', ao: 0, shadow: false });
    }
  }
  for (const [x, z] of [[-42.4, -39.8], [-42.6, -41.4], [54.2, -55.6], [72.1, -55.3], [57.9, -56.4]]) {
    for (let i = 0; i < 2; i++) B.add(GEO.sphere, '#151719', x + i * 0.45, 0.28, z + (i % 2) * 0.3, 0.6, 0.55, 0.55, i, { ao: 0.2, aoH: 0.4 });
  }
}

function buildTrafficLights() {
  const mk = (c) => new THREE.MeshBasicMaterial({ color: c, toneMapped: false });
  W.tl = { A: { r: mk(0x330000), y: mk(0x332200), g: mk(0x003310) }, B: { r: mk(0x330000), y: mk(0x332200), g: mk(0x003310) } };
  const head = (x, y, z, set, ry) => {
    B.add(GEO.box, '#1a1c1f', x, y, z, 0.32, 0.95, 0.28, ry, { mat: 'metal', ao: 0 });
    const fx = Math.sin(ry) * 0.15, fz = Math.cos(ry) * 0.15;
    B.add(GEO.cyl8, '#ffffff', x + fx, y + 0.28, z + fz, 0.18, 0.06, 0.18, ry - Math.PI / 2, { rz: Math.PI / 2, mat: set.r, ao: 0, shadow: false, global: true });
    B.add(GEO.cyl8, '#ffffff', x + fx, y, z + fz, 0.18, 0.06, 0.18, ry - Math.PI / 2, { rz: Math.PI / 2, mat: set.y, ao: 0, shadow: false, global: true });
    B.add(GEO.cyl8, '#ffffff', x + fx, y - 0.28, z + fz, 0.18, 0.06, 0.18, ry - Math.PI / 2, { rz: Math.PI / 2, mat: set.g, ao: 0, shadow: false, global: true });
  };
  for (const rx of ROADS) for (const rz of ROADS) {
    if (Math.abs(rx) === 90 && Math.abs(rz) === 90) continue;
    // poste en la esquina (+x, +z) con brazo sobre la calle en X (tráfico que va por z la ve)
    const px = rx + 5.6, pz = rz + 5.6;
    B.add(GEO.cyl8, '#2b2e32', px, 2.9, pz, 0.2, 5.8, 0.2, 0, { mat: 'metal' });
    B.box('#2b2e32', px - 2.6, 5.6, pz, 5.2, 0.12, 0.12, 0, { mat: 'metal', ao: 0 });
    head(px - 4.2, 5.1, pz, W.tl.B, 0);
    head(px, 3.6, pz - 0.2, W.tl.A, Math.PI / 2);
    streetSign(STREETS_Z[rz] || 'Calle', px, 6.05, pz, 0);
    streetSign(STREETS_X[rx] || 'Calle', px, 6.5, pz, Math.PI / 2);
    addBox(px - 0.15, px + 0.15, pz - 0.15, pz + 0.15, 6);
    // y su gemelo en la esquina opuesta
    const qx = rx - 5.6, qz = rz - 5.6;
    B.add(GEO.cyl8, '#2b2e32', qx, 2.9, qz, 0.2, 5.8, 0.2, 0, { mat: 'metal' });
    B.box('#2b2e32', qx + 2.6, 5.6, qz, 5.2, 0.12, 0.12, 0, { mat: 'metal', ao: 0 });
    head(qx + 4.2, 5.1, qz, W.tl.B, Math.PI);
    head(qx, 3.6, qz + 0.2, W.tl.A, -Math.PI / 2);
    addBox(qx - 0.15, qx + 0.15, qz - 0.15, qz + 0.15, 6);
  }
}

const STREETS_X = { '-90': 'C/ Coral', '-30': 'Av. del Polígono', '30': 'C/ Marina', '90': 'Av. del Faro' };
const STREETS_Z = { '-90': 'C/ Arena', '-30': 'Av. Palmeras', '30': 'C/ Lonja', '90': 'Av. Bahía' };
const streetMats = new Map();
function streetSign(text, x, y, z, ry) {
  if (!streetMats.has(text)) streetMats.set(text, new THREE.MeshStandardMaterial({ map: TX.signTex(text, { bg: '#1d6b3a', fg: '#ffffff', border: '#ffffff', w: 512, h: 112, font: 'bold 64px sans-serif' }), side: THREE.DoubleSide, roughness: 0.5 }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.9, 0.42), streetMats.get(text));
  m.position.set(x, y, z);
  m.rotation.y = ry;
  scene.add(m);
}

function updateTrafficLights() {
  if (!W.tl) return;
  const t = (G.time % 24) / 24; // ciclo de 24 s
  const phase = t < 0.42 ? ['g', 'r'] : t < 0.5 ? ['y', 'r'] : t < 0.92 ? ['r', 'g'] : ['r', 'y'];
  const on = { r: 0xff2a1a, y: 0xffb000, g: 0x22ff77 }, off = { r: 0x330806, y: 0x332000, g: 0x06331a };
  for (const [k, set] of [['A', W.tl.A], ['B', W.tl.B]]) {
    const lit = phase[k === 'A' ? 0 : 1];
    for (const c of ['r', 'y', 'g']) set[c].color.setHex(c === lit ? on[c] : off[c]);
  }
}

// Montañas en el horizonte (sur y este) con antena.
function buildMountains() {
  const ridge = (cx, cz, n, spread, axis) => {
    for (let i = 0; i < n; i++) {
      const t = (i / (n - 1) - 0.5) * spread;
      const x = cx + (axis === 'x' ? t : rnd(-30, 30)), z = cz + (axis === 'x' ? rnd(-30, 30) : t);
      const hgt = rnd(50, 120), r = rnd(110, 190);
      B.add(GEO.ico1, i % 2 ? '#5c5a6e' : '#68647a', x, -4, z, r, hgt * 2, r * rnd(0.6, 0.9), rnd(0, 3), { shadow: false, ao: 0, jitter: 0.08 });
    }
  };
  ridge(40, -470, 9, 900, 'x');
  ridge(480, -60, 7, 700, 'z');
  // antena en la cima
  B.add(GEO.ico1, '#625f74', 120, -4, -460, 200, 300, 170, 0.3, { shadow: false, ao: 0 });
  B.add(GEO.cyl6, '#3a3a44', 120, 158, -460, 1.2, 30, 1.2, 0, { shadow: false, ao: 0 });
  B.add(GEO.sphere, '#ff3030', 120, 174, -460, 2.4, 2.4, 2.4, 0, { mat: 'glow', ao: 0 });
}

const HOUSE_COLORS = ['#f1d2b2', '#e9c9a6', '#d9cbe6', '#f0c4b0', '#efe0b8', '#cfe0d2', '#f5eadb', '#e6c7c7', '#d8e1ea', '#f2d6a2'];
const ROOF_COLORS = ['#4a4744', '#5a4a3e', '#3f4650', '#6a4b3a', '#8c4a32', '#454545'];

function house(x, z, front, seed) {
  const alongX = front === '+z' || front === '-z';
  const hw = alongX ? 4.5 : 4, hd = alongX ? 4 : 4.5;
  const h = seed % 3 === 0 ? 6 : 3.4;
  const o = {
    x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, h,
    wall: HOUSE_COLORS[seed % HOUSE_COLORS.length], trim: '#fbf7ef', roof: ROOF_COLORS[seed % ROOF_COLORS.length],
    style: 'house', front, roofType: seed % 4 === 1 ? 'flat' : 'gable', seed: 600 + seed, mapColor: '#c9b28e',
  };
  const door = building(o);
  const fp = frontPoint(o, 0);
  const dx = Math.sign(door.x - fp.x), dz = Math.sign(door.z - fp.z);
  B.box('#d6cdb9', fp.x + dx * 1.5, 0, fp.z + dz * 1.5, dz ? 1.2 : 3, 0.05, dx ? 1.2 : 3, 0, { shadow: false, ao: 0 });
  bush(fp.x + (dz ? 2.4 : dx * 0.8), fp.z + (dx ? 2.4 : dz * 0.8));
  bush(fp.x - (dz ? 2.4 : -dx * 0.8), fp.z - (dx ? 2.4 : -dz * 0.8));
  const mb = { x: fp.x + dx * 2.8 + (dz ? 1.4 : 0), z: fp.z + dz * 2.8 + (dx ? 1.4 : 0) };
  B.box('#6b4a2f', mb.x, 0, mb.z, 0.1, 1.0, 0.1);
  B.box(['#c0392b', '#2980b9', '#2c3e50'][seed % 3], mb.x, 1.0, mb.z, 0.4, 0.3, 0.3, 0, { mat: 'metal', ao: 0 });
  // palmera en el jardín delantero
  if (seed % 2 === 0) palm(fp.x + dx * 2.6 - (dz ? 3.2 : 0), fp.z + dz * 2.6 - (dx ? 3.2 : 0), rnd(6.5, 9));
  return door;
}

function buildResidential() {
  let seed = 0;
  for (const [cx, cz] of [[0, 60], [60, 60], [-60, 60]]) {
    const slots = [
      [cx - 10, cz + 16.5, '+z'], [cx + 10, cz + 16.5, '+z'],
      [cx - 10, cz - 16.5, '-z'], [cx + 10, cz - 16.5, '-z'],
      [cx + 16.5, cz, '+x'], [cx - 16.5, cz, '-x'],
    ];
    for (const [x, z, f] of slots) {
      if (cx === -60 && f === '+x') continue;
      W.homes.push(house(x, z, f, seed++));
    }
    for (let k = 0; k < 4; k++) tree(cx + (Math.random() - 0.5) * 12, cz + (Math.random() - 0.5) * 8, 0.8 + Math.random() * 0.3);
    chainFence(cx - 6, cz - 8, cx + 6, cz - 8, 1.6);
    W.wander.push({ x: cx + 23.8, z: cz + 8 });
  }
  W.mapLabels.push({ x: 0, z: 60, t: 'Barrio Alto' }, { x: 60, z: 60, t: 'Las Palmeras' });

  const wall = '#e9d6b0';
  const door = room({
    id: 'bungalow', x0: -50, x1: -40.2, z0: 54, z1: 66, h: 3.2, wall, inner: '#f3ead6', front: '+x', doorAt: 60,
    floorTex: TX.woodTex('#b0875a'), doorColor: '#2e5e4e', locked: () => !G.state.props.bungalow,
  });
  B.add(roofGeo(12.8, 11, 2.2), '#3f4650', -45.1, 3.2, 60, 1, 1, 1, 0, { ao: 0 });
  B.box('#a9c7d8', -40.0, 1.0, 56.5, 0.06, 1.1, 1.6, 0, { mat: 'glass', shadow: false, ao: 0 });
  B.box('#a9c7d8', -40.0, 1.0, 63.5, 0.06, 1.1, 1.6, 0, { mat: 'glass', shadow: false, ao: 0 });
  W.mapRects.push({ x0: -50, x1: -40, z0: 54, z1: 66, c: '#5fa38a' });
  W.mapLabels.push({ x: -45, z: 60, t: 'Bungalow' });
  B.box('#5c4033', -48.6, 0, 64.6, 2.2, 0.45, 2.4);
  B.box('#f2f2f2', -48.6, 0.45, 64.6, 2.1, 0.18, 2.3, 0, { ao: 0 });
  B.box('#2e5e4e', -48.4, 0.6, 64.6, 1.6, 0.08, 2.35, 0, { ao: 0 });
  addBox(-49.8, -47.4, 63.3, 65.8, 0.7);
  hitbox(-48.6, 0.4, 64.6, 2.2, 0.8, 2.4, { actions: () => [{ label: 'Dormir', fn: () => G.act.sleep('bungalow') }] });
  B.box('#e9e4dc', -49.4, 0, 55, 0.8, 0.85, 1.2);
  B.box('#b7bcc0', -49.7, 0.9, 55, 0.08, 0.35, 0.08, 0, { mat: 'metal', ao: 0 });
  addBox(-49.8, -49.0, 54.2, 55.7, 1);
  hitbox(-49.4, 0.6, 55, 0.9, 1.2, 1.2, { actions: () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }] });
  W.props.bungalow = { x0: -49.8, x1: -40.4, z0: 54.2, z1: 65.8, name: 'Bungalow', price: 2500, spawn: { x: -41.6, z: 60.8, yaw: Math.PI / 2 }, door, indoor: true };
  B.box('#6b4a2f', -37.6, 0, 63.5, 0.12, 1.4, 0.12);
  const sv = TX.signTex('SE VENDE · $2.500', { bg: '#ffffff', fg: '#c0392b', border: '#c0392b', w: 512, h: 160 });
  const svm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.56), new THREE.MeshStandardMaterial({ map: sv, side: THREE.DoubleSide }));
  svm.position.set(-37.55, 1.55, 63.5); svm.rotation.y = Math.PI / 2; scene.add(svm);
  W.saleSign = svm;
  hitbox(-37.6, 1.2, 63.5, 0.6, 2.4, 2, { actions: () => G.act.bungalowActions() });
  W.pois.bungalow = { x: -38.5, z: 60 };
  palm(-38, 56.5, 9);
}

function buildBeach() {
  B.box('#e2cf9a', 0, 0, 101, LIMIT * 2, 0.05, 9, 0, { shadow: false, ao: 0 });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(1400, 600), new THREE.MeshStandardMaterial({ color: 0x24688f, roughness: 0.12, metalness: 0.35, transparent: true, opacity: 0.94 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.35, 405);
  scene.add(water);
  W.water = water;
  B.box('#cdb983', 0, -0.6, 106, 1400, 0.6, 2, 0, { shadow: false, ao: 0 });
  for (let z = 105.5; z <= 125; z += 0.9) B.box('#9c7a52', 0, -0.1, z, 4, 0.18, 0.8, 0, { jitter: 0.12, ao: 0 });
  for (let z = 106; z <= 125; z += 3.5) for (const x of [-2, 2]) B.add(GEO.cyl6, '#5a4632', x, -0.5, z, 0.3, 1.6, 0.3);
  addBox(-LIMIT, -2.2, 105.2, 106.2, 10);
  addBox(2.2, LIMIT, 105.2, 106.2, 10);
  addBox(-2.4, -2.1, 106, 125.5, 10);
  addBox(2.1, 2.4, 106, 125.5, 10);
  addBox(-2.4, 2.4, 125.4, 126, 10);
  B.box('#ecf0f1', 5.5, -0.4, 116, 1.8, 0.6, 5);
  B.box('#c0392b', 5.5, -0.15, 116, 1.85, 0.12, 5.05, 0, { ao: 0 });
  B.add(GEO.cyl16, '#ecf0f1', 90, 5, 112, 3.4, 10, 3.4);
  for (let y = 1; y < 10; y += 3) B.add(GEO.cyl16, '#c0392b', 90, y + 0.6, 112, 3.45, 1.2, 3.45, 0, { ao: 0 });
  B.add(GEO.cyl8, '#2c3e50', 90, 10.6, 112, 2.2, 1.2, 2.2);
  B.add(GEO.cone8, '#c0392b', 90, 11.8, 112, 2.6, 1.4, 2.6);
  W.bulbPositions.push([90, 10.6, 110.8]);
  for (const [x, c] of [[-40, '#e74c3c'], [-25, '#3498db'], [22, '#f1c40f'], [48, '#2ecc71']]) {
    B.add(GEO.cyl6, '#ffffff', x, 1.2, 101, 0.08, 2.4, 0.08);
    B.add(GEO.cone8, c, x, 2.5, 101, 3, 0.7, 3, 0, { ao: 0 });
    B.box('#ffffff', x + 1.2, 0, 102, 0.7, 0.3, 1.8);
  }
  for (let x = -100; x <= 100; x += 16) palm(x + rnd(-3, 3), 98 + rnd(-1, 1), rnd(8, 12));
  W.spots.push({ id: 'muelle', name: 'Muelle del puerto', x: 0, z: 118 });
  W.wander.push({ x: -25, z: 99 }, { x: 0, z: 112 }, { x: 30, z: 99 });
  W.mapRects.push({ x0: -LIMIT, x1: LIMIT, z0: 96.5, z1: 106, c: '#e6d39c' });
  W.mapRects.push({ x0: -2, x1: 2, z0: 106, z1: 125, c: '#9c7a52' });
  W.mapLabels.push({ x: 0, z: 101, t: 'Puerto' });
}

// Rascacielos de la gran ciudad al otro lado de la bahía y al oeste.
function buildSkyline() {
  const mats = [1, 2, 3].map((s) => {
    const t = TX.towerTex(900 + s);
    const m = new THREE.MeshStandardMaterial({ map: t.map, emissiveMap: t.emissive, emissive: 0xffffff, emissiveIntensity: 0, vertexColors: true, roughness: 0.5, metalness: 0.35 });
    W.winMats.push(m);
    return m;
  });
  const tower = (x, z, w, d, h, color) => {
    const m = mats[Math.floor(Math.random() * 3)];
    B.add(GEO.box, color, x, h / 2, z, w, h, d, 0, { mat: m, uvScale: [w / 24, h / 96], ao: 0, shadow: false });
    if (Math.random() < 0.5) B.add(GEO.box, color, x, h + 3, z, w * 0.6, 6, d * 0.6, 0, { mat: m, uvScale: [w / 40, 6 / 96], ao: 0, shadow: false });
    if (Math.random() < 0.35) B.add(GEO.cyl6, '#7a7f86', x, h + 10, z, 0.6, 14, 0.6, 0, { ao: 0, shadow: false });
  };
  const cols = ['#8b8fa8', '#9a9eb4', '#7d8199', '#a7a3b2', '#6f7590'];
  // centro al otro lado de la bahía (noroeste)
  for (let i = 0; i < 50; i++) {
    const x = rnd(-480, 60), z = rnd(360, 470);
    const centre = 1 - Math.min(1, Math.abs(x + 200) / 260);
    tower(x, z, rnd(18, 36), rnd(18, 36), 40 + centre * rnd(80, 190) + rnd(0, 40), cols[i % cols.length]);
  }
  // barrio de torres al oeste
  for (let i = 0; i < 24; i++) tower(rnd(-560, -440), rnd(-220, 260), rnd(20, 36), rnd(20, 36), rnd(40, 140), cols[i % cols.length]);
}

function buildOutskirts() {
  const free = (x, z) => {
    for (const r of ROADS) if (Math.abs(x - r) < SWO + 1.5 || Math.abs(z - r) < SWO + 1.5) return false;
    for (const q of W.lots || []) if (x > q.x0 - 2 && x < q.x1 + 2 && z > q.z0 - 2 && z < q.z1 + 2) return false;
    return true;
  };
  let n = 0;
  while (n < 70) {
    const x = (Math.random() * 2 - 1) * (LIMIT - 2), z = -LIMIT + 2 + Math.random() * (96 + LIMIT - 6);
    if (Math.abs(x) < 96.5 && z > -96.5) continue;
    if (!free(x, z)) continue;
    if (Math.random() < 0.6) palm(x, z); else tree(x, z, 0.9 + Math.random() * 0.5);
    n++;
  }
  chainFence(-LIMIT, -LIMIT + 0.5, LIMIT, -LIMIT + 0.5);
  chainFence(-LIMIT + 0.5, -LIMIT, -LIMIT + 0.5, 96);
  chainFence(LIMIT - 0.5, -LIMIT, LIMIT - 0.5, 96);
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    if (Math.sin(a) > 0.2 || Math.cos(a) < -0.6) continue;
    const r = 180 + Math.random() * 70;
    const s = 50 + Math.random() * 60;
    B.add(GEO.ico1, i % 2 ? '#8a8a5a' : '#9a9465', Math.cos(a) * r, -s * 0.15, Math.sin(a) * r, s * 1.4, s * 0.55, s * 1.4, Math.random() * 3, { shadow: false, jitter: 0.06, ao: 0 });
  }
  for (let i = 0; i < 6; i++) B.box(i % 2 ? '#7a5a3a' : '#6e8f3d', -60 + i * 7, 0, -103, 6, 0.15, 12, 0, { shadow: false, ao: 0 });
}

function buildStreetFurniture() {
  for (const r of ROADS) {
    for (let t = -105; t <= 105; t += 22) {
      if (ROADS.some((q) => Math.abs(t - q) < 9)) continue;
      const s = (Math.round(t / 22) % 2 ? 1 : -1);
      lamp(r + s * 5.9, t, s > 0 ? Math.PI : 0);
      lamp(t, r - s * 5.9, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }
  // palmeras alineadas en las aceras
  for (const r of ROADS) {
    for (let t = -94; t <= 94; t += 22) {
      if (ROADS.some((q) => Math.abs(t - q) < 9)) continue;
      const s = (Math.round(t / 22) % 2 ? -1 : 1);
      if (Math.random() < 0.8) palm(r + s * 5.9, t, rnd(8, 12));
      if (Math.random() < 0.8) palm(t, r - s * 5.9, rnd(8, 12));
    }
  }
  // líneas de postes eléctricos
  const line = (pts) => utilityPoles(pts);
  const xs = []; for (let x = -108; x <= 108; x += 24) if (!ROADS.some((q) => Math.abs(x - q) < 7)) xs.push(x);
  line(xs.map((x) => [x, -36.9, Math.PI / 2]));
  line(xs.map((x) => [x, 23.1, Math.PI / 2]));
  const zs = []; for (let z = -108; z <= 92; z += 24) if (!ROADS.some((q) => Math.abs(z - q) < 7)) zs.push(z);
  line(zs.map((z) => [-23.1, z, 0]));
  const wg = new THREE.BufferGeometry();
  wg.setAttribute('position', new THREE.Float32BufferAttribute(wirePts, 3));
  scene.add(new THREE.LineSegments(wg, new THREE.LineBasicMaterial({ color: 0x1a1a1a })));

  for (const [x, z] of [[24.6, -24.6], [-24.6, 35.6], [84, 35.6], [-35.6, -84], [-57, -36.2], [24.4, 14], [-24.4, -14]]) hydrant(x, z);
  for (const [x, z] of [[24.4, 18], [-24.4, -18], [35.7, 18], [-35.7, 18], [24.4, 55], [35.7, -14]]) trashCan(x, z);
}

function buildBulbs() {
  const geo = new THREE.SphereGeometry(0.24, 10, 6);
  geo.scale(1.4, 0.5, 1.4);
  const mat = new THREE.MeshBasicMaterial({ color: 0xdddddd, toneMapped: false });
  const im = new THREE.InstancedMesh(geo, mat, W.bulbPositions.length);
  const m = new THREE.Matrix4();
  W.bulbPositions.forEach((p, i) => { m.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m); });
  scene.add(im);
  W.bulbMat = mat;
  // charco de luz bajo cada farola: una sola malla instanciada, sin luces dinámicas
  // (la opacidad la mueve el ciclo de día y noche; de día queda en 0 y no se dibuja)
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,214,150,0.9)');
  grd.addColorStop(0.35, 'rgba(255,200,130,0.45)');
  grd.addColorStop(0.7, 'rgba(255,190,120,0.12)');
  grd.addColorStop(1, 'rgba(255,190,120,0)');
  g.fillStyle = grd; g.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace;
  const pg = new THREE.PlaneGeometry(9, 9);
  pg.rotateX(-Math.PI / 2);
  const pm = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -2 });
  const pools = new THREE.InstancedMesh(pg, pm, W.lampPools.length);
  W.lampPools.forEach((p, i) => { m.makeTranslation(p[0], 0.16, p[1]); pools.setMatrixAt(i, m); });
  pools.renderOrder = 2;
  pools.visible = false;
  scene.add(pools);
  W.lampPoolMesh = pools;
}

function buildBoxes() {
  const list = W.boxes;
  const geo = new THREE.BoxGeometry(1, 1, 1);
  const im = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ map: TX.cardboardTex(), roughness: 0.95 }), list.length);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(), p = new THREE.Vector3(), s = new THREE.Vector3();
  const c = new THREE.Color();
  list.forEach((b, i) => {
    e.set(0, b.ry || 0, 0); q.setFromEuler(e);
    p.set(b.x, b.y + b.h / 2, b.z); s.set(b.w, b.h, b.d);
    m.compose(p, q, s);
    im.setMatrixAt(i, m);
    im.setColorAt(i, c.setScalar(0.85 + Math.random() * 0.2));
  });
  im.castShadow = true;
  im.receiveShadow = true;
  scene.add(im);
}
