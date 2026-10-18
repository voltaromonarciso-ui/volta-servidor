import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import propsUrl from '../assets/props/props.glb?url';
import colormapUrl from '../assets/props/colormap.png?url';

// Productos de tienda (Kenney Food Kit, CC0): latas, botellas, cartones,
// chocolatinas, bollería… Todos comparten una textura, y cada tipo se dibuja
// con una sola malla instanciada aunque haya cientos repartidos por la ciudad.
const SCALE = 0.36; // el kit viene a escala de juguete: así una lata mide 12 cm
const GEO = {}, SIZE = {};
let material = null;
const placed = new Map();

function bake(mesh) {
  const src = mesh.geometry, geo = new THREE.BufferGeometry();
  for (const k of ['position', 'normal', 'uv']) {
    const a = src.attributes[k];
    if (!a) continue;
    const f = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let j = 0; j < a.itemSize; j++) f[i * a.itemSize + j] = a.getComponent(i, j);
    geo.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize));
  }
  if (src.index) geo.setIndex(src.index.clone());
  geo.applyMatrix4(mesh.matrixWorld);
  return geo.index ? geo.toNonIndexed() : geo;
}

export async function loadProps() {
  const L = new GLTFLoader();
  L.setMeshoptDecoder(MeshoptDecoder);
  // la textura se carga aparte (más fiable que la incrustada en el GLB)
  const [g, map] = await Promise.all([L.loadAsync(propsUrl), new THREE.TextureLoader().loadAsync(colormapUrl)]);
  map.colorSpace = THREE.SRGBColorSpace;
  map.flipY = false;
  // un poco de luz propia: los interiores de las tiendas están iluminados
  material = new THREE.MeshStandardMaterial({ map, emissiveMap: map, emissive: 0xffffff, emissiveIntensity: 0.3, roughness: 0.55, metalness: 0.05 });
  for (const sc of g.scenes) {
    sc.updateMatrixWorld(true);
    const parts = [];
    sc.traverse((o) => {
      if (!o.isMesh) return;
      parts.push(bake(o));

    });
    if (!parts.length) continue;
    const geo = mergeGeometries(parts);
    geo.scale(SCALE, SCALE, SCALE);
    geo.computeBoundingBox();
    const b = geo.boundingBox;
    geo.translate(-(b.min.x + b.max.x) / 2, -b.min.y, -(b.min.z + b.max.z) / 2);
    geo.computeBoundingBox();
    GEO[sc.name] = geo;
    SIZE[sc.name] = geo.boundingBox.getSize(new THREE.Vector3());
  }
}
export const propsReady = () => !!material && Object.keys(GEO).length > 0;
export const propSize = (name) => SIZE[name];
export const hasProp = (name) => !!GEO[name];

const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1), _y = new THREE.Vector3(0, 1, 0);
// Coloca un producto (la base en y). Se acumulan y se crean al final con buildProps().
// desplazamiento para las piezas del mapa antiguo recolocadas en la isla (world.relocated)
let OX = 0, OZ = 0;
export function setPropOffset(x, z) { OX = x; OZ = z; }

export function addProp(name, x, y, z, ry = 0, s = 1) {
  if (!GEO[name]) return false;
  x += OX; z += OZ;
  _q.setFromAxisAngle(_y, ry);
  _s.setScalar(s);
  _m.compose(_p.set(x, y, z), _q, _s);
  if (!placed.has(name)) placed.set(name, []);
  placed.get(name).push(_m.clone());
  return true;
}

export function buildProps(scene) {
  for (const [name, mats] of placed) {
    const im = new THREE.InstancedMesh(GEO[name], material, mats.length);
    mats.forEach((m, i) => im.setMatrixAt(i, m));
    im.instanceMatrix.needsUpdate = true;
    im.computeBoundingSphere();
    im.castShadow = false;
    im.receiveShadow = false;
    im.matrixAutoUpdate = false;
    scene.add(im);
  }
  placed.clear();
}

// Luz propia de los productos según la hora (la misma que la de los interiores).
export function setPropsLight(v) { if (material) material.emissiveIntensity = v; }
