// Callejones: pasajes estrechos entre edificios (o detrás de los grandes) con contenedores,
// bolsas de basura, cajas, cartones, palés, charcos, grafitis, escaleras de incendios y un
// farol de pared que se enciende de noche. Las piezas siguen el estilo de streetkit: medidas
// en metros, origen en el suelo y frente hacia +z; geometrías y materiales compartidos.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mat } from './streetkit.js';

const geos = new Map();
const once = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
const box = (w, h, d) => once(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d));
const rbox = (w, h, d, r) => once(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, r));
const cyl = (rt, rb, h, s = 10) => once(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.scale.set(sx, sy, sz);
  o.castShadow = true; o.receiveShadow = true;
  g.add(o);
  return o;
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
const IRON = '#2a2d31';

// Bolsas de basura: tres o cuatro sacos negros brillantes, aplastados, con el nudo arriba
export function bolsasBasura(n = 3) {
  const g = new THREE.Group(), m = mat('#17181a', { r: 0.28, m: 0.05 });
  const sp = once('saco', () => { const s = new THREE.SphereGeometry(0.3, 10, 8); const p = s.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setXYZ(i, p.getX(i) * (1 + 0.08 * Math.sin(i)), y < 0 ? y * 0.55 : y * 0.95, p.getZ(i)); } s.computeVertexNormals(); return s; });
  const knot = cyl(0.04, 0.08, 0.12, 6);
  const pos = [[0, 0, 0, 1], [0.48, 0.02, 0.12, 0.85], [0.18, 0, 0.45, 0.9], [-0.35, 0, 0.3, 0.8]];
  for (const [x, y, z, s] of pos.slice(0, n)) {
    add(g, sp, m, x, 0.17 * s + y, z, 0, x * 3, 0, s, s, s);
    add(g, knot, m, x, 0.42 * s + y, z, 0.2, 0, 0.3);
  }
  return g;
}

// Cartones: cajas de cartón aplastadas apoyadas en la pared y una caja abierta en el suelo
const cartonTex = () => canvasTex('carton', 128, 128, (c, w, h) => {
  c.fillStyle = '#a77b4a'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '60,40,20' : '220,190,140'},${Math.random() * 0.12})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 1); }
  c.strokeStyle = 'rgba(70,45,20,0.6)'; c.lineWidth = 2; c.strokeRect(10, 10, w - 20, h - 20);
  c.fillStyle = 'rgba(40,30,20,0.7)'; c.font = 'bold 16px sans-serif'; c.fillText('FRÁGIL', 30, 70);
});
export function cartones() {
  const g = new THREE.Group(), m = mat('#ffffff', { map: cartonTex(), r: 0.9 });
  add(g, box(0.9, 1.1, 0.02), m, 0, 0.55, 0.12, -0.16);
  add(g, box(0.7, 0.85, 0.02), m, 0.55, 0.42, 0.22, -0.22, 0.15);
  add(g, rbox(0.45, 0.35, 0.4, 0.01), m, -0.5, 0.18, 0.45, 0, 0.4);
  return g;
}

// Palé de madera apoyado de pie contra la pared
export function palet() {
  const g = new THREE.Group(), m = mat('#9c7a52', { r: 0.85 }), d = mat('#7d5f3e', { r: 0.9 });
  for (let i = 0; i < 5; i++) add(g, box(1.2, 0.1, 0.02), m, 0, 0.12 + i * 0.22, 0.12);
  for (const x of [-0.55, 0, 0.55]) add(g, box(0.1, 1.0, 0.1), d, x, 0.55, 0.06);
  g.rotation.x = -0.12;
  return g;
}

// Charco: lámina oscura que brilla (refleja el cielo), con borde irregular
export function charco(w = 1.6, d = 1.1) {
  const g = new THREE.Group();
  const geo = once(`charco${w},${d}`, () => {
    const sh = new THREE.Shape(), n = 14;
    for (let i = 0; i <= n; i++) { const a = (i / n) * Math.PI * 2, r = 1 + 0.18 * Math.sin(a * 3 + 1) + 0.1 * Math.cos(a * 5); const x = Math.cos(a) * r * w / 2, z = Math.sin(a) * r * d / 2; i ? sh.lineTo(x, z) : sh.moveTo(x, z); }
    const s = new THREE.ShapeGeometry(sh); s.rotateX(-Math.PI / 2); return s;
  });
  const o = add(g, geo, mat('#2a2f36', { r: 0.04, m: 0.6, t: 0.82 }), 0, 0.025, 0);
  o.castShadow = false;
  return g;
}

