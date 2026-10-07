/* VOLTA · 33 ejercicios nuevos, registrados con el mismo formato que usa la app (xreg):
   nombre|grupo|músculo|porción|material|nivel|secundarios|tipo||clave 1~clave 2 */
(function () {
  'use strict';
  if (typeof xreg !== 'function') return;
  const ROWS = `
Press de suelo con mancuernas|Pecho|Pectoral mayor|Pectoral esternal|Mancuernas|Intermedio|Tríceps|Compuesto||Túmbate en el suelo con los codos a unos 45° del tronco~Baja hasta apoyar los tríceps en el suelo, pausa y empuja con fuerza
Flexiones inclinadas|Pecho|Pectoral mayor|Pectoral inferior|Peso corporal|Principiante|Tríceps,Hombros|Compuesto||Apoya las manos en un banco o una caja, cuerpo en línea recta~Baja el pecho al borde del banco y empuja sin hundir la cadera
Svend press|Pecho|Pectoral mayor|Pectoral esternal|Mancuernas|Principiante|Hombros|Aislamiento||Aprieta un disco o mancuerna entre las palmas a la altura del pecho~Extiende los brazos al frente sin dejar de apretar y vuelve despacio
Remo Meadows|Espalda|Dorsal ancho|Dorsal medio / romboides|Barra|Avanzado|Bíceps|Compuesto||Barra anclada en un extremo, agarra el extremo libre con una mano~Tira del codo hacia atrás y arriba, con el torso estable
Rack pull|Espalda|Dorsal ancho|Erectores / dorsal|Barra|Avanzado|Glúteos,Isquiosurales,Trapecio|Compuesto||Barra apoyada a la altura de las rodillas en el rack~Empuja con las piernas y extiende la cadera con la espalda neutra
Remo Seal|Espalda|Dorsal ancho|Dorsal medio / romboides|Barra|Intermedio|Bíceps|Compuesto||Túmbate boca abajo en un banco alto con la barra colgando~Lleva la barra al banco juntando las escápulas, sin balanceo
Dominadas asistidas en máquina|Espalda|Dorsal ancho|Dorsal (fibras verticales)|Máquina|Principiante|Bíceps|Compuesto||Arrodíllate en la plataforma y elige la ayuda necesaria~Lleva el pecho hacia la barra y baja controlando hasta extender
Superman|Espalda|Dorsal ancho|Erectores / dorsal|Peso corporal|Principiante|Glúteos|Aislamiento||Boca abajo con brazos y piernas extendidos~Eleva brazos y piernas a la vez, aguanta 2 s y baja
Press Z|Hombros|Deltoides|Deltoides anterior|Barra|Avanzado|Tríceps,Core|Compuesto||Sentado en el suelo con las piernas estiradas y sin respaldo~Empuja la barra por encima de la cabeza sin arquear la espalda
Elevaciones en Y|Hombros|Deltoides|Deltoides lateral / trapecio|Mancuernas|Principiante|Trapecio|Aislamiento||Inclinado o boca abajo en un banco, pulgares hacia arriba~Eleva las mancuernas formando una Y con los brazos
Press Bradford|Hombros|Deltoides|Deltoides anterior / lateral|Barra|Avanzado|Tríceps|Compuesto||Pasa la barra por encima de la cabeza de delante hacia atrás~Sube solo lo justo para librar la cabeza, sin bloquear codos
Rotación externa en polea|Hombros|Deltoides|Deltoides posterior|Polea|Principiante||Aislamiento||Codo pegado al costado a 90°, polea a la altura del codo~Gira el antebrazo hacia fuera sin despegar el codo
Curl Bayesian|Bíceps|Bíceps braquial|Bíceps cabeza larga|Polea|Intermedio|Antebrazo|Aislamiento||De espaldas a la polea, el brazo queda por detrás del cuerpo~Flexiona el codo sin adelantarlo y estira del todo al bajar
Curl 21|Bíceps|Bíceps braquial|Bíceps cabeza larga / corta|Barra|Intermedio|Antebrazo|Aislamiento||7 repeticiones de abajo a la mitad, 7 de la mitad arriba~Termina con 7 repeticiones completas sin descanso
Curl Zottman|Bíceps|Bíceps braquial|Braquial / braquiorradial|Mancuernas|Intermedio|Antebrazo|Aislamiento||Sube con las palmas hacia arriba~Arriba gira las palmas hacia abajo y baja despacio
Extensión Tate|Tríceps|Tríceps braquial|Tríceps cabeza lateral / medial|Mancuernas|Intermedio||Aislamiento||Tumbado, mancuernas sobre el pecho con las palmas hacia los pies~Dobla los codos hacia fuera hasta tocar el pecho y extiende
Fondos en máquina|Tríceps|Tríceps braquial|Tríceps braquial|Máquina|Principiante|Pecho,Hombros|Compuesto||Torso erguido y codos pegados al cuerpo~Empuja hasta extender los brazos y sube controlando
Sentadilla con pausa|Cuádriceps|Cuádriceps|Recto femoral / vasto medial|Barra|Avanzado|Glúteos,Core|Compuesto||Baja como en la sentadilla normal~Mantén 2 s abajo sin rebotar y sube con fuerza
Zancada inversa|Cuádriceps|Cuádriceps|Vasto medial / glúteo|Mancuernas|Principiante|Glúteos|Compuesto||Da un paso largo hacia atrás~Baja hasta que la rodilla trasera casi toque el suelo y vuelve
Sentadilla con salto|Cuádriceps|Cuádriceps|Vasto lateral / glúteo|Peso corporal|Intermedio|Glúteos,Gemelos|Compuesto||Baja a media sentadilla~Salta explosivo y aterriza suave volviendo a la sentadilla
Sentadilla isométrica en pared|Cuádriceps|Cuádriceps|Recto femoral|Peso corporal|Principiante|Glúteos|Aislamiento||Espalda apoyada en la pared y rodillas a 90°~Aguanta la posición respirando de forma controlada
Peso muerto con kettlebell|Isquiosurales|Isquiosurales|Bíceps femoral / glúteo|Kettlebell|Principiante|Glúteos,Espalda|Compuesto||Kettlebell entre los pies, cadera atrás y espalda neutra~Sube empujando el suelo y aprieta glúteos arriba
Curl femoral deslizante|Isquiosurales|Isquiosurales|Semitendinoso / semimembranoso|Peso corporal|Intermedio|Glúteos|Aislamiento||Boca arriba, talones sobre deslizadores o una toalla, cadera elevada~Lleva los talones hacia el glúteo y estira despacio
Frog pump|Glúteos|Glúteo mayor|Glúteo mayor|Peso corporal|Principiante||Aislamiento||Boca arriba, plantas de los pies juntas y rodillas abiertas~Eleva la cadera apretando glúteos en cada repetición
Step-up lateral|Glúteos|Glúteo mayor|Glúteo medio|Mancuernas|Intermedio|Cuádriceps|Compuesto||Cajón a tu lado, sube con la pierna más cercana~Empuja con el talón y baja controlando sin impulso
Abducción con banda|Glúteos|Glúteo mayor|Glúteo medio|Bandas|Principiante||Aislamiento||Banda sobre las rodillas, sentado o de pie~Separa las rodillas contra la banda y vuelve despacio
Hollow hold|Core|Recto abdominal|Recto abdominal|Peso corporal|Intermedio||Aislamiento||Boca arriba, lumbar pegada al suelo~Eleva hombros y piernas estiradas y aguanta sin despegar la lumbar
Mountain climbers|Core|Recto abdominal|Recto abdominal inferior|Peso corporal|Principiante|Hombros,Cuádriceps|Compuesto||Posición de plancha alta~Lleva las rodillas al pecho alternando rápido sin subir la cadera
Bird dog|Core|Recto abdominal|Transverso|Peso corporal|Principiante|Glúteos,Espalda|Aislamiento||A cuatro patas con la espalda neutra~Extiende brazo y pierna contrarios, pausa y cambia
Plancha con toque de hombro|Core|Recto abdominal|Oblicuos / transverso|Peso corporal|Intermedio|Hombros|Aislamiento||Plancha alta con los pies algo separados~Toca el hombro contrario sin que la cadera rote
Saltos a la comba|Gemelos|Gastrocnemio|Gastrocnemio|Peso corporal|Principiante|Cuádriceps|Compuesto||Saltos cortos sobre la parte delantera del pie~Codos pegados y giro de la cuerda desde las muñecas
Rodillo de muñeca|Antebrazo|Antebrazo|Flexores de la muñeca|Barra|Principiante||Aislamiento||Brazos estirados al frente sujetando el rodillo~Enrolla la cuerda hasta arriba y desenróllala despacio
Encogimientos en máquina|Trapecio|Trapecio|Trapecio superior|Máquina|Principiante||Aislamiento||Hombros bajo las almohadillas, brazos relajados~Sube los hombros hacia las orejas, pausa y baja despacio
`.trim();
  const added = xreg(ROWS);
  window.vxExAdded = added; // para pruebas

  // ── Silueta con el grupo muscular correcto resaltado ──
  // La imagen de referencia de la app resalta siempre el pecho; aquí se genera una por grupo.
  const HL = {
    Pecho: '<path d="M162 82 Q184 76 198 86 L198 116 Q178 126 164 110 Z"/>',
    Hombros: '<ellipse cx="160" cy="86" rx="12" ry="15"/>',
    Bíceps: '<ellipse cx="143" cy="118" rx="9" ry="23" transform="rotate(14 143 118)"/>',
    Tríceps: '<ellipse cx="134" cy="122" rx="6.5" ry="23" transform="rotate(14 134 122)"/>',
    Antebrazo: '<ellipse cx="138" cy="193" rx="8.5" ry="24" transform="rotate(5 138 193)"/>',
    Core: '',
    Espalda: '<path d="M164 112 L180 100 L184 168 L175 176 Z"/>',
    Trapecio: '<path d="M182 66 L198 60 L198 74 L168 80 Z"/>',
    Cuádriceps: '<ellipse cx="188" cy="238" rx="11.5" ry="29"/>',
    Isquiosurales: '<ellipse cx="190" cy="248" rx="8" ry="21"/>',
    Glúteos: '<ellipse cx="186" cy="213" rx="13" ry="10"/>',
    Gemelos: '<ellipse cx="187" cy="268" rx="8.5" ry="21"/>',
  };
  const CORE = '<rect x="184" y="122" width="32" height="58" rx="9"/>';
  const cache = {};
  function groupImg(group) {
    if (cache[group]) return cache[group];
    try {
      let svg = decodeURIComponent(REF_IMG.slice(REF_IMG.indexOf(',') + 1));
      const hl = HL[group] === undefined ? null : HL[group];
      if (hl === null) return (cache[group] = REF_IMG);
      const side = hl ? `${hl}<g transform="translate(400,0) scale(-1,1)">${hl}</g>` : '';
      const mark = `<g transform="translate(0,6) scale(.9) translate(22,0)" fill="#9dff2e" opacity=".9">${side}${group === 'Core' ? CORE : ''}</g>`;
      // Sustituye el resaltado del pecho por el del grupo
      svg = svg.replace(/<g transform="translate\(0,6\) scale\(\.9\) translate\(22,0\)" fill="#9dff2e" opacity="\.9">[\s\S]*?<\/g>/, mark);
      return (cache[group] = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg));
    } catch (e) { return (cache[group] = REF_IMG); }
  }
  try { EX.forEach((e) => { if (e.image === REF_IMG) e.image = groupImg(e[1]); }); } catch (e) { /* imagen genérica */ }
  window.vxGroupImg = groupImg; // para pruebas
  if (window.vxAddTr) window.vxAddTr(`
Press de suelo con mancuernas|Dumbbell floor press|Développé au sol haltères|Supino no chão com halteres
Flexiones inclinadas|Incline push-ups|Pompes inclinées|Flexões inclinadas
Svend press|Svend press|Svend press|Svend press
Remo Meadows|Meadows row|Rowing Meadows|Remada Meadows
Rack pull|Rack pull|Rack pull|Rack pull
Remo Seal|Seal row|Rowing Seal|Remada Seal
Dominadas asistidas en máquina|Assisted pull-up machine|Tractions assistées à la machine|Elevações assistidas na máquina
Superman|Superman|Superman|Super-homem
Press Z|Z press|Z press|Press Z
Elevaciones en Y|Y raises|Élévations en Y|Elevações em Y
Press Bradford|Bradford press|Développé Bradford|Press Bradford
Rotación externa en polea|Cable external rotation|Rotation externe à la poulie|Rotação externa na polia
Curl Bayesian|Bayesian curl|Curl bayésien|Rosca bayesiana
Curl 21|21s curl|Curl 21|Rosca 21
Curl Zottman|Zottman curl|Curl Zottman|Rosca Zottman
Extensión Tate|Tate press|Extension Tate|Extensão Tate
Fondos en máquina|Machine dips|Dips à la machine|Mergulhos na máquina
Sentadilla con pausa|Pause squat|Squat avec pause|Agachamento com pausa
Zancada inversa|Reverse lunge|Fente arrière|Afundo invertido
Sentadilla con salto|Jump squat|Squat sauté|Agachamento com salto
Sentadilla isométrica en pared|Wall sit|Chaise contre le mur|Agachamento isométrico na parede
Peso muerto con kettlebell|Kettlebell deadlift|Soulevé de terre kettlebell|Peso morto com kettlebell
Curl femoral deslizante|Slider hamstring curl|Leg curl glissé|Curl femoral deslizante
Frog pump|Frog pump|Frog pump|Frog pump
Step-up lateral|Lateral step-up|Montée latérale sur box|Subida lateral ao caixote
Abducción con banda|Banded abduction|Abduction à l'élastique|Abdução com banda
Hollow hold|Hollow hold|Hollow hold|Hollow hold
Mountain climbers|Mountain climbers|Mountain climbers|Mountain climbers
Bird dog|Bird dog|Bird dog|Bird dog
Plancha con toque de hombro|Plank shoulder taps|Gainage avec touches d'épaule|Prancha com toque no ombro
Saltos a la comba|Jump rope|Corde à sauter|Saltar à corda
Rodillo de muñeca|Wrist roller|Rouleau de poignet|Rolo de punho
Encogimientos en máquina|Machine shrugs|Haussements d'épaules à la machine|Encolhimentos na máquina
`);
})();
