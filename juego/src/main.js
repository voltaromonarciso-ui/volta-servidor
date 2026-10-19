import { startStation, updateStation, exitStation, stationAuto } from './systems/station.js';
import { makeAvatar, sleeveFor } from './entities/avatar.js';
import { style, syncInventory } from './systems/appearance.js';
import { openBarber, openClothes, updateDressing, closeDressing, dressingOpen } from './ui/dressing.js';
import { CANDIDATES } from './data/staff.js';
import { validateStaff, updateWorkers, setWorkerFactory, clearWorkers, pokeStaff } from './systems/staff.js';
import { spawnVehicles, updateRiding, dismount, forceDismount, brake, riding } from './systems/riding.js';
import * as THREE from 'three';
import './style.css';
import { G, on } from './game.js';
import { newState, load, save, hasSave, inv, restoreBackup } from './core/state.js';
import { initInput, pollInput, input } from './core/input.js';
import { initAudio, sfx, updateAmbience, audioStatus, setSiren } from './core/audio.js';
import { createWorld, mapV2 } from './world/world.js';
import { createSky, setShadows, nightFactor, setDrawDistance } from './world/sky.js';
import { initRender, buildComposer, resizeRender, renderFrame, syncHandLights, setQuality, R } from './render.js';
import { makeHuman } from './entities/human.js';
import { loadModels, makeRealHuman, MODELS, modelNames } from './entities/models.js';
import { loadVehicles } from './entities/vehicles.js';
import { loadProps } from './world/props.js';
import { loadBuildings } from './world/buildingkit.js';
import { loadGrass } from './world/grass.js';
import { LEO_MODEL } from './entities/npc.js';
import { buildItem } from './entities/hands.js';
import { ITEMS } from './data/items.js';
import { Player } from './entities/player.js';
import { NPC } from './entities/npc.js';
import { setTraffic } from './entities/cars.js';
import { PEOPLE } from './data/people.js';
import { spawnObject, placeObject, updateObjects, hideGhost, furnitureModel, placement, placingMode, rotatePlacement, cancelPlacement, storeMoving } from './systems/objects.js';
import { updateInteract, runAction } from './systems/interact.js';
import { updateTime, advanceTime, sleep, checkQuests } from './systems/time.js';
import { spawnPolice, updatePolice, arrest } from './systems/police.js';
import { updateGangs, clearGangs } from './systems/gangs.js';
import { addXP, sendMsg, deadDropActions, unlockStartingCustomers } from './systems/economy.js';
import { initHUD, updateHUD, toast, bigToast, notify, setWaypoint, clearWaypoint } from './ui/hud.js';
import * as P from './ui/panels.js';
import { openCreator } from './ui/creator.js';
import { applyLayout, fitHud, openLayoutEditor } from './ui/layout.js';
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
  const base = Math.min(window.devicePixelRatio || 1, G.touch ? (q === 'alta' ? 1.4 : q === 'media' ? 1.15 : 0.9) : (q === 'baja' ? 1 : 2));
  const ratio = base * (s ? s.res : 1);
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  resizeRender(window.innerWidth, window.innerHeight, ratio);
  fitHud();
}
window.addEventListener('resize', resize);

// ------------------------------------------------------------------
//  Mundo (se construye una vez)
// ------------------------------------------------------------------
G.state = newState();
let sky, leo;

function buildWorld() {
  G.world = createWorld(scene);
  // exposición de la tienda de muebles
  for (const it of G.world.showroom || []) { const m = furnitureModel(it.type); m.position.set(it.x, 0, it.z); m.rotation.y = it.r; scene.add(m); }
  sky = createSky(scene);
  G.player = new Player(camera);
  G.player.teleport(-66, -38, 0);
  buildComposer(scene, camera);
  resize();
}

// Dependientes detrás de los mostradores (sólo se animan cuando estás cerca)
const clerks = [];
function spawnClerks() {
  const pool = [...modelNames(true), ...modelNames(false)].filter((n) => n !== LEO_MODEL);
  (G.world.clerks || []).forEach((c, i) => {
    if (!pool.length) return;
    const h = makeRealHuman(pool[(i * 5 + 3) % pool.length]);
    h.group.position.set(c.x, 0, c.z);
    h.group.rotation.y = c.yaw;
    scene.add(h.group);
    clerks.push(h);
  });
}

