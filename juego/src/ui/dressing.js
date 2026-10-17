import * as THREE from 'three';
import { G, money } from '../game.js';
import { sfx } from '../core/audio.js';
import { resetTouch, guardGhostClick } from '../core/input.js';
import { style, owns, canBeard, barberQuote, barberApply, buyClothes, equip, unequip, recognition, CLOTHES, HAIR_COLORS, BEARDS, SLOTS } from '../systems/appearance.js';

// Peluquería y probador: el jugador se ve a sí mismo (su avatar real con la
// apariencia aplicada) mientras elige. Todo se previsualiza antes de pagar y,
// al salir sin pagar, el avatar vuelve a como estaba.

const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const swatch = (hex) => `<i class="sw" style="background:${hex}"></i>`;
const TAGS = { calle: 'Calle', elegante: 'Elegante', deportivo: 'Deportivo' };

let D = null; // vista abierta
const camFrom = new THREE.Vector3(), qFrom = new THREE.Quaternion();
const tmpQ = new THREE.Quaternion(), tmpM = new THREE.Matrix4();

export const dressingOpen = () => !!D;

// ------------------------------------------------------------------
//  Vista común
// ------------------------------------------------------------------
function open(kind, spot, sitting) {
  const av = G.avatar;
  if (!av) { G.act.toast('No disponible con este personaje.', '⚠️'); return null; }
  if (G.uiOpen) return null;
  if (document.pointerLockElement) document.exitPointerLock();
  resetTouch();
  G.uiOpen = true;
  av.group.position.set(spot.x, 0, spot.z);
  av.group.rotation.y = spot.yaw;
  av.group.visible = true;
  av.apply(style());
  D = { kind, spot, sitting, blend: 0, leaving: false, yaw: spot.yaw, preview: style(), root: h('div', 'dress') };
  guardGhostClick();
  camFrom.copy(G.camera.position); qFrom.copy(G.camera.quaternion);
  document.body.classList.add('in-dress');
  document.body.appendChild(D.root);
  // arrastrar fuera del panel gira al personaje (probador)
  let drag = null;
  D.root.addEventListener('pointerdown', (e) => { if (e.target === D.root) { drag = e.clientX; D.root.setPointerCapture?.(e.pointerId); } });
  D.root.addEventListener('pointermove', (e) => { if (drag !== null && !D.sitting) { D.yaw += (e.clientX - drag) * 0.012; drag = e.clientX; } });
  D.root.addEventListener('pointerup', () => { drag = null; });
  sfx('open');
  return D;
}

export function closeDressing() {
  if (!D || D.leaving) return;
  D.leaving = true;
  G.avatar.apply(style()); // lo no pagado no se queda puesto
  D.root.remove();
  sfx('close');
}

// Postura sentada: muslos hacia delante y gemelos hacia abajo (sobre la animación de reposo).
const sideAxis = new THREE.Vector3();
function sitPose(av) {
  const an = av.analysis, g = av.group;
  g.updateMatrixWorld(true);
  // el eje lateral del modelo en el mundo: el de enlace pasado por la malla con piel
  let skin = null;
  g.traverse((o) => { if (!skin && o.isSkinnedMesh) skin = o; });
  sideAxis.copy(an.side).transformDirection(skin.matrixWorld);
  // se parte siempre de la postura sin doblar (no todos los huesos los mueve la animación)
  av.restQ ||= new Map();
  const bend = (name, ang) => {
    let bone = null;
    g.traverse((o) => { if (o.isBone && o.name === name) bone = o; });
    if (!bone) return;
    if (!av.restQ.has(bone)) av.restQ.set(bone, bone.quaternion.clone());
    else if (!/Thigh/.test(name)) bone.quaternion.copy(av.restQ.get(bone));
    bone.updateWorldMatrix(true, false);
    const parentQ = bone.parent.getWorldQuaternion(new THREE.Quaternion());
    const worldQ = bone.getWorldQuaternion(new THREE.Quaternion());
    tmpQ.setFromAxisAngle(sideAxis, ang).multiply(worldQ);
    bone.quaternion.copy(parentQ.invert().multiply(tmpQ));
    bone.updateWorldMatrix(false, true);
  };
  for (const s of ['L', 'R']) { bend(`Bip01_${s}_Thigh`, -1.45); bend(`Bip01_${s}_Calf`, 1.45); }
}

