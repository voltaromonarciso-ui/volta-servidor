import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { input } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { mat } from './human.js';

const EYE = 1.62, R = 0.32, WALK = 4.2, RUN = 6.9, GRAV = 18, JUMP = 5.6;

export class Player {
  constructor(camera) {
    this.cam = camera;
    this.pos = new THREE.Vector3();
    this.vel = new THREE.Vector3();
    this.yaw = 0;
    this.pitch = 0;
    this.vy = 0;
    this.grounded = true;
    this.bob = 0;
    this.stepT = 0;
    this.hand = new THREE.Group();
    this.hand.position.set(0.32, -0.3, -0.55);
    this.hand.scale.setScalar(0.62);
    camera.add(this.hand);
    this.heldKey = '';
    this.handBob = 0;
    this.swing = 0;
  }

  teleport(x, z, yaw) {
    this.pos.set(x, 0, z);
    if (yaw !== undefined) this.yaw = yaw;
    this.pitch = 0;
    this.vel.set(0, 0, 0);
  }

  update(dt, frozen) {
    const sens = G.state.settings.sens;
    if (!frozen) {
      this.yaw -= input.lookX * 0.0024 * sens;
      this.pitch -= input.lookY * 0.0024 * sens;
      this.pitch = clamp(this.pitch, -1.45, 1.45);
    }
    input.lookX = 0; input.lookY = 0;

    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = frozen ? 0 : input.mx, my = frozen ? 0 : input.my;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    const speed = input.sprint && !frozen ? RUN : WALK;
    const tx = (fx * my + rx * mx) * speed, tz = (fz * my + rz * mx) * speed;
    const acc = this.grounded ? 12 : 3;
    this.vel.x += (tx - this.vel.x) * Math.min(1, dt * acc);
    this.vel.z += (tz - this.vel.z) * Math.min(1, dt * acc);

    if (input.jump && this.grounded && !frozen) { this.vy = JUMP; this.grounded = false; sfx('jump'); }
    input.jump = false;
    this.vy -= GRAV * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0; this.grounded = true; }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    G.world.resolve(this.pos, R, this.pos.y);
    for (const car of G.cars) car.pushOut(this.pos, R);

    // cabeceo al andar + pasos
    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hs > 0.5) {
      this.bob += dt * hs * 2.1;
      this.stepT += dt * hs;
      if (this.stepT > 2.4) { this.stepT = 0; sfx('step'); }
    }
    const bobY = this.grounded ? Math.sin(this.bob * 2) * 0.035 * Math.min(1, hs / 4) : 0;
    this.cam.position.set(this.pos.x, this.pos.y + EYE + bobY, this.pos.z);
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    // mano: balanceo y animación de uso
    this.swing = Math.max(0, this.swing - dt * 3);
    const sw = Math.sin(this.swing * Math.PI);
    this.hand.position.set(0.3 + Math.cos(this.bob) * 0.01, -0.27 + Math.abs(Math.sin(this.bob)) * 0.012 - sw * 0.06, -0.6 + sw * 0.05);
    this.hand.rotation.set(-sw * 0.6, 0, 0);
    this.refreshHeld();
  }

  use() { this.swing = 1; }

  refreshHeld() {
    const s = G.state.inv[G.state.sel];
    const key = s ? s.id + (s.p || '') : '';
    if (key === this.heldKey) return;
    this.heldKey = key;
    this.hand.clear();
    if (!s) return;
    const m = heldModel(s);
    m.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.renderOrder = 5; } });
    this.hand.add(m);
  }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
}

const bx = new THREE.BoxGeometry(1, 1, 1);
const cy = new THREE.CylinderGeometry(0.5, 0.5, 1, 10);
function m(geo, color, sx, sy, sz, x = 0, y = 0, z = 0) {
  const o = new THREE.Mesh(geo, mat(color));
  o.scale.set(sx, sy, sz); o.position.set(x, y, z);
  return o;
}

// Modelos sencillos para lo que llevas en la mano.
function heldModel(s) {
  const g = new THREE.Group();
  const it = ITEMS[s.id];
  const pc = s.p && G.state.products[s.p] ? '#' + new THREE.Color(STRAINS[G.state.products[s.p].strain].color).getHexString() : '#5cbf3a';
  switch (s.id) {
    case 'regadera':
      g.add(m(cy, '#2e86de', 0.16, 0.18, 0.16));
      const spout = m(cy, '#2e86de', 0.03, 0.2, 0.03, 0, 0.05, -0.12);
      spout.rotation.x = -1.0;
      g.add(spout);
      g.add(m(bx, '#1b4f8a', 0.03, 0.12, 0.1, 0, 0.12, 0.08));
      break;
    case 'maceta':
      g.add(m(cy, '#b5651d', 0.2, 0.16, 0.2));
      break;
    case 'tierra': case 'tierra_plus':
      g.add(m(bx, s.id === 'tierra' ? '#7a5230' : '#4e342e', 0.18, 0.24, 0.1));
      g.add(m(bx, '#f1e3c6', 0.12, 0.08, 0.102, 0, 0.03, 0));
      break;
    case 'semilla':
      g.add(m(bx, '#f6e7c1', 0.1, 0.14, 0.02));
      g.add(m(bx, pc, 0.07, 0.06, 0.022, 0, 0.02, 0));
      break;
    case 'cogollo':
      for (let i = 0; i < 3; i++) g.add(m(new THREE.IcosahedronGeometry(0.5, 0), pc, 0.07, 0.09, 0.07, (i - 1) * 0.05, (i % 2) * 0.03, 0));
      break;
    case 'bolsa': case 'bolsita':
      g.add(m(bx, '#dfeee0', 0.1, 0.13, 0.03));
      if (s.id === 'bolsa') g.add(m(bx, pc, 0.07, 0.07, 0.032, 0, -0.02, 0));
      break;
    case 'tarro': case 'tarro_v':
      g.add(m(cy, '#bfe3ee', 0.1, 0.13, 0.1));
      g.add(m(cy, '#333', 0.105, 0.03, 0.105, 0, 0.075, 0));
      if (s.id === 'tarro') g.add(m(cy, pc, 0.08, 0.09, 0.08, 0, -0.01, 0));
      break;
    case 'fertil':
      g.add(m(cy, '#27ae60', 0.08, 0.2, 0.08));
      g.add(m(cy, '#fff', 0.04, 0.05, 0.04, 0, 0.12, 0));
      break;
    default: {
      if (it.ingredient) {
        g.add(m(cy, '#ecf0f1', 0.1, 0.18, 0.1));
        g.add(m(cy, '#e67e22', 0.102, 0.08, 0.102));
      } else {
        g.add(m(bx, '#9aa3a8', 0.18, 0.14, 0.14));
      }
    }
  }
  g.rotation.y = -0.4;
  return g;
}
