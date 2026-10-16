import * as THREE from 'three';
import './style.css';
import { G, on } from './game.js';
import { newState, load, save, hasSave, inv } from './core/state.js';
import { initInput, pollInput, input } from './core/input.js';
import { initAudio, sfx } from './core/audio.js';
import { createWorld } from './world/world.js';
import { createSky, setShadows } from './world/sky.js';
import { initRender, buildComposer, resizeRender, renderFrame, syncHandLights, setQuality, R } from './render.js';
import { makeHuman } from './entities/human.js';
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
const renderer = initRender(document.getElementById('app'));
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(70, 1, 0.08, 1100);
scene.add(camera);
Object.assign(G, { renderer, scene, camera, input });
G.touch = matchMedia('(pointer: coarse)').matches || 'ontouchstart' in window;
if (G.touch) document.body.classList.add('touch');

function resize() {
  const s = G.state?.settings;
  const q = s?.quality || 'alta';
  const base = Math.min(window.devicePixelRatio || 1, G.touch ? (q === 'alta' ? 1.6 : 1.25) : 2);
  const ratio = base * (s ? s.res : 1);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  resizeRender(window.innerWidth, window.innerHeight, ratio);
}
window.addEventListener('resize', resize);

// ------------------------------------------------------------------
//  Mundo (se construye una vez)
// ------------------------------------------------------------------
G.state = newState();
G.world = createWorld(scene);
const sky = createSky(scene);
G.player = new Player(camera);
G.player.teleport(-66, -38, 0);
buildComposer(scene, camera);
resize();

// Leo, tu primo, trabajando en el banco de la nave
const leo = makeHuman({ skin: '#e0ac85', hair: '#16181c', shirt: '#25282e', pants: '#3a5a86', hairStyle: 3, height: 1.02, wide: 1.05 });
const wk = G.world.worker;
leo.group.position.set(wk.x, 0, wk.z);
leo.group.rotation.y = wk.yaw;
scene.add(leo.group);
{
  const hb = new THREE.Mesh(new THREE.BoxGeometry(0.9, 1.9, 0.9), new THREE.MeshBasicMaterial({ visible: false }));
  hb.position.y = 0.95;
  leo.group.add(hb);
  hb.userData.ia = { actions: () => [{ label: 'Hablar con Leo', fn: () => { sfx('click'); toast('Leo: «' + leoTip() + '»', '🧢'); } }] };
  G.interactables.push(hb);
}
function leoTip() {
  const q = G.state.quest;
  const tips = [
    'Deja la caja dentro y ábrela, primo. Te he metido lo básico.',
    'Pon la maceta en el suelo, donde quieras. Aquí hay sitio de sobra.',
    'La tierra la venden en la Ferretería Tornillo, al este de la plaza.',
    'Rubio te deja las semillas en el contenedor verde, aquí al lado.',
    'Primero la tierra, luego la semilla. No tiene más misterio.',
    'El fregadero está junto al banco. Llena la regadera ahí.',
    'Si estás cansado, el catre del fondo es todo tuyo.',
    'Bolsitas y mesa de empaquetado, en la ferretería.',
  ];
  return tips[q] || 'Tú a lo tuyo, que yo vigilo la nave.';
}

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
  quality: (q) => { G.state.settings.quality = q; setQuality(q); resize(); setShadows(q !== 'baja' && G.state.settings.shadows); },
  openStarterBox: () => {
    if (G.world.inProperty(G.player.pos.x, G.player.pos.z) !== 'nave') return toast('Llévala dentro de tu nave antes de abrirla.', '📦');
    inv.remove('caja', 1);
    inv.add('maceta', 1);
    inv.add('regadera', 1);
    inv.add('bolsita', 10);
    G.state.water = 4;
    G.player.use();
    sfx('pop');
    bigToast('Caja abierta', 'Maceta, regadera y bolsitas. Coloca la maceta en el suelo de la nave.');
    G.act.flag('boxOpened');
    G.state.sel = G.state.inv.findIndex((x) => x && x.id === 'maceta');
  },
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
  setQuality(s.settings.quality || 'alta');
  setShadows(s.settings.quality !== 'baja' && s.settings.shadows);
  resize();
  // objetos colocados
  for (const o of [...G.objects.values()]) G.scene.remove(o.group);
  G.objects.clear();
  for (const e of s.objects) spawnObject(e);
  if (!loaded) {
    inv.add('caja', 1);
    unlockStartingCustomers();
  }
  // vecinos
  PEOPLE.forEach((p, i) => G.npcs.push(new NPC(p, G.world.homes[i % G.world.homes.length], i + 1)));
  spawnPolice();
  spawnCars();
  if (s.props.bungalow && G.world.saleSign) G.world.saleSign.visible = false;
  const prop = G.world.props[s.home] || G.world.props.nave;
  if (loaded) G.player.teleport(prop.spawn.x, prop.spawn.z, prop.spawn.yaw);
  else { G.player.teleport(-62.5, -38.2, 0.32); G.player.pitch = -0.08; }

  document.getElementById('menu').classList.add('hide');
  document.getElementById('hud').classList.remove('hide');
  G.paused = false;
  if (!loaded) intro();
  else toast('Partida cargada. ¡Bienvenido de nuevo!', '💾');
  save();
}

