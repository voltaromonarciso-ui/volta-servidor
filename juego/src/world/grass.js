// Césped realista para toda la isla: suelo con textura (Poly Haven «leafy_grass» pasada a verde
// de césped, CC0) con UV en metros, manchas grandes de color para que no se note la repetición y
// matas de hierba en 3D repartidas por los jardines (fundidas por sector con el mobiliario).
import * as THREE from 'three';
import cespedC from '../assets/textures/grass/cesped_c2.jpg?url'; // césped pintado: limpio, sin ruido de cerca
import cespedN from '../assets/textures/grass/cesped_n.jpg?url';

const TILE = 3.5; // metros por repetición de la textura
let lawnMat = null;

export async function loadGrass() {
  const L = new THREE.TextureLoader();
  const [c, n] = await Promise.all([L.loadAsync(cespedC), L.loadAsync(cespedN)]);
  for (const t of [c, n]) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8; }
  c.colorSpace = THREE.SRGBColorSpace;
  lawnMat = new THREE.MeshStandardMaterial({ map: c, normalMap: n, normalScale: new THREE.Vector2(0.25, 0.25), roughness: 0.95, vertexColors: true });
}
export const grassReady = () => !!lawnMat;

// ruido suave (manchas de 20–40 m) para variar el tono del césped
const n2 = (x, z) => Math.sin(x * 0.061 + Math.sin(z * 0.043) * 1.7) * 0.5 + Math.sin(z * 0.057 - x * 0.021 + 1.3) * 0.5;
function tint(x, z) {
  const k = n2(x, z), k2 = Math.sin(x * 0.19 + z * 0.13) * 0.5 + 0.5;
  // de verde más oscuro y húmedo a uno algo más claro y seco
  // la textura ya tiene el verde de la referencia: aquí solo manchas suaves de más claro/oscuro
  return [0.94 + k * 0.07 + k2 * 0.04, 0.97 + k * 0.07, 0.92 + k * 0.04 - k2 * 0.04];
}

// Malla de césped sobre una forma de THREE.Shape (en XY → XZ) o un rectángulo; UV en metros.
function lawnGeoFromPositions(geo) {
  const P = geo.attributes.position, uv = new Float32Array(P.count * 2), col = new Float32Array(P.count * 3);
  for (let i = 0; i < P.count; i++) {
    const x = P.getX(i), z = P.getZ(i);
    uv[i * 2] = x / TILE; uv[i * 2 + 1] = z / TILE;
    const [r, g, b] = tint(x, z); col[i * 3] = r; col[i * 3 + 1] = g; col[i * 3 + 2] = b;
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  geo.computeVertexNormals();
  return geo;
}
// Terreno base de la isla (la forma de la costa), subdividido para que las manchas se vean
export function islandLawn(scene, shape, y) {
  const pts = shape.getPoints(24).map((p) => new THREE.Vector2(p.x, p.y));
  const geo = new THREE.ShapeGeometry(new THREE.Shape(pts), 1);
  geo.rotateX(Math.PI / 2);
  // subdivisión en cuadrícula (la ShapeGeometry sale con triángulos enormes): se rehace
  // como rejilla de 2 m recortada por la caja de la forma (y así sigue bien el relieve sin
  // asomar por encima de aceras, caminos ni arena)
  const box = new THREE.Box3().setFromBufferAttribute(geo.attributes.position);
  const sx = Math.ceil((box.max.x - box.min.x) / 2), sz = Math.ceil((box.max.z - box.min.z) / 2);
  const grid = new THREE.PlaneGeometry(box.max.x - box.min.x, box.max.z - box.min.z, sx, sz);
  grid.rotateX(-Math.PI / 2); grid.translate((box.min.x + box.max.x) / 2, 0, (box.min.z + box.max.z) / 2);
  const m = new THREE.Mesh(lawnGeoFromPositions(grid), lawnMat);
  m.position.y = y; m.receiveShadow = true; scene.add(m);
  return m;
}
// Varios rectángulos de césped (solares de las manzanas) en una sola malla
export function lawnRects(scene, rects, y) {
  const parts = [];
  for (const r of rects) {
    const w = r.x1 - r.x0, d = r.z1 - r.z0;
    const g = new THREE.PlaneGeometry(w, d, Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(d / 6)));
    g.rotateX(-Math.PI / 2); g.translate((r.x0 + r.x1) / 2, 0, (r.z0 + r.z1) / 2);
    parts.push(g.toNonIndexed());
  }
  if (!parts.length) return null;
  const pos = [];
  for (const p of parts) pos.push(...p.attributes.position.array);
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  const m = new THREE.Mesh(lawnGeoFromPositions(geo), lawnMat);
  m.position.y = y; m.receiveShadow = true; scene.add(m);
  return m;
}

