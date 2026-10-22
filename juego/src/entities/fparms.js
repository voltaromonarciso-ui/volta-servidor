// Brazos en primera persona con el modelo del propio personaje: su piel, sus manos y la
// manga de la ropa que lleva. Es una copia del personaje en la escena de las manos (cámara
// fija en el origen mirando a -z) con la cabeza y las piernas recogidas; los ojos quedan en
// la cámara, así el torso queda siempre por debajo de lo que se ve.
//
// Cada fotograma: la animación real del personaje da la postura de los dedos (sujetar el
// móvil para una mano, dar algo para las dos) y una cinemática inversa de dos huesos lleva
// cada muñeca al punto de agarre (con el codo hacia abajo y afuera); la mano se orienta como
// la mano de referencia de hands.js.
import * as THREE from 'three';
import { makeAvatar } from './avatar.js';

const _a = new THREE.Vector3(), _b = new THREE.Vector3(), _c = new THREE.Vector3(), _d = new THREE.Vector3();
const _e = new THREE.Vector3();
// Distancia mínima entre los segmentos p1-q1 y p2-q2 (para que los brazos no se atraviesen)
function segDist(p1, q1, p2, q2) {
  const d1 = q1.clone().sub(p1), d2 = q2.clone().sub(p2), r = p1.clone().sub(p2);
  const a = d1.dot(d1), e = d2.dot(d2), f = d2.dot(r), c = d1.dot(r), b = d1.dot(d2), den = a * e - b * b;
  let s = den > 1e-9 ? THREE.MathUtils.clamp((b * f - c * e) / den, 0, 1) : 0;
  let t = (b * s + f) / e;
  if (t < 0) { t = 0; s = THREE.MathUtils.clamp(-c / a, 0, 1); } else if (t > 1) { t = 1; s = THREE.MathUtils.clamp((b - c) / a, 0, 1); }
  return p1.clone().addScaledVector(d1, s).distanceTo(p2.clone().addScaledVector(d2, t));
}
const _q = new THREE.Quaternion(), _q2 = new THREE.Quaternion(), _m = new THREE.Matrix4();
const wp = (o, v = new THREE.Vector3()) => o.getWorldPosition(v);

// Gira un hueso (en el mundo) para que la dirección `from` pase a ser `to`
function turn(bone, from, to) {
  if (from.lengthSq() < 1e-10 || to.lengthSq() < 1e-10) return;
  _q.setFromUnitVectors(from.clone().normalize(), to.clone().normalize());
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(_q.multiply(wq)));
  bone.updateMatrixWorld(true);
}

// Cinemática inversa de dos huesos: hombro → codo → muñeca hasta `target`; `pole` marca
// hacia dónde se dobla el codo
function ik(upper, lower, hand, target, pole) {
  const S = wp(upper), E = wp(lower), Wr = wp(hand);
  const a = S.distanceTo(E), b = E.distanceTo(Wr);
  const dir = _a.copy(target).sub(S);
  const c = THREE.MathUtils.clamp(dir.length(), Math.abs(a - b) + 1e-3, a + b - 1e-3);
  dir.normalize();
  const cosA = THREE.MathUtils.clamp((a * a + c * c - b * b) / (2 * a * c), -1, 1), sinA = Math.sqrt(1 - cosA * cosA);
  const p = _b.copy(pole).sub(S); p.addScaledVector(dir, -p.dot(dir)).normalize();
  const E2 = S.clone().addScaledVector(dir, a * cosA).addScaledVector(p, a * sinA);
  turn(upper, E.clone().sub(S), E2.clone().sub(S));
  const E3 = wp(lower), W3 = wp(hand);
  const T = S.clone().addScaledVector(dir, c);
  turn(lower, W3.sub(E3), T.sub(E3));
}

