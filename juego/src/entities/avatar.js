import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { MODELS, makeRealHuman } from './models.js';
import { CLOTHES, HAIR_COLORS, BEARDS } from '../data/style.js';

// Avatar del jugador con su apariencia: el mismo personaje Rocketbox elegido al
// crear la partida, con materiales propios (no se tocan los de los vecinos) que
// recolorean prenda de arriba, pantalón y pelo, recortan el pelo, pintan barba y
// llevan accesorios 3D sujetos a los huesos.
//
// Las zonas se sacan del propio modelo: cada vértice pertenece al hueso que más
// lo mueve (espalda/brazos = arriba, muslos/gemelos = pantalón, mandíbula = barba).

const v3 = () => new THREE.Vector3();
const LUMA = new THREE.Vector3(0.2126, 0.7152, 0.0722);

// ------------------------------------------------------------------
//  Análisis del modelo (una vez por personaje)
// ------------------------------------------------------------------
const TOP_BONES = /Spine|Clavicle|UpperArm|Forearm/;
const LEG_BONES = /Thigh|Calf/;
const SKIN_BONES = /Hand|Finger/;
const BEARD_BONES = { Bip01_MJaw: 1, Bip01_LMasseter: 1, Bip01_RMasseter: 1, Bip01_LMouthBottom: 0.8, Bip01_RMouthBottom: 0.8, Bip01_LCheek: 0.25, Bip01_RCheek: 0.25, Bip01_LUpperlip: 0.7, Bip01_RUpperlip: 0.7, Bip01_LCaninus: 0.6, Bip01_RCaninus: 0.6 };

function texSampler(tex) {
  const img = tex && tex.image;
  if (!img || !img.width) return null;
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const x = c.getContext('2d', { willReadFrequently: true });
  x.drawImage(img, 0, 0, S, S);
  const d = x.getImageData(0, 0, S, S).data;
  // los glTF no voltean la textura: (u, v) va directo a (x, y)
  return (u, v) => {
    const px = Math.min(S - 1, Math.max(0, Math.floor((u - Math.floor(u)) * S)));
    const py = Math.min(S - 1, Math.max(0, Math.floor((v - Math.floor(v)) * S)));
    const i = (py * S + px) * 4;
    return [d[i] / 255, d[i + 1] / 255, d[i + 2] / 255, d[i + 3] / 255];
  };
}
const toLin = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const lumOf = (rgb) => LUMA.x * toLin(rgb[0]) + LUMA.y * toLin(rgb[1]) + LUMA.z * toLin(rgb[2]);

// Cada prenda es una isla en la textura (triángulos unidos que comparten vértices):
// la isla entera toma la zona mayoritaria, así no salen dientes de sierra donde
// la camiseta se junta con el pantalón.
function islandVote(geo, reg, skinLike) {
  const idx = geo.index;
  if (!idx) return;
  const n = reg.length, parent = new Int32Array(n).map((_, i) => i);
  const find = (a) => { while (parent[a] !== a) { parent[a] = parent[parent[a]]; a = parent[a]; } return a; };
  for (let t = 0; t < idx.count; t += 3) {
    const a = find(idx.getX(t)), b = find(idx.getX(t + 1)), c = find(idx.getX(t + 2));
    parent[b] = a; parent[c] = a;
  }
  const votes = new Map();
  for (let i = 0; i < n; i++) {
    const r = find(i);
    if (!votes.has(r)) votes.set(r, [0, 0, 0, 0, 0, 0]);
    const v = votes.get(r);
    v[reg[i]]++;
    if (skinLike && i % 2 === 0) { v[4]++; if (skinLike(i)) v[5]++; }
  }
  // 1 arriba · 2 pantalón · 3 piel · 4/5 arriba/pantalón con piel mezclada
  const winner = new Map();
  for (const [r, v] of votes) {
    let best = 0;
    for (let k = 1; k < 4; k++) if (v[k] > v[best]) best = k;
    const skin = v[4] ? v[5] / v[4] : 0;
    if ((best === 1 || best === 2) && skin > 0.6) best = 3;
    else if ((best === 1 || best === 2) && skin > 0.3) best += 3;
    winner.set(r, best);
  }
  for (let i = 0; i < n; i++) reg[i] = winner.get(find(i));
}

