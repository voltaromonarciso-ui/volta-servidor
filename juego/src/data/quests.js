import { G } from '../game.js';

const pots = () => G.state.objects.filter((o) => o.type === 'pot');
const piso = () => G.state.home === 'piso';
// a dónde ir en cada misión (la flecha del HUD): tu casa, la ferretería, el contenedor…
const P = (k) => G.world?.pois?.[k];
const home = () => { const h = G.world?.props?.[G.state.home]; return h ? { x: (h.x0 + h.x1) / 2, z: (h.z0 + h.z1) / 2, label: piso() ? 'Tu piso' : 'Tu nave', inside: h } : null; };
const at = (k, label) => () => (P(k) ? { ...P(k), label } : null);
const count = (id) => G.state.inv.reduce((a, s) => a + (s && s.id === id ? s.q : 0), 0);

// Objetivos de la historia principal (guían al jugador como un tutorial).
export const QUESTS = [
  { title: 'Un nuevo comienzo', target: home, get desc() { return piso() ? 'Abre la caja de Leo dentro de tu piso (la llevas en la mochila).' : 'Lleva la caja de Leo al interior de tu nave y ábrela.'; }, done: () => G.state.flags.boxOpened, xp: 5 },
  { title: 'Tu primera maceta', target: home, get desc() { return `Con la maceta en la mano, mira al suelo ${piso() ? 'del piso (el hueco libre del salón)' : 'de la nave'} y colócala.`; }, done: () => pots().length > 0, xp: 5 },
  { title: 'Material de cultivo', target: at('ferreteria', 'Ferretería'), desc: 'Compra un saco de tierra en la Ferretería Tornillo (al este de la plaza).', done: () => count('tierra') + count('tierra_plus') > 0 || pots().some((p) => p.data.soil), xp: 10 },
  { title: 'Semillas', target: () => (G.state.orders.length ? at('deadDrop', 'Contenedor verde')() : null), desc: 'Abre el móvil, pide semillas a Rubio en la app «Proveedor» y recógelas en el contenedor verde del polígono.', done: () => count('semilla') > 0 || pots().some((p) => p.data.strain), xp: 10 },
  { title: 'Siembra', target: home, desc: 'Con la tierra en la mano, llena la maceta. Después coge la semilla y plántala.', done: () => pots().some((p) => p.data.strain), xp: 10 },
  { title: 'Que no le falte agua', target: home, get desc() { return `Coge la regadera y riega la planta. Si está vacía, rellénala en el fregadero ${piso() ? 'de la cocina' : 'de la nave'}.`; }, done: () => G.state.flags.watered, xp: 10 },
  { title: 'Paciencia', target: home, get desc() { return `Espera a que la planta crezca y cosecha. Dormir en ${piso() ? 'tu cama' : 'el catre de la nave'} (desde las 18:00) adelanta el tiempo. ¡No olvides regarla!`; }, done: () => G.state.flags.harvested, xp: 20 },
  { title: 'Empaquetado', target: at('ferreteria', 'Ferretería'), desc: 'Compra sobres vacíos y una mesa de empaquetado en la ferretería, colócala y envasa tus cogollos en sobres.', done: () => G.state.flags.packed, xp: 20 },
  { title: 'Primer trato', desc: 'Espera un mensaje de un cliente (Chema o Nuria), acepta el pedido y entrégaselo en persona.', done: () => G.state.stats.deals >= 1, xp: 30 },
  { title: 'Correr la voz', desc: 'Consigue un cliente nuevo regalando una muestra a un vecino (coge el producto en la mano y habla con él).', done: () => G.state.flags.sampleWon, xp: 30 },
  { title: 'Cristales dulces', desc: 'Alcanza el rango Trapichero, compra un hornillo de cristalización y cocina tu primera tanda de Sweet Shards.', done: () => G.state.flags.cooked, xp: 50 },
  { title: 'Casa propia', target: at('bungalow', 'Bungalow'), desc: 'Ahorra y compra el bungalow del Barrio Alto (oeste). Más espacio para cultivar.', done: () => G.state.props.bungalow, xp: 80 },
  { title: 'Imperio', desc: 'Gana $10.000 en total vendiendo tu producto.', done: () => G.state.stats.earned >= 10000, xp: 200 },
];
