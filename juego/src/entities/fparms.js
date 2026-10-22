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
const FINGER_R = 0.0085; // grosor (radio) de un dedo
const PALM_F = 0.045, PALM_P = 0.02; // centro de la palma respecto a la muñeca: hacia los dedos y hacia fuera
// Cajas de colisión de lo que se sujeta (las marcadas como `collider`; si no hay, las piezas visibles)
export function collectSolids(holder) {
  holder.updateMatrixWorld(true);
  const out = [];
  let marked = false;
  holder.traverse((o) => { if (o.isMesh && o.userData.collider) marked = true; });
  holder.traverse((o) => {
    if (!o.isMesh || (marked ? !o.userData.collider : !o.visible || o.material?.transparent)) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const sc = o.getWorldScale(new THREE.Vector3()).x || 1;
    out.push({ inv: o.matrixWorld.clone().invert(), box: o.geometry.boundingBox.clone().expandByScalar(FINGER_R / sc), sc });
  });
  return out;
}
const Z = new THREE.Vector3(0, 0, 1), Y = new THREE.Vector3(0, 1, 0);
const _t = new THREE.Vector3(), _s = new THREE.Vector3(), _p = new THREE.Vector3();
// Agarre por cantidad (0..1): todas las falanges a la vez, el pulgar algo menos
const specFromAmount = (a) => ({ f: [[22 * a, 30 * a, 35 * a], [80 * a, 95 * a, 60 * a], [80 * a, 95 * a, 60 * a], [80 * a, 95 * a, 60 * a], [80 * a, 95 * a, 60 * a]], opp: 25 * a });
// Posturas de dedos (grados por falange: base, media, punta; dedos 0 = pulgar … 4 = meñique).
// Con colisión, son el máximo: cada falange se para antes si toca.
export const HANDS = {
  gun: { f: [[45, 45, 45], [90, 100, 75], [90, 100, 75], [90, 100, 75], [90, 100, 75]], opp: -10 },     // empuñar un mango: el pulgar cerrado sobre los dedos
  trigger: { f: [[15, 20, 15], [10, 55, 25], [90, 100, 75], [90, 100, 75], [90, 100, 75]], opp: -12 }, // pistola: índice al gatillo, pulgar al frente por el costado
  support: { f: [[5, 10, 10], [80, 90, 60], [80, 90, 60], [80, 90, 60], [80, 90, 60]], opp: 0 },       // mano de apoyo: pulgar al frente
  relax: { f: [[6, 6, 6], [4, 8, 6], [5, 9, 6], [6, 10, 7], [8, 12, 8]], opp: 10 },            // mano libre, relajada y abierta
  box: { f: [[10, 10, 10], [25, 25, 15], [25, 25, 15], [25, 25, 15], [25, 25, 15]], opp: 5 },          // caja: palma contra el lado
};
// Distancia de un punto al segmento a-b
function pointSeg(v, a, b) {
  const ab = _f.copy(b).sub(a), t = THREE.MathUtils.clamp(_g.copy(v).sub(a).dot(ab) / (ab.lengthSq() || 1), 0, 1);
  return _g.copy(a).addScaledVector(ab, t).distanceTo(v);
}
const _f = new THREE.Vector3(), _g = new THREE.Vector3();
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
    this.calibrate();
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
      if (r.grip) { // agarre definido por el objeto: la muñeca va donde lo dice el punto de agarre
        const M = r.grip.obj; M.updateWorldMatrix(true, false);
        const F = new THREE.Vector3().fromArray(r.grip.F).transformDirection(M.matrixWorld);
        const P = new THREE.Vector3().fromArray(r.grip.P).transformDirection(M.matrixWorld);
        P.addScaledVector(F, -P.dot(F)).normalize();
        // el punto de agarre es donde apoya el centro de la palma: la muñeca queda detrás
        const wrist = wp(M).addScaledVector(F, -PALM_F).addScaledVector(P, -PALM_P);
        ik(A.up, A.lo, A.hand, wrist, _d.set(wrist.x + sx * 0.45, wrist.y - 0.6, wrist.z + 0.3));
        this.orient(A, F, P);
        this.shape(A, HANDS[r.grip.hand], ref.solids, s === 'L' ? ref.segsR : null);
        if (s === 'R') ref.segsR = this.capsules(A);
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
  // Cierra los dedos (0 = abierta, 1 = puño) con la flexión anatómica, sin colisión
  curl(A, amt) { this.shape(A, specFromAmount(amt), null, null); }

  // ---------------------------------------------------------------------------------------
  //  Dedos: cada falange se dobla sobre su propio eje de flexión (en este esqueleto Biped,
  //  el Z local), partiendo de la postura de reposo del esqueleto (dedos estirados). Antes
  //  se doblaban todas alrededor de un eje común de la mano: en la falange de la base ese eje
  //  no coincide con el suyo y el dedo se torcía de lado (los dedos se cruzaban).
  //  Se cierran de la base a la punta y cada falange se para al tocar lo que se sujeta
  //  (cápsula del dedo contra las cajas de colisión del objeto) o los dedos de la otra mano.
  // ---------------------------------------------------------------------------------------
  calibrate() {
    let skin = null;
    this.h.group.traverse((o) => { if (o.isSkinnedMesh && !skin) skin = o; });
    const sk = skin.skeleton, bindW = new Map();
    sk.bones.forEach((b, i) => bindW.set(b, sk.boneInverses[i].clone().invert()));
    this.bind = new Map();
    const pos = new THREE.Vector3(), sc = new THREE.Vector3();
    for (const A of Object.values(this.side)) for (const ch of A.chains) for (const b of ch) {
      const q = new THREE.Quaternion();
      bindW.get(b.parent).clone().invert().multiply(bindW.get(b)).decompose(pos, q, sc);
      this.bind.set(b, q);
    }
    // sentido de flexión de cada falange: el giro sobre Z que lleva la punta hacia la palma
    // (en los dedos, +Z; en el pulgar, -Z) y el de oposición del pulgar (sobre Y)
    this.flexSign = new Map();
    for (const A of Object.values(this.side)) {
      for (const ch of A.chains) for (const b of ch) b.quaternion.copy(this.bind.get(b));
      A.hand.updateMatrixWorld(true);
      const { palm } = this.frame(A);
      const test = (b, tipOf, axis) => {
        const t0 = tipOf(), save = b.quaternion.clone();
        b.quaternion.multiply(_q.setFromAxisAngle(axis, 0.3)); b.updateMatrixWorld(true);
        const d = tipOf().sub(t0).dot(palm);
        b.quaternion.copy(save); b.updateMatrixWorld(true);
        return d >= 0 ? 1 : -1;
      };
      A.chains.forEach((ch) => ch.forEach((b) => this.flexSign.set(b, test(b, () => this.tip(ch), Z))));
      const th = A.chains[0];
      A.oppSign = test(th[0], () => this.tip(th), Y);
      A.len = A.chains.map((ch) => ch.map((b, j) => (j < ch.length - 1 ? wp(ch[j + 1]).distanceTo(wp(b)) : wp(b).distanceTo(wp(ch[j - 1] || A.hand)) * 0.72)));
    }
  }
  // punta del dedo (a lo largo del eje X local de la última falange, que en Biped es el hueso)
  tip(ch, v = new THREE.Vector3()) {
    const b = ch.at(-1), prev = ch.at(-2);
    const L = prev ? wp(b).distanceTo(wp(prev)) * 0.72 : 0.022;
    return wp(b, v).addScaledVector(_t.set(1, 0, 0).transformDirection(b.matrixWorld), L);
  }
  // Coloca los dedos según `spec` ({ f: [[base, media, punta] x5 en grados], opp }) y, si hay
  // colisión, para cada falange al tocar
  shape(A, spec, solids, segs) {
    const D = Math.PI / 180;
    A.chains.forEach((ch, i) => {
      for (const b of ch) b.quaternion.copy(this.bind.get(b));
      ch[0].updateMatrixWorld(true);
      if (i === 0 && spec.opp) { ch[0].quaternion.multiply(_q.setFromAxisAngle(Y, A.oppSign * spec.opp * D)); ch[0].updateMatrixWorld(true); }
      const target = ch.map((b, j) => this.flexSign.get(b) * spec.f[i][j] * D);
      if (!solids && !segs) { ch.forEach((b, j) => { b.quaternion.multiply(_q.setFromAxisAngle(Z, target[j])); b.updateMatrixWorld(true); }); return; }
      // 1) cuánto cerrar el dedo entero (todas las falanges a la vez, como un dedo de verdad):
      //    se prueban todos los grados y se queda el más cerrado antes de hundirse en algo
      const pen = () => this.contacts(A, ch, 0, solids, segs).reduce((t, d) => t + d, 0);
      const level = (t) => { ch.forEach((b, j) => { b.quaternion.copy(base[j]).multiply(_q.setFromAxisAngle(Z, target[j] * t)); }); ch[0].updateMatrixWorld(true); };
      const base = ch.map((b) => b.quaternion.clone()), K = 20, pens = [];
      for (let k = 0; k <= K; k++) { level(k / K); pens.push(pen()); }
      // (se avanza mientras no empeore: así no «atraviesa» la cacha para salir al otro lado)
      let kb = 0, low = pens[0];
      for (let k = 1; k <= K; k++) { if (pens[k] > low + 2e-4) break; kb = k; low = Math.min(low, pens[k]); }
      level(kb / K);
      // 2) desde ahí, cada falange (de la punta a la base) sigue cerrándose sola hasta tocar
      let cur = pens[kb];
      const N = 12;
      for (let j = ch.length - 1; j >= 0; j--) {
        const b = ch[j], left = target[j] * (1 - kb / K);
        for (let n = 0; n < N; n++) {
          const save = b.quaternion.clone();
          b.quaternion.multiply(_q.setFromAxisAngle(Z, left / N)); b.updateMatrixWorld(true);
          const d = pen();
          if (d > cur + 1e-4) { b.quaternion.copy(save); b.updateMatrixWorld(true); break; }
          cur = d;
        }
      }
    });
  }
  // Cuánto se mete (en metros, punto a punto) la cápsula del dedo, de la falange j a la punta, en lo
  // que se sujeta o en los dedos de la otra mano. Es continuo: si una falange ya rozaba al
  // empezar, puede seguir cerrándose mientras no se hunda más.
  contacts(A, ch, j, solids, segs) {
    const pts = ch.map((b) => wp(b)); pts.push(this.tip(ch));
    const out = [];
    for (let k = j; k < pts.length - 1; k++) for (const t of [0.25, 0.5, 0.75, 1]) {
      _s.copy(pts[k]).lerp(pts[k + 1], t);
      let d = 0;
      if (solids) for (const S of solids) {
        const p = _p.copy(_s).applyMatrix4(S.inv), B = S.box;
        if (!B.containsPoint(p)) continue;
        d += Math.min(p.x - B.min.x, B.max.x - p.x, p.y - B.min.y, B.max.y - p.y, p.z - B.min.z, B.max.z - p.z) * S.sc;
      }
      if (segs) for (const [a, b] of segs) d += Math.max(0, FINGER_R * 2 - pointSeg(_s, a, b));
      out.push(d);
    }
    return out; // hundimiento de cada punto de la cápsula (m)
  }
  // Cápsulas de los dedos de una mano (para que la otra no los atraviese)
  capsules(A) {
    const out = [];
    for (const ch of A.chains) {
      const pts = [wp(A.hand).lerp(wp(ch[0]), 0.6), ...ch.map((b) => wp(b)), this.tip(ch)];
      for (let k = 1; k < pts.length; k++) out.push([pts[k - 1], pts[k]]);
    }
    return out;
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
