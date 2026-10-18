import { G } from '../game.js';
import { save, absNow } from '../core/state.js';
import { onHour, onMinute, addMoney, sendMsg } from './economy.js';
import { simulateObjects } from './objects.js';
import { tickStaff } from './staff.js';
import { resetPolice, wanted } from './police.js';
import { QUESTS } from '../data/quests.js';

export const DAYS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
export const dayName = (d) => DAYS[(d - 1) % 7];
export const clock = (m) => {
  const h = Math.floor(m / 60) % 24, mm = Math.floor(m % 60);
  return String(h).padStart(2, '0') + ':' + String(mm).padStart(2, '0');
};

const TIME_SCALE = 1; // minutos de juego por segundo real
let lastMinute = -1, saveT = 0;

// Avanza el reloj `min` minutos (también usado al dormir / ser arrestado).
export function advanceTime(min) {
  const s = G.state;
  let left = min;
  while (left > 0) {
    const step = Math.min(left, 60 - (s.minute % 60) || 60);
    const before = s.minute;
    s.minute += step;
    left -= step;
    simulateObjects(step);
    if (s.minute >= 1440) { s.minute -= 1440; newDay(); }
    if (Math.floor(before / 60) !== Math.floor(s.minute / 60)) onHour(Math.floor(s.minute / 60));
    onMinute();
    tickStaff(); // empleados y nómina avanzan con el salto (dormir, comisaría)
  }
}

function newDay() {
  const s = G.state;
  s.day++;
  s.today = { earned: 0, deals: 0 };
}

export function updateTime(dt) {
  const s = G.state;
  const gdt = dt * TIME_SCALE;
  const prevHour = Math.floor(s.minute / 60);
  s.minute += gdt;
  simulateObjects(gdt);
  if (s.minute >= 1440) { s.minute -= 1440; newDay(); }
  const hour = Math.floor(s.minute / 60);
  if (hour !== prevHour) onHour(hour);
  const m = Math.floor(s.minute);
  if (m !== lastMinute) { lastMinute = m; onMinute(); checkQuests(); }
  tickStaff();
  // a las 4:00 caes rendido
  if (hour === 4 && !G.sleeping) passOut();
  saveT += dt;
  if (saveT > 30) { saveT = 0; save(); }
  return gdt;
}

export function canSleep() {
  const h = G.state.minute / 60;
  return h >= 18 || h < 4;
}

// opts.wake: hora de despertar en minutos (la cama buena despierta a las 6:00)
export function sleep(propId, forced = false, opts = {}) {
  const wake = opts.wake ?? 7 * 60;
  if (!forced && !canSleep()) return G.act.toast('No tienes sueño. Podrás dormir a partir de las 18:00.', '😴');
  if (wanted.level > 0 && !forced) return G.act.toast('¡No puedes dormir con la policía detrás!', '🚨');
  if (G.sleeping) return;
  G.sleeping = true;
  const s = G.state;
  const summary = { day: s.day, earned: s.today.earned, deals: s.today.deals };
  let mins = (wake - s.minute + 1440) % 1440;
  if (mins === 0) mins = 1440;
  G.act.fade(() => {
    advanceTime(mins);
    s.minute = wake;
    const prop = G.world.props[propId || s.home] || G.world.props.nave;
    G.player.teleport(prop.spawn.x, prop.spawn.z, prop.spawn.yaw);
    for (const n of G.npcs) n.resetHome();
    resetPolice();
    save();
    G.sleeping = false;
    G.act.daySummary(summary, forced);
  });
}

function passOut() {
  const s = G.state;
  const outside = !G.world.inProperty(G.player.pos.x, G.player.pos.z);
  let lost = 0;
  if (outside && s.money > 0) { lost = Math.round(s.money * 0.1); addMoney(-lost); }
  sleep(s.home || 'nave', true);
  if (lost) setTimeout(() => sendMsg('leo', `Primo, te encontraron dormido en la calle. Te faltan ${lost}$... Vete a casa antes de las 4:00.`), 2500);
}

export function checkQuests() {
  const s = G.state;
  while (s.quest < QUESTS.length && QUESTS[s.quest].done()) {
    const q = QUESTS[s.quest];
    s.quest++;
    G.act.questDone(q, QUESTS[s.quest]);
  }
}

export { absNow };
