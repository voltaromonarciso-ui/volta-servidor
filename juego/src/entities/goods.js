import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries, mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { shardsFaceURL } from '../ui/icons.js';

// Modelos de producto a escala real (metros), compartidos por las manos, las mesas
// de trabajo y la estación de empaquetado: cogollos, sobres zip, tarros de cristal,
// bolsas Sweet Shards, cristales y billetes. Siguen la ficha de producto del juego.

const cache = new Map();
const once = (k, fn) => { if (!cache.has(k)) cache.set(k, fn()); return cache.get(k); };
const rnd = (seed) => { let s = seed * 7919 + 13; return () => ((s = (s * 16807) % 2147483647) / 2147483647); };

// ------------------------------------------------------------------
//  Cogollos
// ------------------------------------------------------------------
// Un cogollo son ~14 bolitas con relieve sobre un huso, con hojitas finas y algún
// pelillo ámbar. Todo en una geometría con colores por vértice (1 draw call).
function budGeometry(hex, variant) {
  return once(`bud:${hex}:${variant}`, () => {
    const R = rnd(variant + 3);
    const base = new THREE.Color(hex);
    const dark = base.clone().multiplyScalar(0.38);
    const light = base.clone().lerp(new THREE.Color('#dfffc0'), 0.22);
    const hair = new THREE.Color('#d98a3a');
    const leafC = base.clone().multiplyScalar(0.7).lerp(new THREE.Color('#2f6b22'), 0.4);
    const parts = [];
    const lobe = (() => { const g = new THREE.IcosahedronGeometry(1, 2); g.deleteAttribute('normal'); g.deleteAttribute('uv'); return mergeVertices(g); })();
    const n = 14;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);                       // de abajo (0) a la punta (1)
      const y = -0.42 + t * 0.9;
      const ring = Math.sin(Math.PI * (0.15 + t * 0.75)) * 0.32;
      const a = i * 2.4 + R() * 0.6;
      const r = 0.2 + Math.sin(Math.PI * (0.2 + t * 0.7)) * 0.13 + R() * 0.04;
      const g = lobe.clone();
      const p = g.attributes.position;
      const col = new Float32Array(p.count * 3);
      for (let k = 0; k < p.count; k++) {
        let vx = p.getX(k), vy = p.getY(k), vz = p.getZ(k);
        const bump = 1 + 0.12 * Math.sin(vx * 9 + i) * Math.sin(vy * 8 + vz * 7);
        vx *= r * bump; vy *= r * bump * 1.1; vz *= r * bump;
        const wx = Math.cos(a) * ring + vx, wy = y + vy, wz = Math.sin(a) * ring + vz;
        p.setXYZ(k, wx, wy, wz);
        // sombra en la parte baja y entre bolitas; brillo arriba; pelillos sueltos
        const up = (vy / r + 1) / 2;
        const c = dark.clone().lerp(base, Math.min(1, up * 1.4)).lerp(light, Math.max(0, up - 0.6) * 1.2 * (0.5 + t * 0.5));
        if (R() < 0.012) c.lerp(hair, 0.7);
        col[k * 3] = c.r; col[k * 3 + 1] = c.g; col[k * 3 + 2] = c.b;
      }
      g.setAttribute('color', new THREE.BufferAttribute(col, 3));
      g.computeVertexNormals();
      parts.push(g);
    }
    // hojitas de azúcar que asoman
    const leaf = new THREE.SphereGeometry(1, 6, 4); leaf.deleteAttribute('uv');
    for (let i = 0; i < 4; i++) {
      const g = leaf.clone();
      const a = i * 1.7 + R();
      g.scale(0.07, 0.3, 0.16);
      g.rotateZ(-0.9);
      g.rotateY(-a);
      g.translate(Math.cos(a) * 0.36, -0.15 + i * 0.12, Math.sin(a) * 0.36);
      const c = new Float32Array(g.attributes.position.count * 3);
      for (let k = 0; k < c.length; k += 3) { c[k] = leafC.r; c[k + 1] = leafC.g; c[k + 2] = leafC.b; }
      g.setAttribute('color', new THREE.BufferAttribute(c, 3));
      g.computeVertexNormals();
      parts.push(g);
    }
    return mergeGeometries(parts);
  });
}
const budMat = () => once('budMat', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.92 }));

