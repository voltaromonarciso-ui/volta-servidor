import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import animData from '../assets/people/anims.json';

// Personas realistas con ropa de calle (Microsoft Rocketbox, licencia MIT).
// Todas comparten el mismo esqueleto "Bip01", así que comparten animaciones.
const files = import.meta.glob('../assets/people/*.glb', { query: '?url', import: 'default', eager: true });

// Datos de cada personaje: sexo, tono de piel (para las manos en 1ª persona) y manga.
export const PEOPLE_MODELS = {
  Male_Adult_01: { female: false, skin: '#e8bfa4', sleeve: '#e8bfa4', label: 'Polo de rayas' },
  Male_Adult_04: { female: false, skin: '#6b4330', sleeve: '#26282b', label: 'Chaqueta negra' },
  Male_Adult_06: { female: false, skin: '#e3b496', sleeve: '#b8282c', label: 'Jersey rojo' },
  Male_Adult_09: { female: false, skin: '#e0b294', sleeve: '#e0b294', label: 'Camiseta negra' },
  Male_Adult_12: { female: false, skin: '#5a3626', sleeve: '#3a4a60', label: 'Cazadora vaquera' },
  Male_Adult_16: { female: false, skin: '#e6b89a', sleeve: '#e6b89a', label: 'Camiseta azul' },
  Male_Adult_17: { female: false, skin: '#7a4c34', sleeve: '#1f3c8a', label: 'Sudadera y gorra' },
  Male_Adult_20: { female: false, skin: '#e0b090', sleeve: '#3a2620', label: 'Sudadera marrón' },
  Female_Adult_01: { female: true, skin: '#f0c8ac', sleeve: '#e0708a', label: 'Camisa rosa' },
  Female_Adult_03: { female: true, skin: '#eec4a6', sleeve: '#eec4a6', label: 'Top morado' },
  Female_Adult_05: { female: true, skin: '#eec4a8', sleeve: '#efc6c2', label: 'Americana rosa' },
  Female_Adult_07: { female: true, skin: '#eec4a6', sleeve: '#4a2e22', label: 'Chaqueta marrón' },
  Female_Adult_12: { female: true, skin: '#e8bc9c', sleeve: '#1e1e22', label: 'Sudadera negra' },
  Female_Adult_13: { female: true, skin: '#eec4a6', sleeve: '#eec4a6', label: 'Chaleco gris' },
  Female_Adult_17: { female: true, skin: '#f0c8aa', sleeve: '#f0c8aa', label: 'Camiseta verde' },
  Police_Male_01: { female: false, police: true, skin: '#e0b090', sleeve: '#5a7aa8' },
};
export const MODELS = {};
const CLIPS = { m: {}, f: {} }, RAW = { m: {}, f: {} };

// Los clips traen un hueso raíz "Bip01" que los modelos no tienen (su pelvis
// cuelga de la escena, en metros): se fusiona Bip01 + pelvis en la pelvis.
// Además la animación queda "en el sitio": el desplazamiento lo mueve el juego.
const _qa = new THREE.Quaternion(), _qb = new THREE.Quaternion();
function prepClip(json, merge = true) {
  const clip = THREE.AnimationClip.parse(json);
  if (!merge) {
    const bp = clip.tracks.find((t) => t.name === 'Bip01.position');
    if (bp) { const v = bp.values; for (let i = 0; i < v.length; i += 3) { v[i] = v[0]; v[i + 2] = v[2]; } }
  }
  const find = (n) => clip.tracks.find((t) => t.name === n);
  const bq = find('Bip01.quaternion'), bp = find('Bip01.position'), pq = find('Bip01_Pelvis.quaternion');
  if (merge && bq && bp && pq) {
    const times = [...new Set([...bq.times, ...bp.times, ...pq.times])].sort((a, b) => a - b);
    const ib = bq.createInterpolant(), ip = pq.createInterpolant(), ipos = bp.createInterpolant();
    const Q = [], P = [];
    const p0 = ipos.evaluate(times[0]).slice();
    for (const t of times) {
      _qa.fromArray(ib.evaluate(t)); _qb.fromArray(ip.evaluate(t));
      _qa.multiply(_qb).normalize();
      Q.push(_qa.x, _qa.y, _qa.z, _qa.w);
      const v = ipos.evaluate(t);
      P.push(p0[0] * 0.01, v[1] * 0.01, p0[2] * 0.01);
    }
    clip.tracks = clip.tracks.filter((t) => !/^Bip01(_Pelvis)?\.(position|quaternion)$/.test(t.name));
    clip.tracks.push(new THREE.QuaternionKeyframeTrack('Bip01_Pelvis.quaternion', times, Q));
    clip.tracks.push(new THREE.VectorKeyframeTrack('Bip01_Pelvis.position', times, P));
  }
  // los nodos del esqueleto se enlazan por nombre de hueso
  for (const t of clip.tracks) {
    const i = t.name.lastIndexOf('.');
    t.name = '.bones[' + t.name.slice(0, i) + ']' + t.name.slice(i);
  }
  return clip;
}

