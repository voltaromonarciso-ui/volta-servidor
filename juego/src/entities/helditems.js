// Objetos en la mano con más calidad (realistas, con texturas): formas torneadas, etiquetas
// impresas y materiales de verdad (cartón, plástico con brillo, metal con reflejos, barro).
// Cada función devuelve { group, pose } como buildItem (hands.js); null = usa el de siempre.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';

const cache = new Map();
const once = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
const rb = (w, h, d, r = 0.006) => once(`rb${w},${h},${d},${r}`, () => new RoundedBoxGeometry(w, h, d, 3, r));
const std = (k, o) => once('m' + k, () => new THREE.MeshStandardMaterial({ roughness: 0.7, ...o }));
const phys = (k, o) => once('p' + k, () => new THREE.MeshPhysicalMaterial({ roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25, ...o }));
function add(g, geo, mat, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0) {
  const m = new THREE.Mesh(geo, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); g.add(m); return m;
}
const lathe = (k, pts, seg = 28) => once('l' + k, () => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg));

// Textura dibujada en un lienzo (una vez)
function tex(k, w, h, draw) {
  return once('t' + k, () => {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    return t;
  });
}
// ruido fino (fibras, poros) sobre lo que haya
function grain(c, w, h, a = 0.06, n = 1800) {
  for (let i = 0; i < n; i++) { c.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * a})`; c.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1); }
}
function label(c, w, h, { bg, fg = '#fff', title, sub, band, logo }) {
  c.fillStyle = bg; c.fillRect(0, 0, w, h);
  if (band) { c.fillStyle = band; c.fillRect(0, h * 0.62, w, h * 0.16); }
  if (logo) logo(c, w, h);
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  let fs = Math.floor(h * 0.2); c.font = `900 ${fs}px sans-serif`;
  while (c.measureText(title).width > w * 0.88 && fs > 10) { fs -= 2; c.font = `900 ${fs}px sans-serif`; }
  c.fillText(title, w / 2, h * 0.3);
  if (sub) { c.font = `700 ${Math.floor(h * 0.09)}px sans-serif`; c.fillText(sub, w / 2, h * 0.5); }
  grain(c, w, h, 0.05, 900);
}

// --- cartón con fibras, cinta y una etiqueta con el dibujo y el nombre del contenido ---
function boxTex(name, draw) {
  return tex('caja' + name, 256, 192, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#c99a5e'); gr.addColorStop(1, '#b8874c');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(90,60,30,0.12)'; for (let y = 0; y < h; y += 3) { c.beginPath(); c.moveTo(0, y); c.lineTo(w, y + (Math.random() - 0.5) * 2); c.stroke(); }
    grain(c, w, h, 0.08, 2500);
    c.fillStyle = 'rgba(214,190,140,0.85)'; c.fillRect(w / 2 - 18, 0, 36, h); // cinta
    if (draw) {
      c.fillStyle = '#f4efe6'; c.fillRect(18, 34, 96, 96); c.strokeStyle = '#3a3a3a'; c.lineWidth = 2; c.strokeRect(18, 34, 96, 96);
      c.save(); c.translate(66, 82); draw(c); c.restore();
      c.fillStyle = '#2a2420'; c.font = '900 22px sans-serif'; c.textAlign = 'left'; c.fillText(name.toUpperCase(), 140, 70);
      c.font = '700 13px sans-serif'; c.fillText('MONTAJE FÁCIL', 140, 96);
      c.fillStyle = '#2a2420'; for (let i = 0; i < 14; i++) c.fillRect(140 + i * 6, 120, i % 3 ? 2 : 4, 26); // código de barras
    } else {
      c.fillStyle = '#f4efe6'; c.fillRect(20, 120, 90, 46); c.fillStyle = '#2a2420';
      for (let i = 0; i < 14; i++) c.fillRect(26 + i * 6, 128, i % 3 ? 2 : 4, 30);
    }
    c.strokeStyle = '#2a2420'; c.lineWidth = 3; // flechas «este lado arriba»
    for (const x of [w - 60, w - 34]) { c.beginPath(); c.moveTo(x, 170); c.lineTo(x, 140); c.moveTo(x - 7, 148); c.lineTo(x, 140); c.lineTo(x + 7, 148); c.stroke(); }
  });
}
const PICT = {
  mesa_emp: (c) => { c.fillStyle = '#7b5a3a'; c.fillRect(-36, -8, 72, 9); c.fillRect(-32, 0, 5, 30); c.fillRect(27, 0, 5, 30); c.fillStyle = '#6abf45'; c.beginPath(); c.arc(-10, -14, 6, 0, 7); c.fill(); c.fillStyle = '#cfe6ee'; c.fillRect(6, -22, 12, 14); },
  estante: (c) => { c.fillStyle = '#555'; c.fillRect(-30, -36, 5, 72); c.fillRect(25, -36, 5, 72); c.fillStyle = '#9a7a55'; for (let i = 0; i < 4; i++) c.fillRect(-30, -34 + i * 22, 60, 5); },
  lampara: (c) => { c.fillStyle = '#333'; c.fillRect(-26, -30, 52, 10); c.fillStyle = '#ffe9a6'; c.fillRect(-22, -20, 44, 4); c.strokeStyle = '#333'; c.lineWidth = 2; c.beginPath(); c.moveTo(-20, -30); c.lineTo(-10, -40); c.moveTo(20, -30); c.lineTo(10, -40); c.stroke(); c.fillStyle = 'rgba(255,230,140,0.45)'; c.beginPath(); c.moveTo(-22, -16); c.lineTo(22, -16); c.lineTo(34, 34); c.lineTo(-34, 34); c.fill(); },
  envasadora: (c) => { c.fillStyle = '#9aa3aa'; c.fillRect(-30, -10, 60, 34); c.fillStyle = '#2b2d31'; c.fillRect(-20, -26, 40, 16); c.fillStyle = '#7fc8ff'; c.fillRect(-12, -22, 24, 8); },
  hornillo: (c) => { c.fillStyle = '#2b2d31'; c.fillRect(-32, -6, 64, 26); c.fillStyle = '#e74c3c'; c.beginPath(); c.arc(-14, -6, 9, Math.PI, 0); c.fill(); c.beginPath(); c.arc(14, -6, 9, Math.PI, 0); c.fill(); },
};
function flatBox(id, name) {
  const g = new THREE.Group();
  const side = std('carton' + id, { map: boxTex(name, PICT[id]), roughness: 0.92 });
  const top = std('cartonTop', { map: boxTex('', null), roughness: 0.92 });
  const plain = std('cartonCanto', { color: '#b98a50', roughness: 0.95 });
  // cara frontal con la etiqueta, tapa con la cinta y cantos
  // RoundedBoxGeometry no trae grupos por cara: se usa una caja con cantos aparte
  add(g, once('cajaCuerpo', () => new THREE.BoxGeometry(0.36, 0.23, 0.26)), [plain, plain, top, plain, side, side]);
  for (const [x, z] of [[-0.18, -0.13], [0.18, -0.13], [-0.18, 0.13], [0.18, 0.13]]) add(g, once('canto', () => new THREE.BoxGeometry(0.006, 0.232, 0.006)), plain, x, 0, z);
  return { group: g, pose: 'box' };
}

// --- maceta de barro torneada con borde, tierra húmeda y marcas de torno ---
const potTex = () => tex('barro', 256, 128, (c, w, h) => {
  c.fillStyle = '#b4602f'; c.fillRect(0, 0, w, h);
  for (let y = 0; y < h; y += 4) { c.fillStyle = `rgba(${y % 8 ? '90,40,15' : '230,140,90'},0.08)`; c.fillRect(0, y, w, 2); }
  grain(c, w, h, 0.09, 3000);
});
const soilTex = () => tex('tierraHumeda', 128, 128, (c, w, h) => {
  c.fillStyle = '#3b291b'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 900; i++) { const s = Math.random() * 3 + 1; c.fillStyle = `hsl(25,${30 + Math.random() * 20}%,${8 + Math.random() * 18}%)`; c.fillRect(Math.random() * w, Math.random() * h, s, s); }
});
function maceta() {
  const g = new THREE.Group();
  const body = std('maceta', { map: potTex(), roughness: 0.85 });
  add(g, lathe('maceta', [[0, -0.1], [0.11, -0.1], [0.115, -0.095], [0.145, 0.07], [0.165, 0.075], [0.168, 0.105], [0.15, 0.108], [0.142, 0.08], [0, 0.08]]), body);
  add(g, once('gSoil', () => new THREE.CircleGeometry(0.141, 28)), std('soil', { map: soilTex(), roughness: 1 }), 0, 0.075, 0, -Math.PI / 2);
  g.scale.setScalar(0.78);
  return { group: g, pose: 'box' };
}

// --- saco de tierra: bolsa acolchada con etiqueta impresa ---
function saco(plus) {
  const g = new THREE.Group();
  const t = tex(plus ? 'sacoPlus' : 'saco', 256, 256, (c, w, h) => label(c, w, h, {
    bg: plus ? '#2f3d22' : '#4a3a26', band: plus ? '#c9a227' : '#7cb342', title: plus ? 'SUSTRATO+' : 'TIERRA', sub: plus ? 'Enriquecido · 20 L' : 'Universal · 20 L',
    logo: (cc, ww, hh) => { cc.fillStyle = plus ? '#c9a227' : '#7cb342'; cc.beginPath(); cc.ellipse(ww / 2, hh * 0.86, 22, 10, 0, 0, 7); cc.fill(); cc.fillRect(ww / 2 - 2, hh * 0.72, 4, 14); },
  }));
  const geo = once('saco', () => {
    const b = new RoundedBoxGeometry(0.34, 0.22, 0.17, 6, 0.07);
    const P = b.attributes.position; // abombado en el centro
    for (let i = 0; i < P.count; i++) { const x = P.getX(i), y = P.getY(i), z = P.getZ(i); const k = 1 - (x / 0.17) ** 2; P.setZ(i, z * (1 + 0.25 * Math.max(0, k))); P.setY(i, y * (1 + 0.06 * Math.max(0, k))); }
    b.computeVertexNormals();
    return b;
  });
  add(g, geo, phys('saco' + plus, { map: t, roughness: 0.55, clearcoat: 0.35 }));
  // costura de arriba
  add(g, rb(0.3, 0.012, 0.05, 0.004), std('costura', { color: plus ? '#26321b' : '#3a2d1d', roughness: 0.9 }), 0, 0.11, 0);
  return { group: g, pose: 'box' };
}

// --- regadera metálica: cuerpo torneado, pitorro largo con alcachofa y asa de tubo ---
function regadera() {
  const g = new THREE.Group();
  const paint = phys('regadera', { color: '#2f8f5b', metalness: 0.35, roughness: 0.3 });
  const dark = std('regaderaOsc', { color: '#20603d', roughness: 0.45, metalness: 0.4 });
  add(g, lathe('regadera', [[0, -0.075], [0.07, -0.075], [0.078, -0.06], [0.08, 0.04], [0.066, 0.07], [0.034, 0.078], [0, 0.078]]), paint);
  add(g, lathe('regBorde', [[0.081, -0.075], [0.083, -0.07], [0.081, -0.065]]), dark);
  const sp = new THREE.CatmullRomCurve3([new THREE.Vector3(0, -0.04, -0.07), new THREE.Vector3(0, 0.02, -0.15), new THREE.Vector3(0, 0.09, -0.23)]);
  add(g, once('pitorro', () => new THREE.TubeGeometry(sp, 16, 0.012, 10)), paint);
  add(g, lathe('alcachofa', [[0.012, 0], [0.026, 0.025], [0.028, 0.03], [0, 0.03]], 18), dark, 0, 0.09, -0.23, -0.75);
  add(g, once('asa', () => new THREE.TubeGeometry(new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.06, 0.06), new THREE.Vector3(0, 0.14, 0.03), new THREE.Vector3(0, 0.14, -0.04), new THREE.Vector3(0, 0.075, -0.05)]), 20, 0.009, 8)), dark);
  g.scale.setScalar(0.62);
  g.rotation.y = 1.0; // de perfil: el pitorro hacia delante y a la izquierda
  return { group: g, pose: 'one' };
}

// --- bote/spray/frasco con etiqueta envolvente ---
// (texto oscuro sobre fondo claro; el centro de la etiqueta queda delante)
const inkOn = (bg) => { const c = new THREE.Color(bg); return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 > 0.6 ? '#1d2126' : '#ffffff'; };
function wrapTex(k, bg, title, sub, band) { return tex('wrap' + k, 256, 128, (c, w, h) => label(c, w, h, { bg, fg: inkOn(bg), title, sub, band })); }
function bottle(k, { r = 0.03, h = 0.14, color, labelT, cap = '#f5f5f5', neck = 0.4 }) {
  const g = new THREE.Group();
  const body = phys('bote' + k, { color, roughness: 0.25 });
  add(g, lathe('bote' + k, [[0, -h / 2], [r * 0.9, -h / 2], [r, -h / 2 + 0.006], [r, h / 2 - 0.03], [r * neck, h / 2 - 0.006], [r * neck, h / 2], [0, h / 2]]), body);
  const lab = once('cil' + k, () => new THREE.CylinderGeometry(r * 1.004, r * 1.004, h * 0.5, 28, 1, true));
  add(g, lab, std('etq' + k, { map: labelT, roughness: 0.6 }), 0, -0.004, 0, 0, Math.PI, 0);
  add(g, once('tapon' + k, () => new THREE.CylinderGeometry(r * neck * 1.15, r * neck * 1.15, 0.024, 16)), phys('tapon' + cap, { color: cap, roughness: 0.4 }), 0, h / 2 + 0.012, 0);
  return g;
}
function spray() {
  const g = bottle('spray', { r: 0.028, h: 0.15, color: '#c62828', labelT: wrapTex('spray', '#c62828', 'PIMIENTA', 'Defensa · 50 ml', '#ffd54f'), cap: '#222222', neck: 0.6 });
  add(g, rb(0.03, 0.022, 0.03, 0.005), std('difusor', { color: '#1d1d1d', roughness: 0.5 }), 0, 0.1, 0);
  add(g, once('boquilla', () => new THREE.CylinderGeometry(0.004, 0.004, 0.012, 8)), std('difusor'), 0, 0.103, -0.017, Math.PI / 2);
  return { group: g, pose: 'one' };
}
function fertil() { return { group: bottle('fertil', { r: 0.036, h: 0.15, color: '#2e7d32', labelT: wrapTex('fertil', '#f4f0e2', 'NUTRI·GROW', 'Fertilizante líquido', '#2e7d32'), cap: '#f5f5f5', neck: 0.45 }), pose: 'one' }; }
function catalizador() {
  const g = bottle('catal', { r: 0.03, h: 0.11, color: '#455a64', labelT: wrapTex('catal', '#ffca28', 'CATALIZADOR', '¡Manipular con cuidado!', '#212121'), cap: '#212121', neck: 0.6 });
  return { group: g, pose: 'one' };
}
function colorante() {
  const g = new THREE.Group();
  ['#e74c3c', '#3498db', '#9b59b6'].forEach((c, i) => {
    const b = bottle('col' + i, { r: 0.013, h: 0.065, color: c, labelT: wrapTex('col' + i, '#ffffff', 'COLOR', '', c), cap: '#fafafa', neck: 0.5 });
    b.position.x = (i - 1) * 0.03; g.add(b);
  });
  return { group: g, pose: 'one' };
}
function azucar() {
  const g = new THREE.Group();
  const t = tex('azucar', 256, 256, (c, w, h) => label(c, w, h, { bg: '#fbfbf8', fg: '#1f5fbf', title: 'AZÚCAR', sub: 'Glas · 500 g', band: '#2e86de' }));
  const lado = std('azLado', { color: '#f1f1ee', roughness: 0.85 }), cara = std('az', { map: t, roughness: 0.8 });
  add(g, once('azCaja', () => new THREE.BoxGeometry(0.07, 0.11, 0.045)), [lado, lado, lado, lado, cara, cara]);
  add(g, rb(0.072, 0.014, 0.046, 0.003), std('azPliegue', { color: '#e6e6e2', roughness: 0.9 }), 0, 0.058, 0);
  return { group: g, pose: 'one' };
}

// --- ingredientes de laboratorio y abonos del cártel ---
// tapón estriado por encima del bote
function ribCap(g, k, r, h, y, color) {
  const geo = once('ribcap' + k, () => { const c = new THREE.CylinderGeometry(r, r, h, 48, 1); const p = c.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), d = Math.hypot(x, z); if (d > r * 0.9) { const k2 = 1 + (Math.floor(((a + Math.PI) / (Math.PI * 2)) * 48) % 2 ? 0.05 : 0); p.setX(i, x * k2); p.setZ(i, z * k2); } } c.computeVertexNormals(); return c; });
  return add(g, geo, phys('ribcap' + color, { color, roughness: 0.45, clearcoat: 0.2 }), 0, y, 0);
}
function warnLabel(k, bg, band, title, sub) {
  return tex('ing' + k, 256, 128, (c, w, h) => {
    label(c, w, h, { bg, fg: inkOn(bg), title, sub, band });
    c.save(); c.translate(w * 0.86, h * 0.56); c.fillStyle = '#f1c40f'; c.beginPath(); c.moveTo(0, -20); c.lineTo(18, 14); c.lineTo(-18, 14); c.closePath(); c.fill(); c.strokeStyle = '#111'; c.lineWidth = 2.5; c.stroke();
    c.fillStyle = '#111'; c.font = 'bold 22px Arial'; c.textAlign = 'center'; c.fillText('!', 0, 11); c.restore();
  });
}
function reactivo() {
  const g = new THREE.Group();
  add(g, lathe('reactivo', [[0, -0.055], [0.026, -0.055], [0.03, -0.05], [0.03, 0.025], [0.02, 0.042], [0.013, 0.046], [0.013, 0.055], [0, 0.055]], 32), phys('reactivoBody', { color: '#f3f4f2', roughness: 0.55, clearcoat: 0.15 }));
  add(g, once('reactLab', () => new THREE.CylinderGeometry(0.0303, 0.0303, 0.05, 32, 1, true, -1.35, 2.7)), std('reactLab', { map: warnLabel('react', '#ffffff', '#c0392b', 'REACTIVO', 'R-7 · 250 ml'), roughness: 0.6 }), 0, -0.012, 0);
  ribCap(g, 'react', 0.016, 0.02, 0.064, '#c0392b');
  return { group: g, pose: 'one' };
}
function aglutinante() {
  const g = new THREE.Group();
  add(g, lathe('aglut', [[0, -0.04], [0.04, -0.04], [0.045, -0.035], [0.048, 0.03], [0.046, 0.034], [0, 0.034]], 36), phys('aglutBody', { color: '#eef1f2', roughness: 0.5, clearcoat: 0.2 }));
  add(g, once('aglutLab', () => new THREE.CylinderGeometry(0.0475, 0.0455, 0.045, 36, 1, true, -1.35, 2.7)), std('aglutLab', { map: tex('aglut', 256, 128, (c, w, h) => label(c, w, h, { bg: '#f7f7f2', fg: '#1d2126', title: 'AGLUTINANTE', sub: 'Excipiente · 200 g', band: '#2a9d5b' })), roughness: 0.6 }), 0, -0.002, 0);
  ribCap(g, 'aglut', 0.05, 0.022, 0.045, '#2a9d5b');
  add(g, once('aglutTop', () => new THREE.CylinderGeometry(0.044, 0.05, 0.004, 36)), phys('ribcap#2a9d5b', {}), 0, 0.058, 0);
  return { group: g, pose: 'one' };
}
function disolvente() {
  // garrafa metálica: cuerpo con nervios en X, asa, boca con tapón y etiqueta
  const g = new THREE.Group();
  const tin = phys('disolBody', { color: '#9aa4ad', roughness: 0.3, metalness: 0.8, clearcoat: 0.3 });
  add(g, rb(0.075, 0.1, 0.04, 0.008), tin);
  const rib = rb(0.004, 0.11, 0.003, 0.0015);
  for (const sz of [-1, 1]) for (const d of [-1, 1]) add(g, rib, tin, 0, 0, sz * 0.0205, 0, 0, d * 0.62);
  add(g, once('disolAsa', () => new THREE.TorusGeometry(0.014, 0.004, 8, 18, Math.PI)), tin, -0.012, 0.05, 0);
  add(g, once('disolBoca', () => new THREE.CylinderGeometry(0.009, 0.009, 0.012, 16)), tin, 0.022, 0.055, 0);
  ribCap(g, 'disol', 0.011, 0.012, 0.067, '#c0392b');
  add(g, once('disolLabG', () => new THREE.PlaneGeometry(0.05, 0.035)), std('disolLab', { map: warnLabel('disol', '#f6f0ff', '#6c3fc0', 'DISOLVENTE', 'Inflamable · 1 L'), roughness: 0.6, polygonOffset: true, polygonOffsetFactor: -2 }), 0, -0.012, 0.0215);
  return { group: g, pose: 'one' };
}
const abono = (k, bg, band, title, sub, cap) => () => ({ group: bottle(k, { r: 0.034, h: 0.15, color: band, labelT: wrapTex(k, bg, title, sub, band), cap, neck: 0.45 }), pose: 'one' });
// Manojo de hojas ovaladas con nervio central y venas pintadas, algo curvadas
function hoja() {
  const g = new THREE.Group();
  const t = tex('hojaVenas', 128, 256, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, '#5f9e54'); gr.addColorStop(0.5, '#7dbb6c'); gr.addColorStop(1, '#5f9e54'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(220,240,200,0.75)'; c.lineWidth = 3; c.beginPath(); c.moveTo(w / 2, 0); c.lineTo(w / 2, h); c.stroke();
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(210,235,190,0.5)'; for (let y = 20; y < h - 10; y += 18) for (const s of [-1, 1]) { c.beginPath(); c.moveTo(w / 2, y); c.quadraticCurveTo(w / 2 + s * w * 0.2, y - 6, w / 2 + s * w * 0.45, y - 18); c.stroke(); }
    grain(c, w, h, 0.05, 600);
  });
  const geo = once('hojaGeo', () => {
    const sh = new THREE.Shape(); sh.moveTo(0, -0.045); sh.bezierCurveTo(0.024, -0.03, 0.024, 0.02, 0, 0.05); sh.bezierCurveTo(-0.024, 0.02, -0.024, -0.03, 0, -0.045);
    const ge = new THREE.ShapeGeometry(sh, 10); const p = ge.attributes.position, uv = ge.attributes.uv;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i); uv.setXY(i, x / 0.05 + 0.5, (y + 0.045) / 0.095); p.setZ(i, (x * x) * 9 + y * y * 1.5); }
    ge.computeVertexNormals(); return ge;
  });
  const m = std('hoja', { map: t, roughness: 0.55, side: THREE.DoubleSide });
  for (let i = 0; i < 6; i++) { const l = add(g, geo, m, (i - 2.5) * 0.007, i * 0.002, 0, -Math.PI / 2 + 0.15, (i - 2.5) * 0.28, 0); l.position.z = 0.01; }
  g.scale.setScalar(1.5);
  return { group: g, pose: 'one' };
}

// --- armas ---
// Perfil lateral (u = hacia delante, v = arriba) extruido a lo ancho: piezas con su silueta real
function profile(k, outline, holes, width, bevel = 0.0012) {
  return once('perfil' + k, () => {
    const sh = new THREE.Shape(outline.map(([u, v]) => new THREE.Vector2(u, v)));
    for (const h of holes) sh.holes.push(new THREE.Path(h.map(([u, v]) => new THREE.Vector2(u, v))));
    const e = new THREE.ExtrudeGeometry(sh, { depth: width - 2 * bevel, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 2, curveSegments: 10 });
    e.translate(0, 0, -(width - 2 * bevel) / 2);
    e.rotateY(Math.PI / 2); // u → -z (al frente), el ancho → x
    return e;
  });
}
// caja invisible que marca por dónde no pueden pasar los dedos
function collider(g, w, h, d, x, y, z, rx = 0) {
  const m = add(g, once(`col${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), once('mCol', () => new THREE.MeshBasicMaterial()), x, y, z, rx);
  m.visible = false; m.userData.collider = true;
  return m;
}
const stippleTex = () => tex('punteado', 128, 128, (c, w, h) => {
  c.fillStyle = '#8a8a8a'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 2600; i++) { c.fillStyle = Math.random() < 0.5 ? 'rgba(0,0,0,0.45)' : 'rgba(255,255,255,0.25)'; c.fillRect(Math.random() * w, Math.random() * h, 1.5, 1.5); }
});
function pistola() {
  // pistola semiautomática tipo «Glock»: corredera de acero con estrías y ventana de expulsión,
  // armazón de polímero con guardamonte hueco, cacha inclinada punteada, gatillo y miras
  const g = new THREE.Group();
  const steel = phys('pistAcero2', { color: '#50545b', metalness: 0.5, roughness: 0.3, clearcoat: 0.35 });
  const poly = std('pistPolimero2', { color: '#33363b', roughness: 0.65 });
  const dark = std('pistNegro', { color: '#0b0b0c', roughness: 0.6 });
  // corredera (con el frente biselado)
  add(g, profile('corredera', [[-0.035, 0.013], [0.152, 0.013], [0.156, 0.02], [0.156, 0.034], [0.148, 0.042], [-0.03, 0.042], [-0.035, 0.036]], [], 0.024), steel);
  for (let i = 0; i < 7; i++) add(g, rb(0.0245, 0.022, 0.0016, 0.0005), dark, 0, 0.028, 0.026 - i * 0.0045); // estrías de amartillar
  add(g, rb(0.004, 0.009, 0.034, 0.001), dark, 0.0105, 0.034, -0.045);    // ventana de expulsión
  add(g, once('canon2', () => new THREE.CylinderGeometry(0.0062, 0.0062, 0.006, 14)), steel, 0, 0.026, -0.155, Math.PI / 2);
  add(g, once('anima', () => new THREE.CircleGeometry(0.0042, 12)), dark, 0, 0.026, -0.1585, Math.PI);
  add(g, rb(0.004, 0.006, 0.005, 0.001), std('miraBlanca', { color: '#f2f2f2' }), 0, 0.045, -0.142); // mira delantera
  add(g, rb(0.018, 0.006, 0.006, 0.001), dark, 0, 0.045, 0.026);                                    // alza
  // armazón + guardamonte (hueco) + cacha inclinada
  const frame = [[-0.034, 0.013], [0.138, 0.013], [0.138, 0.0], [0.08, -0.002], [0.082, -0.024], [0.074, -0.036], [0.034, -0.037], [0.02, -0.03],
    [0.012, -0.045], [0.006, -0.06], [0.0, -0.075], [-0.004, -0.086], [-0.042, -0.086], [-0.041, -0.079], [-0.035, -0.05], [-0.03, -0.012], [-0.044, -0.004], [-0.042, 0.004]];
  const guard = [[0.072, -0.007], [0.074, -0.026], [0.068, -0.031], [0.034, -0.031], [0.026, -0.024], [0.03, -0.007]];
  add(g, profile('armazon', frame, [guard], 0.021), poly);
  // paneles punteados de la cacha (a cada lado) y base del cargador
  const panel = [[0.004, -0.04], [-0.001, -0.062], [-0.005, -0.077], [-0.037, -0.077], [-0.032, -0.055], [-0.027, -0.026], [0.006, -0.03]];
  const pm = std('cachaPunteada', { map: stippleTex(), color: '#4a4c51', roughness: 0.95 });
  pm.map.wrapS = pm.map.wrapT = THREE.RepeatWrapping; pm.map.repeat.set(30, 30);
  add(g, profile('panel', panel, [], 0.0225, 0.0005), pm);
  add(g, profile('base', [[-0.003, -0.084], [-0.044, -0.084], [-0.045, -0.091], [-0.002, -0.091]], [], 0.023), dark);
  add(g, profile('gatillo', [[0.05, -0.006], [0.054, -0.006], [0.05, -0.018], [0.046, -0.027], [0.042, -0.027], [0.046, -0.017]], [], 0.006, 0.0008), dark);
  add(g, profile('palanca', [[0.016, 0.004], [0.04, 0.004], [0.04, 0.0], [0.016, 0.0]], [], 0.0225, 0.0004), dark); // retén de la corredera
  // por dónde no pasan los dedos: la corredera, la cacha (inclinada) y el guardamonte
  collider(g, 0.024, 0.03, 0.19, 0, 0.028, -0.06);
  collider(g, 0.021, 0.078, 0.036, 0, -0.047, 0.02, -0.2);
  collider(g, 0.021, 0.007, 0.046, 0, -0.034, -0.054);
  collider(g, 0.021, 0.03, 0.006, 0, -0.019, -0.079);
  // se empuña por la parte alta de la cacha, bajo la corredera
  const hold = new THREE.Object3D(); hold.position.set(0, -0.034, 0.018); g.add(hold);
  // puntos de agarre (agarre alto, la mano paralela al cañón): la cacha cruza la palma en
  // diagonal, con los nudillos delante de la cacha para que los dedos la rodeen y la base de
  // la mano por detrás; la izquierda, por fuera de los dedos de la derecha
  const gR = new THREE.Object3D(); gR.position.set(0.0115, -0.047, 0.035); g.add(gR);
  const gL = new THREE.Object3D(); gL.position.set(-0.045, -0.06, -0.002); g.add(gL);
  g.scale.setScalar(1.15); // a la vista, como en los shooters
  return { group: g, pose: 'pistol', hold, grips: { R: { obj: gR, F: [-0.25, 0, -1], P: [-1, 0, -0.25], hand: 'trigger' }, L: { obj: gL, F: [0.25, 0.1, -1], P: [1, 0, -0.25], hand: 'support' } } };
}
function porra() {
  const g = new THREE.Group();
  const steel = phys('porraAcero', { color: '#5d636a', metalness: 0.55, roughness: 0.25 });
  const mango = add(g, once('mango', () => new THREE.CylinderGeometry(0.018, 0.02, 0.16, 16)), std('goma', { color: '#1d1f22', roughness: 0.95 }), 0, -0.03, 0);
  for (let i = 0; i < 6; i++) add(g, once('anillo', () => new THREE.TorusGeometry(0.0195, 0.0016, 6, 16)), std('gomaR', { color: '#141518' }), 0, -0.09 + i * 0.022, 0, Math.PI / 2);
  add(g, once('tubo1', () => new THREE.CylinderGeometry(0.014, 0.015, 0.14, 14)), steel, 0, 0.12, 0);
  add(g, once('tubo2', () => new THREE.CylinderGeometry(0.011, 0.012, 0.13, 14)), steel, 0, 0.25, 0);
  add(g, once('punta', () => new THREE.SphereGeometry(0.016, 14, 10)), steel, 0, 0.32, 0);
  collider(g, 0.04, 0.16, 0.04, 0, -0.03, 0); // mango
  collider(g, 0.03, 0.3, 0.03, 0, 0.2, 0);     // tubos
  return { group: g, pose: 'gun', hold: mango, grips: handleGrip(mango, 0.0195) };
}

