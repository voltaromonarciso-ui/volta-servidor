// Colocación del mobiliario urbano (streetkit.js) en el mapa sin disparar las llamadas de
// dibujo: cada modelo se descompone una vez en sus piezas por material; al construir, todas
// las copias de un mismo sector se funden en una sola malla por material. Los materiales
// lisos (sin textura, sin transparencia y sin luz propia) se cuecen como color por vértice
// en dos materiales compartidos (mate y metálico), así un sector entero cuesta unas pocas
// llamadas aunque tenga cientos de objetos. Las colisiones salen de la caja de cada modelo.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { H } from './terrain.js';

const SECTOR = 120; // m: tamaño de la celda que se funde en una malla (y que se descarta fuera de cámara)
const plain = {
  matte: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.65, metalness: 0.08 }),
  metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.4, metalness: 0.55 }),
};
const isPlain = (m) => !m.map && !m.transparent && !m.alphaTest && !(m.emissiveIntensity > 0 && m.emissive && m.emissive.getHex() !== 0) && m.side !== THREE.DoubleSide;

const protos = new Map();
// Piezas de un modelo: [{ mat, geo }] ya en coordenadas del modelo, más su caja
function proto(key, fn) {
  if (protos.has(key)) return protos.get(key);
  const root = fn();
  root.updateMatrixWorld(true);
  const groups = new Map();
  root.traverse((o) => {
    if (!o.isMesh) return;
    const m = o.material;
    let geo = o.geometry.clone();
    geo.applyMatrix4(o.matrixWorld);
    let target = m;
    if (isPlain(m)) {
      target = m.metalness >= 0.4 ? plain.metal : plain.matte;
      // color del material cocido en el vértice (multiplicado por el que ya tuviera)
      const n = geo.attributes.position.count, col = new Float32Array(n * 3), prev = m.vertexColors && geo.attributes.color;
      for (let i = 0; i < n; i++) {
        const k = prev ? [prev.getX(i), prev.getY(i), prev.getZ(i)] : [1, 1, 1];
        col[i * 3] = m.color.r * k[0]; col[i * 3 + 1] = m.color.g * k[1]; col[i * 3 + 2] = m.color.b * k[2];
      }
      geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    }
    if (!groups.has(target)) groups.set(target, []);
    groups.get(target).push(geo);
  });
  const parts = [];
  for (const [mat, list] of groups) parts.push({ mat, geo: mergeAll(list, mat) });
  const box = new THREE.Box3().setFromObject(root);
  const p = { parts, box, glow: [...groups.keys()].filter((m) => m.userData.glow) };
  protos.set(key, p);
  return p;
}

// Funde geometrías que comparten material: deja solo los atributos que el material usa y
// rellena los que falten (uv a cero, color blanco); todas indexadas para poder unirlas
function mergeAll(list, mat) {
  const want = ['position', 'normal'];
  if (mat.map || mat.alphaMap) want.push('uv');
  if (mat.vertexColors) want.push('color');
  const out = list.map((g) => {
    const n = g.attributes.position.count;
    for (const name of Object.keys(g.attributes)) if (!want.includes(name)) g.deleteAttribute(name);
    if (!g.attributes.normal) g.computeVertexNormals();
    if (want.includes('uv') && !g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n * 2), 2));
    if (want.includes('color') && !g.attributes.color) g.setAttribute('color', new THREE.BufferAttribute(new Float32Array(n * 3).fill(1), 3));
    if (!g.index) g.setIndex([...Array(n).keys()]);
    g.morphAttributes = {};
    return g;
  });
  return out.length === 1 ? out[0] : mergeGeometries(out);
}

// Colocador: se le van dando objetos y al final se construyen las mallas
export function createFurniture({ addBox } = {}) {
  const list = [];
  const used = new Set();
  const glowMats = new Set();
  const api = {
    count: () => list.length,
    // vértices por modelo (copias × vértices de una copia), para medir el coste
    report: () => [...used].map((p) => [p.key, p.n, p.n * p.parts.reduce((a, q) => a + q.geo.attributes.position.count, 0)]).sort((a, b) => b[2] - a[2]),
    // key: nombre único del modelo; fn: función de streetkit; ry: giro (el frente del modelo mira a +z)
    place(key, fn, x, z, ry = 0, { solid = true, y = 0, s = 1, hit = 0 } = {}) {
      const p = proto(key, fn);
      list.push({ p, x, y, z, ry, s });
      p.glow.forEach((m) => glowMats.add(m));
      if (solid && addBox && hit) addBox(x - hit / 2, x + hit / 2, z - hit / 2, z + hit / 2, p.box.max.y * s);
      else if (solid && addBox) {
        const b = p.box, c = Math.cos(ry), sn = Math.sin(ry);
        if (b.max.y - b.min.y > 0.25) {
          let x0 = 1e9, x1 = -1e9, z0 = 1e9, z1 = -1e9;
          for (const lx of [b.min.x, b.max.x]) for (const lz of [b.min.z, b.max.z]) {
            const wx = x + (lx * c + lz * sn) * s, wz = z + (-lx * sn + lz * c) * s;
            x0 = Math.min(x0, wx); x1 = Math.max(x1, wx); z0 = Math.min(z0, wz); z1 = Math.max(z1, wz);
          }
          addBox(x0, x1, z0, z1, b.max.y * s);
        }
      }
      p.n = (p.n || 0) + 1; p.key = key; used.add(p);
      return p.box;
    },
    // Funde todo en mallas por sector y material y las añade a la escena
    build(scene) {
      const cells = new Map();
      for (const it of list) {
        const key = `${Math.floor(it.x / SECTOR)},${Math.floor(it.z / SECTOR)}`;
        if (!cells.has(key)) cells.set(key, new Map());
        const byMat = cells.get(key);
        for (const part of it.p.parts) {
          if (!byMat.has(part.mat)) byMat.set(part.mat, []);
          byMat.get(part.mat).push({ geo: part.geo, it });
        }
      }
      const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0);
      let meshes = 0, verts = 0;
      for (const byMat of cells.values()) for (const [mat, items] of byMat) {
        const geos = items.map(({ geo, it }) => {
          q.setFromAxisAngle(up, it.ry);
          m4.compose(new THREE.Vector3(it.x, it.y + H(it.x, it.z), it.z), q, new THREE.Vector3(it.s, it.s, it.s)); // apoyado en el relieve
          return geo.clone().applyMatrix4(m4);
        });
        const merged = geos.length === 1 ? geos[0] : mergeGeometries(geos);
        geos.forEach((g) => g !== merged && g.dispose());
        const mesh = new THREE.Mesh(merged, mat);
        mesh.castShadow = !mat.transparent;
        mesh.receiveShadow = true;
        mesh.matrixAutoUpdate = false;
        scene.add(mesh);
        meshes++; verts += merged.attributes.position.count;
      }
      // las luces del mobiliario se encienden con las farolas (sky.js)
      for (const m of glowMats) m.userData.ei0 ??= m.emissiveIntensity;
      return { meshes, verts, glowMats: [...glowMats] };
    },
  };
  return api;
}