// Une las piezas de cada persona (hasta 26 mallas) en una por material: muchas
// menos llamadas de dibujo. Los índices de hueso se pasan a un esqueleto común.
function mergeSkinned(root) {
  const skins = [];
  root.traverse((o) => { if (o.isSkinnedMesh) skins.push(o); });
  if (skins.length < 2) return;
  const base = skins.reduce((a, b) => (b.skeleton.bones.length > a.skeleton.bones.length ? b : a));
  const bones = [...base.skeleton.bones], inverses = base.skeleton.boneInverses.map((m) => m.clone());
  const indexOf = new Map(bones.map((b, i) => [b, i]));
  const groups = new Map();
  for (const m of skins) {
    if (!m.bindMatrix.equals(base.bindMatrix)) return; // no es seguro unirlas
    const map = m.skeleton.bones.map((b, i) => {
      if (!indexOf.has(b)) { indexOf.set(b, bones.length); bones.push(b); inverses.push(m.skeleton.boneInverses[i].clone()); }
      return indexOf.get(b);
    });
    const geo = m.geometry.clone();
    for (const k of Object.keys(geo.attributes)) if (!['position', 'normal', 'uv', 'skinIndex', 'skinWeight'].includes(k)) geo.deleteAttribute(k);
    const si = geo.attributes.skinIndex;
    const arr = new Uint16Array(si.count * 4);
    for (let i = 0; i < si.count; i++) for (let j = 0; j < 4; j++) arr[i * 4 + j] = map[si.getComponent(i, j)] ?? 0;
    geo.setAttribute('skinIndex', new THREE.Uint16BufferAttribute(arr, 4));
    for (const k of ['position', 'normal', 'uv', 'skinWeight']) {
      const a = geo.attributes[k];
      if (a && (a.isInterleavedBufferAttribute || a.normalized || !(a.array instanceof Float32Array))) {
        const f = new Float32Array(a.count * a.itemSize);
        for (let i = 0; i < a.count; i++) for (let j = 0; j < a.itemSize; j++) f[i * a.itemSize + j] = a.getComponent(i, j);
        geo.setAttribute(k, new THREE.BufferAttribute(f, a.itemSize));
      }
    }
    // la geometría se pasa al espacio del nodo base (mismo padre en estos modelos)
    if (m.parent !== base.parent || !m.matrix.equals(base.matrix)) { m.updateMatrix(); base.updateMatrix(); geo.applyMatrix4(new THREE.Matrix4().copy(base.matrix).invert().multiply(m.matrix)); }
    const key = m.material.uuid;
    if (!groups.has(key)) groups.set(key, { mat: m.material, geos: [] });
    groups.get(key).geos.push(geo);
  }
  const skeleton = new THREE.Skeleton(bones, inverses);
  const parent = base.parent;
  for (const m of skins) m.removeFromParent();
  for (const { mat, geos } of groups.values()) {
    const allIdx = geos.every((g) => g.index);
    const merged = mergeGeometries(allIdx ? geos : geos.map((g) => (g.index ? g.toNonIndexed() : g)), false);
    if (!merged) continue;
    mat.vertexColors = false; // los colores por vértice del FBX no aportan y se descartan al unir
    const sm = new THREE.SkinnedMesh(merged, mat);
    sm.name = 'body_' + mat.name;
    sm.position.copy(base.position); sm.quaternion.copy(base.quaternion); sm.scale.copy(base.scale);
    sm.bind(skeleton, base.bindMatrix);
    parent.add(sm);
  }
}

const findSkin = (o) => { let r = null; o.traverse((c) => { if (c.isSkinnedMesh && (!r || c.skeleton.bones.length > r.skeleton.bones.length)) r = c; }); return r; };

export async function loadModels(onProgress = () => {}) {
  for (const [k, j] of Object.entries(animData)) {
    const sex = k[0], name = k.slice(2);
    const key = /idle/.test(name) ? 'idle' : /walk/.test(name) ? 'walk' : /run/.test(name) ? 'run' : /phone/.test(name) ? 'phone' : 'give';
    CLIPS[sex][key] = prepClip(j);
    RAW[sex][key] = prepClip(j, false);
  }
  const L = new GLTFLoader();
  L.setMeshoptDecoder(MeshoptDecoder);
  const names = Object.keys(PEOPLE_MODELS);
  let done = 0;
  // de dos en dos (cargar todos a la vez satura a los móviles modestos)
  const loadOne = async (n) => {
    const url = Object.entries(files).find(([p]) => p.endsWith('/' + n + '.glb'))?.[1];
    if (!url) return;
    let g = null;
    for (let tries = 0; tries < 2 && !g; tries++) {
      try {
        g = await L.loadAsync(url);
        let bad = false;
        // todas las mallas llevan textura: si falta alguna, se reintenta
        g.scene.traverse((o) => { if (o.isMesh && !(o.material.map && o.material.map.image)) bad = true; });
        if (bad) g = null;
      } catch (e) { console.warn('No se pudo cargar', n, e.message); }
    }
    if (!g) return;
    mergeSkinned(g.scene);
    g.scene.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true; o.receiveShadow = false;
        const m = o.material;
        if (m.alphaTest > 0) m.alphaTest = 0.5;
        m.envMapIntensity = 0.6;
      }
    });
    MODELS[n] = { scene: g.scene, ...PEOPLE_MODELS[n] };
    onProgress(++done / names.length);
  };
  const queue = [...names];
  await Promise.all([0, 1].map(async () => { while (queue.length) await loadOne(queue.shift()); }));
}

