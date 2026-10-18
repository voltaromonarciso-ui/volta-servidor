import { G, rand, pick } from '../game.js';
import { Cop } from '../entities/npc.js';
import { OFFICERS } from '../data/people.js';
import { ITEMS } from '../data/items.js';
import { illegalCount, save, absNow } from '../core/state.js';
import { sfx, setSiren } from '../core/audio.js';
import { input } from '../core/input.js';
import { ROADS } from '../world/world.js';
import { spend, addRep } from './economy.js';
import { rememberIncident, recognition, RECOG_LEVEL } from './appearance.js';

// Patrullas, toque de queda (21:00–05:00), cacheos y persecuciones.
export const wanted = { level: 0, unseen: 0, escape: 14, reason: '' };

export function spawnPolice() {
  // en la isla de Rooktown las calles vienen del mundo (cuadrícula 8 × 5); si no, las de siempre
  const RX = G.world.roadsX || ROADS, RZ = G.world.roadsZ || ROADS;
  const k = RX.length > 4 ? 2 : 0; // desplaza las rutas hacia el centro de la isla
  const c = (i, j, sx, sz) => ({ x: RX[Math.min(i + k, RX.length - 1)] + sx * 5.25, z: RZ[Math.min(j, RZ.length - 1)] + sz * 5.25 });
  const routes = [
    [c(1, 1, 1, 1), c(2, 1, -1, 1), c(2, 2, -1, -1), c(1, 2, 1, -1)],
    [c(0, 1, 1, -1), c(1, 1, -1, -1), c(1, 0, -1, 1), c(0, 0, 1, 1)],
    [c(2, 0, 1, 1), c(3, 0, -1, 1), c(3, 1, -1, -1), c(2, 1, 1, -1)],
    [c(0, 2, 1, 1), c(1, 2, -1, 1), c(2, 2, 1, 1), c(3, 2, -1, 1), c(3, 3, -1, -1), c(0, 3, 1, -1)],
  ];
  routes.forEach((r, i) => G.police.push(new Cop(OFFICERS[i], r, i + 1)));
  G.wanted = wanted;
}

export function curfew() {
  const m = G.state.minute;
  return m >= 21 * 60 || m < 5 * 60;
}

let checkT = 0, friskCop = null, friskT = 0;

export function updatePolice(dt) {
  for (const cop of G.police) cop.update(dt);
  checkT -= dt;
  if (checkT > 0) return;
  checkT = 0.25;
  const step = 0.25;
  const p = G.player.pos;
  const inside = G.world.inProperty(p.x, p.z);

  if (wanted.level > 0) {
    let seen = false;
    for (const cop of G.police) {
      if (cop.mode !== 'chase' && cop.distToPlayer() < 70) { cop.mode = 'chase'; cop.lastSeen = { x: p.x, z: p.z }; }
      if (cop.mode === 'chase' && cop.canSee(45)) seen = true;
      if (cop.mode === 'chase' && cop.distToPlayer() < 1.3) { arrest(cop); return; }
    }
    // cambiarse de ropa o de pelo no corta la persecución, pero si ya no encajas
    // con la descripción, te pierden antes
    const fit = recognition() < 0.45 ? 1.3 : 1;
    wanted.unseen = seen ? 0 : wanted.unseen + step * (inside ? 3 : 1) * fit;
    if (wanted.unseen >= wanted.escape) {
      wanted.level = 0;
      wanted.unseen = 0;
      for (const cop of G.police) { cop.mode = 'return'; cop.path = []; }
      setSiren(false);
      G.act.toast('Les has dado esquinazo.', '😮‍💨');
    }
    return;
  }

  // cacheo en curso: el agente se acerca
  if (friskCop) {
    friskT -= step;
    if (friskCop.distToPlayer() < 2.1) {
      const cop = friskCop;
      friskCop = null;
      G.act.friskDialog(cop);
    } else if (G.riding && !G.riding.leaving && friskCop.distToPlayer() > 9 && Math.abs(G.riding.speed) > 3) {
      // te dan el alto y sigues pedaleando: eso es darse a la fuga
      const cop = friskCop;
      friskCop = null;
      startChase(cop, '¡Alto! ¡Bájate de ahí!');
    } else if (friskT <= 0 || friskCop.distToPlayer() > 25) {
      friskCop.mode = 'return'; friskCop.path = []; friskCop = null;
    }
    return;
  }

  for (const cop of G.police) {
    if (cop.mode !== 'patrol' && cop.mode !== 'return') continue;
    if (curfew()) {
      if (!inside && cop.notices(22)) {
        startChase(cop, '¡Alto! ¡Estás incumpliendo el toque de queda!');
        return;
      }
    } else if (cop.friskCooldown <= 0 && !inside && cop.notices(recognized() ? 14 : 9)) {
      cop.friskCooldown = 120;
      const r = recognition();
      const known = r >= RECOG_LEVEL;
      if (Math.random() < friskChance(r, !!input.sprint || Math.abs(G.riding?.speed || 0) > 6, illegalCount())) {
        friskCop = cop;
        friskT = 12;
        cop.mode = 'approach';
        sfx('whistle');
        G.act.toast(known ? `${cop.name}: «¡Eh, tú! Te pareces al que se nos escapó. Quieto ahí.»` : `${cop.name}: «¡Eh, tú! Quieto ahí un momento.»`, '👮');
        return;
      }
    }
  }
}

