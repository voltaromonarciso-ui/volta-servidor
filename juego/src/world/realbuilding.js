// Edificios realistas para los locales de la isla (tiendas, ocio, servicios, naves), con las
// mismas texturas de Poly Haven que los edificios de relleno (buildingkit): volumen de verdad,
// ventanas hundidas con marco y cristal, escaparates entre pilastras, cornisa, zócalo, toldo y
// rótulo. Frente hacia +z, origen en el centro de la planta y en el suelo.
// Devuelven { group, door } (door = punto delante de la puerta, en coordenadas locales).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { pbrMat, plainMat, FRAME } from './buildingkit.js';
import { dims } from './interior.js';

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
    t.wrapS = t.wrapT = THREE.RepeatWrapping; // (las de bloque, chapa y suelo se repiten por metros)
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
//  Almacén que se puede comprar: la misma nave por fuera, pero hueca, con su interior de
//  verdad (muros de bloque y chapa, pilares y cerchas de acero, lucernarios, lámparas
//  colgadas, líneas pintadas en el suelo y estanterías de palés al fondo) y la puerta de la
//  oficina como entrada. Devuelve, además de group y door:
//   boxes  — colisiones [x0, x1, z0, z1, h] en coordenadas locales (muros con hueco de puerta,
//            pilares y estanterías)
//   inside — rectángulo libre del suelo (donde se colocan macetas y mesas)
//   rack   — rectángulo de las estanterías (para guardar mercancía)
//   leaf   — hoja de la puerta { x, z, width } (la pone el mundo, con su colisión)
//   entry  — punto justo dentro de la puerta
//   lamps  — puntos de luz (x, y, z) para la luz del interior
// ------------------------------------------------------------------
export function ownedWarehouse(o) {
  const g = new THREE.Group();
  const { w, d, h = 8, sign, signBg = '#34495e', doors = 2, level = 1 } = o;
  const zf = d / 2, zb = -d / 2, T = 0.25;
  const block = pbrMat('hormigon'), sheet = pbrMat('chapa', '#b9bec4'), stone = pbrMat('claro');
  const steel = mat('aceroNave', { color: '#5d6873', roughness: 0.45, metalness: 0.65 });
  const boxes = [];
  // piezas de interior (modelos Kenney, ver interior.js): el mundo las coloca; aquí se apunta
  // dónde y se pone su colisión (lv: 'up'/'down' para la entreplanta, null sin colisión)
  const items = [];
  const put = (name, x, y, z, ry = 0, s = 1, lv = 'all') => {
    const d = dims(name, s);
    if (!d[0]) return null;
    items.push({ name, x, y, z, ry, s });
    if (lv) { const tn = Math.abs(Math.sin(ry)) > 0.5, hw = (tn ? d[2] : d[0]) / 2, hd = (tn ? d[0] : d[2]) / 2; boxes.push([x - hw, x + hw, z - hd, z + hd, d[1], lv === 'all' ? undefined : lv]); }
    return d;
  };
  // --- muros por capas ---
  // por fuera: bloque de hormigón hasta 3 m y chapa encima (como las naves del polígono);
  // por dentro: zócalo pintado oscuro, bloque visto con sus juntas (pintado en dos tonos),
  // remate de hormigón saliente, y arriba chapa grecada con correas de acero horizontales
  const wall = (x0, x1, z0, z1, y0 = 0, y1 = h) => { if (y0 < 3) slab(g, block, x0, x1, y0, Math.min(3, y1), z0, z1); if (y1 > 3) slab(g, sheet, x0, x1, Math.max(3, y0), y1, z0, z1); };
  const bloque = mat('bloqueVisto', { map: blockTex('#c9c6bd', '#b9b5aa'), roughness: 0.9, userData: { tile: 2.4 } });
  const bloqueBajo = mat('bloquePintado', { map: blockTex('#7f8f9c', '#73838f'), roughness: 0.75, userData: { tile: 2.4 } });
  const zocalo = mat('zocaloNave', { color: '#3b4148', roughness: 0.7 });
  const remate = pbrMat('hormigon', '#d8d5ce');
  const greca = mat('chapaGrecada', { map: ribTex(), roughness: 0.5, metalness: 0.35, userData: { tile: 1.2 } });
  const girt = mat('correaPared', { color: '#7b8590', roughness: 0.45, metalness: 0.7 });
  // forro interior de un muro: along = 'x' (muro paralelo a X, cara hacia s = ±1 en z) o 'z';
  // tramos [a0, a1] y huecos [{a0, a1, top}] (puertas): el forro se corta en los huecos
  const liner = (along, a0, a1, at, s, holes = []) => {
    const pieces = (y0, y1) => { // tramos de [a0, a1] que quedan libres a esta altura
      let segs = [[a0, a1]];
      for (const hl of holes) if (y0 < hl.top) segs = segs.flatMap(([p, q]) => (hl.a1 <= p || hl.a0 >= q ? [[p, q]] : [[p, hl.a0], [hl.a1, q]].filter(([u, v]) => v - u > 0.02)));
      return segs;
    };
    const lay = (m, y0, y1, depth) => {
      for (const [p, q] of pieces(y0, y1)) {
        const yy0 = y0, yy1 = y1;
        // (encima de un hueco, el forro sigue desde el dintel)
        if (along === 'x') slab(g, m, p, q, yy0, yy1, s > 0 ? at : at - depth, s > 0 ? at + depth : at);
        else slab(g, m, s > 0 ? at : at - depth, s > 0 ? at + depth : at, yy0, yy1, p, q);
      }
      for (const hl of holes) if (hl.top < y1 && hl.top > y0) { // dintel del hueco
        if (along === 'x') slab(g, m, hl.a0, hl.a1, hl.top, y1, s > 0 ? at : at - depth, s > 0 ? at + depth : at);
        else slab(g, m, s > 0 ? at : at - depth, s > 0 ? at + depth : at, hl.top, y1, hl.a0, hl.a1);
      }
    };
    lay(zocalo, 0, 0.45, 0.06);
    lay(bloqueBajo, 0.45, 1.5, 0.035);
    lay(bloque, 1.5, 2.95, 0.035);
    lay(remate, 2.95, 3.1, 0.11);
    lay(greca, 3.1, h - 0.3, 0.02);
    for (const y of [4.4, 5.9, 7.4].filter((y) => y < h - 0.6)) lay(girt, y, y + 0.14, 0.09);
  };
  // huecos del frente: la puerta de la oficina y las persianas enrollables (de verdad)
  const D0 = w / 2 - 1.45, D1 = w / 2 - 0.35, DH = 2.3;
  const RW = 3.8, RH = 4.2;
  const rolls = [];
  for (let k = 0; k < doors; k++) rolls.push(-w / 2 + (k + 0.5) * ((w * 0.7) / doors));
  const holes = [{ a0: D0, a1: D1, top: DH }, ...rolls.map((cx) => ({ a0: cx - RW / 2, a1: cx + RW / 2, top: RH }))];
  wall(-w / 2, w / 2, zb, zb + T); boxes.push([-w / 2, w / 2, zb, zb + T, h]);
  wall(-w / 2, -w / 2 + T, zb, zf); boxes.push([-w / 2, -w / 2 + T, zb, zf, h]);
  wall(w / 2 - T, w / 2, zb, zf); boxes.push([w / 2 - T, w / 2, zb, zf, h]);
  // el frente, tramo a tramo entre huecos, con su dintel encima de cada uno
  const cuts = [...holes].sort((p, q) => p.a0 - q.a0);
  let from = -w / 2;
  for (const hl of cuts) { wall(from, hl.a0, zf - T, zf); boxes.push([from, hl.a0, zf - T, zf, h]); wall(hl.a0, hl.a1, zf - T, zf, hl.top); from = hl.a1; }
  wall(from, w / 2, zf - T, zf); boxes.push([from, w / 2, zf - T, zf, h]);
  liner('x', -w / 2 + T, w / 2 - T, zb + T, 1);
  liner('z', zb + T, zf - T, -w / 2 + T, 1);
  liner('z', zb + T, zf - T, w / 2 - T, -1);
  liner('x', -w / 2 + T, w / 2 - T, zf - T, -1, holes);
  slab(g, sheet, -w / 2, w / 2, h - 0.25, h, zb, zf); // cubierta
  slab(g, plainMat('canalon', { color: '#6f757c', roughness: 0.5, metalness: 0.6 }), -w / 2 - 0.15, w / 2 + 0.15, h, h + 0.35, zb - 0.15, zf + 0.15);
  // persianas enrollables de lamas (cerradas), con guías, cajón del motor dentro, marco
  // amarillo por fuera, botonera al lado y la zona de carga pintada en el suelo
  const lama = mat('lamaPersiana', { color: '#a3aab1', roughness: 0.45, metalness: 0.6 }), lama2 = mat('lamaPersiana2', { color: '#8d959d', roughness: 0.45, metalness: 0.6 });
  const guia = mat('guiaPersiana', { color: '#5d656d', roughness: 0.4, metalness: 0.7 }), goma = mat('gomaPersiana', { color: '#1d1f22', roughness: 0.9 });
  const zm = zf - T / 2;
  for (const cx of rolls) {
    for (let y = 0.08, k = 0; y < RH; y += 0.095, k++) slab(g, k % 2 ? lama : lama2, cx - RW / 2, cx + RW / 2, y, Math.min(RH, y + 0.09), zm - 0.03 + (k % 2) * 0.012, zm + 0.03 + (k % 2) * 0.012);
    slab(g, goma, cx - RW / 2, cx + RW / 2, 0, 0.08, zm - 0.045, zm + 0.045);
    for (const s2 of [-1, 1]) { const ex = cx + s2 * (RW / 2 + 0.04); slab(g, guia, ex - 0.06, ex + 0.06, 0, RH + 0.1, zm - 0.13, zm - 0.09); slab(g, guia, ex - 0.06, ex + 0.06, 0, RH + 0.1, zm + 0.09, zm + 0.13); slab(g, guia, s2 > 0 ? ex + 0.02 : ex - 0.06, s2 > 0 ? ex + 0.06 : ex - 0.02, 0, RH + 0.1, zm - 0.13, zm + 0.13); }
    rb(g, guia, RW + 0.4, 0.55, 0.55, cx, RH + 0.35, zf - T - 0.3, 0.06); // cajón del rodillo (dentro)
    slab(g, plainMat('marcoAmarillo', { color: '#e0a21a', roughness: 0.5 }), cx - RW / 2 - 0.3, cx - RW / 2 - 0.12, 0, RH + 0.2, zf, zf + 0.1);
    slab(g, plainMat('marcoAmarillo', { color: '#e0a21a', roughness: 0.5 }), cx + RW / 2 + 0.12, cx + RW / 2 + 0.3, 0, RH + 0.2, zf, zf + 0.1);
    slab(g, plainMat('marcoAmarillo', { color: '#e0a21a', roughness: 0.5 }), cx - RW / 2 - 0.3, cx + RW / 2 + 0.3, RH + 0.05, RH + 0.25, zf, zf + 0.1);
    // botonera (dentro, a la derecha de la persiana)
    const bx = cx + RW / 2 + 0.55;
    rb(g, mat('botonera', { color: '#d8dadc', roughness: 0.5 }), 0.2, 0.32, 0.1, bx, 1.4, zf - T - 0.06, 0.02);
    for (const [c, y] of [['#2ecc71', 1.48], ['#e74c3c', 1.38], ['#f1c40f', 1.28]]) cy(g, mat('boton' + c, { color: c, emissive: c, emissiveIntensity: 0.3 }), 0.025, 0.025, 0.03, bx, y, zf - T - 0.12, 10).rotation.x = Math.PI / 2;
    slab(g, guia, bx - 0.02, bx + 0.02, 1.56, RH + 0.3, zf - T - 0.05, zf - T - 0.01); // tubo del cable hasta el motor
    // zona de carga pintada delante (dentro)
    const zona = new THREE.Mesh(new THREE.PlaneGeometry(RW + 0.6, 3), mat('zonaCarga', { map: hatchTex(), roughness: 0.8, transparent: true, alphaTest: 0.1 }));
    zona.rotation.x = -Math.PI / 2; zona.position.set(cx, 0.035, zf - T - 1.6); g.add(zona);
    boxes.push([cx - RW / 2, cx + RW / 2, zm - 0.06, zm + 0.06, RH]);
  }
  windowAt(g, w / 2 - 3.6, 1.8, zf, 1.6, 1.2, { stone, kind: 'oficina' });
  for (let k = 0; k < (level ? 3 : 2); k++) windowAt(g, w / 2 - 2.2 - k * 3.6, FH + 1.6, zf, 1.8, 1.2, { stone, kind: 'oficina' }); // la oficina de la entreplanta
  slab(g, plainMat('marcoPuerta', { color: '#2f3338', roughness: 0.5, metalness: 0.5 }), D0 - 0.1, D0, 0, DH + 0.1, zf - T - 0.02, zf + 0.06); // marco
  slab(g, plainMat('marcoPuerta', { color: '#2f3338', roughness: 0.5, metalness: 0.5 }), D1, D1 + 0.1, 0, DH + 0.1, zf - T - 0.02, zf + 0.06);
  if (sign) {
    const sw = Math.min(w * 0.5, 12), sh = sw / 5.3;
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), signMat(sign, signBg)); sp.position.set(0, h - sh / 2 - 0.6, zf + 0.02); g.add(sp);
  }
  // --- dentro ---
  const ix0 = -w / 2 + T, ix1 = w / 2 - T, iz0 = zb + T, iz1 = zf - T;
  // pilares a lo largo de los muros laterales y cerchas de lado a lado, con correas
  const bays = Math.max(2, Math.round((iz1 - iz0) / 7));
  for (let k = 0; k <= bays; k++) {
    const z = iz0 + 0.2 + ((iz1 - iz0 - 0.4) * k) / bays;
    for (const x of [ix0 + 0.15, ix1 - 0.15]) { slab(g, steel, x - 0.15, x + 0.15, 0, h - 0.3, z - 0.1, z + 0.1); boxes.push([x - 0.15, x + 0.15, z - 0.1, z + 0.1, h]); }
    slab(g, steel, ix0, ix1, h - 0.75, h - 0.6, z - 0.06, z + 0.06);                    // cordón inferior
    slab(g, steel, ix0, ix1, h - 0.4, h - 0.3, z - 0.06, z + 0.06);                     // cordón superior
    const n = Math.round((ix1 - ix0) / 2);
    for (let j = 0; j <= n; j++) slab(g, steel, ix0 + (j * (ix1 - ix0)) / n - 0.03, ix0 + (j * (ix1 - ix0)) / n + 0.03, h - 0.65, h - 0.4, z - 0.04, z + 0.04); // montantes
  }
  for (let j = 1; j < 6; j++) { const x = ix0 + ((ix1 - ix0) * j) / 6; slab(g, steel, x - 0.05, x + 0.05, h - 0.38, h - 0.27, iz0, iz1); } // correas
  // lucernarios: franjas de luz en la cubierta
  const sky = mat('lucernario', { color: '#eef6ff', emissive: '#dfeeff', emissiveIntensity: 0.45, roughness: 0.3 });
  for (const x of [ix0 + (ix1 - ix0) * 0.3, ix0 + (ix1 - ix0) * 0.7]) slab(g, sky, x - 0.9, x + 0.9, h - 0.27, h - 0.25, iz0 + 1, iz1 - 1);
  // lámparas colgadas (campana y bombilla que brilla)
  const lampM = mat('campanaNave', { color: '#2f3640', roughness: 0.5, metalness: 0.6, side: THREE.DoubleSide });
  const bulbM = mat('bombillaNave', { color: '#fff4dc', emissive: '#ffe2a8', emissiveIntensity: 1.4 }); // (dentro, encendidas siempre)
  const campana = new THREE.ConeGeometry(0.45, 0.35, 16, 1, true), bulb = new THREE.SphereGeometry(0.14, 12, 8), cable = new THREE.CylinderGeometry(0.012, 0.012, 1, 4);
  const lamps = [];
  for (let a = 0; a < 3; a++) for (let b2 = 0; b2 < 2; b2++) {
    const x = ix0 + ((ix1 - ix0) * (a + 0.5)) / 3, z = iz0 + 2 + ((iz1 - iz0 - 6) * (b2 + 0.5)) / 2, y = h - 2.1;
    const c = new THREE.Mesh(campana, lampM); c.position.set(x, y + 0.15, z); g.add(c);
    const bl = new THREE.Mesh(bulb, bulbM); bl.position.set(x, y, z); g.add(bl);
    const cb = new THREE.Mesh(cable, steel); cb.scale.y = h - 0.6 - (y + 0.3); cb.position.set(x, (h - 0.6 + y + 0.3) / 2, z); g.add(cb);
    lamps.push({ x, y, z });
  }
  // líneas amarillas del pasillo y zona de carga
  const line = mat('lineaSuelo', { color: '#e3b51c', roughness: 0.8 });
  const rackD = 1.3, rz1 = iz0 + rackD + 0.2;
  slab(g, line, ix0 + 0.4, ix1 - 0.4, 0.03, 0.04, rz1 + 0.5, rz1 + 0.6); // (encima del suelo de hormigón, que va a 2 cm)
  for (const x of [ix0 + 0.6, ix1 - 0.6]) slab(g, line, x - 0.05, x + 0.05, 0.03, 0.04, rz1 + 0.6, iz1 - 0.6);
  // estanterías de palés al fondo: puntales naranjas, largueros azules, palés con cajas
  const up = mat('puntalRack', { color: '#e0662a', roughness: 0.5, metalness: 0.4 }), beam = mat('largueroRack', { color: '#2f5fa8', roughness: 0.5, metalness: 0.4 });
  const wood = mat('palet', { color: '#a9835a', roughness: 0.9 }), carton = mat('cajaRack', { color: '#b88a58', roughness: 0.9 }), film = mat('filmRack', { color: '#d9dde2', roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.85 });
  const rx0 = ix0 + 1.2, rx1 = ix1 - 1.2, bayW = 2.7, nb = Math.floor((rx1 - rx0) / bayW);
  const rz0 = iz0 + 0.2;
  let seed = Math.round(w * 7 + d);
  const rnd = () => { seed = (seed * 9301 + 49297) % 233280; return seed / 233280; };
  for (let k = 0; k <= nb; k++) { const x = rx0 + k * bayW; for (const z of [rz0, rz0 + rackD]) slab(g, up, x - 0.05, x + 0.05, 0, 4.6, z - 0.05, z + 0.05); }
  for (const y of [0.15, 1.65, 3.15, 4.5]) for (const z of [rz0, rz0 + rackD]) slab(g, beam, rx0, rx0 + nb * bayW, y, y + 0.12, z - 0.05, z + 0.05);
  // cada hueco: dos palés (modelo) y encima una carga distinta: cajas de cartón, cajas de
  // madera, bidones o sacos (sin colisión: la estantería entera ya la tiene)
  const sackM = mat('saco', { color: '#d8cdb4', roughness: 1 }), filmW = mat('filmRackFino', { color: '#d9dde2', roughness: 0.3, metalness: 0.1, transparent: true, opacity: 0.55 });
  const zc = rz0 + rackD / 2;
  for (let k = 0; k < nb; k++) for (const y of [0.27, 1.77, 3.27]) for (const side of [-0.65, 0.65]) {
    if (rnd() < 0.18) continue;
    const x = rx0 + k * bayW + bayW / 2 + side, t = rnd();
    const p0 = put('retro/pallet', x, y, zc, 0, 1, null);
    const py = y + (p0 ? p0[1] : 0.14);
    if (t < 0.5) {
      const rows = 1 + (rnd() < 0.6 ? 1 : 0) + (y < 3 && rnd() < 0.35 ? 1 : 0);
      let yy = py;
      for (let r = 0; r < rows; r++) { let hh = 0; for (const [ox, oz] of [[-0.3, -0.28], [0.3, -0.28], [-0.3, 0.28], [0.3, 0.28]]) { const d = put('furniture/cardboardBoxClosed', x + ox, yy, zc + oz, (r + k) % 2 ? 0.08 : 0, 1.15, null); if (d) hh = d[1]; } yy += hh; }
      if (t < 0.2) slab(g, filmW, x - 0.62, x + 0.62, py, yy + 0.02, zc - 0.6, zc + 0.6); // envuelto en film
    } else if (t < 0.68) { let yy = py; for (let r = 0; r < 2; r++) { let hh = 0; for (const ox of [-0.3, 0.3]) { const d = put('furniture/cardboardBoxClosed', x + ox, yy, zc, Math.PI / 2 + r * 0.06, 1.5, null); if (d) hh = d[1]; } yy += hh; } } // cajas grandes de cartón
    else if (t < 0.86) { let q = 0; for (const [ox, oz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) drum(g, x + ox, py, zc + oz, k + (q++ > 1 ? 1 : 0), 0.95); }
    else for (let r = 0; r < 3; r++) for (const ox of [-0.27, 0.27]) rb(g, sackM, 0.5, 0.17, 0.85, x + ox, py + 0.09 + r * 0.17, zc + (r % 2 ? 0.04 : -0.04), 0.07, (r % 2) * 0.05);
  }
  boxes.push([rx0 - 0.1, rx0 + nb * bayW + 0.1, rz0 - 0.1, rz0 + rackD + 0.1, 4.6]);
  // oficina acristalada junto a la entrada y las cosas de la nave (más cuanto más grande)
  const office = warehouseOffice(g, { x0: ix1 - [8, 9.5, 10.5][level], x1: ix1, z1: iz1, level }, boxes, put);
  warehouseStuff(g, { ix0, ix1, iz0, iz1, rz1, doorX: (D0 + D1) / 2, level, office, put, rolls }, boxes);
  warehouseExtras(g, { ix0, ix1, iz0, iz1, rz1, h, level, office, put }, boxes);
  return {
    group: g, door: { x: (D0 + D1) / 2, z: zf + 1.4 }, height: h + 0.35, boxes,
    inside: { x0: ix0 + 0.5, x1: ix1 - 0.5, z0: rz1 + 0.7, z1: iz1 - 0.4 },
    rack: { x0: rx0, x1: rx0 + nb * bayW, z0: rz0, z1: rz0 + rackD },
    floor: { x0: ix0, x1: ix1, z0: iz0, z1: iz1 },
    leaf: { x: D0, z: zf - T / 2, width: D1 - D0 }, entry: { x: (D0 + D1) / 2, z: iz1 - 1.2 }, lamps, office, floors: office.floors, items,
    // dónde van la carretilla, la transpaleta y los palés sueltos (piezas del mundo)
    gear: {
      forklift: level >= 1 ? { x: ix1 - 3.2, z: rz1 + 2.2, ry: Math.PI } : null,
      jack: level >= 1 ? { x: ix0 + 4.6, z: rz1 + 1.1, ry: Math.PI / 2 } : null,
      pallets: level >= 1 ? [[ix0 + 1.0, iz1 - 1.0, 0], [ix0 + 1.0, iz1 - 2.3, 1], ...(level >= 2 ? [[ix0 + 1.0, iz1 - 3.6, 2]] : [])] : [], // (n = capas de cajas encima)
    },
  };
}

