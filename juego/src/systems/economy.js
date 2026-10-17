import { G, rand, randi, pick, clamp, money, emit } from '../game.js';
import { ITEMS, STRAINS, RANKS } from '../data/items.js';
import { EFFECTS, productValue } from '../data/effects.js';
import { PEOPLE, STARTING_CUSTOMERS } from '../data/people.js';
import { inv, absNow, save } from '../core/state.js';
import { sfx } from '../core/audio.js';
import { styleBonus } from './appearance.js';

// ------------------------------------------------------------------
//  Productos
// ------------------------------------------------------------------
export function ensureBaseProduct(strain) {
  const P = G.state.products;
  if (!P[strain]) {
    const effects = [STRAINS[strain].effect];
    P[strain] = { id: strain, name: STRAINS[strain].name, strain, effects, price: productValue(strain, effects), listed: true, base: true };
    G.act.toast?.(`Nuevo producto: ${STRAINS[strain].name}. Ya está a la venta en la app Productos.`, '🏷️');
  }
  return strain;
}

export const prodValue = (p) => productValue(p.strain, p.effects);
export const product = (id) => G.state.products[id];

export function unitsOf(slot) { return slot.q * (ITEMS[slot.id].units || 1); }

// ------------------------------------------------------------------
//  Dinero, experiencia, rangos
// ------------------------------------------------------------------
export function addMoney(n) {
  G.state.money += n;
  if (n > 0) { G.state.stats.earned += n; G.state.today.earned += n; }
  emit('money', n);
}

export function addXP(n) {
  const s = G.state;
  s.xp += Math.round(n);
  while (s.rank < RANKS.length - 1 && s.xp >= RANKS[s.rank + 1].xp) {
    s.rank++;
    sfx('level');
    const unlocks = [
      ...Object.entries(ITEMS).filter(([, it]) => it.rank === s.rank).map(([, it]) => it.name),
      ...Object.values(STRAINS).filter((st) => st.rank === s.rank && !st.noSeed).map((st) => 'Semillas de ' + st.name),
    ];
    G.act.bigToast?.(`¡Nuevo rango: ${RANKS[s.rank].name}!`, unlocks.length ? 'Desbloqueado: ' + unlocks.join(', ') : 'Tus clientes te respetan más.');
  }
  emit('xp');
}

// ------------------------------------------------------------------
//  Contactos y mensajes
// ------------------------------------------------------------------
export const CONTACTS = {
  leo: { name: 'Primo Leo', icon: '🧔', color: '#e67e22' },
  rubio: { name: 'Rubio (semillas)', icon: '🕶️', color: '#16a085' },
  motel: { name: 'Don Tomás (casero)', icon: '🏭', color: '#7f8c8d' },
};
for (const p of PEOPLE) CONTACTS[p.id] = { name: p.name, icon: '🙂', color: '#3498db', person: p };

export function sendMsg(from, text, extra = {}) {
  const M = G.state.messages;
  (M[from] ||= []).push({ me: false, text, t: absNow(), ...extra });
  if (!G.state.contacts.includes(from)) G.state.contacts.push(from);
  G.state.unread = G.state.unread || {};
  G.state.unread[from] = (G.state.unread[from] || 0) + 1;
  sfx('msg');
  G.act.notify?.(from, text);
  emit('messages');
}

export function myMsg(to, text) {
  (G.state.messages[to] ||= []).push({ me: true, text, t: absNow() });
  emit('messages');
}

// ------------------------------------------------------------------
//  Reputación en la ciudad
// ------------------------------------------------------------------
// Sube al cerrar tratos, cumplir y regalar; baja al fallar y si te detienen.
// Cuanta más reputación, más vecinos aceptan muestras y más pedidos llegan.
export const REP_TIERS = [
  { min: 0, name: 'Desconocido' },
  { min: 15, name: 'Conocido en el barrio' },
  { min: 35, name: 'Respetado' },
  { min: 60, name: 'Famoso en Puerto Lomas' },
  { min: 85, name: 'Leyenda' },
];
export function repTier(r = G.state.rep || 0) {
  let t = 0;
  REP_TIERS.forEach((x, i) => { if (r >= x.min) t = i; });
  return t;
}
export function addRep(n) {
  const s = G.state;
  const before = repTier(s.rep || 0);
  s.rep = clamp((s.rep || 0) + n, 0, 100);
  const after = repTier(s.rep);
  if (after > before) {
    sfx('level');
    G.act.bigToast?.(`Reputación: ${REP_TIERS[after].name}`, 'Más vecinos querrán probar tu producto y te llegarán más pedidos.');
  } else if (after < before) G.act.toast?.(`Tu reputación baja: ${REP_TIERS[after].name}`, '📉');
  emit('rep');
}

