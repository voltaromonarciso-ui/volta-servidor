import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { R } from '../render.js';
import { cardboardTex } from '../world/textures.js';
import { budPile as goodsPile, zipBag, jar, shardsBag, crystalCluster, cashStack, seedPile, vialModel, blisterModel, amberBottle, dropperModel, powderPile, pillModel } from './goods.js';
import { FPArms, collectSolids } from './fparms.js';
import { HELD } from './helditems.js';
import { MODELS } from './models.js';

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

// Postura de reposo del arma blanca en la vista: la hoja (eje +y del modelo) de pie, con la
// cara plana hacia la cámara, la sierra del lomo a la izquierda y el filo (+x) a la derecha
export const MELEE_Q = (() => {
  const D = new THREE.Vector3(0.02, 1, -0.08).normalize();
  const E = new THREE.Vector3(1, 0, 0.3); E.addScaledVector(D, -E.dot(D)).normalize(); // (el puño algo girado hacia la cámara)
  return new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(E, D, new THREE.Vector3().crossVectors(E, D)));
})();
const _qArc = new THREE.Quaternion(), _eArc = new THREE.Euler();

export function buildItem(s) {
  // modelos realistas con texturas (helditems.js); el resto, los de aquí y los de goods.js
  if (HELD[s.id]) {
    const r = HELD[s.id](s);
    r.group.traverse((o) => { if (o.isMesh) { o.castShadow = false; o.receiveShadow = false; } });
    return { group: r.group, pose: r.pose, hold: r.hold, grips: r.grips };
  }
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
    case 'spray': {
      mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.15, 14), M('#c62828', { roughness: 0.4, metalness: 0.2 }), 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.029, 0.029, 0.04, 14), M('#ffd54f', { roughness: 0.5 }), 0, -0.01, 0, g);
      mesh(bx(0.04, 0.035, 0.04, 0.006), M('#222'), 0, 0.093, 0, g);
      break;
    }
    case 'porra': {
      mesh(new THREE.CylinderGeometry(0.017, 0.019, 0.16, 12), M('#1d1f22', { roughness: 0.9 }), 0, -0.03, 0, g);
      mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.26, 10), M('#5d636a', { roughness: 0.35, metalness: 0.7 }), 0, 0.17, 0, g);
      mesh(new THREE.SphereGeometry(0.015, 10, 8), M('#6b7178', { roughness: 0.3, metalness: 0.8 }), 0, 0.3, 0, g);
      g.rotation.x = -0.5;
      break;
    }
    case 'pistola': {
      const metal = M('#2b2e33', { roughness: 0.35, metalness: 0.6 });
      mesh(bx(0.03, 0.035, 0.17, 0.006), metal, 0, 0.02, -0.04, g);
      const grip = mesh(bx(0.028, 0.09, 0.04, 0.008), M('#3a2a1e', { roughness: 0.8 }), 0, -0.03, 0.03, g);
      grip.rotation.x = -0.25;
      break;
    }
    case 'machete': {
      // hoja curva con filo claro, mango de madera con remaches
      const blade = new THREE.Shape();
      blade.moveTo(-0.022, 0); blade.lineTo(0.02, 0); blade.quadraticCurveTo(0.034, 0.2, 0.012, 0.34); blade.quadraticCurveTo(-0.01, 0.36, -0.022, 0.3); blade.lineTo(-0.022, 0);
      const bg = new THREE.ExtrudeGeometry(blade, { depth: 0.004, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1 });
      bg.translate(0, 0, -0.002);
      mesh(bg, M('#aab2ba', { roughness: 0.25, metalness: 0.85 }), 0, 0.05, 0, g);
      mesh(bx(0.03, 0.12, 0.022, 0.008), M('#5a3a22', { roughness: 0.75 }), 0, -0.02, 0, g);
      for (const y of [-0.05, 0.01]) mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.026, 8), M('#c9b27a', { metalness: 0.8, roughness: 0.3 }), 0, y, 0, g).rotation.x = Math.PI / 2;
      mesh(bx(0.05, 0.012, 0.026, 0.003), M('#2b2e33', { metalness: 0.6, roughness: 0.4 }), 0, 0.045, 0, g); // guarda
      g.rotation.x = -0.45;
      break;
    }
    case 'balas': {
      // caja de munición de cartón con balas de latón asomando
      mesh(bx(0.08, 0.05, 0.06, 0.004), M('#3d4a2e', { roughness: 0.8 }), 0, 0, 0, g);
      for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
        mesh(new THREE.CylinderGeometry(0.0045, 0.0045, 0.02, 8), M('#c9a24a', { metalness: 0.85, roughness: 0.3 }), -0.027 + i * 0.018, 0.033, -0.015 + j * 0.015, g);
        mesh(new THREE.SphereGeometry(0.0045, 8, 6), M('#b0714a', { metalness: 0.8, roughness: 0.35 }), -0.027 + i * 0.018, 0.044, -0.015 + j * 0.015, g);
      }
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
    case 'tarro_cr': { const j = jar(null, { fill: 'crystal' }); j.position.y = -0.06; g.add(j); break; }
    case 'sobre_polvo': g.add(zipBag(null, { fill: 'powder' })); break;
    case 'vial': case 'vial_v': for (let i = 0; i < (s.id === 'vial' ? 1 : 3); i++) { const v = vialModel(s.id === 'vial'); v.position.set(i * 0.03 - (s.id === 'vial' ? 0 : 0.03), -0.05, 0); v.scale.setScalar(1.3); g.add(v); } break;
    case 'blister': case 'blister_v': { const b = blisterModel(s.id === 'blister'); b.scale.setScalar(1.3); g.add(b); break; }
    case 'frasco': case 'frasco_v': { const f = amberBottle(s.id === 'frasco'); f.position.y = -0.05; f.scale.setScalar(1.3); g.add(f); break; }
    case 'gotero': case 'gotero_v': { const d = dropperModel(s.id === 'gotero'); d.position.y = -0.05; d.scale.setScalar(1.3); g.add(d); break; }
    case 'polvo': { const p = powderPile(); p.position.y = -0.02; g.add(p); break; }
    case 'pastilla': for (let i = 0; i < 4; i++) { const p = pillModel(1.6); p.position.set((i % 2) * 0.03 - 0.015, Math.floor(i / 2) * 0.02, 0); p.rotation.z = 0.6 + i; g.add(p); } break;
    case 'extracto': { const d = dropperModel(false); d.position.y = -0.05; d.scale.setScalar(1.3); g.add(d); break; }
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

  // Brazos del propio personaje (fparms.js) en vez de las manos dibujadas por código
  useAvatar(model, style) {
    if (model && MODELS[model] && this.armsModel !== model) {
      if (this.arms) this.arms.group.removeFromParent();
      this.arms = new FPArms(model);
      this.armsModel = model;
      if (this.arms.ok) this.root.add(this.arms.group);
      else this.arms = null;
    }
    if (this.arms && style) this.arms.apply(style);
  }

  // Animación de entregar lo que llevas en la mano.
  give() { this.giveT = 1; }

  // Golpe (combat.js): 'punch' = puñetazo (se ve el puño aunque no lleves nada), 'swing' =
  // golpe con lo que llevas, 'shot' = disparo con fogonazo
  strike(kind) {
    this.strikeT = 1; this.strikeKind = kind;
    if (kind === 'shot') {
      if (!this.flash3) {
        this.flash3 = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), new THREE.MeshBasicMaterial({ color: '#ffd27a', transparent: true, opacity: 0.95 }));
        this.flash3.scale.set(1, 1, 2.2);
      }
      this.itemHolder.children[0]?.add(this.flash3);
      this.flash3.position.set(0, 0.03, -0.17);
      this.flash3.visible = true;
    }
  }

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
    const { group, pose, hold, grips } = buildItem(this.pending);
    this.pose = pose;
    this.grips = grips || null;
    // punto de agarre: el centro de la base del objeto (se apoya sobre la palma, no la atraviesa);
    // se mide antes de colgarlo del soporte, en las coordenadas del propio soporte
    group.updateMatrixWorld(true);
    const bb = new THREE.Box3().setFromObject(group);
    // lo que se empuña, por su mango (aún sin padre: su «mundo» es el soporte)
    const held = hold && hold.getWorldPosition(new THREE.Vector3());
    this.itemHolder.add(group);
    if (pose === 'box') { // la caja (o lo que sea grande): una palma contra cada lado, algo por debajo del centro
      const c = bb.getCenter(new THREE.Vector3()), sz = bb.getSize(new THREE.Vector3());
      const at = (x) => { const o = new THREE.Object3D(); o.position.set(x, c.y - sz.y * 0.18, c.z + sz.z * 0.12); this.itemHolder.add(o); return o; };
      this.grips = {
        R: { obj: at(bb.max.x + 0.012), F: [0, -0.15, -1], P: [-1, 0, 0], hand: 'box' },
        L: { obj: at(bb.min.x - 0.012), F: [0, -0.15, -1], P: [1, 0, 0], hand: 'box' },
      };
    }
    if (held) { this.grip = held; return; }
    this.grip = new THREE.Vector3((bb.min.x + bb.max.x) / 2, bb.min.y + 0.01, (bb.min.z + bb.max.z) / 2);
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
    // golpe en curso
    this.strikeT = Math.max(0, (this.strikeT || 0) - dt * 3.2);
    const sk = Math.sin((1 - this.strikeT) * Math.PI) * (this.strikeT > 0 ? 1 : 0);
    if (this.flash3) this.flash3.visible = this.strikeKind === 'shot' && this.strikeT > 0.75;
    const punching = this.strikeKind === 'punch' && this.strikeT > 0 && this.pose === 'none' && !this.swapping;
    const vis = this.pose !== 'none' || this.swapping || punching;
    this.root.visible = vis;
    if (!vis) return;
    if (punching) { // puño derecho que sale hacia delante y vuelve
      this.Rh.position.set(0.16 - sk * 0.1, -0.24 + sk * 0.1, -0.32 - sk * 0.3);
      this.Rh.rotation.set(0.2, 0, 0);
      this.Rh.visible = true; this.L.visible = false;
      if (this.arms) {
        this.L.visible = this.Rh.visible = this.sleeveL.visible = this.sleeveR.visible = false;
        this.arms.update(dt, 'fist', { R: { position: this.Rh.position, quaternion: this.Rh.quaternion, visible: true, side: -1 }, L: { visible: false } });
      } else { curl(this.Rh, 1); this.Rh.visible = this.sleeveR.visible = true; this.L.visible = this.sleeveL.visible = false; this.fitSleeve(this.sleeveR, this.Rh, 0.34); }
      return;
    }

    // física de los brazos: un muelle amortiguado. Al girar la cámara o al acelerar, lo que
    // llevas (y con ello los brazos) se queda un poco atrás y vuelve con un leve rebote
    const S = (this.spring ||= { x: 0, y: 0, vx: 0, vy: 0, sp: speed });
    S.vx += -lookX * 0.012; S.vy += lookY * 0.012 - (speed - S.sp) * 0.02;
    S.sp = speed;
    for (let t = Math.min(dt, 0.1); t > 1e-4; t -= 1 / 120) { // pasos fijos: estable aunque vaya lento
      const h = Math.min(t, 1 / 120);
      S.vx += (-90 * S.x - 13 * S.vx) * h; S.vy += (-90 * S.y - 13 * S.vy) * h;
      S.x = THREE.MathUtils.clamp(S.x + S.vx * h, -0.05, 0.05); S.y = THREE.MathUtils.clamp(S.y + S.vy * h, -0.05, 0.05);
    }
    this.swayX = S.x; this.swayY = S.y;
    const k = Math.min(1, speed / 5);
    const bx_ = Math.cos(bob) * 0.012 * k + this.swayX;
    const by = -Math.abs(Math.sin(bob)) * 0.014 * k + Math.sin(this.t * 1.6) * 0.003 + this.swayY - this.drop * 0.55 - crouch * 0.02;
    const push = Math.sin(Math.min(1, swing) * Math.PI);
    const gk = this.giveK || 0;

    if (this.arms && this.grips) {
      // Se coloca el objeto en la vista (como el arma en un shooter) y las manos van a sus
      // puntos de agarre: la muñeca por cinemática inversa y los dedos lo rodean sin atravesarlo
      const kick = this.strikeKind === 'shot' ? sk : 0, arc = this.strikeKind === 'swing' ? sk : 0;
      const H = this.itemHolder;
      if (this.pose === 'pistol') { H.position.set(0.085 + bx_, -0.115 + by + kick * 0.015, -0.38 + kick * 0.04); H.rotation.set(kick * 0.3, 0.18, -0.05); }
      else if (this.pose === 'gun') {
        // arma blanca: la hoja sube hacia el centro y adelante, con el filo al frente; al
        // golpear, la muñeca barre en arco de arriba a la derecha hacia abajo a la izquierda
        H.position.set(0.177 + bx_ - arc * 0.16, -0.195 + by + arc * 0.03 - push * 0.03, -0.45 - arc * 0.1);
        H.quaternion.copy(MELEE_Q);
        if (arc) H.quaternion.premultiply(_qArc.setFromEuler(_eArc.set(-arc * 0.9, arc * 0.3, arc * 0.9)));
      }
      else { H.position.set(bx_, -0.335 + by - push * 0.03 + gk * 0.08, -0.84 + push * 0.06 - gk * 0.3); H.rotation.set(-0.12, -0.03, 0); }
      H.quaternion.premultiply(_qArc.setFromEuler(_eArc.set(this.swayY * 2, this.swayX * 2, -this.swayX * 3))); // (el muelle también lo inclina)
      if (this.pose !== 'box') H.position.sub((this.grip || new THREE.Vector3()).clone().applyQuaternion(H.quaternion)); // el punto de agarre, en ese sitio
      this.L.visible = this.Rh.visible = this.sleeveL.visible = this.sleeveR.visible = false;
      // con un arma blanca, la izquierda queda a la vista, relajada y algo abierta
      let freeL = null;
      if (this.pose === 'gun') {
        if (!this.freeL) { this.freeL = new THREE.Object3D(); H.parent.add(this.freeL); }
        this.freeL.position.set(-0.01 + bx_ * 0.6, -0.15 + by, -0.38);
        freeL = { obj: this.freeL, F: [0.75, 0.12, -0.65], P: [0, -1, 0.15], hand: 'relax' };
      }
      this.arms.update(dt, this.pose, {
        R: { visible: true, grip: this.grips.R },
        L: this.grips.L ? { visible: true, grip: this.grips.L } : freeL ? { visible: true, grip: freeL } : { visible: false },
        solids: collectSolids(H),
      });
      return;
    }
    if (this.pose === 'box') {
      // (con los brazos del personaje, la caja algo más lejos y abajo: se ven las manos a los lados)
      const far = this.arms ? 0.12 : 0, low = this.arms ? 0.1 : 0;
      const base = new THREE.Vector3(bx_, -0.235 - low + by - push * 0.03 + gk * 0.08, -0.72 - far + push * 0.06 - gk * 0.3);
      this.itemHolder.position.copy(base);
      this.itemHolder.rotation.set(-0.12, -0.03, 0);
      const s = this.itemHolder.children[0];
      const w = s ? new THREE.Box3().setFromObject(s).getSize(new THREE.Vector3()).x / 2 : 0.21;
      const d = 0.16;
      this.placeHand(this.L, base.x - w - 0.012, base.y - 0.09, base.z + d - 0.01, 0.85, 0.75, 0.15, 0.55);
      this.placeHand(this.Rh, base.x + w + 0.012, base.y - 0.09, base.z + d - 0.01, 0.85, -0.75, -0.15, 0.55);
      this.L.visible = this.Rh.visible = this.sleeveL.visible = this.sleeveR.visible = true;
    } else {
      // una mano: derecha, objeto en la palma. Pistola: a dos manos, centrada, como en los
      // shooters (retroceso al disparar). Porra/machete: inclinados, golpe en arco.
      const pistol = this.pose === 'pistol';
      const kick = this.strikeKind === 'shot' ? sk : 0;
      const arc = this.strikeKind === 'swing' && this.pose === 'gun' ? sk : 0;
      let hx = 0.2 + bx_ - gk * 0.12, hy = -0.26 + by - push * 0.04 + gk * 0.1, hz = -0.46 + push * 0.08 - gk * 0.3;
      if (pistol) { hx = 0.15 + bx_; hy = -0.2 + by + kick * 0.02; hz = -0.5 + kick * 0.05; }
      if (arc) { hx -= arc * 0.2; hy -= arc * 0.03; hz -= arc * 0.14; }
      this.placeHand(this.Rh, hx, hy, hz, 1.6, 2.1, -1.5708, 0.75);
      this.Rh.updateMatrix();
      this.itemHolder.position.copy(new THREE.Vector3(-0.07, 0.065, 0).applyMatrix4(this.Rh.matrix));
      if (pistol) this.itemHolder.rotation.set(kick * 0.35, 0.42, -0.08); // de tres cuartos: se ve el costado // el cañón al punto de mira; salta al disparar
      else if (this.pose === 'gun') this.itemHolder.rotation.set(-arc * 0.9, 0, -arc * 1.3); // recto; al golpear barre de derecha a izquierda
      else this.itemHolder.rotation.set(0.25, -0.6, 0.05);
      this.L.visible = this.sleeveL.visible = pistol;
      this.Rh.visible = this.sleeveR.visible = true;
    }
    this.fitSleeve(this.sleeveL, this.L, -0.34);
    this.fitSleeve(this.sleeveR, this.Rh, 0.34);
    if (this.arms) {
      // las manos de referencia marcan dónde va cada muñeca; se ven las del personaje
      const vis = { R: this.Rh.visible, L: this.L.visible };
      if (this.pose !== 'box') this.Rh.position.add(new THREE.Vector3(-0.02, 0.07, -0.03)); // algo más arriba, como la referencia
      if (this.pose === 'pistol') this.L.position.copy(this.Rh.position).add(new THREE.Vector3(-0.085, -0.05, 0.02)); // la izquierda sujeta por debajo, desde su lado
      if (this.pose === 'box') { // la caja, agarrada por los lados desde abajo
        const b = this.itemHolder.position, s = this.itemHolder.children[0];
        const w = s ? new THREE.Box3().setFromObject(s).getSize(new THREE.Vector3()).x / 2 : 0.21;
        this.Rh.position.set(b.x + w + 0.035, b.y - 0.07, b.z + 0.07);
        this.L.position.set(b.x - w - 0.035, b.y - 0.07, b.z + 0.07);
      }
      this.L.visible = this.Rh.visible = this.sleeveL.visible = this.sleeveR.visible = false;
      this.arms.update(dt, this.pose, {
        R: { position: this.Rh.position, quaternion: this.Rh.quaternion, visible: vis.R, side: -1 },
        L: { position: this.L.position, quaternion: this.L.quaternion, visible: vis.L, side: 1 },
      });
      // lo que llevas en una mano se apoya en la palma de verdad
      if (this.pose !== 'box' && this.arms.palmR) { // (también la pistola: la derecha en la cacha)
        const g = (this.grip || new THREE.Vector3()).clone().applyEuler(this.itemHolder.rotation);
        this.itemHolder.position.copy(this.arms.palmR).sub(g);
      }
    }
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