// Bloque de hormigón visto: hileras de 40 × 20 cm al tresbolillo con juntas de mortero y
// cada bloque con su tono (la textura mide 2,4 m: 6 bloques × 12 hileras)
const blockTex = (base, alt) => canvasTex('bloque' + base, 384, 384, (c, w, h) => {
  const bw = w / 6, bh = h / 12;
  c.fillStyle = '#8a877f'; c.fillRect(0, 0, w, h); // mortero
  let sd = 7; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
  for (let r = 0; r < 12; r++) for (let k = -1; k < 7; k++) {
    const x = k * bw + (r % 2 ? bw / 2 : 0), y = r * bh;
    c.fillStyle = rnd() < 0.5 ? base : alt; c.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    c.fillStyle = `rgba(0,0,0,${rnd() * 0.08})`; c.fillRect(x + 2, y + 2, bw - 4, bh - 4);
    for (let p = 0; p < 18; p++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,255,255'},${rnd() * 0.12})`; c.fillRect(x + 2 + rnd() * (bw - 6), y + 2 + rnd() * (bh - 6), 2, 2); }
    c.fillStyle = 'rgba(255,255,255,0.12)'; c.fillRect(x + 2, y + 2, bw - 4, 2); // canto con luz
    c.fillStyle = 'rgba(0,0,0,0.18)'; c.fillRect(x + 2, y + bh - 4, bw - 4, 2);  // canto en sombra
  }
});
// Chapa grecada: nervios verticales cada 20 cm con luz y sombra (la textura mide 1,2 m)
const ribTex = () => canvasTex('greca', 192, 64, (c, w, h) => {
  const n = 6, pw = w / n;
  for (let k = 0; k < n; k++) {
    const x = k * pw, gr = c.createLinearGradient(x, 0, x + pw, 0);
    gr.addColorStop(0, '#c3c8cd'); gr.addColorStop(0.18, '#e2e5e8'); gr.addColorStop(0.32, '#9ea4aa'); gr.addColorStop(0.5, '#b8bdc2'); gr.addColorStop(1, '#c3c8cd');
    c.fillStyle = gr; c.fillRect(x, 0, pw, h);
  }
});
// Rayado amarillo y negro de la zona de carga, con borde
const hatchTex = () => canvasTex('rayado', 256, 192, (c, w, h) => {
  c.clearRect(0, 0, w, h);
  c.save(); c.beginPath(); c.rect(10, 10, w - 20, h - 20); c.clip();
  for (let x = -h; x < w + h; x += 36) { c.fillStyle = '#e3b51c'; c.beginPath(); c.moveTo(x, 0); c.lineTo(x + 18, 0); c.lineTo(x + 18 - h, h); c.lineTo(x - h, h); c.fill(); }
  c.restore();
  c.strokeStyle = '#e3b51c'; c.lineWidth = 8; c.strokeRect(6, 6, w - 12, h - 12);
});

// Bidón metálico de 200 l: cuerpo con dos aros de rodadura, rebordes arriba y abajo, tapa
// algo hundida con sus dos tapones. Colores sobrios (azul, gris o negro).
const DRUM_COL = ['#2d5d8f', '#6f7a83', '#2b2f33', '#2d5d8f'];
const drumGeo = {};
function drum(g, x, y, z, k = 0, s = 1) {
  const m = mat('bidon' + DRUM_COL[k % 4], { color: DRUM_COL[k % 4], roughness: 0.45, metalness: 0.55 });
  const r = 0.29 * s, h = 0.88 * s;
  drumGeo.body ??= new THREE.CylinderGeometry(1, 1, 1, 28, 1, true);
  drumGeo.ring ??= new THREE.TorusGeometry(1, 0.035, 8, 32);
  drumGeo.lid ??= new THREE.CircleGeometry(1, 28);
  const body = new THREE.Mesh(drumGeo.body, m); body.scale.set(r, h, r); body.position.set(x, y + h / 2, z); body.castShadow = body.receiveShadow = true; g.add(body);
  for (const t of [0.015, 0.33, 0.67, 0.985]) { const ring = new THREE.Mesh(drumGeo.ring, m); ring.rotation.x = Math.PI / 2; ring.scale.set(r * 1.01, r * 1.01, s * (t === 0.33 || t === 0.67 ? 0.8 : 1)); ring.position.set(x, y + h * t, z); g.add(ring); }
  const lid = new THREE.Mesh(drumGeo.lid, m); lid.rotation.x = -Math.PI / 2; lid.scale.setScalar(r * 0.97); lid.position.set(x, y + h - 0.012 * s, z); g.add(lid);
  const cap = mat('taponBidon', { color: '#b9bec2', roughness: 0.35, metalness: 0.7 });
  cy(g, cap, 0.035 * s, 0.035 * s, 0.025 * s, x + r * 0.55, y + h - 0.005 * s, z, 10);
  cy(g, cap, 0.022 * s, 0.022 * s, 0.025 * s, x - r * 0.55, y + h - 0.005 * s, z, 10);
}
// Esfera de reloj de pared (la usan la nave y la oficina)
const clockMat = () => mat('pint-reloj', { map: canvasTex('pint-reloj', 128, 128, (c, w, hh) => { c.fillStyle = '#fafafa'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill(); c.strokeStyle = '#222'; c.lineWidth = 6; c.stroke(); for (let k = 0; k < 12; k++) { const a = (k / 12) * Math.PI * 2; c.fillStyle = '#222'; c.fillRect(64 + Math.sin(a) * 48 - 2, 64 - Math.cos(a) * 48 - 5, 4, 10); } c.lineWidth = 5; c.beginPath(); c.moveTo(64, 64); c.lineTo(64, 30); c.stroke(); c.lineWidth = 3; c.beginPath(); c.moveTo(64, 64); c.lineTo(96, 70); c.stroke(); }) });
// Caja con esquinas redondeadas (muebles)
const rb = (g, m, w, h, d, x, y, z, r = 0.04, ry = 0) => { const o = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 2, Math.min(r, w / 2, h / 2, d / 2)), m); o.position.set(x, y, z); o.rotation.y = ry; o.castShadow = true; o.receiveShadow = true; g.add(o); return o; };
const cy = (g, m, rt, rbt, hh, x, y, z, seg = 14) => { const o = new THREE.Mesh(new THREE.CylinderGeometry(rt, rbt, hh, seg), m); o.position.set(x, y, z); o.castShadow = true; g.add(o); return o; };
// Cartel pintado (señales, pantalla, panel de herramientas)
function paintMat(key, w, h, draw, extra = {}) { return mat('pint-' + key, { map: canvasTex('pint-' + key, w, h, draw), roughness: 0.6, ...extra }); }
const signTex = (txt, bg, fg = '#fff', icon = '') => (c, w, h) => {
  c.fillStyle = bg; c.fillRect(0, 0, w, h); c.strokeStyle = fg; c.lineWidth = 6; c.strokeRect(8, 8, w - 16, h - 16);
  c.fillStyle = fg; c.textAlign = 'center'; c.textBaseline = 'middle';
  if (icon) { c.font = `${h * 0.42}px sans-serif`; c.fillText(icon, w / 2, h * 0.36); }
  c.font = `900 ${icon ? h * 0.16 : h * 0.3}px sans-serif`; c.fillText(txt, w / 2, icon ? h * 0.78 : h / 2);
};

