import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { R } from '../render.js';
import { cardboardTex } from '../world/textures.js';

// Brazos y manos en primera persona (escena aparte, nunca atraviesan paredes).
const SKIN = '#e2b08c', SLEEVE = '#24272e', CUFF = '#30343c';
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const mats = {};
const M = (c, o) => (mats[c + JSON.stringify(o || {})] ||= std(c, o));

const UP = new THREE.Vector3(0, 1, 0);

function makeHand(side) {
  const g = new THREE.Group();
  g.side = side;
  const skin = M(SKIN, { roughness: 0.6 });
  const palm = new THREE.Mesh(new RoundedBoxGeometry(0.036, 0.095, 0.085, 3, 0.014), skin);
  palm.position.y = 0.045;
  g.add(palm);
  const fingerGeo = new THREE.CapsuleGeometry(0.0105, 0.042, 4, 8);
  g.fingers = [];
  for (let i = 0; i < 4; i++) {
    const f = new THREE.Group();
    f.position.set(0, 0.095, -0.03 + i * 0.02);
    const seg = new THREE.Mesh(fingerGeo, skin);
    seg.position.y = 0.025;
    f.add(seg);
    const tip = new THREE.Mesh(fingerGeo, skin);
    tip.scale.set(0.95, 0.75, 0.95);
    tip.position.y = 0.032;
    const k = new THREE.Group();
    k.position.y = 0.05;
    k.add(tip);
    f.add(k);
    f.knuckle = k;
    g.add(f);
    g.fingers.push(f);
  }
  const thumb = new THREE.Group();
  thumb.position.set(side * 0.012, 0.03, 0.045);
  const t = new THREE.Mesh(new THREE.CapsuleGeometry(0.012, 0.04, 4, 8), skin);
  t.position.y = 0.028;
  thumb.add(t);
  thumb.rotation.set(0.9, 0, side * 0.5);
  g.add(thumb);
  g.thumb = thumb;
  // puño de la sudadera
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.05, 0.05, 14), M(CUFF, { roughness: 0.95 }));
  cuff.position.y = -0.02;
  cuff.scale.set(0.85, 1, 1.15);
  g.add(cuff);
  return g;
}

function curl(hand, amt) {
  for (const f of hand.fingers) {
    f.rotation.z = -hand.side * amt * 0.7;
    f.knuckle.rotation.z = -hand.side * amt * 1.3;
  }
}

// ------------------------------------------------------------------
//  Modelos de objetos en la mano
// ------------------------------------------------------------------
const bx = (w, h, d, r = 0.01) => new RoundedBoxGeometry(w, h, d, 2, r);
function mesh(geo, mat, x = 0, y = 0, z = 0, parent) { const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); parent && parent.add(m); return m; }

function productColor(s) {
  const p = s.p && G.state.products[s.p];
  const strain = p ? p.strain : s.p;
  return STRAINS[strain] ? '#' + new THREE.Color(STRAINS[strain].color).getHexString() : '#6abf45';
}

function budCluster(color, n, spread, parent, y = 0) {
  const geo = new THREE.IcosahedronGeometry(0.02, 1);
  const mat = M(color, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < n; i++) {
    const m = mesh(geo, mat, (Math.random() - 0.5) * spread, y + Math.random() * spread * 0.5, (Math.random() - 0.5) * spread, parent);
    m.scale.set(1, 1.3, 1);
    m.rotation.set(Math.random(), Math.random(), 0);
  }
}

const cardMat = () => (mats.card ||= new THREE.MeshStandardMaterial({ map: cardboardTex(), roughness: 0.9 }));

