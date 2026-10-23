// Encargos del jefe de El Cartel. Uno a la vez, con plazo:
//   - entrega: te da fardos y tienes que dejarlos en un punto de la isla antes de la hora;
//   - producir: le traes X unidades envasadas de una variedad en un par de días;
//   - alijo: vas al puerto a por un alijo y se lo traes.
// Pagan en efectivo y dan respeto del cártel (desbloquea su tienda); si fallas, pierdes respeto.
import { G, money, pick } from '../game.js';
import { ITEMS, STRAINS, RESPECT } from '../data/items.js';
import { earn, product, cartelLevel, cartelXP, sendMsg, CONTACTS } from './economy.js';
import { inv, save, absNow } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { openPanel, closePanel, confirmDialog } from '../ui/panels.js';

CONTACTS.jefe = { name: 'El Jefe', icon: '💀', color: '#5a0f0f' };
const state = () => (G.state.cartel ||= { xp: 0, job: null, done: 0 });
const h = (tag, cls, html) => { const e = document.createElement(tag); if (cls) e.className = cls; if (html !== undefined) e.innerHTML = html; return e; };
const left = (until) => { const m = Math.max(0, Math.ceil(until - absNow())); return m >= 1440 ? `${Math.floor(m / 1440)} d ${Math.floor((m % 1440) / 60)} h` : `${Math.floor(m / 60)} h ${String(m % 60).padStart(2, '0')} min`; };
const near = (a, r) => { const p = G.player.pos; return Math.hypot(p.x - a.x, p.z - a.z) < r; };

// unidades envasadas que llevas de una variedad (sobres, tarros, bolsas)
function packedUnits(strain) {
  let n = 0;
  for (const s of G.state.inv) if (s && ITEMS[s.id]?.packed && product(s.p)?.strain === strain) n += s.q * (ITEMS[s.id].units || 1);
  return n;
}
// (primero lo que encaja justo, de lo más grande a lo más pequeño; si no cuadra, lo que falte)
function takePacked(strain, units) {
  const idx = G.state.inv.map((s, i) => i).filter((i) => { const s = G.state.inv[i]; return s && ITEMS[s.id]?.packed && product(s.p)?.strain === strain; })
    .sort((a, b) => (ITEMS[G.state.inv[b].id].units || 1) - (ITEMS[G.state.inv[a].id].units || 1));
  for (const round of [Math.floor, Math.ceil]) for (const i of idx) {
    const s = G.state.inv[i];
    if (!s || units <= 0) continue;
    const u = ITEMS[s.id].units || 1, q = Math.min(s.q, round(units / u));
    s.q -= q; units -= q * u;
    if (s.q <= 0) G.state.inv[i] = null;
  }
}

// sitios para las entregas (lejos del cártel) y para el alijo (en la costa)
function farSpot() {
  const C = G.world.pois.cartel || { x: 0, z: 0 };
  const list = [...(G.world.spots || []), ...(G.world.drops || [])].filter((s) => Math.hypot(s.x - C.x, s.z - C.z) > 90);
  return list.length ? pick(list) : null;
}
function coastSpot() {
  const lab = (G.world.mapLabels || []).filter((l) => /puerto|muelle|playa|faro/i.test(l.t || ''));
  const l = lab.length ? pick(lab) : null;
  return l ? { x: l.x, z: l.z, name: l.t } : farSpot();
}

