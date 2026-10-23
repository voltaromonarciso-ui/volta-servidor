import { G } from '../game.js';
import { ITEMS, STRAINS, FORMS, LAB } from '../data/items.js';
import { CANDIDATES, ROLES, STAFF, PACK_MODES } from '../data/staff.js';
import { absNow, save, slotsAdd, slotsRemove, slotsRoom, slotsCount } from '../core/state.js';
import { spend, ensureBaseProduct, sendMsg, CONTACTS } from './economy.js';
import { RECIPE, COOK_MIN, COOK_OUT, COOK_PRO, LAB_TYPES, harvestYield, emptyPot, refreshPot } from './objects.js';
import { rememberIncident } from './appearance.js';
import { rackStore } from '../world/racks.js';

// Empleados. Reglas:
// - Trabajan solo con lo que hay en SU propiedad: estanterías/armarios (de ahí cogen y ahí
//   dejan), macetas, mesas, envasadora y hornillo colocados dentro de ella.
// - El trabajo avanza con el reloj del juego (jugando, durmiendo o en comisaría), nunca con
//   la partida cerrada: el reloj tampoco avanza entonces.
// - Cada tarea dura unos minutos de juego; materiales y hueco se comprueban OTRA VEZ al
//   terminarla y se consume y produce de golpe (si falta algo, no se produce nada).
//   El hornillo es la excepción porque ya funcionaba así: los ingredientes se gastan al
//   poner la tanda, y la tanda queda guardada en el hornillo (no se pierde ni se duplica).
// - Nómina: cada mañana a las 7:00 se paga el día (sueldo + lo que se deba). Si no llega el
//   dinero no se cobra nada: el empleado deja de trabajar y apunta la deuda; a los 2 días
//   sin cobrar se va (y si es poco leal puede dar tu descripción a la policía).

const byId = Object.fromEntries(CANDIDATES.map((c) => [c.id, c]));
export const candidate = (id) => byId[id];
for (const c of CANDIDATES) CONTACTS['staff_' + c.id] = { name: `${c.name} (${ROLES[c.role].name.toLowerCase()})`, icon: ROLES[c.role].icon, color: '#8e6e53' };

export const STATUS = {
  trabajando: 'Trabajando',
  descanso: 'Fuera de horario',
  material: 'Esperando materiales',
  espacio: 'Esperando espacio',
  sin_tarea: 'Sin tarea',
  sin_pago: 'Sin cobrar',
  sin_propiedad: 'Sin propiedad válida',
};

const staff = () => (G.state.employees ||= []);
export const employees = () => staff();
const minuteOfDay = (t) => ((t % 1440) + 1440) % 1440;
const dayOf = (t) => Math.floor(t / 1440) + 1;

// ------------------------------------------------------------------
//  Lugar de trabajo
// ------------------------------------------------------------------
export function ownedProps() {
  return Object.keys(G.world.props).filter((id) => G.state.props[id]);
}
const objsIn = (prop, type) => [...G.objects.values()]
  .filter((o) => (!type || (Array.isArray(type) ? type.includes(o.entry.type) : o.entry.type === type)) && G.world.inProperty(o.entry.x, o.entry.z) === prop)
  .sort((a, b) => a.entry.uid - b.entry.uid);

// Todas las estanterías y armarios de la propiedad como un solo almacén.
export function storeOf(prop) {
  const lists = objsIn(prop, ['shelf', 'locker']).map((o) => o.entry.data.slots);
  if (G.world.props[prop]?.warehouse && G.state.props[prop]) lists.push(rackStore(prop).entry.data.slots); // las estanterías del fondo
  return {
    n: lists.length,
    count: (id, p) => lists.reduce((a, s) => a + slotsCount(s, id, p), 0),
    room: (id, p) => lists.reduce((a, s) => a + slotsRoom(s, id, p), 0),
    // reparte entre estanterías; solo se llama después de comprobar room()
    add: (id, q, p) => { for (const s of lists) { q = slotsAdd(s, id, q, p); if (q <= 0) break; } return q; },
    remove: (id, q, p) => {
      if (lists.reduce((a, s) => a + slotsCount(s, id, p), 0) < q) return false;
      for (const s of lists) { const have = slotsCount(s, id, p); const n = Math.min(have, q); if (n) { slotsRemove(s, id, n, p); q -= n; } if (q <= 0) break; }
      return true;
    },
    // productos (p) de un id con al menos `per` unidades
    stacks: (id, per) => {
      const tot = {};
      for (const s of lists) for (const x of s) if (x && x.id === id) tot[x.p || ''] = (tot[x.p || ''] || 0) + x.q;
      return Object.entries(tot).filter(([, q]) => q >= per).map(([p]) => p || undefined);
    },
  };
}

