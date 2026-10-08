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
    frzWon: ['Has ganado un congelador de racha 🧊', 'You earned a streak freeze 🧊', 'Tu as gagné un gel de série 🧊', 'Ganhaste um congelador de sequência 🧊'],
    frzUsed: ['Congelador usado: tu racha sigue viva 🧊', 'Streak freeze used: your streak lives on 🧊', 'Gel utilisé : ta série continue 🧊', 'Congelador usado: a tua sequência continua 🧊'],
    frzTip: ['Congeladores de racha: protegen tu racha si un día no abres la app. Ganas uno cada 3 días perfectos.', 'Streak freezes protect your streak if you miss a day. Earn one every 3 perfect days.', "Les gels de série protègent ta série si tu rates un jour. Gagnes-en un tous les 3 jours parfaits.", 'Os congeladores protegem a tua sequência se falhares um dia. Ganhas um a cada 3 dias perfeitos.'],
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
    const frz = vx().freezes || 0;
    return `<div class="card vx-missions${perfect ? ' vx-perfect' : ''}"><div class="row sp"><b>${perfect ? '🔥 ' + t('perfectShort') : t('missions')}</b><span class="row" style="gap:8px">${frz ? `<span class="vx-frz" title="${esc(t('frzTip'))}" aria-label="${esc(t('frzTip'))}">🧊 ${frz}</span>` : ''}<span class="vx-count">${n}/${M.length}</span></span></div>` +
      M.map((m) => `<div class="row vx-mrow${m.done ? ' done' : ''}"><div class="vx-mic">${ring(m.prog)}<span>${m.done ? '✓' : m.icon}</span></div><div class="g"><div class="vx-ml">${m.label}</div>${m.txt && !m.done ? `<div class="mu">${m.txt}</div>` : ''}</div>${m.done ? '' : m.act}</div>`).join('') +
      '</div>';
  }
  function checkPerfect() {
    const M = missions(), k = td(), V2 = vx();
    V2.perfect = V2.perfect || {};
    if (M.every((m) => m.done) && !V2.perfect[k]) {
      V2.perfect[k] = 1; save();
      pushInbox('🔥', t('perfect'));
      const nP = Object.keys(V2.perfect).length;
      if (nP % 3 === 0 && (V2.freezes || 0) < 2) { V2.freezes = (V2.freezes || 0) + 1; save(); pushInbox('🧊', t('frzWon')); setTimeout(() => toast(t('frzWon')), 2400); }
      try { R(); } catch (e) { /* se verá en el siguiente render */ }
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
    // Primera comprobación: lo ya conseguido se marca sin avalancha de avisos
    if (!V2.achInit) { fresh.forEach((a) => { V2.ach[a.id] = Date.now(); }); V2.achInit = 1; save(); return; }
    if (!fresh.length) return;
    fresh.forEach((a) => { V2.ach[a.id] = Date.now(); });
    save();
    fresh.forEach((a) => pushInbox(a.icon, t('unlocked') + ': ' + a.name, "go('vx:ach')"));
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
      const due = weekDue();
      if (due && vx().weekNote !== lk(Date.now() - ((new Date().getDay() + 6) % 7) * 864e5)) { vx().weekNote = lk(Date.now() - ((new Date().getDay() + 6) % 7) * 864e5); pushInbox('📊', w('ready'), 'vxWeek()'); }
      const block = (due ? weekCard(true) : '') + missionsCard() + recoveryCard();
      // Social pasa de flotar sobre el logo a la fila de iconos de la cabecera
      const soc = '<div class="chips"><div class="chip" onclick="socGo()" style="border-color:var(--ac)">👥 Social ›</div></div>';
      if (h.indexOf(soc) !== -1) h = h.replace(soc, '').replace('<div class="row" style="gap:8px"><div class="ib"', '<div class="row" style="gap:8px"><div class="ib vx-soc" onclick="socGo()">👥</div><div class="ib"');
      h = insertBefore(h, 'Calorías de hoy', block) || insertBefore(h, 'Tu plan de hoy', block) || h + block;
      if (socialOn()) { h += lbCard(); setTimeout(loadLeaderboard, 0); }
      h += achCard() + quoteCard();
    } catch (e) { /* la pantalla original sigue intacta */ }
    return h;
  };
  if (typeof V.prog === 'function') {
    const _prog = V.prog;
    V.prog = function () {
      let h = _prog.apply(this, arguments);
      try { const blk = weekCard(false) + heatmapCard(); h = insertBefore(h, 'esumen de esta semana', blk) || insertBefore(h, 'ESUMEN DE ESTA SEMANA', blk) || h + blk; } catch (e) { /* idem */ }
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
      setTimeout(() => { checkPerfect(); checkAchievements(); pushStats(); }, 400);
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

  /* ───────────── 11. Clasificación semanal con amigos (como Strava) ───────────── */
  const LB = {
    title: ['Clasificación semanal', 'Weekly leaderboard', 'Classement de la semaine', 'Classificação semanal'],
    resets: ['Se reinicia cada lunes', 'Resets every Monday', 'Remis à zéro chaque lundi', 'Reinicia todas as segundas'],
    you: ['tú', 'you', 'toi', 'tu'],
    days: ['días', 'days', 'jours', 'dias'],
    invite: ['Añade amigos para competir', 'Add friends to compete', 'Ajoute des amis pour te mesurer à eux', 'Adiciona amigos para competir'],
    loading: ['Cargando…', 'Loading…', 'Chargement…', 'A carregar…'],
  };
  const lb = (k) => LB[k][LI[S.lang] || 0];
  const socialOn = () => !!(window.VoltaAPI && VoltaAPI.isLoggedIn() && S.soc && S.soc.me);
  const apiCall = (method, path, body) => {
    let token = ''; try { token = localStorage.getItem('volta.token') || ''; } catch (e) { /* sin almacenamiento */ }
    return fetch(VoltaAPI.getBase() + path, { method, headers: Object.assign({ Authorization: 'Bearer ' + token }, body ? { 'Content-Type': 'application/json' } : {}), body: body ? JSON.stringify(body) : undefined })
      .then((r) => (r.status === 204 ? null : r.ok ? r.json() : Promise.reject(r.status)));
  };
  function thisWeek() {
    const now = new Date(), mon = new Date(now); mon.setHours(0, 0, 0, 0); mon.setDate(now.getDate() - ((now.getDay() + 6) % 7));
    const L = realLog().filter((l) => l.t >= mon.getTime());
    return { days: new Set(L.map((l) => lk(l.t))).size, sets: L.length, volume: Math.round(L.reduce((s, l) => s + (l.w || 0) * (l.r || 0), 0)) };
  }
  let lbCache = null, lbAt = 0, lbBusy = false, pushT = null;
  function pushStats() {
    if (!socialOn()) return;
    clearTimeout(pushT);
    pushT = setTimeout(() => {
      apiCall('POST', '/api/users/stats', thisWeek())
        .then((d) => { lbAt = 0; if (d && window.vxArenaServer) window.vxArenaServer(d); if (document.querySelector('.vx-lb-body')) loadLeaderboard(); }) // la tarjeta visible refleja tu última serie
        .catch(() => {});
    }, 1500);
  }
  function lbRows(d) {
    if (!d || !d.entries) return `<div class="mu">${lb('loading')}</div>`;
    const medal = ['🥇', '🥈', '🥉'];
    const rows = d.entries.map((e, i) => `<div class="row vx-lbr${e.me ? ' me' : ''}"><span class="vx-lbp">${medal[i] || i + 1}</span><b class="g">${esc(e.username)}${e.me ? ` <span class="mu">(${lb('you')})</span>` : ''}</b><span class="mu">${e.days} ${lb('days')}</span><b class="vx-lbv">${e.volume.toLocaleString(S.lang)} ${S.units.w}</b></div>`).join('');
    return rows + (d.entries.length < 2 ? `<button class="btn o sm" style="margin-top:10px" onclick="socGo()">👥 ${lb('invite')}</button>` : '');
  }
  function loadLeaderboard() {
    if (lbBusy || !socialOn() || Date.now() - lbAt < 30000) return;
    lbBusy = true;
    apiCall('GET', '/api/friends/leaderboard').then((d) => {
      lbCache = d; lbAt = Date.now();
      document.querySelectorAll('.vx-lb-body').forEach((el) => { el.innerHTML = lbRows(d); });
    }).catch(() => {}).finally(() => { lbBusy = false; });
  }
  const lbCard = () => `<div class="card vx-lb"><div class="row sp"><b>🏁 ${lb('title')}</b><span class="mu">${lb('resets')}</span></div><div class="vx-lb-body">${lbRows(lbCache)}</div></div>`;
  window.vxLeaderboard = () => lbCache; // para pruebas
  // Compartido con compete.js (Arena)
  window.vxApiCall = apiCall; window.vxSocialOn = socialOn; window.vxThisWeek = thisWeek; window.vxRealLog = realLog;
  window.vxPushInbox = (icon, text, act) => pushInbox(icon, text, act);
  if (typeof V.soc === 'function') {
    const _soc = V.soc;
    V.soc = function () { const h = _soc.apply(this, arguments); try { if (socialOn()) { setTimeout(loadLeaderboard, 0); return h + lbCard(); } } catch (e) { /* idem */ } return h; };
  }
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') pushStats(); });
  setTimeout(pushStats, 2500);

  /* ───────────── 10. Actividad (la campana): logros, récords, días perfectos y avisos ───────────── */
  const IB = {
    title: ['Actividad', 'Activity', 'Activité', 'Atividade'],
    empty: ['Aquí verás tus logros, récords y avisos.', "Your achievements, records and alerts will show up here.", 'Tes succès, records et alertes apparaîtront ici.', 'Aqui vais ver as tuas conquistas, recordes e avisos.'],
    now: ['ahora', 'now', 'maintenant', 'agora'],
    social: ['Comunidad', 'Community', 'Communauté', 'Comunidade'],
  };
  const ib = (k) => IB[k][LI[S.lang] || 0];
  function inbox() { const V2 = vx(); if (!Array.isArray(V2.inbox)) V2.inbox = []; return V2.inbox; }
  function pushInbox(icon, text, act) {
    const L = inbox();
    if (L.length && L[0].text === text && Date.now() - L[0].t < 6e4) return; // evita duplicados seguidos
    L.unshift({ t: Date.now(), icon, text, act: act || '', seen: false });
    L.length = Math.min(L.length, 60); save();
  }
  const unread = () => inbox().some((n) => !n.seen);
  function ago(ts) {
    const s = (Date.now() - ts) / 1000;
    try {
      const f = new Intl.RelativeTimeFormat(S.lang, { numeric: 'auto' });
      if (s < 60) return ib('now');
      if (s < 3600) return f.format(-Math.round(s / 60), 'minute');
      if (s < 86400) return f.format(-Math.round(s / 3600), 'hour');
      return f.format(-Math.round(s / 86400), 'day');
    } catch (e) { return new Date(ts).toLocaleString(); }
  }
  V['vx:inbox'] = function () {
    const L = inbox();
    const html = `<div class="row"><button class="back" onclick="back()">‹</button><h1 style="font-size:22px">${ib('title')}</h1></div>` +
      (L.length ? `<div class="vx-inbox">${L.map((n) => `<div class="vx-ibi${n.seen ? '' : ' new'}"${n.act ? ` onclick="${n.act}" role="button" tabindex="0"` : ''}><span class="vx-ibic">${n.icon}</span><div class="g"><div>${esc(n.text)}</div><div class="mu">${ago(n.t)}</div></div></div>`).join('')}</div>`
        : `<div class="vx-empty"><div>🔔</div><p class="mu">${ib('empty')}</p></div>`);
    if (L.some((n) => !n.seen)) { L.forEach((n) => { n.seen = true; }); save(); }
    return html;
  };
  // Los avisos de la app (récord, rango nuevo) también quedan guardados en Actividad
  if (typeof toast === 'function') {
    const _toast = toast;
    toast = function (m) {
      try {
        const s = String(m || '');
        if (/RÉCORD PERSONAL|NUEVO RANGO/.test(s)) pushInbox(/RANGO/.test(s) ? '🟣' : '🏆', (window.vxTr ? window.vxTr(s) : s).replace(/^[^\wÀ-ÿ¡¿]+/u, ''), "tab('prog')");
      } catch (e) { /* sin bandeja */ }
      return _toast.apply(this, arguments);
    };
  }
  // Cabecera: campana → Actividad (con punto si hay novedades) e iconos accesibles con teclado
  const HDR = { '?': ['Ayuda', 'Help', 'Aide', 'Ajuda'], bell: ['Actividad', 'Activity', 'Activité', 'Atividade'], prof: ['Perfil', 'Profile', 'Profil', 'Perfil'], soc: ['Comunidad', 'Community', 'Communauté', 'Comunidade'] };
  function fixHeader() {
    const root = document.getElementById('m'); if (!root) return;
    const x = LI[S.lang] || 0;
    root.querySelectorAll('[onclick*="Sin notificaciones"]').forEach((el) => { el.setAttribute('onclick', "go('vx:inbox')"); el.classList.add('vx-bell'); });
    root.querySelectorAll('.vx-bell').forEach((el) => { const d = el.querySelector('.vx-dot'); if (unread() && !d) el.insertAdjacentHTML('beforeend', '<i class="vx-dot"></i>'); else if (!unread() && d) d.remove(); });
    root.querySelectorAll('.ib').forEach((el) => {
      el.setAttribute('role', 'button'); el.tabIndex = 0;
      const oc = el.getAttribute('onclick') || '';
      const k = el.classList.contains('vx-bell') ? 'bell' : /obOpen/.test(oc) ? '?' : /prof/.test(oc) ? 'prof' : /socGo/.test(oc) ? 'soc' : null;
      if (k) el.setAttribute('aria-label', HDR[k][x]);
    });
  }
  document.addEventListener('keydown', (e) => {
    const el = e.target;
    if ((e.key === 'Enter' || e.key === ' ') && el && el.getAttribute && el.getAttribute('role') === 'button' && el.tagName !== 'BUTTON') { e.preventDefault(); el.click(); }
  });

  /* ───────────── 9. Resumen semanal en historias (estilo Wrapped) ───────────── */
  const W = {
    title: ['Tu semana en Volta', 'Your week in Volta', 'Ta semaine sur Volta', 'A tua semana no Volta'],
    last7: ['Últimos 7 días', 'Last 7 days', '7 derniers jours', 'Últimos 7 dias'],
    open: ['Ver mi semana', 'See my week', 'Voir ma semaine', 'Ver a minha semana'],
    ready: ['Tu resumen semanal está listo', 'Your weekly recap is ready', 'Ton récap de la semaine est prêt', 'O teu resumo semanal está pronto'],
    days: ['días entrenados', 'training days', "jours d'entraînement", 'dias treinados'],
    sets: ['series', 'sets', 'séries', 'séries'],
    volume: ['volumen total', 'total volume', 'volume total', 'volume total'],
    vsPrev: ['vs. los 7 días anteriores', 'vs. the previous 7 days', 'vs. les 7 jours précédents', 'vs. os 7 dias anteriores'],
    best: ['Tu mejor marca', 'Your best lift', 'Ta meilleure perf', 'A tua melhor marca'],
    e1rm: ['1RM estimado', 'estimated 1RM', '1RM estimé', '1RM estimado'],
    prs: ['récords batidos', 'records broken', 'records battus', 'recordes batidos'],
    top: ['Tu músculo estrella', 'Your star muscle', 'Ton muscle star', 'O teu músculo estrela'],
    perfect: ['días perfectos', 'perfect days', 'journées parfaites', 'dias perfeitos'],
    water: ['litros de agua', 'litres of water', "litres d'eau", 'litros de água'],
    end: ['A por la siguiente semana', 'On to next week', 'En route pour la semaine prochaine', 'Venha a próxima semana'],
    share: ['Compartir', 'Share', 'Partager', 'Partilhar'],
    none: ['Aún no hay entrenos esta semana: ¡empieza hoy!', 'No workouts this week yet: start today!', "Pas encore de séance cette semaine : commence aujourd'hui !", 'Ainda sem treinos esta semana: começa hoje!'],
  };
  const w = (k) => W[k][LI[S.lang] || 0];
  function weekStats() {
    const now = Date.now(), D7 = 7 * 864e5, L = viewLog();
    const cur = L.filter((l) => now - l.t < D7), prev = L.filter((l) => now - l.t >= D7 && now - l.t < 2 * D7);
    const vol = (A) => A.reduce((s, l) => s + (l.w || 0) * (l.r || 0), 0);
    const best = cur.reduce((a, b) => (!a || e1of(b) > e1of(a) ? b : a), null);
    const byG = {}; cur.forEach((l) => { const g = EX[l.ex] && EX[l.ex][1]; if (g) byG[g] = (byG[g] || 0) + 1; });
    const top = Object.keys(byG).sort((a, b) => byG[b] - byG[a])[0];
    const before = L.filter((l) => now - l.t >= D7), mx = {};
    before.forEach((l) => { mx[l.ex] = Math.max(mx[l.ex] || 0, l.w || 0); });
    const prs = new Set(cur.filter((l) => mx[l.ex] > 0 && (l.w || 0) > mx[l.ex]).map((l) => l.ex)).size;
    let perfect = 0, water = 0;
    for (let i = 0; i < 7; i++) { const k = lk(now - i * 864e5); if ((vx().perfect || {})[k]) perfect++; water += +dayOf(k).w || 0; }
    const pv = vol(prev), cv = vol(cur);
    return {
      days: new Set(cur.map((l) => lk(l.t))).size, sets: cur.length, vol: cv,
      delta: pv > 0 ? Math.round(((cv - pv) / pv) * 100) : null,
      best, bestE: best ? Math.round(e1of(best)) : 0, prs, top, topN: top ? byG[top] : 0, perfect, water: water / 1000,
    };
  }
  const num = (v, d) => Number(v).toLocaleString(S.lang, { maximumFractionDigits: d || 0 });
  const big = (txt, small) => { const n = String(txt).length + (small ? String(small).length * 0.45 : 0); return `<div class="vx-st-big${n > 9 ? ' s' : n > 6 ? ' m' : ''}">${txt}${small ? ` <small>${small}</small>` : ''}</div>`; };
  function slides(s) {
    const u = S.units.w, nm = (x) => esc(window.vxTr ? window.vxTr(x) : x);
    const delta = s.delta == null ? '' : `<div class="vx-st-delta ${s.delta >= 0 ? 'up' : 'down'}">${s.delta >= 0 ? '▲' : '▼'} ${Math.abs(s.delta)} % <span>${w('vsPrev')}</span></div>`;
    if (!s.sets) return [`<div class="vx-st-k">${w('last7')}</div><h2>${w('title')}</h2><p>${w('none')}</p>`];
    return [
      `<div class="vx-st-k">${w('last7')}</div><h2>${w('title')}</h2>${big(s.days)}<div class="vx-st-l">${w('days')}</div>`,
      `${big(num(s.vol), u)}<div class="vx-st-l">${w('volume')}</div>${delta}<div class="vx-st-row"><b>${s.sets}</b> ${w('sets')}</div>`,
      `<div class="vx-st-k">${w('best')}</div><h2>${nm(EX[s.best.ex][0])}</h2>${big(s.best.w, u + ' × ' + s.best.r)}<div class="vx-st-l">${w('e1rm')}: ${s.bestE} ${u}</div><div class="vx-st-row">🏆 <b>${s.prs}</b> ${w('prs')}</div>`,
      `<div class="vx-st-k">${w('top')}</div><h2>${s.top ? nm(s.top) : '—'}</h2><div class="vx-st-l">${s.topN} ${w('sets')}</div><div class="vx-st-row">⭐ <b>${s.perfect}</b> ${w('perfect')}</div><div class="vx-st-row">💧 <b>${num(s.water, 1)}</b> ${w('water')}</div>`,
      `<h2>${w('end')} 💪</h2><button class="btn" onclick="event.stopPropagation();vxWeekShare()">📤 ${w('share')}</button>`,
    ];
  }
  let story = null;
  function storyClose() { if (story) { clearTimeout(story.timer); story.el.remove(); story = null; } }
  function storyShow(i) {
    if (!story) return;
    story.i = Math.max(0, Math.min(story.n - 1, i));
    story.el.querySelector('.vx-st-body').innerHTML = story.sl[story.i];
    story.el.querySelectorAll('.vx-st-bars i').forEach((b, k) => { b.className = k < story.i ? 'done' : k === story.i ? 'on' : ''; });
    clearTimeout(story.timer);
    if (!reduceMotion() && story.i < story.n - 1) story.timer = setTimeout(() => storyShow(story.i + 1), 5000);
  }
  window.vxWeek = function () {
    storyClose();
    const sl = slides(weekStats());
    const el = document.createElement('div');
    el.className = 'vx-story'; el.setAttribute('role', 'dialog'); el.setAttribute('aria-modal', 'true'); el.setAttribute('aria-label', w('title'));
    el.innerHTML = `<div class="vx-st-bars">${sl.map(() => '<i></i>').join('')}</div><button class="vx-st-x" aria-label="✕" onclick="event.stopPropagation();vxWeekClose()">✕</button><div class="vx-st-body"></div>`;
    el.addEventListener('click', (e) => { if (!story) return; storyShow(story.i + (e.clientX > innerWidth / 3 ? 1 : -1)); });
    el.addEventListener('keydown', (e) => { if (e.key === 'Escape') storyClose(); if (e.key === 'ArrowRight') storyShow(story.i + 1); if (e.key === 'ArrowLeft') storyShow(story.i - 1); });
    document.body.appendChild(el); el.tabIndex = -1; el.focus();
    story = { el, sl, n: sl.length, i: 0, timer: null };
    storyShow(0);
    vx().weekSeen = lk(Date.now()); save();
  };
  window.vxWeekClose = storyClose;
  window.vxWeekShare = async function () {
    const s = weekStats(), cv = document.createElement('canvas'); cv.width = 1080; cv.height = 1920;
    const g = cv.getContext('2d'), F = (wt, px) => `${wt} ${px}px "Barlow","Segoe UI",system-ui,sans-serif`;
    const bg = g.createLinearGradient(0, 0, 0, 1920); bg.addColorStop(0, '#1d3a10'); bg.addColorStop(0.5, '#0a1208'); bg.addColorStop(1, '#050805');
    g.fillStyle = bg; g.fillRect(0, 0, 1080, 1920);
    g.fillStyle = '#9dff2e'; g.font = F(900, 70); g.fillText('VOLTA', 90, 170);
    g.fillStyle = '#f2f6f0'; g.font = F(800, 96); g.fillText(w('title'), 90, 330);
    g.fillStyle = '#8a968a'; g.font = F(600, 44); g.fillText(w('last7'), 90, 400);
    const rows = [[String(s.days), w('days')], [num(s.vol) + ' ' + S.units.w, w('volume')], [String(s.sets), w('sets')], ['🏆 ' + s.prs, w('prs')], ['⭐ ' + s.perfect, w('perfect')]];
    rows.forEach(([v, l], k) => { const y = 600 + k * 230; g.fillStyle = '#9dff2e'; g.font = F(900, 120); g.fillText(v, 90, y); g.fillStyle = '#8a968a'; g.font = F(600, 44); g.fillText(l, 90, y + 66); });
    if (s.best) { g.fillStyle = '#f2f6f0'; const line = w('best') + ': ' + (window.vxTr ? window.vxTr(EX[s.best.ex][0]) : EX[s.best.ex][0]) + ' · ' + s.best.w + ' ' + S.units.w + ' × ' + s.best.r; let px = 46; do { g.font = F(700, px); px -= 2; } while (g.measureText(line).width > 900 && px > 24); g.fillText(line, 90, 1800); }
    if (false) { g.fillText(w('best') + ': ' + (window.vxTr ? window.vxTr(EX[s.best.ex][0]) : EX[s.best.ex][0]) + ' · ' + s.best.w + ' ' + S.units.w + ' × ' + s.best.r, 90, 1800); }
    const blob = await new Promise((ok) => cv.toBlob(ok, 'image/png'));
    const file = new File([blob], 'volta-semana.png', { type: 'image/png' });
    try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], title: 'Volta' }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; a.click(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  };
  window.vxWeekStats = weekStats; // para pruebas
  const weekCard = (highlight) => `<div class="card vx-weekcard${highlight ? ' hl' : ''}" onclick="vxWeek()" role="button" tabindex="0"><div class="row sp"><div><div class="mu">${w('last7')}</div><b>${highlight ? '✨ ' + w('ready') : '📊 ' + w('title')}</b></div><span class="chip on">${w('open')} ›</span></div></div>`;
  // En Inicio, los lunes y martes si aún no se ha visto y hubo entrenos
  const weekDue = () => { const d = new Date().getDay(); return (d === 1 || d === 2) && vx().weekSeen !== lk(Date.now()) && !(vx().weekSeen && Date.now() - new Date(vx().weekSeen + 'T12:00') < 2 * 864e5) && weekStats().sets > 0; };

  /* ───────────── 8. Cronómetro de la sesión y siguiente ejercicio (como Hevy) ───────────── */
  const NX = ['Siguiente', 'Up next', 'Ensuite', 'A seguir'];
  const clock = (ms) => { const s = Math.max(0, Math.floor(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = s % 60; return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(x).padStart(2, '0'); };
  function sessionStart() {
    const V2 = vx(), k = td();
    if (!V2.ws || V2.ws.d !== k) { V2.ws = { d: k, t: Date.now() }; save(); }
    return V2.ws.t;
  }
  function nextExercise() {
    const r = (S.routines || []).find((x) => x.id == S.cur);
    const L = r ? r.ex.length : (typeof DEF !== 'undefined' ? DEF.length : 0);
    if (S.wi >= L - 1) return null;
    const keep = S.wi;
    try { S.wi = keep + 1; const c = cfg(); return c && EX[c.i] ? c : null; } catch (e) { return null; } finally { S.wi = keep; }
  }
  if (typeof V.work === 'function') {
    const _work = V.work;
    V.work = function () {
      let h = _work.apply(this, arguments);
      try {
        if (S.done && S.done[td()] && !S.edit) return h; // pantalla de "completado"
        const t0 = sessionStart();
        h = h.replace('</div></div><div class="bar"', `</div><span class="vx-clock" id="vxclk" aria-label="⏱">⏱ ${clock(Date.now() - t0)}</span></div><div class="bar"`);
        const n = nextExercise();
        if (n) h += `<div class="vx-next"><span class="mu">${NX[LI[S.lang] || 0]}</span><b>${esc(window.vxTr ? window.vxTr(EX[n.i][0]) : EX[n.i][0])}</b><span class="mu">${n.sets} × ${esc(String(n.reps))}</span></div>`;
      } catch (e) { /* la pantalla original sigue intacta */ }
      return h;
    };
  }
  setInterval(() => {
    const el = document.getElementById('vxclk');
    if (el && vx().ws) el.textContent = '⏱ ' + clock(Date.now() - vx().ws.t);
  }, 1000);

  const _R = R;
  R = function () {
    const out = _R.apply(this, arguments);
    try { countUp(); } catch (e) { /* sin animación */ }
    try { fixHeader(); } catch (e) { /* cabecera original */ }
    return out;
  };

  /* ───────────── 12. Congelador de racha (como Duolingo) ───────────── */
  // La app reinicia la racha si pasan más de 48 h sin abrirla. Con un congelador, aguanta hasta 72 h.
  function guardStreak() {
    const V2 = vx(), snap = V2.streakSnap, now = Date.now(), today = lk(now);
    if (snap && snap.count > 1 && S.streakCount === 1 && S.lastLoginDate === today && snap.date !== today &&
        now - snap.ts <= 72 * 36e5 && (V2.freezes || 0) > 0) {
      V2.freezes -= 1;
      S.streakCount = snap.count + 1;
      S.bestStreak = Math.max(S.bestStreak || 0, S.streakCount);
      pushInbox('🧊', t('frzUsed'));
      setTimeout(() => toast(t('frzUsed')), 800);
    }
    V2.streakSnap = { count: S.streakCount || 0, ts: S.lastLoginTs || now, date: S.lastLoginDate || today };
    save();
  }
  try { guardStreak(); } catch (e) { /* sin racha */ }
  document.addEventListener('visibilitychange', () => { if (!document.hidden) { try { guardStreak(); R(); } catch (e) { /* idem */ } } });
  window.vxGuardStreak = guardStreak; // para pruebas

  setTimeout(() => { try { checkAchievements(); } catch (e) { /* sin logros */ } }, 1500);
  try { R(); } catch (e) { /* la app ya está pintada */ }
})();
