import * as THREE from 'three';
import { makeHuman } from '../entities/human.js';
import { makeRealHuman, MODELS, modelNames } from '../entities/models.js';
import { LEO_MODEL } from '../entities/npc.js';

// Creador de personaje: nombre, sexo y aspecto (personas realistas con su
// tono de piel, pelo y ropa) con vista previa 3D animada.
const MALE_NAMES = ['Dani', 'Marco', 'Rafa', 'Iker', 'Toni', 'Javi'];
const FEMALE_NAMES = ['Vera', 'Alba', 'Noa', 'Carla', 'Irene', 'Lu'];

const pick = (a) => a[Math.floor(Math.random() * a.length)];
const choices = (female) => modelNames(female).filter((n) => n !== LEO_MODEL);

function lookFor(model, base = {}) {
  const m = MODELS[model] || {};
  return { ...base, model, female: !!m.female, skin: m.skin || '#d29a72', shirt: m.sleeve || '#2a2d34', top: m.sleeve === m.skin ? 'tee' : 'hoodie' };
}

export function randomPlayerLook(female = Math.random() < 0.5) {
  const list = choices(female);
  const base = { name: pick(female ? FEMALE_NAMES : MALE_NAMES), female };
  return list.length ? lookFor(pick(list), base) : { ...base, skin: '#d29a72', shirt: '#2a2d34', top: 'hoodie' };
}

export function openCreator(onDone, onCancel) {
  const look = randomPlayerLook();
  const root = document.createElement('div');
  root.id = 'creator';
  root.innerHTML = `
    <div class="cr-view"><canvas></canvas><div class="cr-hint">Arrastra para girar</div></div>
    <div class="cr-side">
      <div class="cr-title">Tu personaje</div>
      <div class="cr-scroll"></div>
      <div class="cr-actions"><button class="btn ghost sm cr-back">Atrás</button><button class="btn ghost sm cr-rand">🎲 Aleatorio</button><button class="btn cr-go">Empezar</button></div>
    </div>`;
  document.body.appendChild(root);
  const box = root.querySelector('.cr-scroll');

  // --- vista previa ---
  const canvas = root.querySelector('canvas');
  const r = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  r.outputColorSpace = THREE.SRGBColorSpace;
  r.toneMapping = THREE.ACESFilmicToneMapping;
  r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight(0xfff4e6, 0x4a3f38, 1.5));
  const key = new THREE.DirectionalLight(0xffe0b8, 2.6); key.position.set(2, 3, 3); scene.add(key);
  const rim = new THREE.DirectionalLight(0x9ec8ff, 1.6); rim.position.set(-3, 2, -3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(0.75, 40), new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.35 }));
  floor.rotation.x = -Math.PI / 2; scene.add(floor);
  const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 30);
  let human = null, yaw = 0.35, zoom = 0, zoomT = 0;
  const rebuild = () => {
    if (human) scene.remove(human.group);
    human = look.model && MODELS[look.model] ? makeRealHuman(look.model) : makeHuman(look);
    human.group.rotation.y = yaw;
    scene.add(human.group);
  };
  const size = () => {
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (!w || !h) return;
    r.setSize(w, h, false);
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
  };
  let raf, last = performance.now();
  const loop = (t) => {
    raf = requestAnimationFrame(loop);
    const dt = Math.min(0.05, (t - last) / 1000); last = t;
    size();
    if (!drag) yaw += dt * 0.25;
    zoom += (zoomT - zoom) * Math.min(1, dt * 5);
    human.group.rotation.y = yaw;
    human.animate(dt, 0);
    const d = 5.4 - zoom * 3.2, y = 0.9 + zoom * 0.62;
    cam.position.set(0, y + 0.1, d);
    cam.lookAt(0, y, 0);
    r.render(scene, cam);
  };
  let drag = null;
  canvas.addEventListener('pointerdown', (e) => { drag = e.clientX; canvas.setPointerCapture(e.pointerId); });
  canvas.addEventListener('pointermove', (e) => { if (drag !== null) { yaw += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  canvas.addEventListener('pointerup', () => { drag = null; });
  canvas.addEventListener('pointercancel', () => { drag = null; });

  // --- controles ---
  const section = (title) => {
    const s = document.createElement('div');
    s.className = 'cr-sec';
    s.innerHTML = `<div class="cr-lbl">${title}</div>`;
    box.appendChild(s);
    return s;
  };
  const chips = (parent, opts, get, set) => {
    const row = document.createElement('div');
    row.className = 'cr-row';
    for (const [v, label] of opts) {
      const b = document.createElement('button');
      b.className = 'cr-chip' + (get() === v ? ' on' : '');
      b.textContent = label;
      b.onclick = () => { set(v); render(); };
      row.appendChild(b);
    }
    parent.appendChild(row);
  };
  const render = () => {
    const keepScroll = box.scrollTop;
    box.innerHTML = '';
    const sn = section('Nombre');
    const inp = document.createElement('input');
    inp.className = 'cr-name'; inp.maxLength = 14; inp.value = look.name; inp.placeholder = 'Tu nombre';
    inp.oninput = () => { look.name = inp.value; };
    sn.appendChild(inp);
    chips(section('Sexo'), [[false, 'Hombre'], [true, 'Mujer']], () => look.female, (v) => {
      if (look.female === v) return;
      const list = choices(v);
      Object.assign(look, list.length ? lookFor(list[0], look) : {}, { female: v });
      if ((v ? MALE_NAMES : FEMALE_NAMES).includes(look.name)) look.name = pick(v ? FEMALE_NAMES : MALE_NAMES);
    });
    // aspecto: cada opción es una persona con su piel, pelo y ropa
    const sa = section('Aspecto · piel, pelo y ropa');
    const grid = document.createElement('div');
    grid.className = 'cr-grid';
    for (const n of choices(look.female)) {
      const m = MODELS[n];
      const b = document.createElement('button');
      b.className = 'cr-look' + (look.model === n ? ' on' : '');
      b.innerHTML = `<span class="cr-dots"><i style="background:${m.skin}"></i><i style="background:${m.sleeve}"></i></span>${m.label}`;
      b.onclick = () => { Object.assign(look, lookFor(n, look)); render(); };
      grid.appendChild(b);
    }
    sa.appendChild(grid);
    box.scrollTop = keepScroll;
    rebuild();
  };
  render();
  raf = requestAnimationFrame(loop);

  const close = () => {
    cancelAnimationFrame(raf);
    r.dispose();
    r.forceContextLoss?.();
    root.remove();
  };
  root.querySelector('.cr-rand').onclick = () => { Object.assign(look, randomPlayerLook()); render(); };
  root.querySelector('.cr-back').onclick = () => { close(); onCancel?.(); };
  root.querySelector('.cr-go').onclick = () => {
    look.name = (look.name || '').trim() || pick(look.female ? FEMALE_NAMES : MALE_NAMES);
    close();
    onDone({ ...look });
  };
  // zoom a la cara al tocar el nombre o el pelo
  box.addEventListener('focusin', () => { zoomT = 1; });
  box.addEventListener('focusout', () => { zoomT = 0; });
  return { close };
}
