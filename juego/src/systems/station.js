import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { inv } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { addXP } from './economy.js';
import { zipBag, jar, bud, crystal, GEMS, crystalCluster, JAR, BAG, vialModel, amberBottle, dropperModel, blisterModel, pillModel } from '../entities/goods.js';
import { ii } from '../ui/icons.js';

// Estación de empaquetado a mano: la cámara baja a la mesa y el jugador arrastra
// un envase vacío al tapete, mete el producto y lo cierra. Lo que se mete cae dentro con
// física sencilla (gravedad, rebote, choques entre piezas y con las paredes del envase:
// nada atraviesa la bolsa) y la bolsa se abomba con lo que lleva. Vale para todos los
// envases: sobres, bolsas de cristales y de polvo, tarros, viales, blísteres, frascos y goteros.
// Todo con arrastrar o tocar (pensado para móvil).

const ray = new THREE.Raycaster();
const ndc = new THREE.Vector2();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const tmp = new THREE.Vector3();
const camFrom = new THREE.Vector3(), camTo = new THREE.Vector3();
const qFrom = new THREE.Quaternion(), qTo = new THREE.Quaternion();

let S = null;   // estado de la estación abierta
const SC = 1.5; // los envases se ven algo más grandes para manejarlos bien en móvil
let ui = null;

function colorOf(p) {
  const pr = G.state.products[p];
  const st = STRAINS[pr ? pr.strain : p];
  return st ? '#' + new THREE.Color(st.color).getHexString() : '#6abf45';
}

function overlay() {
  if (ui) return ui;
  ui = document.createElement('div');
  ui.id = 'station';
  ui.innerHTML = `<div class="st-top"><div class="st-title"></div><div class="st-step"></div></div>
    <div class="st-count"></div>
    <button class="st-exit btn ghost">Terminar</button>`;
  document.body.appendChild(ui);
  ui.querySelector('.st-exit').onclick = () => exitStation();
  ui.addEventListener('pointerdown', onDown);
  ui.addEventListener('pointermove', onMove);
  ui.addEventListener('pointerup', onUp);
  ui.addEventListener('pointercancel', onUp);
  return ui;
}

// ------------------------------------------------------------------
//  Cada envase: qué contenedor, qué se mete y cómo se cierra
// ------------------------------------------------------------------
const KINDS = {
  bolsa: { cont: 'bag', unit: 'bud' },
  shards: { cont: 'bag', unit: 'crystal' },
  sobre_polvo: { cont: 'bag', unit: 'powder' },
  tarro: { cont: 'jar', unit: 'bud', lid: 'cork' },
  tarro_cr: { cont: 'jar', unit: 'crystal', lid: 'grey' },
  vial: { cont: 'vial', unit: 'powder', level: true },
  gotero: { cont: 'dropper', unit: 'drop', level: true },
  blister: { cont: 'blister', unit: 'pill', snap: true, perDrag: 5 },
  frasco: { cont: 'bottle', unit: 'pill', perDrag: 5 },
};
const UNIT_NAME = { bud: ['cogollo', 'cogollos'], crystal: ['cristal', 'cristales'], powder: ['dosis de polvo', 'dosis de polvo'], pill: ['pastilla', 'pastillas'], drop: ['chorrito de extracto', 'chorritos de extracto'] };
const CONT_NAME = { bag: 'una bolsa vacía', jar: 'un tarro vacío', vial: 'un vial vacío', dropper: 'un gotero vacío', blister: 'un blíster vacío', bottle: 'un frasco vacío' };
const CS = { vial: 1.5, dropper: 1.5, bottle: 1.35, blister: 1.4 }; // (los envases pequeños, más grandes para manejarlos)

