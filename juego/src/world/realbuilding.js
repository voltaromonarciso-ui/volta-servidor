// Edificios realistas para los locales de la isla (tiendas, ocio, servicios, naves), con las
// mismas texturas de Poly Haven que los edificios de relleno (buildingkit): volumen de verdad,
// ventanas hundidas con marco y cristal, escaparates entre pilastras, cornisa, zócalo, toldo y
// rótulo. Frente hacia +z, origen en el centro de la planta y en el suelo.
// Devuelven { group, door } (door = punto delante de la puerta, en coordenadas locales).
import * as THREE from 'three';
import { pbrMat, plainMat, FRAME } from './buildingkit.js';

// Caja con UV en metros (continuas entre piezas porque se calculan con las coordenadas del
// edificio, no de cada caja): la textura de ladrillo tiene el mismo tamaño en todo el edificio.
export function slab(g, mat, x0, x1, y0, y1, z0, z1) {
  const w = x1 - x0, h = y1 - y0, d = z1 - z0;
  if (w <= 0 || h <= 0 || d <= 0) return null;
  const geo = new THREE.BoxGeometry(w, h, d);
  const P = geo.attributes.position, N = geo.attributes.normal, U = geo.attributes.uv;
  const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, cz = (z0 + z1) / 2, tile = mat.userData.tile || 1;
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i) + cx, y = P.getY(i) + cy, z = P.getZ(i) + cz;
    const nx = Math.abs(N.getX(i)), ny = Math.abs(N.getY(i));
    if (ny > 0.5) U.setXY(i, x / tile, z / tile);
    else if (nx > 0.5) U.setXY(i, z / tile, y / tile);
    else U.setXY(i, x / tile, y / tile);
  }
  const m = new THREE.Mesh(geo, mat);
  m.position.set(cx, cy, cz);
  g.add(m);
  return m;
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
const mats = new Map();
const mat = (k, o) => { if (!mats.has(k)) { const { userData, ...rest } = o; const m = new THREE.MeshStandardMaterial(rest); if (userData) Object.assign(m.userData, userData); mats.set(k, m); } return mats.get(k); };
// cristal semitransparente: de día refleja, de noche deja ver el interior encendido
export const GLASS = () => mat('vidrioRB', { color: '#7f9db3', roughness: 0.08, metalness: 0.5, transparent: true, opacity: 0.5, depthWrite: false });

// Interior visto por la ventana: techo con luces, fondo, muebles; de noche brilla (glow 'win')
function interiorMat(kind, warm = '#f1d3a6') {
  const t = canvasTex('int-' + kind + warm, 256, 128, (c, w, h) => {
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, warm); gr.addColorStop(0.7, '#6b5240'); gr.addColorStop(1, '#3b2c22');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(255,248,225,0.8)'; for (let k = 0; k < 4; k++) c.fillRect(18 + k * 62, 6, 34, 5);
    let s0 = kind.length * 31; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
    if (kind === 'tienda') {
      for (let k = 0; k < 5; k++) { // estanterías con productos de colores
        const x = 8 + k * 50; c.fillStyle = '#5a4434'; c.fillRect(x, 40, 40, 80);
        for (let r = 0; r < 4; r++) for (let j = 0; j < 6; j++) { c.fillStyle = `hsl(${Math.floor(rnd() * 360)},55%,55%)`; c.fillRect(x + 2 + j * 6.3, 44 + r * 19, 5, 13); }
      }
    } else if (kind === 'oficina') {
      for (let k = 0; k < 4; k++) { const x = 14 + k * 62; c.fillStyle = '#d8d2c8'; c.fillRect(x, 82, 46, 6); c.fillStyle = '#2a2d33'; c.fillRect(x + 14, 66, 18, 14); }
    } else {
      for (let k = 0; k < 3; k++) { const x = 20 + k * 80; c.fillStyle = 'rgba(40,30,25,0.6)'; c.fillRect(x, 70, 50, 58); c.fillStyle = 'rgba(255,230,180,0.5)'; c.fillRect(x + 18, 40, 14, 20); }
    }
  });
  return mat('int' + kind + warm, { map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.55, roughness: 0.9, userData: { glow: 'win' } });
}
// Rótulo luminoso con el nombre del local
function signMat(text, bg, fg = '#ffffff') {
  const t = canvasTex('rot-' + text + bg, 1024, 192, (c, w, h) => {
    c.fillStyle = bg; c.fillRect(0, 0, w, h);
    c.strokeStyle = 'rgba(255,255,255,0.35)'; c.lineWidth = 8; c.strokeRect(10, 10, w - 20, h - 20);
    let fs = 118; c.font = `bold ${fs}px sans-serif`;
    while (c.measureText(text).width > w - 70 && fs > 40) { fs -= 4; c.font = `bold ${fs}px sans-serif`; } // que quepa el nombre
    c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.shadowColor = 'rgba(0,0,0,0.35)'; c.shadowBlur = 6; c.fillText(text, w / 2, h / 2 + 6);
  });
  return mat('sign' + text + bg, { map: t, emissiveMap: t, emissive: '#ffffff', emissiveIntensity: 0.5, roughness: 0.5, userData: { glow: 'sign' } });
}
// Tela de toldo a rayas
function awningMat(color) {
  const t = canvasTex('toldo-' + color, 256, 64, (c, w, h) => { for (let k = 0; k < 8; k++) { c.fillStyle = k % 2 ? '#f2efe8' : color; c.fillRect(k * 32, 0, 32, h); } });
  return mat('toldo' + color, { map: t, roughness: 0.85, side: THREE.DoubleSide });
}

