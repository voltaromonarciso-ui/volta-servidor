// Contexto global compartido por todos los sistemas.
export const G = {
  scene: null,
  camera: null,
  renderer: null,
  world: null,
  player: null,
  state: null,
  npcs: [],
  police: [],
  cars: [],
  interactables: [],
  objects: new Map(),
  act: {},          // acciones registradas por los sistemas (abrir tienda, dormir...)
  uiOpen: false,
  paused: true,
  touch: false,
  time: 0,          // segundos reales desde el arranque
};

const listeners = {};
export function on(ev, fn) { (listeners[ev] ||= []).push(fn); }
export function emit(ev, data) { (listeners[ev] || []).forEach((f) => f(data)); }

export const rand = (a, b) => a + Math.random() * (b - a);
export const randi = (a, b) => Math.floor(rand(a, b + 1));
export const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
export const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
export const lerp = (a, b, t) => a + (b - a) * t;
export const money = (n) => '$' + Math.round(n).toLocaleString('es-ES');
