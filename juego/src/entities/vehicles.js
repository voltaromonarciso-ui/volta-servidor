import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';

// Coches de verdad (modelos CC0 de Quaternius en OpenGameArt). Cada coche es
// una sola malla con una textura-paleta de 32×32: se recolorea la carrocería
// cambiando un color de la paleta, y los faros se encienden de noche.
const files = import.meta.glob('../assets/cars/*.{glb,png}', { query: '?url', import: 'default', eager: true });
const url = (name) => Object.entries(files).find(([p]) => p.endsWith('/' + name))?.[1];

export const CAR_MODELS = ['BasicCar', 'SimpleCarHigh', 'SimpleCarShort'];
const TEX = { Taxi: 'TaxiTexture', CopCar: 'CopTexture' };
const GEOS = {}, PAL = {};
const BODY = [94, 160, 242], GLASS = [90, 235, 235];
// colores que brillan de noche (faros, sirena)
const isLight = (r, g, b) => (r > 230 && g > 215 && b < 120) || (r > 220 && g < 70 && b < 80);
const lightMats = [];

// La compresión guarda posiciones cuantizadas con la escala en el nodo: se pasan
// a coma flotante y se aplica la transformación del nodo a la geometría.
function bake(mesh) {
  const src = mesh.geometry, geo = new THREE.BufferGeometry();
  for (const [k, a] of Object.entries(src.attributes)) {
    const f = new Float32Array(a.count * a.itemSize);
    for (let i = 0; i < a.count; i++) for (let j = 0; j < a.itemSize; j++) f[i * a.itemSize + j] = a.getComponent(i, j);
    geo.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize));
  }
  if (src.index) geo.setIndex(src.index.clone());
  geo.applyMatrix4(mesh.matrixWorld);
  geo.computeBoundingSphere();
  return geo;
}

export async function loadVehicles() {
  const L = new GLTFLoader();
  L.setMeshoptDecoder(MeshoptDecoder);
  const names = [...CAR_MODELS, 'Taxi', 'CopCar'];
  await Promise.all(names.map(async (n) => {
    const u = url(n + '.glb');
    if (!u) return;
    try {
      const g = await L.loadAsync(u);
      g.scene.updateMatrixWorld(true);
      g.scene.traverse((o) => { if (o.isMesh && !GEOS[n]) GEOS[n] = bake(o); });
      if (n === 'BasicCar' && GEOS[n]) GEOS[n].rotateY(Math.PI); // su frente venía al revés
    } catch (e) { console.warn('Coche no disponible', n, e.message); }
  }));
  await Promise.all(['CarTexture', 'TaxiTexture', 'CopTexture'].map(async (t) => {
    const img = new Image();
    img.src = url(t + '.png');
    try { await img.decode(); } catch (e) { return; }
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    const x = c.getContext('2d');
    x.drawImage(img, 0, 0);
    PAL[t] = x.getImageData(0, 0, 32, 32);
  }));
}
export const vehiclesReady = () => Object.keys(GEOS).length > 0 && PAL.CarTexture;

const matCache = new Map();
function carMaterial(model, color) {
  const t = TEX[model] || 'CarTexture';
  const key = t + color;
  if (matCache.has(key)) return matCache.get(key);
  const src = PAL[t];
  const body = new THREE.Color(color);
  const map = new ImageData(32, 32), emi = new ImageData(32, 32);
  for (let i = 0; i < src.data.length; i += 4) {
    let r = src.data[i], g = src.data[i + 1], b = src.data[i + 2];
    const same = (c) => Math.abs(r - c[0]) + Math.abs(g - c[1]) + Math.abs(b - c[2]) < 12;
    if (t === 'CarTexture' && same(BODY)) { r = body.r * 255; g = body.g * 255; b = body.b * 255; }
    else if (same(GLASS)) { r = 34; g = 46; b = 56; } // lunas tintadas
    map.data.set([r, g, b, 255], i);
    const lit = isLight(src.data[i], src.data[i + 1], src.data[i + 2]);
    emi.data.set(lit ? [src.data[i], src.data[i + 1], src.data[i + 2], 255] : [0, 0, 0, 255], i);
  }
  const tex = (d) => {
    const c = document.createElement('canvas');
    c.width = c.height = 32;
    c.getContext('2d').putImageData(d, 0, 0);
    const tx = new THREE.CanvasTexture(c);
    tx.colorSpace = THREE.SRGBColorSpace;
    tx.magFilter = THREE.NearestFilter;
    tx.minFilter = THREE.NearestFilter;
    tx.generateMipmaps = false;
    return tx;
  };
  const m = new THREE.MeshStandardMaterial({ map: tex(map), emissiveMap: tex(emi), emissive: 0xffffff, emissiveIntensity: 0, roughness: 0.3, metalness: 0.3, envMapIntensity: 1.2 });
  lightMats.push(m);
  matCache.set(key, m);
  return m;
}

// Devuelve un grupo con el coche, con el frente hacia +Z y las ruedas en y=0.
export function makeCar(model, color) {
  const geo = GEOS[model] || GEOS.BasicCar;
  const mesh = new THREE.Mesh(geo, carMaterial(GEOS[model] ? model : 'BasicCar', color));
  mesh.castShadow = true;
  mesh.receiveShadow = false;
  const g = new THREE.Group();
  g.add(mesh);
  return g;
}

// Faros: apagados de día, encendidos al anochecer.
export function setCarLights(k) {
  for (const m of lightMats) m.emissiveIntensity = k * 2.2;
}
