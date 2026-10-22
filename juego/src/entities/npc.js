import * as THREE from 'three';
import { G, rand, pick } from '../game.js';
import { makeHuman, randomLook, markerSprite } from './human.js';
import { rng } from '../world/textures.js';
import { buildItem } from './hands.js';
import { makeRealHuman, MODELS, modelNames } from './models.js';
import { dealDue } from '../systems/economy.js';

function prop(id, scale = 1.3) {
  const g = buildItem({ id }).group;
  g.scale.multiplyScalar(scale);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  return g;
}

export const LEO_MODEL = 'Male_Adult_04';

const hitMat = new THREE.MeshBasicMaterial({ visible: false });
const hitGeo = new THREE.BoxGeometry(0.9, 1.9, 0.9);

export class Walker {
  constructor(look, opts = {}) {
    this.h = opts.real && MODELS[opts.real] ? makeRealHuman(opts.real, opts) : makeHuman(look, opts);
    this.real = !!this.h.real;
    this.g = this.h.group;
    this.pos = this.g.position;
    G.scene.add(this.g);
    this.path = [];
    this.speed = 1.5;
    this.moving = 0;
    this.face = 0;
    this.hit = new THREE.Mesh(hitGeo, hitMat);
    this.hit.position.y = 0.95;
    this.g.add(this.hit);
    G.interactables.push(this.hit);
  }

  goTo(x, z, onArrive) {
    this.path = G.world.nav.path(this.pos.x, this.pos.z, x, z, G.world.los);
    this.onArrive = onArrive;
  }

  // Avanza por la ruta. Devuelve true al llegar.
  stepPath(dt, speed = this.speed) {
    if (!this.path.length) { this.moving = 0; return true; }
    const t = this.path[0];
    const dx = t.x - this.pos.x, dz = t.z - this.pos.z, d = Math.hypot(dx, dz);
    const step = speed * dt;
    if (d <= step + 0.05) {
      this.pos.x = t.x; this.pos.z = t.z;
      this.path.shift();
      if (!this.path.length) { this.moving = 0; return true; }
    } else {
      this.pos.x += (dx / d) * step;
      this.pos.z += (dz / d) * step;
      this.face = Math.atan2(dx, dz);
    }
    this.moving = speed;
    return false;
  }

  lookAt(x, z) { this.face = Math.atan2(x - this.pos.x, z - this.pos.z); }

  // Golpes (systems/combat.js): cae de espaldas y se queda en el suelo `sec` segundos
  knockOut(sec) { this.ko = sec; this.path = []; this.moving = 0; this.g.rotation.order = 'YXZ'; }
  // Mientras está en el suelo no hace nada más (devuelve true)
  koUpdate(dt) {
    if (!(this.ko > 0) && !this._koK) return false;
    this.ko -= dt;
    const want = this.ko > 0.8 ? 1 : 0;
    this._koK = Math.max(0, Math.min(1, (this._koK || 0) + (want ? dt * 4 : -dt * 2)));
    this.g.rotation.x = (-Math.PI / 2) * this._koK;
    this.pos.y = G.world.groundAt(this.pos.x, this.pos.z) + 0.12 * this._koK;
    if (this.ko <= 0 && this._koK <= 0) { this.ko = 0; this._koK = 0; this.hp = undefined; this.g.rotation.x = 0; return false; }
    return true;
  }

  animate(dt) {
    this.pos.y = G.world.groundAt(this.pos.x, this.pos.z); // de pie sobre el relieve
    let diff = this.face - this.g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    this.g.rotation.y += diff * Math.min(1, dt * 8);
    // los lejanos se animan a menos fotogramas y los ocultos no se animan
    if (!this.g.visible) return;
    this._acc = (this._acc || 0) + dt;
    const d2 = this.pos.distanceToSquared(G.player.pos);
    const step = d2 > 3600 ? 0.12 : d2 > 900 ? 0.05 : 0;
    if (this._acc < step) return;
    this.h.animate(this._acc, this.moving);
    this._acc = 0;
  }

