/* VOLTA · revisión del catálogo de ejercicios.
   1) Corrige nombres, grupos, músculos y material que estaban mal o repetidos.
   2) Añade ejercicios a los grupos que no tenían (Aductores, Abductores, Lumbar) y a los que tenían pocos.
   El historial guarda cada ejercicio por su posición en EX, así que aquí nunca se borra ni se reordena nada:
   un ejercicio repetido se convierte en otro que faltaba, en la misma posición. */
(function () {
  'use strict';
  if (typeof EX === 'undefined' || typeof xreg !== 'function') return;

  // [nombre actual, nombre nuevo, grupo, músculo, porción, material, nivel, preparación~ejecución (si cambia el ejercicio)]
  // Un campo vacío ('') deja el valor que tenía.
  const FIX = [
    ['Press militar', '', '', 'Deltoides', 'Deltoides anterior'],
    ['Curl de bíceps', '', '', '', 'Bíceps cabeza larga / corta'],
    ['Extensión de tríceps', 'Extensión de tríceps por encima de la cabeza en polea', '', '', 'Tríceps cabeza larga'],
    ['Extensión de tríceps sobre la cabeza', 'Extensión de tríceps sobre la cabeza con mancuerna', '', '', 'Tríceps cabeza larga', 'Mancuernas', '',
      'Sentado con la espalda apoyada, una mancuerna cogida con las dos manos por encima de la cabeza~Baja la mancuerna por detrás de la cabeza con los codos apuntando arriba y extiende sin abrirlos'],
    ['Extensión de tríceps en polea por encima de la cabeza', 'Extensión de tríceps tumbado con mancuernas', '', '', 'Tríceps cabeza larga', 'Mancuernas', 'Intermedio',
      'Tumbado en un banco con las mancuernas sobre los hombros y las palmas enfrentadas~Dobla los codos llevando las mancuernas junto a las orejas y extiende sin mover los brazos'],
    ['Elevación de gemelos', 'Elevación de gemelos de pie', '', 'Gastrocnemio', 'Gastrocnemio'],
    ['Gemelos de pie en máquina', 'Elevación de gemelos tipo burro', '', '', 'Gastrocnemio', 'Máquina', 'Intermedio',
      'Tronco inclinado con la cadera bajo la almohadilla y las puntas en el escalón~Sube de puntillas todo lo alto que puedas, pausa y baja hasta estirar el gemelo'],
    ['Gemelos sentado', '', '', 'Sóleo', 'Sóleo'],
    ['Elevaciones laterales', '', '', 'Deltoides', 'Deltoides lateral'],
    ['Pájaros (deltoides posterior)', 'Pájaros con mancuernas', '', 'Deltoides', 'Deltoides posterior'],
    ['Curl martillo', '', '', '', 'Braquial / braquiorradial'],
    ['Press en Smith', 'Press de banca en Smith'],
    ['Press con agarre neutro', 'Press de banca con agarre neutro'],
    ['Dominadas supinas', '', '', '', '', 'Barra de dominadas'],
    ['Dominadas con agarre neutro', '', '', '', '', 'Barra de dominadas'],
    ['Elevación de piernas colgado', '', '', '', '', 'Barra de dominadas'],
    ['Remo con mancuerna en banco inclinado', 'Remo con barra agarre supino', '', '', 'Dorsal ancho / romboides', 'Barra', 'Intermedio',
      'Agarre supino al ancho de los hombros y torso inclinado unos 30°~Lleva la barra al ombligo con los codos pegados y baja controlando'],
    ['Peso muerto', '', '', 'Erectores de la columna', 'Erectores / glúteo / isquiosurales'],
    ['Rack pull', '', '', 'Erectores de la columna', 'Erectores / trapecio'],
    ['Superman', '', 'Lumbar', 'Erectores de la columna', 'Erectores lumbares'],
    ['Encogimientos de trapecio', 'Encogimientos con barra por detrás', 'Trapecio', 'Trapecio', 'Trapecio superior', 'Barra', 'Intermedio',
      'Barra por detrás de los muslos con agarre al ancho de los hombros~Sube los hombros hacia las orejas, pausa 1 s y baja despacio'],
    ['Face pull', '', 'Hombros', 'Deltoides', 'Deltoides posterior / trapecio medio'],
    ['Hiperextensión de cadera', 'Extensión de cadera en banco a 45°'],
    ['Colgarse de la barra', 'Suspensión en barra'],
    ['Rotación externa en polea', '', '', 'Manguito rotador', 'Infraespinoso / redondo menor'],
    ['Press cubano', '', '', 'Manguito rotador', 'Manguito rotador / deltoides'],
    ['Pull-apart con banda', '', '', 'Deltoides', 'Deltoides posterior / romboides'],
    ['Balanceo con kettlebell', 'Swing con kettlebell'],
    ['Abducción de cadera en máquina', '', 'Abductores', 'Glúteo medio', 'Glúteo medio / menor'],
    ['Abducción con banda', '', 'Abductores', 'Glúteo medio', 'Glúteo medio / menor'],
    ['Hip thrust con banda', '', '', '', 'Glúteo mayor / medio'],
    ['Extensión Tate', 'Press Tate'],
    ['Flexiones con pies elevados', 'Flexiones con palmada', '', '', 'Pectoral esternal', '', 'Avanzado',
      'Posición de flexión con las manos al ancho de los hombros~Baja controlando, empuja explosivo hasta despegar las manos, da una palmada y aterriza suave'],
    ['Curl en banco Scott con mancuerna', 'Curl predicador con mancuerna'],
    ['Elevaciones laterales inclinado', 'Elevaciones laterales en banco inclinado'],
    ['Press de banca agarre cerrado en Smith', 'Press cerrado en Smith'],
    ['Flexiones en banco para tríceps', 'Flexiones cerradas con manos en banco'],
    ['Sentadilla con barra a la espalda baja', 'Sentadilla con barra baja', '', '', 'Glúteo / vasto lateral'],
    ['Peso muerto rumano a una pierna con mancuerna', 'Peso muerto con piernas rígidas', '', '', 'Bíceps femoral / semitendinoso', 'Barra', 'Intermedio',
      'Pies a la anchura de la cadera y rodillas casi estiradas~Baja la barra pegada a las piernas llevando la cadera atrás hasta notar el estiramiento y sube apretando los glúteos'],
    ['Gemelos en máquina de prensa a una pierna', 'Gemelos a una pierna en prensa'],
    ['Gemelos tibial anterior', 'Elevación de tibial anterior', '', 'Tibial anterior', 'Tibial anterior'],
  ];
  // Secundarios y tipo de los que pasan a ser otro ejercicio
  const XDN = {
    'Extensión de tríceps tumbado con mancuernas': { sec: [], ty: 'Aislamiento' },
    'Elevación de gemelos tipo burro': { sec: [], ty: 'Aislamiento' },
    'Remo con barra agarre supino': { sec: ['Bíceps', 'Trapecio'], ty: 'Compuesto' },
    'Encogimientos con barra por detrás': { sec: ['Antebrazo'], ty: 'Aislamiento' },
    'Flexiones con palmada': { sec: ['Tríceps', 'Hombros'], ty: 'Compuesto' },
    'Peso muerto con piernas rígidas': { sec: ['Glúteos', 'Espalda'], ty: 'Compuesto' },
  };

  let fixed = 0;
  FIX.forEach(([from, to, g, m, h, eq, lv, tips]) => {
    const i = EX.findIndex((e) => e[0] === from);
    if (i < 0) return;
    const e = EX[i], name = to || from;
    if (to && EX.some((x) => x[0] === to)) return; // ya existe con ese nombre
    if (to) {
      e[0] = to;
      if (typeof XD === 'object' && XD[from]) { XD[to] = XD[from]; delete XD[from]; }
    }
    if (g) e[1] = g;
    if (m) e[2] = m;
    if (h) { e[3] = h; e.head = h; }
    if (eq) e[4] = eq;
    if (lv) e[5] = lv;
    if (tips && typeof DET === 'object') { const p = tips.split('~'); DET[i] = [p[0], p[1], 'No especificado', 'No especificado']; }
    if (XDN[name] && typeof XD === 'object') XD[name] = Object.assign({}, XD[name] || {}, XDN[name]);
    if (typeof XD === 'object' && XD[name] && (h || m)) delete XD[name].z; // la zona antigua ya no vale
    fixed++;
  });

  // nombre|grupo|músculo|porción|material|nivel|secundarios|tipo||preparación~ejecución
  const ROWS = `
Aducción de cadera en máquina|Aductores|Aductores|Aductor mayor / largo|Máquina|Principiante||Aislamiento||Sentado con la espalda apoyada y las almohadillas por dentro de las rodillas~Junta las piernas apretando, pausa 1 s y abre despacio sin que el peso choque
Aducción en polea|Aductores|Aductores|Aductor largo / corto|Polea|Intermedio|Core|Aislamiento||De lado a la polea baja con la tobillera en la pierna más cercana~Cruza la pierna por delante de la otra con la cadera quieta y vuelve controlando
Plancha Copenhague|Aductores|Aductores|Aductor mayor / largo|Peso corporal|Avanzado|Core|Aislamiento||Plancha lateral con la pierna de arriba apoyada en un banco por la rodilla o el tobillo~Eleva la cadera hasta alinear el cuerpo y aguanta sin dejarla caer
Sentadilla cosaca|Aductores|Aductores|Aductor mayor / glúteo|Peso corporal|Intermedio|Cuádriceps,Glúteos|Compuesto||Pies muy separados y puntas algo abiertas~Baja hacia un lado con esa rodilla doblada y la otra pierna estirada, y cambia de lado
Zancada lateral|Aductores|Aductores|Aductor mayor / vasto medial|Mancuernas|Principiante|Cuádriceps,Glúteos|Compuesto||De pie con una mancuerna en cada mano~Da un paso amplio al lado, baja la cadera atrás con la otra pierna estirada y vuelve empujando
Aducción tumbado de lado|Aductores|Aductores|Aductor largo / grácil|Peso corporal|Principiante||Aislamiento||Tumbado de lado con la pierna de arriba doblada y apoyada por delante~Sube la pierna de abajo estirada unos centímetros, pausa y baja despacio
Aducción con balón entre las rodillas|Aductores|Aductores|Aductor largo / pectíneo|Peso corporal|Principiante||Aislamiento||Boca arriba con las rodillas dobladas y un balón o cojín entre ellas~Aprieta el balón 5 s con fuerza, suelta y repite
Abducción de cadera en polea|Abductores|Glúteo medio|Glúteo medio / menor|Polea|Intermedio||Aislamiento||De lado a la polea baja con la tobillera en la pierna más alejada~Separa la pierna hacia fuera sin inclinar el tronco y vuelve controlando
Elevación lateral de pierna tumbado|Abductores|Glúteo medio|Glúteo medio / menor|Peso corporal|Principiante||Aislamiento||Tumbado de lado con el cuerpo en línea recta~Sube la pierna de arriba estirada, con la punta mirando al frente, y baja despacio
Almeja con banda|Abductores|Glúteo medio|Glúteo medio / menor|Bandas|Principiante|Glúteos|Aislamiento||Tumbado de lado con las rodillas dobladas y una banda sobre ellas~Abre la rodilla de arriba sin separar los pies ni girar la cadera
Paso lateral con banda|Abductores|Glúteo medio|Glúteo medio / menor|Bandas|Principiante|Glúteos,Cuádriceps|Compuesto||Banda sobre las rodillas o los tobillos y media sentadilla~Da pasos laterales cortos sin juntar los pies y sin perder la tensión
Plancha lateral con abducción|Abductores|Glúteo medio|Glúteo medio / menor|Peso corporal|Avanzado|Core|Aislamiento||Plancha lateral sobre el antebrazo con el cuerpo recto~Eleva la pierna de arriba sin bajar la cadera, pausa y baja
Abducción sentado con banda|Abductores|Glúteo medio|Glúteo medio / menor|Bandas|Principiante||Aislamiento||Sentado al borde de un banco con una banda sobre las rodillas~Abre las rodillas hacia fuera, pausa 1 s y vuelve despacio
Abducción en cuadrupedia|Abductores|Glúteo medio|Glúteo medio / menor|Peso corporal|Principiante|Glúteos,Core|Aislamiento||A cuatro patas con la espalda neutra~Eleva la rodilla doblada hacia el lado sin girar el tronco y baja
Hiperextensiones lumbares|Lumbar|Erectores de la columna|Erectores lumbares|Peso corporal|Principiante|Glúteos,Isquiosurales|Aislamiento||Cadera apoyada en el banco romano y tobillos sujetos~Baja el tronco con la espalda neutra y sube hasta alinear el cuerpo, sin pasar de la horizontal
Hiperextensión inversa|Lumbar|Erectores de la columna|Erectores lumbares / glúteo|Máquina|Intermedio|Glúteos,Isquiosurales|Aislamiento||Boca abajo con la cadera en el borde del banco, agarrado a la máquina~Sube las piernas juntas hasta la horizontal con los glúteos y bájalas controlando
Extensión lumbar en máquina|Lumbar|Erectores de la columna|Erectores lumbares|Máquina|Principiante||Aislamiento||Sentado con el respaldo a la altura de la espalda media y los pies sujetos~Empuja hacia atrás despacio hasta erguirte y vuelve sin dejar caer el peso
Natación en el suelo|Lumbar|Erectores de la columna|Erectores / multífidos|Peso corporal|Principiante|Glúteos,Hombros|Aislamiento||Boca abajo con brazos y piernas estirados y un poco elevados~Sube brazo y pierna contrarios alternando, sin tensar el cuello
Buenos días sentado|Lumbar|Erectores de la columna|Erectores lumbares|Barra|Avanzado|Isquiosurales,Glúteos|Compuesto||Sentado en un banco con la barra en la espalda y la espalda neutra~Inclina el tronco hacia delante desde la cadera y vuelve a subir sin redondear
Jefferson curl|Lumbar|Erectores de la columna|Erectores (movilidad)|Mancuernas|Avanzado|Isquiosurales|Aislamiento||De pie sobre un escalón con un peso muy ligero~Enrolla la columna vértebra a vértebra hacia abajo y desenróllala despacio para subir
Extensión de muñeca con mancuerna|Antebrazo|Antebrazo|Extensores de la muñeca|Mancuernas|Principiante||Aislamiento||Antebrazo apoyado en el muslo con la palma hacia abajo~Sube el dorso de la mano y baja despacio todo el recorrido
Pronación y supinación con mancuerna|Antebrazo|Antebrazo|Pronadores / supinador|Mancuernas|Principiante||Aislamiento||Antebrazo apoyado y mancuerna cogida por un extremo~Gira la muñeca a un lado y al otro despacio, como una llave
Curl de muñeca por detrás con barra|Antebrazo|Antebrazo|Flexores de la muñeca|Barra|Intermedio||Aislamiento||De pie con la barra por detrás de los muslos y las palmas hacia atrás~Sube la barra flexionando solo las muñecas y déjala rodar hasta los dedos al bajar
Curl de muñeca en polea|Antebrazo|Antebrazo|Flexores de la muñeca|Polea|Principiante||Aislamiento||Arrodillado ante la polea baja con los antebrazos en un banco~Flexiona las muñecas hacia arriba y baja controlando
Suspensión en barra a una mano|Antebrazo|Antebrazo|Flexores de los dedos (agarre)|Barra de dominadas|Avanzado|Espalda|Aislamiento||Cuélgate de una mano con el hombro activo~Aguanta el tiempo marcado sin balancearte y cambia de mano
Encogimientos con barra hexagonal|Trapecio|Trapecio|Trapecio superior|Barra|Intermedio|Antebrazo|Aislamiento||Dentro de la barra hexagonal con agarre neutro~Sube los hombros en vertical, pausa y baja despacio
Elevaciones en T boca abajo|Trapecio|Trapecio|Trapecio medio / romboides|Mancuernas|Principiante|Hombros|Aislamiento||Boca abajo en un banco inclinado con mancuernas ligeras~Abre los brazos en cruz juntando las escápulas, pausa y baja
Dominadas escapulares|Trapecio|Trapecio|Trapecio inferior|Barra de dominadas|Principiante|Espalda|Aislamiento||Colgado de la barra con los brazos estirados~Baja los hombros alejándolos de las orejas sin doblar los codos y vuelve
Tirón alto con barra|Trapecio|Trapecio|Trapecio superior / medio|Barra|Avanzado|Hombros,Glúteos,Isquiosurales|Compuesto||Barra a medio muslo y agarre algo más ancho que los hombros~Extiende la cadera con fuerza y tira de la barra hasta el pecho con los codos altos
Elevación de gemelos sentado con mancuerna|Gemelos|Sóleo|Sóleo|Mancuernas|Principiante||Aislamiento||Sentado con las puntas en un escalón y la mancuerna sobre las rodillas~Sube los talones todo lo posible y baja hasta estirar
Saltos pogo|Gemelos|Gastrocnemio|Gastrocnemio|Peso corporal|Intermedio|Cuádriceps|Compuesto||De pie con las rodillas casi rectas~Rebota rápido sobre la parte delantera del pie, tocando el suelo el menor tiempo posible
Gemelos con banda|Gemelos|Gastrocnemio|Gastrocnemio|Bandas|Principiante||Aislamiento||Sentado con las piernas estiradas y la banda en la planta del pie~Empuja la punta hacia delante contra la banda y vuelve despacio
Paseo de puntillas|Gemelos|Gastrocnemio / sóleo|Gastrocnemio|Mancuernas|Principiante|Antebrazo,Core|Compuesto||Una mancuerna en cada mano y los talones elevados~Camina de puntillas sin dejar que bajen los talones
Flexión dorsal con banda|Gemelos|Tibial anterior|Tibial anterior|Bandas|Principiante||Aislamiento||Sentado con la banda en el empeine, anclada delante de ti~Lleva la punta del pie hacia ti y vuelve despacio
`.trim();
  const added = xreg(ROWS);
  window.vxCatalogo = { fixed, added };

  if (typeof GM === 'object') Object.assign(GM, { Aductores: 'Aductores', Abductores: 'Glúteo medio', Lumbar: 'Erectores de la columna', Trapecio: 'Trapecio', Antebrazo: 'Antebrazo' });
  if (typeof GS === 'object') Object.assign(GS, { Aductores: 'Glúteos, cuádriceps', Abductores: 'Glúteo mayor, tensor de la fascia lata', Lumbar: 'Glúteos, isquiosurales' });

  // Volumen semanal orientativo (series) y silueta del mapa muscular de los grupos nuevos
  try {
    if (typeof LM === 'object') {
      if (!LM.Isquiosurales) LM.Isquiosurales = [4, 6, 12, 20];
      if (!LM.Aductores) LM.Aductores = [0, 2, 8, 14];
      if (!LM.Abductores) LM.Abductores = [0, 2, 8, 14];
      if (!LM.Lumbar) LM.Lumbar = [0, 2, 8, 12];
    }
    if (typeof SHP === 'object') {
      SHP.f.Aductores = SHP.f.Aductores || 'M98 226L88 226Q83 256 90 286Q96 288 99 282Z';
      SHP.b.Abductores = SHP.b.Abductores || 'M78 204Q64 208 61 226Q66 236 73 233Q71 218 80 207Z';
      SHP.b.Lumbar = SHP.b.Lumbar || 'M100 158L86 158Q84 178 86 198L100 200Z';
    }
  } catch (e) { /* el mapa muscular sigue como estaba */ }

  if (window.vxAddTr) window.vxAddTr(`
Extensión de tríceps por encima de la cabeza en polea|Overhead cable triceps extension|Extension triceps à la poulie au-dessus de la tête|Extensão de tríceps acima da cabeça na polia
Extensión de tríceps sobre la cabeza con mancuerna|Overhead dumbbell triceps extension|Extension triceps haltère au-dessus de la tête|Extensão de tríceps acima da cabeça com halter
Extensión de tríceps tumbado con mancuernas|Lying dumbbell triceps extension|Extension triceps allongé aux haltères|Extensão de tríceps deitado com halteres
Elevación de gemelos de pie|Standing calf raise|Extension des mollets debout|Elevação de gémeos em pé
Elevación de gemelos tipo burro|Donkey calf raise|Mollets à l'âne|Elevação de gémeos tipo burro
Pájaros con mancuernas|Dumbbell reverse fly|Oiseau aux haltères|Crucifixo invertido com halteres
Press de banca en Smith|Smith machine bench press|Développé couché à la Smith|Supino na Smith
Press de banca con agarre neutro|Neutral-grip dumbbell bench press|Développé couché prise neutre|Supino com pegada neutra
Remo con barra agarre supino|Underhand barbell row|Rowing barre prise supination|Remada com barra pegada supinada
Encogimientos con barra por detrás|Behind-the-back barbell shrug|Shrugs barre derrière le dos|Encolhimentos com barra por trás
Extensión de cadera en banco a 45°|45° hip extension|Extension de hanche sur banc à 45°|Extensão de quadril no banco a 45°
Suspensión en barra|Dead hang|Suspension à la barre|Suspensão na barra
Swing con kettlebell|Kettlebell swing|Swing kettlebell|Swing com kettlebell
Press Tate|Tate press|Développé Tate|Press Tate
Flexiones con palmada|Clap push-ups|Pompes claquées|Flexões com palma
Curl predicador con mancuerna|Dumbbell preacher curl|Curl pupitre haltère|Rosca Scott com halter
Elevaciones laterales en banco inclinado|Incline bench lateral raise|Élévations latérales sur banc incliné|Elevações laterais no banco inclinado
Press cerrado en Smith|Smith machine close-grip bench press|Développé serré à la Smith|Supino fechado na Smith
Flexiones cerradas con manos en banco|Close-grip incline push-ups|Pompes serrées mains sur banc|Flexões fechadas com mãos no banco
Sentadilla con barra baja|Low-bar squat|Squat barre basse|Agachamento com barra baixa
Peso muerto con piernas rígidas|Stiff-leg deadlift|Soulevé de terre jambes tendues|Peso morto com pernas rígidas
Gemelos a una pierna en prensa|Single-leg calf press|Mollets unilatéral à la presse|Gémeos unilateral na prensa
Elevación de tibial anterior|Tibialis raise|Relevé du tibial antérieur|Elevação do tibial anterior
Aducción de cadera en máquina|Hip adduction machine|Adduction de hanche à la machine|Adução de quadril na máquina
Aducción en polea|Cable hip adduction|Adduction à la poulie|Adução na polia
Plancha Copenhague|Copenhagen plank|Gainage Copenhague|Prancha Copenhague
Sentadilla cosaca|Cossack squat|Squat cosaque|Agachamento cossaco
Zancada lateral|Lateral lunge|Fente latérale|Afundo lateral
Aducción tumbado de lado|Side-lying adduction|Adduction allongé sur le côté|Adução deitado de lado
Aducción con balón entre las rodillas|Ball squeeze adduction|Adduction avec ballon entre les genoux|Adução com bola entre os joelhos
Abducción de cadera en polea|Cable hip abduction|Abduction de hanche à la poulie|Abdução de quadril na polia
Elevación lateral de pierna tumbado|Side-lying leg raise|Élévation latérale de jambe allongé|Elevação lateral de perna deitado
Almeja con banda|Banded clamshell|Clamshell à l'élastique|Ostra com banda
Paso lateral con banda|Banded lateral walk|Pas chassés à l'élastique|Passo lateral com banda
Plancha lateral con abducción|Side plank with leg raise|Gainage latéral avec abduction|Prancha lateral com abdução
Abducción sentado con banda|Seated banded abduction|Abduction assis à l'élastique|Abdução sentado com banda
Abducción en cuadrupedia|Fire hydrant|Abduction à quatre pattes|Abdução em quatro apoios
Hiperextensiones lumbares|Back extensions|Extensions lombaires|Hiperextensões lombares
Hiperextensión inversa|Reverse hyperextension|Hyperextension inversée|Hiperextensão invertida
Extensión lumbar en máquina|Back extension machine|Extension lombaire à la machine|Extensão lombar na máquina
Natación en el suelo|Floor swimmers|Nageur au sol|Natação no chão
Buenos días sentado|Seated good morning|Good morning assis|Bom dia sentado
Jefferson curl|Jefferson curl|Jefferson curl|Jefferson curl
Extensión de muñeca con mancuerna|Dumbbell wrist extension|Extension du poignet haltère|Extensão de punho com halter
Pronación y supinación con mancuerna|Dumbbell pronation and supination|Pronation et supination haltère|Pronação e supinação com halter
Curl de muñeca por detrás con barra|Behind-the-back barbell wrist curl|Curl poignets barre derrière le dos|Rosca de punho com barra por trás
Curl de muñeca en polea|Cable wrist curl|Curl poignets à la poulie|Rosca de punho na polia
Suspensión en barra a una mano|One-arm dead hang|Suspension à une main|Suspensão na barra com uma mão
Encogimientos con barra hexagonal|Trap bar shrug|Shrugs à la trap bar|Encolhimentos com barra hexagonal
Elevaciones en T boca abajo|Prone T raise|Élévations en T allongé|Elevações em T deitado
Dominadas escapulares|Scapular pull-ups|Tractions scapulaires|Elevações escapulares
Tirón alto con barra|Barbell high pull|Tirage haut à la barre|Puxada alta com barra
Elevación de gemelos sentado con mancuerna|Seated dumbbell calf raise|Mollets assis haltère|Elevação de gémeos sentado com halter
Saltos pogo|Pogo jumps|Sauts pogo|Saltos pogo
Gemelos con banda|Banded calf press|Mollets à l'élastique|Gémeos com banda
Paseo de puntillas|Tiptoe farmer walk|Marche sur la pointe des pieds|Caminhada na ponta dos pés
Flexión dorsal con banda|Banded dorsiflexion|Flexion dorsale à l'élastique|Flexão dorsal com banda
Erectores de la columna|Spinal erectors|Érecteurs du rachis|Eretores da espinha
Erectores lumbares|Lower-back erectors|Érecteurs lombaires|Eretores lombares
Erectores lumbares / glúteo|Lower-back erectors / glutes|Érecteurs lombaires / fessiers|Eretores lombares / glúteo
Erectores / multífidos|Erectors / multifidus|Érecteurs / multifides|Eretores / multífidos
Erectores (movilidad)|Erectors (mobility)|Érecteurs (mobilité)|Eretores (mobilidade)
Erectores / glúteo / isquiosurales|Erectors / glutes / hamstrings|Érecteurs / fessiers / ischio-jambiers|Eretores / glúteo / isquiotibiais
Erectores / trapecio|Erectors / traps|Érecteurs / trapèzes|Eretores / trapézio
Manguito rotador|Rotator cuff|Coiffe des rotateurs|Manguito rotador
Infraespinoso / redondo menor|Infraspinatus / teres minor|Infra-épineux / petit rond|Infraespinhal / redondo menor
Manguito rotador / deltoides|Rotator cuff / delts|Coiffe des rotateurs / deltoïdes|Manguito rotador / deltoide
Glúteo medio|Gluteus medius|Moyen fessier|Glúteo médio
Glúteo medio / menor|Gluteus medius / minimus|Moyen / petit fessier|Glúteo médio / mínimo
Glúteo mayor / medio|Gluteus maximus / medius|Grand / moyen fessier|Glúteo máximo / médio
Glúteo / vasto lateral|Glutes / vastus lateralis|Fessiers / vaste latéral|Glúteo / vasto lateral
Sóleo|Soleus|Soléaire|Sóleo
Tibial anterior|Tibialis anterior|Tibial antérieur|Tibial anterior
Gastrocnemio|Gastrocnemius|Gastrocnémien|Gastrocnémio
Aductor mayor / largo|Adductor magnus / longus|Grand / long adducteur|Adutor magno / longo
Aductor largo / corto|Adductor longus / brevis|Long / court adducteur|Adutor longo / curto
Aductor mayor / glúteo|Adductor magnus / glutes|Grand adducteur / fessiers|Adutor magno / glúteo
Aductor mayor / vasto medial|Adductor magnus / vastus medialis|Grand adducteur / vaste médial|Adutor magno / vasto medial
Aductor largo / grácil|Adductor longus / gracilis|Long adducteur / gracile|Adutor longo / grácil
Aductor largo / pectíneo|Adductor longus / pectineus|Long adducteur / pectiné|Adutor longo / pectíneo
Pronadores / supinador|Pronators / supinator|Pronateurs / supinateur|Pronadores / supinador
Trapecio medio / romboides|Middle traps / rhomboids|Trapèze moyen / rhomboïdes|Trapézio médio / romboides
Trapecio inferior|Lower traps|Trapèze inférieur|Trapézio inferior
Trapecio superior / medio|Upper / middle traps|Trapèze supérieur / moyen|Trapézio superior / médio
Deltoides posterior / trapecio medio|Rear delts / middle traps|Deltoïde postérieur / trapèze moyen|Deltoide posterior / trapézio médio
Deltoides posterior / romboides|Rear delts / rhomboids|Deltoïde postérieur / rhomboïdes|Deltoide posterior / romboides
Dorsal ancho / romboides|Lats / rhomboids|Grand dorsal / rhomboïdes|Grande dorsal / romboides
Bíceps femoral / semitendinoso|Biceps femoris / semitendinosus|Biceps fémoral / semi-tendineux|Bíceps femoral / semitendinoso
Glúteo medio, tensor de la fascia lata|Gluteus medius, TFL|Moyen fessier, tenseur du fascia lata|Glúteo médio, tensor da fáscia lata
Glúteos, cuádriceps|Glutes, quads|Fessiers, quadriceps|Glúteos, quadríceps
Glúteos, isquiosurales|Glutes, hamstrings|Fessiers, ischio-jambiers|Glúteos, isquiotibiais
Glúteo mayor, tensor de la fascia lata|Gluteus maximus, TFL|Grand fessier, tenseur du fascia lata|Glúteo máximo, tensor da fáscia lata
`);
})();
