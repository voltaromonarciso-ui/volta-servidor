import * as THREE from 'three';
import { G, clamp, randi } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { inv, slotsCount } from '../core/state.js';
import { removeBox } from '../world/world.js';
import { mat } from '../entities/human.js';
import { sfx } from '../core/audio.js';
import { ensureBaseProduct } from './economy.js';
import { absNow } from '../core/state.js';
import { buildPacker, buildJarPacker, buildStove } from '../world/benches.js';

// Objetos colocables dentro de tus propiedades (macetas, mesas, máquinas...).
export const FOOT = {
  pot: [0.8, 0.8], packer: [1.6, 0.9], lamp: [0.6, 0.6], shelf: [1.6, 0.6], jarpacker: [1.3, 0.8], stove: [1.2, 0.75],
};
const ITEM_OF = { pot: 'maceta', packer: 'mesa_emp', lamp: 'lampara', shelf: 'estante', jarpacker: 'envasadora', stove: 'hornillo' };
// Hornillo: receta y tiempo de cada tanda de cristales
export const RECIPE = { azucar: 2, colorante: 1, catalizador: 1 };
const COOK_MIN = 120, COOK_OUT = 6;
const GROW_MIN = 14 * 60;     // minutos de juego para crecer del todo
const DRAIN_MIN = 10 * 60;    // minutos que dura el agua

const bx = new THREE.BoxGeometry(1, 1, 1);
const cyl = new THREE.CylinderGeometry(0.5, 0.5, 1, 12);
const cylTaper = new THREE.CylinderGeometry(0.5, 0.38, 1, 12);
const hitMat = new THREE.MeshBasicMaterial({ visible: false });

function mesh(geo, color, sx, sy, sz, x = 0, y = 0, z = 0, parent) {
  const m = new THREE.Mesh(geo, typeof color === 'string' ? mat(color) : color);
  m.scale.set(sx, sy, sz);
  m.position.set(x, y, z);
  m.castShadow = true;
  m.receiveShadow = true;
  parent && parent.add(m);
  return m;
}

// ------------------------------------------------------------------
//  Crear / quitar
// ------------------------------------------------------------------
export function spawnObject(entry) {
  const o = { entry, group: new THREE.Group() };
  o.group.position.set(entry.x, 0, entry.z);
  o.group.rotation.y = entry.r || 0;
  G.scene.add(o.group);
  BUILD[entry.type](o);
  const [fw, fd] = footprint(entry.type, entry.r);
  o.col = G.world.addBox(entry.x - fw / 2, entry.x + fw / 2, entry.z - fd / 2, entry.z + fd / 2, entry.type === 'lamp' ? 2 : 1.1, 'obj');
  const hb = new THREE.Mesh(bx, hitMat);
  const [w, d] = FOOT[entry.type];
  const h = entry.type === 'shelf' ? 1.8 : entry.type === 'lamp' ? 2 : 1.2;
  hb.scale.set(w + 0.1, h, d + 0.1);
  hb.position.y = h / 2;
  hb.userData.ia = { actions: () => actionsFor(o), info: () => infoFor(o) };
  o.group.add(hb);
  G.interactables.push(hb);
  o.hit = hb;
  G.objects.set(entry.uid, o);
  if (entry.type === 'pot') refreshPot(o);
  return o;
}

export function footprint(type, r = 0) {
  const [w, d] = FOOT[type];
  return Math.abs(Math.sin(r)) > 0.5 ? [d, w] : [w, d];
}

function removeObject(o) {
  G.scene.remove(o.group);
  removeBox(o.col);
  const i = G.interactables.indexOf(o.hit);
  if (i >= 0) G.interactables.splice(i, 1);
  G.objects.delete(o.entry.uid);
  G.state.objects = G.state.objects.filter((e) => e.uid !== o.entry.uid);
}

