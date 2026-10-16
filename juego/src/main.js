import * as THREE from 'three';
import './style.css';
import { G, on } from './game.js';
import { newState, load, save, hasSave, inv } from './core/state.js';
import { initInput, pollInput, input } from './core/input.js';
import { initAudio, sfx } from './core/audio.js';
import { createWorld } from './world/world.js';
import { createSky, setShadows } from './world/sky.js';
import { Player } from './entities/player.js';
import { NPC } from './entities/npc.js';
import { spawnCars } from './entities/cars.js';
import { PEOPLE } from './data/people.js';
import { spawnObject, placeObject, updateObjects, hideGhost } from './systems/objects.js';
import { updateInteract, runAction } from './systems/interact.js';
import { updateTime, advanceTime, sleep, checkQuests } from './systems/time.js';
import { spawnPolice, updatePolice, arrest } from './systems/police.js';
import { addXP, sendMsg, deadDropActions, unlockStartingCustomers } from './systems/economy.js';
import { initHUD, updateHUD, toast, bigToast, notify, setWaypoint, clearWaypoint } from './ui/hud.js';
import * as P from './ui/panels.js';
import * as ECON from './systems/economy.js';
import { initPhone, openPhone, closePhone, togglePhone, phoneOpen, tickPhone, settingsPanel } from './ui/phone.js';

// ------------------------------------------------------------------
//  Render
// ------------------------------------------------------------------
const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(72, 1, 0.08, 900);
scene.add(camera);
Object.assign(G, { renderer, scene, camera, input });
G.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (G.touch) document.body.classList.add('touch');

function resize() {
  const s = G.state?.settings;
  const ratio = Math.min(window.devicePixelRatio || 1, G.touch ? 1.5 : 2) * (s ? s.res : 1);
  renderer.setPixelRatio(ratio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
}
window.addEventListener('resize', resize);
resize();

// ------------------------------------------------------------------
//  Mundo (se construye una vez)
// ------------------------------------------------------------------
G.state = newState();
G.world = createWorld(scene);
const sky = createSky(scene);
G.player = new Player(camera);
G.player.teleport(-66, -3, Math.PI / 2);

initInput();
initHUD();
initPhone();

// acciones globales que usan los distintos sistemas
Object.assign(G.act, {
  toast, bigToast, notify, sfx, setWaypoint, clearWaypoint,
  openShop: P.openShop, openPacker: P.openPacker, openMixer: P.openMixer, openShelf: P.openShelf,
  npcActions: P.npcActions, friskDialog: P.friskDialog, bungalowActions: P.bungalowActions,
  deadDropActions, addXP, advanceTime, daySummary: P.daySummary,
  arrested: (r) => P.arrestedDialog(r),
  openPhone: (app, arg) => { P.closePanel(true); openPhone(app, arg); },
  sleep: (prop) => sleep(prop),
  refill: () => {
    if (!inv.count('regadera')) return toast('No llevas regadera.');
    G.state.water = 6; sfx('water'); toast('Regadera llena (6 usos).', '💧');
  },
  flag: (f) => { if (!G.state.flags[f]) { G.state.flags[f] = true; checkQuests(); } },
  questDone: (q, next) => {
    addXP(q.xp);
    sfx('level');
    bigToast(`✔ ${q.title}`, next ? `Siguiente: ${next.title}` : '¡Has completado la historia!');
    if (q.title === 'Paciencia') setTimeout(() => sendMsg('leo', 'Primo, ¡ya tienes cosecha! Empaquétala en bolsitas, que nadie compra cogollos sueltos. Chema y Nuria ya saben de ti.'), 3000);
  },
  fade: (mid) => {
    const f = document.getElementById('fade');
    f.classList.add('on');
    setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 300); }, 650);
  },
  resize,
});

// ------------------------------------------------------------------
//  Botones / teclas
// ------------------------------------------------------------------
on('btn', (b) => {
  if (G.paused) return;
  initAudio();
  if (b === 'escape') {
    if (phoneOpen()) return closePhone();
    if (P.panelOpen()) return P.closePanel();
    return pauseMenu();
  }
  if (b === 'phone') return togglePhone();
  if (b === 'bag') { if (phoneOpen()) closePhone(); return P.panelOpen() ? P.closePanel() : P.openBag(); }
  if (G.uiOpen) return;
  if (b === 'primary') runAction(false);
  if (b === 'secondary') runAction(true);
});

function pauseMenu() {
  const p = P.openPanel({ title: '⏸ Pausa' });
  const resume = document.createElement('button');
  resume.className = 'btn';
  resume.textContent = '▶ Continuar';
  resume.onclick = () => P.closePanel();
  p.body.appendChild(resume);
  settingsPanel(p.body, () => { save(); location.reload(); });
}

