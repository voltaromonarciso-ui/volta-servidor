import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G, clamp, randi } from '../game.js';
import { ITEMS, STRAINS, LAB } from '../data/items.js';
import { inv, slotsCount, save, takeSeed } from '../core/state.js';
import { removeBox } from '../world/world.js';
import { mat } from '../entities/human.js';
import { sfx } from '../core/audio.js';
import { ensureBaseProduct } from './economy.js';
import { absNow } from '../core/state.js';
import { buildPacker, buildJarPacker, buildStove } from '../world/benches.js';
import { buildCrystalTable, buildPowderTable, buildPillMachine, buildLiquidStation, buildAutoPacker } from '../world/labs.js';
import { buildLamp, buildPanel, buildExtractor, buildLocker, buildSafe, buildHumid, buildShelf } from '../entities/furniture.js';
import { buildFabricPot, buildPlant, refreshPlant } from '../entities/plant.js';

// Objetos colocables dentro de tus propiedades (macetas, mesas, máquinas...).
export const FOOT = {
  pot: [0.8, 0.8], packer: [1.6, 0.9], lamp: [0.6, 0.6], shelf: [1.6, 0.6], jarpacker: [1.3, 0.8], stove: [1.2, 0.75],
  bed: [1.1, 2.1], locker: [1.2, 0.6], safe: [0.7, 0.7], humid: [0.5, 0.5], panel: [1.3, 0.6], extractor: [0.7, 0.7],
  crystal: [2.0, 0.85], powder: [2.0, 0.85], pills: [1.9, 0.9], liquid: [2.0, 0.85], autopack: [2.4, 0.95],
};
const ITEM_OF = { pot: 'maceta', packer: 'mesa_emp', lamp: 'lampara', shelf: 'estante', jarpacker: 'envasadora', stove: 'hornillo', bed: 'cama', locker: 'armario', safe: 'caja_fuerte', humid: 'humidificador', panel: 'panel_led', extractor: 'extractor', crystal: 'hornillo_pro', powder: 'mesa_polvo', pills: 'maq_pastillas', liquid: 'est_liquidos', autopack: 'empacadora' };
// altura de la caja de colisión / selección de cada objeto
const HEIGHT = { shelf: 1.8, lamp: 2, locker: 2, bed: 0.7, safe: 0.85, humid: 0.9, panel: 2.1, extractor: 1.1, crystal: 1.9, powder: 1.9, pills: 1.8, liquid: 1.9, autopack: 1.9 };
export const LAB_TYPES = ['crystal', 'powder', 'pills', 'liquid'];
const SLOTS = { shelf: 12, locker: 24 };
// Abonos del cártel que se echan a una planta: objeto → [marca en la maceta, nombre]
const ADDS = { abono_grow: ['grow', 'abono Grow'], abono_bloom: ['bloom', 'abono Bloom'], ph_corr: ['ph', 'corrector de pH'] };
// Hornillo: receta y tiempo de cada tanda de cristales
export const RECIPE = { azucar: 2, colorante: 1, catalizador: 1 };
export const COOK_MIN = 120, COOK_OUT = 6;
// hornillo industrial (El Cartel): más rápido y saca más
export const COOK_PRO = { min: 75, out: 9 };
const GROW_MIN = 10 * 60;     // minutos de juego para crecer del todo (≈ 7 min reales)
const DRAIN_MIN = 10 * 60;    // minutos que dura el agua