// Ventana sobre la cara del muro: interior iluminado, cristal, marco con parteluz, alféizar y
// dintel de piedra. El muro es macizo, así que la ventana se monta delante de él (0–0,25 m).
export function windowAt(g, x, y, zf, w, h, { stone, kind, rot = 0 } = {}) {
  const frame = FRAME();
  const holder = new THREE.Group(); holder.position.set(x, y, zf); holder.rotation.y = rot; g.add(holder);
  const inner = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), interiorMat(kind));
  inner.position.set(0, 0, 0.01); holder.add(inner);
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, h - 0.1), GLASS()); gl.position.set(0, 0, 0.09); holder.add(gl);
  slab(holder, frame, -w / 2, w / 2, h / 2 - 0.08, h / 2, 0, 0.16);
  slab(holder, frame, -w / 2, w / 2, -h / 2, -h / 2 + 0.08, 0, 0.16);
  slab(holder, frame, -w / 2, -w / 2 + 0.08, -h / 2, h / 2, 0, 0.16);
  slab(holder, frame, w / 2 - 0.08, w / 2, -h / 2, h / 2, 0, 0.16);
  slab(holder, frame, -0.03, 0.03, -h / 2, h / 2, 0.06, 0.12); // parteluz
  slab(holder, stone, -w / 2 - 0.14, w / 2 + 0.14, -h / 2 - 0.14, -h / 2, 0, 0.26); // alféizar
  slab(holder, stone, -w / 2 - 0.12, w / 2 + 0.12, h / 2, h / 2 + 0.2, 0, 0.18);    // dintel
}

