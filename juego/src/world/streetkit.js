// Mobiliario urbano de Rooktown, modelado a partir de la lámina «Calles y ciudad»
// (docs/referencias/09-tiendas-calles-objetos.png). Medidas reales en metros, origen en
// el suelo y frente hacia +z. Cada función devuelve un THREE.Group; las geometrías y los
// materiales se comparten entre copias para que muchas unidades no pesen en el móvil.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeVertices, mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// ---------- materiales y geometrías compartidas ----------
const mats = new Map();
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, ...(o.e ? { emissive: o.e, emissiveIntensity: o.ei ?? 1 } : {}), ...(o.t ? { transparent: true, opacity: o.t, depthWrite: false } : {}), ...(o.map ? { map: o.map } : {}), ...(o.side ? { side: o.side } : {}), ...(o.alphaTest ? { alphaTest: o.alphaTest } : {}), ...(o.vc ? { vertexColors: true } : {}) });
    if (o.glow) m.userData.glow = o.glow; // las luces que se encienden de noche
    mats.set(k, m);
  }
  return mats.get(k);
}
const geos = new Map();
const cache = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
const rbox = (w, h, d, r, s = 3) => cache(`rb${w},${h},${d},${r},${s}`, () => new RoundedBoxGeometry(w, h, d, s, Math.min(r, w / 2, h / 2, d / 2) * 0.999));
const cyl = (rt, rb, h, s = 16, open = false, t0 = 0, tl = Math.PI * 2) => cache(`cy${rt},${rb},${h},${s},${open},${t0},${tl}`, () => new THREE.CylinderGeometry(rt, rb, h, s, 1, open, t0, tl));
const sph = (r, ws = 16, hs = 12) => cache(`sp${r},${ws},${hs}`, () => new THREE.SphereGeometry(r, ws, hs));
// perfil torneado: puntos [radio, altura]
const lathe = (key, pts, s = 24) => cache('la' + key, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), s));
const tube = (key, pts, r, s = 24) => cache('tu' + key, () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p))), s, r, 10, false));

function add(g, geo, m, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) {
  const o = new THREE.Mesh(geo, m);
  o.position.set(x, y, z);
  o.rotation.set(rx, ry, rz);
  o.scale.set(sx, sy, sz);
  o.castShadow = true;
  o.receiveShadow = true;
  g.add(o);
  return o;
}

// ---------- texturas dibujadas ----------
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

const IRON = '#23262b', STEEL = '#8d949c', DARK = '#2f343b';

// ------------------------------------------------------------------
//  Farola: base acampanada, fuste con anillos, brazo curvo y luminaria con cristal
// ------------------------------------------------------------------
export function farola() {
  const g = new THREE.Group(), m = mat('#2d323a', { r: 0.45, m: 0.6 });
  add(g, lathe('farolaBase', [[0, 0], [0.3, 0], [0.3, 0.07], [0.25, 0.12], [0.18, 0.38], [0.13, 0.6], [0.11, 0.66], [0, 0.66]]), m);
  add(g, cyl(0.07, 0.1, 4.0, 16), m, 0, 2.66, 0);
  for (const y of [0.72, 4.62]) add(g, cyl(0.11, 0.11, 0.08, 16), m, 0, y, 0);
  add(g, tube('farolaBrazo', [[0, 4.6, 0], [0, 4.95, 0], [0.14, 5.16, 0], [0.48, 5.24, 0], [0.86, 5.18, 0]], 0.055, 28), m);
  // luminaria: carcasa abombada + difusor que brilla de noche
  const head = new THREE.Group(); head.position.set(1.02, 5.12, 0); head.rotation.z = -0.1; g.add(head); head.scale.setScalar(1.6);
  add(head, lathe('farolaCab', [[0, 0.13], [0.12, 0.12], [0.25, 0.06], [0.3, 0.0], [0.3, -0.03], [0, -0.03]], 28), m);
  add(head, cyl(0.27, 0.21, 0.08, 24), mat('#ffe9b0', { r: 0.25, e: '#ffcc66', ei: 0.9, glow: 'lamp' }), 0, -0.07, 0);
  return g;
}

// ------------------------------------------------------------------
//  Semáforo: zócalo, poste y cabeza con marco, tres focos y viseras
// ------------------------------------------------------------------
export function semaforo(lit = 'r') {
  const g = new THREE.Group(), m = mat('#1f2226', { r: 0.5, m: 0.4 });
  add(g, rbox(0.42, 0.12, 0.42, 0.03), m, 0, 0.06, 0);
  add(g, lathe('semBase', [[0, 0], [0.16, 0], [0.12, 0.08], [0.08, 0.22], [0, 0.22]]), m, 0, 0.12, 0);
  add(g, cyl(0.08, 0.09, 1.9, 16), m, 0, 1.25, 0);
  const h = new THREE.Group(); h.position.set(0, 2.75, 0.02); h.scale.setScalar(1.3); g.add(h);
  add(h, rbox(0.4, 1.02, 0.08, 0.05), m, 0, 0, -0.08);                 // placa trasera
  add(h, rbox(0.32, 0.94, 0.26, 0.06), mat('#2a2e33', { r: 0.45, m: 0.3 }), 0, 0, 0.04); // cuerpo
  const col = { r: '#ff3b30', y: '#ffb300', g: '#22d36b' };
  [['r', 0.3], ['y', 0], ['g', -0.3]].forEach(([c, y]) => {
    add(h, cyl(0.115, 0.115, 0.03, 24), mat('#111315', { r: 0.6 }), 0, y, 0.175, Math.PI / 2);
    const on = c === lit;
    add(h, sph(0.1, 20, 12), mat(col[c], { r: 0.2, e: col[c], ei: lit === 'all' || on ? 0.75 : 0.15 }), 0, y, 0.17, 0, 0, 0, 1, 1, 0.45);
    add(h, cyl(0.125, 0.125, 0.16, 20, true, -Math.PI / 2, Math.PI), m, 0, y + 0.03, 0.26, Math.PI / 2, 0, 0); // visera
  });
  return g;
}

// ------------------------------------------------------------------
//  Banco de parque: pies de fundición extruidos (pata, apoyabrazos y respaldo en una pieza)
//  y listones de madera con el canto redondeado. len = 1.8 (banco) o 2.6 (banco largo)
// ------------------------------------------------------------------
function benchFrameGeo() {
  return cache('benchFrame', () => {
    const s = new THREE.Shape();
    // perfil lateral (z hacia delante = +x del perfil, y arriba)
    s.moveTo(0.24, 0); s.lineTo(0.3, 0); s.lineTo(0.26, 0.38); s.lineTo(0.28, 0.42);
    s.quadraticCurveTo(0.33, 0.5, 0.3, 0.64); s.lineTo(0.24, 0.66); s.quadraticCurveTo(0.08, 0.66, -0.14, 0.62);
    s.lineTo(-0.2, 0.86); s.lineTo(-0.24, 0.85); s.lineTo(-0.2, 0.42); s.lineTo(-0.26, 0); s.lineTo(-0.2, 0);
    s.lineTo(-0.15, 0.36); s.lineTo(0.2, 0.38); s.lineTo(0.24, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.05, bevelEnabled: true, bevelThickness: 0.008, bevelSize: 0.008, bevelSegments: 2, curveSegments: 10 });
    geo.translate(0, 0, -0.025);
    geo.rotateY(-Math.PI / 2);
    return geo;
  });
}
export function banco(len = 1.8) {
  const g = new THREE.Group(), iron = mat(IRON, { r: 0.45, m: 0.55 });
  const frames = len > 2.2 ? [-len / 2 + 0.12, 0, len / 2 - 0.12] : [-len / 2 + 0.12, len / 2 - 0.12];
  for (const x of frames) add(g, benchFrameGeo(), iron, x, 0, 0);
  const woods = ['#b8743f', '#a9683a', '#bf7c45'];
  for (let i = 0; i < 3; i++) add(g, rbox(len, 0.035, 0.11, 0.014), mat(woods[i], { r: 0.7 }), 0, 0.41, 0.17 - i * 0.125); // asiento
  for (let i = 0; i < 3; i++) add(g, rbox(len, 0.1, 0.03, 0.012), mat(woods[(i + 1) % 3], { r: 0.7 }), 0, 0.53 + i * 0.12, -0.17 - i * 0.022, -0.2); // respaldo
  return g;
}

// ------------------------------------------------------------------
//  Papelera: cubo cilíndrico con base, aros de refuerzo y boca abierta
// ------------------------------------------------------------------
export function papelera() {
  const g = new THREE.Group(), m = mat('#5f6b7b', { r: 0.38, m: 0.2 });
  add(g, lathe('papelera', [[0, 0.04], [0.27, 0.04], [0.29, 0], [0.31, 0.02], [0.31, 0.07], [0.28, 0.1], [0.28, 0.82], [0.31, 0.84], [0.31, 0.9], [0.27, 0.92], [0.25, 0.9], [0.25, 0.12], [0, 0.12]], 32), m);
  for (const y of [0.35, 0.6]) add(g, cyl(0.29, 0.29, 0.03, 32), mat('#6f7b8c', { r: 0.35, m: 0.2 }), 0, y, 0);
  add(g, cyl(0.245, 0.245, 0.01, 24), mat('#15181b', { r: 1 }), 0, 0.7, 0); // fondo oscuro (bolsa)
  return g;
}

// ------------------------------------------------------------------
//  Cubo de reciclaje con ruedas: cuerpo troncocónico, tapa con asa y símbolo de reciclaje
// ------------------------------------------------------------------
function taperBox(key, w, h, d, r, top = 1.12) {
  return cache('tb' + key, () => {
    const geo = new RoundedBoxGeometry(w, h, d, 3, r).clone();
    const p = geo.attributes.position;
    for (let i = 0; i < p.count; i++) { const k = 1 + ((p.getY(i) + h / 2) / h) * (top - 1); p.setX(i, p.getX(i) * k); p.setZ(i, p.getZ(i) * k); }
    geo.computeVertexNormals();
    return geo;
  });
}
const recycleTex = () => canvasTex('recycle2', 128, 128, (c, w) => {
  c.clearRect(0, 0, w, w); c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 12; c.lineCap = 'butt';
  const R = 34, cx = 64, cy = 66;
  for (let k = 0; k < 3; k++) {
    const a0 = -Math.PI / 2 + (k * Math.PI * 2) / 3 + 0.22, a1 = a0 + 1.55;
    c.beginPath(); c.arc(cx, cy, R, a0, a1); c.stroke();
    // punta de flecha al final del arco, en la dirección del giro
    const px = cx + Math.cos(a1) * R, py = cy + Math.sin(a1) * R, tx = -Math.sin(a1), ty = Math.cos(a1), nx = Math.cos(a1), ny = Math.sin(a1);
    c.beginPath(); c.moveTo(px + tx * 18, py + ty * 18); c.lineTo(px + nx * 14, py + ny * 14); c.lineTo(px - nx * 14, py - ny * 14); c.closePath(); c.fill();
  }
});
export function cuboReciclaje(color = '#2f9a3d') {
  const g = new THREE.Group(), m = mat(color, { r: 0.55 }), dark = mat('#1d2024', { r: 0.8 });
  add(g, taperBox('cubo', 0.56, 0.9, 0.64, 0.05, 1.1), m, 0, 0.55, 0);
  add(g, rbox(0.66, 0.06, 0.76, 0.025), m, 0, 1.03, 0.02, 0.04);               // tapa
  add(g, rbox(0.5, 0.05, 0.06, 0.02), m, 0, 1.0, -0.36);                         // asa trasera
  for (const x of [-0.22, 0.22]) add(g, cyl(0.1, 0.1, 0.07, 20), dark, x, 0.1, -0.27, 0, 0, Math.PI / 2);
  add(g, cyl(0.02, 0.02, 0.5, 8), mat(STEEL, { m: 0.8, r: 0.3 }), 0, 0.1, -0.27, 0, 0, Math.PI / 2);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.4), mat('#ffffff', { map: recycleTex(), t: 1, r: 0.6 }));
  s.position.set(0, 0.62, 0.352); s.rotation.x = -0.05; g.add(s);
  return g;
}

// ------------------------------------------------------------------
//  Contenedor grande (verde, azul o amarillo): cuerpo con nervios, tapas, ranura y ruedas
// ------------------------------------------------------------------
export function contenedor(color = '#2e8b3e') {
  const g = new THREE.Group(), m = mat(color, { r: 0.5, m: 0.15 }), dark = mat('#1a1d21', { r: 0.8 });
  const darker = mat(new THREE.Color(color).multiplyScalar(0.8).getStyle(), { r: 0.5 });
  add(g, taperBox('cont', 1.5, 1.0, 1.0, 0.06, 1.06), m, 0, 0.72, 0);
  for (const x of [-0.5, 0, 0.5]) add(g, rbox(0.07, 0.95, 0.05, 0.02), darker, x * 1.02, 0.72, 0.53); // nervios
  add(g, rbox(1.62, 0.07, 0.25, 0.03), m, 0, 1.24, -0.4);                                              // bisagra
  for (const x of [-0.38, 0.38]) {
    add(g, rbox(0.76, 0.06, 0.92, 0.03), m, x, 1.3, 0.05, 0.12);                                         // tapa
    for (const z of [-0.15, 0.2]) add(g, rbox(0.66, 0.025, 0.05, 0.012), darker, x, 1.35 - z * 0.12, 0.05 + z, 0.12);
  }
  add(g, rbox(0.34, 0.12, 0.04, 0.03), dark, -0.48, 1.0, 0.535);                                       // ranura
  for (const x of [-0.6, 0.6]) for (const z of [-0.36, 0.36]) {
    add(g, rbox(0.12, 0.1, 0.12, 0.02), mat(STEEL, { m: 0.7, r: 0.35 }), x, 0.2, z);
    add(g, cyl(0.075, 0.075, 0.05, 18), dark, x, 0.09, z, 0, 0, Math.PI / 2);
  }
  return g;
}

