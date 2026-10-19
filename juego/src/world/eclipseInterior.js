// Interior de El Eclipse (02-locales-b: «Zona principal / Discoteca», «Zona VIP», «Barra»).
// Se monta dentro de la sala principal de la fachada (facades.js), en sus coordenadas:
// sala x −9..11, z −14..−2, alto 7,5; la entrada es el hueco de la pared delantera en x ≈ 1.
// Devuelve las cajas de colisión del mobiliario [x0, x1, z0, z1, alto].
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mats = new Map();
function mat(k, o) {
  if (!mats.has(k)) {
    const { glow, ...rest } = o;
    const m = new THREE.MeshStandardMaterial(rest);
    if (glow) m.userData.glow = glow;
    mats.set(k, m);
  }
  return mats.get(k);
}
const texs = new Map();
function canvasTex(key, w, h, draw) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    texs.set(key, t);
  }
  return texs.get(key);
}
function box(g, m, x0, x1, y0, y1, z0, z1, r = 0) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  const geo = r ? new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99) : new THREE.BoxGeometry(w, h, d);
  const o = new THREE.Mesh(geo, m); o.position.set((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); g.add(o);
  return o;
}
function cyl(g, m, x, y, z, rt, rb, h, s = 16) {
  const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); o.position.set(x, y, z); g.add(o); return o;
}
function plane(g, m, w, h, x, y, z, ry = 0, rx = 0) {
  const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); g.add(o); return o;
}

// ---------- materiales ----------
const FLOOR = () => mat('ecFloor', { color: '#1c1a22', roughness: 0.25, metalness: 0.3 });
const WALL = () => mat('ecWall', { color: '#2a2532', roughness: 0.8 });
const CEIL = () => mat('ecCeil', { color: '#141218', roughness: 0.9 });
const METAL = () => mat('ecMetal', { color: '#9aa1a9', roughness: 0.3, metalness: 0.85 });
const BLACK = () => mat('ecBlack', { color: '#121214', roughness: 0.5, metalness: 0.2 });
const LEATHER = () => mat('ecLeather', { color: '#3d1f4f', roughness: 0.55 });
const WOOD = () => mat('ecWood', { color: '#5a3a24', roughness: 0.5 });
const neon = (c) => mat('ecNeon' + c, { color: c, emissive: c, emissiveIntensity: 1.6, roughness: 0.4, glow: 'sign' });