// ------------------------------------------------------------------
//  Contratar, despedir, asignar, pagar deudas
// ------------------------------------------------------------------
export const hired = (cid) => staff().find((e) => e.cid === cid);
const inProp = (prop) => staff().filter((e) => e.prop === prop);
// Tope de empleados por sitio: en los almacenes, según el tamaño (Delta 2, Bravo 4, Alfa 6)
export const capOf = (prop) => { const p = G.world.props[prop]; return p?.warehouse ? STAFF.perWarehouse[p.level] ?? STAFF.maxPerProperty : STAFF.maxPerProperty; };

export function hire(cid, prop) {
  const c = byId[cid];
  if (!c) return { ok: false, msg: 'Esa persona no existe.' };
  if (hired(cid)) return { ok: false, msg: `${c.name} ya trabaja para ti.` };
  if ((c.rank || 0) > G.state.rank) return { ok: false, msg: 'Aún no confía en ti (sube de rango).' };
  if (staff().length >= maxStaff()) return { ok: false, msg: maxStaff() ? `Con tu rango puedes tener ${maxStaff()} empleado${maxStaff() > 1 ? 's' : ''} como mucho.` : 'Todavía nadie quiere trabajar para un novato: sube de rango.' };
  if (!G.state.props[prop] || !G.world.props[prop]) return { ok: false, msg: 'Esa propiedad no es tuya.' };
  if (inProp(prop).length >= capOf(prop)) return { ok: false, msg: `Ya hay ${capOf(prop)} empleados en esa propiedad.` };
  const r = spend('dirty', c.hire, `contratación: ${c.name}`);
  if (!r.ok) return { ok: false, msg: r.msg };
  const now = absNow();
  staff().push({ uid: G.state.nextUid++, cid, role: c.role, prop, hiredAt: now, paidDay: G.state.day, owed: 0, debt: 0, status: 'sin_tarea', reason: '', clock: now, task: null, mode: 'auto', made: 0 });
  save();
  return { ok: true };
}

export function fire(uid) {
  const e = staff().find((x) => x.uid === uid);
  if (!e) return { ok: false, msg: 'No trabaja para ti.' };
  leave(e, 'fired');
  return { ok: true };
}

// Salida del negocio (despido o abandono). La tarea en curso se anula sin producir nada.
function leave(e, why) {
  const c = byId[e.cid];
  G.state.employees = staff().filter((x) => x !== e);
  e.task = null;
  if (why === 'quit') sendMsg('staff_' + c.id, `Llevo ${e.owed} días sin cobrar. Me largo.`);
  // quien se va con deudas pendientes puede ir con el cuento a la policía
  // (en un almacén, apartado en el polígono, se va de la lengua la mitad de veces)
  if (e.owed > 0 && Math.random() < STAFF.leakChance(c.loyalty) * (G.world.props[e.prop]?.warehouse ? 0.5 : 1)) {
    rememberIncident();
    G.act.toast?.(`${c.name} se ha ido resentido y ha dado tu descripción a la policía. Cámbiate de ropa o de pelo.`, '🚨');
    sendMsg('leo', `Primo, ${c.name} anda diciendo por ahí cómo eres. La pasma ya tiene tu descripción: cámbiate de look.`);
  }
  hideWorker(e);
  save();
}

export function assign(uid, prop) {
  const e = staff().find((x) => x.uid === uid);
  if (!e) return { ok: false, msg: 'No trabaja para ti.' };
  if (!G.state.props[prop] || !G.world.props[prop]) return { ok: false, msg: 'Esa propiedad no es tuya.' };
  if (e.prop !== prop && inProp(prop).length >= capOf(prop)) return { ok: false, msg: `Ya hay ${capOf(prop)} empleados en esa propiedad.` };
  e.prop = prop;
  e.task = null;
  e.clock = Math.max(e.clock, absNow());
  save();
  return { ok: true };
}

export function setMode(uid, mode) {
  const e = staff().find((x) => x.uid === uid);
  if (e && e.role === 'envasado' && PACK_MODES[mode]) { e.mode = mode; e.task = null; save(); }
}

