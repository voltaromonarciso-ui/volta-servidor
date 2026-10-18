// Catálogo de objetos. Los productos (cogollos, bolsitas, tarros) llevan además
// un identificador de producto `p` en cada hueco del inventario.
export const ITEMS = {
  // Producto
  // un hueco de semillas es un sobre con hasta 10; al plantar la última queda el sobre vacío
  semilla:   { name: 'Sobre de semillas', icon: '🌱', stack: 10, illegal: true, color: '#8a6a3b', desc: 'Sobre con hasta 10 semillas. Al plantar la última te queda el sobre vacío.' },
  sobre_vacio:{ name: 'Sobre de semillas vacío', icon: '✉️', stack: 10, color: '#b8a888', desc: 'Ya no le quedan semillas: no sirve para plantar. Si recibes semillas de la misma variedad se vuelve a llenar; si no, puedes tirarlo.' },
  cogollo:   { name: 'Cogollos de Lumaflor', icon: '🌿', stack: 30, illegal: true, product: true, units: 1, color: '#5cbf3a', desc: 'Sueltos no los compra nadie: envásalos en sobres o tarros.' },
  bolsa:     { name: 'Sobre', icon: '🛍️', stack: 30, illegal: true, product: true, units: 1, packed: true, form: 'sobres', color: '#7ad06a', desc: 'Bolsita zip con 1 unidad.' },
  tarro:     { name: 'Tarro', icon: '🫙', stack: 10, illegal: true, product: true, units: 5, packed: true, form: 'tarros', color: '#9bd0e6', desc: 'Tarro de cristal con 5 unidades. Los clientes lo pagan mejor.' },
  cristal:   { name: 'Cristales Sweet', icon: '💎', stack: 30, illegal: true, product: true, units: 1, color: '#b06cff', desc: 'Cristales sueltos: envásalos en bolsas Sweet Shards.' },
  shards:    { name: 'Sweet Shards', icon: '🍬', stack: 30, illegal: true, product: true, units: 1, packed: true, form: 'bolsas Sweet Shards', color: '#c58bff', desc: 'Bolsa de cristales de colores.' },

  caja:      { name: 'Caja de Leo', icon: '📦', stack: 1, desc: 'Ábrela dentro de tu nave.' },

  // Ferretería
  maceta:    { name: 'Maceta', icon: '🪴', stack: 5, price: 30, place: 'pot', desc: 'Para cultivar una planta.' },
  tierra:    { name: 'Saco de tierra', icon: '🟫', stack: 10, price: 10, desc: 'Llena una maceta. Calidad normal.' },
  tierra_plus:{ name: 'Tierra abonada', icon: '🟤', stack: 10, price: 30, rank: 1, desc: '+40% de cosecha y crece más rápido.' },
  fertil:    { name: 'Fertilizante', icon: '🧴', stack: 10, price: 15, rank: 1, desc: 'Añádelo a una planta: +3 cogollos.' },
  regadera:  { name: 'Regadera', icon: '🚿', stack: 1, price: 15, tool: true, desc: 'Riega tus plantas. Rellénala en un grifo.' },
  bolsita:   { name: 'Sobres zip vacíos', icon: '📨', stack: 50, price: 1, desc: 'Para envasar 1 cogollo en un sobre.' },
  tarro_v:   { name: 'Tarros vacíos', icon: '🫙', stack: 20, price: 4, rank: 1, desc: 'Para envasar 5 cogollos (necesitas la envasadora de tarros).' },
  bolsa_ss:  { name: 'Bolsas Sweet Shards', icon: '🎴', stack: 50, price: 2, rank: 2, desc: 'Para envasar cristales en la mesa de empaquetado.' },
  mesa_emp:  { name: 'Mesa de empaquetado', icon: '📦', stack: 1, price: 80, place: 'packer', desc: 'Envasa cogollos en sobres (y cristales en bolsas Sweet Shards).' },
  envasadora:{ name: 'Envasadora de tarros', icon: '🏭', stack: 1, price: 250, rank: 1, place: 'jarpacker', desc: 'Llena tarros de cristal con 5 cogollos.' },
  hornillo:  { name: 'Hornillo de cristalización', icon: '🔥', stack: 1, price: 600, rank: 2, place: 'stove', desc: 'Cocina azúcar, colorante y catalizador para hacer cristales.' },
  catalizador:{ name: 'Catalizador cristalino', icon: '🧪', stack: 20, price: 12, rank: 2, desc: 'Ingrediente para el hornillo (1 por tanda).' },
  azucar:    { name: 'Azúcar glas', icon: '🧂', stack: 20, price: 3, rank: 2, desc: 'Ingrediente para el hornillo (2 por tanda).' },
  colorante: { name: 'Colorante alimentario', icon: '🎨', stack: 20, price: 4, rank: 2, desc: 'Ingrediente para el hornillo (1 por tanda).' },
  lampara:   { name: 'Lámpara de cultivo', icon: '💡', stack: 2, price: 150, rank: 1, place: 'lamp', desc: 'Acelera ×1.5 las plantas cercanas.' },
  estante:   { name: 'Estantería', icon: '🗄️', stack: 2, price: 60, place: 'shelf', desc: 'Guarda 12 huecos de objetos.' },
  // Muebles Nido: cada mueble hace algo de verdad
  cama:      { name: 'Cama buena', icon: '🛏️', stack: 1, price: 380, place: 'bed', desc: 'Duerme en ella (desde las 18:00) y te despiertas a las 6:00 en vez de a las 7:00: una hora más de día.' },
  armario:   { name: 'Armario de almacenaje', icon: '🚪', stack: 1, price: 320, place: 'locker', desc: 'Guarda 24 huecos de objetos, el doble que una estantería.' },
  caja_fuerte:{ name: 'Caja fuerte', icon: '🔒', stack: 1, price: 450, place: 'safe', desc: 'Guarda dinero en casa. Si te detienen, la multa solo sale de lo que llevas encima.' },
  humidificador:{ name: 'Humidificador', icon: '💨', stack: 2, price: 220, place: 'humid', desc: 'Las macetas a menos de 2,5 m pierden el agua un 40 % más despacio.' },
};

