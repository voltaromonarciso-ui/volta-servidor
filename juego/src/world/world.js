import * as THREE from 'three';
import { G } from '../game.js';
import { StaticBatch, GEO } from './batch.js';
import * as TX from './textures.js';
import { Nav } from './nav.js';

// ------------------------------------------------------------------
//  PUERTO LOMAS — 9 manzanas en cuadrícula, puerto al norte.
// ------------------------------------------------------------------
export const ROADS = [-90, -30, 30, 90];
export const LIMIT = 112;
const RH = 4;          // media calzada
const SWO = 6.5;       // borde exterior de la acera
const SWC = 5.25;      // línea central de la acera (para la navegación)
const CELL = 8;

let W, B, scene;
const roofGeoCache = new Map();

export function createWorld(sc) {
  scene = sc;
  W = {
    colliders: [], grid: new Map(), nav: new Nav(),
    pois: {}, homes: [], spots: [], wander: [], floors: [], mapRects: [], mapLabels: [],
    props: {}, winMats: [], doors: [], bulbPositions: [], water: null,
    resolve, los, addBox, inProperty, update, groundAt: () => 0,
  };
  B = new StaticBatch(60);

  buildGround();
  buildRoads();
  buildNav();
  buildMotel();
  buildPlaza();
  buildShops();
  buildPolice();
  buildCommercial();
  buildIndustrial();
  buildResidential();
  buildBeach();
  buildOutskirts();
  buildStreetFurniture();

  W.static = B.build(scene);
  buildBulbs();
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

// Empuja un círculo (jugador / NPC) fuera de las cajas. Devuelve true si chocó.
function resolve(pos, r, y = 0) {
  let hit = false;
  for (let pass = 0; pass < 2; pass++) {
    for (const c of nearby(pos.x - r, pos.x + r, pos.z - r, pos.z + r)) {
      if (!c.on || y > c.h - 0.05) continue;
      const px = Math.max(c.x0, Math.min(pos.x, c.x1));
      const pz = Math.max(c.z0, Math.min(pos.z, c.z1));
      let dx = pos.x - px, dz = pos.z - pz;
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

// Línea de visión entre dos puntos (ignora obstáculos bajos).
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
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

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
    const m = new THREE.MeshLambertMaterial({ map: f.map, emissiveMap: f.emissive, emissive: 0xffffff, emissiveIntensity: 0 });
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

  if (roofType === 'flat') {
    // pretil
    const t = 0.25;
    B.box('#7b7b7b', cx, h, z0 + t / 2, w, 0.4, t);
    B.box('#7b7b7b', cx, h, z1 - t / 2, w, 0.4, t);
    B.box('#7b7b7b', x0 + t / 2, h, cz, t, 0.4, d);
    B.box('#7b7b7b', x1 - t / 2, h, cz, t, 0.4, d);
    if (w * d > 120) {
      B.box('#9aa0a6', cx + w * 0.2, h, cz - d * 0.15, 1.6, 1.0, 1.2);
      B.box('#9aa0a6', cx - w * 0.25, h, cz + d * 0.2, 1.2, 0.8, 1.2);
    }
  } else {
    const alongX = front === '+z' || front === '-z';
    const len = (alongX ? w : d) + 0.8, span = (alongX ? d : w) + 0.8;
    B.add(roofGeo(len, span, Math.min(2.4, span * 0.35)), roof, cx, h, cz, 1, 1, 1, alongX ? Math.PI / 2 : 0);
  }

  // punto de la puerta (fuera) y cartel
  const door = frontPoint(o, 1.3);
  if (sign) {
    const len = front === '+z' || front === '-z' ? w : d;
    const sw = Math.min(len * 0.75, 9), sh = sw / 4;
    const tex = TX.signTex(sign, { bg: signBg, fg: signFg, border: signBorder });
    const sm = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshLambertMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.15 }));
    W.winMats.push(sm.material);
    const p = frontPoint(o, 0.06);
    const yy = style === 'shop' ? 3.9 : Math.min(h - sh / 2 - 0.3, 3.6);
    sm.position.set(p.x, Math.max(yy, sh / 2 + 2.4), p.z);
    sm.rotation.y = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[front];
    scene.add(sm);
  }
  return door;
}

const plainCache = new Map();
function plainMat(color) {
  if (!plainCache.has(color)) plainCache.set(color, new THREE.MeshLambertMaterial({ color }));
  return plainCache.get(color);
}

function frontPoint(o, out) {
  const { x0, x1, z0, z1, front = '+z' } = o;
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  if (front === '+z') return { x: cx, z: z1 + out };
  if (front === '-z') return { x: cx, z: z0 - out };
  if (front === '+x') return { x: x1 + out, z: cz };
  return { x: x0 - out, z: cz };
}

function tree(x, z, s = 1, kind = Math.random() < 0.35 ? 'pine' : 'round') {
  const trunkH = 1.6 * s;
  B.add(GEO.cyl6, '#6b4a2f', x, trunkH / 2, z, 0.35 * s, trunkH, 0.35 * s);
  if (kind === 'pine') {
    B.add(GEO.cone8, '#2f6b3a', x, trunkH + 1.3 * s, z, 2.8 * s, 2.8 * s, 2.8 * s, Math.random() * 3, { jitter: 0.08 });
    B.add(GEO.cone8, '#3a7d44', x, trunkH + 2.6 * s, z, 2.0 * s, 2.2 * s, 2.0 * s, Math.random() * 3, { jitter: 0.08 });
  } else {
    B.add(GEO.ico, '#4f9a3c', x, trunkH + 1.2 * s, z, 3.2 * s, 2.7 * s, 3.2 * s, Math.random() * 3, { jitter: 0.12 });
    B.add(GEO.ico, '#5fae47', x + 0.4 * s, trunkH + 2.2 * s, z - 0.3 * s, 2.2 * s, 2.0 * s, 2.2 * s, Math.random() * 3, { jitter: 0.12 });
  }
  addBox(x - 0.3 * s, x + 0.3 * s, z - 0.3 * s, z + 0.3 * s, 5);
}

function bush(x, z, s = 1) {
  B.add(GEO.ico, '#3f8a3a', x, 0.45 * s, z, 1.4 * s, 1.0 * s, 1.4 * s, Math.random() * 3, { jitter: 0.12 });
}

function lamp(x, z, dir = 0) {
  B.add(GEO.cyl6, '#4a4f55', x, 2.4, z, 0.16, 4.8, 0.16);
  B.add(GEO.cyl6, '#4a4f55', x, 0.2, z, 0.35, 0.4, 0.35);
  const ax = Math.cos(dir) * 0.6, az = Math.sin(dir) * 0.6;
  B.box('#4a4f55', x + ax, 4.7, z + az, Math.abs(ax) * 2 + 0.12, 0.1, Math.abs(az) * 2 + 0.12);
  B.box('#2e3236', x + ax * 2, 4.5, z + az * 2, 0.5, 0.2, 0.5);
  W.bulbPositions.push([x + ax * 2, 4.45, z + az * 2]);
  addBox(x - 0.15, x + 0.15, z - 0.15, z + 0.15, 5);
}