  setMarker(text, color) {
    if (this.marker) { this.g.remove(this.marker); this.marker = null; }
    if (text) {
      this.marker = markerSprite(text, color);
      this.marker.position.y = 2.45;
      this.g.add(this.marker);
    }
  }

  distToPlayer() { return Math.hypot(G.player.pos.x - this.pos.x, G.player.pos.z - this.pos.z); }

  // Intercambio en mano: te da el dinero (izquierda) y coge tu producto (derecha).
  playExchange(spec, withCash = true) {
    this.anim = { t: 0, spec, withCash, gotItem: false };
    this.lookAt(G.player.pos.x, G.player.pos.z);
  }

  updateAnim(dt) {
    const a = this.anim, h = this.h;
    if (!a) return false;
    a.t += dt;
    this.lookAt(G.player.pos.x, G.player.pos.z);
    this.moving = 0;
    h.pose = 'give';
    if (a.withCash && a.t < 0.9) {
      if (!a.cash) { a.cash = true; h.hold('L', prop('cash', 1.4)); }
      h.over.armL = -1.25; h.over.armLz = -0.15;
    } else { h.hold('L', null); delete h.over.armL; delete h.over.armLz; }
    if (a.t > 0.45 && a.t < 1.9) {
      h.over.armR = a.t < 1.3 ? -1.3 : -0.5;
      h.over.armRz = 0.12;
      if (!a.gotItem && a.t > 0.75) { a.gotItem = true; h.hold('R', prop(a.spec.id, 1.4)); }
      if (a.t > 1.45) h.hold('R', null); // se lo guarda en el bolsillo
    }
    if (a.t > 1.9) {
      h.pose = null;
      delete h.over.armR; delete h.over.armRz;
      h.hold('R', null); h.hold('L', null);
      this.anim = null;
    }
    return true;
  }
}

// ------------------------------------------------------------------
//  Vecinos (clientes potenciales)
// ------------------------------------------------------------------
export class NPC extends Walker {
  constructor(person, home, seed) {
    const lk = randomLook(rng(seed * 97 + 13));
    lk.female = !!person.female;
    if (!lk.female && lk.hairStyle > 3) lk.hairStyle = 0;
    // cada vecino es una persona realista distinta (se reparten los modelos)
    const pool = modelNames(!!person.female).filter((n) => n !== LEO_MODEL && n !== G.state?.look?.model);
    const real = pool.length ? pool[seed % pool.length] : null;
    super(lk, real ? { real, scale: (person.female ? 0.96 : 0.97) + (seed % 4) * 0.012 } : {});
    this.person = person;
    this.id = person.id;
    this.home = home;
    this.pos.set(home.x, 0, home.z);
    this.mode = 'inside';
    this.timer = rand(0, 60);
    this.wake = 6.5 + rand(0, 2.5);
    this.sleep = 19 + rand(0, 3.5);
    this.speed = 1.35 + rand(0, 0.35);
    this.talkT = 0;
    this.g.visible = false;
    this.hit.userData.ia = { enabled: () => this.g.visible, actions: () => G.act.npcActions(this), npc: this };
    // algunos vecinos llevan algo en la mano
    const r = (seed * 7919) % 10;
    this.carry = r < 3 ? 'shopbag' : r < 5 ? 'cup' : null;
    if (this.carry === 'shopbag') this.h.hold('L', prop('shopbag', 1));
    if (this.carry === 'cup') { this.h.hold('R', prop('cup', 1.2)); }
  }

  // Mientras espera al jugador mira el móvil.
  phonePose(on) {
    if (on === this._phone) return;
    this._phone = on;
    const h = this.h;
    if (on) {
      h.hold('R', prop('phone', 1.2));
      h.pose = 'phone';
      if (!h.real) { h.over.armR = -1.35; h.over.armRz = 0.35; h.over.head = 0.35; }
    } else {
      h.hold('R', this.carry === 'cup' ? prop('cup', 1.2) : null);
      h.pose = null;
      delete h.over.armR; delete h.over.armRz; delete h.over.head;
    }
  }