function buildItem(s) {
  const g = new THREE.Group();
  const it = ITEMS[s.id];
  let pose = 'one';
  switch (s.id) {
    case 'caja': case 'mesa_emp': case 'estante': case 'mezcladora': case 'lampara': {
      pose = 'box';
      const b = mesh(bx(0.46, 0.28, 0.32, 0.008), cardMat(), 0, 0, 0, g);
      b.castShadow = false;
      break;
    }
    case 'maceta': {
      pose = 'box';
      mesh(new THREE.CylinderGeometry(0.15, 0.11, 0.2, 20), M('#b5602a'), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.035, 20), M('#a2541f'), 0, 0.1, 0, g);
      mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 20), M('#3f2a1a', { roughness: 1 }), 0, 0.095, 0, g);
      break;
    }
    case 'tierra': case 'tierra_plus': {
      pose = 'box';
      const c = s.id === 'tierra' ? '#5b4a35' : '#3d4a2a';
      mesh(bx(0.36, 0.22, 0.2, 0.06), M(c, { roughness: 0.6 }), 0, 0, 0, g);
      mesh(bx(0.2, 0.1, 0.205, 0.01), M('#e8dcc0'), 0, 0.02, 0, g);
      mesh(new THREE.BoxGeometry(0.06, 0.05, 0.21), M(s.id === 'tierra' ? '#7cb342' : '#c0a030'), 0, 0.02, 0, g);
      break;
    }
    case 'regadera': {
      mesh(new THREE.CylinderGeometry(0.07, 0.08, 0.15, 18), M('#2f8f5b', { roughness: 0.4, metalness: 0.2 }), 0, 0, 0, g);
      const sp = mesh(new THREE.CylinderGeometry(0.012, 0.018, 0.22, 10), M('#2f8f5b', { roughness: 0.4 }), 0, 0.03, -0.12, g);
      sp.rotation.x = -1.0;
      mesh(new THREE.CylinderGeometry(0.03, 0.02, 0.03, 10), M('#2a7a4e'), 0, 0.1, -0.21, g).rotation.x = -1.0;
      const h = mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 16, Math.PI), M('#25724a'), 0, 0.08, 0.02, g);
      h.rotation.y = Math.PI / 2;
      break;
    }
    case 'semilla': {
      mesh(bx(0.07, 0.1, 0.012, 0.003), M('#f3ead2'), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.05, 0.04, 0.014), M(productColor(s)), 0, 0.01, 0, g);
      break;
    }
    case 'cogollo':
      budCluster(productColor(s), 7, 0.06, g);
      break;
    case 'bolsa': {
      mesh(bx(0.07, 0.09, 0.02, 0.006), new THREE.MeshStandardMaterial({ color: 0xe8f1ee, roughness: 0.15, transparent: true, opacity: 0.55 }), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.075, 0.008, 0.024), M('#3b7dd8'), 0, 0.04, 0, g);
      budCluster(productColor(s), 4, 0.03, g, -0.025);
      break;
    }
    case 'bolsita':
      for (let i = 0; i < 3; i++) mesh(bx(0.07, 0.09, 0.006, 0.003), new THREE.MeshStandardMaterial({ color: 0xe8f1ee, roughness: 0.2, transparent: true, opacity: 0.6 }), i * 0.004, i * 0.004, i * 0.008, g);
      break;
    case 'tarro': case 'tarro_v': {
      mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.1, 18), new THREE.MeshStandardMaterial({ color: 0xdff2f7, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.45 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.022, 18), M('#2b2b2b', { roughness: 0.4, metalness: 0.5 }), 0, 0.06, 0, g);
      if (s.id === 'tarro') budCluster(productColor(s), 8, 0.05, g, -0.035);
      break;
    }
    case 'fertil':
      mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.14, 14), M('#2e7d32', { roughness: 0.35 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 10), M('#f5f5f5'), 0, 0.085, 0, g);
      break;
    case 'energetica':
      mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.12, 16), M('#1f8ad1', { roughness: 0.25, metalness: 0.6 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.031, 0.031, 0.03, 16), M('#d7e05a', { roughness: 0.3, metalness: 0.4 }), 0, 0.01, 0, g);
      break;
    case 'platano': {
      const c = new THREE.Mesh(new THREE.TorusGeometry(0.08, 0.017, 8, 16, 2.2), M('#f2d03b'));
      c.rotation.z = 0.6; g.add(c);
      break;
    }
    case 'guindilla':
      mesh(new THREE.ConeGeometry(0.018, 0.1, 10), M('#d32f2f', { roughness: 0.35 }), 0, 0, 0, g).rotation.z = Math.PI;
      break;
    case 'leche':
      mesh(new THREE.BoxGeometry(0.06, 0.12, 0.06), M('#f5f5f5'), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.061, 0.04, 0.061), M('#2f80ed'), 0, -0.02, 0, g);
      break;
    case 'pila':
      mesh(new THREE.BoxGeometry(0.045, 0.07, 0.025), M('#222', { metalness: 0.4, roughness: 0.4 }), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.046, 0.02, 0.026), M('#e6b422'), 0, 0.02, 0, g);
      break;
    default:
      if (it.ingredient) {
        const col = { cafe: '#6d4c41', chicle: '#ec6fa8', ibuprofeno: '#ffffff', menta: '#43a047', purpurina: '#b388ff', batido: '#90a4ae', miel: '#f9a825' }[s.id] || '#ccc';
        mesh(bx(0.06, 0.1, 0.04, 0.008), M(col, { roughness: 0.5 }), 0, 0, 0, g);
        mesh(new THREE.BoxGeometry(0.062, 0.03, 0.042), M('#fafafa'), 0, 0.005, 0, g);
      } else {
        pose = 'box';
        mesh(bx(0.3, 0.2, 0.25), cardMat(), 0, 0, 0, g);
      }
  }
  if (s.id === 'regadera') g.scale.setScalar(0.72);
  g.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
  return { group: g, pose };
}