function bench(x, z, ry = 0) {
  const c = Math.cos(ry), s = Math.sin(ry);
  const at = (lx, lz) => [x + lx * c + lz * s, z - lx * s + lz * c];
  let p = at(0, 0); B.box('#9c6b3e', p[0], 0.45, p[1], 1.8, 0.08, 0.5, ry);
  p = at(0, -0.25); B.box('#9c6b3e', p[0], 0.55, p[1], 1.8, 0.45, 0.08, ry);
  for (const lx of [-0.75, 0.75]) { p = at(lx, 0); B.box('#3d3f42', p[0], 0, p[1], 0.08, 0.45, 0.5, ry); }
  addBox(x - 0.9, x + 0.9, z - 0.9, z + 0.9, 0.9).h = 0.6;
}

export const CAR_COLORS = ['#c0392b', '#2980b9', '#ecf0f1', '#27ae60', '#f1c40f', '#8e44ad', '#34495e', '#e67e22', '#7f8c8d'];
export function carParts(add, color, x, z, ry) {
  const c = Math.cos(ry), s = Math.sin(ry);
  // lx = a lo largo del coche (adelante), lz = lateral. Devuelve centros.
  const at = (lx, lz) => [x + lx * s + lz * c, z + lx * c - lz * s];
  let p = at(0, 0);
  add('box', color, p[0], 0.75, p[1], 4.2, 0.7, 1.9);
  p = at(-0.3, 0); add('box', color, p[0], 1.4, p[1], 2.2, 0.6, 1.75);
  p = at(-0.3, 0); add('box', '#2b3a44', p[0], 1.42, p[1], 2.25, 0.46, 1.8);
  for (const [lx, lz] of [[1.3, 0.9], [-1.3, 0.9], [1.3, -0.9], [-1.3, -0.9]]) {
    p = at(lx, lz); add('wheel', '#1c1c1c', p[0], 0.36, p[1], 0.72, 0.3, 0.72);
  }
  for (const lz of [0.6, -0.6]) {
    p = at(2.11, lz); add('box', '#fff6c8', p[0], 0.85, p[1], 0.05, 0.18, 0.35);
    p = at(-2.11, lz); add('box', '#b0202a', p[0], 0.9, p[1], 0.05, 0.16, 0.35);
  }
}

function parkedCar(x, z, ry, color = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)]) {
  carParts((kind, col, px, py, pz, sx, sy, sz) => {
    if (kind === 'box') B.add(GEO.box, col, px, py, pz, sx, sy, sz, ry - Math.PI / 2);
    else B.add(GEO.cyl8, col, px, py, pz, sx, sy, sz, ry, { rz: Math.PI / 2 });
  }, color, x, z, ry);
  const alongX = Math.abs(Math.sin(ry)) > 0.5;
  if (alongX) addBox(x - 2.1, x + 2.1, z - 1, z + 1, 1.6); else addBox(x - 1, x + 1, z - 2.1, z + 2.1, 1.6);
}

function asphalt(x0, x1, z0, z1, color = '#4a4e54') {
  B.box(color, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.03, z1 - z0, 0, { shadow: false });
}
function paving(x0, x1, z0, z1, color = '#c9c2b4') {
  B.box(color, (x0 + x1) / 2, 0, (z0 + z1) / 2, x1 - x0, 0.06, z1 - z0, 0, { shadow: false });
}

function crate(x, z, s = 1) {
  B.box('#a57a49', x, 0, z, s, s, s, Math.random() * 0.4, { jitter: 0.1 });
  addBox(x - s / 2, x + s / 2, z - s / 2, z + s / 2, s);
}

function dumpster(x, z, ry = 0, color = '#2e7d4f') {
  B.box(color, x, 0.15, z, 2.0, 1.2, 1.2, ry);
  B.box('#1f5a38', x, 1.35, z, 2.05, 0.1, 1.25, ry);
  addBox(x - 1.1, x + 1.1, z - 0.7, z + 0.7, 1.5);
}

function fenceLine(x0, z0, x1, z1, color = '#8a6a4a') {
  const len = Math.hypot(x1 - x0, z1 - z0), n = Math.ceil(len / 2.5);
  const ry = Math.atan2(x1 - x0, z1 - z0);
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n, z = z0 + ((z1 - z0) * i) / n;
    B.box(color, x, 0, z, 0.15, 1.3, 0.15);
  }
  const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2;
  B.box(color, cx, 0.45, cz, 0.08, 0.12, len, ry);
  B.box(color, cx, 1.0, cz, 0.08, 0.12, len, ry);
  const t = 0.15;
  addBox(Math.min(x0, x1) - t, Math.max(x0, x1) + t, Math.min(z0, z1) - t, Math.max(z0, z1) + t, 1.4);
}

// Puerta con bisagra. axis 'x': la puerta está en un muro paralelo a X.
function makeDoor({ x, z, axis, width = 1.3, h = 2.2, color = '#7a4e2d', locked = null, name = 'Puerta', flip = 1 }) {
  const pivot = new THREE.Group();
  pivot.position.set(x, 0, z);
  const leaf = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? width : 0.08, h, axis === 'x' ? 0.08 : width), new THREE.MeshLambertMaterial({ color }));
  leaf.position.set(axis === 'x' ? width / 2 : 0, h / 2, axis === 'x' ? 0 : width / 2);
  leaf.castShadow = true;
  const knob = new THREE.Mesh(new THREE.SphereGeometry(0.05, 6, 4), new THREE.MeshLambertMaterial({ color: 0xe8c35a }));
  knob.position.set(axis === 'x' ? width - 0.15 : 0.07, 1.0, axis === 'x' ? 0.07 : width - 0.15);
  pivot.add(leaf, knob);
  const knob2 = knob.clone();
  knob2.position.set(axis === 'x' ? width - 0.15 : -0.07, 1.0, axis === 'x' ? -0.07 : width - 0.15);
  pivot.add(knob2);
  scene.add(pivot);
  const col = axis === 'x' ? addBox(x, x + width, z - 0.06, z + 0.06, h + 1) : addBox(x - 0.06, x + 0.06, z, z + width, h + 1);
  const door = { pivot, col, open: false, ang: 0, flip, locked };
  const ia = {
    actions: () => {
      if (door.locked && door.locked()) return [{ label: 'Cerrada con llave', fn: () => G.act.toast?.('Está cerrada con llave.') }];
      return [{ label: door.open ? 'Cerrar puerta' : 'Abrir puerta', fn: () => toggleDoor(door) }];
    },
  };
  const hb = axis === 'x' ? hitbox(x + width / 2, h / 2, z, width, h, 0.25, ia) : hitbox(x, h / 2, z + width / 2, 0.25, h, width, ia);
  door.hit = hb;
  W.doors.push(door);
  return door;
}