  // trato aceptado cuya hora ya ha llegado (antes de la cita sigue con su vida normal)
  get deal() { return G.state.deals.find((d) => d.npc === this.id && d.status === 'accepted' && dealDue(d)); }

  awake() {
    const h = G.state.minute / 60;
    return h >= this.wake && h < this.sleep;
  }

  setVisible(v) { this.g.visible = v; }

  next() {
    const deal = this.deal;
    if (deal) {
      const spot = G.world.spots.find((s) => s.id === deal.spot);
      this.mode = 'walk';
      this.setVisible(true);
      this.goTo(spot.x + rand(-0.6, 0.6), spot.z + rand(-0.6, 0.6), () => { this.mode = 'wait'; });
      return;
    }
    if (!this.awake()) {
      this.mode = 'walk';
      this.goTo(this.home.x, this.home.z, () => { this.mode = 'inside'; this.setVisible(false); this.timer = 30; });
      return;
    }
    const W = G.world;
    const options = [...W.wander, ...Object.values(W.pois).filter((p) => p.x !== undefined), pick(W.homes)];
    const t = pick(options);
    this.mode = 'walk';
    this.setVisible(true);
    this.goTo(t.x + rand(-1, 1), t.z + rand(-1, 1), () => { this.mode = 'idle'; this.timer = rand(15, 70); });
  }

  // tras dormir o cargar: vuelve a casa al instante
  resetHome() {
    this.pos.set(this.home.x, 0, this.home.z);
    this.path = [];
    this.mode = 'inside';
    this.setVisible(false);
    this.timer = rand(0, 90);
  }

  update(dt, gameDt) {
    if (this.koUpdate(dt)) return;
    const deal = this.deal;
    this.setMarker(deal && (this.mode === 'wait' || this.mode === 'walk') ? '$' : null, '#27ae60');
    if (this.anim) { this.phonePose(false); this.updateAnim(dt); this.animate(dt); return; }
    this.phonePose(this.mode === 'wait' && this.distToPlayer() > 3.5 && this.talkT <= 0);
    if (this.carry === 'cup' && !this._phone && !this.real) this.h.over.armR = this.moving ? -0.6 : -0.9;
    if (this.talkT > 0) {
      this.talkT -= dt;
      this.lookAt(G.player.pos.x, G.player.pos.z);
      this.moving = 0;
      this.animate(dt);
      return;
    }
    switch (this.mode) {
      case 'inside':
        this.timer -= gameDt;
        if ((this.awake() && this.timer <= 0) || deal) this.next();
        break;
      case 'walk':
        if (this.stepPath(dt)) { const f = this.onArrive; this.onArrive = null; f && f(); }
        if (deal && this.path.length && this.lastDeal !== deal.id) { this.lastDeal = deal.id; this.next(); }
        break;
      case 'idle':
        this.timer -= gameDt;
        if (this.timer <= 0 || deal) this.next();
        break;
      case 'wait':
        if (!deal) { this.next(); break; }
        if (this.distToPlayer() < 6) this.lookAt(G.player.pos.x, G.player.pos.z);
        break;
    }
    // separación sencilla del jugador
    const dx = this.pos.x - G.player.pos.x, dz = this.pos.z - G.player.pos.z, d = Math.hypot(dx, dz);
    if (this.g.visible && d < 0.7 && d > 0.001) { this.pos.x += (dx / d) * (0.7 - d); this.pos.z += (dz / d) * (0.7 - d); }
    this.animate(dt);
  }

  talk(sec = 3) { this.talkT = sec; }
}