// Tres encargos para elegir (cambian cada día y con cada encargo hecho)
export function offers() {
  const s = state(), lv = cartelLevel(), r = G.state.rank || 0;
  const strains = Object.entries(STRAINS).filter(([, st]) => !st.noSeed && st.rank <= Math.max(r, 2) && (!st.cartel || lv >= 1));
  const [sid, st] = strains[(G.state.day + s.done) % strains.length];
  const units = 12 + lv * 8;
  const q = 4 + lv * 2;
  const spot = farSpot(), coast = coastSpot();
  const out = [];
  if (spot) out.push({ kind: 'entrega', title: 'Entrega grande', icon: '🚚', text: `Lleva ${q} fardos al ${spot.name || 'punto de entrega'} antes de 4 horas. Que no te pare la pasma.`, q, to: { x: spot.x, z: spot.z, name: spot.name || 'Punto de entrega' }, mins: 240, pay: 600 + q * 140, xp: 40 });
  out.push({ kind: 'producir', title: 'Producción', icon: '🌿', text: `Tráeme ${units} unidades envasadas de ${st.name} en 2 días.`, strain: sid, units, mins: 2 * 1440, pay: Math.round(units * st.base * 1.35), xp: 60 });
  if (coast) out.push({ kind: 'alijo', title: 'Recoger un alijo', icon: '⚓', text: `Ha llegado un alijo a ${coast.name || 'la costa'}. Recógelo y tráemelo antes de 3 horas.`, to: { x: coast.x, z: coast.z, name: coast.name || 'La costa' }, mins: 180, pay: 900 + lv * 300, xp: 50 });
  return out;
}

function accept(o) {
  const s = state();
  if (s.job) return;
  if (o.kind === 'entrega') {
    if (inv.room('fardo') < o.q) { sfx('error'); return G.act.toast(`Necesitas ${o.q} huecos libres para los fardos.`, '🎒'); }
    inv.add('fardo', o.q);
  }
  s.job = { ...o, until: absNow() + o.mins, got: false };
  if (o.to) G.act.setWaypoint?.(o.to.x, o.to.z, o.to.name);
  sfx('click');
  sendMsg('jefe', o.kind === 'producir' ? `Te espero con la mercancía. No me falles.` : `Ya sabes a dónde ir. No me hagas esperar.`);
  save();
  closePanel();
}

function finish(ok, why) {
  const s = state(), j = s.job;
  if (!j) return;
  s.job = null;
  G.act.clearWaypoint?.();
  if (ok) {
    earn('dirty', j.pay, 'encargo del cártel', { key: `cartel:${j.until}` });
    const before = cartelLevel();
    s.xp += j.xp; s.done++;
    sfx('level');
    G.act.bigToast?.('Encargo cumplido', `+${money(j.pay)} · +${j.xp} de respeto del cártel`);
    if (cartelLevel() > before) setTimeout(() => G.act.bigToast?.('El cártel te respeta más', `Ahora eres «${RESPECT[cartelLevel()].name}». Hay material nuevo en su tienda.`), 2500);
    sendMsg('jefe', pick(['Buen trabajo. Así me gusta.', 'Limpio. Sigue así y llegarás lejos.', 'El dinero ya está en tu bolsillo. Vuelve mañana.']));
  } else {
    // lo que llevabas del cártel se pierde, y el respeto baja
    const nf = inv.count('fardo'); if (nf) inv.remove('fardo', nf);
    const na = inv.count('alijo'); if (na) inv.remove('alijo', na);
    s.xp = Math.max(0, s.xp - 20);
    sfx('error');
    G.act.toast?.(why || 'Has fallado el encargo. El jefe no está contento.', '💀');
    sendMsg('jefe', pick(['Me has fallado. No vuelva a pasar.', 'Tiempo es dinero, y me has hecho perder los dos.']));
  }
  save();
}

// Se llama cada poco: llegar al punto, recoger el alijo, plazos
let t = 0;
export function tickCartel(dt) {
  if ((t -= dt) > 0) return;
  t = 0.5;
  const j = G.state?.cartel?.job;
  if (!j || G.sleeping) return;
  if (absNow() > j.until) return finish(false, 'Se acabó el plazo del encargo del cártel. Pierdes respeto.');
  if (j.kind === 'entrega' && near(j.to, 4)) {
    if (inv.count('fardo') < j.q) return finish(false, 'Has perdido fardos por el camino. El encargo ha fallado.');
    inv.remove('fardo', j.q);
    return finish(true);
  }
  if (j.kind === 'alijo' && !j.got && near(j.to, 6)) {
    if (inv.room('alijo') < 1) { if (!j.warned) { j.warned = true; G.act.toast?.('No te cabe el alijo: haz hueco en la mochila.', '🎒'); } return; }
    inv.add('alijo', 1);
    j.got = true;
    sfx('pop');
    G.act.toast?.('Tienes el alijo. Llévaselo al jefe a El Cartel.', '⚓');
    const c = G.world.pois.cartel; if (c) G.act.setWaypoint?.(c.x, c.z, 'El Cartel');
    save();
  }
}

