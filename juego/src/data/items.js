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
  shards:    { name: 'Bolsa de cristales', icon: '🍬', stack: 30, illegal: true, product: true, units: 1, packed: true, form: 'bolsas de cristales', color: '#5ab4ff', desc: 'Bolsa zip con cristales azules.' },

  fardo:     { name: 'Fardo del cártel', icon: '📦', stack: 12, illegal: true, color: '#8a6a3b', desc: 'Mercancía del jefe. Llévala al punto de entrega antes de que acabe el plazo.' },
  alijo:     { name: 'Alijo', icon: '🧳', stack: 1, illegal: true, color: '#3b4a5a', desc: 'El alijo del puerto. Llévaselo al jefe a El Cartel.' },
  // Drogas nuevas (todo inventado): polvo de la hoja de Nevada, pastillas de polvo y
  // aglutinante, y extracto de cogollos con disolvente. Lo suelto se envasa en su estación
  // o en la empacadora avanzada.
  hoja:      { name: 'Hojas de Nevada', icon: '🍃', stack: 40, illegal: true, color: '#9bc7a0', desc: 'Hojas de la planta de Nevada. En la mesa de polvos, con reactivo, se convierten en polvo.' },
  polvo:     { name: 'Polvo Nevado', icon: '🧂', stack: 30, illegal: true, product: true, units: 1, color: '#f2f2f2', desc: 'Polvo suelto: envásalo en sobres o en viales.' },
  pastilla:  { name: 'Pastillas', icon: '💊', stack: 60, illegal: true, product: true, units: 1, color: '#2fbf9a', desc: 'Pastillas sueltas: envásalas en blísteres o frascos.' },
  extracto:  { name: 'Extracto', icon: '🧪', stack: 20, illegal: true, product: true, units: 1, color: '#b48cf0', desc: 'Extracto líquido: envásalo en goteros.' },
  tarro_cr:  { name: 'Tarro de cristales', icon: '🫙', stack: 10, illegal: true, product: true, units: 5, packed: true, form: 'tarros de cristales', color: '#5ab4ff', desc: 'Tarro con 5 cristales. Se paga mejor que la bolsa.' },
  sobre_polvo:{ name: 'Sobre de polvo', icon: '✉️', stack: 30, illegal: true, product: true, units: 1, packed: true, form: 'sobres', color: '#f2f2f2', desc: 'Bolsita zip con 1 unidad de polvo.' },
  vial:      { name: 'Vial de polvo', icon: '🧫', stack: 15, illegal: true, product: true, units: 3, packed: true, form: 'viales', color: '#f2f2f2', desc: 'Vial de cristal con tapón negro: 3 unidades.' },
  blister:   { name: 'Blíster de pastillas', icon: '💊', stack: 20, illegal: true, product: true, units: 10, packed: true, form: 'blísteres', color: '#2fbf9a', desc: 'Blíster con 10 pastillas.' },
  frasco:    { name: 'Frasco de pastillas', icon: '🏺', stack: 10, illegal: true, product: true, units: 25, packed: true, form: 'frascos', color: '#c06a1e', desc: 'Frasco ámbar con 25 pastillas.' },
  gotero:    { name: 'Gotero de extracto', icon: '💧', stack: 15, illegal: true, product: true, units: 2, packed: true, form: 'goteros', color: '#b48cf0', desc: 'Gotero con su caja: 2 unidades de extracto.' },
  // envases vacíos e ingredientes (se venden en El Cartel)
  vial_v:    { name: 'Viales vacíos', icon: '🧫', stack: 30, price: 3, rank: 3, desc: 'Para envasar 3 unidades de polvo.' },
  blister_v: { name: 'Blísteres vacíos', icon: '💊', stack: 30, price: 4, rank: 4, desc: 'Para envasar 10 pastillas.' },
  frasco_v:  { name: 'Frascos vacíos', icon: '🏺', stack: 20, price: 8, rank: 4, desc: 'Para envasar 25 pastillas.' },
  gotero_v:  { name: 'Goteros vacíos', icon: '💧', stack: 30, price: 6, rank: 5, desc: 'Gotero con su caja, para 2 unidades de extracto.' },
  reactivo:  { name: 'Reactivo blanco', icon: '⚗️', stack: 20, price: 18, rank: 3, desc: 'Para la mesa de polvos: 1 por tanda (con 4 hojas de Nevada).' },
  aglutinante:{ name: 'Aglutinante', icon: '🥣', stack: 20, price: 14, rank: 4, desc: 'Para la máquina de pastillas: 1 por tanda (con 2 de polvo).' },
  disolvente:{ name: 'Disolvente de extracción', icon: '🛢️', stack: 20, price: 25, rank: 5, desc: 'Para la estación de líquidos: 1 por tanda (con 5 cogollos).' },
  // estaciones de El Cartel
  mesa_polvo:{ name: 'Mesa de preparación de polvos', icon: '⚗️', stack: 1, price: 2400, rank: 3, place: 'powder', desc: 'Mezcla hojas de Nevada con reactivo: 6 de polvo por tanda (1 h 30). También envasa el polvo.' },
  maq_pastillas:{ name: 'Máquina de pastillas', icon: '💊', stack: 1, price: 4200, rank: 4, place: 'pills', desc: 'Prensa polvo con aglutinante: 12 pastillas por tanda (1 h). También las envasa.' },
  est_liquidos:{ name: 'Estación de líquidos', icon: '🧪', stack: 1, price: 5600, rank: 5, place: 'liquid', desc: 'Extrae cogollos con disolvente: 4 de extracto por tanda (1 h 30). También lo envasa.' },
  empacadora:{ name: 'Empacadora avanzada', icon: '🏭', stack: 1, price: 7500, rank: 3, respect: 2, place: 'autopack', desc: 'Envasa sola todo lo que llevas suelto, en el mejor envase que tengas. Sin minijuego.' },
  caja:      { name: 'Caja de Leo', icon: '📦', stack: 1, desc: 'Ábrela dentro de tu casa.' },

  // Ferretería
  maceta:    { name: 'Maceta', icon: '🪴', stack: 5, price: 30, place: 'pot', desc: 'Para cultivar una planta.' },
  tierra:    { name: 'Saco de tierra', icon: '🟫', stack: 10, price: 10, desc: 'Llena una maceta. Calidad normal.' },
  tierra_plus:{ name: 'Tierra abonada', icon: '🟤', stack: 10, price: 30, rank: 1, desc: '+40% de cosecha y crece más rápido.' },
  fertil:    { name: 'Fertilizante', icon: '🧴', stack: 10, price: 15, rank: 1, desc: 'Añádelo a una planta: +3 cogollos.' },
  regadera:  { name: 'Regadera', icon: '🚿', stack: 1, price: 15, tool: true, desc: 'Riega tus plantas. Rellénala en un grifo.' },
  bolsita:   { name: 'Sobres zip vacíos', icon: '📨', stack: 50, price: 1, desc: 'Para envasar 1 cogollo en un sobre.' },
  tarro_v:   { name: 'Tarros vacíos', icon: '🫙', stack: 20, price: 4, rank: 1, desc: 'Para envasar 5 cogollos (necesitas la envasadora de tarros).' },
  bolsa_ss:  { name: 'Bolsas zip para cristales', icon: '🎴', stack: 50, price: 2, rank: 2, desc: 'Para envasar cristales en la mesa de empaquetado.' },
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
  // Armería Lomas: sirven para defenderte de los atracos de las bandas (no hay tiroteos)
  spray:     { name: 'Spray de pimienta', icon: '🧯', stack: 3, price: 60, desc: 'Si te intentan atracar, lo usas y salen corriendo. Se gasta al usarlo.' },
  porra:     { name: 'Porra extensible', icon: '🦯', stack: 1, price: 500, rank: 1, desc: 'Plantas cara en un atraco: a menudo se echan atrás, y si no, se llevan menos. No se gasta.' },
  pistola:   { name: 'Pistola', icon: '🔫', stack: 1, price: 1750, rank: 3, illegal: true, desc: 'Nadie te atraca si la enseñas. Con ella en la mano, el botón de golpear dispara (gasta balas). Ilegal sin licencia: si la policía te cachea, te la quita y la multa es mayor.' },
  machete:   { name: 'Machete', icon: '🔪', stack: 1, price: 750, rank: 1, desc: 'Golpe rápido y fuerte con el botón de golpear. Pegar a alguien delante de la policía es delito.' },
  balas:     { name: 'Balas', icon: '🟡', stack: 60, price: 4, rank: 3, illegal: true, desc: 'Munición para la pistola: una por disparo.' },
  // El Cartel (cuartel del cártel): material que no venden en otro sitio. `respect`: nivel de
  // respeto del cártel que hace falta (0 Conocido, 1 De confianza, 2 Socio)
  panel_led: { name: 'Panel LED de cultivo', icon: '🔆', stack: 2, price: 900, place: 'panel', desc: 'Panel colgante en su soporte: las plantas a menos de 2,5 m crecen el doble de rápido (no se suma a la lámpara).' },
  extractor: { name: 'Extractor con filtro', icon: '🌀', stack: 2, price: 650, respect: 1, place: 'extractor', desc: 'Aire fresco: las plantas a menos de 3 m crecen un 15 % más rápido. Se suma a la luz.' },
  abono_grow:{ name: 'Abono Grow', icon: '🟩', stack: 10, price: 40, desc: 'Échaselo a una planta que está creciendo: crece un 25 % más rápido.' },
  abono_bloom:{ name: 'Abono Bloom', icon: '🟪', stack: 10, price: 55, respect: 1, desc: 'Échaselo a una planta: +4 cogollos al cosechar.' },
  ph_corr:   { name: 'Corrector de pH', icon: '💧', stack: 10, price: 25, desc: 'Échaselo a una planta: el agua le dura el doble.' },
  sem_roja:  { name: 'Semilla Lumaflor Roja', icon: '🌱', stack: 10, price: 110, illegal: true, gives: { id: 'semilla', p: 'roja' }, desc: 'Variedad del cártel: cogollos muy cotizados. Crece algo más despacio.' },
  sem_negra: { name: 'Semilla Lumaflor Negra', icon: '🌱', stack: 10, price: 160, illegal: true, respect: 2, gives: { id: 'semilla', p: 'negra' }, desc: 'La mejor de la isla: la pagan carísima. Solo para socios del cártel.' },
  hornillo_pro:{ name: 'Mesa de cristales', icon: '💎', stack: 1, price: 2200, respect: 1, place: 'crystal', data: { pro: true }, desc: 'Cocina cristales (1 h 15, 9 por tanda) y los envasa en bolsas o tarros.' },
  humidificador:{ name: 'Humidificador', icon: '💨', stack: 2, price: 220, place: 'humid', desc: 'Las macetas a menos de 2,5 m pierden el agua un 40 % más despacio.' },
};