const bx = new THREE.BoxGeometry(1, 1, 1);
// cajas con cantos redondeados (una geometría por medida, compartida entre copias)
const _rb = new Map();
const rbx = (w, h, d, r) => { const k = [w, h, d, r].join(); if (!_rb.has(k)) _rb.set(k, new RoundedBoxGeometry(w, h, d, 2, r)); return _rb.get(k); };
const leg = new THREE.CylinderGeometry(0.03, 0.022, 0.18, 10);
const cylH = new THREE.CylinderGeometry(0.045, 0.045, 1.16, 12);
const pillow = (() => { const g = new RoundedBoxGeometry(0.72, 0.13, 0.36, 3, 0.06); const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); p.setY(i, p.getY(i) * (1 - 0.35 * ((x / 0.36) ** 2 + (z / 0.18) ** 2) * 0.5)); } g.computeVertexNormals(); return g; })();
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
  o.group.position.set(entry.x, G.world.groundAt(entry.x, entry.z), entry.z);
  o.group.rotation.y = entry.r || 0;
  G.scene.add(o.group);
  BUILD[entry.type](o);
  const [fw, fd] = footprint(entry.type, entry.r);
  o.col = G.world.addBox(entry.x - fw / 2, entry.x + fw / 2, entry.z - fd / 2, entry.z + fd / 2, entry.type === 'lamp' ? 2 : 1.1, 'obj');
  const hb = new THREE.Mesh(bx, hitMat);
  const [w, d] = FOOT[entry.type];
  const h = HEIGHT[entry.type] || 1.2;
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