// clips filtrados a los huesos que existen en cada modelo (se cachean por modelo)
function clipsFor(def, skin) {
  if (def.clips) return def.clips;
  const names = new Set(skin.skeleton.bones.map((b) => b.name));
  def.clips = {};
  const src = names.has('Bip01') ? RAW : CLIPS;
  for (const [k, c] of Object.entries(src[def.female ? 'f' : 'm'])) {
    const cc = c.clone();
    cc.tracks = cc.tracks.filter((t) => names.has(t.name.slice(7, t.name.lastIndexOf(']'))));
    // la raíz puede venir en metros en el modelo y en centímetros en el clip
    const root = skin.skeleton.bones.find((b) => b.name === 'Bip01');
    const rp = root && cc.tracks.find((t) => t.name === '.bones[Bip01].position');
    if (rp && rp.values[1]) {
      const f = root.position.y / rp.values[1];
      if (Math.abs(f - 1) > 0.2) { rp.values = rp.values.map((v) => v * f); }
    }
    def.clips[k] = cc;
  }
  return def.clips;
}

export const modelNames = (female, police = false) => Object.keys(MODELS).filter((n) => !!MODELS[n].female === !!female && !!MODELS[n].police === police);

// ------------------------------------------------------------------
//  Instancia con la misma interfaz que los personajes procedurales
// ------------------------------------------------------------------
const BONE = { handL: 'Bip01_L_Hand', handR: 'Bip01_R_Hand', head: 'Bip01_Head' };

export function makeRealHuman(kind, { scale = 1 } = {}) {
  const def = MODELS[kind];
  const g = new THREE.Group();
  const inner = SkeletonUtils.clone(def.scene);
  inner.scale.multiplyScalar(scale);
  g.add(inner);
  const skin = findSkin(inner);
  const bones = {};
  skin.skeleton.bones.forEach((b) => { bones[b.name] = b; });
  const clips = clipsFor(def, skin);
  const mixer = new THREE.AnimationMixer(skin);
  const acts = {};
  for (const [k, c] of Object.entries(clips)) {
    acts[k] = mixer.clipAction(c);
    acts[k].play();
    acts[k].setEffectiveWeight(k === 'idle' ? 1 : 0);
  }
  mixer.update(Math.random() * 3);

  // anclas en las manos para coger objetos (el esqueleto está en centímetros)
  const anchor = (bone, side) => {
    const a = new THREE.Group();
    a.scale.setScalar(100 / scale);
    a.position.set(8, side * -1.5, 0.5);
    a.rotation.set(0, 0, -Math.PI / 2);
    bones[bone].add(a);
    return a;
  };
  const anchorL = anchor(BONE.handL, 1), anchorR = anchor(BONE.handR, -1);
  const fake = () => ({ rotation: new THREE.Euler() });
  const h = {
    group: g, real: true, model: kind, armL: fake(), armR: fake(), head: fake(), legL: fake(), legR: fake(), body: g,
    anchorL, anchorR, over: {}, pose: null, w: { idle: 1, walk: 0, run: 0, phone: 0, give: 0 },
  };
  h.hold = (side, obj) => {
    const a = side === 'L' ? anchorL : anchorR;
    a.clear();
    if (obj) a.add(obj);
  };
  let lastPose = null;
  h.animate = (dt, speed) => {
    // las poses (móvil, dar/recibir) sólo con el personaje parado
    const pose = speed > 0.1 ? null : h.pose;
    // 'give' arranca en el momento en que adelanta las manos
    if (pose !== lastPose && pose && acts[pose]) acts[pose].time = pose === 'give' && !h.loopGive ? 2.2 : 0;
    lastPose = pose;
    const target = pose && acts[pose] ? pose : speed > 4.5 ? 'run' : speed > 0.1 ? 'walk' : 'idle';
    for (const k of Object.keys(acts)) {
      h.w[k] += ((k === target ? 1 : 0) - h.w[k]) * Math.min(1, dt * 7);
      acts[k].setEffectiveWeight(h.w[k]);
    }
    acts.walk.timeScale = Math.max(0.7, Math.min(1.6, speed / 1.45));
    acts.run.timeScale = Math.max(0.7, Math.min(1.4, speed / 5.5));
    mixer.update(dt);
  };
  return h;
}
