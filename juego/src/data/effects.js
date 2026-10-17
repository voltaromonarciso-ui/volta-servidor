import { STRAINS } from './items.js';

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

export function productValue(strain, effects) {
  const s = STRAINS[strain];
  const mult = effects.reduce((a, e) => a + EFFECTS[e].value, 1);
  return Math.round(s.base * mult);
}