function pickUp(o) {
  const id = ITEM_OF[o.entry.type];
  if (inv.room(id) < 1) return G.act.toast('No tienes hueco en el inventario.');
  if (o.entry.type === 'shelf' && o.entry.data.slots.some(Boolean)) return G.act.toast('Vacía la estantería antes de recogerla.');
  inv.add(id, 1);
  removeObject(o);
  sfx('pop');
}

export function placeObject(type, x, z, r) {
  const entry = { uid: G.state.nextUid++, type, x, z, r, data: {} };
  if (type === 'pot') entry.data = { soil: 0, strain: null, growth: 0, water: 0, fert: 0 };
  if (type === 'shelf') entry.data = { slots: Array(12).fill(null) };
  if (type === 'stove') entry.data = { batch: null };
  if (type === 'jarpacker') G.state.flags.jars = true;
  G.state.objects.push(entry);
  return spawnObject(entry);
}

// ------------------------------------------------------------------
//  Modelos
// ------------------------------------------------------------------
const BUILD = {
  pot(o) {
    const g = o.group;
    const potM = new THREE.MeshStandardMaterial({ color: 0xb5602a, roughness: 0.85 });
    mesh(cylTaper, potM, 0.62, 0.5, 0.62, 0, 0.25, 0, g);
    mesh(cyl, new THREE.MeshStandardMaterial({ color: 0xa2541f, roughness: 0.8 }), 0.67, 0.07, 0.67, 0, 0.5, 0, g);
    o.soil = mesh(cyl, new THREE.MeshStandardMaterial({ color: 0x5a3c22, roughness: 1 }), 0.57, 0.04, 0.57, 0, 0.495, 0, g);
    o.plant = new THREE.Group();
    o.plant.position.y = 0.5;
    g.add(o.plant);
    o.leafMat = new THREE.MeshStandardMaterial({ color: 0x2f8f7a, roughness: 0.6 });
    o.petalMat = new THREE.MeshStandardMaterial({ color: 0x8fe0b0, roughness: 0.4, emissive: 0x2fbf6a, emissiveIntensity: 0.4, side: THREE.DoubleSide });
    o.coreMat = new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0x7dffb0, emissiveIntensity: 1.5, roughness: 0.3 });
    const stemM = new THREE.MeshStandardMaterial({ color: 0x3f7f5a, roughness: 0.7 });
    // tallo principal ligeramente curvado
    for (let i = 0; i < 5; i++) mesh(cyl, stemM, 0.06 - i * 0.006, 0.22, 0.06 - i * 0.006, Math.sin(i * 0.6) * 0.03, 0.11 + i * 0.2, 0, o.plant);
    // hojas anchas y redondeadas (nada parecido a plantas reales)
    const leafG = new THREE.SphereGeometry(0.5, 12, 8);
    for (let i = 0; i < 8; i++) {
      const a = i * 2.3, y = 0.12 + i * 0.1;
      const lf = mesh(leafG, o.leafMat, 0.26 - i * 0.012, 0.035, 0.15, Math.cos(a) * 0.14, y, Math.sin(a) * 0.14, o.plant);
      lf.rotation.set(0, -a, 0.35);
    }
    // flores luminosas: núcleo brillante + corona de pétalos
    o.buds = [];
    const petalG = new THREE.SphereGeometry(0.5, 10, 6);
    const coreG = new THREE.SphereGeometry(0.5, 12, 10);
    const spots = [[0, 1.05, 0, 1.25], [0.14, 0.86, 0.05, 0.95], [-0.12, 0.74, 0.1, 0.9], [0.06, 0.62, -0.14, 0.85], [-0.1, 0.92, -0.1, 0.9]];
    for (const [x, y, z, k] of spots) {
      const fl = new THREE.Group();
      fl.position.set(x, y, z);
      fl.rotation.set(x * 2, 0, -x * 2);
      mesh(coreG, o.coreMat, 0.07 * k, 0.07 * k, 0.07 * k, 0, 0.02, 0, fl);
      for (let p = 0; p < 6; p++) {
        const pa = (p / 6) * Math.PI * 2;
        const pt = mesh(petalG, o.petalMat, 0.13 * k, 0.025, 0.07 * k, Math.cos(pa) * 0.07 * k, 0.01, Math.sin(pa) * 0.07 * k, fl);
        pt.rotation.set(0, -pa, 0.45);
      }
      o.plant.add(fl);
      o.buds.push(fl);
    }
  },
  packer: buildPacker,
  jarpacker: buildJarPacker,
  stove: buildStove,
  lamp(o) {
    const g = o.group;
    mesh(cyl, '#2c3e50', 0.5, 0.06, 0.5, 0, 0.03, 0, g);
    mesh(cyl, '#95a5a6', 0.05, 1.8, 0.05, 0, 0.9, 0, g);
    mesh(bx, '#34495e', 0.7, 0.1, 0.4, 0, 1.85, 0.25, g);
    mesh(bx, new THREE.MeshBasicMaterial({ color: 0xff8ef0 }), 0.6, 0.03, 0.32, 0, 1.79, 0.25, g);
  },
  shelf(o) {
    const g = o.group;
    for (const x of [-0.78, 0.78]) mesh(bx, '#5d6d7e', 0.05, 1.8, 0.6, x, 0.9, 0, g);
    for (const y of [0.1, 0.6, 1.1, 1.6]) mesh(bx, '#85929e', 1.6, 0.04, 0.58, 0, y, 0, g);
    o.boxes = [];
    for (let i = 0; i < 6; i++) o.boxes.push(mesh(bx, '#a57a49', 0.4, 0.3, 0.4, -0.5 + (i % 3) * 0.5, 0.27 + Math.floor(i / 3) * 0.5, 0, g));
  },
};

