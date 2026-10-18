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
  cb_Building_1_A: { w: 12.4 }, cb_Building_1_D: { w: 12.4 }, cb_Building_2_A: { w: 12.3 }, cb_Building_2_C: { w: 12.3 },
  cb_Building_3_A: { w: 30 }, cb_Building_5_A: { w: 24 },
};
const MODELS = {};

export async function loadBuildings() {
  const L = new GLTFLoader();
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
