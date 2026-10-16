import { ITEMS, STRAINS } from './items.js';

// Efectos propios del juego. `value` es el multiplicador que suma al precio base.
export const EFFECTS = {
  relajado:  { name: 'Relajante',     value: 0.10, color: '#7fd18b' },
  energia:   { name: 'Energizante',   value: 0.22, color: '#ffd23f' },
  sueno:     { name: 'Soñador',       value: 0.18, color: '#a18cff' },
  enfoque:   { name: 'Enfocado',      value: 0.16, color: '#5ec8ff' },
  euforia:   { name: 'Eufórico',      value: 0.18, color: '#ff8fd1' },
  risa:      { name: 'Risueño',       value: 0.14, color: '#ffe08a' },
  hambre:    { name: 'Hambriento',    value: 0.08, color: '#f4a259' },
  paranoia:  { name: 'Paranoico',     value: 0.04, color: '#b0b0b0' },
  sed:       { name: 'Sediento',      value: 0.06, color: '#8fd3ff' },
  somno:     { name: 'Somnoliento',   value: 0.06, color: '#8a8fb5' },
  veloz:     { name: 'Veloz',         value: 0.28, color: '#ff6b3d' },
  tropical:  { name: 'Tropical',      value: 0.26, color: '#3dffb0' },
  chispa:    { name: 'Chispeante',    value: 0.24, color: '#ffb3f0' },
  zen:       { name: 'Zen',           value: 0.30, color: '#b8f28a' },
  brillo:    { name: 'Brillante',     value: 0.34, color: '#fff3a1' },
  electrico: { name: 'Electrizante',  value: 0.42, color: '#66f0ff' },
  cosmico:   { name: 'Cósmico',       value: 0.46, color: '#c77dff' },
  hipnotico: { name: 'Hipnótico',     value: 0.38, color: '#ff5fa2' },
  dorado:    { name: 'Dorado',        value: 0.52, color: '#ffc400' },
  calor:     { name: 'Ardiente',      value: 0.20, color: '#ff4d4d' },
  frio:      { name: 'Gélido',        value: 0.24, color: '#b3ecff' },
  gigante:   { name: 'Gigantón',      value: 0.30, color: '#9be564' },
};

// Ingredientes: cada uno añade un efecto y transforma otros ya presentes.
export const INGREDIENTS = {
  energetica: { name: 'Bebida energética', icon: '🥤', price: 6, adds: 'energia',  tr: { relajado: 'veloz', sueno: 'paranoia', hambre: 'chispa', zen: 'electrico' } },
  cafe:       { name: 'Café molido',       icon: '☕', price: 4, adds: 'enfoque',  tr: { somno: 'energia', risa: 'chispa', tropical: 'brillo' } },
  platano:    { name: 'Plátano',           icon: '🍌', price: 2, adds: 'risa',     tr: { paranoia: 'relajado', energia: 'tropical', frio: 'gigante' } },
  chicle:     { name: 'Chicle',            icon: '🍬', price: 3, adds: 'chispa',   tr: { enfoque: 'euforia', sed: 'tropical', calor: 'frio' } },
  ibuprofeno: { name: 'Ibuprofeno',        icon: '💊', price: 5, adds: 'somno',    tr: { paranoia: 'zen', euforia: 'sueno', veloz: 'relajado' } },
  leche:      { name: 'Leche',             icon: '🥛', price: 3, adds: 'frio',     tr: { calor: 'relajado', energia: 'sueno', chispa: 'brillo' } },
  guindilla:  { name: 'Guindilla',         icon: '🌶️', price: 4, adds: 'calor',    tr: { relajado: 'euforia', risa: 'veloz', frio: 'electrico' } },
  menta:      { name: 'Menta',             icon: '🌿', price: 3, adds: 'sed',      tr: { calor: 'zen', hambre: 'frio', brillo: 'cosmico' } },
  purpurina:  { name: 'Purpurina comestible', icon: '✨', price: 9, rank: 2, adds: 'brillo', tr: { euforia: 'cosmico', chispa: 'hipnotico', relajado: 'risa' } },
  batido:     { name: 'Batido proteico',   icon: '💪', price: 8, rank: 2, adds: 'gigante', tr: { hambre: 'energia', somno: 'veloz', risa: 'euforia' } },
  pila:       { name: 'Pila de 9V',        icon: '🔋', price: 10, rank: 3, adds: 'electrico', tr: { enfoque: 'brillo', relajado: 'zen', sed: 'hambre' } },
  miel:       { name: 'Miel de romero',    icon: '🍯', price: 7, rank: 3, adds: 'tropical', tr: { brillo: 'dorado', paranoia: 'risa', veloz: 'hipnotico' } },
};

// Los ingredientes también son objetos de inventario.
for (const [id, ing] of Object.entries(INGREDIENTS)) {
  ITEMS[id] = { name: ing.name, icon: ing.icon, stack: 20, price: ing.price, rank: ing.rank || 0, ingredient: true, desc: `Añade ${EFFECTS[ing.adds].name}.` };
}

export const MAX_EFFECTS = 8;

export function mixEffects(effects, ingId) {
  const ing = INGREDIENTS[ingId];
  const out = effects.map((e) => {
    const to = ing.tr[e];
    return to && !effects.includes(to) ? to : e;
  });
  const uniq = [...new Set(out)];
  if (!uniq.includes(ing.adds) && uniq.length < MAX_EFFECTS) uniq.push(ing.adds);
  return uniq;
}

export function productValue(strain, effects) {
  const s = STRAINS[strain];
  const mult = effects.reduce((a, e) => a + EFFECTS[e].value, 1);
  return Math.round(s.base * mult);
}

export function productKey(strain, effects) {
  return strain + ':' + [...effects].sort().join('+');
}

const N1 = ['Brisa', 'Niebla', 'Trueno', 'Marea', 'Rayo', 'Nube', 'Fuego', 'Luna', 'Ola', 'Bruma', 'Cometa', 'Faro', 'Ancla', 'Salitre'];
const N2 = ['Dulce', 'Loca', 'Salvaje', 'Eléctrica', 'de Medianoche', 'Cósmica', 'Tropical', 'Dorada', 'Feliz', 'Fantasma', 'del Puerto', 'Real', 'Turbia', 'Mística'];
export function randomProductName() {
  return N1[Math.floor(Math.random() * N1.length)] + ' ' + N2[Math.floor(Math.random() * N2.length)];
}