// ------------------------------------------------------------------
//  Parada de autobús: estructura de perfiles, cristales, techo, panel publicitario
//  iluminado y banco de madera
// ------------------------------------------------------------------
const adTex = () => canvasTex('busAd', 256, 512, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#3a7bd5'); gr.addColorStop(1, '#1e4fa0');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.strokeStyle = 'rgba(255,255,255,0.85)'; c.lineWidth = 6;
  c.beginPath(); c.arc(w / 2, h * 0.42, 60, 0, Math.PI * 2); c.stroke();
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.beginPath(); c.moveTo(w / 2 - 20, h * 0.42 - 35); c.lineTo(w / 2 + 40, h * 0.42); c.lineTo(w / 2 - 20, h * 0.42 + 35); c.fill();
  c.font = 'bold 40px sans-serif'; c.textAlign = 'center'; c.fillText('ROOKTOWN', w / 2, h * 0.75);
});
export function paradaBus() {
  const g = new THREE.Group(), frame = mat('#1f2a3a', { r: 0.4, m: 0.6 }), glass = mat('#bfe0f2', { t: 0.28, r: 0.05, m: 0.2 });
  const W = 3.2, D = 1.3, H = 2.45;
  for (const x of [-W / 2, 0, W / 2]) add(g, rbox(0.08, H, 0.08, 0.02), frame, x, H / 2, -D / 2 + 0.05);
  for (const x of [-W / 2, W / 2]) add(g, rbox(0.08, H, 0.08, 0.02), frame, x, H / 2, D / 2 - 0.08);
  for (const z of [-D / 2 - 0.05, D / 2 + 0.05]) add(g, rbox(W + 0.3, 0.08, 0.08, 0.02), frame, 0, H + 0.02, z); // techo: marco
  for (const x of [-W / 2 - 0.1, 0, W / 2 + 0.1]) add(g, rbox(0.08, 0.08, D + 0.18, 0.02), frame, x, H + 0.02, 0);
  add(g, rbox(W + 0.2, 0.025, D + 0.1, 0.01), mat('#7fb2d6', { t: 0.55, r: 0.05, m: 0.3 }), 0, H + 0.05, 0); // cubierta de cristal
  for (const x of [-W / 4, W / 4]) add(g, rbox(W / 2 - 0.1, H - 0.4, 0.02, 0.005), glass, x, H / 2 + 0.15, -D / 2 + 0.05);
  add(g, rbox(W - 0.1, 0.06, 0.06, 0.02), frame, 0, H - 0.25, -D / 2 + 0.05);
  add(g, rbox(W - 0.1, 0.06, 0.06, 0.02), frame, 0, 0.3, -D / 2 + 0.05);
  // panel publicitario en el lateral izquierdo (iluminado)
  add(g, rbox(0.12, H - 0.25, D - 0.15, 0.02), frame, -W / 2, H / 2, 0);
  const ad = new THREE.Mesh(new THREE.PlaneGeometry(D - 0.3, H - 0.5), mat('#ffffff', { map: adTex(), e: '#ffffff', ei: 0.15, r: 0.4 }));
  ad.position.set(-W / 2 + 0.065, H / 2, 0); ad.rotation.y = Math.PI / 2; g.add(ad);
  // banco
  for (const x of [-0.9, 0.9]) add(g, rbox(0.05, 0.42, 0.3, 0.01), frame, x, 0.25, -D / 2 + 0.25);
  add(g, rbox(2.2, 0.05, 0.38, 0.015), mat('#b8743f', { r: 0.7 }), 0, 0.48, -D / 2 + 0.28);
  return g;
}

// ------------------------------------------------------------------
//  Vallas: barandilla de tubos y valla de malla
// ------------------------------------------------------------------
export function valla(len = 2) {
  const g = new THREE.Group(), m = mat('#7d858e', { r: 0.35, m: 0.7 });
  for (const y of [0.12, 0.95]) add(g, cyl(0.025, 0.025, len, 10), m, 0, y, 0, 0, 0, Math.PI / 2);
  for (const x of [-len / 2, len / 2]) {
    add(g, cyl(0.032, 0.032, 1.0, 10), m, x, 0.5, 0);
    add(g, rbox(0.06, 0.03, 0.42, 0.01), m, x, 0.015, 0);
  }
  const n = Math.round(len / 0.2);
  for (let i = 1; i < n; i++) add(g, cyl(0.013, 0.013, 0.83, 8), m, -len / 2 + (i * len) / n, 0.535, 0);
  return g;
}
const meshTex = () => canvasTex('mesh', 128, 128, (c, w) => {
  c.clearRect(0, 0, w, w); c.strokeStyle = '#c8ced4'; c.lineWidth = 3;
  for (let i = -w; i < w * 2; i += 16) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + w, w); c.stroke(); c.beginPath(); c.moveTo(i + w, 0); c.lineTo(i, w); c.stroke(); }
});
export function vallaMalla(len = 2) {
  const g = new THREE.Group(), m = mat('#7d858e', { r: 0.35, m: 0.7 });
  for (const y of [0.1, 1.05]) add(g, cyl(0.025, 0.025, len, 10), m, 0, y, 0, 0, 0, Math.PI / 2);
  for (const x of [-len / 2, len / 2]) { add(g, cyl(0.03, 0.03, 1.12, 10), m, x, 0.56, 0); add(g, rbox(0.06, 0.03, 0.42, 0.01), m, x, 0.015, 0); }
  const t = meshTex().clone(); t.needsUpdate = true; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(len * 4, 4);
  const p = new THREE.Mesh(new THREE.PlaneGeometry(len, 0.95), mat('#ffffff', { map: t, alphaTest: 0.4, side: THREE.DoubleSide, r: 0.4, m: 0.6 }));
  p.position.y = 0.575; g.add(p);
  return g;
}

// ------------------------------------------------------------------
//  Barrera de obra: tablero a franjas rojas y blancas, patas en A y dos balizas
// ------------------------------------------------------------------
const stripeTex = () => canvasTex('stripes', 256, 64, (c, w, h) => {
  c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#e03a2f';
  for (let x = -h; x < w + h; x += 48) { c.beginPath(); c.moveTo(x, h); c.lineTo(x + 24, h); c.lineTo(x + 24 + h, 0); c.lineTo(x + h, 0); c.fill(); }
});
export function barrera() {
  const g = new THREE.Group(), m = mat('#6f7780', { r: 0.4, m: 0.6 });
  const lean = Math.atan2(0.3, 0.95), legL = Math.hypot(0.3, 0.95);
  for (const x of [-0.62, 0.62]) {
    for (const sz of [-1, 1]) add(g, cyl(0.024, 0.024, legL, 10), m, x, 0.475, sz * 0.15, -sz * lean);   // patas en A
    add(g, cyl(0.02, 0.02, 0.62, 8), m, x, 0.03, 0, Math.PI / 2);                                       // pie
    add(g, cyl(0.016, 0.016, 0.36, 8), m, x, 0.35, 0, Math.PI / 2);                                     // travesaño
    add(g, rbox(0.07, 0.07, 0.07, 0.015), m, x, 0.95, 0);                                               // cabeza
  }
  add(g, cyl(0.016, 0.016, 1.24, 8), m, 0, 0.35, 0.0, 0, 0, Math.PI / 2);                                // travesaño largo
  add(g, rbox(1.5, 0.24, 0.04, 0.015), mat('#ffffff', { map: stripeTex(), r: 0.5 }), 0, 0.85, 0.02);
  for (const x of [-0.45, 0.45]) {
    add(g, rbox(0.14, 0.08, 0.08, 0.02), mat('#2b2e33'), x, 1.0, 0.02);
    add(g, rbox(0.12, 0.06, 0.07, 0.02), mat('#ffc21a', { e: '#ffb000', ei: 0.4, r: 0.3, glow: 'beacon' }), x, 1.07, 0.02);
  }
  return g;
}

// ------------------------------------------------------------------
//  Cono: base cuadrada negra, cono naranja con dos franjas reflectantes
// ------------------------------------------------------------------
export function cono() {
  const g = new THREE.Group();
  add(g, rbox(0.38, 0.04, 0.38, 0.03), mat('#1d1f22', { r: 0.8 }), 0, 0.02, 0);
  const prof = (a, b) => [[0.15 - a * 0.12, a * 0.7], [0.15 - b * 0.12, b * 0.7]];
  const band = (k, a, b, c) => add(g, lathe('cono' + k, [[0, a * 0.7], ...prof(a, b), [0, b * 0.7]], 24), mat(c, { r: 0.45 }), 0, 0.04, 0);
  band('a', 0, 0.38, '#ff5a1f'); band('b', 0.38, 0.5, '#f2f2f2'); band('c', 0.5, 0.64, '#ff5a1f'); band('d', 0.64, 0.74, '#f2f2f2'); band('e', 0.74, 1, '#ff5a1f');
  return g;
}

// ------------------------------------------------------------------
//  Bolardos: negro con cabeza redondeada; el luminoso lleva una franja que brilla
// ------------------------------------------------------------------
export function bolardo(luz = false) {
  const g = new THREE.Group(), m = mat('#1e2124', { r: 0.35, m: 0.5 });
  add(g, lathe('bolardo', [[0, 0], [0.12, 0], [0.12, 0.03], [0.1, 0.05], [0.1, 0.82], [0.11, 0.84], [0.11, 0.87], [0.1, 0.9], [0.06, 0.96], [0, 0.98]], 24), m);
  if (luz) { add(g, cyl(0.104, 0.104, 0.1, 24), mat('#ffe7a6', { e: '#ffc85a', ei: 1.6, r: 0.3, glow: 'lamp' }), 0, 0.88, 0); add(g, cyl(0.07, 0.11, 0.06, 24), mat('#1e2124', { r: 0.35, m: 0.5 }), 0, 0.96, 0); }
  return g;
}

// ------------------------------------------------------------------
//  Cajero automático de calle: columna con rótulo azul, pantalla, teclado, ranuras
// ------------------------------------------------------------------
const atmScreenTex = () => canvasTex('atmScreen', 256, 192, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#4fb3ff'); gr.addColorStop(1, '#1565c0');
  c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = 'rgba(255,255,255,0.9)'; c.font = 'bold 26px sans-serif'; c.fillText('ROOK BANK', 18, 40);
  c.fillStyle = 'rgba(255,255,255,0.75)'; for (let i = 0; i < 3; i++) c.fillRect(18, 70 + i * 34, 150, 20);
  c.beginPath(); c.moveTo(w - 30, h - 60); c.lineTo(w - 70, h - 20); c.lineTo(w - 30, h - 20); c.fill();
});
const atmSignTex = () => canvasTex('atmSign', 256, 64, (c, w, h) => {
  c.fillStyle = '#1565c0'; c.fillRect(0, 0, w, h);
  c.fillStyle = '#ffffff'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('CAJERO', w / 2, h / 2 + 2);
});
export function cajero() {
  const g = new THREE.Group(), body = mat('#c9cfd5', { r: 0.35, m: 0.45 }), side = mat('#9aa2ab', { r: 0.4, m: 0.5 }), dark = mat('#22262b', { r: 0.4, m: 0.3 });
  add(g, rbox(0.78, 0.1, 0.7, 0.03), side, 0, 0.05, 0);                                  // zócalo
  add(g, rbox(0.74, 1.72, 0.62, 0.05), body, 0, 0.96, -0.02);                             // columna
  add(g, rbox(0.06, 1.7, 0.66, 0.03), side, -0.39, 0.96, 0); add(g, rbox(0.06, 1.7, 0.66, 0.03), side, 0.39, 0.96, 0);
  add(g, rbox(0.8, 0.26, 0.68, 0.04), body, 0, 1.93, 0.01);                                 // cabecera
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.15), mat('#ffffff', { map: atmSignTex(), e: '#ffffff', ei: 0.45, r: 0.4, glow: 'sign' }));
  sign.position.set(0, 1.94, 0.352); g.add(sign);
  // hueco de la pantalla con visera
  add(g, rbox(0.56, 0.46, 0.08, 0.03), dark, 0, 1.47, 0.27);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.44, 0.33), mat('#ffffff', { map: atmScreenTex(), e: '#ffffff', ei: 0.55, r: 0.2, glow: 'screen' }));
  scr.position.set(0, 1.47, 0.315); scr.rotation.x = -0.1; g.add(scr);
  add(g, rbox(0.62, 0.05, 0.16, 0.02), side, 0, 1.73, 0.33);                                // visera
  // repisa inclinada con teclado y lector de tarjetas
  add(g, rbox(0.62, 0.05, 0.24, 0.02), side, 0, 1.12, 0.36, 0.35);
  const kp = new THREE.Group(); kp.position.set(-0.08, 1.15, 0.38); kp.rotation.x = 0.35; g.add(kp);
  add(kp, rbox(0.22, 0.02, 0.15, 0.008), dark, 0, 0, 0);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) add(kp, rbox(0.05, 0.015, 0.028, 0.006), mat(r === 3 && c !== 1 ? (c ? '#2ecc71' : '#e74c3c') : '#d9dde1', { r: 0.4 }), -0.06 + c * 0.06, 0.012, -0.05 + r * 0.034);
  add(g, rbox(0.12, 0.08, 0.06, 0.015), dark, 0.18, 1.2, 0.35);                             // lector de tarjetas
  add(g, rbox(0.07, 0.005, 0.03, 0.002), mat('#2ecc71', { e: '#2ecc71', ei: 0.8 }), 0.18, 1.245, 0.38);
  add(g, rbox(0.34, 0.05, 0.05, 0.015), dark, 0, 0.9, 0.3);                                 // ranura de billetes
  add(g, rbox(0.5, 0.36, 0.02, 0.01), mat('#b8bfc6', { r: 0.4, m: 0.5 }), 0, 0.5, 0.3);      // puerta inferior
  add(g, rbox(0.12, 0.03, 0.02, 0.01), dark, 0, 0.62, 0.315);
  return g;
}