export function updateDressing(dt) {
  if (!D) return;
  const av = G.avatar;
  av.group.rotation.y = D.yaw;
  av.animate(dt, 0);
  av.group.position.y = 0;
  if (D.sitting) {
    sitPose(av);
    av.group.position.y = -0.36; // la pelvis baja al asiento
  }
  // cámara: el espejo (peluquería: la cara; probador: cuerpo entero)
  av.group.updateMatrixWorld(true);
  const f = new THREE.Vector3(Math.sin(D.yaw), 0, Math.cos(D.yaw));
  const target = new THREE.Vector3(D.spot.x, D.sitting ? 1.2 : 0.95, D.spot.z);
  const eye = target.clone().addScaledVector(f, D.sitting ? 0.95 : 2.6).add(new THREE.Vector3(0, D.sitting ? 0.06 : 0.15, 0));
  // el panel ocupa la derecha: el personaje se desplaza a la izquierda del encuadre
  const right = new THREE.Vector3(f.z, 0, -f.x);
  eye.addScaledVector(right, D.sitting ? 0.3 : 0.75); target.addScaledVector(right, D.sitting ? 0.3 : 0.75);
  tmpM.lookAt(eye, target, new THREE.Vector3(0, 1, 0));
  tmpQ.setFromRotationMatrix(tmpM);
  D.blend = D.leaving ? Math.max(0, D.blend - dt * 3) : Math.min(1, D.blend + dt * 2.5);
  const k = D.blend * D.blend * (3 - 2 * D.blend);
  G.camera.position.lerpVectors(camFrom, eye, k);
  G.camera.quaternion.slerpQuaternions(qFrom, tmpQ, k);
  if (D.leaving && D.blend <= 0) {
    // de pie otra vez: rodillas y caderas como estaban
    if (av.restQ) { for (const [b, q] of av.restQ) b.quaternion.copy(q); av.restQ = null; }
    av.group.visible = false;
    document.body.classList.remove('in-dress');
    D = null;
    G.uiOpen = false;
  }
}

function sheet(title, sub) {
  const s = h('div', 'dress-sheet');
  s.innerHTML = `<header><div><h2>${title}</h2><small>${sub}</small></div></header>`;
  const x = h('button', 'x', '✕');
  x.onclick = closeDressing;
  s.querySelector('header').appendChild(x);
  const body = h('div', 'dress-body'), foot = h('div', 'dress-foot');
  s.append(body, foot);
  D.root.appendChild(s);
  return { s, body, foot };
}

// ------------------------------------------------------------------
//  Peluquería
// ------------------------------------------------------------------
export function openBarber() {
  const sp = G.world.barber?.seat;
  if (!sp || !open('barber', sp, true)) return;
  const { body, foot } = sheet('Barbería Navaja', 'Elige y mírate en el espejo antes de pagar');
  const next = { ...D.preview, worn: style().worn };
  const render = () => {
    body.innerHTML = '';
    G.avatar.apply(next);
    body.appendChild(h('div', 'label', 'Color de pelo'));
    const grid = h('div', 'opt-grid');
    for (const [id, c] of Object.entries(HAIR_COLORS)) {
      const cur = style().hair === id;
      const b = h('button', 'opt' + (next.hair === id ? ' on' : ''), `${swatch(c.hex || '#' + G.avatar.analysis.hairRef.getHexString())}<b>${c.name}</b><small>${cur ? 'El tuyo' : c.price ? money(c.price) : id === 'orig' ? money(10) : ''}</small>`);
      b.onclick = () => { next.hair = id; sfx('click'); render(); };
      grid.appendChild(b);
    }
    body.appendChild(grid);
    if (canBeard()) {
      body.appendChild(h('div', 'label', 'Barba'));
      const g2 = h('div', 'opt-grid');
      for (const [id, c] of Object.entries(BEARDS)) {
        const cur = style().beard === id;
        const b = h('button', 'opt' + (next.beard === id ? ' on' : ''), `<b>${c.name}</b><small>${cur ? 'La tuya' : c.price ? money(c.price) : money(5)}</small>`);
        b.onclick = () => { next.beard = id; sfx('click'); render(); };
        g2.appendChild(b);
      }
      body.appendChild(g2);
    }
    body.appendChild(h('div', 'small muted', 'Cambiar de aspecto hace más difícil que la policía te reconozca tras un incidente. Tu cara y tu complexión no cambian.'));
    foot.innerHTML = '';
    const price = barberQuote(next);
    const total = h('div', 'total', price ? `Total <b class="money">${money(price)}</b>` : '<span class="muted">Sin cambios</span>');
    const out = h('button', 'btn ghost', 'Salir');
    out.onclick = closeDressing;
    const pay = h('button', 'btn' + (!price || price > G.state.money ? ' dim' : ''), price ? `Pagar ${money(price)}` : 'Pagar');
    pay.onclick = () => {
      const r = barberApply(next);
      if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); return; }
      sfx('cash');
      G.act.toast(`Listo. Has pagado ${money(r.price)}.`, '💈');
      render();
    };
    foot.append(total, out, pay);
  };
  render();
}