function toggleDoor(door) {
  door.open = !door.open;
  door.col.on = !door.open;
  G.act.sfx?.('door');
}

function update(dt) {
  for (const d of W.doors) {
    const target = d.open ? (Math.PI / 2) * 0.95 * d.flip : 0;
    d.ang += (target - d.ang) * Math.min(1, dt * 8);
    d.pivot.rotation.y = d.ang;
    d.hit.rotation.y = 0;
  }
  if (W.water) W.water.position.y = -0.35 + Math.sin(G.time * 0.6) * 0.04;
}

// Habitación hueca con muros, suelo, techo, puerta y luz.
function room(o) {
  const { x0, x1, z0, z1, h = 3, wall, inner = '#efe6d2', floorTex, front, doorAt, ceiling = '#f4f1ea', skipWalls = [] } = o;
  const t = 0.2, dw = 1.3;
  const wallSeg = (ax0, ax1, az0, az1, isFrontAxis) => {
    B.box(wall, (ax0 + ax1) / 2, 0, (az0 + az1) / 2, ax1 - ax0, h, az1 - az0);
    addBox(ax0, ax1, az0, az1, h + 1);
  };
  let door;
  const sides = {
    '-x': [x0 - t, x0, z0, z1], '+x': [x1, x1 + t, z0, z1],
    '-z': [x0 - t, x1 + t, z0 - t, z0], '+z': [x0 - t, x1 + t, z1, z1 + t],
  };
  for (const [side, [a0, a1, b0, b1]] of Object.entries(sides)) {
    if (skipWalls.includes(side)) continue;
    if (side !== front) { wallSeg(a0, a1, b0, b1); continue; }
    if (side === '+x' || side === '-x') {
      const d0 = doorAt - dw / 2, d1 = doorAt + dw / 2;
      wallSeg(a0, a1, b0, d0); wallSeg(a0, a1, d1, b1);
      B.box(wall, (a0 + a1) / 2, 2.2, doorAt, a1 - a0, h - 2.2, dw);
      door = makeDoor({ x: (a0 + a1) / 2, z: d0, axis: 'z', width: dw, color: o.doorColor, locked: o.locked, flip: side === '+x' ? -1 : 1 });
    } else {
      const d0 = doorAt - dw / 2, d1 = doorAt + dw / 2;
      wallSeg(a0, d0, b0, b1); wallSeg(d1, a1, b0, b1);
      B.box(wall, doorAt, 2.2, (b0 + b1) / 2, dw, h - 2.2, b1 - b0);
      door = makeDoor({ x: d0, z: (b0 + b1) / 2, axis: 'x', width: dw, color: o.doorColor, locked: o.locked, flip: side === '+z' ? -1 : 1 });
    }
  }
  // paredes interiores (color distinto)
  const it = 0.04;
  B.box(inner, x0 + it / 2, 0, (z0 + z1) / 2, it, h - 0.05, z1 - z0, 0, { shadow: false });
  B.box(inner, x1 - it / 2, 0, (z0 + z1) / 2, it, h - 0.05, z1 - z0, 0, { shadow: false });
  B.box(inner, (x0 + x1) / 2, 0, z0 + it / 2, x1 - x0, h - 0.05, it, 0, { shadow: false });
  B.box(inner, (x0 + x1) / 2, 0, z1 - it / 2, x1 - x0, h - 0.05, it, 0, { shadow: false });
  // hueco de la puerta en la pared interior: tapa con un marco oscuro
  // techo
  B.box(ceiling, (x0 + x1) / 2, h - 0.05, (z0 + z1) / 2, x1 - x0 + 0.4, 0.06, z1 - z0 + 0.4, 0, { shadow: false });
  // suelo texturizado
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(x1 - x0, z1 - z0), new THREE.MeshLambertMaterial({ map: floorTex }));
  floorTex.repeat.set((x1 - x0) / 2, (z1 - z0) / 2);
  fl.rotation.x = -Math.PI / 2;
  fl.position.set((x0 + x1) / 2, 0.03, (z0 + z1) / 2);
  fl.receiveShadow = true;
  scene.add(fl);
  fl.userData.prop = o.id;
  W.floors.push(fl);
  // lámpara de techo + luz
  B.add(GEO.cyl8, '#fff7d6', (x0 + x1) / 2, h - 0.15, (z0 + z1) / 2, 0.6, 0.12, 0.6, 0, { shadow: false });
  const light = new THREE.PointLight(0xffe2b0, 9, 11, 1.6);
  light.position.set((x0 + x1) / 2, h - 0.4, (z0 + z1) / 2);
  scene.add(light);
  return door;
}

// ------------------------------------------------------------------
//  Suelo, carreteras y aceras
// ------------------------------------------------------------------
function buildGround() {
  const gt = TX.groundTex('#6aa84f');
  gt.repeat.set(90, 61);
  const g = new THREE.Mesh(new THREE.PlaneGeometry(600, 406), new THREE.MeshLambertMaterial({ map: gt }));
  g.rotation.x = -Math.PI / 2;
  g.position.z = -97;
  g.receiveShadow = true;
  scene.add(g);
  // límites del mapa
  addBox(-LIMIT - 3, -LIMIT, -LIMIT, 130, 10);
  addBox(LIMIT, LIMIT + 3, -LIMIT, 130, 10);
  addBox(-LIMIT, LIMIT, -LIMIT - 3, -LIMIT, 10);
}

