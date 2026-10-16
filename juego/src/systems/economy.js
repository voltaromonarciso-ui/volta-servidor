import { G, rand, randi, pick, clamp, money, emit } from '../game.js';
import { ITEMS, STRAINS, RANKS } from '../data/items.js';
import { EFFECTS, productValue, productKey, mixEffects, randomProductName } from '../data/effects.js';
import { PEOPLE, STARTING_CUSTOMERS } from '../data/people.js';
import { inv, absNow, save } from '../core/state.js';
import { sfx } from '../core/audio.js';

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

export function previewMix(pid, ingId) {
  const p = product(pid);
  const effects = mixEffects(p.effects, ingId);
  const id = productKey(p.strain, effects);
  return { id, effects, value: productValue(p.strain, effects), exists: !!G.state.products[id] || id === pid };
}

export function registerMix(pid, ingId, name) {
  const p = product(pid);
  const r = previewMix(pid, ingId);
  if (!G.state.products[r.id]) {
    G.state.products[r.id] = { id: r.id, name: name || randomProductName(), strain: p.strain, effects: r.effects, price: r.value, listed: true };
  }
  return r.id;
}

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
      ...Object.values(STRAINS).filter((st) => st.rank === s.rank).map((st) => 'Semillas de ' + st.name),
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

function prefMatches(person, prod) {
  return prod.effects.filter((e) => person.prefs.includes(e)).length;
}

function chooseProduct(person, c) {
  const list = Object.values(G.state.products).filter((p) => p.listed);
  let best = null, bestScore = -Infinity;
  for (const p of list) {
    const value = prodValue(p);
    const tolerance = 1.2 + c.affinity / 250 + c.addiction * 0.25;
    if (p.price > value * tolerance) continue;
    const score = prefMatches(person, p) * 2 + Math.random() * 1.5 - (p.price / value) + (value / 200);
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
function makeDeal(person, c) {
  const p = chooseProduct(person, c);
  if (!p) {
    if (Math.random() < 0.25 && Object.keys(G.state.products).length) sendMsg(person.id, 'Tus precios están por las nubes, tío. Avísame si los bajas.');
    return;
  }
  const budget = rand(person.budget[0], person.budget[1]) * (1 + c.addiction * 0.6 + c.affinity / 300);
  const maxQ = 3 + G.state.rank * 3 + Math.floor(c.affinity / 20);
  const qty = clamp(Math.floor(budget / p.price), 1, maxQ);
  const spot = spotFor(person);
  const deal = {
    id: `d${Date.now().toString(36)}${dealSeq++}`, npc: person.id, product: p.id, qty, price: qty * p.price,
    spot: spot.id, status: 'offer', created: absNow(), expires: absNow() + 75,
  };
  G.state.deals.push(deal);
  const lines = [
    `¿Me pasas ${qty} de ${p.name} por ${money(deal.price)}? Podemos vernos en ${spot.name}.`,
    `Ey, necesito ${qty}× ${p.name}. Te doy ${money(deal.price)}. ¿${spot.name}?`,
    `¿Tienes ${p.name}? Me llevo ${qty} por ${money(deal.price)}. Quedamos en ${spot.name}.`,
  ];
  sendMsg(person.id, pick(lines), { deal: deal.id });
}

export function acceptDeal(deal) {
  if (deal.status !== 'offer') return;
  deal.status = 'accepted';
  deal.expires = absNow() + 240;
  const spot = G.world.spots.find((s) => s.id === deal.spot);
  myMsg(deal.npc, 'Hecho. Voy para allá.');
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

export function counterDeal(deal) {
  if (deal.status !== 'offer') return;
  const c = customer(deal.npc);
  const newPrice = Math.round(deal.price * 1.2);
  myMsg(deal.npc, `Te lo dejo en ${money(newPrice)}.`);
  const chance = 0.35 + c.affinity / 200 + c.addiction * 0.3;
  if (Math.random() < chance) {
    deal.price = newPrice;
    setTimeout(() => { sendMsg(deal.npc, 'Vale, trato hecho.'); acceptDeal(deal); }, 700);
  } else {
    deal.status = 'rejected';
    c.affinity = Math.max(0, c.affinity - 3);
    setTimeout(() => sendMsg(deal.npc, 'Paso, es demasiado caro.'), 700);
  }
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
  const pay = rightUnits >= deal.qty ? deal.price : Math.round(deal.price * 0.85);
  const p = product(deal.product);
  const satisfaction = (rightUnits >= deal.qty ? 1 : 0.6) + prefMatches(person, p) * 0.15 + (prodValue(p) / p.price - 1) * 0.5;
  deal.status = 'done';
  addMoney(pay);
  c.affinity = clamp(c.affinity + Math.round(4 + satisfaction * 6), 0, 100);
  c.addiction = clamp(c.addiction + 0.06 + p.effects.length * 0.01, 0, 1);
  c.deals++;
  G.state.stats.deals++;
  G.state.today.deals++;
  G.state.stats.best = Math.max(G.state.stats.best, pay);
  addXP(pay / 3 + 6);
  sfx('cash');
  G.act.clearWaypoint?.();
  setTimeout(() => sendMsg(deal.npc, pick(['Gracias, un placer.', 'Perfecto, como siempre.', 'Buen material. Hasta la próxima.', '¡Eres un crack!'])), 1500);
  // recomendaciones: a veces te pasa un contacto nuevo
  if (c.deals % 3 === 0) {
    const locked = PEOPLE.filter((x) => !customer(x.id).unlocked && !G.state.flags['ref_' + x.id]);
    if (locked.length) {
      const ref = pick(locked);
      G.state.flags['ref_' + ref.id] = true;
      setTimeout(() => sendMsg(deal.npc, `Por cierto, ${ref.name} anda buscando algo. Ofrécele una muestra si le ves.`), 4000);
    }
  }
  return { ok: true, pay };
}

export function giveSample(npc) {
  const held = inv.held();
  if (!held || !['cogollo', 'bolsa'].includes(held.id)) return G.act.toast('Coge en la mano un cogollo o una bolsita para regalar una muestra.');
  const c = customer(npc.id);
  if (c.sampleDay === G.state.day) return G.act.toast(`${npc.person.name} ya ha probado algo hoy.`);
  const p = product(held.p);
  inv.remove(held.id, 1, held.p);
  c.sampleDay = G.state.day;
  const m = prefMatches(npc.person, p);
  const ref = G.state.flags['ref_' + npc.id] ? 0.2 : 0;
  const chance = clamp(0.28 + m * 0.2 + G.state.rank * 0.04 + prodValue(p) / 400 + ref - npc.person.std * 0.08, 0.1, 0.95);
  npc.talk(4);
  G.player.use();
  if (Math.random() < chance) {
    c.unlocked = true;
    c.affinity = 30 + m * 10;
    G.act.toast(`${npc.person.name}: «¡Uf, esto está buenísimo! Guárdame tu número.»`, '🤝');
    setTimeout(() => sendMsg(npc.id, 'Soy yo, el de la muestra. Escríbeme cuando tengas más.'), 1200);
    addXP(25);
    sfx('cash');
    G.act.flag('sampleWon');
  } else {
    G.act.toast(`${npc.person.name}: «Mmm... no es para mí.»`, '😕');
    sfx('error');
  }
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
      const p = 0.05 + c.addiction * 0.12 + c.affinity / 1200;
      if (Math.random() < p) makeDeal(person, c);
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