// ------------------------------------------------------------------
//  Abrir / cerrar
// ------------------------------------------------------------------
export function startStation(obj, sel, F) {
  if (S) { if (!S.leaving) return; finishExit(); }
  if (document.pointerLockElement) document.exitPointerLock();
  const K = KINDS[F.id] || KINDS.bolsa;
  S = {
    obj, sel, F, K,
    shards: K.unit === 'crystal', isJar: K.cont === 'jar',
    color: colorOf(sel.p),
    step: 'take',          // take → fill → seal
    n: 0, made: 0, parts: [], level: 0, slot: 0,
    t: 0, blend: 0, leaving: false,
    root: new THREE.Group(),
    drag: null, anims: [],
  };
  G.station = S;
  G.uiOpen = true;
  obj.group.add(S.root);
  const sp = obj.spots;
  // el producto, en una bandeja propia (la de la mesa de sobres se esconde mientras)
  const pile = new THREE.Group();
  if (obj.supply) { obj.supply.userData.pile.visible = false; pile.position.y = 0.04; obj.supply.add(pile); S.supPile = pile; }
  else {
    const tray = new THREE.Group(); tray.position.copy(sp.supply).setY(sp.work.y);
    const tb = new THREE.Mesh(new RoundedBoxGeometry(0.26, 0.03, 0.2, 2, 0.008), new THREE.MeshStandardMaterial({ color: 0xeef0f1, roughness: 0.45 })); tb.position.y = 0.015; tray.add(tb);
    pile.position.y = 0.035; tray.add(pile); S.root.add(tray);
  }
  for (let i = 0; i < 9; i++) { const u = unit(true); u.position.set(((i % 3) - 1) * 0.06, 0.012 + Math.floor(i / 3) * 0.004, (Math.floor(i / 3) - 1) * 0.045); pile.add(u); }
  // envases vacíos, apilados donde se cogen (la mesa de sobres ya tiene su montón)
  const st = new THREE.Group(); st.visible = !obj.supply || S.K.cont !== 'bag';
  for (let i = 0; i < 3; i++) { const c = makeContainer().o; c.scale.multiplyScalar(0.7); c.position.set((i - 1) * 0.07, K.cont === 'bag' ? BAG.h * SC * 0.35 : 0, 0); if (K.cont === 'bag') c.rotation.x = -0.25; st.add(c); }
  st.position.copy(sp.pack).setY(sp.work.y);
  S.root.add(st); S.packStack = st;
  // cámara: desde la posición actual hasta encima del tapete
  const work = sp.work;
  const eye = obj.group.localToWorld(tmp.set(work.x, work.y + 0.52, work.z + 0.42)).clone();
  const look = obj.group.localToWorld(new THREE.Vector3(work.x, work.y + 0.02, work.z - 0.05));
  camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion);
  camTo.copy(eye);
  const m = new THREE.Matrix4().lookAt(eye, look, new THREE.Vector3(0, 1, 0));
  qTo.setFromRotationMatrix(m);
  plane.constant = -obj.group.localToWorld(tmp.set(0, work.y, 0)).y;
  document.body.classList.add('in-station');
  overlay().classList.add('on');
  ui.querySelector('.st-title').innerHTML = `${ii(F.id)} Envasando ${ITEMS[F.id].form}`;
  refreshUI();
  sfx('open');
}

export function exitStation() {
  if (!S || S.leaving) return;
  S.leaving = true;
  S.blend = 1;
  if (S.made) G.act.toast(`Has envasado ${S.made}× ${ITEMS[S.F.id].name}`, ii(S.F.id));
  ui.classList.remove('on');
  sfx('close');
}

function finishExit() {
  S.obj.group.remove(S.root);
  if (S.obj.supply) { S.obj.supply.userData.pile.visible = true; if (S.supPile) S.obj.supply.remove(S.supPile); }
  document.body.classList.remove('in-station');
  G.station = null;
  G.uiOpen = false;
  S = null;
}

