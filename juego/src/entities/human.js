import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Personaje estilizado (proporciones de dibujo animado, formas redondeadas).
const matCache = new Map();
export function mat(color) {
  if (!matCache.has(color)) matCache.set(color, new THREE.MeshStandardMaterial({ color, roughness: 0.8 }));
  return matCache.get(color);
}

const box = new RoundedBoxGeometry(1, 1, 1, 3, 0.22);
const headGeo = new THREE.SphereGeometry(0.5, 20, 16);
const hairGeo = new THREE.SphereGeometry(0.5, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55);

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
  return {
    skin: p(SKINS), hair: p(HAIRS), shirt: p(SHIRTS), pants: p(PANTS), hairStyle: Math.floor(r() * 4),
    height: 0.92 + r() * 0.16, wide: 0.9 + r() * 0.25,
    top: p(['hoodie', 'hoodie', 'tee', 'tee', 'jacket']), inner: p(['#f2f2f2', '#1c1c1c', '#c0392b', '#2e86de']),
    backpack: r() < 0.22, glasses: r() < 0.2, shoes: p(['#3a2a1f', '#f2f2f2', '#1c1c1c', '#c0392b']),
  };
}

export function makeHuman(look, { police = false } = {}) {
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.scale.set(look.wide, look.height, look.wide);
  g.add(body);
  const shoes = police ? '#111111' : look.shoes || '#3a2a1f';
  const legL = limb(look.pants, 0.22, 0.8, 0.24, -0.13, 0.84, 0, body, shoes);
  const legR = limb(look.pants, 0.22, 0.8, 0.24, 0.13, 0.84, 0, body, shoes);
  const torso = part(look.shirt, 0.58, 0.66, 0.34, 0, 1.17, 0, body);
  part(look.shirt, 0.6, 0.18, 0.36, 0, 0.86, 0, body); // cintura de la sudadera
  part(look.shirt, 0.36, 0.08, 0.06, 0, 1.0, 0.17, body); // bolsillo canguro
  const tee = look.top === 'tee';
  const armL = limb(look.shirt, 0.17, tee ? 0.3 : 0.62, 0.18, -0.38, 1.46, 0, body);
  const armR = limb(look.shirt, 0.17, tee ? 0.3 : 0.62, 0.18, 0.38, 1.46, 0, body);
  if (tee) for (const a of [armL, armR]) part(look.skin, 0.13, 0.36, 0.14, 0, -0.48, 0, a);
  if (look.top === 'jacket') {
    part(look.inner || '#f2f2f2', 0.16, 0.6, 0.02, 0, 1.17, 0.172, body);
    part(look.shirt, 0.62, 0.08, 0.38, 0, 1.47, 0, body); // cuello
  }
  if (look.backpack) {
    part(['#2c3e50', '#8e44ad', '#16a085', '#7f8c8d'][Math.floor(look.height * 100) % 4], 0.46, 0.52, 0.2, 0, 1.15, -0.27, body);
  }
  const handGeo = new THREE.SphereGeometry(0.075, 12, 8);
  for (const a of [armL, armR]) { const hm = new THREE.Mesh(handGeo, mat(look.skin)); hm.position.y = -0.68; hm.castShadow = true; a.add(hm); }
  if (!police && (look.top || 'hoodie') === 'hoodie') { const hood = part(look.shirt, 0.46, 0.2, 0.16, 0, 1.52, -0.17, body); hood.rotation.x = 0.4; }

  const head = new THREE.Group();
  head.position.set(0, 1.78, 0);
  body.add(head);
  const hm = new THREE.Mesh(headGeo, mat(look.skin));
  hm.scale.set(0.5, 0.56, 0.5);
  const neck = part(look.skin, 0.16, 0.14, 0.16, 0, -0.3, 0, head);
  hm.castShadow = true;
  head.add(hm);
  // ojos grandes y cejas
  const eyeW = new THREE.SphereGeometry(0.045, 10, 8), eyeP = new THREE.SphereGeometry(0.024, 8, 6);
  for (const sx of [-1, 1]) {
    const ew = new THREE.Mesh(eyeW, mat('#f4f4f2')); ew.position.set(sx * 0.09, 0.03, 0.225); ew.scale.z = 0.5; head.add(ew);
    const ep = new THREE.Mesh(eyeP, mat('#1b1b1b')); ep.position.set(sx * 0.09, 0.03, 0.247); head.add(ep);
    part(look.hair, 0.1, 0.024, 0.03, sx * 0.09, 0.105, 0.23, head);
  }
  part(look.skin, 0.06, 0.07, 0.06, 0, -0.03, 0.25, head); // nariz
  if (look.glasses) { part('#141414', 0.3, 0.06, 0.02, 0, 0.035, 0.262, head); }
  part('#9c5b4a', 0.1, 0.02, 0.02, 0, -0.12, 0.235, head);
  for (const sx of [-1, 1]) part(look.skin, 0.05, 0.1, 0.06, sx * 0.25, 0, 0, head); // orejas
  if (police) {
    part('#1f3a6b', 0.6, 0.14, 0.58, 0, 0.24, 0, head);
    part('#1f3a6b', 0.5, 0.05, 0.25, 0, 0.18, 0.3, head);
    part('#f1c40f', 0.08, 0.08, 0.02, 0, 0.27, 0.29, head);
    part('#f1c40f', 0.1, 0.12, 0.02, -0.16, 1.28 - 1.16, 0.19, torso.parent).position.y = 1.32;
  } else if (look.hairStyle !== 3) {
    const hair = new THREE.Mesh(hairGeo, mat(look.hair));
    hair.scale.set(0.54, look.hairStyle === 2 ? 0.66 : 0.6, 0.54);
    hair.position.set(0, 0.03, -0.015);
    hair.rotation.x = -0.2;
    head.add(hair);
    if (look.hairStyle === 1) part(look.hair, 0.46, 0.4, 0.12, 0, -0.1, -0.2, head);
  } else {
    const cap = new THREE.Mesh(hairGeo, mat(look.hair));
    cap.scale.set(0.55, 0.5, 0.55); cap.position.set(0, 0.06, 0); head.add(cap);
    const brim = part(look.hair, 0.36, 0.035, 0.24, 0, 0.1, 0.25, head);
    brim.rotation.x = 0.12;
  }

  const anchorL = new THREE.Group(), anchorR = new THREE.Group();
  anchorL.position.set(0, -0.74, 0.03); anchorR.position.set(0, -0.74, 0.03);
  armL.add(anchorL); armR.add(anchorR);
  const h = { group: g, body, legL, legR, armL, armR, head, anchorL, anchorR, phase: Math.random() * 6, over: {}, cur: {} };
  // Poses forzadas (coger objetos, mirar el móvil...) que se mezclan suavemente con el paseo.
  const applyOver = (dt) => {
    const k = Math.min(1, dt * 9);
    for (const key of ['armL', 'armR', 'head', 'armLz', 'armRz']) {
      const part = h[key.replace('z', '')];
      const axis = key.endsWith('z') ? 'z' : 'x';
      const tgt = h.over[key];
      if (tgt === undefined) { h.cur[key] = part.rotation[axis]; continue; }
      h.cur[key] = (h.cur[key] ?? part.rotation[axis]) + (tgt - (h.cur[key] ?? part.rotation[axis])) * k;
      part.rotation[axis] = h.cur[key];
    }
  };
  h.hold = (side, obj) => {
    const a = side === 'L' ? anchorL : anchorR;
    a.clear();
    if (obj) a.add(obj);
  };
  h.animate = (dt, speed) => {
    h._animate(dt, speed);
    applyOver(dt);
  };
  h._animate = (dt, speed) => {
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
