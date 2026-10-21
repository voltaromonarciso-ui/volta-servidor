import { setPropsLight } from './props.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { setCarLights } from '../entities/vehicles.js';
import { LIT } from './batch.js';
import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { GEO } from './batch.js';

// Cielo degradado, sol con halo, estrellas, nubes, niebla tintada e iluminación
// basada en imagen (el cielo se refleja en los materiales).
let dome, sun, hemi, stars, clouds, sunDisc, sunHalo, moonDisc, pmrem, envScene, envMat, envRT;
const C = (h) => new THREE.Color(h);

// hora, cénit, horizonte, color sol, intensidad sol, intensidad cielo, niebla
const KEYS = [
  [0,    C('#070b1e'), C('#1b1d3c'), C('#7d8cff'), 0.18, 0.3, C('#1a1c34')],
  [4.8,  C('#0e1432'), C('#2c2852'), C('#8c8cff'), 0.2, 0.34, C('#27264a')],
  [6,    C('#4a5c9c'), C('#ffa877'), C('#ffb37a'), 1.4, 0.66, C('#e2a888')],
  [7.6,  C('#3f88d4'), C('#cfe5f2'), C('#fff0d6'), 2.7, 0.98, C('#cddde6')],
  [15,   C('#3b84d0'), C('#d5e8f1'), C('#fff1da'), 2.8, 1.02, C('#d0dde2')],
  [16.4, C('#4f78c0'), C('#f6cf9e'), C('#ffd6a2'), 2.75, 0.92, C('#ead0ad')],
  [17.4, C('#5a62b2'), C('#ffb37c'), C('#ffbf86'), 2.6, 0.82, C('#f0b894')],
  [18.4, C('#4f4a9e'), C('#ff9268'), C('#ff9a62'), 2.1, 0.68, C('#e3967f')],
  [19.4, C('#363170'), C('#d8628a'), C('#ff7f5e'), 0.95, 0.5, C('#a5607f')],
  [20.4, C('#151839'), C('#4f3666'), C('#a08cff'), 0.32, 0.36, C('#3c2d54')],
  [24,   C('#070b1e'), C('#1b1d3c'), C('#7d8cff'), 0.18, 0.3, C('#1a1c34')],
];

const skyShader = () => ({
  side: THREE.BackSide, depthWrite: false, fog: false,
  uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() }, sunDir: { value: new THREE.Vector3() }, sunCol: { value: new THREE.Color() } },
  vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `uniform vec3 top; uniform vec3 bot; uniform vec3 sunDir; uniform vec3 sunCol; varying vec3 vP;
    void main(){
      float h = clamp(vP.y*1.5+0.06,0.0,1.0);
      vec3 col = mix(bot, top, pow(h,0.7));
      float s = max(dot(normalize(vP), normalize(sunDir)), 0.0);
      col += sunCol * (pow(s, 6.0) * 0.45 + pow(s, 64.0) * 0.6) * (1.0 - h * 0.6);
      gl_FragColor = vec4(col, 1.0);
    }`,
});

export function createSky(scene) {
  dome = new THREE.Mesh(new THREE.SphereGeometry(470, 32, 16), new THREE.ShaderMaterial(skyShader()));
  dome.renderOrder = -1;
  scene.add(dome);

  hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a7a66, 1);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  const s = sun.shadow.camera;
  s.left = -40; s.right = 40; s.top = 40; s.bottom = -40; s.near = 1; s.far = 260;
  sun.shadow.bias = -0.0006;
  sun.shadow.normalBias = 0.035;
  sun.shadow.radius = 3;
  sun.shadow.autoUpdate = false;
  scene.add(sun, sun.target);
  G.sun = sun;
  G.hemi = hemi;

  sunDisc = new THREE.Mesh(new THREE.SphereGeometry(13, 20, 12), new THREE.MeshBasicMaterial({ color: 0xffe2a8, fog: false, toneMapped: false }));
  const hc = document.createElement('canvas'); hc.width = hc.height = 128;
  const hg = hc.getContext('2d');
  const grd = hg.createRadialGradient(64, 64, 0, 64, 64, 64);
  grd.addColorStop(0, 'rgba(255,220,170,0.9)'); grd.addColorStop(0.25, 'rgba(255,170,110,0.35)'); grd.addColorStop(1, 'rgba(255,140,90,0)');
  hg.fillStyle = grd; hg.fillRect(0, 0, 128, 128);
  sunHalo = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(hc), transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending }));
  sunHalo.scale.set(160, 160, 1);
  moonDisc = new THREE.Mesh(new THREE.SphereGeometry(8, 16, 10), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }));
  scene.add(sunDisc, sunHalo, moonDisc);

  const sp = [];
  for (let i = 0; i < 900; i++) {
    const v = new THREE.Vector3().randomDirection();
    if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
    v.multiplyScalar(450);
    sp.push(v.x, v.y, v.z);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);

  // nubes alargadas
  clouds = new THREE.Group();
  const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9aa4b0, transparent: true, opacity: 0.55, fog: false, depthWrite: false });
  for (let i = 0; i < 14; i++) {
    const c = new THREE.Group();
    const n = 4 + Math.floor(Math.random() * 4);
    // cada nube es una sola malla (antes 4-7 esferas sueltas)
    const parts = [];
    for (let k = 0; k < n; k++) {
      const g = GEO.sphere.clone();
      g.scale(40 + Math.random() * 40, 3 + Math.random() * 2, 20 + Math.random() * 14);
      g.translate(k * 16 - n * 8, Math.random() * 2, Math.random() * 10 - 5);
      parts.push(g);
    }
    c.add(new THREE.Mesh(mergeGeometries(parts), cm));
    const ca = Math.random() * Math.PI * 2, cr = 220 + Math.random() * 200;
    c.position.set(Math.cos(ca) * cr, 140 + Math.random() * 60, Math.sin(ca) * cr);
    clouds.add(c);
  }
  scene.add(clouds);

  scene.fog = new THREE.Fog(0xbfe3f5, 60, 640);

  // entorno para reflejos
  pmrem = new THREE.PMREMGenerator(G.renderer);
  envScene = new THREE.Scene();
  envMat = new THREE.ShaderMaterial(skyShader());
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(10, 32, 16), envMat));
  const ground = new THREE.Mesh(new THREE.CircleGeometry(9.5, 24), new THREE.MeshBasicMaterial({ color: 0x55504a }));
  ground.rotation.x = -Math.PI / 2; ground.position.y = -1.5;
  envScene.add(ground);
  envScene.userData.ground = ground;
  return { update: updateSky, hemi, sun };
}