function buildRoads() {
  const rt = TX.roadTex();
  rt.repeat.set(1, (LIMIT * 2) / 10);
  const rmat = new THREE.MeshLambertMaterial({ map: rt });
  const len = LIMIT * 2;
  for (const r of ROADS) {
    const a = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, len), rmat);
    a.rotation.x = -Math.PI / 2; a.position.set(r, 0.02, -LIMIT / 2 + 48);
    a.scale.y = 1; a.receiveShadow = true;
    a.geometry = new THREE.PlaneGeometry(RH * 2, len);
    a.position.set(r, 0.02, 0);
    scene.add(a);
    const b = new THREE.Mesh(new THREE.PlaneGeometry(RH * 2, len), rmat);
    b.rotation.set(-Math.PI / 2, 0, Math.PI / 2);
    b.position.set(0, 0.021, r);
    b.receiveShadow = true;
    scene.add(b);
  }
  // cruces: asfalto liso + pasos de cebra
  for (const rx of ROADS) for (const rz of ROADS) {
    B.box('#3b3f45', rx, 0.0, rz, RH * 2, 0.04, RH * 2, 0, { shadow: false });
    for (let i = -3; i <= 3; i++) {
      B.box('#e9e9e2', rx + i * 1.05, 0, rz + RH + 1.0, 0.55, 0.045, 1.6, 0, { shadow: false });
      B.box('#e9e9e2', rx + i * 1.05, 0, rz - RH - 1.0, 0.55, 0.045, 1.6, 0, { shadow: false });
      B.box('#e9e9e2', rx + RH + 1.0, 0, rz + i * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false });
      B.box('#e9e9e2', rx - RH - 1.0, 0, rz + i * 1.05, 1.6, 0.045, 0.55, 0, { shadow: false });
    }
  }
  // aceras (tramos entre cruces)
  const edges = [-LIMIT, ...ROADS, LIMIT];
  for (const r of ROADS) {
    for (let i = 0; i < edges.length - 1; i++) {
      const a = edges[i] + (edges[i] === -LIMIT ? 0 : RH), b = edges[i + 1] - (edges[i + 1] === LIMIT ? 0 : RH);
      if (b - a < 0.5) continue;
      for (const s of [-1, 1]) {
        const c = r + s * (RH + 1.25);
        B.box('#b9b4aa', (a + b) / 2, 0, c, b - a, 0.12, 2.5, 0, { shadow: false });
        B.box('#b9b4aa', c, 0, (a + b) / 2, 2.5, 0.12, b - a, 0, { shadow: false });
        B.box('#8f8a80', (a + b) / 2, 0, r + s * (RH + 0.05), b - a, 0.14, 0.12, 0, { shadow: false });
        B.box('#8f8a80', r + s * (RH + 0.05), 0, (a + b) / 2, 0.12, 0.14, b - a, 0, { shadow: false });
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
//  Zonas
// ------------------------------------------------------------------
function buildMotel() {
  const wall = '#e8b98a', trim = '#fff3e0', roof = '#a0522d';
  building({ x0: -72, x1: -64, z0: -18, z1: -6, h: 3, wall, trim, roof, style: 'motel', front: '+x', labels: ['2', '1'], seed: 101, mapColor: '#d59a6a' });
  building({ x0: -72, x1: -64, z0: 0, z1: 18, h: 3, wall, trim, roof, style: 'motel', front: '+x', labels: ['6', '5', '4'], seed: 102, mapColor: '#d59a6a' });
  building({ x0: -72, x1: -63, z0: 19.5, z1: 23.5, h: 3.2, wall: '#f0d2a8', trim, roof, style: 'shop', front: '+x', sign: 'RECEPCIÓN', awning: '#c0392b', seed: 103, mapColor: '#d59a6a' });

  // Habitación 3 (la tuya)
  const door = room({
    id: 'motel', x0: -71.8, x1: -64.2, z0: -5.8, z1: -0.2, h: 3, wall, inner: '#d7c9a7', front: '+x', doorAt: -3,
    floorTex: TX.carpetTex('#7b4a3f'), doorColor: '#6b4a2f', skipWalls: ['-z', '+z'],
  });
  // ventana falsa en la fachada y número
  B.box('#8fbcd4', -63.98, 1.0, -1.2, 0.05, 1.0, 1.3, 0, { shadow: false });
  B.box('#fff3e0', -63.97, 2.35, -3, 0.04, 0.3, 0.35, 0, { shadow: false });
  // tejado corrido y porche
  B.box(roof, -66.9, 3, 0, 10.8, 0.35, 36.8);
  for (let z = -18; z <= 18; z += 6) B.box('#f3e5d0', -61.9, 0, z, 0.25, 3, 0.25);
  paving(-64, -61.5, -18.2, 18.2, '#cfc6b5');

  // muebles: cama, grifo, mesilla, tele
  const bx0 = -71.7, bz0 = -5.7;
  B.box('#6b4a2f', bx0 + 1.1, 0, bz0 + 0.85, 2.2, 0.45, 1.7);
  B.box('#f2f2f2', bx0 + 1.1, 0.45, bz0 + 0.85, 2.1, 0.18, 1.6);
  B.box('#c94c4c', bx0 + 1.35, 0.6, bz0 + 0.85, 1.55, 0.08, 1.65);
  B.box('#ffffff', bx0 + 0.3, 0.6, bz0 + 0.85, 0.4, 0.14, 1.1);
  B.box('#6b4a2f', bx0 + 0.05, 0, bz0 + 0.85, 0.1, 1.1, 1.7);
  addBox(bx0, bx0 + 2.2, bz0, bz0 + 1.7, 0.7);
  hitbox(bx0 + 1.1, 0.4, bz0 + 0.85, 2.2, 0.8, 1.7, { actions: () => [{ label: 'Dormir', fn: () => G.act.sleep('motel') }] });
  // grifo / lavabo
  B.box('#e9e4dc', -71.35, 0, -0.75, 0.8, 0.85, 0.9);
  B.box('#c8d6dd', -71.35, 0.85, -0.75, 0.6, 0.06, 0.6);
  B.box('#b7bcc0', -71.6, 0.9, -0.75, 0.08, 0.35, 0.08);
  B.box('#b7bcc0', -71.45, 1.2, -0.75, 0.3, 0.06, 0.06);
  B.box('#d6e2e8', -71.75, 1.3, -0.75, 0.04, 0.8, 0.6);
  addBox(-71.8, -70.9, -1.25, -0.2, 1);
  hitbox(-71.35, 0.6, -0.75, 0.9, 1.2, 0.9, { actions: () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }] });
  // mesilla con lámpara y tele vieja
  B.box('#8a6340', -71.4, 0, -3.5, 0.6, 0.55, 0.6);
  B.add(GEO.cyl8, '#ffe9a8', -71.4, 0.75, -3.5, 0.3, 0.35, 0.3);
  B.box('#5c4a3a', -64.7, 0, -5.4, 0.8, 0.6, 0.6);
  B.box('#2b2b2b', -64.75, 0.6, -5.4, 0.6, 0.5, 0.55);
  B.box('#3f6e7a', -64.98, 0.67, -5.4, 0.05, 0.36, 0.42);
  addBox(-65.1, -64.2, -5.8, -5.0, 1.1);

  W.props.motel = { x0: -71.8, x1: -64.2, z0: -5.8, z1: -0.2, name: 'Habitación 3 del motel', spawn: { x: -65.6, z: -2.4, yaw: Math.PI / 2 }, door };
  W.pois.motel = { x: -61, z: -3 };
  W.mapLabels.push({ x: -66, z: -10, t: 'Motel' });

  // aparcamiento y cartel
  asphalt(-61.5, -37, -21, 21);
  for (let z = -18; z <= 18; z += 3.2) B.box('#e8e8e8', -52, 0, z, 6, 0.04, 0.12, 0, { shadow: false });
  parkedCar(-55, -13.5, Math.PI / 2, '#b03a2e');
  parkedCar(-55, 6.6, Math.PI / 2);
  parkedCar(-48.6, 16.2, -Math.PI / 2, '#ecf0f1');
  B.add(GEO.cyl6, '#5a5f66', -38.5, 3.5, -19, 0.3, 7, 0.3);
  const st = TX.signTex('MOTEL SOL PONIENTE', { bg: '#c0392b', fg: '#fff8e1', border: '#f9e79f', w: 512, h: 192, font: 'bold 70px sans-serif' });
  const sm = new THREE.Mesh(new THREE.BoxGeometry(0.3, 2.4, 6), [new THREE.MeshLambertMaterial({ map: st, emissiveMap: st, emissive: 0xffffff, emissiveIntensity: 0.2 }), new THREE.MeshLambertMaterial({ map: st }), plainMat('#8e2b20'), plainMat('#8e2b20'), plainMat('#8e2b20'), plainMat('#8e2b20')]);
  W.winMats.push(sm.material[0]);
  sm.position.set(-38.5, 7.4, -19);
  sm.castShadow = true;
  scene.add(sm);
  addBox(-38.8, -38.2, -19.3, -18.7, 6);

  // arbolado detrás del motel
  for (let z = -20; z <= 20; z += 6) tree(-78 + Math.random() * 3, z + Math.random() * 2, 0.9 + Math.random() * 0.3);
  fenceLine(-83, -23, -83, 23);
  W.spots.push({ id: 'motel', name: 'Aparcamiento del motel', x: -44, z: 2 });
  W.wander.push({ x: -60, z: 21 });
}

function buildPlaza() {
  paving(-23.5, 23.5, -23.5, 23.5, '#7fb35d');
  paving(-1.6, 1.6, -23.5, 23.5, '#d6cdb9');
  paving(-23.5, 23.5, -1.6, 1.6, '#d6cdb9');
  B.add(GEO.cyl12, '#d6cdb9', 0, 0.04, 0, 20, 0.08, 20, 0, { shadow: false });
  // fuente
  B.add(GEO.cyl12, '#a9a49a', 0, 0.35, 0, 7, 0.7, 7);
  B.add(GEO.cyl12, '#4aa3d8', 0, 0.6, 0, 6.2, 0.1, 6.2, 0, { shadow: false });
  B.add(GEO.cyl8, '#bdb6a8', 0, 1.3, 0, 0.8, 2.2, 0.8);
  B.add(GEO.cyl12, '#bdb6a8', 0, 2.45, 0, 2.4, 0.3, 2.4);
  B.add(GEO.cyl12, '#6fc3ef', 0, 2.62, 0, 2.0, 0.06, 2.0, 0, { shadow: false });
  B.add(GEO.ico, '#d9d2c3', 0, 3.0, 0, 0.6, 0.8, 0.6);
  addBox(-3.5, 3.5, -3.5, 3.5, 0.9);
  // bancos, farolas, árboles y parterres
  for (const [x, z, r] of [[0, 6.5, Math.PI], [0, -6.5, 0], [6.5, 0, -Math.PI / 2], [-6.5, 0, Math.PI / 2]]) bench(x + (x ? 0 : 3.2), z + (z ? 0 : 3.2), r);
  for (const [x, z] of [[-14, -14], [14, -14], [-14, 14], [14, 14], [-19, 4], [19, -4], [4, 19], [-4, -19]]) tree(x, z, 1.1);
  for (const [x, z] of [[-9, -9], [9, -9], [-9, 9], [9, 9]]) { B.add(GEO.cyl12, '#6b4a2f', x, 0.15, z, 3.2, 0.3, 3.2); for (let k = 0; k < 5; k++) B.add(GEO.ico, ['#e74c3c', '#f1c40f', '#9b59b6', '#ecf0f1'][k % 4], x + Math.cos(k) * 0.9, 0.45, z + Math.sin(k) * 0.9, 0.35, 0.35, 0.35); }
  for (const [x, z] of [[2.6, 12], [-2.6, -12], [12, -2.6], [-12, 2.6]]) lamp(x, z, 0);
  W.spots.push({ id: 'plaza', name: 'Fuente de la plaza', x: 3.2, z: 5.2 });
  W.wander.push({ x: -3, z: 5 }, { x: 5, z: -4 }, { x: 10, z: 10 });
  W.mapLabels.push({ x: 0, z: 0, t: 'Plaza' });
  W.mapRects.push({ x0: -23.5, x1: 23.5, z0: -23.5, z1: 23.5, c: '#79ad58' });
}

function buildShops() {
  const fer = building({ x0: 38, x1: 54, z0: -20, z1: -4, h: 6.4, wall: '#e3dccd', trim: '#ffffff', roof: '#5b5b5b', style: 'shop', front: '-x', sign: 'FERRETERÍA TORNILLO', signBg: '#b0302a', awning: '#c0392b', seed: 201, mapColor: '#c25b4e', label: 'Ferretería' });
  W.pois.ferreteria = fer;
  hitbox(38, 1.2, -12, 0.5, 2.4, 2.4, { actions: () => [{ label: 'Entrar en la ferretería', fn: () => G.act.openShop('ferreteria') }] });
  // gasolinera
  for (const x of [37.6, 46.4]) for (const z of [6, 18]) { B.box('#ecf0f1', x, 0, z, 0.4, 4.6, 0.4); addBox(x - 0.25, x + 0.25, z - 0.25, z + 0.25, 4.6); }
  B.box('#ecf0f1', 42, 4.6, 12, 11.5, 0.5, 14.5);
  B.box('#d63031', 42, 4.85, 12, 11.6, 0.3, 14.6);
  for (const z of [9, 15]) {
    B.box('#7f8c8d', 42, 0, z, 1.2, 0.2, 2.4);
    B.box('#d63031', 42, 0.2, z, 0.8, 1.6, 0.6);
    B.box('#2d3436', 41.58, 1.1, z, 0.04, 0.4, 0.4, 0, { shadow: false });
    addBox(41.4, 42.6, z - 1.2, z + 1.2, 1.8);
  }
  asphalt(36.5, 49.5, 2, 22, '#55595f');
  const gas = building({ x0: 50, x1: 62, z0: 6, z1: 18, h: 4.2, wall: '#f4f4f4', trim: '#2e86de', roof: '#5b5b5b', style: 'shop', front: '-x', sign: 'GAS&GO 24H', signBg: '#2e86de', awning: '#2e86de', seed: 202, mapColor: '#4f8fd0', label: 'Gasolinera' });
  W.pois.gasolinera = gas;
  hitbox(50, 1.2, 12, 0.5, 2.4, 2.4, { actions: () => [{ label: 'Entrar en la tienda', fn: () => G.act.openShop('gasolinera') }] });
  B.add(GEO.cyl6, '#5a5f66', 37, 4, 21.5, 0.3, 8, 0.3);
  const pt = TX.signTex('GAS&GO', { bg: '#2e86de', fg: '#fff', border: '#fff', w: 256, h: 256, font: 'bold 64px sans-serif' });
  const pm = new THREE.Mesh(new THREE.BoxGeometry(0.4, 2.6, 2.6), new THREE.MeshLambertMaterial({ map: pt, emissiveMap: pt, emissive: 0xffffff, emissiveIntensity: 0.2 }));
  W.winMats.push(pm.material);
  pm.position.set(37, 8.6, 21.5); scene.add(pm);
  addBox(36.7, 37.3, 21.2, 21.8, 8);

  building({ x0: 66, x1: 82, z0: -20, z1: -2, h: 6.5, wall: '#9fb1bd', trim: '#e8eef2', roof: '#4d4d4d', style: 'warehouse', front: '-x', sign: 'TALLER MECÁNICO PEPE', signBg: '#34495e', seed: 203, mapColor: '#8a9aa6' });
  building({ x0: 66, x1: 82, z0: 4, z1: 21, h: 9.6, wall: '#b5654a', trim: '#f1e3d3', roof: '#5a5a5a', style: 'brick', front: '-x', seed: 204, mapColor: '#9e5e48' });
  asphalt(36.5, 37.9, -22, -2);
  parkedCar(46, -1.5, 0, '#27ae60');
  tree(64, -22, 0.9); tree(64, 23, 0.9);
  W.spots.push({ id: 'gasolinera', name: 'Detrás de la gasolinera', x: 64, z: 12 });
  W.wander.push({ x: 35.5, z: -12 }, { x: 47.5, z: 12 });
}

function buildPolice() {
  const com = building({ x0: -20, x1: -2, z0: -62, z1: -46, h: 7, wall: '#e4e7ea', trim: '#2c4a7a', roof: '#4f5a66', style: 'office', front: '+z', sign: 'COMISARÍA', signBg: '#1f3a6b', signBorder: '#ffffff', seed: 301, mapColor: '#3d5f99', label: 'Comisaría' });
  W.pois.comisaria = com;
  building({ x0: 4, x1: 20, z0: -64, z1: -46, h: 9.6, wall: '#c9a27a', trim: '#f3e7d4', roof: '#7d4e34', style: 'brick', front: '+z', sign: 'AYUNTAMIENTO', signBg: '#6e2c1f', seed: 302, mapColor: '#b48a64', label: 'Ayuntamiento' });
  paving(-23.5, 23.5, -46, -36.5, '#cfc8ba');
  for (let x = -20; x <= -4; x += 4) B.box('#bdb6a8', x, 0, -45.6, 2.6, 0.2, 0.8);
  // mástil con bandera
  B.add(GEO.cyl6, '#d0d3d4', 1, 4, -42, 0.15, 8, 0.15);
  B.box('#f1c40f', 1.8, 6.6, -42, 1.6, 0.5, 0.05);
  B.box('#c0392b', 1.8, 7.1, -42, 1.6, 0.5, 0.05);
  B.box('#f1c40f', 1.8, 7.6, -42, 1.6, 0.0001 + 0.01, 0.05);
  addBox(0.8, 1.2, -42.2, -41.8, 8);
  parkedCar(-16, -40, Math.PI / 2, '#1f3a6b');
  parkedCar(-9, -40, Math.PI / 2, '#ecf0f1');
  asphalt(-23.5, 23.5, -83.5, -66);
  for (let x = -18; x <= 18; x += 6) tree(x, -78, 0.9);
  W.wander.push({ x: 10, z: -42 }, { x: -11, z: -44 });
  W.policeHQ = { x: -11, z: -43.5 };
}

function buildCommercial() {
  const bar = building({ x0: 38, x1: 52, z0: -54, z1: -38, h: 4.6, wall: '#2f4f4f', trim: '#e0c48c', roof: '#3a3a3a', style: 'shop', front: '+z', sign: 'BAR EL ANCLA', signBg: '#0f2d2d', signFg: '#f6d78b', signBorder: '#f6d78b', awning: '#1f6f5c', seed: 401, mapColor: '#3c6b62', label: 'Bar' });
  building({ x0: 55, x1: 66, z0: -50, z1: -38, h: 4.2, wall: '#f5e1c8', trim: '#8b5a2b', roof: '#6b4b33', style: 'shop', front: '+z', sign: 'CAFÉ LOMAS', signBg: '#8b5a2b', awning: '#e67e22', seed: 402, mapColor: '#c78d5a' });
  building({ x0: 69, x1: 82, z0: -50, z1: -38, h: 4.2, wall: '#e8f4fb', trim: '#3498db', roof: '#5b5b5b', style: 'shop', front: '+z', sign: 'LAVA-YA', signBg: '#3498db', awning: '#3498db', seed: 403, mapColor: '#7fb6db' });
  building({ x0: 38, x1: 82, z0: -82, z1: -64, h: 12.8, wall: '#c98b6b', trim: '#f2e2d2', roof: '#555', style: 'brick', front: '+z', seed: 404, mapColor: '#a7735a' });
  asphalt(36.5, 83.5, -63.5, -54.5);
  dumpster(56, -57, 0, '#3b6e8f');
  dumpster(74, -57, 0);
  crate(52.5, -56); crate(53.6, -56.3, 0.8);
  for (const x of [41, 49]) bench(x, -36.9, Math.PI);
  W.spots.push({ id: 'bar', name: 'Trasera del bar El Ancla', x: 45, z: -58 });
  W.wander.push({ x: 45, z: -36.5 }, { x: 60, z: -36.5 }, { x: 75, z: -36.5 });
  W.pois.bar = bar;
}

function buildIndustrial() {
  building({ x0: -82, x1: -62, z0: -82, z1: -62, h: 8, wall: '#9aa3a8', trim: '#d0d6da', roof: '#6f777c', style: 'warehouse', front: '+z', sign: 'CONSERVAS LOMAS', signBg: '#5d6d7e', seed: 501, mapColor: '#7f8a90', label: 'Polígono' });
  building({ x0: -56, x1: -40, z0: -82, z1: -66, h: 7, wall: '#b8a77a', trim: '#e0d6b8', roof: '#6f777c', style: 'warehouse', front: '+z', seed: 502, mapColor: '#9c8f6a' });
  asphalt(-83.5, -36.5, -62, -36.5, '#55595f');
  // contenedores marítimos
  const cont = (x, z, c, ry = 0) => {
    B.box(c, x, 0, z, 6, 2.6, 2.5, ry);
    for (let i = -2.7; i <= 2.7; i += 0.45) B.box(c, x + i, 0.1, z + 1.27, 0.08, 2.4, 0.04, 0, { jitter: 0.1 });
    addBox(x - 3, x + 3, z - 1.25, z + 1.25, 2.6);
  };
  cont(-76, -52, '#c0392b'); cont(-76, -48.5, '#2980b9'); cont(-76, -45, '#27ae60');
  B.box('#e67e22', -76, 2.6, -48.5, 6, 2.6, 2.5);
  for (const [x, z] of [[-66, -58], [-65, -57], [-66, -56.8]]) crate(x, z, 1);
  for (let i = 0; i < 5; i++) { B.add(GEO.cyl8, '#2c3e50', -45 + i * 1.1, 0.6, -60, 0.8, 1.2, 0.8); }
  addBox(-45.5, -40, -60.5, -59.5, 1.2);
  // contenedor de entregas del proveedor
  dumpster(-48, -40.5, 0, '#2e7d4f');
  hitbox(-48, 0.8, -40.5, 2.2, 1.6, 1.4, { actions: () => G.act.deadDropActions() });
  W.pois.deadDrop = { x: -48, z: -38.6 };
  fenceLine(-83.5, -36.8, -52, -36.8, '#7f8c8d');
  W.spots.push({ id: 'callejon', name: 'Callejón del polígono', x: -59, z: -66 });
  W.mapLabels.push({ x: -48, z: -42, t: 'Entregas' });
}

const HOUSE_COLORS = ['#f6d7b0', '#cfe8d5', '#d8e4f0', '#f3c6c6', '#efe3a6', '#e0d0f0', '#f7f1e3', '#c7dceb', '#f2d0a9'];
const ROOF_COLORS = ['#8e3b2e', '#5d4037', '#455a64', '#6d4c41', '#7b3f00', '#37474f'];

function house(x, z, front, seed) {
  const alongX = front === '+z' || front === '-z';
  const hw = alongX ? 4.5 : 4, hd = alongX ? 4 : 4.5;
  const h = Math.random() < 0.35 ? 6 : 3.2;
  const o = {
    x0: x - hw, x1: x + hw, z0: z - hd, z1: z + hd, h,
    wall: HOUSE_COLORS[seed % HOUSE_COLORS.length], trim: '#ffffff', roof: ROOF_COLORS[seed % ROOF_COLORS.length],
    style: 'house', front, roofType: 'gable', seed: 600 + seed, mapColor: '#c9b28e',
  };
  const door = building(o);
  // caminito, buzón, arbustos
  const fp = frontPoint(o, 0);
  const dx = Math.sign(door.x - fp.x), dz = Math.sign(door.z - fp.z);
  B.box('#d6cdb9', fp.x + dx * 1.5, 0, fp.z + dz * 1.5, dz ? 1.2 : 3, 0.05, dx ? 1.2 : 3, 0, { shadow: false });
  bush(fp.x + (dz ? 2.4 : dx * 0.8), fp.z + (dx ? 2.4 : dz * 0.8));
  bush(fp.x - (dz ? 2.4 : -dx * 0.8), fp.z - (dx ? 2.4 : -dz * 0.8));
  const mb = { x: fp.x + dx * 2.8 + (dz ? 1.4 : 0), z: fp.z + dz * 2.8 + (dx ? 1.4 : 0) };
  B.box('#6b4a2f', mb.x, 0, mb.z, 0.1, 1.0, 0.1);
  B.box(['#c0392b', '#2980b9', '#2c3e50'][seed % 3], mb.x, 1.0, mb.z, 0.4, 0.3, 0.3);
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
      if (cx === -60 && f === '+x') continue; // aquí va el bungalow
      W.homes.push(house(x, z, f, seed++));
    }
    // patios interiores
    for (let k = 0; k < 5; k++) tree(cx + (Math.random() - 0.5) * 14, cz + (Math.random() - 0.5) * 10, 0.8 + Math.random() * 0.4);
    fenceLine(cx - 6, cz - 8, cx + 6, cz - 8, '#f2f2f2');
    W.wander.push({ x: cx + 23.8, z: cz + 8 });
  }
  W.mapLabels.push({ x: 0, z: 60, t: 'Barrio Alto' }, { x: 60, z: 60, t: 'Las Palmeras' });

  // Bungalow en venta
  const wall = '#e8d8b0';
  const door = room({
    id: 'bungalow', x0: -50, x1: -40.2, z0: 54, z1: 66, h: 3.2, wall, inner: '#f3ead6', front: '+x', doorAt: 60,
    floorTex: TX.woodTex('#b0875a'), doorColor: '#2e5e4e', locked: () => !G.state.props.bungalow,
  });
  B.add(roofGeo(12.8, 11, 2.4), '#2e5e4e', -45.1, 3.2, 60, 1, 1, 1, 0);
  B.box('#8fbcd4', -40.0, 1.0, 56.5, 0.06, 1.1, 1.6, 0, { shadow: false });
  B.box('#8fbcd4', -40.0, 1.0, 63.5, 0.06, 1.1, 1.6, 0, { shadow: false });
  W.mapRects.push({ x0: -50, x1: -40, z0: 54, z1: 66, c: '#5fa38a' });
  W.mapLabels.push({ x: -45, z: 60, t: 'Bungalow' });
  // muebles
  B.box('#5c4033', -48.6, 0, 64.6, 2.2, 0.45, 2.4);
  B.box('#f2f2f2', -48.6, 0.45, 64.6, 2.1, 0.18, 2.3);
  B.box('#2e5e4e', -48.4, 0.6, 64.6, 1.6, 0.08, 2.35);
  addBox(-49.8, -47.4, 63.3, 65.8, 0.7);
  hitbox(-48.6, 0.4, 64.6, 2.2, 0.8, 2.4, { actions: () => [{ label: 'Dormir', fn: () => G.act.sleep('bungalow') }] });
  B.box('#e9e4dc', -49.4, 0, 55, 0.8, 0.85, 1.2);
  B.box('#b7bcc0', -49.7, 0.9, 55, 0.08, 0.35, 0.08);
  addBox(-49.8, -49.0, 54.2, 55.7, 1);
  hitbox(-49.4, 0.6, 55, 0.9, 1.2, 1.2, { actions: () => [{ label: 'Rellenar regadera', fn: () => G.act.refill() }] });
  W.props.bungalow = { x0: -49.8, x1: -40.4, z0: 54.2, z1: 65.8, name: 'Bungalow', price: 2500, spawn: { x: -41.6, z: 60.8, yaw: Math.PI / 2 }, door };
  // cartel de "se vende"
  B.box('#6b4a2f', -37.6, 0, 63.5, 0.12, 1.4, 0.12);
  const sv = TX.signTex('SE VENDE · $2.500', { bg: '#ffffff', fg: '#c0392b', border: '#c0392b', w: 512, h: 160 });
  const svm = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 0.56), new THREE.MeshLambertMaterial({ map: sv, side: THREE.DoubleSide }));
  svm.position.set(-37.55, 1.55, 63.5); svm.rotation.y = Math.PI / 2; scene.add(svm);
  W.saleSign = svm;
  hitbox(-37.6, 1.2, 63.5, 0.6, 2.4, 2, { actions: () => G.act.bungalowActions() });
  W.pois.bungalow = { x: -38.5, z: 60 };
}