export const STREET_KIT = [
  ['Farola', farola], ['Semáforo', () => semaforo('all')], ['Banco', () => banco(1.8)], ['Banco largo', () => banco(2.6)],
  ['Papelera', papelera], ['Papelera reciclaje', () => cuboReciclaje()], ['Parada de autobús', paradaBus],
  ['Valla', () => valla()], ['Valla metálica', () => vallaMalla()], ['Barrera', barrera], ['Cono', cono],
  ['Bolardo', () => bolardo(false)], ['Bolardo luminoso', () => bolardo(true)],
  ['Contenedor', () => contenedor('#2e8b3e')], ['Contenedor azul', () => contenedor('#1f56c9')], ['Contenedor amarillo', () => contenedor('#f2b316')],
  ['Cajero', cajero],
];

// ==================================================================
//  Segunda tanda: vegetación, mobiliario y equipamiento
// ==================================================================
// Textura de hojas: cientos de hojitas en varios verdes sobre fondo oscuro
const leafTex = () => canvasTex('hojas', 256, 256, (c, w) => {
  c.fillStyle = '#3d7228'; c.fillRect(0, 0, w, w);
  let s0 = 17; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let k = 0; k < 900; k++) {
    const x = rnd() * w, y = rnd() * w, a = rnd() * Math.PI, l = 7 + rnd() * 7;
    c.fillStyle = `hsl(${95 + rnd() * 25},${45 + rnd() * 20}%,${22 + rnd() * 30}%)`;
    for (const dx of [-w, 0, w]) for (const dy of [-w, 0, w]) { c.beginPath(); c.ellipse(x + dx, y + dy, l, l * 0.42, a, 0, Math.PI * 2); c.fill(); }
  }
});
const hash3 = (x, y, z) => { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); };
// Copa vegetal: esfera con bultos (vértices soldados, sin grietas) y textura de hojas
function foliageGeo(key, r, seed) {
  return cache('fo' + key, () => {
    let geo = new THREE.IcosahedronGeometry(r, 4);
    geo.deleteAttribute('normal'); geo.deleteAttribute('uv');
    geo = mergeVertices(geo);
    const p = geo.attributes.position, col = [], uv = [];
    let s0 = seed * 97 + 13;
    const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    const bumps = Array.from({ length: 16 }, () => new THREE.Vector3(rnd() - 0.5, rnd() - 0.5 + 0.15, rnd() - 0.5).normalize());
    const v = new THREE.Vector3(), c = new THREE.Color();
    for (let i = 0; i < p.count; i++) {
      v.fromBufferAttribute(p, i).normalize();
      let k = 0; for (const b of bumps) k += Math.max(0, v.dot(b) - 0.8) * 2.2;
      const n = 0.92 + k * 0.4 + (hash3(v.x * 9, v.y * 9, v.z * 9) - 0.5) * 0.08;
      p.setXYZ(i, v.x * r * n, v.y * r * n * 0.9, v.z * r * n);
      const l = 0.6 + v.y * 0.2 + k * 0.05; c.setRGB(l, l, l * 0.9);
      col.push(c.r, c.g, c.b);
      uv.push((Math.atan2(v.z, v.x) / Math.PI + 1) * 2 * r, (v.y + 1) * 2 * r);
    }
    geo.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.computeVertexNormals();
    return geo;
  });
}
const leafMat = () => { const t = leafTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping; return mat('#b8d89a', { r: 0.9, vc: true, map: t }); };
// Racimo de hojas recortadas (fondo transparente) para las tarjetas que visten la copa
const leafCardTex = () => canvasTex('racimo', 256, 256, (c, w) => {
  let s0 = 29; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (let k = 0; k < 160; k++) {
    const a = rnd() * Math.PI * 2, d = Math.sqrt(rnd()) * (w * 0.4), x = w / 2 + Math.cos(a) * d, y = w / 2 + Math.sin(a) * d;
    const l = 10 + rnd() * 9, ang = a + (rnd() - 0.5) * 1.2, li = 36 + rnd() * 26 - (d / w) * 8;
    c.save(); c.translate(x, y); c.rotate(ang);
    c.fillStyle = `hsl(${92 + rnd() * 22},${55 + rnd() * 20}%,${li}%)`;
    c.beginPath(); c.moveTo(-l, 0); c.quadraticCurveTo(0, -l * 0.55, l, 0); c.quadraticCurveTo(0, l * 0.55, -l, 0); c.fill();
    c.strokeStyle = `hsla(90,40%,${li + 14}%,0.6)`; c.lineWidth = 1; c.beginPath(); c.moveTo(-l * 0.8, 0); c.lineTo(l * 0.8, 0); c.stroke();
    c.restore();
  }
});
const cardMat = () => mat('#ffffff', { r: 0.85, vc: true, map: leafCardTex(), alphaTest: 0.5, side: THREE.DoubleSide });
// Une muchas tarjetas de hojas en una sola malla; la normal de cada tarjeta apunta hacia
// fuera de la copa para que la luz la sombree como un volumen y no como planos sueltos
function cardsGeo(key, items) {
  return cache('cards' + key, () => {
    const parts = [], q = new THREE.Quaternion(), z = new THREE.Vector3(0, 0, 1), m4 = new THREE.Matrix4();
    for (const { pos, dir, size, twist, shade } of items) {
      const pg = new THREE.PlaneGeometry(size, size);
      q.setFromUnitVectors(z, dir); const tw = new THREE.Quaternion().setFromAxisAngle(dir, twist); q.premultiply(tw);
      m4.compose(pos, q, new THREE.Vector3(1, 1, 1)); pg.applyMatrix4(m4);
      const n = pg.attributes.normal, col = [];
      for (let i = 0; i < n.count; i++) { n.setXYZ(i, dir.x, dir.y, dir.z); col.push(shade, shade, shade); }
      pg.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      parts.push(pg);
    }
    return mergeGeometries(parts);
  });
}
function bushCards(r, seed) {
  let s0 = seed * 131 + 7; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  const items = [], N = Math.round(60 + r * 50);
  for (let k = 0; k < N; k++) {
    const dir = new THREE.Vector3(rnd() * 2 - 1, rnd() * 2 - 0.75, rnd() * 2 - 1).normalize();
    const d = r * (0.78 + rnd() * 0.22);
    items.push({ pos: dir.clone().multiplyScalar(d).multiply(new THREE.Vector3(1, 0.9, 1)), dir, size: r * (0.85 + rnd() * 0.4), twist: rnd() * 6.28, shade: 0.82 + Math.max(0, dir.y) * 0.3 + rnd() * 0.1 });
  }
  return items;
}
function bush(g, x, y, z, r, seed) {
  add(g, foliageGeo(`${r}-${seed}`, r * 0.74, seed), leafMat(), x, y, z, 0, seed, 0);
  add(g, cardsGeo(`${r}-${seed}`, bushCards(r, seed)), cardMat(), x, y, z, 0, seed, 0);
}

// Macetero de hormigón con arbustos
export function macetero() {
  const g = new THREE.Group(), m = mat('#8e9399', { r: 0.85 });
  add(g, taperBox('macetero', 1.2, 0.5, 0.6, 0.04, 1.06), m, 0, 0.27, 0);
  add(g, rbox(1.32, 0.06, 0.7, 0.025), mat('#a3a8ae', { r: 0.8 }), 0, 0.53, 0);
  add(g, rbox(1.12, 0.04, 0.52, 0.01), mat('#4a3626', { r: 1 }), 0, 0.52, 0);
  for (const [x, z, r, s] of [[-0.3, 0, 0.3, 3], [0.3, 0.03, 0.32, 7], [0, -0.08, 0.26, 11]]) bush(g, x, 0.68 + r * 0.3, z, r, s);
  return g;
}

// Palmera: tronco curvo anillado y hojas con foliolos
const frondTex = () => canvasTex('fronda2', 1024, 256, (c, w, h) => {
  // foliolos largos y apretados a ambos lados del nervio, inclinados hacia la punta y
  // más cortos al final; dos tonos por foliolo (haz claro, borde oscuro) para que se lea la hoja
  let s0 = 3; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  const N = 150;
  for (let pass = 0; pass < 2; pass++) for (let k = 0; k < N; k++) {
    const t = k / N, x = 10 + t * (w - 30);
    const L = (h / 2 - 6) * (0.35 + 0.65 * Math.sin(Math.min(1, t * 1.25 + 0.08) * Math.PI)) * (0.9 + rnd() * 0.15);
    for (const sd of [-1, 1]) {
      const tipX = x + 34 + L * 0.35, tipY = h / 2 + sd * L, wd = 5 + (1 - t) * 3;
      const li = 30 + rnd() * 10 + t * 6;
      c.fillStyle = pass === 0 ? `hsl(${102 + rnd() * 10},60%,${li - 10}%)` : `hsl(${100 + rnd() * 14},${58 + rnd() * 12}%,${li}%)`;
      const sh = pass === 0 ? 1.4 : 1;
      c.beginPath(); c.moveTo(x - wd * sh, h / 2);
      c.quadraticCurveTo(x + 14, h / 2 + sd * L * 0.45 - sd * wd * sh, tipX, tipY);
      c.quadraticCurveTo(x + 6, h / 2 + sd * L * 0.5 + sd * wd * sh, x + wd * sh, h / 2); c.fill();
    }
  }
  const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#9aa456'); gr.addColorStop(1, '#6f8a3a');
  c.strokeStyle = gr; c.lineWidth = 7; c.beginPath(); c.moveTo(0, h / 2); c.lineTo(w - 20, h / 2); c.stroke();
});
// Hoja de palmera: tira arqueada con sección en V (los foliolos caen hacia los lados)
function frondGeo2(L = 3.1) {
  return cache('frond4' + L, () => {
    const pos = [], uv = [], idx = [], S = [-1, -0.5, 0, 0.5, 1], C = S.length;
    const N = 20;
    for (let i = 0; i <= N; i++) {
      const t = i / N, x = t * L, y = 0.7 * Math.sin(t * Math.PI * 0.7) - t * t * 1.35;
      const w = 0.85 * (0.55 + 0.45 * Math.sin(Math.min(1, t * 1.25 + 0.08) * Math.PI));
      for (const sd of S) { pos.push(x + Math.abs(sd) * 0.12 * w, y - sd * sd * (0.08 + t * 0.12) * w, sd * w); uv.push(t, (sd + 1) / 2); }
      if (i < N) for (let j = 0; j < C - 1; j++) { const a = i * C + j; idx.push(a, a + 1, a + C, a + 1, a + C + 1, a + C); }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  });
}
export function palmera(h = 6) {
  const g = new THREE.Group(), bark = mat('#9a6b43', { r: 0.9 }), ring = mat('#7d5636', { r: 0.9 });
  const pts = [[0, 0, 0], [0.08, h * 0.35, 0], [0.3, h * 0.7, 0], [0.55, h, 0]];
  const tc = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  const tg = cache('palmTronco' + h, () => { const t = new THREE.TubeGeometry(tc, 30, 1, 12, false); const p = t.attributes.position;
    // el tubo se estrecha hacia arriba: escala la distancia al eje según la altura
    for (let i = 0; i < p.count; i++) { const y = p.getY(i), c = tc.getPoint(Math.min(1, Math.max(0, y / h))), rr = 0.28 - (y / h) * 0.12; p.setX(i, c.x + (p.getX(i) - c.x) * rr); p.setZ(i, c.z + (p.getZ(i) - c.z) * rr); }
    t.computeVertexNormals(); return t; });
  add(g, tg, bark);
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)));
  for (let k = 1; k < 22; k++) { const p = curve.getPoint(k / 22), rr = 0.3 - (k / 22) * 0.12; add(g, cyl(rr, rr - 0.02, 0.07, 14), ring, p.x, p.y, p.z, 0, 0, -0.05 - k * 0.005); }
  const top = curve.getPoint(1);
  // capitel: base de las hojas, más ancha que el tronco
  add(g, lathe('palmCapitel', [[0, 0], [0.2, 0], [0.27, 0.15], [0.24, 0.35], [0.12, 0.5], [0, 0.55]], 16), mat('#7a6a3a', { r: 0.9 }), top.x, top.y - 0.25, top.z);
  const fm = mat('#ffffff', { r: 0.75, map: frondTex(), alphaTest: 0.45, side: THREE.DoubleSide });
  const dry = mat('#c49a5c', { r: 0.9, map: frondTex(), alphaTest: 0.45, side: THREE.DoubleSide });
  // tres pisos de hojas: las de arriba se levantan, las del medio abren y las de abajo cuelgan
  const tiers = [[6, 0.75, 2.5, 0.1], [9, 0.3, 3.2, 0.6], [9, 0.0, 3.3, 0.25]];
  for (const [n, pitch, L, off] of tiers) for (let k = 0; k < n; k++)
    add(g, frondGeo2(L), fm, top.x, top.y + 0.1, top.z, 0.15 * Math.sin(k * 2.3), (k / n) * Math.PI * 2 + off, pitch + 0.12 * Math.sin(k * 1.7));
  for (let k = 0; k < 3; k++) add(g, frondGeo2(1.8), dry, top.x, top.y - 0.15, top.z, 0, k * 2.1 + 0.4, -0.75);
  const coco = mat('#5e4126', { r: 0.7 });
  for (let k = 0; k < 6; k++) add(g, sph(0.13, 12, 10), coco, top.x + Math.cos(k * 1.05) * 0.24, top.y - 0.2 - (k % 2) * 0.1, top.z + Math.sin(k * 1.05) * 0.24);
  return g;
}

