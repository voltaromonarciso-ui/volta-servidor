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

function budCluster(color, n, spread, parent, y = 0) {
  const geo = new THREE.IcosahedronGeometry(0.02, 1);
  const mat = M(color, { roughness: 0.9, flatShading: true });
  for (let i = 0; i < n; i++) {
    const m = mesh(geo, mat, (Math.random() - 0.5) * spread, y + Math.random() * spread * 0.5, (Math.random() - 0.5) * spread, parent);
    m.scale.set(1, 1.3, 1);
    m.rotation.set(Math.random(), Math.random(), 0);
  }
}

// Cogollos: bolas irregulares verdes con hojitas, como los de la imagen de referencia.
const budGeo = (() => { const g = new THREE.IcosahedronGeometry(0.5, 3); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const k = 0.86 + 0.14 * Math.abs(Math.sin(x * 23 + y * 31) * Math.cos(z * 27 - y * 19)) + Math.random() * 0.05; p.setXYZ(i, p.getX(i) * k, p.getY(i) * k, p.getZ(i) * k); } g.computeVertexNormals(); return g; })();
const leafGeo = new THREE.ConeGeometry(0.5, 1, 4);
function budPile(color, n, spread, parent, y = 0, scale = 1) {
  const c = new THREE.Color(color);
  const mats = [0.85, 1, 1.15].map((k) => M('#' + c.clone().multiplyScalar(k).getHexString(), { roughness: 1 }));
  const leaf = M('#4e8f2f', { roughness: 0.9, side: THREE.DoubleSide });
  for (let i = 0; i < n; i++) {
    const r = (0.022 + Math.random() * 0.012) * scale;
    const b = mesh(budGeo, mats[i % 3], (Math.random() - 0.5) * spread, y + r + Math.floor(i / 4) * r * 1.25, (Math.random() - 0.5) * spread * 0.5, parent);
    b.scale.set(r * 2, r * 2.3, r * 2);
    b.rotation.set(Math.random(), Math.random() * 6, Math.random());
    if (i % 2 === 0) {
      const l = mesh(leafGeo, leaf, b.position.x + r * 0.8, b.position.y + r * 0.2, b.position.z, parent);
      l.scale.set(r * 0.5, r * 1.4, r * 0.15);
      l.rotation.z = -1.1;
    }
  }
}
function zipBag(parent, w, h, d = 0.02) {
  const film = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
  mesh(bx(w, h, d, 0.004), film, 0, 0, 0, parent);
  mesh(new THREE.BoxGeometry(w * 1.01, 0.006, d + 0.002), new THREE.MeshStandardMaterial({ color: 0xdfe8ee, transparent: true, opacity: 0.7 }), 0, h * 0.36, 0, parent); // cierre zip
  const tab = mesh(new THREE.TorusGeometry(0.008, 0.002, 6, 14), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), 0, h * 0.45, 0, parent); // agujero de colgar
  tab.scale.set(1.6, 1, 1);
}
const CRYSTAL_COLS = ['#3fc1ff', '#47e08a', '#a66bff', '#ff4f6d', '#5a7bff'];
function crystals(parent, n, spread, scale) {
  for (let i = 0; i < n; i++) {
    const c = CRYSTAL_COLS[i % CRYSTAL_COLS.length];
    const m = mesh(new THREE.OctahedronGeometry(0.5, 0), M(c, { emissive: c, emissiveIntensity: 0.35, roughness: 0.08, metalness: 0.25 }), (Math.random() - 0.5) * spread, Math.random() * 0.02, (Math.random() - 0.5) * spread * 0.5, parent);
    m.scale.set(0.022 * scale, 0.05 * scale * (0.7 + Math.random() * 0.6), 0.022 * scale);
    m.rotation.set((Math.random() - 0.5) * 0.8, Math.random() * 6, (Math.random() - 0.5) * 0.8);
  }
}
let _ssTex = null;
function shardsLabel() {
  if (!_ssTex) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 320;
    const x = c.getContext('2d');
    x.fillStyle = '#f6f2f8'; x.fillRect(0, 0, 256, 320);
    x.fillStyle = '#e8e0ee'; for (let i = 0; i < 256; i += 16) x.fillRect(i, 0, 8, 14); // dentado del cierre
    // logo
    x.fillStyle = '#ffffff'; x.strokeStyle = '#ff6fb5'; x.lineWidth = 6;
    x.beginPath(); x.roundRect(28, 40, 200, 74, 24); x.fill(); x.stroke();
    x.fillStyle = '#7b3fd1'; x.font = 'bold 40px sans-serif'; x.textAlign = 'center';
    x.fillText('SWEET', 128, 74); x.fillText('SHARDS', 128, 108);
    // cristales dibujados
    const col = ['#2fb8ff', '#3fd98a', '#9b5cff', '#ff4f6d', '#5a7bff', '#7d4dff'];
    const shard = (cx, by, w, h, cl) => {
      x.fillStyle = cl; x.beginPath(); x.moveTo(cx, by - h); x.lineTo(cx + w / 2, by - h * 0.75); x.lineTo(cx + w / 2, by); x.lineTo(cx - w / 2, by); x.lineTo(cx - w / 2, by - h * 0.75); x.closePath(); x.fill();
      x.fillStyle = 'rgba(255,255,255,0.35)'; x.beginPath(); x.moveTo(cx, by - h); x.lineTo(cx - w / 2, by - h * 0.75); x.lineTo(cx - w / 2, by); x.lineTo(cx - w * 0.1, by); x.closePath(); x.fill();
    };
    [[70, 300, 44, 110, 0], [120, 300, 50, 150, 2], [175, 300, 46, 120, 1], [95, 305, 34, 70, 3], [205, 305, 38, 80, 4], [145, 308, 30, 60, 5]].forEach(([cx, by, w, h, k]) => shard(cx, by, w, h, col[k]));
    x.fillStyle = '#ffffff'; for (const [sx, sy] of [[40, 160], [220, 150], [200, 260], [30, 250]]) { x.beginPath(); x.arc(sx, sy, 4, 0, 7); x.fill(); }
    _ssTex = new THREE.CanvasTexture(c); _ssTex.colorSpace = THREE.SRGBColorSpace;
  }
  return mats.ssLabel ||= new THREE.MeshStandardMaterial({ map: _ssTex, roughness: 0.55 });
}

