// Vitrina de modelos (solo desarrollo): cada modelo en su casilla, encuadrado y visto en
// tres cuartos desde arriba, sobre fondo azul como la lámina de referencia.
import * as THREE from 'three';
import { STREET_KIT, STREET_KIT_2, STREET_KIT_3, STREET_KIT_4, STREET_KIT_5 } from './world/streetkit.js';
import { eclipse } from './world/facades.js';
const BUILDINGS = [['El Eclipse', () => eclipse().group]];

const W = innerWidth, H = innerHeight;
const r = new THREE.WebGLRenderer({ antialias: true });
r.setPixelRatio(1);
r.setSize(W, H);
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
r.setScissorTest(true);
document.body.appendChild(r.domElement);
const items = { 2: STREET_KIT_2, 3: STREET_KIT_3, 4: STREET_KIT_4, 5: STREET_KIT_5, edificios: BUILDINGS }[new URLSearchParams(location.search).get('kit')] || STREET_KIT;
const cols = items.length === 1 ? 1 : items.length <= 10 ? 5 : 6, rows = Math.ceil(items.length / cols), cw = W / cols, ch = H / rows;
const lab = document.getElementById('lab');
items.forEach(([name, fn], i) => {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#24507c');
  scene.add(new THREE.HemisphereLight(0xe6eeff, 0x2a3a55, 1.5));
  const sun = new THREE.DirectionalLight(0xffffff, 2.3);
  sun.position.set(-4, 9, 6); sun.castShadow = true; sun.shadow.mapSize.set(1024, 1024);
  scene.add(sun);
  const g = fn(); g.rotation.y = -0.55; scene.add(g);
  const box = new THREE.Box3().setFromObject(g), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
  const R = size.length() / 2 * 1.04; // esfera que envuelve la caja: cabe entero mire desde donde mire
  Object.assign(sun.shadow.camera, { left: -R * 2, right: R * 2, top: R * 2, bottom: -R * 2 }); sun.target.position.copy(c); scene.add(sun.target);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R * 8, R * 8), new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const cam = new THREE.PerspectiveCamera(28, cw / (ch - 28), 0.01, 200);
  const dir = new THREE.Vector3(0.35, 0.45, 1).normalize();
  // encuadre ajustado: proyecta las 8 esquinas de la caja y corrige distancia y centro hasta
  // que el objeto ocupe el 85 % de la casilla sin salirse por ningún lado
  const corners = [];
  for (const X of [box.min.x, box.max.x]) for (const Y of [box.min.y, box.max.y]) for (const Z of [box.min.z, box.max.z]) corners.push(new THREE.Vector3(X, Y, Z));
  const target = c.clone(); let dist = R / Math.sin((14 * Math.PI) / 180);
  for (let it = 0; it < 8; it++) {
    cam.position.copy(target).addScaledVector(dir, dist); cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix();
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const p of corners) { const q = p.clone().project(cam); x0 = Math.min(x0, q.x); x1 = Math.max(x1, q.x); y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const mid = new THREE.Vector3((x0 + x1) / 2, (y0 + y1) / 2, new THREE.Vector3().copy(target).project(cam).z).unproject(cam);
    target.add(mid.sub(target));
    dist *= Math.max(x1 - x0, y1 - y0) / 2 / 0.9;
  }
  cam.position.copy(target).addScaledVector(dir, dist); cam.lookAt(target);
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  r.setViewport(x, H - y - ch + 28, cw, ch - 28); r.setScissor(x, H - y - ch, cw, ch);
  r.setClearColor('#24507c'); r.clear();
  r.render(scene, cam);
  const d = document.createElement('div'); d.textContent = name;
  d.style.left = x + cw / 2 + 'px'; d.style.top = y + ch - 26 + 'px';
  lab.appendChild(d);
});
window.__ready = true;