// ------------------------------------------------------------------
//  Policía
// ------------------------------------------------------------------
export class Cop extends Walker {
  constructor(name, route, seed) {
    const look = randomLook(rng(seed * 31 + 7));
    look.shirt = '#2c4a7a'; look.pants = '#1b2838';
    super(look, { police: true, real: 'Police_Male_01', scale: 0.98 + (seed % 3) * 0.02 });
    this.name = name;
    this.route = route;
    this.ri = 0;
    this.pos.set(route[0].x, 0, route[0].z);
    this.mode = 'patrol';
    this.speed = 1.6;
    this.lastSeen = null;
    this.repath = 0;
    this.friskCooldown = 0;
    this.hit.userData.ia = { enabled: () => true, actions: () => [{ label: `Hablar con ${this.name}`, fn: () => { this.talk = 2; G.act.toast?.(`${this.name}: «Circule, por favor.»`); } }] };
  }

  update(dt) {
    if (this.koUpdate(dt)) return;
    this.friskCooldown -= dt;
    const p = G.player.pos;
    switch (this.mode) {
      case 'patrol': {
        const t = this.route[this.ri];
        if (!this.path.length) this.path = [{ x: t.x, z: t.z }];
        if (this.stepPath(dt, 1.6)) this.ri = (this.ri + 1) % this.route.length;
        break;
      }
      case 'approach': { // se acerca para cachear
        this.lookAt(p.x, p.z);
        const d = this.distToPlayer();
        if (d > 1.8) {
          const dx = p.x - this.pos.x, dz = p.z - this.pos.z;
          this.pos.x += (dx / d) * 3.2 * dt; this.pos.z += (dz / d) * 3.2 * dt;
          this.moving = 3.2;
          G.world.resolve(this.pos, 0.35);
        } else { this.moving = 0; }
        break;
      }
      case 'chase': {
        const seeing = this.canSee(60);
        if (seeing) this.lastSeen = { x: p.x, z: p.z };
        const target = this.lastSeen || p;
        const dx = target.x - this.pos.x, dz = target.z - this.pos.z, d = Math.hypot(dx, dz);
        const sp = 6.0 + (G.wanted?.level || 1) * 0.25;
        if (seeing || d < 2) {
          if (d > 0.1) {
            this.pos.x += (dx / d) * sp * dt; this.pos.z += (dz / d) * sp * dt;
            this.face = Math.atan2(dx, dz);
          }
          this.path = [];
          G.world.resolve(this.pos, 0.35);
          this.moving = sp;
        } else {
          this.repath -= dt;
          if (this.repath <= 0 || !this.path.length) { this.repath = 1.2; this.path = G.world.nav.path(this.pos.x, this.pos.z, target.x, target.z, G.world.los); }
          this.stepPath(dt, sp);
        }
        break;
      }
      case 'return': {
        if (!this.path.length) {
          let best = 0, bd = Infinity;
          this.route.forEach((r, i) => { const d = Math.hypot(r.x - this.pos.x, r.z - this.pos.z); if (d < bd) { bd = d; best = i; } });
          this.ri = best;
          this.path = G.world.nav.path(this.pos.x, this.pos.z, this.route[best].x, this.route[best].z, G.world.los);
        }
        if (this.stepPath(dt, 2.2)) { this.mode = 'patrol'; }
        break;
      }
    }
    this.animate(dt);
  }

  canSee(range) {
    const p = G.player.pos;
    const d = this.distToPlayer();
    if (d > range) return false;
    if (G.world.inProperty(p.x, p.z) && d > 3) {
      const prop = G.world.props[G.world.inProperty(p.x, p.z)];
      if (!prop.door.open) return false;
    }
    return G.world.los(this.pos.x, this.pos.z, p.x, p.z);
  }

  // ¿Te ve dentro de su cono de visión?
  notices(range) {
    if (!this.canSee(range)) return false;
    const p = G.player.pos;
    const ang = Math.atan2(p.x - this.pos.x, p.z - this.pos.z);
    let diff = ang - this.g.rotation.y;
    while (diff > Math.PI) diff -= Math.PI * 2;
    while (diff < -Math.PI) diff += Math.PI * 2;
    return Math.abs(diff) < 1.1 || this.distToPlayer() < 4;
  }
}
