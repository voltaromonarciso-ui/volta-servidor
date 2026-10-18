// Bandas rivales: «Los Cuervos» atracan de vez en cuando a quien va de noche por la calle
// con efectivo encima. Pensado para que sea justo:
// - como mucho un intento cada 2 días de juego, nunca en los 2 primeros días ni de día;
// - no aparecen de golpe: salen a ~30 m, fuera de la vista, y se acercan andando; un
//   aviso dice que vienen y se puede huir (alejarse, meterse en una propiedad, subirse a
//   la bici o el patinete, o ir hacia la policía, que les hace desistir);
// - si te alcanzan, decides: pagar, defenderte con lo de la armería o intentar escapar;
// - lo que se llevan sale del efectivo con la clave rob:<id>, así que no se cobra dos veces.
import { G, rand, pick, clamp, money } from '../game.js';
import { Walker } from '../entities/npc.js';
import { modelNames } from '../entities/models.js';
import { absNow, inv, illegalCount, save } from '../core/state.js';
import { spend, addRep } from './economy.js';
import { wanted } from './police.js';
import { sfx } from '../core/audio.js';

export const GANG = {
  name: 'Los Cuervos',
  cooldown: 2 * 1440,  // minutos de juego entre intentos
  firstDay: 3,         // nunca antes de este día
  chanceNight: 0.12,   // por hora de juego, de 21:00 a 5:00
  chanceDusk: 0.04,    // por hora de juego, de 19:00 a 21:00
  minCash: 60,         // por debajo de esto no les compensa
  take: 0.35,          // parte del efectivo que piden
  maxTake: 500,
  spawnDist: 30, giveUpDist: 50, copSafe: 28,
};

let crew = null; // encuentro en curso: { id, thugs: [], phase, t, warned }
let nextRoll = 0;
const model = (i) => { const m = modelNames(false); return m[(m.length - 1 - i * 3 + m.length) % m.length]; };

class Thug extends Walker {
  constructor(i, x, z) {
    super({ female: false }, { real: model(i), scale: 1.0 });
    this.pos.set(x, 0, z);
    this.speed = 1.6;
    this.hit.userData.ia = { enabled: () => false, actions: () => [] };
    this.setMarker('!', '#e74c3c');
  }
  remove() {
    this.g.removeFromParent();
    const k = G.interactables.indexOf(this.hit);
    if (k >= 0) G.interactables.splice(k, 1);
  }
}

const dist2 = (a, b) => (a.x - b.x) ** 2 + (a.z - b.z) ** 2;
const hour = () => G.state.minute / 60;
const outdoors = () => !G.world.inProperty(G.player.pos.x, G.player.pos.z);
const copNear = (r = GANG.copSafe) => G.police.some((c) => c.pos && dist2(c.pos, G.player.pos) < r * r);

// ¿Puede empezar un encuentro ahora? (todas las condiciones de juego limpio)
export function canStart(s = G.state, now = absNow()) {
  if (crew || s.day < GANG.firstDay) return false;
  if (s.lastRobbery !== undefined && now - s.lastRobbery < GANG.cooldown) return false;
  const h = hour();
  if (h >= 5 && h < 19) return false;
  if (G.uiOpen || G.riding || wanted.level > 0 || !outdoors() || copNear(45)) return false;
  return s.money >= GANG.minCash;
}

// Cuánto piden: una parte del efectivo, con tope, y nunca más de lo que llevas.
export function demand(cash) {
  if (cash <= 0) return 0;
  return Math.min(Math.floor(cash), clamp(Math.round(cash * GANG.take), 20, GANG.maxTake));
}

// Punto de aparición: detrás o a un lado del jugador, fuera de la vista, en la calle.
function spawnPoint() {
  const p = G.player.pos, yaw = G.player.yaw;
  for (let k = 0; k < 24; k++) {
    const a = yaw + rand(Math.PI * 0.6, Math.PI * 1.4); // a la espalda
    const x = p.x + Math.sin(a) * GANG.spawnDist, z = p.z + Math.cos(a) * GANG.spawnDist;
    const t = { x, z, y: 0 };
    if (G.world.resolve(t, 0.4, 0)) continue;          // dentro de algo sólido
    if (G.world.inProperty(x, z)) continue;
    if (Math.abs(x) > 105 || Math.abs(z) > 100) continue;
    if (!G.world.nav.path(x, z, p.x, p.z, G.world.los).length) continue;
    return { x, z };
  }
  return null;
}

export function startRobbery(force = false) {
  if (crew || (!force && !canStart())) return false;
  const sp = spawnPoint();
  if (!sp) return false;
  const s = G.state, now = absNow();
  s.lastRobbery = now; // el intento cuenta para la espera aunque te escapes
  const id = `${s.day}-${Math.round(G.state.minute)}`;
  const thugs = [0, 1].map((i) => new Thug(i, sp.x + i * 1.2, sp.z + i * 0.8));
  crew = { id, thugs, phase: 'approach', t: 0, warned: false, repath: 0 };
  return true;
}

function endCrew(reason) {
  if (!crew) return;
  crew.phase = 'leave';
  crew.leaveReason = reason;
  crew.t = 0;
  for (const th of crew.thugs) {
    th.setMarker(null);
    const away = { x: th.pos.x + (th.pos.x - G.player.pos.x) * 3, z: th.pos.z + (th.pos.z - G.player.pos.z) * 3 };
    th.goTo(clamp(away.x, -100, 100), clamp(away.z, -100, 100));
    th.speed = 2.2;
  }
}

