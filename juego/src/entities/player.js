import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { input } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { ViewModel, applyHandLook } from './hands.js';

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
    this.eye = new THREE.Vector3();
    this.bodyYaw = 0;
    this.camDist = 3.2;
  }

  teleport(x, z, yaw) {
    this.pos.set(x, G.world?.groundAt(x, z) || 0, z);
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

    // la posición es absoluta: el suelo está a groundAt(x, z) (relieve); las colisiones
    // miran la altura sobre el suelo
    const g0 = G.world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    this.pos.x += this.vel.x * dt;
    this.pos.z += this.vel.z * dt;
    G.world.resolve(this.pos, R, this.pos.y - g0);
    for (const car of G.cars) car.pushOut(this.pos, R);
    const gy = G.world.groundAt(this.pos.x, this.pos.z, this.pos.y);
    this.vy -= GRAV * dt;
    this.pos.y += this.vy * dt;
    // cuesta abajo se sigue pegado al suelo (sin ir dando saltitos)
    if (this.grounded && this.vy <= 0 && this.pos.y - gy < 0.3) this.pos.y = gy;
    if (this.pos.y <= gy) { this.pos.y = gy; this.vy = 0; this.grounded = true; }

    const hs = Math.hypot(this.vel.x, this.vel.z);
    if (this.grounded && hs > 0.5) {
      this.bob += dt * hs * 2.0;
      this.stepT += dt * hs;
      if (this.stepT > 2.3) { this.stepT = 0; sfx('step'); }
    }
    const eye = EYE + (EYE_CROUCH - EYE) * this.crouch;
    this.eye.set(this.pos.x, this.pos.y + eye, this.pos.z);
    const third = this.thirdPerson();
    if (third) this.thirdCam(dt, eye, hs);
    else {
      const bobY = this.grounded ? Math.sin(this.bob * 2) * 0.03 * Math.min(1, hs / 4) : 0;
      this.cam.position.set(this.pos.x, this.pos.y + eye + bobY, this.pos.z);
      this.cam.rotation.set(this.pitch, this.yaw, Math.cos(this.bob) * 0.004 * Math.min(1, hs / 4), 'YXZ');
    }
    if (third) G.avatar.group.visible = true; // (al bajar de la bici, riding lo oculta)
    if (this._third !== third) { // al cambiar de vista: manos o cuerpo
      this._third = third;
      this.vm.root.visible = !third;
      if (G.avatar && !third && !G.riding) G.avatar.group.visible = false;
    }

    this.swing = Math.max(0, this.swing - dt * 3);
    this.vm.setHeld(G.state.inv[G.state.sel]);
    this.vm.update(dt, { bob: this.bob, speed: hs, lookX: lx, lookY: ly, swing: this.swing, crouch: this.crouch });
  }

  // Tercera persona (opcional, tecla V o botón): se ve el cuerpo desde detrás del hombro
  thirdPerson() { return !!G.state?.settings?.cam3 && !!G.avatar && !G.riding; }
  thirdCam(dt, eye, hs) {
    const av = G.avatar;
    av.group.position.set(this.pos.x, this.pos.y, this.pos.z);
    // el cuerpo mira hacia donde anda (o hacia donde miras si estás parado)
    const want = hs > 0.3 ? Math.atan2(-this.vel.x, -this.vel.z) : this.yaw;
    let d = want - this.bodyYaw; d = Math.atan2(Math.sin(d), Math.cos(d));
    this.bodyYaw += d * Math.min(1, dt * 10);
    av.group.rotation.y = this.bodyYaw + Math.PI;
    av.animate?.(dt, hs);
    // cámara detrás y un poco a la derecha; se acerca si hay una pared en medio
    const cp = Math.cos(this.pitch), back = new THREE.Vector3(Math.sin(this.yaw) * cp, -Math.sin(this.pitch), Math.cos(this.yaw) * cp);
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const piv = this.eye.clone().addScaledVector(right, 0.45);
    piv.y += 0.15 - this.crouch * 0.2;
    let dist = 3.2;
    for (let k = 0; k < 6 && dist > 0.6; k++) {
      const tx = piv.x + back.x * (dist + 0.3), tz = piv.z + back.z * (dist + 0.3);
      if (G.world.los(piv.x, piv.z, tx, tz, 0.5)) break;
      dist *= 0.7;
    }
    this.camDist += (dist - this.camDist) * Math.min(1, dt * (dist < this.camDist ? 20 : 4));
    this.cam.position.copy(piv).addScaledVector(back, this.camDist);
    // sin bajar del suelo ni subir por encima del techo en interiores
    const g = G.world.groundAt(this.cam.position.x, this.cam.position.z);
    this.cam.position.y = Math.max(this.cam.position.y, g + 0.4);
    if (G.world.inProperty(this.pos.x, this.pos.z)) this.cam.position.y = Math.min(this.cam.position.y, this.pos.y + 2.55);
    this.cam.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }
  // Rayo de apuntar (interactuar y colocar): desde los ojos, en la dirección de la cámara
  aim(ray) {
    if (!this.thirdPerson()) { ray.setFromCamera({ x: 0, y: 0 }, this.cam); return ray; }
    const dir = new THREE.Vector3(0, 0, -1).applyQuaternion(this.cam.quaternion);
    ray.set(this.eye, dir);
    return ray;
  }

  use() { this.swing = 1; }

  applyLook(look) {
    applyHandLook(look);
    // manos algo más finas en personajes femeninos
    const k = look && look.female ? 1.05 : 1.15;
    this.vm.L.scale.set(k * (look && look.female ? 0.92 : 1), k, k);
    this.vm.Rh.scale.copy(this.vm.L.scale);
  }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
}
