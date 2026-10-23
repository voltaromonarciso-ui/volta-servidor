import * as THREE from 'three';
import { prop, wornPaint } from '../entities/realprops.js';
import { metalize } from './labs.js';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { woodTex } from './textures.js';
import { zipBag, jar, shardsBag, budPile, crystalCluster } from '../entities/goods.js';

// Mesas de trabajo de la nave: banco de taller con tablero de madera maciza y
// estructura de acero, y encima el equipo de cada puesto con su producto.
// Cada builder deja en `o.spots` los puntos (locales) que usa la estación de
// empaquetado: montón de envases, producto, zona de trabajo y caja de terminados.

export const BENCH_TOP = 0.92;

const once = (() => { const c = new Map(); return (k, fn) => { if (!c.has(k)) c.set(k, fn()); return c.get(k); }; })();
const rb = (w, h, d, r = 0.01, seg = 2) => once(`rb${w}:${h}:${d}:${r}:${seg}`, () => new RoundedBoxGeometry(w, h, d, seg, r));
const cylG = (rt, rb_, h, n = 20) => once(`cy${rt}:${rb_}:${h}:${n}`, () => new THREE.CylinderGeometry(rt, rb_, h, n));

const M = {
  get wood() { return once('m-wood', () => { const t = woodTex('#b4824e').clone(); t.needsUpdate = true; t.repeat.set(2, 1); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.62 }); }); },
  get frame() { return once('m-frame', () => new THREE.MeshStandardMaterial({ color: 0x2f3b45, roughness: 0.42, metalness: 0.55 })); },
  get steel() { return once('m-steel', () => new THREE.MeshStandardMaterial({ color: 0xd2d7dc, roughness: 0.28, metalness: 0.85 })); },
  get brushed() { return once('m-brushed', () => new THREE.MeshStandardMaterial({ color: 0xb9c1c8, roughness: 0.38, metalness: 0.75 })); },
  get rubber() { return once('m-rubber', () => new THREE.MeshStandardMaterial({ color: 0x1b1e21, roughness: 0.9 })); },
  get plasticW() { return once('m-pw', () => new THREE.MeshStandardMaterial({ color: 0xeef0f1, roughness: 0.45 })); },
  get plasticD() { return once('m-pd', () => new THREE.MeshStandardMaterial({ color: 0x3a434b, roughness: 0.5 })); },
  get red() { return once('m-red', () => new THREE.MeshStandardMaterial({ color: 0xd63a2f, roughness: 0.4 })); },
  get crate() { return once('m-crate', () => new THREE.MeshStandardMaterial({ color: 0x2f7fc1, roughness: 0.55 })); },
  get mat() { return once('m-mat', () => new THREE.MeshStandardMaterial({ map: cuttingMatTex(), roughness: 0.8 })); },
  get glass() { return once('m-glassblk', () => new THREE.MeshStandardMaterial({ color: 0x0d0f12, roughness: 0.12, metalness: 0.4 })); },
  get card() { return once('m-card', () => new THREE.MeshStandardMaterial({ color: 0xc89a62, roughness: 0.9 })); },
};
const glow = (hex) => once('glow' + hex, () => new THREE.MeshBasicMaterial({ color: hex, toneMapped: false }));

function cuttingMatTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 160;
  const x = c.getContext('2d');
  x.fillStyle = '#2f7d55'; x.fillRect(0, 0, 256, 160);
  x.strokeStyle = 'rgba(220,255,230,0.35)'; x.lineWidth = 1;
  for (let i = 0; i <= 256; i += 16) { x.beginPath(); x.moveTo(i, 0); x.lineTo(i, 160); x.stroke(); }
  for (let i = 0; i <= 160; i += 16) { x.beginPath(); x.moveTo(0, i); x.lineTo(256, i); x.stroke(); }
  x.strokeStyle = 'rgba(255,255,255,0.6)'; x.lineWidth = 2; x.strokeRect(4, 4, 248, 152);
  x.fillStyle = 'rgba(255,255,255,0.75)'; x.font = 'bold 10px sans-serif';
  for (let i = 1; i < 16; i++) x.fillText(String(i), i * 16 - 3, 14);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  return t;
}

