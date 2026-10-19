// Edificios de relleno con modelos libres (CC0, ver docs/MODELOS-LIBRES.md):
//   h_*  Family House Collection (drummyfish): casas con textura realista
//   q_*  LowPoly Buildings (Quaternius): bloques, tienda, banco y casas de estilo dibujo
//   cb_* City Buildings (OpenGameArt): bloques de pisos, locales y un motel con escaleras
// Se cargan al arrancar; cada modelo queda centrado en planta, apoyado en el suelo, con la
// fachada principal hacia +z y a su tamaño real en metros (FIT).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const files = import.meta.glob('../assets/buildings/*.glb', { query: '?url', import: 'default', eager: true });
// tamaño real: w = ancho (x) en metros, o h = alto
const FIT = {
  h_house1: { w: 13 }, h_house2: { w: 11 }, h_house3: { w: 11 }, h_house4: { w: 10 }, h_house5: { w: 10 }, h_house6: { w: 10 },
  q_House: { h: 7.5 }, q_House2: { h: 7 }, q_House3: { h: 9 }, q_House4: { h: 7 }, q_House5: { h: 7 },
  q_Flat: { h: 15 }, q_Flat2: { h: 15 }, q_Shop: { w: 12 }, q_Bank: { w: 12 },
  cb_Building_1_A: { w: 12.4 }, cb_Building_1_D: { w: 12.4 }, cb_Building_2_A: { w: 12.3 },
  cb_Building_3_A: { w: 30 }, cb_Building_5_A: { w: 24 },
};
const MODELS = {};