// Leo, tu primo, trabajando en el banco de la nave
function spawnLeo() {
  leo = MODELS[LEO_MODEL] ? makeRealHuman(LEO_MODEL) : makeHuman({ skin: '#d9a47f', hair: '#16181c', shirt: '#25282e', pants: '#3a5a86', hairStyle: 3, top: 'hoodie', height: 1.02, wide: 1.05 });
  if (leo.real) { leo.pose = 'give'; leo.loopGive = true; }
  const wk = G.world.worker;
  leo.group.position.set(wk.x, 0, wk.z);
  leo.group.rotation.y = wk.yaw;
  scene.add(leo.group);
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
    'Sobres vacíos y mesa de empaquetado, en la ferretería. Más adelante, tarros y el hornillo de cristales.',
  ];
  return tips[q] || 'Tú a lo tuyo, que yo vigilo la nave.';
}

initInput();
initHUD();
initPhone();

// acciones globales que usan los distintos sistemas
Object.assign(G.act, {
  toast, bigToast, notify, sfx, setWaypoint, clearWaypoint,
  openShop: P.openShop, openCasino: P.openCasino, openRobbery: P.robberyDialog, openPacker: P.openPacker, startStation, openBarber, openClothes,
  openVehicleShop: P.openVehicleShop, forceDismount, pokeStaff, currentStyle: () => style(),
  // la apariencia ha cambiado: avatar y mangas en primera persona
  lookChanged: () => {
    const look = G.state.look, st = style();
    G.avatar?.apply(st);
    if (look) G.player.applyLook?.({ ...look, shirt: sleeveFor(look, st.worn) || look.shirt });
  }, openShelf: P.openShelf,
  npcActions: P.npcActions, friskDialog: P.friskDialog, bungalowActions: P.bungalowActions,
  deadDropActions, addXP, advanceTime, daySummary: P.daySummary,
  arrested: (r) => P.arrestedDialog(r),
  openPhone: (app, arg) => { P.closePanel(true); openPhone(app, arg); },
  sleep: (prop, opts) => sleep(prop, false, opts),
  openSafe: P.openSafe, openAtm: P.openAtm,
  refill: () => {
    if (!inv.count('regadera')) return toast('No llevas regadera.');
    G.state.water = 6; sfx('water'); toast('Regadera llena (6 usos).', '💧');
  },
  flag: (f) => { if (!G.state.flags[f]) { G.state.flags[f] = true; checkQuests(); } },
  questDone: (q, next) => {
    addXP(q.xp);
    sfx('level');
    bigToast(`✔ ${q.title}`, next ? `Siguiente: ${next.title}` : '¡Has completado la historia!');
    if (q.title === 'Paciencia') setTimeout(() => sendMsg('leo', 'Primo, ¡ya tienes cosecha! Envásala en sobres: nadie compra cogollos sueltos. Cuando crezcas, pásate a los tarros. Chema y Nuria ya saben de ti.'), 3000);
  },
  fade: (mid) => {
    const f = document.getElementById('fade');
    f.classList.add('on');
    setTimeout(() => { mid(); setTimeout(() => f.classList.remove('on'), 300); }, 650);
  },
  resize,
  drawDistance: (d) => { G.state.settings.draw = d; setDrawDistance(d); },
  traffic: (t) => { G.state.settings.traffic = t; setTraffic(t); },
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
    bigToast('Caja abierta', 'Maceta, regadera y sobres vacíos. Coloca la maceta en el suelo de la nave.');
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
  if (b === 'brake') return brake(true);
  if (b === 'brake-off') return brake(false);
  if (b === 'dismount') return dismount();
  if (b === 'rot-left' || b === 'rot-right') { if (!G.uiOpen && placingMode()) rotatePlacement(b === 'rot-left' ? -1 : 1); return; }
  if (b === 'place-cancel') { if (!G.uiOpen) cancelPlacement(); return; }
  if (b === 'place-store') { if (!G.uiOpen) storeMoving(); return; }
  if (b === 'escape') {
    if (G.station) return exitStation();
    if (dressingOpen()) return closeDressing();
    if (!G.uiOpen && placement.moving) return cancelPlacement();
    if (phoneOpen()) return closePhone();
    if (P.panelOpen()) return P.closePanel();
    return pauseMenu();
  }
  if (b === 'phone') return togglePhone();
  if (b === 'bag') { if (phoneOpen()) closePhone(); return P.panelOpen() ? P.closePanel() : P.openBag(); }
  if (G.uiOpen) return;
  // en un vehículo: E / el botón de usar sirven para bajarse
  if (riding()) { if (b === 'primary') dismount(); return; }
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
async function startGame(fresh, look) {
  const loaded = !fresh && load();
  G.state = loaded || newState();
  G.started = true; // desde aquí el bucle del menú ya no toca la hora (la partida cargada conserva la suya)
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
  setTraffic(s.settings.traffic || 'normal');
  setDrawDistance(s.settings.draw || 'larga');
  if (s.props.bungalow && G.world.saleSign) G.world.saleSign.visible = false;
  const prop = G.world.props[s.home] || G.world.props.nave;
  if (loaded) G.player.teleport(prop.spawn.x, prop.spawn.z, prop.spawn.yaw);
  else if (G.world.pois.inicio) { const st = G.world.pois.inicio; G.player.teleport(st.x, st.z, Math.PI); } // isla de Rooktown
  else { G.player.teleport(-62.5, -38.2, 0.32); G.player.pitch = -0.08; }

  if (look) { s.look = look; s.name = String(look.name || '').replace(/[<>&"]/g, '').slice(0, 14); }
  syncInventory();
  // avatar del jugador (se ve en el espejo, el probador y, más adelante, en vehículos)
  if (G.avatar) { G.avatar.group.removeFromParent(); G.avatar = null; }
  if (s.look?.model && MODELS[s.look.model]) {
    G.avatar = makeAvatar(s.look.model);
    G.avatar.group.visible = false;
    scene.add(G.avatar.group);
  }
  G.act.lookChanged();
  spawnVehicles();
  clearWorkers();
  clearGangs();
  validateStaff();
  document.getElementById('menu').classList.add('hide');
  // precompilar lo recién creado (vecinos, coches, objetos) antes de jugar
  const ld = document.getElementById('loading');
  ld.classList.remove('hide');
  setLoad(0.6, 'Preparando la partida…');
  G.player.update(0, true);
  camera.updateMatrixWorld();
  await nextFrame();
  // el avatar se compila ahora (aunque luego quede oculto) para que el espejo no tarde
  if (G.avatar) G.avatar.group.visible = true;
  await warmup(true);
  if (G.avatar) G.avatar.group.visible = false;
  ld.classList.add('hide');
  document.getElementById('hud').classList.remove('hide');
  document.body.classList.add('ingame'); // joystick y botones solo en partida, nunca en el menú
  applyLayout();
  clock.getDelta();
  G.paused = false;
  if (!loaded) intro();
  else toast('Partida cargada. ¡Bienvenido de nuevo!', '💾');
  save();
}

function intro() {
  P.messageDialog('Puerto Lomas', `
    <p>${G.state.name ? `<b>${G.state.name.replace(/[<>&"]/g, '')}</b>, lo` : 'Lo'} perdiste todo en la ciudad. Tu primo Leo te ha prestado una vieja nave en el polígono de Puerto Lomas, una ciudad costera de palmeras donde nunca pasa nada... en apariencia.</p>
    <p>Tienes <b>$350</b> y una caja con lo básico. Cultiva, empaqueta y vende a los vecinos sin que la policía te pille. Construye tu imperio desde cero.</p>
    <p class="muted small">${G.touch ? 'Joystick a la izquierda para moverte, arrastra a la derecha para mirar. Toca la etiqueta que aparece en el centro para interactuar. Toca el objeto que llevas en la barra para abrir la mochila.' : 'WASD moverse · Ratón mirar · E usar · R acción secundaria · Shift correr · C agacharse · Tab móvil · I mochila · 1-0 objetos'}</p>`,
  '¡A trabajar!', () => {
    setTimeout(() => sendMsg('leo', `Bienvenid${G.state.look?.female ? 'a' : 'o'}, ${G.state.name || 'primo'}. La nave es tuya: deja la caja dentro y ábrela, te he metido lo básico para empezar.`), 1500);
    setTimeout(() => sendMsg('leo', 'Te paso dos contactos: Chema y Nuria. Cuando tengas material, te escribirán. Y ojo: a partir de las 21:00 hay toque de queda, la poli no perdona.'), 8000);
  });
}

// menú principal
const menu = document.getElementById('menu');
const cont = document.getElementById('m-continue');
cont.style.display = hasSave() ? '' : 'none';
document.getElementById('m-new').onclick = () => {
  initAudio();
  const go = () => {
    goFullscreen();
    menu.classList.add('hide');
    openCreator((look) => startGame(true, look), () => menu.classList.remove('hide'));
  };
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
//  Carga inicial: construir, cargar modelos y "calentar" la GPU
// ------------------------------------------------------------------
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => r()));
function setLoad(p, text) {
  document.getElementById('ld-bar').style.width = Math.round(p * 100) + '%';
  if (text) document.getElementById('ld-text').textContent = text;
}

async function warmup(withHands) {
  // subir texturas a la GPU
  scene.traverse((o) => {
    const ms = o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : [];
    for (const m of ms) for (const k of ['map', 'emissiveMap', 'normalMap', 'roughnessMap', 'metalnessMap']) if (m[k]) renderer.initTexture(m[k]);
  });
  // compilar todos los materiales (en paralelo si el navegador lo permite)
  try { await renderer.compileAsync(scene, camera); } catch (e) { renderer.compile(scene, camera); }
  if (withHands) {
    const tmp = new THREE.Group();
    tmp.position.set(0, 0, -1);
    for (const id of [...Object.keys(ITEMS), 'cash', 'phone', 'cup', 'shopbag']) {
      try { tmp.add(buildItem({ id, q: 1, p: 'brisa' }).group); } catch (e) { /* objeto sin modelo */ }
    }
    R.handScene.add(tmp);
    try { await renderer.compileAsync(R.handScene, R.handCam); } catch (e) { renderer.compile(R.handScene, R.handCam); }
    R.handScene.remove(tmp);
  }
  // un par de fotogramas para crear mapas de sombras y búferes
  for (let i = 0; i < 3; i++) { renderFrame(withHands); await nextFrame(); }
}

async function boot() {
  setLoad(0.05, 'Construyendo Puerto Lomas…');
  await nextFrame(); await nextFrame();
  try { await Promise.all([loadVehicles(), loadProps(), mapV2() ? loadBuildings() : null, mapV2() ? loadGrass() : null]); } catch (e) { console.warn('Modelos de coches/productos/edificios no disponibles', e); }
  buildWorld();
  setLoad(0.35, 'Cargando personajes…');
  await nextFrame();
  try { await loadModels((p) => setLoad(0.35 + p * 0.35)); } catch (e) { console.warn('Modelos no disponibles', e); }
  spawnLeo();
  spawnClerks();
  // empleados visibles: cada candidato con su propio modelo
  setWorkerFactory((cid) => {
    const m = CANDIDATES.find((c) => c.id === cid)?.model;
    return MODELS[m] ? makeRealHuman(m) : null;
  });
  setLoad(0.75, 'Preparando gráficos…');
  await nextFrame();
  G.state.minute = 18.3 * 60;
  sky.update(0.016);
  camera.position.set(-50, 2.2, -33);
  camera.lookAt(-140, 6, 40);
  await warmup(true);
  await restoreBackup();
  cont.style.display = hasSave() ? '' : 'none';
  setLoad(1, 'Listo');
  document.getElementById('loading').classList.add('hide');
  clock.getDelta();
  frame();
}

// Si el móvil no llega a ~24 fps de forma sostenida, baja la calidad automáticamente.
let lowFps = 0, playSecs = 0;
function autoQuality(fps) {
  const st = G.state.settings;
  if (G.paused || G.uiOpen || st.autoQ === false) return;
  playSecs++;
  if (playSecs < 5) return;
  lowFps = fps < 24 ? lowFps + 1 : 0;
  if (lowFps >= 5 && st.quality !== 'baja') {
    lowFps = 0;
    const q = st.quality === 'alta' ? 'media' : 'baja';
    G.act.quality(q);
    st.quality = q;
    toast(`Calidad gráfica ajustada a ${q} para que vaya más fluido.`, '⚙️');
  } else if (lowFps >= 8 && st.quality === 'baja' && (st.draw || 'larga') !== 'corta') {
    // ya en calidad baja: se acorta también la distancia de dibujo
    lowFps = 0;
    const d = (st.draw || 'larga') === 'larga' ? 'media' : 'corta';
    G.act.drawDistance(d);
    toast(`Distancia de dibujo ajustada a ${d} para que vaya más fluido.`, '⚙️');
  }
}

// ------------------------------------------------------------------
//  Bucle principal
// ------------------------------------------------------------------
const clock = new THREE.Clock();
let fpsT = 0, frames = 0, phoneT = 0;
const fpsEl = document.getElementById('fps');
let menuAng = 0, ambT = 0;

function frame() {
  requestAnimationFrame(frame);
  const dt = Math.min(clock.getDelta(), 0.05);
  G.time += dt;
  if (G.paused) {
    // menú principal: cámara orbitando sobre el pueblo a la hora del atardecer.
    // Con una partida en marcha (editor de controles) no se toca ni el reloj ni la cámara.
    if (!G.started) {
      menuAng += dt * 0.05;
      G.state.minute = 18.3 * 60;
      camera.position.set(-50 + Math.cos(menuAng) * 6, 2.2, -33 + Math.sin(menuAng) * 3);
      camera.lookAt(-140, 6, 40);
    }
    G.world.update(dt);
    sky.update(dt);
    renderFrame(false);
    return;
  }
  pollInput();
  const gdt = updateTime(dt);
  G.player.update(dt, G.uiOpen || !!riding());
  updateRiding(dt);
  updateWorkers(dt);
  updateStation(dt);
  updateDressing(dt);
  for (const n of G.npcs) n.update(dt, gdt);
  updatePolice(dt);
  updateGangs(dt);
  for (const c of G.cars) c.update(dt);
  updateObjects(dt);
  G.world.update(dt);
  if (G.uiOpen) hideGhost();
  const target = riding() ? { actions: [], info: '' } : updateInteract(dt);
  sky.update(dt);
  leo.animate(dt, 0);
  for (const c of clerks) { const near = c.group.position.distanceToSquared(G.player.pos) < 900; c.group.visible = near; if (near) c.animate(dt, 0); }
  leo.armR.rotation.x = -0.9 + Math.sin(G.time * 3) * 0.25;
  leo.armL.rotation.x = -0.7 + Math.sin(G.time * 2.3 + 1) * 0.15;
  syncHandLights(sky.hemi, sky.sun, camera, !!G.world.inProperty(G.player.pos.x, G.player.pos.z));
  ambT -= dt;
  if (ambT <= 0) {
    ambT = 0.25;
    let near = null;
    for (const c of G.cars) { const d = c.g.position.distanceTo(G.player.pos); if (!near || d < near.dist) near = { dist: d, speed: c.speed }; }
    updateAmbience(1 - nightFactor, !!G.world.inProperty(G.player.pos.x, G.player.pos.z), near);
  }
  updateHUD(target, dt);
  phoneT -= dt;
  if (phoneT <= 0) { phoneT = 0.5; tickPhone(); }
  renderFrame(!G.uiOpen && !riding());
  frames++; fpsT += dt;
  if (fpsT > 1) {
    fpsEl.textContent = frames + ' fps';
    autoQuality(frames / fpsT);
    frames = 0; fpsT = 0;
  }
}
boot();

// guardar al salir / pasar a segundo plano
document.addEventListener('visibilitychange', () => { if (document.hidden && !G.paused) save(); });
window.addEventListener('beforeunload', () => { if (!G.paused) save(); });

// exponer para depuración
window.__G = G;
window.__R = R; // para medir llamadas de dibujo en las pruebas
window.__debug = { stationAuto, layout: openLayoutEditor, audio: audioStatus, sfx, setSiren, 
  arrest, advanceTime, econ: ECON, panels: P, R, spawn: (e) => { if (!G.objects.has(e.uid)) spawnObject(e); },
  // ejecuta la acción del centro de la pantalla al instante (para pruebas automáticas)
  act: (secondary = false) => { G.player.update(0, false); camera.updateMatrixWorld(); updateInteract(1); runAction(secondary); },
};
