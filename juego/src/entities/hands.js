import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { R } from '../render.js';
import { cardboardTex } from '../world/textures.js';
import { budPile as goodsPile, zipBag, jar, shardsBag, crystalCluster, cashStack, seedPile } from './goods.js';

// Brazos y manos en primera persona (escena aparte, nunca atraviesan paredes).
const SKIN = '#e2b08c', SLEEVE = '#24272e', CUFF = '#30343c';
const std = (color, o = {}) => new THREE.MeshStandardMaterial({ color, roughness: 0.75, ...o });
const mats = {};
const M = (c, o) => (mats[c + JSON.stringify(o || {})] ||= std(c, o));

const UP = new THREE.Vector3(0, 1, 0);

// Materiales compartidos de la piel y la manga (se recolorean con la personalización).
export const handMats = {
  skin: new THREE.MeshPhysicalMaterial({ color: SKIN, roughness: 0.58, sheen: 0.35, sheenRoughness: 0.6, sheenColor: new THREE.Color('#ff9f7a') }),
  nail: new THREE.MeshPhysicalMaterial({ color: '#f1c9b8', roughness: 0.25, clearcoat: 0.6 }),
  crease: new THREE.MeshStandardMaterial({ color: '#c98f6d', roughness: 0.7 }),
  cuff: new THREE.MeshStandardMaterial({ color: CUFF, roughness: 0.95 }),
  sleeve: new THREE.MeshStandardMaterial({ color: SLEEVE, roughness: 0.95, side: THREE.DoubleSide }),
};
const capG = new THREE.CapsuleGeometry(0.5, 1, 6, 12);
const sphG = new THREE.SphereGeometry(0.5, 16, 12);
const palmG = new RoundedBoxGeometry(1, 1, 1, 4, 0.32);

function seg(parent, r0, len, y) {
  const m = new THREE.Mesh(capG, handMats.skin);
  m.scale.set(r0 * 2, len, r0 * 2.1);
  m.position.y = y;
  parent.add(m);
  return m;
}

// Mano anatómica: palma con relieve, 4 dedos de 3 falanges, pulgar y uñas.
// Ejes locales: los dedos crecen hacia +Y, la palma mira a ±X, el ancho va en Z.
function makeHand(side) {
  const g = new THREE.Group();
  g.side = side;
  const sk = handMats.skin;
  // palma (más ancha en los nudillos que en la muñeca)
  const palm = new THREE.Mesh(palmG, sk);
  palm.scale.set(0.03, 0.088, 0.08);
  palm.position.y = 0.046;
  g.add(palm);
  const heel = new THREE.Mesh(sphG, sk); heel.scale.set(0.03, 0.04, 0.065); heel.position.set(side * 0.004, 0.012, 0.002); g.add(heel);
  const thenar = new THREE.Mesh(sphG, sk); thenar.scale.set(0.03, 0.05, 0.032); thenar.position.set(side * 0.008, 0.03, 0.03); g.add(thenar);
  // dedos: índice, corazón, anular, meñique (desde el lado del pulgar)
  const lens = [[0.04, 0.026, 0.021], [0.044, 0.029, 0.022], [0.041, 0.027, 0.021], [0.032, 0.02, 0.018]];
  const rad = [0.0098, 0.0102, 0.0096, 0.0084];
  g.fingers = [];
  for (let i = 0; i < 4; i++) {
    const z = 0.029 - i * 0.0195;
    const base = new THREE.Group();
    base.position.set(0, 0.088 + (i === 1 ? 0.004 : i === 3 ? -0.008 : 0), z);
    base.rotation.x = (i - 1.5) * 0.04;
    g.add(base);
    const kn = new THREE.Mesh(sphG, sk); kn.scale.setScalar(rad[i] * 2.3); base.add(kn);
    let parent = base;
    const joints = [];
    lens[i].forEach((L, j) => {
      const r = rad[i] * (1 - j * 0.1);
      const jt = new THREE.Group();
      jt.position.y = j === 0 ? 0 : lens[i][j - 1];
      parent.add(jt);
      seg(jt, r, L * 0.62, L / 2);
      if (j === 2) {
        const nail = new THREE.Mesh(palmG, handMats.nail);
        nail.scale.set(0.003, L * 0.55, r * 1.6);
        nail.position.set(-side * r * 0.95, L * 0.6, 0);
        jt.add(nail);
      }
      joints.push(jt);
      parent = jt;
    });
    base.joints = joints;
    g.fingers.push(base);
  }
  // pulgar (sale de la base de la palma, en diagonal)
  const thumb = new THREE.Group();
  thumb.position.set(side * 0.012, 0.028, 0.038);
  thumb.rotation.set(0.75, 0, side * 0.55);
  g.add(thumb);
  let tp = thumb;
  thumb.joints = [];
  [[0.034, 0.0125], [0.026, 0.0115], [0.022, 0.0105]].forEach(([L, r], j) => {
    const jt = new THREE.Group();
    jt.position.y = j === 0 ? 0 : [0.034, 0.026][j - 1];
    tp.add(jt);
    seg(jt, r, L * 0.6, L / 2);
    if (j === 2) {
      const nail = new THREE.Mesh(palmG, handMats.nail);
      nail.scale.set(0.003, L * 0.55, r * 1.6);
      nail.position.set(-side * r * 0.95, L * 0.6, 0);
      jt.add(nail);
    }
    thumb.joints.push(jt);
    tp = jt;
  });
  g.thumb = thumb;
  // puño de la manga
  const cuff = new THREE.Mesh(new THREE.CylinderGeometry(0.046, 0.044, 0.05, 18), handMats.cuff);
  cuff.position.y = -0.024;
  cuff.scale.set(0.85, 1, 1.25);
  g.add(cuff);
  return g;
}

