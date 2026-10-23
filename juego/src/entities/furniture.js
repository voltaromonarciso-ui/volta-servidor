// Muebles y aparatos colocables con detalle: piezas torneadas, chapa perforada, rejillas,
// tornillos, bisagras, etiquetas impresas y cables, para que no parezcan bloques lisos.
import * as THREE from 'three';
import { G, M, mesh, rbox, canvasTex, labelTex, cardboardTex, wearTex, perforatedTex, screw, screws4, vent, ribbedCap, lathe, cable, decal } from './detail.js';
import { metalize } from '../world/labs.js';

const V = (x, y, z) => new THREE.Vector3(x, y, z);
const cyl = (r0, r1, h, n = 20, open = false) => G(`fcyl${r0}|${r1}|${h}|${n}|${open}`, () => new THREE.CylinderGeometry(r0, r1, h, n, 1, open));
const tor = (r, t, arc = Math.PI * 2) => G(`ftor${r}|${t}|${arc}`, () => new THREE.TorusGeometry(r, t, 8, 28, arc));
const steel = () => M('fSteel', { color: '#8d959d', roughness: 0.35, metalness: 0.8, roughnessMap: wearTex() });
const blackMetal = () => M('fBlack', { color: '#24272b', roughness: 0.5, metalness: 0.55, roughnessMap: wearTex() });
const rubber = () => M('fRubber', { color: '#141516', roughness: 0.9 });
const chrome = () => M('fChrome', { color: '#dfe3e6', roughness: 0.15, metalness: 1 });
const yellowTag = () => labelTex('fTag', { bg: '#f2c230', band: '#1d2126', title: 'ROOK', sub: 'Pro series', barcode: false, w: 128, h: 64 });
const late = (g) => queueMicrotask(() => metalize(g));

// Foco de cultivo: base lastrada, mástil telescópico, campana reflectora, bombilla y balastro
export function buildLamp(o) {
  const g = o.group;
  mesh(g, lathe('lampBase', [[0, 0], [0.24, 0], [0.25, 0.015], [0.23, 0.045], [0.06, 0.06], [0.04, 0.07], [0, 0.07]], 32), blackMetal());
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2; mesh(g, cyl(0.03, 0.03, 0.012, 12), rubber(), Math.cos(a) * 0.19, 0.004, Math.sin(a) * 0.19); }
  mesh(g, cyl(0.022, 0.022, 1.1, 14), chrome(), 0, 0.62, 0);
  mesh(g, cyl(0.016, 0.016, 0.8, 14), chrome(), 0, 1.5, 0);
  mesh(g, cyl(0.03, 0.03, 0.05, 14), blackMetal(), 0, 1.16, 0);                 // abrazadera
  mesh(g, cyl(0.012, 0.012, 0.05, 8), blackMetal(), 0.04, 1.16, 0, 0, 0, Math.PI / 2);
  mesh(g, lathe('lampKnob', [[0, 0], [0.018, 0], [0.02, 0.012], [0.012, 0.02], [0, 0.02]], 12), rubber(), 0.065, 1.16, 0, 0, 0, -Math.PI / 2);
  // brazo y campana
  const arm = mesh(g, cyl(0.014, 0.014, 0.3, 10), chrome(), 0, 1.9, 0.14, Math.PI / 2, 0, 0);
  void arm;
  const hood = new THREE.Group(); hood.position.set(0, 1.86, 0.28); g.add(hood);
  const prof = [[0.03, 0.12], [0.06, 0.11], [0.16, 0.04], [0.2, 0]];
  mesh(hood, lathe('hoodOut', prof, 36), M('hoodOut', { color: '#1f2226', roughness: 0.45, metalness: 0.6, side: THREE.DoubleSide }));
  mesh(hood, lathe('hoodIn', prof.map(([r, y]) => [r * 0.985, y - 0.003]).reverse(), 36), M('hoodIn', { color: '#e9ecef', roughness: 0.12, metalness: 1, side: THREE.DoubleSide }));
  mesh(hood, tor(0.2, 0.006), blackMetal(), 0, 0, 0, Math.PI / 2);
  mesh(hood, cyl(0.035, 0.035, 0.05, 16), blackMetal(), 0, 0.13, 0);
  mesh(hood, lathe('bulb', [[0, -0.1], [0.025, -0.095], [0.045, -0.06], [0.045, -0.01], [0.03, 0.03], [0.02, 0.05], [0, 0.05]], 20), new THREE.MeshStandardMaterial({ color: 0xffd9f6, emissive: 0xff7ee8, emissiveIntensity: 2.2, roughness: 0.2 }), 0, 0.03, 0);
  // balastro en el mástil y su cable a la campana
  const bal = new THREE.Group(); bal.position.set(0, 0.5, 0.06); g.add(bal);
  mesh(bal, rbox(0.12, 0.2, 0.07, 0.008), blackMetal());
  vent(bal, 0, 0.03, 0.036, 0.09, 0.08, 0, 5);
  decal(bal, yellowTag(), 0.08, 0.04, 0, -0.06, 0.036);
  screws4(bal, 0, 0, 0.036, 0.12, 0.2);
  mesh(bal, cyl(0.004, 0.004, 0.012, 10), new THREE.MeshBasicMaterial({ color: 0x2ecc71 }), 0.04, -0.06, 0.04, Math.PI / 2);
  cable(g, V(0, 0.61, 0.08), V(0.0, 1.98, 0.28), 0.04, 0.005);
  cable(g, V(0, 0.4, 0.06), V(0.35, 0.005, 0.2), 0.02, 0.005);
  late(g);
}