const recognized = () => recognition() >= RECOG_LEVEL;

// Probabilidad de que una patrulla te pare al verte (sin toque de queda). Si
// encajas con la descripción de un incidente reciente, te paran casi seguro.
export function friskChance(recog, running, illegal) {
  const suspicious = (running ? 0.25 : 0) + Math.min(0.3, illegal * 0.01);
  return Math.min(0.97, 0.18 + suspicious + (recog >= RECOG_LEVEL ? 0.45 + (recog - RECOG_LEVEL) : 0));
}

export function startChase(cop, shout) {
  rememberIncident();
  wanted.level = Math.max(1, wanted.level + 1);
  wanted.unseen = 0;
  wanted.escape = 12 + wanted.level * 4;
  if (cop) { cop.mode = 'chase'; cop.lastSeen = { x: G.player.pos.x, z: G.player.pos.z }; }
  sfx('whistle');
  setSiren(true);
  if (shout) G.act.toast(`${cop ? cop.name : 'Policía'}: «${shout.replace(/^¡?/, '¡').replace(/!?$/, '!')}»`, '🚨');
}

// Resultado del cacheo (cooperar)
export function cooperate(cop) {
  if (illegalCount() > 0) {
    arrest(cop, true);
  } else {
    G.act.toast(`${cop.name}: «Todo en orden. Puede irse.»`, '👮');
    cop.mode = 'return'; cop.path = [];
  }
}

export function flee(cop) {
  startChase(cop, '¡Alto, policía!');
}

const JAIL_MIN = 180;
export function arrest(cop) {
  const s = G.state;
  // Una detención no puede repetirse mientras estás en comisaría (las 3 h que se pasan
  // dentro): una segunda llamada para la misma detención no hace nada; las detenciones
  // posteriores, sí multan.
  const at = Math.floor(absNow());
  if (Number.isFinite(s.lastArrestAt) && at >= s.lastArrestAt && at <= s.lastArrestAt + JAIL_MIN) return;
  s.lastArrestAt = at;
  let lost = 0;
  s.inv.forEach((slot, i) => { if (slot && ITEMS[slot.id].illegal) { lost += slot.q; s.inv[i] = null; } });
  // la multa sale solo del efectivo que llevas (nunca del dinero limpio ni de la caja fuerte)
  const fine = Math.floor(Math.min(Math.max(0, s.money), 150 + s.rank * 75 + lost * 5));
  if (fine > 0) spend('dirty', fine, 'multa', { key: `arrest:${at}` });
  addRep(-4); // que te detengan se sabe en el barrio
  rememberIncident();
  wanted.level = 0; wanted.unseen = 0;
  setSiren(false);
  for (const c of G.police) { c.mode = 'return'; c.path = []; }
  if (cop) { cop.mode = 'return'; }
  G.act.arrested({ lost, fine, officer: cop ? cop.name : 'La policía' });
  G.act.forceDismount?.(); // el vehículo se queda donde te pararon
  const hq = G.world.policeHQ;
  G.player.teleport(hq.x + rand(-1, 1), hq.z + 2, Math.PI);
  G.act.advanceTime(JAIL_MIN);
  save();
}

export function resetPolice() {
  wanted.level = 0; wanted.unseen = 0; friskCop = null;
  setSiren(false);
  for (const c of G.police) { c.mode = 'patrol'; c.path = []; c.ri = Math.floor(Math.random() * c.route.length); const r = c.route[c.ri]; c.pos.set(r.x, 0, r.z); }
}

export { pick };
