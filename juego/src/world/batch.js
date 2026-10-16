import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Agrupa toda la geometría estática en pocas mallas con colores por vértice
// (estilo low-poly plano y muy pocas llamadas de dibujo, ideal para móvil).
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cyl12: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cone6: new THREE.ConeGeometry(0.5, 1, 6),
  cone8: new THREE.ConeGeometry(0.5, 1, 8),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  ico1: new THREE.IcosahedronGeometry(0.5, 1),
  prism: new THREE.CylinderGeometry(0.5, 0.5, 1, 3),
  sphere: new THREE.SphereGeometry(0.5, 8, 6),
};

export const flatMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

export class StaticBatch {
  constructor(chunk = 60) {
    this.chunk = chunk;
    this.buckets = new Map();
  }

  // geo: geometría base, color: hex, pos/rot/escala, opts: {shadow, jitter, rx, rz}
  add(geo, color, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, opts = {}) {
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    _e.set(opts.rx || 0, ry, opts.rz || 0);
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    _s.set(sx, sy, sz);
    _m.compose(_p, _q, _s);
    g.applyMatrix4(_m);
    if (g.attributes.uv) g.deleteAttribute('uv');
    const n = g.attributes.position.count;
    const cols = new Float32Array(n * 3);
    _c.set(color);
    if (opts.jitter) _c.offsetHSL(0, 0, (Math.random() - 0.5) * opts.jitter);
    for (let i = 0; i < n; i++) { cols[i * 3] = _c.r; cols[i * 3 + 1] = _c.g; cols[i * 3 + 2] = _c.b; }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const shadow = opts.shadow !== false;
    const key = Math.floor(x / this.chunk) + ',' + Math.floor(z / this.chunk) + (shadow ? 's' : 'n');
    if (!this.buckets.has(key)) this.buckets.set(key, []);
    this.buckets.get(key).push(g);
  }

  // Caja con la base en y0 (más cómodo para construir).
  box(color, x, y0, z, w, h, d, ry = 0, opts) {
    this.add(GEO.box, color, x, y0 + h / 2, z, w, h, d, ry, opts);
  }

  build(parent) {
    const meshes = [];
    for (const [key, list] of this.buckets) {
      const geo = mergeGeometries(list, false);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, flatMat);
      mesh.castShadow = key.endsWith('s');
      mesh.receiveShadow = true;
      mesh.matrixAutoUpdate = false;
      mesh.updateMatrix();
      parent.add(mesh);
      meshes.push(mesh);
      list.forEach((g) => g.dispose());
    }
    this.buckets.clear();
    return meshes;
  }
}