// Etiquetas para la confianza (0-100) y la adicción (0-1) de cada cliente.
export function trustLabel(v) {
  return v < 20 ? 'Desconfía' : v < 40 ? 'Neutral' : v < 60 ? 'Le caes bien' : v < 80 ? 'Confía en ti' : 'Fiel';
}
export function addictionLabel(v) {
  return v < 0.1 ? 'Ninguna' : v < 0.3 ? 'Leve' : v < 0.55 ? 'Moderada' : v < 0.8 ? 'Alta' : 'Muy alta';
}

// ------------------------------------------------------------------
//  Clientes
// ------------------------------------------------------------------
export function customer(id) {
  return (G.state.customers[id] ||= { unlocked: false, affinity: 20, addiction: 0, sampleDay: 0, deals: 0 });
}
const personOf = (id) => PEOPLE.find((p) => p.id === id);

export function unlockStartingCustomers() {
  for (const id of STARTING_CUSTOMERS) {
    const c = customer(id);
    c.unlocked = true;
    if (!G.state.contacts.includes(id)) G.state.contacts.push(id);
  }
}

export function prefMatches(person, prod) {
  return prod.effects.filter((e) => person.prefs.includes(e)).length;
}

// Hasta qué múltiplo del valor de mercado está dispuesto a pagar un cliente.
export function priceTolerance(id) {
  const c = customer(id);
  return 1.05 + c.affinity / 220 + c.addiction * 0.55 + (G.state.rep || 0) / 450;
}
// Probabilidad (0-1) de que un cliente acepte pagar `unit` por unidad de un producto.
// Curva suave: barato casi siempre sí; muy por encima de su tolerancia casi nunca.
export function acceptChance(id, prod, unit) {
  const person = personOf(id);
  const v = prodValue(prod);
  const tol = priceTolerance(id) + (person ? prefMatches(person, prod) * 0.08 + styleBonus(person) : 0);
  return clamp(1 / (1 + Math.exp((unit / v - tol) * 7)), 0.02, 0.98);
}
// Probabilidad media de aceptación de un precio entre los clientes que ya tienes.
export function marketChance(prod, unit) {
  const known = PEOPLE.filter((p) => customer(p.id).unlocked);
  if (!known.length) return acceptChance('chema', prod, unit);
  return known.reduce((a, p) => a + acceptChance(p.id, prod, unit), 0) / known.length;
}
export function priceLabel(prod, unit) {
  const r = unit / prodValue(prod);
  return r < 0.85 ? 'Barato' : r < 1.15 ? 'Precio justo' : r < 1.5 ? 'Caro' : 'Abusivo';
}

// La adicción crece con lo que consume (más con productos con más efectos) y
// cada vez más despacio al acercarse al máximo.
export function addAddiction(c, units, prod) {
  c.addiction = clamp(c.addiction + units * (0.01 + prod.effects.length * 0.004) * (1 - c.addiction * 0.6), 0, 1);
}

function chooseProduct(person, c) {
  const list = Object.values(G.state.products).filter((p) => p.listed);
  let best = null, bestScore = -Infinity;
  for (const p of list) {
    const value = prodValue(p);
    const chance = acceptChance(person.id, p, p.price);
    if (chance < 0.3) continue; // demasiado caro para este cliente
    const score = prefMatches(person, p) * 2 + Math.random() * 1.5 + chance * 2 + (value / 200);
    if (score > bestScore) { bestScore = score; best = p; }
  }
  return best;
}

function spotFor(person) {
  const npc = G.npcs.find((n) => n.id === person.id);
  const base = npc ? npc.home : { x: 0, z: 0 };
  const sorted = [...G.world.spots].sort((a, b) => Math.hypot(a.x - base.x, a.z - base.z) - Math.hypot(b.x - base.x, b.z - base.z));
  return pick(sorted.slice(0, 3));
}

