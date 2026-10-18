import * as THREE from 'three';
import { G } from '../game.js';
import { carParts, CAR_COLORS, ROADS } from '../world/world.js';
import { makeCar, vehiclesReady, CAR_MODELS } from './vehicles.js';
const carMats = {}, glowMats = {};
const carMat = (c) => (carMats[c] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.35, metalness: 0.5 }));
const glowMat = (c) => (glowMats[c] ||= new THREE.MeshBasicMaterial({ color: c, toneMapped: false }));
const glassMat = new THREE.MeshStandardMaterial({ color: 0x1d2a33, roughness: 0.08, metalness: 0.6 });

const box = new THREE.BoxGeometry(1, 1, 1);
const wheel = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);

// Bucles de tráfico (centro de calzada, en orden de marcha).
const LOOPS = [
  [[-30, -30], [30, -30], [30, 30], [-30, 30]],
  [[-90, 90], [90, 90], [90, -90], [-90, -90]],
  [[-30, -90], [-30, 90], [30, 90], [30, -90]],
  [[-90, -30], [90, -30], [90, 30], [-90, 30]],
];

function laneLoop(pts) {
  const n = pts.length, out = [];
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const d1 = norm(b[0] - a[0], b[1] - a[1]), d2 = norm(c[0] - b[0], c[1] - b[1]);
    // a la derecha de la marcha: (dx,dz) -> (-dz, dx)
    out.push({ x: b[0] - d1[1] * 2 - d2[1] * 2, z: b[1] + d1[0] * 2 + d2[0] * 2 });
  }
  return out;
}
function norm(x, z) { const l = Math.hypot(x, z); return [x / l, z / l]; }

const LOOK = 16;      // metros que mira por delante
const CROSS_R = 7;    // medio lado de la zona de un cruce
// Cruces (uno por cada par de calles): quién lo está atravesando ahora.
const CROSSES = [];
for (const x of ROADS) for (const z of ROADS) CROSSES.push({ x, z, owner: null, since: 0 });
// El próximo cruce en la dirección de marcha y su distancia.
function nextCross(pos, fx, fz) {
  let best = null;
  for (const c of CROSSES) {
    const rx = c.x - pos.x, rz = c.z - pos.z;
    const a = rx * fx + rz * fz;
    if (a < -CROSS_R || a > CROSS_R + 25) continue;
    if (Math.abs(rx * fz - rz * fx) > CROSS_R) continue;
    if (!best || a < best.dist) best = { c, dist: a };
  }
  return best;
}

class Car {
  constructor(loop, start, color, model) {
    this.pts = laneLoop(loop);
    this.g = new THREE.Group();
    const inner = vehiclesReady() ? makeCar(model, color) : new THREE.Group();
    if (!vehiclesReady()) carParts((kind, col, x, y, z, sx, sy, sz) => {
      const isWheel = kind === 'wheel';
      const m = new THREE.Mesh(isWheel ? wheel : box, kind === 'light' ? glowMat(col) : kind === 'glass' ? glassMat : carMat(col));
      if (isWheel) { m.scale.set(sx, sy, sz); m.rotation.z = Math.PI / 2; } else m.scale.set(sz, sy, sx);
      m.position.set(x, y, z);
      m.castShadow = kind === 'box';
      inner.add(m);
    }, color, 0, 0, 0);
    this.g.add(inner);
    // repartidos a lo largo del bucle (start = fracción del recorrido, 0–1)
    const n = this.pts.length, segs = this.pts.map((p, k) => Math.hypot(this.pts[(k + 1) % n].x - p.x, this.pts[(k + 1) % n].z - p.z));
    let rest = (start % 1) * segs.reduce((a, b) => a + b, 0), k = 0;
    while (rest > segs[k]) { rest -= segs[k]; k = (k + 1) % n; }
    const a = this.pts[k], b = this.pts[(k + 1) % n], f = rest / segs[k];
    this.g.position.set(a.x + (b.x - a.x) * f, 0, a.z + (b.z - a.z) * f);
    this.g.rotation.y = Math.atan2(b.x - a.x, b.z - a.z);
    this.i = (k + 1) % n;
    this.speed = 0;
    this.wait = 0;
    this.max = 9 + Math.random() * 3;
    G.scene.add(this.g);
  }

