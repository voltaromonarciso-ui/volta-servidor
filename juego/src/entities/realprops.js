// Modelos reales fotoescaneados (Poly Haven, CC0): se cargan bajo demanda, la primera vez que
// hacen falta, y se reutilizan (geometría y texturas compartidas entre copias).
//   prop(parent, 'bleach_bottle', { h: 0.12 })  → hueco que se rellena en cuanto el modelo carga
// Opciones: x, y, z, ry (giro); w / h / d (encajar a ese ancho, alto o fondo, sin deformar);
// fit: [ancho, alto, fondo] (lo más grande que quepa en esa caja);
// s (escala directa); base (apoyado en y; si no, centrado en el origen); onload(group).
// Y texturas de chapa pintada con desgaste para teñir de cualquier color (wornPaint).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { G as GAME } from '../game.js';

const URLS = import.meta.glob('../assets/props/*.glb', { query: '?url', import: 'default', eager: true });
const TEX = import.meta.glob('../assets/props/tex/*.jpg', { query: '?url', import: 'default', eager: true });
const url = (name) => URLS[`../assets/props/${name}.glb`];
const cache = new Map(), ready = new Map();
const loader = new GLTFLoader();

let ENV = null;
function env() {
  if (!ENV && GAME.renderer) { const pm = new THREE.PMREMGenerator(GAME.renderer); ENV = pm.fromScene(new RoomEnvironment(), 0.04).texture; pm.dispose(); }
  return ENV;
}

// Carga una vez: deja la pieza con la base en y = 0 y centrada en x/z, y apunta su tamaño
function load(name) {
  if (!cache.has(name)) {
    const u = url(name);
    cache.set(name, !u ? Promise.reject(new Error('Sin modelo ' + name)) : loader.loadAsync(u).then((g) => {
      const root = g.scene;
      root.updateMatrixWorld(true);
      const box = new THREE.Box3().setFromObject(root), c = box.getCenter(new THREE.Vector3());
      const wrap = new THREE.Group(); wrap.add(root); root.position.set(-c.x, -box.min.y, -c.z);
      root.traverse((o) => {
        if (!o.isMesh) return;
        o.castShadow = true; o.receiveShadow = true;
        for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
          if (m.map) m.map.anisotropy = 4;
          const e = env(); if (e) { m.envMap = e; m.envMapIntensity = m.metalness > 0.5 ? 0.9 : 0.45; }
        }
      });
      const r = { tpl: wrap, size: box.getSize(new THREE.Vector3()) };
      ready.set(name, r);
      return r;
    }));
  }
  return cache.get(name);
}
export const preloadProps = (names) => Promise.all(names.map((n) => load(n).catch(() => null)));

export function prop(parent, name, o = {}) {
  const slot = new THREE.Group();
  slot.position.set(o.x || 0, o.y || 0, o.z || 0); slot.rotation.y = o.ry || 0;
  if (o.rx) slot.rotation.x = o.rx;
  if (o.rz) slot.rotation.z = o.rz;
  parent.add(slot);
  const fill = ({ tpl, size }) => {
    const m = tpl.clone(true);
    let s = o.s || 1;
    if (o.fit) s = Math.min(o.fit[0] / size.x, o.fit[1] / size.y, o.fit[2] / size.z);
    else if (o.h) s = o.h / size.y; else if (o.w) s = o.w / size.x; else if (o.d) s = o.d / size.z;
    m.scale.setScalar(s);
    if (o.base === false) m.position.y = -size.y * s / 2;
    slot.add(m);
    o.onload?.(m, size.clone().multiplyScalar(s));
  };
  // ya cargado: se monta en el acto (así se puede medir enseguida); si no, al cargar
  if (ready.has(name)) fill(ready.get(name)); else load(name).then(fill).catch((e) => console.warn(e.message));
  return slot;
}

// Chapa pintada con su desgaste real (arañazos, golpes, manchas): se tiñe con `color`
const tl = new THREE.TextureLoader(), texs = new Map(), paints = new Map();
function tex(file, srgb, rep) {
  const k = file + rep;
  if (!texs.has(k)) {
    const t = tl.load(TEX[`../assets/props/tex/${file}.jpg`]);
    if (srgb) t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep, rep); t.anisotropy = 4;
    texs.set(k, t);
  }
  return texs.get(k);
}
export function wornPaint(color, { kind = 'pintura', rep = 1, metalness = 0.35, roughness = 1, normal = 1 } = {}) {
  const k = [color, kind, rep, metalness, roughness, normal].join();
  if (!paints.has(k)) {
    const m = new THREE.MeshStandardMaterial({
      color, map: tex(kind + '_diff', true, rep), normalMap: tex(kind + '_nor', false, rep), normalScale: new THREE.Vector2(normal, normal),
      roughnessMap: tex(kind + '_arm', false, rep), metalnessMap: tex(kind + '_arm', false, rep), roughness, metalness,
    });
    const e = env(); if (e) { m.envMap = e; m.envMapIntensity = 0.6; }
    paints.set(k, m);
  }
  return paints.get(k);
}

// Carga diferida: lo que sólo se ve de cerca (la mansión) se pide al acercarse a menos de r
const pending = [];
export function nearLoad(x, z, r, fn) { pending.push({ x, z, r, fn }); }
let nextCheck = 0;
export function tickProps(p, now = performance.now()) {
  if (!pending.length || now < nextCheck) return;
  nextCheck = now + 700;
  for (let i = pending.length - 1; i >= 0; i--) {
    const q = pending[i];
    if ((p.x - q.x) ** 2 + (p.z - q.z) ** 2 < q.r * q.r) { pending.splice(i, 1); q.fn(); }
  }
}
