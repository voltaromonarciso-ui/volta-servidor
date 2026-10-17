import * as THREE from 'three';
import { G, clamp } from '../game.js';
import { input } from '../core/input.js';
import { sfx } from '../core/audio.js';
import { absNow, save } from '../core/state.js';
import { VEHICLES, PARKING, RECOVER_PRICE } from '../data/vehicles.js';
import { buildBike, buildScooter } from '../entities/rideables.js';
import { bendPose, clearPose } from '../entities/avatar.js';
import { addMoney } from './economy.js';

// Conducción de vehículos ligeros (bici, patinete; preparado para más).
// - A pie todo sigue en primera persona; al montar, la cámara pasa suavemente a
//   tercera persona detrás del vehículo y se ve al personaje del jugador.
// - Joystick: arriba acelera, abajo frena / marcha atrás, lados giran.
// - Botones grandes «Frenar» y «Bajar» (tecla Espacio y E en escritorio).
// - Los vehículos quedan aparcados donde los dejas y se guardan en la partida.

const vehicles = new Map();     // uid → { entry, group, hit }
let R = null;                    // vehículo montado: { v, speed, cam, look, blend, leaving, phase }
const camFrom = new THREE.Vector3(), qFrom = new THREE.Quaternion();
const tmp = new THREE.Vector3(), tmpM = new THREE.Matrix4(), tmpQ = new THREE.Quaternion();
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

export const riding = () => R;
const fwdOf = (yaw) => new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw));

// ------------------------------------------------------------------
//  Propiedad y compra
// ------------------------------------------------------------------
export const ownsVehicle = (type) => (G.state.vehicles || []).some((v) => v.type === type);

export function buyVehicle(type) {
  const def = VEHICLES[type];
  if (!def) return { ok: false, msg: 'Ese vehículo no existe.' };
  if (ownsVehicle(type)) return { ok: false, msg: 'Ya tienes uno.' };
  if (G.state.money < def.price) return { ok: false, msg: 'No tienes suficiente dinero.' };
  const p = PARKING[type];
  const entry = { uid: G.state.nextUid++, type, x: p.x, z: p.z, yaw: p.yaw, battery: def.battery ? 1 : null, t: absNow() };
  (G.state.vehicles ||= []).push(entry);
  addMoney(-def.price);
  spawnVehicle(entry);
  save();
  return { ok: true };
}

// La grúa de la tienda lo trae al aparcamiento (si se te ha quedado lejos o atascado).
export function recoverVehicle(type) {
  const e = (G.state.vehicles || []).find((v) => v.type === type);
  if (!e) return { ok: false, msg: 'No tienes ese vehículo.' };
  if (R && R.v.entry === e) return { ok: false, msg: 'Lo estás usando.' };
  if (G.state.money < RECOVER_PRICE) return { ok: false, msg: 'No tienes suficiente dinero.' };
  addMoney(-RECOVER_PRICE);
  park(e, PARKING[type]);
  save();
  return { ok: true };
}

// Recolocar un vehículo aparcado (grúa, pruebas…).
export function moveVehicle(type, p) {
  const e = (G.state.vehicles || []).find((v) => v.type === type);
  if (e && !(R && R.v.entry === e)) park(e, { yaw: e.yaw, ...p });
  return e;
}

function park(e, p) {
  e.x = p.x; e.z = p.z; e.yaw = p.yaw;
  const v = vehicles.get(e.uid);
  if (v) place(v);
}

// ------------------------------------------------------------------
//  Modelos en el mundo
// ------------------------------------------------------------------
function place(v) {
  const e = v.entry;
  v.group.position.set(e.x, 0, e.z);
  v.group.rotation.y = e.yaw;
  v.hit.position.set(e.x, 0.6, e.z);
  v.hit.rotation.y = e.yaw;
  v.hit.updateMatrixWorld();
}

