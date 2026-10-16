import * as THREE from 'three';
import { G } from '../game.js';
import { carParts, CAR_COLORS } from '../world/world.js';
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

class Car {
  constructor(loop, start, color) {
    this.pts = laneLoop(loop);
    this.i = start % this.pts.length;
    this.g = new THREE.Group();
    const inner = new THREE.Group();
    carParts((kind, col, x, y, z, sx, sy, sz) => {
      const isWheel = kind === 'wheel';
      const m = new THREE.Mesh(isWheel ? wheel : box, kind === 'light' ? glowMat(col) : kind === 'glass' ? glassMat : carMat(col));
      if (isWheel) { m.scale.set(sx, sy, sz); m.rotation.z = Math.PI / 2; } else m.scale.set(sz, sy, sx);
      m.position.set(x, y, z);
      m.castShadow = kind === 'box';
      inner.add(m);
    }, color, 0, 0, 0);
    this.g.add(inner);
    const p = this.pts[this.i];
    this.g.position.set(p.x, 0, p.z);
    this.i = (this.i + 1) % this.pts.length;
    this.speed = 0;
    this.max = 9 + Math.random() * 3;
    G.scene.add(this.g);
  }

  update(dt) {
    const t = this.pts[this.i];
    const pos = this.g.position;
    const dx = t.x - pos.x, dz = t.z - pos.z, d = Math.hypot(dx, dz);
    const head = Math.atan2(dx, dz);
    let diff = head - this.g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.g.rotation.y += diff * Math.min(1, dt * 4);
    // frenar ante el jugador u otro coche
    const fx = Math.sin(this.g.rotation.y), fz = Math.cos(this.g.rotation.y);
    let blocked = false;
    const check = (ox, oz, range) => {
      const rx = ox - pos.x, rz = oz - pos.z;
      const ahead = rx * fx + rz * fz, side = Math.abs(rx * fz - rz * fx);
      return ahead > 0 && ahead < range && side < 1.6;
    };
    if (check(G.player.pos.x, G.player.pos.z, 8)) blocked = true;
    for (const c of G.cars) if (c !== this && check(c.g.position.x, c.g.position.z, 7)) blocked = true;
    const target = blocked ? 0 : Math.abs(diff) > 0.3 ? 4 : this.max;
    this.speed += (target - this.speed) * Math.min(1, dt * (blocked ? 5 : 1.5));
    const step = this.speed * dt;
    if (d < Math.max(1.5, step)) this.i = (this.i + 1) % this.pts.length;
    pos.x += fx * step;
    pos.z += fz * step;
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

export function spawnCars() {
  let k = 0;
  LOOPS.forEach((loop, li) => {
    for (let j = 0; j < 2; j++) G.cars.push(new Car(loop, j * 2 + li, CAR_COLORS[k++ % CAR_COLORS.length]));
  });
}
