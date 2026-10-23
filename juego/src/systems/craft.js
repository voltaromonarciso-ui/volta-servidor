// Elaboración a mano en las estaciones del cártel (cristales, polvos, pastillas, líquidos).
// La cámara baja a la mesa y el jugador hace todo lo que es trabajo de manos:
//   1. arrastra cada ingrediente, uno a uno, desde su sitio al cuenco;
//   2. remueve con el dedo dando vueltas sobre el cuenco hasta que la mezcla queda uniforme;
//   3. lleva el cuenco a la máquina (tolva o depósito) y lo vuelca;
//   4. pulsa el botón verde;
// y la máquina hace sola lo suyo: trabaja un rato (más cuanto más caro es el producto) con su
// pantalla encendida, vibrando y echando vapor. Al acabar, el producto sale a la bandeja y se
// recoge con un toque. Desde aquí se puede pasar a envasarlo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { G } from '../game.js';
import { ITEMS, LAB, STRAINS } from '../data/items.js';
import { inv, save } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { addXP, ensureBaseProduct } from './economy.js';
import { buildItem } from '../entities/hands.js';
import { crystalCluster, bud, pillModel, powderPile } from '../entities/goods.js';
import { ii } from '../ui/icons.js';
import { labScreen } from '../world/labs.js';

const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), tmp = new THREE.Vector3();
const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const camFrom = new THREE.Vector3(), camTo = new THREE.Vector3(), qFrom = new THREE.Quaternion(), qTo = new THREE.Quaternion();
const SECS = { crystal: 8, powder: 12, pills: 16, liquid: 22 }; // lo que tarda la máquina (más cuanto más caro)
const TURNS = 3;               // vueltas para que la mezcla quede bien
const PIX = 70;                // radio de acierto en pantalla (px), cómodo en móvil
let C = null, ui = null;

function overlay() {
  if (ui) return ui;
  ui = document.createElement('div');
  ui.id = 'craft';
  ui.innerHTML = `<div class="st-top"><div class="st-title"></div><div class="st-step"></div><div class="cr-bar"><i></i></div></div>
    <div class="st-count"></div>
    <div class="cr-btns"><button class="cr-pack btn">Envasar</button><button class="st-exit btn ghost">Terminar</button></div>`;
  document.body.appendChild(ui);
  ui.querySelector('.st-exit').onclick = () => exitCraft();
  ui.querySelector('.cr-pack').onclick = () => { const o = C?.obj; exitCraft(); if (o) setTimeout(() => G.act.openLab(o, 'pack'), 450); };
  ui.addEventListener('pointerdown', onDown);
  ui.addEventListener('pointermove', onMove);
  ui.addEventListener('pointerup', onUp);
  ui.addEventListener('pointercancel', onUp);
  return ui;
}