export const STRAINS = {
  brisa:  { name: 'Lumaflor Verde',    seed: 30, base: 35, effect: 'relajado', color: 0x5cbf3a, speed: 1.0,  yield: [8, 11],  rank: 0 },
  niebla: { name: 'Lumaflor Violeta', seed: 45, base: 48, effect: 'sueno',    color: 0x8b5cc7, speed: 0.9,  yield: [8, 12],  rank: 2 },
  trueno: { name: 'Lumaflor Dorada',  seed: 65, base: 62, effect: 'energia',  color: 0xd8b23a, speed: 0.8,  yield: [9, 12],  rank: 3 },
  marea:  { name: 'Lumaflor Azul',    seed: 90, base: 80, effect: 'enfoque',  color: 0x3aa0d8, speed: 0.75, yield: [10, 13], rank: 4 },
  // del cártel (solo en su tienda, nunca en el Rubio)
  roja:   { name: 'Lumaflor Roja',    seed: 110, base: 98, effect: 'energia', color: 0xd8463a, speed: 0.75, yield: [10, 14], rank: 2, cartel: true },
  negra:  { name: 'Lumaflor Negra',   seed: 160, base: 135, effect: 'relajado', color: 0x3a2a4a, speed: 0.7, yield: [11, 15], rank: 2, cartel: true },
  // cristales: no se cultivan, se cocinan en el hornillo
  shards: { name: 'Sweet Shards',     seed: 0,  base: 70, effect: 'euforia',  color: 0xb06cff, rank: 2, noSeed: true, raw: 'cristal' },
  // Nevada: se cultiva, pero da hojas (no cogollos) para hacer polvo
  nevada: { name: 'Nevada',           seed: 70, base: 0,  effect: 'frio',     color: 0x9bc7a0, speed: 0.9, yield: [8, 12], rank: 3, leaf: true },
  polvo:  { name: 'Nieve',            seed: 0,  base: 105, effect: 'frio',    color: 0xf2f2f2, rank: 3, noSeed: true, raw: 'polvo' },
  pastis: { name: 'Pastillas Lumina', seed: 0,  base: 26, effect: 'euforia',  color: 0x2fbf9a, rank: 4, noSeed: true, raw: 'pastilla' },
  extracto:{ name: 'Extracto Lumaflor', seed: 0, base: 150, effect: 'zen',    color: 0xb48cf0, rank: 5, noSeed: true, raw: 'extracto' },
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
  armeria: {
    name: 'Armería Lomas',
    open: [10, 20],
    stock: ['spray', 'porra', 'machete', 'pistola', 'balas'],
    greet: ['Buenas. Aquí todo con papeles... casi todo.', 'Con lo que se ve por el barrio de noche, mejor ir preparado.', '¿Algo para dormir tranquilo?'],
  },
  cartel: {
    name: 'El Cartel',
    open: [0, 24],
    stock: ['panel_led', 'extractor', 'abono_grow', 'abono_bloom', 'ph_corr', 'sem_roja', 'sem_negra', 'mesa_emp', 'envasadora', 'hornillo_pro', 'mesa_polvo', 'maq_pastillas', 'est_liquidos', 'empacadora', 'reactivo', 'aglutinante', 'disolvente', 'vial_v', 'blister_v', 'frasco_v', 'gotero_v', 'machete', 'porra', 'pistola', 'balas'],
    greet: ['Aquí no hay ticket ni preguntas. Elige.', 'El jefe dice que te atienda bien. No le hagas quedar mal.', 'Material de primera. Lo que no ves aquí, no existe en la isla.'],
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
  { id: 'tarro_cr', src: 'cristal', pack: 'tarro_v', per: 5, at: 'crystal' },
  { id: 'sobre_polvo', src: 'polvo', pack: 'bolsita', per: 1, at: 'powder' },
  { id: 'vial', src: 'polvo', pack: 'vial_v', per: 3, at: 'powder' },
  { id: 'blister', src: 'pastilla', pack: 'blister_v', per: 10, at: 'pills' },
  { id: 'frasco', src: 'pastilla', pack: 'frasco_v', per: 25, at: 'pills' },
  { id: 'gotero', src: 'extracto', pack: 'gotero_v', per: 2, at: 'liquid' },
];
// Lo suelto de cada producto (los cogollos, por defecto) y sus envases, de menor a mayor
export const rawOf = (strain) => STRAINS[strain]?.raw || 'cogollo';
export const formsOf = (raw) => FORMS.filter((f) => f.src === raw).sort((a, b) => a.per - b.per);
// Recetas de las estaciones del cártel: ingredientes → lo que sale (n), en minutos de juego
export const LAB = {
  crystal: { name: 'Mesa de cristales', make: { azucar: 2, colorante: 1, catalizador: 1 }, out: 'cristal', strain: 'shards', n: 9, min: 75 },
  powder: { name: 'Mesa de preparación de polvos', make: { hoja: 4, reactivo: 1 }, out: 'polvo', strain: 'polvo', n: 6, min: 90 },
  pills: { name: 'Máquina de pastillas', make: { polvo: 2, aglutinante: 1 }, out: 'pastilla', strain: 'pastis', n: 12, min: 60 },
  liquid: { name: 'Estación de líquidos', make: { cogollo: 5, disolvente: 1 }, out: 'extracto', strain: 'extracto', n: 4, min: 90 },
};

// Respeto del cártel (sube con los encargos del jefe): desbloquea productos de su tienda
export const RESPECT = [
  { name: 'Conocido', xp: 0 },
  { name: 'De confianza', xp: 100 },
  { name: 'Socio', xp: 300 },
];
