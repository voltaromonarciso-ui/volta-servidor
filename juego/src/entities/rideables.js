import * as THREE from 'three';

// Modelos de bici y patinete (miran hacia +z, ruedas apoyadas en y = 0).
// Pocas mallas y materiales compartidos: se pueden ver varios a la vez en móvil.

const mats = {};
const M = (c, o = {}) => (mats[c + JSON.stringify(o)] ||= new THREE.MeshStandardMaterial({ color: c, roughness: 0.55, ...o }));
const tire = () => M('#17181a', { roughness: 0.9 });
const chrome = () => M('#c8ccd0', { roughness: 0.25, metalness: 0.85 });

function tube(a, b, r, mat, parent) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b);
  const len = A.distanceTo(B);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 10), mat);
  m.position.copy(A).add(B).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize());
  m.castShadow = true;
  parent.add(m);
  return m;
}

function wheel(r, w, spokes, parent, z) {
  const g = new THREE.Group();
  const t = new THREE.Mesh(new THREE.TorusGeometry(r - w, w, 10, 32), tire());
  t.rotation.y = Math.PI / 2;
  g.add(t);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(r - w * 2.2, w * 0.35, 6, 32), chrome());
  rim.rotation.y = Math.PI / 2;
  g.add(rim);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(w * 1.2, w * 1.2, w * 3, 10), chrome());
  hub.rotation.z = Math.PI / 2;
  g.add(hub);
  for (let i = 0; i < spokes; i++) {
    const a = (i / spokes) * Math.PI * 2;
    tube([0, 0, 0], [0, Math.sin(a) * (r - w * 2.2), Math.cos(a) * (r - w * 2.2)], 0.004, chrome(), g);
  }
  g.position.set(0, r, z);
  g.traverse((o) => { if (o.isMesh) o.castShadow = true; });
  parent.add(g);
  return g;
}

export function buildBike(color = '#c0392b') {
  const g = new THREE.Group();
  const frame = M(color, { roughness: 0.35, metalness: 0.3 });
  const R = 0.34;
  const back = wheel(R, 0.022, 16, g, -0.52), front = wheel(R, 0.022, 16, g, 0.52);
  // cuadro en diamante
  const bb = [0, 0.3, -0.04], seat = [0, 0.86, -0.2], head = [0, 0.86, 0.36], rear = [0, R, -0.52], fork = [0, R, 0.52];
  tube(bb, seat, 0.02, frame, g);
  tube(seat, head, 0.019, frame, g);
  tube(bb, head, 0.022, frame, g);
  tube(bb, rear, 0.014, frame, g);
  tube(seat, rear, 0.013, frame, g);
  tube(head, fork, 0.016, chrome(), g);
  // sillín, manillar con puños, bielas y pedales
  tube(seat, [0, 0.96, -0.24], 0.012, chrome(), g);
  const sad = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.05, 0.26), M('#1b1b1e', { roughness: 0.8 }));
  sad.position.set(0, 0.98, -0.25); g.add(sad);
  tube(head, [0, 1.02, 0.32], 0.014, chrome(), g);
  tube([-0.24, 1.02, 0.32], [0.24, 1.02, 0.32], 0.012, chrome(), g);
  for (const s of [-1, 1]) tube([s * 0.24, 1.02, 0.32], [s * 0.3, 1.02, 0.31], 0.02, M('#1b1b1e', { roughness: 0.9 }), g);
  const crank = new THREE.Group(); crank.position.set(0, 0.3, -0.04); g.add(crank);
  for (const s of [-1, 1]) {
    tube([s * 0.06, 0, 0], [s * 0.06, s * 0.15, 0], 0.01, chrome(), crank);
    const pedal = new THREE.Mesh(new THREE.BoxGeometry(0.09, 0.02, 0.06), M('#222'));
    pedal.position.set(s * 0.1, s * 0.15, 0); crank.add(pedal);
  }
  const chain = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.008, 6, 20), chrome());
  chain.rotation.y = Math.PI / 2; chain.position.set(0.05, 0.3, -0.04); g.add(chain);
  g.userData = { wheels: [back, front], wheelR: R, crank, seatY: 0.98, handle: [0, 1.02, 0.32] };
  return g;
}

export function buildScooter(color = '#2e86de') {
  const g = new THREE.Group();
  const body = M(color, { roughness: 0.4, metalness: 0.25 });
  const R = 0.11;
  const back = wheel(R, 0.03, 0, g, -0.42), front = wheel(R, 0.03, 0, g, 0.42);
  const deck = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.05, 0.78), M('#2b2f35', { roughness: 0.7 }));
  deck.position.set(0, 0.14, -0.02); deck.castShadow = true; g.add(deck);
  const trim = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.03, 0.8), body);
  trim.position.set(0, 0.11, -0.02); g.add(trim);
  tube([0, 0.16, 0.36], [0, 1.08, 0.46], 0.022, body, g);
  tube([0, R, 0.42], [0, 0.2, 0.39], 0.018, chrome(), g);
  tube([0, R, -0.42], [0, 0.17, -0.3], 0.016, chrome(), g);
  tube([-0.25, 1.08, 0.46], [0.25, 1.08, 0.46], 0.014, M('#1b1b1e'), g);
  // faro y luz de batería
  const lamp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.03, 12), new THREE.MeshBasicMaterial({ color: 0xfff6d0, toneMapped: false }));
  lamp.rotation.x = Math.PI / 2; lamp.position.set(0, 0.95, 0.47); g.add(lamp);
  const led = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.03), new THREE.MeshBasicMaterial({ color: 0x2ecc71, toneMapped: false }));
  led.position.set(0, 1.1, 0.46); g.add(led);
  g.userData = { wheels: [back, front], wheelR: R, led, deckY: 0.17, handle: [0, 1.08, 0.46] };
  return g;
}