// ------------------------------------------------------------------
//  Abrir / cerrar
// ------------------------------------------------------------------
export function startCraft(obj) {
  if (C || G.station) return;
  if (document.pointerLockElement) document.exitPointerLock();
  const type = obj.entry.type, L = LAB[type], cr = obj.craft;
  C = { obj, type, L, cr, root: new THREE.Group(), anims: [], step: 'add', added: {}, mix: 0, ang: null, blend: 0, leaving: false, made: 0, drag: null, wait: 0 };
  G.craft = C; G.uiOpen = true;
  obj.group.add(C.root);
  // ingredientes en su sitio, cada uno en un platillo con su nombre
  C.sup = Object.keys(L.make).map((id, i) => {
    const at = cr.supplies[i].clone();
    const base = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.012, 24), new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.4 }));
    base.position.copy(at).setY(at.y + 0.006); C.root.add(base);
    const v = ingredient(id); v.position.copy(at).setY(at.y + 0.012); C.root.add(v);
    return { id, at, v };
  });
  // el cuenco de mezclar (con su contenido, que sube y cambia de color)
  const bowl = new THREE.Group(); bowl.position.copy(cr.bowl);
  const steel = new THREE.MeshStandardMaterial({ color: 0xd4dadf, roughness: 0.18, metalness: 0.85, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.065, 0.08, 28, 1, true), steel); shell.position.y = 0.045; bowl.add(shell);
  const bottom = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 0.006, 28), steel); bottom.position.y = 0.006; bowl.add(bottom);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.005, 8, 32), steel); rim.rotation.x = Math.PI / 2; rim.position.y = 0.085; bowl.add(rim);
  const fill = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.066, 0.01, 28), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.7 }));
  fill.position.y = 0.012; fill.visible = false; bowl.add(fill);
  // vetas de la mezcla sin remover (giran al remover y desaparecen)
  const swirl = new THREE.Mesh(new THREE.RingGeometry(0.02, 0.06, 24, 1, 0, Math.PI * 1.3), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, side: THREE.DoubleSide }));
  swirl.rotation.x = -Math.PI / 2; swirl.visible = false; bowl.add(swirl);
  C.root.add(bowl);
  C.bowl = { g: bowl, fill, swirl, home: cr.bowl.clone() };
  // pantalla de la máquina (se enciende al trabajar)
  C.screen = labScreen();
  C.base = obj.group.position.clone();
  // cámara: de frente y algo alta, que se vea la máquina y la zona de trabajo
  const cx = (cr.input.x + cr.bowl.x) / 2, Y = cr.bowl.y;
  const eye = obj.group.localToWorld(new THREE.Vector3(cx, Y + 1.12, 1.38)).clone();
  const look = obj.group.localToWorld(new THREE.Vector3(cx, Y + 0.3, -0.05));
  camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion);
  camTo.copy(eye);
  qTo.setFromRotationMatrix(new THREE.Matrix4().lookAt(eye, look, new THREE.Vector3(0, 1, 0)));
  plane.constant = -obj.group.localToWorld(tmp.set(0, Y, 0)).y;
  document.body.classList.add('in-station');
  overlay().classList.add('on');
  ui.querySelector('.st-title').innerHTML = `${ii(L.out)} ${L.name}`;
  refresh();
  sfx('open');
}

export function exitCraft() {
  if (!C || C.leaving) return;
  if (C.step === 'wait') return fail('La máquina está trabajando: espera a que acabe.');
  C.leaving = true; C.blend = 1;
  if (C.made) G.act.toast(`Has elaborado ${C.made}× ${ITEMS[C.L.out].name}`, ii(C.L.out));
  ui.classList.remove('on');
  sfx('close');
}
function finishExit() {
  C.obj.group.remove(C.root);
  C.obj.group.position.copy(C.base);
  if (C.screen) C.screen.emissiveIntensity = 1.3;
  document.body.classList.remove('in-station');
  G.craft = null; G.uiOpen = false; C = null;
}

// ------------------------------------------------------------------
//  Piezas
// ------------------------------------------------------------------
function ingredient(id, small = false) {
  let g;
  if (id === 'cogollo') { g = new THREE.Group(); for (let i = 0; i < (small ? 1 : 4); i++) { const b = bud('#6abf45', 0.03, i); b.position.set((i % 2) * 0.04 - 0.02, 0.025 + Math.floor(i / 2) * 0.02, 0); g.add(b); } return g; }
  if (id === 'polvo') { g = powderPile(); g.scale.setScalar(small ? 0.5 : 1.2); return g; }
  g = buildItem({ id }).group;
  g.scale.setScalar(small ? 1.2 : 1.6);
  const box = new THREE.Box3().setFromObject(g); g.position.y = 0; // apoyado en el platillo
  const w = new THREE.Group(); g.position.y = -box.min.y; w.add(g);
  return w;
}
function product(n) {
  const g = new THREE.Group(), k = C.type;
  if (k === 'crystal') { crystalCluster(g, 14, 0.24, 0.05, 4); }
  else if (k === 'powder') { const p = powderPile(); p.scale.set(1.8, 1.2, 1.8); g.add(p); }
  else if (k === 'pills') { for (let i = 0; i < Math.min(n, 12); i++) { const p = pillModel(2.4); p.position.set((i % 4) * 0.035 - 0.05, 0.012, Math.floor(i / 4) * 0.035 - 0.035); p.rotation.set(Math.PI / 2, 0, i); g.add(p); } }
  else { for (let i = 0; i < 4; i++) { const v = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.07, 16), new THREE.MeshStandardMaterial({ color: 0xb48cf0, roughness: 0.1, transparent: true, opacity: 0.85, emissive: 0x6a3fc0, emissiveIntensity: 0.3 })); v.position.set(-0.21 + i * 0.14, 0.035, 0); g.add(v); } }
  return g;
}