// ------------------------------------------------------------------
//  Partida
// ------------------------------------------------------------------
function startGame(fresh) {
  const loaded = !fresh && load();
  G.state = loaded || newState();
  const s = G.state;
  setShadows(s.settings.shadows);
  resize();
  // objetos colocados
  for (const o of [...G.objects.values()]) G.scene.remove(o.group);
  G.objects.clear();
  for (const e of s.objects) spawnObject(e);
  if (!loaded) {
    inv.add('regadera', 1);
    placeObject('pot', -67.6, -4.6, 0);
    unlockStartingCustomers();
  }
  // vecinos
  PEOPLE.forEach((p, i) => G.npcs.push(new NPC(p, G.world.homes[i % G.world.homes.length], i + 1)));
  spawnPolice();
  spawnCars();
  if (s.props.bungalow && G.world.saleSign) G.world.saleSign.visible = false;
  const prop = G.world.props[loaded ? s.home : 'motel'];
  if (loaded) G.player.teleport(prop.spawn.x, prop.spawn.z, prop.spawn.yaw);
  else G.player.teleport(-46, -3, Math.PI / 2);

  document.getElementById('menu').classList.add('hide');
  document.getElementById('hud').classList.remove('hide');
  G.paused = false;
  if (!loaded) intro();
  else toast('Partida cargada. ¡Bienvenido de nuevo!', '💾');
  save();
}

function intro() {
  P.messageDialog('Puerto Lomas', `
    <p>Lo perdiste todo en la ciudad. Tu primo Leo te ha conseguido una habitación barata en el <b>Motel Sol Poniente</b> de Puerto Lomas, un pueblo costero donde nunca pasa nada... en apariencia.</p>
    <p>Tienes <b>$350</b>, una regadera y una maceta. Cultiva, empaqueta y vende a los vecinos sin que la policía te pille. Construye tu imperio desde cero.</p>
    <p class="muted small">${G.touch ? 'Joystick a la izquierda para moverte, arrastra a la derecha para mirar. Botón grande para interactuar.' : 'WASD moverse · Ratón mirar · E usar · R acción secundaria · Shift correr · Tab móvil · I mochila · 1-0 objetos'}</p>`,
  '¡A trabajar!', () => {
    setTimeout(() => sendMsg('leo', 'Bienvenido a Puerto Lomas, primo. Tu habitación es la 3 del motel, tienes la puerta justo enfrente del aparcamiento. Te he dejado una maceta dentro.'), 1500);
    setTimeout(() => sendMsg('leo', 'Te paso dos contactos: Chema y Nuria. Cuando tengas material, te escribirán. Y ojo: a partir de las 21:00 hay toque de queda, la poli no perdona.'), 7000);
    setWaypoint(-63, -3, 'Habitación 3');
  });
}

// menú principal
const menu = document.getElementById('menu');
const cont = document.getElementById('m-continue');
cont.style.display = hasSave() ? '' : 'none';
document.getElementById('m-new').onclick = () => {
  initAudio();
  const go = () => { goFullscreen(); startGame(true); };
  if (hasSave()) P.confirmDialog('Nueva partida', 'Se sobrescribirá tu partida guardada.', 'Empezar', go);
  else go();
};
cont.onclick = () => { initAudio(); goFullscreen(); startGame(false); };

function goFullscreen() {
  if (!G.touch) return;
  const el = document.documentElement;
  (el.requestFullscreen || el.webkitRequestFullscreen)?.call(el)?.catch?.(() => {});
  screen.orientation?.lock?.('landscape').catch(() => {});
}

// ------------------------------------------------------------------
//  Bucle principal
// ------------------------------------------------------------------
const clock = new THREE.Clock();
let fpsT = 0, frames = 0, phoneT = 0;
const fpsEl = document.getElementById('fps');
let menuAng = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  G.time += dt;
  if (G.paused) {
    // cámara orbitando sobre el pueblo en el menú
    menuAng += dt * 0.05;
    camera.position.set(Math.cos(menuAng) * 70, 32, Math.sin(menuAng) * 70 - 10);
    camera.lookAt(0, 4, 10);
    G.world.update(dt);
    sky.update(dt);
    renderer.render(scene, camera);
    return;
  }
  pollInput();
  const gdt = updateTime(dt);
  G.player.update(dt, G.uiOpen);
  for (const n of G.npcs) n.update(dt, gdt);
  updatePolice(dt);
  for (const c of G.cars) c.update(dt);
  updateObjects(dt);
  G.world.update(dt);
  if (G.uiOpen) hideGhost();
  const target = updateInteract(dt);
  sky.update(dt);
  updateHUD(target);
  phoneT -= dt;
  if (phoneT <= 0) { phoneT = 0.5; tickPhone(); }
  renderer.render(scene, camera);
  frames++; fpsT += dt;
  if (fpsT > 1) { fpsEl.textContent = frames + ' fps'; frames = 0; fpsT = 0; }
}
frame();

// guardar al salir / pasar a segundo plano
document.addEventListener('visibilitychange', () => { if (document.hidden && !G.paused) save(); });
window.addEventListener('beforeunload', () => { if (!G.paused) save(); });

// exponer para depuración
window.__G = G;
window.__debug = { arrest, advanceTime, econ: ECON, panels: P };
