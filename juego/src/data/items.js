// Catálogo de objetos. Los productos (cogollos, bolsitas, tarros) llevan además
// un identificador de producto `p` en cada hueco del inventario.
export const ITEMS = {
  // Producto
  semilla:   { name: 'Semilla', icon: '🌰', stack: 10, illegal: true, color: '#8a6a3b' },
  cogollo:   { name: 'Cogollos', icon: '🥦', stack: 30, illegal: true, product: true, units: 1, color: '#5cbf3a' },
  bolsa:     { name: 'Bolsita', icon: '🍃', stack: 30, illegal: true, product: true, units: 1, packed: true, color: '#7ad06a' },
  tarro:     { name: 'Tarro', icon: '🫙', stack: 10, illegal: true, product: true, units: 5, packed: true, color: '#9bd0e6' },

  // Ferretería
  maceta:    { name: 'Maceta', icon: '🪴', stack: 5, price: 30, place: 'pot', desc: 'Para cultivar una planta.' },
  tierra:    { name: 'Saco de tierra', icon: '🟫', stack: 10, price: 10, desc: 'Llena una maceta. Calidad normal.' },
  tierra_plus:{ name: 'Tierra abonada', icon: '🟤', stack: 10, price: 30, rank: 1, desc: '+40% de cosecha y crece más rápido.' },
  fertil:    { name: 'Fertilizante', icon: '🧪', stack: 10, price: 15, rank: 1, desc: 'Añádelo a una planta: +3 cogollos.' },
  regadera:  { name: 'Regadera', icon: '🚿', stack: 1, price: 15, tool: true, desc: 'Riega tus plantas. Rellénala en un grifo.' },
  bolsita:   { name: 'Bolsitas vacías', icon: '🛍️', stack: 50, price: 1, desc: 'Para empaquetar 1 unidad.' },
  tarro_v:   { name: 'Tarro vacío', icon: '🫙', stack: 20, price: 3, desc: 'Para empaquetar 5 unidades.' },
  mesa_emp:  { name: 'Mesa de empaquetado', icon: '📦', stack: 1, price: 80, place: 'packer', desc: 'Empaqueta cogollos en bolsitas o tarros.' },
  lampara:   { name: 'Lámpara de cultivo', icon: '💡', stack: 2, price: 150, rank: 1, place: 'lamp', desc: 'Acelera ×1.5 las plantas cercanas.' },
  estante:   { name: 'Estantería', icon: '🗄️', stack: 2, price: 60, place: 'shelf', desc: 'Guarda 12 huecos de objetos.' },
  mezcladora:{ name: 'Mezcladora', icon: '⚗️', stack: 1, price: 400, rank: 2, place: 'mixer', desc: 'Mezcla producto con ingredientes para crear nuevos efectos.' },
};

export const STRAINS = {
  brisa:  { name: 'Brisa Verde',    seed: 30, base: 35, effect: 'relajado', color: 0x5cbf3a, speed: 1.0,  yield: [8, 11],  rank: 0 },
  niebla: { name: 'Niebla Púrpura', seed: 45, base: 48, effect: 'sueno',    color: 0x8b5cc7, speed: 0.9,  yield: [8, 12],  rank: 2 },
  trueno: { name: 'Trueno Dorado',  seed: 65, base: 62, effect: 'energia',  color: 0xd8b23a, speed: 0.8,  yield: [9, 12],  rank: 3 },
  marea:  { name: 'Marea Azul',     seed: 90, base: 80, effect: 'enfoque',  color: 0x3aa0d8, speed: 0.75, yield: [10, 13], rank: 4 },
};

export const SHOPS = {
  ferreteria: {
    name: 'Ferretería Tornillo',
    open: [7, 21],
    stock: ['maceta', 'tierra', 'tierra_plus', 'fertil', 'regadera', 'bolsita', 'tarro_v', 'mesa_emp', 'estante', 'lampara', 'mezcladora'],
  },
  gasolinera: {
    name: 'Gas&Go 24h',
    open: [0, 24],
    stock: ['energetica', 'cafe', 'platano', 'chicle', 'ibuprofeno', 'leche', 'guindilla', 'menta', 'purpurina', 'batido', 'pila', 'miel'],
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