// Cogollo de `size` metros de alto.
export function bud(hex = '#6abf45', size = 0.035, variant = 0) {
  const m = new THREE.Mesh(budGeometry(hex, variant % 4), budMat());
  m.scale.setScalar(size);
  return m;
}

// Montón de cogollos apoyados sobre y=0 dentro de un rectángulo w×d.
export function budPile(parent, hex, n, w, d, size = 0.03, seed = 1) {
  const R = rnd(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const s = size * (0.85 + R() * 0.3);
    const b = bud(hex, s, i);
    const layer = Math.floor(i / 5);
    b.position.set((R() - 0.5) * w, s * 0.42 + layer * s * 0.6, (R() - 0.5) * d);
    b.rotation.set((R() - 0.5) * 0.9, R() * 6.3, (R() - 0.5) * 0.9 + (layer ? 0.6 : 0));
    parent.add(b);
    out.push(b);
  }
  return out;
}

// Llena un recipiente redondo de radio r hasta la altura h con cogollos.
function fillRound(parent, hex, r, h, size, seed) {
  const R = rnd(seed);
  let y = size * 0.45, k = 0;
  while (y < h) {
    const ring = [[0, 0], ...Array.from({ length: 5 }, (_, i) => [Math.cos(i * 1.26 + y * 40) * r * 0.68, Math.sin(i * 1.26 + y * 40) * r * 0.68])];
    for (const [x, z] of ring) {
      const b = bud(hex, size * (0.9 + R() * 0.25), k++);
      b.position.set(x + (R() - 0.5) * 0.004, y + (R() - 0.5) * 0.006, z + (R() - 0.5) * 0.004);
      b.rotation.set((R() - 0.5) * 1.2, R() * 6.3, (R() - 0.5) * 1.2);
      parent.add(b);
    }
    y += size * 0.62;
  }
}