export function clearGangs() {
  if (crew) for (const th of crew.thugs) th.remove();
  crew = null;
}
export const gangState = () => crew && { phase: crew.phase, id: crew.id, n: crew.thugs.length, d: Math.sqrt(Math.min(...crew.thugs.map((t) => dist2(t.pos, G.player.pos)))), at: { x: crew.thugs[0].pos.x, z: crew.thugs[0].pos.z } };

export function updateGangs(dt) {
  const now = absNow();
  if (!crew) {
    if (now < nextRoll) return;
    nextRoll = now + 60;
    if (!canStart()) return;
    const h = hour();
    const p = (h >= 21 || h < 5 ? GANG.chanceNight : GANG.chanceDusk) + clamp((G.state.rep || 0) / 2000, 0, 0.05);
    if (Math.random() < p) startRobbery();
    return;
  }
  crew.t += dt;
  const pl = G.player.pos;
  const dmin = Math.sqrt(Math.min(...crew.thugs.map((t) => dist2(t.pos, pl))));
  if (crew.phase === 'approach') {
    // se puede escapar: lejos, a cubierto, en vehículo, o con la policía cerca
    const why = dmin > GANG.giveUpDist ? 'lejos' : !outdoors() ? 'refugio' : G.riding && Math.abs(G.riding.speed || 0) > 3 ? 'vehiculo' : copNear() ? 'policia' : crew.t > 75 ? 'tiempo' : null;
    if (why) {
      G.act.toast?.(why === 'policia' ? `${GANG.name} ven a la policía y se largan.` : `Has despistado a ${GANG.name}.`, '😮‍💨');
      return endCrew(why);
    }
    if (!crew.warned && dmin < 22) {
      crew.warned = true;
      sfx('error');
      G.act.toast?.(`Dos tipos de ${GANG.name} vienen hacia ti. Aléjate, métete en algún sitio o busca a la policía.`, '⚠️');
    }
    crew.repath -= dt;
    for (const th of crew.thugs) {
      if (crew.repath <= 0) th.goTo(pl.x, pl.z);
      th.speed = dmin < 14 ? 3.0 : 1.6;
      if (dist2(th.pos, pl) > 1.6 * 1.6) th.stepPath(dt); else { th.moving = 0; th.lookAt(pl.x, pl.z); }
      th.animate(dt);
    }
    if (crew.repath <= 0) crew.repath = 1;
    if (dmin < 1.9 && !G.uiOpen) {
      crew.phase = 'confront';
      for (const th of crew.thugs) { th.moving = 0; th.lookAt(pl.x, pl.z); }
      G.act.openRobbery?.(crew.id);
    }
    return;
  }
  if (crew.phase === 'confront') {
    for (const th of crew.thugs) { th.lookAt(pl.x, pl.z); th.animate(dt); }
    return;
  }
  // se van: desaparecen al alejarse o pasados unos segundos fuera de la vista
  for (const th of crew.thugs) { th.stepPath(dt); th.animate(dt); }
  if (crew.t > 25 || dmin > 60) clearGangs();
}

// Resolver el atraco. choice: 'pay' | 'spray' | 'porra' | 'pistola' | 'run'.
// Devuelve { ok, lost, msg }. Solo se puede resolver una vez por encuentro (clave rob:<id>).
export function resolveRobbery(choice, rng = Math.random) {
  if (!crew || crew.phase !== 'confront') return { ok: false, msg: 'No hay ningún atraco en curso.' };
  const s = G.state;
  const want = demand(s.money);
  let lost = 0, msg;
  const take = (amount, why) => {
    amount = Math.min(Math.floor(s.money), Math.max(0, Math.round(amount)));
    if (amount <= 0) return 0;
    const r = spend('dirty', amount, why, { key: `rob:${crew.id}` });
    return r.ok ? amount : 0;
  };
  if (choice === 'spray') {
    if (!inv.count('spray')) return { ok: false, msg: 'No llevas spray de pimienta.' };
    inv.remove('spray', 1);
    msg = '¡Les rocías la cara y salen corriendo entre toses!';
  } else if (choice === 'pistola') {
    if (!inv.count('pistola')) return { ok: false, msg: 'No llevas pistola.' };
    msg = 'Enseñas la pistola. Levantan las manos y se van sin decir nada.';
    addRep(1);
  } else if (choice === 'porra') {
    if (!inv.count('porra')) return { ok: false, msg: 'No llevas porra.' };
    if (rng() < 0.6) msg = 'Despliegas la porra. Se miran... y deciden que no vale la pena.';
    else { lost = take(want * 0.5, 'atraco'); msg = `Forcejeáis y se llevan ${money(lost)}, pero menos de lo que querían.`; }
  } else if (choice === 'run') {
    if (rng() < 0.45) msg = 'Sales corriendo y les das esquinazo.';
    else { lost = take(want, 'atraco'); msg = `Te alcanzan y se llevan ${money(lost)}.`; }
  } else {
    lost = take(want, 'atraco');
    msg = lost ? `Les das ${money(lost)} y se marchan.` : 'No llevas nada. Te empujan y se van.';
  }
  s.stats.robberies = (s.stats.robberies || 0) + 1;
  if (lost) s.stats.robbedTotal = (s.stats.robbedTotal || 0) + lost;
  endCrew('resuelto');
  save();
  return { ok: true, lost, msg };
}

export const robberyDemand = () => demand(G.state.money);
export const hasThreat = () => !!crew && crew.phase !== 'leave';
export { illegalCount };
