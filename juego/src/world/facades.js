// Fachadas de los locales de Rooktown, modeladas a partir de las láminas de locales
// (docs/referencias/01-locales-a.png y 02-locales-b.png): misma forma y detalles que la
// imagen, pero con colores de pared normales (blancos, cremas, piedra, grises, ladrillo).
// Origen en el suelo, frente hacia +z; cada función devuelve { group, boxes } con las cajas
// de colisión [x0, x1, z0, z1, alto] en coordenadas locales.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const mats = new Map();
function mat(color, o = {}) {
  const k = color + JSON.stringify({ ...o, map: o.map?.uuid });
  if (!mats.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.7, metalness: o.m ?? 0, ...(o.e ? { emissive: o.e, emissiveIntensity: o.ei ?? 1 } : {}), ...(o.t ? { transparent: true, opacity: o.t, depthWrite: false } : {}), ...(o.map ? { map: o.map } : {}), ...(o.map && o.e ? { emissiveMap: o.map } : {}), ...(o.alphaTest ? { alphaTest: o.alphaTest } : {}) });
    if (o.glow) m.userData.glow = o.glow; // se enciende de noche (sky.js)
    mats.set(k, m);
  }
  return mats.get(k);
}
const geos = new Map();
const cache = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
const box = (w, h, d) => cache(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const rbox = (w, h, d, r) => cache(`r${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 1, Math.min(r, w / 2, h / 2, d / 2) * 0.999));
const cyl = (rt, rb, h, s = 12) => cache(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz);
  g.add(o);
  return o;
}
// caja apoyada en el suelo por su base (más cómodo para muros): x0..x1, y0..y1, z0..z1
function slab(g, m, x0, x1, y0, y1, z0, z1) { return add(g, box(x1 - x0, y1 - y0, z1 - z0), m, (x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); }
const texs = new Map();
function canvasTex(key, w, h, draw, repeat) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
    texs.set(key, t);
  }
  return texs.get(key);
}
// plano con textura propia (el repetido depende del tamaño, así que cada uso clona la textura)
function texPlane(g, tex, w, h, rep, m, x, y, z, ry = 0) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]);
  const geo = new THREE.PlaneGeometry(w, h);
  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: m.r ?? 0.8, metalness: m.m ?? 0 }));
  mesh.position.set(x, y, z); mesh.rotation.y = ry; g.add(mesh);
  return mesh;
}

// Marco de ventana hueco (cuatro piezas) centrado en (cx, cy), en el plano z
function frameRing(g, m, cx, cy, w, h, z, t = 0.14, d = 0.2) {
  slab(g, m, cx - w / 2, cx + w / 2, cy + h / 2 - t, cy + h / 2, z, z + d);
  slab(g, m, cx - w / 2, cx + w / 2, cy - h / 2, cy - h / 2 + t, z, z + d);
  slab(g, m, cx - w / 2, cx - w / 2 + t, cy - h / 2, cy + h / 2, z, z + d);
  slab(g, m, cx + w / 2 - t, cx + w / 2, cy - h / 2, cy + h / 2, z, z + d);
}

// ---------- texturas comunes ----------
// Paneles de fachada ventilada (juntas finas en cuadrícula)
const panelTex = (base, joint) => canvasTex('panel' + base, 256, 256, (c, w) => {
  c.fillStyle = base; c.fillRect(0, 0, w, w);
  let s0 = 3; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let k = 0; k < 900; k++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},0.025)`; c.fillRect(rnd() * w, rnd() * w, 2, 2); }
  c.fillStyle = joint; c.fillRect(0, 0, w, 3); c.fillRect(0, 0, 3, w); c.fillRect(0, w / 2, w, 2);
}, true);
// Enfoscado (revoco) liso con leve textura
const renderTex = (base) => canvasTex('revoco' + base, 256, 256, (c, w) => {
  c.fillStyle = base; c.fillRect(0, 0, w, w);
  let s0 = 7; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let k = 0; k < 2500; k++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '60,55,50' : '255,255,255'},${0.03 + rnd() * 0.03})`; c.fillRect(rnd() * w, rnd() * w, 1 + rnd() * 2, 1 + rnd() * 2); }
}, true);
// Interior iluminado visto a través del cristal: suelo, fondo cálido, siluetas de mobiliario
const interiorTex = (key, glow, accent) => canvasTex('int' + key, 256, 128, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, glow); gr.addColorStop(1, '#3a2a22');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,240,210,0.55)'; for (let k = 0; k < 5; k++) c.fillRect(20 + k * 48, 6, 22, 5); // luminarias del techo
  c.fillStyle = accent; c.fillRect(0, h * 0.62, w, 4);
  c.fillStyle = 'rgba(30,20,20,0.55)';
  for (let k = 0; k < 6; k++) { const x = 14 + k * 42; c.fillRect(x, h * 0.66, 26, h * 0.34); c.fillRect(x + 4, h * 0.5, 18, h * 0.16); }
});

// ==================================================================
//  El Eclipse (discoteca) — 02-locales-b, «1. Vista exterior»
//  Torre lisa a la izquierda con el logo de neón (luna en un aro) y el nombre; cuerpo de
//  dos plantas con planta baja acristalada, marquesina corrida y ventanales arriba; anexo
//  bajo a la derecha. Colores: antracita y gris claro (en la lámina es azul/morado).
// ==================================================================
const neonTex = () => canvasTex('neonEclipse2', 1024, 192, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.font = 'bold 150px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.lineWidth = 14; c.strokeStyle = '#b45cff'; c.strokeText('EL ECLIPSE', w / 2, h / 2 + 6);
  c.fillStyle = '#f7efff'; c.fillText('EL ECLIPSE', w / 2, h / 2 + 6);
});
const moonTex = () => canvasTex('lunaEclipse', 256, 256, (c, w) => {
  c.clearRect(0, 0, w, w);
  const gr = c.createRadialGradient(w * 0.55, w * 0.45, 10, w / 2, w / 2, w * 0.42);
  gr.addColorStop(0, '#ffe6ff'); gr.addColorStop(0.6, '#d48cff'); gr.addColorStop(1, 'rgba(120,40,200,0)');
  c.fillStyle = gr; c.beginPath(); c.arc(w / 2, w / 2, w * 0.4, 0, Math.PI * 2); c.fill();
  c.globalCompositeOperation = 'destination-out';
  c.beginPath(); c.arc(w * 0.38, w * 0.44, w * 0.3, 0, Math.PI * 2); c.fill(); // mordida: luna creciente
});

export function eclipse() {
  const g = new THREE.Group(), boxes = [];
  const anth = { r: 0.6, m: 0.15 }, light = { r: 0.85 };
  const anthT = panelTex('#3b3f45', '#2c2f34'), lightT = renderTex('#d9d6d0');
  const frame = mat('#24272b', { r: 0.4, m: 0.6 }), glass = mat('#9fb7c9', { t: 0.35, r: 0.05, m: 0.3 });
  const coping = mat('#c9c6c0', { r: 0.6 }), plinth = mat('#5a5d61', { r: 0.8 });

  // --- torre del logo (x -15..-7) ---
  const T = { x0: -15, x1: -7, z0: -9, z1: 1.2, h: 11.5 };
  slab(g, mat('#3b3f45', anth), T.x0, T.x1, 0, T.h, T.z0, T.z1 - 0.02);
  texPlane(g, anthT, T.x1 - T.x0, T.h, [3, 4], anth, (T.x0 + T.x1) / 2, T.h / 2, T.z1, 0);           // frente con juntas
  texPlane(g, anthT, T.z1 - T.z0, T.h, [4, 4], anth, T.x0 - 0.01, T.h / 2, (T.z0 + T.z1) / 2, -Math.PI / 2);
  slab(g, coping, T.x0 - 0.1, T.x1 + 0.1, T.h, T.h + 0.18, T.z0 - 0.1, T.z1 + 0.1);
  // aro de neón y luna
  const ring = mat('#e9c4ff', { e: '#c069ff', ei: 2.2, r: 0.3, glow: 'sign' });
  add(g, cache('aroEclipse', () => new THREE.TorusGeometry(2.0, 0.13, 10, 48)), ring, -11, 7.4, T.z1 + 0.18);
  add(g, cache('aroBase', () => new THREE.TorusGeometry(2.0, 0.2, 8, 48)), mat('#1f2226', { r: 0.5 }), -11, 7.4, T.z1 + 0.06);
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 3.4), mat('#ffffff', { map: moonTex(), alphaTest: 0.05, e: '#d48cff', ei: 1.4, glow: 'sign' }));
  moon.position.set(-11, 7.4, T.z1 + 0.1); g.add(moon);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(7.2, 1.8), mat('#ffffff', { map: neonTex(), alphaTest: 0.5, e: '#e8c8ff', ei: 1.6, glow: 'sign' }));
  name.position.set(-11, 3.9, T.z1 + 0.06); g.add(name);
  const strip = mat('#efe2ff', { e: '#d9b8ff', ei: 1.3, glow: 'sign' });
  for (const x of [T.x0 + 0.05, T.x1 - 0.05]) slab(g, strip, x - 0.05, x + 0.05, 0.4, T.h - 0.2, T.z1, T.z1 + 0.05);
  boxes.push([T.x0, T.x1, T.z0, T.z1, T.h]);

  // --- cuerpo principal de dos plantas (x -7..13) ---
  // planta baja acristalada y retranqueada; la planta alta vuela 1,2 m y hace de marquesina
  const M = { x0: -7, x1: 13, z0: -9, z1: 0, h1: 4.4, h: 8.6, fly: 1.2 };
  const dark = mat('#3b3f45', anth);
  slab(g, dark, M.x0, M.x1, 0, M.h1, M.z0, M.z1 - 0.9);                                    // fondo de la planta baja
  texPlane(g, anthT, M.z1 - M.z0, M.h, [4, 3], anth, M.x1 + 0.01, M.h / 2, (M.z0 + M.z1) / 2, Math.PI / 2); // costado
  slab(g, plinth, M.x0, M.x1, 0, 0.3, M.z1 - 0.3, M.z1 - 0.1);
  const glowInt = new THREE.Mesh(new THREE.PlaneGeometry(M.x1 - M.x0 - 0.4, M.h1 - 0.5), mat('#ffffff', { map: interiorTex('eclipse', '#c99ae8', '#7a3ccf'), e: '#ffffff', ei: 0.6, glow: 'win' }));
  glowInt.position.set((M.x0 + M.x1) / 2, M.h1 / 2, M.z1 - 0.88); g.add(glowInt);
  const dglass = mat('#3d5566', { t: 0.3, r: 0.05, m: 0.4 });
  slab(g, dglass, M.x0 + 0.1, M.x1 - 0.1, 0.3, M.h1, M.z1 - 0.22, M.z1 - 0.2);
  for (let x = M.x0 + 0.1; x <= M.x1 - 0.05; x += 2.5) slab(g, frame, x - 0.05, x + 0.05, 0.3, M.h1, M.z1 - 0.26, M.z1 - 0.14);
  slab(g, frame, M.x0, M.x1, 2.9, 3.0, M.z1 - 0.26, M.z1 - 0.14);                          // travesaño de los cristales
  // puerta doble con tiradores; alfombra roja con postes y cordón (es una discoteca)
  const dx = 4.6, dz = M.z1 - 0.14;
  slab(g, frame, dx - 1.35, dx + 1.35, 0.3, 3.0, dz - 0.04, dz + 0.04);
  slab(g, mat('#15171a', { r: 0.2, m: 0.3 }), dx - 1.2, dx + 1.2, 0.32, 2.88, dz + 0.04, dz + 0.06);
  for (const s2 of [-1, 1]) slab(g, mat('#c9cfd6', { m: 0.8, r: 0.25 }), dx + s2 * 0.18 - 0.03, dx + s2 * 0.18 + 0.03, 1.0, 2.2, dz + 0.06, dz + 0.1);
  slab(g, mat('#8e1b1b', { r: 0.9 }), dx - 1.1, dx + 1.1, 0.01, 0.04, dz, M.z1 + 3.4);
  const gold = mat('#c9a54a', { r: 0.3, m: 0.8 });
  for (const s2 of [-1, 1]) for (let k = 0; k < 3; k++) {
    const px = dx + s2 * 1.5, pz = M.z1 + 0.6 + k * 1.3;
    add(g, cyl(0.05, 0.05, 1.0, 10), gold, px, 0.5, pz); add(g, cyl(0.16, 0.18, 0.05, 14), gold, px, 0.03, pz);
    add(g, cache('bolaPoste', () => new THREE.SphereGeometry(0.07, 10, 8)), gold, px, 1.03, pz);
    if (k < 2) add(g, cyl(0.025, 0.025, 1.3, 6), mat('#8e1b1b', { r: 0.8 }), px, 0.85, pz + 0.65, Math.PI / 2);
  }
  // planta alta en voladizo: banda oscura abajo (con focos), paño claro con ventanales, banda oscura arriba
  const zf = M.z1 + M.fly;
  slab(g, dark, M.x0, M.x1, M.h1, M.h1 + 0.7, M.z0, zf);                                   // canto inferior / techo de la entrada
  slab(g, dark, M.x0, M.x1, M.h - 0.6, M.h, M.z0, zf + 0.05);                               // banda superior
  slab(g, mat('#3b3f45', anth), M.x0, M.x1, M.h1 + 0.7, M.h - 0.6, M.z0, zf - 0.3);        // macizo
  texPlane(g, lightT, M.x1 - M.x0, M.h - M.h1 - 1.3, [5, 1], light, (M.x0 + M.x1) / 2, (M.h + M.h1 + 0.1) / 2, zf - 0.29, 0);
  const down = mat('#fff3dc', { e: '#ffe6b8', ei: 1.5, glow: 'win' });
  for (let x = M.x0 + 1; x < M.x1; x += 2) add(g, cyl(0.12, 0.12, 0.03, 12), down, x, M.h1 - 0.01, zf - 0.5);
  for (let k = 0; k < 4; k++) {
    const cx = M.x0 + 2.5 + k * 5, cy = (M.h + M.h1 + 0.1) / 2, ww = 3.6, wh = M.h - M.h1 - 2.0;
    const win = new THREE.Mesh(new THREE.PlaneGeometry(ww - 0.2, wh - 0.2), mat('#ffffff', { map: interiorTex('eclipseAlta', '#e8c9a8', '#6b4a3a'), e: '#ffffff', ei: 0.45, glow: 'win' }));
    win.position.set(cx, cy, zf - 0.27); g.add(win);
    slab(g, mat('#a9c1d1', { t: 0.22, r: 0.05, m: 0.3 }), cx - ww / 2, cx + ww / 2, cy - wh / 2, cy + wh / 2, zf - 0.22, zf - 0.21);
    frameRing(g, mat('#2f3338', { r: 0.4, m: 0.6 }), cx, cy, ww + 0.2, wh + 0.2, zf - 0.32, 0.1, 0.18);
    slab(g, frame, cx - 0.03, cx + 0.03, cy - wh / 2, cy + wh / 2, zf - 0.25, zf - 0.19);   // montante
    slab(g, coping, cx - ww / 2 - 0.2, cx + ww / 2 + 0.2, cy - wh / 2 - 0.22, cy - wh / 2 - 0.12, zf - 0.3, zf - 0.05); // vierteaguas
    if (k < 3) slab(g, dark, cx + 2.42, cx + 2.58, M.h1 + 0.7, M.h - 0.6, zf - 0.3, zf + 0.15); // lama vertical
  }
  slab(g, coping, M.x0 - 0.05, M.x1 + 0.05, M.h, M.h + 0.45, M.z0 - 0.05, zf + 0.1);         // peto
  slab(g, mat('#e3e0da', { r: 0.6 }), M.x0 - 0.1, M.x1 + 0.1, M.h + 0.45, M.h + 0.55, M.z0 - 0.1, zf + 0.15);
  boxes.push([M.x0, M.x1, M.z0, M.z1 - 0.1, M.h]);

  // --- anexo bajo a la derecha (x 13..19): piedra clara, ventana y puerta de servicio ---
  const A = { x0: 13, x1: 19, z0: -8, z1: -0.6, h: 4.6 };
  slab(g, mat('#cfc8bb', { r: 0.9 }), A.x0, A.x1, 0, A.h, A.z0, A.z1);
  for (let y = 0.6; y < A.h; y += 0.6) slab(g, mat('#bdb5a7', { r: 0.9 }), A.x0, A.x1 + 0.01, y, y + 0.03, A.z1, A.z1 + 0.01); // hiladas
  slab(g, frame, A.x0 + 0.8, A.x0 + 3.4, 1.4, 3.2, A.z1, A.z1 + 0.08);
  const w2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 1.6), mat('#ffffff', { map: interiorTex('eclipseAnexo', '#f2d7a8', '#7a5a3a'), e: '#ffffff', ei: 0.35, glow: 'win' }));
  w2.position.set(A.x0 + 2.1, 2.3, A.z1 + 0.09); g.add(w2);
  slab(g, mat('#4a4f55', { r: 0.5, m: 0.5 }), A.x1 - 2.0, A.x1 - 0.8, 0, 2.3, A.z1, A.z1 + 0.06);                // puerta de servicio
  slab(g, coping, A.x0, A.x1 + 0.08, A.h, A.h + 0.25, A.z0, A.z1 + 0.08);
  add(g, rbox(0.9, 0.6, 0.5, 0.05), mat('#9aa1a9', { r: 0.4, m: 0.5 }), A.x1 - 1.4, 3.6, A.z1 + 0.3);           // aire acondicionado
  boxes.push([A.x0, A.x1, A.z0, A.z1, A.h]);

  // --- cubierta: máquinas, caseta de escalera y antena ---
  add(g, rbox(2.2, 1.2, 1.6, 0.06), mat('#a7adb3', { r: 0.4, m: 0.5 }), 2, M.h + 0.55 + 0.6, -5);
  add(g, rbox(1.4, 0.9, 1.2, 0.06), mat('#a7adb3', { r: 0.4, m: 0.5 }), 8, M.h + 0.6 + 0.45, -6);
  slab(g, mat('#c9c6c0', { r: 0.7 }), -5, -2, M.h + 0.6, M.h + 2.8, -8, -5.5);
  add(g, cyl(0.03, 0.03, 2.5, 6), frame, 10, M.h + 1.85, -7.5);

  // --- palmera y jardinera junto a la entrada (como en la lámina) se ponen desde la isla ---
  return { group: g, boxes, door: { x: dx, z: M.z1 + 0.8 } };
}

export const FACADES = { eclipse };