// ------------------------------------------------------------------
//  Tarro de cristal con tapón de corcho
// ------------------------------------------------------------------
const JAR_H = 0.11, JAR_R = 0.042;
function corkTex() {
  return once('corkTex', () => {
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const x = c.getContext('2d');
    x.fillStyle = '#c08a52'; x.fillRect(0, 0, 128, 128);
    const R = rnd(5);
    for (let i = 0; i < 900; i++) {
      x.fillStyle = R() < 0.5 ? 'rgba(120,72,30,0.45)' : 'rgba(235,190,130,0.4)';
      x.beginPath(); x.arc(R() * 128, R() * 128, 0.6 + R() * 1.6, 0, 7); x.fill();
    }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
const glassMats = () => once('glass', () => ({
  body: new THREE.MeshStandardMaterial({ color: 0xe9f7fb, roughness: 0.05, metalness: 0.15, transparent: true, opacity: 0.24, depthWrite: false, side: THREE.DoubleSide }),
  rim: new THREE.MeshStandardMaterial({ color: 0xd6eef4, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.55, depthWrite: false }),
  shine: new THREE.MeshBasicMaterial({ color: 0xd8e4e9, transparent: true, opacity: 0.35, depthWrite: false, side: THREE.DoubleSide }),
  cork: new THREE.MeshStandardMaterial({ map: corkTex(), roughness: 0.95 }),
}));
const jarGeos = () => once('jarGeo', () => {
  const H = JAR_H, Rr = JAR_R;
  const prof = [[0, 0], [Rr * 0.86, 0], [Rr, Rr * 0.18], [Rr, H * 0.74], [Rr * 0.93, H * 0.84], [Rr * 0.86, H * 0.88], [Rr * 0.86, H * 0.95], [Rr * 0.9, H * 0.97], [Rr * 0.9, H]]
    .map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.LatheGeometry(prof, 36);
  const base = new THREE.CylinderGeometry(Rr * 0.9, Rr * 0.86, 0.006, 36); base.translate(0, 0.003, 0);
  const shine = new THREE.PlaneGeometry(0.008, H * 0.55); shine.translate(0, H * 0.42, 0);
  const lidP = [[0, 0], [Rr * 0.86, 0], [Rr * 0.86, 0.006], [Rr * 1.02, 0.008], [Rr * 1.04, 0.026], [Rr * 1.0, 0.03], [0, 0.03]].map(([a, b]) => new THREE.Vector2(a, b));
  const lid = new THREE.LatheGeometry(lidP, 32);
  return { body, base, shine, lid };
});

// Tarro; si `hex` viene, lleno de cogollos de ese color. Origen en la base.
export function jar(hex = null, { lid = true, seed = 2, fill = null } = {}) {
  const g = new THREE.Group();
  const M = glassMats(), Gm = jarGeos();
  if (fill === 'crystal') { const inner = new THREE.Group(); inner.position.y = 0.008; for (let k = 0; k < 3; k++) { const l = new THREE.Group(); l.position.y = k * 0.022; crystalCluster(l, 9, JAR_R * 1.4, 0.03, seed + k); inner.add(l); } g.add(inner); g.userData.buds = inner; }
  if (hex) {
    const inner = new THREE.Group();
    fillRound(inner, hex, JAR_R * 0.78, JAR_H * 0.62, 0.03, seed);
    inner.position.y = 0.006;
    g.add(inner);
    g.userData.buds = inner;
  }
  const body = new THREE.Mesh(Gm.body, M.body); body.renderOrder = 2; g.add(body);
  const base = new THREE.Mesh(Gm.base, M.rim); base.renderOrder = 2; g.add(base);
  for (const [a, w] of [[-0.75, 1], [-0.45, 0.45], [2.4, 0.6]]) {
    const s = new THREE.Mesh(Gm.shine, M.shine);
    s.scale.x = w;
    s.position.set(Math.sin(a) * JAR_R * 1.01, 0, Math.cos(a) * JAR_R * 1.01);
    s.rotation.y = a;
    s.renderOrder = 3;
    g.add(s);
  }
  if (lid) {
    const l = new THREE.Mesh(Gm.lid, fill === 'crystal' ? once('m-tapaGris', () => new THREE.MeshStandardMaterial({ color: 0xc3cad0, roughness: 0.35, metalness: 0.35 })) : M.cork);
    l.position.y = JAR_H - 0.004;
    g.add(l);
    g.userData.lid = l;
  }
  g.userData.height = JAR_H;
  return g;
}
export const JAR = { h: JAR_H, r: JAR_R };

// ------------------------------------------------------------------
//  Bolsas con forma de almohadilla (zip transparente y Sweet Shards)
// ------------------------------------------------------------------
// Plano con abombado: la cabecera (zip) queda plana y la parte de abajo se hincha.
function pillowGeo(w, h, depth, header = 0.2) {
  return once(`pillow:${w}:${h}:${depth}:${header}`, () => {
    const parts = [];
    for (const side of [1, -1]) {
      const g = new THREE.PlaneGeometry(w, h, 14, 16);
      const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) {
        const x = p.getX(i), y = p.getY(i);
        const u = x / w + 0.5, v = y / h + 0.5;
        const body = Math.max(0, (1 - header) - v) / (1 - header);
        const puff = Math.pow(Math.max(0, Math.sin(Math.PI * u)), 0.7) * Math.pow(Math.max(0, Math.sin(Math.PI * Math.min(1, body * 1.05))), 0.6);
        p.setZ(i, side * depth * 0.5 * puff);
        // los laterales se recogen un poco al hincharse
        p.setX(i, x * (1 - 0.06 * puff));
      }
      g.computeVertexNormals();
      parts.push(g);
    }
    return parts;
  });
}

const filmMats = () => once('film', () => ({
  film: new THREE.MeshStandardMaterial({ color: 0xf4fbfd, roughness: 0.12, metalness: 0.05, transparent: true, opacity: 0.26, depthWrite: false, side: THREE.DoubleSide }),
  seal: new THREE.MeshStandardMaterial({ color: 0xeaf4f8, roughness: 0.2, transparent: true, opacity: 0.6, depthWrite: false }),
  zip: new THREE.MeshStandardMaterial({ color: 0xbfd9e4, roughness: 0.3, transparent: true, opacity: 0.85 }),
  shine: new THREE.MeshBasicMaterial({ color: 0xd8e4e9, transparent: true, opacity: 0.32, depthWrite: false, side: THREE.DoubleSide }),
}));
export const BAG = { w: 0.085, h: 0.11, d: 0.03 };

// Sobre zip; si `hex` viene, con cogollos dentro. Origen en el centro de la bolsa.
export function zipBag(hex = null, { open = false, seed = 4, flat = false, fill = null, deep = false } = {}) {
  const g = new THREE.Group();
  const M = filmMats();
  const { w, h } = BAG, d = flat ? 0.004 : hex || fill || deep ? BAG.d : 0.012;
  if (fill === 'crystal') { // cristales azules apretados en el fondo
    const inner = new THREE.Group(); inner.position.y = -h / 2 + 0.008;
    for (let k = 0; k < 3; k++) { const l = new THREE.Group(); l.position.y = k * 0.018; crystalCluster(l, 9 - k * 2, w * 0.8, 0.028, seed + k); inner.add(l); }
    g.add(inner); g.userData.buds = inner;
  } else if (fill === 'powder') { // montoncito de polvo blanco
    const p = new THREE.Mesh(once('polvoBolsa', () => { const ge = new THREE.SphereGeometry(1, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2); return ge; }), once('m-polvo', () => new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 })));
    p.scale.set(w * 0.42, h * 0.32, d * 0.4); p.position.y = -h / 2 + 0.004; g.add(p); g.userData.buds = p;
  }
  if (hex) {
    const inner = new THREE.Group();
    const R = rnd(seed);
    const rows = [[-0.3, 0.017], [0, 0.017], [0.3, 0.017], [-0.17, 0.042], [0.17, 0.042], [0, 0.064]];
    rows.forEach(([u, y], i) => {
      const b = bud(hex, 0.03 * (0.9 + R() * 0.2), i + seed);
      b.position.set(u * w + (R() - 0.5) * 0.004, y, (R() - 0.5) * 0.004);
      b.rotation.set((R() - 0.5) * 1.2, R() * 6.3, (R() - 0.5) * 1.2);
      inner.add(b);
    });
    inner.position.y = -h / 2 + 0.006;
    g.add(inner);
    g.userData.buds = inner;
  }
  for (const pg of pillowGeo(w, h, d)) { const m = new THREE.Mesh(pg, M.film); m.renderOrder = 2; g.add(m); }
  // soldaduras laterales y de fondo
  const sealG = once('sealG', () => new RoundedBoxGeometry(1, 1, 1, 1, 0.1));
  for (const [x, y, sw, sh] of [[-w / 2, 0, 0.004, h], [w / 2, 0, 0.004, h], [0, -h / 2, w, 0.004], [0, h / 2, w, 0.004]]) {
    const s = new THREE.Mesh(sealG, M.seal); s.scale.set(sw, sh, 0.003); s.position.set(x, y, 0); s.renderOrder = 2; g.add(s);
  }
  // cierre zip (dos perfiles) y agujero para colgar
  const zipY = h / 2 - h * 0.17;
  for (const dz of [0.0025, -0.0025]) {
    const z = new THREE.Mesh(sealG, M.zip); z.scale.set(w * 0.97, 0.0035, 0.002); z.position.set(0, zipY, dz); g.add(z);
    g.userData.zip = z;
  }
  const hole = new THREE.Mesh(once('holeG', () => new THREE.TorusGeometry(0.006, 0.0012, 6, 20)), M.seal);
  hole.scale.set(1.9, 0.9, 1); hole.position.set(0, h / 2 - 0.009, 0); g.add(hole);
  // brillos del plástico
  const sh = new THREE.Mesh(once('bagShine', () => new THREE.PlaneGeometry(0.006, h * 0.55)), M.shine);
  sh.position.set(-w * 0.32, -h * 0.08, d * 0.42); sh.rotation.z = 0.05; sh.renderOrder = 3; g.add(sh);
  const sh2 = sh.clone(); sh2.scale.set(0.6, 0.4, 1); sh2.position.set(w * 0.3, -h * 0.05, d * 0.42); g.add(sh2);
  if (open) g.userData.zip.visible = false;
  g.userData.size = BAG;
  return g;
}

