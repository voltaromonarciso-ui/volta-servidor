import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { GEO } from './batch.js';

// Cielo degradado, sol/luna, estrellas, nubes y ciclo de iluminación.
let dome, sun, hemi, stars, clouds, sunDisc, moonDisc;
const C = (h) => new THREE.Color(h);

const KEYS = [
  // hora, cénit, horizonte, luz sol, intensidad sol, hemi, niebla
  [0,  C('#0b1026'), C('#1a2340'), C('#7d8cff'), 0.25, 0.35],
  [5,  C('#141a3a'), C('#3a3560'), C('#8c8cff'), 0.25, 0.4],
  [6,  C('#4a6fa5'), C('#f6a96b'), C('#ffb37a'), 1.2, 0.7],
  [7.5,C('#4d9de0'), C('#bfe3f5'), C('#fff1d6'), 2.4, 1.0],
  [16, C('#4596db'), C('#c6e6f7'), C('#fff1d6'), 2.4, 1.0],
  [19, C('#3d5f9e'), C('#f7915a'), C('#ff9a5a'), 1.4, 0.75],
  [20.5,C('#1d2552'),C('#6a4a7a'), C('#a08cff'), 0.4, 0.45],
  [24, C('#0b1026'), C('#1a2340'), C('#7d8cff'), 0.25, 0.35],
];

export function createSky(scene) {
  const mat = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { top: { value: new THREE.Color() }, bot: { value: new THREE.Color() } },
    vertexShader: 'varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: 'uniform vec3 top; uniform vec3 bot; varying vec3 vP; void main(){ float h = clamp(vP.y*1.6+0.1,0.0,1.0); gl_FragColor = vec4(mix(bot, top, pow(h,0.8)),1.0); }',
  });
  dome = new THREE.Mesh(new THREE.SphereGeometry(480, 24, 12), mat);
  dome.renderOrder = -1;
  scene.add(dome);

  hemi = new THREE.HemisphereLight(0xcfe8ff, 0x8a8172, 1);
  scene.add(hemi);
  sun = new THREE.DirectionalLight(0xffffff, 2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(1024, 1024);
  const s = sun.shadow.camera;
  s.left = -45; s.right = 45; s.top = 45; s.bottom = -45; s.near = 1; s.far = 220;
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.04;
  scene.add(sun, sun.target);

  sunDisc = new THREE.Mesh(new THREE.SphereGeometry(14, 12, 8), new THREE.MeshBasicMaterial({ color: 0xfff2c4, fog: false }));
  moonDisc = new THREE.Mesh(new THREE.SphereGeometry(9, 12, 8), new THREE.MeshBasicMaterial({ color: 0xe8ecff, fog: false }));
  scene.add(sunDisc, moonDisc);

  // estrellas
  const sp = [];
  for (let i = 0; i < 700; i++) {
    const v = new THREE.Vector3().randomDirection();
    if (v.y < 0.05) v.y = Math.abs(v.y) + 0.05;
    v.multiplyScalar(450);
    sp.push(v.x, v.y, v.z);
  }
  const sg = new THREE.BufferGeometry();
  sg.setAttribute('position', new THREE.Float32BufferAttribute(sp, 3));
  stars = new THREE.Points(sg, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, transparent: true, opacity: 0, fog: false }));
  scene.add(stars);

  // nubes low-poly
  clouds = new THREE.Group();
  const cm = new THREE.MeshLambertMaterial({ color: 0xffffff, emissive: 0x9aa4b0, flatShading: true, transparent: true, opacity: 0.95, fog: false });
  for (let i = 0; i < 18; i++) {
    const c = new THREE.Group();
    const n = 3 + Math.floor(Math.random() * 3);
    for (let k = 0; k < n; k++) {
      const m = new THREE.Mesh(GEO.ico, cm);
      m.scale.set(18 + Math.random() * 12, 7 + Math.random() * 4, 14 + Math.random() * 8);
      m.position.set(k * 11 - n * 5, Math.random() * 2, Math.random() * 8 - 4);
      c.add(m);
    }
    c.position.set((Math.random() - 0.5) * 600, 110 + Math.random() * 40, (Math.random() - 0.5) * 600);
    clouds.add(c);
  }
  scene.add(clouds);

  scene.fog = new THREE.Fog(0xbfe3f5, 80, 320);
  return { update: updateSky };
}

function sample(hour) {
  for (let i = 0; i < KEYS.length - 1; i++) {
    const a = KEYS[i], b = KEYS[i + 1];
    if (hour >= a[0] && hour <= b[0]) {
      const t = (hour - a[0]) / (b[0] - a[0]);
      return {
        top: a[1].clone().lerp(b[1], t), bot: a[2].clone().lerp(b[2], t), sunC: a[3].clone().lerp(b[3], t),
        sunI: a[4] + (b[4] - a[4]) * t, hemiI: a[5] + (b[5] - a[5]) * t,
      };
    }
  }
  return sample(0);
}

export let nightFactor = 0;

function updateSky(dt) {
  const hour = G.state.minute / 60;
  const k = sample(hour);
  dome.material.uniforms.top.value.copy(k.top);
  dome.material.uniforms.bot.value.copy(k.bot);
  G.scene.fog.color.copy(k.bot).lerp(k.top, 0.25);
  hemi.intensity = k.hemiI;
  hemi.color.copy(k.top).lerp(C('#ffffff'), 0.6);
  sun.color.copy(k.sunC);
  sun.intensity = k.sunI;

  // trayectoria solar (sale por el este, se pone por el oeste)
  const a = ((hour - 6) / 12) * Math.PI;
  const dir = new THREE.Vector3(Math.cos(a), Math.sin(a), -0.35).normalize();
  const night = hour < 6 || hour > 18.5;
  const lightDir = night ? dir.clone().negate().setZ(-0.35).normalize() : dir;
  if (lightDir.y < 0.15) lightDir.y = 0.15;
  const p = G.player ? G.player.pos : new THREE.Vector3();
  const snap = (v) => Math.round(v / 4) * 4;
  sun.target.position.set(snap(p.x), 0, snap(p.z));
  sun.position.copy(sun.target.position).addScaledVector(lightDir.normalize(), 120);
  sunDisc.position.copy(G.camera.position).addScaledVector(dir, 400);
  moonDisc.position.copy(G.camera.position).addScaledVector(dir.clone().negate(), 400);
  sunDisc.visible = dir.y > -0.1;
  moonDisc.visible = dir.y < 0.1;
  dome.position.copy(G.camera.position);
  stars.position.copy(G.camera.position);

  nightFactor = clamp(hour < 12 ? (6 - hour) / 1.5 : (hour - 19) / 1.5, 0, 1);
  stars.material.opacity = nightFactor;
  for (const m of G.world.winMats) m.emissiveIntensity = 0.12 + nightFactor * 0.95;
  G.world.bulbMat.color.setHex(nightFactor > 0.3 ? 0xffe9a8 : 0xd8d8d8);
  clouds.children.forEach((c) => { c.position.x += dt * 2; if (c.position.x > 320) c.position.x = -320; });
  const cmat = clouds.children[0].children[0].material;
  cmat.emissive.copy(k.bot).lerp(C('#ffffff'), 0.4).multiplyScalar(0.25 + k.hemiI * 0.45);
}

export function setShadows(on) {
  G.renderer.shadowMap.enabled = on;
  sun.castShadow = on;
  G.scene.traverse((o) => { if (o.material) { (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => (m.needsUpdate = true)); } });
}
