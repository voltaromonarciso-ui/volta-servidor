/* VOLTA · Plantillas de rutina: empezar a entrenar con un toque cuando aún no tienes rutinas */
(function () {
  if (typeof V !== 'object' || typeof V.routines !== 'function') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tt = (a) => a[LI[S.lang] || 0];
  const T = {
    emptyT: ['Empieza con una plantilla', 'Start with a template', 'Commence avec un modèle', 'Começa com um modelo'],
    emptyS: ['Rutinas probadas para tu nivel. Tócala y ya puedes entrenar; luego la ajustas a tu gusto.', 'Proven routines for your level. Tap one and start training; tweak it later.', 'Des routines éprouvées pour ton niveau. Touche-en une et entraîne-toi ; ajuste-la ensuite.', 'Rotinas testadas para o teu nível. Toca numa e começa a treinar; depois ajusta-a.'],
    use: ['Usar', 'Use', 'Utiliser', 'Usar'],
    added: ['Rutina creada', 'Routine created', 'Routine créée', 'Rotina criada'],
    own: ['…o crea la tuya desde cero', '…or build your own from scratch', '…ou crée la tienne de zéro', '…ou cria a tua do zero'],
    ex: ['ejercicios', 'exercises', 'exercices', 'exercícios'],
    perWeek: ['días/sem', 'days/wk', 'j/sem', 'dias/sem'],
    more: ['Más plantillas', 'More templates', 'Plus de modèles', 'Mais modelos'],
  };
  // [id, nombres ES/EN/FR/PT, icono, días, enfoque, nivel, ejercicios [nombre, series, reps, descanso]]
  const TPL = [
    ['fb', ['Cuerpo completo', 'Full body', 'Corps entier', 'Corpo inteiro'], '🏋️', 3, 'Hipertrofia', 'Principiante',
      [['Sentadilla', 3, '8-10', 120], ['Press de banca', 3, '8-10', 120], ['Remo con barra', 3, '8-10', 90], ['Press militar', 3, '8-10', 90], ['Peso muerto rumano', 3, '10-12', 90], ['Plancha', 3, '30-45 s', 60]]],
    ['up', ['Torso', 'Upper body', 'Haut du corps', 'Tronco'], '💪', 4, 'Hipertrofia', 'Intermedio',
      [['Press de banca', 4, '6-10', 120], ['Dominadas', 4, '6-10', 120], ['Press militar', 3, '8-10', 90], ['Remo con barra', 3, '8-10', 90], ['Elevaciones laterales', 3, '12-15', 60], ['Curl de bíceps', 3, '10-12', 60], ['Extensión de tríceps por encima de la cabeza en polea', 3, '10-12', 60]]],
    ['lo', ['Pierna y glúteo', 'Legs & glutes', 'Jambes et fessiers', 'Pernas e glúteos'], '🦵', 4, 'Hipertrofia', 'Intermedio',
      [['Sentadilla', 4, '6-10', 150], ['Peso muerto rumano', 3, '8-10', 120], ['Hip thrust', 3, '8-12', 90], ['Prensa de piernas', 3, '10-12', 90], [/^Curl femoral/, 3, '10-12', 60], ['Elevación de gemelos de pie', 4, '12-15', 60]]],
    ['home', ['En casa sin material', 'At home, no equipment', 'À la maison sans matériel', 'Em casa sem material'], '🏠', 3, 'Resistencia', 'Principiante',
      [['Flexiones', 3, '8-15', 60], ['Sentadilla búlgara', 3, '10-12', 60], ['Remo invertido', 3, '8-12', 60], ['Puente de glúteo', 3, '12-15', 45], ['Mountain climbers', 3, '30 s', 45], ['Superman', 3, '12', 45], ['Plancha', 3, '30-45 s', 45]]],
    ['str', ['Fuerza 5×5', 'Strength 5×5', 'Force 5×5', 'Força 5×5'], '🔩', 3, 'Fuerza', 'Intermedio',
      [['Sentadilla', 5, '5', 180], ['Press de banca', 5, '5', 180], ['Remo con barra', 5, '5', 150], ['Press militar', 3, '5', 150], ['Peso muerto rumano', 3, '6', 150]]],
  ];
  const find = (n) => EX.findIndex((e) => (n instanceof RegExp ? n.test(e[0]) : e[0] === n));
  const resolve = (tpl) => tpl[6].map(([n, sets, reps, rest]) => ({ i: find(n), sets, reps, rest })).filter((x) => x.i >= 0);
  const exName = (i) => (window.vxTr ? window.vxTr(EX[i][0]) : EX[i][0]);

  window.vxUseTpl = function (id) {
    const tpl = TPL.find((x) => x[0] === id); if (!tpl) return;
    const ex = resolve(tpl); if (!ex.length) return;
    const r = { id: Date.now(), name: tt(tpl[1]), days: tpl[3], focus: tpl[4], ex };
    S.routines.push(r);
    try { sv(); } catch (e) { /* sin almacenamiento */ }
    if (typeof toast === 'function') toast('✅ ' + tt(T.added) + ': ' + r.name);
    R();
  };
  let open = false;
  window.vxTplMore = () => { open = !open; R(); };

  function card(tpl) {
    const ex = resolve(tpl);
    return `<div class="card vx-tpl" onclick="vxUseTpl('${tpl[0]}')" role="button" tabindex="0">` +
      `<div class="vx-tpl-ic" aria-hidden="true">${tpl[2]}</div>` +
      `<div class="g"><b>${tt(tpl[1])}</b><div class="mu">${tpl[3]} ${tt(T.perWeek)} · ${ex.length} ${tt(T.ex)} · ${tpl[5]}</div>` +
      `<div class="vx-tpl-ex">${ex.slice(0, 4).map((x) => esc(exName(x.i))).join(' · ')}${ex.length > 4 ? ' …' : ''}</div></div>` +
      `<span class="chip on">${tt(T.use)}</span></div>`;
  }
  function gallery(all) {
    const L = all ? TPL : TPL.slice(0, 3);
    return `<div class="vx-tpl-head"><div class="vx-tpl-hero" aria-hidden="true">📋</div><h2 style="margin:6px 0 4px">${tt(T.emptyT)}</h2><div class="mu">${tt(T.emptyS)}</div></div>` +
      L.map(card).join('') + (all ? '' : `<button class="btn s" onclick="vxTplMore()">${tt(T.more)} (${TPL.length - 3})</button>`) +
      `<div class="mu" style="text-align:center;margin-top:14px">${tt(T.own)}</div>`;
  }

  const _r = V.routines;
  V.routines = function () {
    let h = _r.apply(this, arguments);
    try {
      if (!S.routines.length && !S.demo) {
        const empty = '<div class="mu">Aún no tienes rutinas.</div>';
        h = h.indexOf(empty) !== -1 ? h.replace(empty, gallery(open)) : h.replace('<button class="btn" style="margin-top:12px" onclick="go(\'newr\')">', gallery(open) + '<button class="btn" style="margin-top:12px" onclick="go(\'newr\')">');
      }
    } catch (e) { /* pantalla original */ }
    return h;
  };
  window.vxTemplates = TPL; // para pruebas
})();