// ¿Se puede estar aquí? (dentro del mapa y sin atravesar paredes)
function freeSpot(x, z, r = 0.45) {
  tmp.set(x, 0, z);
  const moved = G.world.resolve(tmp, r, 0);
  return !moved && Math.abs(x) < 110 && Math.abs(z) < 110;
}

export function spawnVehicle(entry) {
  if (vehicles.has(entry.uid)) return vehicles.get(entry.uid);
  const def = VEHICLES[entry.type];
  if (!def) return null;
  const group = def.kind === 'scooter' ? buildScooter(def.color) : buildBike(def.color);
  G.scene.add(group);
  const hit = new THREE.Mesh(new THREE.BoxGeometry(0.8, 1.2, 1.5), hitMat);
  const v = { entry, group, hit, def };
  hit.userData.ia = {
    enabled: () => !R,
    info: () => def.name + (def.battery ? ` · Batería ${Math.round((entry.battery ?? 1) * 100)}%` : ''),
    actions: () => {
      if (def.battery && (entry.battery ?? 1) <= 0.01) return [{ label: 'Sin batería: aparca en tu nave para cargarlo', fn: () => G.act.toast('Aparca el patinete dentro de tu nave o tu casa y se cargará solo.', '🔋') }];
      return [{ label: `Montar en ${def.kind === 'scooter' ? 'el patinete' : 'la bici'}`, fn: () => mount(v) }];
    },
  };
  G.scene.add(hit);
  G.interactables.push(hit);
  vehicles.set(entry.uid, v);
  place(v);
  return v;
}

// Al cargar la partida: crea los vehículos y devuelve a la tienda los que estén en un sitio imposible.
export function spawnVehicles() {
  for (const v of vehicles.values()) { G.scene.remove(v.group); G.scene.remove(v.hit); const i = G.interactables.indexOf(v.hit); if (i >= 0) G.interactables.splice(i, 1); }
  vehicles.clear();
  R = null;
  const seen = new Set();
  G.state.vehicles = (G.state.vehicles || []).filter((e) => VEHICLES[e.type] && !seen.has(e.type) && seen.add(e.type));
  for (const e of G.state.vehicles) {
    if (!isFinite(e.x) || !isFinite(e.z) || !freeSpot(e.x, e.z, VEHICLES[e.type].radius)) {
      Object.assign(e, PARKING[e.type]);
      G.act.toast?.(`La grúa ha llevado tu ${VEHICLES[e.type].name.toLowerCase()} a la tienda de la avenida del Este.`, '🚚');
    }
    e.t ??= absNow();
    spawnVehicle(e);
  }
}

// ------------------------------------------------------------------
//  Montar y bajar
// ------------------------------------------------------------------
function mount(v) {
  if (R || G.uiOpen || !G.avatar) { if (!G.avatar) G.act.toast('No disponible con este personaje.', '⚠️'); return; }
  R = { v, speed: 0, blend: 0, leaving: false, phase: 0, cam: new THREE.Vector3(), look: new THREE.Vector3() };
  G.riding = R;
  camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion);
  const e = v.entry;
  const f = fwdOf(e.yaw);
  R.cam.set(e.x, 2.2, e.z).addScaledVector(f, -4.2);
  R.look.set(e.x, 1.2, e.z).addScaledVector(f, 2);
  input.sprintToggle = false; input.crouch = false;
  G.avatar.group.visible = true;
  G.avatar.apply(G.act.currentStyle?.() || {});
  document.body.classList.add('riding');
  G.player.pos.set(e.x, 0, e.z);
  sfx('pop');
}

export function brake(on) { if (R) R.braking = on; }

// Sin comprobar sitio (te detienen, etc.): el vehículo se queda donde está.
export function forceDismount() {
  if (!R) return;
  const e = R.v.entry;
  if (G.avatar) { clearPose(G.avatar); G.avatar.group.visible = false; }
  document.body.classList.remove('riding');
  e.t = absNow();
  R = null; G.riding = null;
}