function shardsTex() {
  return once('ssTex', () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 320;
    const x = c.getContext('2d');
    x.fillStyle = '#efeaf3'; x.fillRect(0, 0, 256, 320);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    const img = new Image();
    img.onload = () => { x.drawImage(img, 0, 0, 256, 320); t.needsUpdate = true; };
    img.src = shardsFaceURL();
    return t;
  });
}
const foilMats = () => once('foil', () => ({
  face: new THREE.MeshStandardMaterial({ map: shardsTex(), roughness: 0.38, metalness: 0.25, side: THREE.DoubleSide }),
  back: new THREE.MeshStandardMaterial({ color: 0xe9e3ee, roughness: 0.35, metalness: 0.45, side: THREE.DoubleSide }),
}));

// Bolsa Sweet Shards (llena o vacía y plana). Origen en el centro.
// Bolsa de cristales: zip transparente con cristales azules (como la lámina)
export function shardsBag(full = true) {
  return full ? zipBag(null, { fill: 'crystal', seed: 7 }) : zipBag(null, { flat: true });
}

// ------------------------------------------------------------------
//  Cristales Sweet
// ------------------------------------------------------------------
export const GEMS = ['#3fa9f5', '#5cc0ff', '#2f86e0', '#7fd0ff', '#1f6fd1']; // (azules, como la lámina)
const gemGeo = () => once('gemGeo', () => {
  const p = [[0, 0], [0.32, 0.04], [0.36, 0.7], [0, 1]].map(([a, b]) => new THREE.Vector2(a, b));
  const g = new THREE.LatheGeometry(p, 6);
  return g.toNonIndexed();
});
const gemMat = (c) => once('gem' + c, () => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.28, roughness: 0.12, metalness: 0.15, flatShading: true }));