function buildBeach() {
  B.box('#e6d39c', 0, 0, 101, LIMIT * 2, 0.05, 9, 0, { shadow: false });
  const water = new THREE.Mesh(new THREE.PlaneGeometry(900, 400), new THREE.MeshLambertMaterial({ color: 0x2f8fb3, transparent: true, opacity: 0.92 }));
  water.rotation.x = -Math.PI / 2;
  water.position.set(0, -0.35, 305);
  scene.add(water);
  W.water = water;
  B.box('#d8c48a', 0, -0.6, 106, 900, 0.6, 2, 0, { shadow: false });
  // muelle
  for (let z = 105.5; z <= 125; z += 0.9) B.box('#9c7a52', 0, -0.1, z, 4, 0.18, 0.8, 0, { jitter: 0.12 });
  for (let z = 106; z <= 125; z += 3.5) for (const x of [-2, 2]) B.add(GEO.cyl6, '#5a4632', x, -0.5, z, 0.3, 1.6, 0.3);
  addBox(-LIMIT, -2.2, 105.2, 106.2, 10);
  addBox(2.2, LIMIT, 105.2, 106.2, 10);
  addBox(-2.4, -2.1, 106, 125.5, 10);
  addBox(2.1, 2.4, 106, 125.5, 10);
  addBox(-2.4, 2.4, 125.4, 126, 10);
  // barca
  B.box('#ecf0f1', 5.5, -0.4, 116, 1.8, 0.6, 5);
  B.box('#c0392b', 5.5, -0.15, 116, 1.85, 0.12, 5.05);
  // faro
  B.add(GEO.cyl12, '#ecf0f1', 90, 5, 112, 3.4, 10, 3.4);
  for (let y = 1; y < 10; y += 3) B.add(GEO.cyl12, '#c0392b', 90, y + 0.6, 112, 3.45, 1.2, 3.45);
  B.add(GEO.cyl8, '#2c3e50', 90, 10.6, 112, 2.2, 1.2, 2.2);
  B.add(GEO.cone8, '#c0392b', 90, 11.8, 112, 2.6, 1.4, 2.6);
  W.bulbPositions.push([90, 10.6, 110.8]);
  // sombrillas y tumbonas
  for (const [x, c] of [[-40, '#e74c3c'], [-25, '#3498db'], [22, '#f1c40f'], [48, '#2ecc71']]) {
    B.add(GEO.cyl6, '#ffffff', x, 1.2, 101, 0.08, 2.4, 0.08);
    B.add(GEO.cone8, c, x, 2.5, 101, 3, 0.7, 3);
    B.box('#ffffff', x + 1.2, 0, 102, 0.7, 0.3, 1.8);
  }
  W.spots.push({ id: 'muelle', name: 'Muelle del puerto', x: 0, z: 118 });
  W.wander.push({ x: -25, z: 99 }, { x: 0, z: 112 }, { x: 30, z: 99 });
  W.mapRects.push({ x0: -LIMIT, x1: LIMIT, z0: 96.5, z1: 106, c: '#e6d39c' });
  W.mapRects.push({ x0: -2, x1: 2, z0: 106, z1: 125, c: '#9c7a52' });
  W.mapLabels.push({ x: 0, z: 101, t: 'Puerto' });
}

