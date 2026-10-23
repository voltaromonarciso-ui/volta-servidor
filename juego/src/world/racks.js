// Estanterías del fondo de los almacenes: un almacén grande por nave, guardado en la partida
import { G } from '../game.js';

// Huecos de las estanterías del fondo según el almacén (Delta, Bravo, Alfa)
export const RACK_SLOTS = [40, 60, 80];
// El almacén de las estanterías como si fuera un mueble (lo abre el mismo panel que las estanterías)
export function rackStore(id) {
  const n = RACK_SLOTS[G.world.props[id]?.level ?? 0];
  const racks = (G.state.racks ||= {});
  const slots = (racks[id] ||= []);
  while (slots.length < n) slots.push(null);
  return { entry: { type: 'rack', data: { slots } }, title: `Estanterías · ${G.world.props[id].name}` };
}