// ---------- re-texturizado realista (texturas Poly Haven, CC0) ----------
// Los modelos de estilo dibujo (q_*, cb_*) traen una paleta de colores planos. Cada cara se
// clasifica por su color de paleta y su inclinación (pared, remate, cristal, marco, madera,
// tejado plano o inclinado) y recibe un material realista con UV proyectadas en metros, para
// que el ladrillo o las tejas tengan el mismo tamaño en todos los edificios de la ciudad.
const texFiles = import.meta.glob('../assets/textures/pbr/*.jpg', { query: '?url', import: 'default', eager: true });
const texUrl = (n) => Object.entries(texFiles).find(([p]) => p.endsWith('/' + n + '.jpg'))?.[1];
const TL = new THREE.TextureLoader();
const texCache = new Map(), matCache = new Map();
function tex(n, srgb) {
  if (!texCache.has(n)) {
    const t = TL.load(texUrl(n)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(n, t);
  }
  return texCache.get(n);
}
// material realista; `tile` = metros que ocupa una repetición de la textura
export const PBR = {
  ladrilloRojo: ['red_brick_03', 2.2], ladrilloViejo: ['brick_wall_02', 2.2], ladrilloOscuro: ['brick_wall_10', 2.2],
  enfoscado: ['plastered_wall_02', 3], blanco: ['white_plaster_02', 3], beige: ['beige_wall_001', 3], claro: ['painted_plaster_wall', 3],
  hormigon: ['concrete_wall_008', 3], tejas: ['clay_roof_tiles_02', 2.5], pizarra: ['roof_slates_02', 2.5], chapa: ['corrugated_iron_02', 2],
  madera: ['wood_planks', 2], metal: ['metal_plate', 1.5],
};
export function pbrMat(key, tint) {
  const k = key + (tint || '');
  if (!matCache.has(k)) {
    const [n, tile] = PBR[key];
    const m = new THREE.MeshStandardMaterial({ map: tex(n + '_c', true), normalMap: tex(n + '_n'), normalScale: new THREE.Vector2(0.9, 0.9), roughness: 0.92, metalness: 0, color: tint || '#ffffff' });
    m.userData.tile = tile;
    matCache.set(k, m);
  }
  return matCache.get(k);
}
export const plainMat = (k, o) => { if (!matCache.has(k)) matCache.set(k, new THREE.MeshStandardMaterial(o)); return matCache.get(k); };
export const GLASS = () => plainMat('vidrio', { color: '#5f7d93', roughness: 0.12, metalness: 0.6 });
export const FRAME = () => plainMat('marco', { color: '#3a3d42', roughness: 0.5, metalness: 0.4 });

// píxeles de la paleta (las texturas de estos paquetes son de 32×32)
function paletteReader(map) {
  const img = map?.image;
  if (!img) return null;
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d'); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data;
  // v de glTF ya va de arriba abajo, igual que las filas del lienzo (comprobado con
  // tests/zz-pal.spec.js: sin voltear salen los colores originales de cada modelo)
  return (u, v) => {
    const fu = u - Math.floor(u), fv = v - Math.floor(v);
    const x = Math.min(c.width - 1, Math.max(0, Math.floor(fu * c.width)));
    const y = Math.min(c.height - 1, Math.max(0, Math.floor(fv * c.height)));
    const i = (y * c.width + x) * 4;
    return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255];
  };
}
// clase de una cara a partir de su color de paleta y su normal
function classify([r, g, b], ny, wallKey) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), lum = 0.3 * r + 0.59 * g + 0.11 * b, sat = mx ? (mx - mn) / mx : 0;
  if (b > r + 0.12 && b >= g - 0.02 && sat > 0.2) return 'glass';
  if (ny > 0.97) return lum < 0.35 ? 'roofFlatDark' : 'roofFlat';
  if (ny > 0.3) return 'roofSlope';
  if (lum < 0.2) return 'frame';
  if (lum > 0.82 && sat < 0.15) return 'trim';
  if (r > g && g > b && sat > 0.35 && lum < 0.45) return 'wood';
  return 'wall';
}
// pared según el color original: ladrillo para rojos y marrones, enfoscados para el resto
function wallFor([r, g, b], seed) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), sat = mx ? (mx - mn) / mx : 0, lum = 0.3 * r + 0.59 * g + 0.11 * b;
  if (r > g + 0.08 && r > b + 0.08 && sat > 0.2) return ['ladrilloRojo', 'ladrilloViejo', 'ladrilloOscuro'][seed % 3];
  if (sat > 0.2 && r >= g && g > b) return 'beige';
  if (lum > 0.75) return seed % 2 ? 'blanco' : 'claro';
  return seed % 2 ? 'enfoscado' : 'hormigon';
}
// Convierte un modelo de paleta en mallas por material con texturas realistas
function retexture(root, seed) {
  root.updateMatrixWorld(true);
  const out = new THREE.Group();
  const buckets = new Map(); // material → { pos, nor, uv }
  const meshes = [];
  root.traverse((o) => { if (o.isMesh) meshes.push(o); });
  // color de pared dominante del edificio (el más frecuente entre las caras verticales)
  const votes = new Map();
  const tri = [new THREE.Vector3(), new THREE.Vector3(), new THREE.Vector3()], n = new THREE.Vector3(), e1 = new THREE.Vector3(), e2 = new THREE.Vector3();
  const on = new THREE.Vector3(), nm = new THREE.Matrix3();
  // normal geométrica de la cara, orientada como la normal original del modelo; true si hay que
  // invertir el orden de los vértices para que la cara mire hacia fuera
  const faceNormal = (m, geo, i) => {
    n.crossVectors(e1.subVectors(tri[1], tri[0]), e2.subVectors(tri[2], tri[0]));
    const area = n.length(); if (area < 1e-6) return 0;
    n.divideScalar(area);
    const N = geo.attributes.normal;
    if (!N) return area;
    nm.getNormalMatrix(m.matrixWorld);
    on.fromBufferAttribute(N, i).add(e1.fromBufferAttribute(N, i + 1)).add(e2.fromBufferAttribute(N, i + 2)).applyMatrix3(nm);
    let flip = on.dot(n) < 0;
    if (flip) n.negate();
    // tejados con la normal original hacia dentro: inclinados, en la mitad alta y «mirando abajo»
    if (n.y < -0.3 && (tri[0].y + tri[1].y + tri[2].y) / 3 > topY * 0.55) { n.negate(); flip = !flip; }
    return flip ? -area : area;
  };
  const topY = new THREE.Box3().setFromObject(root).max.y;
  const prepared = meshes.map((m) => {
    const geo = m.geometry.index ? m.geometry.toNonIndexed() : m.geometry;
    const read = paletteReader(m.material.map);
    return { m, geo, read };
  });
  for (const { m, geo, read } of prepared) {
    const P = geo.attributes.position, U = geo.attributes.uv;
    for (let i = 0; i < P.count; i += 3) {
      for (let k = 0; k < 3; k++) tri[k].fromBufferAttribute(P, i + k).applyMatrix4(m.matrixWorld);
      const area = Math.abs(faceNormal(m, geo, i)); if (!area) continue;
      const col = read && U ? read((U.getX(i) + U.getX(i + 1) + U.getX(i + 2)) / 3, (U.getY(i) + U.getY(i + 1) + U.getY(i + 2)) / 3) : [0.8, 0.8, 0.8];
      if (classify(col, n.y) === 'wall') { const key = col.map((c) => Math.round(c * 8)).join(); votes.set(key, (votes.get(key) || 0) + area); }
      (m.userData.cols ||= []).push(col);
    }
  }
  const top = [...votes].sort((a, b) => b[1] - a[1])[0];
  const mainCol = top ? top[0].split(',').map((v) => +v / 8) : [0.8, 0.8, 0.8];
  const wallKey = wallFor(mainCol, seed);
  const pick = (cls, col) => {
    switch (cls) {
      case 'glass': return GLASS();
      case 'frame': return FRAME();
      case 'trim': return pbrMat('blanco');
      case 'wood': return pbrMat('madera');
      case 'roofFlat': return pbrMat('hormigon', '#b9b6b0');
      case 'roofFlatDark': return pbrMat('hormigon', '#8a8784');
      case 'roofSlope': return pbrMat(seed % 2 ? 'tejas' : 'pizarra');
      default: {
        // paredes de otro color que la principal (zócalos, franjas): enfoscado o ladrillo propio
        const key = Math.abs(col[0] - mainCol[0]) + Math.abs(col[1] - mainCol[1]) + Math.abs(col[2] - mainCol[2]) < 0.25 ? wallKey : wallFor(col, seed + 1);
        return pbrMat(key);
      }
    }
  };
  for (const { m, geo } of prepared) {
    const P = geo.attributes.position, cols = m.userData.cols || [];
    let t = 0;
    for (let i = 0; i < P.count; i += 3) {
      for (let k = 0; k < 3; k++) tri[k].fromBufferAttribute(P, i + k).applyMatrix4(m.matrixWorld);
      const fa = faceNormal(m, geo, i); if (!fa) continue;
      if (fa < 0) { const tmp = tri[1].clone(); tri[1].copy(tri[2]); tri[2].copy(tmp); } // cara del revés: se le da la vuelta
      const col = cols[t++] || [0.8, 0.8, 0.8];
      const cls = classify(col, n.y), mat = pick(cls, col);
      if (!buckets.has(mat)) buckets.set(mat, { pos: [], nor: [], uv: [] });
      const bk = buckets.get(mat), tile = mat.userData.tile || 1;
      const ax = Math.abs(n.x), ay = Math.abs(n.y), az = Math.abs(n.z);
      for (const v of tri) {
        bk.pos.push(v.x, v.y, v.z); bk.nor.push(n.x, n.y, n.z);
        // proyección por la cara dominante, en metros
        if (ay >= ax && ay >= az) bk.uv.push(v.x / tile, v.z / tile);
        else if (ax >= az) bk.uv.push(v.z / tile, v.y / tile);
        else bk.uv.push(v.x / tile, v.y / tile);
      }
    }
    delete m.userData.cols;
  }
  for (const [mat, bk] of buckets) {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(bk.pos, 3));
    g.setAttribute('normal', new THREE.Float32BufferAttribute(bk.nor, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(bk.uv, 2));
    out.add(new THREE.Mesh(g, mat));
  }
  return out;
}