// Oficina en entreplanta, contra el frente de la nave (encima de la entrada): forjado de acero
// sobre pilares a 3,3 m, escalera metálica recta con barandilla amarilla, pasillo con
// barandilla delante y cristalera hacia la nave. Arriba: zona de estar (tele en la pared del
// lado, sofá, sillones, mesita, alfombra), escritorios con ordenador y silla de ruedas,
// office con nevera y cafetera, archivadores, pizarra y plantas.
// Debajo queda libre (sólo los pilares).
// Las colisiones van con nivel: 'up' sólo cuenta arriba, 'down' sólo abajo, 'low' sólo a ras
// de suelo (bajo la escalera). Devuelve también los suelos de arriba (entreplanta y escalera).
export const FH = 3.3; // altura del suelo de la entreplanta
function warehouseOffice(g, { x0: mx0, x1: mx1, z1: mz1, level }, boxes, put) {
  const D = 5.6, mz0 = mz1 - D, WK = 1.25, oz0 = mz0 + WK, H2 = 2.8, top = FH + H2;
  const steel = mat('aceroEntre', { color: '#55616d', roughness: 0.45, metalness: 0.65 }), yellow = mat('barandilla', { color: '#e3b51c', roughness: 0.45, metalness: 0.3 });
  const dark = mat('negroOf', { color: '#1c1e22', roughness: 0.4, metalness: 0.3 }), wood = mat('mesaOf', { color: '#6e4b2e', roughness: 0.55 });
  const panelW = mat('panelOfi', { color: '#eceae5', roughness: 0.85 }), alu = mat('aluOficina', { color: '#c9ced3', roughness: 0.35, metalness: 0.8 });
  const glass = mat('cristalOficina', { color: '#9fc0d0', roughness: 0.05, metalness: 0.3, transparent: true, opacity: 0.28, depthWrite: false });
  const floors = [];
  // --- estructura: pilares, vigas y forjado ---
  const nP = Math.max(2, Math.round((mx1 - mx0) / 4.4));
  for (let k = 0; k <= nP; k++) {
    const x = Math.min(mx1 - 0.25, mx0 + 0.15 + ((mx1 - mx0 - 0.4) * k) / nP);
    slab(g, steel, x - 0.14, x + 0.14, 0, FH - 0.3, mz0 + 0.05, mz0 + 0.33);
    slab(g, steel, x - 0.25, x + 0.25, 0, 0.03, mz0 - 0.06, mz0 + 0.44); // placa de anclaje
    boxes.push([x - 0.16, x + 0.16, mz0 + 0.03, mz0 + 0.35, FH - 0.3, 'down']);
  }
  slab(g, steel, mx0, mx1, FH - 0.55, FH - 0.25, mz0 + 0.04, mz0 + 0.34);            // viga de borde
  for (let x = mx0 + 1.5; x < mx1; x += 1.5) slab(g, steel, x - 0.06, x + 0.06, FH - 0.45, FH - 0.25, mz0 + 0.3, mz1); // viguetas
  slab(g, mat('forjado', { color: '#9aa0a5', roughness: 0.6, metalness: 0.4 }), mx0, mx1, FH - 0.25, FH - 0.2, mz0, mz1); // chapa colaborante
  slab(g, mat('sueloEntre', { color: '#8c939a', roughness: 0.7 }), mx0, mx1, FH - 0.2, FH, mz0, oz0);                    // pasillo
  slab(g, mat('vinilo', { color: '#b08a62', roughness: 0.7 }), mx0, mx1, FH - 0.2, FH, oz0, mz1);                        // oficina
  slab(g, yellow, mx0, mx1, FH - 0.05, FH, mz0, mz0 + 0.06);                                                             // canto pintado
  floors.push({ x0: mx0, x1: mx1, z0: mz0, z1: mz1, h: () => FH });
  // --- escalera recta en el extremo izquierdo, bajando hacia la nave ---
  const n = Math.round(FH / 0.183), run = 0.27, L = n * run, sx0 = mx0 + 0.15, sx1 = mx0 + 1.3, zs = mz0 - L;
  const grate = mat('peldano', { map: canvasTex('rejilla', 64, 64, (c, w, h) => { c.fillStyle = '#2c3238'; c.fillRect(0, 0, w, h); c.fillStyle = '#59626b'; for (let k = 0; k < w; k += 8) { c.fillRect(k, 0, 3, h); c.fillRect(0, k, w, 2); } }), roughness: 0.5, metalness: 0.6 });
  for (let i = 0; i < n; i++) slab(g, grate, sx0 + 0.06, sx1 - 0.06, ((i + 1) * FH) / n - 0.04, ((i + 1) * FH) / n, zs + i * run, zs + i * run + run + 0.03);
  // zancas y barandillas inclinadas: se montan tumbadas en un pivote al pie de la escalera y
  // el pivote se gira lo que sube la escalera
  const slope = () => { const pv = new THREE.Group(); pv.position.set(0, 0, zs); pv.rotation.x = -Math.atan2(FH, L); g.add(pv); return pv; };
  const SL = Math.hypot(L, FH);
  for (const x of [sx0, sx1 - 0.06]) slab(slope(), steel, x, x + 0.06, -0.12, 0.18, 0, SL);
  for (const x of [sx0 - 0.02, sx1 + 0.02]) { // barandillas inclinadas con sus postes
    slab(slope(), yellow, x - 0.025, x + 0.025, 1.0, 1.05, 0, SL);
    for (let k = 0; k <= 4; k++) { const z = zs + (L * k) / 4; slab(g, yellow, x - 0.025, x + 0.025, (FH * k) / 4, (FH * k) / 4 + 1.05, z - 0.025, z + 0.025); }
  }
  floors.push({ x0: sx0, x1: sx1, z0: zs, z1: mz0, h: (lx, lz) => Math.max(0, Math.min(FH, ((lz - zs) / L) * FH)) });
  boxes.push([sx0 - 0.05, sx1 + 0.05, zs + 1.4, mz0, FH, 'low']); // (debajo de la escalera no se pasa)
  for (const x of [sx0 - 0.05, sx1 + 0.05]) boxes.push([x - 0.04, x + 0.04, zs + 0.3, mz0, 1.1, 'up']); // barandillas, para quien sube
  // --- barandilla del pasillo (con el hueco de la escalera) y del extremo izquierdo ---
  const railRun = (axis, a0, a1, at) => {
    const bx = (x0, x1, y0, y1) => (axis === 'x' ? slab(g, yellow, x0, x1, FH + y0, FH + y1, at - 0.025, at + 0.025) : slab(g, yellow, at - 0.025, at + 0.025, FH + y0, FH + y1, x0, x1));
    bx(a0, a1, 1.0, 1.06); bx(a0, a1, 0.5, 0.54);
    if (axis === 'x') slab(g, yellow, a0, a1, FH, FH + 0.12, at - 0.01, at + 0.01); else slab(g, yellow, at - 0.01, at + 0.01, FH, FH + 0.12, a0, a1); // rodapié
    for (let t = a0; t <= a1 + 1e-6; t += Math.max(0.6, (a1 - a0) / Math.ceil((a1 - a0) / 1.2))) bx(t - 0.03, t + 0.03, 0, 1.06);
    boxes.push(axis === 'x' ? [a0, a1, at - 0.06, at + 0.06, 1.1, 'up'] : [at - 0.06, at + 0.06, a0, a1, 1.1, 'up']);
  };
  railRun('x', sx1 + 0.05, mx1, mz0 + 0.03);
  railRun('z', mz0, oz0, mx0 + 0.03);
  // --- oficina: cristalera al pasillo (puerta a la izquierda), pared de panel a la izquierda ---
  const gw = (a0, a1) => {
    if (a1 - a0 < 0.05) return;
    slab(g, panelW, a0, a1, FH, FH + 0.9, oz0 - 0.05, oz0 + 0.05); slab(g, alu, a0, a1, FH + 0.88, FH + 0.95, oz0 - 0.06, oz0 + 0.06); slab(g, alu, a0, a1, top - 0.1, top, oz0 - 0.06, oz0 + 0.06);
    const gl = slab(g, glass, a0, a1, FH + 0.95, top - 0.1, oz0 - 0.012, oz0 + 0.012); if (gl) gl.renderOrder = 2;
    const m = Math.max(1, Math.round((a1 - a0) / 1.3));
    for (let k = 0; k <= m; k++) { const t = a0 + ((a1 - a0) * k) / m; slab(g, alu, t - 0.03, t + 0.03, FH, top, oz0 - 0.06, oz0 + 0.06); }
    boxes.push([a0, a1, oz0 - 0.08, oz0 + 0.08, H2, 'up']);
  };
  const dg0 = mx0 + 1.6, dg1 = mx0 + 2.6; // puerta de la oficina, frente a la escalera
  gw(mx0, dg0); gw(dg1, mx1);
  slab(g, alu, dg0, dg1, FH + 2.15, FH + 2.2, oz0 - 0.06, oz0 + 0.06); slab(g, glass, dg0, dg1, FH + 2.2, top - 0.1, oz0 - 0.012, oz0 + 0.012);
  slab(g, panelW, mx0, mx0 + 0.1, FH, top, oz0, mz1); boxes.push([mx0, mx0 + 0.12, oz0, mz1, H2, 'up']);
  // forro de panel blanco por dentro en el fondo y el lado derecho (tapa la chapa de la nave)
  slab(g, panelW, mx0 + 0.1, mx1 - 0.11, FH, top, mz1 - 0.14, mz1 - 0.11);
  slab(g, panelW, mx1 - 0.14, mx1 - 0.11, FH, top, oz0, mz1 - 0.11);
  slab(g, mat('rodapieOf', { color: '#6b6f75', roughness: 0.6 }), mx0 + 0.1, mx1 - 0.14, FH, FH + 0.1, mz1 - 0.16, mz1 - 0.14);
  slab(g, mat('techoOficina', { color: '#f2f1ee', roughness: 0.9 }), mx0, mx1, top, top + 0.1, oz0 - 0.06, mz1);
  const light = mat('panelLuz', { color: '#ffffff', emissive: '#fff4e2', emissiveIntensity: 1.1 });
  for (let x = mx0 + 1.8; x < mx1 - 1; x += 3) slab(g, light, x - 0.6, x + 0.6, top - 0.02, top, oz0 + 1.2, mz1 - 1.2);
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 1.0), paintMat('pizarra', 256, 144, (c, w, h) => {
    c.fillStyle = '#f7f7f4'; c.fillRect(0, 0, w, h); c.strokeStyle = '#9aa0a6'; c.lineWidth = 6; c.strokeRect(0, 0, w, h);
    c.strokeStyle = '#1f5fbf'; c.lineWidth = 2; c.font = 'bold 14px sans-serif'; c.fillStyle = '#1f5fbf'; c.fillText('PEDIDOS SEMANA', 14, 24);
    c.fillStyle = '#333'; c.font = '12px sans-serif'; ['Lunes  ··  40 u.', 'Martes ··  55 u.', 'Jueves ··  70 u.'].forEach((t, k) => c.fillText(t, 16, 50 + k * 20));
    c.strokeStyle = '#c0392b'; c.beginPath(); c.moveTo(150, 110); c.lineTo(180, 80); c.lineTo(205, 95); c.lineTo(235, 50); c.stroke();
  }));
  // --- arriba: muebles (modelos Kenney): zona de estar a la izquierda, escritorios en el
  // centro, estanterías y office a la derecha ---
  const Y = FH, cz = (oz0 + mz1) / 2, wz = mz1 - 0.14; // (wz: cara del panel del fondo)
  const up = (name, x, z, ry = 0, s = 1, solid = true, y = Y) => put(name, x, y, z, ry, s, solid ? 'up' : null);
  up('furniture/rugRectangle', mx0 + 2.3, cz, Math.PI / 2, 1.1, false);
  const tvc = up('furniture/cabinetTelevision', mx0 + 0.35, cz, Math.PI / 2);
  if (tvc) up('furniture/televisionModern', mx0 + 0.32, cz, Math.PI / 2, 1, false, Y + tvc[1]);
  up('furniture/loungeSofa', mx0 + 3.75, cz, -Math.PI / 2);
  const tbl = up('furniture/tableCoffee', mx0 + 2.3, cz, Math.PI / 2);
  if (tbl) { up('furniture/books', mx0 + 2.2, cz - 0.25, 0.3, 0.8, false, Y + tbl[1]); up('furniture/plantSmall2', mx0 + 2.35, cz + 0.3, 0, 1, false, Y + tbl[1]); }
  if (level >= 1) { up('furniture/loungeChair', mx0 + 2.3, cz - 1.55, 0); up('furniture/loungeChair', mx0 + 2.3, cz + 1.55, Math.PI); }
  up('furniture/lampSquareFloor', mx0 + 0.45, wz - 0.35);
  up('furniture/pottedPlant', mx0 + 0.45, oz0 + 0.45);
  up('furniture/coatRackStanding', mx0 + 3.1, oz0 + 0.35, 0, 1, false);
  // escritorios contra el fondo, con su pantalla, teclado, ratón y flexo; silla de ruedas delante
  const nd = level >= 1 ? 2 : 1, dx0 = mx0 + 5.4;
  const deskAt = (dx) => {
    const d = up('furniture/desk', dx, wz - 0.42, Math.PI);
    const dy = Y + (d ? d[1] : 0.76);
    up('furniture/computerScreen', dx - 0.15, wz - 0.3, Math.PI, 0.7, false, dy);
    up('furniture/computerKeyboard', dx - 0.15, wz - 0.62, Math.PI, 0.8, false, dy);
    up('furniture/computerMouse', dx + 0.2, wz - 0.62, Math.PI, 0.8, false, dy);
    up('furniture/lampRoundTable', dx + 0.55, wz - 0.3, Math.PI, 0.75, false, dy);
    up('furniture/chairDesk', dx - 0.1, wz - 1.25, 0, 1, false);
  };
  for (let k = 0; k < nd; k++) deskAt(dx0 + k * 1.9);
  board.position.set(dx0 + (nd - 1) * 0.95, Y + 1.75, wz - 0.02); board.rotation.y = Math.PI; g.add(board);
  // estanterías con libros y archivos, y la impresora en una mesita
  let bx = dx0 + nd * 1.9 + 0.2;
  if (level >= 1) {
    const bc = up('furniture/bookcaseClosedDoors', bx, wz - 0.3, Math.PI);
    bx += (bc ? bc[0] : 1) + 0.05;
    const bo = up('furniture/bookcaseOpen', bx, wz - 0.3, Math.PI);
    if (bo) up('furniture/books', bx, wz - 0.3, Math.PI, 1, false, Y + bo[1]);
    bx += (bo ? bo[0] : 1) / 2 + 0.6;
  }
  const st = up('furniture/sideTable', bx, wz - 0.3, Math.PI);
  const sy = Y + (st ? st[1] : 0.5);
  rb(g, mat('impresora', { color: '#ececec', roughness: 0.45 }), 0.5, 0.3, 0.42, bx, sy + 0.15, wz - 0.3, 0.04);
  slab(g, dark, bx - 0.18, bx + 0.18, sy + 0.28, sy + 0.3, wz - 0.54, wz - 0.5);
  slab(g, mat('papelOf', { color: '#f4f2ec', roughness: 0.9 }), bx - 0.15, bx + 0.15, sy + 0.3, sy + 0.31, wz - 0.6, wz - 0.5);
  // office contra la pared derecha: muebles de cocina, cafetera, microondas, nevera y papelera
  const kx = mx1 - 0.47, ka = up('furniture/kitchenCabinet', kx, oz0 + 1.0, -Math.PI / 2);
  const kh = Y + (ka ? ka[1] : 0.9);
  up('furniture/kitchenCabinet', kx, oz0 + 1.0 + (ka ? ka[0] : 0.9), -Math.PI / 2);
  up('furniture/kitchenCoffeeMachine', kx + 0.05, oz0 + 0.85, -Math.PI / 2, 1, false, kh);
  up('furniture/kitchenMicrowave', kx + 0.05, oz0 + 1.0 + (ka ? ka[0] : 0.9), -Math.PI / 2, 1, false, kh);
  up('furniture/kitchenFridgeSmall', kx, oz0 + 2.9, -Math.PI / 2);
  up('furniture/trashcan', kx - 0.1, wz - 0.4, 0, 1, false);
  up('furniture/radio', kx + 0.05, oz0 + 1.3, -Math.PI / 2, 1, false, kh);
  // cuadros y reloj en la pared de panel de la zona de estar
  const frame = (x, z, wd, ht, key, draw) => { rb(g, mat('marcoCuadro', { color: '#2b2622', roughness: 0.6 }), wd + 0.08, ht + 0.08, 0.04, x, Y + 1.65, z, 0.01); const pic = new THREE.Mesh(new THREE.PlaneGeometry(wd, ht), paintMat(key, 128, 96, draw)); pic.position.set(x, Y + 1.65, z - 0.025); pic.rotation.y = Math.PI; g.add(pic); };
  frame(mx0 + 1.6, wz - 0.03, 0.9, 0.6, 'cuadroPuerto', (c, w, hh) => { const gr = c.createLinearGradient(0, 0, 0, hh); gr.addColorStop(0, '#f6b26b'); gr.addColorStop(0.6, '#e06666'); gr.addColorStop(0.61, '#3d85c6'); gr.addColorStop(1, '#1c4587'); c.fillStyle = gr; c.fillRect(0, 0, w, hh); c.fillStyle = '#20124d'; c.fillRect(20, 40, 8, 18); c.fillRect(30, 30, 6, 28); c.fillRect(70, 48, 40, 10); });
  frame(mx0 + 3.0, wz - 0.03, 0.5, 0.6, 'cuadroIsla', (c, w, hh) => { c.fillStyle = '#cfe2f3'; c.fillRect(0, 0, w, hh); c.fillStyle = '#6aa84f'; c.beginPath(); c.ellipse(w / 2, hh / 2, w * 0.35, hh * 0.3, 0, 0, Math.PI * 2); c.fill(); c.fillStyle = '#ffe599'; c.fillRect(w * 0.3, hh * 0.45, w * 0.4, 4); });
  const clk = new THREE.Mesh(new THREE.CircleGeometry(0.17, 24), clockMat()); clk.position.set(mx0 + 0.16, Y + 2.3, cz); clk.rotation.y = Math.PI / 2; g.add(clk);
  // (debajo de la entreplanta no se pone nada: queda libre, sólo los pilares)
  return { x0: mx0, x1: mx1, z0: mz0, z1: mz1, floors, stair: { x0: sx0, x1: sx1, z0: zs, z1: mz0 } };
}