function buildOutskirts() {
  const free = (x, z) => {
    for (const r of ROADS) if (Math.abs(x - r) < SWO + 1.5 || Math.abs(z - r) < SWO + 1.5) return false;
    return true;
  };
  // franjas exteriores
  let n = 0;
  while (n < 110) {
    const x = (Math.random() * 2 - 1) * (LIMIT - 2), z = -LIMIT + 2 + Math.random() * (96 + LIMIT - 6);
    if (Math.abs(x) < 96.5 && z > -96.5) continue;
    if (!free(x, z)) continue;
    tree(x, z, 0.9 + Math.random() * 0.6);
    n++;
  }
  fenceLine(-LIMIT, -LIMIT + 0.5, LIMIT, -LIMIT + 0.5);
  fenceLine(-LIMIT + 0.5, -LIMIT, -LIMIT + 0.5, 96);
  fenceLine(LIMIT - 0.5, -LIMIT, LIMIT - 0.5, 96);
  // colinas en el horizonte
  for (let i = 0; i < 40; i++) {
    const a = (i / 40) * Math.PI * 2;
    if (Math.sin(a) > 0.35) continue; // el norte es mar
    const r = 170 + Math.random() * 60;
    const s = 50 + Math.random() * 50;
    B.add(GEO.ico1, i % 2 ? '#4f8a3c' : '#5d9a47', Math.cos(a) * r, -s * 0.15, Math.sin(a) * r, s * 1.4, s * 0.6, s * 1.4, Math.random() * 3, { shadow: false, jitter: 0.08 });
  }
  // huertos en el sur
  for (let i = 0; i < 6; i++) B.box(i % 2 ? '#7a5a3a' : '#6e8f3d', -60 + i * 7, 0, -103, 6, 0.15, 12, 0, { shadow: false });
  W.mapRects.push({ x0: -63.5, x1: -21.5, z0: -109, z1: -97, c: '#7a6a3a' });
}