// ------------------------------------------------------------------
//  Macetas
// ------------------------------------------------------------------
export function refreshPot(o) {
  const d = o.entry.data;
  const has = !!d.strain;
  o.soil.visible = d.soil > 0;
  o.soil.material.color.setHex(d.water > 0.05 ? 0x3b2615 : 0x6b4a2c);
  if (d.soil === 2) o.soil.material.color.offsetHSL(0, 0, -0.03);
  o.plant.visible = has;
  if (!has) return;
  const s = STRAINS[d.strain];
  const g = clamp(d.growth, 0, 1);
  const sc = 0.15 + g * 0.95;
  o.plant.scale.set(0.5 + g * 0.6, sc, 0.5 + g * 0.6);
  const leaf = new THREE.Color(0x2f8f7a);
  if (d.water <= 0.001) leaf.lerp(new THREE.Color(0x8a7a4a), 0.6);
  o.leafMat.color.copy(leaf);
  const col = new THREE.Color(s.color);
  o.petalMat.color.copy(col).lerp(new THREE.Color(0xffffff), 0.35);
  o.petalMat.emissive.copy(col);
  o.coreMat.emissive.copy(col).lerp(new THREE.Color(0xffffff), 0.3);
  const bloom = clamp((g - 0.45) / 0.55, 0, 1);
  o.coreMat.emissiveIntensity = 0.6 + bloom * 2.2;
  o.petalMat.emissiveIntensity = 0.15 + bloom * 0.6;
  o.buds.forEach((b, i) => { b.visible = g > 0.42 + i * 0.06; b.scale.setScalar(0.5 + bloom * 0.5); });
}

function lampBoost(o) {
  for (const other of G.objects.values()) {
    if (other.entry.type === 'lamp' && Math.hypot(other.entry.x - o.entry.x, other.entry.z - o.entry.z) < 2.6) return 1.5;
  }
  return 1;
}