export function crystal(color, size = 0.03) {
  const m = new THREE.Mesh(gemGeo(), gemMat(color));
  m.scale.set(size * 0.55, size, size * 0.55);
  return m;
}
export function crystalCluster(parent, n = 6, spread = 0.05, size = 0.035, seed = 3) {
  const R = rnd(seed);
  const out = [];
  for (let i = 0; i < n; i++) {
    const c = crystal(GEMS[i % GEMS.length], size * (0.6 + R() * 0.6));
    c.position.set((R() - 0.5) * spread, 0, (R() - 0.5) * spread * 0.6);
    c.rotation.set((R() - 0.5) * 1.1, R() * 6, (R() - 0.5) * 1.1);
    parent.add(c);
    out.push(c);
  }
  return out;
}

// ------------------------------------------------------------------
//  Billetes
// ------------------------------------------------------------------
function noteTex() {
  return once('noteTex', () => {
    const c = document.createElement('canvas'); c.width = 256; c.height = 128;
    const x = c.getContext('2d');
    const gr = x.createLinearGradient(0, 0, 256, 128); gr.addColorStop(0, '#9fd59a'); gr.addColorStop(1, '#5fa865');
    x.fillStyle = gr; x.fillRect(0, 0, 256, 128);
    x.strokeStyle = '#2f6b35'; x.lineWidth = 5; x.strokeRect(8, 8, 240, 112);
    x.lineWidth = 1.5; for (let i = 0; i < 18; i++) { x.beginPath(); x.arc(128, 64, 20 + i * 4, 0, 7); x.globalAlpha = 0.12; x.stroke(); }
    x.globalAlpha = 1;
    x.fillStyle = '#d7f0d2'; x.beginPath(); x.ellipse(128, 64, 34, 40, 0, 0, 7); x.fill(); x.stroke();
    x.fillStyle = '#2f6b35'; x.font = '900 52px Arial Black, Arial'; x.textAlign = 'center'; x.textBaseline = 'middle'; x.fillText('$', 128, 66);
    x.font = '900 26px Arial Black, Arial'; x.fillText('100', 40, 34); x.fillText('100', 216, 96);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
    return t;
  });
}
export function cashStack(n = 6) {
  const g = new THREE.Group();
  const geo = once('noteG', () => new THREE.BoxGeometry(0.156, 0.0012, 0.066));
  const top = once('noteM', () => new THREE.MeshStandardMaterial({ map: noteTex(), roughness: 0.85 }));
  const side = once('noteS', () => new THREE.MeshStandardMaterial({ color: 0x86c483, roughness: 0.9 }));
  for (let i = 0; i < n; i++) {
    const m = new THREE.Mesh(geo, [side, side, top, side, side, side]);
    m.position.set((i % 2) * 0.002, i * 0.0013, (i % 3) * 0.0015);
    m.rotation.y = (i % 3 - 1) * 0.03;
    g.add(m);
  }
  const band = new THREE.Mesh(once('bandG', () => new THREE.BoxGeometry(0.03, n * 0.0013 + 0.003, 0.068)), once('bandM', () => new THREE.MeshStandardMaterial({ color: 0xf4d35e, roughness: 0.7 })));
  band.position.y = n * 0.00065;
  g.add(band);
  return g;
}