function add(geo, mat, x, y, z, parent, shadow = true) {
  const m = new THREE.Mesh(geo, mat);
  m.position.set(x, y, z);
  m.castShadow = shadow; m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Banco: tablero de 5 cm, patas de tubo cuadrado, travesaños, balda inferior y pies.
export function workbench(g, w, d) {
  const top = BENCH_TOP;
  add(rb(w, 0.05, d, 0.012, 3), M.wood, 0, top - 0.025, 0, g);
  const lx = w / 2 - 0.06, lz = d / 2 - 0.06;
  for (const [x, z] of [[-lx, -lz], [lx, -lz], [-lx, lz], [lx, lz]]) {
    add(rb(0.05, top - 0.07, 0.05, 0.008), M.frame, x, (top - 0.05) / 2 + 0.02, z, g);
    add(cylG(0.026, 0.03, 0.02, 12), M.rubber, x, 0.01, z, g, false);
  }
  for (const z of [-lz, lz]) add(rb(w - 0.12, 0.05, 0.03, 0.006), M.frame, 0, top - 0.08, z, g);
  for (const x of [-lx, lx]) add(rb(0.03, 0.05, d - 0.12, 0.006), M.frame, x, top - 0.08, 0, g);
  add(rb(w - 0.1, 0.025, d - 0.1, 0.006), M.frame, 0, 0.2, 0, g);
  // regleta trasera con enchufes
  add(rb(w * 0.5, 0.04, 0.03, 0.006), M.plasticW, -w * 0.18, top + 0.02, -d / 2 + 0.03, g);
  for (let i = 0; i < 4; i++) add(rb(0.03, 0.03, 0.004, 0.004), M.plasticD, -w * 0.18 - w * 0.18 + i * w * 0.12, top + 0.02, -d / 2 + 0.047, g, false);
}

function deskLamp(g, x, z, rot = 0) {
  const l = new THREE.Group();
  l.position.set(x, BENCH_TOP, z); l.rotation.y = rot;
  add(cylG(0.07, 0.08, 0.02, 24), M.plasticD, 0, 0.01, 0, l);
  const a1 = add(rb(0.018, 0.34, 0.018, 0.006), M.plasticD, 0, 0.18, 0, l); a1.rotation.z = 0.25;
  const a2 = add(rb(0.016, 0.3, 0.016, 0.006), M.plasticD, -0.11, 0.38, 0, l); a2.rotation.z = 1.1;
  const head = add(once('lampHead', () => new THREE.ConeGeometry(0.07, 0.11, 24, 1, true)), M.plasticD, -0.24, 0.42, 0, l);
  head.rotation.z = 2.3;
  add(once('bulbG', () => new THREE.SphereGeometry(0.03, 12, 8)), glow(0xfff2c8), -0.215, 0.395, 0, l, false);
  g.add(l);
}

function scale(g, x, z) {
  const s = new THREE.Group(); s.position.set(x, BENCH_TOP, z);
  add(rb(0.2, 0.035, 0.24, 0.012, 3), M.plasticW, 0, 0.0175, 0, s);
  add(rb(0.17, 0.008, 0.17, 0.004), M.steel, 0, 0.04, -0.02, s);
  add(rb(0.12, 0.022, 0.006, 0.003), M.plasticD, 0, 0.022, 0.12, s, false);
  add(once('lcdG', () => new THREE.PlaneGeometry(0.08, 0.014)), glow(0x7dffb0), 0, 0.022, 0.1235, s, false);
  g.add(s);
  return s;
}

// Bandeja de plástico con cogollos sueltos (el producto que se envasa).
function budTray(g, x, z, color = '#6abf45') {
  const t = new THREE.Group(); t.position.set(x, BENCH_TOP, z);
  add(rb(0.26, 0.04, 0.2, 0.01, 2), M.plasticW, 0, 0.02, 0, t);
  add(rb(0.24, 0.01, 0.18, 0.004), M.plasticD, 0, 0.036, 0, t, false);
  const pile = new THREE.Group(); pile.position.y = 0.04;
  budPile(pile, color, 9, 0.17, 0.12, 0.032, 11);
  t.add(pile);
  t.userData.pile = pile;
  g.add(t);
  return t;
}

function crate(g, x, z, w = 0.3, d = 0.22, h = 0.12) {
  const c = new THREE.Group(); c.position.set(x, BENCH_TOP, z);
  add(rb(w, 0.012, d, 0.004), M.crate, 0, 0.006, 0, c);
  for (const [px, pz, sw, sd] of [[0, d / 2, w, 0.012], [0, -d / 2, w, 0.012], [w / 2, 0, 0.012, d], [-w / 2, 0, 0.012, d]]) add(rb(sw, h, sd, 0.004), M.crate, px, h / 2, pz, c);
  g.add(c);
  return c;
}

// ------------------------------------------------------------------
//  Mesa de empaquetado (sobres y bolsas Sweet Shards)
// ------------------------------------------------------------------
export function buildPacker(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  workbench(g, 1.6, 0.9);
  // tapete de corte en la zona de trabajo
  const mat = add(once('matG', () => new THREE.BoxGeometry(0.62, 0.004, 0.42)), M.mat, 0, BENCH_TOP + 0.002, 0.08, g, false);
  mat.receiveShadow = true;
  scale(g, -0.48, 0.14);
  // dispensador de sobres zip vacíos (montón)
  const disp = new THREE.Group(); disp.position.set(-0.52, BENCH_TOP, -0.2);
  add(rb(0.14, 0.05, 0.17, 0.004), M.card, 0, 0.025, 0, disp);
  for (let i = 0; i < 6; i++) { const b = zipBag(null, { flat: true }); b.rotation.x = -Math.PI / 2; b.rotation.z = (i % 3 - 1) * 0.05; b.position.set(0, 0.052 + i * 0.004, 0); b.scale.setScalar(1.3); disp.add(b); }
  g.add(disp);
  // bandeja de cogollos
  o.supply = budTray(g, 0.42, 0.1);
  // caja de terminados con algunos sobres y bolsas
  const out = crate(g, 0.45, -0.24);
  for (let i = 0; i < 3; i++) { const b = zipBag('#6abf45', { seed: i }); b.rotation.set(-1.25, 0, (i - 1) * 0.3); b.position.set(-0.08 + i * 0.08, 0.05, 0); out.add(b); }
  const ss = shardsBag(true); ss.rotation.set(-1.2, 0, -0.2); ss.position.set(0.0, 0.07, 0.04); out.add(ss);
  deskLamp(g, -0.7, -0.33, 0.4);
  // rollo de etiquetas y tijeras
  const roll = add(cylG(0.04, 0.04, 0.05, 20), M.plasticW, -0.24, BENCH_TOP + 0.04, -0.3, g); roll.rotation.z = Math.PI / 2;
  add(cylG(0.016, 0.016, 0.052, 12), M.plasticD, -0.24, BENCH_TOP + 0.04, -0.3, g).rotation.z = Math.PI / 2;
  packerDressing(g);
  o.spots = {
    pack: new THREE.Vector3(-0.52, BENCH_TOP + 0.08, -0.2),
    supply: new THREE.Vector3(0.42, BENCH_TOP + 0.06, 0.1),
    work: new THREE.Vector3(0, BENCH_TOP + 0.005, 0.08),
    out: new THREE.Vector3(0.45, BENCH_TOP + 0.06, -0.24),
  };
}

// Como la lámina: cajonera con tiradores, cajas de colores en la balda, estante alto con barra
// de luz y cajas de cartón, cinta de embalar y papelera al lado (nada pisa la zona de trabajo)
function packerDressing(g) {
  const top = BENCH_TOP, dk = wornPaint('#454b53', { metalness: 0.45 }), dk2 = wornPaint('#2c3036', { metalness: 0.4 });
  // cajonera de tres cajones bajo el tablero, a la derecha
  add(rb(0.4, top - 0.2, 0.74, 0.015), dk, 0.5, (top - 0.2) / 2 + 0.1, 0, g);
  for (let k = 0; k < 3; k++) {
    const y = 0.17 + k * 0.22;
    add(rb(0.36, 0.19, 0.02, 0.006), dk2, 0.5, y, 0.375, g);
    add(rb(0.17, 0.022, 0.03, 0.008), M.steel, 0.5, y + 0.04, 0.39, g);
  }
  // cajas de plástico en la balda de abajo
  prop(g, 'plastic_crate_02', { x: -0.48, y: 0.215, z: 0.05, ry: Math.PI / 2, fit: [0.6, 0.26, 0.34] });
  prop(g, 'cardboard_box_01', { x: -0.12, y: 0.215, z: 0.05, ry: 0.05, fit: [0.32, 0.5, 0.6] });
  // bolsa de basura y extintor al lado izquierdo
  prop(g, 'trashbag', { x: -0.98, z: 0.1, h: 0.5, ry: 0.4 });
  prop(g, 'korean_fire_extinguisher_01', { x: -0.98, z: -0.28, h: 0.55, ry: 0.6 });
  // estante alto al fondo: dos postes, barra de luz y cajas de cartón encima
  const z = -0.4, h = 0.62;
  for (const x of [-0.66, 0.66]) add(rb(0.04, h, 0.04, 0.008), M.frame, x, top + h / 2, z, g);
  add(rb(1.36, 0.04, 0.2, 0.008), M.frame, 0, top + h, z + 0.04, g);
  add(rb(1.2, 0.025, 0.05, 0.008), glow(0xffe6b0), 0, top + h - 0.035, z + 0.1, g, false);
  add(rb(1.32, 0.025, 0.2, 0.006), M.frame, 0, top + h * 0.55, z + 0.04, g);
  for (const [x, ry] of [[-0.42, 0.1], [0.05, Math.PI / 2], [0.42, -0.08]]) prop(g, 'cardboard_box_01', { x, y: top + h + 0.02, z: z + 0.04, ry, fit: [0.26, 0.2, 0.2] });
  for (const x of [-0.5, -0.25]) add(rb(0.18, 0.02, 0.14, 0.004), M.plasticW, x, top + h * 0.55 + 0.024, z + 0.04, g);
  // cinta de embalar amarilla en su dispensador, sobre el estante
  const tape = add(cylG(0.055, 0.055, 0.045, 20), once('m-cinta', () => new THREE.MeshStandardMaterial({ color: 0xe8b31c, roughness: 0.45 })), 0.35, top + h * 0.55 + 0.07, z + 0.04, g);
  tape.rotation.x = Math.PI / 2;
  add(rb(0.14, 0.04, 0.06, 0.008), M.plasticD, 0.35, top + h * 0.55 + 0.035, z + 0.04, g);
}

// ------------------------------------------------------------------
//  Envasadora de tarros
// ------------------------------------------------------------------
export function buildJarPacker(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  workbench(g, 1.3, 0.8);
  // máquina selladora al fondo: base, columna, cabezal y palanca
  const m = new THREE.Group(); m.position.set(-0.42, BENCH_TOP, -0.2);
  add(rb(0.3, 0.07, 0.3, 0.02, 3), M.brushed, 0, 0.035, 0, m);
  add(cylG(0.09, 0.09, 0.01, 32), M.rubber, 0, 0.075, 0.02, m, false);
  add(cylG(0.025, 0.025, 0.5, 16), M.steel, 0, 0.32, -0.11, m);
  add(rb(0.2, 0.09, 0.22, 0.02, 3), M.red, 0, 0.47, -0.02, m);
  add(cylG(0.055, 0.055, 0.05, 24), M.steel, 0, 0.4, 0.02, m);
  const lever = add(cylG(0.01, 0.01, 0.24, 10), M.steel, 0.14, 0.53, 0.0, m); lever.rotation.z = -1.0;
  add(once('knobG', () => new THREE.SphereGeometry(0.025, 14, 10)), M.plasticD, 0.24, 0.6, 0.0, m);
  add(rb(0.12, 0.05, 0.006, 0.004), M.plasticD, 0, 0.47, 0.092, m, false);
  add(once('jlcd', () => new THREE.PlaneGeometry(0.08, 0.025)), glow(0x55d6ff), 0, 0.47, 0.0955, m, false);
  const j0 = jar('#6abf45', { seed: 9 }); j0.position.y = 0.08; m.add(j0);
  g.add(m);
  // tapete de trabajo
  add(once('jmatG', () => new THREE.BoxGeometry(0.34, 0.004, 0.28)), M.mat, 0, BENCH_TOP + 0.002, 0.1, g, false);
  // tarros vacíos a la izquierda, tapones y tarros llenos al fondo
  for (let i = 0; i < 4; i++) { const j = jar(null, { lid: false }); j.position.set(-0.52 + (i % 2) * 0.1, BENCH_TOP, 0.12 + Math.floor(i / 2) * 0.12); g.add(j); }
  const lids = new THREE.Group(); lids.position.set(-0.12, BENCH_TOP, -0.26);
  for (let i = 0; i < 5; i++) { const l = jar(null).userData.lid; l.position.set(0, i * 0.026, 0); lids.add(l); }
  g.add(lids);
  const out = crate(g, 0.38, -0.22, 0.32, 0.22, 0.08);
  for (let i = 0; i < 3; i++) { const j = jar('#6abf45', { seed: i + 3 }); j.position.set(-0.09 + i * 0.09, 0.012, 0); out.add(j); }
  o.supply = budTray(g, 0.4, 0.14);
  o.spots = {
    pack: new THREE.Vector3(-0.47, BENCH_TOP + 0.05, 0.18),
    supply: new THREE.Vector3(0.4, BENCH_TOP + 0.05, 0.14),
    work: new THREE.Vector3(0, BENCH_TOP + 0.005, 0.1),
    out: new THREE.Vector3(0.38, BENCH_TOP + 0.03, -0.22),
  };
}

// ------------------------------------------------------------------
//  Hornillo de cristalización
// ------------------------------------------------------------------
export function buildStove(o) {
  const g = o.group;
  queueMicrotask(() => metalize(g));
  // mueble de acero inoxidable con puertas y zócalo
  add(rb(1.2, 0.8, 0.75, 0.025, 3), M.brushed, 0, 0.44, 0, g);
  add(rb(1.16, 0.06, 0.7, 0.01), M.rubber, 0, 0.03, 0.0, g);
  for (const x of [-0.29, 0.29]) {
    add(rb(0.56, 0.6, 0.012, 0.006), M.steel, x, 0.42, 0.38, g);
    add(rb(0.22, 0.016, 0.016, 0.006), M.plasticD, x, 0.62, 0.395, g);
  }
  // encimera de vitrocerámica
  add(rb(1.22, 0.04, 0.77, 0.012), M.steel, 0, 0.86, 0, g);
  add(rb(1.1, 0.012, 0.6, 0.004), M.glass, 0, 0.885, 0.02, g, false);
  o.flames = [];
  for (const x of [-0.3, 0.3]) {
    add(cylG(0.14, 0.14, 0.004, 32), once('ringM', () => new THREE.MeshStandardMaterial({ color: 0x3a3f45, roughness: 0.6 })), x, 0.893, 0.02, g, false);
    const f = add(once('flameG', () => new THREE.TorusGeometry(0.1, 0.012, 6, 32)), new THREE.MeshBasicMaterial({ color: 0xff7a1a, toneMapped: false, transparent: true, opacity: 0 }), x, 0.9, 0.02, g, false);
    f.rotation.x = Math.PI / 2;
    o.flames.push(f);
    // rejilla
    for (const r of [0, Math.PI / 2]) { const b = add(rb(0.3, 0.012, 0.012, 0.004), M.rubber, x, 0.905, 0.02, g, false); b.rotation.y = r; }
  }
  // cazo de acero con asas y tapa de cristal
  const pot = new THREE.Group(); pot.position.set(-0.3, 0.91, 0.02);
  const prof = [[0, 0], [0.11, 0], [0.12, 0.01], [0.12, 0.13], [0.125, 0.135]].map(([a, b]) => new THREE.Vector2(a, b));
  add(once('potG', () => new THREE.LatheGeometry(prof, 32)), once('potM', () => new THREE.MeshStandardMaterial({ color: 0xc9cfd5, roughness: 0.25, metalness: 0.9, side: THREE.DoubleSide })), 0, 0, 0, pot);
  for (const s of [-1, 1]) add(rb(0.07, 0.016, 0.03, 0.006), M.plasticD, s * 0.155, 0.11, 0, pot);
  o.liquid = add(cylG(0.115, 0.115, 0.01, 32), new THREE.MeshStandardMaterial({ color: 0xc58bff, emissive: 0x8a4dff, emissiveIntensity: 0, roughness: 0.15 }), 0, 0.1, 0, pot, false);
  g.add(pot);
  // bandeja de cristalización
  const tray = new THREE.Group(); tray.position.set(0.3, 0.905, 0.02);
  add(rb(0.34, 0.03, 0.26, 0.008), M.steel, 0, 0.015, 0, tray);
  add(rb(0.31, 0.006, 0.23, 0.003), once('trayIn', () => new THREE.MeshStandardMaterial({ color: 0xf1eef6, roughness: 0.4 })), 0, 0.031, 0, tray, false);
  const cr = new THREE.Group(); cr.position.y = 0.03; tray.add(cr);
  o.tray = crystalCluster(cr, 9, 0.22, 0.08, 7);
  g.add(tray);
  // mandos y pantalla en el frontal
  for (let i = 0; i < 4; i++) { const k = add(cylG(0.022, 0.022, 0.025, 16), M.plasticD, -0.42 + i * 0.1 + (i > 1 ? 0.5 : 0), 0.79, 0.385, g); k.rotation.x = Math.PI / 2; }
  add(rb(0.18, 0.06, 0.01, 0.004), M.rubber, 0, 0.79, 0.382, g);
  o.led = add(once('stLcd', () => new THREE.PlaneGeometry(0.14, 0.035)), new THREE.MeshBasicMaterial({ color: 0x333333, toneMapped: false }), 0, 0.79, 0.388, g, false);
  // estante lateral con ingredientes
  const shelf = new THREE.Group(); shelf.position.set(0.48, 0.86, -0.3);
  add(rb(0.12, 0.16, 0.08, 0.01), once('sugarM', () => new THREE.MeshStandardMaterial({ color: 0xf6f6f2, roughness: 0.7 })), 0, 0.1, 0, shelf);
  add(rb(0.122, 0.05, 0.082, 0.004), once('sugarL', () => new THREE.MeshStandardMaterial({ color: 0x4a90d9, roughness: 0.6 })), 0, 0.1, 0, shelf);
  ['#ef4b6c', '#a463f2', '#3fa9f5'].forEach((c, i) => {
    add(cylG(0.016, 0.018, 0.08, 14), once('dye' + c, () => new THREE.MeshStandardMaterial({ color: c, roughness: 0.3 })), -0.2 + i * 0.045, 0.06, 0.02, shelf);
    add(cylG(0.006, 0.01, 0.025, 10), M.plasticW, -0.2 + i * 0.045, 0.11, 0.02, shelf);
  });
  g.add(shelf);
}
