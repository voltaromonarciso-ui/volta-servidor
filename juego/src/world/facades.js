// Fachadas de los locales de Rooktown, modeladas a partir de las láminas de locales
// (docs/referencias/01-locales-a.png y 02-locales-b.png): misma forma y detalles que la
// imagen, pero con colores de pared normales (blancos, cremas, piedra, grises, ladrillo).
// Origen en el suelo, frente hacia +z; cada función devuelve { group, boxes } con las cajas
// de colisión [x0, x1, z0, z1, alto] en coordenadas locales.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat } from './buildingkit.js';
import { eclipseInterior } from './eclipseInterior.js';

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
// Con los materiales realistas (pbrMat, userData.tile) las UV se recalculan en metros a partir
// de la posición de cada vértice, para que el ladrillo tenga el mismo tamaño en todo el edificio
function meterUV(geo, ox, oy, oz, tile) {
  const g2 = geo.clone(), P = g2.attributes.position, N = g2.attributes.normal;
  if (!N) g2.computeVertexNormals();
  const uv = new Float32Array(P.count * 2);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + ox, y = P.getY(i) + oy, z = P.getZ(i) + oz;
    const nx = Math.abs(g2.attributes.normal.getX(i)), ny = Math.abs(g2.attributes.normal.getY(i)), nz = Math.abs(g2.attributes.normal.getZ(i));
    if (ny >= nx && ny >= nz) { uv[i * 2] = x / tile; uv[i * 2 + 1] = z / tile; }
    else if (nx >= nz) { uv[i * 2] = z / tile; uv[i * 2 + 1] = y / tile; }
    else { uv[i * 2] = x / tile; uv[i * 2 + 1] = y / tile; }
  }
  g2.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  return g2;
}
function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  if (m.userData?.tile && !rx && !ry && !rz) geo = meterUV(geo, x, y, z, m.userData.tile);
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
//  El Eclipse (discoteca) — inspirado en 02-locales-b, «1. Vista exterior», más espectacular.
//  - Torre del logo con aristas redondeadas, revestida de chapa grafito nervada, con el aro
//    de neón, la luna y el nombre.
//  - Gran «disco de eclipse» de hormigón claro con un portal circular: la entrada se hace
//    atravesando el aro iluminado (la corona del eclipse).
//  - Sala principal con esquinas redondeadas y friso de luz; ala derecha de dos plantas con
//    esquina de cristal curva y terraza VIP con pérgola de madera y plantas.
//  - Escalinata con luz en los peldaños, alfombra roja, postes, maceteros con palmeras, apliques y carteles luminosos.
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
  c.beginPath(); c.arc(w * 0.38, w * 0.44, w * 0.3, 0, Math.PI * 2); c.fill(); // luna creciente
});
// chapa grafito nervada (nervios verticales con brillo)
const ribTex = () => canvasTex('chapaNervada', 128, 128, (c, w) => {
  c.fillStyle = '#34383e'; c.fillRect(0, 0, w, w);
  for (let x = 0; x < w; x += 16) {
    const gr = c.createLinearGradient(x, 0, x + 16, 0);
    gr.addColorStop(0, '#2a2d32'); gr.addColorStop(0.35, '#4a4f56'); gr.addColorStop(0.5, '#565b63'); gr.addColorStop(0.7, '#3a3e44'); gr.addColorStop(1, '#2a2d32');
    c.fillStyle = gr; c.fillRect(x, 0, 16, w);
  }
}, true);
// hormigón visto claro: paneles con juntas, poros y alguna mancha
const concreteTex = () => canvasTex('hormigonClaro', 256, 256, (c, w) => {
  c.fillStyle = '#d8d4cc'; c.fillRect(0, 0, w, w);
  let s0 = 13; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let k = 0; k < 40; k++) { const gr = c.createRadialGradient(rnd() * w, rnd() * w, 2, rnd() * w, rnd() * w, 40 + rnd() * 50); gr.addColorStop(0, `rgba(150,140,128,${0.05 + rnd() * 0.06})`); gr.addColorStop(1, 'rgba(150,140,128,0)'); c.fillStyle = gr; c.fillRect(0, 0, w, w); }
  for (let k = 0; k < 1500; k++) { c.fillStyle = `rgba(80,75,70,${0.08 + rnd() * 0.12})`; c.fillRect(rnd() * w, rnd() * w, 1, 1); }
  c.fillStyle = 'rgba(110,105,98,0.55)'; c.fillRect(0, 0, w, 2); c.fillRect(0, 0, 2, w);
  for (const [x, y] of [[32, 40], [224, 40], [32, 216], [224, 216]]) { c.fillStyle = 'rgba(90,85,80,0.5)'; c.beginPath(); c.arc(x, y, 4, 0, 7); c.fill(); } // berenjenos
}, true);
// lamas de madera para techos y pérgolas
const slatTex = () => canvasTex('lamasMadera', 256, 64, (c, w, h) => {
  c.fillStyle = '#2a1c12'; c.fillRect(0, 0, w, h);
  for (let x = 0; x < w; x += 16) {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#b47a48'); gr.addColorStop(1, '#8f5c33');
    c.fillStyle = gr; c.fillRect(x + 2, 0, 12, h);
    c.strokeStyle = 'rgba(70,40,20,0.3)'; for (let k = 0; k < 4; k++) { c.beginPath(); c.moveTo(x + 3 + k * 3, 0); c.lineTo(x + 4 + k * 3, h); c.stroke(); }
  }
}, true);
// cartel luminoso (caja de luz) con cartel de la sesión
const posterTex = () => canvasTex('posterEclipse', 256, 384, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1b0b33'); gr.addColorStop(1, '#5a1a7a');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = '#ff7bd8'; c.lineWidth = 6; c.beginPath(); c.arc(w / 2, 130, 70, 0, Math.PI * 2); c.stroke();
  c.fillStyle = '#ffd7f4'; c.beginPath(); c.arc(w / 2 + 14, 122, 52, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#1b0b33'; c.beginPath(); c.arc(w / 2 - 8, 116, 46, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.fillText('SÁBADO', w / 2, 270);
  c.fillStyle = '#ffb3ec'; c.font = 'bold 30px sans-serif'; c.fillText('DJ NOCHE', w / 2, 315); c.fillText('23:00', w / 2, 352);
});
// textura con repetición propia (clonada) aplicada a una malla cualquiera
function texMat(tex, rep, o = {}) {
  const t = tex.clone(); t.needsUpdate = true; t.repeat.set(rep[0], rep[1]);
  return new THREE.MeshStandardMaterial({ map: t, roughness: o.r ?? 0.7, metalness: o.m ?? 0, ...(o.side ? { side: o.side } : {}) });
}
// aro (anillo) extruido: disco con agujero, en el plano XY, grosor d hacia +z
function ringGeo(key, R, r, d, seg = 64) {
  return cache('ring' + key, () => {
    const sh = new THREE.Shape(); sh.absarc(0, 0, R, 0, Math.PI * 2, false);
    const hole = new THREE.Path(); hole.absarc(0, 0, r, 0, Math.PI * 2, true); sh.holes.push(hole);
    return new THREE.ExtrudeGeometry(sh, { depth: d, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 2, curveSegments: seg });
  });
}
// placa horizontal con forma en planta (puntos [x, z]) y grosor t, con la cara inferior a y0
function plateGeo(key, pts, t) {
  return cache('plate' + key, () => {
    const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)));
    const e = new THREE.ExtrudeGeometry(sh, { depth: t, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.05, bevelSegments: 2, curveSegments: 24 });
    e.rotateX(-Math.PI / 2);
    return e;
  });
}
// curva en planta (para marquesinas): devuelve puntos de un arco
const arcPts = (cx, cz, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + Math.cos(a) * r, cz + Math.sin(a) * r]; });

