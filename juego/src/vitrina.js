// Vitrina de modelos (solo desarrollo): cada modelo en su casilla, encuadrado y visto en
// tres cuartos desde arriba, sobre fondo azul como la lámina de referencia.
import * as THREE from 'three';
import { STREET_KIT, STREET_KIT_2, STREET_KIT_3 } from './world/streetkit.js';

const W = innerWidth, H = innerHeight;
const r = new THREE.WebGLRenderer({ antialias: true });
r.setPixelRatio(1);
r.setSize(W, H);
r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
r.toneMapping = THREE.ACESFilmicToneMapping; r.outputColorSpace = THREE.SRGBColorSpace;
r.setScissorTest(true);
document.body.appendChild(r.domElement);
const items = { 2: STREET_KIT_2, 3: STREET_KIT_3 }[new URLSearchParams(location.search).get('kit')] || STREET_KIT;
const cols = 6, rows = Math.ceil(items.length / cols), cw = W / cols, ch = H / rows;
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
  const R = Math.max(Math.max(size.x, size.z) * 0.6, size.y * 0.6) + 0.05; // que quepa entero, también lo alto
  Object.assign(sun.shadow.camera, { left: -R * 2, right: R * 2, top: R * 2, bottom: -R * 2 }); sun.target.position.copy(c); scene.add(sun.target);
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(R * 8, R * 8), new THREE.ShadowMaterial({ opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const cam = new THREE.PerspectiveCamera(28, cw / (ch - 28), 0.01, 100);
  const dir = new THREE.Vector3(0.35, 0.45, 1).normalize();
  cam.position.copy(c).addScaledVector(dir, R / Math.sin((28 * Math.PI) / 360));
  cam.lookAt(c);
  const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
  r.setViewport(x, H - y - ch + 28, cw, ch - 28); r.setScissor(x, H - y - ch, cw, ch);
  r.setClearColor('#24507c'); r.clear();
  r.render(scene, cam);
  const d = document.createElement('div'); d.textContent = name;
  d.style.left = x + cw / 2 + 'px'; d.style.top = y + ch - 26 + 'px';
  lab.appendChild(d);
});
window.__ready = true;
