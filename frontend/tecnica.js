/* VOLTA · técnica correcta por familia de movimiento: colocación, ejecución, respiración, errores y consejo.
   Se muestra en la ficha de cada ejercicio y rellena los ejercicios que no tenían texto. */
(function () {
  'use strict';
  if (typeof EX === 'undefined' || typeof window.vxPattern !== 'function') return;

  // [es, en] por campo. steps y err son listas.
  const T = {
    press: {
      set: ['Túmbate con los ojos bajo la barra, junta las escápulas y llévalas hacia abajo. Pies firmes en el suelo y una ligera curva natural en la zona lumbar.', 'Lie with your eyes under the bar, squeeze your shoulder blades together and down. Feet planted and a slight natural arch in your lower back.'],
      steps: [['Agarra la barra algo más ancho que los hombros, con las muñecas rectas.', 'Grip slightly wider than shoulder width with straight wrists.'], ['Baja controlando hasta rozar el pecho, con los codos a unos 45° del cuerpo.', 'Lower under control to touch your chest, elbows about 45° from your body.'], ['Empuja hacia arriba y ligeramente hacia atrás hasta extender los brazos sin bloquear de golpe.', 'Press up and slightly back until your arms are straight without slamming the lockout.']],
      br: ['Coge aire antes de bajar y suéltalo al empujar.', 'Breathe in before lowering, breathe out as you press.'],
      err: [['Rebotar la barra en el pecho', 'Bouncing the bar off your chest'], ['Despegar los glúteos del banco', 'Lifting your glutes off the bench'], ['Abrir los codos a 90°', 'Flaring your elbows to 90°']],
      tip: ['Imagina que doblas la barra: activa la espalda y protege los hombros.', 'Try to “bend” the bar: it engages your back and protects your shoulders.'],
    },
    pushup: {
      set: ['Manos algo más anchas que los hombros, cuerpo en línea recta de la cabeza a los talones y abdomen apretado.', 'Hands slightly wider than shoulders, body in a straight line from head to heels, abs braced.'],
      steps: [['Baja el pecho hacia el suelo con los codos a unos 45°.', 'Lower your chest towards the floor, elbows about 45°.'], ['Llega hasta que el pecho casi toque el suelo sin hundir la cadera.', 'Go down until your chest nearly touches without sagging your hips.'], ['Empuja el suelo hasta extender los brazos.', 'Push the floor away until your arms are straight.']],
      br: ['Inspira al bajar, espira al subir.', 'Inhale on the way down, exhale on the way up.'],
      err: [['Hundir o subir la cadera', 'Sagging or piking your hips'], ['Mover solo la cabeza hacia el suelo', 'Dropping only your head'], ['Recorrido a medias', 'Half reps']],
      tip: ['Si cuesta, apoya las manos en un banco: más alto = más fácil.', 'If it’s too hard, put your hands on a bench: higher = easier.'],
    },
    fly: {
      set: ['Brazos extendidos sobre el pecho con los codos ligeramente flexionados, escápulas juntas.', 'Arms extended over your chest with a soft bend in the elbows, shoulder blades together.'],
      steps: [['Abre los brazos en arco manteniendo el mismo ángulo del codo.', 'Open your arms in an arc keeping the same elbow angle.'], ['Baja hasta notar estiramiento en el pecho, sin pasar la línea de los hombros.', 'Lower until you feel a chest stretch, not past shoulder level.'], ['Cierra el arco apretando el pecho, como si abrazaras un árbol.', 'Close the arc squeezing your chest, like hugging a tree.']],
      br: ['Inspira al abrir, espira al cerrar.', 'Inhale as you open, exhale as you close.'],
      err: [['Convertirlo en un press doblando mucho los codos', 'Turning it into a press by bending the elbows'], ['Bajar demasiado y forzar el hombro', 'Going too deep and straining the shoulder'], ['Usar demasiado peso', 'Using too much weight']],
      tip: ['Piensa en llevar los codos, no las manos, hacia el centro.', 'Think about bringing your elbows, not your hands, together.'],
    },
    dip: {
      set: ['Agárrate a las paralelas con los brazos extendidos y los hombros lejos de las orejas.', 'Support yourself on the bars with straight arms and shoulders away from your ears.'],
      steps: [['Baja doblando los codos de forma controlada.', 'Lower by bending your elbows under control.'], ['Para cuando los hombros queden a la altura de los codos.', 'Stop when your shoulders reach elbow height.'], ['Empuja hasta extender los brazos.', 'Press back up until your arms are straight.']],
      br: ['Inspira al bajar, espira al subir.', 'Inhale down, exhale up.'],
      err: [['Bajar demasiado y forzar el hombro', 'Going too low and straining the shoulder'], ['Encoger los hombros', 'Shrugging your shoulders'], ['Balancear las piernas', 'Swinging your legs']],
      tip: ['Inclínate hacia delante para más pecho; vertical para más tríceps.', 'Lean forward for more chest; stay upright for more triceps.'],
    },
    ohp: {
      set: ['De pie con los pies al ancho de la cadera, glúteos y abdomen apretados, barra o mancuernas a la altura de los hombros.', 'Stand feet hip-width, glutes and abs tight, bar or dumbbells at shoulder height.'],
      steps: [['Empuja en línea recta hacia arriba, apartando la cabeza un poco para dejar pasar la barra.', 'Press straight up, moving your head slightly back to clear the bar.'], ['Termina con los brazos junto a las orejas y el peso sobre la mitad del pie.', 'Finish with arms by your ears and the weight over mid-foot.'], ['Baja controlando hasta la clavícula.', 'Lower under control to your collarbone.']],
      br: ['Coge aire y aprieta el abdomen antes de empujar; suelta arriba.', 'Breathe in and brace before pressing; exhale at the top.'],
      err: [['Arquear mucho la espalda', 'Over-arching your lower back'], ['Empujar la barra hacia delante', 'Pressing the bar forward'], ['Bloquear las rodillas de golpe para ayudarte', 'Using your legs to cheat the press']],
      tip: ['Aprieta los glúteos: es la mejor protección para la zona lumbar.', 'Squeeze your glutes: it’s the best protection for your lower back.'],
    },
    raise: {
      set: ['De pie, ligera flexión de codos y una mancuerna en cada mano junto al cuerpo.', 'Stand with a soft bend in your elbows and a dumbbell in each hand by your sides.'],
      steps: [['Eleva los brazos hasta la altura de los hombros, guiando con los codos.', 'Raise your arms to shoulder height, leading with your elbows.'], ['Pausa un segundo arriba sin encoger los hombros.', 'Pause for a second at the top without shrugging.'], ['Baja despacio, en unos 2–3 segundos.', 'Lower slowly, over 2–3 seconds.']],
      br: ['Espira al subir, inspira al bajar.', 'Exhale up, inhale down.'],
      err: [['Balancear el cuerpo para subir el peso', 'Swinging your body to lift the weight'], ['Subir por encima de los hombros', 'Raising above shoulder height'], ['Encoger el trapecio', 'Shrugging your traps']],
      tip: ['Menos peso y más control: es un músculo pequeño.', 'Less weight, more control: it’s a small muscle.'],
    },
    reardelt: {
      set: ['Inclínate hacia delante con la espalda recta y los brazos colgando bajo los hombros.', 'Hinge forward with a flat back and your arms hanging under your shoulders.'],
      steps: [['Abre los brazos hacia los lados y atrás con los codos ligeramente flexionados.', 'Open your arms out and back with soft elbows.'], ['Junta un poco las escápulas al final.', 'Squeeze your shoulder blades slightly at the end.'], ['Vuelve despacio a la posición inicial.', 'Return slowly to the start.']],
      br: ['Espira al abrir, inspira al bajar.', 'Exhale as you open, inhale as you lower.'],
      err: [['Tirar con la espalda baja', 'Pulling with your lower back'], ['Usar impulso', 'Using momentum'], ['Encoger los hombros', 'Shrugging']],
      tip: ['Piensa en llevar las manos hacia las paredes, no hacia el techo.', 'Think about reaching your hands to the walls, not the ceiling.'],
    },
    shrug: {
      set: ['De pie, peso en las manos con los brazos estirados y relajados.', 'Stand holding the weight with straight, relaxed arms.'],
      steps: [['Sube los hombros hacia las orejas en línea recta.', 'Lift your shoulders straight up towards your ears.'], ['Aguanta un segundo arriba.', 'Hold for a second at the top.'], ['Baja del todo, estirando el trapecio.', 'Lower all the way to stretch the traps.']],
      br: ['Espira al subir, inspira al bajar.', 'Exhale up, inhale down.'],
      err: [['Girar los hombros en círculo', 'Rolling your shoulders'], ['Doblar los codos', 'Bending your elbows'], ['Adelantar la cabeza', 'Pushing your head forward']],
      tip: ['Mejor recorrido completo que más peso.', 'Full range beats more weight.'],
    },
    squat: {
      set: ['Pies al ancho de los hombros y puntas algo abiertas. Pecho alto y abdomen firme. Si usas barra, apóyala sobre los trapecios, no sobre el cuello.', 'Feet shoulder-width, toes slightly out. Chest up, abs braced. With a barbell, rest it on your traps, not your neck.'],
      steps: [['Lleva la cadera atrás y abajo a la vez que doblas las rodillas.', 'Send your hips back and down as you bend your knees.'], ['Baja hasta que los muslos queden al menos paralelos, rodillas en la dirección de los pies.', 'Lower until your thighs are at least parallel, knees tracking over your toes.'], ['Sube empujando el suelo con todo el pie.', 'Drive up pushing the floor with your whole foot.']],
      br: ['Coge aire y aprieta el abdomen antes de bajar; suelta al terminar de subir.', 'Breathe in and brace before descending; exhale as you finish the rep.'],
      err: [['Rodillas hacia dentro', 'Knees caving in'], ['Levantar los talones', 'Heels coming up'], ['Redondear la espalda abajo', 'Rounding your back at the bottom']],
      tip: ['Abre el suelo con los pies: activa glúteos y mantiene las rodillas alineadas.', 'Try to “spread the floor” with your feet: it fires the glutes and aligns your knees.'],
    },
    lunge: {
      set: ['De pie, peso en las manos si lo usas, torso erguido y abdomen firme.', 'Stand tall holding the weight if using one, abs braced.'],
      steps: [['Da un paso largo y baja la rodilla trasera hacia el suelo.', 'Take a long step and lower your back knee towards the floor.'], ['La rodilla delantera queda sobre el pie, sin pasar mucho de la punta.', 'Keep the front knee over your foot.'], ['Empuja con el talón delantero para volver.', 'Push through your front heel to come back.']],
      br: ['Inspira al bajar, espira al subir.', 'Inhale down, exhale up.'],
      err: [['Paso demasiado corto', 'Stepping too short'], ['Rodilla delantera hacia dentro', 'Front knee caving in'], ['Inclinar el torso hacia delante', 'Leaning your torso forward']],
      tip: ['Más paso = más glúteo; paso corto = más cuádriceps.', 'Longer step = more glutes; shorter step = more quads.'],
    },
    hinge: {
      set: ['Pies al ancho de la cadera, peso cerca de las piernas, espalda neutra y hombros encima de la barra.', 'Feet hip-width, weight close to your legs, neutral back, shoulders over the bar.'],
      steps: [['Lleva la cadera hacia atrás como si cerraras una puerta con los glúteos.', 'Push your hips back as if closing a door with your glutes.'], ['Baja el peso pegado a las piernas manteniendo la espalda recta.', 'Lower the weight close to your legs keeping your back flat.'], ['Sube extendiendo la cadera y apretando glúteos arriba, sin echarte hacia atrás.', 'Stand up by driving your hips forward and squeezing your glutes, without leaning back.']],
      br: ['Coge aire y bloquea el abdomen antes de cada repetición.', 'Breathe in and brace before every rep.'],
      err: [['Redondear la espalda', 'Rounding your back'], ['Separar el peso de las piernas', 'Letting the weight drift away from your legs'], ['Hiperextender la lumbar arriba', 'Over-extending at the top']],
      tip: ['Si notas la espalda baja más que los isquios, baja menos y saca más la cadera.', 'If you feel it more in your lower back than your hamstrings, go less deep and push your hips back more.'],
    },
    row: {
      set: ['Inclínate con la espalda recta (unos 30–45°), rodillas algo flexionadas y brazos estirados.', 'Hinge forward with a flat back (about 30–45°), soft knees, arms straight.'],
      steps: [['Tira de los codos hacia atrás, rozando el cuerpo.', 'Pull your elbows back close to your body.'], ['Junta las escápulas al final del recorrido.', 'Squeeze your shoulder blades at the end.'], ['Baja controlando hasta estirar los brazos.', 'Lower under control until your arms are straight.']],
      br: ['Espira al tirar, inspira al bajar.', 'Exhale as you pull, inhale as you lower.'],
      err: [['Levantar el torso con cada repetición', 'Lifting your torso on every rep'], ['Tirar solo con los brazos', 'Pulling only with your arms'], ['Redondear la espalda', 'Rounding your back']],
      tip: ['Piensa en llevar los codos al bolsillo trasero.', 'Think about driving your elbows to your back pockets.'],
    },
    vpull: {
      set: ['Agarre algo más ancho que los hombros, pecho alto y escápulas hacia abajo.', 'Grip slightly wider than your shoulders, chest up, shoulder blades down.'],
      steps: [['Empieza bajando las escápulas, sin doblar aún los codos.', 'Start by pulling your shoulder blades down before bending your elbows.'], ['Tira de los codos hacia los costados hasta llevar el pecho a la barra.', 'Drive your elbows to your sides until your chest meets the bar.'], ['Vuelve controlando hasta estirar los brazos.', 'Return under control to straight arms.']],
      br: ['Espira al tirar, inspira al volver.', 'Exhale as you pull, inhale as you return.'],
      err: [['Balancearse o dar tirones', 'Swinging or kipping'], ['Tirar con los bíceps, no con la espalda', 'Pulling with your biceps instead of your back'], ['Recorrido incompleto', 'Partial range of motion']],
      tip: ['Imagina que rompes la barra hacia fuera: activa más el dorsal.', 'Imagine bending the bar outwards: it recruits more lats.'],
    },
    curl: {
      set: ['De pie, codos pegados al cuerpo, muñecas rectas y hombros quietos.', 'Stand with elbows tucked, straight wrists and still shoulders.'],
      steps: [['Sube el peso doblando solo los codos.', 'Curl the weight bending only at the elbows.'], ['Aprieta el bíceps arriba un segundo.', 'Squeeze your biceps at the top for a second.'], ['Baja despacio hasta estirar casi del todo.', 'Lower slowly to almost full extension.']],
      br: ['Espira al subir, inspira al bajar.', 'Exhale up, inhale down.'],
      err: [['Balancear el cuerpo', 'Swinging your body'], ['Adelantar los codos', 'Letting your elbows drift forward'], ['Bajar a medias', 'Not lowering fully']],
      tip: ['La bajada lenta (2–3 s) hace crecer más que el peso extra.', 'A slow lowering (2–3 s) builds more muscle than extra weight.'],
    },
    triceps: {
      set: ['Codos fijos junto al cuerpo (o junto a la cabeza en las versiones por encima), abdomen firme.', 'Elbows fixed by your sides (or by your head in overhead versions), abs braced.'],
      steps: [['Extiende el codo hasta estirar el brazo por completo.', 'Extend your elbow until your arm is fully straight.'], ['Aprieta el tríceps un segundo al final.', 'Squeeze your triceps for a second at the end.'], ['Vuelve despacio sin mover el codo de sitio.', 'Return slowly without moving your elbow.']],
      br: ['Espira al extender, inspira al volver.', 'Exhale as you extend, inhale as you return.'],
      err: [['Mover los codos', 'Moving your elbows'], ['Echarse encima del peso', 'Leaning over the weight'], ['Recorrido corto', 'Short range of motion']],
      tip: ['Las versiones por encima de la cabeza estiran más la cabeza larga del tríceps.', 'Overhead versions stretch the long head of the triceps more.'],
    },
    legext: {
      set: ['Siéntate con la espalda apoyada y el rodillo sobre los tobillos; ajusta el eje de la máquina a la rodilla.', 'Sit with your back supported and the pad on your ankles; align the machine’s pivot with your knee.'],
      steps: [['Extiende las rodillas hasta estirar las piernas.', 'Extend your knees until your legs are straight.'], ['Aprieta el cuádriceps un segundo arriba.', 'Squeeze your quads for a second at the top.'], ['Baja despacio sin dejar caer el peso.', 'Lower slowly without dropping the stack.']],
      br: ['Espira al subir, inspira al bajar.', 'Exhale up, inhale down.'],
      err: [['Dar patadas con impulso', 'Kicking with momentum'], ['Levantar la cadera del asiento', 'Lifting your hips off the seat'], ['Eje mal ajustado', 'Misaligned pivot']],
      tip: ['Agárrate a los asas para no despegarte del asiento.', 'Hold the handles to stay planted in the seat.'],
    },
    legcurl: {
      set: ['Ajusta el rodillo justo encima de los talones y alinea la rodilla con el eje de la máquina.', 'Set the pad just above your heels and align your knee with the pivot.'],
      steps: [['Lleva los talones hacia los glúteos.', 'Curl your heels towards your glutes.'], ['Pausa un segundo con el músculo contraído.', 'Pause for a second with the muscle squeezed.'], ['Vuelve despacio hasta casi estirar.', 'Return slowly to almost straight.']],
      br: ['Espira al flexionar, inspira al volver.', 'Exhale as you curl, inhale as you return.'],
      err: [['Levantar la cadera', 'Lifting your hips'], ['Bajar de golpe', 'Dropping the weight'], ['Recorrido corto', 'Short range']],
      tip: ['Las puntas hacia ti (pie flexionado) implican más isquios.', 'Pulling your toes towards you recruits the hamstrings more.'],
    },
    legpress: {
      set: ['Espalda y glúteos bien apoyados, pies al ancho de los hombros en la mitad de la plataforma.', 'Back and glutes fully supported, feet shoulder-width in the middle of the platform.'],
      steps: [['Quita los seguros y baja doblando las rodillas hacia el pecho.', 'Release the safeties and lower by bending your knees towards your chest.'], ['Para antes de que la zona lumbar se despegue del respaldo.', 'Stop before your lower back lifts off the pad.'], ['Empuja con todo el pie sin bloquear las rodillas arriba.', 'Push with your whole foot without locking your knees.']],
      br: ['Inspira al bajar, espira al empujar.', 'Inhale down, exhale as you push.'],
      err: [['Despegar la lumbar', 'Lifting your lower back'], ['Bloquear las rodillas', 'Locking your knees'], ['Rodillas hacia dentro', 'Knees caving in']],
      tip: ['Pies altos = más glúteo; pies bajos = más cuádriceps.', 'Feet high = more glutes; feet low = more quads.'],
    },
    glute: {
      set: ['Espalda alta apoyada (o en el suelo en el puente), pies firmes al ancho de la cadera y la barbilla hacia el pecho.', 'Upper back supported (or on the floor for bridges), feet hip-width, chin tucked.'],
      steps: [['Empuja con los talones y sube la cadera.', 'Drive through your heels and lift your hips.'], ['Arriba, tronco y muslos en línea y glúteos apretados un segundo.', 'At the top, torso and thighs in line, squeeze your glutes for a second.'], ['Baja controlando sin apoyar del todo.', 'Lower under control without fully resting.']],
      br: ['Espira al subir, inspira al bajar.', 'Exhale up, inhale down.'],
      err: [['Arquear la zona lumbar arriba', 'Arching your lower back at the top'], ['Empujar con las puntas', 'Pushing through your toes'], ['Rodillas hacia dentro', 'Knees caving in']],
      tip: ['Si lo notas en los isquios, acerca los pies; si es en el cuádriceps, aléjalos.', 'Feel it in your hamstrings? Bring your feet closer. In your quads? Move them away.'],
    },
    calf: {
      set: ['Puntas sobre un escalón o el suelo, rodillas casi estiradas y cuerpo erguido.', 'Balls of your feet on a step or the floor, knees nearly straight, body upright.'],
      steps: [['Sube los talones todo lo que puedas.', 'Rise up onto your toes as high as you can.'], ['Aguanta un segundo arriba.', 'Hold for a second at the top.'], ['Baja hasta notar estiramiento en el gemelo.', 'Lower until you feel a calf stretch.']],
      br: ['Respira de forma continua.', 'Breathe steadily.'],
      err: [['Rebotar abajo', 'Bouncing at the bottom'], ['Recorrido corto', 'Short range'], ['Doblar las rodillas para ayudarte', 'Bending your knees to help']],
      tip: ['Haz una pausa de 2 s abajo: elimina el rebote y crece más.', 'Pause 2 s at the bottom: no bounce, more growth.'],
    },
    plank: {
      set: ['Antebrazos o manos bajo los hombros, cuerpo recto y abdomen y glúteos apretados.', 'Forearms or hands under your shoulders, body straight, abs and glutes tight.'],
      steps: [['Mantén la línea de la cabeza a los talones.', 'Keep a straight line from head to heels.'], ['Empuja el suelo con los antebrazos para no hundirte entre los hombros.', 'Push the floor away so you don’t sink between your shoulders.'], ['Aguanta el tiempo marcado sin perder la postura.', 'Hold for the set time without losing position.']],
      br: ['Respira corto y continuo sin soltar el abdomen.', 'Take short, steady breaths without relaxing your abs.'],
      err: [['Hundir la cadera', 'Sagging hips'], ['Subir el culo', 'Piking your hips'], ['Aguantar la respiración', 'Holding your breath']],
      tip: ['Mejor 20 s perfectos que 1 min hundido.', 'Better 20 perfect seconds than a sagging minute.'],
    },
    crunch: {
      set: ['Tumbado o colgado según el ejercicio, zona lumbar controlada y abdomen activo.', 'Lying or hanging depending on the exercise, lower back controlled, abs engaged.'],
      steps: [['Acerca costillas y pelvis enrollando la columna.', 'Bring your ribs and pelvis together by curling your spine.'], ['Aprieta el abdomen un segundo al final.', 'Squeeze your abs for a second at the end.'], ['Vuelve despacio sin dejarte caer.', 'Return slowly without dropping.']],
      br: ['Espira al encoger, inspira al volver.', 'Exhale as you crunch, inhale as you return.'],
      err: [['Tirar del cuello con las manos', 'Pulling on your neck'], ['Usar impulso', 'Using momentum'], ['Arquear la lumbar al bajar', 'Arching your back on the way down']],
      tip: ['Piensa en acortar el abdomen, no en subir el cuerpo.', 'Think about shortening your abs, not lifting your body.'],
    },
    carry: {
      set: ['Un peso en cada mano, hombros abajo y atrás, mirada al frente.', 'A weight in each hand, shoulders down and back, eyes forward.'],
      steps: [['Camina con pasos cortos y firmes.', 'Walk with short, firm steps.'], ['No dejes que el cuerpo se incline hacia ningún lado.', 'Don’t let your body lean to either side.'], ['Deja el peso con la espalda recta al terminar.', 'Put the weight down with a flat back when done.']],
      br: ['Respira de forma continua con el abdomen firme.', 'Breathe steadily with your abs braced.'],
      err: [['Encoger los hombros', 'Shrugging'], ['Inclinar el tronco', 'Leaning your torso'], ['Pasos largos e inestables', 'Long, unstable strides']],
      tip: ['Gran ejercicio para el agarre y el core: úsalo al final del entreno.', 'Great for grip and core: use it at the end of your session.'],
    },
    jump: {
      set: ['Pies al ancho de la cadera, brazos listos para impulsar.', 'Feet hip-width, arms ready to drive.'],
      steps: [['Baja rápido a media sentadilla.', 'Dip quickly into a half squat.'], ['Salta de forma explosiva estirando cadera, rodillas y tobillos.', 'Jump explosively extending hips, knees and ankles.'], ['Aterriza suave sobre la parte delantera del pie y amortigua.', 'Land softly on the balls of your feet and absorb.']],
      br: ['Espira en el salto.', 'Exhale as you jump.'],
      err: [['Aterrizar con las piernas rectas', 'Landing with straight legs'], ['Rodillas hacia dentro al caer', 'Knees caving in on landing'], ['Hacerlo cansado', 'Doing it when fatigued']],
      tip: ['Calidad antes que cantidad: para cuando el salto pierda altura.', 'Quality over quantity: stop when your jump loses height.'],
    },
    swing: {
      set: ['Pies algo más anchos que la cadera, kettlebell delante y espalda neutra.', 'Feet slightly wider than hips, kettlebell in front, neutral back.'],
      steps: [['Lleva la kettlebell atrás entre las piernas sacando la cadera.', 'Hike the kettlebell back between your legs by hinging.'], ['Extiende la cadera con fuerza para proyectarla hasta la altura del pecho.', 'Snap your hips forward to float it to chest height.'], ['Deja que caiga y vuelve a cargar la cadera.', 'Let it fall and load your hips again.']],
      br: ['Espira fuerte en cada extensión de cadera.', 'Exhale sharply on every hip snap.'],
      err: [['Hacer una sentadilla en vez de bisagra', 'Squatting instead of hinging'], ['Levantar con los brazos', 'Lifting with your arms'], ['Redondear la espalda', 'Rounding your back']],
      tip: ['Los brazos solo guían: la fuerza sale de los glúteos.', 'Your arms only guide: the power comes from your glutes.'],
    },
    wrist: {
      set: ['Antebrazos apoyados sobre los muslos o un banco, muñecas por fuera del borde.', 'Forearms resting on your thighs or a bench, wrists past the edge.'],
      steps: [['Mueve solo la muñeca para subir el peso.', 'Move only your wrist to lift the weight.'], ['Aprieta arriba un segundo.', 'Squeeze at the top for a second.'], ['Baja despacio todo el recorrido.', 'Lower slowly through the full range.']],
      br: ['Respira de forma continua.', 'Breathe steadily.'],
      err: [['Mover el antebrazo', 'Moving your forearm'], ['Demasiado peso', 'Too much weight'], ['Recorrido corto', 'Short range']],
      tip: ['Series largas (15–20) funcionan muy bien aquí.', 'High reps (15–20) work very well here.'],
    },
  };
  const FAM = { bench: 'press', incline: 'press', pushup: 'pushup', fly: 'fly', dip: 'dip', ohp: 'ohp', lateral: 'raise', front: 'raise', reardelt: 'reardelt', shrug: 'shrug', squat: 'squat', lunge: 'lunge', hinge: 'hinge', row: 'row', pulldown: 'vpull', pullup: 'vpull', curl: 'curl', pushdown: 'triceps', overhead: 'triceps', skull: 'triceps', legext: 'legext', legcurl: 'legcurl', legpress: 'legpress', thrust: 'glute', bridge: 'glute', calf: 'calf', plank: 'plank', crunch: 'crunch', legraise: 'crunch', twist: 'crunch', carry: 'carry', jump: 'jump', swing: 'swing', wrist: 'wrist' };
  const fam = (e) => T[FAM[window.vxPattern(e)] || 'curl'];
  window.vxTech = fam;

  // Rellena los ejercicios sin texto de la app (formato: [preparación, ejecución, errores, respiración])
  EX.forEach((e, i) => {
    const d = DET[i];
    if (d && d[0] && String(d[0]).length > 24 && !/no especificado/i.test(d[0])) return;
    const t = fam(e);
    DET[i] = [t.set[0], t.steps.map((s) => s[0]).join(' '), t.err.map((x) => x[0]).join(', ') + '.', t.br[0]];
  });

  const TX = {
    title: ['🎯 Técnica correcta', '🎯 Proper technique', '🎯 Bonne technique', '🎯 Técnica correta'],
    set: ['Colócate', 'Set-up', 'Mise en place', 'Posição'], steps: ['Ejecución', 'Execution', 'Exécution', 'Execução'],
    br: ['Respiración', 'Breathing', 'Respiration', 'Respiração'], err: ['Errores que debes evitar', 'Mistakes to avoid', 'Erreurs à éviter', 'Erros a evitar'],
    tip: ['Consejo pro', 'Pro tip', 'Conseil pro', 'Dica pro'],
  };
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  if (typeof V.ex === 'function') {
    const _ex = V.ex;
    V.ex = function (i) {
      let h = _ex.apply(this, arguments);
      try {
        const e = EX[i], t = fam(e), x = LI[S.lang] || 0, k = x === 0 ? 0 : 1, tx = (n) => TX[n][x];
        const card = `<div class="card vx-tech"><b>${tx('title')}</b>` +
          `<div class="vx-tech-s"><span class="vx-tech-h">🧍 ${tx('set')}</span><p>${esc(t.set[k])}</p></div>` +
          `<div class="vx-tech-s"><span class="vx-tech-h">▶️ ${tx('steps')}</span><ol>${t.steps.map((s) => `<li>${esc(s[k])}</li>`).join('')}</ol></div>` +
          `<div class="vx-tech-s"><span class="vx-tech-h">🌬️ ${tx('br')}</span><p>${esc(t.br[k])}</p></div>` +
          `<div class="vx-tech-s"><span class="vx-tech-h">⚠️ ${tx('err')}</span><ul>${t.err.map((s) => `<li>${esc(s[k])}</li>`).join('')}</ul></div>` +
          `<div class="vx-tech-tip">💡 <b>${tx('tip')}:</b> ${esc(t.tip[k])}</div></div>`;
        // Huecos de la ficha original: músculos secundarios y carga inicial
        const GS2 = Object.assign({ Trapecio: 'Deltoides, romboides', Antebrazo: 'Bíceps, braquial' }, typeof GS === 'object' ? GS : {});
        if (GS2[e[1]]) h = h.replace('Secundarios: No especificado', 'Secundarios: ' + GS2[e[1]]);
        const LOAD = ['un peso que puedas mover 10–12 veces dejando 2–3 repeticiones en reserva (RIR 2–3). Si haces más de 12, sube un poco la próxima vez.', 'a weight you can move 10–12 times with 2–3 reps left in the tank (RIR 2–3). If you get more than 12, add a little next time.'];
        h = h.replace('Sugerencia inicial de carga: No especificado.', 'Sugerencia inicial de carga: ' + LOAD[k]);
        h = h.replace('Declinado (ángulo: No especificado)', 'Declinado (−15° a −30°)').replace('Inclinado (ángulo: No especificado)', 'Inclinado (30° a 45°)').replace(' (ángulo: No especificado)', '');
        h = h.replace('<b>3 errores que debes evitar</b><div style="margin-top:6px">No especificado</div>', '<b>3 errores que debes evitar</b><div style="margin-top:6px">' + t.err.map((x) => `<div style="margin:5px 0">• ${esc(x[0])}</div>`).join('') + '</div>');
        const ISO = ['fly', 'raise', 'reardelt', 'shrug', 'curl', 'triceps', 'legext', 'legcurl', 'calf', 'plank', 'crunch', 'wrist'];
        h = h.replace(/(<span class="pill">[^<]*<\/span>)No especificado/, '$1' + (ISO.includes(FAM[window.vxPattern(e)]) ? 'Aislamiento' : 'Compuesto'));
        h = h.replace('<span class="pill">No especificado</span>', '<span class="pill">' + (ISO.includes(FAM[window.vxPattern(e)]) ? 'Aislamiento' : 'Compuesto') + '</span>');
        // Justo después del avatar (o de la primera tarjeta si no hay)
        const a = h.indexOf('vx-avatar');
        if (a !== -1) { const end = h.indexOf('</div></div>', h.indexOf('vx-av-tag', a)); if (end !== -1) return h.slice(0, end + 12) + card + h.slice(end + 12); }
        return h + card;
      } catch (err) { return h; }
    };
  }
})();
