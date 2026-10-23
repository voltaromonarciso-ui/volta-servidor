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

// Candidatos que se pueden contratar (cada uno, una sola vez a la vez). El id es interno
// (se guarda en la partida); el nombre es el que se ve.
export const CANDIDATES = [
  { id: 'nerea', model: 'Female_Adult_07', name: 'Nerea', role: 'cultivo', hire: 900, wage: 180, loyalty: 0.7, rank: 1, bio: 'Estudió jardinería. Puntual y callada.' },
  { id: 'paco', model: 'Male_Adult_06', name: 'Toño', role: 'cultivo', hire: 600, wage: 140, loyalty: 0.35, rank: 1, bio: 'Más barato, pero habla más de la cuenta si no cobra.' },
  { id: 'ines', model: 'Female_Adult_12', name: 'Vero', role: 'envasado', hire: 800, wage: 160, loyalty: 0.75, rank: 1, bio: 'Manos rápidas, trabajó en un almacén.' },
  { id: 'dani', model: 'Male_Adult_17', name: 'Rubén', role: 'envasado', hire: 550, wage: 120, loyalty: 0.3, rank: 1, bio: 'Recién llegado al barrio. Necesita el dinero.' },
  { id: 'mateo', model: 'Male_Adult_12', name: 'Mateo', role: 'cocina', hire: 2500, wage: 400, loyalty: 0.6, rank: 3, bio: 'Sabe de química. No toca nada sin ingredientes.' },
  // más gente de confianza a medida que creces (para llenar los almacenes)
  { id: 'lucia', model: 'Female_Adult_03', name: 'Lucía', role: 'cultivo', hire: 1200, wage: 200, loyalty: 0.65, rank: 4, bio: 'Llevaba un vivero. Sabe sacar plantas grandes.' },
  { id: 'kike', model: 'Male_Adult_04', name: 'Kike', role: 'envasado', hire: 1000, wage: 180, loyalty: 0.5, rank: 4, bio: 'Ex de una paquetería. Rápido, algo despistado.' },
  { id: 'sara', model: 'Female_Adult_05', name: 'Sara', role: 'cultivo', hire: 1400, wage: 220, loyalty: 0.8, rank: 5, bio: 'Muy leal. No pregunta y no cuenta nada.' },
  { id: 'jony', model: 'Male_Adult_09', name: 'Jony', role: 'envasado', hire: 900, wage: 150, loyalty: 0.35, rank: 5, bio: 'Barato y con ganas, pero se le va la lengua.' },
  { id: 'carmen', model: 'Female_Adult_13', name: 'Carmen', role: 'cocina', hire: 3200, wage: 480, loyalty: 0.7, rank: 5, bio: 'Química de laboratorio. Cara, pero no falla una tanda.' },
  { id: 'edu', model: 'Male_Adult_16', name: 'Edu', role: 'cultivo', hire: 1600, wage: 240, loyalty: 0.6, rank: 6, bio: 'Ha montado cultivos grandes en naves. Sabe lo que hace.' },
  { id: 'marta', model: 'Female_Adult_17', name: 'Marta', role: 'envasado', hire: 1500, wage: 230, loyalty: 0.75, rank: 6, bio: 'Organizada al milímetro. Lleva el almacén sola.' },
  { id: 'samu', model: 'Male_Adult_20', name: 'Samu', role: 'cocina', hire: 3600, wage: 520, loyalty: 0.55, rank: 6, bio: 'Cocinero de los buenos. Le gusta cobrar puntual.' },
];

// Equilibrio (revisado): un trato típico deja 100–250 $, así que contratar cuesta varios
// días de ventas y el sueldo diario se come 1–2 tratos. Los empleados son más lentos que
// tú y la plantilla crece con el rango: ayudan a escalar, no a saltarse la partida.
export const STAFF = {
  maxPerProperty: 3,        // empleados por propiedad
  perWarehouse: [2, 4, 6],  // en los almacenes: Delta, Bravo y Alfa
  maxByRank: [0, 1, 2, 4, 6, 9, 12], // plantilla total según el rango (Novato no puede contratar)
  workFrom: 8, workTo: 20,  // horario (horas de juego)
  payHour: 7,               // la nómina se cobra cada mañana a esta hora
  quitAfterDays: 2,         // días sin cobrar antes de irse
  // minutos de juego que tarda cada tarea (aprox. el doble que el jugador)
  minutes: { water: 6, harvest: 20, bolsa: 12, shards: 12, tarro: 25, cookStart: 20, cookCollect: 10, idle: 30 },
  regar: 0.3,               // riega cuando el agua baja de aquí (lo mismo que avisa la maceta)
  leakChance: (loyalty) => Math.max(0, 0.8 - loyalty), // al irse sin cobrar
};