// Borde de hierba: una franja de briznas a lo largo de cada línea [x0, z0, x1, z1] (donde el
// césped toca la acera, un camino o la arena), para que la unión no sea una raya recta
export function fringeMesh(scene, lines) {
  tuft(); // asegura el material
  const pos = [], uv = [], nrm = [], idx = [];
  let s0 = 11; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  for (const [x0, z0, x1, z1] of lines) {
    const len = Math.hypot(x1 - x0, z1 - z0); if (len < 0.3) continue;
    const n = Math.ceil(len / 1.1), dx = (x1 - x0) / len, dz = (z1 - z0) / len;
    for (let k = 0; k < n; k++) for (const off of [0.18, 0.36]) { // dos filas metidas en el césped, la de atrás algo más alta
      const a = (k / n) * len, b = Math.min(len, a + len / n + 0.15), h = (off > 0.3 ? 0.17 : 0.11) + rnd() * 0.06;
      const nx = -dz * off, nz = dx * off, i = pos.length / 3, u0 = rnd();
      for (const [t, y, u, v] of [[a, 0, u0, 0], [b, 0, u0 + 0.6, 0], [b, h, u0 + 0.6, 0.95], [a, h, u0, 0.95]]) {
        pos.push(x0 + dx * t + nx, y, z0 + dz * t + nz); uv.push(u, v); nrm.push(0, 1, 0);
      }
      idx.push(i, i + 1, i + 2, i, i + 2, i + 3);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3));
  g.setIndex(idx);
  const m = new THREE.Mesh(g, tuftMat); m.receiveShadow = true; scene.add(m);
  return m;
}

// ---------- matas de hierba en 3D ----------
const bladeTex = () => {
  const c = document.createElement('canvas'); c.width = 128; c.height = 128;
  const g = c.getContext('2d');
  let s0 = 7; const rnd = () => { s0 = (s0 * 9301 + 49297) % 233280; return s0 / 233280; };
  // mata redondeada: briznas más altas en el centro y más bajas a los lados
  for (let k = 0; k < 70; k++) {
    const x = 8 + rnd() * 112, dome = 1 - Math.abs(x - 64) / 64, hgt = 30 + dome * 80 + rnd() * 18, lean = (x - 64) * 0.35 + (rnd() - 0.5) * 16, w = 2 + rnd() * 2.2;
    // brizna con degradado: base oscura y punta clara y cálida (como en la referencia)
    // la base, del mismo verde que el césped (se funde con él); la punta, clara y cálida
    const gr = g.createLinearGradient(0, 128, 0, 128 - hgt);
    gr.addColorStop(0, '#46782a'); gr.addColorStop(0.5, `hsl(${88 + rnd() * 10},${50 + rnd() * 10}%,${36 + rnd() * 8}%)`);
    gr.addColorStop(1, `hsl(${76 + rnd() * 12},${58 + rnd() * 12}%,${52 + rnd() * 10}%)`);
    g.fillStyle = gr;
    g.beginPath(); g.moveTo(x - w, 128); g.quadraticCurveTo(x + lean * 0.3, 128 - hgt * 0.6, x + lean, 128 - hgt); g.quadraticCurveTo(x + lean * 0.3 + w * 0.6, 128 - hgt * 0.55, x + w, 128); g.fill();
  }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return t;
};
let tuftMat = null;
// Mata: tres planos cruzados con briznas recortadas; la luz de cada plano mira hacia arriba
// (normales verticales) para que no se oscurezcan según el ángulo del sol
export function tuft() {
  tuftMat ||= new THREE.MeshStandardMaterial({ map: bladeTex(), alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.9, color: '#f2f7e4' });
  const grp = new THREE.Group();
  const geo = new THREE.PlaneGeometry(0.75, 0.5); geo.translate(0, 0.25, 0);
  const N = geo.attributes.normal; for (let i = 0; i < N.count; i++) N.setXYZ(i, 0, 1, 0);
  for (let k = 0; k < 3; k++) { const m = new THREE.Mesh(geo, tuftMat); m.rotation.y = (k * Math.PI) / 3; grp.add(m); }
  return grp;
}
