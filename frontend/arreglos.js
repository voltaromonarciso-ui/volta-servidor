/* VOLTA · arreglos generales que se cargan al final */
(function () {
  if (typeof V !== 'object' || typeof R !== 'function') return;

  // La pantalla "Rangos" del perfil se retiró, pero la tarjeta de rango de Progreso aún enlaza a ella:
  // ahora abre la guía de rangos de Progreso en vez de dejar la app en blanco.
  if (typeof V['p:ranks'] !== 'function') {
    V['p:ranks'] = function () {
      S.stack = S.stack.filter((x) => x !== 'p:ranks');
      S.tab = 'prog'; S.rkm = 1;
      return V.prog();
    };
  }

  // "Filtros" era una pantalla de relleno ("Opción A / Opción B") sin efecto: ahora abre la biblioteca
  // con su panel de filtros real (material, nivel, tipo y orden) ya desplegado.
  V.filters = function () {
    S.stack = S.stack.filter((x) => x !== 'filters');
    if (S.stack[S.stack.length - 1] !== 'lib') S.stack.push('lib');
    S.xfo = true;
    return V.lib();
  };

  // Comparador: sin "No especificado". La lateralidad se deduce del nombre y el banco recibe ángulos reales.
  const UNI = /una pierna|un brazo|unilateral|alterna|altern|concentraci|kroc|pistol|zancad|búlgar|arquer|cruzad|single|step.?up|subida al caj/i;
  const lat = (i) => (EX[i] && UNI.test(EX[i][0]) ? 'Unilateral' : 'Bilateral');
  if (typeof V.xcmp === 'function') {
    const _x = V.xcmp;
    V.xcmp = function () {
      let h = _x.apply(this, arguments);
      try {
        const c = S.xc || [], a = lat(c[0]), b = lat(c[1]);
        h = h.replace(/(Lateralidad<\/div><div class="row sp"><span>)No especificado/, '$1' + a)
          .replace(/(Lateralidad<\/div><div class="row sp"><span>[^<]*<\/span><span[^>]*>)No especificado/, '$1' + b)
          .replace(/Lateralidad: ([^.<]*?) frente a ([^.<]*?)\./, (m, x, y) => {
            x = x === 'No especificado' ? a : x; y = y === 'No especificado' ? b : y;
            return x === y ? '' : `Lateralidad: ${x} frente a ${y}.`;
          })
          .replace(/No necesita \/ No especificado/g, 'No necesita')
          .replace(/Inclinado \(ángulo: No especificado\)/g, 'Inclinado (30°–45°)')
          .replace(/Declinado \(ángulo: No especificado\)/g, 'Declinado (−15°–−30°)')
          .replace(/No especificado/g, '—');
      } catch (e) { /* comparador original */ }
      return h;
    };
  }

  // Traducciones que faltaban (ficha de ejercicio, entreno, receta)
  if (window.vxAddTr) window.vxAddTr(`
Registrar serie ✓|Log set ✓|Enregistrer la série ✓|Registar série ✓
Finalizar entrenamiento|Finish workout|Terminer la séance|Terminar treino
Series efectivas|Effective sets|Séries efficaces|Séries efetivas
series →|sets →|séries →|séries →
Añadir a mi plan|Add to my plan|Ajouter à mon plan|Adicionar ao meu plano
Cantidades estimadas a partir de los macros de la receta (por 100 g, valores medios). Las sustituciones recalculan toda la comida y la lista de la compra.|Amounts estimated from the recipe macros (per 100 g, average values). Swaps recalculate the whole meal and the shopping list.|Quantités estimées à partir des macros de la recette (pour 100 g, valeurs moyennes). Les substitutions recalculent tout le repas et la liste de courses.|Quantidades estimadas a partir dos macros da receita (por 100 g, valores médios). As substituições recalculam toda a refeição e a lista de compras.
Resto del día|Rest of the day|Reste de la journée|Resto do dia
Músculo principal|Main muscle|Muscle principal|Músculo principal
Compuesto|Compound|Polyarticulaire|Composto
Aislamiento|Isolation|Isolation|Isolamento
Bilateral|Bilateral|Bilatéral|Bilateral
Unilateral|Unilateral|Unilatéral|Unilateral
Dificultad según complejidad técnica, estabilidad, coordinación y control, no según el peso.|Difficulty reflects technique, stability, coordination and control, not the weight.|La difficulté dépend de la technique, de la stabilité, de la coordination et du contrôle, pas de la charge.|A dificuldade depende da técnica, estabilidade, coordenação e controlo, não do peso.
BANCO: No necesita banco|BENCH: no bench needed|BANC : pas besoin de banc|BANCO: não precisa de banco
BANCO: Plano — 0°|BENCH: flat — 0°|BANC : plat — 0°|BANCO: plano — 0°
Otras inclinaciones son variantes con ficha propia.|Other angles are separate variations with their own page.|Les autres inclinaisons sont des variantes avec leur propre fiche.|Outras inclinações são variantes com ficha própria.
Tu última vez|Your last session|Ta dernière séance|A tua última vez
Sugerencia: intenta|Suggestion: try|Suggestion : essaie|Sugestão: tenta
si mantienes la técnica.|if your technique holds.|si ta technique tient.|se mantiveres a técnica.
Ver información avanzada|See advanced info|Voir les infos avancées|Ver informação avançada
Añadir al entrenamiento|Add to workout|Ajouter à la séance|Adicionar ao treino
Comparar con otro ejercicio|Compare with another exercise|Comparer avec un autre exercice|Comparar com outro exercício
`);
  if (window.vxAddTrPat) {
    window.vxAddTrPat(/^(.+) · (\d+) series · ([\d–-]+) reps · descanso (\d+)s · (.+): (\d+) series efectivas \((\d+) d\)$/, ['$1 · $2 sets · $3 reps · rest $4s · $5: $6 effective sets ($7 d)', '$1 · $2 séries · $3 reps · repos $4s · $5 : $6 séries efficaces ($7 j)', '$1 · $2 séries · $3 reps · descanso $4s · $5: $6 séries efetivas ($7 d)']);
    window.vxAddTrPat(/^(\d+) series →$/, ['$1 sets →', '$1 séries →', '$1 séries →']);
    window.vxAddTrPat(/^Secundarios: (.+)$/, ['Secondary: $1', 'Secondaires : $1', 'Secundários: $1']);
    window.vxAddTrPat(/^Ayer: (.+)$/, ['Yesterday: $1', 'Hier : $1', 'Ontem: $1']);
    window.vxAddTrPat(/^con esta comida · objetivo (\d+) kcal$/, ['with this meal · target $1 kcal', 'avec ce repas · objectif $1 kcal', 'com esta refeição · objetivo $1 kcal']);
  }
  // Ficha de ejercicio en otros idiomas: las tarjetas antiguas de técnica solo existen en español
  // y repiten lo que ya explica la tarjeta "Técnica correcta" (traducida), así que se ocultan.
  if (typeof V.ex === 'function') {
    const _ex = V.ex;
    V.ex = function () {
      let h = _ex.apply(this, arguments);
      if (S.lang && S.lang !== 'es' && h.indexOf('vx-tech') !== -1) {
        h = h.replace(/<div class="card"><b>(Preparación|Ejecución|3 errores que debes evitar)<\/b><div style="margin-top:6px">[\s\S]*?<\/div><\/div>/g, '');
      }
      return h;
    };
  }

  // Registrar serie: no se aceptan series vacías ("0 kg × 0") ni cifras imposibles por error de tecleo.
  // Antes contaban para la Arena, las misiones y los logros sin haber entrenado.
  const MSG = {
    reps: ['Indica cuántas repeticiones has hecho (mínimo 1).', 'Enter how many reps you did (at least 1).', 'Indique combien de répétitions tu as faites (au moins 1).', 'Indica quantas repetições fizeste (mínimo 1).'],
    big: ['Revisa los datos: más de 100 repeticiones o 1000 kg no es posible en una serie.', 'Check your numbers: over 100 reps or 1000 kg isn’t possible in one set.', 'Vérifie : plus de 100 répétitions ou 1000 kg n’est pas possible en une série.', 'Revê os dados: mais de 100 repetições ou 1000 kg não é possível numa série.'],
  };
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  if (typeof doneSet === 'function') {
    const _done = doneSet;
    doneSet = function () {
      const x = S.wk || {}, num = (v) => +String(v == null ? '' : v).replace(',', '.');
      const r = num(x.r), w = num(x.w || 0);
      const why = !(r >= 1) ? 'reps' : r > 100 || w > 1000 || w < 0 || !isFinite(w) ? 'big' : '';
      if (why) {
        try { navigator.vibrate && navigator.vibrate([60, 40, 60]); } catch (e) { /* sin vibración */ }
        if (typeof toast === 'function') toast('⚠️ ' + MSG[why][LI[S.lang] || 0]);
        return;
      }
      return _done.apply(this, arguments);
    };
    window.doneSet = doneSet;
  }

  // Saludo de Inicio: neutro (antes decía "Bienvenido" a todo el mundo) y según la hora y tu día
  const GREET = [['Buenos días', 'Good morning', 'Bonjour', 'Bom dia'], ['Buenas tardes', 'Good afternoon', 'Bon après-midi', 'Boa tarde'], ['Buenas noches', 'Good evening', 'Bonsoir', 'Boa noite']];
  const SUB = {
    done: ['Entreno de hoy hecho 💪 Ahora toca comer bien y descansar.', 'Today’s workout done 💪 Now eat well and rest.', 'Séance du jour faite 💪 Maintenant, bien manger et récupérer.', 'Treino de hoje feito 💪 Agora come bem e descansa.'],
    streak: ['🔥 {n} días seguidos. ¡No rompas la racha!', '🔥 {n} days in a row. Keep the streak alive!', '🔥 {n} jours d’affilée. Ne casse pas la série !', '🔥 {n} dias seguidos. Não quebres a sequência!'],
    tips: [
      ['Tu mejor versión empieza hoy. Vamos a por ello.', 'Your best self starts today. Let’s go.', 'Ta meilleure version commence aujourd’hui. Allons-y.', 'A tua melhor versão começa hoje. Vamos a isso.'],
      ['Un poco cada día gana a mucho de vez en cuando.', 'A little every day beats a lot once in a while.', 'Un peu chaque jour vaut mieux que beaucoup de temps en temps.', 'Um pouco todos os dias vence muito de vez em quando.'],
      ['Hoy cuenta. Aunque sean 20 minutos.', 'Today counts. Even if it’s 20 minutes.', 'Aujourd’hui compte. Même 20 minutes.', 'Hoje conta. Mesmo que sejam 20 minutos.'],
      ['La técnica primero; el peso llega solo.', 'Technique first; the weight will follow.', 'La technique d’abord ; la charge suivra.', 'A técnica primeiro; o peso vem depois.'],
    ],
  };
  if (typeof V.home === 'function') {
    const _home = V.home;
    V.home = function () {
      let h = _home.apply(this, arguments);
      try {
        const L = LI[S.lang] || 0, hr = new Date().getHours();
        const gi = hr >= 6 && hr < 13 ? 0 : hr >= 13 && hr < 21 ? 1 : 2;
        const today = new Date().toDateString();
        const log = window.vxRealLog ? window.vxRealLog() : (S.log || []);
        const trained = log.some((l) => new Date(l.t).toDateString() === today);
        const st = +S.streakCount || 0;
        const doy = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0)) / 864e5);
        const sub = trained ? SUB.done[L] : st >= 2 ? SUB.streak[L].replace('{n}', st) : SUB.tips[doy % SUB.tips.length][L];
        h = h.replace(/<h1 style="font-size:32px">(?:Bienvenido, (<span class="ac">[^<]*<\/span>)|¡Bienvenido a Volta!)<\/h1><div class="mu" style="margin:6px 0 16px">Tu mejor versión empieza hoy\. Vamos a por ello\.<\/div>/,
          (m, name) => `<h1 style="font-size:32px" class="vx-greet">${GREET[gi][L]}${name ? ', ' + name : ''}</h1><div class="mu vx-greet-sub" style="margin:6px 0 16px">${sub}</div>`);
      } catch (e) { /* saludo original */ }
      return h;
    };
  }

  // Rango máximo: Kratos, dios griego de la fuerza (hijo de Estigia). Su lema es "Dios de la Fuerza".
  const RENAME = [[/El Destructor/g, 'Dios de la Fuerza']];
  function renameRanks(root) {
    if (!root) return;
    const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT); let n;
    while ((n = w.nextNode())) if (/El Destructor/.test(n.nodeValue)) RENAME.forEach(([re, to]) => { n.nodeValue = n.nodeValue.replace(re, to); });
  }
  {
    const _R2 = R;
    R = function () { const out = _R2.apply(this, arguments); try { renameRanks(document.body); } catch (e) { /* textos originales */ } return out; };
  }
  window.vxRenameRanks = renameRanks;

  // Red de seguridad: si algún botón apunta a una pantalla que no existe, se vuelve atrás con un aviso
  // en lugar de romper el dibujado (que dejaba la pantalla vacía).
  const known = (v) => /^(ex|anat|meal)\d+$/.test(v) || typeof V[v] === 'function';
  const _R = R;
  let rescuing = false;
  R = function () {
    let guard = 0;
    while (S.stack && S.stack.length && !known(S.stack[S.stack.length - 1]) && guard++ < 10) {
      console.warn('[volta] pantalla inexistente:', S.stack.pop());
    }
    if (!known(S.tab)) S.tab = 'home';
    // Perfiles guardados por versiones antiguas o a medias: sin listas, Inicio se rompía entero
    const up = S.userProfile;
    if (up && typeof up === 'object') { if (!Array.isArray(up.injuries)) up.injuries = []; if (!Array.isArray(up.allergies)) up.allergies = []; }
    try {
      return _R.apply(this, arguments);
    } catch (e) {
      // Una pantalla que falla al dibujarse (datos incompletos, sesión caducada…) no deja la app en blanco:
      // se vuelve a la anterior, o a Inicio, y se avisa.
      console.error('[volta] error al dibujar', S.stack && S.stack[S.stack.length - 1], e);
      if (rescuing) throw e;
      rescuing = true;
      try {
        let out;
        if (S.stack && S.stack.length) S.stack.pop(); else S.tab = 'home';
        try { out = R.apply(this, arguments); } catch (e2) { S.stack = []; S.tab = 'home'; out = R.apply(this, arguments); }
        if (typeof toast === 'function') toast(['No se pudo abrir esa pantalla', 'That screen could not be opened', 'Impossible d’ouvrir cet écran', 'Não foi possível abrir esse ecrã'][{ en: 1, fr: 2, pt: 3 }[S.lang] || 0]);
        return out;
      } finally { rescuing = false; }
    }
  };
})();