export const STRAINS = {
  brisa:  { name: 'Lumaflor Verde',    seed: 30, base: 35, effect: 'relajado', color: 0x5cbf3a, speed: 1.0,  yield: [8, 11],  rank: 0 },
  niebla: { name: 'Lumaflor Violeta', seed: 45, base: 48, effect: 'sueno',    color: 0x8b5cc7, speed: 0.9,  yield: [8, 12],  rank: 2 },
  trueno: { name: 'Lumaflor Dorada',  seed: 65, base: 62, effect: 'energia',  color: 0xd8b23a, speed: 0.8,  yield: [9, 12],  rank: 3 },
  marea:  { name: 'Lumaflor Azul',    seed: 90, base: 80, effect: 'enfoque',  color: 0x3aa0d8, speed: 0.75, yield: [10, 13], rank: 4 },
  // cristales: no se cultivan, se cocinan en el hornillo
  shards: { name: 'Sweet Shards',     seed: 0,  base: 70, effect: 'euforia',  color: 0xb06cff, rank: 2, noSeed: true },
};

export const SHOPS = {
  ferreteria: {
    name: 'Ferretería Tornillo',
    open: [7, 21],
    stock: ['maceta', 'tierra', 'tierra_plus', 'fertil', 'regadera', 'bolsita', 'mesa_emp', 'tarro_v', 'envasadora', 'estante', 'lampara', 'bolsa_ss', 'catalizador', 'hornillo'],
  },
  muebles: {
    name: 'Muebles Nido',
    open: [10, 21],
    stock: ['cama', 'armario', 'caja_fuerte', 'humidificador', 'estante'],
    greet: ['Bienvenido a Muebles Nido. Te lo llevas hoy mismo.', 'Todo lo que ves sirve para algo, nada de adornos.', '¿Amueblando la nave? Mira el catálogo.'],
  },
  gasolinera: {
    name: 'Gas&Go 24h',
    open: [0, 24],
    stock: ['bolsita', 'azucar', 'colorante'],
  },
};

export const RANKS = [
  { name: 'Novato', xp: 0 },
  { name: 'Buscavidas', xp: 120 },
  { name: 'Trapichero', xp: 400 },
  { name: 'Distribuidor', xp: 900 },
  { name: 'Mayorista', xp: 1800 },
  { name: 'Capo', xp: 3200 },
  { name: 'Leyenda de Puerto Lomas', xp: 5500 },
];

// Envasado: de qué se hace cada forma y en qué mesa (lo usan el jugador y los empleados).
export const FORMS = [
  { id: 'bolsa', src: 'cogollo', pack: 'bolsita', per: 1, at: 'packer' },
  { id: 'shards', src: 'cristal', pack: 'bolsa_ss', per: 1, at: 'packer' },
  { id: 'tarro', src: 'cogollo', pack: 'tarro_v', per: 5, at: 'jarpacker' },
];