// Árbol de hoja: tronco con ramas y copa de varios racimos
export function arbol() {
  const g = new THREE.Group(), bark = mat('#7a5534', { r: 0.95 });
  add(g, tube('arbolTronco', [[0, 0, 0], [0.05, 1.0, 0], [-0.05, 1.9, 0.03], [0, 2.4, 0]], 0.16, 16), bark);
  add(g, tube('rama1', [[0, 1.6, 0], [0.4, 2.1, 0.1], [0.7, 2.4, 0.15]], 0.07, 10), bark);
  add(g, tube('rama2', [[0, 1.8, 0], [-0.4, 2.2, -0.1], [-0.65, 2.5, -0.2]], 0.07, 10), bark);
  add(g, lathe('raices', [[0, 0], [0.32, 0], [0.2, 0.12], [0.16, 0.3], [0, 0.3]], 12), bark);
  for (const [x, y, z, r, s] of [[0, 3.2, 0, 1.05, 21], [0.85, 2.85, 0.2, 0.72, 22], [-0.85, 2.9, -0.15, 0.75, 23], [0.15, 2.75, 0.8, 0.7, 24], [-0.1, 2.8, -0.8, 0.7, 25], [0.35, 3.85, 0.15, 0.62, 26], [-0.45, 3.7, 0.3, 0.55, 27], [0.6, 2.55, -0.55, 0.5, 28], [-0.6, 2.5, 0.55, 0.5, 29]]) bush(g, x, y, z, r, s);
  return g;
}

// Seto recortado: bloque redondeado con superficie irregular de hojas
export function seto(len = 2) {
  const g = new THREE.Group();
  const geo = cache('seto' + len, () => {
    let b = new RoundedBoxGeometry(len, 0.9, 0.7, 8, 0.2);
    b.deleteAttribute('normal'); b.deleteAttribute('uv');
    b = mergeVertices(b, 1e-4);
    const p = b.attributes.position, uv = [], col = [];
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = 1 + (hash3(x * 6, y * 6, z * 6) - 0.5) * 0.07;
      p.setXYZ(i, x * (1 + (n - 1) / len), y * n, z * n);
      uv.push((x + z) * 1.3, (y + (Math.abs(z) > 0.3 ? 0 : z)) * 1.3);
      const l = 0.8 + y * 0.3; col.push(l, l, l * 0.92);
    }
    b.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    b.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
    b.computeVertexNormals();
    return b;
  });
  add(g, geo, leafMat(), 0, 0.45, 0);
  const cards = cardsGeo('seto' + len, (() => {
    let s0 = 41; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    const items = [], hw = len / 2, hd = 0.35;
    for (let k = 0; k < Math.round(len * 70); k++) {
      // cara al azar ponderada por superficie: arriba, delante/detrás, laterales
      const f = rnd(), pos = new THREE.Vector3(), dir = new THREE.Vector3();
      if (f < 0.4) { pos.set((rnd() * 2 - 1) * hw * 0.95, 0.9, (rnd() * 2 - 1) * hd * 0.9); dir.set((rnd() - 0.5) * 0.4, 1, (rnd() - 0.5) * 0.4); }
      else if (f < 0.88) { const sd = rnd() < 0.5 ? -1 : 1; pos.set((rnd() * 2 - 1) * hw * 0.95, 0.12 + rnd() * 0.75, sd * hd); dir.set((rnd() - 0.5) * 0.4, 0.25, sd); }
      else { const sd = rnd() < 0.5 ? -1 : 1; pos.set(sd * hw, 0.12 + rnd() * 0.75, (rnd() * 2 - 1) * hd * 0.9); dir.set(sd, 0.25, (rnd() - 0.5) * 0.4); }
      dir.normalize(); pos.addScaledVector(dir, 0.03);
      items.push({ pos, dir, size: 0.28 + rnd() * 0.12, twist: rnd() * 6.28, shade: 0.78 + (pos.y / 0.9) * 0.35 });
    }
    return items;
  })());
  add(g, cards, cardMat());
  return g;
}

// Caja de madera: tablas, marco y aspas en X
export function cajaMadera(s = 0.9) {
  const planks = canvasTex('tablas', 128, 128, (c, w) => { c.fillStyle = '#d08d57'; c.fillRect(0, 0, w, w); for (let k = 0; k < 5; k++) { c.fillStyle = k % 2 ? '#c98450' : '#d6955f'; c.fillRect(0, k * 25.6 + 1, w, 24); c.fillStyle = '#9c6136'; c.fillRect(0, k * 25.6, w, 1.6); } c.globalAlpha = 0.15; c.strokeStyle = '#7a4a28'; for (let k = 0; k < 40; k++) { const y = (k * 37) % w; c.beginPath(); c.moveTo(0, y); c.bezierCurveTo(40, y + 3, 80, y - 3, w, y + 1); c.stroke(); } });
  const g = new THREE.Group(), wood = mat('#ffffff', { r: 0.85, map: planks }), dark = mat('#b0703f', { r: 0.85 });
  add(g, rbox(s * 0.96, s * 0.96, s * 0.96, 0.01, 1), wood, 0, s / 2, 0);
  const e = s * 0.09;
  for (const [ax, ay, az] of [[1, 0, 0], [0, 0, 1]]) for (const sg of [-1, 1]) {
    // marco de cada cara frontal/trasera y lateral
    const off = sg * (s / 2 + 0.005);
    const px = az ? 0 : off, pz = az ? off : 0;
    const ry = az ? 0 : Math.PI / 2;
    const f = new THREE.Group(); f.position.set(px, s / 2, pz); f.rotation.y = ry; g.add(f);
    for (const y of [-1, 1]) add(f, rbox(s, e, 0.03, 0.006), dark, 0, (y * (s - e)) / 2, 0);
    for (const x of [-1, 1]) add(f, rbox(e, s, 0.03, 0.006), dark, (x * (s - e)) / 2, 0, 0);
    add(f, rbox(s * 1.25, e * 0.9, 0.025, 0.006), dark, 0, 0, 0.004, 0, 0, Math.PI / 4);
    add(f, rbox(s * 1.25, e * 0.9, 0.025, 0.006), dark, 0, 0, 0.008, 0, 0, -Math.PI / 4);
  }
  return g;
}

// Caja eléctrica: armario metálico de dos puertas con rejilla y placa
export function cajaElectrica() {
  const g = new THREE.Group(), m = mat('#a7adb3', { r: 0.4, m: 0.45 }), d = mat('#7f868d', { r: 0.4, m: 0.5 });
  add(g, rbox(1.05, 0.12, 0.5, 0.02), mat('#6a7076', { r: 0.7 }), 0, 0.06, 0);
  add(g, rbox(1.0, 1.35, 0.45, 0.03), m, 0, 0.8, 0);
  add(g, rbox(1.08, 0.06, 0.53, 0.02), d, 0, 1.5, 0);
  for (const x of [-0.25, 0.25]) {
    add(g, rbox(0.47, 1.25, 0.02, 0.01), mat('#b5bbc1', { r: 0.4, m: 0.45 }), x, 0.8, 0.232);
    add(g, rbox(0.03, 0.14, 0.03, 0.01), mat('#3a3f45'), x + (x < 0 ? 0.19 : -0.19), 0.85, 0.25);
  }
  for (let k = 0; k < 5; k++) add(g, rbox(0.3, 0.015, 0.02, 0.005), d, 0.25, 0.32 + k * 0.04, 0.245);
  const plate = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.12), mat('#ffd400', { r: 0.5 })); plate.position.set(-0.25, 1.15, 0.245); g.add(plate);
  return g;
}

// Hidrante rojo
export function hidrante() {
  const g = new THREE.Group(), m = mat('#d62d20', { r: 0.4, m: 0.2 });
  add(g, lathe('hidrante', [[0, 0], [0.2, 0], [0.2, 0.05], [0.15, 0.08], [0.14, 0.55], [0.17, 0.57], [0.17, 0.62], [0.13, 0.66], [0.12, 0.74], [0.07, 0.8], [0.04, 0.84], [0, 0.85]], 24), m);
  for (const s of [-1, 1]) { add(g, cyl(0.06, 0.07, 0.14, 14), m, s * 0.17, 0.42, 0, 0, 0, Math.PI / 2); add(g, cyl(0.07, 0.07, 0.03, 6), m, s * 0.245, 0.42, 0, 0, 0, Math.PI / 2); }
  add(g, cyl(0.08, 0.09, 0.12, 14), m, 0, 0.42, 0.16, Math.PI / 2);
  add(g, cyl(0.035, 0.035, 0.06, 5), m, 0, 0.87, 0);
  return g;
}