// Pagar la deuda a mano (desde el móvil): todo o nada.
export function payDebt(uid) {
  const e = staff().find((x) => x.uid === uid);
  if (!e || !e.debt) return { ok: false, msg: 'No le debes nada.' };
  const r = spend('dirty', e.debt, `deuda: ${byId[e.cid].name}`);
  if (!r.ok) return { ok: false, msg: r.msg };
  e.debt = 0; e.owed = 0;
  e.clock = Math.max(e.clock, absNow());
  save();
  return { ok: true };
}

export const maxStaff = () => STAFF.maxByRank[Math.min(G.state.rank, STAFF.maxByRank.length - 1)] || 0;
export const dailyCost = () => staff().reduce((a, e) => a + byId[e.cid].wage, 0);
export const totalDebt = () => staff().reduce((a, e) => a + (e.debt || 0), 0);
export function nextPayday() {
  const s = G.state;
  return s.minute < STAFF.payHour * 60 ? { day: s.day, hour: STAFF.payHour } : { day: s.day + 1, hour: STAFF.payHour };
}

// ------------------------------------------------------------------
//  Nómina diaria (7:00). paidDay = último día de juego ya liquidado (pagado o apuntado como deuda).
// ------------------------------------------------------------------
function payroll() {
  const s = G.state;
  const dueDay = s.minute >= STAFF.payHour * 60 ? s.day : s.day - 1;
  let changed = false;
  for (const e of [...staff()]) {
    const c = byId[e.cid];
    while (e.paidDay < dueDay) {
      e.paidDay++;
      changed = true;
      const bill = c.wage + (e.debt || 0);
      // todo o nada, solo con efectivo (el dinero limpio nunca paga nóminas)
      if (spend('dirty', bill, `nómina: ${c.name}`, { key: `wage:${e.uid}:${e.paidDay}` }).ok) {
        e.debt = 0; e.owed = 0;
      } else {
        e.debt = (e.debt || 0) + c.wage;
        e.owed = (e.owed || 0) + 1;
        if (e.owed >= STAFF.quitAfterDays) { leave(e, 'quit'); break; }
        sendMsg('staff_' + c.id, `Hoy no he cobrado (${c.wage} $). Hasta que me pagues no trabajo. Me debes ${e.debt} $.`);
        G.act.toast?.(`No te llega para pagar a ${c.name}: deja de trabajar hasta que le pagues.`, '💸');
      }
    }
  }
  if (changed) save();
}

// ------------------------------------------------------------------
//  Elegir y terminar tareas
// ------------------------------------------------------------------
const busyTargets = (self) => new Set(staff().filter((x) => x !== self && x.task).map((x) => x.task.target));

function planCultivo(e, store, busy) {
  const pots = objsIn(e.prop, 'pot').filter((o) => !busy.has(o.entry.uid) && o.entry.data.strain);
  if (!pots.length) return { wait: 'sin_tarea', reason: 'No hay plantas en las macetas.' };
  const ready = pots.find((o) => o.entry.data.growth >= 1);
  if (ready) {
    if (!store.n) return { wait: 'espacio', reason: 'No hay estanterías ni armarios donde dejar la cosecha.' };
    // como mucho cabe lo que dé la cosecha más grande posible
    if (store.room('cogollo', ready.entry.data.strain) < 1) return { wait: 'espacio', reason: 'Las estanterías están llenas.' };
    return { kind: 'harvest', target: ready.entry.uid, dur: STAFF.minutes.harvest };
  }
  const dry = pots.find((o) => o.entry.data.growth < 1 && o.entry.data.water < STAFF.regar);
  if (dry) return { kind: 'water', target: dry.entry.uid, dur: STAFF.minutes.water };
  return { wait: 'sin_tarea', reason: 'Las plantas están regadas y creciendo.' };
}