// ------------------------------------------------------------------
//  Edificio comercial de 1–4 plantas
//  o: { w, d, floors, wall, stone, sign, signBg, awning, kind, shopFront, roofCol }
// ------------------------------------------------------------------
export function shopBuilding(o) {
  const g = new THREE.Group();
  const { w, d, floors = 2, sign, signBg = '#1e2a33', awning, shopFront = true, kind = 'tienda' } = o;
  const wall = pbrMat(o.wall || 'ladrilloRojo'), stone = pbrMat(o.stone || 'claro'), plinth = pbrMat('hormigon', '#8f8b86');
  const gh = shopFront ? 4.2 : 3.3, fh = 3.2, H = gh + (floors - 1) * fh;
  const zf = d / 2;
  // plantas altas macizas; la planta baja se retranquea para los escaparates
  slab(g, wall, -w / 2, w / 2, gh, H, -d / 2, zf);
  slab(g, plinth, -w / 2 - 0.05, w / 2 + 0.05, 0, 0.45, -d / 2 - 0.05, zf - 0.6);
  if (shopFront) {
    const back = zf - 0.7;                                                                // fondo del bajo
    slab(g, wall, -w / 2, w / 2, 0, gh, -d / 2, back);
    for (const s2 of [-1, 1]) slab(g, wall, s2 > 0 ? w / 2 - 0.45 : -w / 2, s2 > 0 ? w / 2 : -w / 2 + 0.45, 0, gh, back, zf); // muros laterales
    const bays = Math.max(2, Math.round((w - 1) / 3.6)), x0b = -w / 2 + 0.45, bw = (w - 0.9) / bays;
    const door = Math.floor(bays / 2), glassTop = gh - 1.15;
    // banda del rótulo y pilastras de piedra
    slab(g, stone, -w / 2 - 0.08, w / 2 + 0.08, gh - 0.95, gh, zf - 0.25, zf + 0.15);
    for (let k = 0; k <= bays; k++) { const x = x0b + k * bw; slab(g, stone, x - 0.22, x + 0.22, 0, gh - 0.95, zf - 0.3, zf + 0.12); }
    for (let k = 0; k < bays; k++) {
      const x0 = x0b + k * bw, x1 = x0 + bw, cx = (x0 + x1) / 2, ww = bw - 0.44;
      const inner = new THREE.Mesh(new THREE.PlaneGeometry(ww, glassTop - 0.15), interiorMat(kind));
      inner.position.set(cx, (glassTop + 0.15) / 2, back + 0.02); g.add(inner);
      if (k === door) {                                                                     // puerta de cristal doble
        slab(g, FRAME(), cx - 1.0, cx + 1.0, 0, 2.7, zf - 0.32, zf - 0.22);
        const dg = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.55), GLASS()); dg.position.set(cx, 1.3, zf - 0.2); g.add(dg);
        const metal = mat('tirador', { color: '#c9cfd6', metalness: 0.8, roughness: 0.25 });
        slab(g, metal, cx - 0.14, cx - 0.08, 0.9, 1.8, zf - 0.2, zf - 0.14); slab(g, metal, cx + 0.08, cx + 0.14, 0.9, 1.8, zf - 0.2, zf - 0.14);
        slab(g, FRAME(), cx - 0.03, cx + 0.03, 0, 2.6, zf - 0.22, zf - 0.17);
        if (glassTop > 2.9) { const tg = new THREE.Mesh(new THREE.PlaneGeometry(ww, glassTop - 2.75), GLASS()); tg.position.set(cx, (glassTop + 2.75) / 2, zf - 0.24); g.add(tg); }
        slab(g, plinth, cx - 1.3, cx + 1.3, 0, 0.12, zf - 0.3, zf + 0.7);                  // escalón
      } else {
        slab(g, plinth, x0 + 0.2, x1 - 0.2, 0, 0.55, zf - 0.32, zf - 0.2);                  // antepecho
        const gl = new THREE.Mesh(new THREE.PlaneGeometry(ww, glassTop - 0.55), GLASS()); gl.position.set(cx, (glassTop + 0.55) / 2, zf - 0.24); g.add(gl);
        slab(g, FRAME(), cx - 0.03, cx + 0.03, 0.55, glassTop, zf - 0.26, zf - 0.2);
      }
      slab(g, FRAME(), x0 + 0.2, x1 - 0.2, glassTop, glassTop + 0.1, zf - 0.3, zf - 0.2);
    }
    if (sign) {
      const sw = Math.min(w - 1.5, 10), sh = 0.72;
      const sp = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), signMat(sign, signBg)); sp.position.set(0, gh - 0.48, zf + 0.16); g.add(sp);
    }
    if (awning) { // toldo inclinado bajo el rótulo
      const aw = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.8, 1.5), awningMat(awning));
      aw.position.set(0, glassTop - 0.1, zf + 0.45); aw.rotation.x = -1.1; g.add(aw);
      slab(g, FRAME(), -w / 2 + 0.4, w / 2 - 0.4, glassTop - 0.5, glassTop - 0.44, zf + 1.05, zf + 1.15);
    }
  } else {
    slab(g, wall, -w / 2, w / 2, 0, gh, -d / 2, zf);
    windowAt(g, -w / 4, 1.8, zf, 1.4, 1.5, { stone, kind });
    windowAt(g, w / 4, 1.8, zf, 1.4, 1.5, { stone, kind });
    slab(g, FRAME(), -0.65, 0.65, 0.45, 2.65, zf, zf + 0.1);
    slab(g, pbrMat('madera'), -0.55, 0.55, 0.45, 2.55, zf + 0.1, zf + 0.14);
    slab(g, stone, -0.8, 0.8, 2.65, 2.85, zf, zf + 0.3);
  }
  // plantas altas: ventanas hundidas en fila, en el frente y en los costados
  for (let f = 1; f < floors; f++) {
    const y = gh + (f - 1) * fh + fh * 0.55;
    const n = Math.max(1, Math.round(w / 3.2));
    for (let k = 0; k < n; k++) windowAt(g, -w / 2 + (k + 0.5) * (w / n), y, zf, 1.3, 1.6, { stone, kind: o.upKind || 'casa' });
    const ns = Math.max(1, Math.round(d / 4));
    for (const s of [-1, 1]) for (let k = 0; k < ns; k++) windowAt(g, s * w / 2, y, -d / 2 + (k + 0.5) * (d / ns), 1.2, 1.5, { stone, kind: 'casa', rot: s * Math.PI / 2 });
    slab(g, stone, -w / 2 - 0.06, w / 2 + 0.06, gh + (f - 1) * fh - 0.12, gh + (f - 1) * fh, -d / 2 - 0.06, zf + 0.06); // imposta
  }
  // cornisa y peto
  slab(g, stone, -w / 2 - 0.25, w / 2 + 0.25, H, H + 0.35, -d / 2 - 0.25, zf + 0.25);
  slab(g, wall, -w / 2, w / 2, H + 0.35, H + 1.0, -d / 2, zf);
  slab(g, stone, -w / 2 - 0.1, w / 2 + 0.1, H + 1.0, H + 1.12, -d / 2 - 0.1, zf + 0.1);
  slab(g, pbrMat('hormigon', '#9a968f'), -w / 2 + 0.3, w / 2 - 0.3, H + 0.36, H + 0.42, -d / 2 + 0.3, zf - 0.3);
  // azotea: máquinas
  const ac = plainMat('maquina', { color: '#a7adb3', roughness: 0.45, metalness: 0.5 });
  slab(g, ac, -w / 4 - 0.8, -w / 4 + 0.8, H + 0.42, H + 1.3, -d / 4 - 0.6, -d / 4 + 0.6);
  if (w > 10) slab(g, ac, w / 4 - 0.6, w / 4 + 0.6, H + 0.42, H + 1.1, -d / 4 - 0.5, -d / 4 + 0.5);
  return { group: g, door: { x: 0, z: zf + 1.6 }, height: H + 1.12 };
}