// Avanza el cultivo `min` minutos de juego (vale para saltos grandes al dormir).
export function simulateObjects(min) {
  for (const o of G.objects.values()) {
    if (o.entry.type !== 'pot') continue;
    const d = o.entry.data;
    if (!d.strain || d.growth >= 1) { if (d.water > 0) d.water = Math.max(0, d.water - min / DRAIN_MIN); continue; }
    const wet = Math.min(min, (d.water * DRAIN_MIN));
    const rate = (STRAINS[d.strain].speed * (d.soil === 2 ? 1.25 : 1) * lampBoost(o)) / GROW_MIN;
    d.growth = Math.min(1, d.growth + rate * wet);
    d.water = Math.max(0, d.water - min / DRAIN_MIN);
  }
}

let refreshT = 0;
export function updateObjects(dt) {
  refreshT -= dt;
  if (refreshT <= 0) {
    refreshT = 0.5;
    for (const o of G.objects.values()) if (o.entry.type === 'pot') refreshPot(o);
  }
  for (const o of G.objects.values()) if (o.spin) o.spin.rotation.y += dt * (o.busy ? 12 : 0.3);
  for (const o of G.objects.values()) {
    if (o.entry.type !== 'stove') continue;
    const b = o.entry.data.batch, now = absNow();
    const cooking = b && now < b.ready, ready = b && now >= b.ready;
    for (const f of o.flames) { f.material.opacity = cooking ? 0.7 + Math.sin(G.time * 20 + f.position.x * 9) * 0.2 : 0; }
    o.liquid.material.emissiveIntensity = cooking ? 1.2 : 0;
    o.liquid.visible = !!cooking;
    for (const c of o.tray) c.visible = !!ready;
    o.led.material.color.setHex(cooking ? 0xff6a00 : ready ? 0x2ecc71 : 0x333333);
  }
}

function potInfo(d) {
  if (!d.soil) return 'Maceta vacía';
  if (!d.strain) return `Maceta con ${d.soil === 2 ? 'tierra abonada' : 'tierra'}`;
  const s = STRAINS[d.strain];
  const w = Math.round(d.water * 100);
  if (d.growth >= 1) return `${s.name} · ¡Lista para cosechar!`;
  return `${s.name} · Crecimiento ${Math.floor(d.growth * 100)}% · Agua ${w}%${w === 0 ? ' ⚠️' : ''}`;
}

function infoFor(o) {
  const e = o.entry;
  if (e.type === 'pot') return potInfo(e.data);
  if (e.type === 'shelf') return `Estantería · ${e.data.slots.filter(Boolean).length}/12 huecos ocupados`;
  if (e.type === 'stove') { const b = e.data.batch; return !b ? 'Hornillo · 2 azúcar + 1 colorante + 1 catalizador = 6 cristales' : absNow() >= b.ready ? 'Hornillo · ¡Cristales listos!' : 'Hornillo · Cocinando…'; }
  return ITEMS[ITEM_OF[e.type]].name;
}