// Cabina telefónica roja con cristales a cuadros y teléfono dentro
export function cabinaTelefono() {
  const g = new THREE.Group(), red = mat('#cf2a22', { r: 0.4, m: 0.2 }), glass = mat('#d8ecf5', { t: 0.35, r: 0.05 });
  add(g, rbox(1.0, 0.1, 1.0, 0.03), red, 0, 0.05, 0);
  for (const x of [-0.45, 0.45]) for (const z of [-0.45, 0.45]) add(g, rbox(0.1, 2.3, 0.1, 0.02), red, x, 1.2, z);
  add(g, rbox(1.06, 0.3, 1.06, 0.04), red, 0, 2.45, 0);
  add(g, rbox(0.92, 0.08, 0.92, 0.04), red, 0, 2.64, 0);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.7, 0.14), mat('#ffffff', { map: canvasTex('tel', 256, 52, (c, w, h) => { c.fillStyle = '#111'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TELÉFONO', w / 2, h / 2 + 2); }), e: '#ffffff', ei: 0.4 }));
  sign.position.set(0, 2.45, 0.535); g.add(sign);
  // caras acristaladas con montantes (3 columnas × 6 filas)
  for (const [ry, ox, oz] of [[0, 0, 0.45], [Math.PI / 2, 0.45, 0], [-Math.PI / 2, -0.45, 0]]) {
    const f = new THREE.Group(); f.position.set(ox, 1.25, oz); f.rotation.y = ry; g.add(f);
    add(f, rbox(0.8, 2.0, 0.01, 0.003), glass, 0, 0, 0);
    for (let k = 1; k < 3; k++) add(f, rbox(0.03, 2.0, 0.03, 0.01), red, -0.4 + (k * 0.8) / 3, 0, 0);
    for (let k = 1; k < 6; k++) add(f, rbox(0.8, 0.03, 0.03, 0.01), red, 0, -1 + (k * 2) / 6, 0);
  }
  add(g, rbox(0.8, 2.1, 0.06, 0.02), red, 0, 1.25, -0.45);
  add(g, rbox(0.3, 0.42, 0.12, 0.03), mat('#2b2f35', { r: 0.4, m: 0.4 }), 0, 1.35, -0.38);
  for (let r = 0; r < 4; r++) for (let c = 0; c < 3; c++) add(g, rbox(0.05, 0.035, 0.02, 0.006), mat('#c9ced3'), -0.06 + c * 0.06, 1.42 - r * 0.05, -0.315);
  return g;
}

// Parada de taxi: poste amarillo con cartel TAXI y panel azul
export function paradaTaxi() {
  const g = new THREE.Group(), y = mat('#f2b705', { r: 0.4, m: 0.3 });
  add(g, rbox(0.8, 0.06, 0.4, 0.02), y, 0, 0.03, 0);
  for (const x of [-0.33, 0.33]) add(g, rbox(0.07, 1.9, 0.07, 0.02), y, x, 1.0, 0);
  const t = new THREE.Mesh(new THREE.PlaneGeometry(0.72, 0.32), mat('#ffffff', { map: canvasTex('taxi', 256, 112, (c, w, h) => { c.fillStyle = '#f2b705'; c.fillRect(0, 0, w, h); c.fillStyle = '#111'; c.font = 'bold 70px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('TAXI', w / 2, h / 2 + 4); }), r: 0.5 }));
  add(g, rbox(0.76, 0.36, 0.05, 0.02), y, 0, 1.78, 0); t.position.set(0, 1.78, 0.027); g.add(t);
  add(g, rbox(0.62, 1.0, 0.03, 0.01), mat('#1f56c9', { r: 0.5 }), 0, 1.03, 0);
  return g;
}

// Reloj de calle: pie torneado, columna y esfera doble
export function reloj() {
  const g = new THREE.Group(), m = mat('#3d434b', { r: 0.45, m: 0.4 });
  add(g, lathe('relojPie', [[0, 0], [0.38, 0], [0.38, 0.1], [0.3, 0.16], [0.26, 0.3], [0.18, 0.36], [0.15, 0.7], [0.19, 0.78], [0.19, 0.84], [0.12, 0.9], [0, 0.9]], 28), m);
  add(g, cyl(0.1, 0.12, 1.8, 18), m, 0, 1.75, 0);
  for (const y of [1.2, 2.3]) add(g, cyl(0.15, 0.15, 0.06, 18), m, 0, y, 0);
  add(g, lathe('relojCuello', [[0, 0], [0.12, 0], [0.16, 0.1], [0.1, 0.22], [0, 0.22]], 20), m, 0, 2.6, 0);
  const face = canvasTex('reloj', 256, 256, (c, w) => {
    c.fillStyle = '#f7f3e8'; c.beginPath(); c.arc(w / 2, w / 2, w / 2 - 4, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#222'; for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.fillRect(w / 2 + Math.sin(a) * 100 - 4, w / 2 - Math.cos(a) * 100 - 9, 8, 18); }
    c.lineWidth = 8; c.lineCap = 'round'; c.strokeStyle = '#222';
    c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 + 50, w / 2 - 30); c.stroke();
    c.lineWidth = 5; c.beginPath(); c.moveTo(w / 2, w / 2); c.lineTo(w / 2 - 15, w / 2 - 85); c.stroke();
  });
  add(g, cyl(0.36, 0.36, 0.2, 32), m, 0, 3.1, 0, Math.PI / 2);
  for (const s of [-1, 1]) {
    const f = new THREE.Mesh(new THREE.CircleGeometry(0.3, 32), mat('#ffffff', { map: face, r: 0.3, e: '#fff6e0', ei: 0.15 }));
    f.position.set(0, 3.1, s * 0.102); if (s < 0) f.rotation.y = Math.PI; g.add(f);
  }
  add(g, sph(0.06, 12, 8), m, 0, 3.5, 0);
  return g;
}

// Fuente de dos platos con agua
export function fuente() {
  const g = new THREE.Group(), st = mat('#c9cdd2', { r: 0.6 }), water = mat('#4fa8d8', { t: 0.8, r: 0.05, m: 0.1 });
  add(g, lathe('fuenteBase', [[0, 0], [1.3, 0], [1.35, 0.08], [1.35, 0.45], [1.25, 0.5], [1.18, 0.45], [1.18, 0.15], [0, 0.15]], 40), st);
  add(g, cyl(1.18, 1.18, 0.02, 40), water, 0, 0.4, 0);
  add(g, lathe('fuenteFuste', [[0, 0], [0.22, 0], [0.14, 0.2], [0.12, 0.8], [0.18, 0.9], [0, 0.9]], 20), st, 0, 0.15, 0);
  add(g, lathe('fuentePlato1', [[0, 0], [0.65, 0.12], [0.7, 0.2], [0.62, 0.22], [0, 0.12]], 32), st, 0, 1.0, 0);
  add(g, cyl(0.6, 0.6, 0.02, 32), water, 0, 1.2, 0);
  add(g, lathe('fuenteFuste2', [[0, 0], [0.1, 0], [0.08, 0.4], [0, 0.4]], 16), st, 0, 1.2, 0);
  add(g, lathe('fuentePlato2', [[0, 0], [0.35, 0.08], [0.38, 0.14], [0.32, 0.15], [0, 0.08]], 28), st, 0, 1.58, 0);
  add(g, lathe('fuenteRemate', [[0, 0], [0.08, 0], [0.12, 0.1], [0.06, 0.22], [0.03, 0.32], [0, 0.34]], 16), st, 0, 1.7, 0);
  for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; add(g, cyl(0.015, 0.03, 0.25, 6), mat('#bfe6ff', { t: 0.6 }), Math.cos(a) * 0.62, 1.05, Math.sin(a) * 0.62); }
  return g;
}

// Poste de madera con cruceta, aisladores y tirante
export function poste() {
  const g = new THREE.Group(), w = mat('#6e5038', { r: 0.95 }), m = mat('#4a4f55', { r: 0.4, m: 0.6 });
  add(g, cyl(0.16, 0.22, 7, 14), w, 0, 3.5, 0);
  add(g, rbox(2.0, 0.18, 0.18, 0.03), w, 0, 6.6, 0);
  add(g, rbox(1.3, 0.15, 0.15, 0.03), w, 0, 6.0, 0);
  for (const x of [-0.8, -0.35, 0.35, 0.8]) add(g, lathe('aislador', [[0, 0], [0.05, 0], [0.06, 0.04], [0.04, 0.08], [0.05, 0.11], [0, 0.14]], 12), mat('#e8e2d0', { r: 0.4 }), x, 6.66, 0);
  for (const s of [-1, 1]) add(g, cyl(0.02, 0.02, 0.7, 6), m, s * 0.25, 6.3, 0, 0, 0, s * 0.8);
  add(g, rbox(0.25, 0.35, 0.2, 0.03), mat('#8a9096', { r: 0.4, m: 0.5 }), 0.15, 5.4, 0);
  return g;
}

// Aparcabicis de arcos de acero
export function aparcabicis(n = 4) {
  const g = new THREE.Group(), m = mat('#c9cfd6', { r: 0.3, m: 0.35 });
  for (let k = 0; k < n; k++) {
    const x = (k - (n - 1) / 2) * 0.5;
    add(g, tube('arco', [[0, 0, -0.35], [0, 0.6, -0.35], [0, 0.8, -0.15], [0, 0.82, 0], [0, 0.8, 0.15], [0, 0.6, 0.35], [0, 0, 0.35]], 0.025, 30), m, x, 0, 0);
  }
  for (const z of [-0.35, 0.35]) add(g, cyl(0.02, 0.02, (n - 1) * 0.5 + 0.1, 8), m, 0, 0.06, z, 0, 0, Math.PI / 2);
  return g;
}

// Señal de tráfico: paso de peatones
export function senalTrafico() {
  const g = new THREE.Group(), m = mat('#5b6168', { r: 0.4, m: 0.7 });
  add(g, rbox(0.3, 0.05, 0.3, 0.02), m, 0, 0.025, 0);
  add(g, cyl(0.035, 0.035, 2.3, 12), m, 0, 1.2, 0);
  const tex = canvasTex('pasoPeatones', 256, 256, (c, w) => {
    c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, w); c.fillStyle = '#1e5fd6'; c.fillRect(10, 10, w - 20, w - 20);
    c.fillStyle = '#ffffff'; c.beginPath(); c.moveTo(w / 2, 40); c.lineTo(w - 40, w - 45); c.lineTo(40, w - 45); c.closePath(); c.fill();
    c.fillStyle = '#111'; c.beginPath(); c.arc(w / 2 + 6, 100, 13, 0, Math.PI * 2); c.fill();
    c.lineWidth = 12; c.lineCap = 'round'; c.strokeStyle = '#111';
    c.beginPath(); c.moveTo(w / 2 + 4, 118); c.lineTo(w / 2 - 6, 160); c.lineTo(w / 2 - 26, 190); c.moveTo(w / 2 - 6, 160); c.lineTo(w / 2 + 14, 190); c.moveTo(w / 2 + 2, 128); c.lineTo(w / 2 - 22, 148); c.moveTo(w / 2 + 2, 128); c.lineTo(w / 2 + 24, 146); c.stroke();
    for (let k = 0; k < 4; k++) { c.fillStyle = '#111'; c.fillRect(64 + k * 34, w - 70, 22, 8); }
  });
  add(g, rbox(0.62, 0.62, 0.03, 0.02), m, 0, 2.2, -0.02);
  const s = new THREE.Mesh(new THREE.PlaneGeometry(0.6, 0.6), mat('#ffffff', { map: tex, r: 0.4 })); s.position.set(0, 2.2, 0.0); g.add(s);
  return g;
}

export const STREET_KIT_2 = [
  ['Macetero', macetero], ['Palmera', () => palmera()], ['Árbol', arbol], ['Seto', () => seto()], ['Caja de madera', () => cajaMadera()],
  ['Caja eléctrica', cajaElectrica], ['Hidrante', hidrante], ['Cabina telefónica', cabinaTelefono], ['Parada de taxi', paradaTaxi],
  ['Reloj', reloj], ['Fuente', fuente], ['Poste', poste], ['Aparcabicis', () => aparcabicis()], ['Señal de tráfico', senalTrafico],
];

// ==================================================================
//  Tercera tanda: obras, parque y equipamiento
// ==================================================================
// Paso de peatones: tramo de asfalto con cebra pintada (en la isla se pinta sobre la calzada)
export function pasoPeatones(w = 3, l = 2.6) {
  const g = new THREE.Group();
  add(g, rbox(w + 0.4, 0.04, l + 0.4, 0.015), mat('#3a3e45', { r: 0.95 }), 0, 0.02, 0);
  const paint = mat('#f2f2ee', { r: 0.7 });
  const n = Math.floor(w / 0.6);
  for (let k = 0; k < n; k++) add(g, rbox(0.4, 0.012, l, 0.004), paint, -w / 2 + 0.3 + k * (w - 0.6) / (n - 1), 0.045, 0);
  return g;
}

// Valla de obra: marco tubular con dos tablas a rayas y pies separados
export function vallaObra() {
  const g = new THREE.Group(), m = mat('#9aa1a9', { r: 0.35, m: 0.7 });
  for (const x of [-0.7, 0.7]) {
    add(g, cyl(0.025, 0.025, 1.0, 10), m, x, 0.55, 0);
    add(g, rbox(0.06, 0.06, 0.06, 0.015), m, x, 1.07, 0);
    add(g, cyl(0.022, 0.022, 0.8, 8), m, x, 0.03, 0, Math.PI / 2); // pie
    for (const s of [-1, 1]) add(g, cyl(0.015, 0.015, 0.42, 8), m, x, 0.2, s * 0.15, s * 0.95); // tornapuntas
    for (const s of [-1, 1]) add(g, sph(0.035, 10, 8), mat('#2b2e33'), x, 0.03, s * 0.4);
  }
  add(g, cyl(0.02, 0.02, 1.4, 8), m, 0, 0.18, 0, 0, 0, Math.PI / 2);
  const stripes = mat('#ffffff', { map: stripeTex(), r: 0.5 });
  for (const y of [0.92, 0.62]) add(g, rbox(1.4, 0.22, 0.035, 0.012), stripes, 0, y, 0.03);
  return g;
}

// Cilindro de señalización: bidón naranja con franjas reflectantes y aros
export function cilindro() {
  const g = new THREE.Group(), o = mat('#ec5a1c', { r: 0.45 }), w = mat('#f4f4f0', { r: 0.25, m: 0.1 });
  add(g, cyl(0.31, 0.33, 0.08, 28), mat('#2b2e33', { r: 0.8 }), 0, 0.04, 0);
  add(g, lathe('cilindro', [[0, 0.06], [0.3, 0.06], [0.3, 0.2], [0.31, 0.215], [0.31, 0.245], [0.3, 0.26], [0.295, 0.5], [0.305, 0.515], [0.305, 0.545], [0.295, 0.56], [0.285, 0.82], [0.295, 0.835], [0.295, 0.865], [0.28, 0.88], [0.26, 0.94], [0.14, 0.975], [0, 0.98]], 32), o);
  for (const y of [0.37, 0.69]) add(g, cyl(0.304, 0.308, 0.15, 32, true), w, 0, y, 0);
  add(g, cyl(0.06, 0.07, 0.05, 16), o, 0, 0.99, 0);
  return g;
}

// Túnel peatonal de obra: carcasa de chapa por paneles (paredes y techo curvo de una
// pieza), marco de tubo claro en las bocas y en el centro, suelo con marcas amarillas
const panelTex = () => canvasTex('panelTunel', 256, 256, (c, w, h) => {
  c.fillStyle = '#a8b5c6'; c.fillRect(0, 0, w, h);
  for (let k = 0; k < 40; k++) { c.fillStyle = `rgba(255,255,255,${0.02 + (k % 3) * 0.015})`; c.fillRect(0, k * 6.4, w, 3); } // ondulado fino
  c.fillStyle = '#7f8ea2'; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h);                    // juntas entre paneles
  c.fillStyle = 'rgba(255,255,255,0.18)'; c.fillRect(4, 4, w, 2); c.fillRect(4, 4, 2, h);
});
function tunnelProfile(W, H, R) {
  // recorrido del perfil: pared izquierda (de abajo arriba), techo con esquinas redondeadas, pared derecha
  const pts = [];
  pts.push([-W / 2, 0], [-W / 2, H - R]);
  for (let k = 1; k <= 8; k++) { const a = Math.PI - (k / 8) * (Math.PI / 2); pts.push([-W / 2 + R + Math.cos(a) * R, H - R + Math.sin(a) * R]); }
  for (let k = 1; k <= 8; k++) { const a = Math.PI / 2 - (k / 8) * (Math.PI / 2); pts.push([W / 2 - R + Math.cos(a) * R, H - R + Math.sin(a) * R]); }
  pts.push([W / 2, 0]);
  return pts;
}
export function tunelPeatonal(len = 3) {
  const g = new THREE.Group(), W = 2.3, H = 2.35, R = 0.55;
  const prof = tunnelProfile(W, H, R);
  const shell = cache('tunelCasco' + len, () => {
    const pos = [], uv = [], idx = [], NZ = 1;
    let acc = 0; const arc = [0];
    for (let i = 1; i < prof.length; i++) { acc += Math.hypot(prof[i][0] - prof[i - 1][0], prof[i][1] - prof[i - 1][1]); arc.push(acc); }
    for (let i = 0; i < prof.length; i++) for (let j = 0; j <= NZ; j++) {
      pos.push(prof[i][0], prof[i][1], -len / 2 + (j / NZ) * len); uv.push(arc[i] / 1.0, (j / NZ) * len / 1.0);
    }
    for (let i = 0; i < prof.length - 1; i++) { const a = i * (NZ + 1), b2 = (i + 1) * (NZ + 1); idx.push(a, b2, a + 1, b2, b2 + 1, a + 1); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
    geo.setIndex(idx); geo.computeVertexNormals();
    return geo;
  });
  const t = panelTex(); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  add(g, shell, mat('#ffffff', { map: t, r: 0.5, m: 0.35, side: THREE.DoubleSide }));
  // marco de tubo claro: arco en cada boca y en el centro, largueros abajo y en los hombros
  const fm = mat('#d9dee4', { r: 0.35, m: 0.5 });
  const arcPts = prof.map(([x, y]) => [x, y, 0]);
  for (const z of [-len / 2, 0, len / 2]) add(g, tube('tunelArco', arcPts, 0.035, 40), fm, 0, 0, z);
  for (const x of [-W / 2, W / 2]) {
    add(g, cyl(0.03, 0.03, len, 10), fm, x, 0.05, 0, Math.PI / 2);
    add(g, cyl(0.025, 0.025, len, 10), fm, x * (1 - 0.0), H - R, 0, Math.PI / 2);
    for (const z of [-len / 2, len / 2]) add(g, rbox(0.18, 0.04, 0.3, 0.01), mat('#c9a227', { r: 0.6 }), x, 0.02, z);
  }
  // suelo de chapa con rampas en las bocas y señalización amarilla
  add(g, rbox(W - 0.06, 0.05, len, 0.01), mat('#4a5463', { r: 0.8 }), 0, 0.025, 0);
  for (const z of [-len / 2 - 0.15, len / 2 + 0.15]) add(g, rbox(W - 0.06, 0.03, 0.3, 0.01), mat('#4a5463', { r: 0.8 }), 0, 0.02, z, z > 0 ? 0.15 : -0.15);
  const ym = mat('#f2c21a', { r: 0.5 });
  for (const z of [-len / 3, len / 3]) { add(g, rbox(0.45, 0.01, 0.06, 0.003), ym, -0.2, 0.055, z, 0, 0.5); add(g, rbox(0.45, 0.01, 0.06, 0.003), ym, 0.2, 0.055, z, 0, -0.5); }
  return g;
}

// Banco de parque: listones de madera, respaldo curvo y patas de fundición con brazos
function parkFrameGeo() {
  return cache('parkFrame', () => {
    const s = new THREE.Shape();
    s.moveTo(0.26, 0); s.lineTo(0.32, 0); s.quadraticCurveTo(0.28, 0.2, 0.3, 0.4);
    s.quadraticCurveTo(0.36, 0.58, 0.28, 0.66); s.quadraticCurveTo(0.2, 0.7, 0.16, 0.62); s.quadraticCurveTo(0.2, 0.6, 0.22, 0.56);
    s.quadraticCurveTo(0.2, 0.46, 0.0, 0.44); s.lineTo(-0.16, 0.44); s.quadraticCurveTo(-0.22, 0.62, -0.26, 0.92);
    s.lineTo(-0.31, 0.91); s.quadraticCurveTo(-0.27, 0.6, -0.24, 0.42); s.quadraticCurveTo(-0.3, 0.2, -0.3, 0); s.lineTo(-0.24, 0);
    s.quadraticCurveTo(-0.2, 0.25, -0.12, 0.38); s.lineTo(0.18, 0.38); s.quadraticCurveTo(0.24, 0.2, 0.26, 0);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.045, bevelEnabled: true, bevelThickness: 0.01, bevelSize: 0.01, bevelSegments: 2, curveSegments: 12 });
    geo.translate(0, 0, -0.022); geo.rotateY(-Math.PI / 2);
    return geo;
  });
}
export function bancoParque(len = 1.7) {
  const g = new THREE.Group(), iron = mat('#1f2226', { r: 0.4, m: 0.6 });
  for (const x of [-len / 2 + 0.1, len / 2 - 0.1]) add(g, parkFrameGeo(), iron, x, 0, 0);
  const woods = ['#b0632e', '#a35a29', '#b86b34', '#a95f2c'];
  for (let i = 0; i < 4; i++) add(g, rbox(len + 0.06, 0.035, 0.085, 0.014), mat(woods[i], { r: 0.65 }), 0, 0.455, 0.2 - i * 0.1);
  // respaldo inclinado y ligeramente curvo
  for (let i = 0; i < 3; i++) { const y = 0.6 + i * 0.11, z = -0.2 - i * 0.03; add(g, rbox(len + 0.06, 0.085, 0.03, 0.012), mat(woods[(i + 1) % 4], { r: 0.65 }), 0, y, z, -0.18 - i * 0.04); }
  for (const x of [-len / 2 + 0.1, len / 2 - 0.1]) add(g, sph(0.03, 10, 8), iron, x, 0.66, 0.28);
  return g;
}

// Farol decorativo: columna de fundición acanalada, dos brazos en voluta y faroles
function lanternGeo(g, x, y, m, glass) {
  add(g, lathe('farolCopete', [[0, 0], [0.13, 0], [0.15, 0.03], [0.1, 0.1], [0.04, 0.16], [0.02, 0.22], [0, 0.23]], 16), m, x, y + 0.3, 0);
  add(g, lathe('farolCuerpo', [[0.07, 0], [0.13, 0.3]], 6), glass, x, y, 0);
  for (let k = 0; k < 6; k++) { const a = (k / 6) * Math.PI * 2 + Math.PI / 6; add(g, cyl(0.008, 0.008, 0.32, 4), m, x + Math.cos(a) * 0.1, y + 0.15, Math.sin(a) * 0.1, 0, 0, 0); }
  add(g, cyl(0.075, 0.06, 0.05, 12), m, x, y - 0.02, 0);
  add(g, sph(0.05, 8, 6), mat('#ffe7a6', { e: '#ffd27a', ei: 1, glow: 'lamp' }), x, y + 0.14, 0);
}
export function farolDecorativo() {
  const g = new THREE.Group(), m = mat('#22262b', { r: 0.4, m: 0.6 });
  add(g, lathe('farolBase', [[0, 0], [0.25, 0], [0.25, 0.06], [0.2, 0.1], [0.18, 0.3], [0.13, 0.36], [0.12, 0.6], [0.09, 0.7], [0, 0.7]], 24), m);
  add(g, cyl(0.06, 0.075, 2.6, 12), m, 0, 2.0, 0);
  for (const y of [0.75, 1.6, 3.25]) add(g, cyl(0.1, 0.1, 0.05, 16), m, 0, y, 0);
  for (const s of [-1, 1]) {
    add(g, tube('voluta' + s, [[0, 3.1, 0], [s * 0.18, 3.3, 0], [s * 0.38, 3.32, 0], [s * 0.5, 3.25, 0]], 0.022, 16), m);
    add(g, tube('voluta2' + s, [[0, 2.95, 0], [s * 0.1, 3.0, 0], [s * 0.15, 3.08, 0], [s * 0.1, 3.14, 0]], 0.015, 10), m);
    lanternGeo(g, s * 0.5, 2.9, m, mat('#fff2c4', { t: 0.55, e: '#ffd890', ei: 0.6, r: 0.1, glow: 'lamp' }));
  }
  add(g, lathe('farolRemate', [[0, 0], [0.05, 0], [0.03, 0.15], [0.05, 0.22], [0, 0.32]], 12), m, 0, 3.3, 0);
  return g;
}

// Buzón de correos rojo sobre patas, con techo curvo, boca y placa
export function buzon() {
  const g = new THREE.Group(), r = mat('#d4241b', { r: 0.4, m: 0.25 }), d = mat('#2b2e33', { r: 0.5, m: 0.5 });
  for (const x of [-0.2, 0.2]) for (const z of [-0.15, 0.15]) add(g, rbox(0.05, 0.35, 0.05, 0.01), d, x, 0.175, z);
  add(g, rbox(0.56, 0.75, 0.42, 0.04), r, 0, 0.72, 0);
  add(g, cyl(0.21, 0.21, 0.56, 24, false, 0, Math.PI), r, 0, 1.095, 0, 0, Math.PI / 2, Math.PI / 2);
  add(g, rbox(0.6, 0.04, 0.46, 0.02), mat('#b81e17', { r: 0.4, m: 0.25 }), 0, 1.1, 0);
  add(g, rbox(0.34, 0.035, 0.03, 0.01), d, 0, 0.98, 0.21);
  add(g, rbox(0.4, 0.06, 0.04, 0.015), r, 0, 1.02, 0.225, 0.3);
  const lab = canvasTex('buzon', 128, 64, (c, w, h) => { c.fillStyle = '#ffd400'; c.fillRect(0, 0, w, h); c.fillStyle = '#c4170f'; c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('BUZÓN', w / 2, h / 2 + 2); });
  const p = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.11), mat('#ffffff', { map: lab, r: 0.5 })); p.position.set(0, 0.8, 0.212); g.add(p);
  add(g, rbox(0.4, 0.3, 0.01, 0.005), mat('#b81e17', { r: 0.4, m: 0.25 }), 0, 0.55, 0.212);
  add(g, rbox(0.06, 0.02, 0.02, 0.005), d, 0.14, 0.62, 0.22);
  return g;
}

// Cabina de vigilancia: caseta de paneles gris claro con zócalo oscuro y ruedas; frente con
// ventanal y puerta con ventanita, ventanal lateral, techo azul volado con canto grueso
function inset(g, w, h, x, y, z, ry, m, edge) {
  // panel con marco en relieve
  const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.y = ry; g.add(f);
  add(f, rbox(w, h, 0.02, 0.008), m, 0, 0, 0);
  for (const sy of [-1, 1]) add(f, rbox(w, 0.035, 0.035, 0.01), edge, 0, sy * (h / 2 - 0.017), 0.01);
  for (const sx of [-1, 1]) add(f, rbox(0.035, h, 0.035, 0.01), edge, sx * (w / 2 - 0.017), 0, 0.01);
  return f;
}
export function cabinaVigilancia() {
  const g = new THREE.Group();
  const body = mat('#c3c8ce', { r: 0.45, m: 0.3 }), edge = mat('#d6dadf', { r: 0.4, m: 0.3 }), post = mat('#aab0b7', { r: 0.4, m: 0.4 });
  const blue = mat('#2f5c96', { r: 0.4, m: 0.3 }), blueD = mat('#244a7a', { r: 0.45, m: 0.3 }), glass = mat('#7fb6d8', { t: 0.55, r: 0.05, m: 0.1 });
  const W = 1.3, D = 1.1;
  // zócalo y ruedas giratorias
  add(g, rbox(W + 0.06, 0.14, D + 0.06, 0.03), mat('#3c4550', { r: 0.6, m: 0.4 }), 0, 0.2, 0);
  for (const x of [-W / 2 + 0.1, W / 2 - 0.1]) for (const z of [-D / 2 + 0.1, D / 2 - 0.1]) {
    add(g, rbox(0.08, 0.06, 0.08, 0.01), mat('#6f767e', { m: 0.6, r: 0.4 }), x, 0.12, z);
    add(g, cyl(0.065, 0.065, 0.05, 16), mat('#1d1f22', { r: 0.7 }), x, 0.065, z + 0.02, 0, 0, Math.PI / 2);
  }
  // esquinas y cuerpo
  for (const x of [-W / 2, W / 2]) for (const z of [-D / 2, D / 2]) add(g, rbox(0.07, 1.8, 0.07, 0.015), post, x, 1.17, z);
  add(g, rbox(W - 0.04, 0.8, D - 0.04, 0.02), body, 0, 0.67, 0);
  add(g, rbox(W - 0.04, 1.0, D - 0.04, 0.02), glass, 0, 1.57, 0);
  add(g, rbox(W + 0.02, 0.06, D + 0.02, 0.015), post, 0, 1.08, 0);                       // repisa entre panel y cristal
  // frente: ventanal a la izquierda, puerta a la derecha
  inset(g, 0.68, 0.72, -0.28, 0.66, D / 2, 0, body, edge);
  add(g, rbox(0.05, 1.8, 0.05, 0.01), post, 0.08, 1.17, D / 2 + 0.005);
  const door = inset(g, 0.5, 1.7, 0.36, 1.12, D / 2 + 0.005, 0, body, edge);
  add(door, rbox(0.3, 0.42, 0.012, 0.005), glass, 0, 0.5, 0.02);
  for (const sy of [-1, 1]) add(door, rbox(0.33, 0.025, 0.02, 0.005), edge, 0, 0.5 + sy * 0.22, 0.025);
  add(door, rbox(0.025, 0.12, 0.04, 0.008), mat('#2b2e33', { r: 0.4, m: 0.6 }), -0.18, -0.05, 0.035);
  add(g, rbox(0.66, 0.035, 0.035, 0.01), edge, -0.28, 2.05, D / 2);
  // laterales: panel abajo y ventanal arriba con montante
  for (const s2 of [-1, 1]) {
    inset(g, D - 0.1, 0.72, s2 * W / 2, 0.66, 0, s2 * Math.PI / 2, body, edge);
    add(g, rbox(0.035, 0.95, 0.035, 0.01), edge, s2 * (W / 2 + 0.005), 1.57, 0);
  }
  inset(g, W - 0.1, 0.72, 0, 0.66, -D / 2, Math.PI, body, edge);
  // interior visible: mostrador y monitor
  add(g, rbox(W - 0.15, 0.05, 0.35, 0.01), mat('#5b6470', { r: 0.6 }), 0, 1.1, -D / 2 + 0.25);
  add(g, rbox(0.3, 0.2, 0.03, 0.01), mat('#1d2228', { e: '#3b6fb0', ei: 0.4 }), -0.2, 1.25, -D / 2 + 0.2);
  // techo azul volado con canto grueso, tapa superior y foco
  add(g, rbox(W + 0.2, 0.15, D + 0.2, 0.03), blue, 0, 2.15, 0);
  add(g, rbox(W + 0.06, 0.05, D + 0.06, 0.03), blueD, 0, 2.25, 0);
  add(g, rbox(W + 0.22, 0.025, D + 0.22, 0.01), blueD, 0, 2.08, 0);
  add(g, rbox(0.24, 0.04, 0.1, 0.02), mat('#dfe6ee', { e: '#fff6d8', ei: 0.5, glow: 'lamp' }), 0, 2.09, D / 2 + 0.05);
  add(g, rbox(0.1, 0.1, 0.14, 0.02), mat('#2b2e33', { r: 0.4, m: 0.5 }), W / 2 + 0.14, 2.15, D / 2 - 0.1);
  return g;
}

// Extintor: botella roja con válvula, manómetro, manguera y boquilla negra
export function extintor() {
  const g = new THREE.Group(), r = mat('#d0231a', { r: 0.25, m: 0.2 }), b = mat('#1f2226', { r: 0.6 });
  add(g, lathe('extintor', [[0, 0], [0.085, 0], [0.095, 0.02], [0.095, 0.5], [0.08, 0.55], [0.04, 0.58], [0, 0.58]], 28), r);
  add(g, cyl(0.097, 0.097, 0.03, 28), b, 0, 0.015, 0);
  add(g, cyl(0.03, 0.035, 0.05, 12), mat('#9aa1a9', { m: 0.8, r: 0.3 }), 0, 0.6, 0);
  add(g, rbox(0.03, 0.03, 0.14, 0.008), b, 0, 0.64, -0.04, -0.2);
  add(g, rbox(0.025, 0.02, 0.12, 0.006), b, 0, 0.67, -0.03, 0.25);
  add(g, cyl(0.025, 0.025, 0.012, 16), mat('#e8e8e8'), 0.04, 0.6, 0, 0, 0, Math.PI / 2);
  add(g, tube('manguera', [[0, 0.62, 0.03], [0.06, 0.6, 0.1], [0.11, 0.45, 0.1], [0.11, 0.25, 0.08]], 0.012, 16), b);
  add(g, cyl(0.02, 0.014, 0.08, 10), b, 0.11, 0.21, 0.08);
  const lab = canvasTex('extintorEt', 64, 96, (c, w, h) => { c.fillStyle = '#f2f2f2'; c.fillRect(0, 0, w, h); c.fillStyle = '#c4170f'; c.fillRect(0, 0, w, 18); c.fillStyle = '#333'; for (let k = 0; k < 6; k++) c.fillRect(8, 28 + k * 10, w - 16 - (k % 2) * 14, 4); });
  add(g, cyl(0.0955, 0.0955, 0.16, 28, true, -0.6, 1.2), mat('#ffffff', { map: lab, r: 0.5 }), 0, 0.3, 0);
  return g;
}

export const STREET_KIT_3 = [
  ['Paso de peatones', () => pasoPeatones()], ['Valla de obra', vallaObra], ['Cilindro', cilindro], ['Túnel peatonal', () => tunelPeatonal()],
  ['Banco de parque', () => bancoParque()], ['Farol decorativo', farolDecorativo], ['Buzón', buzon], ['Cabina de vigilancia', cabinaVigilancia], ['Extintor', extintor],
];

// ==================================================================
//  Cuarta tanda: equipamiento y comercio en la calle
// ==================================================================
// Escalera de tijera de aluminio
export function escalera(h = 1.9) {
  const g = new THREE.Group(), al = mat('#aeb4bb', { r: 0.3, m: 0.75 }), d = mat('#2b2e33', { r: 0.7 });
  const spread = 0.38, ang = Math.atan2(spread, h), L = Math.hypot(spread, h);
  for (const sz of [-1, 1]) {
    for (const x of [-0.24, 0.24]) {
      add(g, rbox(0.045, L, 0.025, 0.008), al, x, h / 2, sz * spread / 2, -sz * ang);
      add(g, rbox(0.06, 0.04, 0.05, 0.01), d, x, 0.02, sz * spread);
    }
    if (sz > 0) for (let k = 1; k <= 5; k++) { const t = k / 6; add(g, rbox(0.48, 0.025, 0.07, 0.006), al, 0, t * h, spread * (1 - t)); }
    else for (let k = 1; k <= 2; k++) { const t = k / 3; add(g, cyl(0.012, 0.012, 0.48, 6), al, 0, t * h, -spread * (1 - t), 0, 0, Math.PI / 2); }
  }
  add(g, rbox(0.56, 0.06, 0.16, 0.015), mat('#e0a21a', { r: 0.5 }), 0, h + 0.02, 0);
  for (const x of [-0.24, 0.24]) add(g, cyl(0.006, 0.006, spread * 1.05, 6), d, x, h * 0.45, 0, Math.PI / 2);
  return g;
}

// Cartel publicitario sobre dos patas, marco negro y póster ilustrado
const posterTex = () => canvasTex('poster', 384, 256, (c, w, h) => {
  c.fillStyle = '#dfe7ef'; c.fillRect(0, 0, w, h);
  const gr = c.createRadialGradient(w * 0.6, h * 0.5, 10, w * 0.6, h * 0.5, 110); gr.addColorStop(0, '#5fb2ff'); gr.addColorStop(1, '#1d5fb0');
  c.fillStyle = gr; c.beginPath(); c.arc(w * 0.62, h * 0.48, 90, 0, Math.PI * 2); c.fill();
  c.fillStyle = '#fff'; c.font = 'bold 120px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('6', w * 0.62, h * 0.5);
  c.fillStyle = '#e8463a'; c.font = 'bold 54px sans-serif'; c.fillText('7', 40, 46);
  c.fillStyle = '#1d5fb0'; c.font = 'bold 26px sans-serif'; c.textAlign = 'left'; c.fillText('ROOKTOWN', 18, h - 26);
  c.fillStyle = '#f2b705'; c.fillRect(18, h - 70, 90, 18); c.fillStyle = '#e8463a'; c.fillRect(w - 120, h - 52, 100, 30);
  c.fillStyle = '#fff'; c.font = 'bold 20px sans-serif'; c.fillText('OFERTA', w - 112, h - 37);
});
export function cartelPublicitario() {
  const g = new THREE.Group(), m = mat('#1f2226', { r: 0.45, m: 0.5 });
  for (const x of [-0.75, 0.75]) { add(g, rbox(0.06, 1.0, 0.06, 0.01), m, x, 0.5, 0); add(g, rbox(0.06, 0.04, 0.4, 0.01), m, x, 0.02, 0); }
  add(g, rbox(1.75, 1.15, 0.1, 0.03), m, 0, 1.55, 0);
  add(g, rbox(1.62, 1.02, 0.02, 0.005), mat('#ffffff', { map: posterTex(), r: 0.4, e: '#ffffff', ei: 0.08 }), 0, 1.55, 0.046);
  add(g, rbox(1.62, 1.02, 0.01, 0.003), mat('#cfe6f5', { t: 0.18, r: 0.02 }), 0, 1.55, 0.06);
  return g;
}

// Bolardos de fundición con cabeza esférica (pareja)
export function bolardos() {
  const g = new THREE.Group(), m = mat('#22262b', { r: 0.35, m: 0.6 });
  for (const x of [-0.35, 0.35]) {
    add(g, lathe('bolardoClasico', [[0, 0], [0.11, 0], [0.11, 0.03], [0.09, 0.05], [0.085, 0.75], [0.084, 0.8], [0.075, 0.86], [0.055, 0.9], [0.03, 0.92], [0, 0.925]], 24), m, x, 0, 0);
    for (const y of [0.62, 0.7]) add(g, cyl(0.09, 0.09, 0.03, 24), mat('#a0a7ae', { m: 0.6, r: 0.3 }), x, y, 0);
    add(g, cyl(0.1, 0.11, 0.05, 24), m, x, 0.06, 0);
  }
  return g;
}

// Boca de metro: escalera descendente con barandilla, pórtico negro y rombo rojo METRO
export function paradaMetro() {
  const g = new THREE.Group(), m = mat('#1f2226', { r: 0.45, m: 0.55 }), st = mat('#6c737b', { r: 0.8 }), glass = mat('#9fd0ea', { t: 0.35, r: 0.05 });
  const W = 1.8, L = 2.6;
  const curb = mat('#8b9096', { r: 0.9 });
  // trozo de acera alrededor de la boca (tapa la caja de la escalera, que queda bajo el suelo)
  for (const x of [-1, 1]) add(g, rbox(0.8, 0.12, L + 1.4, 0.02), curb, x * (W / 2 + 0.4), 0.06, 0.1);
  add(g, rbox(W + 1.6, 0.12, 0.6, 0.02), curb, 0, 0.06, -L / 2 - 0.3);
  add(g, rbox(W + 1.6, 0.12, 0.8, 0.02), curb, 0, 0.06, L / 2 + 0.4);
  // escalones que bajan hacia el andén (la boca se abre por delante, +z)
  for (let k = 0; k < 9; k++) add(g, rbox(W - 0.08, 0.17, 0.3, 0.01), st, 0, 0.12 - k * 0.17 - 0.085, L / 2 - 0.15 - k * 0.3);
  for (const x of [-1, 1]) add(g, rbox(0.06, 1.6, L, 0.01), mat('#5a6068', { r: 0.8 }), x * (W / 2 - 0.03), -0.7, 0);
  // barandillas laterales y trasera
  for (const x of [-W / 2, W / 2]) {
    add(g, rbox(0.05, 0.05, L, 0.01), m, x, 1.0, 0);
    add(g, rbox(0.04, 0.04, L, 0.01), m, x, 0.5, 0);
    for (let k = 0; k <= 4; k++) add(g, rbox(0.05, 1.0, 0.05, 0.01), m, x, 0.55, -L / 2 + (k * L) / 4);
    add(g, rbox(0.01, 0.42, L - 0.05, 0.003), glass, x, 0.75, 0);
  }
  add(g, rbox(W, 0.05, 0.05, 0.01), m, 0, 1.0, -L / 2);
  // pórtico de entrada con panel de mapa
  for (const x of [-W / 2, W / 2]) add(g, rbox(0.1, 2.5, 0.1, 0.02), m, x, 1.25, -L / 2);
  add(g, rbox(W + 0.3, 0.32, 0.18, 0.03), m, 0, 2.55, -L / 2);
  const map = canvasTex('metroMapa', 256, 256, (c, w) => {
    c.fillStyle = '#1e5fd6'; c.fillRect(0, 0, w, w); c.lineWidth = 8;
    for (const [col, pts] of [['#ffd400', [[20, 60], [120, 60], [200, 160], [240, 160]]], ['#e8463a', [[40, 230], [100, 120], [230, 40]]], ['#2fbf5a', [[10, 140], [240, 200]]]]) {
      c.strokeStyle = col; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
    }
    c.fillStyle = '#fff'; for (const [x, y] of [[120, 60], [100, 120], [200, 160], [160, 172]]) { c.beginPath(); c.arc(x, y, 9, 0, 7); c.fill(); }
  });
  add(g, rbox(W - 0.2, 1.3, 0.04, 0.01), mat('#ffffff', { map, r: 0.4, e: '#ffffff', ei: 0.12 }), 0, 1.55, -L / 2 - 0.02);
  // rombo METRO luminoso
  const sign = canvasTex('metroRombo', 256, 256, (c, w) => {
    c.translate(w / 2, w / 2); c.rotate(Math.PI / 4); c.fillStyle = '#ffffff'; c.fillRect(-88, -88, 176, 176); c.fillStyle = '#d4241b'; c.fillRect(-78, -78, 156, 156);
    c.setTransform(1, 0, 0, 1, 0, 0); c.fillStyle = '#1e3f8a'; c.fillRect(20, 100, w - 40, 56); c.fillStyle = '#fff'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('METRO', w / 2, 130);
  });
  const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.8), mat('#ffffff', { map: sign, alphaTest: 0.3, e: '#ffffff', ei: 0.3, glow: 'lamp' }));
  sp.position.set(0, 2.85, -L / 2 + 0.1); g.add(sp);
  return g;
}