// Cierra los dedos (0 = abierta, 1 = puño). Cada falange se dobla hacia la palma.
function curl(hand, amt) {
  hand.fingers.forEach((f, i) => {
    const a = amt * (1 + i * 0.05);
    f.joints[0].rotation.z = -hand.side * a * 0.8;
    f.joints[1].rotation.z = -hand.side * a * 1.1;
    f.joints[2].rotation.z = -hand.side * a * 0.7;
  });
  hand.thumb.joints[1].rotation.z = -hand.side * amt * 0.5;
  hand.thumb.joints[2].rotation.z = -hand.side * amt * 0.4;
}

// Colores de piel y ropa del jugador.
export function applyHandLook(look) {
  if (!look) return;
  handMats.skin.color.set(look.skin);
  handMats.nail.color.set(look.skin).lerp(new THREE.Color('#ffd9d0'), 0.55);
  // con camiseta se ve el antebrazo; con sudadera o chaqueta, la manga
  const bare = look.top === 'tee';
  handMats.sleeve.color.set(bare ? look.skin : look.shirt);
  handMats.cuff.color.set(bare ? look.skin : look.shirt).multiplyScalar(bare ? 1 : 0.8);
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

const cardMat = () => (mats.card ||= new THREE.MeshStandardMaterial({ map: cardboardTex(), roughness: 0.9 }));

export function buildItem(s) {
  const g = new THREE.Group();
  const it = ITEMS[s.id] || {};
  let pose = 'one';
  switch (s.id) {
    case 'cash': {
      // fajo de billetes con faja
      const c = cashStack(7); c.rotation.y = Math.PI / 2; c.position.y = -0.005; g.add(c);
      break;
    }
    case 'phone': {
      mesh(bx(0.07, 0.14, 0.01, 0.008), M('#1b1d22', { roughness: 0.3, metalness: 0.5 }), 0, 0, 0, g);
      mesh(new THREE.PlaneGeometry(0.06, 0.12), new THREE.MeshBasicMaterial({ color: 0x8fd3ff, toneMapped: false }), 0, 0, 0.0055, g);
      break;
    }
    case 'cup': {
      mesh(new THREE.CylinderGeometry(0.04, 0.032, 0.12, 14), M('#f2ede4'), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.042, 0.042, 0.015, 14), M('#3a2a20'), 0, 0.065, 0, g);
      mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.04, 14), M('#7b4a2a'), 0, 0, 0, g);
      break;
    }
    case 'shopbag': {
      mesh(bx(0.3, 0.32, 0.14, 0.01), M(['#e8dcc0', '#d94a3a', '#2e86de'][Math.floor(Math.random() * 3)], { roughness: 0.9 }), 0, -0.2, 0, g);
      mesh(new THREE.TorusGeometry(0.06, 0.01, 6, 12, Math.PI), M('#3a3a3a'), 0, -0.04, 0, g);
      break;
    }
    case 'caja': case 'mesa_emp': case 'estante': case 'lampara': case 'envasadora': case 'hornillo': {
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
      // un puñado de semillas de verdad en la mano (algo más grandes de lo real para que se vean)
      const p = new THREE.Group(); seedPile(p, 5, 0.026); p.position.set(0.005, -0.05, 0.01); g.add(p);
      break;
    }
    case 'sobre_vacio': {
      // sobre de papel vacío, abierto por arriba
      const pk = mesh(bx(0.09, 0.12, 0.012, 0.004), M('#cbbd9f', { roughness: 0.9 }), 0, 0, 0, g);
      pk.rotation.set(-0.3, 0.2, 0.1);
      mesh(bx(0.092, 0.026, 0.013, 0.003), M('#8aa48a', { roughness: 0.9 }), 0, -0.03, 0.001, pk);
      break;
    }
    case 'cogollo': {
      // puñado de cogollos sueltos
      const p = new THREE.Group(); goodsPile(p, productColor(s), 5, 0.07, 0.04, 0.034, 3); p.position.y = -0.03; g.add(p);
      break;
    }
    case 'bolsa': g.add(zipBag(productColor(s))); break;
    case 'bolsita':
      for (let i = 0; i < 4; i++) { const b = zipBag(null, { flat: true }); b.position.set(i * 0.004, i * 0.003, i * 0.005); b.rotation.z = (i - 1.5) * 0.06; g.add(b); }
      break;
    case 'tarro': case 'tarro_v': {
      const j = jar(s.id === 'tarro' ? productColor(s) : null); j.position.y = -0.06; g.add(j);
      break;
    }
    case 'cristal': {
      const c = new THREE.Group(); crystalCluster(c, 8, 0.07, 0.05, 5); c.position.y = -0.02; g.add(c);
      break;
    }
    case 'shards': g.add(shardsBag(true)); break;
    case 'bolsa_ss':
      for (let i = 0; i < 3; i++) { const b = shardsBag(false); b.position.set(i * 0.004, i * 0.003, i * 0.006); b.rotation.z = (i - 1) * 0.07; g.add(b); }
      break;
    case 'azucar':
      mesh(bx(0.07, 0.1, 0.04, 0.008), M('#fafafa', { roughness: 0.8 }), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.072, 0.03, 0.042), M('#2e86de'), 0, 0.01, 0, g);
      break;
    case 'colorante':
      for (let i = 0; i < 3; i++) {
        const c = ['#e74c3c', '#3498db', '#9b59b6'][i];
        mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.06, 10), M(c, { roughness: 0.3 }), (i - 1) * 0.028, 0, 0, g);
        mesh(new THREE.ConeGeometry(0.008, 0.02, 8), M('#fafafa'), (i - 1) * 0.028, 0.04, 0, g);
      }
      break;
    case 'catalizador':
      mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.1, 16), M('#455a64', { metalness: 0.4, roughness: 0.35 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.04, 16), M('#ffca28', { emissive: '#ffca28', emissiveIntensity: 0.2 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.02, 12), M('#212121'), 0, 0.06, 0, g);
      break;
    case 'fertil':
      mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.14, 14), M('#2e7d32', { roughness: 0.35 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.03, 10), M('#f5f5f5'), 0, 0.085, 0, g);
      break;
    default:
      pose = 'box';
      mesh(bx(0.3, 0.2, 0.25), cardMat(), 0, 0, 0, g);
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
    const sleeveGeo = new THREE.CylinderGeometry(0.05, 0.068, 1, 18, 1, true);
    const sm = handMats.sleeve;
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

  // Animación de entregar lo que llevas en la mano.
  give() { this.giveT = 1; }

  // Muestra un objeto temporal en la palma (p. ej. el dinero que te dan).
  flash(id, sec = 1.5) {
    this.flashT = sec;
    this.itemHolder.clear();
    this.itemHolder.visible = true;
    this.itemHolder.add(buildItem({ id }).group);
    this.pose = 'one';
    this.drop = 0.6;
  }

  setHeld(s) {
    if (this.flashT > 0) return;
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
    if (this.flashT > 0) {
      this.flashT -= dt;
      if (this.flashT <= 0) { this.key = null; this.itemHolder.clear(); this.pose = 'none'; }
    }
    let giveK = 0;
    if (this.giveT > 0) {
      this.giveT = Math.max(0, this.giveT - dt * 1.8);
      giveK = Math.sin((1 - this.giveT) * Math.PI);
      if (this.giveT < 0.45 && !this.flashT) this.itemHolder.visible = false;
      if (this.giveT === 0) this.itemHolder.visible = true;
    }
    this.giveK = giveK;
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
    const push = Math.sin(Math.min(1, swing) * Math.PI);
    const gk = this.giveK || 0;

    if (this.pose === 'box') {
      const base = new THREE.Vector3(bx_, -0.235 + by - push * 0.03 + gk * 0.08, -0.72 + push * 0.06 - gk * 0.3);
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
      const hx = 0.2 + bx_ - gk * 0.12, hy = -0.26 + by - push * 0.04 + gk * 0.1, hz = -0.46 + push * 0.08 - gk * 0.3;
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