function actionsFor(o) {
  const e = o.entry, d = e.data;
  const held = inv.held();
  const hid = held && held.id;
  const pick = { label: `Recoger ${ITEMS[ITEM_OF[e.type]].name.toLowerCase()}`, fn: () => pickUp(o), secondary: true };
  switch (e.type) {
    case 'pot': {
      const acts = [];
      if (!d.soil) {
        if (hid === 'tierra' || hid === 'tierra_plus') acts.push({ label: 'Echar tierra', fn: () => { inv.remove(hid, 1); d.soil = hid === 'tierra_plus' ? 2 : 1; G.player.use(); sfx('pop'); refreshPot(o); } });
        else acts.push({ label: 'Necesitas tierra', fn: () => G.act.toast('Coge un saco de tierra en la mano (cómpralo en la ferretería).') });
        acts.push(pick);
      } else if (!d.strain) {
        if (hid === 'semilla') acts.push({ label: `Plantar ${STRAINS[held.p].name}`, fn: () => { const p = held.p; inv.remove('semilla', 1, p); d.strain = p; d.growth = 0; G.player.use(); sfx('pop'); refreshPot(o); G.act.flag('planted'); } });
        else acts.push({ label: 'Necesitas una semilla', fn: () => G.act.toast('Coge una semilla en la mano. Pídeselas a Rubio desde el móvil.') });
        acts.push(pick);
      } else if (d.growth >= 1) {
        acts.push({ label: 'Cosechar', fn: () => harvest(o) });
      } else {
        if (hid === 'regadera') acts.push({ label: 'Regar', fn: () => water(o) });
        else if (hid === 'fertil') acts.push({ label: d.fert ? 'Ya tiene fertilizante' : 'Echar fertilizante', fn: () => { if (d.fert) return; inv.remove('fertil', 1); d.fert = 1; G.player.use(); sfx('pop'); } });
        else acts.push({ label: d.water < 0.3 ? 'Necesita agua (coge la regadera)' : 'Creciendo...', fn: () => G.act.toast(potInfo(d)) });
      }
      return acts;
    }
    case 'packer':
      return [{ label: 'Usar mesa de empaquetado', fn: () => G.act.openPacker(o) }, pick];
    case 'jarpacker':
      return [{ label: 'Usar envasadora de tarros', fn: () => G.act.openPacker(o) }, pick];
    case 'stove': {
      const b = d.batch;
      if (!b) return [{ label: 'Cocinar cristales', fn: () => cook(o) }, pick];
      const left = Math.ceil(b.ready - absNow());
      if (left > 0) return [{ label: `Cocinando… ${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}min`, fn: () => G.act.toast('Los cristales tienen que enfriarse. Vuelve más tarde (puedes dormir mientras).', '🔥') }];
      return [{ label: `Recoger ${b.n} cristales`, fn: () => collect(o) }];
    }
    case 'lamp':
      return [{ label: 'Lámpara de cultivo (encendida)', fn: () => G.act.toast('Acelera las plantas a menos de 2,5 m.') }, pick];
    case 'shelf':
      return [{ label: 'Abrir estantería', fn: () => G.act.openShelf(o) }, pick];
  }
  return [];
}

// ---- Hornillo de cristalización ----
function cook(o) {
  const miss = Object.entries(RECIPE).filter(([k, n]) => inv.count(k) < n).map(([k, n]) => `${n}× ${ITEMS[k].name}`);
  if (miss.length) return G.act.toast(`Te falta: ${miss.join(', ')}. Azúcar y colorante en Gas&Go; catalizador en la ferretería.`, '⚠️');
  for (const [k, n] of Object.entries(RECIPE)) inv.remove(k, n);
  o.entry.data.batch = { ready: absNow() + COOK_MIN, n: COOK_OUT };
  G.player.use();
  sfx('mix');
  G.act.toast(`Tanda en marcha: ${COOK_OUT} cristales en ${COOK_MIN / 60} horas.`, '🔥');
  G.act.flag('cooked');
}
function collect(o) {
  const b = o.entry.data.batch;
  const pid = ensureBaseProduct('shards');
  if (inv.room('cristal', pid) < b.n) return G.act.toast('No tienes hueco en el inventario.');
  inv.add('cristal', b.n, pid);
  o.entry.data.batch = null;
  sfx('harvest');
  G.act.toast(`Has recogido ${b.n} cristales. Envásalos en bolsas Sweet Shards en la mesa de empaquetado.`, '💎');
}

function water(o) {
  const d = o.entry.data;
  if (G.state.water <= 0) return G.act.toast('La regadera está vacía. Rellénala en un grifo.');
  if (d.water > 0.95) return G.act.toast('Ya tiene agua de sobra.');
  G.state.water--;
  d.water = 1;
  G.player.use();
  sfx('water');
  refreshPot(o);
  G.act.flag('watered');
}

