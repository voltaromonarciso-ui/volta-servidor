// Estaciones del cártel (como la lámina de referencia): banco de acero gris con cajonera
// oscura de tiradores azules, balda baja con cajas de colores, cubo al lado y estante alto con
// barra de luz; y encima, la máquina de cada una:
//   - mesa de cristales: tolva, máquina con pantalla, bandejas de cristales azules y cajones
//   - mesa de polvos: tolva grande con mezcladora y cuenco, máquina y botes en el estante
//   - máquina de pastillas: prensa con tolva y puerta de cristal, mesa lateral con blísteres
//   - estación de líquidos: depósito azul con tubos a cuatro boquillas y botellas
//   - empacadora avanzada: túnel de cristal con cinta, panel de control y baliza
// Todo con cantos redondeados; geometrías y materiales compartidos entre copias.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { G as GAME } from '../game.js';

// Reflejos de taller (neutros) para los metales: con el reflejo del cielo, dentro de casa el
// acero salía azulado. Se crea una vez, cuando ya hay renderer.
let ENV = null;
function studioEnv() {
  if (!ENV && GAME.renderer) { const pm = new THREE.PMREMGenerator(GAME.renderer); ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  return ENV;
}
// Acero cepillado: vetas finas horizontales (color) y su rugosidad
const texs = new Map();
function brushed(key, base, spread = 26) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = 256; c.height = 256;
    const x = c.getContext('2d');
    x.fillStyle = base; x.fillRect(0, 0, 256, 256);
    let sd = 7; const R = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 900; i++) { const y = R() * 256, l = 20 + R() * 180, v = Math.floor((R() - 0.5) * spread); x.fillStyle = `rgba(${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${v > 0 ? 255 : 0},${Math.abs(v) / 255})`; x.fillRect(R() * 256, y, l, 1); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2); t.anisotropy = 8;
    const r = document.createElement('canvas'); r.width = 128; r.height = 128;
    const y2 = r.getContext('2d'); y2.fillStyle = '#6a6a6a'; y2.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 500; i++) { const v = 90 + Math.floor(R() * 90); y2.fillStyle = `rgb(${v},${v},${v})`; y2.fillRect(R() * 128, R() * 128, 10 + R() * 70, 1); }
    const rt = new THREE.CanvasTexture(r); rt.wrapS = rt.wrapT = THREE.RepeatWrapping; rt.repeat.set(2, 2);
    texs.set(key, { map: t, rough: rt });
  }
  return texs.get(key);
}
// Pintura en polvo (texturita granulada) para los armarios oscuros
function powderCoat(key, base) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = 128; c.height = 128;
    const x = c.getContext('2d'); x.fillStyle = base; x.fillRect(0, 0, 128, 128);
    let sd = 3; const R = () => ((sd = (sd * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 2500; i++) { const v = R() < 0.5 ? 255 : 0; x.fillStyle = `rgba(${v},${v},${v},${0.03 + R() * 0.04})`; x.fillRect(R() * 128, R() * 128, 1, 1); }
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(3, 3);
    texs.set(key, { map: t });
  }
  return texs.get(key);
}
// Pone los reflejos de taller a los metales de un grupo (también lo usan las mesas de benches.js)
export function metalize(group) {
  const env = studioEnv();
  if (!env) return;
  group.traverse((m) => {
    if (!m.isMesh) return;
    for (const mt of Array.isArray(m.material) ? m.material : [m.material]) {
      if (!mt || mt.userData.metalized || mt.transparent) continue;
      if ((mt.metalness ?? 0) > 0.15) { mt.envMap = env; mt.envMapIntensity = mt.metalness > 0.6 ? 1.0 : 0.55; mt.userData.metalized = true; mt.needsUpdate = true; }
    }
  });
}