// ------------------------------------------------------------------
//  Nave / taller: muro de bloque, chapa ondulada arriba, puertas enrollables y oficina
//  o: { w, d, h, sign, signBg, doors }
// ------------------------------------------------------------------
export function warehouseBuilding(o) {
  const g = new THREE.Group();
  const { w, d, h = 8, sign, signBg = '#34495e', doors = 2 } = o;
  const zf = d / 2;
  const block = pbrMat('hormigon'), sheet = pbrMat('chapa', '#b9bec4'), stone = pbrMat('claro');
  slab(g, block, -w / 2, w / 2, 0, 3, -d / 2, zf);
  slab(g, sheet, -w / 2, w / 2, 3, h, -d / 2, zf);
  slab(g, plainMat('canalon', { color: '#6f757c', roughness: 0.5, metalness: 0.6 }), -w / 2 - 0.15, w / 2 + 0.15, h, h + 0.35, -d / 2 - 0.15, zf + 0.15);
  // puertas enrollables con marco y franjas
  const roll = canvasTex('persiana', 64, 256, (c, ww, hh) => { for (let y = 0; y < hh; y += 8) { c.fillStyle = y % 16 ? '#9aa1a8' : '#868d94'; c.fillRect(0, y, ww, 8); } });
  const rollM = mat('persiana', { map: roll, roughness: 0.55, metalness: 0.5 });
  for (let k = 0; k < doors; k++) {
    const cx = -w / 2 + (k + 0.5) * (w * 0.7 / doors);
    slab(g, plainMat('marcoAmarillo', { color: '#e0a21a', roughness: 0.5 }), cx - 2.1, cx + 2.1, 0, 4.4, zf, zf + 0.12);
    const p = new THREE.Mesh(new THREE.PlaneGeometry(3.8, 4.1), rollM); p.position.set(cx, 2.05, zf + 0.13); g.add(p);
  }
  // oficina con ventanas a la derecha
  windowAt(g, w / 2 - 3.2, 1.8, zf, 2.2, 1.4, { stone, kind: 'oficina' });
  slab(g, FRAME(), w / 2 - 1.4, w / 2 - 0.4, 0, 2.3, zf - 0.05, zf + 0.06);
  if (sign) {
    const sw = Math.min(w * 0.5, 12), sh = sw / 5.3;
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), signMat(sign, signBg)); sp.position.set(0, h - sh / 2 - 0.6, zf + 0.02); g.add(sp);
  }
  return { group: g, door: { x: w / 2 - 0.9, z: zf + 1.4 }, height: h + 0.35 };
}

// ------------------------------------------------------------------
//  Sucursal del Banco Rooktown: local de una planta, piedra clara, rótulo azul y hueco a la
//  izquierda para el cajero empotrado. Devuelve también dónde va el cajero (atm).
// ------------------------------------------------------------------
export function bankBranch() {
  const r = shopBuilding({ w: 8, d: 7, floors: 1, wall: 'claro', stone: 'blanco', sign: 'BANCO ROOKTOWN', signBg: '#1f5fbf', kind: 'oficina' });
  const g = r.group, zf = 3.5, stone = pbrMat('blanco');
  // marco de piedra del cajero (el cajero se monta dentro, a ras de fachada)
  slab(g, stone, -3.45, -3.2, 0, 2.55, zf - 0.32, zf + 0.15);                 // jambas del hueco
  slab(g, stone, -2.0, -1.75, 0, 2.55, zf - 0.32, zf + 0.15);
  slab(g, stone, -3.45, -1.75, 2.35, 2.55, zf - 0.32, zf + 0.15);              // dintel
  slab(g, pbrMat('hormigon', '#5d6670'), -3.2, -2.0, 0, 2.35, zf - 0.95, zf - 0.32); // fondo del hueco
  slab(g, mat('techoCajero', { color: '#1f5fbf', roughness: 0.5 }), -3.45, -1.75, 2.55, 2.7, zf - 0.32, zf + 0.35);
  return { group: g, door: r.door, atm: { x: -2.6, z: zf - 0.5 } };
}