function harvest(o) {
  const d = o.entry.data;
  const s = STRAINS[d.strain];
  let n = randi(s.yield[0], s.yield[1]);
  if (d.soil === 2) n = Math.round(n * 1.4);
  if (d.fert) n += 3;
  const pid = ensureBaseProduct(d.strain);
  if (inv.room('cogollo', pid) < n) return G.act.toast(`Necesitas hueco para ${n} cogollos.`);
  inv.add('cogollo', n, pid);
  Object.assign(d, { soil: 0, strain: null, growth: 0, water: 0, fert: 0 });
  refreshPot(o);
  G.player.use();
  sfx('harvest');
  G.act.toast(`Has cosechado ${n} cogollos de ${s.name}. Envásalos en la mesa de empaquetado.`, '🌿');
  G.act.addXP(8);
  G.act.flag('harvested');
}

// ------------------------------------------------------------------
//  Modo colocar
// ------------------------------------------------------------------
const ray = new THREE.Raycaster();
let ghost = null, ghostType = null;
const ghostOk = new THREE.MeshBasicMaterial({ color: 0x2ecc71, transparent: true, opacity: 0.45, depthWrite: false });
const ghostBad = new THREE.MeshBasicMaterial({ color: 0xe74c3c, transparent: true, opacity: 0.45, depthWrite: false });
export const placement = { rot: 0 };

function setGhost(type) {
  if (ghostType === type) return;
  if (ghost) G.scene.remove(ghost);
  ghost = null; ghostType = type;
  if (!type) return;
  const [w, d] = FOOT[type];
  const h = type === 'shelf' ? 1.8 : type === 'lamp' ? 2 : 1;
  ghost = new THREE.Mesh(bx, ghostOk);
  ghost.scale.set(w, h, d);
  ghost.userData.h = h;
  G.scene.add(ghost);
}

// Devuelve la acción de colocar si procede.
export function updatePlacement() {
  const held = inv.held();
  const type = held && ITEMS[held.id].place;
  if (!type || G.uiOpen) { setGhost(null); return null; }
  ray.setFromCamera({ x: 0, y: 0 }, G.camera);
  ray.far = 4.5;
  const hit = ray.intersectObjects(G.world.floors, false)[0];
  if (!hit || !G.state.props[hit.object.userData.prop]) { setGhost(null); return null; }
  setGhost(type);
  const prop = G.world.props[hit.object.userData.prop];
  const r = placement.rot;
  const [fw, fd] = footprint(type, r);
  const x = Math.round(hit.point.x * 4) / 4, z = Math.round(hit.point.z * 4) / 4;
  let ok = x - fw / 2 >= prop.x0 && x + fw / 2 <= prop.x1 && z - fd / 2 >= prop.z0 && z + fd / 2 <= prop.z1;
  if (ok) {
    for (const c of G.world.colliders) {
      if (c.on && c.x0 < x + fw / 2 && c.x1 > x - fw / 2 && c.z0 < z + fd / 2 && c.z1 > z - fd / 2) { ok = false; break; }
    }
    const p = G.player.pos;
    if (Math.abs(p.x - x) < fw / 2 + 0.3 && Math.abs(p.z - z) < fd / 2 + 0.3) ok = false;
  }
  ghost.position.set(x, ghost.userData.h / 2, z);
  ghost.rotation.y = r;
  ghost.material = ok ? ghostOk : ghostBad;
  return {
    actions: [
      { label: ok ? `Colocar ${ITEMS[held.id].name.toLowerCase()}` : 'No cabe aquí', fn: () => { if (!ok) return sfx('error'); inv.remove(held.id, 1); placeObject(type, x, z, r); sfx('pop'); G.player.use(); } },
      { label: 'Girar', fn: () => { placement.rot = (placement.rot + Math.PI / 2) % (Math.PI * 2); }, secondary: true },
    ],
  };
}

export function hideGhost() { setGhost(null); }

export function shelfCount(o, id, p) { return slotsCount(o.entry.data.slots, id, p); }
