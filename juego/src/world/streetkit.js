// Mobiliario urbano de Rooktown, modelado a partir de la lámina «Calles y ciudad»
// (docs/referencias/09-tiendas-calles-objetos.png). Medidas reales en metros, origen en
// el suelo y frente hacia +z. Cada función devuelve un THREE.Group; las geometrías y los
// materiales se comparten entre copias para que muchas unidades no pesen en el móvil.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

// ---------- materiales y geometrías compartidas ----------
const mats = new Map();
export function mat(color, o = {}) {
  const k = color + JSON.stringify(o);
  if (!mats.has(k)) {
    const m = new THREE.MeshStandardMaterial({ color, roughness: o.r ?? 0.6, metalness: o.m ?? 0, ...(o.e ? { emissive: o.e, emissiveIntensity: o.ei ?? 1 } : {}), ...(o.t ? { transparent: true, opacity: o.t, depthWrite: false } : {}), ...(o.map ? { map: o.map } : {}), ...(o.side ? { side: o.side } : {}), ...(o.alphaTest ? { alphaTest: o.alphaTest } : {}) });
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
  const head = new THREE.Group(); head.position.set(0.98, 5.12, 0); head.rotation.z = -0.1; g.add(head); head.scale.setScalar(1.35);
  add(head, lathe('farolaCab', [[0, 0.13], [0.12, 0.12], [0.25, 0.06], [0.3, 0.0], [0.3, -0.03], [0, -0.03]], 28), m);
  add(head, cyl(0.26, 0.2, 0.06, 24), mat('#fff1c8', { r: 0.3, e: '#ffd98a', ei: 1.2, glow: 'lamp' }), 0, -0.06, 0);
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
    add(h, sph(0.1, 20, 12), mat(col[c], { r: 0.2, e: col[c], ei: lit === 'all' || on ? 1.4 : 0.25 }), 0, y, 0.17, 0, 0, 0, 1, 1, 0.45);
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
  const g = new THREE.Group(), m = mat('#4a5361', { r: 0.32, m: 0.5 });
  add(g, lathe('papelera', [[0, 0.04], [0.27, 0.04], [0.29, 0], [0.31, 0.02], [0.31, 0.07], [0.28, 0.1], [0.28, 0.82], [0.31, 0.84], [0.31, 0.9], [0.27, 0.92], [0.25, 0.9], [0.25, 0.12], [0, 0.12]], 32), m);
  for (const y of [0.35, 0.6]) add(g, cyl(0.29, 0.29, 0.025, 32), m, 0, y, 0);
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
const recycleTex = () => canvasTex('recycle', 128, 128, (c, w) => {
  c.clearRect(0, 0, w, w); c.strokeStyle = '#ffffff'; c.fillStyle = '#ffffff'; c.lineWidth = 11; c.lineJoin = 'round';
  for (let k = 0; k < 3; k++) {
    c.save(); c.translate(64, 70); c.rotate((k * Math.PI * 2) / 3);
    // lado del triángulo con punta de flecha (gira en sentido horario)
    c.beginPath(); c.moveTo(-30, -26); c.lineTo(4, -26); c.stroke();
    c.beginPath(); c.moveTo(18, -26); c.lineTo(2, -38); c.lineTo(2, -14); c.closePath(); c.fill();
    c.restore();
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
  for (const x of [-0.62, 0.62]) for (const s of [-1, 1]) add(g, cyl(0.022, 0.022, 1.0, 8), m, x, 0.47, s * 0.12, s * 0.27);
  for (const x of [-0.62, 0.62]) add(g, cyl(0.018, 0.018, 0.5, 8), m, x, 0.3, 0, Math.PI / 2);
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