// ------------------------------------------------------------------
//  Lógica de pasos
// ------------------------------------------------------------------
const perDrag = () => Math.min(S.K.perDrag || 1, S.F.per - S.n);
const haveProduct = () => inv.count(S.sel.id, S.sel.p) >= S.F.per;
const havePack = () => inv.count(S.F.pack) > 0;

function refreshUI() {
  if (!S) return;
  const F = S.F, U = UNIT_NAME[S.K.unit];
  const left = inv.count(S.sel.id, S.sel.p), packs = inv.count(F.pack);
  let txt;
  if (S.step === 'take') {
    txt = !packs ? `No te quedan ${ITEMS[F.pack].name.toLowerCase()}.` : left < F.per ? `No te quedan ${U[1]} suficientes.` :
      `<b>1.</b> Arrastra ${CONT_NAME[S.K.cont]} al ${S.isJar ? 'plato de la máquina' : 'tapete'}`;
  } else if (S.step === 'fill') {
    txt = `<b>2.</b> Arrastra ${perDrag() > 1 ? `${U[1]} (de ${perDrag()} en ${perDrag()})` : U[1]} dentro (${S.n}/${F.per})`;
  } else if (S.step === 'seal') txt = `<b>3.</b> Toca ${S.K.cont === 'bag' ? 'la bolsa para cerrarla' : S.K.cont === 'blister' ? 'el blíster para sellarlo' : 'el envase para ponerle la tapa'}`;
  else txt = '…';
  ui.querySelector('.st-step').innerHTML = txt;
  ui.querySelector('.st-count').innerHTML = `${ii(F.id)} <b>${S.made}</b> hechos · ${ii(S.sel.id)} ${left} · ${ii(F.pack)} ${packs}`;
}

// Contenedor vacío y su hueco interior (para la física), relativo a su origen
function makeContainer() {
  const k = S.K.cont;
  let o, shape;
  if (k === 'bag') {
    o = zipBag(null, { open: true, deep: true }); o.scale.set(SC, SC, SC * 0.35);
    shape = { type: 'box', hw: BAG.w * SC * 0.4, floor: -BAG.h * SC / 2 + 0.006 * SC, top: BAG.h * SC * 0.32, y: BAG.h * SC / 2 };
  } else if (k === 'jar') {
    o = jar(null, { lid: false, fill: S.K.lid === 'grey' ? 'none' : null }); o.scale.setScalar(SC);
    shape = { type: 'cyl', r: JAR.r * SC * 0.82, floor: 0.007 * SC, top: JAR.h * SC * 0.92, y: 0 };
  } else if (k === 'vial') {
    o = vialModel('level', { cap: false }); o.scale.setScalar(SC * CS.vial);
    shape = { type: 'level', top: 0.088 * SC * CS.vial, y: 0 };
  } else if (k === 'dropper') {
    o = dropperModel(false, { cap: false, level: true }); o.scale.setScalar(SC * CS.dropper);
    shape = { type: 'level', top: 0.062 * SC * CS.dropper, y: 0 };
  } else if (k === 'bottle') {
    o = amberBottle(true, { cap: false }); o.scale.setScalar(SC * CS.bottle);
    shape = { type: 'cyl', r: 0.021 * SC * CS.bottle, floor: 0.005 * SC * CS.bottle, top: 0.07 * SC * CS.bottle, y: 0 };
  } else {
    const slots = [];
    o = new THREE.Group(); const b = blisterModel(false, { slots }); b.rotation.x = -Math.PI / 2; b.position.y = 0.003; b.scale.setScalar(SC * CS.blister); o.add(b);
    o.userData.blister = b; o.userData.slots = slots;
    shape = { type: 'snap', y: 0 };
  }
  return { o, shape };
}