// Modelo suelto (para la exposición de la tienda de muebles).
export function furnitureModel(type) {
  const o = { entry: { uid: 0, type, data: {} }, group: new THREE.Group() };
  BUILD[type](o);
  if (o.plant) o.plant.visible = false;
  return o.group;
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

// Por qué no se puede guardar en el inventario (lo de dentro se perdería).
// Para cambiarlo de sitio está «Mover», que lo conserva todo.
export function pickBlock(o) {
  const e = o.entry, d = e.data;
  if (SLOTS[e.type] && d.slots.some(Boolean)) return `Vacía ${e.type === 'locker' ? 'el armario' : 'la estantería'} antes de guardarlo.`;
  if (e.type === 'safe' && d.cash > 0) return 'Saca el dinero de la caja fuerte antes de guardarla.';
  if (e.type === 'pot' && (d.soil || d.strain)) return 'La maceta tiene tierra: usa «Mover» para cambiarla de sitio sin perderla.';
  if (e.type === 'stove' && d.batch) return 'El hornillo está ocupado.';
  if (LAB_TYPES.includes(e.type) && d.batch) return 'La estación está trabajando: recoge la tanda antes de moverla.';
  return null;
}

function pickUp(o) {
  const id = o.entry.data?.item || ITEM_OF[o.entry.type];
  const why = pickBlock(o);
  if (why) { sfx('error'); G.act.toast(why, '⚠️'); return false; }
  if (inv.room(id) < 1) { G.act.toast('No tienes hueco en el inventario.'); return false; }
  inv.add(id, 1);
  removeObject(o);
  sfx('pop');
  return true;
}

export function placeObject(type, x, z, r, item = null) {
  const entry = { uid: G.state.nextUid++, type, x, z, r, data: {} };
  if (type === 'pot') entry.data = { soil: 0, strain: null, growth: 0, water: 0, fert: 0 };
  if (SLOTS[type]) entry.data = { slots: Array(SLOTS[type]).fill(null) };
  if (type === 'safe') entry.data = { cash: 0 };
  if (type === 'stove' || LAB_TYPES.includes(type)) entry.data = { batch: null };
  if (item && ITEMS[item]?.data) Object.assign(entry.data, ITEMS[item].data, { item }); // variantes (hornillo industrial)
  if (type === 'jarpacker') G.state.flags.jars = true;
  G.state.objects.push(entry);
  return spawnObject(entry);
}

// ------------------------------------------------------------------
//  Modelos
// ------------------------------------------------------------------
const BUILD = {
  pot(o) {
    // maceta negra de tela con la planta por fases (entities/plant.js)
    o.soil = buildFabricPot(o.group);
    o.crop = buildPlant(o.group);
    o.plant = o.crop.plant;
  },
  packer: buildPacker,
  jarpacker: buildJarPacker,
  stove: buildStove,
  crystal: buildCrystalTable, powder: buildPowderTable, pills: buildPillMachine, liquid: buildLiquidStation, autopack: buildAutoPacker,
  lamp: buildLamp,
  panel: buildPanel,
  extractor: buildExtractor,
  bed(o) {
    // formas redondeadas (sin que cueste mucho: pocas piezas y geometrías compartidas)
    const g = o.group;
    const wood = new THREE.MeshStandardMaterial({ color: 0x8a5a3a, roughness: 0.55 });
    mesh(rbx(1.1, 0.16, 2.06, 0.03), wood, 1, 1, 1, 0, 0.26, 0, g);              // marco
    for (const x of [-0.5, 0.5]) for (const z of [-0.98, 0.98]) mesh(leg, wood, 1, 1, 1, x, 0.09, z, g); // patas torneadas
    mesh(rbx(1.16, 0.78, 0.07, 0.03), wood, 1, 1, 1, 0, 0.62, -1.03, g);         // cabecero
    const top = mesh(cylH, wood, 1, 1, 1, 0, 1.01, -1.03, g); top.rotation.z = Math.PI / 2; // canto redondo arriba
    mesh(rbx(1.16, 0.36, 0.06, 0.025), wood, 1, 1, 1, 0, 0.42, 1.03, g);         // piecero
    mesh(rbx(1.02, 0.2, 1.98, 0.07), '#f4f1ea', 1, 1, 1, 0, 0.44, 0, g);         // colchón mullido
    mesh(rbx(1.08, 0.07, 1.32, 0.03), '#3f78c4', 1, 1, 1, 0, 0.56, 0.32, g);     // edredón
    for (const x of [-0.53, 0.53]) mesh(rbx(0.03, 0.22, 1.3, 0.012), '#3a6fb6', 1, 1, 1, x, 0.46, 0.32, g); // caída por los lados
    mesh(rbx(0.06, 0.06, 1.08, 0.025), '#5b8fd6', 1, 1, 1, 0, 0.6, -0.33, g).rotation.y = Math.PI / 2; // embozo doblado
    const pil = mesh(pillow, '#ffffff', 1, 1, 1, 0, 0.6, -0.78, g);              // almohada
    pil.rotation.x = -0.18;
  },
  locker: buildLocker,
  safe: buildSafe,
  humid: buildHumid,
  shelf: buildShelf,
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
  refreshPlant(o.crop, clamp(d.growth, 0, 1), d.water <= 0.001, STRAINS[d.strain]?.color);
}

function lampBoost(o) {
  let k = 1, air = 1;
  for (const other of G.objects.values()) {
    const t = other.entry.type, d = Math.hypot(other.entry.x - o.entry.x, other.entry.z - o.entry.z);
    if (t === 'panel' && d < 2.6) k = 2;
    else if (t === 'lamp' && d < 2.6) k = Math.max(k, 1.5);
    else if (t === 'extractor' && d < 3) air = 1.15;
  }
  return k * air * (o.entry.data.grow ? 1.25 : 1);
}

// Humidificador cerca: el agua dura más (1 / 0,6).
export const HUMID_R = 2.5, HUMID_K = 0.6;
function drainK(o) {
  for (const other of G.objects.values()) {
    if (other.entry.type === 'humid' && Math.hypot(other.entry.x - o.entry.x, other.entry.z - o.entry.z) < HUMID_R) return HUMID_K;
  }
  return 1;
}

// Avanza el cultivo `min` minutos de juego (vale para saltos grandes al dormir).
export function simulateObjects(min) {
  for (const o of G.objects.values()) {
    if (o.entry.type !== 'pot') continue;
    const d = o.entry.data;
    const drain = (DRAIN_MIN / drainK(o)) * (o.entry.data.ph ? 2 : 1);
    if (!d.strain || d.growth >= 1) { if (d.water > 0) d.water = Math.max(0, d.water - min / drain); continue; }
    const wet = Math.min(min, (d.water * drain));
    const rate = (STRAINS[d.strain].speed * (d.soil === 2 ? 1.25 : 1) * lampBoost(o)) / GROW_MIN;
    d.growth = Math.min(1, d.growth + rate * wet);
    d.water = Math.max(0, d.water - min / drain);
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
  for (const o of G.objects.values()) if (o.mist) { const k = (G.time * 0.6 + o.entry.uid * 0.37) % 1; o.mist.position.y = 0.85 + k * 0.5; o.mist.material.opacity = 0.35 * (1 - k); o.mist.scale.setScalar(0.18 + k * 0.25); }
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
  const extra = [d.grow && 'Grow', d.bloom && 'Bloom', d.ph && 'pH'].filter(Boolean);
  return `${s.name} · Crecimiento ${Math.floor(d.growth * 100)}% · Agua ${w}%${w === 0 ? ' ⚠️' : ''}${extra.length ? ' · ' + extra.join(', ') : ''}`;
}

function infoFor(o) {
  const e = o.entry;
  if (e.type === 'pot') return potInfo(e.data);
  if (SLOTS[e.type]) return `${ITEMS[ITEM_OF[e.type]].name} · ${e.data.slots.filter(Boolean).length}/${SLOTS[e.type]} huecos ocupados`;
  if (e.type === 'safe') return `Caja fuerte · ${e.data.cash || 0} $ guardados`;
  if (e.type === 'humid') return 'Humidificador · el agua de las macetas cercanas dura más';
  if (e.type === 'bed') return 'Cama buena · te despiertas a las 6:00';
  if (e.type === 'stove') { const b = e.data.batch; return !b ? 'Hornillo · 2 azúcar + 1 colorante + 1 catalizador = 6 cristales' : absNow() >= b.ready ? 'Hornillo · ¡Cristales listos!' : 'Hornillo · Cocinando…'; }
  return ITEMS[ITEM_OF[e.type]].name;
}

function actionsFor(o) {
  const e = o.entry, d = e.data;
  const held = inv.held();
  const hid = held && held.id;
  // cualquier objeto colocado se puede mover sin perder lo que tiene (o guardarlo desde ahí)
  const pick = { label: 'Mover', fn: () => startMove(o), secondary: true };
  switch (e.type) {
    case 'pot': {
      const acts = [];
      if (!d.soil) {
        if (hid === 'tierra' || hid === 'tierra_plus') acts.push({ label: 'Echar tierra', fn: () => { inv.remove(hid, 1); d.soil = hid === 'tierra_plus' ? 2 : 1; G.player.use(); sfx('pop'); refreshPot(o); } });
        else acts.push({ label: 'Necesitas tierra', fn: () => G.act.toast('Coge un saco de tierra en la mano (cómpralo en la ferretería).') });
        acts.push(pick);
      } else if (!d.strain) {
        if (hid === 'semilla') acts.push({ label: `Plantar ${STRAINS[held.p].name}`, fn: () => {
          const p = takeSeed(G.state.inv, G.state.sel); // del sobre que llevas en la mano
          if (!p) return sfx('error');
          d.strain = p; d.growth = 0; G.player.use(); sfx('pop'); refreshPot(o); G.act.flag('planted');
          if (G.state.inv[G.state.sel]?.id === 'sobre_vacio') G.act.toast('Era la última semilla: te queda el sobre vacío.', '✉️');
        } });
        else if (hid === 'sobre_vacio') acts.push({ label: 'Sobre vacío: sin semillas', fn: () => { sfx('error'); G.act.toast('Este sobre está vacío. Pide más semillas a Rubio desde el móvil.', '✉️'); } });
        else acts.push({ label: 'Necesitas una semilla', fn: () => G.act.toast('Coge una semilla en la mano. Pídeselas a Rubio desde el móvil.') });
        acts.push(pick);
      } else if (d.growth >= 1) {
        acts.push({ label: 'Cosechar', fn: () => harvest(o) });
      } else {
        if (hid === 'regadera') acts.push({ label: 'Regar', fn: () => water(o) });
        else if (hid === 'fertil') acts.push({ label: d.fert ? 'Ya tiene fertilizante' : 'Echar fertilizante', fn: () => { if (d.fert) return; inv.remove('fertil', 1); d.fert = 1; G.player.use(); sfx('pop'); } });
        else if (ADDS[hid]) { const [k, txt] = ADDS[hid]; acts.push({ label: d[k] ? `Ya tiene ${txt}` : `Echar ${txt}`, fn: () => { if (d[k]) return; inv.remove(hid, 1); d[k] = 1; G.player.use(); sfx('pop'); } }); }
        else acts.push({ label: d.water < 0.3 ? 'Necesita agua (coge la regadera)' : 'Creciendo...', fn: () => G.act.toast(potInfo(d)) });
        acts.push(pick);
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
      if (left > 0) return [{ label: `Cocinando… ${Math.floor(left / 60)}h ${String(left % 60).padStart(2, '0')}min`, fn: () => G.act.toast('Los cristales tienen que enfriarse. Vuelve más tarde (puedes dormir mientras).', '🔥') }, pick];
      return [{ label: `Recoger ${b.n} cristales`, fn: () => collect(o) }];
    }
    case 'lamp':
      return [{ label: 'Lámpara de cultivo (encendida)', fn: () => G.act.toast('Acelera las plantas a menos de 2,5 m.') }, pick];
    case 'shelf':
      return [{ label: 'Abrir estantería', fn: () => G.act.openShelf(o) }, pick];
    case 'locker':
      return [{ label: 'Abrir armario', fn: () => G.act.openShelf(o) }, pick];
    case 'safe':
      return [{ label: 'Abrir caja fuerte', fn: () => G.act.openSafe(o) }, pick];
    case 'crystal': case 'powder': case 'pills': case 'liquid': {
      const L = LAB[e.type], b = d.batch;
      return [{ label: b ? `Recoger ${b.n} ${ITEMS[L.out].name.toLowerCase()}` : `Usar ${L.name.toLowerCase()}`, fn: () => (b ? labCollect(o) : G.act.openLab(o)) }, ...(b ? [] : [pick])];
    }
    case 'autopack':
      return [{ label: 'Usar la empacadora avanzada', fn: () => G.act.openAutopack(o) }, pick];
    case 'panel':
      return [{ label: 'Panel LED (encendido)', fn: () => G.act.toast('Las plantas a menos de 2,5 m crecen el doble de rápido.', '🔆') }, pick];
    case 'extractor':
      return [{ label: 'Extractor (en marcha)', fn: () => G.act.toast('Aire fresco: las plantas a menos de 3 m crecen un 15 % más rápido.', '🌀') }, pick];
    case 'humid':
      return [{ label: 'Humidificador (encendido)', fn: () => G.act.toast('Las macetas a menos de 2,5 m pierden el agua un 40 % más despacio.', '💨') }, pick];
    case 'bed':
      return [{ label: 'Dormir', fn: () => G.act.sleep(G.world.inProperty(e.x, e.z), { wake: 6 * 60 }) }, pick];
  }
  return [];
}

// ---- Estaciones del cártel (cristales, polvos, pastillas, líquidos) ----
export function labMissing(type) {
  const L = LAB[type];
  return Object.entries(L.make).filter(([k, n]) => inv.count(k) < n).map(([k, n]) => `${n}× ${ITEMS[k].name}`);
}
// Pone una tanda: gasta los ingredientes (los cogollos de la estación de líquidos, de la
// variedad que más tengas) y deja la tanda en marcha
export function labStart(o) {
  const L = LAB[o.entry.type];
  const miss = labMissing(o.entry.type);
  if (miss.length) return { ok: false, msg: `Te falta: ${miss.join(', ')}.` };
  for (const [k, n] of Object.entries(L.make)) {
    if (k === 'cogollo' || ITEMS[k].product) { // de lo que más tengas
      let need = n;
      const by = new Map(); for (const s of G.state.inv) if (s && s.id === k) by.set(s.p, (by.get(s.p) || 0) + s.q);
      for (const [p] of [...by].sort((a, b) => b[1] - a[1])) { const t = Math.min(need, inv.count(k, p)); inv.remove(k, t, p); need -= t; if (!need) break; }
    } else inv.remove(k, n);
  }
  o.entry.data.batch = { ready: absNow() + L.min, n: L.n };
  G.player.use();
  sfx('mix');
  save();
  return { ok: true, msg: `Tanda en marcha: ${L.n} ${ITEMS[L.out].name.toLowerCase()} en ${Math.floor(L.min / 60)} h ${String(L.min % 60).padStart(2, '0')} min.` };
}
export function labCollect(o) {
  const L = LAB[o.entry.type], b = o.entry.data.batch;
  if (!b) return false;
  const pid = ensureBaseProduct(L.strain);
  if (inv.room(L.out, pid) < b.n) { G.act.toast('No tienes hueco en el inventario.'); return false; }
  inv.add(L.out, b.n, pid);
  o.entry.data.batch = null;
  sfx('harvest');
  G.act.toast(`Has recogido ${b.n} ${ITEMS[L.out].name.toLowerCase()}. Envásalos en la propia estación.`, '✨');
  G.act.addXP(10);
  save();
  return true;
}
// Envasar en la estación (o en la empacadora): F = forma de FORMS; n = cuántos envases
export function packNow(F, p, n) {
  const can = Math.min(n, Math.floor(inv.count(F.src, p) / F.per), inv.count(F.pack));
  let made = 0;
  for (let k = 0; k < can; k++) {
    if (inv.room(F.id, p) < 1) break;
    inv.remove(F.src, F.per, p); inv.remove(F.pack, 1); inv.add(F.id, 1, p); made++;
  }
  if (made) { sfx('pop'); save(); }
  return made;
}

// ---- Hornillo de cristalización ----
function cook(o) {
  const miss = Object.entries(RECIPE).filter(([k, n]) => inv.count(k) < n).map(([k, n]) => `${n}× ${ITEMS[k].name}`);
  if (miss.length) return G.act.toast(`Te falta: ${miss.join(', ')}. Azúcar y colorante en Gas&Go; catalizador en la ferretería.`, '⚠️');
  for (const [k, n] of Object.entries(RECIPE)) inv.remove(k, n);
  const pro = o.entry.data.pro, mins = pro ? COOK_PRO.min : COOK_MIN, out = pro ? COOK_PRO.out : COOK_OUT;
  o.entry.data.batch = { ready: absNow() + mins, n: out };
  G.player.use();
  sfx('mix');
  G.act.toast(`Tanda en marcha: ${out} cristales en ${Math.floor(mins / 60)} h ${String(mins % 60).padStart(2, '0')} min.`, '🔥');
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

// Cosecha (la usan el jugador y los empleados de cultivo): cuántos cogollos da y vaciar la maceta.
export function harvestYield(o) {
  const d = o.entry.data;
  const s = STRAINS[d.strain];
  let n = randi(s.yield[0], s.yield[1]);
  if (d.soil === 2) n = Math.round(n * 1.4);
  if (d.fert) n += 3;
  if (d.bloom) n += 4;
  return n;
}
export function emptyPot(o) {
  Object.assign(o.entry.data, { soil: 0, strain: null, growth: 0, water: 0, fert: 0, grow: 0, bloom: 0, ph: 0 });
  refreshPot(o);
}

function harvest(o) {
  const d = o.entry.data;
  const s = STRAINS[d.strain];
  const n = harvestYield(o);
  if (s.leaf) { // Nevada: hojas para la mesa de polvos
    if (inv.room('hoja') < n) return G.act.toast(`Necesitas hueco para ${n} hojas.`);
    inv.add('hoja', n);
    emptyPot(o); G.player.use(); sfx('harvest');
    G.act.toast(`Has cosechado ${n} hojas de Nevada. Conviértelas en polvo en la mesa de preparación de polvos.`, '🍃');
    G.act.addXP(10);
    return;
  }
  const pid = ensureBaseProduct(d.strain);
  if (inv.room('cogollo', pid) < n) return G.act.toast(`Necesitas hueco para ${n} cogollos.`);
  inv.add('cogollo', n, pid);
  emptyPot(o);
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
// rot: giro elegido · moving: objeto que se está cambiando de sitio · skip: colocación cancelada
// (hasta que cambies de objeto en la mano) · active: hay algo que colocar ahora mismo
export const placement = { rot: 0, moving: null, skip: null, active: false };

function setGhost(type) {
  if (ghostType === type) return;
  if (ghost) G.scene.remove(ghost);
  ghost = null; ghostType = type;
  if (!type) return;
  // la silueta real del objeto, translúcida (verde si cabe, roja si no)
  ghost = furnitureModel(type);
  ghost.traverse((m) => { if (m.isMesh) { m.material = ghostOk; m.castShadow = false; m.receiveShadow = false; } });
  ghost.userData.ghost = true;
  ghost.userData.ok = true;
  G.scene.add(ghost);
}
function tintGhost(ok) {
  if (ghost.userData.ok === ok) return;
  ghost.userData.ok = ok;
  ghost.traverse((m) => { if (m.isMesh) m.material = ok ? ghostOk : ghostBad; });
}

// ¿Cabe un objeto de este tipo aquí? (dentro de tu propiedad, sin chocar y sin pisarte)
export function canPlace(type, x, z, r, propId) {
  const prop = G.world.props[propId];
  if (!prop || !G.state.props[propId]) return false;
  const [fw, fd] = footprint(type, r);
  if (!(x - fw / 2 >= prop.x0 && x + fw / 2 <= prop.x1 && z - fd / 2 >= prop.z0 && z + fd / 2 <= prop.z1)) return false;
  for (const c of G.world.colliders) {
    if (c.yMin > 1) continue; // (barandillas y cristales de la entreplanta: van por arriba)
    if (c.on && c.x0 < x + fw / 2 && c.x1 > x - fw / 2 && c.z0 < z + fd / 2 && c.z1 > z - fd / 2) return false;
  }
  const p = G.player.pos;
  if (Math.abs(p.x - x) < fw / 2 + 0.3 && Math.abs(p.z - z) < fd / 2 + 0.3) return false;
  return true;
}

// --- Mover un objeto ya colocado (conserva uid y datos: plantas, contenido, dinero…)
export function startMove(o) {
  if (placement.moving) cancelMove();
  placement.moving = { o, x: o.entry.x, z: o.entry.z, r: o.entry.r || 0 };
  placement.rot = o.entry.r || 0;
  o.col.on = false;
  o.group.visible = false;
  const i = G.interactables.indexOf(o.hit);
  if (i >= 0) G.interactables.splice(i, 1);
  sfx('click');
  G.act.toast?.(G.touch ? 'Apunta al suelo y toca Colocar. Gira con las flechas.' : 'Apunta al suelo y pulsa E. R / Q giran, X cancela, G lo guarda.', '🔧');
}

function settle(o, x, z, r) {
  const e = o.entry;
  e.x = x; e.z = z; e.r = r;
  o.group.position.set(x, G.world.groundAt(x, z), z);
  o.group.rotation.y = r;
  removeBox(o.col);
  const [fw, fd] = footprint(e.type, r);
  o.col = G.world.addBox(x - fw / 2, x + fw / 2, z - fd / 2, z + fd / 2, e.type === 'lamp' ? 2 : 1.1, 'obj');
  o.group.visible = true;
  if (!G.interactables.includes(o.hit)) G.interactables.push(o.hit);
}

export function cancelMove() {
  const m = placement.moving;
  if (!m) return false;
  placement.moving = null;
  settle(m.o, m.x, m.z, m.r);
  setGhost(null);
  return true;
}

// Cancelar: el objeto vuelve a su sitio, o el de la mano deja de colocarse (y sigue en el inventario).
export function cancelPlacement() {
  if (cancelMove()) { G.act.toast?.('Se queda donde estaba.', '↩️'); return true; }
  const held = inv.held();
  if (held && ITEMS[held.id].place) {
    placement.skip = { sel: G.state.sel, id: held.id };
    setGhost(null);
    G.act.toast?.(`${ITEMS[held.id].name}: sigue en tu inventario.`, '↩️');
    return true;
  }
  return false;
}

// Para el HUD: 'move' moviendo algo, 'place' con un objeto colocable en la mano, o null.
export function placingMode() {
  if (placement.moving) return 'move';
  const held = inv.held();
  if (placement.skip && (placement.skip.sel !== G.state.sel || placement.skip.id !== held?.id)) placement.skip = null;
  return held && ITEMS[held.id].place && !placement.skip && !G.uiOpen && !G.riding ? 'place' : null;
}

export function rotatePlacement(dir = 1) {
  placement.rot = (placement.rot + dir * Math.PI / 2 + Math.PI * 4) % (Math.PI * 2);
  sfx('click');
}

// Guardar en el inventario el objeto que estás moviendo (si no tiene nada dentro).
export function storeMoving() {
  const m = placement.moving;
  if (!m) return false;
  if (pickBlock(m.o) || inv.room(ITEM_OF[m.o.entry.type]) < 1) {
    const why = pickBlock(m.o) || 'No tienes hueco en el inventario.';
    sfx('error'); G.act.toast(why, '⚠️');
    return false;
  }
  placement.moving = null;
  settle(m.o, m.x, m.z, m.r); // vuelve a existir un instante para quitarlo bien
  setGhost(null);
  return pickUp(m.o);
}

// Devuelve la acción de colocar si procede.
export function updatePlacement() {
  const m = placement.moving;
  const held = inv.held();
  if (!m && placement.skip && (placement.skip.sel !== G.state.sel || placement.skip.id !== held?.id)) placement.skip = null;
  const type = m ? m.o.entry.type : !placement.skip && held && ITEMS[held.id].place;
  placement.active = !!type && !G.uiOpen;
  if (!type || G.uiOpen) { setGhost(null); return null; }
  // si te alejas mucho mientras mueves algo, vuelve a su sitio
  if (m && Math.hypot(G.player.pos.x - m.x, G.player.pos.z - m.z) > 30) { cancelPlacement(); return null; }
  G.player.aim(ray);
  ray.far = 4.5;
  const hit = ray.intersectObjects(G.world.floors, false)[0];
  const rotate = { label: 'Girar', fn: () => rotatePlacement(1), secondary: true };
  if (!hit || !G.state.props[hit.object.userData.prop]) {
    setGhost(null);
    return m ? { actions: [{ label: 'Apunta al suelo de tu propiedad', fn: () => sfx('error') }, rotate] } : null;
  }
  setGhost(type);
  const r = placement.rot;
  const x = Math.round(hit.point.x * 4) / 4, z = Math.round(hit.point.z * 4) / 4;
  const ok = canPlace(type, x, z, r, hit.object.userData.prop);
  ghost.position.set(x, G.world.groundAt(x, z), z);
  ghost.rotation.y = r;
  tintGhost(ok);
  const name = ITEMS[ITEM_OF[type]].name.toLowerCase();
  const place = m
    ? { label: ok ? 'Dejar aquí' : 'No cabe aquí', fn: () => { if (!ok) return sfx('error'); placement.moving = null; settle(m.o, x, z, r); setGhost(null); sfx('pop'); G.player.use(); G.act.pokeStaff?.(); save(); } }
    : { label: ok ? `Colocar ${name}` : 'No cabe aquí', fn: () => { if (!ok) return sfx('error'); inv.remove(held.id, 1); placeObject(type, x, z, r, held.id); sfx('pop'); G.player.use(); G.act.pokeStaff?.(); save(); } };
  return { actions: [place, rotate] };
}

export function hideGhost() { setGhost(null); }

export function shelfCount(o, id, p) { return slotsCount(o.entry.data.slots, id, p); }