export function analyze(name) {
  const def = MODELS[name];
  if (!def) return null;
  if (def._an) return def._an;
  const meshes = {};
  def.scene.updateMatrixWorld(true);
  def.scene.traverse((o) => { if (o.isSkinnedMesh) (meshes[o.material.name] ||= []).push(o); });
  const any = (meshes.body || meshes.head || [])[0];
  if (!any) return null;
  const bones = any.skeleton.bones;
  const boneIdx = Object.fromEntries(bones.map((b, i) => [b.name, i]));
  const boneBind = (n) => { const i = boneIdx[n]; return i === undefined ? null : new THREE.Matrix4().copy(any.skeleton.boneInverses[i]).invert(); };
  const bonePos = (n) => { const m = boneBind(n); return m ? v3().setFromMatrixPosition(m) : null; };

  // posiciones en el espacio de enlace (el mismo en el que se definen los huesos)
  const bindPos = (m) => {
    const p = m.geometry.attributes.position, out = new Float32Array(p.count * 3), t = v3();
    for (let i = 0; i < p.count; i++) { t.fromBufferAttribute(p, i).applyMatrix4(m.bindMatrix); out[i * 3] = t.x; out[i * 3 + 1] = t.y; out[i * 3 + 2] = t.z; }
    return out;
  };
  // ejes reales del modelo (según el esqueleto: no todos vienen con Y hacia arriba)
  const head = bonePos('Bip01_Head');
  const feet = ['Bip01_L_Foot', 'Bip01_R_Foot'].map(bonePos).filter(Boolean);
  const foot = feet.length ? feet.reduce((a, b) => a.add(b), v3()).multiplyScalar(1 / feet.length) : head.clone().setY(head.y - 1);
  const up = v3().subVectors(head, foot).normalize();
  const nose = bonePos('Bip01_MNose');
  const fwd = nose ? v3().subVectors(nose, head) : v3().set(0, 0, 1);
  fwd.addScaledVector(up, -fwd.dot(up)).normalize();
  const side = v3().crossVectors(up, fwd).normalize();
  let minY = Infinity, maxY = -Infinity;
  for (const m of meshes.body || []) { const b = bindPos(m); for (let i = 0; i < b.length; i += 3) { const y = b[i] * up.x + b[i + 1] * up.y + b[i + 2] * up.z; minY = Math.min(minY, y); maxY = Math.max(maxY, y); } }
  const unit = (maxY - minY) / (def.female ? 1.66 : 1.76); // unidades del modelo por metro
  const height = (b, i) => b[i * 3] * up.x + b[i * 3 + 1] * up.y + b[i * 3 + 2] * up.z;

  const dominant = (m, i) => {
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    let best = -1, bw = -1;
    for (let k = 0; k < 4; k++) { const w = sw.getComponent(i, k); if (w > bw) { bw = w; best = si.getComponent(i, k); } }
    return m.skeleton.bones[best]?.name || '';
  };
  const pelvis = bonePos('Bip01_Pelvis') || bonePos('Bip01_Spine');
  const an = { unit, head, fwd, side, up, female: !!def.female, hairLum: 0.05, hairRef: new THREE.Color(0.1, 0.07, 0.05), topLum: 0.1, legsLum: 0.1, skin: new THREE.Color(def.skin || '#d29a72') };

  // --- cuerpo: zona de cada vértice + color medio de piel y de cada prenda
  for (const m of meshes.body || []) {
    const n = m.geometry.attributes.position.count, b = bindPos(m), reg = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      const bn = dominant(m, i);
      if (TOP_BONES.test(bn)) reg[i] = 1;
      else if (LEG_BONES.test(bn)) reg[i] = 2;
      else if (/Pelvis/.test(bn)) reg[i] = height(b, i) < pelvis.dot(up) ? 2 : 1;
      else if (SKIN_BONES.test(bn)) reg[i] = 3;
    }
    const smp = texSampler(m.material.map), uv = m.geometry.attributes.uv;
    let skinS = null;
    if (smp) {
      const hands = [];
      for (let i = 0; i < n; i += 2) if (reg[i] === 3) hands.push(smp(uv.getX(i), uv.getY(i)));
      if (hands.length) {
        skinS = [0, 1, 2].map((k) => hands.reduce((a, c) => a + c[k], 0) / hands.length);
        an.skin.setRGB(skinS[0], skinS[1], skinS[2], THREE.SRGBColorSpace);
      }
    }
    const isSkin = (c) => skinS && Math.hypot(c[0] - skinS[0], c[1] - skinS[1], c[2] - skinS[2]) < 0.13;
    islandVote(m.geometry, reg, smp && skinS ? (i) => isSkin(smp(uv.getX(i), uv.getY(i))) : null);
    m.geometry.setAttribute('aRegion', new THREE.BufferAttribute(reg, 1));
    if (smp) {
      const acc = { 1: [], 2: [] };
      for (let i = 0; i < n; i += 3) { const r = reg[i] > 3 ? reg[i] - 3 : reg[i]; if (acc[r]) { const c = smp(uv.getX(i), uv.getY(i)); if (!isSkin(c)) acc[r].push(c); } }
      const avgL = (arr) => (arr.length ? arr.reduce((a, c) => a + lumOf(c), 0) / arr.length : 0.1);
      an.topLum = Math.max(0.015, avgL(acc[1]));
      an.legsLum = Math.max(0.015, avgL(acc[2]));
    }
  }
  // --- pelo (tarjetas con transparencia) y cabeza: altura y avance respecto a la cabeza
  const eyes = ['Bip01_LEye', 'Bip01_REye'].map(bonePos).filter(Boolean);
  // por vértice: altura sobre el hueso de la cabeza, distancia al eje vertical de
  // la cabeza y distancia al ojo más cercano (todo en metros)
  const vol = []; // (altura, radio) de cabeza y pelo: el volumen real del peinado
  const headSpace = (m) => {
    const n = m.geometry.attributes.position.count, b = bindPos(m), hy = new Float32Array(n * 3), t = v3(), q = v3();
    for (let i = 0; i < n; i++) {
      t.set(b[i * 3] - head.x, b[i * 3 + 1] - head.y, b[i * 3 + 2] - head.z);
      const y = t.dot(up);
      hy[i * 3] = y / unit;
      hy[i * 3 + 1] = t.addScaledVector(up, -y).length() / unit;
      let e = 9;
      q.set(b[i * 3], b[i * 3 + 1], b[i * 3 + 2]);
      for (const ep of eyes) e = Math.min(e, q.distanceTo(ep) / unit);
      hy[i * 3 + 2] = e;
    }
    m.geometry.setAttribute('aHead', new THREE.BufferAttribute(hy, 3));
    for (let i = 0; i < n; i += 2) vol.push(hy[i * 3], hy[i * 3 + 1]);
    return { b, hy };
  };
  let topY = 0, radius = 0.1, skullY = 0;
  for (const m of meshes.opacity || []) {
    const { hy } = headSpace(m);
    const smp = texSampler(m.material.map), uv = m.geometry.attributes.uv;
    const cols = [];
    for (let i = 0; i < hy.length / 3; i++) {
      topY = Math.max(topY, hy[i * 3]);
      if (smp && i % 2 === 0 && hy[i * 3] > 0.12) { const c = smp(uv.getX(i), uv.getY(i)); if (c[3] > 0.5) cols.push(c); }
    }
    if (cols.length) {
      const avg = [0, 1, 2].map((k) => cols.reduce((a, c) => a + c[k], 0) / cols.length);
      an.hairRef.setRGB(avg[0], avg[1], avg[2], THREE.SRGBColorSpace);
      an.hairLum = Math.max(0.01, cols.reduce((a, c) => a + lumOf(c), 0) / cols.length);
    }
  }
  for (const m of meshes.head || []) {
    const { b, hy } = headSpace(m);
    const n = hy.length / 3, beard = new Float32Array(n), t = v3();
    const si = m.geometry.attributes.skinIndex, sw = m.geometry.attributes.skinWeight;
    for (let i = 0; i < n; i++) {
      skullY = Math.max(skullY, hy[i * 3]);
      // radio del cráneo: a la altura de la frente y lejos de las orejas
      if (hy[i * 3] > 0.11 && hy[i * 3] < 0.15) radius = Math.max(radius, hy[i * 3 + 1]);
      let w = 0;
      for (let k = 0; k < 4; k++) w += (BEARD_BONES[m.skeleton.bones[si.getComponent(i, k)]?.name] || 0) * sw.getComponent(i, k);
      beard[i] = Math.min(1, w);
    }
    m.geometry.setAttribute('aBeard', new THREE.BufferAttribute(beard, 1));
    // color del pelo pintado en la cabeza: lo de arriba del todo es pelo seguro
    const smp = texSampler(m.material.map), uv = m.geometry.attributes.uv, cols = [];
    if (smp) for (let i = 0; i < n; i++) if (hy[i * 3] > skullY - 0.035 && hy[i * 3 + 2] > 0.06) cols.push(smp(uv.getX(i), uv.getY(i)));
    if (cols.length > 4) {
      const avg = [0, 1, 2].map((k) => cols.reduce((a, c) => a + c[k], 0) / cols.length);
      an.scalpRef = new THREE.Color().setRGB(avg[0], avg[1], avg[2], THREE.SRGBColorSpace);
      an.scalpLum = Math.max(0.01, cols.reduce((a, c) => a + lumOf(c), 0) / cols.length);
    }
  }
  an.topY = topY; an.radius = radius; an.skullY = skullY || topY;
  an.eyes = eyes;
  an.eyeY = eyes.length ? eyes.reduce((a, e) => a + v3().subVectors(e, head).dot(up), 0) / eyes.length / unit : 0.08;
  // radio del peinado entre dos alturas (para ajustar gorras, gorros y capucha)
  an.fitR = (y0, y1) => { let r = 0.06; for (let i = 0; i < vol.length; i += 2) if (vol[i] >= y0 && vol[i] <= y1) r = Math.max(r, vol[i + 1]); return r; };
  an.boneInv = (n) => any.skeleton.boneInverses[boneIdx[n]];
  an.chest = bonePos('Bip01_Spine2') || bonePos('Bip01_Spine1');
  an.neck = bonePos('Bip01_Neck') || head;
  def._an = an;
  return an;
}