function packOptions(e) {
  const want = (PACK_MODES[e.mode] || PACK_MODES.auto).forms;
  return want.map((id) => FORMS.find((f) => f.id === id)).filter(Boolean);
}
const stationName = (at) => ({ packer: 'mesa de empaquetado', jarpacker: 'envasadora de tarros' }[at] || LAB[at]?.name.toLowerCase() || at);
// Cada forma se envasa en su mesa o en la empacadora avanzada (esta hace varios envases seguidos)
function planEnvasado(e, store, busy) {
  if (!store.n) return { wait: 'material', reason: 'No hay estanterías ni armarios con material.' };
  // (si hay producto pero faltan envases, se avisa de eso antes que de lo que no hay)
  let missing = null, missPack = null, full = null, noStation = null;
  for (const F of packOptions(e)) {
    const st = objsIn(e.prop, [F.at, 'autopack']).find((o) => !busy.has(o.entry.uid));
    if (!st) { noStation ||= `No hay ${stationName(F.at)} ni empacadora libre.`; continue; }
    const p = store.stacks(F.src, F.per)[0];
    if (p === undefined && !store.count(F.src)) { missing ||= `Faltan ${ITEMS[F.src].name.toLowerCase()} en las estanterías.`; continue; }
    if (p === undefined) { missing ||= `Hacen falta ${F.per} ${ITEMS[F.src].name.toLowerCase()} del mismo tipo.`; continue; }
    if (store.count(F.pack) < 1) { missPack ||= `Faltan ${ITEMS[F.pack].name.toLowerCase()} en las estanterías.`; continue; }
    if (store.room(F.id, p) < 1) { full ||= 'Las estanterías están llenas.'; continue; }
    const auto = st.entry.type === 'autopack';
    const n = auto ? Math.max(1, Math.min(STAFF.autopackBatch, Math.floor(store.count(F.src, p) / F.per), store.count(F.pack), store.room(F.id, p))) : 1;
    const base = STAFF.minutes[F.id] || 15;
    return { kind: F.id, target: st.entry.uid, p, n, dur: Math.round(base * (auto ? 1 + 0.25 * (n - 1) : 1)) };
  }
  if (full) return { wait: 'espacio', reason: full };
  if (missPack || missing) return { wait: 'material', reason: missPack || missing };
  return { wait: 'sin_tarea', reason: noStation || 'Nada que envasar.' };
}

// Lo que mete y lo que saca cada sitio de cocina: el hornillo o una mesa del cártel
const cookOf = (o) => {
  if (o.entry.type === 'stove') { const pro = o.entry.data.pro; return { make: RECIPE, out: 'cristal', strain: 'shards', n: pro ? COOK_PRO.out : COOK_OUT, min: pro ? COOK_PRO.min : COOK_MIN, name: 'el hornillo' }; }
  const L = LAB[o.entry.type];
  return { ...L, name: L.name.toLowerCase() };
};
function planCocina(e, store, busy, t) {
  const stoves = objsIn(e.prop, ['stove', ...LAB_TYPES]).filter((o) => !busy.has(o.entry.uid));
  if (!stoves.length) return { wait: 'sin_tarea', reason: 'No hay hornillo ni mesa del cártel libre en la propiedad.' };
  const done = stoves.find((o) => o.entry.data.batch && o.entry.data.batch.ready <= t);
  if (done) {
    const C = cookOf(done);
    if (store.room(C.out, ensureBaseProduct(C.strain)) < done.entry.data.batch.n) return { wait: 'espacio', reason: `No cabe lo de ${C.name} en las estanterías.` };
    return { kind: 'cookCollect', target: done.entry.uid, dur: STAFF.minutes.cookCollect };
  }
  let missing = null;
  for (const o of stoves.filter((x) => !x.entry.data.batch)) {
    const C = cookOf(o);
    const miss = Object.entries(C.make).filter(([k, n]) => store.count(k) < n);
    if (miss.length) { missing ||= `Faltan para ${C.name}: ${miss.map(([k, n]) => `${n}× ${ITEMS[k].name.toLowerCase()}`).join(', ')}.`; continue; }
    return { kind: 'cookStart', target: o.entry.uid, dur: STAFF.minutes.cookStart };
  }
  // con alguna tanda en marcha está trabajando (aunque al resto le falten ingredientes)
  const running = stoves.filter((o) => o.entry.data.batch);
  if (!running.length) return { wait: 'material', reason: missing };
  const soon = Math.min(...running.map((o) => o.entry.data.batch.ready));
  return { wait: 'trabajando', reason: `Tanda en marcha hasta las ${hhmm(soon)}.${missing ? ' ' + missing : ''}`, until: soon };
}