const cardMat = () => (mats.card ||= new THREE.MeshStandardMaterial({ map: cardboardTex(), roughness: 0.9 }));

export function buildItem(s) {
  const g = new THREE.Group();
  const it = ITEMS[s.id] || {};
  let pose = 'one';
  switch (s.id) {
    case 'cash': {
      // fajo de billetes con goma
      for (let i = 0; i < 3; i++) mesh(bx(0.075, 0.006, 0.15, 0.002), M(i % 2 ? '#7ccf6a' : '#5fb653', { roughness: 0.8 }), i * 0.003, i * 0.006, i * 0.004, g);
      mesh(new THREE.BoxGeometry(0.078, 0.022, 0.02), M('#c0392b'), 0.003, 0.008, 0, g);
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
    case 'caja': case 'mesa_emp': case 'estante': case 'mezcladora': case 'lampara': case 'envasadora': case 'hornillo': {
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
      mesh(bx(0.075, 0.105, 0.012, 0.003), M('#f3ead2'), 0, 0, 0, g);
      mesh(new THREE.BoxGeometry(0.055, 0.045, 0.014), M(productColor(s), { emissive: productColor(s), emissiveIntensity: 0.3 }), 0, 0.012, 0, g);
      mesh(new THREE.BoxGeometry(0.06, 0.008, 0.015), M('#3f7f5a'), 0, -0.03, 0, g);
      break;
    }
    case 'cogollo': {
      // puñado de cogollos verdes esponjosos con alguna hojita
      budPile(productColor(s), 6, 0.07, g, -0.02, 0.8);
      break;
    }
    case 'bolsa': {
      // bolsa zip transparente con agujero para colgar y cogollos dentro
      zipBag(g, 0.1, 0.12);
      budPile(productColor(s), 6, 0.055, g, -0.05, 0.72);
      break;
    }
    case 'bolsita':
      for (let i = 0; i < 4; i++) { const b = new THREE.Group(); zipBag(b, 0.1, 0.12, 0.004); b.position.set(i * 0.004, i * 0.003, i * 0.006); g.add(b); }
      break;
    case 'tarro': case 'tarro_v': {
      // tarro de cristal con tapa de corcho (lleno de cogollos o vacío)
      const glass = mats.jarGlass ||= new THREE.MeshStandardMaterial({ color: 0xeaf7fb, roughness: 0.04, metalness: 0.2, transparent: true, opacity: 0.32, depthWrite: false, envMapIntensity: 1.5 });
      const prof = [[0.001, -0.06], [0.04, -0.06], [0.045, -0.052], [0.046, 0.03], [0.04, 0.045], [0.036, 0.05], [0.036, 0.058]].map(([x, y]) => new THREE.Vector2(x, y));
      mesh(new THREE.LatheGeometry(prof, 24), glass, 0, 0, 0, g);
      mesh(new THREE.CylinderGeometry(0.041, 0.041, 0.022, 24), M('#b5895a', { roughness: 0.95 }), 0, 0.07, 0, g);
      mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.012, 20), M('#9c7246', { roughness: 1 }), 0, 0.056, 0, g);
      if (s.id === 'tarro') budPile(productColor(s), 10, 0.05, g, -0.058, 0.72);
      break;
    }
    case 'cristal': {
      // puñado de cristales de colores
      crystals(g, 8, 0.11, 1.5);
      break;
    }
    case 'shards': case 'bolsa_ss': {
      // bolsa blanca "Sweet Shards" con su etiqueta
      const n = s.id === 'shards' ? 1 : 3;
      for (let i = 0; i < n; i++) {
        const b = mesh(bx(0.1, 0.13, s.id === 'shards' ? 0.022 : 0.006, 0.006), [M('#f4f0f6'), M('#f4f0f6'), M('#f4f0f6'), M('#f4f0f6'), shardsLabel(), M('#ece6f0')], i * 0.004, i * 0.003, i * 0.008, g);
        b.material = [M('#f4f0f6'), M('#f4f0f6'), M('#f4f0f6'), M('#f4f0f6'), shardsLabel(), M('#ece6f0')];
      }
      mesh(new THREE.BoxGeometry(0.102, 0.012, 0.024), M('#e2dbe8'), 0, 0.064, 0, g);
      break;
    }
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
