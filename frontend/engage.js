/* VOLTA · capa de enganche: misiones diarias, logros, recuperación muscular, calendario de actividad,
   aviso de fin de descanso y animaciones. Se inyecta después de mejoras.js con `npm run build:app`. */
(function () {
  'use strict';
  if (typeof S === 'undefined' || typeof R !== 'function') return;

  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const T = {
    missions: ['Misiones de hoy', "Today's missions", 'Missions du jour', 'Missões de hoje'],
    mTrain: ['Entrena hoy', 'Work out today', "Entraîne-toi aujourd'hui", 'Treina hoje'],
    mMeals: ['Registra 2 comidas', 'Log 2 meals', 'Enregistre 2 repas', 'Regista 2 refeições'],
    mWater: ['Bebe 2 litros de agua', 'Drink 2 litres of water', "Bois 2 litres d'eau", 'Bebe 2 litros de água'],
    go: ['Ir', 'Go', 'Aller', 'Ir'],
    perfect: ['¡Día perfecto! Misiones completadas', 'Perfect day! Missions complete', 'Journée parfaite ! Missions accomplies', 'Dia perfeito! Missões concluídas'],
    perfectShort: ['Día perfecto', 'Perfect day', 'Journée parfaite', 'Dia perfeito'],
    rec: ['Recuperación muscular', 'Muscle recovery', 'Récupération musculaire', 'Recuperação muscular'],
    readyToday: ['Listos para hoy', 'Ready today', "Prêts aujourd'hui", 'Prontos para hoje'],
    allReady: ['Todo recuperado: elige lo que quieras', 'Fully recovered: train anything', 'Tout est récupéré : entraîne ce que tu veux', 'Tudo recuperado: treina o que quiseres'],
    fresh: ['listo', 'ready', 'prêt', 'pronto'],
    act: ['Actividad', 'Activity', 'Activité', 'Atividade'],
    actSub: ['Últimas 16 semanas · {n} días entrenados', 'Last 16 weeks · {n} training days', '16 dernières semaines · {n} jours entraînés', 'Últimas 16 semanas · {n} dias treinados'],
    less: ['Menos', 'Less', 'Moins', 'Menos'], more: ['Más', 'More', 'Plus', 'Mais'],
    ach: ['Logros', 'Achievements', 'Succès', 'Conquistas'],
    achSub: ['{a} de {b} desbloqueados', '{a} of {b} unlocked', '{a} sur {b} débloqués', '{a} de {b} desbloqueadas'],
    unlocked: ['Logro desbloqueado', 'Achievement unlocked', 'Succès débloqué', 'Conquista desbloqueada'],
    restEnd: ['¡Descanso terminado!', 'Rest is over!', 'Repos terminé !', 'Descanso terminado!'],
    restBody: ['Vamos a por la siguiente serie 💪', "Let's hit the next set 💪", 'On attaque la série suivante 💪', 'Vamos à próxima série 💪'],
    quote: ['Frase del día', 'Quote of the day', 'Citation du jour', 'Frase do dia'],
    see: ['Ver todos', 'See all', 'Tout voir', 'Ver todos'],
  };
  const t = (k, vars) => {
    let s = (T[k] || [k])[LI[S.lang] || 0] || T[k][0];
    if (vars) Object.keys(vars).forEach((v) => { s = s.replace('{' + v + '}', vars[v]); });
    return s;
  };
  const td = () => lk(Date.now());
  const save = () => { try { sv(); } catch (e) { /* almacenamiento no disponible */ } };
  const vx = () => (S.vx && typeof S.vx === 'object' ? S.vx : (S.vx = {}));
  const reduceMotion = () => window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  const insertBefore = (html, marker, block) => {
    const i = html.indexOf(marker); if (i === -1) return null;
    const c = html.lastIndexOf('<div class="card', i); if (c === -1) return null;
    return html.slice(0, c) + block + html.slice(c);
  };

  /* ───────────── Datos de entrenamiento ───────────── */
  const realLog = () => (Array.isArray(S.log) ? S.log : []).filter((l) => { try { return isEff(l); } catch (e) { return true; } });
  const viewLog = () => { try { return getLog().filter(isEff); } catch (e) { return realLog(); } };
  const dayOf = (k) => (S.nlog && typeof S.nlog === 'object' && S.nlog[k]) || { e: [], w: 0 };

  /* ───────────── 1. Misiones diarias ───────────── */
  function missions() {
    const k = td(), d = dayOf(k);
    const trained = !!(S.done && S.done[k]) || realLog().some((l) => lk(l.t) == k);
    const meals = Array.isArray(d.e) ? d.e.length : 0;
    const water = +d.w || 0;
    return [
      { id: 'train', icon: '🏋️', label: t('mTrain'), done: trained, prog: trained ? 1 : 0, txt: trained ? '✓' : '', act: `<button class="chip" onclick="tab('train')">${t('go')}</button>` },
      { id: 'meals', icon: '🍽️', label: t('mMeals'), done: meals >= 2, prog: Math.min(1, meals / 2), txt: Math.min(meals, 2) + '/2', act: `<button class="chip" onclick="tab('nut')">${t('go')}</button>` },
      { id: 'water', icon: '💧', label: t('mWater'), done: water >= 2000, prog: Math.min(1, water / 2000), txt: (water / 1000).toLocaleString(S.lang, { maximumFractionDigits: 2 }) + '/2 L', act: '<button class="chip vx-water" onclick="vxWater(250)">+250 ml</button>' },
    ];
  }
  function missionsCard() {
    const M = missions(), n = M.filter((m) => m.done).length, perfect = n === M.length;
    const ring = (p) => { const C = 2 * Math.PI * 15; return `<svg class="vx-ring" viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="vx-ring-bg"/><circle cx="18" cy="18" r="15" class="vx-ring-fg" stroke-dasharray="${C}" stroke-dashoffset="${C * (1 - p)}"/></svg>`; };
    return `<div class="card vx-missions${perfect ? ' vx-perfect' : ''}"><div class="row sp"><b>${perfect ? '🔥 ' + t('perfectShort') : t('missions')}</b><span class="vx-count">${n}/${M.length}</span></div>` +
      M.map((m) => `<div class="row vx-mrow${m.done ? ' done' : ''}"><div class="vx-mic">${ring(m.prog)}<span>${m.done ? '✓' : m.icon}</span></div><div class="g"><div class="vx-ml">${m.label}</div>${m.txt && !m.done ? `<div class="mu">${m.txt}</div>` : ''}</div>${m.done ? '' : m.act}</div>`).join('') +
      '</div>';
  }
  function checkPerfect() {
    const M = missions(), k = td(), V2 = vx();
    V2.perfect = V2.perfect || {};
    if (M.every((m) => m.done) && !V2.perfect[k]) {
      V2.perfect[k] = 1; save();
      setTimeout(() => { window.vxCelebrate && window.vxCelebrate(); toast('🔥 ' + t('perfect')); }, 120);
    }
  }
  window.vxWater = function (ml) {
    const k = td();
    if (!S.nlog || typeof S.nlog !== 'object') S.nlog = {};
    const d = S.nlog[k] || (S.nlog[k] = { e: [], w: 0 });
    d.w = Math.min(10000, (+d.w || 0) + ml);
    try { navigator.vibrate && navigator.vibrate(15); } catch (e) { /* sin vibración */ }
    save(); R(); checkPerfect(); checkAchievements();
  };

  /* ───────────── 2. Logros ───────────── */
  function stats() {
    const L = realLog().slice().sort((a, b) => a.t - b.t);
    const days = new Set(L.map((l) => lk(l.t)));
    const mx = {}; let prs = 0;
    L.forEach((l) => { const w = l.w || 0; if (mx[l.ex] > 0 && w > mx[l.ex]) prs++; mx[l.ex] = Math.max(mx[l.ex] || 0, w); });
    const weeks = {};
    days.forEach((d) => { const x = new Date(d + 'T12:00'); const m = new Date(x); m.setDate(x.getDate() - ((x.getDay() + 6) % 7)); const wk = lk(m); weeks[wk] = (weeks[wk] || 0) + 1; });
    const nl = S.nlog && typeof S.nlog === 'object' ? Object.values(S.nlog) : [];
    return {
      days: days.size, sets: L.length, prs,
      vol: L.reduce((s, l) => s + (l.w || 0) * (l.r || 0), 0),
      exs: new Set(L.map((l) => l.ex)).size,
      early: L.some((l) => new Date(l.t).getHours() < 8) ? 1 : 0,
      late: L.some((l) => new Date(l.t).getHours() >= 22) ? 1 : 0,
      streak: +S.streakCount || 0,
      perfect: Object.keys(vx().perfect || {}).length,
      water: nl.filter((d) => d && +d.w >= 2000).length,
      food: nl.filter((d) => d && Array.isArray(d.e) && d.e.length >= 2).length,
      solid: Object.values(weeks).filter((n) => n >= 3).length,
    };
  }
  // [id, icono, nombre ES|EN|FR|PT, descripción ES|EN|FR|PT, métrica, objetivo]
  const ACH = [
    ['first', '👟', 'Primer paso|First step|Premier pas|Primeiro passo', 'Completa tu primer entreno|Finish your first workout|Termine ton premier entraînement|Conclui o teu primeiro treino', 'days', 1],
    ['w5', '⚡', 'En marcha|On a roll|Lancé|Em andamento', 'Entrena 5 días|Train on 5 days|Entraîne-toi 5 jours|Treina 5 dias', 'days', 5],
    ['w25', '🏋️', 'Constante|Consistent|Régulier|Constante', 'Entrena 25 días|Train on 25 days|Entraîne-toi 25 jours|Treina 25 dias', 'days', 25],
    ['w100', '🦾', 'Imparable|Unstoppable|Inarrêtable|Imparável', 'Entrena 100 días|Train on 100 days|Entraîne-toi 100 jours|Treina 100 dias', 'days', 100],
    ['str3', '🔥', 'Calentando motores|Warming up|Ça chauffe|A aquecer', 'Racha de 3 días|3-day streak|Série de 3 jours|Sequência de 3 dias', 'streak', 3],
    ['str7', '🔥', 'Semana de fuego|Week on fire|Semaine en feu|Semana em chamas', 'Racha de 7 días|7-day streak|Série de 7 jours|Sequência de 7 dias', 'streak', 7],
    ['str30', '🌋', 'Volcán|Volcano|Volcan|Vulcão', 'Racha de 30 días|30-day streak|Série de 30 jours|Sequência de 30 dias', 'streak', 30],
    ['pr1', '🏆', 'Nuevo nivel|Level up|Niveau supérieur|Novo nível', 'Bate tu primer récord|Set your first record|Bats ton premier record|Bate o teu primeiro recorde', 'prs', 1],
    ['pr10', '👑', 'Rompe-récords|Record breaker|Briseur de records|Quebra-recordes', 'Bate 10 récords|Set 10 records|Bats 10 records|Bate 10 recordes', 'prs', 10],
    ['t10', '🧱', '10 toneladas|10 tonnes|10 tonnes|10 toneladas', 'Levanta 10.000 kg en total|Lift 10,000 kg in total|Soulève 10 000 kg au total|Levanta 10.000 kg no total', 'vol', 10000],
    ['t100', '🏗️', '100 toneladas|100 tonnes|100 tonnes|100 toneladas', 'Levanta 100.000 kg en total|Lift 100,000 kg in total|Soulève 100 000 kg au total|Levanta 100.000 kg no total', 'vol', 100000],
    ['t1000', '🗿', 'Leyenda de hierro|Iron legend|Légende de fer|Lenda de ferro', 'Levanta 1.000.000 kg en total|Lift 1,000,000 kg in total|Soulève 1 000 000 kg au total|Levanta 1.000.000 kg no total', 'vol', 1000000],
    ['s100', '💯', 'Centenario|Centurion|Centurion|Centenário', 'Completa 100 series|Complete 100 sets|Termine 100 séries|Conclui 100 séries', 'sets', 100],
    ['s1000', '🎯', 'Mil series|Thousand sets|Mille séries|Mil séries', 'Completa 1.000 series|Complete 1,000 sets|Termine 1 000 séries|Conclui 1.000 séries', 'sets', 1000],
    ['ex20', '🧭', 'Explorador|Explorer|Explorateur|Explorador', 'Prueba 20 ejercicios distintos|Try 20 different exercises|Essaie 20 exercices différents|Experimenta 20 exercícios diferentes', 'exs', 20],
    ['early', '🌅', 'Madrugador|Early bird|Lève-tôt|Madrugador', 'Entrena antes de las 8:00|Train before 8 am|Entraîne-toi avant 8 h|Treina antes das 8:00', 'early', 1],
    ['late', '🌙', 'Noctámbulo|Night owl|Oiseau de nuit|Noctívago', 'Entrena después de las 22:00|Train after 10 pm|Entraîne-toi après 22 h|Treina depois das 22:00', 'late', 1],
    ['perf1', '⭐', 'Día perfecto|Perfect day|Journée parfaite|Dia perfeito', 'Completa las 3 misiones de un día|Complete all 3 missions in a day|Accomplis les 3 missions en un jour|Conclui as 3 missões num dia', 'perfect', 1],
    ['perf7', '🌟', 'Semana perfecta|Perfect week|Semaine parfaite|Semana perfeita', 'Consigue 7 días perfectos|Get 7 perfect days|Obtiens 7 journées parfaites|Consegue 7 dias perfeitos', 'perfect', 7],
    ['h7', '💧', 'Hidratado|Hydrated|Hydraté|Hidratado', 'Bebe 2 L en 7 días distintos|Drink 2 L on 7 different days|Bois 2 L sur 7 jours différents|Bebe 2 L em 7 dias diferentes', 'water', 7],
    ['n7', '🥗', 'Buen comer|Eating well|Bien manger|Comer bem', 'Registra tus comidas 7 días|Log your meals on 7 days|Enregistre tes repas 7 jours|Regista as refeições em 7 dias', 'food', 7],
    ['wk4', '📅', 'Mes sólido|Solid month|Mois solide|Mês sólido', '4 semanas con 3+ entrenos|4 weeks with 3+ workouts|4 semaines avec 3+ séances|4 semanas com 3+ treinos', 'solid', 4],
  ];
  const part = (s, i) => s.split('|')[i] || s.split('|')[0];
  function achList() {
    const st = stats(), x = LI[S.lang] || 0;
    return ACH.map(([id, icon, name, desc, m, goal]) => ({ id, icon, name: part(name, x), desc: part(desc, x), cur: Math.min(st[m] || 0, goal), goal, ok: (st[m] || 0) >= goal }));
  }
  function checkAchievements() {
    const V2 = vx(); V2.ach = V2.ach || {};
    const list = achList(), fresh = list.filter((a) => a.ok && !V2.ach[a.id]);
    if (!fresh.length) return;
    fresh.forEach((a) => { V2.ach[a.id] = Date.now(); });
    const first = !V2.achInit; V2.achInit = 1; save();
    if (first) return; // primera vez: lo ya conseguido se marca sin avalancha de avisos
    fresh.forEach((a, i) => setTimeout(() => { toast('🏅 ' + t('unlocked') + ': ' + a.icon + ' ' + a.name); if (i === 0 && window.vxCelebrate) window.vxCelebrate(); }, 300 + i * 1800));
  }
  window.vxAch = achList; // para pruebas

  function achCard() {
    const L = achList(), n = L.filter((a) => a.ok).length;
    const next = L.filter((a) => !a.ok).sort((a, b) => b.cur / b.goal - a.cur / a.goal).slice(0, 3);
    return `<div class="card vx-achcard" onclick="go('vx:ach')" role="button" tabindex="0"><div class="row sp"><b>🏅 ${t('ach')}</b><span class="mu">${t('achSub', { a: n, b: L.length })} ›</span></div>` +
      `<div class="vx-achbar"><i style="width:${Math.round((n / L.length) * 100)}%"></i></div>` +
      `<div class="row vx-achnext">${next.map((a) => `<div class="vx-badge sm" title="${esc(a.name)}"><span>${a.icon}</span><i style="--p:${a.cur / a.goal}"></i></div>`).join('')}</div></div>`;
  }
  V['vx:ach'] = function () {
    const L = achList(), n = L.filter((a) => a.ok).length;
    const fmt = (v) => (v >= 10000 ? Math.round(v / 1000).toLocaleString(S.lang) + 'k' : Math.round(v).toLocaleString(S.lang));
    return `<div class="row"><button class="back" onclick="back()">‹</button><h1 style="font-size:22px">${t('ach')}</h1></div>` +
      `<div class="mu" style="margin:6px 0 14px">${t('achSub', { a: n, b: L.length })}</div><div class="vx-achbar big"><i style="width:${Math.round((n / L.length) * 100)}%"></i></div>` +
      `<div class="vx-achgrid">${L.map((a) => `<div class="vx-ach${a.ok ? ' ok' : ''}"><div class="vx-badge"><span>${a.icon}</span>${a.ok ? '' : `<i style="--p:${a.cur / a.goal}"></i>`}</div><b>${esc(a.name)}</b><div class="mu">${esc(a.desc)}</div>${a.ok ? '' : `<div class="vx-achp">${fmt(a.cur)} / ${fmt(a.goal)}</div>`}</div>`).join('')}</div>` +
      heatmapCard();
  };

  /* ───────────── 3. Recuperación muscular (como Fitbod) ───────────── */
  function recovery() {
    const now = Date.now(), L = viewLog(), last = {}, vol = {};
    L.forEach((l) => {
      const g = EX[l.ex] && EX[l.ex][1]; if (!g) return;
      last[g] = Math.max(last[g] || 0, l.t);
      if (now - l.t < 72 * 36e5) vol[g] = (vol[g] || 0) + 1;
    });
    const groups = [...new Set(EX.map((e) => e[1]))];
    return groups.map((g) => {
      const h = last[g] ? (now - last[g]) / 36e5 : Infinity;
      const need = (vol[g] || 0) >= 10 ? 72 : 48; // más series → más recuperación
      const st = h >= need ? 'ok' : h >= need / 2 ? 'mid' : 'low';
      return { g, h, st, pct: Math.min(1, h / need) };
    }).sort((a, b) => b.pct - a.pct);
  }
  function recoveryCard() {
    const R2 = recovery(), ready = R2.filter((r) => r.st === 'ok');
    const name = (g) => window.vxTr ? window.vxTr(g) : g;
    const sub = ready.length === R2.length ? t('allReady') : t('readyToday') + ': ' + ready.slice(0, 4).map((r) => name(r.g)).join(', ');
    return `<div class="card vx-rec"><div class="row sp"><b>💪 ${t('rec')}</b></div><div class="mu" style="margin:4px 0 10px">${esc(sub)}</div><div class="vx-recgrid">` +
      R2.map((r) => `<div class="vx-recm ${r.st}"><span>${esc(name(r.g))}</span><em>${r.h === Infinity ? t('fresh') : r.st === 'ok' ? '✓' : Math.round(r.h) + ' h'}</em><i style="width:${Math.round(r.pct * 100)}%"></i></div>`).join('') +
      '</div></div>';
  }

  /* ───────────── 4. Calendario de actividad (16 semanas) ───────────── */
  function heatmapCard() {
    const per = {}; viewLog().forEach((l) => { const k = lk(l.t); per[k] = (per[k] || 0) + 1; });
    const today = new Date(); today.setHours(12, 0, 0, 0);
    const start = new Date(today); start.setDate(today.getDate() - ((today.getDay() + 6) % 7) - 7 * 15);
    const cells = []; let days = 0;
    for (let i = 0; i < 16 * 7; i++) {
      const d = new Date(start); d.setDate(start.getDate() + i);
      const k = lk(d), n = per[k] || 0, fut = d > today;
      if (n) days++;
      const lv = fut ? 'f' : n === 0 ? 0 : n <= 5 ? 1 : n <= 12 ? 2 : n <= 20 ? 3 : 4;
      cells.push(`<i class="l${lv}" title="${k}: ${n}"></i>`);
    }
    return `<div class="card vx-heat"><div class="row sp"><b>📆 ${t('act')}</b></div><div class="mu" style="margin:4px 0 10px">${t('actSub', { n: days })}</div><div class="vx-heatgrid">${cells.join('')}</div>` +
      `<div class="row vx-heatleg"><span class="mu">${t('less')}</span><i class="l0"></i><i class="l1"></i><i class="l2"></i><i class="l3"></i><i class="l4"></i><span class="mu">${t('more')}</span></div></div>`;
  }

  /* ───────────── 5. Frase del día ───────────── */
  const QUOTES = [
    ['La disciplina vence a la motivación.', 'Discipline beats motivation.', 'La discipline bat la motivation.', 'A disciplina vence a motivação.'],
    ['Un entreno a medias vale más que ninguno.', 'Half a workout beats no workout.', 'Une demi-séance vaut mieux que rien.', 'Meio treino vale mais do que nenhum.'],
    ['No cuentes los días: haz que los días cuenten.', "Don't count the days, make the days count.", 'Ne compte pas les jours, fais que les jours comptent.', 'Não contes os dias, faz os dias contarem.'],
    ['El progreso es progreso, aunque sea lento.', 'Progress is progress, no matter how slow.', 'Un progrès reste un progrès, même lent.', 'Progresso é progresso, mesmo que lento.'],
    ['Tu único rival eres tú ayer.', 'Your only rival is who you were yesterday.', "Ton seul rival, c'est toi hier.", 'O teu único rival és tu ontem.'],
    ['Constancia hoy, resultados mañana.', 'Consistency today, results tomorrow.', "Régularité aujourd'hui, résultats demain.", 'Constância hoje, resultados amanhã.'],
    ['El mejor momento para empezar fue ayer. El segundo, ahora.', 'The best time to start was yesterday. The next best is now.', "Le meilleur moment pour commencer, c'était hier. Le deuxième, c'est maintenant.", 'O melhor momento para começar foi ontem. O segundo é agora.'],
    ['Descansar también es entrenar.', 'Rest is part of training.', "Se reposer, c'est aussi s'entraîner.", 'Descansar também é treinar.'],
    ['Pequeñas mejoras diarias, grandes resultados.', 'Small daily wins, big results.', 'Petits progrès quotidiens, grands résultats.', 'Pequenas melhorias diárias, grandes resultados.'],
    ['Hazlo por la persona en la que te estás convirtiendo.', "Do it for the person you're becoming.", 'Fais-le pour la personne que tu deviens.', 'Fá-lo pela pessoa em que te estás a tornar.'],
    ['La fuerza no viene del cuerpo, viene de la voluntad.', 'Strength comes from an indomitable will.', 'La force vient de la volonté.', 'A força vem da vontade.'],
    ['Una serie más. Siempre una más.', 'One more set. Always one more.', 'Une série de plus. Toujours une de plus.', 'Mais uma série. Sempre mais uma.'],
  ];
  function quoteCard() {
    const n = Math.floor(Date.now() / 864e5) % QUOTES.length;
    return `<div class="vx-quote"><span class="mu">${t('quote')}</span><p>“${QUOTES[n][LI[S.lang] || 0]}”</p></div>`;
  }

  /* ───────────── Inserción en las pantallas ───────────── */
  const _home = V.home;
  V.home = function () {
    let h = _home.apply(this, arguments);
    try {
      const block = missionsCard() + recoveryCard();
      h = insertBefore(h, 'Calorías de hoy', block) || insertBefore(h, 'Tu plan de hoy', block) || h + block;
      h += achCard() + quoteCard();
    } catch (e) { /* la pantalla original sigue intacta */ }
    return h;
  };
  if (typeof V.prog === 'function') {
    const _prog = V.prog;
    V.prog = function () {
      let h = _prog.apply(this, arguments);
      try { h = insertBefore(h, 'esumen de esta semana', heatmapCard()) || insertBefore(h, 'ESUMEN DE ESTA SEMANA', heatmapCard()) || h + heatmapCard(); } catch (e) { /* idem */ }
      return h;
    };
  }
  if (typeof V.prof === 'function') {
    const _prof = V.prof;
    V.prof = function () {
      let h = _prof.apply(this, arguments);
      try { h = insertBefore(h, 'Mi perfil', achCard()) || h + achCard(); } catch (e) { /* idem */ }
      return h;
    };
  }

  /* ───────────── 6. Aviso de fin de descanso (también con la pantalla bloqueada) ───────────── */
  // Se comprueba cada segundo mientras hay descanso: sigue a −15 s / +15 s / pausa / saltar.
  let restIv = null, pending = 0;
  function showRestNote() {
    if (document.visibilityState === 'visible' || !('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: t('restBody'), icon: 'icon-192.png', badge: 'icon-192.png', tag: 'volta-rest', renotify: true, vibrate: [200, 100, 200] };
    const show = (reg) => (reg ? reg.showNotification(t('restEnd'), opts) : new Notification(t('restEnd'), opts));
    try { (navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null)).then(show).catch(() => show(null)); } catch (e) { /* sin avisos */ }
  }
  function restTick() {
    const on = S.w && S.w.on, now = Date.now();
    if (on && S.w.end && !S.w.paused) pending = S.w.end;
    if (pending && now >= pending - 500) { pending = 0; showRestNote(); }
    else if (!on && pending && now < pending - 1500) pending = 0; // descanso saltado: sin aviso
    if (!on && !pending) { clearInterval(restIv); restIv = null; }
  }
  if (typeof doneSet === 'function') {
    const _done = doneSet;
    doneSet = function () {
      try { if ('Notification' in window && Notification.permission === 'default') Notification.requestPermission().catch(() => {}); } catch (e) { /* sin avisos */ }
      const out = _done.apply(this, arguments);
      if (!restIv) restIv = setInterval(restTick, 1000);
      setTimeout(() => { checkPerfect(); checkAchievements(); }, 400);
      return out;
    };
  }

  /* ───────────── 7. Números que suben al terminar el entreno ───────────── */
  let countedFor = '';
  function countUp() {
    if (reduceMotion() || countedFor === td()) return;
    const root = document.getElementById('m'); if (!root || !root.querySelector('.pop9')) return;
    countedFor = td();
    root.querySelectorAll('b.big').forEach((el) => {
      const m = /^([+]?)([\d.,]+)$/.exec(el.textContent.trim()); if (!m) return;
      const target = parseFloat(m[2].replace(/[.,](?=\d{3}\b)/g, '').replace(',', '.')); if (!isFinite(target) || target <= 0) return;
      const final = el.textContent, t0 = performance.now(), dur = 900;
      (function step(now) {
        const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
        el.textContent = k < 1 ? m[1] + Math.round(target * e).toLocaleString(S.lang) : final;
        if (k < 1) requestAnimationFrame(step);
      })(t0);
    });
  }

  const _R = R;
  R = function () {
    const out = _R.apply(this, arguments);
    try { countUp(); } catch (e) { /* sin animación */ }
    return out;
  };

  setTimeout(() => { try { checkAchievements(); } catch (e) { /* sin logros */ } }, 1500);
  try { R(); } catch (e) { /* la app ya está pintada */ }
})();