// Lo típico de una nave, según el tamaño (level 0 Delta, 1 Bravo, 2 Alfa): banco de trabajo
// con panel de herramientas, extintores, botiquín y señales, bidones, cajas y film; en las
// grandes, contenedores IBC y más de todo. (La carretilla y los palés sueltos los pone el
// mundo con sus piezas de siempre.)
function warehouseStuff(g, { ix0, ix1, iz0, iz1, rz1, doorX, level, office, put, rolls }, boxes) {
  const red = mat('extintor', { color: '#c0392b', roughness: 0.35, metalness: 0.2 }), dark = mat('negroOf', { color: '#1c1e22', roughness: 0.4, metalness: 0.3 });
  const steel = mat('aceroBanco', { color: '#5d6872', roughness: 0.45, metalness: 0.7 });
  // banco de trabajo contra la pared izquierda, con panel de herramientas encima
  const bz = (rz1 + iz1) / 2 - 1, bx = ix0 + 0.4;
  rb(g, mat('tableroBanco', { color: '#9c7a52', roughness: 0.7 }), 0.75, 0.06, 2.4, bx, 0.9, bz, 0.01);
  for (const s2 of [-1.1, 1.1]) for (const t of [-0.3, 0.3]) slab(g, steel, bx + t - 0.03, bx + t + 0.03, 0, 0.88, bz + s2 - 0.03, bz + s2 + 0.03);
  slab(g, steel, bx - 0.33, bx + 0.33, 0.25, 0.28, bz - 1.15, bz + 1.15); // balda baja
  const peg = paintMat('panelHerr', 256, 128, (c, w, h) => {
    c.fillStyle = '#b9a07a'; c.fillRect(0, 0, w, h); c.fillStyle = 'rgba(60,45,30,0.5)';
    for (let y = 6; y < h; y += 10) for (let x = 6; x < w; x += 10) c.fillRect(x, y, 2, 2);
    c.fillStyle = '#2b2f35'; c.strokeStyle = '#2b2f35'; c.lineWidth = 5;
    const tool = (x, y, l, a) => { c.save(); c.translate(x, y); c.rotate(a); c.fillRect(-2, 0, 5, l); c.restore(); };
    tool(30, 20, 60, 0); c.fillStyle = '#c0392b'; c.fillRect(25, 76, 14, 22); c.fillStyle = '#2b2f35';
    tool(60, 20, 70, 0.1); c.beginPath(); c.arc(100, 40, 14, 0, Math.PI * 2); c.stroke(); tool(100, 54, 50, 0);
    for (let k = 0; k < 5; k++) tool(140 + k * 9, 24, 40 + k * 6, 0);
    c.fillStyle = '#e0a21a'; c.fillRect(200, 30, 34, 22); c.fillStyle = '#2b2f35'; c.fillRect(210, 52, 10, 40);
  });
  const pb = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 1.1), peg); pb.position.set(ix0 + 0.03, 1.75, bz); pb.rotation.y = Math.PI / 2; g.add(pb);
  rb(g, steel, 0.16, 0.14, 0.2, bx + 0.25, 1.0, bz + 0.9, 0.02); // tornillo de banco
  rb(g, red, 0.45, 0.22, 0.25, bx, 1.04, bz - 0.6, 0.02);          // caja de herramientas
  boxes.push([ix0, ix0 + 0.8, bz - 1.2, bz + 1.2, 1.0]);
  // extintores en la pared (junto a la puerta, junto al banco y junto a las estanterías)
  const ext = (x, z, ry) => { const e = new THREE.Group(); e.position.set(x, 0, z); e.rotation.y = ry; g.add(e); cy(e, red, 0.09, 0.09, 0.5, 0, 0.55, 0.12); cy(e, dark, 0.03, 0.04, 0.08, 0, 0.84, 0.12, 8); slab(e, dark, -0.02, 0.02, 0.8, 0.86, 0.12, 0.3); const s3 = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.3), paintMat('senalExt', 128, 128, signTex('EXTINTOR', '#c0392b', '#fff', '🧯'))); s3.position.set(0, 1.4, 0.01); e.add(s3); };
  ext(ix1 - 0.05, iz1 - 2.2, -Math.PI / 2);
  ext(ix0 + 0.05, bz + 1.6, Math.PI / 2);
  if (level >= 1) ext(ix1 - 0.05, rz1 + 1.4, -Math.PI / 2);
  // señales: salida encima de la puerta, prohibido fumar y casco obligatorio, botiquín
  const sign = (key, txt, bg, icon, x, y, z, ry, sw = 0.6, sh = 0.4) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), paintMat(key, 256, 170, signTex(txt, bg, '#fff', icon))); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  sign('salida', 'SALIDA', '#1e8449', '🚪', doorX, 2.65, iz1 - 0.01, Math.PI, 0.7, 0.32);
  sign('nofumar', 'PROHIBIDO FUMAR', '#c0392b', '🚭', ix0 + 0.02, 2.4, (rz1 + iz1) / 2 + 2.5, Math.PI / 2);
  sign('casco', 'USO OBLIGATORIO DE CASCO', '#1f5fbf', '⛑️', ix1 - 0.02, 2.4, (rz1 + iz1) / 2, -Math.PI / 2);
  if (level >= 1) sign('carretillas', 'ATENCIÓN CARRETILLAS', '#e0a21a', '⚠️', ix0 + 0.02, 2.4, rz1 + 1.5, Math.PI / 2);
  rb(g, mat('botiquin', { color: '#f4f4f4', roughness: 0.5 }), 0.12, 0.3, 0.4, ix1 - 0.08, 1.5, iz1 - 3.3, 0.02); // (de canto contra la pared derecha)
  const cross = new THREE.Mesh(new THREE.PlaneGeometry(0.2, 0.2), paintMat('cruz', 64, 64, (c, w, h) => { c.fillStyle = '#f4f4f4'; c.fillRect(0, 0, w, h); c.fillStyle = '#1e8449'; c.fillRect(24, 8, 16, 48); c.fillRect(8, 24, 48, 16); }));
  cross.position.set(ix1 - 0.145, 1.5, iz1 - 3.3); cross.rotation.y = -Math.PI / 2; g.add(cross);
  // en el pequeño (Delta) la nave se deja casi libre: sólo estanterías, banco y lo de las paredes
  if (level === 0) return;
  // bidones en la esquina del fondo izquierda, y montones de cajas
  const drums = [[0, 0], [0.66, 0], [0.33, 0.6]]; // (tres bidones: la nave ordenada, sin amontonar)
  const dx0 = ix0 + 0.6, dz0 = rz1 + 0.9;
  drums.forEach(([ox, oz], k) => drum(g, dx0 + ox, 0, dz0 + oz, k));
  boxes.push([dx0 - 0.33, dx0 + 1.65, dz0 - 0.33, dz0 + 1.65, 0.9]);
  // montón de cajas de cartón (cerradas y alguna abierta), apiladas con un leve giro
  const stack = (x, z, n) => {
    let y = 0, top = 0;
    for (let k = 0; k < n; k++) { const d = put(k === n - 1 && n > 1 ? 'furniture/cardboardBoxOpen' : 'furniture/cardboardBoxClosed', x + (k % 2) * 0.04, y, z, k * 0.25 - 0.2, 1.25, null); if (!d) return; y += d[1]; top = Math.max(top, d[0]); }
    boxes.push([x - top / 2 - 0.05, x + top / 2 + 0.05, z - top / 2 - 0.05, z + top / 2 + 0.05, y]);
  };
  stack(ix1 - 0.7, rz1 + 2.6, 3);
  if (level >= 2) stack(ix1 - 1.5, rz1 + 2.7, 2);
  // zona de carga en la persiana de la izquierda: la furgoneta de reparto dentro (de morro a la
  // persiana), una cinta de rodillos detrás, palés con cajas al lado, conos y un poste
  const r0 = rolls[0];
  const van = put('cars/' + (level >= 1 ? 'delivery' : 'van'), r0, 0, iz1 - 3.1, 0, 1);
  const vl = van ? van[2] : 4.8;
  const cv = put('factory/conveyor-long', r0, 0, iz1 - 3.1 - vl / 2 - 1.3, Math.PI / 2, 1.1, 'all');
  const palletStack = (x, z, layers) => {
    const p0 = put('retro/pallet', x, 0, z, 0, 1, null); if (!p0) return;
    let y = p0[1];
    for (let l = 0; l < layers; l++) { let hgt = 0; for (const [ox, oz] of [[-0.3, -0.3], [0.3, -0.3], [-0.3, 0.3], [0.3, 0.3]]) { const d = put('furniture/cardboardBoxClosed', x + ox, y, z + oz, (l % 2) * 0.1, 1.15, null); if (d) hgt = d[1]; } y += hgt; }
    boxes.push([x - 0.62, x + 0.62, z - 0.62, z + 0.62, y]);
  };
  palletStack(r0 + 2.4, iz1 - 2.6, 2);
  if (level >= 2) palletStack(r0 + 2.4, iz1 - 4.0, 1);
  for (const [cx2, cz2] of [[r0 - 1.7, iz1 - 0.8], [r0 + 1.7, iz1 - 0.8]]) put('factory/cone', cx2, 0, cz2, 0, 1, null);
  put('factory/warning-traffic', r0 + 1.6, 0, iz1 - 5.6, 0, 1, null);
  const film = mat('filmRollo', { color: '#d9dde2', roughness: 0.25, transparent: true, opacity: 0.9 });
  for (let k = 0; k < 2 + level; k++) { const r = cy(g, film, 0.12, 0.12, 0.5, ix1 - 0.4, 0.12, rz1 + 1.0 + k * 0.28, 12); r.rotation.x = Math.PI / 2; }
  // contenedores IBC (depósito blanco dentro de una jaula de acero sobre palé), en Bravo y Alfa
  if (level >= 1) {
    const tank = mat('ibc', { color: '#eef0ec', roughness: 0.4, transparent: true, opacity: 0.92 }), cage = mat('jaulaIbc', { color: '#a7adb3', roughness: 0.4, metalness: 0.8 });
    for (let k = 0; k < level; k++) {
      const cx = ix0 + 3.2 + k * 1.3; // (contra la pared delantera, a la izquierda)
      slab(g, mat('paletIbc', { color: '#7f8a93', roughness: 0.6 }), cx - 0.55, cx + 0.55, 0, 0.15, iz1 - 1.7, iz1 - 0.6);
      rb(g, tank, 1.0, 1.0, 1.0, cx, 0.66, iz1 - 1.15, 0.06);
      for (const t of [-0.5, -0.17, 0.17, 0.5]) { slab(g, cage, cx + t - 0.015, cx + t + 0.015, 0.15, 1.18, iz1 - 1.67, iz1 - 1.64); slab(g, cage, cx + t - 0.015, cx + t + 0.015, 0.15, 1.18, iz1 - 0.66, iz1 - 0.63); }
      for (const y of [0.5, 0.85, 1.17]) { slab(g, cage, cx - 0.52, cx + 0.52, y, y + 0.03, iz1 - 1.67, iz1 - 1.64); slab(g, cage, cx - 0.52, cx + 0.52, y, y + 0.03, iz1 - 0.66, iz1 - 0.63); }
      cy(g, mat('tapaIbc', { color: '#2b2f35', roughness: 0.5 }), 0.12, 0.12, 0.06, cx, 1.18, iz1 - 1.15, 12);
      boxes.push([cx - 0.56, cx + 0.56, iz1 - 1.72, iz1 - 0.58, 1.2]);
    }
  }
}