export class FPArms {
  constructor(model) {
    this.h = makeAvatar(model);
    this.group = new THREE.Group();
    this.group.add(this.h.group);
    this.h.group.rotation.y = Math.PI; // el modelo mira a +z; la cámara de las manos, a -z
    const B = {};
    this.h.group.traverse((o) => {
      if (o.isBone) B[o.name] = o;
      if (o.isMesh) { o.frustumCulled = false; o.castShadow = false; o.receiveShadow = false; }
    });
    this.B = B;
    this.ok = ['Bip01_R_UpperArm', 'Bip01_R_Forearm', 'Bip01_R_Hand', 'Bip01_L_UpperArm', 'Bip01_L_Forearm', 'Bip01_L_Hand', 'Bip01_Head'].every((n) => B[n]);
    if (!this.ok) return;
    this.side = { R: this.arm('R'), L: this.arm('L') };
    // postura de reposo de los dedos (estirados) y de qué lado queda la palma: con la
    // animación de sujetar el móvil, las puntas se doblan hacia ella
    this.rest = new Map();
    for (const A of Object.values(this.side)) for (const ch of A.chains) for (const b of ch) this.rest.set(b, b.quaternion.clone());
    this.h.pose = 'phone';
    this.h.animate(0.5, 0);
    this.h.group.updateMatrixWorld(true);
    for (const A of Object.values(this.side)) {
      const hp = wp(A.hand), fing = wp(A.f2).sub(hp).normalize(), width = wp(A.f1).sub(wp(A.f4)).normalize();
      const tip = A.chains[2].at(-1), base = A.chains[2][0];
      A.ps = Math.sign(wp(tip).sub(wp(base)).dot(new THREE.Vector3().crossVectors(fing, width))) || 1;
    }
    this.recenter();
  }
  arm(s) {
    const B = this.B, p = `Bip01_${s}_`;
    const chains = [0, 1, 2, 3, 4].map((n) => [B[p + 'Finger' + n], B[p + 'Finger' + n + '1'], B[p + 'Finger' + n + '2']].filter(Boolean));
    return { up: B[p + 'UpperArm'], lo: B[p + 'Forearm'], hand: B[p + 'Hand'], f1: B[p + 'Finger1'], f2: B[p + 'Finger2'], f4: B[p + 'Finger4'], chains, ps: 1 };
  }
  // los ojos del personaje en el origen (la cámara de las manos)
  recenter() {
    this.group.position.set(0, 0, 0);
    this.group.updateMatrixWorld(true);
    const head = wp(this.B.Bip01_Head);
    // (los ojos, algo por delante y por encima del hueso de la cabeza)
    // (los ojos algo por delante y por encima del hueso de la cabeza; el cuerpo, un poco
    // adelantado para que los brazos lleguen a lo que se sujeta delante)
    this.group.position.set(-head.x, -head.y - 0.1, -head.z - 0.1);
    this.group.updateMatrixWorld(true);
  }
  apply(style) { this.h.apply?.(style); }

