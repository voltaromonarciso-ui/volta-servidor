import * as THREE from 'three';
import { G } from '../game.js';
import { ITEMS, STRAINS } from '../data/items.js';
import { inv } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { addXP } from './economy.js';
import { zipBag, jar, shardsBag, bud, crystal, GEMS, crystalCluster, JAR } from '../entities/goods.js';
import { ii } from '../ui/icons.js';

// Estación de empaquetado a mano: la cámara baja a la mesa y el jugador arrastra
// un envase vacío al tapete, mete el producto unidad a unidad y lo cierra.
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
//  Abrir / cerrar
// ------------------------------------------------------------------
export function startStation(obj, sel, F) {
  if (S) { if (!S.leaving) return; finishExit(); }
  if (document.pointerLockElement) document.exitPointerLock();
  const shards = sel.id === 'cristal';
  const isJar = F.id === 'tarro';
  S = {
    obj, sel, F, shards, isJar,
    color: colorOf(sel.p),
    step: 'take',          // take → fill → seal
    n: 0, made: 0,
    t: 0, blend: 0, leaving: false,
    root: new THREE.Group(),
    drag: null, anims: [],
  };
  G.station = S;
  G.uiOpen = true;
  obj.group.add(S.root);
  // el montón de producto de la mesa se cambia por cristales si toca
  const sup = obj.supply;
  if (sup) {
    sup.userData.pile.visible = !shards;
    if (shards) {
      const c = new THREE.Group(); c.position.y = 0.04;
      crystalCluster(c, 9, 0.16, 0.05, 2);
      sup.add(c); S.altPile = c;
    }
  }
  // en la mesa de sobres, un montón de bolsas Sweet Shards si se envasan cristales
  if (shards) {
    const st = new THREE.Group();
    for (let i = 0; i < 5; i++) { const b = shardsBag(false); b.rotation.x = -Math.PI / 2; b.position.y = i * 0.005; b.scale.setScalar(1.25); st.add(b); }
    st.position.copy(obj.spots.pack).setY(obj.spots.pack.y - 0.02);
    S.root.add(st); S.altPack = st;
  }
  // cámara: desde la posición actual hasta encima del tapete
  const work = obj.spots.work;
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
  if (S.obj.supply) { S.obj.supply.userData.pile.visible = true; if (S.altPile) S.obj.supply.remove(S.altPile); }
  // devuelve lo que estuviera a medio envasar
  document.body.classList.remove('in-station');
  G.station = null;
  G.uiOpen = false;
  S = null;
}

// ------------------------------------------------------------------
//  Lógica de pasos
// ------------------------------------------------------------------
const haveProduct = () => inv.count(S.sel.id, S.sel.p) >= S.F.per;
const havePack = () => inv.count(S.F.pack) > 0;

function refreshUI() {
  if (!S) return;
  const F = S.F, src = S.shards ? 'cristal' : 'cogollo';
  const left = inv.count(S.sel.id, S.sel.p), packs = inv.count(F.pack);
  const name = ITEMS[F.id].name.toLowerCase();
  let txt;
  if (S.step === 'take') {
    txt = !packs ? `No te quedan ${ITEMS[F.pack].name.toLowerCase()}.` : left < F.per ? `No te quedan ${src === 'cristal' ? 'cristales' : 'cogollos'} suficientes.` :
      `<b>1.</b> Arrastra ${S.isJar ? 'un tarro vacío' : S.shards ? 'una bolsa vacía' : 'un sobre vacío'} al ${S.isJar ? 'plato de la máquina' : 'tapete'}`;
  } else if (S.step === 'fill') {
    txt = `<b>2.</b> Arrastra ${S.shards ? 'cristales' : 'cogollos'} dentro (${S.n}/${F.per})`;
  } else txt = `<b>3.</b> Toca ${S.isJar ? 'el tarro para ponerle la tapa' : 'la bolsa para cerrarla'}`;
  ui.querySelector('.st-step').innerHTML = txt;
  ui.querySelector('.st-count').innerHTML = `${ii(F.id)} <b>${S.made}</b> hechos · ${ii(S.sel.id)} ${left} · ${ii(F.pack)} ${packs}`;
}

function makeContainer() {
  const c = S.isJar ? jar(null, { lid: false }) : S.shards ? shardsBag(false) : zipBag(null, { open: true });
  c.scale.setScalar(SC);
  return c;
}
function unit() {
  if (S.shards) { const c = crystal(GEMS[Math.floor(Math.random() * GEMS.length)], 0.045 * SC); c.rotation.z = Math.random() - 0.5; return c; }
  const b = bud(S.color, 0.032 * SC, Math.floor(Math.random() * 4)); b.rotation.set(Math.random(), Math.random() * 6, Math.random() * 0.5);
  return b;
}
// Altura del centro del envase colocado (las bolsas van de pie con el origen en el centro).
const contY = () => (S.isJar ? 0 : 0.058 * SC);

