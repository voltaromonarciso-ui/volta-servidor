// El Cartel: el cuartel del cártel. Fachada de ladrillo oscuro de dos plantas con ventanas
// enrejadas, toldo granate y rótulo de neón rojo; por dentro, oscuro y con neones:
//   - recibidor con el portero (sólo te deja pasar desde Trapichero),
//   - sala principal con el mostrador enrejado de la tienda, vitrinas de armas, mesa de
//     mercancía y una zona de sofás con la tele,
//   - despacho del jefe al fondo a la derecha.
// Coordenadas locales: x −12..12, z −9..9, fachada hacia +z. Devuelve el grupo, las cajas de
// colisión [x0, x1, z0, z1, alto], los muebles (modelos de interior.js), la hoja de la puerta
// de la calle y dónde están el portero, el dependiente, el jefe y los matones.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat } from './buildingkit.js';
import { slab, GLASS } from './realbuilding.js';
import { dims } from './interior.js';

const W = 24, D = 18, GH = 4.2, H = 7.6, T = 0.3;
const X0 = -W / 2, X1 = W / 2, Z0 = -D / 2, Z1 = D / 2;
const ix0 = X0 + T, ix1 = X1 - T, iz0 = Z0 + T, iz1 = Z1 - T;

const mats = new Map();
const mat = (k, o) => { if (!mats.has(k)) mats.set(k, new THREE.MeshStandardMaterial(o)); return mats.get(k); };
const texs = new Map();
function canvasTex(key, w, h, draw, repeat = false) {
  if (!texs.has(key)) {
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    draw(c.getContext('2d'), w, h);
    const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
    if (repeat) t.wrapS = t.wrapT = THREE.RepeatWrapping;
    texs.set(key, t);
  }
  return texs.get(key);
}
// cartel de neón: letras con halo sobre fondo transparente
function neonMat(key, text, color, { w = 512, h = 128, font = 'bold 74px "Arial Black", Impact, sans-serif', ei = 2.2 } = {}) {
  return mat('neon-' + key, {
    color: '#ffffff', transparent: true, alphaTest: 0.04, depthWrite: false, emissive: color, emissiveIntensity: ei, side: THREE.DoubleSide,
    map: canvasTex('neon-' + key, w, h, (c) => {
      c.textAlign = 'center'; c.textBaseline = 'middle'; c.font = font;
      for (const [blur, a] of [[28, 0.55], [14, 0.8], [4, 1]]) { c.shadowColor = color; c.shadowBlur = blur; c.fillStyle = color; c.globalAlpha = a; c.fillText(text, w / 2, h / 2); }
      c.globalAlpha = 1; c.shadowBlur = 0; c.fillStyle = '#fff6f6'; c.fillText(text, w / 2, h / 2);
    }),
  });
}
function rbox(g, m, w, h, d, x, y, z, r = 0.03) {
  const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2) * 0.99), m);
  o.position.set(x, y, z); g.add(o); return o;
}
function cyl(g, m, rt, rb, h, x, y, z, s = 14) { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, s), m); o.position.set(x, y, z); g.add(o); return o; }
function plane(g, m, w, h, x, y, z, ry = 0, rx = 0) { const o = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); o.position.set(x, y, z); o.rotation.set(rx, ry, 0); g.add(o); return o; }