// Fuente de agua potable: pilar de acero con pileta, pulsador y rejilla
export function fuenteAgua() {
  const g = new THREE.Group(), m = mat('#9aa2ab', { r: 0.4, m: 0.25 }), d = mat('#5a6068', { r: 0.45, m: 0.3 });
  add(g, rbox(0.42, 0.06, 0.42, 0.02), d, 0, 0.03, 0);
  add(g, rbox(0.34, 0.95, 0.3, 0.03), m, 0, 0.53, 0);
  add(g, rbox(0.38, 0.05, 0.34, 0.02), d, 0, 1.02, 0);
  add(g, lathe('pileta', [[0, 0], [0.12, 0.0], [0.14, 0.05], [0.13, 0.06], [0.1, 0.02], [0, 0.02]], 20), mat('#c2c8ce', { r: 0.2, m: 0.85 }), 0, 1.045, 0.02);
  add(g, cyl(0.015, 0.02, 0.07, 10), mat('#c2c8ce', { m: 0.85, r: 0.2 }), 0, 1.1, -0.06, -0.5);
  add(g, rbox(0.08, 0.1, 0.03, 0.01), mat('#f2b705', { r: 0.4 }), 0.1, 0.85, 0.155);
  add(g, cyl(0.025, 0.025, 0.02, 12), d, 0.1, 0.85, 0.172, Math.PI / 2);
  for (let k = 0; k < 4; k++) add(g, rbox(0.2, 0.012, 0.01, 0.003), d, 0, 0.2 + k * 0.03, 0.152);
  return g;
}