const geos = new Map(), mats = new Map();
const G = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
const M = (k, o) => { if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(o)); return mats.get(k); };
const rbg = (w, h, d, r = 0.02) => G(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99));
const cyg = (rt, rb, h, s = 20) => G(`cy${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
function put(g, geo, m, x, y, z, rx = 0, ry = 0, rz = 0) {
  const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.rotation.set(rx, ry, rz); o.castShadow = true; o.receiveShadow = true; g.add(o); return o;
}
const box = (g, m, w, h, d, x, y, z, r = 0.02) => put(g, rbg(w, h, d, r), m, x, y, z);
const cyl = (g, m, rt, rb, h, x, y, z, s = 20) => put(g, cyg(rt, rb, h, s), m, x, y, z);

// ---------- materiales ----------
const steel = () => M('labAcero', { color: '#ffffff', map: brushed('acero', '#a3abb3').map, roughnessMap: brushed('acero', '#a3abb3').rough, roughness: 0.55, metalness: 0.92 });
const steelTop = () => M('labAceroTop', { color: '#ffffff', map: brushed('aceroTop', '#bcc3ca', 34).map, roughnessMap: brushed('aceroTop', '#bcc3ca', 34).rough, roughness: 0.45, metalness: 0.95 });
const dark = () => M('labOscuro', { color: '#ffffff', map: powderCoat('oscuro', '#3a3f47').map, roughness: 0.5, metalness: 0.35 });
const darker = () => M('labNegro', { color: '#ffffff', map: powderCoat('negro', '#24282d').map, roughness: 0.55, metalness: 0.3 });
const handleM = () => M('labTirador', { color: '#e2e8ee', roughness: 0.12, metalness: 1.0 });
const handleBlue = () => M('labTiradorAzul', { color: '#3a8de0', roughness: 0.25, metalness: 0.4, emissive: '#1d5fb0', emissiveIntensity: 0.35 });
const glass = () => M('labCristal', { color: '#bfe3ff', roughness: 0.05, metalness: 0.1, transparent: true, opacity: 0.28, depthWrite: false });
export const labScreen = () => screenM();
const screenM = () => M('labPantalla', { color: '#7fd0ff', emissive: '#2b9dff', emissiveIntensity: 1.3, roughness: 0.2 });
const bins = { blue: M('labCajaAzul', { color: '#2463b8', roughness: 0.5 }), green: M('labCajaVerde', { color: '#2f8a4a', roughness: 0.5 }), black: M('labCajaNegra', { color: '#2a2e33', roughness: 0.55 }), tan: M('labCajaCarton', { color: '#b98a52', roughness: 0.8 }) };
const btn = (c) => M('labBoton' + c, { color: c, emissive: c, emissiveIntensity: 0.6, roughness: 0.35 });
const lightBar = (c) => M('labLuz' + c, { color: '#ffffff', emissive: c, emissiveIntensity: 2.2 });

// ---------- piezas comunes ----------
const W = 2.0, D = 0.8, TOP = 0.92;
// pata niveladora
function leg(g, x, z, h = TOP - 0.06) {
  put(g, rbg(0.06, h, 0.06, 0.01), dark(), x, h / 2 + 0.05, z);
  cyl(g, darker(), 0.045, 0.05, 0.05, x, 0.025, z, 14);
}
// banco: tablero de acero, cajonera derecha con 3 cajones, balda baja con cajas, cubo a la izq.
function bench(g, { w = W, d = D, drawers = 3, blue = true, binsLow = ['blue', 'green', 'black'], trash = true } = {}) {
  const x0 = -w / 2, x1 = w / 2;
  box(g, steelTop(), w + 0.04, 0.06, d + 0.04, 0, TOP, 0, 0.015);                  // tablero
  box(g, steel(), w, 0.05, d - 0.06, 0, TOP - 0.06, 0, 0.01);                      // faldón
  const cw = Math.min(0.62, w * 0.32), cx = x1 - cw / 2 - 0.03;                   // cajonera
  box(g, dark(), cw, TOP - 0.16, d - 0.06, cx, (TOP - 0.16) / 2 + 0.08, 0, 0.02);
  const dh = (TOP - 0.22) / drawers;
  for (let k = 0; k < drawers; k++) {
    const y = 0.12 + dh * (k + 0.5);
    box(g, darker(), cw - 0.06, dh - 0.03, 0.02, cx, y, d / 2 - 0.02, 0.008);
    box(g, blue ? handleBlue() : handleM(), cw * 0.42, 0.025, 0.03, cx, y + dh * 0.15, d / 2 + 0.005, 0.01);
  }
  for (const x of [x0 + 0.05, cx - cw / 2 - 0.03]) for (const z of [-d / 2 + 0.05, d / 2 - 0.05]) leg(g, x, z);
  // balda baja con cajas
  const sx0 = x0 + 0.05, sx1 = cx - cw / 2 - 0.06;
  box(g, steel(), sx1 - sx0, 0.03, d - 0.1, (sx0 + sx1) / 2, 0.2, 0, 0.008);
  box(g, steel(), sx1 - sx0, 0.03, d - 0.1, (sx0 + sx1) / 2, 0.52, 0, 0.008);
  const bw = (sx1 - sx0 - 0.08) / binsLow.length;
  binsLow.forEach((c, k) => {
    const bx = sx0 + 0.04 + bw * (k + 0.5);
    box(g, bins[c], bw - 0.05, 0.24, d - 0.22, bx, 0.34, 0.02, 0.025);
    box(g, bins[c], bw - 0.02, 0.025, d - 0.19, bx, 0.465, 0.02, 0.01);           // reborde
    box(g, M('labAsaCaja', { color: '#e8c33a', roughness: 0.4 }), 0.1, 0.03, 0.02, bx, 0.43, d / 2 - 0.09, 0.008);
  });
  if (trash) { // papelera alta al lado
    const tx = x0 - 0.2;
    box(g, darker(), 0.3, 0.6, 0.36, tx, 0.31, 0.12, 0.04);
    box(g, dark(), 0.32, 0.03, 0.38, tx, 0.62, 0.12, 0.015);
  }
  return { x0, x1, cx, cw };
}
// estante alto con barra de luz y baldas
function topShelf(g, x0, x1, { light = '#9ad7ff', shelf = true, h = 0.72 } = {}) {
  const y0 = TOP + 0.03, z = -D / 2 + 0.06;
  for (const x of [x0, x1]) box(g, dark(), 0.04, h, 0.04, x, y0 + h / 2, z, 0.008);
  box(g, dark(), x1 - x0 + 0.04, 0.05, 0.12, (x0 + x1) / 2, y0 + h, z + 0.02, 0.01);
  box(g, lightBar(light), x1 - x0 - 0.1, 0.03, 0.06, (x0 + x1) / 2, y0 + h - 0.04, z + 0.06, 0.01);
  if (shelf) box(g, dark(), x1 - x0, 0.03, 0.22, (x0 + x1) / 2, y0 + h * 0.48, z + 0.06, 0.008);
  return y0 + h * 0.48 + 0.015;
}
// máquina con pantalla azul y tres botones (verde, ámbar, rojo)
function controlBox(g, x, y, z, w = 0.36, h = 0.42, d = 0.3) {
  box(g, steel(), w, h, d, x, y + h / 2, z, 0.025);
  box(g, darker(), w * 0.62, h * 0.32, 0.02, x, y + h * 0.68, z + d / 2, 0.01);
  box(g, screenM(), w * 0.54, h * 0.25, 0.02, x, y + h * 0.68, z + d / 2 + 0.006, 0.006);
  ['#2ecc71', '#f39c12', '#e74c3c'].forEach((c, k) => { const b = cyl(g, btn(c), 0.022, 0.022, 0.02, x + (k - 1) * w * 0.22, y + h * 0.3, z + d / 2 + 0.01, 14); b.rotation.x = Math.PI / 2; });
  return new THREE.Vector3(x - w * 0.22, y + h * 0.3, z + d / 2 + 0.02);
}
// Zona de trabajo delantera, común a las mesas (los ingredientes a la izquierda, el cuenco en el
// centro, los envases y el producto para envasar) y dónde está cada cosa de la máquina
const Y = TOP + 0.03;
function spots(o, craft) {
  o.spots = { pack: new THREE.Vector3(-0.6, Y, 0.27), work: new THREE.Vector3(0.0, Y, 0.25), supply: new THREE.Vector3(0.58, Y, 0.25), out: craft.stash || new THREE.Vector3(0.6, Y, -0.1) };
  o.craft = { supplies: [new THREE.Vector3(-0.7, Y, 0.27), new THREE.Vector3(-0.45, Y, 0.27), new THREE.Vector3(-0.2, Y, 0.27)], bowl: new THREE.Vector3(0.22, Y, 0.25), ...craft };
}
// tolva (embudo) sobre un soporte
function hopper(g, x, y, z, r = 0.16, h = 0.24) {
  const c = cyl(g, steelTop(), r, r * 0.22, h, x, y + h / 2, z, 24);
  c.material = M('labTolva', { color: '#d4dadf', roughness: 0.2, metalness: 0.85, side: THREE.DoubleSide });
  cyl(g, steelTop(), r * 1.04, r * 1.04, 0.025, x, y + h, z, 24);
  cyl(g, steel(), r * 0.22, r * 0.22, 0.1, x, y - 0.05, z, 14);
}
// bandeja con cubitos de colores (cristales)
function tray(g, x, y, z, w, d, col, n = 10, seed = 3) {
  box(g, M('labBandeja', { color: '#2b5fa8', roughness: 0.35, metalness: 0.3 }), w, 0.04, d, x, y + 0.02, z, 0.01);
  const cm = M('labGema' + col, { color: col, roughness: 0.08, metalness: 0.2, emissive: col, emissiveIntensity: 0.35, transparent: true, opacity: 0.9 });
  let s = seed; const rnd = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
  for (let k = 0; k < n; k++) { const c = put(g, G('gema', () => new THREE.IcosahedronGeometry(0.025, 0)), cm, x + (rnd() - 0.5) * (w - 0.06), y + 0.05, z + (rnd() - 0.5) * (d - 0.05), rnd() * 3, rnd() * 3, 0); c.scale.y = 1.5; }
}
function bottle(g, x, y, z, col = '#f2f2f2', cap = '#2c2f33', h = 0.14, r = 0.035) {
  cyl(g, M('labBote' + col, { color: col, roughness: 0.3 }), r, r, h, x, y + h / 2, z, 16);
  cyl(g, M('labTapa' + cap, { color: cap, roughness: 0.4 }), r * 0.9, r * 0.9, 0.03, x, y + h + 0.015, z, 16);
}
// cinta transportadora (rodillos)
function conveyor(g, x0, x1, y, z, d = 0.34) {
  box(g, darker(), x1 - x0, 0.03, d, (x0 + x1) / 2, y, z, 0.01);
  for (const s of [-1, 1]) box(g, steel(), x1 - x0, 0.07, 0.03, (x0 + x1) / 2, y + 0.01, z + s * (d / 2 + 0.015), 0.01);
  for (const x of [x0 + 0.04, x1 - 0.04]) { const r = cyl(g, steelTop(), 0.04, 0.04, d, x, y - 0.005, z, 16); r.rotation.x = Math.PI / 2; }
}

// ======================================================================
//  Mesa de cristales
// ======================================================================
export function buildCrystalTable(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  const b = bench(g, { binsLow: ['blue', 'green', 'black'] });
  const y = TOP + 0.03;
  // máquina con tolva a la izquierda
  const button = controlBox(g, b.x0 + 0.42, y, -0.12, 0.34, 0.44, 0.3);
  box(g, steel(), 0.18, 0.2, 0.22, b.x0 + 0.17, y + 0.1, -0.12, 0.02);
  hopper(g, b.x0 + 0.17, y + 0.32, -0.12, 0.13, 0.2);
  // bandeja grande de cristales azules en el centro, y otras dos pequeñas
  // bandeja de salida de los cristales (vacía: se llena al trabajar la máquina)
  box(g, M('labBandeja', { color: '#2b5fa8', roughness: 0.35, metalness: 0.3 }), 0.5, 0.04, 0.26, 0.0, y + 0.02, -0.1, 0.01);
  bottle(g, 0.3, y, -0.3, '#e9eef2', '#2c74c9', 0.12, 0.04);
  spots(o, { kind: 'crystal', input: new THREE.Vector3(b.x0 + 0.17, y + 0.52, -0.12), button, out: new THREE.Vector3(0.0, y + 0.04, -0.1), mix: '#9fd6ff' });
  // estante con barra de luz cian y cajitas de cristales
  const sy = topShelf(g, -0.4, 0.95, { light: '#4fd5ff' });
  void sy;
  box(g, M('labOrganizador', { color: '#5a646e', roughness: 0.4, metalness: 0.5 }), 0.36, 0.42, 0.22, 0.62, y + 0.21 + 0.36, -0.29, 0.015);
  for (let k = 0; k < 3; k++) tray(g, 0.62, y + 0.42 + k * 0.13, -0.24, 0.3, 0.12, '#4fb4ff', 4, 11 + k);
}

// ======================================================================
//  Mesa de preparación de polvos
// ======================================================================
export function buildPowderTable(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  const b = bench(g, { binsLow: ['blue', 'green', 'black'] });
  const y = TOP + 0.03;
  // mezcladora: tolva grande en columna con brazo y cuenco de acero debajo
  const mx = b.x0 + 0.38;
  box(g, steel(), 0.3, 0.06, 0.34, mx, y + 0.03, -0.08, 0.015);
  box(g, dark(), 0.08, 0.62, 0.08, mx, y + 0.34, -0.22, 0.015);
  box(g, steel(), 0.16, 0.12, 0.22, mx, y + 0.56, -0.12, 0.02);
  hopper(g, mx, y + 0.66, -0.12, 0.17, 0.26);
  const pipe = cyl(g, M('labTubo', { color: '#2f7fd6', roughness: 0.3 }), 0.022, 0.022, 0.22, mx, y + 0.4, -0.02, 12); void pipe;
  cyl(g, M('labCuenco', { color: '#cfd6dc', roughness: 0.18, metalness: 0.9 }), 0.13, 0.08, 0.1, mx, y + 0.11, -0.04, 24);
  cyl(g, M('labPolvoCuenco', { color: '#f4efe6', roughness: 0.95 }), 0.115, 0.115, 0.012, mx, y + 0.155, -0.04, 24);
  // máquina con pantalla al lado y su ventana
  const button = controlBox(g, b.x0 + 0.85, y, -0.1, 0.42, 0.46, 0.32);
  box(g, glass(), 0.3, 0.14, 0.02, b.x0 + 0.85, y + 0.12, 0.07, 0.01);
  // bandeja gris al fondo (donde se deja el polvo hecho)
  box(g, M('labBandejaGris', { color: '#4a5560', roughness: 0.35, metalness: 0.5 }), 0.36, 0.03, 0.24, 0.45, y + 0.015, -0.06, 0.01);
  spots(o, { kind: 'powder', input: new THREE.Vector3(mx, y + 0.92, -0.12), button, out: new THREE.Vector3(mx, y + 0.16, -0.04), mix: '#f4efe6' });
  // estante con botes blancos de tapa roja, verde y azul y un bote de lápices
  const sy = topShelf(g, 0.25, 0.95, { light: '#ffe2a8' });
  ['#d64541', '#2c74c9', '#2a9d5b', '#d64541'].forEach((c, k) => bottle(g, 0.36 + k * 0.17, sy, -0.28, '#f1f3f5', c, 0.15, 0.045));
  ['#2c74c9', '#2a9d5b'].forEach((c, k) => bottle(g, 0.75 + k * 0.12, y, -0.3, '#f1f3f5', c, 0.13 + k * 0.02, 0.04));
}

// ======================================================================
//  Máquina de pastillas
// ======================================================================
export function buildPillMachine(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  // armario base de la prensa (izquierda) y mesa lateral (derecha)
  const px = -0.45;
  box(g, dark(), 0.9, 0.78, 0.78, px, 0.41, 0, 0.03);
  box(g, darker(), 0.4, 0.62, 0.02, px - 0.2, 0.42, 0.395, 0.01);
  box(g, handleM(), 0.02, 0.2, 0.03, px - 0.04, 0.45, 0.41, 0.008);
  box(g, darker(), 0.36, 0.62, 0.02, px + 0.22, 0.42, 0.395, 0.01);
  for (const x of [px - 0.4, px + 0.4]) for (const z of [-0.34, 0.34]) cyl(g, darker(), 0.045, 0.05, 0.05, x, 0.025, z, 14);
  // la prensa: cuerpo de acero con puerta de cristal, punzón dentro y tolva arriba
  const y = 0.8;
  box(g, steel(), 0.62, 0.7, 0.6, px - 0.08, y + 0.35, -0.04, 0.03);
  box(g, glass(), 0.4, 0.46, 0.02, px - 0.14, y + 0.34, 0.27, 0.01);
  cyl(g, steelTop(), 0.07, 0.07, 0.28, px - 0.14, y + 0.42, 0.06, 18);
  cyl(g, darker(), 0.1, 0.1, 0.05, px - 0.14, y + 0.12, 0.06, 18);
  box(g, steel(), 0.62, 0.06, 0.62, px - 0.08, y + 0.73, -0.04, 0.02);
  hopper(g, px - 0.08, y + 0.86, -0.04, 0.15, 0.24);
  // panel con pantalla y seta de emergencia
  box(g, steel(), 0.24, 0.5, 0.5, px + 0.33, y + 0.25, -0.04, 0.02);
  box(g, darker(), 0.17, 0.12, 0.02, px + 0.33, y + 0.38, 0.215, 0.008);
  box(g, screenM(), 0.14, 0.09, 0.02, px + 0.33, y + 0.38, 0.222, 0.006);
  const stop = cyl(g, btn('#e02a2a'), 0.035, 0.035, 0.035, px + 0.38, y + 0.2, 0.225, 16); stop.rotation.x = Math.PI / 2;
  const button = new THREE.Vector3(px + 0.27, y + 0.2, 0.24);
  const go = cyl(g, btn('#2ecc71'), 0.022, 0.022, 0.02, px + 0.27, y + 0.2, 0.222, 14); go.rotation.x = Math.PI / 2;
  // salida: rampa con una bandeja de pastillas
  box(g, steel(), 0.2, 0.03, 0.2, px + 0.33, y - 0.02, 0.3, 0.008);
  // mesa lateral con blísteres apilados y bandejas de pastillas
  const tx0 = 0.02, tx1 = 0.95, ty = 0.78;
  box(g, steelTop(), tx1 - tx0, 0.04, 0.6, (tx0 + tx1) / 2, ty, 0, 0.012);
  for (const x of [tx0 + 0.05, tx1 - 0.05]) for (const z of [-0.25, 0.25]) leg(g, x, z, ty - 0.06);
  box(g, steel(), tx1 - tx0 - 0.1, 0.025, 0.5, (tx0 + tx1) / 2, 0.22, 0, 0.008);
  const blisterM = M('labBlister', { color: '#d9dee3', roughness: 0.25, metalness: 0.6 });
  const pillM = M('labPastilla', { color: '#e9f5f2', roughness: 0.4 }), pillM2 = M('labPastillaAzul', { color: '#4a8fe0', roughness: 0.4 });
  for (let k = 0; k < 6; k++) box(g, blisterM, 0.3, 0.012, 0.2, 0.75, ty + 0.03 + k * 0.014, -0.17, 0.005);
  for (const [bx, bz] of [[0.3, -0.17]]) {
    box(g, M('labBandejaAzul', { color: '#3a8de0', roughness: 0.35 }), 0.3, 0.02, 0.2, bx, ty + 0.03, bz, 0.006);
    for (let i = 0; i < 3; i++) for (let j = 0; j < 5; j++) { const p = put(g, G('pill', () => new THREE.CapsuleGeometry(0.01, 0.022, 4, 8)), (i + j) % 2 ? pillM : pillM2, bx - 0.1 + j * 0.05, ty + 0.05, bz - 0.05 + i * 0.05, 0, 0, Math.PI / 2); void p; }
  }
  // en la mesa lateral: ingredientes delante, el cuenco y el envasado
  const T = ty + 0.02;
  o.spots = { pack: new THREE.Vector3(0.15, T, 0.2), work: new THREE.Vector3(0.47, T, 0.16), supply: new THREE.Vector3(0.8, T, 0.18), out: new THREE.Vector3(0.75, T + 0.1, -0.17) };
  o.craft = { kind: 'pills', supplies: [new THREE.Vector3(0.12, T, 0.2), new THREE.Vector3(0.35, T, 0.2)], bowl: new THREE.Vector3(0.7, T, 0.16), input: new THREE.Vector3(px - 0.08, y + 1.1, -0.04), button, out: new THREE.Vector3(px + 0.33, y, 0.3), mix: '#eef4f2' };
}

// ======================================================================
//  Estación de líquidos
// ======================================================================
export function buildLiquidStation(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  const b = bench(g, { drawers: 2, binsLow: ['blue', 'black'], blue: false });
  const y = TOP + 0.03;
  // depósito azul transparente con tapa de acero
  const tx = b.x0 + 0.32;
  cyl(g, M('labDeposito', { color: '#7cc4ff', roughness: 0.05, transparent: true, opacity: 0.55 }), 0.17, 0.17, 0.4, tx, y + 0.42, -0.1, 28);
  cyl(g, M('labLiquido', { color: '#2d7fe0', roughness: 0.1, transparent: true, opacity: 0.75, emissive: '#1a58b0', emissiveIntensity: 0.25 }), 0.155, 0.155, 0.28, tx, y + 0.36, -0.1, 28);
  cyl(g, steel(), 0.185, 0.185, 0.04, tx, y + 0.64, -0.1, 28);
  cyl(g, steel(), 0.185, 0.185, 0.04, tx, y + 0.21, -0.1, 28);
  box(g, steel(), 0.3, 0.2, 0.28, tx, y + 0.1, -0.1, 0.02);
  // bloque dosificador con cuatro boquillas y tubos que salen del depósito
  const dx = 0.12;
  box(g, steel(), 0.62, 0.22, 0.26, dx, y + 0.42, -0.14, 0.02);
  const tubeM = M('labTuboNegro', { color: '#1d2126', roughness: 0.5 });
  for (let k = 0; k < 4; k++) {
    const x = dx - 0.21 + k * 0.14;
    cyl(g, steelTop(), 0.018, 0.012, 0.2, x, y + 0.24, -0.06, 12);
    // manguera desde la tapa del depósito, en arco, hasta lo alto del dosificador
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(tx + 0.06 - k * 0.04, y + 0.66, -0.1 + (k - 1.5) * 0.05), new THREE.Vector3((tx + x) / 2, y + 0.86 + k * 0.03, -0.12 + (k - 1.5) * 0.03), new THREE.Vector3(x, y + 0.53, -0.16)]);
    const t = new THREE.Mesh(new THREE.TubeGeometry(c, 20, 0.012, 8, false), k % 2 ? tubeM : M('labTuboAzulClaro', { color: '#3a8de0', roughness: 0.3 }));
    t.castShadow = true; g.add(t);
    box(g, handleBlue(), 0.04, 0.05, 0.05, x, y + 0.34, -0.01, 0.01);
  }
  // panel de mando a la derecha
  const button = controlBox(g, 0.68, y, -0.12, 0.34, 0.5, 0.3);
  // bandeja bajo las boquillas (ahí cae el extracto) y garrafas al fondo
  box(g, M('labBandejaGris', { color: '#4a5560', roughness: 0.35, metalness: 0.5 }), 0.64, 0.03, 0.2, dx, y + 0.015, -0.06, 0.01);
  for (let k = 0; k < 2; k++) bottle(g, -0.42 + k * 0.09, y, -0.32, '#f4f6f8', '#e9eef2', 0.18, 0.035);
  spots(o, { kind: 'liquid', input: new THREE.Vector3(tx, y + 0.66, -0.1), button, out: new THREE.Vector3(dx, y + 0.03, -0.06), mix: '#b48cf0' });
}

// ======================================================================
//  Empacadora avanzada
// ======================================================================
export function buildAutoPacker(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  const w = 2.0, y = 0.82;
  // base de armarios con franjas de luz azul
  box(g, dark(), w, y - 0.08, 0.86, 0, (y - 0.08) / 2 + 0.06, 0, 0.03);
  for (let k = 0; k < 3; k++) {
    box(g, darker(), w / 3 - 0.06, y - 0.24, 0.02, -w / 3 + k * (w / 3), (y - 0.08) / 2 + 0.06, 0.435, 0.01);
    box(g, handleM(), 0.02, 0.16, 0.03, -w / 3 + k * (w / 3) + 0.22, 0.5, 0.45, 0.008);
  }
  for (const x of [-w / 2 + 0.25, w / 2 - 0.25]) box(g, lightBar('#3aa0ff'), 0.03, 0.4, 0.02, x, 0.42, 0.445, 0.008);
  for (const x of [-w / 2 + 0.08, w / 2 - 0.08]) for (const z of [-0.36, 0.36]) cyl(g, darker(), 0.05, 0.055, 0.06, x, 0.03, z, 14);
  // cinta que atraviesa la máquina y sale por los dos lados
  conveyor(g, -w / 2 - 0.35, w / 2 + 0.35, y + 0.04, 0, 0.36);
  for (const x of [-w / 2 - 0.3, w / 2 + 0.3]) for (const z of [-0.14, 0.14]) leg(g, x, z, y);
  // túnel de cristal con marco de acero
  const tx0 = -w / 2 + 0.05, tx1 = w / 2 - 0.45, th = 0.62, ty = y + 0.06;
  for (const x of [tx0, (tx0 + tx1) / 2, tx1]) for (const z of [-0.36, 0.36]) box(g, steel(), 0.04, th, 0.04, x, ty + th / 2, z, 0.008);
  for (const z of [-0.36, 0.36]) box(g, steel(), tx1 - tx0, 0.04, 0.04, (tx0 + tx1) / 2, ty + th, z, 0.008);
  for (const x of [tx0, tx1]) box(g, steel(), 0.04, 0.04, 0.72, x, ty + th, 0, 0.008);
  for (const z of [-0.36, 0.36]) box(g, glass(), tx1 - tx0, th - 0.04, 0.012, (tx0 + tx1) / 2, ty + th / 2, z, 0.004);
  box(g, glass(), tx1 - tx0, 0.012, 0.72, (tx0 + tx1) / 2, ty + th, 0, 0.004);
  // brazo dentro y paquetes en la cinta
  box(g, steel(), 0.06, 0.32, 0.06, -0.15, ty + th - 0.2, 0, 0.01);
  box(g, M('labTuboAzul', { color: '#2f7fd6', roughness: 0.3 }), 0.5, 0.05, 0.05, -0.15, ty + th - 0.08, 0, 0.01);
  const pk = M('labPaquete', { color: '#f1f3f5', roughness: 0.4 }), pkTop = M('labPaqueteTapa', { color: '#f2c94c', roughness: 0.5 });
  for (const x of [-0.65, -0.15, 0.3, w / 2 + 0.15]) { box(g, pk, 0.2, 0.06, 0.16, x, y + 0.09, 0, 0.012); box(g, pkTop, 0.2, 0.012, 0.16, x, y + 0.126, 0, 0.004); }
  box(g, bins.tan, 0.24, 0.16, 0.2, w / 2 + 0.26, y + 0.14, 0, 0.012);
  // armario de control con pantalla, botones y baliza (verde, ámbar, rojo)
  const cx = w / 2 - 0.22;
  box(g, steel(), 0.4, 0.78, 0.6, cx, ty + 0.39, -0.04, 0.025);
  box(g, darker(), 0.26, 0.17, 0.02, cx, ty + 0.56, 0.265, 0.008);
  box(g, screenM(), 0.22, 0.13, 0.02, cx, ty + 0.56, 0.272, 0.006);
  ['#2ecc71', '#f39c12', '#e74c3c'].forEach((c, k) => { const b = cyl(g, btn(c), 0.022, 0.022, 0.02, cx - 0.08 + k * 0.08, ty + 0.36, 0.27, 14); b.rotation.x = Math.PI / 2; });
  cyl(g, darker(), 0.025, 0.025, 0.12, cx + 0.1, ty + 0.84, -0.12, 12);
  ['#2ecc71', '#f5b041', '#e74c3c'].forEach((c, k) => cyl(g, btn(c), 0.04, 0.04, 0.06, cx + 0.1, ty + 0.93 + k * 0.065, -0.12, 16));
}
