// Pelea: botón de puño (encima de saltar) o clic izquierdo / F. Golpea con lo que llevas en
// la mano: puños, porra o machete; con la pistola en la mano, dispara (gasta balas).
// Se puede golpear a cualquiera: vecinos, atracadores y policía. Quien recibe bastante cae
// al suelo un rato. Pegar o disparar delante de la policía (o a un agente) es delito.
import * as THREE from 'three';
import { G } from '../game.js';
import { inv } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { startChase, wanted } from './police.js';
import { gangThugs, crewHit } from './gangs.js';
import { customer, addRep } from './economy.js';

export const WEAPONS = {
  punos: { name: 'Puños', dmg: 1, range: 1.7, cd: 0.45 },
  porra: { name: 'Porra', dmg: 2, range: 2.0, cd: 0.6 },
  machete: { name: 'Machete', dmg: 3, range: 2.1, cd: 0.55 },
  pistola: { name: 'Pistola', dmg: 3, range: 60, cd: 0.35, ammo: 'balas' },
};
const HP = 3, KO_SECS = 25;
let readyAt = 0; // espera entre golpes, en tiempo real
const ray = new THREE.Raycaster();

// Qué hace el botón ahora: 'shoot' con la pistola en la mano, si no 'melee'
export function attackMode() {
  const held = G.state.inv[G.state.sel];
  return held?.id === 'pistola' ? 'shoot' : 'melee';
}
export const ammo = () => inv.count('balas');

const targets = () => [
  ...G.npcs.filter((n) => n.g.visible).map((t) => ({ t, kind: 'vecino' })),
  ...G.police.map((t) => ({ t, kind: 'policia' })),
  ...gangThugs().map((t) => ({ t, kind: 'atracador' })),
].filter(({ t }) => !(t.ko > 0));

export function updateCombat() {}
const wait = (sec) => { readyAt = performance.now() + sec * 1000; };

export function attack() {
  if (G.uiOpen || G.riding || performance.now() < readyAt) return null;
  const held = G.state.inv[G.state.sel];
  if (held?.id === 'pistola') return shoot();
  const w = WEAPONS[held?.id] || WEAPONS.punos;
  wait(w.cd);
  G.player.vm.strike?.(w === WEAPONS.punos ? 'punch' : 'swing');
  if (w !== WEAPONS.punos) G.player.use();
  // el más cercano delante de ti (en un cono de ~50°)
  const p = G.player.pos, f = G.player.forward();
  let best = null, bd = Infinity;
  for (const o of targets()) {
    const dx = o.t.pos.x - p.x, dz = o.t.pos.z - p.z, d = Math.hypot(dx, dz);
    if (d > w.range || d < 0.01) continue;
    if ((dx * f.x + dz * f.z) / d < 0.62) continue;
    if (Math.abs(o.t.pos.y - p.y) > 1.2) continue;
    if (d < bd) { bd = d; best = o; }
  }
  if (!best) { sfx('swing'); return { hit: false }; }
  sfx('punch');
  return hit(best, w);
}

function shoot() {
  const w = WEAPONS.pistola;
  if (!ammo()) { sfx('empty'); G.act.toast('Sin balas. Las venden en la armería.', '🔫'); wait(0.3); return { hit: false, empty: true }; }
  wait(w.cd);
  inv.remove('balas', 1);
  sfx('shot');
  G.player.use();
  G.player.vm.strike?.('shot');
  alarm('¡Disparos! ¡Al suelo!', 80);
  G.player.aim(ray);
  ray.far = w.range;
  const list = targets();
  const hits = ray.intersectObjects(list.map((o) => o.t.hit), false);
  const h = hits[0];
  if (!h) return { hit: false };
  const o = list.find((x) => x.t.hit === h.object);
  // una pared de por medio para la bala
  const a = ray.ray.origin;
  if (!G.world.los(a.x, a.z, o.t.pos.x, o.t.pos.z, 1.2)) return { hit: false };
  return hit(o, w);
}

// La policía que ve la agresión (o un disparo cerca) te persigue
function alarm(shout, radius = 45) {
  const p = G.player.pos;
  const cop = G.police.find((c) => !(c.ko > 0) && Math.hypot(c.pos.x - p.x, c.pos.z - p.z) < radius && (radius > 60 || c.canSee?.(radius)));
  if (cop) startChase(cop, shout);
  return !!cop;
}

function hit({ t, kind }, w) {
  t.hp = (t.hp ?? HP) - w.dmg;
  t.flinch = 0.25;
  const down = t.hp <= 0;
  if (down) t.knockOut?.(KO_SECS);
  if (kind === 'policia') startChase(t, '¡Agresión a un agente!');
  else if (kind === 'vecino') {
    addRep(-1.5);
    const c = customer(t.id);
    if (c?.unlocked) c.affinity = Math.max(0, c.affinity - 25);
    alarm('¡Alto! ¡Deje de pegar a esa persona!');
  } else if (kind === 'atracador') crewHit(t, down);
  G.act.toast?.(down ? `${kind === 'policia' ? 'El agente' : kind === 'atracador' ? 'El atracador' : 'El vecino'} cae al suelo.` : `Golpe con ${w.name.toLowerCase()}.`, w === WEAPONS.pistola ? '🔫' : '👊');
  return { hit: true, down, kind, wanted: wanted.level };
}

