import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { G } from './game.js';

// Etapa final: viñeta, contraste, saturación y un toque cálido (look "golden hour").
const GradeShader = {
  uniforms: {
    tDiffuse: { value: null },
    vignette: { value: 0.42 },
    saturation: { value: 1.12 },
    contrast: { value: 1.06 },
    warm: { value: new THREE.Vector3(1.03, 1.0, 0.97) },
  },
  vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
  fragmentShader: `
    uniform sampler2D tDiffuse; uniform float vignette; uniform float saturation; uniform float contrast; uniform vec3 warm;
    varying vec2 vUv;
    void main(){
      vec4 c = texture2D(tDiffuse, vUv);
      vec3 col = c.rgb * warm;
      float l = dot(col, vec3(0.299,0.587,0.114));
      col = mix(vec3(l), col, saturation);
      col = (col - 0.5) * contrast + 0.5;
      vec2 d = vUv - 0.5;
      float v = 1.0 - dot(d, d) * vignette * 2.2;
      gl_FragColor = vec4(clamp(col * v, 0.0, 1.0), c.a);
    }`,
};

export const R = { quality: 'alta' };
let composer, bloom, handPass, mainPass, grade;

export function initRender(container) {
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', stencil: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);
  R.renderer = renderer;

  // escena separada para las manos en primera persona
  R.handScene = new THREE.Scene();
  R.handCam = new THREE.PerspectiveCamera(58, 1, 0.01, 10);
  R.handHemi = new THREE.HemisphereLight(0xffffff, 0x444444, 1);
  R.handSun = new THREE.DirectionalLight(0xffffff, 1.5);
  R.handFill = new THREE.PointLight(0xffe2b8, 0.6, 3);
  R.handFill.position.set(0, 0.4, 0.2);
  R.handScene.add(R.handHemi, R.handSun, R.handSun.target, R.handFill);
  return renderer;
}

export function buildComposer(scene, camera) {
  const r = R.renderer;
  const size = r.getDrawingBufferSize(new THREE.Vector2());
  const rt = new THREE.WebGLRenderTarget(size.x, size.y, { type: THREE.HalfFloatType, samples: R.quality === 'alta' ? 4 : 0 });
  composer = new EffectComposer(r, rt);
  mainPass = new RenderPass(scene, camera);
  handPass = new RenderPass(R.handScene, R.handCam);
  handPass.clear = false;
  handPass.clearDepth = true;
  bloom = new UnrealBloomPass(new THREE.Vector2(size.x / 2, size.y / 2), 0.42, 0.55, 0.88);
  grade = new ShaderPass(GradeShader);
  composer.addPass(mainPass);
  composer.addPass(handPass);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());
  composer.addPass(grade);
  R.scene = scene;
  R.camera = camera;
  applyQuality();
}

export function setQuality(q) {
  R.quality = q;
  if (composer) {
    composer.dispose();
    buildComposer(R.scene, R.camera);
  }
}

function applyQuality() {
  const q = R.quality;
  bloom.enabled = q !== 'baja';
  const sun = G.sun;
  if (sun) {
    const sz = q === 'alta' ? 2048 : 1024;
    if (sun.shadow.mapSize.x !== sz) {
      sun.shadow.mapSize.set(sz, sz);
      sun.shadow.map?.dispose();
      sun.shadow.map = null;
    }
  }
  R.renderer.shadowMap.type = q === 'baja' ? THREE.PCFShadowMap : THREE.PCFSoftShadowMap;
}

export function resizeRender(w, h, ratio) {
  const r = R.renderer;
  r.setPixelRatio(ratio);
  r.setSize(w, h);
  R.handCam.aspect = w / h;
  R.handCam.updateProjectionMatrix();
  if (composer) {
    composer.setPixelRatio(ratio);
    composer.setSize(w, h);
  }
}

export function renderFrame(withHands = true) {
  const r = R.renderer;
  if (R.quality === 'baja' || !composer) {
    r.autoClear = true;
    r.render(R.scene, R.camera);
    if (withHands) {
      r.autoClear = false;
      r.clearDepth();
      r.render(R.handScene, R.handCam);
      r.autoClear = true;
    }
    return;
  }
  handPass.enabled = withHands;
  composer.render();
}

// Sincroniza la luz de las manos con la del mundo (en espacio de cámara).
const _q = new THREE.Quaternion(), _v = new THREE.Vector3();
export function syncHandLights(hemi, sun, camera, indoor) {
  R.handHemi.color.copy(hemi.color);
  R.handHemi.groundColor.copy(hemi.groundColor);
  R.handHemi.intensity = hemi.intensity * (indoor ? 1.2 : 1);
  R.handSun.color.copy(sun.color);
  R.handSun.intensity = indoor ? sun.intensity * 0.25 : sun.intensity * 0.9;
  _v.copy(sun.position).sub(sun.target.position).normalize();
  _q.copy(camera.quaternion).invert();
  _v.applyQuaternion(_q);
  R.handSun.position.copy(_v).multiplyScalar(5);
  R.handFill.intensity = indoor ? 1.2 : 0.35;
}
