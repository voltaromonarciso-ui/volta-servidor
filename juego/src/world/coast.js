// Costa de Rooktown: piezas del puerto, el muelle de carga, el faro y la playa.
// Mismo criterio que streetkit.js / vegetation.js: cada función devuelve un THREE.Group con
// medidas reales (metros, origen en el suelo, frente hacia +z) y materiales compartidos, y el
// colocador (streetfurniture.js) las funde por sector y material.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const texs = new Map(), mats = new Map(), geos = new Map();
const once = (m, k, f) => { if (!m.has(k)) m.set(k, f()); return m.get(k); };
const rng = (seed) => { let s = (seed * 9301 + 49297) % 233280; return () => { s = (s * 9301 + 49297) % 233280; return s / 233280; }; };
function canvasTex(key, w, h, draw, rep = true) {
  return once(texs, key, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (rep) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
const mat = (key, o) => once(mats, key, () => new THREE.MeshStandardMaterial({ roughness: 0.8, ...o }));
function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz);
  o.castShadow = true; o.receiveShadow = true; g.add(o);
  return o;
}
const BOX = new THREE.BoxGeometry(1, 1, 1);
const cyl = (rt, rb, h, s = 12) => once(geos, `c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
// caja con UV en metros (para que las texturas no se estiren)
function boxM(w, h, d, k = 1) {
  return once(geos, `bm${w},${h},${d},${k}`, () => {
    const g = new THREE.BoxGeometry(w, h, d), P = g.attributes.position, N = g.attributes.normal, uv = g.attributes.uv;
    for (let i = 0; i < P.count; i++) {
      const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i));
      const [a, b] = nx > 0.5 ? [P.getZ(i), P.getY(i)] : ny > 0.5 ? [P.getX(i), P.getZ(i)] : [P.getX(i), P.getY(i)];
      uv.setXY(i, a / k, b / k);
    }
    return g;
  });
}

// Mapa de normales a partir de un dibujo en grises (relieve barato: el bumpMap cuesta mucho
// más en móviles y en WebGL por software)
function normalFromHeight(key, w, h, draw, strength = 2) {
  return once(texs, key, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'); draw(g, w, h);
    const src = g.getImageData(0, 0, w, h).data, out = g.createImageData(w, h);
    const at = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (at(x + 1, y) - at(x - 1, y)) * strength, dy = (at(x, y + 1) - at(x, y - 1)) * strength;
      const l = Math.hypot(dx, dy, 1), i = (y * w + x) * 4;
      out.data[i] = (-dx / l * 0.5 + 0.5) * 255; out.data[i + 1] = (dy / l * 0.5 + 0.5) * 255; out.data[i + 2] = (1 / l * 0.5 + 0.5) * 255; out.data[i + 3] = 255;
    }
    g.putImageData(out, 0, 0);
    const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping;
    return t;
  });
}
// ---------- texturas ----------
const planksTex = () => canvasTex('co-tablas', 256, 256, (c, w) => {
  const rnd = rng(3);
  for (let k = 0; k < 8; k++) {
    c.fillStyle = `hsl(${26 + rnd() * 8},${30 + rnd() * 12}%,${34 + rnd() * 12}%)`; c.fillRect(0, k * 32, w, 32);
    c.fillStyle = 'rgba(40,24,14,0.7)'; c.fillRect(0, k * 32, w, 2.5);
    c.globalAlpha = 0.18; c.strokeStyle = '#3a2414';
    for (let j = 0; j < 7; j++) { const y = k * 32 + 4 + rnd() * 26; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(80, y + 2, 170, y - 2, w, y + 1); c.stroke(); }
    c.globalAlpha = 1; c.fillStyle = '#2a2420';
    const o = rnd() * 120; for (const x of [o, o + 128]) { c.beginPath(); c.arc(x % w, k * 32 + 9, 1.8, 0, 7); c.arc(x % w, k * 32 + 23, 1.8, 0, 7); c.fill(); }
  }
});
// chapa ondulada del contenedor, en gris claro (se tiñe con el color del material)
const ribTex = () => canvasTex('co-chapa', 128, 128, (c, w) => {
  for (let x = 0; x < w; x += 16) {
    const g = c.createLinearGradient(x, 0, x + 16, 0);
    g.addColorStop(0, '#9a9a9a'); g.addColorStop(0.3, '#f2f2f2'); g.addColorStop(0.55, '#d0d0d0'); g.addColorStop(0.8, '#7c7c7c'); g.addColorStop(1, '#9a9a9a');
    c.fillStyle = g; c.fillRect(x, 0, 16, w);
  }
  const rnd = rng(9); c.globalAlpha = 0.25;
  for (let k = 0; k < 40; k++) { c.fillStyle = rnd() < 0.5 ? '#6b4a2a' : '#555'; c.fillRect(rnd() * w, rnd() * w, 2 + rnd() * 6, 4 + rnd() * 16); }
});
// Arena: grano fino de varios tonos y ondas que deja el viento; el mismo dibujo en grises da
// el relieve (mapa de normales) para que no parezca una lámina lisa
function drawSand(c, w, relief) {
  const rnd = rng(13);
  c.fillStyle = relief ? '#808080' : '#e2cc98'; c.fillRect(0, 0, w, w);
  for (let k = 0; k < 9000; k++) {
    const l = relief ? 100 + rnd() * 80 : 0;
    c.fillStyle = relief ? `rgb(${l},${l},${l})` : `hsl(${36 + rnd() * 10},${34 + rnd() * 22}%,${58 + rnd() * 30}%)`;
    c.fillRect(rnd() * w, rnd() * w, 1.5, 1.5);
  }
  // ondas: crestas claras con su sombra justo debajo
  for (let k = 0; k < 14; k++) {
    const y = (k / 14) * w + rnd() * 8, amp = 4 + rnd() * 5, ph = rnd() * 6;
    for (const [dy, col, lw] of [[2.5, relief ? '#303030' : 'rgba(160,128,80,0.45)', 3], [0, relief ? '#f0f0f0' : 'rgba(255,244,214,0.6)', 2.5]]) {
      c.strokeStyle = col; c.lineWidth = lw; c.beginPath();
      for (let x = 0; x <= w; x += 8) { const yy = y + dy + Math.sin((x / w) * Math.PI * 4 + ph) * amp; x ? c.lineTo(x, yy) : c.moveTo(x, yy); }
      c.stroke();
    }
  }
}
const sandTex = () => canvasTex('co-arena2', 256, 256, (c, w) => drawSand(c, w, false));
const sandNormal = () => normalFromHeight('co-arena2-n', 256, 256, (c, w) => drawSand(c, w, true), 2);
const stripeTex = (a, b) => canvasTex('co-raya' + a + b, 64, 8, (c) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? a : b; c.fillRect(k * 8, 0, 8, 8); } });
const thatchTex = () => canvasTex('co-paja', 128, 128, (c, w) => {
  c.fillStyle = '#b08a4a'; c.fillRect(0, 0, w, w);
  const rnd = rng(17);
  for (let k = 0; k < 900; k++) { c.strokeStyle = `hsl(${36 + rnd() * 10},${40 + rnd() * 20}%,${30 + rnd() * 30}%)`; const x = rnd() * w, y = rnd() * w; c.beginPath(); c.moveTo(x, y); c.lineTo(x + (rnd() - 0.5) * 4, y + 10 + rnd() * 14); c.stroke(); }
});
const rockMat = () => mat('roca', { color: '#ffffff', vertexColors: true, roughness: 0.95, flatShading: true });

export const COAST_MAT = {
  wood: () => mat('madera', { map: planksTex(), roughness: 0.88 }),
  pile: () => mat('pilote', { color: '#5a4632', roughness: 0.95 }),
  concrete: () => mat('hormigon', { color: '#b9b3a8', roughness: 0.95 }),
  sand: () => mat('arena', { map: sandTex(), normalMap: sandNormal(), normalScale: new THREE.Vector2(1, 1), roughness: 1 }),
};
export { sandTex };

// ---------- puerto ----------
// Pantalán de madera de len × w metros: tablas, vigas de borde, pilotes cada 3 m y norays
export function pantalan(len = 30, w = 4) {
  const g = new THREE.Group(), wood = COAST_MAT.wood(), pile = COAST_MAT.pile();
  add(g, boxM(w, 0.22, len, 2.4), wood, 0, 0.0, len / 2);
  for (const s of [-1, 1]) add(g, BOX, mat('viga', { color: '#4a3826', roughness: 0.95 }), s * (w / 2 - 0.1), -0.22, len / 2, 0, 0, 0, 0.22, 0.26, len);
  for (let z = 0.6; z <= len; z += 3) for (const s of [-1, 1]) add(g, cyl(0.17, 0.19, 2.6, 8), pile, s * (w / 2 + 0.05), -0.95, z);
  const iron = mat('hierro', { color: '#2b2e33', roughness: 0.5, metalness: 0.6 });
  for (let z = 4; z < len; z += 8) for (const s of [-1, 1]) { add(g, cyl(0.1, 0.13, 0.36, 10), iron, s * (w / 2 - 0.3), 0.29, z); add(g, cyl(0.15, 0.15, 0.06, 10), iron, s * (w / 2 - 0.3), 0.48, z); }
  return g;
}

// Contenedor marítimo de 6 m (o 12 m) con chapa ondulada, marco y puertas con barras
export function contenedor(color = '#c0392b', long = false) {
  const L = long ? 12 : 6, g = new THREE.Group();
  const side = once(mats, 'cont' + color, () => new THREE.MeshStandardMaterial({ map: ribTex(), color, roughness: 0.6, metalness: 0.25 }));
  const frame = once(mats, 'contF' + color, () => new THREE.MeshStandardMaterial({ color: new THREE.Color(color).multiplyScalar(0.6), roughness: 0.55, metalness: 0.3 }));
  add(g, boxM(L - 0.1, 2.5, 2.38, 2.2), side, 0, 1.3, 0);
  for (const [x, z] of [[-1, -1], [-1, 1], [1, -1], [1, 1]]) add(g, BOX, frame, x * (L / 2 - 0.08), 1.3, z * 1.19, 0, 0, 0, 0.16, 2.6, 0.16);
  for (const y of [0.06, 2.55]) for (const z of [-1, 1]) add(g, BOX, frame, 0, y, z * 1.19, 0, 0, 0, L, 0.12, 0.14);
  // puertas (lado +x): dos hojas con cuatro barras de cierre
  const bar = mat('barraCont', { color: '#b9bec4', roughness: 0.4, metalness: 0.7 });
  add(g, BOX, frame, L / 2 - 0.02, 1.3, 0, 0, 0, 0, 0.04, 2.4, 2.3);
  for (const z of [-0.85, -0.3, 0.3, 0.85]) add(g, cyl(0.025, 0.025, 2.3, 6), bar, L / 2 + 0.03, 1.3, z);
  return g;
}

// Grúa pórtico del puerto: cuatro patas, viga larga, carro y cabina (amarilla)
export function gruaPortico() {
  const g = new THREE.Group(), y = mat('gruaAm', { color: '#e8b923', roughness: 0.5, metalness: 0.4 }), d = mat('gruaOs', { color: '#3a3d42', roughness: 0.5, metalness: 0.5 });
  for (const x of [-4, 4]) for (const z of [-3, 3]) { add(g, BOX, y, x, 8, z, 0, 0, 0, 0.7, 16, 0.7); add(g, BOX, d, x, 0.3, z, 0, 0, 0, 1.2, 0.6, 1.6); }
  for (const z of [-3, 3]) add(g, BOX, y, 0, 15.6, z, 0, 0, 0, 9, 0.8, 0.8);
  for (const x of [-4, 4]) { add(g, BOX, y, x, 9, 0, 0, 0, 0, 0.5, 0.5, 6); add(g, BOX, y, x, 9, 0, Math.atan2(6, 6), 0, 0, 0.3, 0.3, 8.6); }
  add(g, BOX, y, 0, 16.4, -4, 0, 0, 0, 1.8, 1.4, 22);
  add(g, BOX, d, 0, 15.4, -10, 0, 0, 0, 2.2, 1.2, 2.4); // carro
  add(g, BOX, mat('gruaCab', { color: '#f2f2f2', roughness: 0.4 }), 1.6, 14.4, -1, 0, 0, 0, 2.2, 2, 2.2);
  add(g, BOX, mat('gruaVid', { color: '#2a3a48', roughness: 0.1, metalness: 0.5 }), 1.6, 14.5, 0.12, 0, 0, 0, 1.9, 1.2, 0.05);
  add(g, cyl(0.03, 0.03, 9, 4), d, -0.4, 10.6, -10); add(g, cyl(0.03, 0.03, 9, 4), d, 0.4, 10.6, -10);
  add(g, BOX, d, 0, 6, -10, 0, 0, 0, 2.6, 0.3, 1.2); // spreader
  return g;
}

// Barca de pesca amarrada (casco torneado y cabina)
export function barca(color = '#2c6e9e') {
  const g = new THREE.Group();
  const hull = once(geos, 'casco', () => {
    const pts = []; for (let k = 0; k <= 10; k++) { const t = k / 10; pts.push(new THREE.Vector2(Math.sin(t * Math.PI) * 1.25 + 0.05, (t - 0.5) * 7)); }
    const gg = new THREE.LatheGeometry(pts, 16, 0, Math.PI); gg.rotateZ(Math.PI / 2); gg.rotateY(Math.PI / 2); gg.scale(1, 0.7, 1); return gg;
  });
  add(g, hull, mat('casco' + color, { color, roughness: 0.5, side: THREE.DoubleSide }), 0, 0.85, 0);
  add(g, BOX, mat('cubierta', { color: '#d9cdb4', roughness: 0.8 }), 0, 0.8, 0, 0, 0, 0, 2.3, 0.08, 6.4);
  add(g, BOX, mat('cabinaB', { color: '#f4f1ea', roughness: 0.6 }), 0, 1.6, -0.8, 0, 0, 0, 1.5, 1.5, 1.8);
  add(g, BOX, mat('gruaVid', { color: '#2a3a48', roughness: 0.1, metalness: 0.5 }), 0, 1.85, 0.12, 0, 0, 0, 1.3, 0.5, 0.04);
  add(g, cyl(0.05, 0.05, 3, 6), mat('hierro', { color: '#2b2e33', roughness: 0.5, metalness: 0.6 }), 0, 3, -1.2);
  return g;
}

// ---------- faro ----------
// Faro torneado con franjas, balcón con barandilla, linterna acristalada y cúpula, sobre una
// base de piedra; la casa del farero al lado
export function faro() {
  const g = new THREE.Group();
  // fuste en 12 tramos (la textura de franjas se reparte por tramos del perfil)
  const prof = [[2.4, 0], [2.4, 1.2], [2.1, 1.2]];
  for (let k = 1; k <= 12; k++) prof.push([2.1 - (0.5 * k) / 12, 1.2 + (11.3 * k) / 12]);
  prof.push([1.9, 12.6], [1.9, 12.9], [0, 12.9]);
  const tower = once(geos, 'faroTorre', () => new THREE.LatheGeometry(prof.map(([r, y]) => new THREE.Vector2(r, y)), 24));
  // franjas rojas y blancas: tres tramos por franja (v va de 0 a 1 por los 17 puntos)
  const stripes = canvasTex('co-faro', 8, 272, (c) => { c.fillStyle = '#f3efe6'; c.fillRect(0, 0, 8, 272); c.fillStyle = '#c0392b'; for (let k = 3; k < 15; k += 6) c.fillRect(0, k * 17, 8, 51); c.fillRect(0, 15 * 17, 8, 34); }, false);
  const tm = mat('faroTorre', { map: stripes, roughness: 0.7 });
  add(g, tower, tm);
  add(g, cyl(2.6, 2.9, 1.2, 16), mat('piedraFaro', { color: '#8d877c', roughness: 0.95 }), 0, 0.6, 0);
  const iron = mat('hierroFaro', { color: '#22262b', roughness: 0.45, metalness: 0.6 });
  for (let k = 0; k < 16; k++) { const a = (k / 16) * Math.PI * 2; add(g, cyl(0.03, 0.03, 0.9, 4), iron, Math.cos(a) * 1.85, 13.35, Math.sin(a) * 1.85); }
  add(g, new THREE.TorusGeometry(1.85, 0.04, 4, 24), iron, 0, 13.8, 0, Math.PI / 2);
  add(g, cyl(1.05, 1.05, 1.6, 12), mat('faroVidrio', { color: '#ffe9a8', emissive: '#ffd36a', emissiveIntensity: 0.6, roughness: 0.1, transparent: true, opacity: 0.75 }), 0, 13.7, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2; add(g, BOX, iron, Math.cos(a) * 1.05, 13.7, Math.sin(a) * 1.05, 0, -a, 0, 0.06, 1.6, 0.06); }
  add(g, new THREE.SphereGeometry(1.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), mat('faroCupula', { color: '#a5322a', roughness: 0.5, metalness: 0.3 }), 0, 14.5, 0);
  add(g, cyl(0.05, 0.12, 0.7, 6), iron, 0, 15.9, 0);
  // casa del farero
  add(g, boxM(5, 3, 4, 1.5), mat('casaFaro', { color: '#efe8da', roughness: 0.9 }), 5.2, 1.5, -1.2);
  const roof = once(geos, 'tejadoFaro', () => { const s = new THREE.Shape(); s.moveTo(-2.9, 0); s.lineTo(0, 1.5); s.lineTo(2.9, 0); s.lineTo(-2.9, 0); const e = new THREE.ExtrudeGeometry(s, { depth: 5.4, bevelEnabled: false }); e.translate(0, 0, -2.7); e.rotateY(Math.PI / 2); return e; });
  add(g, roof, mat('tejaFaro', { color: '#8c3b2c', roughness: 0.8 }), 5.2, 3, -1.2);
  add(g, BOX, mat('puertaFaro', { color: '#2e5a7a', roughness: 0.6 }), 5.2, 1.0, 0.82, 0, 0, 0, 0.9, 2, 0.06);
  for (const x of [3.9, 6.5]) add(g, BOX, mat('ventFaro', { color: '#2a3a48', roughness: 0.1, metalness: 0.4 }), x, 1.7, 0.82, 0, 0, 0, 0.8, 0.8, 0.05);
  return g;
}
// Roca de costa (bloques irregulares con color por vértice)
export function rocaCosta(seed = 1, s = 1) {
  const geo = once(geos, 'rocaC' + seed + ':' + s, () => {
    const rnd = rng(seed * 7 + 3), g = new THREE.IcosahedronGeometry(1.4 * s, 1), P = g.attributes.position, col = [];
    for (let i = 0; i < P.count; i++) { const f = 0.75 + rnd() * 0.45; P.setXYZ(i, P.getX(i) * f * 1.2, Math.max(-0.3, P.getY(i) * f * 0.7), P.getZ(i) * f); }
    // (color lineal) gris pardo, más claro arriba
    for (let i = 0; i < P.count; i++) { const l = 0.1 + Math.max(0, P.getY(i)) * 0.06 + rnd() * 0.05; col.push(l * 1.05, l * 0.95, l * 0.85); }
    g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.deleteAttribute('uv'); g.computeVertexNormals();
    return g;
  });
  const g = new THREE.Group(); add(g, geo, rockMat(), 0, 0.3 * s, 0); return g;
}

// Valla de madera de len metros (postes y dos travesaños), para caminos y miradores
export function vallaMadera(len = 2) {
  const g = new THREE.Group(), w = mat('vallaMad', { color: '#8a6440', roughness: 0.9 });
  for (const x of [-len / 2, len / 2]) add(g, BOX, w, x, 0.5, 0, 0, 0, 0, 0.1, 1.0, 0.1);
  for (const y of [0.45, 0.85]) add(g, BOX, w, 0, y, 0, 0, 0, 0, len, 0.07, 0.05);
  return g;
}

// ---------- playa ----------
// Sombrilla de tela a rayas con mástil de madera
export function sombrilla(a = '#e74c3c', b = '#f4efe4') {
  const g = new THREE.Group();
  add(g, cyl(0.035, 0.04, 2.5, 6), mat('mastil', { color: '#c9a36b', roughness: 0.8 }), 0, 1.25, 0);
  const cone = once(geos, 'sombr', () => { const c = new THREE.ConeGeometry(1.5, 0.55, 16, 1, true); return c; });
  add(g, cone, once(mats, 'tela' + a, () => new THREE.MeshStandardMaterial({ map: stripeTex(a, b), roughness: 0.9, side: THREE.DoubleSide })), 0, 2.35, 0);
  return g;
}
// Tumbona de madera con colchoneta
export function tumbona(color = '#2c7fb8') {
  const g = new THREE.Group(), wood = COAST_MAT.wood();
  add(g, boxM(0.65, 0.06, 1.3, 1), wood, 0, 0.32, 0.25);
  add(g, boxM(0.65, 0.06, 0.75, 1), wood, 0, 0.55, -0.6, -0.55);
  for (const [x, z] of [[-0.28, 0.8], [0.28, 0.8], [-0.28, -0.3], [0.28, -0.3]]) add(g, BOX, wood, x, 0.15, z, 0, 0, 0, 0.06, 0.3, 0.06);
  add(g, BOX, mat('colch' + color, { color, roughness: 0.9 }), 0, 0.38, 0.25, 0, 0, 0, 0.6, 0.06, 1.25);
  return g;
}
// Chiringuito: barra de madera, tejado de paja, taburetes y rótulo
export function chiringuito() {
  const g = new THREE.Group(), wood = COAST_MAT.wood();
  add(g, boxM(6, 1.1, 1, 1.2), wood, 0, 0.55, 1.6);
  add(g, BOX, mat('encimera', { color: '#e9e1cf', roughness: 0.5 }), 0, 1.13, 1.6, 0, 0, 0, 6.2, 0.06, 1.2);
  add(g, boxM(6, 2.6, 0.2, 1.2), wood, 0, 1.3, -1.6);
  for (const s of [-1, 1]) add(g, boxM(0.2, 2.6, 3.2, 1.2), wood, s * 3, 1.3, 0);
  for (const [x, z] of [[-3, 2.1], [3, 2.1], [-3, -1.6], [3, -1.6]]) add(g, cyl(0.1, 0.12, 3, 6), COAST_MAT.pile(), x, 1.5, z);
  const roof = once(geos, 'pajaTecho', () => new THREE.ConeGeometry(5.2, 1.6, 4, 1));
  add(g, roof, mat('paja', { map: thatchTex(), roughness: 1 }), 0, 3.6, 0.2, 0, Math.PI / 4, 0, 1, 1, 0.75);
  for (let k = 0; k < 4; k++) { add(g, cyl(0.2, 0.2, 0.06, 10), mat('asiento', { color: '#c0392b', roughness: 0.6 }), -2.1 + k * 1.4, 0.75, 2.6); add(g, cyl(0.03, 0.03, 0.72, 5), mat('hierro', { color: '#2b2e33', roughness: 0.5, metalness: 0.6 }), -2.1 + k * 1.4, 0.36, 2.6); }
  return g;
}
// Torre de socorrista de madera con escalera y bandera
export function torreSocorrista() {
  const g = new THREE.Group(), w = mat('socorrista', { color: '#f4f1ea', roughness: 0.8 });
  for (const [x, z] of [[-0.8, -0.8], [0.8, -0.8], [-0.8, 0.8], [0.8, 0.8]]) add(g, BOX, w, x, 1.1, z, 0, 0, 0, 0.12, 2.2, 0.12);
  add(g, BOX, w, 0, 2.25, 0, 0, 0, 0, 2, 0.12, 2);
  add(g, BOX, mat('socRojo', { color: '#d63a2a', roughness: 0.7 }), 0, 3.0, -0.2, 0, 0, 0, 1.8, 1.4, 1.4);
  add(g, BOX, mat('socRojo', { color: '#d63a2a', roughness: 0.7 }), 0, 3.85, -0.1, 0, 0, 0, 2.2, 0.1, 2);
  for (let k = 0; k < 7; k++) add(g, BOX, w, 0, 0.3 * k + 0.15, 1.3 + k * 0.12, 0, 0, 0, 0.7, 0.05, 0.18);
  add(g, cyl(0.025, 0.025, 2, 4), w, 0.9, 4.8, -0.9);
  add(g, BOX, mat('bandera', { color: '#f2c12e', roughness: 0.9, side: THREE.DoubleSide }), 1.25, 5.5, -0.9, 0, 0, 0, 0.7, 0.45, 0.02);
  return g;
}
// Toalla en la arena
export function toalla(a = '#2c7fb8', b = '#ffffff') {
  const g = new THREE.Group();
  add(g, BOX, once(mats, 'toalla' + a, () => new THREE.MeshStandardMaterial({ map: stripeTex(a, b), roughness: 1 })), 0, 0.012, 0, 0, 0, 0, 0.9, 0.02, 1.8);
  return g;
}

// Suelo de arena: varias losas en una malla (rejilla de 2 m: sigue bien las dunas), con la textura en metros
export function sandGeometry(rects) {
  const parts = rects.map(([x0, x1, z0, z1]) => { const g = new THREE.PlaneGeometry(x1 - x0, z1 - z0, Math.ceil((x1 - x0) / 2), Math.ceil((z1 - z0) / 2)); g.rotateX(-Math.PI / 2); g.translate((x0 + x1) / 2, 0, (z0 + z1) / 2); return g; });
  const g = mergeGeometries(parts), P = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < P.count; i++) uv.setXY(i, P.getX(i) / 3, P.getZ(i) / 3);
  return g;
}

// ---------- puerto moderno ----------
// Grúa de muelle (pórtico STS): patas en A, pluma larga que vuela sobre el agua (hacia +z),
// sala de máquinas y carro con el spreader. Unos 38 m de alto.
export function gruaSTS() {
  const g = new THREE.Group();
  const c = mat('stsAzul', { color: '#4f6f96', roughness: 0.5, metalness: 0.45 }), w = mat('stsBlanco', { color: '#e9ecef', roughness: 0.5, metalness: 0.3 }), d = mat('gruaOs', { color: '#3a3d42', roughness: 0.5, metalness: 0.5 });
  for (const x of [-7, 7]) {
    for (const z of [-8, 8]) { add(g, BOX, c, x, 13, z, 0, 0, 0, 1.2, 26, 1.2); add(g, BOX, d, x, 0.5, z, 0, 0, 0, 1.8, 1, 2.6); }
    add(g, BOX, c, x, 26.5, 0, 0, 0, 0, 1.2, 1.4, 17.2);           // viga superior
    add(g, BOX, c, x, 12, 0, 0, 0, 0, 0.8, 0.8, 16.4);              // travesaño
    for (const s of [-1, 1]) add(g, BOX, c, x, 19, s * 4, s * 0.72, 0, 0, 0.5, 0.5, 11); // diagonales
  }
  for (const z of [-8, 8]) add(g, BOX, c, 0, 26.5, z, 0, 0, 0, 15.4, 1.2, 1.2);
  // pluma: de -26 (contrapeso, tierra) a +44 (agua)
  add(g, BOX, w, 0, 31, 9, 0, 0, 0, 3.2, 2.4, 70);
  add(g, BOX, w, 0, 30, -22, 0, 0, 0, 6, 4, 8);                     // contrapeso
  add(g, BOX, mat('stsMaq', { color: '#d9dde1', roughness: 0.5 }), 0, 34.2, -4, 0, 0, 0, 8, 4, 10); // sala de máquinas
  // tirantes de la pluma hasta el castillete
  add(g, BOX, c, 0, 40, -4, 0, 0, 0, 1.4, 14, 1.4);
  for (const [z1, len] of [[22, 31], [-16, 14]]) { const dz = z1 - -4, dy = 31 - 46, L = Math.hypot(dz, dy); add(g, BOX, d, 0, (46 + 31) / 2, (-4 + z1) / 2, Math.atan2(-dy, dz) - Math.PI / 2 + Math.PI / 2, 0, 0, 0.25, 0.25, L); }
  add(g, BOX, mat('stsCabina', { color: '#f2f2f2', roughness: 0.4 }), 0, 28.6, 18, 0, 0, 0, 2.4, 2.2, 3);
  add(g, BOX, d, 0, 29.4, 30, 0, 0, 0, 3.4, 1.2, 3.4);             // carro
  add(g, BOX, d, 0, 14, 30, 0, 0, 0, 2.6, 0.5, 12.5);             // spreader (colgando)
  for (const s of [-1, 1]) add(g, cyl(0.04, 0.04, 15, 4), d, s * 0.8, 21.5, 30);
  return g;
}

// Buque portacontenedores atracado (eslora L, de -L/2 a L/2 en x), con puente a popa y
// contenedores en cubierta (colores sobrios)
export function buque(L = 110, seed = 1) {
  const g = new THREE.Group(), B = 22;
  const hull = once(geos, 'casco' + L, () => {
    const s = new THREE.Shape();
    s.moveTo(-L / 2, -B / 2); s.lineTo(L / 2 - 14, -B / 2); s.quadraticCurveTo(L / 2, -B / 2, L / 2 + 4, 0); s.quadraticCurveTo(L / 2, B / 2, L / 2 - 14, B / 2); s.lineTo(-L / 2, B / 2); s.lineTo(-L / 2, -B / 2);
    const e = new THREE.ExtrudeGeometry(s, { depth: 11, bevelEnabled: false }); e.rotateX(-Math.PI / 2); e.translate(0, -6, 0); return e;
  });
  add(g, hull, mat('cascoBuque', { color: '#1f3b5a', roughness: 0.6, metalness: 0.2 }));
  add(g, BOX, mat('lineaRoja', { color: '#8e2a22', roughness: 0.7 }), 0, -5.2, 0, 0, 0, 0, L - 2, 1.6, B + 0.05);
  add(g, BOX, mat('cubiertaB', { color: '#7b8087', roughness: 0.8 }), 0, 5.05, 0, 0, 0, 0, L - 6, 0.1, B - 1);
  // puente de mando (popa)
  const wh = mat('puente', { color: '#eef0f1', roughness: 0.5 });
  add(g, BOX, wh, -L / 2 + 8, 13, 0, 0, 0, 0, 10, 16, 16);
  add(g, BOX, wh, -L / 2 + 8, 21.5, 0, 0, 0, 0, 11, 1, B);
  add(g, BOX, mat('gruaVid', { color: '#2a3a48', roughness: 0.1, metalness: 0.5 }), -L / 2 + 13.05, 19.5, 0, 0, 0, 0, 0.1, 1.5, 15);
  add(g, cyl(1.2, 1.4, 6, 10), mat('chimenea', { color: '#b5402f', roughness: 0.6 }), -L / 2 + 4, 24, 0);
  // contenedores en cubierta: bloques de 6 m en filas y alturas variables
  const rnd = rng(seed * 11 + 3), cols = ['#b5402f', '#2c6e9e', '#2e7d32', '#d9822b', '#7f8c8d', '#8e44ad'.replace('8e44ad', '6d6f73')];
  const shell = once(mats, 'contShip', () => new THREE.MeshStandardMaterial({ map: ribTex(), vertexColors: true, roughness: 0.6, metalness: 0.25 }));
  const parts = [];
  for (let x = -L / 2 + 16; x < L / 2 - 16; x += 6.3) for (let z = -B / 2 + 2; z < B / 2 - 1; z += 2.5) {
    const h = 1 + Math.floor(rnd() * 4);
    for (let k = 0; k < h; k++) {
      const bx = new THREE.BoxGeometry(6, 2.5, 2.4).toNonIndexed(); bx.translate(x, 5.1 + 1.25 + k * 2.55, z + 1.2);
      const cc = new THREE.Color(cols[Math.floor(rnd() * cols.length)]), col = [];
      for (let i = 0; i < bx.attributes.position.count; i++) col.push(cc.r, cc.g, cc.b);
      bx.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      const uv = bx.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * 2.7, uv.getY(i));
      parts.push(bx);
    }
  }
  add(g, mergeGeometries(parts), shell);
  return g;
}

// Yate a motor blanco (casco afilado, dos cubiertas con cristales oscuros)
export function yate(len = 14) {
  const g = new THREE.Group(), wh = mat('yate', { color: '#f4f5f6', roughness: 0.35 }), gl = mat('yateVid', { color: '#1c2a36', roughness: 0.08, metalness: 0.6 });
  const hull = once(geos, 'yateCasco' + len, () => {
    const s = new THREE.Shape(), w = len * 0.17;
    s.moveTo(-len / 2, -w); s.lineTo(len * 0.2, -w); s.quadraticCurveTo(len / 2, -w * 0.6, len / 2, 0); s.quadraticCurveTo(len / 2, w * 0.6, len * 0.2, w); s.lineTo(-len / 2, w); s.lineTo(-len / 2, -w);
    const e = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: true, bevelSize: 0.15, bevelThickness: 0.15, bevelSegments: 2 }); e.rotateX(-Math.PI / 2); e.translate(0, -0.7, 0); return e;
  });
  add(g, hull, wh);
  add(g, BOX, mat('yateFranja', { color: '#203a5a', roughness: 0.4 }), 0, 0.05, 0, 0, 0, 0, len * 0.95, 0.25, len * 0.345);
  add(g, BOX, mat('teca', { color: '#a87a4b', roughness: 0.8 }), -len * 0.05, 1.0, 0, 0, 0, 0, len * 0.85, 0.06, len * 0.3);
  add(g, BOX, wh, -len * 0.08, 1.75, 0, 0, 0, 0, len * 0.42, 1.4, len * 0.26);
  add(g, BOX, gl, -len * 0.08, 1.85, 0, 0, 0, 0, len * 0.43, 0.6, len * 0.265);
  add(g, BOX, wh, -len * 0.14, 2.7, 0, 0, 0, 0, len * 0.26, 0.5, len * 0.22);
  return g;
}
// Velero: casco blanco, mástil y vela recogida en la botavara
export function velero(len = 10) {
  const g = new THREE.Group(), wh = mat('yate', { color: '#f4f5f6', roughness: 0.35 });
  const hull = once(geos, 'veleroCasco' + len, () => {
    const s = new THREE.Shape(), w = len * 0.16;
    s.moveTo(-len / 2, -w * 0.8); s.quadraticCurveTo(0, -w * 1.2, len / 2, 0); s.quadraticCurveTo(0, w * 1.2, -len / 2, w * 0.8); s.lineTo(-len / 2, -w * 0.8);
    const e = new THREE.ExtrudeGeometry(s, { depth: 1.1, bevelEnabled: false }); e.rotateX(-Math.PI / 2); e.translate(0, -0.5, 0); return e;
  });
  add(g, hull, wh);
  add(g, BOX, mat('teca', { color: '#a87a4b', roughness: 0.8 }), 0, 0.62, 0, 0, 0, 0, len * 0.7, 0.05, len * 0.22);
  add(g, BOX, wh, -len * 0.1, 0.95, 0, 0, 0, 0, len * 0.25, 0.6, len * 0.18);
  const al = mat('aluminio', { color: '#c9ced3', roughness: 0.3, metalness: 0.8 });
  add(g, cyl(0.07, 0.08, len * 1.3, 6), al, len * 0.08, 0.6 + len * 0.65, 0);
  add(g, BOX, al, -len * 0.12, 1.7, 0, 0, 0, 0, len * 0.42, 0.1, 0.1);
  add(g, BOX, mat('velaRec', { color: '#1f3b5a', roughness: 0.9 }), -len * 0.12, 1.85, 0, 0, 0, 0, len * 0.4, 0.22, 0.24);
  return g;
}
// Pantalán flotante del puerto deportivo (hormigón claro con bitas), len × 2,4 m
export function pantalanFlotante(len = 30) {
  const g = new THREE.Group();
  add(g, boxM(2.4, 0.35, len, 2), mat('flotante', { color: '#c9c3b6', roughness: 0.9 }), 0, 0.05, len / 2);
  add(g, BOX, mat('defensa', { color: '#2b2e33', roughness: 0.8 }), 0, 0.0, len / 2, 0, 0, 0, 2.5, 0.12, len);
  for (let z = 3; z < len; z += 6) for (const s of [-1, 1]) add(g, cyl(0.07, 0.09, 0.3, 8), mat('hierro', { color: '#2b2e33', roughness: 0.5, metalness: 0.6 }), s * 1.05, 0.37, z);
  return g;
}