// ------------------------------------------------------------------
//  Semillas: forma de lágrima con punta y quilla, cáscara moteada con vetas oscuras
// ------------------------------------------------------------------
let seedGeo = null, seedMat = null;
function seedTexture() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 64;
  const x = c.getContext('2d');
  x.fillStyle = '#9a8a72'; x.fillRect(0, 0, 128, 64);
  let s = 7;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  // jaspeado: manchas oscuras irregulares y cortas en todas direcciones (no vetas de punta a punta)
  for (let i = 0; i < 60; i++) {
    x.strokeStyle = `rgba(${50 + r() * 20},${38 + r() * 14},${28 + r() * 10},${0.45 + r() * 0.4})`;
    x.lineWidth = 1 + r() * 2.5; x.lineCap = 'round';
    let px = r() * 128, py = 8 + r() * 48, a = r() * Math.PI * 2;
    x.beginPath(); x.moveTo(px, py);
    for (let k = 0; k < 4; k++) { a += (r() - 0.5) * 1.6; px += Math.cos(a) * 5; py += Math.sin(a) * 3; x.lineTo(px, py); }
    x.stroke();
  }
  for (let i = 0; i < 300; i++) { x.fillStyle = r() < 0.5 ? `rgba(70,55,40,${0.2 + r() * 0.3})` : `rgba(205,192,168,${0.15 + r() * 0.25})`; x.fillRect(r() * 128, r() * 64, 1 + r() * 2, 1 + r() * 2); }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = THREE.RepeatWrapping;
  return t;
}
export function seed() {
  if (!seedGeo) {
    // perfil de lágrima: base redondeada y punta, girado alrededor del eje Y
    const pts = [];
    // ovalada (largo ≈ 1,6 × ancho), base redonda y punta suave
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      const rad = 0.33 * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.9)), 0.85) * (1 - 0.22 * t);
      pts.push(new THREE.Vector2(Math.max(0.001, rad), t - 0.5));
    }
    seedGeo = new THREE.LatheGeometry(pts, 18);
    // algo aplanada, con la quilla (costura) marcada
    const p = seedGeo.attributes.position;
    for (let i = 0; i < p.count; i++) {
      const vx = p.getX(i), vz = p.getZ(i);
      p.setZ(i, vz * 0.8);
      p.setX(i, vx + (Math.abs(vz) < 0.03 && vx > 0 ? 0.01 : 0));
    }
    seedGeo.computeVertexNormals();
    seedMat = new THREE.MeshStandardMaterial({ map: seedTexture(), roughness: 0.3, metalness: 0.05 });
  }
  const m = new THREE.Mesh(seedGeo, seedMat);
  m.castShadow = true;
  return m;
}

