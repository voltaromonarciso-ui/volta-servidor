/* VOLTA · mejoras (se inyecta al final de Volta-app.html con `npm run build:app`).
   Se apoya en las funciones globales de la app (S, V, R, cfg, doneSet, toast…) y las envuelve
   sin tocar el código original. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof R !== 'function') return;

  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const top = () => (S.stack && S.stack.length ? S.stack[S.stack.length - 1] : S.tab);

  /* ───────────── 1. Imágenes de ejercicios: usar las incrustadas (evita un 404 por ejercicio) ───────────── */
  try {
    if (typeof EMB === 'object' && Array.isArray(EX)) EX.forEach((e) => { if (e.cid && EMB[e.cid]) e.image = EMB[e.cid]; });
  } catch (e) { /* sin imágenes incrustadas */ }

  /* ───────────── 2. Series prerrellenadas con el objetivo de hoy (como Hevy / Strong) ───────────── */
  // Misma lógica que la tarjeta "Sobrecarga progresiva" (ovg): doble progresión.
  function ovTarget(c) {
    const td = lk(Date.now());
    const H = getLog().filter((l) => l.ex == c.i && isEff(l) && lk(l.t) != td);
    if (!H.length) return null;
    const d = lk(Math.max(...H.map((l) => l.t)));
    const p = H.filter((l) => lk(l.t) == d).reduce((a, b) => (e1of(b) > e1of(a) ? b : a));
    const hi = parseInt(String(c.reps).split('-').pop()) || 12;
    const lo = parseInt(c.reps) || 8;
    const inc = S.units.w == 'kg' ? 2.5 : 5;
    const up = p.r >= hi && (p.rir === '' || p.rir <= 2);
    return up ? { w: p.w + inc, r: lo } : { w: p.w, r: Math.min(hi, p.r + 1) };
  }
  if (typeof V.work === 'function') {
    const _work = V.work;
    V.work = function () {
      try {
        if (!S.edit) {
          const c = cfg(), k = S.cur + ':' + S.wi + ':' + c.i;
          if (!S.wk || S.wk.k !== k) {
            const t = ovTarget(c);
            if (t) S.wk = { k, w: String(Math.round(t.w * 100) / 100), r: String(t.r), rir: '' };
          }
        }
      } catch (e) { /* sin objetivo: la app usa su valor por defecto */ }
      return _work.apply(this, arguments);
    };
  }

  /* ───────────── 3. Pantalla siempre encendida durante el entrenamiento ───────────── */
  let wakeLock = null;
  async function syncWakeLock() {
    const want = document.visibilityState === 'visible' && top() === 'work';
    try {
      if (want && !wakeLock && navigator.wakeLock) {
        wakeLock = await navigator.wakeLock.request('screen');
        wakeLock.addEventListener('release', () => { wakeLock = null; });
      } else if (!want && wakeLock) {
        const w = wakeLock; wakeLock = null; await w.release();
      }
    } catch (e) { wakeLock = null; /* batería baja o navegador sin soporte */ }
  }
  document.addEventListener('visibilitychange', syncWakeLock);

  /* ───────────── 4. Celebración de récord personal ───────────── */
  function confetti() {
    if (reduceMotion()) return;
    const cv = document.createElement('canvas');
    cv.className = 'vx-confetti';
    cv.setAttribute('aria-hidden', 'true');
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr;
    document.body.appendChild(cv);
    const g = cv.getContext('2d'); g.scale(dpr, dpr);
    const colors = ['#9dff2e', '#4bd01a', '#f2f6f0', '#ffd23f', '#2ee6a6'];
    const P = Array.from({ length: 110 }, () => ({
      x: innerWidth / 2 + (Math.random() - 0.5) * 60, y: innerHeight * 0.42,
      vx: (Math.random() - 0.5) * 11, vy: -Math.random() * 13 - 4,
      s: 4 + Math.random() * 5, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
      c: colors[(Math.random() * colors.length) | 0],
    }));
    const t0 = performance.now();
    (function frame(now) {
      const k = (now - t0) / 1600;
      g.clearRect(0, 0, innerWidth, innerHeight);
      P.forEach((p) => {
        p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
        g.save(); g.globalAlpha = Math.max(0, 1 - k * k); g.translate(p.x, p.y); g.rotate(p.r);
        g.fillStyle = p.c; g.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2); g.restore();
      });
      if (k < 1) requestAnimationFrame(frame); else cv.remove();
    })(t0);
  }
  window.vxCelebrate = function () {
    confetti();
    try { navigator.vibrate && navigator.vibrate([30, 40, 30, 40, 120]); } catch (e) { /* sin vibración */ }
  };
  if (typeof doneSet === 'function') {
    const _done = doneSet;
    // Mismo criterio que el aviso de récord de la app: más peso que tu máximo, sin contar calentamientos
    doneSet = function () {
      let record = false;
      try {
        const i = cfg().i, w = +S.wk.w || 0;
        const pw = Math.max(0, ...qwl().filter((l) => l.ex == i).map((l) => l.w || 0));
        record = pw > 0 && w > pw && (S.st || 'effective') != 'warmup';
      } catch (e) { /* sin historial */ }
      const out = _done.apply(this, arguments);
      if (record) setTimeout(window.vxCelebrate, 80);
      return out;
    };
  }

  /* ───────────── 5. Traducción de los textos que la app dejaba en español ───────────── */
  const LANGS = { en: 1, fr: 2, pt: 3 };
  const D = {};
  const add = (block) => block.trim().split('\n').forEach((row) => { const a = row.split('|'); D[a[0].trim()] = a.map((s) => s.trim()); });

  // Interfaz
  add(`
Abre Volta cada día para construir tu racha. Se reinicia tras 48 h sin abrir la app.|Open Volta every day to build your streak. It resets after 48 h without opening the app.|Ouvre Volta chaque jour pour construire ta série. Elle repart à zéro après 48 h sans ouvrir l'app.|Abre o Volta todos os dias para construíres a tua sequência. Reinicia após 48 h sem abrir a app.
Aún no tienes objetivo de calorías. Toca para configurarlo.|No calorie goal yet. Tap to set it up.|Pas encore d'objectif calorique. Touche pour le configurer.|Ainda não tens objetivo de calorias. Toca para o configurar.
Sin rutina: empieza una sesión libre|No routine: start a free session|Pas de routine : lance une séance libre|Sem rotina: começa uma sessão livre
RESUMEN DE LA SEMANA|WEEK SUMMARY|RÉSUMÉ DE LA SEMAINE|RESUMO DA SEMANA
Resumen de esta semana|This week's summary|Résumé de cette semaine|Resumo desta semana
Biblioteca de ejercicios|Exercise library|Bibliothèque d'exercices|Biblioteca de exercícios
ejercicios · buscador anatómico, filtros y comparador|exercises · anatomical search, filters and comparison|exercices · recherche anatomique, filtres et comparateur|exercícios · pesquisa anatómica, filtros e comparador
Sin rutina seleccionada · crea la tuya abajo|No routine selected · create yours below|Aucune routine sélectionnée · crée la tienne ci-dessous|Nenhuma rotina selecionada · cria a tua abaixo
Ver rutina|View routine|Voir la routine|Ver rotina
Resuelve tus dudas de técnica, carga o molestias|Get answers on technique, load or discomfort|Réponses sur la technique, la charge ou les gênes|Tira dúvidas sobre técnica, carga ou desconfortos
Ver más|See more|Voir plus|Ver mais
Anatomía|Anatomy|Anatomie|Anatomia
XP · toca para ver rangos|XP · tap to see ranks|XP · touche pour voir les rangs|XP · toca para ver os níveis
óptimo|optimal|optimal|ótimo
Evolución|Trend|Évolution|Evolução
Nutrición|Nutrition|Nutrition|Nutrição
de — kcal|of — kcal|sur — kcal|de — kcal
Objetivo, calorías y comidas|Goal, calories and meals|Objectif, calories et repas|Objetivo, calorias e refeições
Alergias, intolerancias y presupuesto|Allergies, intolerances and budget|Allergies, intolérances et budget|Alergias, intolerâncias e orçamento
Sustituciones de alimentos|Food swaps|Substitutions d'aliments|Substituições de alimentos
Cantidades y macros calculados automáticamente|Amounts and macros calculated automatically|Quantités et macros calculées automatiquement|Quantidades e macros calculadas automaticamente
Cerrar sesión|Log out|Se déconnecter|Terminar sessão
Objetivo hoy:|Today's target:|Objectif du jour :|Objetivo de hoje:
rep, doble progresión)|rep, double progression)|rép., double progression)|rep., dupla progressão)
subir carga)|add weight)|augmenter la charge)|subir a carga)
RM estimado: introduce peso y repeticiones|RM estimate: enter weight and reps|RM estimé : saisis le poids et les répétitions|RM estimado: introduz peso e repetições
Sexo (para cálculos)|Sex (for calculations)|Sexe (pour les calculs)|Sexo (para cálculos)
Prefiero no decir|Prefer not to say|Je préfère ne pas le dire|Prefiro não dizer
Nivel de actividad|Activity level|Niveau d'activité|Nível de atividade
Sedentario · Poco o ningún ejercicio|Sedentary · Little or no exercise|Sédentaire · Peu ou pas d'exercice|Sedentário · Pouco ou nenhum exercício
Ligero · 1–3 días de ejercicio por semana|Light · 1–3 days of exercise per week|Léger · 1 à 3 jours d'exercice par semaine|Ligeiro · 1–3 dias de exercício por semana
Moderado · 3–5 días por semana|Moderate · 3–5 days per week|Modéré · 3 à 5 jours par semaine|Moderado · 3–5 dias por semana
Intenso · 6–7 días por semana|Intense · 6–7 days per week|Intense · 6 à 7 jours par semaine|Intenso · 6–7 dias por semana
Muy intenso · Entreno doble o trabajo físico exigente|Very intense · Double sessions or demanding physical work|Très intense · Double séance ou travail physique exigeant|Muito intenso · Treino duplo ou trabalho físico exigente
Nivel de experiencia|Experience level|Niveau d'expérience|Nível de experiência
Solo pedimos lo necesario para personalizar tus cálculos.|We only ask for what's needed to personalise your calculations.|Nous ne demandons que le nécessaire pour personnaliser tes calculs.|Só pedimos o necessário para personalizar os teus cálculos.
Mejorar condición física|Improve fitness|Améliorer sa condition physique|Melhorar a condição física
este mes|this month|ce mois-ci|este mês
En curso|In progress|En cours|Em curso
Toca para ver el detalle|Tap to see details|Touche pour voir le détail|Toca para ver o detalhe
Toca un punto para ver el detalle.|Tap a point to see details.|Touche un point pour voir le détail.|Toca num ponto para ver o detalhe.
Aún no tienes rutinas.|You don't have any routines yet.|Tu n'as pas encore de routines.|Ainda não tens rotinas.
Recordatorios de entrenamiento|Workout reminders|Rappels d'entraînement|Lembretes de treino
Recordatorios de comidas|Meal reminders|Rappels de repas|Lembretes de refeições
Recordatorios de registro|Logging reminders|Rappels de saisie|Lembretes de registo
Recordatorios de descanso|Rest reminders|Rappels de repos|Lembretes de descanso
Nombre, edad y medidas.|Name, age and measurements.|Nom, âge et mensurations.|Nome, idade e medidas.
Datos de entrenamiento|Training data|Données d'entraînement|Dados de treino
Tus series, cargas y marcas.|Your sets, loads and records.|Tes séries, charges et records.|As tuas séries, cargas e marcas.
Datos nutricionales|Nutrition data|Données nutritionnelles|Dados nutricionais
Tus comidas y preferencias.|Your meals and preferences.|Tes repas et préférences.|As tuas refeições e preferências.
Permisos|Permissions|Autorisations|Permissões
Notificaciones y accesos.|Notifications and access.|Notifications et accès.|Notificações e acessos.
Exportar mis datos|Export my data|Exporter mes données|Exportar os meus dados
Descarga todos tus datos en un archivo JSON.|Download all your data as a JSON file.|Télécharge toutes tes données dans un fichier JSON.|Descarrega todos os teus dados num ficheiro JSON.
Importar copia de seguridad|Import backup|Importer une sauvegarde|Importar cópia de segurança
Restaura tus datos desde un archivo JSON.|Restore your data from a JSON file.|Restaure tes données depuis un fichier JSON.|Restaura os teus dados a partir de um ficheiro JSON.
Eliminar cuenta|Delete account|Supprimer le compte|Eliminar conta
Borra todo de forma permanente.|Permanently deletes everything.|Supprime tout définitivement.|Apaga tudo permanentemente.
Según mi gimnasio|Based on my gym|Selon ma salle|De acordo com o meu ginásio
Sin material|No equipment|Sans matériel|Sem material
Pregúntame lo que necesites sobre tu entrenamiento.|Ask me anything about your training.|Pose-moi toutes tes questions sur ton entraînement.|Pergunta-me o que precisares sobre o teu treino.
¿Cómo subo la carga?|How do I add weight?|Comment augmenter la charge ?|Como subo a carga?
Me duele el hombro|My shoulder hurts|J'ai mal à l'épaule|Dói-me o ombro
¿Qué tempo uso?|What tempo should I use?|Quel tempo utiliser ?|Que tempo uso?
¿Cuánto descanso?|How long should I rest?|Combien de repos ?|Quanto descanso?
Conectar IA en línea (opcional)|Connect online AI (optional)|Connecter l'IA en ligne (facultatif)|Ligar IA online (opcional)
kg respecto a la medición anterior|kg vs the previous measurement|kg par rapport à la mesure précédente|kg face à medição anterior
Guarda tus primeras medidas para ver la evolución.|Save your first measurements to see your trend.|Enregistre tes premières mesures pour voir l'évolution.|Guarda as tuas primeiras medidas para ver a evolução.
Récords personales|Personal records|Records personnels|Recordes pessoais
NUEVO RÉCORD PERSONAL|NEW PERSONAL RECORD|NOUVEAU RECORD PERSONNEL|NOVO RECORDE PESSOAL
superaste tu marca anterior en la última sesión|you beat your previous best last session|tu as battu ton record lors de la dernière séance|superaste a tua marca anterior na última sessão
Pega tu clave API de Anthropic para respuestas generadas por IA. Se guarda solo en este dispositivo. Sin clave, respondo con el motor local.|Paste your Anthropic API key for AI-generated answers. It's stored only on this device. Without a key, I answer with the local engine.|Colle ta clé API Anthropic pour des réponses générées par l'IA. Elle reste uniquement sur cet appareil. Sans clé, je réponds avec le moteur local.|Cola a tua chave API da Anthropic para respostas geradas por IA. Fica guardada só neste dispositivo. Sem chave, respondo com o motor local.
El 1RM es una estimación (Epley) a partir de tus series, no una medición real.|1RM is an estimate (Epley) from your sets, not a real measurement.|Le 1RM est une estimation (Epley) à partir de tes séries, pas une mesure réelle.|O 1RM é uma estimativa (Epley) a partir das tuas séries, não uma medição real.
El 1RM es una estimación.|1RM is an estimate.|Le 1RM est une estimation.|O 1RM é uma estimativa.
Mejoran|Improving|En progrès|A melhorar
Estables|Stable|Stables|Estáveis
Bajan|Declining|En baisse|A descer
Descanso|Rest|Repos|Descanso
Pausa|Pause|Pause|Pausa
Reanudar|Resume|Reprendre|Retomar
Saltar|Skip|Passer|Saltar
Ejercicio completado ✓|Exercise complete ✓|Exercice terminé ✓|Exercício concluído ✓
Terminar entrenamiento|Finish workout|Terminer l'entraînement|Terminar treino
Siguiente ejercicio|Next exercise|Exercice suivant|Exercício seguinte
Completar serie|Complete set|Valider la série|Concluir série
(esfuerzo)|(effort)|(effort)|(esforço)
Peso corporal|Bodyweight|Poids du corps|Peso corporal
Sin historial de este ejercicio: elige una carga con RIR 2–3 para fijar tu referencia.|No history for this exercise: pick a load at RIR 2–3 to set your baseline.|Pas d'historique pour cet exercice : choisis une charge à RIR 2–3 pour fixer ta référence.|Sem histórico deste exercício: escolhe uma carga com RIR 2–3 para fixar a tua referência.
Ejercicio reemplazado · historial conservado|Exercise replaced · history kept|Exercice remplacé · historique conservé|Exercício substituído · histórico mantido
Sobrecarga progresiva|Progressive overload|Surcharge progressive|Sobrecarga progressiva
Entrenamiento rápido|Quick workout|Entraînement rapide|Treino rápido
Datos de ejemplo|Sample data|Données d'exemple|Dados de exemplo
Continuar|Continue|Continuer|Continuar
Empezar|Start|Commencer|Começar
DATO INUSUAL: se aleja de tu historial. Comprueba que sea correcto.|UNUSUAL ENTRY: far from your history. Check it's correct.|DONNÉE INHABITUELLE : loin de ton historique. Vérifie qu'elle est correcte.|DADO INVULGAR: afasta-se do teu histórico. Confirma que está correto.
Principiante|Beginner|Débutant|Iniciante
Intermedio|Intermediate|Intermédiaire|Intermédio
Avanzado|Advanced|Avancé|Avançado
`);
  // Grupos musculares y material
  add(`
Pecho|Chest|Pectoraux|Peito
Espalda|Back|Dos|Costas
Hombros|Shoulders|Épaules|Ombros
Bíceps|Biceps|Biceps|Bíceps
Tríceps|Triceps|Triceps|Tríceps
Cuádriceps|Quads|Quadriceps|Quadríceps
Glúteos|Glutes|Fessiers|Glúteos
Gemelos|Calves|Mollets|Gémeos
Isquiosurales|Hamstrings|Ischio-jambiers|Isquiotibiais
Trapecio|Traps|Trapèzes|Trapézio
Antebrazo|Forearms|Avant-bras|Antebraço
Barra|Barbell|Barre|Barra
Mancuernas|Dumbbells|Haltères|Halteres
Barra de dominadas|Pull-up bar|Barre de traction|Barra de elevações
Polea|Cable|Poulie|Polia
Máquina|Machine|Machine|Máquina
Bandas|Bands|Élastiques|Bandas
`);
  // Ejercicios
  add(`
Press de banca|Bench press|Développé couché|Supino reto
Press inclinado con mancuernas|Incline dumbbell press|Développé incliné haltères|Supino inclinado com halteres
Dominadas|Pull-ups|Tractions|Elevações
Remo con barra|Barbell row|Rowing barre|Remada com barra
Press militar|Overhead press|Développé militaire|Desenvolvimento militar
Curl de bíceps|Biceps curl|Curl biceps|Rosca bíceps
Extensión de tríceps|Triceps extension|Extension triceps|Extensão de tríceps
Sentadilla|Squat|Squat|Agachamento
Hip thrust|Hip thrust|Hip thrust|Hip thrust
Plancha|Plank|Gainage|Prancha
Elevación de gemelos|Calf raise|Extension des mollets|Elevação de gémeos
Press de banca con mancuernas|Dumbbell bench press|Développé couché haltères|Supino com halteres
Aperturas en polea|Cable fly|Écartés à la poulie|Aberturas na polia
Jalón al pecho|Lat pulldown|Tirage vertical|Puxada à frente
Remo en polea baja|Seated cable row|Tirage horizontal poulie basse|Remada baixa na polia
Elevaciones laterales|Lateral raises|Élévations latérales|Elevações laterais
Pájaros (deltoides posterior)|Reverse fly (rear delts)|Oiseau (deltoïde postérieur)|Crucifixo invertido (deltoide posterior)
Extensión de tríceps sobre la cabeza|Overhead triceps extension|Extension triceps au-dessus de la tête|Extensão de tríceps acima da cabeça
Prensa de piernas|Leg press|Presse à cuisses|Leg press
Curl martillo|Hammer curl|Curl marteau|Rosca martelo
Press inclinado con barra|Incline barbell press|Développé incliné barre|Supino inclinado com barra
Press declinado con barra|Decline barbell press|Développé décliné barre|Supino declinado com barra
Press declinado con mancuernas|Decline dumbbell press|Développé décliné haltères|Supino declinado com halteres
Press en máquina convergente|Converging machine press|Développé machine convergente|Supino em máquina convergente
Press inclinado en máquina|Incline machine press|Développé incliné à la machine|Supino inclinado na máquina
Press en Smith|Smith machine bench press|Développé couché à la Smith|Supino na Smith
Press inclinado en Smith|Incline Smith press|Développé incliné à la Smith|Supino inclinado na Smith
Aperturas con mancuernas|Dumbbell fly|Écartés haltères|Aberturas com halteres
Aperturas inclinadas con mancuernas|Incline dumbbell fly|Écartés inclinés haltères|Aberturas inclinadas com halteres
Aperturas en máquina (peck deck)|Machine fly (pec deck)|Écartés à la machine (pec deck)|Aberturas na máquina (peck deck)
Cruce de poleas alto a bajo|High-to-low cable crossover|Croisé poulies haut vers bas|Cruzamento de polias de cima para baixo
Cruce de poleas bajo a alto|Low-to-high cable crossover|Croisé poulies bas vers haut|Cruzamento de polias de baixo para cima
Flexiones|Push-ups|Pompes|Flexões
Flexiones declinadas|Decline push-ups|Pompes déclinées|Flexões declinadas
Fondos en paralelas (pecho)|Chest dips|Dips (pectoraux)|Mergulhos nas paralelas (peito)
Pullover con mancuerna|Dumbbell pullover|Pull-over haltère|Pullover com halter
Press con agarre neutro|Neutral-grip press|Développé prise neutre|Supino com pega neutra
Dominadas supinas|Chin-ups|Tractions supination|Elevações supinadas
Dominadas con agarre neutro|Neutral-grip pull-ups|Tractions prise neutre|Elevações com pega neutra
Jalón agarre estrecho|Close-grip pulldown|Tirage vertical prise serrée|Puxada com pega estreita
Jalón agarre supino|Underhand pulldown|Tirage vertical supination|Puxada com pega supinada
Jalón unilateral|Single-arm pulldown|Tirage vertical unilatéral|Puxada unilateral
Jalón en máquina|Machine pulldown|Tirage vertical à la machine|Puxada na máquina
Remo con mancuerna|Dumbbell row|Rowing haltère|Remada com halter
Remo Pendlay|Pendlay row|Rowing Pendlay|Remada Pendlay
Remo en T|T-bar row|Rowing T-bar|Remada em T
Remo en máquina|Machine row|Rowing à la machine|Remada na máquina
Remo con pecho apoyado|Chest-supported row|Rowing poitrine appuyée|Remada com peito apoiado
Remo en Smith|Smith machine row|Rowing à la Smith|Remada na Smith
Remo invertido|Inverted row|Rowing inversé|Remada invertida
Remo unilateral en polea|Single-arm cable row|Rowing unilatéral à la poulie|Remada unilateral na polia
Pullover en polea|Cable pullover|Pull-over à la poulie|Pullover na polia
Peso muerto|Deadlift|Soulevé de terre|Peso morto
Encogimientos de trapecio|Shrugs|Haussements d'épaules|Encolhimentos de ombros
Face pull|Face pull|Face pull|Face pull
Press militar con mancuernas|Dumbbell shoulder press|Développé militaire haltères|Desenvolvimento com halteres
Press Arnold|Arnold press|Développé Arnold|Press Arnold
Press de hombros en máquina|Machine shoulder press|Développé épaules à la machine|Desenvolvimento de ombros na máquina
Press de hombros en Smith|Smith shoulder press|Développé épaules à la Smith|Desenvolvimento de ombros na Smith
Elevaciones laterales en polea|Cable lateral raises|Élévations latérales à la poulie|Elevações laterais na polia
Elevaciones laterales en máquina|Machine lateral raises|Élévations latérales à la machine|Elevações laterais na máquina
Elevaciones frontales|Front raises|Élévations frontales|Elevações frontais
Pájaros en máquina inversa|Reverse pec deck|Oiseau à la machine inversée|Crucifixo invertido na máquina
Pájaros en polea|Cable reverse fly|Oiseau à la poulie|Crucifixo invertido na polia
Remo al mentón|Upright row|Tirage menton|Remada alta
Curl con barra Z|EZ-bar curl|Curl barre EZ|Rosca com barra W
Curl con barra recta|Straight-bar curl|Curl barre droite|Rosca com barra reta
Curl inclinado|Incline curl|Curl incliné|Rosca inclinada
Curl predicador|Preacher curl|Curl pupitre|Rosca Scott
Curl concentrado|Concentration curl|Curl concentré|Rosca concentrada
Curl en polea|Cable curl|Curl à la poulie|Rosca na polia
Curl spider|Spider curl|Curl spider|Rosca spider
Curl martillo con cuerda|Rope hammer curl|Curl marteau à la corde|Rosca martelo com corda
Curl inverso|Reverse curl|Curl inversé|Rosca inversa
Press francés|Skull crusher|Barre au front|Tríceps testa
Fondos en paralelas (tríceps)|Triceps dips|Dips (triceps)|Mergulhos nas paralelas (tríceps)
Fondos en banco|Bench dips|Dips sur banc|Mergulhos no banco
Press cerrado|Close-grip bench press|Développé couché prise serrée|Supino pega fechada
Extensión con cuerda|Rope pushdown|Extension à la corde|Extensão com corda
Extensión con barra en polea|Bar pushdown|Extension barre à la poulie|Extensão com barra na polia
Patada de tríceps|Triceps kickback|Kickback triceps|Coice de tríceps
Extensión unilateral en polea|Single-arm cable pushdown|Extension unilatérale à la poulie|Extensão unilateral na polia
Extensión de tríceps en máquina|Machine triceps extension|Extension triceps à la machine|Extensão de tríceps na máquina
Sentadilla frontal|Front squat|Squat avant|Agachamento frontal
Sentadilla Hack|Hack squat|Hack squat|Agachamento hack
Sentadilla búlgara|Bulgarian split squat|Squat bulgare|Agachamento búlgaro
Zancadas|Lunges|Fentes|Afundos
Extensión de cuádriceps|Leg extension|Leg extension|Extensão de quadríceps
Sentadilla en Smith|Smith squat|Squat à la Smith|Agachamento na Smith
Sentadilla goblet|Goblet squat|Squat goblet|Agachamento goblet
Prensa de piernas unilateral|Single-leg press|Presse à cuisses unilatérale|Leg press unilateral
Sentadilla en máquina|Machine squat|Squat à la machine|Agachamento na máquina
Sissy squat|Sissy squat|Sissy squat|Sissy squat
Subida al cajón|Box step-up|Montée sur box|Subida ao caixote
Peso muerto rumano|Romanian deadlift|Soulevé de terre roumain|Peso morto romeno
Peso muerto rumano con mancuernas|Dumbbell Romanian deadlift|Soulevé de terre roumain haltères|Peso morto romeno com halteres
Curl femoral tumbado|Lying leg curl|Leg curl allongé|Curl femoral deitado
Curl femoral sentado|Seated leg curl|Leg curl assis|Curl femoral sentado
Curl femoral de pie|Standing leg curl|Leg curl debout|Curl femoral de pé
Buenos días|Good mornings|Good morning|Bom dia
Curl nórdico|Nordic curl|Nordic curl|Curl nórdico
Peso muerto a una pierna|Single-leg deadlift|Soulevé de terre unijambe|Peso morto unilateral
Hiperextensión de cadera|Back extension|Extension lombaire|Hiperextensão de anca
Hip thrust en máquina|Machine hip thrust|Hip thrust à la machine|Hip thrust na máquina
Puente de glúteo|Glute bridge|Pont fessier|Ponte de glúteo
Patada de glúteo en polea|Cable glute kickback|Kickback fessier à la poulie|Coice de glúteo na polia
Abducción de cadera en máquina|Machine hip abduction|Abduction de hanche à la machine|Abdução de anca na máquina
Sentadilla sumo|Sumo squat|Squat sumo|Agachamento sumo
Hip thrust a una pierna|Single-leg hip thrust|Hip thrust unijambe|Hip thrust unilateral
Patada de glúteo en cuadrupedia|Quadruped glute kickback|Kickback fessier à quatre pattes|Coice de glúteo em quatro apoios
Gemelos de pie en máquina|Standing machine calf raise|Mollets debout à la machine|Gémeos de pé na máquina
Gemelos sentado|Seated calf raise|Mollets assis|Gémeos sentado
Gemelos en prensa|Leg press calf raise|Mollets à la presse|Gémeos na leg press
Gemelos a una pierna con mancuerna|Single-leg dumbbell calf raise|Mollets unijambe avec haltère|Gémeos unilateral com halter
Gemelos en Smith|Smith calf raise|Mollets à la Smith|Gémeos na Smith
Crunch en polea|Cable crunch|Crunch à la poulie|Abdominal na polia
Elevación de piernas colgado|Hanging leg raise|Relevé de jambes suspendu|Elevação de pernas suspenso
Rueda abdominal|Ab wheel rollout|Roue abdominale|Roda abdominal
Crunch abdominal|Crunch|Crunch|Abdominal crunch
Plancha lateral|Side plank|Gainage latéral|Prancha lateral
Russian twist|Russian twist|Russian twist|Russian twist
Pallof press|Pallof press|Pallof press|Pallof press
Dead bug|Dead bug|Dead bug|Dead bug
Bicicleta abdominal|Bicycle crunch|Crunch vélo|Abdominal bicicleta
Crunch en máquina|Machine crunch|Crunch à la machine|Abdominal na máquina
Leñador en polea|Cable woodchopper|Bûcheron à la poulie|Lenhador na polia
Encogimientos con mancuernas|Dumbbell shrugs|Haussements d'épaules haltères|Encolhimentos com halteres
Encogimientos con barra|Barbell shrugs|Haussements d'épaules barre|Encolhimentos com barra
Encogimientos en Smith|Smith shrugs|Haussements d'épaules à la Smith|Encolhimentos na Smith
Encogimientos con pecho apoyado|Chest-supported shrugs|Haussements d'épaules poitrine appuyée|Encolhimentos com peito apoiado
Paseo de granjero|Farmer's walk|Marche du fermier|Passeio do agricultor
Curl de muñeca con barra|Barbell wrist curl|Curl poignets barre|Rosca de punho com barra
Curl de muñeca con mancuerna|Dumbbell wrist curl|Curl poignet haltère|Rosca de punho com halter
Extensión de muñeca con barra|Barbell wrist extension|Extension poignets barre|Extensão de punho com barra
Colgarse de la barra|Dead hang|Suspension à la barre|Suspensão na barra
Press landmine|Landmine press|Développé landmine|Press landmine
Pull-apart con banda|Band pull-apart|Écartés à l'élastique|Pull-apart com banda
Curl con banda|Band curl|Curl à l'élastique|Rosca com banda
Extensión de tríceps con banda|Band triceps extension|Extension triceps à l'élastique|Extensão de tríceps com banda
Press JM|JM press|Développé JM|Press JM
Flexiones diamante|Diamond push-ups|Pompes diamant|Flexões diamante
Balanceo con kettlebell|Kettlebell swing|Swing kettlebell|Swing com kettlebell
Puente de glúteo a una pierna|Single-leg glute bridge|Pont fessier unijambe|Ponte de glúteo unilateral
Elevación de talones con peso corporal|Bodyweight calf raise|Extension des mollets au poids du corps|Elevação de calcanhares com peso corporal
Elevación de rodillas colgado|Hanging knee raise|Relevé de genoux suspendu|Elevação de joelhos suspenso
`);
  const UP = {};
  Object.keys(D).forEach((k) => { UP[k.toUpperCase()] = D[k].map((s) => s.toUpperCase()); });
  const EXNAMES = Object.keys(D).filter((k) => Array.isArray(EX) && EX.some((e) => e[0] === k)).sort((a, b) => b.length - a.length);

  const MONTHS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const P = [
    [/^Ejercicio (\d+) de (\d+)$/, ['Exercise $1 of $2', 'Exercice $1 sur $2', 'Exercício $1 de $2']],
    [/^de (\d+) ejercicios$/, ['of $1 exercises', 'sur $1 exercices', 'de $1 exercícios']],
    [/^ejercicios catalogados · (\d+) categorías musculares$/, ['exercises · $1 muscle categories', 'exercices · $1 catégories musculaires', 'exercícios · $1 categorias musculares']],
    [/^Ejercicios y rutinas guardados · (\d+)$/, ['Saved exercises and routines · $1', 'Exercices et routines enregistrés · $1', 'Exercícios e rotinas guardados · $1']],
    [/^Última vez \((.+)\):$/, ['Last time ($1):', 'Dernière fois ($1) :', 'Última vez ($1):']],
    [/^Récord de peso: (.+)$/, ['Weight record: $1', 'Record de charge : $1', 'Recorde de peso: $1']],
    [/^Récord de repeticiones: (.+)$/, ['Rep record: $1', 'Record de répétitions : $1', 'Recorde de repetições: $1']],
    [/^Mayor volumen en una sesión: (.+)$/, ['Best session volume: $1', 'Plus gros volume en une séance : $1', 'Maior volume numa sessão: $1']],
    [/^(\d+) días?$/, ['$1 d', '$1 j', '$1 d']],
    [/^días?$/, ['d', 'j', 'd']],
    [/^Abre Volta cada día para construir tu racha\. Se reinicia tras 48 h sin abrir la app\. Récord: (\d+)\.$/, ['Open Volta every day to build your streak. It resets after 48 h without opening the app. Best: $1.', "Ouvre Volta chaque jour pour construire ta série. Elle repart à zéro après 48 h sans ouvrir l'app. Record : $1.", 'Abre o Volta todos os dias para construíres a tua sequência. Reinicia após 48 h sem abrir a app. Recorde: $1.']],
    [/^NUEVO RANGO: (.+)$/, ['NEW RANK: $1', 'NOUVEAU RANG : $1', 'NOVO NÍVEL: $1']],
    [/^NUEVO RÉCORD PERSONAL · (.+)$/, ['NEW PERSONAL RECORD · $1', 'NOUVEAU RECORD PERSONNEL · $1', 'NOVO RECORDE PESSOAL · $1']],
  ];
  const DAYS = { Lun: ['Mon', 'lun.', 'Seg'], Mar: ['Tue', 'mar.', 'Ter'], 'Mié': ['Wed', 'mer.', 'Qua'], Jue: ['Thu', 'jeu.', 'Qui'], Vie: ['Fri', 'ven.', 'Sex'], 'Sáb': ['Sat', 'sam.', 'Sáb'], Dom: ['Sun', 'dim.', 'Dom'] };
  const LETTERS = { en: 'MTWTFSS', fr: 'LMMJVSD', pt: 'STQQSSD' };

  function trText(s, x) {
    if (D[s]) return D[s][x] || null;
    if (UP[s]) return UP[s][x] || null;
    if (DAYS[s]) return DAYS[s][x - 1];
    for (const [re, out] of P) {
      const m = re.exec(s);
      if (m) return out[x - 1].replace(/\$(\d)/g, (_, i) => trInner(m[i], x));
    }
    // "Martes, 6 de octubre" → fecha en el idioma elegido
    const f = /^[A-Za-zÁÉÍÓÚáéíóú]+, (\d{1,2}) de ([a-z]+)$/.exec(s);
    if (f && MONTHS.includes(f[2])) {
      const now = new Date();
      let d = new Date(now.getFullYear(), MONTHS.indexOf(f[2]), +f[1]);
      if (d - now > 864e5 * 31) d = new Date(now.getFullYear() - 1, d.getMonth(), d.getDate());
      const txt = d.toLocaleDateString(S.lang, { weekday: 'long', day: 'numeric', month: 'long' });
      return txt.charAt(0).toUpperCase() + txt.slice(1);
    }
    return null;
  }
  // Traduce nombres de ejercicio dentro de un texto más largo ("Press de banca 80 kg")
  function trInner(s, x) {
    if (D[s]) return D[s][x];
    for (const n of EXNAMES) if (s.indexOf(n) !== -1) return s.replace(n, D[n][x]);
    return s;
  }
  window.vxTr = function (str) {
    const x = LANGS[S.lang];
    if (!x || typeof str !== 'string') return str;
    const m = /^(\s*[^A-Za-zÀ-ÿ¿¡]*)([\s\S]*?)(\s*)$/.exec(str);
    if (!m || !m[2]) return str;
    const r = trText(m[2], x);
    return r ? m[1] + r + m[3] : str;
  };
  function translate(root) {
    const x = LANGS[S.lang];
    if (!root || !x) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    const ns = []; let n;
    while ((n = w.nextNode())) ns.push(n);
    // Tira de la semana "L M X J V S D"
    let run = [];
    const flush = () => {
      if (run.length === 7 && run.map((t) => t.nodeValue.trim()).join('') === 'LMXJVSD') run.forEach((t, i) => { t.nodeValue = t.nodeValue.replace(/\S/, LETTERS[S.lang][i]); });
      run = [];
    };
    ns.forEach((t) => {
      const v = t.nodeValue.trim();
      if ('LMXJVSD'.includes(v) && v.length === 1) run.push(t);
      else if (!/^\d{0,2}$/.test(v)) flush();
      const r = window.vxTr(t.nodeValue);
      if (r !== t.nodeValue) t.nodeValue = r;
    });
    flush();
    root.querySelectorAll('[placeholder]').forEach((e) => { const r = window.vxTr(e.placeholder); if (r !== e.placeholder) e.placeholder = r; });
  }
  if (typeof toast === 'function') {
    const _toast = toast;
    toast = function (m) { return _toast.call(this, window.vxTr(m)); };
  }

  /* ───────────── 6. Accesibilidad: nombre para los botones que solo tienen un icono ───────────── */
  const LBL = {
    back: ['Volver', 'Back', 'Retour', 'Voltar'], help: ['Ayuda', 'Help', 'Aide', 'Ajuda'],
    close: ['Cerrar', 'Close', 'Fermer', 'Fechar'], info: ['Información', 'Information', 'Informations', 'Informação'],
    swap: ['Cambiar ejercicio', 'Swap exercise', "Changer d'exercice", 'Trocar exercício'],
    minus: ['Restar', 'Decrease', 'Diminuer', 'Diminuir'], plus: ['Sumar', 'Increase', 'Augmenter', 'Aumentar'],
    notif: ['Notificaciones', 'Notifications', 'Notifications', 'Notificações'], profile: ['Perfil', 'Profile', 'Profil', 'Perfil'],
    search: ['Buscar', 'Search', 'Rechercher', 'Pesquisar'], settings: ['Ajustes', 'Settings', 'Réglages', 'Definições'],
  };
  const SYM = { '‹': 'back', '←': 'back', '?': 'help', '×': 'close', '✕': 'close', 'ℹ': 'info', 'i': 'info', '⇄': 'swap', '−': 'minus', '-': 'minus', '+': 'plus', '⚙': 'settings' };
  function labelButtons(root) {
    const x = LANGS[S.lang] || 0;
    root.querySelectorAll('button:not([aria-label])').forEach((b) => {
      const txt = b.textContent.trim(), oc = b.getAttribute('onclick') || '';
      let k = SYM[txt];
      if (!k && !txt) k = /notif/i.test(oc) ? 'notif' : /prof/i.test(oc) ? 'profile' : /search|busc|srch/i.test(oc) ? 'search' : /setting|ajust|p:settings/i.test(oc) ? 'settings' : /back\(/.test(oc) ? 'back' : null;
      if (k) b.setAttribute('aria-label', LBL[k][x]);
    });
    const nav = document.getElementById('nav');
    if (nav) nav.querySelectorAll('button').forEach((b) => { if (b.classList.contains('on')) b.setAttribute('aria-current', 'page'); else b.removeAttribute('aria-current'); });
  }

  /* ───────────── Enganche con el render de la app ───────────── */
  const _R = R;
  R = function () {
    const out = _R.apply(this, arguments);
    try { translate(document.getElementById('m')); translate(document.getElementById('nav')); } catch (e) { /* nunca romper el render */ }
    try { labelButtons(document.getElementById('app') || document.body); } catch (e) { /* idem */ }
    syncWakeLock();
    return out;
  };

  /* ───────────── 7. App instalable y sin conexión (cuando la sirve el servidor de Volta) ───────────── */
  if (document.querySelector('meta[name="volta-api"]')) {
    document.querySelectorAll('link[rel="manifest"]').forEach((l) => l.remove());
    const l = document.createElement('link'); l.rel = 'manifest'; l.href = 'manifest.webmanifest'; document.head.appendChild(l);
    const a = document.createElement('link'); a.rel = 'apple-touch-icon'; a.href = 'icon-192.png'; document.head.appendChild(a);
    if ('serviceWorker' in navigator && location.protocol !== 'file:') {
      addEventListener('load', () => navigator.serviceWorker.register('sw.js').catch(() => {}));
    }
  }

  // Accesos directos del icono instalado: /?tab=train, /?tab=nut…
  try {
    const want = new URLSearchParams(location.search).get('tab');
    if (want && S.onboarded && ['home', 'train', 'prog', 'nut', 'prof'].includes(want)) { S.stack = []; S.tab = want; }
  } catch (e) { /* URL sin parámetros */ }

  try { R(); } catch (e) { /* la app ya pintó su primera pantalla */ }
})();
