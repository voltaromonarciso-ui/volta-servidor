// Vecinos de Puerto Lomas. `prefs` son los efectos que más les gustan; `style`,
// el estilo de ropa con el que se fían más de ti (`dislike`, el que les echa para atrás).
export const PEOPLE = [
  { id: 'chema',  name: 'Chema Ortiz',   prefs: ['relajado', 'risa', 'hambre'],   budget: [40, 120], std: 0, form: 'bolsa' },
  { id: 'nuria',  name: 'Nuria Vidal',   prefs: ['energia', 'enfoque', 'chispa'], budget: [50, 140], std: 0, form: 'tarro', female: true, style: 'elegante' },
  { id: 'rafa',   name: 'Rafa Molina',   prefs: ['euforia', 'veloz', 'calor'],    budget: [60, 180], std: 1, form: 'bolsa', style: 'calle' },
  { id: 'lola',   name: 'Lola Prieto',   prefs: ['sueno', 'zen', 'relajado'],     budget: [40, 130], std: 0, form: 'bolsa', female: true },
  { id: 'toni',   name: 'Toni Barrera',  prefs: ['tropical', 'risa', 'energia'],  budget: [70, 200], std: 1, form: 'tarro', style: 'deportivo' },
  { id: 'marisa', name: 'Marisa Gil',    prefs: ['zen', 'frio', 'brillo'],        budget: [90, 260], std: 2, form: 'bolsa', female: true, style: 'elegante', dislike: 'calle' },
  { id: 'kike',   name: 'Kike Soler',    prefs: ['hambre', 'gigante', 'risa'],    budget: [40, 110], std: 0, form: 'bolsa' },
  { id: 'celia',  name: 'Celia Ramos',   prefs: ['enfoque', 'electrico', 'veloz'],budget: [80, 240], std: 1, form: 'tarro', female: true, style: 'elegante' },
  { id: 'paco',   name: 'Paco Lucena',   prefs: ['relajado', 'somno', 'sueno'],   budget: [30, 100], std: 0, form: 'bolsa' },
  { id: 'ines',   name: 'Inés Calvo',    prefs: ['chispa', 'hipnotico', 'euforia'],budget: [100, 300], std: 2, form: 'bolsa', female: true },
  { id: 'dani',   name: 'Dani Fuentes',  prefs: ['energia', 'calor', 'veloz'],    budget: [60, 170], std: 1, form: 'tarro', style: 'deportivo' },
  { id: 'rocio',  name: 'Rocío Mena',    prefs: ['cosmico', 'brillo', 'sueno'],   budget: [120, 340], std: 2, form: 'bolsa', female: true },
  { id: 'oscar',  name: 'Óscar Varela',  prefs: ['gigante', 'tropical', 'frio'],  budget: [90, 250], std: 1, form: 'bolsa', style: 'calle' },
  { id: 'bea',    name: 'Bea Montes',    prefs: ['risa', 'euforia', 'chispa'],    budget: [50, 150], std: 0, form: 'tarro', female: true },
  { id: 'german', name: 'Germán Peña',   prefs: ['dorado', 'electrico', 'zen'],   budget: [180, 450], std: 3, form: 'bolsa', style: 'elegante', dislike: 'calle' },
  { id: 'sole',   name: 'Sole Ibarra',   prefs: ['frio', 'relajado', 'tropical'], budget: [60, 160], std: 1, form: 'bolsa', female: true },
  { id: 'julian', name: 'Julián Teba',   prefs: ['hipnotico', 'cosmico', 'dorado'],budget: [200, 520], std: 3, form: 'tarro', style: 'elegante' },
];

export const STARTING_CUSTOMERS = ['chema', 'nuria'];

export const GREETINGS = [
  '¿Qué pasa?', 'Buenas.', 'Hace buen día, ¿eh?', 'Tengo prisa, perdona.', '¿Te conozco?',
  'Este pueblo cada día está más raro.', '¿Has visto el puerto al atardecer?', 'Uf, menudo día llevo.',
];
export const CUSTOMER_LINES = [
  'Ya sabes dónde encontrarme.', 'Avísame cuando tengas algo nuevo.', 'Lo último estaba muy bueno.',
  'Mándame un mensaje, que aquí hay mucha gente.', 'Cuidado con la poli, que anda rondando.',
];

export const OFFICERS = ['Agente Ruiz', 'Agente Campos', 'Agente Lara', 'Agente Soto'];