// ------------------------------------------------------------------
//  Shaders de apariencia (inyectados en copias de los materiales)
// ------------------------------------------------------------------
function uniforms(an) {
  return {
    uSkin: { value: an.skin.clone() }, uSkinTol: { value: 0.09 },
    uTop: { value: new THREE.Color() }, uTopOn: { value: 0 }, uTopLum: { value: an.topLum },
    uLegs: { value: new THREE.Color() }, uLegsOn: { value: 0 }, uLegsLum: { value: an.legsLum },
    uHair: { value: an.hairRef.clone() }, uHairOn: { value: 0 }, uHairLum: { value: an.hairLum }, uHairRef: { value: (an.scalpRef || an.hairRef).clone() }, uScalpLum: { value: an.scalpLum || an.hairLum },
    uBeard: { value: 0 }, uSkullR: { value: an.radius },
  };
}

const COMMON = `
uniform vec3 uSkin, uTop, uLegs, uHair, uHairRef;
uniform float uScalpLum, uSkullR, uSkinTol, uTopOn, uTopLum, uLegsOn, uLegsLum, uHairOn, uHairLum, uBeard;
float lumaOf(vec3 c) { return dot(c, vec3(0.2126, 0.7152, 0.0722)); }
// conserva el sombreado de la tela (pliegues, costuras) con el contraste suavizado
vec3 retint(vec3 c, vec3 target, float refLum) { return target * clamp(pow(lumaOf(c) / refLum, 0.55), 0.4, 1.45); }
float hash2(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
`;

