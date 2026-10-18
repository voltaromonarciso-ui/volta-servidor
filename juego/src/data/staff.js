// Empleados: candidatos, puestos y números de equilibrio (todo aquí, fácil de ajustar).
//
// Referencias de la economía actual usadas para fijar los valores:
// - un sobre de Lumaflor Verde vale ~35 $; una maceta da 8–11 cogollos cada ~14 h de juego;
// - el alquiler de la nave es de 100 $ a la semana; la mesa de empaquetado cuesta 80 $
//   y el hornillo 600 $ (6 cristales por tanda de 2 h, ~70 $ cada bolsa).
// Un empleado cuesta lo que unas pocas ventas al día: ahorra tiempo, no da dinero gratis.

export const ROLES = {
  cultivo: { name: 'Cultivo', icon: '🌱', does: 'Riega las macetas que lo necesitan y cosecha las que están listas. Deja los cogollos en las estanterías o armarios.' },
  envasado: { name: 'Envasado', icon: '📦', does: 'Envasa en la mesa de empaquetado o la envasadora con lo que haya en las estanterías y armarios, y deja ahí el resultado.' },
  cocina: { name: 'Cocina', icon: '🔥', does: 'Pone tandas en el hornillo con los ingredientes de las estanterías y armarios, y guarda los cristales al terminar.' },
};

// Candidatos que se pueden contratar (cada uno, una sola vez a la vez).
export const CANDIDATES = [
  { id: 'nerea', model: 'Female_Adult_07', name: 'Nerea', role: 'cultivo', hire: 120, wage: 55, loyalty: 0.7, bio: 'Estudió jardinería. Puntual y callada.' },
  { id: 'paco', model: 'Male_Adult_06', name: 'Paco', role: 'cultivo', hire: 80, wage: 45, loyalty: 0.35, bio: 'Barato, pero habla más de la cuenta si no cobra.' },
  { id: 'ines', model: 'Female_Adult_12', name: 'Inés', role: 'envasado', hire: 100, wage: 50, loyalty: 0.75, bio: 'Manos rápidas, trabajó en un almacén.' },
  { id: 'dani', model: 'Male_Adult_17', name: 'Dani', role: 'envasado', hire: 70, wage: 40, loyalty: 0.3, bio: 'Recién llegado al barrio. Necesita el dinero.' },
  { id: 'mateo', model: 'Male_Adult_12', name: 'Mateo', role: 'cocina', hire: 200, wage: 90, loyalty: 0.6, rank: 2, bio: 'Sabe de química. No toca nada sin ingredientes.' },
];

export const STAFF = {
  maxPerProperty: 3,        // empleados por propiedad
  workFrom: 8, workTo: 20,  // horario (horas de juego)
  payHour: 7,               // la nómina se cobra cada mañana a esta hora
  quitAfterDays: 2,         // días sin cobrar antes de irse
  // minutos de juego que tarda cada tarea
  minutes: { water: 4, harvest: 10, bolsa: 6, shards: 6, tarro: 12, cookStart: 10, cookCollect: 5, idle: 30 },
  regar: 0.3,               // riega cuando el agua baja de aquí (lo mismo que avisa la maceta)
  leakChance: (loyalty) => Math.max(0, 0.8 - loyalty), // al irse sin cobrar
};