export function cartelHQ() {
  const g = new THREE.Group(), boxes = [], items = [];
  const put = (name, x, y, z, ry = 0, s = 1, solid = true) => {
    const d = dims(name, s);
    if (!d[0]) return null;
    items.push({ name, x, y, z, ry, s });
    if (solid) { const turned = Math.abs(Math.sin(ry)) > 0.5, hw = (turned ? d[2] : d[0]) / 2, hd = (turned ? d[0] : d[2]) / 2; boxes.push([x - hw, x + hw, z - hd, z + hd, y + d[1]]); }
    return d;
  };
  // ---------------- materiales ----------------
  const brick = pbrMat('ladrilloOscuro'), concrete = pbrMat('hormigon', '#8f8b86');
  const plaster = mat('cartelYeso', { color: '#24202a', roughness: 0.9 });
  const plasterLow = mat('cartelZocalo', { color: '#17141b', roughness: 0.6 });
  const steel = mat('cartelAcero', { color: '#2b2e33', roughness: 0.35, metalness: 0.8 });
  const bars = mat('cartelRejas', { color: '#1a1c1f', roughness: 0.4, metalness: 0.85 });
  const wood = mat('cartelMadera', { color: '#3a2418', roughness: 0.5 });
  const woodTop = mat('cartelMaderaTop', { color: '#4a2c1b', roughness: 0.3, metalness: 0.05 });
  const leather = mat('cartelCuero', { color: '#5a1414', roughness: 0.45 });
  const gold = mat('cartelOro', { color: '#c9a24a', roughness: 0.25, metalness: 0.9 });
  const red = '#ff2a3c', magenta = '#d63cff', cyan = '#29e6ff';
  const neonRed = mat('tiraRoja', { color: '#ff6b78', emissive: red, emissiveIntensity: 2.4 });
  const neonPink = mat('tiraRosa', { color: '#f39bff', emissive: magenta, emissiveIntensity: 2.2 });
  const neonCyan = mat('tiraCian', { color: '#a5f6ff', emissive: cyan, emissiveIntensity: 1.8 });
  const floorM = mat('cartelSuelo', {
    roughness: 0.28, metalness: 0.1,
    map: canvasTex('cartelSuelo', 512, 512, (c, w, h) => {
      // baldosa negra pulida de 1 m con vetas
      for (let y = 0; y < 2; y++) for (let x = 0; x < 2; x++) {
        c.fillStyle = (x + y) % 2 ? '#141216' : '#1b181d'; c.fillRect(x * 256, y * 256, 256, 256);
        for (let k = 0; k < 6; k++) { c.strokeStyle = `rgba(120,110,130,${0.05 + Math.random() * 0.06})`; c.lineWidth = 1 + Math.random() * 2; c.beginPath(); c.moveTo(x * 256 + Math.random() * 256, y * 256); c.bezierCurveTo(x * 256 + Math.random() * 256, y * 256 + 90, x * 256 + Math.random() * 256, y * 256 + 170, x * 256 + Math.random() * 256, y * 256 + 256); c.stroke(); }
      }
      c.fillStyle = '#060507'; c.fillRect(0, 0, w, 3); c.fillRect(0, 0, 3, h); c.fillRect(0, 255, w, 3); c.fillRect(255, 0, 3, h);
    }, true),
  });
  floorM.map.repeat.set(1, 1);

  // ---------------- fachada y muros ----------------
  const DX = -6, DW = 0.7; // puerta de la calle (centro x −6, 1,4 m)
  slab(g, brick, X0, X1, 0, H, Z0, Z0 + T);                      // fondo
  slab(g, brick, X0, X0 + T, 0, H, Z0, Z1);                      // izquierda
  slab(g, brick, X1 - T, X1, 0, H, Z0, Z1);                      // derecha
  slab(g, brick, X0, DX - DW, 0, H, Z1 - T, Z1);                 // frente, a la izquierda de la puerta
  slab(g, brick, DX + DW, X1, 0, H, Z1 - T, Z1);                 // frente, a la derecha
  slab(g, brick, DX - DW, DX + DW, 2.5, H, Z1 - T, Z1);          // dintel
  slab(g, brick, X0, X1, GH, H, Z0, Z1);                         // planta alta (maciza) y techo del bajo
  slab(g, concrete, X0 - 0.06, X1 + 0.06, 0, 0.5, Z1, Z1 + 0.08); // zócalo
  slab(g, concrete, X0 - 0.15, X1 + 0.15, H, H + 0.3, Z0 - 0.15, Z1 + 0.15); // cornisa
  slab(g, concrete, X0 - 0.1, X1 + 0.1, GH - 0.05, GH + 0.25, Z1, Z1 + 0.2);   // imposta entre plantas
  boxes.push([X0, X1, Z0, Z0 + T, H], [X0, X0 + T, Z0, Z1, H], [X1 - T, X1, Z0, Z1, H], [X0, DX - DW, Z1 - T, Z1, H], [DX + DW, X1, Z1 - T, Z1, H]);
  // marco de acero de la puerta, luz encima y cámara de seguridad
  for (const s of [-1, 1]) slab(g, steel, DX + s * DW - 0.08, DX + s * DW + 0.08, 0, 2.6, Z1 - 0.02, Z1 + 0.1);
  slab(g, steel, DX - DW - 0.08, DX + DW + 0.08, 2.5, 2.66, Z1 - 0.02, Z1 + 0.1);
  slab(g, mat('cartelToldo', { color: '#3a1010', roughness: 0.8 }), DX - 1.5, DX + 1.5, 2.9, 3.0, Z1, Z1 + 1.3);  // marquesina
  slab(g, steel, DX - 1.5, DX + 1.5, 2.82, 2.9, Z1, Z1 + 1.3);
  rbox(g, mat('cartelAplique', { color: '#ffe0c0', emissive: '#ffb070', emissiveIntensity: 1.8 }), 0.5, 0.08, 0.3, DX, 2.78, Z1 + 0.7, 0.03);
  const cam = new THREE.Group(); cam.position.set(DX + 1.9, 3.3, Z1 + 0.15); cam.rotation.y = -0.6; g.add(cam);
  rbox(cam, mat('camBlanca', { color: '#d9dcdf', roughness: 0.4 }), 0.18, 0.16, 0.42, 0, 0, 0.18, 0.04);
  cyl(cam, steel, 0.02, 0.02, 0.18, 0, 0.1, 0); cyl(cam, mat('camLed', { color: '#ff3030', emissive: '#ff2020', emissiveIntensity: 2 }), 0.015, 0.015, 0.02, 0.05, 0.02, 0.4, 8).rotation.x = Math.PI / 2;
  // ventanas de abajo cegadas (cristal tintado) con rejas; arriba, ventanas con persiana
  const tint = mat('cristalTintado', { color: '#0d0f12', roughness: 0.05, metalness: 0.8 });
  for (const wx of [-1.5, 2.5, 6.5, 10]) {
    slab(g, concrete, wx - 1.05, wx + 1.05, 1.0, 1.08, Z1, Z1 + 0.14);
    slab(g, tint, wx - 0.9, wx + 0.9, 1.08, 2.9, Z1 - 0.02, Z1 + 0.02);
    for (let k = -4; k <= 4; k++) slab(g, bars, wx + k * 0.2 - 0.015, wx + k * 0.2 + 0.015, 1.05, 2.95, Z1 + 0.08, Z1 + 0.11);
    for (const y of [1.3, 2.6]) slab(g, bars, wx - 0.95, wx + 0.95, y - 0.02, y + 0.02, Z1 + 0.08, Z1 + 0.11);
  }
  const blind = mat('persiana', { color: '#4a4440', roughness: 0.7 });
  for (let wx = -10; wx <= 10; wx += 3.3) {
    slab(g, concrete, wx - 0.85, wx + 0.85, GH + 0.75, GH + 0.83, Z1, Z1 + 0.14);
    slab(g, tint, wx - 0.7, wx + 0.7, GH + 0.83, GH + 2.6, Z1 - 0.02, Z1 + 0.02);
    slab(g, blind, wx - 0.7, wx + 0.7, GH + 1.9, GH + 2.6, Z1 + 0.02, Z1 + 0.03);
  }
  // rótulo de neón en la fachada
  const sign = new THREE.Group(); sign.position.set(4.3, GH + 0.05, Z1 + 0.2); g.add(sign);
  rbox(sign, mat('fondoRotulo', { color: '#120a0c', roughness: 0.5 }), 8.4, 1.0, 0.16, 0, 0.55, 0, 0.06);
  plane(sign, neonMat('rotulo', 'EL CARTEL', red, { w: 1024, h: 128, font: 'bold 92px "Arial Black", Impact, sans-serif', ei: 2.6 }), 8.0, 1.0, 0, 0.55, 0.09);
  for (const s of [-1, 1]) slab(sign, neonRed, s * 4.15 - 0.03, s * 4.15 + 0.03, 0.08, 1.02, 0.05, 0.1);

  // ---------------- interior: suelo, techo, tabiques ----------------
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(ix1 - ix0, iz1 - iz0), floorM);
  fl.rotation.x = -Math.PI / 2; fl.position.set(0, 0.02, 0); fl.material.map.repeat.set((ix1 - ix0) / 2, (iz1 - iz0) / 2); g.add(fl);
  slab(g, mat('cartelTecho', { color: '#0e0c10', roughness: 0.9 }), ix0, ix1, GH - 0.12, GH - 0.05, iz0, iz1);
  // paredes de dentro: yeso oscuro con zócalo negro brillante (forros finos sobre el ladrillo)
  const liner = (x0, x1, z0, z1) => { slab(g, plaster, x0, x1, 0, GH - 0.12, z0, z1); };
  liner(ix0, ix1, iz0, iz0 + 0.02); liner(ix0, ix0 + 0.02, iz0, iz1); liner(ix1 - 0.02, ix1, iz0, iz1); liner(ix0, DX - DW, iz1 - 0.02, iz1); liner(DX + DW, ix1, iz1 - 0.02, iz1);
  // tabiques: recibidor (x ix0..−1, z 3..iz1) con su paso a la sala, y despacho (x 5..ix1, z iz0..3)
  const PT = 0.2, LZ = 3, LX = -1, OX = 5;
  const wall = (x0, x1, z0, z1) => { slab(g, plaster, x0, x1, 0, GH - 0.12, z0, z1); slab(g, plasterLow, x0 - 0.01, x1 + 0.01, 0, 0.18, z0 - 0.01, z1 + 0.01); boxes.push([x0, x1, z0, z1, GH]); };
  const AX0 = -9.3, AX1 = -7.7; // paso del recibidor a la sala
  wall(ix0, AX0, LZ - PT / 2, LZ + PT / 2); wall(AX1, LX, LZ - PT / 2, LZ + PT / 2);
  slab(g, plaster, AX0, AX1, 2.6, GH - 0.12, LZ - PT / 2, LZ + PT / 2);
  wall(LX - PT / 2, LX + PT / 2, LZ, iz1);
  const ODZ0 = -1.9, ODZ1 = -0.5; // puerta del despacho
  wall(OX - PT / 2, OX + PT / 2, iz0, ODZ0); wall(OX - PT / 2, OX + PT / 2, ODZ1, LZ + PT / 2);
  slab(g, plaster, OX - PT / 2, OX + PT / 2, 2.4, GH - 0.12, ODZ0, ODZ1);
  wall(OX, ix1, LZ - PT / 2, LZ + PT / 2);
  // zócalo negro por las paredes de fuera
  for (const [x0, x1, z0, z1] of [[ix0, ix1, iz0, iz0 + 0.04], [ix0, ix0 + 0.04, iz0, iz1], [ix1 - 0.04, ix1, iz0, iz1], [ix0, DX - DW, iz1 - 0.04, iz1], [DX + DW, ix1, iz1 - 0.04, iz1]]) slab(g, plasterLow, x0, x1, 0, 0.18, z0, z1);
  // tiras de neón en el techo: roja por la sala, rosa en la zona de sofás, cian en el recibidor
  const strip = (m, x0, x1, z0, z1) => slab(g, m, x0, x1, GH - 0.2, GH - 0.14, z0, z1);
  strip(neonRed, ix0 + 0.1, OX - 0.3, iz0 + 0.1, iz0 + 0.16); strip(neonRed, ix0 + 0.1, ix0 + 0.16, iz0 + 0.1, LZ - 0.3);
  strip(neonRed, OX - 0.36, OX - 0.3, iz0 + 0.1, LZ - 0.3);
  strip(neonPink, LX + 0.3, ix1 - 0.1, iz1 - 0.16, iz1 - 0.1); strip(neonPink, ix1 - 0.16, ix1 - 0.1, LZ + 0.3, iz1 - 0.1);
  strip(neonCyan, ix0 + 0.1, LX - 0.3, iz1 - 0.16, iz1 - 0.1);
  // focos colgantes sobre el mostrador y la mesa
  const lampM = mat('cartelFoco', { color: '#ffe8c8', emissive: '#ffb860', emissiveIntensity: 2.2 });
  const pend = (x, z, len = 1.1) => { cyl(g, bars, 0.006, 0.006, len, x, GH - 0.12 - len / 2, z, 4); cyl(g, steel, 0.06, 0.22, 0.22, x, GH - 0.12 - len - 0.08, z, 16); cyl(g, lampM, 0.19, 0.19, 0.02, x, GH - 0.12 - len - 0.19, z, 16); };

  // ---------------- recibidor ----------------
  // banco de espera, monitor de cámaras, planta y flecha de neón hacia la sala
  // dos butacas de cuero negro mirando a la sala, mesita con lámpara y planta, perchero
  put('luxuf/Sofa_individual', -3.4, 0, iz1 - 0.75, Math.PI, 0.6);
  put('luxuf/Sofa_individual', -1.95, 0, iz1 - 0.75, Math.PI, 0.6);
  const nst = put('luxhi/NightStand_1', -4.6, 0, iz1 - 0.5, 0, 1.1);
  if (nst) put('luxhi/Light_Desk', -4.6, nst[1], iz1 - 0.55, 0, 1.4, false);
  put('furniture/coatRackStanding', ix0 + 0.45, 0, LZ + 0.55);
  put('luxhi/Light_Floor1', -1.4, 0, LZ + 0.5, 0, 1.9, false);
  rbox(g, mat('monitorCCTV', { color: '#0c1a14', emissive: '#2fd47a', emissiveIntensity: 0.6, roughness: 0.2 }), 0.9, 0.55, 0.06, -10.4, 2.0, LZ + PT / 2 + 0.05, 0.02);
  plane(g, mat('cctvTex', { color: '#ffffff', emissive: '#ffffff', emissiveIntensity: 0.7, map: canvasTex('cctv', 128, 80, (c, w, h) => { c.fillStyle = '#0d1f16'; c.fillRect(0, 0, w, h); c.strokeStyle = '#3cff9a'; c.lineWidth = 1; for (let k = 0; k < 4; k++) { const x = (k % 2) * 64, y = Math.floor(k / 2) * 40; c.strokeRect(x + 2, y + 2, 60, 36); c.fillStyle = 'rgba(80,255,160,0.25)'; c.fillRect(x + 8 + k * 5, y + 14, 20, 16); } c.fillStyle = '#ff4040'; c.fillRect(118, 4, 6, 6); }) }), 0.84, 0.5, -10.4, 2.0, LZ + PT / 2 + 0.09, 0);
  put('luxhi/Houseplant_1', ix0 + 0.5, 0, iz1 - 0.5, 0, 2.6);
  plane(g, neonMat('pasa', '→ PASA', cyan, { w: 512, h: 128, font: 'bold 70px "Arial Black", sans-serif', ei: 1.8 }), 1.4, 0.35, (AX0 + AX1) / 2 + 2.4, 2.4, LZ + PT / 2 + 0.03, 0);

  // ---------------- sala: mostrador enrejado de la tienda ----------------
  const cx0 = -10, cx1 = -2.4, cz = -5.6;                      // mostrador (frente en z cz + 0.4)
  rbox(g, wood, cx1 - cx0, 1.0, 0.8, (cx0 + cx1) / 2, 0.5, cz, 0.03);
  rbox(g, woodTop, cx1 - cx0 + 0.1, 0.06, 0.9, (cx0 + cx1) / 2, 1.03, cz, 0.02);
  slab(g, gold, cx0, cx1, 0.12, 0.16, cz + 0.4, cz + 0.42);
  boxes.push([cx0 - 0.05, cx1 + 0.05, cz - 0.45, cz + 0.45, 2.8]);
  // reja de barrotes hasta el techo con la ventanilla en el centro
  const wx = (cx0 + cx1) / 2;
  for (let x = cx0 + 0.1; x <= cx1 - 0.05; x += 0.18) {
    const inWin = Math.abs(x - wx) < 0.75;
    cyl(g, bars, 0.016, 0.016, inWin ? GH - 0.12 - 1.75 : GH - 0.12 - 1.06, x, inWin ? (1.75 + GH - 0.12) / 2 : (1.06 + GH - 0.12) / 2, cz + 0.05, 6);
  }
  for (const y of [1.75, 2.6, GH - 0.3]) slab(g, bars, cx0, cx1, y - 0.02, y + 0.02, cz + 0.02, cz + 0.08);
  slab(g, steel, wx - 0.8, wx + 0.8, 1.06, 1.1, cz - 0.05, cz + 0.55); // bandeja de la ventanilla
  // detrás: estanterías con paquetes, bolsas y fajos
  const shelfX = [cx0 + 0.6, cx1 - 0.6];
  for (let x = cx0 + 0.2; x < cx1 - 0.2; x += 1.9) {
    for (const y of [0.4, 1.1, 1.8, 2.5]) slab(g, steel, x, x + 1.7, y, y + 0.04, iz0 + 0.05, iz0 + 0.6);
    for (const xx of [x, x + 1.66]) slab(g, steel, xx, xx + 0.04, 0, 2.9, iz0 + 0.05, iz0 + 0.6);
  }
  const pack = mat('paqueteCinta', { color: '#c9b48a', roughness: 0.6 }), wrap = mat('paqueteFilm', { color: '#e8e4dc', roughness: 0.2, transparent: true, opacity: 0.85 }), cash = mat('fajo', { color: '#5e8a4a', roughness: 0.7 });
  let sd = 5; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
  for (let x = cx0 + 0.35; x < cx1 - 0.4; x += 0.42) for (const y of [0.44, 1.14, 1.84, 2.54]) {
    if (rnd() < 0.25) continue;
    const kind = rnd();
    if (kind < 0.45) rbox(g, pack, 0.32, 0.12, 0.22, x, y + 0.08, iz0 + 0.33, 0.03);
    else if (kind < 0.75) rbox(g, wrap, 0.24, 0.18, 0.2, x, y + 0.11, iz0 + 0.33, 0.06);
    else for (let k = 0; k < 3; k++) rbox(g, cash, 0.18, 0.05, 0.09, x, y + 0.045 + k * 0.05, iz0 + 0.33, 0.01);
  }
  boxes.push([cx0, cx1, iz0, iz0 + 0.65, 3]);
  plane(g, neonMat('tienda', 'MERCANCÍA', red, { w: 768, h: 128, font: 'bold 80px "Arial Black", Impact, sans-serif', ei: 2.3 }), 3.6, 0.6, wx, 3.45, iz0 + 0.08, 0);
  pend(wx - 2, cz + 1.2); pend(wx + 2, cz + 1.2);

  // vitrinas de armas en la pared de la izquierda (cristal, luz dentro y armas en la pared)
  const gunM = mat('armaNegra', { color: '#121315', roughness: 0.35, metalness: 0.7 });
  const pegM = mat('panelArmas', { color: '#3a3f46', roughness: 0.8 });
  const caseLight = mat('luzVitrina', { color: '#ffffff', emissive: '#ffe9d0', emissiveIntensity: 1.6 });
  for (const [z0, z1] of [[-4.6, -1.6], [-1.0, 2.0]]) {
    const vx0 = ix0 + 0.02, vx1 = ix0 + 0.75, zc = (z0 + z1) / 2;
    rbox(g, wood, 0.75, 0.9, z1 - z0, (vx0 + vx1) / 2, 0.45, zc, 0.03);
    slab(g, pegM, vx0, vx0 + 0.04, 0.9, 2.7, z0 + 0.05, z1 - 0.05);
    slab(g, caseLight, vx0 + 0.05, vx1 - 0.05, 2.66, 2.7, z0 + 0.1, z1 - 0.1);
    const glass = GLASS();
    slab(g, glass, vx1 - 0.03, vx1, 0.9, 2.72, z0, z1);
    for (const z of [z0, z1 - 0.03]) slab(g, glass, vx0, vx1, 0.9, 2.72, z, z + 0.03);
    slab(g, steel, vx0, vx1 + 0.02, 2.72, 2.8, z0, z1);
    // armas: pistolas en la fila de abajo, fusiles cortos arriba (siluetas en 3D sencillas)
    for (let k = 0; k < 3; k++) {
      const z = z0 + 0.5 + k * ((z1 - z0 - 1) / 2);
      const p = new THREE.Group(); p.position.set(vx0 + 0.08, 1.35, z); g.add(p);
      rbox(p, gunM, 0.05, 0.12, 0.34, 0, 0.05, 0.04, 0.015); rbox(p, gunM, 0.05, 0.2, 0.09, 0, -0.08, -0.07, 0.015);
      const r2 = new THREE.Group(); r2.position.set(vx0 + 0.08, 2.15, z); r2.rotation.x = 0.08; g.add(r2);
      rbox(r2, gunM, 0.05, 0.1, 0.8, 0, 0, 0, 0.015); rbox(r2, gunM, 0.05, 0.22, 0.08, 0, -0.12, 0.05, 0.015); rbox(r2, mat('culata', { color: '#3b2a1d', roughness: 0.5 }), 0.06, 0.16, 0.26, 0, -0.02, -0.48, 0.02);
    }
    boxes.push([vx0, vx1 + 0.05, z0, z1, 2.8]);
  }

  // mesa de la mercancía en el centro de la sala: fardos, básculas y una bolsa con fajos
  const tx = -2.6, tz = -1.0;
  const tbl = put('luxhi/Table_RoundLarge', tx, 0, tz, 0, 1.45);
  const ty = tbl ? tbl[1] : 0.82;
  for (let k = 0; k < 5; k++) rbox(g, k % 2 ? wrap : pack, 0.36, 0.14, 0.26, tx - 0.8 + (k % 3) * 0.42, ty + 0.08 + Math.floor(k / 3) * 0.15, tz - 0.2 + (k % 2) * 0.05, 0.04);
  rbox(g, mat('bascula', { color: '#d6d9dc', roughness: 0.3, metalness: 0.5 }), 0.3, 0.06, 0.3, tx + 0.7, ty + 0.04, tz + 0.2, 0.03);
  rbox(g, mat('pantallaBascula', { color: '#102010', emissive: '#40ff60', emissiveIntensity: 0.8 }), 0.12, 0.04, 0.02, tx + 0.7, ty + 0.05, tz + 0.36, 0.005);
  rbox(g, mat('bolsaDeporte', { color: '#1d1f24', roughness: 0.7 }), 0.6, 0.3, 0.32, tx + 0.6, ty + 0.15, tz - 0.25, 0.1);
  for (let k = 0; k < 4; k++) rbox(g, cash, 0.18, 0.05, 0.09, tx + 0.45 + k * 0.1, ty + 0.32, tz - 0.25, 0.01);
  for (const [cx, cz, ry] of [[tx - 0.6, tz + 0.95, Math.PI], [tx + 0.6, tz + 0.95, Math.PI], [tx - 0.6, tz - 0.95, 0], [tx + 0.6, tz - 0.95, 0]]) put('luxhi/Chair_2', cx, 0, cz, ry, 1.05);
  pend(tx, tz, 1.4);
  // cajas de madera y bidones contra la pared del despacho
  for (const [x, z, s] of [[OX - 0.6, -6.8, 1], [OX - 0.6, -5.7, 0.9], [OX - 1.5, -7.6, 1]]) put('survival/box-large', x, 0, z, 0.2 * s, s);
  put('survival/barrel', OX - 0.55, 0, -3.6, 0, 1);
  put('survival/barrel', OX - 0.55, 0, -2.9, 0.4, 1);

  // ---------------- zona de sofás (delante a la derecha) ----------------
  const sx = 6.2, sz = 6.4;
  const bottleM0 = () => mat('botellaAmbar', { color: '#7a4a12', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 });
  // sofá de cuero marrón mirando a la tele, dos butacas negras, mesa baja redonda y alfombra
  put('luxhi/Carpet_Round', sx, 0.01, sz, 0, 2.6, false);
  put('luxuf/Sofa2', sx - 2.0, 0, sz, Math.PI / 2, 0.55);
  put('luxuf/Sofa_individual', sx + 0.3, 0, LZ + 0.95, 0, 0.6);
  put('luxuf/Sofa_individual', sx + 0.3, 0, iz1 - 0.8, Math.PI, 0.6);
  const ct = put('luxhi/Table_RoundSmall', sx, 0, sz, 0, 1.0);
  const cy0 = ct ? ct[1] : 0.57;
  rbox(g, cash, 0.18, 0.05, 0.09, sx - 0.2, cy0 + 0.025, sz, 0.01); rbox(g, cash, 0.18, 0.05, 0.09, sx + 0.05, cy0 + 0.025, sz + 0.05, 0.01);
  cyl(g, bottleM0(), 0.045, 0.05, 0.24, sx + 0.25, cy0 + 0.12, sz - 0.2, 10);
  put('luxhi/Light_Stand1', ix1 - 0.5, 0, iz1 - 0.5, 0, 1.15, false);
  put('luxhi/Houseplant_3', LX + 0.45, 0, iz1 - 0.45, 0, 2.6);
  put('luxhi/Light_Chandelier', sx, GH - 0.12 - 2.1 * 0.26, sz, 0, 2.1, false);
  const tvc = put('furniture/cabinetTelevision', ix1 - 0.4, 0, sz, -Math.PI / 2);
  if (tvc) put('furniture/televisionModern', ix1 - 0.4, tvc[1], sz, -Math.PI / 2, 1.3, false);
  // barra pequeña con botellas
  rbox(g, wood, 2.4, 1.05, 0.6, 1.6, 0.52, LZ + 0.6, 0.03);
  rbox(g, woodTop, 2.5, 0.05, 0.7, 1.6, 1.07, LZ + 0.6, 0.02);
  const bottleM = [mat('botellaAmbar', { color: '#7a4a12', roughness: 0.1, metalness: 0.2, transparent: true, opacity: 0.85 }), mat('botellaVerde', { color: '#1f5a2a', roughness: 0.1, transparent: true, opacity: 0.85 }), mat('botellaClara', { color: '#d8e4ea', roughness: 0.05, transparent: true, opacity: 0.6 })];
  for (let k = 0; k < 7; k++) { const bx = 0.6 + k * 0.32; cyl(g, bottleM[k % 3], 0.045, 0.05, 0.24, bx, 1.22, LZ + 0.5, 10); cyl(g, bottleM[k % 3], 0.015, 0.02, 0.09, bx, 1.38, LZ + 0.5, 8); }
  boxes.push([0.35, 2.85, LZ + 0.25, LZ + 0.95, 1.1]);
  for (const x of [0.9, 2.2]) put('luxhi/Stool', x, 0, LZ + 1.35, 0, 1.15, false);
  plane(g, neonMat('calavera', '☠', magenta, { w: 256, h: 256, font: 'bold 200px sans-serif', ei: 2.4 }), 1.1, 1.1, ix1 - 0.05, 2.9, 4.6, -Math.PI / 2);
  plane(g, neonMat('plata', 'PLATA O PLOMO', magenta, { w: 1024, h: 128, font: 'italic bold 78px "Arial Black", sans-serif', ei: 2.2 }), 3.4, 0.42, sx, 3.3, iz1 - 0.05, Math.PI);

  // ---------------- despacho del jefe ----------------
  const ox = (OX + ix1) / 2, oz = (iz0 + LZ) / 2;
  // suelo de madera oscura y alfombra
  slab(g, mat('parquetJefe', { color: '#2b1a10', roughness: 0.45 }), OX + 0.1, ix1, 0.02, 0.04, iz0, LZ - 0.1);
  // escritorio de madera noble con sillón, dos butacas de cuero para las visitas, chimenea de
  // mármol, librería y armario antiguo, alfombra, lámparas y plantas
  put('luxhi/Carpet_1', ox, 0.04, oz - 0.3, Math.PI / 2, 2.4, false);
  const dk = put('luxuf/Desk', ox, 0.03, iz0 + 1.7, Math.PI, 1);
  const dy = 0.03 + (dk ? dk[1] : 0.92);
  put('luxuf/OfficeChair', ox, 0.03, iz0 + 0.85, Math.PI, 1, false);
  put('furniture/laptop', ox - 0.35, dy, iz0 + 1.75, Math.PI + 0.3, 1, false);
  put('luxhi/Light_Desk', ox + 0.6, dy, iz0 + 1.8, Math.PI, 1.6, false);
  for (let k = 0; k < 3; k++) rbox(g, cash, 0.18, 0.05, 0.09, ox + 0.1, dy + 0.025 + k * 0.05, iz0 + 1.85, 0.01);
  put('luxuf/Sofa_individual', ox - 0.85, 0.03, iz0 + 3.1, 0, 0.55);
  put('luxuf/Sofa_individual', ox + 0.85, 0.03, iz0 + 3.1, 0, 0.55);
  put('luxhi/Fireplace', OX + 0.4, 0.03, -5.4, Math.PI / 2, 1.1);
  put('luxuf/Bookcase_Books', ix1 - 0.3, 0.03, oz + 1.0, -Math.PI / 2, 0.62);
  put('luxuf/ShortCloset', ix1 - 0.4, 0.03, iz0 + 0.95, -Math.PI / 2, 0.75);
  put('luxhi/Houseplant_1', OX + 0.45, 0.03, iz0 + 0.45, 0, 2.6);
  put('luxhi/Light_Stand1', OX + 0.45, 0.03, -2.6, 0, 1.15, false);
  // caja fuerte, cuadro con marco dorado y lámpara de mesa
  rbox(g, mat('cajaFuerteJefe', { color: '#2f3338', roughness: 0.35, metalness: 0.75 }), 0.7, 0.9, 0.6, OX + 0.55, 0.48, LZ - 0.6, 0.04);
  cyl(g, gold, 0.08, 0.08, 0.04, OX + 0.55, 0.6, LZ - 0.6 + 0.31, 16).rotation.x = Math.PI / 2;
  boxes.push([OX + 0.15, OX + 0.95, LZ - 0.95, LZ - 0.25, 1]);
  const paint = canvasTex('cuadroJefe', 256, 192, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f2a65a'); gr.addColorStop(0.55, '#c0392b'); gr.addColorStop(1, '#2c1a2e'); c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1a1020'; c.beginPath(); c.moveTo(0, h); c.lineTo(60, 120); c.lineTo(110, 150); c.lineTo(170, 100); c.lineTo(w, 140); c.lineTo(w, h); c.fill();
    c.fillStyle = '#ffe9a8'; c.beginPath(); c.arc(170, 70, 22, 0, Math.PI * 2); c.fill();
  });
  slab(g, gold, ox - 0.95, ox + 0.95, 1.6, 2.95, iz0 + 0.02, iz0 + 0.06);
  plane(g, mat('cuadroJefe', { map: paint, roughness: 0.6 }), 1.75, 1.2, ox, 2.27, iz0 + 0.07, 0);
  // luz cálida del despacho (lámpara de techo) y neón tenue sobre la puerta
  pend(ox, oz, 0.8);
  plane(g, neonMat('jefe', 'DESPACHO', red, { w: 768, h: 128, font: 'bold 76px "Arial Black", sans-serif', ei: 1.6 }), 1.5, 0.25, OX - PT / 2 - 0.02, 2.7, (ODZ0 + ODZ1) / 2, -Math.PI / 2);

  return {
    group: g, boxes, items,
    door: { x: DX, z: Z1 + 1.4 },                      // delante de la puerta de la calle
    leaf: { x: DX - DW, z: Z1 - T / 2, width: DW * 2 },
    officeLeaf: { x: OX, z: ODZ0, width: ODZ1 - ODZ0 },
    inside: { x0: ix0, x1: ix1, z0: iz0, z1: iz1 },
    entry: { x: DX, z: iz1 - 0.9 },
    counter: { x: wx, z: cz + 0.75 },                   // donde te pones para comprar
    boss: { x: ox, z: iz0 + 0.95 },
    people: [
      { x: AX1 + 0.6, z: LZ + 0.7, yaw: 0, role: 'portero' },             // portero junto al paso a la sala
      { x: wx, z: iz0 + 1.1, yaw: 0, role: 'dependiente' },               // detrás del mostrador
      { x: ox, z: iz0 + 0.95, yaw: 0, role: 'jefe' },                      // el jefe, en su mesa
      { x: OX - 0.7, z: ODZ1 + 0.8, yaw: -Math.PI / 2, role: 'matón' },   // a la puerta del despacho
      { x: sx - 2.3, z: sz + 1.4, yaw: Math.PI / 2, role: 'matón' },      // en los sofás, de pie
    ],
    lights: [{ x: wx, z: -3.5, c: '#ff4a5a' }, { x: sx, z: sz - 1, c: '#c45cff' }],
  };
}