function patch(mat, kind, u) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    const attr = kind === 'body' ? 'attribute float aRegion;\nflat varying float vRegion;' : kind === 'head' ? 'attribute vec3 aHead;\nattribute float aBeard;\nvarying vec3 vHead;\nvarying float vBeard;' : 'attribute vec3 aHead;\nvarying vec3 vHead;';
    const pass = kind === 'body' ? 'vRegion = aRegion;' : kind === 'head' ? 'vHead = aHead; vBeard = aBeard;' : 'vHead = aHead;';
    sh.vertexShader = sh.vertexShader.replace('#include <common>', `#include <common>\n${attr}`).replace('#include <begin_vertex>', `#include <begin_vertex>\n${pass}`);
    const fin = kind === 'body' ? 'flat varying float vRegion;' : kind === 'head' ? 'varying vec3 vHead;\nvarying float vBeard;' : 'varying vec3 vHead;';
    let code;
    if (kind === 'body') {
      code = `{
        vec3 c = diffuseColor.rgb;
        // islas mixtas (prenda con piel al aire): solo se tiñe lo que no es piel
        float mixed = step(3.5, vRegion);
        float r = vRegion - 3.0 * mixed;
        float garment = mix(1.0, smoothstep(uSkinTol, uSkinTol * 1.8, distance(c, uSkin)), mixed);
        if (r > 0.5 && r < 1.5 && uTopOn > 0.5) diffuseColor.rgb = mix(c, retint(c, uTop, uTopLum), garment);
        else if (r > 1.5 && r < 2.5 && uLegsOn > 0.5) diffuseColor.rgb = mix(c, retint(c, uLegs, uLegsLum), garment);
      }`;
    } else if (kind === 'hair') {
      // vHead: x = altura sobre el hueso de la cabeza, y = distancia al eje de la
      // cabeza, z = distancia al ojo (pestañas y cejas no se cortan nunca)
      code = `{
        if (uHairOn > 0.5) diffuseColor.rgb = retint(diffuseColor.rgb, uHair, uHairLum);
      }`;
    } else {
      code = `{
        vec3 c = diffuseColor.rgb;
        // pelo pintado en el cuero cabelludo (cerca del color medio del pelo y por encima de la frente)
        // arriba de la frente, o abajo pero lejos de la cara (coletas, melena por detrás)
        float zone = max(smoothstep(0.07, 0.1, vHead.x), smoothstep(0.1, 0.13, vHead.z) * step(-0.12, vHead.x));
        float hairy = (1.0 - smoothstep(0.06, 0.16, distance(c, uHairRef))) * zone * step(0.035, vHead.z);
        if (uHairOn > 0.5) diffuseColor.rgb = mix(c, retint(c, uHair, uScalpLum), hairy);
        if (uBeard > 0.01 && vBeard > 0.05) {
          float n = hash2(floor(vMapUv * 900.0)) * 0.5 + hash2(floor(vMapUv * 300.0)) * 0.5;
          float k = smoothstep(0.05, 0.6, vBeard) * uBeard * (0.55 + 0.45 * n);
          diffuseColor.rgb = mix(diffuseColor.rgb, uHair * (0.45 + 0.4 * n), clamp(k, 0.0, 0.92));
        }
      }`;
    }
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>\n${COMMON}\n${fin}`).replace('#include <map_fragment>', `#include <map_fragment>\n${code}`);
  };
  mat.customProgramCacheKey = () => 'avatar-' + kind;
  mat.needsUpdate = true;
}