// ------------------------------------------------------------------
//  Pasos
// ------------------------------------------------------------------
const need = (id) => C.L.make[id];
const allIn = () => Object.keys(C.L.make).every((id) => (C.added[id] || 0) >= need(id));
const canStart = () => Object.entries(C.L.make).every(([id, n]) => inv.count(id) >= n);

function refresh() {
  if (!C) return;
  const L = C.L;
  let t = '';
  if (C.step === 'add') {
    if (!canStart()) t = `Te faltan ingredientes: ${Object.entries(L.make).filter(([id, n]) => inv.count(id) < n).map(([id, n]) => `${n}× ${ITEMS[id].name}`).join(', ')}.`;
    else {
      const next = Object.keys(L.make).find((id) => (C.added[id] || 0) < need(id));
      t = `<b>1.</b> Arrastra los ingredientes al cuenco: ${Object.keys(L.make).map((id) => `${ITEMS[id].name} ${C.added[id] || 0}/${need(id)}`).join(' · ')}${next ? '' : ''}`;
    }
  } else if (C.step === 'mix') t = `<b>2.</b> Remueve: da vueltas con el dedo sobre el cuenco (${Math.round(C.mix * 100)} %)`;
  else if (C.step === 'load') t = `<b>3.</b> Lleva el cuenco a la ${C.type === 'liquid' ? 'boca del depósito' : 'tolva de la máquina'} y vuélcalo`;
  else if (C.step === 'start') t = '<b>4.</b> Pulsa el botón verde de la máquina';
  else if (C.step === 'wait') t = `La máquina está trabajando… ${Math.ceil(C.wait)} s`;
  else if (C.step === 'collect') t = `<b>5.</b> Toca la bandeja para recoger ${L.n}× ${ITEMS[L.out].name}`;
  else t = '…';
  ui.querySelector('.st-step').innerHTML = t;
  const bar = ui.querySelector('.cr-bar'); bar.style.display = C.step === 'wait' || C.step === 'mix' ? 'block' : 'none';
  bar.querySelector('i').style.width = `${Math.round((C.step === 'mix' ? C.mix : 1 - C.wait / SECS[C.type]) * 100)}%`;
  ui.querySelector('.st-count').innerHTML = Object.keys(L.make).map((id) => `${ii(id)} ${inv.count(id)}`).join(' · ') + ` · ${ii(L.out)} <b>${C.made}</b> hechos`;
  ui.querySelector('.cr-pack').style.display = inv.count(L.out) && ['add', 'collect'].includes(C.step) ? '' : 'none';
}