// Una pieza de producto. `deco`: solo para el montón de la bandeja (más pequeña)
function unit(deco = false) {
  const k = S.K.unit;
  let u;
  if (k === 'crystal') { u = crystal(GEMS[Math.floor(Math.random() * GEMS.length)], (deco ? 0.03 : 0.036) * SC); u.rotation.z = Math.random() - 0.5; }
  else if (k === 'powder') { u = new THREE.Mesh(powderG(), powderM()); u.scale.setScalar(deco ? 0.8 : 1); }
  else if (k === 'pill') { u = pillModel(SC * 1.25); u.rotation.set(Math.PI / 2, 0, Math.random() * 3); }
  else if (k === 'drop') { u = new THREE.Mesh(dropG(), dropM()); }
  else { u = bud(S.color, (deco ? 0.024 : 0.022) * SC, Math.floor(Math.random() * 4)); u.rotation.set(Math.random(), Math.random() * 6, Math.random() * 0.5); }
  u.userData.r = { crystal: 0.016, powder: 0.013, pill: 0.011, drop: 0.009, bud: 0.028 }[k] * SC;
  return u;
}
let _pg, _pm, _dg, _dm;
const powderG = () => (_pg ||= (() => { const g = new THREE.ConeGeometry(0.013 * SC, 0.014 * SC, 14); g.translate(0, 0.007 * SC - 0.0065 * SC, 0); return g; })());
const powderM = () => (_pm ||= new THREE.MeshStandardMaterial({ color: 0xfbfaf7, roughness: 0.95 }));
const dropG = () => (_dg ||= new THREE.SphereGeometry(0.009 * SC, 14, 10));
const dropM = () => (_dm ||= new THREE.MeshStandardMaterial({ color: 0xb48cf0, roughness: 0.1, emissive: 0x6a3fc0, emissiveIntensity: 0.3, transparent: true, opacity: 0.9 }));

function placeContainer(from) {
  const { o, shape } = makeContainer();
  S.root.add(o);
  const to = S.obj.spots.work.clone(); to.y += shape.y;
  S.cont = o; S.shape = shape; S.parts = []; S.level = 0; S.slot = 0;
  tween(o, from || S.obj.spots.pack, to, 0.25, () => { sfx('pop'); });
  S.step = 'fill'; S.n = 0;
  refreshUI();
}

// Suelta piezas sobre el envase: entran por la boca y caen dentro
function dropUnits(us) {
  const c = S.cont, sh = S.shape, cp = c.position;
  for (const u of us) {
    S.root.attach(u);
    const k = S.n++;
    if (sh.type === 'snap') { // blíster: cada pastilla a su alvéolo
      const slot = c.userData.slots[S.slot++];
      const to = S.root.worldToLocal(c.userData.blister.localToWorld(slot.clone()));
      tween(u, u.position.clone(), to, 0.22, () => { sfx('pop'); c.userData.blister.attach(u); }, true);
      u.rotation.set(0, 0, 0);
      continue;
    }
    const mouth = cp.clone(); mouth.y += sh.top + u.userData.r + 0.01;
    mouth.x += (Math.random() - 0.5) * (sh.hw || sh.r || 0) * 0.5;
    tween(u, u.position.clone(), mouth, 0.18, () => {
      if (!S) return;
      sfx('pop');
      if (sh.type === 'level') { // vial y gotero: lo que cae sube el nivel
        S.root.remove(u);
        S.level = Math.min(1, S.level + 1 / S.F.per);
        return;
      }
      S.parts.push({ o: u, r: u.userData.r, p: u.position, v: new THREE.Vector3((Math.random() - 0.5) * 0.15, -0.2, (Math.random() - 0.5) * 0.08), spin: new THREE.Vector3(Math.random() * 4, Math.random() * 4, Math.random() * 4) });
    }, true);
  }
  if (S.n >= S.F.per) setTimeout(() => { if (S && S.step === 'fill') { S.step = 'seal'; refreshUI(); } }, 450);
  refreshUI();
}