// Bajarse: a un lado del vehículo, al otro o detrás; si no hay sitio, no se baja.
export function dismount() {
  if (!R || R.leaving) return false;
  const e = R.v.entry;
  const f = fwdOf(e.yaw), s = new THREE.Vector3(f.z, 0, -f.x);
  const spots = [s.clone().multiplyScalar(0.9), s.clone().multiplyScalar(-0.9), f.clone().multiplyScalar(-1.3), f.clone().multiplyScalar(1.3)];
  const spot = spots.find((d) => freeSpot(e.x + d.x, e.z + d.z, 0.32));
  if (!spot) { G.act.toast('No hay sitio para bajarte aquí.', '⚠️'); sfx('error'); return false; }
  R.speed = 0;
  G.player.teleport(e.x + spot.x, e.z + spot.z, e.yaw + Math.PI);
  G.player.pitch = -0.15;
  // la cámara vuelve suave desde la tercera persona
  R.leaving = true;
  R.blend = 1;
  camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion);
  clearPose(G.avatar);
  G.avatar.group.visible = false;
  document.body.classList.remove('riding');
  e.t = absNow();
  save();
  sfx('pop');
  return true;
}

// ------------------------------------------------------------------
//  Cada fotograma
// ------------------------------------------------------------------
let chargeT = 0;
export function updateRiding(dt) {
  // carga de baterías aparcadas en tus propiedades (también al saltar el tiempo durmiendo)
  chargeT -= dt;
  if (chargeT <= 0) {
    chargeT = 1;
    const now = absNow();
    for (const v of vehicles.values()) {
      const e = v.entry, def = v.def;
      const mins = Math.max(0, now - (e.t ?? now));
      e.t = now;
      if (!def.battery || (R && R.v === v)) continue;
      if (G.world.inProperty(e.x, e.z)) e.battery = Math.min(1, (e.battery ?? 1) + mins / def.chargeMin);
      if (v.group.userData.led) v.group.userData.led.material.color.setHex((e.battery ?? 1) > 0.25 ? 0x2ecc71 : (e.battery ?? 1) > 0.01 ? 0xf39c12 : 0xe74c3c);
    }
  }
  if (!R) return;
  if (R.leaving) {
    // transición de vuelta a primera persona (la cámara ya la coloca el jugador)
    R.blend = Math.max(0, R.blend - dt * 3);
    const k = R.blend * R.blend * (3 - 2 * R.blend);
    G.camera.position.lerp(camFrom, k);
    G.camera.quaternion.slerp(qFrom, k);
    if (R.blend <= 0) { R = null; G.riding = null; }
    return;
  }
  const v = R.v, e = v.entry, def = v.def;
  // --- conducción
  if (G.uiOpen) R.speed = 0; // un diálogo (p. ej. un cacheo) te para en seco
  const thr = G.uiOpen ? 0 : input.my, steer = G.uiOpen ? 0 : input.mx;
  const empty = def.battery && (e.battery ?? 1) <= 0;
  const top = empty ? 0 : def.max;
  const braking = R.braking || input.brakeKey;
  if (braking && R.speed < 0) R.speed = Math.min(0, R.speed + def.brake * dt);
  else if (braking || (thr < -0.1 && R.speed > 0.2)) R.speed = Math.max(0, R.speed - def.brake * dt * (braking ? 1 : Math.abs(thr)));
  else if (thr > 0.05 && !empty && R.speed < top * thr) R.speed = Math.min(top * thr, R.speed + (R.speed < 0 ? def.brake : def.accel * thr) * dt);
  else if (thr > 0.05) R.speed -= Math.min(Math.max(0, R.speed - top * thr), 1.2 * dt);
  else if (thr < -0.1 && R.speed <= 0.2) R.speed = Math.max(-def.reverse, R.speed - def.accel * 0.5 * dt);
  else R.speed -= Math.sign(R.speed) * Math.min(Math.abs(R.speed), 1.2 * dt); // rueda suelta: se va parando
  if (R.speed > top) R.speed = Math.max(top, R.speed - def.brake * dt);
  const grip = clamp(Math.abs(R.speed) / 3, 0, 1);
  e.yaw -= steer * def.turn * dt * grip * Math.sign(R.speed || 1);
  const f = fwdOf(e.yaw);
  const nx = e.x + f.x * R.speed * dt, nz = e.z + f.z * R.speed * dt;
  tmp.set(nx, 0, nz);
  const bumped = G.world.resolve(tmp, def.radius, 0);
  for (const car of G.cars) car.pushOut(tmp, def.radius);
  if (bumped && Math.abs(R.speed) > 3) { sfx('error'); R.speed *= 0.25; }
  else if (bumped) R.speed *= 0.6;
  e.x = tmp.x; e.z = tmp.z;
  if (def.battery && R.speed > 0) e.battery = Math.max(0, (e.battery ?? 1) - (R.speed * dt) / def.battery);
  place(v);
  // el jugador va con el vehículo (policía, clientes y mapa lo ven ahí)
  G.player.pos.set(e.x, 0, e.z);
  G.player.yaw = e.yaw + Math.PI;
  // --- ruedas, pedales y postura del personaje
  const ud = v.group.userData;
  for (const w of ud.wheels) w.rotation.x += (R.speed * dt) / ud.wheelR;
  const av = G.avatar;
  av.group.position.set(e.x, 0, e.z).addScaledVector(f, def.kind === 'bike' ? -0.2 : -0.08);
  av.group.rotation.y = e.yaw;
  av.animate(dt, 0);
  if (def.kind === 'bike') {
    R.phase += R.speed * dt * 2.2;
    if (ud.crank) ud.crank.rotation.x = R.phase;
    const p = Math.sin(R.phase) * 0.35;
    bendPose(av, [['Bip01_L_Thigh', -1.15 + p], ['Bip01_R_Thigh', -1.15 - p], ['Bip01_L_Calf', 0.9 - p], ['Bip01_R_Calf', 0.9 + p], ['Bip01_L_UpperArm', -0.85], ['Bip01_R_UpperArm', -0.85], ['Bip01_L_Forearm', -0.35], ['Bip01_R_Forearm', -0.35]]);
    av.group.position.y = 0.12;
  } else {
    bendPose(av, [['Bip01_L_UpperArm', -0.8], ['Bip01_R_UpperArm', -0.8], ['Bip01_L_Forearm', -0.45], ['Bip01_R_Forearm', -0.45]]);
    av.group.position.y = ud.deckY;
  }
  // --- cámara en tercera persona: detrás y algo por encima, siempre suave
  const back = 3.9 + clamp(Math.abs(R.speed) * 0.08, 0, 0.8);
  const want = tmp.set(e.x, 2.25, e.z).addScaledVector(f, -back);
  // si hay una pared detrás, la cámara se acerca
  if (!G.world.los(e.x, e.z, want.x, want.z, 2.2)) want.set(e.x, 2.0, e.z).addScaledVector(f, -1.4);
  const k = 1 - Math.exp(-dt * 6);
  R.cam.lerp(want, k);
  R.look.lerp(new THREE.Vector3(e.x, 1.25, e.z).addScaledVector(f, 2.2), k);
  tmpM.lookAt(R.cam, R.look, new THREE.Vector3(0, 1, 0));
  tmpQ.setFromRotationMatrix(tmpM);
  R.blend = Math.min(1, R.blend + dt * 2.2);
  const b = R.blend * R.blend * (3 - 2 * R.blend);
  G.camera.position.lerpVectors(camFrom, R.cam, b);
  G.camera.quaternion.slerpQuaternions(qFrom, tmpQ, b);
}

// Para el HUD
export function ridingInfo() {
  if (!R || R.leaving) return null;
  const e = R.v.entry, def = R.v.def;
  return { name: def.name, kmh: Math.round(Math.abs(R.speed) * 3.6), battery: def.battery ? e.battery ?? 1 : null };
}

export { VEHICLES, PARKING, RECOVER_PRICE };