// ------------------------------------------------------------------
//  Tienda de ropa / probador
// ------------------------------------------------------------------
export function openClothes() {
  const sp = G.world.fitting;
  if (!sp || !open('clothes', sp, false)) return;
  const { body, foot } = sheet('Boutique Marea', 'Pruébatelo: arrastra a la izquierda para girarte');
  let slot = 'top', sel = null;
  const render = () => {
    const st = style();
    const preview = { ...st, worn: { ...st.worn } };
    if (sel) preview.worn[CLOTHES[sel].slot] = sel;
    G.avatar.apply(preview);
    body.innerHTML = '';
    const tabs = h('div', 'tabs');
    for (const [k, name] of Object.entries(SLOTS)) {
      const t = h('button', 'tab' + (k === slot ? ' on' : ''), name);
      t.onclick = () => { slot = k; sel = null; sfx('click'); render(); };
      tabs.appendChild(t);
    }
    body.appendChild(tabs);
    const list = h('div', 'opt-list');
    for (const [id, it] of Object.entries(CLOTHES)) {
      if (it.slot !== slot) continue;
      const worn = st.worn[slot] === id, mine = owns(id);
      const extra = [TAGS[it.tag], it.desc].filter(Boolean).join(' · ');
      const b = h('button', 'opt row' + (sel === id ? ' on' : ''), `${swatch(it.color)}<span><b>${it.name}</b><small>${extra}</small></span><em>${worn ? 'Puesta' : mine ? 'Tuya' : money(it.price)}</em>`);
      b.onclick = () => { sel = sel === id ? null : id; sfx('click'); render(); };
      list.appendChild(b);
    }
    body.appendChild(list);
    const wornHere = st.worn[slot];
    if (CLOTHES[wornHere] && !sel) body.appendChild(h('div', 'small muted', `Llevas: ${CLOTHES[wornHere].name}`));
    foot.innerHTML = '';
    const out = h('button', 'btn ghost', 'Salir');
    out.onclick = closeDressing;
    foot.appendChild(out);
    const act = (label, fn, ghost) => { const b = h('button', 'btn' + (ghost ? ' ghost' : ''), label); b.onclick = fn; foot.appendChild(b); };
    if (sel) {
      const it = CLOTHES[sel];
      if (!owns(sel)) {
        act(`Comprar ${money(it.price)}`, () => {
          const r = buyClothes(sel);
          if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); return; }
          sfx('cash');
          const e = equip(sel);
          G.act.toast(e.ok ? `${it.name}: comprada y puesta.` : `${it.name}: comprada. ${e.msg}`, '🛍️');
          sel = null; render();
        });
      } else if (st.worn[it.slot] !== sel) act('Ponérmela', () => { const r = equip(sel); if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); } else sfx('pop'); sel = null; render(); });
      else act('Quitármela', () => { const r = unequip(it.slot); if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); } else sfx('pop'); sel = null; render(); });
    } else if (wornHere) act('Quitármela', () => { const r = unequip(slot); if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); } else sfx('pop'); render(); }, true);
  };
  render();
}

// ------------------------------------------------------------------
//  Armario en la mochila (cambiarse en cualquier sitio, sin vista previa)
// ------------------------------------------------------------------
export function wardrobeSection(rerender) {
  const box = h('div', 'wardrobe');
  const st = style();
  const mine = (G.state.wardrobe?.owned || []).filter((id) => CLOTHES[id]);
  box.appendChild(h('div', 'label', 'Tu ropa'));
  if (!mine.length) { box.appendChild(h('div', 'small muted', 'Aún no tienes ropa. La Boutique Marea está en la avenida del Este.')); return box; }
  const list = h('div', 'opt-list');
  for (const id of mine) {
    const it = CLOTHES[id], worn = st.worn[it.slot] === id;
    const b = h('button', 'opt row' + (worn ? ' on' : ''), `${swatch(it.color)}<span><b>${it.name}</b><small>${SLOTS[it.slot]}</small></span><em>${worn ? 'Quitar' : 'Poner'}</em>`);
    b.onclick = () => { const r = worn ? unequip(it.slot) : equip(id); if (!r.ok) { sfx('error'); G.act.toast(r.msg, '⚠️'); } else sfx('pop'); rerender(); };
    list.appendChild(b);
  }
  box.appendChild(list);
  const r = recognition();
  if (r > 0) box.appendChild(h('div', 'small muted', `Parecido con el que busca la policía: ${Math.round(r * 100)}%`));
  return box;
}
