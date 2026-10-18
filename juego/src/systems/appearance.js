import { G, clamp } from '../game.js';
import { CLOTHES, HAIR_COLORS, BEARDS, SLOTS, RECOG_WEIGHTS, RECOG_MINUTES } from '../data/style.js';
import { INV_SIZE, absNow, save } from '../core/state.js';
import { spend } from './economy.js';

// Reglas centrales de apariencia: qué llevas, qué cuesta cambiarlo, cómo te
// reconoce la policía y qué efectos tienen las prendas. Peluquería, tienda de
// ropa, policía, clientes y el avatar leen de aquí (nada de reglas duplicadas).

// ------------------------------------------------------------------
//  Estado (dentro de G.state; las partidas antiguas reciben los valores por defecto)
// ------------------------------------------------------------------
export function style() {
  const s = G.state;
  s.style ||= { hair: 'orig', beard: 'none' };
  s.wardrobe ||= { owned: [], worn: {} };
  s.wardrobe.worn ||= {};
  return { hair: s.style.hair, beard: s.style.beard, worn: s.wardrobe.worn };
}
export const owns = (id) => (G.state.wardrobe?.owned || []).includes(id);
export const canBeard = () => !G.state.look?.female;

// ------------------------------------------------------------------
//  Peluquería: precio de un cambio y confirmación (solo cobra si se aplica)
// ------------------------------------------------------------------
export function barberQuote(next) {
  const cur = style();
  let price = 0;
  if (next.hair !== cur.hair) price += HAIR_COLORS[next.hair]?.price ?? 0;
  if (next.beard !== cur.beard) price += BEARDS[next.beard]?.price ?? 0;
  // volver a lo natural también es un servicio (lavar el tinte, afeitar)
  if (next.hair === 'orig' && cur.hair !== 'orig') price += 10;
  if (next.beard === 'none' && cur.beard !== 'none') price += 5;
  return price;
}
export function barberApply(next) {
  if (!HAIR_COLORS[next.hair] || !BEARDS[next.beard]) return { ok: false, msg: 'Ese servicio no existe.' };
  if (next.beard !== 'none' && !canBeard()) return { ok: false, msg: 'Ese servicio no está disponible para ti.' };
  const price = barberQuote(next);
  if (price === 0) return { ok: false, msg: 'No has cambiado nada.' };
  const r = spend('dirty', price, 'peluquería');
  if (!r.ok) return { ok: false, msg: r.msg };
  G.state.style.hair = next.hair;
  G.state.style.beard = next.beard;
  changed();
  return { ok: true, price };
}

// ------------------------------------------------------------------
//  Ropa: comprar (una vez), equipar y quitar
// ------------------------------------------------------------------
export function buyClothes(id) {
  const it = CLOTHES[id];
  if (!it) return { ok: false, msg: 'Esa prenda no existe.' };
  if (owns(id)) return { ok: false, msg: 'Ya la tienes.' };
  const r = spend('dirty', it.price, `ropa: ${it.name}`, { key: `ropa:${id}` });
  if (!r.ok) return { ok: false, msg: r.msg };
  style();
  G.state.wardrobe.owned.push(id);
  save();
  return { ok: true };
}

export function equip(id) {
  const it = CLOTHES[id];
  if (!it || !owns(id)) return { ok: false, msg: 'No tienes esa prenda.' };
  const prev = style().worn[it.slot];
  if (prev === id) return { ok: true };
  if (prev && !canRemove(prev)) return { ok: false, msg: removeBlock(prev) };
  G.state.wardrobe.worn[it.slot] = id;
  syncInventory();
  changed();
  return { ok: true };
}

export function unequip(slot) {
  const id = style().worn[slot];
  if (!id) return { ok: true };
  if (!canRemove(id)) return { ok: false, msg: removeBlock(id) };
  delete G.state.wardrobe.worn[slot];
  syncInventory();
  changed();
  return { ok: true };
}

// La mochila no se puede quitar con cosas en sus huecos extra.
function canRemove(id) {
  const extra = CLOTHES[id]?.fx?.invSlots || 0;
  if (!extra) return true;
  const inv = G.state.inv;
  return inv.slice(inv.length - extra).every((s) => !s);
}
const removeBlock = () => 'Vacía los huecos extra de la mochila antes de quitártela.';

export function invSlots() {
  return INV_SIZE + Object.values(style().worn).reduce((a, id) => a + (CLOTHES[id]?.fx?.invSlots || 0), 0);
}
// Ajusta el inventario al tamaño que dan las prendas (nunca borra objetos).
export function syncInventory() {
  const inv = G.state.inv, n = invSlots();
  while (inv.length < n) inv.push(null);
  while (inv.length > n && !inv[inv.length - 1]) inv.pop();
  if (G.state.sel >= inv.length) G.state.sel = 0;
}

// ------------------------------------------------------------------
//  Reconocimiento policial
// ------------------------------------------------------------------
export function signature() {
  const st = style();
  return { model: G.state.look?.model || '', hair: st.hair, beard: st.beard, top: st.worn.top || '', legs: st.worn.legs || '', face: st.worn.face || '' };
}
// Parecido entre dos aspectos (0 = nada que ver, 1 = idéntico).
export function similarity(a, b) {
  let s = 0;
  for (const [k, w] of Object.entries(RECOG_WEIGHTS)) if ((a[k] || '') === (b[k] || '')) s += w;
  return s;
}
// La policía apunta tu aspecto en cada incidente (persecución, detención).
export function rememberIncident() {
  const now = absNow();
  G.state.policeMemory = { sig: signature(), at: now, until: now + RECOG_MINUTES };
}
// Cuánto te reconocen ahora mismo (0-1): parecido × lo fresco que está el recuerdo.
export function recognition() {
  const m = G.state.policeMemory;
  if (!m) return 0;
  const now = absNow();
  if (now >= m.until) { G.state.policeMemory = null; return 0; }
  const fresh = clamp(1 - (now - m.at) / (m.until - m.at), 0, 1);
  return similarity(signature(), m.sig) * (0.35 + 0.65 * fresh);
}
export const RECOG_LEVEL = 0.62; // a partir de aquí, la patrulla «te tiene fichado»

// ------------------------------------------------------------------
//  Clientes: estilo del conjunto (calle, elegante, deportivo)
// ------------------------------------------------------------------
export function outfitTags() {
  const tags = {};
  for (const id of Object.values(style().worn)) { const t = CLOTHES[id]?.tag; if (t) tags[t] = (tags[t] || 0) + 1; }
  return tags;
}
// Ajuste pequeño de la tolerancia al precio de un cliente según su gusto.
export function styleBonus(person) {
  if (!person?.style) return 0;
  const tags = outfitTags();
  const like = tags[person.style] || 0;
  const other = Object.entries(tags).filter(([t]) => t !== person.style).reduce((a, [, n]) => a + n, 0);
  return clamp(like * 0.025 - (person.dislike && tags[person.dislike] ? 0.03 : 0) - (like ? 0 : other * 0.005), -0.05, 0.07);
}

// ------------------------------------------------------------------
//  Avisos de cambio (avatar, manos, guardado)
// ------------------------------------------------------------------
function changed() {
  G.act.lookChanged?.();
  save();
}

export { CLOTHES, HAIR_COLORS, BEARDS, SLOTS };