// Guía de rangos: "7.000 XP – 11.999 XP" no debe partirse entre la cifra y "XP" en pantallas estrechas
(function () {
  const glue = (root) => root.querySelectorAll && root.querySelectorAll('.vrk .xp').forEach((el) => {
    if (/ XP/.test(el.textContent)) el.textContent = el.textContent.replace(/ XP/g, ' XP');
  });
  new MutationObserver((ms) => { for (const m of ms) m.addedNodes.forEach((n) => { if (n.nodeType === 1) glue(n.parentElement || n); }); })
    .observe(document.documentElement, { childList: true, subtree: true });
})();

// Perfil → "Cuestionario inicial": volver a responderlo para corregir datos (las rutinas, el plan y el historial se conservan)
(function () {
  if (typeof V !== 'object' || typeof V.prof !== 'function') return;
  const TX = {
    t: ['Cuestionario inicial', 'Initial questionnaire', 'Questionnaire initial', 'Questionário inicial'],
    s: ['Corrige tus respuestas', 'Fix your answers', 'Corrige tes réponses', 'Corrige as tuas respostas'],
  };
  const L = () => ({ en: 1, fr: 2, pt: 3 }[S.lang] || 0);
  const _prof = V.prof;
  V.prof = function () {
    let h = _prof.apply(this, arguments);
    try {
      if (typeof window.vxEditQuiz !== 'function') return h;
      const row = `<div class="li" onclick="vxEditQuiz()"><div class="g">📝 ${TX.t[L()]}<div class="mu" style="font-size:12px">${TX.s[L()]}</div></div><span class="arr">›</span></div>`;
      const m = h.match(/<div class="li" onclick="go\('p:profile'\)">[\s\S]*?<span class="arr">›<\/span><\/div>/);
      if (m) h = h.replace(m[0], m[0] + row);
    } catch (e) { /* Perfil original */ }
    return h;
  };
})();

// Memoria: se pide al navegador que guarde los datos de Volta de forma persistente (no los borra para liberar
// espacio). Así el progreso y la sesión se recuerdan hasta que el usuario los borre.
(function () {
  try { if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then((p) => { if (!p) navigator.storage.persist().catch(() => {}); }).catch(() => {}); } catch (e) { /* no disponible */ }
})();
