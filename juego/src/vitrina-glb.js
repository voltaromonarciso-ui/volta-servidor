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
// Locales realistas (realbuilding) de muestra
export async function loadLocalItems() {
  const bk = await import('./world/buildingkit.js');
  await bk.loadBuildings();
  const rb = await import('./world/realbuilding.js');
  const fa = await import('./world/facades.js');
  const SK = await import('./world/streetkit.js');
  const list = [
    ['La Esquina', () => rb.shopBuilding({ w: 22, d: 14, floors: 2, wall: 'claro', stone: 'blanco', sign: 'LA ESQUINA', signBg: '#1d4fa8', awning: '#2b7bd1' }).group],
    ['Corte Fino', () => rb.shopBuilding({ w: 16, d: 12, floors: 3, wall: 'ladrilloOscuro', stone: 'claro', sign: 'CORTE FINO', signBg: '#1e1e1e', awning: '#2a2a2a' }).group],
    ['Mercado', () => rb.shopBuilding({ w: 24, d: 14, floors: 1, wall: 'ladrilloRojo', stone: 'claro', sign: 'MERCADO', signBg: '#2e7d32', awning: '#c0392b' }).group],
    ['Oficinas', () => rb.shopBuilding({ w: 18, d: 14, floors: 4, wall: 'enfoscado', stone: 'blanco', sign: 'OFICINAS', signBg: '#34495e', kind: 'oficina', upKind: 'oficina' }).group],
    ['Taller', () => rb.warehouseBuilding({ w: 26, d: 18, h: 8, sign: 'TALLER', signBg: '#1f3a6b' }).group],
    ['Banco Rooktown', () => { const r = rb.bankBranch(); const c = SK.cajero(); c.position.set(r.atm.x, 0, r.atm.z); r.group.add(c); return r.group; }],
    ['El Eclipse', () => { const r = fa.eclipse(); for (const [x, z] of r.planters || []) { const m = SK.macetero(); m.position.set(x, 0, z); r.group.add(m); const p = SK.palmera(); p.position.set(x, 0.55, z); p.scale.setScalar(1.1); r.group.add(p); } return r.group; }],
  ];
  window.__glbInfo = list.map(([n, f]) => { const g = f(); const b = new THREE.Box3().setFromObject(g); let bad = 0; g.traverse((o) => { if (o.isMesh && o.geometry.attributes.position.array.some((v) => !Number.isFinite(v))) bad++; }); return { n, min: b.min.toArray().map((v) => +v.toFixed(1)), max: b.max.toArray().map((v) => +v.toFixed(1)), bad }; });
  const only = new URLSearchParams(location.search).get('only');
  return only ? [list[+only]] : list;
}
