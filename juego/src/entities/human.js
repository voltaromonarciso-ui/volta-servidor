import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// Personaje procedural con proporciones realistas: torso torneado, codos y
// rodillas articulados, manos con dedos, cara con rasgos y varios peinados.
const matCache = new Map();
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial({ color, roughness: 0.8, ...o }));
  return matCache.get(k);
}
const skinMat = (c) => mat(c, { roughness: 0.55 });

export const SKINS = ['#f3d2b8', '#e8b994', '#d29a72', '#b07a52', '#8a5a3a', '#6a4129'];
export const HAIRS = ['#1d1612', '#3b2618', '#6b4426', '#a8763c', '#d9b26a', '#7a7a7a', '#8a2f1f'];
export const SHIRTS = ['#c0392b', '#2c5f9e', '#2e7d4f', '#d9a520', '#6c3483', '#ecf0f1', '#2a2d34', '#d35400', '#16a085', '#7f8c8d', '#8e2b3a', '#1f3b57'];
export const PANTS = ['#2b3a4f', '#1f2a36', '#4e3b2c', '#3a5a86', '#565656', '#2d2d2d', '#6b5b45'];

const G_ = {
  sphere: new THREE.SphereGeometry(0.5, 20, 14),
  sphereLo: new THREE.SphereGeometry(0.5, 12, 8),
  cap: new THREE.CapsuleGeometry(0.5, 1, 6, 14),
  box: new RoundedBoxGeometry(1, 1, 1, 3, 0.18),
  cyl: new THREE.CylinderGeometry(0.5, 0.5, 1, 14),
  hairCap: new THREE.SphereGeometry(0.5, 20, 12, 0, Math.PI * 2, 0, Math.PI * 0.56),
};
// torso torneado (de cintura a hombros)
function torsoGeo(female) {
  const pts = [];
  const prof = female
    ? [[0.155, 0], [0.165, 0.06], [0.15, 0.2], [0.135, 0.28], [0.155, 0.4], [0.17, 0.48], [0.165, 0.56], [0.12, 0.62], [0.06, 0.66]]
    : [[0.16, 0], [0.165, 0.06], [0.16, 0.2], [0.165, 0.3], [0.185, 0.42], [0.2, 0.52], [0.19, 0.58], [0.13, 0.64], [0.06, 0.67]];
  for (const [r, y] of prof) pts.push(new THREE.Vector2(r, y));
  const g = new THREE.LatheGeometry(pts, 20);
  g.scale(1, 1, 0.62);
  return g;
}
const TORSO = { m: torsoGeo(false), f: torsoGeo(true) };

function mesh(geo, material, sx, sy, sz, x, y, z, parent) {
  const m = new THREE.Mesh(geo, material);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  parent.add(m);
  return m;
}
const pivot = (x, y, z, parent) => { const p = new THREE.Group(); p.position.set(x, y, z); parent.add(p); return p; };

// Mano con dedos (para personajes vistos a distancia media).
function smallHand(skin, parent, side) {
  const h = pivot(0, 0, 0, parent);
  mesh(G_.box, skin, 0.075, 0.085, 0.03, 0, -0.045, 0.005, h);
  for (let i = 0; i < 4; i++) {
    const f = mesh(G_.cap, skin, 0.016, 0.045, 0.016, -0.026 + i * 0.017, -0.1, 0.008, h);
    f.rotation.x = 0.25;
  }
  const t = mesh(G_.cap, skin, 0.018, 0.035, 0.018, side * 0.04, -0.05, 0.015, h);
  t.rotation.z = side * 0.6;
  return h;
}

export function randomLook(r = Math.random) {
  const p = (a) => a[Math.floor(r() * a.length)];
  const female = r() < 0.35;
  return {
    female, skin: p(SKINS), hair: p(HAIRS), shirt: p(SHIRTS), pants: p(PANTS),
    hairStyle: female ? p([4, 5, 6, 1]) : p([0, 0, 1, 2, 3]),
    height: female ? 0.94 + r() * 0.07 : 0.97 + r() * 0.08, wide: 0.92 + r() * 0.2,
    top: p(['hoodie', 'hoodie', 'tee', 'tee', 'jacket']), inner: p(['#f2f2f2', '#1c1c1c', '#c0392b', '#2e86de']),
    backpack: r() < 0.2, glasses: r() < 0.18, beard: !female && r() < 0.3, shoes: p(['#2a2a2a', '#f2f2f2', '#6b4a2f', '#c0392b']),
  };
}