export async function loadBuildings() {
  const L = new GLTFLoader();
  // las texturas realistas se descargan antes de dar los edificios por listos: si no, lo que se
  // dibuja antes de que lleguen sale negro un instante
  await Promise.all(Object.values(PBR).flatMap(([n]) => [[n + '_c', true], [n + '_n', false]]).map(async ([k, srgb]) => {
    const t = await TL.loadAsync(texUrl(k)); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 4;
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    texCache.set(k, t);
  }));
  await Promise.all(Object.entries(files).map(async ([path, url]) => {
    const name = path.split('/').pop().replace('.glb', '');
    const g = (await L.loadAsync(url)).scene;
    g.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
    const fit = FIT[name] || {};
    const k = fit.w ? fit.w / size.x : fit.h ? fit.h / size.y : 1;
    const root = new THREE.Group(), inner = new THREE.Group();
    inner.add(g);
    inner.scale.setScalar(k);
    inner.position.set(-(box.min.x + box.max.x) / 2 * k, -box.min.y * k, -(box.min.z + box.max.z) / 2 * k);
    root.add(inner);
    if (/^(q|cb)_/.test(name)) {
      // estilo dibujo → realista: se rehacen las mallas con texturas de verdad (en metros)
      const seed = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
      const real = retexture(root, seed);
      MODELS[name] = { root: real, size: size.clone().multiplyScalar(k) };
      return;
    }
    g.traverse((o) => {
      if (!o.isMesh) return;
      for (const m of Array.isArray(o.material) ? o.material : [o.material]) { m.metalness = 0; m.roughness = Math.max(m.roughness, 0.75); }
    });
    MODELS[name] = { root, size: size.clone().multiplyScalar(k) };
  }));
}
export const hasBuilding = (n) => !!MODELS[n];
export const buildingSize = (n) => MODELS[n]?.size;
// función para el colocador de mobiliario (streetfurniture): devuelve el modelo listo
export const buildingModel = (n) => () => MODELS[n].root.clone(true);