// Suelo de nave: hormigón pulido con sus juntas de dilatación (cuadros de 6 m), manchas de
// aceite y marcas de ruedas (la textura mide 6 m; el mundo pone el suelo con este material)
export function naveFloorMat() {
  return mat('sueloNave', { roughness: 0.55, map: canvasTex('sueloNave', 512, 512, (c, w, h) => {
    c.fillStyle = '#9d9a92'; c.fillRect(0, 0, w, h);
    let sd = 11; const rnd = () => { sd = (sd * 9301 + 49297) % 233280; return sd / 233280; };
    for (let k = 0; k < 2600; k++) { c.fillStyle = `rgba(${rnd() < 0.5 ? '60,58,52' : '235,232,224'},${rnd() * 0.07})`; c.fillRect(rnd() * w, rnd() * h, 2 + rnd() * 6, 2 + rnd() * 6); }
    for (let k = 0; k < 7; k++) { const x = rnd() * w, y = rnd() * h, r = 10 + rnd() * 40; const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(60,55,45,0.18)'); gr.addColorStop(1, 'rgba(60,55,45,0)'); c.fillStyle = gr; c.beginPath(); c.arc(x, y, r, 0, Math.PI * 2); c.fill(); }
    c.strokeStyle = 'rgba(40,40,40,0.08)'; c.lineWidth = 7; for (let k = 0; k < 3; k++) { c.beginPath(); c.moveTo(rnd() * w, 0); c.bezierCurveTo(rnd() * w, h * 0.3, rnd() * w, h * 0.7, rnd() * w, h); c.stroke(); } // ruedas
    c.fillStyle = 'rgba(55,53,48,0.85)'; c.fillRect(0, 0, w, 4); c.fillRect(0, 0, 4, h); // junta de dilatación
    c.fillStyle = 'rgba(255,255,255,0.25)'; c.fillRect(0, 4, w, 1); c.fillRect(4, 0, 1, h);
  }) });
}

// Más cosas de nave: conducto de ventilación colgado del techo, bandeja de cables por la pared
// con el cuadro eléctrico, ventiladores industriales, taquillas, fuente de agua, contenedores
// de basura, carro de limpieza con su señal, escalera de tijera, devanadera de manguera,
// cajas de plástico apiladas y un reloj de pared.
function warehouseExtras(g, { ix0, ix1, iz0, iz1, rz1, h, level, office }, boxes) {
  const galva = mat('galvanizado', { color: '#c4c9cd', roughness: 0.35, metalness: 0.75 }), dark = mat('negroOf', { color: '#1c1e22', roughness: 0.4, metalness: 0.3 });
  const grey = mat('grisEquipo', { color: '#8f979e', roughness: 0.5, metalness: 0.5 });
  // conducto de ventilación a lo largo de la nave (bajo las cerchas) con difusores
  const dz = (rz1 + iz1) / 2 + 1.5, dy = h - 1.35, len = ix1 - ix0 - 3;
  const duct = cy(g, galva, 0.34, 0.34, len, (ix0 + ix1) / 2, dy, dz, 18); duct.rotation.z = Math.PI / 2;
  for (let x = ix0 + 2.5; x < ix1 - 2; x += 1.5) { const r = cy(g, grey, 0.355, 0.355, 0.06, x, dy, dz, 18); r.rotation.z = Math.PI / 2; } // uniones
  for (let x = ix0 + 3; x < ix1 - 2; x += 4) { cy(g, galva, 0.16, 0.22, 0.4, x, dy - 0.45, dz, 12); cy(g, dark, 0.012, 0.012, h - 0.75 - dy, x + 0.5, (h - 0.75 + dy) / 2, dz, 4); }
  // bandeja de cables por la pared derecha y cuadro eléctrico detrás de la oficina
  const tx = ix1 - 0.2;
  const tz1 = office.z0 - 0.3; // (hasta la entreplanta)
  slab(g, galva, tx - 0.15, tx + 0.15, 3.3, 3.32, iz0 + 1, tz1); slab(g, galva, tx - 0.15, tx - 0.13, 3.32, 3.42, iz0 + 1, tz1);
  for (const [c, o] of [['#1f1f1f', -0.06], ['#c0392b', 0], ['#2f5fa8', 0.06]]) { const cb = cy(g, mat('cable' + c, { color: c, roughness: 0.6 }), 0.018, 0.018, tz1 - iz0 - 1.1, tx + o, 3.35, (iz0 + 1 + tz1) / 2, 6); cb.rotation.x = Math.PI / 2; }
  const pz = office.z0 - 0.9;
  rb(g, grey, 0.28, 1.3, 1.0, ix1 - 0.16, 1.55, pz, 0.02);
  slab(g, dark, ix1 - 0.31, ix1 - 0.3, 1.0, 2.1, pz - 0.45, pz + 0.45);
  const warn = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.2), mat('pint-rayo', { map: canvasTex('pint-rayo', 64, 64, (c, w, hh) => { c.fillStyle = '#f1c40f'; c.beginPath(); c.moveTo(w / 2, 4); c.lineTo(w - 4, hh - 4); c.lineTo(4, hh - 4); c.fill(); c.fillStyle = '#111'; c.font = 'bold 34px sans-serif'; c.textAlign = 'center'; c.fillText('⚡', w / 2, hh - 12); }), transparent: true, alphaTest: 0.1 }));
  warn.position.set(ix1 - 0.315, 1.95, pz); warn.rotation.y = -Math.PI / 2; g.add(warn);
  for (const o of [-0.3, 0, 0.3]) slab(g, galva, ix1 - 0.2, ix1 - 0.14, 2.2, 3.3, pz + o - 0.025, pz + o + 0.025); // tubos hasta la bandeja
  boxes.push([ix1 - 0.32, ix1, pz - 0.5, pz + 0.5, 2.2]);
  // contenedores de basura junto al cuadro (las taquillas y la fuente están bajo la entreplanta)
  const fz = pz - 0.9;
  const bin = (c, z) => { rb(g, mat('cubo' + c, { color: c, roughness: 0.6 }), 0.58, 1.0, 0.7, ix1 - 0.42, 0.5, z, 0.04); rb(g, mat('tapa' + c, { color: c, roughness: 0.5 }), 0.62, 0.06, 0.74, ix1 - 0.42, 1.03, z, 0.02); cy(g, dark, 0.09, 0.09, 0.05, ix1 - 0.15, 0.09, z - 0.25, 10).rotation.z = Math.PI / 2; };
  ['#2e7d32', '#f1c40f', '#1f5fbf'].slice(0, 2 + (level ? 1 : 0)).forEach((c, k) => bin(c, fz - 0.7 - k * 0.8));
  boxes.push([ix1 - 0.75, ix1, fz - 0.7 - (2 + (level ? 1 : 0)) * 0.8 + 0.4, fz - 0.3, 1.1]);
  // ventiladores industriales en la pared izquierda (y uno al fondo en el grande)
  const fan = (x, y, z, ry) => {
    const f = new THREE.Group(); f.position.set(x, y, z); f.rotation.y = ry; g.add(f);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.05, 8, 28), grey); ring.position.z = 0.25; f.add(ring);
    const back = cy(f, dark, 0.2, 0.2, 0.3, 0, 0, 0.12, 14); back.rotation.x = Math.PI / 2;
    for (let k = 0; k < 3; k++) { const bl = slab(f, galva, -0.06, 0.06, 0, 0.5, 0.22, 0.24); bl.geometry.translate(0, 0.25, 0); bl.position.set(0, 0, 0.23); bl.rotation.z = (k * Math.PI * 2) / 3; } // aspas desde el eje
    for (let k = 0; k < 8; k++) { const sp = slab(f, grey, -0.008, 0.008, -0.55, 0.55, 0.3, 0.31); sp.rotation.z = (k * Math.PI) / 8; } // rejilla
    slab(f, grey, -0.04, 0.04, -0.75, -0.05, 0.02, 0.1); // soporte
  };
  fan(ix0 + 0.02, 4.6, (rz1 + iz1) / 2 + 3, Math.PI / 2);
  fan(ix0 + 0.02, 4.6, (rz1 + iz1) / 2 - 3, Math.PI / 2);
  if (level >= 2) fan(0, 5.2, iz0 + 0.02, 0);
  if (level >= 1) {
  // carro de limpieza con fregona y señal de suelo mojado, escalera de tijera y manguera
  const bz = (rz1 + iz1) / 2 - 1;
  const cartX = ix0 + 0.7, cartZ = bz - 2.4;
  rb(g, mat('cubeta', { color: '#f1c40f', roughness: 0.6 }), 0.45, 0.32, 0.55, cartX, 0.25, cartZ, 0.04);
  cy(g, mat('palo', { color: '#2f5fa8', roughness: 0.5 }), 0.014, 0.014, 1.3, cartX + 0.1, 0.9, cartZ - 0.12, 6).rotation.z = 0.12;
  const wet = new THREE.Group(); wet.position.set(cartX + 0.7, 0, cartZ + 0.1); g.add(wet);
  for (const s2 of [-1, 1]) { const pnl = new THREE.Mesh(new THREE.PlaneGeometry(0.3, 0.6), mat('pint-mojado', { map: canvasTex('pint-mojado', 96, 192, (c, w, hh) => { c.fillStyle = '#f1c40f'; c.fillRect(0, 0, w, hh); c.fillStyle = '#111'; c.font = 'bold 50px sans-serif'; c.textAlign = 'center'; c.fillText('⚠', w / 2, 70); c.font = 'bold 15px sans-serif'; c.fillText('SUELO', w / 2, 120); c.fillText('MOJADO', w / 2, 142); }), side: THREE.DoubleSide })); pnl.position.set(0, 0.3, s2 * 0.08); pnl.rotation.x = s2 * 0.25; wet.add(pnl); }
  boxes.push([cartX - 0.3, cartX + 0.3, cartZ - 0.32, cartZ + 0.32, 0.5]);
  const ladder = new THREE.Group(); ladder.position.set(ix0 + 0.25, 0, bz - 3.6); ladder.rotation.z = -0.12; g.add(ladder);
  for (const zz of [-0.25, 0.25]) slab(ladder, galva, -0.03, 0.03, 0, 2.2, zz - 0.02, zz + 0.02);
  for (let y = 0.3; y < 2.1; y += 0.3) slab(ladder, galva, -0.04, 0.04, y, y + 0.03, -0.25, 0.25);
  if (level >= 1) {
    const hz = bz + 3.4, reel = cy(g, mat('devanadera', { color: '#c0392b', roughness: 0.4 }), 0.32, 0.32, 0.18, ix0 + 0.12, 1.5, hz, 18); reel.rotation.z = Math.PI / 2;
    const hose = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.035, 8, 24), mat('manguera', { color: '#d35400', roughness: 0.6 })); hose.position.set(ix0 + 0.24, 1.5, hz); hose.rotation.y = Math.PI / 2; g.add(hose);
  }
  }
  // cajas de plástico apiladas cerca de las estanterías
  const crate = (x, z, n, c) => { for (let k = 0; k < n; k++) { rb(g, mat('cajaPl' + c, { color: c, roughness: 0.6 }), 0.6, 0.3, 0.4, x, 0.15 + k * 0.31, z, 0.02); slab(g, dark, x - 0.12, x + 0.12, 0.2 + k * 0.31, 0.24 + k * 0.31, z - 0.205, z - 0.2); } boxes.push([x - 0.32, x + 0.32, z - 0.22, z + 0.22, n * 0.31]); };
  const cz0 = rz1 + 0.9;
  if (level >= 1) { crate(ix0 + 6.5, cz0, 3, '#1f5fbf'); crate(ix0 + 7.2, cz0, 2, '#7f8c8d'); } // (dos montones; en Delta, nada)
  // detalles de vida: pósters, calendario y tablón de avisos en las paredes
  const poster = (key, x, y, z, ry, w, h, draw) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), paintMat(key, 128, Math.round((128 * h) / w), draw)); m.position.set(x, y, z); m.rotation.y = ry; g.add(m); };
  const lw = ix0 + 0.045; // pared izquierda (cara hacia dentro)
  poster('posterSeguridad', lw, 1.9, (rz1 + iz1) / 2 + 4.6, Math.PI / 2, 0.6, 0.85, (c, w, h) => { c.fillStyle = '#1e8449'; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.textAlign = 'center'; c.font = 'bold 16px sans-serif'; c.fillText('LA SEGURIDAD', w / 2, 26); c.fillText('ES COSA', w / 2, 46); c.fillText('DE TODOS', w / 2, 66); c.font = '60px sans-serif'; c.fillText('⛑', w / 2, 140); });
  poster('calendario', lw, 1.7, (rz1 + iz1) / 2 - 4.4, Math.PI / 2, 0.45, 0.65, (c, w, h) => { c.fillStyle = '#fafafa'; c.fillRect(0, 0, w, h); c.fillStyle = '#c0392b'; c.fillRect(0, 0, w, 26); c.fillStyle = '#fff'; c.font = 'bold 14px sans-serif'; c.textAlign = 'center'; c.fillText('OCTUBRE', w / 2, 18); c.fillStyle = '#333'; c.font = '10px sans-serif'; for (let k = 0; k < 31; k++) c.fillText(String(k + 1), 14 + (k % 7) * 17, 44 + Math.floor(k / 7) * 22); c.strokeStyle = '#c0392b'; c.lineWidth = 2; c.strokeRect(78, 74, 16, 16); });
  const board = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.8), paintMat('tablon', 192, 128, (c, w, h) => { c.fillStyle = '#b08a5a'; c.fillRect(0, 0, w, h); for (let k = 0; k < 400; k++) { c.fillStyle = `rgba(80,55,30,${Math.random() * 0.25})`; c.fillRect(Math.random() * w, Math.random() * h, 2, 2); } const notes = [['#fff8b0', 12, 10, 50, 40], ['#ffffff', 70, 8, 56, 70], ['#bfe3ff', 136, 14, 44, 36], ['#ffd1dc', 20, 62, 46, 50], ['#ffffff', 132, 60, 48, 56]]; for (const [col, x, y, ww, hh] of notes) { c.fillStyle = col; c.fillRect(x, y, ww, hh); c.fillStyle = '#c0392b'; c.beginPath(); c.arc(x + ww / 2, y + 4, 3, 0, Math.PI * 2); c.fill(); c.fillStyle = 'rgba(0,0,0,0.5)'; for (let l = 0; l < 4; l++) c.fillRect(x + 5, y + 12 + l * 8, ww - 10 - (l * 7) % 15, 2); } }));
  board.position.set(lw, 1.7, (rz1 + iz1) / 2 + 2.4); board.rotation.y = Math.PI / 2; g.add(board);
  slab(g, mat('marcoTablon', { color: '#5b3d22', roughness: 0.7 }), ix0 + 0.01, ix0 + 0.06, 1.28, 2.12, (rz1 + iz1) / 2 + 1.78, (rz1 + iz1) / 2 + 3.02);
  // un póster deportivo y uno de la empresa en el frente (dentro, junto a la zona de carga)
  const fw = iz1 - 0.04;
  poster('posterEmpresa', ix0 + 5.6, 2.2, fw, Math.PI, 0.9, 0.6, (c, w, h) => { c.fillStyle = '#34495e'; c.fillRect(0, 0, w, h); c.fillStyle = '#f1c40f'; c.font = 'bold 18px sans-serif'; c.textAlign = 'center'; c.fillText('ROOK LOGÍSTICA', w / 2, 34); c.fillStyle = '#ecf0f1'; c.font = '11px sans-serif'; c.fillText('Distribución · Isla de Rooktown', w / 2, 56); });
  if (level >= 1) poster('posterFutbol', ix0 + 6.8, 1.9, fw, Math.PI, 0.5, 0.7, (c, w, h) => { const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#1f5fbf'); gr.addColorStop(1, '#0b2a5c'); c.fillStyle = gr; c.fillRect(0, 0, w, h); c.fillStyle = '#fff'; c.font = 'bold 15px sans-serif'; c.textAlign = 'center'; c.fillText('ROOKTOWN', w / 2, 28); c.fillText('F.C.', w / 2, 46); c.font = '56px sans-serif'; c.fillText('⚽', w / 2, 120); });
  // reloj de pared en el fondo, encima de las estanterías
  const clock = new THREE.Mesh(new THREE.CircleGeometry(0.4, 32), clockMat());
  clock.position.set((ix0 + ix1) / 2, 5.6, iz0 + 0.06); g.add(clock);
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