// El despacho: respeto, el encargo en curso o los que ofrece
export function openBoss() {
  const s = state(), lv = cartelLevel();
  const p = openPanel({ title: 'El Jefe', cls: 't-cartel' });
  const next = RESPECT[lv + 1];
  const pct = next ? Math.min(1, (cartelXP() - RESPECT[lv].xp) / (next.xp - RESPECT[lv].xp)) : 1;
  p.body.appendChild(h('div', 'boss-rep', `<div class="rowsp"><b>Respeto: ${RESPECT[lv].name}</b><small>${next ? `${cartelXP()} / ${next.xp}` : 'Máximo'}</small></div><div class="bar"><i style="width:${Math.round(pct * 100)}%"></i></div>${next ? `<small class="muted">Con «${next.name}» se desbloquea más material en la tienda.</small>` : ''}`));
  const j = s.job;
  if (j) {
    const card = h('div', 'boss-job on', `<div class="rowsp"><b>${j.icon} ${j.title}</b><small>⏱ ${left(j.until)}</small></div><div class="muted">${j.text}</div><div class="rowsp"><span>Pago</span><b class="money">${money(j.pay)}</b></div>`);
    const row = h('div', 'row end');
    const canGive = (j.kind === 'producir' && packedUnits(j.strain) >= j.units) || (j.kind === 'alijo' && j.got && inv.count('alijo') > 0);
    if (j.kind === 'producir') card.appendChild(h('div', 'small', `Llevas ${packedUnits(j.strain)} de ${j.units} unidades de ${STRAINS[j.strain].name}.`));
    if (j.kind === 'producir' || j.kind === 'alijo') {
      const give = h('button', 'btn' + (canGive ? '' : ' dim'), 'Entregar');
      give.onclick = () => {
        if (!canGive) { sfx('error'); return G.act.toast(j.kind === 'alijo' ? 'Primero recoge el alijo en la costa.' : 'Aún no tienes todo lo que te pidió.', '💀'); }
        if (j.kind === 'producir') takePacked(j.strain, j.units); else inv.remove('alijo', 1);
        closePanel(); finish(true);
      };
      row.appendChild(give);
    }
    const quit = h('button', 'btn ghost', 'Abandonar');
    quit.onclick = () => confirmDialog('Abandonar el encargo', '<p>El jefe no perdona: perderás respeto y lo que te dio.</p>', 'Abandonar', () => finish(false, 'Has abandonado el encargo. Pierdes respeto.'));
    row.appendChild(quit);
    card.appendChild(row);
    p.body.appendChild(card);
    return;
  }
  p.body.appendChild(h('div', 'shop-hello', `El jefe: <b>«${pick(['Tengo trabajo para alguien con agallas.', 'Elige. Y no me hagas perder el tiempo.', 'Si cumples, pago bien. Si no, ya sabes.'])}»</b>`));
  for (const o of offers()) {
    const card = h('div', 'boss-job', `<div class="rowsp"><b>${o.icon} ${o.title}</b><small>⏱ ${left(absNow() + o.mins)}</small></div><div class="muted">${o.text}</div><div class="rowsp"><span>Pago <b class="money">${money(o.pay)}</b></span><span>+${o.xp} respeto</span></div>`);
    const b = h('button', 'btn sm', 'Aceptar');
    b.onclick = () => accept(o);
    const row = h('div', 'row end'); row.appendChild(b); card.appendChild(row);
    p.body.appendChild(card);
  }
}