function intro() {
  P.messageDialog('Puerto Lomas', `
    <p>Lo perdiste todo en la ciudad. Tu primo Leo te ha prestado una vieja nave en el polígono de Puerto Lomas, una ciudad costera de palmeras donde nunca pasa nada... en apariencia.</p>
    <p>Tienes <b>$350</b> y una caja con lo básico. Cultiva, empaqueta y vende a los vecinos sin que la policía te pille. Construye tu imperio desde cero.</p>
    <p class="muted small">${G.touch ? 'Joystick a la izquierda para moverte, arrastra a la derecha para mirar. ✋ interactuar · agacharse · correr.' : 'WASD moverse · Ratón mirar · E usar · R acción secundaria · Shift correr · C agacharse · Tab móvil · I mochila · 1-0 objetos'}</p>`,
  '¡A trabajar!', () => {
    setTimeout(() => sendMsg('leo', 'Bienvenido, primo. La nave es tuya: deja la caja dentro y ábrela, te he metido lo básico para empezar.'), 1500);
    setTimeout(() => sendMsg('leo', 'Te paso dos contactos: Chema y Nuria. Cuando tengas material, te escribirán. Y ojo: a partir de las 21:00 hay toque de queda, la poli no perdona.'), 8000);
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
    G.state.minute = 18.3 * 60;
    camera.position.set(-50 + Math.cos(menuAng) * 6, 2.2, -33 + Math.sin(menuAng) * 3);
    camera.lookAt(-140, 6, 40);
    G.world.update(dt);
    sky.update(dt);
    renderFrame(false);
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
  leo.animate(dt, 0);
  leo.armR.rotation.x = -0.9 + Math.sin(G.time * 3) * 0.25;
  leo.armL.rotation.x = -0.7 + Math.sin(G.time * 2.3 + 1) * 0.15;
  syncHandLights(sky.hemi, sky.sun, camera, !!G.world.inProperty(G.player.pos.x, G.player.pos.z));
  updateHUD(target, dt);
  phoneT -= dt;
  if (phoneT <= 0) { phoneT = 0.5; tickPhone(); }
  renderFrame(!G.uiOpen);
  frames++; fpsT += dt;
  if (fpsT > 1) { fpsEl.textContent = frames + ' fps'; frames = 0; fpsT = 0; }
}
frame();

// guardar al salir / pasar a segundo plano
document.addEventListener('visibilitychange', () => { if (document.hidden && !G.paused) save(); });
window.addEventListener('beforeunload', () => { if (!G.paused) save(); });

// exponer para depuración
window.__G = G;
window.__debug = {
  arrest, advanceTime, econ: ECON, panels: P, R,
  // ejecuta la acción del centro de la pantalla al instante (para pruebas automáticas)
  act: (secondary = false) => { G.player.update(0, false); camera.updateMatrixWorld(); updateInteract(1); runAction(secondary); },
};