// Grafiti: firma de colores pintada en la pared (varias distintas)
const TAGS = [
  ['ROOK', '#e84393', '#2d3436'], ['VND', '#00b894', '#111'], ['K!NG', '#fdcb6e', '#6c5ce7'], ['ZONA 7', '#0984e3', '#fff'],
];
const tagTex = (i) => canvasTex('tag' + i, 256, 128, (c, w, h) => {
  const [txt, a, b] = TAGS[i];
  c.clearRect(0, 0, w, h);
  c.font = `900 ${txt.length > 4 ? 54 : 70}px Impact, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.save(); c.translate(w / 2, h / 2); c.rotate(-0.08);
  c.lineWidth = 12; c.strokeStyle = b; c.strokeText(txt, 0, 0);
  const gr = c.createLinearGradient(-90, 0, 90, 0); gr.addColorStop(0, a); gr.addColorStop(1, '#ffffff'); c.fillStyle = gr; c.fillText(txt, 0, 0);
  c.restore();
  for (let k = 0; k < 140; k++) { c.fillStyle = a; c.globalAlpha = Math.random() * 0.5; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } // gotas de spray
  c.globalAlpha = 1;
});
export function grafiti(i = 0, w = 2.6) {
  const g = new THREE.Group();
  const o = add(g, once(`tagPlane${w}`, () => new THREE.PlaneGeometry(w, w / 2)), mat('#ffffff', { map: tagTex(i % TAGS.length), t: 0.95, r: 0.85, alphaTest: 0.05 }), 0, 1.5, 0.03);
  o.castShadow = false;
  return g;
}

// Farol de pared: brazo de hierro y pantalla con bombilla que brilla de noche
export function farolPared() {
  const g = new THREE.Group(), m = mat(IRON, { r: 0.5, m: 0.6 });
  add(g, box(0.16, 0.24, 0.04), m, 0, 3.2, 0.02);
  add(g, cyl(0.025, 0.025, 0.45, 6), m, 0, 3.32, 0.24, Math.PI / 2);
  add(g, once('pantalla', () => new THREE.ConeGeometry(0.24, 0.18, 12, 1, true)), mat('#33373d', { r: 0.4, m: 0.5, side: THREE.DoubleSide }), 0, 3.3, 0.46);
  add(g, once('bombilla', () => new THREE.SphereGeometry(0.08, 10, 8)), mat('#fff1c8', { r: 0.3, e: '#ffcf70', ei: 0.9, glow: 'lamp' }), 0, 3.2, 0.46);
  return g;
}

// Aparato de aire acondicionado colgado de la pared: caja con rejilla, ventilador y tubo
export function aireAcondicionado() {
  const g = new THREE.Group(), m = mat('#c9ccc8', { r: 0.6, m: 0.2 }), d = mat('#55595e', { r: 0.6, m: 0.4 });
  add(g, rbox(0.85, 0.6, 0.32, 0.03), m, 0, 2.7, 0.2);
  add(g, once('rejilla', () => new THREE.CircleGeometry(0.22, 18)), mat('#3a3d41', { r: 0.8 }), 0.12, 2.7, 0.365);
  for (let i = -3; i <= 3; i++) add(g, box(0.46, 0.012, 0.01), d, 0.12, 2.7 + i * 0.055, 0.37);
  for (const x of [-0.35, 0.35]) add(g, box(0.04, 0.04, 0.4), d, x, 2.38, 0.2);   // escuadras
  add(g, cyl(0.02, 0.02, 2.3, 6), d, -0.36, 1.25, 0.06);                          // desagüe
  return g;
}

// Escalera de incendios en la fachada: dos rellanos con barandilla y tramos en zigzag, y una
// escalera de mano plegada que no llega al suelo
export function escaleraIncendios(w = 3) {
  const g = new THREE.Group(), m = mat(IRON, { r: 0.55, m: 0.55 });
  for (const [k, y] of [[0, 3.3], [1, 6.6]]) {
    add(g, box(w, 0.06, 1.1), m, 0, y, 0.6);                                     // rellano (rejilla)
    for (let x = -w / 2; x <= w / 2 + 1e-6; x += w / 6) add(g, box(0.03, 1.0, 0.03), m, x, y + 0.5, 1.14); // barrotes
    add(g, box(w, 0.04, 0.04), m, 0, y + 1.0, 1.14);                             // pasamanos
    for (const s of [-1, 1]) add(g, box(0.04, 1.0, 1.1), m, s * w / 2, y + 0.5, 0.6, 0, 0, 0, 1, 1, 0.04); // laterales
    add(g, box(0.06, 0.06, 1.1), m, -w / 2 + 0.1, y - 0.25, 0.6, 0.6);           // escuadra
    add(g, box(0.06, 0.06, 1.1), m, w / 2 - 0.1, y - 0.25, 0.6, 0.6);
    if (k === 0) { // tramo de un rellano al otro, inclinado
      const L = Math.hypot(w * 0.7, 3.3), a = Math.atan2(3.3, w * 0.7);
      for (const z of [0.3, 0.95]) add(g, box(L, 0.06, 0.04), m, 0, y + 1.65, z, 0, 0, a);
      for (let i = 1; i < 10; i++) add(g, box(0.06, 0.03, 0.65), m, -w * 0.35 + (w * 0.7 * i) / 10, y + (3.3 * i) / 10, 0.62);
    }
  }
  // escalera de mano plegada bajo el primer rellano
  for (const x of [w / 2 - 0.55, w / 2 - 0.15]) add(g, box(0.04, 1.6, 0.04), m, x, 2.4, 1.05);
  for (let i = 0; i < 6; i++) add(g, box(0.4, 0.03, 0.03), m, w / 2 - 0.35, 1.75 + i * 0.26, 1.05);
  return g;
}