// Agarre de un mango vertical (eje +y; r = su medio ancho): la palma por detrás y a la derecha
// del mango, el antebrazo llega desde abajo a la derecha (la muñeca recta) y los dedos lo
// rodean por la izquierda hasta la cara que mira a la cámara, con el pulgar cerrado encima
function handleGrip(mango, r) {
  const P = new THREE.Vector3(-0.85, 0, 0.5).normalize();
  const gR = new THREE.Object3D(); gR.position.copy(P).multiplyScalar(-(r + 0.002)).setY(-0.012); mango.add(gR); // (el índice justo bajo la guarda)
  return { R: { obj: gR, F: [-0.5, 0.1, -0.85], P: P.toArray(), hand: 'gun' } };
}
// --- móvil con pantalla encendida, taza de café y bolsa de la compra ---
const phoneTex = () => tex('pantallaMovil', 128, 256, (c, w, h) => {
  const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1f6fd9'); gr.addColorStop(1, '#7a3ccf'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
  c.fillStyle = '#fff'; c.font = '700 30px sans-serif'; c.textAlign = 'center'; c.fillText('17:30', w / 2, 60);
  for (let i = 0; i < 12; i++) { c.fillStyle = `hsl(${i * 30},70%,60%)`; c.beginPath(); c.roundRect(12 + (i % 4) * 28, 100 + Math.floor(i / 4) * 34, 20, 20, 5); c.fill(); }
});
function movil() {
  const g = new THREE.Group();
  add(g, rb(0.07, 0.145, 0.009, 0.009), phys('movil', { color: '#16181c', metalness: 0.6, roughness: 0.25 }));
  add(g, once('pantalla', () => new THREE.PlaneGeometry(0.063, 0.135)), new THREE.MeshBasicMaterial({ map: phoneTex(), toneMapped: false }), 0, 0, 0.0047);
  return { group: g, pose: 'one' };
}