let dealSeq = 0;
function makeDeal(person, c, urgent = false) {
  const p = chooseProduct(person, c);
  if (!p) {
    if (Math.random() < 0.25 && Object.keys(G.state.products).length) sendMsg(person.id, 'Tus precios están por las nubes, tío. Avísame si los bajas.');
    return;
  }
  const budget = rand(person.budget[0], person.budget[1]) * (1 + c.addiction * 0.8 + c.affinity / 300);
  const maxQ = 3 + G.state.rank * 3 + Math.floor(c.affinity / 20) + Math.floor(c.addiction * 6);
  const qty = clamp(Math.floor(budget / p.price), 1, maxQ);
  const spot = spotFor(person);
  // envase preferido: los cristales solo van en bolsas Sweet Shards; los tarros
  // solo se piden si ya tienes con qué hacerlos
  const form = p.strain === 'shards' ? 'shards' : person.form === 'tarro' && !G.state.flags.jars ? 'bolsa' : person.form;
  const deal = {
    id: `d${Date.now().toString(36)}${dealSeq++}`, npc: person.id, product: p.id, qty, price: qty * p.price,
    spot: spot.id, status: 'offer', created: absNow(), expires: absNow() + 75, form,
  };
  G.state.deals.push(deal);
  const fm = ITEMS[person.form].form;
  const lines = urgent ? [
    `Tío, lo necesito ya. ${qty}× ${p.name}, te doy ${money(deal.price)}. En ${fm} si puede ser. ¿${spot.name}?`,
    `Llevo días sin nada y estoy fatal... ¿${qty} de ${p.name} por ${money(deal.price)}? Quedamos en ${spot.name}.`,
  ] : [
    `¿Me pasas ${qty} de ${p.name} por ${money(deal.price)}? Si puede ser en ${fm}, mejor. Podemos vernos en ${spot.name}.`,
    `Ey, necesito ${qty}× ${p.name} (me gusta en ${fm}). Te doy ${money(deal.price)}. ¿${spot.name}?`,
    `¿Tienes ${p.name}? Me llevo ${qty} por ${money(deal.price)}, en ${fm} si puedes. Quedamos en ${spot.name}.`,
  ];
  sendMsg(person.id, pick(lines), { deal: deal.id });
}

export function acceptDeal(deal, quiet = false) {
  if (deal.status !== 'offer') return;
  deal.status = 'accepted';
  deal.expires = absNow() + 240;
  const spot = G.world.spots.find((s) => s.id === deal.spot);
  if (!quiet) myMsg(deal.npc, 'Hecho. Voy para allá.');
  setTimeout(() => sendMsg(deal.npc, `Genial, te espero en ${spot.name}. No tardes más de 4 horas.`), 900);
  G.act.setWaypoint?.(spot.x, spot.z, CONTACTS[deal.npc].name);
  sfx('click');
}

export function rejectDeal(deal) {
  if (deal.status !== 'offer') return;
  deal.status = 'rejected';
  myMsg(deal.npc, 'Hoy no puedo, lo siento.');
  customer(deal.npc).affinity = Math.max(0, customer(deal.npc).affinity - 1);
}

// Contraoferta desde el móvil: el cliente acepta según su probabilidad para ese
// precio. Si dice que no, a veces mantiene su oferta y otras se va (como mucho 2 intentos).
export function negotiateDeal(deal, total) {
  if (deal.status !== 'offer') return null;
  const c = customer(deal.npc);
  const p = product(deal.product);
  total = Math.max(1, Math.round(total));
  deal.counters = (deal.counters || 0) + 1;
  myMsg(deal.npc, `¿Qué te parece ${money(total)}?`);
  if (total <= deal.price) {
    // rebajar siempre se acepta y gusta
    deal.price = total;
    c.affinity = clamp(c.affinity + 2, 0, 100);
    setTimeout(() => { sendMsg(deal.npc, '¡Anda, gracias! Trato hecho.'); acceptDeal(deal, true); }, 700);
    return true;
  }
  if (Math.random() < acceptChance(deal.npc, p, total / deal.qty)) {
    deal.price = total;
    setTimeout(() => { sendMsg(deal.npc, pick(['Vale, trato hecho.', 'Bueno... venga, acepto.', 'Está bien, pero que sea bueno.'])); acceptDeal(deal, true); }, 700);
    return true;
  }
  c.affinity = Math.max(0, c.affinity - 2);
  if (deal.counters >= 2 || Math.random() < 0.4) {
    deal.status = 'rejected';
    setTimeout(() => sendMsg(deal.npc, pick(['Paso, es demasiado caro.', 'Con esos precios me busco a otro.', 'Ni de broma. Otra vez será.'])), 700);
  } else {
    setTimeout(() => sendMsg(deal.npc, `Eso es mucho. Mi oferta sigue en pie: ${money(deal.price)}.`), 700);
  }
  return false;
}

