import * as THREE from 'three';

// Personaje low-poly de proporciones caricaturescas (cabeza grande, cuerpo achaparrado).
const matCache = new Map();
export function mat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshLambertMaterial({ color, flatShading: true }));
  return matCache.get(color);
}

const box = new THREE.BoxGeometry(1, 1, 1);
const headGeo = new THREE.IcosahedronGeometry(0.5, 1);
const hairGeo = new THREE.IcosahedronGeometry(0.5, 1);

export const SKINS = ['#f1c7a5', '#e0ac85', '#c68a62', '#9b6a45', '#7a4f32', '#f5d6bd'];
export const HAIRS = ['#2b1d14', '#4a3020', '#7a5230', '#c9a15a', '#1a1a1a', '#8a8a8a', '#a0412d'];
export const SHIRTS = ['#e74c3c', '#3498db', '#2ecc71', '#f1c40f', '#9b59b6', '#ecf0f1', '#34495e', '#e67e22', '#1abc9c', '#d35400', '#7f8c8d', '#c0392b'];
export const PANTS = ['#2c3e50', '#34495e', '#5d4037', '#1f2a36', '#6d6d6d', '#3b5998', '#4e342e'];

function part(color, w, h, d, x, y, z, parent) {
  const m = new THREE.Mesh(box, mat(color));
  m.scale.set(w, h, d);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}

function limb(color, w, h, d, x, y, z, parent, footColor) {
  const pivot = new THREE.Group();
  pivot.position.set(x, y, z);
  part(color, w, h, d, 0, -h / 2, 0, pivot);
  if (footColor) part(footColor, w + 0.04, 0.12, d + 0.12, 0, -h + 0.04, 0.05, pivot);
  parent.add(pivot);
  return pivot;
}

export function randomLook(r = Math.random) {
  const p = (a) => a[Math.floor(r() * a.length)];
  return { skin: p(SKINS), hair: p(HAIRS), shirt: p(SHIRTS), pants: p(PANTS), hairStyle: Math.floor(r() * 4), height: 0.92 + r() * 0.16, wide: 0.9 + r() * 0.25 };
}

export function makeHuman(look, { police = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.scale.set(look.wide, look.height, look.wide);
  g.add(body);
  const shoes = police ? '#111111' : '#3a2a1f';
  const legL = limb(look.pants, 0.24, 0.78, 0.26, -0.15, 0.82, 0, body, shoes);
  const legR = limb(look.pants, 0.24, 0.78, 0.26, 0.15, 0.82, 0, body, shoes);
  const torso = part(look.shirt, 0.62, 0.68, 0.36, 0, 1.16, 0, body);
  part(look.pants, 0.64, 0.12, 0.38, 0, 0.84, 0, body); // cinturón
  const armL = limb(look.shirt, 0.18, 0.36, 0.2, -0.41, 1.46, 0, body);
  const armR = limb(look.shirt, 0.18, 0.36, 0.2, 0.41, 1.46, 0, body);
  part(look.skin, 0.15, 0.3, 0.17, 0, -0.5, 0, armL);
  part(look.skin, 0.15, 0.3, 0.17, 0, -0.5, 0, armR);

  const head = new THREE.Group();
  head.position.set(0, 1.78, 0);
  body.add(head);
  const hm = new THREE.Mesh(headGeo, mat(look.skin));
  hm.scale.set(0.56, 0.6, 0.54);
  hm.castShadow = true;
  head.add(hm);
  // ojos grandes y cejas
  part('#ffffff', 0.12, 0.12, 0.02, -0.11, 0.03, 0.265, head);
  part('#ffffff', 0.12, 0.12, 0.02, 0.11, 0.03, 0.265, head);
  part('#1b1b1b', 0.06, 0.08, 0.02, -0.1, 0.02, 0.275, head);
  part('#1b1b1b', 0.06, 0.08, 0.02, 0.1, 0.02, 0.275, head);
  part(look.hair, 0.13, 0.03, 0.02, -0.11, 0.12, 0.27, head);
  part(look.hair, 0.13, 0.03, 0.02, 0.11, 0.12, 0.27, head);
  part('#9c5b4a', 0.12, 0.025, 0.02, 0, -0.13, 0.265, head);
  if (police) {
    part('#1f3a6b', 0.6, 0.14, 0.58, 0, 0.24, 0, head);
    part('#1f3a6b', 0.5, 0.05, 0.25, 0, 0.18, 0.3, head);
    part('#f1c40f', 0.08, 0.08, 0.02, 0, 0.27, 0.29, head);
    part('#f1c40f', 0.1, 0.12, 0.02, -0.16, 1.28 - 1.16, 0.19, torso.parent).position.y = 1.32;
  } else if (look.hairStyle !== 3) {
    const hair = new THREE.Mesh(hairGeo, mat(look.hair));
    hair.scale.set(0.6, look.hairStyle === 2 ? 0.5 : 0.36, 0.58);
    hair.position.set(0, 0.17, -0.03);
    head.add(hair);
    if (look.hairStyle === 1) part(look.hair, 0.5, 0.42, 0.14, 0, -0.08, -0.24, head);
  } else {
    part(look.hair, 0.58, 0.16, 0.56, 0, 0.22, 0, head); // gorra
    part(look.hair, 0.46, 0.05, 0.26, 0, 0.16, 0.3, head);
  }

  const h = { group: g, body, legL, legR, armL, armR, head, phase: Math.random() * 6 };
  h.animate = (dt, speed) => {
    if (speed > 0.05) {
      h.phase += dt * speed * 3.2;
      const s = Math.sin(h.phase) * Math.min(0.75, speed * 0.32);
      legL.rotation.x = s; legR.rotation.x = -s;
      armL.rotation.x = -s * 0.9; armR.rotation.x = s * 0.9;
      body.position.y = Math.abs(Math.cos(h.phase)) * 0.04;
    } else {
      const k = Math.min(1, dt * 8);
      legL.rotation.x *= 1 - k; legR.rotation.x *= 1 - k;
      armL.rotation.x *= 1 - k; armR.rotation.x *= 1 - k;
      body.position.y = Math.sin(h.phase += dt * 1.5) * 0.008;
    }
  };
  return h;
}

// Cartelito flotante sobre la cabeza ("!" / "$").
const markerTex = {};
export function markerSprite(text, color) {
  const key = text + color;
  if (!markerTex[key]) {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d');
    g.fillStyle = color; g.beginPath(); g.arc(64, 56, 46, 0, Math.PI * 2); g.fill();
    g.beginPath(); g.moveTo(44, 92); g.lineTo(84, 92); g.lineTo(64, 122); g.fill();
    g.fillStyle = '#fff'; g.font = 'bold 64px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(text, 64, 60);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    markerTex[key] = t;
  }
  const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: markerTex[key], depthTest: false, transparent: true }));
  s.scale.set(0.6, 0.6, 0.6);
  s.renderOrder = 10;
  return s;
}