export function makeHuman(look, { police = false } = {}) {
  const female = !!look.female;
  const sk = skinMat(look.skin);
  const shirtC = look.shirt, pantsC = look.pants;
  const shirt = mat(shirtC, { roughness: 0.9 }), pants = mat(pantsC, { roughness: 0.85 });
  const shoes = mat(police ? '#111111' : look.shoes || '#2a2a2a', { roughness: 0.5 });
  const g = new THREE.Group();
  const body = new THREE.Group();
  body.scale.set(look.wide || 1, look.height || 1, look.wide || 1);
  g.add(body);
  const hipY = 0.93;

  // ---- piernas (muslo + rodilla + pierna + zapatilla) ----
  const leg = (side) => {
    const hip = pivot(side * 0.095, hipY, 0, body);
    mesh(G_.cap, pants, 0.15, 0.3, 0.16, 0, -0.21, 0, hip);
    const knee = pivot(0, -0.44, 0, hip);
    mesh(G_.cap, pants, 0.125, 0.3, 0.13, 0, -0.2, 0, knee);
    const foot = pivot(0, -0.43, 0, knee);
    mesh(G_.box, shoes, 0.11, 0.08, 0.27, 0, -0.03, 0.05, foot);
    mesh(G_.box, mat('#e8e8e8'), 0.115, 0.025, 0.28, 0, -0.065, 0.05, foot);
    hip.knee = knee;
    return hip;
  };
  const legL = leg(-1), legR = leg(1);

  // ---- tronco ----
  const torso = mesh(female ? TORSO.f : TORSO.m, shirt, 1, 1, 1, 0, hipY - 0.04, 0, body);
  mesh(G_.sphere, pants, 0.34, 0.16, 0.22, 0, hipY - 0.02, 0, body); // cadera
  mesh(G_.cyl, mat('#2b2b2b'), 0.33, 0.04, 0.21, 0, hipY + 0.03, 0, body); // cinturón
  if (look.top === 'hoodie' && !police) {
    mesh(G_.box, mat(shirtC, { roughness: 0.95 }), 0.24, 0.1, 0.03, 0, hipY + 0.12, 0.1, body); // bolsillo canguro
    const hood = mesh(G_.sphere, shirt, 0.3, 0.16, 0.16, 0, hipY + 0.62, -0.1, body);
    hood.rotation.x = 0.5;
    for (const sx of [-0.035, 0.035]) mesh(G_.cyl, mat('#eeeeee'), 0.008, 0.16, 0.008, sx, hipY + 0.5, 0.115, body);
  }
  if (look.top === 'jacket') {
    mesh(G_.box, mat(look.inner || '#f2f2f2'), 0.12, 0.5, 0.02, 0, hipY + 0.3, 0.115, body);
    mesh(G_.box, shirt, 0.26, 0.06, 0.18, 0, hipY + 0.6, 0, body);
  }
  if (police) {
    mesh(G_.box, mat('#f1c40f', { metalness: 0.7, roughness: 0.3 }), 0.05, 0.06, 0.01, -0.08, hipY + 0.45, 0.12, body);
    mesh(G_.cyl, mat('#1a1a1a'), 0.34, 0.06, 0.22, 0, hipY + 0.01, 0, body);
  }
  if (look.backpack) mesh(G_.box, mat(['#2c3e50', '#6c3483', '#16a085', '#555'][Math.round((look.height || 1) * 100) % 4]), 0.3, 0.36, 0.13, 0, hipY + 0.3, -0.16, body);

  // ---- brazos (hombro + codo + mano) ----
  const sleeveLong = look.top !== 'tee';
  const arm = (side) => {
    const sh = pivot(side * (female ? 0.19 : 0.215), hipY + 0.55, 0, body);
    mesh(G_.sphere, shirt, 0.115, 0.1, 0.12, -side * 0.012, -0.005, 0, sh); // deltoides
    mesh(G_.cap, sleeveLong ? shirt : shirt, 0.105, 0.2, 0.105, 0, -0.14, 0, sh);
    const elbow = pivot(0, -0.29, 0, sh);
    mesh(G_.cap, sleeveLong ? shirt : sk, 0.088, 0.2, 0.088, 0, -0.13, 0, elbow);
    if (sleeveLong) mesh(G_.cyl, mat(shirtC, { roughness: 0.95 }), 0.085, 0.04, 0.085, 0, -0.255, 0, elbow);
    if (!sleeveLong) mesh(G_.cyl, shirt, 0.11, 0.09, 0.11, 0, 0.13, 0, elbow); // manga corta
    const wrist = pivot(0, -0.27, 0, elbow);
    smallHand(sk, wrist, side);
    sh.elbow = elbow;
    sh.wrist = wrist;
    return sh;
  };
  const armL = arm(-1), armR = arm(1);

  // ---- cuello y cabeza ----
  mesh(G_.cyl, sk, 0.105, 0.12, 0.1, 0, hipY + 0.67, -0.005, body);
  mesh(G_.sphere, shirt, female ? 0.3 : 0.36, 0.09, 0.19, 0, hipY + 0.6, -0.005, body); // trapecios
  const head = pivot(0, hipY + 0.82, 0, body);
  mesh(G_.sphere, sk, 0.2, 0.235, 0.215, 0, 0, 0, head);
  mesh(G_.sphere, sk, 0.16, 0.12, 0.17, 0, -0.07, 0.015, head); // mandíbula
  // ojos
  for (const sx of [-1, 1]) {
    mesh(G_.sphereLo, mat('#f4f1ec', { roughness: 0.3 }), 0.03, 0.02, 0.02, sx * 0.042, 0.01, 0.096, head);
    mesh(G_.sphereLo, sk, 0.036, 0.014, 0.024, sx * 0.042, 0.022, 0.097, head); // párpado
    mesh(G_.sphereLo, mat(['#3b2a1a', '#2f5a7a', '#3e6b3a'][Math.round((look.height || 1) * 50) % 3], { roughness: 0.2 }), 0.016, 0.018, 0.012, sx * 0.042, 0.01, 0.105, head);
    mesh(G_.box, mat(look.hair), 0.04, 0.008, 0.012, sx * 0.043, 0.04, 0.1, head).rotation.z = -sx * 0.12; // cejas
    mesh(G_.sphere, sk, 0.025, 0.045, 0.02, sx * 0.1, 0, 0, head); // orejas
  }
  const nose = mesh(G_.cap, sk, 0.024, 0.03, 0.026, 0, -0.02, 0.105, head);
  nose.rotation.x = 0.3;
  mesh(G_.cap, mat(female ? '#b5574f' : '#9c5b4a', { roughness: 0.5 }), 0.012, 0.03, 0.01, 0, -0.068, 0.096, head).rotation.z = Math.PI / 2;
  if (look.beard) mesh(G_.sphere, mat(look.hair, { roughness: 1 }), 0.165, 0.1, 0.16, 0, -0.085, 0.025, head);
  if (look.glasses) {
    for (const sx of [-1, 1]) mesh(G_.cyl, mat('#141414', { roughness: 0.3 }), 0.042, 0.006, 0.034, sx * 0.042, 0.01, 0.11, head).rotation.x = Math.PI / 2;
    mesh(G_.box, mat('#141414'), 0.03, 0.006, 0.006, 0, 0.014, 0.115, head);
  }
  // pelo
  const hm = mat(look.hair, { roughness: 0.75 });
  const hs = police ? 'police' : look.hairStyle;
  if (hs === 'police') {
    mesh(G_.cyl, mat('#1f3a6b'), 0.23, 0.07, 0.24, 0, 0.1, 0, head);
    mesh(G_.box, mat('#1f3a6b'), 0.2, 0.012, 0.09, 0, 0.075, 0.12, head);
    mesh(G_.box, mat('#f1c40f', { metalness: 0.7, roughness: 0.3 }), 0.035, 0.035, 0.008, 0, 0.11, 0.122, head);
  } else if (hs === 3) { // gorra
    const cm = mat(look.capColor || ['#1b1f27', '#8e2b3a', '#1f3b57', '#e8e8e8', '#2e7d4f'][Math.round((look.height || 1) * 77) % 5], { roughness: 0.85 });
    mesh(G_.hairCap, hm, 0.212, 0.2, 0.226, 0, 0.0, -0.01, head); // pelo bajo la gorra
    mesh(G_.hairCap, cm, 0.226, 0.22, 0.238, 0, 0.03, -0.004, head);
    const brim = mesh(G_.box, cm, 0.19, 0.014, 0.13, 0, 0.045, 0.145, head);
    brim.rotation.x = 0.16;
    mesh(G_.sphereLo, cm, 0.025, 0.012, 0.025, 0, 0.142, -0.004, head); // botón
  } else if (hs === 2) { // rapado
    mesh(G_.hairCap, hm, 0.207, 0.22, 0.22, 0, 0.015, -0.004, head);
  } else {
    mesh(G_.hairCap, hm, 0.215, 0.24, 0.228, 0, 0.022, -0.008, head);
    if (hs === 1) mesh(G_.sphere, hm, 0.2, 0.08, 0.13, 0.03, 0.1, 0.05, head); // flequillo
    if (hs === 4) { // melena: caída por detrás y mechones a los lados
      mesh(G_.cap, hm, 0.22, 0.2, 0.11, 0, -0.13, -0.07, head);
      for (const sx of [-1, 1]) mesh(G_.cap, hm, 0.06, 0.16, 0.08, sx * 0.095, -0.1, -0.005, head);
    }
    if (hs === 5) { const pt = mesh(G_.cap, hm, 0.07, 0.15, 0.07, 0, -0.06, -0.14, head); pt.rotation.x = 0.4; } // coleta
    if (hs === 6) mesh(G_.sphere, hm, 0.12, 0.11, 0.12, 0, 0.11, -0.1, head); // moño
  }

  const anchorL = new THREE.Group(), anchorR = new THREE.Group();
  anchorL.position.set(0, -0.1, 0.03); anchorR.position.set(0, -0.1, 0.03);
  armL.wrist.add(anchorL); armR.wrist.add(anchorR);

  const h = { group: g, body, legL, legR, armL, armR, head, anchorL, anchorR, phase: Math.random() * 6, over: {}, cur: {} };
  const applyOver = (dt) => {
    const k = Math.min(1, dt * 9);
    for (const key of ['armL', 'armR', 'head', 'armLz', 'armRz']) {
      const part = h[key.replace('z', '')];
      const axis = key.endsWith('z') ? 'z' : 'x';
      const tgt = h.over[key];
      if (tgt === undefined) { h.cur[key] = part.rotation[axis]; continue; }
      h.cur[key] = (h.cur[key] ?? part.rotation[axis]) + (tgt - (h.cur[key] ?? part.rotation[axis])) * k;
      part.rotation[axis] = h.cur[key];
      if (key === 'armR' || key === 'armL') part.elbow.rotation.x = Math.min(0, tgt) * 0.6; // codo doblado al coger cosas
    }
  };
  h.hold = (side, obj) => {
    const a = side === 'L' ? anchorL : anchorR;
    a.clear();
    if (obj) a.add(obj);
  };
  h.animate = (dt, speed) => {
    if (speed > 0.05) {
      h.phase += dt * speed * 3.0;
      const amp = Math.min(0.62, speed * 0.24);
      const s = Math.sin(h.phase);
      legL.rotation.x = s * amp; legR.rotation.x = -s * amp;
      // la rodilla se dobla cuando la pierna va hacia atrás / se adelanta
      legL.knee.rotation.x = Math.max(0, -Math.cos(h.phase)) * amp * 1.3 + 0.05;
      legR.knee.rotation.x = Math.max(0, Math.cos(h.phase)) * amp * 1.3 + 0.05;
      armL.rotation.x = -s * amp * 0.8; armR.rotation.x = s * amp * 0.8;
      armL.elbow.rotation.x = -0.25 - Math.max(0, s) * amp * 0.5;
      armR.elbow.rotation.x = -0.25 - Math.max(0, -s) * amp * 0.5;
      body.position.y = Math.abs(Math.cos(h.phase)) * 0.03;
      body.rotation.y = s * 0.05;
    } else {
      const k = Math.min(1, dt * 8);
      for (const p of [legL, legR, armL, armR]) p.rotation.x *= 1 - k;
      legL.knee.rotation.x *= 1 - k; legR.knee.rotation.x *= 1 - k;
      armL.elbow.rotation.x += (-0.12 - armL.elbow.rotation.x) * k;
      armR.elbow.rotation.x += (-0.12 - armR.elbow.rotation.x) * k;
      armL.rotation.z = 0.06; armR.rotation.z = -0.06;
      h.phase += dt * 1.4;
      body.position.y = Math.sin(h.phase) * 0.005;
      body.rotation.y *= 1 - k;
    }
    applyOver(dt);
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