// Entrega del pedido: `given` = [{id, p, q}] que salen del inventario.
export function completeDeal(deal, given) {
  const person = personOf(deal.npc);
  const c = customer(deal.npc);
  let units = 0, rightUnits = 0, likes = 0;
  for (const g of given) {
    const u = g.q * (ITEMS[g.id].units || 1);
    units += u;
    if (g.p === deal.product) rightUnits += u;
    likes = Math.max(likes, prefMatches(person, product(g.p)));
  }
  if (units < deal.qty) return { ok: false, msg: `Faltan ${deal.qty - units} unidades.` };
  if (rightUnits < deal.qty && likes === 0) return { ok: false, msg: 'Esto no es lo que pedí.' };
  for (const g of given) inv.remove(g.id, g.q, g.p);
  const formOk = deal.form && given.every((g) => g.id === deal.form);
  let pay = rightUnits >= deal.qty ? deal.price : Math.round(deal.price * 0.85);
  const jars = given.filter((g) => g.id === 'tarro').reduce((a, g) => a + g.q * 5, 0);
  // propina por el envase preferido, y un extra por la presentación en tarro
  const tip = (formOk ? Math.max(2, Math.round(pay * 0.1)) : 0) + Math.round(pay * 0.08 * Math.min(1, jars / Math.max(1, units)));
  pay += tip;
  const p = product(deal.product);
  const unit = deal.price / deal.qty;
  const satisfaction = clamp((rightUnits >= deal.qty ? 1 : 0.6) + prefMatches(person, p) * 0.15 + (prodValue(p) / unit - 1) * 0.5, 0, 2);
  deal.status = 'done';
  addMoney(pay);
  c.affinity = clamp(c.affinity + Math.round(3 + satisfaction * 5 + (formOk ? 3 : 0)), 0, 100);
  addAddiction(c, units, p);
  c.lastBuy = G.state.day;
  addRep(1 + satisfaction * 0.8);
  c.deals++;
  G.state.stats.deals++;
  G.state.today.deals++;
  G.state.stats.best = Math.max(G.state.stats.best, pay);
  addXP(pay / 3 + 6);
  sfx('cash');
  G.act.clearWaypoint?.();
  setTimeout(() => sendMsg(deal.npc, formOk ? `¡Y en ${ITEMS[deal.form].form}, como me gusta! Te he dejado ${money(tip)} de propina.` : pick(['Gracias, un placer.', 'Perfecto, como siempre.', 'Buen material. Hasta la próxima.', '¡Eres un crack!'])), 1500);
  // recomendaciones: a veces te pasa un contacto nuevo
  if (c.deals % 3 === 0) {
    const locked = PEOPLE.filter((x) => !customer(x.id).unlocked && !G.state.flags['ref_' + x.id]);
    if (locked.length) {
      const ref = pick(locked);
      G.state.flags['ref_' + ref.id] = true;
      setTimeout(() => sendMsg(deal.npc, `Por cierto, ${ref.name} anda buscando algo. Ofrécele una muestra si le ves.`), 4000);
    }
  }
  return { ok: true, pay, tip };
}