function addToBowl(id, v) {
  C.added[id] = (C.added[id] || 0) + 1;
  const b = C.bowl;
  const to = b.g.position.clone(); to.y += 0.06;
  tween(v, v.position.clone(), to, 0.22, () => {
    C.root.remove(v); sfx('pop');
    // el cuenco se llena y la mezcla aún se ve sin remover
    const total = Object.values(C.L.make).reduce((a, n) => a + n, 0), got = Object.values(C.added).reduce((a, n) => a + n, 0);
    b.fill.visible = true; b.fill.scale.y = 1 + got / total * 4; b.fill.position.y = 0.012 + (b.fill.scale.y * 0.01) / 2;
    b.fill.material.color.set(id === 'cogollo' ? '#6abf45' : id === 'hoja' ? '#7fb88a' : ITEMS[id]?.color || '#dddddd').lerp(new THREE.Color(C.cr.mix), got / total * 0.4);
    b.swirl.visible = true; b.swirl.position.y = b.fill.position.y + 0.006; b.swirl.material.color.set(C.cr.mix);
    if (allIn()) { C.step = 'mix'; C.mix = 0; C.ang = null; }
    refresh();
  }, true);
}

function stirTo(px, py) {
  // ángulo del dedo alrededor del cuenco (en pantalla); cuenta las vueltas
  const c = screenOf(C.bowl.g.position);
  const a = Math.atan2(py - c.y, px - c.x);
  if (C.ang !== null) {
    let d = a - C.ang; if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2;
    if (Math.abs(d) < 1.2) {
      C.mix = Math.min(1, C.mix + Math.abs(d) / (Math.PI * 2 * TURNS));
      const b = C.bowl;
      b.swirl.rotation.z += d; b.swirl.material.opacity = 0.5 * (1 - C.mix);
      b.fill.material.color.lerp(new THREE.Color(C.cr.mix), Math.abs(d) * 0.08);
      if (Math.random() < 0.08) sfx('click');
    }
  }
  C.ang = a;
  if (C.mix >= 1) { C.step = 'load'; C.bowl.swirl.visible = false; C.bowl.fill.material.color.set(C.cr.mix); sfx('pop'); }
  refresh();
}

function pourIntoMachine() {
  const b = C.bowl.g, home = C.bowl.home.clone(), up = C.cr.input.clone(); up.y += 0.08;
  C.step = 'busy';
  tween(b, b.position.clone(), up, 0.45, () => {
    // inclina y vuelca
    C.anims.push({ t: 0, d: 0.6, fn: (k) => { b.rotation.z = Math.sin(Math.min(1, k * 1.6) * Math.PI / 2) * 1.9; C.bowl.fill.scale.y = Math.max(0.01, C.bowl.fill.scale.y * (1 - k * 0.15)); }, end: () => {
      sfx('mix');
      C.bowl.fill.visible = false;
      C.anims.push({ t: 0, d: 0.3, fn: (k) => { b.rotation.z = 1.9 * (1 - k); }, end: () => tween(b, b.position.clone(), home, 0.45, () => { C.step = 'start'; refresh(); }) });
    } });
  });
  refresh();
}

function startMachine() {
  if (!canStart()) return fail('Te faltan ingredientes.');
  for (const [id, n] of Object.entries(C.L.make)) {
    if (id === 'cogollo') { // de la variedad que más tengas
      let left = n; const by = new Map(); for (const s of G.state.inv) if (s && s.id === id) by.set(s.p, (by.get(s.p) || 0) + s.q);
      for (const [p] of [...by].sort((a, b) => b[1] - a[1])) { const t = Math.min(left, inv.count(id, p)); inv.remove(id, t, p); left -= t; if (!left) break; }
    } else if (ITEMS[id].product) { // el polvo de la máquina de pastillas: el que más tengas
      let left = n; const by = new Map(); for (const s of G.state.inv) if (s && s.id === id) by.set(s.p, (by.get(s.p) || 0) + s.q);
      for (const [p] of [...by].sort((a, b) => b[1] - a[1])) { const t = Math.min(left, inv.count(id, p)); inv.remove(id, t, p); left -= t; if (!left) break; }
    } else inv.remove(id, n);
  }
  save();
  C.step = 'wait'; C.wait = SECS[C.type];
  C.puffT = 0;
  sfx('click');
  refresh();
}