// ------------------------------------------------------------------
//  Física de lo que hay dentro (subpasos, choques entre piezas y con las paredes)
// ------------------------------------------------------------------
const GRAV = 3.2;
function simulate(dt) {
  const c = S.cont, sh = S.shape;
  if (!c || !S.parts.length) return;
  const cp = c.position;
  // la bolsa se abomba: la profundidad crece con lo que lleva (y nunca menos que la pieza más gorda)
  let hd = Infinity;
  if (sh.type === 'box') {
    const maxR = S.parts.reduce((a, q) => Math.max(a, q.r), 0);
    const need = Math.min(2.2, (2 * maxR * 1.12 + S.parts.length * 0.002 * SC) / (BAG.d * SC));
    const want = SC * Math.max(0.35, need);
    c.scale.z += (want - c.scale.z) * Math.min(1, dt * 10);
    hd = Math.max(0.002, (BAG.d * c.scale.z) * 0.45);
  }
  const steps = 4, h = Math.min(dt, 1 / 30) / steps;
  for (let s = 0; s < steps; s++) {
    for (const q of S.parts) {
      q.v.y -= GRAV * h;
      q.p.addScaledVector(q.v, h);
      // suelo
      const floor = cp.y + sh.floor + q.r * (S.K.unit === 'powder' ? 0.35 : 1);
      if (q.p.y < floor) { q.p.y = floor; if (q.v.y < 0) q.v.y *= -0.22; q.v.x *= 0.8; q.v.z *= 0.8; }
      // paredes: solo por debajo de la boca (por encima, entrando)
      if (q.p.y < cp.y + sh.top) {
        if (sh.type === 'box') {
          const lx = sh.hw - q.r, lz = Math.max(0, hd - q.r);
          if (q.p.x > cp.x + lx) { q.p.x = cp.x + lx; q.v.x *= -0.3; } else if (q.p.x < cp.x - lx) { q.p.x = cp.x - lx; q.v.x *= -0.3; }
          if (q.p.z > cp.z + lz) { q.p.z = cp.z + lz; q.v.z *= -0.3; } else if (q.p.z < cp.z - lz) { q.p.z = cp.z - lz; q.v.z *= -0.3; }
        } else {
          const dx = q.p.x - cp.x, dz = q.p.z - cp.z, d = Math.hypot(dx, dz), lim = Math.max(0, sh.r - q.r);
          if (d > lim) { const k = lim / (d || 1); q.p.x = cp.x + dx * k; q.p.z = cp.z + dz * k; q.v.x *= -0.3; q.v.z *= -0.3; }
        }
      }
    }
    // choques entre piezas
    for (let i = 0; i < S.parts.length; i++) for (let j = i + 1; j < S.parts.length; j++) {
      const a = S.parts[i], b = S.parts[j];
      const d = tmp.subVectors(b.p, a.p), dist = d.length(), min = (a.r + b.r) * 0.92;
      if (dist > 0 && dist < min) {
        d.multiplyScalar((min - dist) / dist / 2);
        a.p.sub(d); b.p.add(d);
        const av = a.v.clone(); a.v.lerp(b.v, 0.4).multiplyScalar(0.85); b.v.lerp(av, 0.4).multiplyScalar(0.85);
      }
    }
  }
  for (const q of S.parts) {
    const sp = q.v.length();
    q.o.rotation.x += q.spin.x * sp * dt; q.o.rotation.z += q.spin.z * sp * dt;
    if (S.K.unit === 'powder' && q.p.y < cp.y + sh.floor + q.r) q.o.scale.y += (0.55 - q.o.scale.y) * Math.min(1, dt * 6); // el polvo se asienta
  }
}