function buildStreetFurniture() {
  // farolas a lo largo de las calles
  for (const r of ROADS) {
    for (let t = -105; t <= 105; t += 22) {
      if (ROADS.some((q) => Math.abs(t - q) < 9)) continue;
      const s = (Math.round(t / 22) % 2 ? 1 : -1);
      lamp(r + s * 5.9, t, s > 0 ? Math.PI : 0);
      lamp(t, r - s * 5.9, s > 0 ? Math.PI / 2 : -Math.PI / 2);
    }
  }
  // papeleras y bocas de incendio
  for (const [x, z] of [[24.5, 8], [-24.5, -8], [35.6, -25], [-35.6, 25], [8, 24.5], [64, -35.8]]) {
    B.add(GEO.cyl8, '#3d6b4f', x, 0.45, z, 0.6, 0.9, 0.6);
  }
  for (const [x, z] of [[24.6, -24.6], [-24.6, 35.6], [84, 35.6], [-35.6, -84]]) {
    B.add(GEO.cyl8, '#c0392b', x, 0.4, z, 0.35, 0.8, 0.35);
    B.add(GEO.sphere, '#c0392b', x, 0.85, z, 0.36, 0.3, 0.36);
  }
}

function buildBulbs() {
  const geo = new THREE.SphereGeometry(0.22, 8, 6);
  const mat = new THREE.MeshBasicMaterial({ color: 0xdddddd });
  const im = new THREE.InstancedMesh(geo, mat, W.bulbPositions.length);
  const m = new THREE.Matrix4();
  W.bulbPositions.forEach((p, i) => { m.makeTranslation(p[0], p[1], p[2]); im.setMatrixAt(i, m); });
  scene.add(im);
  W.bulbMat = mat;
}
