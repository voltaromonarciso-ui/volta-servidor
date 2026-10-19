// Vitrina de modelos GLB (solo desarrollo): comprueba que cargan bien en three.js, su tamaño,
// sus vértices y sus materiales. Uso: vitrina.html?glb=a.glb,b.glb (de public/models/buildings).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
export async function loadGlbItems(names) {
  const loader = new GLTFLoader();
  const out = [];
  for (const n of names) {
    const gltf = await loader.loadAsync('/models/buildings/' + n);
    const g = gltf.scene;
    let verts = 0, mats = new Set(), tex = 0;
    g.traverse((o) => { if (o.isMesh) { verts += o.geometry.attributes.position.count; (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => { mats.add(m); if (m.map) tex++; }); } });
    const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3());
    window.__glbInfo = window.__glbInfo || [];
    window.__glbInfo.push({ n, verts, mats: mats.size, tex, size: size.toArray().map((v) => +v.toFixed(2)) });
    out.push([n.replace('.glb', ''), () => g]);
  }
  return out;
}
// Edificios tal como los prepara el juego (buildingkit: escala, re-texturizado…)
export async function loadKitItems() {
  const bk = await import('./world/buildingkit.js');
  await bk.loadBuildings();
  const names = Object.keys(import.meta.glob('./assets/buildings/*.glb')).map((p) => p.split('/').pop().replace('.glb', '')).sort();
  return names.map((n) => [n, bk.buildingModel(n)]);
}