// ------------------------------------------------------------------
export class ViewModel {
  constructor() {
    this.root = new THREE.Group();
    R.handScene.add(this.root);
    this.L = makeHand(1);
    this.Rh = makeHand(-1);
    this.L.scale.setScalar(1.15);
    this.Rh.scale.setScalar(1.15);
    const sleeveGeo = new THREE.CylinderGeometry(0.058, 0.07, 1, 16, 1, true);
    const sm = M(SLEEVE, { roughness: 0.95, side: THREE.DoubleSide });
    this.sleeveL = new THREE.Mesh(sleeveGeo, sm);
    this.sleeveR = new THREE.Mesh(sleeveGeo, sm);
    this.root.add(this.L, this.Rh, this.sleeveL, this.sleeveR);
    this.itemHolder = new THREE.Group();
    this.root.add(this.itemHolder);
    this.key = null;
    this.pose = 'none';
    this.drop = 1;      // 0 = arriba, 1 = fuera de pantalla
    this.pending = null;
    this.swayX = 0; this.swayY = 0;
    this.t = 0;
  }

  setHeld(s) {
    const key = s ? s.id + '|' + (s.p || '') : '';
    if (key === this.key) return;
    this.key = key;
    this.pending = s ? { ...s } : null;
    this.swapping = true;
  }

  applyPending() {
    this.itemHolder.clear();
    if (!this.pending) { this.pose = 'none'; return; }
    const { group, pose } = buildItem(this.pending);
    this.itemHolder.add(group);
    this.pose = pose;
  }

  update(dt, { bob = 0, speed = 0, lookX = 0, lookY = 0, swing = 0, crouch = 0 }) {
    this.t += dt;
    // animación de cambio de objeto
    if (this.swapping) {
      this.drop = Math.min(1, this.drop + dt * 6);
      if (this.drop >= 1) { this.applyPending(); this.swapping = false; }
    } else this.drop = Math.max(0, this.drop - dt * 4.5);
    const vis = this.pose !== 'none' || this.swapping;
    this.root.visible = vis;
    if (!vis) return;

    this.swayX += (-lookX * 0.0009 - this.swayX) * Math.min(1, dt * 10);
    this.swayY += (lookY * 0.0009 - this.swayY) * Math.min(1, dt * 10);
    const k = Math.min(1, speed / 5);
    const bx_ = Math.cos(bob) * 0.012 * k + this.swayX;
    const by = -Math.abs(Math.sin(bob)) * 0.014 * k + Math.sin(this.t * 1.6) * 0.003 + this.swayY - this.drop * 0.55 - crouch * 0.02;
    const push = Math.sin(swing * Math.PI);

    if (this.pose === 'box') {
      const base = new THREE.Vector3(bx_, -0.235 + by - push * 0.03, -0.72 + push * 0.06);
      this.itemHolder.position.copy(base);
      this.itemHolder.rotation.set(-0.12, -0.03, 0);
      const s = this.itemHolder.children[0];
      const w = s ? new THREE.Box3().setFromObject(s).getSize(new THREE.Vector3()).x / 2 : 0.21;
      const d = 0.16;
      this.placeHand(this.L, base.x - w - 0.012, base.y - 0.09, base.z + d - 0.01, 0.85, 0.75, 0.15, 0.55);
      this.placeHand(this.Rh, base.x + w + 0.012, base.y - 0.09, base.z + d - 0.01, 0.85, -0.75, -0.15, 0.55);
      this.L.visible = this.Rh.visible = this.sleeveL.visible = this.sleeveR.visible = true;
    } else {
      // una mano: derecha, objeto en la palma
      const hx = 0.2 + bx_, hy = -0.26 + by - push * 0.04, hz = -0.46 + push * 0.08;
      this.placeHand(this.Rh, hx, hy, hz, 1.6, 2.1, -1.5708, 0.75);
      this.Rh.updateMatrix();
      this.itemHolder.position.copy(new THREE.Vector3(-0.07, 0.065, 0).applyMatrix4(this.Rh.matrix));
      this.itemHolder.rotation.set(0.25, -0.6, 0.05);
      this.L.visible = this.sleeveL.visible = false;
      this.Rh.visible = this.sleeveR.visible = true;
    }
    this.fitSleeve(this.sleeveL, this.L, -0.34);
    this.fitSleeve(this.sleeveR, this.Rh, 0.34);
  }

  placeHand(h, x, y, z, rx, ry, rz, grip) {
    h.position.set(x, y, z);
    h.rotation.set(rx - 1.25, ry, rz);
    curl(h, grip);
  }

  fitSleeve(sleeve, hand, sx) {
    const wrist = new THREE.Vector3(0, -0.035, 0).applyMatrix4(hand.matrix.compose(hand.position, hand.quaternion.setFromEuler(hand.rotation), hand.scale));
    const shoulder = new THREE.Vector3(sx * 1.35, -0.7, -0.1);
    const dir = wrist.clone().sub(shoulder);
    const len = dir.length();
    sleeve.position.copy(shoulder).addScaledVector(dir, 0.5);
    sleeve.quaternion.setFromUnitVectors(UP, dir.normalize());
    sleeve.scale.set(1, len, 1);
  }
}
