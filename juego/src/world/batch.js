import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

// Agrupa toda la geometría estática en pocas mallas (por material y por zona)
// con colores por vértice y oclusión ambiental falsa cerca del suelo.
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler();
const _p = new THREE.Vector3(), _s = new THREE.Vector3(), _c = new THREE.Color();

export const GEO = {
  box: new THREE.BoxGeometry(1, 1, 1),
  cyl6: new THREE.CylinderGeometry(0.5, 0.5, 1, 6),
  cyl8: new THREE.CylinderGeometry(0.5, 0.5, 1, 8),
  cyl12: new THREE.CylinderGeometry(0.5, 0.5, 1, 12),
  cyl16: new THREE.CylinderGeometry(0.5, 0.5, 1, 16),
  cone6: new THREE.ConeGeometry(0.5, 1, 6),
  cone8: new THREE.ConeGeometry(0.5, 1, 8),
  ico: new THREE.IcosahedronGeometry(0.5, 0),
  ico1: new THREE.IcosahedronGeometry(0.5, 1),
  sphere: new THREE.SphereGeometry(0.5, 12, 8),
  plane: new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
};

export const MAT = {
  solid: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.86, metalness: 0 }),
  metal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.55 }),
  glass: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.08, metalness: 0.3 }),
  foliage: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, side: THREE.DoubleSide }),
  glow: new THREE.MeshBasicMaterial({ vertexColors: true, toneMapped: false }),
  // interiores iluminados: el color del vértice también emite luz (tiendas)
  lit: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.7, metalness: 0 }),
  litMetal: new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.35, metalness: 0.5 }),
};
export const LIT = { value: 0.4 };
for (const m of [MAT.lit, MAT.litMetal]) {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uLit = LIT;
    sh.fragmentShader = 'uniform float uLit;\n' + sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n  totalEmissiveRadiance += vColor.rgb * uLit;');
  };
  m.customProgramCacheKey = () => 'lit';
}

export class StaticBatch {
  constructor(chunk = 60) {
    this.chunk = chunk;
    this.buckets = new Map();
  }

  // opts: { mat, shadow, jitter, rx, rz, ao, aoH }
  add(geo, color, x, y, z, sx = 1, sy = 1, sz = 1, ry = 0, opts = {}) {
    const mat = typeof opts.mat === 'string' ? MAT[opts.mat] : opts.mat || MAT.solid;
    let g = geo.index ? geo.toNonIndexed() : geo.clone();
    _e.set(opts.rx || 0, ry, opts.rz || 0);
    _q.setFromEuler(_e);
    _p.set(x, y, z);
    _s.set(sx, sy, sz);
    _m.compose(_p, _q, _s);
    g.applyMatrix4(_m);
    if (!mat.map && g.attributes.uv) g.deleteAttribute('uv');
    if (mat.map && opts.uvScale) {
      const uv = g.attributes.uv;
      for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * opts.uvScale[0], uv.getY(i) * opts.uvScale[1]);
    }
    const n = g.attributes.position.count;
    const pos = g.attributes.position;
    const cols = new Float32Array(n * 3);
    _c.set(color);
    if (opts.jitter) _c.offsetHSL(0, 0, (Math.random() - 0.5) * opts.jitter);
    const ao = opts.ao ?? 0.32, aoH = opts.aoH ?? 1.3;
    for (let i = 0; i < n; i++) {
      const f = ao ? 1 - ao * (1 - Math.min(1, Math.max(0, pos.getY(i) / aoH))) : 1;
      cols[i * 3] = _c.r * f; cols[i * 3 + 1] = _c.g * f; cols[i * 3 + 2] = _c.b * f;
    }
    g.setAttribute('color', new THREE.BufferAttribute(cols, 3));
    const shadow = opts.shadow !== false && mat !== MAT.glow;
    // opts.global: un único lote para toda la ciudad (piezas pequeñas repartidas, p. ej. luces de semáforo)
    const key = mat.uuid + '|' + (opts.global ? 'all' : Math.floor(x / this.chunk) + ',' + Math.floor(z / this.chunk)) + (shadow ? 's' : 'n');
    if (!this.buckets.has(key)) this.buckets.set(key, { mat, shadow, list: [] });
    this.buckets.get(key).list.push(g);
  }

  // Caja con la base en y0.
  box(color, x, y0, z, w, h, d, ry = 0, opts) {
    this.add(GEO.box, color, x, y0 + h / 2, z, w, h, d, ry, opts);
  }

  build(parent) {
    const meshes = [];
    for (const { mat, shadow, list } of this.buckets.values()) {
      const geo = mergeGeometries(list, false);
      geo.computeBoundingSphere();
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = shadow;
      mesh.receiveShadow = mat !== MAT.glow;
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