export function eclipse() {
  const g = new THREE.Group(), boxes = [];
  // materiales realistas, los mismos que el resto de la ciudad (texturas Poly Haven)
  const graphite = pbrMat('ladrilloOscuro');
  const concrete = pbrMat('hormigon', '#e4e1da');
  const glassM = new THREE.MeshStandardMaterial({ color: '#2c4152', roughness: 0.06, metalness: 0.75, transparent: true, opacity: 0.55, depthWrite: false });
  const frame = mat('#22252a', { r: 0.35, m: 0.7 });
  const white = pbrMat('blanco'); // remates de piedra clara, igual que las cornisas de los locales
  const led = mat('#f4ecff', { e: '#dcc2ff', ei: 1.6, glow: 'sign' });
  const warm = mat('#fff1d8', { e: '#ffd9a0', ei: 1.4, glow: 'win' });

  // --- sala principal: volumen de esquinas redondeadas (x -9..11, z -14..-2, h 7.5) ---
  const H = { x0: -9, x1: 11, z0: -14, z1: -2, h: 7.5 };
  // sala hueca: muros de 0,3 m, cubierta y hueco de entrada en la pared delantera (x 1 ± 1,3)
  const T0 = 0.3, DX = 1, DW = 1.3, DH = 3.3;
  slab(g, graphite, H.x0, H.x1, 0, H.h, H.z0, H.z0 + T0);
  slab(g, graphite, H.x0, H.x0 + T0, 0, H.h, H.z0, H.z1);
  slab(g, graphite, H.x1 - T0, H.x1, 0, H.h, H.z0, H.z1);
  slab(g, graphite, H.x0, DX - DW, 0, H.h, H.z1 - T0, H.z1);
  slab(g, graphite, DX + DW, H.x1, 0, H.h, H.z1 - T0, H.z1);
  slab(g, graphite, DX - DW, DX + DW, DH, H.h, H.z1 - T0, H.z1);
  slab(g, graphite, H.x0, H.x1, H.h - 0.3, H.h, H.z0, H.z1);
  for (const [cx, cz] of [[H.x0, H.z0], [H.x1, H.z0], [H.x0, H.z1], [H.x1, H.z1]]) add(g, cache('esquinaSala', () => new THREE.CylinderGeometry(0.45, 0.45, H.h, 16)), graphite, cx, H.h / 2, cz); // esquinas redondeadas
  const inside = eclipseInterior(H);
  g.add(inside.group);
  add(g, cache('frisoSala', () => new RoundedBoxGeometry(H.x1 - H.x0 + 0.1, 0.12, H.z1 - H.z0 + 0.1, 2, 0.06)), led, (H.x0 + H.x1) / 2, H.h - 0.6, (H.z0 + H.z1) / 2); // friso de luz
  add(g, cache('remateSala', () => new RoundedBoxGeometry(H.x1 - H.x0 + 0.3, 0.3, H.z1 - H.z0 + 0.3, 2, 0.12)), white, (H.x0 + H.x1) / 2, H.h + 0.1, (H.z0 + H.z1) / 2);
  boxes.push([H.x0, H.x1, H.z0, H.z0 + T0, H.h], [H.x0, H.x0 + T0, H.z0, H.z1, H.h], [H.x1 - T0, H.x1, H.z0, H.z1, H.h], [H.x0, DX - DW, H.z1 - T0, H.z1, H.h], [DX + DW, H.x1, H.z1 - T0, H.z1, H.h], ...inside.boxes);

  // --- torre del logo con aristas redondeadas (x -16..-9) ---
  const T = { x0: -16, x1: -9.2, z0: -12, z1: 0.6, h: 13 };
  add(g, cache('torreEclipse', () => new RoundedBoxGeometry(T.x1 - T.x0, T.h, T.z1 - T.z0, 4, 0.6)), pbrMat('ladrilloOscuro'), (T.x0 + T.x1) / 2, T.h / 2, (T.z0 + T.z1) / 2);
  add(g, cache('coronaTorre', () => new RoundedBoxGeometry(T.x1 - T.x0 + 0.4, 0.5, T.z1 - T.z0 + 0.4, 2, 0.2)), white, (T.x0 + T.x1) / 2, T.h + 0.1, (T.z0 + T.z1) / 2);
  for (const x of [T.x0 + 0.25, T.x1 - 0.25]) add(g, cyl(0.06, 0.06, T.h - 1.2, 8), led, x, T.h / 2, T.z1 + 0.02); // aristas de luz
  const tc = (T.x0 + T.x1) / 2;
  add(g, cache('aroEclipse', () => new THREE.TorusGeometry(2.1, 0.13, 12, 64)), mat('#e9c4ff', { e: '#c069ff', ei: 2.2, r: 0.3, glow: 'sign' }), tc, 8.6, T.z1 + 0.25);
  add(g, cache('aroBase', () => new THREE.TorusGeometry(2.1, 0.24, 10, 64)), mat('#1f2226', { r: 0.5, m: 0.5 }), tc, 8.6, T.z1 + 0.1);
  const moon = new THREE.Mesh(new THREE.PlaneGeometry(3.6, 3.6), mat('#ffffff', { map: moonTex(), alphaTest: 0.05, e: '#d48cff', ei: 1.4, glow: 'sign' }));
  moon.position.set(tc, 8.6, T.z1 + 0.14); g.add(moon);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(6.4, 1.2), mat('#ffffff', { map: neonTex(), alphaTest: 0.5, e: '#e8c8ff', ei: 1.6, glow: 'sign' }));
  name.position.set(tc, 5.2, T.z1 + 0.08); g.add(name);
  // cajas de luz con el cartel de la sesión, en la base de la torre
  for (const x of [tc - 1.6, tc + 1.6]) {
    add(g, rbox(1.3, 2.0, 0.18, 0.05), frame, x, 1.7, T.z1 + 0.09);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.8), mat('#ffffff', { map: posterTex(), e: '#ffffff', ei: 0.6, glow: 'win' }));
    p.position.set(x, 1.7, T.z1 + 0.19); g.add(p);
  }
  boxes.push([T.x0, T.x1, T.z0, T.z1, T.h]);

  // --- el disco del eclipse: hormigón claro con portal circular (centro x 1, y 4.6) ---
  const D = { x: 1, y: 3.45, R: 5.4, r: 3.1, z: -2.2, d: 1.4 }; // el hueco del portal llega al suelo
  const disc = add(g, ringGeo('discoEclipse', D.R, D.r, D.d), pbrMat('hormigon', '#ece9e2'), D.x, D.y, D.z);
  disc.scale.set(1, 1, 1);
  add(g, cache('coronaPortal', () => new THREE.TorusGeometry(D.r + 0.05, 0.11, 12, 72)), led, D.x, D.y, D.z + D.d + 0.12);      // corona de luz
  add(g, cache('coronaExterior', () => new THREE.TorusGeometry(D.R + 0.02, 0.06, 8, 96)), mat('#d9b8ff', { e: '#b98cff', ei: 0.9, glow: 'sign' }), D.x, D.y, D.z + D.d + 0.1);
  // el disco se apoya en un zócalo (corta la parte que quedaría bajo el suelo)
  slab(g, mat('#5a5d61', { r: 0.8 }), D.x - 4.4, D.x + 4.4, -0.8, 0.35, D.z - 0.1, D.z + D.d + 0.2);
  // dentro del portal: vestíbulo iluminado con puertas de cristal
  for (const s2 of [-1, 1]) slab(g, frame, D.x + s2 * 1.25 - 0.05, D.x + s2 * 1.25 + 0.05, 0.35, 3.3, D.z + 0.38, D.z + 0.46);
  slab(g, frame, D.x - 1.3, D.x + 1.3, 3.25, 3.35, D.z + 0.38, D.z + 0.46);
  boxes.push([D.x - D.R, D.x - D.r + 0.3, D.z, D.z + D.d, 9], [D.x + D.r - 0.3, D.x + D.R, D.z, D.z + D.d, 9]);

  // --- ala derecha de dos plantas con esquina de cristal curva (x 11..20, z -12..1) ---
  const Wg = { x0: 11, x1: 20, z0: -12, z1: 1, h1: 3.8, h: 7.4, rc: 3 };
  // planta en forma de L con la esquina delantera derecha en cuarto de círculo
  const plan = [[Wg.x0, Wg.z0], [Wg.x1, Wg.z0], [Wg.x1, Wg.z1 - Wg.rc], ...arcPts(Wg.x1 - Wg.rc, Wg.z1 - Wg.rc, Wg.rc, 0, Math.PI / 2, 16), [Wg.x0, Wg.z1]];
  add(g, plateGeo('alaSuelo', plan, 0.25), concrete, 0, 0, 0);
  add(g, plateGeo('alaForjado', plan, 0.35), white, 0, Wg.h1, 0);
  add(g, plateGeo('alaCubierta', plan.map(([x, z]) => [x, Math.min(z, Wg.z1 - 3)]), 0.4), white, 0, Wg.h, 0);
  // planta baja: muro curvo de cristal (tubo abierto) con montantes, sobre el interior cálido
  const curve = cache('alaCurva', () => {
    const cpts = [[Wg.x0, Wg.z1], [Wg.x1 - Wg.rc, Wg.z1], ...arcPts(Wg.x1 - Wg.rc, Wg.z1 - Wg.rc, Wg.rc, Math.PI / 2, 0, 16).slice(1), [Wg.x1, Wg.z0]];
    const shape = new THREE.Shape(); shape.moveTo(0, 0); shape.lineTo(0.06, 0); shape.lineTo(0.06, Wg.h1 - 0.25); shape.lineTo(0, Wg.h1 - 0.25);
    const path = new THREE.CurvePath();
    for (let i = 0; i < cpts.length - 1; i++) path.add(new THREE.LineCurve3(new THREE.Vector3(cpts[i][0], 0, cpts[i][1]), new THREE.Vector3(cpts[i + 1][0], 0, cpts[i + 1][1])));
    return { cpts, path };
  });
  const wallPts = curve.cpts;
  for (let i = 0; i < wallPts.length - 1; i++) {
    const [ax, az] = wallPts[i], [bx, bz] = wallPts[i + 1], len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(-(bz - az), bx - ax);
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    add(g, box(len + 0.02, Wg.h1 - 0.25, 0.05), glassM, mx, 0.25 + (Wg.h1 - 0.25) / 2, mz, 0, ang, 0);
    const inner = add(g, cache('intAla' + i, () => new THREE.PlaneGeometry(len + 0.02, Wg.h1 - 0.4)), mat('#ffffff', { map: interiorTex('eclipseBar', '#f2c79a', '#b0602a'), e: '#ffffff', ei: 0.55, glow: 'win' }), mx + ((bz - az) / len) * 0.6, 0.25 + (Wg.h1 - 0.4) / 2, mz - ((bx - ax) / len) * 0.6, 0, ang, 0);
    inner.userData.noShadow = true;
    add(g, box(0.07, Wg.h1 - 0.25, 0.09), frame, ax, 0.25 + (Wg.h1 - 0.25) / 2, az, 0, ang, 0);
  }
  slab(g, graphite, Wg.x0, Wg.x1 - 0.2, 0.25, Wg.h1, Wg.z0, Wg.z1 - 1.6); // núcleo interior
  // planta alta: volumen retranqueado de hormigón con ventanal corrido y terraza VIP delante
  const up = { z1: Wg.z1 - 3 };
  slab(g, concrete, Wg.x0, Wg.x1, Wg.h1 + 0.35, Wg.h, Wg.z0, up.z1 - 0.6);
  for (let k = 0; k < 3; k++) {
    const cx = Wg.x0 + 1.6 + k * 2.9;
    const w2 = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.3), mat('#ffffff', { map: interiorTex('eclipseVip', '#e9b7ff', '#7a3ccf'), e: '#ffffff', ei: 0.5, glow: 'win' }));
    w2.position.set(cx, Wg.h1 + 1.85, up.z1 - 0.58); g.add(w2);
    frameRing(g, frame, cx, Wg.h1 + 1.85, 2.6, 2.5, up.z1 - 0.62, 0.08, 0.14);
  }
  // barandilla de cristal de la terraza siguiendo la curva, con pasamanos
  for (let i = 0; i < wallPts.length - 1; i++) {
    const [ax, az] = wallPts[i], [bx, bz] = wallPts[i + 1], len = Math.hypot(bx - ax, bz - az), ang = Math.atan2(-(bz - az), bx - ax);
    if (az < up.z1 - 0.1 && bz < up.z1 - 0.1) continue;
    const mx = (ax + bx) / 2, mz = (az + bz) / 2;
    add(g, box(len, 1.0, 0.04), mat('#cfe6f2', { t: 0.3, r: 0.05 }), mx, Wg.h1 + 0.35 + 0.5, mz, 0, ang, 0);
    add(g, box(len + 0.04, 0.06, 0.08), mat('#c9cfd6', { m: 0.8, r: 0.25 }), mx, Wg.h1 + 0.35 + 1.03, mz, 0, ang, 0);
  }
  // pérgola de madera sobre la terraza
  for (const x of [Wg.x0 + 0.4, Wg.x1 - 1.6]) add(g, cyl(0.08, 0.08, 2.8, 10), frame, x, Wg.h1 + 0.35 + 1.4, Wg.z1 - 0.6);
  const perg = add(g, box(Wg.x1 - Wg.x0 - 0.6, 0.12, 3.2), texMat(slatTex(), [4, 1], { r: 0.7 }), (Wg.x0 + Wg.x1) / 2 - 0.5, Wg.h1 + 0.35 + 2.85, Wg.z1 - 1.9);
  perg.userData.noMerge = false;
  // muebles de la terraza: sofás bajos y plantas
  for (const [x, z] of [[Wg.x0 + 1.5, Wg.z1 - 1.0], [Wg.x0 + 4.5, Wg.z1 - 1.0]]) {
    add(g, rbox(1.8, 0.4, 0.8, 0.15), mat('#e9e4dc', { r: 0.9 }), x, Wg.h1 + 0.35 + 0.2, z);
    add(g, rbox(1.8, 0.5, 0.2, 0.08), mat('#e9e4dc', { r: 0.9 }), x, Wg.h1 + 0.35 + 0.5, z - 0.35);
  }
  boxes.push([Wg.x0, Wg.x1, Wg.z0, Wg.z1, Wg.h]);

  // --- escalinata con luz en los peldaños, alfombra roja, postes y cordón ---
  for (let k = 0; k < 3; k++) {
    const z0 = D.z + D.d + 0.2 + k * 0.45, y = 0.35 - k * 0.12;
    slab(g, concrete, D.x - 3.2, D.x + 3.2, 0, y, z0, z0 + 0.45);
    slab(g, warm, D.x - 3.1, D.x + 3.1, y - 0.04, y - 0.01, z0 + 0.44, z0 + 0.46);
  }
  slab(g, mat('#8e1b1b', { r: 0.9 }), D.x - 1.0, D.x + 1.0, 0.36, 0.38, D.z + D.d + 0.2, D.z + D.d + 0.55);
  slab(g, mat('#8e1b1b', { r: 0.9 }), D.x - 1.0, D.x + 1.0, 0.01, 0.04, D.z + D.d + 1.5, D.z + D.d + 5);
  const gold = mat('#c9a54a', { r: 0.3, m: 0.8 });
  for (const s2 of [-1, 1]) for (let k = 0; k < 3; k++) {
    const px = D.x + s2 * 1.4, pz = D.z + D.d + 2 + k * 1.2;
    add(g, cyl(0.05, 0.05, 1.0, 10), gold, px, 0.5, pz); add(g, cyl(0.16, 0.18, 0.05, 14), gold, px, 0.03, pz);
    add(g, cache('bolaPoste', () => new THREE.SphereGeometry(0.07, 10, 8)), gold, px, 1.03, pz);
    if (k < 2) add(g, cyl(0.025, 0.025, 1.2, 6), mat('#8e1b1b', { r: 0.8 }), px, 0.85, pz + 0.6, Math.PI / 2);
  }
  // apliques de pared a los lados del disco (luz hacia arriba y abajo)
  for (const x of [D.x - 4.6, D.x + 4.6]) {
    add(g, rbox(0.25, 0.5, 0.2, 0.05), frame, x, 2.6, D.z + D.d + 0.12);
    add(g, cyl(0.1, 0.1, 0.02, 10), warm, x, 2.34, D.z + D.d + 0.12);
    add(g, cyl(0.1, 0.1, 0.02, 10), warm, x, 2.86, D.z + D.d + 0.12);
  }
  // cubierta: máquinas y caseta
  add(g, rbox(2.4, 1.2, 1.8, 0.1), mat('#a7adb3', { r: 0.4, m: 0.5 }), 3, H.h + 0.85, -10);
  add(g, rbox(1.6, 0.9, 1.3, 0.1), mat('#a7adb3', { r: 0.4, m: 0.5 }), 7, H.h + 0.7, -11);

  return { group: g, boxes, door: { x: D.x, z: D.z + D.d + 1.4 }, planters: [[-18, 1.5], [9.2, 3.2]] };
}

export const FACADES = { eclipse };
