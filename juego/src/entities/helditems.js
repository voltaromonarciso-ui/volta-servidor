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
function wrapTex(k, bg, title, sub, band) { return tex('wrap' + k, 256, 128, (c, w, h) => label(c, w, h, { bg, title, sub, band })); }
function bottle(k, { r = 0.03, h = 0.14, color, labelT, cap = '#f5f5f5', neck = 0.4 }) {
  const g = new THREE.Group();
  const body = phys('bote' + k, { color, roughness: 0.25 });
  add(g, lathe('bote' + k, [[0, -h / 2], [r * 0.9, -h / 2], [r, -h / 2 + 0.006], [r, h / 2 - 0.03], [r * neck, h / 2 - 0.006], [r * neck, h / 2], [0, h / 2]]), body);
  const lab = once('cil' + k, () => new THREE.CylinderGeometry(r * 1.004, r * 1.004, h * 0.5, 28, 1, true));
  add(g, lab, std('etq' + k, { map: labelT, roughness: 0.6 }), 0, -0.004, 0);
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

// --- armas ---
function pistola() {
  const g = new THREE.Group();
  const steel = phys('pistAcero', { color: '#2a2d31', metalness: 0.55, roughness: 0.32, clearcoat: 0.3 });
  const poly = std('pistPolimero', { color: '#1c1d20', roughness: 0.75 });
  add(g, rb(0.03, 0.032, 0.18, 0.006), steel, 0, 0.022, -0.045);             // corredera
  for (let i = 0; i < 6; i++) add(g, rb(0.031, 0.026, 0.003, 0.001), poly, 0, 0.024, 0.02 + i * 0.006); // estrías
  add(g, rb(0.026, 0.02, 0.15, 0.005), poly, 0, -0.004, -0.035);              // armazón
  add(g, once('canon', () => new THREE.CylinderGeometry(0.007, 0.007, 0.012, 12)), std('negro', { color: '#0d0d0f' }), 0, 0.02, -0.136, Math.PI / 2);
  const grip = add(g, rb(0.028, 0.1, 0.045, 0.008), std('cacha', { color: '#2a211a', roughness: 0.85 }), 0, -0.055, 0.03, -0.22);
  for (let i = 0; i < 4; i++) add(grip, rb(0.029, 0.004, 0.04, 0.001), std('cachaR', { color: '#1a1410', roughness: 0.9 }), 0, -0.03 + i * 0.018, 0);
  add(g, once('guarda', () => new THREE.TorusGeometry(0.018, 0.0035, 6, 14, Math.PI)), poly, 0, -0.016, -0.012, 0, Math.PI / 2, Math.PI);
  add(g, rb(0.004, 0.016, 0.006, 0.001), steel, 0, -0.018, -0.012);          // gatillo
  add(g, rb(0.006, 0.006, 0.006, 0.001), std('mira', { color: '#ececec' }), 0, 0.041, -0.125); // mira
  // se empuña: la mano se cierra alrededor de la cacha (hold) con el cañón al frente
  const hold = new THREE.Object3D(); hold.position.y = 0.008; grip.add(hold); // la parte alta de la cacha, bajo la corredera
  g.scale.setScalar(1.2); // a la vista, como en los shooters
  return { group: g, pose: 'pistol', hold };
}
function porra() {
  const g = new THREE.Group();
  const steel = phys('porraAcero', { color: '#5d636a', metalness: 0.55, roughness: 0.25 });
  const mango = add(g, once('mango', () => new THREE.CylinderGeometry(0.018, 0.02, 0.16, 16)), std('goma', { color: '#1d1f22', roughness: 0.95 }), 0, -0.03, 0);
  for (let i = 0; i < 6; i++) add(g, once('anillo', () => new THREE.TorusGeometry(0.0195, 0.0016, 6, 16)), std('gomaR', { color: '#141518' }), 0, -0.09 + i * 0.022, 0, Math.PI / 2);
  add(g, once('tubo1', () => new THREE.CylinderGeometry(0.014, 0.015, 0.14, 14)), steel, 0, 0.12, 0);
  add(g, once('tubo2', () => new THREE.CylinderGeometry(0.011, 0.012, 0.13, 14)), steel, 0, 0.25, 0);
  add(g, once('punta', () => new THREE.SphereGeometry(0.016, 14, 10)), steel, 0, 0.32, 0);
  g.rotation.x = -0.5;
  return { group: g, pose: 'gun', hold: mango };
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
  const g = new THREE.Group();
  const blade = new THREE.Shape();
  blade.moveTo(-0.022, 0); blade.lineTo(0.02, 0); blade.quadraticCurveTo(0.036, 0.2, 0.012, 0.34); blade.quadraticCurveTo(-0.01, 0.365, -0.022, 0.3); blade.lineTo(-0.022, 0);
  const bg = once('hoja', () => { const e = new THREE.ExtrudeGeometry(blade, { depth: 0.003, bevelEnabled: true, bevelSize: 0.004, bevelThickness: 0.0015, bevelSegments: 2 }); e.translate(0, 0, -0.0015); return e; });
  add(g, bg, phys('hoja', { color: '#b9c1c8', metalness: 0.55, roughness: 0.18, clearcoat: 0.4 }), 0, 0.05, 0);
  add(g, once('lomo', () => new THREE.BoxGeometry(0.004, 0.27, 0.0045)), std('lomo', { color: '#4a4e53', metalness: 0.7, roughness: 0.5 }), -0.02, 0.18, 0);
  const mango = add(g, rb(0.03, 0.12, 0.022, 0.009), std('mangoMadera', { map: woodTex(), roughness: 0.7 }), 0, -0.02, 0);
  for (const y of [-0.05, 0.01]) add(g, once('remache', () => new THREE.CylinderGeometry(0.004, 0.004, 0.025, 10)), phys('remache', { color: '#c9b27a', metalness: 0.55, roughness: 0.25 }), 0, y, 0, Math.PI / 2);
  add(g, rb(0.05, 0.012, 0.026, 0.003), phys('guarda', { color: '#2b2e33', metalness: 0.8, roughness: 0.35 }), 0, 0.045, 0);
  g.rotation.x = -0.45;
  return { group: g, pose: 'gun', hold: mango }; // empuñado por el mango
}
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
  pistola, porra, phone: movil,
};