const hhmm = (t) => { const m = minuteOfDay(t); return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`; };

// Termina una tarea: vuelve a comprobarlo todo y, si cuadra, consume y produce de una vez.
// Devuelve las unidades producidas (0 si no produce nada nuevo) o false si se anula.
function complete(e, task) {
  const o = G.objects.get(task.target);
  const store = storeOf(e.prop);
  const okObj = o && G.world.inProperty(o.entry.x, o.entry.z) === e.prop;
  if (!okObj) return false;
  const d = o.entry.data;
  switch (task.kind) {
    case 'water':
      if (!d.strain || d.growth >= 1) return false;
      d.water = 1; refreshPot(o); return 0;
    case 'harvest': {
      if (!d.strain || d.growth < 1) return false;
      const n = harvestYield(o), leaf = STRAINS[d.strain]?.leaf, item = leaf ? 'hoja' : 'cogollo', pid = leaf ? undefined : ensureBaseProduct(d.strain);
      if (store.room(item, pid) < n) { e.status = 'espacio'; e.reason = `No caben ${n} ${leaf ? 'hojas' : 'cogollos'} en las estanterías.`; return false; }
      store.add(item, n, pid);
      emptyPot(o);
      return n;
    }
    case 'cookStart': {
      if (!(o.entry.type === 'stove' || LAB_TYPES.includes(o.entry.type)) || d.batch) return false;
      const C = cookOf(o);
      if (Object.entries(C.make).some(([k, n]) => store.count(k) < n)) return false;
      for (const [k, n] of Object.entries(C.make)) store.remove(k, n);
      d.batch = { ready: task.until + C.min, n: C.n };
      return 0;
    }
    case 'cookCollect': {
      const b = d.batch;
      if (!b || b.ready > task.until) return false;
      const C = cookOf(o), pid = ensureBaseProduct(C.strain);
      if (store.room(C.out, pid) < b.n) return false;
      store.add(C.out, b.n, pid);
      d.batch = null;
      return b.n;
    }
    default: {
      // envasar: en su mesa o en la empacadora; produce lo que siga cuadrando al terminar
      const F = FORMS.find((f) => f.id === task.kind);
      if (!F || (o.entry.type !== F.at && o.entry.type !== 'autopack')) return false;
      let made = 0;
      for (let k = 0; k < (task.n || 1); k++) {
        if (store.count(F.src, task.p) < F.per || store.count(F.pack) < 1 || store.room(F.id, task.p) < 1) break;
        store.remove(F.src, F.per, task.p);
        store.remove(F.pack, 1);
        store.add(F.id, 1, task.p);
        made++;
      }
      return made || false;
    }
  }
  return false;
}

// Simula a un empleado hasta el instante `now` (minutos absolutos de juego).
function simulate(e, now) {
  for (let guard = 0; guard < 400 && e.clock < now; guard++) {
    if (!G.state.props[e.prop] || !G.world.props[e.prop]) { e.task = null; e.status = 'sin_propiedad'; e.reason = 'La propiedad ya no es tuya: asígnale otra.'; e.clock = now; return; }
    if (e.owed > 0) { e.task = null; e.status = 'sin_pago'; e.reason = `Le debes ${e.debt} $.`; e.clock = now; return; }
    if (e.task) {
      if (e.task.until > now) return;          // sigue con ello
      const t = e.task;
      e.task = null;
      e.clock = t.until;
      const n = complete(e, t);
      if (n !== false) { e.made = (e.made || 0) + n; e.status = 'trabajando'; }
      continue;
    }
    // esperando: no se vuelve a mirar hasta la hora prevista (o hasta que algo cambie)
    if (e.wake) { if (e.wake > now) return; e.clock = Math.max(e.clock, e.wake); e.wake = null; }
    const m = minuteOfDay(e.clock);
    if (m < STAFF.workFrom * 60 || m >= STAFF.workTo * 60) {
      e.status = 'descanso'; e.reason = `Trabaja de ${STAFF.workFrom}:00 a ${STAFF.workTo}:00.`;
      const next = (m < STAFF.workFrom * 60 ? e.clock - m : e.clock - m + 1440) + STAFF.workFrom * 60;
      e.clock = Math.min(now, next);
      continue;
    }
    const store = storeOf(e.prop), busy = busyTargets(e);
    const plan = e.role === 'cultivo' ? planCultivo(e, store, busy) : e.role === 'envasado' ? planEnvasado(e, store, busy) : planCocina(e, store, busy, e.clock);
    if (plan.wait) {
      e.status = plan.wait; e.reason = plan.reason;
      const dayEnd = e.clock - m + STAFF.workTo * 60;
      const wake = Math.min(plan.until ?? dayEnd, dayEnd, e.clock + STAFF.minutes.idle);
      if (wake > now) { e.wake = wake; e.clock = now; return; }
      e.clock = wake;
      continue;
    }
    e.task = { kind: plan.kind, target: plan.target, p: plan.p, n: plan.n, start: e.clock, until: e.clock + plan.dur };
    e.status = 'trabajando'; e.reason = taskText(plan.kind);
  }
}

const taskText = (k) => ({ water: 'Regando', harvest: 'Cosechando', bolsa: 'Envasando sobres', shards: 'Envasando Sweet Shards', tarro: 'Llenando tarros', tarro_cr: 'Llenando tarros de cristales', sobre_polvo: 'Envasando sobres de polvo', vial: 'Llenando viales', blister: 'Llenando blísters', frasco: 'Llenando frascos', gotero: 'Llenando goteros', cookStart: 'Preparando una tanda', cookCollect: 'Sacando la tanda' }[k] || '');

// Algo ha cambiado (estanterías, objetos): que vuelvan a mirar ya.
export function pokeStaff() { for (const e of G.state?.employees || []) e.wake = null; }

// Llamado cada vez que avanza el reloj (jugando o a saltos).
export function tickStaff() {
  if (!G.state?.employees?.length) return;
  payroll();
  const now = absNow();
  for (const e of [...staff()]) simulate(e, now);
}

// Al cargar: quitar duplicados y entradas rotas sin tocar el inventario.
export function validateStaff() {
  const seen = new Set();
  const now = absNow();
  G.state.employees = (G.state.employees || []).filter((e) => e && byId[e.cid] && !seen.has(e.cid) && seen.add(e.cid));
  for (const e of G.state.employees) {
    e.role = byId[e.cid].role;
    e.owed ||= 0; e.debt ||= 0; e.made ||= 0; if (!PACK_MODES[e.mode]) e.mode = 'auto';
    if (!Number.isFinite(e.paidDay)) e.paidDay = G.state.day;
    if (!Number.isFinite(e.clock) || e.clock > now) e.clock = now;
    if (e.task && (!G.objects.has(e.task.target) || !Number.isFinite(e.task.until))) e.task = null;
    if (!G.state.props[e.prop] || !G.world.props[e.prop]) { e.status = 'sin_propiedad'; e.reason = 'La propiedad ya no es tuya: asígnale otra.'; }
  }
}

export function statusText(e) {
  return STATUS[e.status] || e.status;
}

// ------------------------------------------------------------------
//  Trabajadores visibles en tu propiedad (solo se animan si estás cerca)
// ------------------------------------------------------------------
const bodies = new Map();
let makeBody = null;
export function setWorkerFactory(fn) { makeBody = fn; }
function hideWorker(e) { const b = bodies.get(e.uid); if (b) { b.group.removeFromParent(); bodies.delete(e.uid); } }
export function clearWorkers() { for (const b of bodies.values()) b.group.removeFromParent(); bodies.clear(); }

export function updateWorkers(dt) {
  if (!makeBody) return;
  const p = G.player.pos;
  for (const e of staff()) {
    const prop = G.world.props[e.prop];
    if (!prop || !G.state.props[e.prop]) { hideWorker(e); continue; }
    let b = bodies.get(e.uid);
    if (!b) { b = makeBody(e.cid); if (!b) continue; bodies.set(e.uid, b); G.scene.add(b.group); }
    // junto a lo que está usando, o cerca de la entrada si no tiene tarea
    const o = e.task && G.objects.get(e.task.target);
    let x, z, yaw;
    if (o) { const r = o.entry.r || 0; x = o.entry.x + Math.sin(r) * 0.95; z = o.entry.z + Math.cos(r) * 0.95; yaw = r + Math.PI; }
    else { const i = staff().filter((x) => x.prop === e.prop).indexOf(e); x = prop.spawn.x + 1.4 + i * 0.9; z = prop.spawn.z - 1.2; yaw = 0; } // mirando a la entrada
    b.group.position.set(x, G.world.groundAt(x, z), z);
    b.group.rotation.y = yaw;
    const near = (x - p.x) ** 2 + (z - p.z) ** 2 < 900;
    b.group.visible = near;
    if (near) { b.pose = e.status === 'trabajando' && e.task ? 'give' : null; b.loopGive = true; b.animate(dt, 0); }
  }
  for (const uid of [...bodies.keys()]) if (!staff().some((e) => e.uid === uid)) { bodies.get(uid).group.removeFromParent(); bodies.delete(uid); }
}

export { ROLES, CANDIDATES, STAFF, PACK_MODES };
