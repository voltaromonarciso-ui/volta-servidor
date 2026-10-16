import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { input } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { ViewModel } from './hands.js';

const EYE = 1.64, EYE_CROUCH = 1.05, R = 0.32, WALK = 4.0, RUN = 6.8, CROUCH = 1.9, GRAV = 18, JUMP = 5.4;

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
    this.swing = 0;
    this.crouch = 0;
    this.vm = new ViewModel();
  }

  teleport(x, z, yaw) {
    this.pos.set(x, 0, z);
    if (yaw !== undefined) this.yaw = yaw;
    this.pitch = 0;
    this.vel.set(0, 0, 0);
  }

  get crouching() { return !!input.crouch; }

  update(dt, frozen) {
    const sens = G.state.settings.sens;
    const lx = frozen ? 0 : input.lookX, ly = frozen ? 0 : input.lookY;
    this.yaw -= lx * 0.0024 * sens;
    this.pitch -= ly * 0.0024 * sens;
    this.pitch = clamp(this.pitch, -1.45, 1.45);
    input.lookX = 0; input.lookY = 0;

    const fx = -Math.sin(this.yaw), fz = -Math.cos(this.yaw);
    const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw);
    let mx = frozen ? 0 : input.mx, my = frozen ? 0 : input.my;
    const len = Math.hypot(mx, my);
    if (len > 1) { mx /= len; my /= len; }
    this.crouch += ((this.crouching ? 1 : 0) - this.crouch) * Math.min(1, dt * 10);
    const speed = this.crouching ? CROUCH : input.sprint && !frozen ? RUN : WALK;
    const tx = (fx * my + rx * mx) * speed, tz = (fz * my + rz * mx) * speed;
    const acc = this.grounded ? 12 : 3;
    this.vel.x += (tx - this.vel.x) * Math.min(1, dt * acc);
    this.vel.z += (tz - this.vel.z) * Math.min(1, dt * acc);

    if (input.jump && this.grounded && !frozen && !this.crouching) { this.vy = JUMP; this.grounded = false; sfx('jump'); }
    input.jump = false;
    this.vy -= GRAV * dt;
    this.pos.y += this.vy * dt;
    if (this.pos.y <= 0) { this.pos.y = 0; this.vy = 0; this.grounded = true; }

    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    G.world.resolve(this.pos, R, this.pos.y);
    for (const car of G.cars) car.pushOut(this.pos, R);

    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hs > 0.5) {
      this.bob += dt * hs * 2.0;
      this.stepT += dt * hs;
      if (this.stepT > 2.3) { this.stepT = 0; sfx('step'); }
    }
    const eye = EYE + (EYE_CROUCH - EYE) * this.crouch;
    const bobY = this.grounded ? Math.sin(this.bob * 2) * 0.03 * Math.min(1, hs / 4) : 0;
    this.cam.position.set(this.pos.x, this.pos.y + eye + bobY, this.pos.z);
    this.cam.rotation.set(this.pitch, this.yaw, Math.cos(this.bob) * 0.004 * Math.min(1, hs / 4), 'YXZ');

    this.swing = Math.max(0, this.swing - dt * 3);
    this.vm.setHeld(G.state.inv[G.state.sel]);
    this.vm.update(dt, { bob: this.bob, speed: hs, lookX: lx, lookY: ly, swing: this.swing, crouch: this.crouch });
  }

  use() { this.swing = 1; }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
}