function sample(hour) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (hour >= a[0] && hour <= b[0]) {
      const t = (hour - a[0]) / (b[0] - a[0]);
      return {
        top: a[1].clone().lerp(b[1], t), bot: a[2].clone().lerp(b[2], t), sunC: a[3].clone().lerp(b[3], t),
        sunI: a[4] + (b[4] - a[4]) * t, hemiI: a[5] + (b[5] - a[5]) * t, fog: a[6].clone().lerp(b[6], t),
      };
    }
  }
  return sample(0);
}

export let nightFactor = 0;
// Distancia de dibujo: plano lejano de la cámara, niebla y tamaño del cielo (el cielo,
// el sol y la luna se encogen para quedar siempre dentro del plano lejano).
export const DRAW = { corta: { far: 260, fog: [40, 230] }, media: { far: 520, fog: [55, 460] }, larga: { far: 1100, fog: [60, 640] } };
let skyK = 1;
export function setDrawDistance(mode = 'larga') {
  const d = DRAW[mode] || DRAW.larga;
  G.camera.far = d.far;
  G.camera.updateProjectionMatrix();
  G.scene.fog.near = d.fog[0];
  G.scene.fog.far = d.fog[1];
  skyK = Math.min(1, (d.far * 0.88) / 470);
  if (dome) dome.scale.setScalar(skyK);
  if (stars) stars.scale.setScalar(skyK);
}
// Farolas: se encienden a las 19:45 y se apagan a las 6:45 según el reloj del juego.
// Con horas fijas no pueden parpadear (no dependen de un umbral de luz que oscile);
// el encendido y el apagado son un fundido corto.
export const LAMPS_ON = 19.75, LAMPS_OFF = 6.75;
export const lampsShouldBeOn = (hour) => hour >= LAMPS_ON || hour < LAMPS_OFF;
export let lampLevel = 0;
const LAMP_C = C('#ffd88a');
let shadowN = 0;
let envHour = -99;
const _dir = new THREE.Vector3();

export function sunDirection(hour, out = _dir) {
  const a = ((hour - 6) / 12.6) * Math.PI;
  return out.set(Math.cos(a), Math.sin(a) * 0.82, -0.55 * Math.sin(a) + 0.5 * Math.abs(Math.cos(a))).normalize();
}