// Puñado de semillas (para la mano).
export function seedPile(parent, n = 5, size = 0.024, seedN = 5) {
  let s = seedN;
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < n; i++) {
    const m = seed();
    m.scale.setScalar(size * (0.9 + r() * 0.2));
    const a = (i / n) * Math.PI * 2 + r();
    const rr = i === 0 ? 0 : size * (0.7 + r() * 0.3);
    m.position.set(Math.cos(a) * rr, size * 0.35 + (i === 0 ? size * 0.4 : 0), Math.sin(a) * rr);
    m.rotation.set(Math.PI / 2 + (r() - 0.5) * 0.5, r() * Math.PI * 2, (r() - 0.5) * 0.6); // tumbadas
    parent.add(m);
  }
  return parent;
}

// ------------------------------------------------------------------
//  Drogas nuevas (como la lámina): vial, blíster, frasco ámbar, gotero con caja
// ------------------------------------------------------------------
const gm = (k, o) => once('dg-' + k, () => new THREE.MeshStandardMaterial(o));
const glassClear = () => gm('vidrio', { color: 0xe8f6ff, roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.4, depthWrite: false });
const blackCap = () => gm('tapon', { color: 0x24272b, roughness: 0.45 });
export function vialModel(full = true, { cap = true } = {}) {
  const g = new THREE.Group();
  if (full) { const p = new THREE.Mesh(once('vialPolvo', () => new THREE.CylinderGeometry(0.0115, 0.0115, 0.04, 16)), gm('polvo', { color: 0xfbfaf7, roughness: 0.95 })); p.position.y = 0.022; g.add(p); }
  const b = new THREE.Mesh(once('vialCuerpo', () => new THREE.CylinderGeometry(0.013, 0.013, 0.085, 18)), glassClear()); b.position.y = 0.0425; b.renderOrder = 2; g.add(b);
  const c = new THREE.Mesh(once('vialTapa', () => new THREE.CylinderGeometry(0.0145, 0.0145, 0.018, 18)), blackCap()); c.position.y = 0.093; c.visible = cap; g.add(c); g.userData.cap = c;
  if (full === 'level') { const p = new THREE.Mesh(once('vialPolvo', () => new THREE.CylinderGeometry(0.0115, 0.0115, 0.04, 16)), gm('polvo', { color: 0xfbfaf7, roughness: 0.95 })); p.scale.y = 0.001; p.position.y = 0.002; g.add(p); g.userData.level = p; g.userData.levelMax = 0.075; }
  const l = new THREE.Mesh(once('vialEtiq', () => new THREE.CylinderGeometry(0.0133, 0.0133, 0.026, 18, 1, true, -0.9, 1.8)), gm('etiqueta', { color: 0xffffff, roughness: 0.7 })); l.position.y = 0.05; g.add(l);
  return g;
}
export function pillModel(size = 1) {
  const g = new THREE.Group();
  const geo = once('capsula', () => new THREE.CapsuleGeometry(0.005, 0.012, 4, 10));
  const a = new THREE.Mesh(geo, gm('capVerde', { color: 0x1f9e7a, roughness: 0.35 }));
  const half = new THREE.Mesh(once('capMedia', () => new THREE.CapsuleGeometry(0.0052, 0.006, 4, 10)), gm('capBlanca', { color: 0xf4f6f5, roughness: 0.35 }));
  half.position.y = -0.004; g.add(a, half); g.scale.setScalar(size); return g;
}
export function blisterModel(full = true, { slots = null } = {}) {
  const g = new THREE.Group();
  const card = new THREE.Mesh(once('blisterCarta', () => new RoundedBoxGeometry(0.06, 0.09, 0.002, 1, 0.0008)), gm('alu', { color: 0xd5dbe0, roughness: 0.35, metalness: 0.3 }));
  g.add(card);
  for (let c = 0; c < 2; c++) for (let r = 0; r < 5; r++) {
    const x = -0.014 + c * 0.028, y = -0.034 + r * 0.017;
    const bub = new THREE.Mesh(once('burbuja', () => new THREE.CapsuleGeometry(0.0055, 0.012, 4, 10)), glassClear());
    bub.rotation.z = Math.PI / 2; bub.position.set(x, y, 0.004); bub.scale.z = 0.6; g.add(bub);
    if (full) { const p = pillModel(0.9); p.rotation.z = Math.PI / 2; p.position.set(x, y, 0.004); g.add(p); }
    if (slots) slots.push(new THREE.Vector3(x, y, 0.004));
  }
  return g;
}
export function amberBottle(full = true, { cap = true } = {}) {
  const g = new THREE.Group();
  const prof = [[0, 0], [0.022, 0], [0.025, 0.004], [0.025, 0.06], [0.02, 0.07], [0.016, 0.072], [0.016, 0.078], [0, 0.078]].map(([a, b]) => new THREE.Vector2(a, b));
  const body = new THREE.Mesh(once('frascoCuerpo', () => new THREE.LatheGeometry(prof, 24)), gm('ambar', { color: full ? 0xb8641c : 0xd79c5c, roughness: 0.18, metalness: 0.1, transparent: true, opacity: 0.92 }));
  g.add(body);
  const capM = new THREE.Mesh(once('frascoTapa', () => new THREE.CylinderGeometry(0.019, 0.019, 0.016, 20)), blackCap()); capM.position.y = 0.084; capM.visible = cap; g.add(capM); g.userData.cap = capM;
  if (full) { const lab = new THREE.Mesh(once('frascoEtiq', () => new THREE.CylinderGeometry(0.0255, 0.0255, 0.03, 24, 1, true, -1.1, 2.2)), gm('etiquetaCrema', { color: 0xf3ead2, roughness: 0.7 })); lab.position.y = 0.032; g.add(lab); }
  return g;
}
export function dropperModel(withBox = true, { cap = true, level = false } = {}) {
  const g = new THREE.Group();
  const b = new THREE.Mesh(once('goteroCuerpo', () => new RoundedBoxGeometry(0.03, 0.06, 0.03, 2, 0.008)), gm('ambarOsc', { color: 0x7a3d12, roughness: 0.15, transparent: true, opacity: 0.95 }));
  b.position.y = 0.03; g.add(b);
  const lab = new THREE.Mesh(once('goteroEtiq', () => new THREE.PlaneGeometry(0.024, 0.026)), gm('etiqMorada', { color: 0xe5d8fb, roughness: 0.7 })); lab.position.set(0, 0.03, 0.0152); g.add(lab);
  const top = new THREE.Group(); g.add(top); g.userData.cap = top; top.visible = cap;
  const ring = new THREE.Mesh(once('goteroAro', () => new THREE.CylinderGeometry(0.009, 0.009, 0.01, 16)), blackCap()); ring.position.y = 0.065; top.add(ring);
  const bulb = new THREE.Mesh(once('goteroPera', () => new THREE.SphereGeometry(0.008, 14, 10)), blackCap()); bulb.scale.y = 1.6; bulb.position.y = 0.08; top.add(bulb);
  if (level) { const l = new THREE.Mesh(once('goteroLiq', () => new THREE.BoxGeometry(0.026, 1, 0.026)), gm('extractoLiq', { color: 0xb48cf0, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x6a3fc0, emissiveIntensity: 0.25 })); l.scale.y = 0.001; l.position.y = 0.003; g.add(l); g.userData.level = l; g.userData.levelMax = 0.054; }
  if (withBox) {
    const bx = new THREE.Mesh(once('goteroCaja', () => new RoundedBoxGeometry(0.034, 0.075, 0.034, 1, 0.002)), gm('cajaMorada', { color: 0xc7b0f5, roughness: 0.6 }));
    bx.position.set(0.04, 0.0375, -0.006); g.add(bx);
  }
  return g;
}
export function powderPile() {
  const p = new THREE.Mesh(once('montonPolvo', () => new THREE.ConeGeometry(0.045, 0.035, 20)), gm('polvo', { color: 0xfbfaf7, roughness: 0.95 }));
  p.position.y = 0.017; const g = new THREE.Group(); g.add(p); return g;
}