function seal() {
  const c = S.cont, K = S.K;
  S.step = 'busy';
  sfx('pack');
  if (K.cont === 'jar') {
    const lid = jar(null, { fill: K.lid === 'grey' ? 'crystal' : null }).userData.lid;
    lid.scale.setScalar(SC);
    S.root.add(lid);
    const to = c.position.clone(); to.y += (JAR.h - 0.004) * SC;
    tween(lid, to.clone().add(new THREE.Vector3(0, 0.12, 0)), to, 0.25, () => { c.attach(lid); done(); });
  } else if (K.cont === 'bag') {
    if (c.userData.zip) c.userData.zip.visible = true;
    const z0 = c.scale.z;
    S.anims.push({ t: 0, d: 0.25, fn: (k) => c.scale.set(SC * (1 + Math.sin(k * Math.PI) * 0.06), SC * (1 - Math.sin(k * Math.PI) * 0.05), z0), end: done });
  } else if (K.cont === 'blister') {
    const foil = new THREE.Mesh(new THREE.PlaneGeometry(0.06, 0.09), new THREE.MeshStandardMaterial({ color: 0xdfe5ea, roughness: 0.3, metalness: 0.6, transparent: true, opacity: 0 }));
    foil.position.z = 0.009; c.userData.blister.add(foil);
    S.anims.push({ t: 0, d: 0.3, fn: (k) => { foil.material.opacity = k * 0.85; }, end: done });
  } else {
    const cap = c.userData.cap;
    cap.visible = true;
    const y1 = cap.position.y;
    S.anims.push({ t: 0, d: 0.28, fn: (k) => { cap.position.y = y1 + (1 - k) * 0.05; cap.rotation.y = k * 4; }, end: () => { cap.position.y = y1; done(); } });
  }
}

function done() {
  // inventario: -envase, -producto, +unidad envasada
  const { sel, F } = S;
  if (inv.room(F.id, sel.p) < 1) {
    G.act.toast('No tienes hueco en el inventario.', '⚠️');
  } else {
    inv.remove(sel.id, F.per, sel.p);
    inv.remove(F.pack, 1);
    inv.add(F.id, 1, sel.p);
    S.made++;
    G.act.flag('packed');
    addXP(F.per > 1 ? 2 : 0.5);
    sfx('pack');
  }
  const c = S.cont;
  // lo de dentro se queda dentro del envase (se lo lleva consigo)
  for (const q of S.parts) c.attach(q.o);
  S.parts = [];
  S.cont = null;
  const out = S.obj.spots.out.clone();
  tween(c, c.position.clone(), out, 0.35, () => S && S.root.remove(c), true);
  S.step = 'take';
  S.n = 0;
  refreshUI();
}

// ------------------------------------------------------------------
//  Animaciones sencillas
// ------------------------------------------------------------------
function tween(o, from, to, d, end, arc = false) {
  o.position.copy(from);
  S.anims.push({ t: 0, d, fn: (k) => { const e = 1 - Math.pow(1 - k, 3); o.position.lerpVectors(from, to, e); if (arc) o.position.y += Math.sin(k * Math.PI) * 0.06; }, end });
}

export function updateStation(dt) {
  if (!S) return;
  // cámara
  S.blend = S.leaving ? Math.max(0, S.blend - dt * 3) : Math.min(1, S.blend + dt * 2.5);
  const k = S.blend * S.blend * (3 - 2 * S.blend);
  if (!S.leaving) { camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion); }
  G.camera.position.lerpVectors(camFrom, camTo, k);
  G.camera.quaternion.slerpQuaternions(qFrom, qTo, k);
  for (let i = S.anims.length - 1; i >= 0; i--) {
    const a = S.anims[i];
    a.t += dt;
    const p = Math.min(1, a.t / a.d);
    a.fn(p);
    if (p >= 1) { S.anims.splice(i, 1); a.end && a.end(); }
  }
  if (!S) return;
  simulate(dt);
  // nivel del vial / gotero
  const lv = S.cont?.userData.level;
  if (lv) {
    const gh = lv.geometry.parameters.height || 1, want = Math.max(0.001, (S.level * S.cont.userData.levelMax) / gh);
    lv.scale.y += (want - lv.scale.y) * Math.min(1, dt * 6);
    lv.position.y = 0.003 + (gh * lv.scale.y) / 2;
  }
  if (S && S.leaving && S.blend <= 0) finishExit();
}