// ------------------------------------------------------------------
//  Accesorios 3D (se construyen en metros alrededor de la cabeza o la espalda
//  en la postura de enlace y se cuelgan del hueso correspondiente)
// ------------------------------------------------------------------
const accMat = (hex, o = {}) => new THREE.MeshStandardMaterial({ color: hex, roughness: 0.75, ...o });

function placeOnBone(an, bones, boneName, obj, worldBind) {
  const bone = bones[boneName];
  if (!bone) return null;
  const inv = an.boneInv(boneName);
  obj.matrixAutoUpdate = false;
  obj.matrix.multiplyMatrices(inv, worldBind);
  bone.add(obj);
  return obj;
}
// matriz de enlace: origen en `p` (espacio del modelo), ejes = lado/arriba/delante, escala = unidades por metro
function frame(an, p) {
  const m = new THREE.Matrix4().makeBasis(an.side, an.up, an.fwd);
  m.scale(v3().setScalar(an.unit));
  m.setPosition(p);
  return m;
}

function buildAccessory(an, id) {
  const it = CLOTHES[id];
  const g = new THREE.Group();
  const col = it.color;
  const R = an.radius;
  if (it.model === 'glasses') {
    const frameM = accMat('#111', { roughness: 0.3, metalness: 0.4 });
    const lensM = new THREE.MeshStandardMaterial({ color: 0x0b0d10, roughness: 0.05, metalness: 0.6, transparent: true, opacity: 0.88 });
    for (const s of [-1, 1]) {
      const lens = new THREE.Mesh(new RoundedBoxGeometry(0.05, 0.034, 0.006, 2, 0.01), lensM);
      lens.position.set(s * 0.032, 0, 0);
      const arm = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.006, 0.1), frameM);
      arm.position.set(s * 0.068, 0.006, -0.05);
      g.add(lens, arm);
    }
    const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.016, 0.005, 0.005), frameM);
    bridge.position.y = 0.01;
    g.add(bridge);
    g.userData.eyes = true;
  } else if (it.model === 'backpack') {
    const bag = new THREE.Mesh(new RoundedBoxGeometry(0.3, 0.4, 0.15, 3, 0.05), accMat(col));
    const pocket = new THREE.Mesh(new RoundedBoxGeometry(0.22, 0.16, 0.05, 2, 0.02), accMat(new THREE.Color(col).multiplyScalar(0.8)));
    pocket.position.set(0, -0.08, -0.08);
    for (const s of [-1, 1]) { const strap = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.42, 0.012), accMat('#1a1d22')); strap.position.set(s * 0.09, 0.02, 0.085); g.add(strap); }
    g.add(bag, pocket);
    g.userData.back = true;
  }
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; } });
  return g;
}