// Fuente decorativa de tres pisos sobre pileta ancha con borde moldurado
export function fuenteDecorativa() {
  const g = new THREE.Group(), st = mat('#cfd3d8', { r: 0.55 }), water = mat('#4fa8d8', { t: 0.8, r: 0.05, m: 0.1 });
  add(g, lathe('fdBase', [[0, 0], [1.55, 0], [1.6, 0.06], [1.6, 0.42], [1.66, 0.48], [1.62, 0.56], [1.45, 0.56], [1.42, 0.48], [1.4, 0.15], [0, 0.15]], 48), st);
  add(g, cyl(1.41, 1.41, 0.02, 48), water, 0, 0.44, 0);
  add(g, lathe('fdPie', [[0, 0], [0.3, 0], [0.26, 0.1], [0.16, 0.3], [0.14, 0.75], [0.22, 0.85], [0, 0.85]], 24), st, 0, 0.15, 0);
  add(g, lathe('fdPlato1', [[0, 0], [0.85, 0.15], [0.9, 0.24], [0.82, 0.27], [0, 0.14]], 40), st, 0, 0.98, 0);
  add(g, cyl(0.8, 0.8, 0.02, 40), water, 0, 1.22, 0);
  add(g, lathe('fdPie2', [[0, 0], [0.14, 0], [0.1, 0.15], [0.09, 0.45], [0.14, 0.5], [0, 0.5]], 20), st, 0, 1.22, 0);
  add(g, lathe('fdPlato2', [[0, 0], [0.5, 0.1], [0.54, 0.17], [0.48, 0.19], [0, 0.1]], 32), st, 0, 1.7, 0);
  add(g, cyl(0.47, 0.47, 0.02, 32), water, 0, 1.87, 0);
  add(g, lathe('fdPie3', [[0, 0], [0.08, 0], [0.06, 0.3], [0.1, 0.34], [0, 0.34]], 16), st, 0, 1.87, 0);
  add(g, lathe('fdPlato3', [[0, 0], [0.26, 0.06], [0.28, 0.12], [0.24, 0.13], [0, 0.07]], 24), st, 0, 2.2, 0);
  add(g, lathe('fdRemate', [[0, 0], [0.06, 0], [0.09, 0.08], [0.05, 0.18], [0.02, 0.28], [0, 0.3]], 16), st, 0, 2.3, 0);
  const jet = mat('#bfe6ff', { t: 0.55 });
  for (const [r, y, n] of [[0.8, 1.0, 12], [0.48, 1.68, 8], [0.26, 2.2, 6]]) for (let k = 0; k < n; k++) { const a = (k / n) * Math.PI * 2; add(g, cyl(0.012, 0.03, 0.28, 6), jet, Math.cos(a) * r, y + 0.02, Math.sin(a) * r); }
  return g;
}

