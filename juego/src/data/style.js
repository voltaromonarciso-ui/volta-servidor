// Catálogos de peluquería y ropa. Lo visual (color, pieza 3D) va separado de los
// efectos de juego (`fx`), para poder equilibrarlos sin tocar los modelos.
//
// Limitación de los personajes (Rocketbox): la ropa y el pelo vienen pintados en
// la textura del modelo. Las prendas de arriba y los pantalones cambian el COLOR
// de esa prenda (no su corte). Gafas y mochila son piezas 3D sujetas al esqueleto.
// Gorras, gorros y capuchas se probaron y se descartaron: cada peinado tiene un
// volumen distinto en la malla y quedaban flotando o atravesando el pelo.

// Sin cortes de pelo: en estos personajes el peinado es parte de la malla de la
// cabeza (no hay cráneo modelado debajo), así que recortarlo deja huecos. La
// peluquería cambia el color del pelo y la barba, que sí se ven bien.

export const HAIR_COLORS = {
  orig:    { name: 'Natural', price: 0, hex: null },
  negro:   { name: 'Negro', price: 20, hex: '#17130f' },
  castano: { name: 'Castaño', price: 20, hex: '#4a2c18' },
  rubio:   { name: 'Rubio', price: 30, hex: '#c9a35c' },
  platino: { name: 'Platino', price: 40, hex: '#e6dccb' },
  pelirrojo: { name: 'Pelirrojo', price: 30, hex: '#8f3a1a' },
  azul:    { name: 'Azul eléctrico', price: 45, hex: '#2a5fd8' },
  rosa:    { name: 'Rosa chicle', price: 45, hex: '#e0559c' },
};

// Solo en personajes masculinos (los modelos femeninos no tienen zona de barba).
export const BEARDS = {
  none:  { name: 'Sin barba', price: 0, amount: 0 },
  sombra: { name: 'Barba de tres días', price: 10, amount: 0.45 },
  corta: { name: 'Barba corta', price: 20, amount: 0.75 },
  poblada: { name: 'Barba poblada', price: 30, amount: 1 },
};

// Huecos de ropa. `tag` = estilo (lo usan los clientes con preferencias).
export const SLOTS = { top: 'Arriba', legs: 'Pantalón', face: 'Cara', back: 'Espalda' };

export const CLOTHES = {
  sudadera_negra:  { slot: 'top', name: 'Sudadera negra', price: 45, color: '#1d1e22', tag: 'calle' },
  sudadera_gris:   { slot: 'top', name: 'Sudadera gris', price: 45, color: '#7d8085', tag: 'calle' },
  chaqueta_marino: { slot: 'top', name: 'Chaqueta azul marino', price: 70, color: '#1f2a44', tag: 'elegante' },
  chaqueta_camel:  { slot: 'top', name: 'Chaqueta camel', price: 80, color: '#a8794a', tag: 'elegante' },
  chandal_rojo:    { slot: 'top', name: 'Chaqueta de chándal roja', price: 40, color: '#b3262b', tag: 'deportivo' },
  polo_blanco:     { slot: 'top', name: 'Polo blanco', price: 30, color: '#e9e6df', tag: 'elegante' },
  vaquero:         { slot: 'legs', name: 'Vaquero azul', price: 35, color: '#2f4a73', tag: 'calle' },
  pantalon_negro:  { slot: 'legs', name: 'Pantalón negro', price: 35, color: '#1b1b1e', tag: 'elegante' },
  chino_beige:     { slot: 'legs', name: 'Chino beige', price: 40, color: '#b49a72', tag: 'elegante' },
  cargo_verde:     { slot: 'legs', name: 'Cargo verde', price: 40, color: '#4a5434', tag: 'calle' },
  chandal_gris:    { slot: 'legs', name: 'Pantalón de chándal gris', price: 30, color: '#6f7277', tag: 'deportivo' },
  gafas_sol:       { slot: 'face', name: 'Gafas de sol', price: 35, color: '#111111', model: 'glasses', tag: 'elegante' },
  mochila:         { slot: 'back', name: 'Mochila', price: 120, color: '#2e3b4e', model: 'backpack', tag: 'calle', fx: { invSlots: 4 }, desc: '+4 huecos en la mochila.' },
};

// Cuánto pesa cada rasgo al reconocerte (suma 1). La cara y la complexión
// (el modelo) no se pueden cambiar en la peluquería ni en la tienda.
export const RECOG_WEIGHTS = { model: 0.32, hair: 0.18, beard: 0.1, top: 0.2, legs: 0.1, face: 0.1 };
export const RECOG_MINUTES = 3 * 24 * 60;   // la policía recuerda tu aspecto 3 días de juego