// ------------------------------------------------------------------
//  Avatar
// ------------------------------------------------------------------
export function makeAvatar(model, opts) {
  const an = analyze(model);
  const h = makeRealHuman(model, opts);
  if (!an) { h.apply = () => {}; return h; }
  const u = uniforms(an);
  h.group.traverse((o) => {
    if (!o.isSkinnedMesh) return;
    const kind = o.material.name === 'body' ? 'body' : o.material.name === 'head' ? 'head' : o.material.name === 'opacity' ? 'hair' : null;
    if (!kind) return;
    o.material = o.material.clone();
    patch(o.material, kind, u);
  });
  const bones = {};
  h.group.traverse((o) => { if (o.isBone) bones[o.name] = o; });
  let acc = [];
  h.uniforms = u;
  h.analysis = an;
  // Aplica la apariencia completa: { hair, beard, worn: {slot: id} }
  h.apply = (st) => {
    const hc = HAIR_COLORS[st.hair]?.hex;
    u.uHairOn.value = hc ? 1 : 0;
    u.uHair.value.set(hc || an.hairRef);
    if (!hc) u.uHair.value.copy(an.hairRef);
    u.uBeard.value = an.female ? 0 : BEARDS[st.beard]?.amount || 0;
    const worn = st.worn || {};
    const top = CLOTHES[worn.top], legs = CLOTHES[worn.legs];
    u.uTopOn.value = top ? 1 : 0; if (top) u.uTop.value.set(top.color);
    u.uLegsOn.value = legs ? 1 : 0; if (legs) u.uLegs.value.set(legs.color);
    // accesorios 3D
    for (const a of acc) a.removeFromParent();
    acc = [];
    for (const slot of ['face', 'back']) {
      const id = worn[slot];
      if (!id || !CLOTHES[id]?.model) continue;
      const g = buildAccessory(an, id);
      let p, bone = 'Bip01_Head';
      if (g.userData.eyes && an.eyes.length === 2) p = an.eyes[0].clone().add(an.eyes[1]).multiplyScalar(0.5).addScaledVector(an.fwd, an.unit * 0.03);
      else if (g.userData.back) { p = an.chest.clone().addScaledVector(an.fwd, -an.unit * 0.19).addScaledVector(an.up, -an.unit * 0.05); bone = 'Bip01_Spine2'; }
      else continue;
      if (placeOnBone(an, bones, bone in bones ? bone : 'Bip01_Spine1', g, frame(an, p))) acc.push(g);
    }
  };
  return h;
}

// Color de la manga en primera persona según la prenda de arriba.
export function sleeveFor(look, worn) {
  const top = CLOTHES[worn?.top];
  if (!top || look?.top === 'tee') return null;
  return top.color;
}

export { HAIR_COLORS, BEARDS };