// Panel LED de cultivo colgado de un pórtico: placa con matriz de LEDs, disipador con aletas,
// driver con rejilla y etiqueta, colgadores de trinquete y cable al enchufe
export function buildPanel(o) {
  const g = o.group, s = steel(), b = blackMetal();
  for (const x of [-0.6, 0.6]) {
    mesh(g, rbox(0.04, 2.05, 0.04, 0.006), s, x, 1.03, 0);
    mesh(g, rbox(0.08, 0.035, 0.55, 0.01), s, x, 0.018, 0);
    for (const z of [-0.25, 0.25]) mesh(g, cyl(0.025, 0.025, 0.012, 12), rubber(), x, 0.006, z);
    mesh(g, rbox(0.06, 0.06, 0.06, 0.008), b, x, 2.03, 0);                       // esquina
    screw(g, x, 2.03, 0.031);
    // tirante diagonal
    const br = mesh(g, rbox(0.018, 0.5, 0.018, 0.004), s, x, 0.24, 0.13); br.rotation.x = -0.75;
  }
  mesh(g, rbox(1.24, 0.035, 0.035, 0.006), s, 0, 2.03, 0);
  const board = new THREE.Group(); board.position.y = 1.56; g.add(board);
  for (const x of [-0.4, 0.4]) {
    mesh(g, cyl(0.004, 0.004, 0.38, 6), M('cuerda', { color: '#111', roughness: 0.7 }), x, 1.83, 0);
    mesh(g, rbox(0.03, 0.05, 0.02, 0.006), M('trinquete', { color: '#2b2d31', roughness: 0.4, metalness: 0.4 }), x, 1.74, 0);
    mesh(g, tor(0.012, 0.003), chrome(), x, 2.0, 0);
  }
  mesh(board, rbox(1.0, 0.04, 0.42, 0.012), b);
  for (let k = -6; k <= 6; k++) mesh(board, rbox(0.012, 0.06, 0.38, 0.003), b, k * 0.07, 0.05, 0); // aletas
  const leds = canvasTex('ledGrid', 512, 192, (c, w, h) => {
    c.fillStyle = '#f1f1ef'; c.fillRect(0, 0, w, h);
    for (let y = 8; y < h; y += 12) for (let x = 8; x < w; x += 12) { const r = (x * 7 + y * 3) % 11 === 0; c.fillStyle = r ? '#ff5a4a' : '#fffbe8'; c.beginPath(); c.arc(x, y, 3.2, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(0,0,0,0.12)'; c.fillRect(x - 4, y + 3.5, 8, 1); }
    c.fillStyle = '#d9d9d6'; c.fillRect(w / 2 - 2, 0, 4, h);
  });
  o.glowPanel = mesh(board, G('ledPlane', () => new THREE.PlaneGeometry(0.94, 0.36)), new THREE.MeshStandardMaterial({ map: leds, emissive: 0xffe2a8, emissiveMap: leds, emissiveIntensity: 1.5, roughness: 0.6 }), 0, -0.021, 0, Math.PI / 2);
  // driver encima
  const drv = new THREE.Group(); drv.position.set(0, 0.1, 0); board.add(drv);
  mesh(drv, rbox(0.3, 0.06, 0.12, 0.008), M('driver', { color: '#3a3f45', roughness: 0.35, metalness: 0.7 }));
  for (let k = -5; k <= 5; k++) mesh(drv, rbox(0.006, 0.015, 0.11, 0.002), b, k * 0.025, 0.035, 0);
  decal(drv, labelTex('drvLab', { bg: '#e8e8e4', band: '#d4a017', title: '640W', sub: 'LED driver', barcode: true, w: 192, h: 96 }), 0.12, 0.04, 0, 0, 0.061);
  mesh(drv, cyl(0.03, 0.03, 0.012, 16), M('dimmer', { color: '#c9a227', roughness: 0.3, metalness: 0.8 }), 0.12, 0, 0.065, Math.PI / 2);
  cable(g, V(0.15, 1.66, 0.04), V(0.6, 1.9, 0.03), 0.06, 0.005);
  cable(g, V(0.6, 0.35, 0.03), V(0.75, 0.005, 0.25), 0.02, 0.005);
  mesh(g, cyl(0.0055, 0.0055, 1.55, 6), M('cable#1b1d20', { color: '#1b1d20', roughness: 0.6 }), 0.625, 1.12, 0.03);
  late(g);
}

// Extractor con filtro de carbón: chapa perforada, bridas atornilladas, ventilador en línea,
// tubo flexible anillado y regulador de velocidad
export function buildExtractor(o) {
  const g = o.group, b = blackMetal(), s = steel();
  mesh(g, rbox(0.5, 0.04, 0.5, 0.01), b, 0, 0.02, 0);
  const perf = perforatedTex('filtro', '#4b5259'); perf.repeat.set(10, 4);
  mesh(g, cyl(0.21, 0.21, 0.56, 40, true), M('filtroPerf', { map: perf, roughness: 0.6, metalness: 0.5, side: THREE.DoubleSide }), 0, 0.33, 0);
  mesh(g, cyl(0.19, 0.19, 0.55, 24), M('carbon', { color: '#121314', roughness: 1 }), 0, 0.33, 0);
  for (const y of [0.06, 0.61]) {
    mesh(g, cyl(0.225, 0.225, 0.035, 40), s, 0, y, 0);
    for (let k = 0; k < 8; k++) { const a = (k / 8) * Math.PI * 2; screw(g, Math.cos(a) * 0.226, y, Math.sin(a) * 0.226, 'x').rotation.set(0, -a, -Math.PI / 2); }
  }
  decal(g, labelTex('carbonLab', { bg: '#f4f1e8', band: '#1e7a3c', title: 'CARBON', sub: 'Filtro activo', icon: 'leaf', w: 256, h: 128 }), 0.16, 0.08, 0, 0.36, 0.214);
  // ventilador en línea
  mesh(g, lathe('fanBody', [[0.06, 0], [0.12, 0.01], [0.17, 0.06], [0.17, 0.2], [0.12, 0.25], [0.06, 0.26]], 36), b, 0, 0.63, 0);
  mesh(g, tor(0.17, 0.008), s, 0, 0.76, 0, Math.PI / 2);
  decal(g, yellowTag(), 0.09, 0.045, 0, 0.73, 0.172);
  // tubo flexible anillado hacia arriba
  const rib = []; for (let i = 0; i <= 14; i++) rib.push([i % 2 ? 0.068 : 0.075, i * 0.012]);
  mesh(g, lathe('duct', rib, 24), M('ducto', { color: '#b9bec3', roughness: 0.3, metalness: 0.85 }), 0, 0.89, 0);
  mesh(g, cyl(0.08, 0.08, 0.02, 24), s, 0, 1.06, 0);
  o.spin = new THREE.Group(); o.spin.position.y = 1.075; g.add(o.spin);
  for (let k = 0; k < 5; k++) { const bl = mesh(o.spin, rbox(0.06, 0.004, 0.025, 0.002), s, 0, 0, 0); const a = (k / 5) * Math.PI * 2; bl.position.set(Math.cos(a) * 0.035, 0, Math.sin(a) * 0.035); bl.rotation.set(0.35, -a, 0); }
  mesh(o.spin, cyl(0.015, 0.015, 0.012, 12), b);
  // regulador
  const reg = new THREE.Group(); reg.position.set(0.26, 0.04, 0.12); g.add(reg);
  mesh(reg, rbox(0.08, 0.1, 0.05, 0.008), M('regul', { color: '#e9ecee', roughness: 0.4 }), 0, 0.05, 0);
  mesh(reg, cyl(0.018, 0.02, 0.018, 16), b, 0, 0.06, 0.03, Math.PI / 2);
  cable(g, V(0.26, 0.12, 0.12), V(0.12, 0.68, 0.12), 0.05, 0.004);
  o.busy = true; // (gira siempre)
  late(g);
}

// Taquilla metálica de dos puertas: lamas, bisagras, tarjetero, cierre con candado y patas
export function buildLocker(o) {
  const g = o.group;
  const paint = M('lockPaint', { color: '#5f7180', roughness: 0.5, metalness: 0.45, roughnessMap: wearTex() });
  const door = M('lockDoor', { color: '#71889a', roughness: 0.45, metalness: 0.45, roughnessMap: wearTex() });
  mesh(g, rbox(1.2, 1.88, 0.6, 0.02), paint, 0, 1.0, 0);
  mesh(g, rbox(1.22, 0.04, 0.62, 0.01), paint, 0, 1.955, 0);
  for (const x of [-0.56, 0.56]) for (const z of [-0.26, 0.26]) { mesh(g, cyl(0.02, 0.025, 0.06, 10), blackMetal(), x, 0.03, z); mesh(g, cyl(0.03, 0.03, 0.008, 12), rubber(), x, 0.004, z); }
  for (const sx of [-1, 1]) {
    const x = sx * 0.295;
    const d = new THREE.Group(); d.position.set(x, 1.0, 0.302); g.add(d);
    mesh(d, rbox(0.57, 1.82, 0.02, 0.008), door);
    mesh(d, rbox(0.5, 0.012, 0.004, 0.002), M('pliegue', { color: '#5d7282', roughness: 0.5, metalness: 0.4 }), 0, 0.2, 0.011);
    vent(d, 0, 0.72, 0.011, 0.34, 0.2, 0, 6);
    vent(d, 0, -0.75, 0.011, 0.34, 0.14, 0, 4);
    decal(d, canvasTex('tarjetero' + sx, 128, 48, (c, w, h) => { c.fillStyle = '#f4f4ef'; c.fillRect(0, 0, w, h); c.fillStyle = '#222'; c.font = 'bold 26px Arial'; c.fillText(sx < 0 ? 'Nº 1' : 'Nº 2', 34, 33); }), 0.09, 0.034, 0, 0.5, 0.012);
    mesh(d, rbox(0.1, 0.042, 0.006, 0.003), chrome(), 0, 0.5, 0.011);
    // asa y cierre con candado
    const hx = -sx * 0.22;
    mesh(d, rbox(0.03, 0.16, 0.03, 0.008), chrome(), hx, 0.05, 0.022);
    mesh(d, rbox(0.04, 0.03, 0.014, 0.004), chrome(), hx, -0.06, 0.018);
    const lock = new THREE.Group(); lock.position.set(hx, -0.1, 0.03); d.add(lock);
    mesh(lock, rbox(0.04, 0.035, 0.016, 0.006), M('candado', { color: '#c79a2c', roughness: 0.3, metalness: 0.9 }));
    mesh(lock, tor(0.012, 0.0028, Math.PI), chrome(), 0, 0.018, 0);
    // bisagras
    for (const y of [0.7, -0.7]) mesh(g, cyl(0.008, 0.008, 0.08, 8), chrome(), sx * 0.585, 1.0 + y, 0.31);
  }
  late(g);
}

// Caja fuerte: puerta empotrada con bisagras, rueda de tres radios, dial graduado, placa y pernos
export function buildSafe(o) {
  const g = o.group;
  const body = M('safeBody', { color: '#39424b', roughness: 0.4, metalness: 0.65, roughnessMap: wearTex() });
  mesh(g, rbox(0.7, 0.78, 0.7, 0.04), body, 0, 0.43, 0);
  mesh(g, rbox(0.72, 0.05, 0.72, 0.015), blackMetal(), 0, 0.025, 0);
  mesh(g, rbox(0.6, 0.66, 0.012, 0.004), M('safeGap', { color: '#0d0f11', roughness: 1 }), 0, 0.43, 0.346);
  const d = new THREE.Group(); d.position.set(0, 0.43, 0.352); g.add(d);
  mesh(d, rbox(0.58, 0.64, 0.035, 0.012), M('safeDoor', { color: '#47515b', roughness: 0.35, metalness: 0.7, roughnessMap: wearTex() }));
  mesh(d, rbox(0.5, 0.56, 0.006, 0.004), M('safeInset', { color: '#3e4750', roughness: 0.45, metalness: 0.6 }), 0, 0, 0.019);
  for (const y of [0.21, -0.21]) { mesh(g, cyl(0.016, 0.016, 0.09, 12), chrome(), -0.3, 0.43 + y, 0.36); }
  for (const [x, y] of [[-0.22, 0.25], [0.22, 0.25], [-0.22, -0.25], [0.22, -0.25]]) screw(d, x, y, 0.022, 'z', 0.009);
  const dialT = canvasTex('dial', 256, 256, (c, w) => {
    const r = w / 2; c.fillStyle = '#c9a227'; c.beginPath(); c.arc(r, r, r, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#1a1a1a'; c.beginPath(); c.arc(r, r, r * 0.92, 0, Math.PI * 2); c.fill();
    c.strokeStyle = '#e8e2d0'; c.fillStyle = '#e8e2d0'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = 'bold 16px Arial';
    for (let i = 0; i < 100; i += 2) { const a = (i / 100) * Math.PI * 2 - Math.PI / 2, l = i % 10 ? 8 : 16; c.lineWidth = i % 10 ? 1.5 : 3; c.beginPath(); c.moveTo(r + Math.cos(a) * r * 0.9, r + Math.sin(a) * r * 0.9); c.lineTo(r + Math.cos(a) * (r * 0.9 - l), r + Math.sin(a) * (r * 0.9 - l)); c.stroke(); if (i % 10 === 0) c.fillText(String(i), r + Math.cos(a) * r * 0.62, r + Math.sin(a) * r * 0.62); }
    c.fillStyle = '#2b2b2b'; c.beginPath(); c.arc(r, r, r * 0.42, 0, Math.PI * 2); c.fill();
  });
  const dial = mesh(d, cyl(0.065, 0.07, 0.025, 40), [M('dialSide', { color: '#b8921f', roughness: 0.3, metalness: 0.9 }), M('dialFace', { map: dialT, roughness: 0.35, metalness: 0.4 }), M('dialSide', {})], 0.08, 0.12, 0.035, Math.PI / 2);
  dial.rotation.y = 0.6;
  mesh(d, lathe('dialKnob', [[0, 0], [0.03, 0], [0.03, 0.02], [0.02, 0.035], [0, 0.035]], 20), M('dialKnobM', { color: '#2b2b2b', roughness: 0.4, metalness: 0.5 }), 0.08, 0.12, 0.045, Math.PI / 2);
  mesh(d, rbox(0.008, 0.02, 0.006, 0.002), M('dialMark', { color: '#c0392b', roughness: 0.5 }), 0.08, 0.2, 0.024);
  // rueda de tres radios
  const wh = new THREE.Group(); wh.position.set(0.08, -0.12, 0.03); d.add(wh);
  mesh(wh, cyl(0.025, 0.03, 0.04, 16), chrome(), 0, 0, 0.01, Math.PI / 2);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * Math.PI * 2 + 0.3; const sp = mesh(wh, cyl(0.007, 0.007, 0.11, 8), chrome(), Math.cos(a) * 0.055, Math.sin(a) * 0.055, 0.02); sp.rotation.z = a - Math.PI / 2; mesh(wh, G('safeBall', () => new THREE.SphereGeometry(0.014, 12, 8)), chrome(), Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0.02); }
  decal(d, canvasTex('safePlate', 256, 64, (c, w, h) => { c.fillStyle = '#c9a227'; c.fillRect(0, 0, w, h); c.strokeStyle = '#7a5d10'; c.lineWidth = 4; c.strokeRect(4, 4, w - 8, h - 8); c.fillStyle = '#3a2a05'; c.font = '900 34px "Arial Black", Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('ROOKSAFE', w / 2, h / 2 + 2); }), 0.2, 0.05, -0.08, 0.24, 0.025);
  late(g);
}

// Humidificador: cuerpo torneado, depósito translúcido con nivel de agua, boquilla,
// panel con pantalla y botones, rejilla de entrada de aire y patas
export function buildHumid(o) {
  const g = o.group;
  const white = M('humWhite', { color: '#eef2f4', roughness: 0.35 });
  mesh(g, lathe('humBase', [[0, 0.02], [0.17, 0.02], [0.19, 0.04], [0.19, 0.3], [0.17, 0.32], [0, 0.32]], 40), white);
  for (let k = 0; k < 4; k++) { const a = (k / 4) * Math.PI * 2 + Math.PI / 4; mesh(g, cyl(0.025, 0.03, 0.02, 12), rubber(), Math.cos(a) * 0.14, 0.01, Math.sin(a) * 0.14); }
  const grille = perforatedTex('humGrille', '#d7dde1'); grille.repeat.set(8, 1.5);
  mesh(g, cyl(0.192, 0.192, 0.09, 40, true), M('humGr', { map: grille, roughness: 0.5, side: THREE.DoubleSide }), 0, 0.1, 0);
  // depósito
  mesh(g, lathe('humTank', [[0.17, 0.32], [0.175, 0.34], [0.175, 0.66], [0.16, 0.7], [0.0, 0.7]], 40), new THREE.MeshPhysicalMaterial({ color: 0xbfe6f7, roughness: 0.05, transmission: 0.6, transparent: true, opacity: 0.45, thickness: 0.02, depthWrite: false }));
  mesh(g, cyl(0.165, 0.165, 0.22, 36), new THREE.MeshStandardMaterial({ color: 0x5fb6e6, transparent: true, opacity: 0.55, roughness: 0.1, depthWrite: false }), 0, 0.45, 0);
  for (const y of [0.4, 0.5, 0.6]) mesh(g, tor(0.176, 0.0025), white, 0, y, 0, Math.PI / 2);
  mesh(g, lathe('humTop', [[0, 0.7], [0.16, 0.7], [0.16, 0.73], [0.1, 0.78], [0.05, 0.8], [0, 0.8]], 32), white);
  mesh(g, ribbedCap(0.04, 0.05), M('humNozzle', { color: '#d5dde2', roughness: 0.3 }), 0, 0.8, 0);
  mesh(g, cyl(0.025, 0.025, 0.012, 16, true), M('humHole', { color: '#22282c', roughness: 1, side: THREE.DoubleSide }), 0, 0.85, 0);
  // panel de control en el frente del cuerpo
  const panelT = canvasTex('humPanel', 256, 128, (c, w, h) => {
    c.fillStyle = '#e6ebee'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#0f1a20'; c.fillRect(20, 18, 120, 64);
    c.fillStyle = '#58e3ff'; c.font = 'bold 44px "Courier New", monospace'; c.fillText('65%', 28, 66);
    c.fillStyle = '#8b99a2'; c.font = 'bold 14px Arial'; c.fillText('HUMEDAD', 30, 104);
    for (const [x, col] of [[170, '#2ecc71'], [210, '#3498db']]) { c.fillStyle = col; c.beginPath(); c.arc(x, 50, 14, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(255,255,255,0.4)'; c.beginPath(); c.arc(x - 4, 45, 5, 0, Math.PI * 2); c.fill(); }
  });
  const pm = new THREE.Mesh(G('humPanelGeo', () => new THREE.CylinderGeometry(0.1915, 0.1915, 0.09, 24, 1, true, -0.55, 1.1)), M('humPanelM', { map: panelT, roughness: 0.4, polygonOffset: true, polygonOffsetFactor: -2 }));
  pm.position.y = 0.23; g.add(pm);
  o.mist = new THREE.Mesh(new THREE.SphereGeometry(0.5, 10, 8), new THREE.MeshBasicMaterial({ color: 0xdff3ff, transparent: true, opacity: 0.35, depthWrite: false }));
  o.mist.scale.set(0.22, 0.3, 0.22); o.mist.position.y = 0.95; g.add(o.mist);
}

// Estantería de acero: montantes en L perforados, baldas con pestaña, tirantes en cruz y cajas
export function buildShelf(o) {
  const g = o.group;
  const paint = M('shelfPaint', { color: '#4f6170', roughness: 0.45, metalness: 0.55, roughnessMap: wearTex() });
  const perf = canvasTex('slotted', 32, 256, (c, w, h) => { c.fillStyle = '#4f6170'; c.fillRect(0, 0, w, h); c.fillStyle = '#0e1114'; for (let y = 6; y < h; y += 16) c.fillRect(w * 0.35, y, w * 0.3, 8); }, { repeat: true });
  perf.repeat.set(1, 4);
  const up = M('shelfUp', { map: perf, roughness: 0.45, metalness: 0.55 });
  for (const x of [-0.775, 0.775]) for (const z of [-0.275, 0.275]) {
    mesh(g, rbox(0.05, 1.8, 0.005, 0.002), up, x, 0.9, z + Math.sign(z) * 0.0225);
    mesh(g, rbox(0.005, 1.8, 0.05, 0.002), up, x + Math.sign(x) * 0.0225, 0.9, z);
    mesh(g, rbox(0.06, 0.015, 0.06, 0.004), rubber(), x, 0.0075, z);
  }
  for (const y of [0.12, 0.62, 1.12, 1.62]) {
    mesh(g, rbox(1.56, 0.018, 0.56, 0.004), M('shelfBoard', { color: '#8a959e', roughness: 0.5, metalness: 0.5, roughnessMap: wearTex() }), 0, y, 0);
    for (const z of [-0.278, 0.278]) mesh(g, rbox(1.56, 0.045, 0.006, 0.002), paint, 0, y - 0.015, z);
    for (const x of [-0.77, 0.77]) for (const z of [-0.27, 0.27]) screw(g, x, y - 0.015, z + Math.sign(z) * 0.012, z > 0 ? 'z' : '-z', 0.005);
  }
  for (const d of [1, -1]) { const t = mesh(g, rbox(0.012, 1.7, 0.004, 0.002), paint, 0, 0.9, -0.283); t.rotation.z = d * 0.84; }
  // cajas de cartón y cubetas
  o.boxes = [];
  const card = M('shelfCard', { map: cardboardTex('estante'), roughness: 0.85 });
  const card2 = M('shelfCard2', { map: cardboardTex('estante2', { tape: true, print: 'ROOK' }), roughness: 0.85 });
  const bin = M('shelfBin', { color: '#2f6fb2', roughness: 0.55 });
  const L = [[-0.52, 0.13, 0.42, 0.3, 0.38, card], [-0.02, 0.13, 0.36, 0.26, 0.4, card2], [0.48, 0.13, 0.44, 0.34, 0.4, card], [-0.5, 0.63, 0.38, 0.18, 0.42, bin], [0.0, 0.63, 0.34, 0.28, 0.36, card2], [0.5, 0.63, 0.4, 0.22, 0.38, card]];
  L.forEach(([x, y, w, h, dd, m], i) => {
    const b = mesh(g, rbox(w, h, dd, m === bin ? 0.02 : 0.006), m, x, y + 0.009 + h / 2, 0, 0, (i % 2 ? 0.04 : -0.03), 0);
    if (m === bin) { mesh(b, rbox(w * 0.9, 0.005, dd * 0.9, 0.002), M('binIn', { color: '#1c4a7a', roughness: 0.8 }), 0, h / 2 - 0.004, 0); mesh(b, rbox(0.1, 0.04, 0.01, 0.004), M('binLabel', { color: '#f3f3ee', roughness: 0.7 }), 0, 0, dd / 2 + 0.003); }
    o.boxes.push(b);
  });
  late(g);
}