function machineDone() {
  C.step = 'collect';
  const p = product(C.L.n); p.position.copy(C.cr.out); C.root.add(p); C.out = p;
  p.scale.setScalar(0.01);
  C.anims.push({ t: 0, d: 0.4, fn: (k) => p.scale.setScalar(Math.max(0.01, 1 - Math.pow(1 - k, 3))) });
  sfx('harvest');
  if (C.screen) C.screen.emissiveIntensity = 1.3;
  C.obj.group.position.copy(C.base);
  refresh();
}

function collect() {
  const L = C.L, pid = ensureBaseProduct(L.strain);
  if (inv.room(L.out, pid) < L.n) return fail('No tienes hueco en el inventario.');
  inv.add(L.out, L.n, pid);
  C.made += L.n;
  addXP(6);
  save();
  const o = C.out; C.out = null;
  const up = o.position.clone(); up.y += 0.25; up.z += 0.3;
  tween(o, o.position.clone(), up, 0.35, () => C && C.root.remove(o), true);
  sfx('pack');
  C.step = 'add'; C.added = {}; C.mix = 0;
  refresh();
}

// ------------------------------------------------------------------
//  Bucle
// ------------------------------------------------------------------
function tween(o, from, to, d, end, arc = false) {
  o.position.copy(from);
  C.anims.push({ t: 0, d, fn: (k) => { const e = 1 - Math.pow(1 - k, 3); o.position.lerpVectors(from, to, e); if (arc) o.position.y += Math.sin(k * Math.PI) * 0.08; }, end });
}

export function updateCraft(dt) {
  if (!C) return;
  C.blend = C.leaving ? Math.max(0, C.blend - dt * 3) : Math.min(1, C.blend + dt * 2.5);
  const k = C.blend * C.blend * (3 - 2 * C.blend);
  if (!C.leaving) { camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion); }
  G.camera.position.lerpVectors(camFrom, camTo, k);
  G.camera.quaternion.slerpQuaternions(qFrom, qTo, k);
  for (let i = C.anims.length - 1; i >= 0; i--) {
    const a = C.anims[i]; a.t += dt; const p = Math.min(1, a.t / a.d); a.fn(p);
    if (p >= 1) { C.anims.splice(i, 1); a.end && a.end(); }
    if (!C) return;
  }
  if (C.step === 'wait') {
    C.wait -= dt;
    // la máquina vibra, la pantalla parpadea y sale vapor por arriba
    C.obj.group.position.set(C.base.x + (Math.random() - 0.5) * 0.004, C.base.y, C.base.z + (Math.random() - 0.5) * 0.004);
    if (C.screen) C.screen.emissiveIntensity = 1.3 + Math.sin(G.time * 14) * 0.9;
    if ((C.puffT -= dt) <= 0) { C.puffT = 0.25; puff(); }
    if (Math.random() < dt * 2) sfx('click');
    if (C.wait <= 0) machineDone();
    refresh();
  }
  if (C && C.leaving && C.blend <= 0) finishExit();
}
const puffG = new THREE.SphereGeometry(0.03, 10, 8);
function puff() {
  const m = new THREE.Mesh(puffG, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.45, depthWrite: false }));
  m.position.copy(C.cr.input); C.root.add(m);
  const from = m.position.clone();
  C.anims.push({ t: 0, d: 1.2, fn: (k) => { m.position.set(from.x + Math.sin(k * 6) * 0.02, from.y + k * 0.35, from.z); m.scale.setScalar(1 + k * 2); m.material.opacity = 0.45 * (1 - k); }, end: () => C && C.root.remove(m) });
}

// ------------------------------------------------------------------
//  Entrada
// ------------------------------------------------------------------
function screenOf(local) {
  const w = C.root.localToWorld(local.clone()).project(G.camera);
  const r = ui.getBoundingClientRect();
  return { x: (w.x + 1) / 2 * r.width + r.left, y: (1 - w.y) / 2 * r.height + r.top };
}
const hitPx = (e, local, r = PIX) => { const s = screenOf(local); return Math.hypot(e.clientX - s.x, e.clientY - s.y) < r; };
function pickPoint(e) {
  const r = ui.getBoundingClientRect();
  ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  ray.setFromCamera(ndc, G.camera);
  const hit = ray.ray.intersectPlane(plane, new THREE.Vector3());
  return hit ? C.root.worldToLocal(hit) : null;
}