function updateSky(dt) {
  const hour = G.state.minute / 60;
  const k = sample(hour);
  const dir = sunDirection(hour).clone();
  dome.material.uniforms.top.value.copy(k.top);
  dome.material.uniforms.bot.value.copy(k.bot);
  dome.material.uniforms.sunDir.value.copy(dir);
  dome.material.uniforms.sunCol.value.copy(k.sunC).multiplyScalar(dir.y > -0.15 ? 1 : 0);
  G.scene.fog.color.copy(k.fog);
  hemi.intensity = k.hemiI * 1.15;
  // cielo algo más blanco que el cénit y rebote del suelo cálido y verdoso (césped, piedra)
  hemi.color.copy(k.top).lerp(C('#ffffff'), 0.5);
  hemi.groundColor.copy(k.bot).lerp(C('#7a7048'), 0.65);
  sun.color.copy(k.sunC);
  sun.intensity = k.sunI;

  const night = dir.y < 0.02;
  const lightDir = night ? sunDirection((hour + 12) % 24, new THREE.Vector3()) : dir.clone();
  if (lightDir.y < 0.12) lightDir.y = 0.12;
  const p = G.player ? G.player.pos : new THREE.Vector3();
  const snap = (v) => Math.round(v / 2) * 2;
  // la sombra se recalcula cada pocos fotogramas (G.shadowEvery) y la luz sólo
  // se mueve en esos mismos fotogramas, así no "bailan" entre medias
  shadowN = (shadowN + 1) % (G.shadowEvery || 1);
  if (shadowN === 0) {
    sun.target.position.set(snap(p.x), p.y, snap(p.z)); // con relieve, a la altura del jugador
    sun.position.copy(sun.target.position).addScaledVector(lightDir.normalize(), 140);
    sun.shadow.needsUpdate = true;
  }
  sunDisc.position.copy(G.camera.position).addScaledVector(dir, 420 * skyK);
  sunHalo.position.copy(G.camera.position).addScaledVector(dir, 410 * skyK);
  moonDisc.position.copy(G.camera.position).addScaledVector(dir.clone().negate(), 400 * skyK);
  sunDisc.scale.setScalar(skyK); sunHalo.scale.set(160 * skyK, 160 * skyK, 1); moonDisc.scale.setScalar(skyK);
  sunDisc.visible = sunHalo.visible = dir.y > -0.06;
  sunHalo.material.opacity = clamp(1 - dir.y * 2.2, 0.25, 1);
  sunDisc.material.color.copy(k.sunC).lerp(C('#fff4dc'), 0.4).multiplyScalar(2.2);
  moonDisc.visible = dir.y < 0.1;
  dome.position.copy(G.camera.position);
  stars.position.copy(G.camera.position);

  nightFactor = clamp(hour < 12 ? (6 - hour) / 1.5 : (hour - 19) / 1.5, 0, 1);
  stars.material.opacity = nightFactor;
  const dusk = clamp(hour < 12 ? 0 : (hour - 17.5) / 1.5, 0, 1);
  LIT.value = 0.16 + dusk * 0.12 + nightFactor * 0.16;
  setPropsLight(0.18 + dusk * 0.15 + nightFactor * 0.2);
  setCarLights(Math.max(nightFactor, (dusk - 0.5) * 2));
  for (const m of G.world.winMats) m.emissiveIntensity = m.userData.shop ? 0.45 + dusk * 0.4 + nightFactor * 0.3 : 0.06 + dusk * 0.25 + nightFactor * 0.5;
  for (const m of G.world.signMats || []) m.emissiveIntensity = 0.5 + dusk * 0.5 + nightFactor * 0.4;
  const want = lampsShouldBeOn(hour) ? 1 : 0;
  lampLevel += clamp(want - lampLevel, -dt * 0.8, dt * 0.8);
  if (Math.abs(want - lampLevel) < 0.002) lampLevel = want;
  G.world.bulbMat.color.setHex(0xd8d8d8).lerp(LAMP_C, lampLevel).multiplyScalar(1 + lampLevel * 1.2);
  for (const m of G.world.glowMats || []) m.emissiveIntensity = m.userData.ei0 * (0.06 + lampLevel * 0.94);
  const pools = G.world.lampPoolMesh;
  if (pools) {
    pools.material.opacity = lampLevel * (0.55 + nightFactor * 0.35);
    pools.visible = lampLevel > 0.01 && G.gfx?.lampPools !== false;
  }
  clouds.children.forEach((c) => { c.position.x += dt * 1.5; if (c.position.x > 420) c.position.x = -420; });
  const cmat = clouds.children[0].children[0].material;
  cmat.emissive.copy(k.bot).lerp(k.top, 0.5).multiplyScalar(0.3 + k.hemiI * 0.45);
  cmat.color.copy(k.top).lerp(C('#ffffff'), 0.5).multiplyScalar(0.6 + k.hemiI * 0.4);

  // reflejos del cielo (cada media hora de juego)
  if (Math.abs(hour - envHour) > 0.5 || (hour < envHour && envHour - hour < 23)) {
    envHour = hour;
    envMat.uniforms.top.value.copy(k.top);
    envMat.uniforms.bot.value.copy(k.bot);
    envMat.uniforms.sunDir.value.copy(dir);
    envMat.uniforms.sunCol.value.copy(k.sunC).multiplyScalar(dir.y > -0.1 ? 1.5 : 0);
    envScene.userData.ground.material.color.copy(k.bot).lerp(C('#4a4540'), 0.75).multiplyScalar(0.5 + k.hemiI * 0.5);
    const rt = pmrem.fromScene(envScene, 0, 0.1, 100);
    G.scene.environment = rt.texture;
    if (envRT) envRT.dispose();
    envRT = rt;
  }
  G.scene.environmentIntensity = 0.35 + k.hemiI * 0.35;
}

export function setShadows(on) {
  G.renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  G.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); } });
}