// suelo de la pista: baldosas de luz de colores
const danceTex = () => canvasTex('pista', 256, 192, (c, w, h) => {
  const cols = ['#7b2cff', '#ff2d95', '#2d8cff', '#16d0c0', '#ffb02d'];
  let s0 = 9; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let y = 0; y < 6; y++) for (let x = 0; x < 8; x++) {
    c.fillStyle = cols[Math.floor(rnd() * cols.length)]; c.globalAlpha = 0.55 + rnd() * 0.45;
    c.fillRect(x * 32 + 1, y * 32 + 1, 30, 30);
  }
  c.globalAlpha = 1; c.strokeStyle = '#111'; c.lineWidth = 2;
  for (let x = 0; x <= 8; x++) { c.beginPath(); c.moveTo(x * 32, 0); c.lineTo(x * 32, h); c.stroke(); }
  for (let y = 0; y <= 6; y++) { c.beginPath(); c.moveTo(0, y * 32); c.lineTo(w, y * 32); c.stroke(); }
});
// pantalla LED de detrás del DJ, con el eclipse
const ledTex = () => canvasTex('ledDJ', 512, 256, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#1a0638'); gr.addColorStop(1, '#4a0f6b');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#d07bff'; c.lineWidth = 10; c.beginPath(); c.arc(w / 2, h / 2, 80, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#ffe3ff'; c.beginPath(); c.arc(w / 2 + 16, h / 2 - 8, 60, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1a0638'; c.beginPath(); c.arc(w / 2 - 6, h / 2 - 16, 54, 0, Math.PI * 2); c.fill();
  for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(255,255,255,${0.2 + (k % 5) * 0.12})`; c.fillRect((k * 97) % w, (k * 53) % h, 3, 3); }
});
// botellero iluminado
const shelfTex = () => canvasTex('botellas', 512, 128, (c, w, h) => {
  c.fillStyle = '#2a1a10'; c.fillRect(0, 0, w, h);
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,190,110,0.35)'); gr.addColorStop(1, 'rgba(255,190,110,0)');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  let s0 = 4; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let row = 0; row < 3; row++) {
    c.fillStyle = '#c9a26a'; c.fillRect(0, 40 + row * 42, w, 3);
    for (let x = 6; x < w - 10; x += 14 + rnd() * 6) {
      const bh = 22 + rnd() * 14;
      c.fillStyle = ['#2f6b2f', '#7a3b12', '#c9c9c9', '#1f3f7a', '#8a1f2a', '#d8a83a'][Math.floor(rnd() * 6)];
      c.fillRect(x, 40 + row * 42 - bh, 8, bh); c.fillRect(x + 2.5, 40 + row * 42 - bh - 7, 3, 8);
    }
  }
});
const vipTex = () => canvasTex('vipNeon', 256, 128, (c, w, h) => {
  c.clearRect(0, 0, w, h); c.font = 'bold 96px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 10; c.strokeStyle = '#ffcc33'; c.strokeText('VIP', w / 2, h / 2 + 4); c.fillStyle = '#fff6d0'; c.fillText('VIP', w / 2, h / 2 + 4);
});

export function eclipseInterior(H) {
  const g = new THREE.Group(), boxes = [];
  const { x0, x1, z0, z1, h } = H;
  // suelo, techo y forro interior de las paredes
  box(g, FLOOR(), x0 + 0.3, x1 - 0.3, 0, 0.03, z0 + 0.3, z1 - 0.3);
  box(g, CEIL(), x0 + 0.3, x1 - 0.3, h - 0.62, h - 0.6, z0 + 0.3, z1 - 0.3);
  plane(g, WALL(), x1 - x0 - 0.6, h - 0.6, (x0 + x1) / 2, (h - 0.6) / 2, z0 + 0.31);
  plane(g, WALL(), z1 - z0 - 0.6, h - 0.6, x0 + 0.31, (h - 0.6) / 2, (z0 + z1) / 2, Math.PI / 2);
  plane(g, WALL(), z1 - z0 - 0.6, h - 0.6, x1 - 0.31, (h - 0.6) / 2, (z0 + z1) / 2, -Math.PI / 2);
  for (const sx of [-1, 1]) plane(g, WALL(), (x1 - x0) / 2 - 1.6, h - 0.6, sx < 0 ? (x0 + 1 - 1.3) / 2 + 0.2 : (x1 + 1 + 1.3) / 2 - 0.2, (h - 0.6) / 2, z1 - 0.31, Math.PI);
  // tiras de neón a lo largo de las paredes, arriba
  for (const [ax, az, len, ry] of [[(x0 + x1) / 2, z0 + 0.35, x1 - x0 - 0.8, 0], [x0 + 0.35, (z0 + z1) / 2, z1 - z0 - 0.8, Math.PI / 2], [x1 - 0.35, (z0 + z1) / 2, z1 - z0 - 0.8, Math.PI / 2]]) {
    const s = new THREE.Mesh(new THREE.BoxGeometry(len, 0.06, 0.04), neon('#b45cff')); s.position.set(ax, h - 1.1, az); s.rotation.y = ry; g.add(s);
  }

  // --- pista de baile (centro) con suelo de luces y bola de espejos ---
  const pc = { x: (x0 + x1) / 2 - 0.5, z: (z0 + z1) / 2 + 0.6 };
  const pista = new THREE.Mesh(new THREE.BoxGeometry(8, 0.06, 6), mat('ecPista', { map: danceTex(), emissiveMap: danceTex(), emissive: '#ffffff', emissiveIntensity: 0.9, roughness: 0.2, glow: 'sign' }));
  pista.position.set(pc.x, 0.05, pc.z); g.add(pista);
  box(g, METAL(), pc.x - 4.05, pc.x + 4.05, 0, 0.09, pc.z - 3.05, pc.z - 2.95);
  box(g, METAL(), pc.x - 4.05, pc.x + 4.05, 0, 0.09, pc.z + 2.95, pc.z + 3.05);
  cyl(g, METAL(), pc.x, h - 1.4, pc.z, 0.02, 0.02, 1.2, 6);
  const ball = new THREE.Mesh(new THREE.IcosahedronGeometry(0.45, 2), mat('ecBola', { color: '#e8eef5', roughness: 0.08, metalness: 1, flatShading: true }));
  ball.position.set(pc.x, h - 2.15, pc.z); g.add(ball);
  // focos de colores colgados de una cercha sobre la pista
  box(g, METAL(), pc.x - 4.2, pc.x + 4.2, h - 1.0, h - 0.9, pc.z - 3.2, pc.z - 3.1);
  box(g, METAL(), pc.x - 4.2, pc.x + 4.2, h - 1.0, h - 0.9, pc.z + 3.1, pc.z + 3.2);
  ['#ff2d95', '#2d8cff', '#16d0c0', '#ffb02d', '#7b2cff'].forEach((c, k) => {
    for (const zz of [pc.z - 3.15, pc.z + 3.15]) {
      const fx = pc.x - 3.4 + k * 1.7;
      cyl(g, BLACK(), fx, h - 1.25, zz, 0.16, 0.12, 0.35, 12);
      cyl(g, neon(c), fx, h - 1.43, zz, 0.11, 0.11, 0.02, 12);
    }
  });

  // --- cabina del DJ al fondo, con pantalla LED y altavoces ---
  const dz = z0 + 1.6;
  box(g, BLACK(), pc.x - 2.2, pc.x + 2.2, 0, 0.35, dz - 1.1, dz + 0.9);                     // tarima
  box(g, BLACK(), pc.x - 1.6, pc.x + 1.6, 0.35, 1.45, dz + 0.1, dz + 0.8, 0.04);              // mesa
  plane(g, neon('#8a3cff'), 3.0, 0.5, pc.x, 0.95, dz + 0.81);                                  // frontal luminoso
  box(g, mat('ecMesa', { color: '#2b2d33', roughness: 0.4, metalness: 0.4 }), pc.x - 1.4, pc.x + 1.4, 1.45, 1.52, dz + 0.15, dz + 0.75);
  for (const sx of [-0.8, 0.8]) cyl(g, METAL(), pc.x + sx, 1.54, dz + 0.45, 0.2, 0.2, 0.03, 20);  // platos
  plane(g, mat('ecLed', { map: ledTex(), emissiveMap: ledTex(), emissive: '#ffffff', emissiveIntensity: 1.1, roughness: 0.3, glow: 'sign' }), 7, 3.5, pc.x, 3.4, z0 + 0.33);
  for (const sx of [-1, 1]) {
    const ax = pc.x + sx * 4.3;
    for (let k = 0; k < 2; k++) {
      box(g, BLACK(), ax - 0.55, ax + 0.55, k * 1.3, k * 1.3 + 1.25, dz - 0.6, dz + 0.4, 0.05);
      cyl(g, mat('ecCono', { color: '#2b2b2f', roughness: 0.7 }), ax, k * 1.3 + 0.62, dz + 0.41, 0.36, 0.36, 0.04, 20).rotation.x = Math.PI / 2;
    }
  }
  boxes.push([pc.x - 2.2, pc.x + 2.2, dz - 1.1, dz + 0.9, 1.5], [pc.x - 4.9, pc.x - 3.7, dz - 0.6, dz + 0.4, 2.6], [pc.x + 3.7, pc.x + 4.9, dz - 0.6, dz + 0.4, 2.6]);

  // --- barra a lo largo de la pared izquierda, con botellero iluminado y taburetes ---
  const bx = x0 + 2.4, bz0 = z0 + 3.5, bz1 = z1 - 2.2;
  box(g, WOOD(), bx - 0.35, bx + 0.35, 0, 1.08, bz0, bz1, 0.04);
  box(g, mat('ecEncimera', { color: '#e8e4dc', roughness: 0.18, metalness: 0.1 }), bx - 0.5, bx + 0.45, 1.08, 1.14, bz0 - 0.1, bz1 + 0.1, 0.02);
  const strip = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.05, bz1 - bz0), neon('#ffb02d')); strip.position.set(bx + 0.37, 0.15, (bz0 + bz1) / 2); g.add(strip);
  plane(g, mat('ecBotellero', { map: shelfTex(), emissiveMap: shelfTex(), emissive: '#ffffff', emissiveIntensity: 0.6, roughness: 0.5, glow: 'win' }), bz1 - bz0, 1.8, x0 + 0.33, 2.1, (bz0 + bz1) / 2, Math.PI / 2);
  box(g, WOOD(), x0 + 0.3, x0 + 0.9, 0, 1.0, bz0, bz1);                                    // mueble trasero
  for (let k = 0; k < 5; k++) {
    const sz = bz0 + 0.6 + k * ((bz1 - bz0 - 1.2) / 4), sx = bx + 0.95;
    cyl(g, METAL(), sx, 0.38, sz, 0.03, 0.03, 0.75, 8);
    cyl(g, METAL(), sx, 0.02, sz, 0.2, 0.22, 0.04, 14);
    cyl(g, LEATHER(), sx, 0.79, sz, 0.21, 0.19, 0.09, 16);
  }
  for (let k = 0; k < 3; k++) cyl(g, neon('#fff1d6'), bx, h - 1.6, bz0 + 1 + k * (bz1 - bz0 - 2) / 2, 0.18, 0.12, 0.25, 14); // lámparas colgantes
  boxes.push([x0 + 0.3, bx + 0.5, bz0, bz1, 1.2]);

  // --- zona VIP elevada a la derecha: tarima, sofás en U, mesa, cordón y rótulo ---
  const vx0 = x1 - 4.6, vx1 = x1 - 0.4, vz0 = z0 + 3.4, vz1 = z1 - 2.6;
  box(g, mat('ecTarima', { color: '#24202b', roughness: 0.4, metalness: 0.2 }), vx0, vx1, 0, 0.3, vz0, vz1);
  const edge = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.04, vz1 - vz0), neon('#ffcc33')); edge.position.set(vx0 + 0.02, 0.28, (vz0 + vz1) / 2); g.add(edge);
  box(g, LEATHER(), vx1 - 0.9, vx1 - 0.1, 0.3, 0.75, vz0 + 0.3, vz1 - 0.3, 0.12);           // sofá del fondo
  box(g, LEATHER(), vx1 - 0.35, vx1 - 0.1, 0.75, 1.35, vz0 + 0.3, vz1 - 0.3, 0.1);          // respaldo
  for (const zz of [vz0 + 0.3, vz1 - 1.1]) {
    box(g, LEATHER(), vx0 + 0.9, vx1 - 0.9, 0.3, 0.75, zz, zz + 0.8, 0.12);                   // brazos de la U
    box(g, LEATHER(), vx0 + 0.9, vx1 - 0.9, 0.75, 1.3, zz < (vz0 + vz1) / 2 ? zz : zz + 0.55, zz < (vz0 + vz1) / 2 ? zz + 0.25 : zz + 0.8, 0.1);
  }
  box(g, mat('ecMesaVip', { color: '#d9c38a', roughness: 0.25, metalness: 0.7 }), vx0 + 1.5, vx1 - 1.3, 0.3, 0.72, (vz0 + vz1) / 2 - 0.6, (vz0 + vz1) / 2 + 0.6, 0.06);
  for (let k = 0; k < 3; k++) cyl(g, mat('ecCubo', { color: '#c9cfd6', roughness: 0.2, metalness: 0.9 }), vx0 + 1.9 + k * 0.35, 0.86, (vz0 + vz1) / 2 + (k - 1) * 0.3, 0.09, 0.07, 0.28, 12);
  const gold = mat('ecOro', { color: '#c9a54a', roughness: 0.3, metalness: 0.8 });
  for (let k = 0; k < 4; k++) {
    const pz = vz0 + 0.4 + k * ((vz1 - vz0 - 0.8) / 3);
    cyl(g, gold, vx0 - 0.4, 0.5, pz, 0.04, 0.04, 1.0, 10); cyl(g, gold, vx0 - 0.4, 0.03, pz, 0.15, 0.17, 0.05, 14);
    if (k < 3) { const r = cyl(g, mat('ecCordon', { color: '#8e1b1b', roughness: 0.8 }), vx0 - 0.4, 0.85, pz + (vz1 - vz0 - 0.8) / 6, 0.025, 0.025, (vz1 - vz0 - 0.8) / 3, 6); r.rotation.x = Math.PI / 2; }
  }
  plane(g, mat('ecVip', { map: vipTex(), emissiveMap: vipTex(), emissive: '#ffffff', emissiveIntensity: 1.4, transparent: true, alphaTest: 0.3, roughness: 0.4, glow: 'sign' }), 1.8, 0.9, x1 - 0.33, 3.2, (vz0 + vz1) / 2, -Math.PI / 2);
  boxes.push([vx0, vx1, vz0, vz1, 0.3 + 0.05], [vx1 - 0.9, vx1, vz0, vz1, 1.4]);
  // mesas altas junto a la pista
  for (const [mx, mz] of [[pc.x - 5.2, z1 - 2.2], [pc.x + 4.6, z1 - 2.2]]) {
    cyl(g, METAL(), mx, 0.55, mz, 0.04, 0.04, 1.1, 8); cyl(g, METAL(), mx, 0.02, mz, 0.25, 0.25, 0.04, 14);
    cyl(g, mat('ecMesaAlta', { color: '#1d1d22', roughness: 0.25, metalness: 0.4 }), mx, 1.1, mz, 0.38, 0.38, 0.05, 20);
    boxes.push([mx - 0.4, mx + 0.4, mz - 0.4, mz + 0.4, 1.15]);
  }
  return { group: g, boxes, spot: { x: pc.x, z: pc.z } };
}