// Puesto de comida: carro rojo con toldo a rayas, mostrador con bandejas y ruedas
const awningTex = () => canvasTex('toldo', 256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#ffffff' : '#e23b2e'; c.fillRect(k * 32, 0, 32, h); } });
export function puestoComida() {
  const g = new THREE.Group(), red = mat('#d8402f', { r: 0.45, m: 0.2 }), m = mat('#9aa1a9', { r: 0.35, m: 0.7 });
  const W = 1.8, D = 0.8;
  add(g, rbox(W, 0.75, D, 0.04), red, 0, 0.7, 0);
  add(g, rbox(W + 0.06, 0.05, D + 0.06, 0.02), mat('#b8bec5', { r: 0.3, m: 0.7 }), 0, 1.1, 0);
  const lab = canvasTex('puesto', 256, 96, (c, w, h) => { c.fillStyle = '#f2b705'; c.fillRect(0, 0, w, h); c.fillStyle = '#c4170f'; c.font = 'bold 44px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('COMIDA', w / 2, h / 2 + 2); });
  add(g, rbox(0.8, 0.28, 0.01, 0.005), mat('#ffffff', { map: lab, r: 0.5 }), 0.35, 0.78, D / 2 + 0.005);
  add(g, rbox(0.4, 0.4, 0.01, 0.005), mat('#b8332a', { r: 0.45 }), -0.55, 0.7, D / 2 + 0.005);
  // ruedas grandes y patas
  for (const x of [-W / 2 + 0.3, W / 2 - 0.3]) for (const z of [-D / 2 - 0.02, D / 2 + 0.02]) {
    add(g, cyl(0.2, 0.2, 0.07, 22), mat('#1d1f22', { r: 0.8 }), x, 0.2, z, Math.PI / 2);
    add(g, cyl(0.1, 0.1, 0.08, 16), mat('#c9cfd6', { m: 0.7, r: 0.3 }), x, 0.2, z, Math.PI / 2);
  }
  // bandejas con comida
  const food = ['#c97a2e', '#e8b44a', '#8a4a1f'];
  for (let k = 0; k < 3; k++) {
    const x = -0.55 + k * 0.55;
    add(g, rbox(0.46, 0.05, 0.4, 0.01), mat('#d6dadf', { r: 0.25, m: 0.8 }), x, 1.15, 0);
    for (let j = 0; j < 6; j++) add(g, rbox(0.11, 0.05, 0.07, 0.025), mat(food[k], { r: 0.7 }), x - 0.14 + (j % 3) * 0.14, 1.19, -0.09 + Math.floor(j / 3) * 0.18);
  }
  add(g, rbox(W - 0.1, 0.35, 0.01, 0.003), mat('#d8eef8', { t: 0.3, r: 0.05 }), 0, 1.32, D / 2 - 0.03);
  // postes y toldo inclinado con faldón ondulado
  for (const x of [-W / 2 + 0.05, W / 2 - 0.05]) for (const z of [-D / 2 + 0.05, D / 2 - 0.05]) add(g, cyl(0.022, 0.022, 1.05, 8), m, x, 1.6, z);
  const at = awningTex();
  add(g, rbox(W + 0.3, 0.05, D + 0.4, 0.02), mat('#ffffff', { map: at, r: 0.7 }), 0, 2.15, 0.05, 0.12);
  for (let k = 0; k < 8; k++) add(g, cyl(0.12, 0.12, 0.04, 16, false, 0, Math.PI), mat(k % 2 ? '#ffffff' : '#e23b2e', { r: 0.7 }), -W / 2 - 0.08 + (k + 0.5) * (W + 0.16) / 8, 2.05, D / 2 + 0.26, Math.PI / 2, 0, 0);
  return g;
}

// Carrito de limpieza: estructura azul, bolsa amarilla, cubo naranja, fregona y escoba
export function carritoLimpieza() {
  const g = new THREE.Group(), blue = mat('#2e63c4', { r: 0.45, m: 0.2 }), m = mat('#9aa1a9', { r: 0.35, m: 0.7 });
  add(g, rbox(0.9, 0.06, 0.5, 0.02), blue, 0, 0.16, 0);
  add(g, rbox(0.9, 0.06, 0.5, 0.02), blue, 0, 0.62, 0);
  add(g, rbox(0.5, 0.05, 0.45, 0.02), blue, -0.2, 1.0, 0);
  for (const x of [-0.42, 0.42]) for (const z of [-0.22, 0.22]) { add(g, cyl(0.018, 0.018, 0.9, 8), m, x, 0.6, z); add(g, cyl(0.05, 0.05, 0.04, 14), mat('#1d1f22'), x, 0.06, z, Math.PI / 2); }
  add(g, tube('asaCarro', [[-0.42, 0.9, -0.22], [-0.52, 1.05, -0.2], [-0.52, 1.05, 0.2], [-0.42, 0.9, 0.22]], 0.018, 16), m);
  // bolsa amarilla colgada
  add(g, lathe('bolsaCarro', [[0, 0], [0.16, 0.0], [0.2, 0.08], [0.21, 0.5], [0.23, 0.56], [0, 0.56]], 20), mat('#f2c21a', { r: 0.75 }), 0.22, 0.2, 0);
  add(g, rbox(0.46, 0.05, 0.46, 0.015), m, 0.22, 0.78, 0);
  // cubo naranja y rojo con escurridor
  add(g, lathe('cuboLimp', [[0, 0], [0.15, 0], [0.18, 0.28], [0.17, 0.3], [0, 0.3]], 20), mat('#ec7a1c', { r: 0.5 }), -0.2, 0.19, 0);
  add(g, rbox(0.25, 0.22, 0.2, 0.03), mat('#d4241b', { r: 0.5 }), -0.2, 0.76, 0);
  for (const [x, c] of [[-0.3, '#3fa34d'], [-0.1, '#4aa3e0']]) { add(g, cyl(0.045, 0.05, 0.2, 12), mat(c, { r: 0.4 }), x, 1.13, 0); add(g, rbox(0.04, 0.06, 0.07, 0.01), mat('#f2f2f2'), x, 1.26, 0.02); }
  // fregona y escoba apoyadas
  add(g, cyl(0.014, 0.014, 1.4, 8), mat('#3a7dd8', { r: 0.4 }), -0.38, 0.85, 0.24, 0.12);
  add(g, rbox(0.12, 0.08, 0.12, 0.04), mat('#efefe6', { r: 0.9 }), -0.38, 0.12, 0.17);
  add(g, cyl(0.014, 0.014, 1.4, 8), mat('#d4241b', { r: 0.4 }), -0.38, 0.85, -0.24, -0.12);
  add(g, rbox(0.3, 0.08, 0.06, 0.02), mat('#2b2e33'), -0.38, 0.12, -0.17);
  return g;
}

export const STREET_KIT_4 = [
  ['Escalera', () => escalera()], ['Cartel publicitario', cartelPublicitario], ['Bolardos', bolardos], ['Parada de metro', paradaMetro],
  ['Fuente de agua', fuenteAgua], ['Fuente decorativa', fuenteDecorativa], ['Puesto de comida', puestoComida], ['Carrito de limpieza', carritoLimpieza],
];
