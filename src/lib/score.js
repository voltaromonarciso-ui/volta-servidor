// Puntuación de la competición, calculada SIEMPRE en el servidor.
// El cliente solo envía cifras brutas de la semana (días, series, volumen); aquí se validan y se puntúan.

// Ligas por experiencia acumulada (XP de semanas cerradas). Umbral mínimo de cada liga.
const LEAGUES = [
  { id: 'bronce', min: 0 },
  { id: 'plata', min: 1500 },
  { id: 'oro', min: 5000 },
  { id: 'platino', min: 12000 },
  { id: 'diamante', min: 25000 },
  { id: 'elite', min: 50000 },
];

// Límites de lo humanamente posible. Holgados: un atleta real nunca los toca, un bot o un cliente trucado sí.
const LIMITS = {
  setsPerDay: 60, // más de 60 series en un día no es un entreno
  volumePerSet: 3000, // kg·reps por serie (p. ej. 300 kg × 10 en prensa)
  countedSetsPerDay: 30, // a partir de aquí las series ya no suman puntos (no premiamos el volumen basura)
  strikesToFlag: 3, // envíos imposibles en una semana antes de salir del ranking
};

const leagueOf = (xp) => {
  let i = 0;
  for (let j = 0; j < LEAGUES.length; j++) if (xp >= LEAGUES[j].min) i = j;
  return i;
};

const levelOf = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;

/**
 * ¿Son posibles estas cifras a estas alturas de la semana?
 * isoDow: día ISO de hoy en el servidor (1 = lunes … 7 = domingo).
 * Se permite un día de margen por zonas horarias adelantadas respecto al servidor.
 */
function plausible({ days, sets, volume }, isoDow) {
  if (days > Math.min(7, isoDow + 1)) return 'days_ahead';
  if (sets > 0 && days === 0) return 'sets_without_days';
  if (sets > days * LIMITS.setsPerDay) return 'too_many_sets';
  if (volume > Math.max(sets, 1) * LIMITS.volumePerSet) return 'too_much_volume';
  return null;
}

/**
 * Puntos de la semana. Premia la constancia y la progresión frente a uno mismo,
 * así un principiante puede competir con alguien que levanta el triple.
 */
function weekScore({ days, sets, volume }, prevVolume) {
  const counted = Math.min(sets, days * LIMITS.countedSetsPerDay);
  let pts = days * 100 + counted * 5 + Math.round(40 * Math.log2(1 + volume / 1000));
  if (prevVolume > 0 && days >= 2) {
    const gain = Math.min(0.5, Math.max(0, volume / prevVolume - 1)); // hasta +50 % cuenta
    pts += Math.round(gain * 400);
  }
  return pts;
}

module.exports = { LEAGUES, LIMITS, leagueOf, levelOf, plausible, weekScore };