// Regalar producto (una unidad del montón elegido) a cualquier vecino.
// - Si aún no es cliente: puede engancharse y darte su número.
// - Si ya lo es: gana confianza y algo de adicción.
// En ambos casos sube un poco tu reputación. Una vez al día por persona.
export const GIFTABLE = ['cogollo', 'bolsa', 'tarro', 'cristal', 'shards'];
export function canGift(npc) { return customer(npc.id).sampleDay !== G.state.day; }
export function giveSample(npc, slot = inv.held()) {
  if (!slot || !GIFTABLE.includes(slot.id)) return G.act.toast('Elige producto para regalar.');
  const c = customer(npc.id);
  if (!canGift(npc)) return G.act.toast(`${npc.person.name} ya ha probado algo hoy.`);
  const p = product(slot.p);
  const units = ITEMS[slot.id].units || 1;
  const spec = { id: slot.id, p: slot.p };
  inv.remove(slot.id, 1, slot.p);
  c.sampleDay = G.state.day;
  npc.playExchange(spec, false);
  G.player.vm.give();
  const m = prefMatches(npc.person, p);
  addAddiction(c, units, p);
  const first = npc.person.name.split(' ')[0];
  if (c.unlocked) {
    const gain = 5 + m * 3 + Math.min(4, units - 1);
    c.affinity = clamp(c.affinity + gain, 0, 100);
    addRep(1);
    G.act.toast(`${first}: «${pick(['¡Qué detalle! Esto no se olvida.', 'Invita la casa, ¿eh? Me caes bien.', 'Gracias, tío. Te debo una.'])}» (+${gain} confianza)`, '🎁');
    sfx('cash');
    return true;
  }
  const ref = G.state.flags['ref_' + npc.id] ? 0.2 : 0;
  const chance = clamp(0.28 + m * 0.2 + G.state.rank * 0.04 + prodValue(p) / 400 + ref + (G.state.rep || 0) / 250 - npc.person.std * 0.08, 0.1, 0.95);
  if (Math.random() < chance) {
    c.unlocked = true;
    c.affinity = 30 + m * 10;
    if (!G.state.contacts.includes(npc.id)) G.state.contacts.push(npc.id);
    G.act.toast(`${npc.person.name}: «¡Uf, esto está buenísimo! Guárdame tu número.»`, '🤝');
    setTimeout(() => sendMsg(npc.id, 'Soy yo, el de la muestra. Escríbeme cuando tengas más.'), 1200);
    addXP(25);
    addRep(2);
    sfx('cash');
    G.act.flag('sampleWon');
    return true;
  }
  addRep(0.5);
  G.act.toast(`${npc.person.name}: «Mmm... no es para mí.»`, '😕');
  sfx('error');
  return false;
}

// Venta en mano a un cliente que ya conoces (sin pedido previo). Una vez al día.
// `slot` = montón del inventario, `qty` = paquetes, `unit` = precio por unidad.
export function saleChance(npc, slot, unit) {
  const c = customer(npc.id);
  const base = acceptChance(npc.id, product(slot.p), unit);
  return clamp(base * (0.45 + c.addiction * 0.5 + c.affinity / 250), 0.02, 0.95);
}
export function saleBudget(npc) {
  const c = customer(npc.id);
  return Math.round(npc.person.budget[1] * (1 + c.addiction * 0.8 + c.affinity / 300));
}
export function directSale(npc, slot, qty, unit) {
  const c = customer(npc.id);
  const first = npc.person.name.split(' ')[0];
  if (!c.unlocked) return { ok: false, msg: 'Aún no te conoce: regálale una muestra primero.' };
  if (c.walkDay === G.state.day) return { ok: false, msg: `${first} ya te ha comprado hoy.` };
  if (inv.count(slot.id, slot.p) < qty) return { ok: false, msg: 'No llevas tanto.' };
  const p = product(slot.p);
  const units = qty * (ITEMS[slot.id].units || 1);
  const total = Math.round(units * unit);
  if (total > saleBudget(npc)) return { ok: false, msg: `${first}: «No llevo tanto dinero encima. Como mucho ${money(saleBudget(npc))}.»` };
  c.walkDay = G.state.day;
  if (Math.random() >= saleChance(npc, slot, unit)) {
    c.affinity = Math.max(0, c.affinity - 1);
    return { ok: true, accepted: false, msg: `${first}: «${pick(['Uf, a ese precio no.', 'Hoy paso, gracias.', 'Demasiado caro para mí.'])}»` };
  }
  inv.remove(slot.id, qty, slot.p);
  addMoney(total);
  c.affinity = clamp(c.affinity + 2 + prefMatches(npc.person, p), 0, 100);
  addAddiction(c, units, p);
  c.lastBuy = G.state.day;
  c.deals++;
  G.state.stats.deals++;
  G.state.today.deals++;
  G.state.stats.best = Math.max(G.state.stats.best, total);
  addXP(total / 3 + 4);
  addRep(0.6);
  sfx('cash');
  return { ok: true, accepted: true, total, msg: `${first}: «${pick(['Trato hecho.', 'Perfecto, justo lo que necesitaba.', 'Venga, me lo quedo.'])}»` };
}