  update(dt) {
    const pos = this.g.position;
    // seguir la línea del carril: se apunta a un punto unos metros por delante sobre el
    // tramo actual (y el siguiente al llegar a la esquina), así no se abre al otro carril
    const n = this.pts.length;
    let A = this.pts[(this.i - 1 + n) % n], B = this.pts[this.i];
    let sx = B.x - A.x, sz = B.z - A.z;
    const len = Math.hypot(sx, sz); sx /= len; sz /= len;
    const along = (pos.x - A.x) * sx + (pos.z - A.z) * sz;
    if (along >= len - 0.3) { this.i = (this.i + 1) % n; return this.update(dt); }
    const C = this.pts[(this.i + 1) % n];
    const k = along + 4.5;
    let px, pz;
    if (k <= len) { px = A.x + sx * k; pz = A.z + sz * k; } else {
      const l2 = Math.hypot(C.x - B.x, C.z - B.z), e = Math.min(k - len, l2);
      px = B.x + ((C.x - B.x) / l2) * e; pz = B.z + ((C.z - B.z) / l2) * e;
    }
    const toCorner = len - along;
    const turn = Math.abs(Math.atan2(sx * (C.z - B.z) - sz * (C.x - B.x), sx * (C.x - B.x) + sz * (C.z - B.z)));
    const head = Math.atan2(px - pos.x, pz - pos.z);
    let diff = head - this.g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.g.rotation.y += diff * Math.min(1, dt * 5);
    const fx = Math.sin(this.g.rotation.y), fz = Math.cos(this.g.rotation.y);
    // distancia libre por delante (en el carril): el coche de delante, peatones, el
    // jugador y sus vehículos aparcados. Se frena en proporción al hueco, así se forman
    // colas y atascos naturales cuando hay mucho tráfico y se vuelve a arrancar solo.
    let gap = Infinity;
    const ahead = (ox, oz, half) => {
      const rx = ox - pos.x, rz = oz - pos.z;
      const a = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
      if (a > 0 && a < LOOK && side < half) gap = Math.min(gap, a);
    };
    for (const c of G.cars) if (c !== this) {
      const cp = c.g.position;
      if (Math.abs(cp.x - pos.x) > LOOK || Math.abs(cp.z - pos.z) > LOOK) continue;
      ahead(cp.x, cp.z, 1.7);
      // red de seguridad: quien no tiene el turno del cruce cede ante cualquier coche que
      // tenga justo delante aunque no vaya por su carril (quien tiene el turno no espera:
      // así dos coches nunca se quedan esperándose el uno al otro)
      if (!this.cross && Math.abs(cp.x - pos.x) < 8 && Math.abs(cp.z - pos.z) < 8) {
        const rx = cp.x - pos.x, rz = cp.z - pos.z, a = rx * fx + rz * fz;
        if (a > 0.5 && Math.abs(rx * fz - rz * fx) < 2.2 + a * 0.2) gap = Math.min(gap, a);
      }
    }
    const near = Math.abs(G.player.pos.x - pos.x) < 60 && Math.abs(G.player.pos.z - pos.z) < 60;
    ahead(G.player.pos.x, G.player.pos.z, 1.6);
    if (near) {
      // peatones y vehículos del jugador solo se comprueban cerca del jugador (lejos no se ve)
      for (const n of G.npcs) if (n.g.visible) ahead(n.pos.x, n.pos.z, 1.4);
      for (const v of G.state.vehicles || []) ahead(v.x, v.z, 1.5);
      for (const c of G.police || []) if (c.pos) ahead(c.pos.x, c.pos.z, 1.7);
    }
    // cruces: uno dentro a la vez; el resto espera antes de la línea de paso
    const X = nextCross(pos, fx, fz);
    if (this.cross && (Math.abs(pos.x - this.cross.x) > CROSS_R || Math.abs(pos.z - this.cross.z) > CROSS_R)) { if (this.cross.owner === this) this.cross.owner = null; this.cross = null; }
    if (X && X.dist < CROSS_R + 15 && X.c !== this.cross) {
      const o = X.c.owner;
      // si el que lo ocupa ya salió, o llevamos 9 s de juego esperando, se pasa (nunca bloqueo permanente)
      const stale = o && (o.cross !== X.c || this.wait > 9);
      if (!o || stale) { X.c.owner = this; this.cross = X.c; this.wait = 0; } else if (X.dist > CROSS_R - 0.5) { gap = Math.min(gap, X.dist - CROSS_R + 1.5); this.wait += dt; }
    }
    // velocidad objetivo: la de crucero, más lenta en curva y según el hueco libre
    let target = Math.abs(diff) > 0.3 ? 4 : this.max;
    if (turn > 0.5 && toCorner < 16) target = Math.min(target, 4 + toCorner * 0.45); // frenar antes de la curva
    if (gap < Infinity) target = Math.min(target, Math.max(0, (gap - 5.5) * 1.1));
    const acc = target < this.speed ? (gap < 12 ? 9 : 4) : 2.2; // frenar es más rápido que acelerar
    this.speed += Math.max(-acc * dt, Math.min(acc * dt, target - this.speed));
    if (this.speed < 0.02 && target === 0) this.speed = 0;
    this.stopped = this.speed < 0.5;
    const step = this.speed * dt;
    pos.x += fx * step;
    pos.z += fz * step;
  }

  // avanzar por el carril sin simular (solo para colocarlo al aparecer)
  advance(m) {
    const pos = this.g.position, n = this.pts.length;
    while (m > 0) {
      const B = this.pts[this.i], d = Math.hypot(B.x - pos.x, B.z - pos.z);
      if (d > m) { pos.x += ((B.x - pos.x) / d) * m; pos.z += ((B.z - pos.z) / d) * m; this.g.rotation.y = Math.atan2(B.x - pos.x, B.z - pos.z); break; }
      pos.x = B.x; pos.z = B.z; m -= d; this.i = (this.i + 1) % n;
    }
  }

  pushOut(p, r) {
    const pos = this.g.position;
    const fx = Math.sin(this.g.rotation.y), fz = Math.cos(this.g.rotation.y);
    for (const k of [-1.3, 0, 1.3]) {
      const cx = pos.x + fx * k, cz = pos.z + fz * k;
      const dx = p.x - cx, dz = p.z - cz, d = Math.hypot(dx, dz), R = r + 1.0;
      if (d < R && d > 0.001 && p.y < 1.4) { p.x += (dx / d) * (R - d); p.z += (dz / d) * (R - d); }
    }
  }
}

export function spawnCars(perLoop = 3) {
  let k = 0;
  LOOPS.forEach((loop, li) => {
    for (let j = 0; j < perLoop; j++) {
      // de vez en cuando pasa un taxi
      const model = k === 3 ? 'Taxi' : CAR_MODELS[k % CAR_MODELS.length];
      const car = new Car(loop, (j + 0.13 * li) / perLoop, CAR_COLORS[k++ % CAR_COLORS.length], model);
      // nunca aparece pegado a otro coche (ni en un cruce): se adelanta por su carril hasta tener sitio
      for (let tries = 0; tries < 40 && G.cars.some((o) => o.g.position.distanceTo(car.g.position) < 12); tries++) car.advance(4);
      G.cars.push(car);
    }
  });
}