function onDown(e) {
  if (!C || C.leaving || e.target.closest('button')) return;
  if (C.step === 'add') {
    if (!canStart()) return fail('Te faltan ingredientes para una tanda.');
    const s = C.sup.find((q) => hitPx(e, q.at));
    if (!s) return;
    if ((C.added[s.id] || 0) >= need(s.id)) return fail(`Ya has echado ${need(s.id)}× ${ITEMS[s.id].name}.`);
    const v = ingredient(s.id, true); v.position.copy(s.at).setY(s.at.y + 0.1); C.root.add(v);
    C.drag = { kind: 'ing', id: s.id, o: v, moved: false, x: e.clientX, y: e.clientY };
    sfx('click');
  } else if (C.step === 'mix' && hitPx(e, C.bowl.g.position, PIX * 1.6)) {
    C.drag = { kind: 'stir' }; C.ang = null;
  } else if (C.step === 'load' && hitPx(e, C.bowl.g.position, PIX * 1.2)) {
    C.drag = { kind: 'bowl', moved: false, x: e.clientX, y: e.clientY };
  } else if (C.step === 'start' && hitPx(e, C.cr.button, PIX * 0.9)) startMachine();
  else if (C.step === 'collect' && hitPx(e, C.cr.out, PIX * 1.4)) collect();
  if (C?.drag) { try { ui.setPointerCapture?.(e.pointerId); } catch (err) { /* puntero sintético */ } }
}
function onMove(e) {
  if (!C || !C.drag) return;
  const d = C.drag;
  if (d.kind === 'stir') return stirTo(e.clientX, e.clientY);
  if (Math.hypot(e.clientX - d.x, e.clientY - d.y) > 8) d.moved = true;
  const p = pickPoint(e); if (!p) return;
  if (d.kind === 'ing') { d.o.position.x = p.x; d.o.position.z = p.z; }
  else if (d.kind === 'bowl') { C.bowl.g.position.x = p.x; C.bowl.g.position.z = p.z; C.bowl.g.position.y = C.bowl.home.y + 0.08; }
}
function onUp(e) {
  if (!C || !C.drag) return;
  const d = C.drag; C.drag = null;
  if (d.kind === 'ing') {
    // sobre el cuenco (o un toque: va solo)
    if (!d.moved || hitPx(e, C.bowl.g.position, PIX * 1.3)) addToBowl(d.id, d.o);
    else { const s = C.sup.find((q) => q.id === d.id); tween(d.o, d.o.position.clone(), s.at.clone().setY(s.at.y + 0.05), 0.2, () => C && C.root.remove(d.o)); }
  } else if (d.kind === 'bowl') {
    // soltado bajo la tolva/depósito (en pantalla, cerca de su vertical) o un toque
    const s = screenOf(C.cr.input), sb = screenOf(C.bowl.g.position);
    if (!d.moved || Math.abs(sb.x - s.x) < PIX * 1.5) pourIntoMachine();
    else tween(C.bowl.g, C.bowl.g.position.clone(), C.bowl.home.clone(), 0.25);
  }
}
function fail(msg) { sfx('error'); G.act.toast(msg, '⚠️'); }

// Para pruebas: hace una tanda entera (sin esperar a la máquina)
export function craftAuto() {
  if (!C || !canStart()) return false;
  for (const id of Object.keys(C.L.make)) C.added[id] = need(id);
  C.mix = 1; startMachine(); C.wait = 0; machineDone(); collect();
  return true;
}
void RoundedBoxGeometry; void STRAINS;
export const craftState = () => C;