// ------------------------------------------------------------------
//  Reloj económico: pedidos de clientes, caducidad, entregas, alquiler
// ------------------------------------------------------------------
export function onHour(hour) {
  const s = G.state;
  if (hour >= 8 && hour <= 20 && Object.keys(s.products).length) {
    for (const person of PEOPLE) {
      const c = customer(person.id);
      if (!c.unlocked) continue;
      if (s.deals.some((d) => d.npc === person.id && (d.status === 'offer' || d.status === 'accepted'))) continue;
      const p = 0.05 + c.addiction * 0.14 + c.affinity / 1200 + (s.rep || 0) / 1500;
      if (Math.random() < p) makeDeal(person, c);
    }
  }
  // cada mañana: la adicción baja si no compran y los muy enganchados te escriben con mono
  if (hour === 7) {
    for (const person of PEOPLE) {
      const c = customer(person.id);
      if (!c.unlocked || c.addiction <= 0) continue;
      const days = s.day - (c.lastBuy || 0);
      if (days >= 1) c.addiction = Math.max(0, c.addiction - 0.035);
      const busy = s.deals.some((d) => d.npc === person.id && (d.status === 'offer' || d.status === 'accepted'));
      if (!busy && days >= 2 && c.addiction > 0.5 && Math.random() < c.addiction && Object.keys(s.products).length) makeDeal(person, c, true);
    }
  }
  if (hour === 7 && s.day % 7 === 1 && s.day > 1 && s.rentPaidWeek < s.day) {
    s.rentPaidWeek = s.day;
    addMoney(-100);
    sendMsg('motel', 'Te he cobrado el alquiler semanal de la nave: $100. Que vaya bien el negocio.');
  }
}

export function onMinute() {
  const now = absNow();
  for (const d of G.state.deals) {
    if (d.status === 'offer' && now > d.expires) d.status = 'expired';
    if (d.status === 'accepted' && now > d.expires) {
      d.status = 'failed';
      const c = customer(d.npc);
      c.affinity = Math.max(0, c.affinity - 12);
      addRep(-3);
      sendMsg(d.npc, pick(['Te he esperado una eternidad. Paso de ti.', 'Me has dejado tirado... no me hace gracia.', 'Ya no hace falta, gracias por nada.']));
      G.act.clearWaypoint?.();
    }
  }
  if (G.state.deals.length > 60) G.state.deals = G.state.deals.filter((d) => d.status === 'offer' || d.status === 'accepted');
  for (const o of G.state.orders) {
    if (!o.notified && now >= o.ready) {
      o.notified = true;
      sendMsg('rubio', 'Tu pedido ya está en el contenedor verde del polígono. Que no te vea nadie.');
    }
  }
}

// ------------------------------------------------------------------
//  Proveedor de semillas
// ------------------------------------------------------------------
export function orderSeeds(strain, qty) {
  const st = STRAINS[strain];
  const cost = st.seed * qty;
  const h = G.state.minute / 60;
  if (h < 7 || h >= 23) return { ok: false, msg: 'Rubio no contesta a estas horas (de 7:00 a 23:00).' };
  if (G.state.money < cost) return { ok: false, msg: 'No tienes suficiente dinero.' };
  addMoney(-cost);
  G.state.orders.push({ items: [{ id: 'semilla', p: strain, q: qty }], ready: absNow() + 45 });
  myMsg('rubio', `Quiero ${qty} semillas de ${st.name}.`);
  setTimeout(() => sendMsg('rubio', `Hecho. ${money(cost)} cobrados. En menos de una hora lo tienes en el contenedor verde del polígono.`), 800);
  G.act.setWaypoint?.(G.world.pois.deadDrop.x, G.world.pois.deadDrop.z, 'Contenedor de entregas');
  return { ok: true };
}

export function deadDropActions() {
  const now = absNow();
  const ready = G.state.orders.filter((o) => now >= o.ready);
  if (!ready.length) {
    const pending = G.state.orders.length;
    return [{ label: pending ? 'Contenedor (tu pedido aún no ha llegado)' : 'Contenedor de basura', fn: () => G.act.toast(pending ? 'Vuelve en un rato.' : 'Solo hay basura.') }];
  }
  return [{
    label: 'Recoger pedido',
    fn: () => {
      for (const o of ready) {
        o.items = o.items.filter((it) => { const left = inv.add(it.id, it.q, it.p); it.q = left; return left > 0; });
      }
      G.state.orders = G.state.orders.filter((o) => o.items.length);
      if (G.state.orders.length) G.act.toast('No te cabe todo. Lo demás sigue en el contenedor.');
      else G.act.toast('Has recogido tu pedido.', '📦');
      sfx('pop');
      G.act.clearWaypoint?.();
      save();
    },
  }];
}

export { EFFECTS };
