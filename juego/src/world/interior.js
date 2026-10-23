// Modelos de interior (Kenney, CC0: Furniture Kit, Mini Market, Survival Kit, Car Kit, Retro
// Urban Kit y Factory Kit) para amueblar los almacenes: sofás, escritorios, sillas, ordenadores,
// teles, neveras, plantas, bidones, cajas, palés, la furgoneta… Se cargan al arrancar; el mundo
// pide piezas con place() mientras se construye y build() las convierte en mallas instanciadas
// (una por pieza y material), así cientos de objetos cuestan muy pocas llamadas de dibujo.
//
// Cada modelo se recoloca con el centro de su base en el origen y el frente hacia +z; el tamaño
// es el del kit por su escala (el Furniture Kit viene a mitad de tamaño: escala 2).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const GLBS = import.meta.glob('../assets/interior/*/*.glb', { query: '?url', import: 'default', eager: true });
const TEX = import.meta.glob('../assets/interior/*/Textures/*.png', { query: '?url', import: 'default', eager: true });
const KIT_SCALE = { furniture: 2, market: 1.15, survival: 2.6, cars: 1.75, retro: 1.2, factory: 1, luxhi: 0.005, luxuf: 0.01 }; // (Quaternius: en centímetros; el de interior viene al doble)
const MODELS = {};
// el Furniture Kit trae la tapicería rosa: en la oficina, gris oscuro y azul pizarra
const TINT = { carpet: '#3f4650', carpetDarker: '#30363e', carpetWhite: '#c4c8cc', wood: '#6e5340', woodDark: '#4a3729', metal: '#8a939b', metalLight: '#c2c7cc', metalMedium: '#5d666e', metalDark: '#3a4047' }; // (tonos sobrios: madera oscura, metal gris)
let items = [];

export const interiorReady = () => Object.keys(MODELS).length > 0;

export async function loadInterior() {
  const jobs = Object.entries(GLBS).map(async ([path, url]) => {
    const [, kit, file] = path.match(/interior\/([^/]+)\/([^/]+)\.glb$/);
    // las texturas van aparte (Textures/colormap.png…): se buscan entre las del mismo kit
    const man = new THREE.LoadingManager();
    man.setURLModifier((u) => (/\.png$/i.test(u) ? TEX[`../assets/interior/${kit}/Textures/${u.split('/').pop()}`] || u : u));
    const gltf = await new GLTFLoader(man).loadAsync(url);
    gltf.scene.updateMatrixWorld(true);
    const byMat = new Map();
    gltf.scene.traverse((o) => {
      if (!o.isMesh) return;
      const geo = o.geometry.clone().applyMatrix4(o.matrixWorld);
      for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv'].includes(k)) geo.deleteAttribute(k);
      const m = o.material;
      if (!byMat.has(m)) byMat.set(m, []);
      byMat.get(m).push(geo.index ? geo.toNonIndexed() : geo);
    });
    const parts = [];
    for (const [m, list] of byMat) {
      const geo = list.length > 1 ? mergeGeometries(list) : list[0];
      const mat = m.clone();
      if (kit === 'furniture' && TINT[m.name]) mat.color.set(TINT[m.name]); // tapicería en tonos de oficina
      // lavadoras y secadoras blancas, con el ojo de buey de cristal oscuro
      if (/^(washer|dryer|washerDryerStacked)$/.test(file)) { if (m.name === 'metalLight') mat.color.set('#f4f5f6'); else if (m.name === 'metal') mat.color.set('#d9dde1'); else if (m.name === 'glass') mat.color.set('#3c4a56'); }
      if (kit.startsWith('lux')) {
        // (Quaternius, convertidos de FBX: vienen transparentes y con el color oscurecido dos veces)
        mat.transparent = false; mat.opacity = 1; mat.depthWrite = true;
        mat.color.convertLinearToSRGB();
        if (/^light$/i.test(m.name)) mat.emissive.set('#ffd9a0'), (mat.emissiveIntensity = 1.4);
        else mat.emissive.set(0);
      }
      mat.roughness = Math.max(0.45, mat.roughness ?? 0.7); mat.metalness = Math.min(0.3, mat.metalness ?? 0);
      if (mat.map) { mat.map.colorSpace = THREE.SRGBColorSpace; mat.map.anisotropy = 4; }
      parts.push({ geo, mat });
    }
    // base centrada en el origen y apoyada en y = 0
    const box = new THREE.Box3();
    for (const p of parts) { p.geo.computeBoundingBox(); box.union(p.geo.boundingBox); }
    const c = box.getCenter(new THREE.Vector3());
    for (const p of parts) { p.geo.translate(-c.x, -box.min.y, -c.z); p.geo.computeVertexNormals(); }
    const k = KIT_SCALE[kit] || 1;
    MODELS[`${kit}/${file}`] = { parts, size: [(box.max.x - box.min.x) * k, (box.max.y - box.min.y) * k, (box.max.z - box.min.z) * k], k };
  });
  await Promise.all(jobs);
}

// Tamaño [ancho, alto, fondo] de una pieza a su escala (para colisiones y para apilar)
export function dims(name, s = 1) {
  const m = MODELS[name];
  return m ? m.size.map((v) => v * s) : [0, 0, 0];
}

// Pide una pieza: (x, z) en el mundo, y sobre el suelo (el relieve se suma después), giro ry
export function place(name, x, y, z, ry = 0, s = 1) {
  if (!MODELS[name]) return false;
  items.push({ name, x, y, z, ry, s });
  return true;
}

// Monta lo pedido como mallas instanciadas y vacía la lista
export function build(scene) {
  const by = new Map();
  for (const it of items) { if (!by.has(it.name)) by.set(it.name, []); by.get(it.name).push(it); }
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), pos = new THREE.Vector3(), sc = new THREE.Vector3();
  let meshes = 0;
  for (const [name, list] of by) {
    const M = MODELS[name];
    for (const p of M.parts) {
      const im = new THREE.InstancedMesh(p.geo, p.mat, list.length);
      list.forEach((it, i) => {
        const k = M.k * it.s;
        m4.compose(pos.set(it.x, it.y, it.z), q.setFromAxisAngle(up, it.ry), sc.set(k, k, k));
        im.setMatrixAt(i, m4);
      });
      im.castShadow = true; im.receiveShadow = true;
      im.instanceMatrix.needsUpdate = true;
      im.computeBoundingSphere();
      scene.add(im);
      meshes++;
    }
  }
  const n = items.length;
  items = [];
  return { pieces: n, meshes };
}