function placeContainer(from) {
  const c = makeContainer();
  S.root.add(c);
  const to = S.obj.spots.work.clone(); to.y += contY();
  S.cont = c;
  tween(c, from || S.obj.spots.pack, to, 0.25, () => { sfx('pop'); });
  S.step = 'fill'; S.n = 0;
  refreshUI();
}

function dropUnit(u) {
  // el producto cae dentro del envase
  const top = S.obj.spots.work.clone();
  const k = S.n;
  let to;
  if (S.isJar) {
    const a = k * 2.4;
    to = top.clone().add(new THREE.Vector3(Math.cos(a) * JAR.r * 0.45 * SC * (k ? 1 : 0), (0.016 + Math.floor(k / 2) * 0.02) * SC, Math.sin(a) * JAR.r * 0.45 * SC * (k ? 1 : 0)));
  } else to = top.clone().add(new THREE.Vector3(0, 0.03 * SC, 0));
  S.root.attach(u);
  tween(u, u.position.clone(), to, 0.22, () => {
    sfx('pop');
    if (!S.isJar) u.visible = false;
  }, true);
  S.units = S.units || [];
  S.units.push(u);
  S.n++;
  if (S.n >= S.F.per) {
    S.step = 'seal';
    // al llenarse, las bolsas muestran su contenido final
    setTimeout(() => {
      if (!S || !S.cont || S.isJar) return;
      const full = S.shards ? shardsBag(true) : zipBag(S.color, { open: true });
      full.scale.setScalar(SC);
      full.position.copy(S.cont.position);
      S.root.remove(S.cont); S.root.add(full); S.cont = full;
    }, 240);
  }
  refreshUI();
}

function seal() {
  const c = S.cont;
  S.step = 'busy';
  sfx('pack');
  if (S.isJar) {
    const lid = jar(null).userData.lid;
    lid.scale.setScalar(SC);
    S.root.add(lid);
    const to = c.position.clone(); to.y += (JAR.h - 0.004) * SC;
    tween(lid, to.clone().add(new THREE.Vector3(0, 0.12, 0)), to, 0.25, () => { c.attach(lid); done(); });
  } else {
    if (c.userData.zip) c.userData.zip.visible = true;
    S.anims.push({ t: 0, d: 0.25, fn: (k) => c.scale.set(SC * (1 + Math.sin(k * Math.PI) * 0.08), SC * (1 - Math.sin(k * Math.PI) * 0.06), SC), end: done });
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
  // en el tarro los cogollos se quedan dentro; en las bolsas ya se ven en el modelo lleno
  for (const u of S.units || []) { if (S.isJar && c) c.attach(u); else S.root.remove(u); }
  S.units = [];
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
    if (!haveProduct()) return fail(`Necesitas ${S.F.per} ${S.shards ? 'cristales' : 'cogollos'}.`);
    const c = makeContainer();
    c.position.copy(p).setY(sp.work.y + contY() + 0.05);
    S.root.add(c);
    S.drag = { kind: 'pack', o: c, x: e.clientX, y: e.clientY, moved: false };
    sfx('click');
  } else if (S.step === 'fill' && near(p, sp.supply, 0.17)) {
    const u = unit();
    u.position.copy(p).setY(sp.work.y + 0.09);
    S.root.add(u);
    S.drag = { kind: 'unit', o: u, x: e.clientX, y: e.clientY, moved: false };
    sfx('click');
  } else if (S.step === 'seal' && near(p, sp.work, 0.14)) {
    seal();
  }
  if (S.drag) ui.setPointerCapture?.(e.pointerId);
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
    if (onWork && S.step === 'fill') dropUnit(d.o);
    else tween(d.o, p.clone(), sp.supply.clone(), 0.2, () => S && S.root.remove(d.o));
  }
}

function fail(msg) { sfx('error'); G.act.toast(msg, '⚠️'); }

// Para pruebas: completa una unidad de principio a fin.
export function stationAuto() {
  if (!S) return false;
  const sp = S.obj.spots;
  if (S.step === 'take') { if (!havePack() || !haveProduct()) return false; placeContainer(sp.pack.clone()); }
  while (S.step === 'fill') { const u = unit(); u.position.copy(sp.supply); S.root.add(u); dropUnit(u); }
  if (S.step === 'seal') { S.step = 'busy'; done(); }
  return true;
}