// --- vaso de café para llevar: cartón con funda, tapa de plástico ---
function vaso() {
  const g = new THREE.Group();
  const t = tex('funda', 256, 64, (c, w, h) => { c.fillStyle = '#8a5a34'; c.fillRect(0, 0, w, h); for (let x = 0; x < w; x += 6) { c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x, 0, 2, h); } c.fillStyle = '#f3e9d8'; c.font = '900 26px sans-serif'; c.textAlign = 'center'; c.fillText('CAFÉ ROOK', w / 2, 42); });
  add(g, lathe('vaso', [[0, -0.06], [0.031, -0.06], [0.041, 0.058], [0.043, 0.06], [0, 0.06]]), std('vasoPapel', { color: '#f4efe6', roughness: 0.8 }));
  add(g, once('fundaG', () => new THREE.CylinderGeometry(0.0395, 0.0345, 0.05, 28, 1, true)), std('funda', { map: t, roughness: 0.9 }), 0, -0.005, 0);
  add(g, lathe('tapa', [[0, 0.06], [0.044, 0.06], [0.045, 0.068], [0.038, 0.072], [0.036, 0.078], [0, 0.079]]), phys('tapa', { color: '#f8f8f8', roughness: 0.3 }));
  return { group: g, pose: 'one' };
}
// --- bolsa de papel de la compra con asas de cordel y el logo de la tienda ---
function bolsaCompra() {
  const g = new THREE.Group();
  const t = tex('bolsaPapel', 256, 256, (c, w, h) => {
    c.fillStyle = '#c8a06a'; c.fillRect(0, 0, w, h); grain(c, w, h, 0.08, 3000);
    c.strokeStyle = 'rgba(90,60,30,0.25)'; for (const x of [40, 216]) { c.beginPath(); c.moveTo(x, 0); c.lineTo(x, h); c.stroke(); }
    c.fillStyle = '#2e6b3a'; c.beginPath(); c.arc(w / 2, h * 0.45, 46, 0, 7); c.fill();
    c.fillStyle = '#fff'; c.font = '900 26px sans-serif'; c.textAlign = 'center'; c.fillText('SÚPER', w / 2, h * 0.45 + 9);
  });
  const paper = std('bolsaPapel', { map: t, roughness: 0.95 });
  add(g, once('bolsaG', () => new THREE.BoxGeometry(0.26, 0.3, 0.13)), [paper, paper, std('bolsaDentro', { color: '#3a2c1c', roughness: 1 }), paper, paper, paper], 0, -0.2, 0);
  add(g, once('asaG', () => new THREE.TorusGeometry(0.05, 0.004, 6, 16, Math.PI)), std('cordel', { color: '#3a3a3a' }), 0, -0.05, 0);
  // algo asomando: una barra de pan y un brik
  add(g, once('pan', () => new THREE.CapsuleGeometry(0.022, 0.16, 4, 10)), std('pan', { color: '#c98a3e', roughness: 0.85 }), 0.06, -0.03, 0.01, 0, 0, 0.25);
  add(g, rb(0.06, 0.12, 0.04, 0.004), std('brik', { color: '#e8e8ea', roughness: 0.6 }), -0.06, -0.06, 0);
  return { group: g, pose: 'one' };
}
// --- munición: caja impresa abierta con las balas de latón en su bandeja ---
function balas() {
  const g = new THREE.Group();
  const t = tex('balasCaja', 256, 128, (c, w, h) => label(c, w, h, { bg: '#3d4a2e', fg: '#f0e2b0', title: '9 mm', sub: '50 cartuchos · FMJ', band: '#a3332a' }));
  const lado = std('balasLado', { color: '#36422a', roughness: 0.85 }), cara = std('balasCara', { map: t, roughness: 0.75 });
  add(g, once('balasG', () => new THREE.BoxGeometry(0.085, 0.05, 0.06)), [lado, lado, std('balasBandeja', { color: '#1b1b1b' }), lado, cara, cara]);
  const brass = phys('laton', { color: '#c9a24a', metalness: 0.55, roughness: 0.22 });
  const cobre = phys('cobre', { color: '#b8734a', metalness: 0.55, roughness: 0.3 });
  const vaina = once('vaina', () => new THREE.CylinderGeometry(0.0045, 0.0045, 0.016, 10));
  const punta = once('puntaBala', () => new THREE.SphereGeometry(0.0045, 10, 6, 0, Math.PI * 2, 0, Math.PI / 2));
  for (let i = 0; i < 4; i++) for (let j = 0; j < 3; j++) {
    const x = -0.028 + i * 0.019, z = -0.017 + j * 0.017;
    add(g, vaina, brass, x, 0.031, z); add(g, punta, cobre, x, 0.039, z);
  }
  return { group: g, pose: 'one' };
}
// --- machete: hoja de acero con bisel y filo brillante, mango de madera veteada ---
const woodTex = () => tex('madera', 64, 256, (c, w, h) => {
  c.fillStyle = '#5a3a22'; c.fillRect(0, 0, w, h);
  for (let i = 0; i < 26; i++) { c.strokeStyle = `rgba(${Math.random() < 0.5 ? '30,18,8' : '120,80,45'},0.35)`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); let x = Math.random() * w; c.moveTo(x, 0); for (let y = 0; y < h; y += 16) { x += (Math.random() - 0.5) * 4; c.lineTo(x, y); } c.stroke(); }
});
function machete() {
  // cuchillo de combate táctico: hoja recta negra mate con punta de lanza, filo afilado en
  // plata, sierra en la mitad baja del lomo, guarda ancha y mango de goma con estrías
  const g = new THREE.Group();
  const shape = (pts) => { const sh = new THREE.Shape(); sh.moveTo(...pts[0]); for (const p of pts.slice(1)) p.length === 4 ? sh.quadraticCurveTo(...p) : sh.lineTo(...p); return sh; };
  const ext = (k, sh, depth, bevel) => once(k, () => { const e = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel * 0.5, bevelSegments: 2, curveSegments: 24 }); e.translate(0, 0, -depth / 2); return e; });
  const negro = std('hojaNegra', { map: stoneTex(), color: '#3a3d42', metalness: 0.45, roughness: 0.5 });
  const filo = phys('filoPlata', { color: '#d9dee3', metalness: 0.6, roughness: 0.16, clearcoat: 0.7 });
  // cuerpo de la hoja
  add(g, ext('hojaRecta', shape([[-0.021, 0], [0.021, 0], [0.021, 0.16], [0.022, 0.25, 0.002, 0.3], [-0.019, 0.26, -0.021, 0.19], [-0.021, 0]]), 0.0034, 0.0014), negro, 0, 0.05, 0);
  // filo: franja plateada a lo largo del lado cortante hasta la punta
  add(g, ext('filoRecto', shape([[0.012, 0.004], [0.021, 0.004], [0.021, 0.16], [0.022, 0.25, 0.002, 0.3], [-0.001, 0.288], [0.013, 0.24, 0.012, 0.16], [0.012, 0.004]]), 0.0024, 0.0012), filo, 0, 0.05, 0);
  // sierra en el lomo
  const diente = once('diente', () => new THREE.ConeGeometry(0.0035, 0.008, 4));
  for (let k = 0; k < 8; k++) add(g, diente, negro, -0.0225, 0.065 + k * 0.011, 0, 0, Math.PI / 4, Math.PI / 2 + 0.35);
  // guarda, mango con textura y pomo con agujero para el cordón
  add(g, rb(0.072, 0.012, 0.022, 0.005), std('guardaNegra', { color: '#141518', metalness: 0.5, roughness: 0.5 }), 0, 0.045, 0);
  const goma = std('mangoGoma', { map: gripTex(), color: '#2b2d30', roughness: 0.92 });
  const mango = add(g, rb(0.03, 0.12, 0.024, 0.01), goma, 0, -0.02, 0);
  for (const y of [-0.055, -0.02, 0.015]) add(g, rb(0.032, 0.006, 0.026, 0.003), std('anilloGoma', { color: '#1a1b1d', roughness: 0.95 }), 0, y, 0); // estrías para los dedos
  add(g, rb(0.034, 0.018, 0.026, 0.006), std('guardaNegra'), 0, -0.088, 0);
  add(g, once('cordel', () => new THREE.TorusGeometry(0.009, 0.0025, 6, 14)), std('cordelVerde', { color: '#4b5a3a', roughness: 0.95 }), 0, -0.104, 0, 0, Math.PI / 2, 0);
  // cajas de colisión con su forma (mango, guarda y hoja) para que los dedos no la atraviesen
  collider(g, 0.03, 0.12, 0.024, 0, -0.02, 0);
  collider(g, 0.072, 0.012, 0.022, 0, 0.045, 0);
  collider(g, 0.044, 0.3, 0.005, 0, 0.2, 0);
  g.scale.setScalar(0.65);
  // (sin giros propios: la orientación en la vista la pone hands.js)
  return { group: g, pose: 'gun', hold: mango, grips: handleGrip(mango, 0.015) }; // empuñado por el mango
}
// acero con acabado arenado (moteado fino)
const stoneTex = () => tex('arenado', 128, 256, (c, w, h) => { c.fillStyle = '#8a8d92'; c.fillRect(0, 0, w, h); grain(c, w, h, 0.18, 6000); });
// goma con rombos en relieve
const gripTex = () => tex('gomaRombos', 64, 256, (c, w, h) => {
  c.fillStyle = '#9a9a9a'; c.fillRect(0, 0, w, h); c.strokeStyle = 'rgba(0,0,0,0.55)'; c.lineWidth = 2;
  for (let k = -h; k < h * 2; k += 10) { c.beginPath(); c.moveTo(0, k); c.lineTo(w, k + w); c.moveTo(0, k + w); c.lineTo(w, k); c.stroke(); }
});
// --- sobre de semillas vacío: papel kraft impreso, abierto por arriba ---
function sobreVacio() {
  const g = new THREE.Group();
  const t = tex('sobre', 128, 192, (c, w, h) => {
    c.fillStyle = '#cbbd9f'; c.fillRect(0, 0, w, h); grain(c, w, h, 0.09, 1500);
    c.fillStyle = '#4f7a4f'; c.fillRect(0, h * 0.6, w, h * 0.22);
    c.fillStyle = '#2a2420'; c.font = '900 20px sans-serif'; c.textAlign = 'center'; c.fillText('SEMILLAS', w / 2, h * 0.3);
    c.fillStyle = '#fff'; c.font = '700 14px sans-serif'; c.fillText('VACÍO', w / 2, h * 0.73);
  });
  const pk = add(g, rb(0.09, 0.12, 0.01, 0.003), std('sobre', { map: t, roughness: 0.9 }), 0, 0, 0, -0.3, 0.2, 0.1);
  return { group: g, pose: 'one', pk };
}

export const HELD = {
  cup: vaso, shopbag: bolsaCompra, balas, machete, sobre_vacio: sobreVacio,
  caja: () => flatBox('caja', ''), mesa_emp: () => flatBox('mesa_emp', 'Mesa'), estante: () => flatBox('estante', 'Estantería'),
  lampara: () => flatBox('lampara', 'Lámpara LED'), envasadora: () => flatBox('envasadora', 'Envasadora'), hornillo: () => flatBox('hornillo', 'Hornillo'),
  maceta, tierra: () => saco(false), tierra_plus: () => saco(true), regadera, spray, fertil, catalizador, colorante, azucar,
  reactivo, aglutinante, disolvente, hoja,
  abono_grow: abono('grow', '#f2f7ec', '#2e7d32', 'GROW', 'Crecimiento · NPK 3-1-2', '#f5f5f5'),
  abono_bloom: abono('bloom', '#f6eefc', '#7b3fb0', 'BLOOM', 'Floración · PK 13-14', '#f5f5f5'),
  ph_corr: abono('ph', '#eef6fc', '#1f6fb2', 'pH DOWN', 'Corrector de pH', '#d64541'),
  pistola, porra, phone: movil,
};