  // pose: 'one' (objeto en la derecha), 'box' (con las dos), 'none'.
  // ref: { R, L } manos de referencia (hands.js) con la posición de cada muñeca, o null.
  update(dt, pose, ref) {
    if (!this.ok) return;
    this.h.pose = 'phone';
    this.h.animate(dt, 0);
    // la cabeza y las piernas no se ven nunca (recogidas en un punto)
    for (const n of ['Bip01_Head', 'Bip01_L_Thigh', 'Bip01_R_Thigh']) if (this.B[n]) this.B[n].scale.setScalar(0.001);
    this.group.updateMatrixWorld(true);
    for (const s of ['R', 'L']) {
      const A = this.side[s], r = ref?.[s];
      const sx = s === 'R' ? 1 : -1;
      if (!r || !r.visible) {
        // brazo abajo, fuera de la vista
        ik(A.up, A.lo, A.hand, _c.set(sx * 0.28, -0.95, 0.05), _d.set(sx * 0.6, -0.2, 0.3));
        continue;
      }
      const tgt = _e.copy(r.position);
      if (s === 'L' && ref.R?.visible) tgt.x = Math.min(tgt.x, ref.R.position.x - 0.07); // la izquierda nunca pasa al otro lado
      ik(A.up, A.lo, A.hand, tgt, _d.set(tgt.x + sx * 0.5, tgt.y - 0.6, tgt.z + 0.25));
      // colisión entre brazos: si el antebrazo izquierdo toca el derecho, se aparta hacia fuera
      if (s === 'L' && ref.R?.visible) {
        const R = this.side.R;
        for (let k = 0; k < 4; k++) {
          const d = segDist(wp(A.lo), wp(A.hand), wp(R.lo), wp(R.hand)) - 0.075;
          const d2 = segDist(wp(A.up), wp(A.lo), wp(R.lo), wp(R.hand)) - 0.075;
          const m = Math.min(d, d2);
          if (m >= 0) break;
          tgt.x += m - 0.01;
          ik(A.up, A.lo, A.hand, tgt, _d.set(tgt.x - 0.5, tgt.y - 0.6, tgt.z + 0.25));
        }
      }
      // cómo va la mano (en el espacio de la cámara): dedos y palma
      // pistola a dos manos: la derecha empuña, la izquierda la abraza por debajo
      const G_ = GRIPS[pose === 'pistol' ? (s === 'R' ? 'gun' : 'support') : GRIPS[pose] ? pose : 'one'];
      this.orient(A, _a.set(sx * G_.f[0], G_.f[1], G_.f[2]).normalize(), _b.set(sx * G_.p[0], G_.p[1], G_.p[2]).normalize());
      this.curl(A, G_.grip);
      if (s === 'R') { // centro de la palma (ahí se apoya lo que llevas en la mano)
        const hp = wp(A.hand), { fing, palm } = this.frame(A);
        // (empuñando, el mango queda dentro del puño: más cerca de la palma)
        const [kf, kp] = pose === 'gun' || pose === 'pistol' ? [0.055, 0.025] : [0.07, 0.045];
        this.palmR = (this.palmR || new THREE.Vector3()).copy(hp).addScaledVector(fing, kf).addScaledVector(palm, kp);
      }
    }
  }
  // Base de la mano: dirección de los dedos, ancho (del índice al meñique) y palma
  frame(A) {
    const hp = wp(A.hand);
    const fing = wp(A.f2).sub(hp).normalize();
    const width = wp(A.f1).sub(wp(A.f4));
    width.addScaledVector(fing, -width.dot(fing)).normalize();
    const palm = new THREE.Vector3().crossVectors(fing, width).multiplyScalar(A.ps);
    return { fing, width, palm };
  }
  // Gira la mano para que los dedos apunten a `F` y la palma mire hacia `P`
  orient(A, F, P) {
    const { fing, palm } = this.frame(A);
    const Pn = P.clone().addScaledVector(F, -P.dot(F)).normalize();
    const qa = new THREE.Quaternion().setFromRotationMatrix(_m.makeBasis(fing, palm, new THREE.Vector3().crossVectors(fing, palm)));
    const qb = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(F, Pn, new THREE.Vector3().crossVectors(F, Pn)));
    rotWorld(A.hand, qb.multiply(qa.invert()));
  }
  // Cierra los dedos hacia la palma (0 = abierta, 1 = puño); el pulgar, menos
  curl(A, amt) {
    for (const ch of A.chains) for (const b of ch) b.quaternion.copy(this.rest.get(b));
    A.hand.updateMatrixWorld(true);
    const { fing, palm } = this.frame(A);
    const axis = new THREE.Vector3().crossVectors(fing, palm).normalize();
    A.chains.forEach((ch, i) => {
      const thumb = i === 0, k = thumb ? 0.45 : 1;
      ch.forEach((b, j) => rotWorld(b, _q.setFromAxisAngle(axis, amt * k * [0.75, 1.05, 0.7][j])));
    });
  }
}

// Cómo se coge cada cosa (mano derecha; la izquierda es su espejo): dedos, palma y cierre
const GRIPS = {
  one: { f: [-0.3, 0.3, -0.9], p: [-0.45, 0.88, 0.1], grip: 0.5 },    // objeto pequeño sobre la palma
  box: { f: [-0.1, 0.35, -1], p: [-1, 0.55, 0], grip: 0.3 },
  fist: { f: [-0.15, 0.1, -1], p: [-0.2, -1, 0], grip: 1.15 },        // puño cerrado, nudillos al frente
  gun: { f: [-0.55, 0.05, -0.8], p: [-1, -0.1, 0.25], grip: 1.05 },   // empuñando: palma hacia el mango, dedos alrededor
  support: { f: [-0.6, 0.15, -0.75], p: [-0.7, 0.65, 0.1], grip: 0.85 }, // mano de apoyo (izquierda): palma arriba, dedos sobre la otra
};
// Aplica un giro en el espacio del mundo a un hueso (y a sus hijos)
function rotWorld(bone, q) {
  const wq = bone.getWorldQuaternion(new THREE.Quaternion());
  const pq = bone.parent.getWorldQuaternion(new THREE.Quaternion()).invert();
  bone.quaternion.copy(pq.multiply(q.clone().multiply(wq)));
  bone.updateMatrixWorld(true);
}