// ------------------------------------------------------------------
//  Entrada (arrastrar / tocar)
// ------------------------------------------------------------------
function pickPoint(e) {
  const r = ui.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, G.camera);
  const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
  return hit ? S.root.worldToLocal(hit) : null;
}
const near = (p, spot, r) => p && Math.hypot(p.x - spot.x, p.z - spot.z) < r;

function onDown(e) {
  if (!S || S.leaving || e.target.closest('button')) return;
  const p = pickPoint(e);
  const sp = S.obj.spots;
  if (S.step === 'take' && near(p, sp.pack, 0.16)) {
    if (!havePack()) return fail(`No te quedan ${ITEMS[S.F.pack].name.toLowerCase()}.`);
    if (!haveProduct()) return fail(`Necesitas ${S.F.per} ${UNIT_NAME[S.K.unit][1]}.`);
    const c = makeContainer().o;
    c.position.copy(p).setY(sp.work.y + 0.05);
    S.root.add(c);
    S.drag = { kind: 'pack', o: c, x: e.clientX, y: e.clientY, moved: false };
    sfx('click');
  } else if (S.step === 'fill' && near(p, sp.supply, 0.17)) {
    const g = new THREE.Group(), n = perDrag();
    for (let i = 0; i < n; i++) { const u = unit(); u.position.set((i % 3 - 1) * 0.02, Math.floor(i / 3) * 0.015, 0); g.add(u); }
    g.position.copy(p).setY(sp.work.y + 0.14);
    S.root.add(g);
    S.drag = { kind: 'unit', o: g, x: e.clientX, y: e.clientY, moved: false };
    sfx('click');
  } else if (S.step === 'seal' && near(p, sp.work, 0.14)) {
    seal();
  }
  if (S?.drag) { try { ui.setPointerCapture?.(e.pointerId); } catch (err) { /* puntero sintético */ } }
}

function onMove(e) {
  if (!S || !S.drag) return;
  const p = pickPoint(e);
  if (!p) return;
  if (Math.hypot(e.clientX - S.drag.x, e.clientY - S.drag.y) > 8) S.drag.moved = true;
  S.drag.o.position.x = p.x; S.drag.o.position.z = p.z;
}

function onUp(e) {
  if (!S || !S.drag) return;
  const d = S.drag;
  S.drag = null;
  const sp = S.obj.spots;
  const p = d.o.position;
  // si no se ha movido (un toque), va solo a su sitio
  const onWork = !d.moved || near(p, sp.work, 0.14);
  if (d.kind === 'pack') {
    if (onWork) { const from = p.clone(); S.root.remove(d.o); placeContainer(from); }
    else { tween(d.o, p.clone(), sp.pack.clone(), 0.2, () => S && S.root.remove(d.o)); }
  } else if (d.kind === 'unit') {
    if (onWork && S.step === 'fill') { const us = [...d.o.children]; for (const u of us) S.root.attach(u); S.root.remove(d.o); dropUnits(us); }
    else tween(d.o, p.clone(), sp.supply.clone(), 0.2, () => S && S.root.remove(d.o));
  }
}

function fail(msg) { sfx('error'); G.act.toast(msg, '⚠️'); }

// Para pruebas: completa una unidad de principio a fin.
export function stationAuto() {
  if (!S) return false;
  const sp = S.obj.spots;
  if (S.step === 'take') { if (!havePack() || !haveProduct()) return false; placeContainer(sp.pack.clone()); }
  while (S.step === 'fill' && S.n < S.F.per) { const us = []; for (let i = 0; i < perDrag(); i++) { const u = unit(); u.position.copy(sp.supply); S.root.add(u); us.push(u); } dropUnits(us); }
  S.step = 'busy'; done();
  return true;
}
export const stationState = () => S;
