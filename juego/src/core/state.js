import { G } from '../game.js';
import { ITEMS } from '../data/items.js';

const KEY = 'bloque9_save_v3';
export const INV_SIZE = 10;

export function newState() {
  return {
    version: 3,
    money: 350,
    day: 1,
    minute: 17.5 * 60,
    rank: 0,
    xp: 0,
    rep: 0,             // reputación en la ciudad (0-100)
    inv: Array(INV_SIZE).fill(null),
    sel: 0,
    water: 4,           // usos de agua en la regadera
    objects: [],
    nextUid: 1,
    products: {},
    customers: {},
    deals: [],
    messages: {},
    contacts: ['leo', 'rubio'],
    unread: {},
    today: { earned: 0, deals: 0 },
    orders: [],
    quest: 0,
    props: { nave: true, bungalow: false },
    home: 'nave',
    rentPaidWeek: 1,
    stats: { earned: 0, deals: 0, best: 0 },
    flags: {},
    settings: { sens: 1, shadows: true, res: 1, sound: true, quality: 'alta' },
  };
}

export function save() {
  try {
    localStorage.setItem(KEY, JSON.stringify(G.state));
  } catch (e) { /* almacenamiento no disponible */ }
}

export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.version !== 3) return null;
    return Object.assign(newState(), s);
  } catch (e) {
    return null;
  }
}

export function hasSave() {
  try { return !!localStorage.getItem(KEY); } catch (e) { return false; }
}

export function wipe() {
  try { localStorage.removeItem(KEY); } catch (e) { /* nada */ }
}

// ---------- Inventario genérico (sirve para jugador y estanterías) ----------
const same = (s, id, p) => s && s.id === id && (s.p || null) === (p || null);

export function slotsCount(slots, id, p) {
  return slots.reduce((a, s) => a + (same(s, id, p) || (s && s.id === id && p === undefined) ? s.q : 0), 0);
}

export function slotsAdd(slots, id, q, p) {
  const max = ITEMS[id].stack;
  for (const s of slots) {
    if (q <= 0) break;
    if (same(s, id, p) && s.q < max) {
      const n = Math.min(max - s.q, q);
      s.q += n; q -= n;
    }
  }
  for (let i = 0; i < slots.length && q > 0; i++) {
    if (!slots[i]) {
      const n = Math.min(max, q);
      slots[i] = p ? { id, q: n, p } : { id, q: n };
      q -= n;
    }
  }
  return q; // sobrante que no cabe
}

export function slotsRoom(slots, id, p) {
  const max = ITEMS[id].stack;
  return slots.reduce((a, s) => a + (!s ? max : same(s, id, p) ? max - s.q : 0), 0);
}

export function slotsRemove(slots, id, q, p) {
  for (let i = slots.length - 1; i >= 0 && q > 0; i--) {
    const s = slots[i];
    if (s && s.id === id && (p === undefined || (s.p || null) === (p || null))) {
      const n = Math.min(s.q, q);
      s.q -= n; q -= n;
      if (s.q <= 0) slots[i] = null;
    }
  }
  return q === 0;
}

export const inv = {
  count: (id, p) => slotsCount(G.state.inv, id, p),
  add: (id, q, p) => slotsAdd(G.state.inv, id, q, p),
  room: (id, p) => slotsRoom(G.state.inv, id, p),
  remove: (id, q, p) => slotsRemove(G.state.inv, id, q, p),
  held: () => G.state.inv[G.state.sel],
};

// Unidades totales de producto ilegal (para cacheos).
export function illegalCount() {
  return G.state.inv.reduce((a, s) => a + (s && ITEMS[s.id].illegal ? s.q : 0), 0);
}

export function absNow() {
  return (G.state.day - 1) * 1440 + G.state.minute;
}
