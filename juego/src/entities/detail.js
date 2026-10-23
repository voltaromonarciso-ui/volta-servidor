// Detalles que quitan el aspecto de «bloques lisos»: etiquetas impresas con texto, tornillos,
// rejillas de ventilación, tapones estriados, piezas torneadas, cartón con cinta, cables.
// Todo cacheado (geometrías, materiales y texturas compartidos entre copias).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const geos = new Map(), mats = new Map(), texs = new Map();
export const G = (k, f) => { if (!geos.has(k)) geos.set(k, f()); return geos.get(k); };
export const M = (k, o) => { if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(o)); return mats.get(k); };
export function mesh(parent, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
}
export const rbox = (w, h, d, r = 0.004) => G(`rb${w}|${h}|${d}|${r}`, () => new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99));

// ---------- texturas ----------
export function canvasTex(key, w, h, draw, { repeat = false, srgb = true } = {}) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texs.set(key, t);
  }
  return texs.get(key);
}
// Etiqueta impresa: fondo, franja de color, título, subtítulo, icono simple y código de barras
export function labelTex(key, { bg = '#f6f1e4', band = '#2c74c9', title = '', sub = '', icon = null, barcode = true, ink = '#1d2126', w = 256, h = 160 } = {}) {
  return canvasTex('lab:' + key, w, h, (c) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.fillStyle = band; c.fillRect(0, 0, w, h * 0.22); c.fillRect(0, h * 0.9, w, h * 0.1);
    c.fillStyle = '#fff'; c.font = `bold ${Math.round(h * 0.13)}px Arial, sans-serif`; c.textAlign = 'left'; c.textBaseline = 'middle';
    c.fillText(sub.toUpperCase().slice(0, 22), w * 0.05, h * 0.11);
    c.fillStyle = ink; c.font = `900 ${Math.round(h * 0.2)}px "Arial Black", Arial, sans-serif`;
    c.fillText(title, w * 0.05, h * 0.42);
    c.font = `${Math.round(h * 0.085)}px Arial, sans-serif`; c.fillStyle = '#555';
    c.fillText('Lote 07-B · Cont. neto', w * 0.05, h * 0.6);
    c.fillText('Uso exclusivo profesional', w * 0.05, h * 0.71);
    if (icon === 'leaf') { c.fillStyle = band; for (const a of [-0.9, -0.45, 0, 0.45, 0.9]) { c.save(); c.translate(w * 0.82, h * 0.58); c.rotate(a); c.beginPath(); c.ellipse(0, -h * 0.13, w * 0.022, h * 0.15, 0, 0, Math.PI * 2); c.fill(); c.restore(); } }
    else if (icon === 'warn') { c.fillStyle = '#f1c40f'; c.beginPath(); c.moveTo(w * 0.82, h * 0.32); c.lineTo(w * 0.94, h * 0.76); c.lineTo(w * 0.7, h * 0.76); c.closePath(); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 3; c.stroke(); c.fillStyle = '#111'; c.font = `bold ${Math.round(h * 0.26)}px Arial`; c.textAlign = 'center'; c.fillText('!', w * 0.82, h * 0.6); c.textAlign = 'left'; }
    else if (icon === 'drop') { c.fillStyle = band; c.beginPath(); c.moveTo(w * 0.82, h * 0.3); c.quadraticCurveTo(w * 0.93, h * 0.6, w * 0.82, h * 0.78); c.quadraticCurveTo(w * 0.71, h * 0.6, w * 0.82, h * 0.3); c.fill(); }
    if (barcode) { c.fillStyle = '#111'; let x = w * 0.05; for (let i = 0; i < 34; i++) { const bw = (i * 7) % 3 + 1; c.fillRect(x, h * 0.76, bw, h * 0.11); x += bw + 1.5; } }
  });
}
// Cartón ondulado con cinta de embalar y alguna marca impresa
export function cardboardTex(key = 'carton', { tape = true, print = 'FRÁGIL' } = {}) {
  return canvasTex('carton:' + key, 256, 256, (c, w, h) => {
    c.fillStyle = '#b8895a'; c.fillRect(0, 0, w, h);
    let s = 9; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 1800; i++) { c.fillStyle = `rgba(${R() < 0.5 ? '90,60,30' : '230,200,160'},${R() * 0.12})`; c.fillRect(R() * w, R() * h, 1 + R() * 3, 1); }
    c.strokeStyle = 'rgba(80,55,30,0.15)'; c.lineWidth = 1; for (let y = 0; y < h; y += 6) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y); c.stroke(); }
    if (tape) { c.fillStyle = 'rgba(210,180,120,0.9)'; c.fillRect(w * 0.42, 0, w * 0.16, h); c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(w * 0.44, 0, w * 0.02, h); }
    if (print) { c.save(); c.translate(w * 0.2, h * 0.75); c.rotate(-0.05); c.strokeStyle = '#a02a1e'; c.lineWidth = 3; c.strokeRect(-6, -18, 92, 26); c.fillStyle = '#a02a1e'; c.font = 'bold 18px Arial'; c.fillText(print, 0, 0); c.restore();
      c.fillStyle = 'rgba(30,30,30,0.7)'; c.font = 'bold 14px Arial'; c.fillText('↑↑', w * 0.78, h * 0.2); }
  });
}
// Arañazos y desgaste suave para encima de un metal (se usa como mapa de rugosidad)
export function wearTex(key = 'desgaste') {
  return canvasTex('wear:' + key, 256, 256, (c, w, h) => {
    c.fillStyle = '#7a7a7a'; c.fillRect(0, 0, w, h);
    let s = 21; const R = () => ((s = (s * 9301 + 49297) % 233280) / 233280);
    for (let i = 0; i < 260; i++) { const x = R() * w, y = R() * h, a = R() * Math.PI, l = 4 + R() * 26; c.strokeStyle = `rgba(${R() < 0.5 ? 40 : 200},${R() < 0.5 ? 40 : 200},${R() < 0.5 ? 40 : 200},${0.2 + R() * 0.3})`; c.lineWidth = 0.6 + R(); c.beginPath(); c.moveTo(x, y); c.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
  }, { repeat: true, srgb: false });
}
// Rejilla de agujeros (chapa perforada), con transparencia
export function perforatedTex(key = 'perforada', base = '#5d666e') {
  return canvasTex('perf:' + key, 128, 128, (c, w, h) => {
    c.fillStyle = base; c.fillRect(0, 0, w, h);
    c.fillStyle = '#0d0f11'; for (let y = 4; y < h; y += 8) for (let x = (y / 8) % 2 ? 8 : 4; x < w; x += 8) { c.beginPath(); c.arc(x, y, 2.2, 0, Math.PI * 2); c.fill(); }
  }, { repeat: true });
}

// ---------- piezas ----------
// Tornillo de cabeza redonda con ranura, mirando hacia `n` ('z', 'x' o 'y')
export function screw(parent, x, y, z, n = 'z', r = 0.006) {
  const head = mesh(parent, G('tornillo' + r, () => new THREE.SphereGeometry(r, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2)), M('tornillo', { color: '#c9ced3', roughness: 0.3, metalness: 0.9 }), x, y, z);
  const slot = mesh(head, G('ranura' + r, () => new THREE.BoxGeometry(r * 1.6, r * 0.25, r * 0.35)), M('ranura', { color: '#3a3f45', roughness: 0.5 }), 0, r * 0.85, 0);
  void slot;
  if (n === 'z') head.rotation.x = Math.PI / 2; else if (n === '-z') head.rotation.x = -Math.PI / 2; else if (n === 'x') head.rotation.z = -Math.PI / 2; else if (n === '-x') head.rotation.z = Math.PI / 2;
  return head;
}
export function screws4(parent, cx, cy, z, w, h, n = 'z', inset = 0.015) {
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) screw(parent, cx + sx * (w / 2 - inset), cy + sy * (h / 2 - inset), z, n);
}
// Rejilla de ventilación: lamas en relieve dentro de un marco
export function vent(parent, x, y, z, w, h, ry = 0, n = 6) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.rotation.y = ry; parent.add(g);
  const dark = M('rejillaFondo', { color: '#15181b', roughness: 0.8 }), slat = M('rejillaLama', { color: '#6f7880', roughness: 0.45, metalness: 0.7 });
  mesh(g, rbox(w, h, 0.004, 0.002), dark, 0, 0, 0);
  for (let i = 0; i < n; i++) { const s = mesh(g, rbox(w * 0.86, h / n * 0.42, 0.006, 0.0015), slat, 0, -h / 2 + (i + 0.5) * (h / n), 0.003); s.rotation.x = -0.5; }
  return g;
}
// Tapón estriado (nervios verticales), centrado en la base
export function ribbedCap(r, h, color = '#24272b', n = 28) {
  return G(`tapon${r}|${h}|${n}`, () => {
    const g = new THREE.CylinderGeometry(r, r, h, n * 2, 1);
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), k = 1 + (Math.floor(((a + Math.PI) / (Math.PI * 2)) * n * 2) % 2 ? 0.06 : 0); if (Math.abs(p.getY(i)) < h / 2 - 1e-6 || Math.hypot(x, z) > r * 0.9) { p.setX(i, x * k); p.setZ(i, z * k); } }
    g.translate(0, h / 2, 0); g.computeVertexNormals(); void color;
    return g;
  });
}
// Pieza torneada a partir de un perfil [[radio, altura], …]
export function lathe(key, prof, seg = 28) {
  return G('torno:' + key, () => new THREE.LatheGeometry(prof.map(([a, b]) => new THREE.Vector2(a, b)), seg));
}
// Cable que cuelga entre dos puntos (catenaria sencilla)
export function cable(parent, a, b, sag = 0.08, r = 0.006, color = '#1b1d20') {
  const mid = a.clone().lerp(b, 0.5); mid.y -= sag;
  const c = new THREE.CatmullRomCurve3([a, a.clone().lerp(mid, 0.5).setY(a.y - sag * 0.6), mid, b.clone().lerp(mid, 0.5).setY(b.y - sag * 0.6), b]);
  return mesh(parent, new THREE.TubeGeometry(c, 24, r, 6, false), M('cable' + color, { color, roughness: 0.6 }));
}
// Plano con textura (etiqueta pegada) delante de una cara
export function decal(parent, tex, w, h, x, y, z, ry = 0, rx = 0) {
  const m = new THREE.Mesh(G(`plano${w}|${h}`, () => new THREE.PlaneGeometry(w, h)), M('decal' + tex.uuid, { map: tex, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2 }));
  m.position.set(x, y, z); m.rotation.set(rx, ry, 0); parent.add(m); return m;
}
// Etiqueta enrollada alrededor de un cilindro (botes, frascos)
export function wrapLabel(parent, tex, r, h, y, arc = Math.PI * 1.2) {
  const m = new THREE.Mesh(G(`envuelta${r}|${h}|${arc}`, () => new THREE.CylinderGeometry(r, r, h, 32, 1, true, -arc / 2, arc)), M('wrap' + tex.uuid, { map: tex, roughness: 0.6, side: THREE.FrontSide }));
  m.position.y = y; parent.add(m); return m;
}
