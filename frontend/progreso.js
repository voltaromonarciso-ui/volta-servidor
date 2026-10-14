/* VOLTA · Sistema de progreso único: Voltios ⚡ (ver docs/SISTEMA_PROGRESO.md).
   Todos los Voltios se calculan a partir de los datos (series, comidas, agua, misiones, logros y Trabajos), así que
   los números siempre cuadran entre pantallas. De ellos salen el Rango (Mortal I → Kratos V), la Liga semanal y el
   multiplicador por racha semanal. */
(function () {
  'use strict';
  if (typeof EX === 'undefined' || typeof S === 'undefined') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3, de: 1, it: 1, ru: 1, ar: 1, tr: 1, ja: 1, ko: 1, zh: 1, hi: 1 };
  const tr = (a) => (Array.isArray(a) ? a[LI[S.lang] || 0] || a[1] || a[0] : a);
  const nf = (n) => Math.round(n || 0).toLocaleString(S.lang);
  const T = {
    volt: ['Voltios', 'Volts', 'Volts', 'Volts'],
    train: ['Entreno', 'Workout', 'Entraînement', 'Treino'],
    sets: ['series efectivas', 'effective sets', 'séries efficaces', 'séries efetivas'],
    pr: ['récords', 'records', 'records', 'recordes'],
    streak: ['racha semanal', 'weekly streak', 'série hebdo', 'sequência semanal'],
    goal: ['Objetivo semanal cumplido', 'Weekly goal met', 'Objectif de la semaine atteint', 'Objetivo semanal cumprido'],
    mission: ['Misión', 'Mission', 'Mission', 'Missão'],
    missionCore: ['Misiones principales', 'Main missions', 'Missions principales', 'Missões principais'],
    perfect: ['Día perfecto', 'Perfect day', 'Journée parfaite', 'Dia perfeito'],
    daily: ['Misiones del día', 'Daily missions', 'Missions du jour', 'Missões do dia'],
    ach: ['Logro', 'Achievement', 'Succès', 'Conquista'],
    labor: ['Trabajo de Hércules', 'Labor of Hercules', 'Travail d’Hercule', 'Trabalho de Hércules'],
    today: ['hoy', 'today', 'aujourd’hui', 'hoje'],
    week: ['esta semana', 'this week', 'cette semaine', 'esta semana'],
    total: ['en total', 'in total', 'au total', 'no total'],
    olympus: ['Tu Olimpo', 'Your Olympus', 'Ton Olympe', 'O teu Olimpo'],
    toNext: ['para', 'to', 'pour', 'para'],
    max: ['Rango máximo', 'Top rank', 'Rang maximum', 'Nível máximo'],
    weekGoal: ['Objetivo de la semana', 'This week’s goal', 'Objectif de la semaine', 'Objetivo da semana'],
    days: ['días', 'days', 'jours', 'dias'],
    mult: ['multiplicador', 'multiplier', 'multiplicateur', 'multiplicador'],
    how: ['¿Cómo gano Voltios?', 'How do I earn Volts?', 'Comment gagner des Volts ?', 'Como ganho Volts?'],
    howT: ['Cómo se ganan los Voltios', 'How Volts are earned', 'Comment gagner des Volts', 'Como se ganham Volts'],
    hist: ['Últimos Voltios', 'Latest Volts', 'Derniers Volts', 'Últimos Volts'],
    histEmpty: ['Aún no has ganado Voltios. Termina tu primer entreno.', 'No Volts yet. Finish your first workout.', 'Pas encore de Volts. Termine ton premier entraînement.', 'Ainda não ganhaste Volts. Termina o teu primeiro treino.'],
    pieces: ['Todo sale de los Voltios', 'Everything comes from Volts', 'Tout vient des Volts', 'Tudo vem dos Volts'],
    pRank: ['Rango: tus Voltios totales. Nunca se pierde.', 'Rank: your total Volts. Never lost.', 'Rang : tes Volts au total. Jamais perdu.', 'Nível: os teus Volts totais. Nunca se perde.'],
    pLeague: ['Liga: los Voltios de entreno y misiones de esta semana frente a tu grupo. Los 7 primeros suben y los 5 últimos bajan. Logros y Trabajos suman al Rango, no a la liga.', 'League: this week’s workout and mission Volts against your group. Top 7 move up, bottom 5 move down. Achievements and Labors count for Rank, not the league.', 'Ligue : les Volts d’entraînement et de missions de la semaine face à ton groupe. Les 7 premiers montent, les 5 derniers descendent. Succès et Travaux comptent pour le Rang, pas la ligue.', 'Liga: os Volts de treino e missões desta semana contra o teu grupo. Os 7 primeiros sobem e os 5 últimos descem. Conquistas e Trabalhos contam para o Nível, não para a liga.'],
    pStreak: ['Racha semanal: cada semana que cumples tus días multiplica los Voltios de entreno (hasta ×1,5).', 'Weekly streak: each week you hit your days multiplies workout Volts (up to ×1.5).', 'Série hebdo : chaque semaine où tu tiens tes jours multiplie les Volts d’entraînement (jusqu’à ×1,5).', 'Sequência semanal: cada semana em que cumpres os teus dias multiplica os Volts de treino (até ×1,5).'],
    fair: ['Juego limpio: las series imposibles no cuentan y la base de entreno es una vez al día.', 'Fair play: impossible sets don’t count and the workout base is once a day.', 'Fair-play : les séries impossibles ne comptent pas et la base d’entraînement est une fois par jour.', 'Jogo limpo: séries impossíveis não contam e a base de treino é uma vez por dia.'],
    rows: [
      ['Entreno (3 series efectivas o más)', 'Workout (3+ effective sets)', 'Entraînement (3 séries efficaces ou plus)', 'Treino (3+ séries efetivas)', '+60'],
      ['Cada serie efectiva (máx. 30 al día)', 'Each effective set (max 30 a day)', 'Chaque série efficace (max 30 par jour)', 'Cada série efetiva (máx. 30 por dia)', '+3'],
      ['Récord personal (máx. 3 al día)', 'Personal record (max 3 a day)', 'Record personnel (max 3 par jour)', 'Recorde pessoal (máx. 3 por dia)', '+20'],
      ['Racha semanal (sobre lo anterior)', 'Weekly streak (on the above)', 'Série hebdo (sur ce qui précède)', 'Sequência semanal (sobre o anterior)', '×1,1 → ×1,5'],
      ['Cumplir tu objetivo de la semana', 'Hitting your weekly goal', 'Atteindre ton objectif de la semaine', 'Cumprir o objetivo da semana', '+150'],
      ['Misión principal (entrenar, comer, beber)', 'Main mission (train, eat, drink)', 'Mission principale (s’entraîner, manger, boire)', 'Missão principal (treinar, comer, beber)', '+15'],
      ['Día perfecto (las 3 principales)', 'Perfect day (all 3 main)', 'Journée parfaite (les 3 principales)', 'Dia perfeito (as 3 principais)', '+30'],
      ['Misión del día', 'Daily mission', 'Mission du jour', 'Missão do dia', '+20'],
      ['Logro (según su nivel)', 'Achievement (by tier)', 'Succès (selon le niveau)', 'Conquista (segundo o nível)', '+25 → +250'],
      ['Trabajo de Hércules', 'Labor of Hercules', 'Travail d’Hercule', 'Trabalho de Hércules', '+500'],
    ],
    levelUp: ['¡Has subido de rango!', 'You ranked up!', 'Tu as monté de rang !', 'Subiste de nível!'],
    gained: ['Has ganado', 'You earned', 'Tu as gagné', 'Ganhaste'],
    practice: ['Liga de práctica', 'Practice league', 'Ligue d’entraînement', 'Liga de treino'],
    practiceNote: ['Hasta que actives tu cuenta, compites con rivales de práctica con el mismo sistema de puntos.', 'Until you activate your account, you compete against practice rivals with the same scoring.', 'Jusqu’à l’activation de ton compte, tu affrontes des rivaux d’entraînement avec le même barème.', 'Até ativares a tua conta, competes com rivais de treino com o mesmo sistema de pontos.'],
    pos: ['Puesto', 'Place', 'Place', 'Lugar'],
    upZone: ['Zona de ascenso', 'Promotion zone', 'Zone de montée', 'Zona de subida'],
    downZone: ['Zona de descenso', 'Relegation zone', 'Zone de descente', 'Zona de descida'],
    resUp: ['¡Subes a la liga', 'You move up to', 'Tu montes en ligue', 'Sobes para a liga'],
    resStay: ['Te mantienes en la liga', 'You stay in', 'Tu restes en ligue', 'Ficas na liga'],
    resDown: ['Bajas a la liga', 'You drop to', 'Tu descends en ligue', 'Desces para a liga'],
    lastWeek: ['La semana pasada quedaste', 'Last week you finished', 'La semaine dernière tu as fini', 'Na semana passada ficaste'],
    you: ['tú', 'you', 'toi', 'tu'],
  };

  // ── Datos ──
  const realLog = () => { try { return (Array.isArray(S.log) ? S.log : []).filter((l) => l && EX[l.ex] && isEff(l)); } catch (e) { return []; } };
  const bw = () => +((S.userProfile && S.userProfile.weight) || S.wt || 75) || 75;
  const plausible = (l) => (+l.r || 0) > 0 && (+l.r || 0) <= 100 && (+l.w || 0) <= Math.max(400, bw() * 5);
  const e1 = (l) => { try { return e1of(l); } catch (e) { return (+l.w || 0) * (1 + (+l.r || 0) / 30); } };
  const monKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const dayT = (k) => { const p = String(k).split('-').map(Number); return p.length === 3 ? new Date(p[0], p[1] - 1, p[2], 12).getTime() : Date.parse(k) || 0; };
  const goalDays = () => Math.max(1, Math.min(7, +((S.userProfile && S.userProfile.days) || S.days || 3) || 3));
  const multOf = (n) => (n >= 12 ? 1.5 : n >= 8 ? 1.4 : n >= 4 ? 1.3 : n >= 2 ? 1.2 : n >= 1 ? 1.1 : 1);
  const vx = () => (S.vx && typeof S.vx === 'object' ? S.vx : (S.vx = {}));
  const laborsDone = () => { try { const o = JSON.parse(localStorage.getItem('vx:labors') || '{}'); return Object.keys(o).filter((k) => k !== 'seen' && +o[k] > 0).map((k) => [k, +o[k]]); } catch (e) { return []; } };

  let memo = null, memoKey = '';
  function ledger() {
    const L = realLog().filter(plausible).sort((a, b) => a.t - b.t);
    const V2 = vx(), nlog = S.nlog && typeof S.nlog === 'object' ? S.nlog : {};
    const labs = laborsDone();
    const key = [L.length, L.length ? L[L.length - 1].t : 0, Object.keys(nlog).length, JSON.stringify(nlog[lk(Date.now())] || 0), Object.keys(V2.ach || {}).length, Object.keys(V2.perfect || {}).length, JSON.stringify(V2.mdone || {}), labs.length, goalDays(), lk(Date.now())].join('|');
    if (memo && key === memoKey) return memo;
    const E = []; // { t, k(day), v, ic, label }
    // 1) Entrenos: por día
    const byDay = {}; L.forEach((l) => { (byDay[lk(l.t)] = byDay[lk(l.t)] || []).push(l); });
    const best = {}; // mejor 1RM estimado por ejercicio antes del día
    const days = Object.keys(byDay).sort((a, b) => dayT(a) - dayT(b));
    const trainedDays = new Set(days.filter((d) => byDay[d].length >= 3));
    // semanas: días entrenados y objetivo
    const G = goalDays(), weekDays = {};
    trainedDays.forEach((d) => { const w = monKey(dayT(d)); weekDays[w] = (weekDays[w] || 0) + 1; });
    const curW = monKey(Date.now());
    const streakBefore = (w) => { let n = 0, x = w - 7 * 864e5; while ((weekDays[x] || 0) >= G) { n++; x -= 7 * 864e5; } return n; };
    const goalHit = {}; // semana -> día en que se cumplió
    days.forEach((d) => {
      const S2 = byDay[d], t = dayT(d), w = monKey(t);
      let pr = 0; const todayBest = {};
      S2.forEach((l) => { const v = e1(l); todayBest[l.ex] = Math.max(todayBest[l.ex] || 0, v); });
      Object.keys(todayBest).forEach((ex) => { if ((best[ex] || 0) > 0 && todayBest[ex] > best[ex] * 1.001) pr++; });
      Object.keys(todayBest).forEach((ex) => { best[ex] = Math.max(best[ex] || 0, todayBest[ex]); });
      if (S2.length < 3) return;
      const m = multOf(streakBefore(w));
      const base = 60 + 3 * Math.min(30, S2.length) + 20 * Math.min(3, pr);
      E.push({ t, k: d, v: Math.round(base * m), ic: '🏋️', label: tr(T.train) + ` · ${Math.min(30, S2.length)} ${tr(T.sets)}` + (pr ? ` · ${Math.min(3, pr)} ${tr(T.pr)}` : '') + (m > 1 ? ` · ×${String(m).replace('.', ',')} ${tr(T.streak)}` : ''), kind: 'train' });
      // objetivo semanal
      if (!goalHit[w]) { const n = days.filter((x) => trainedDays.has(x) && monKey(dayT(x)) === w && dayT(x) <= t).length; if (n >= G) { goalHit[w] = d; E.push({ t: t + 1, k: d, v: 150, ic: '🎯', label: tr(T.goal), kind: 'goal' }); } }
    });
    // 2) Misiones principales (datos de cada día) y día perfecto
    const allDays = new Set(days.concat(Object.keys(nlog)));
    allDays.forEach((d) => {
      const n = nlog[d] || {}, meals = Array.isArray(n.e) ? n.e.length : 0, water = +n.w || 0, tr2 = trainedDays.has(d) || (byDay[d] && byDay[d].length > 0) || !!(S.done && S.done[d]);
      const c = (tr2 ? 1 : 0) + (meals >= 2 ? 1 : 0) + (water >= 2000 ? 1 : 0);
      if (c) E.push({ t: dayT(d) + 2, k: d, v: 15 * c, ic: '✅', label: `${tr(T.missionCore)} · ${c}/3`, kind: 'mission' });
      if (c === 3 || (V2.perfect && V2.perfect[d])) E.push({ t: dayT(d) + 3, k: d, v: 30, ic: '🔥', label: tr(T.perfect), kind: 'perfect' });
    });
    Object.keys(V2.mdone || {}).forEach((d) => { const n = Math.min(2, +V2.mdone[d] || 0); if (n) E.push({ t: dayT(d) + 4, k: d, v: 20 * n, ic: '🎲', label: `${tr(T.daily)} · ${n}/2`, kind: 'daily' }); });
    // 3) Logros y Trabajos
    let achN = {}, labN = {};
    try { (window.vxAch ? window.vxAch() : []).forEach((x) => { achN[x.id] = x.icon + ' ' + x.name; }); } catch (e) { /* sin nombres */ }
    try { (window.vxLabors ? window.vxLabors() : []).forEach((x) => { labN[x.lb.id] = x.lb.ic + ' ' + tr(x.lb.n); }); } catch (e) { /* sin nombres */ }
    Object.keys(V2.ach || {}).forEach((id) => { const lv = +String(id).split('_').pop() || 1, ts = +V2.ach[id] || Date.now(); E.push({ t: ts, k: lk(ts), v: Math.min(250, 25 * lv), ic: '🏅', label: tr(T.ach) + ' · ' + (achN[id] || id), kind: 'ach' }); });
    labs.forEach(([id, ts]) => E.push({ t: ts, k: lk(ts), v: 500, ic: '🏛️', label: tr(T.labor) + ' · ' + (labN[id] || id), kind: 'labor' }));
    E.sort((a, b) => a.t - b.t);
    const tdk = lk(Date.now());
    const total = E.reduce((a, x) => a + x.v, 0);
    const ACT = { train: 1, goal: 1, mission: 1, perfect: 1, daily: 1 };
    const week = E.filter((x) => x.t >= curW && ACT[x.kind]).reduce((a, x) => a + x.v, 0);
    const today = E.filter((x) => x.k === tdk).reduce((a, x) => a + x.v, 0);
    const byWeek = {}; E.filter((x) => ACT[x.kind]).forEach((x) => { const w = monKey(x.t); byWeek[w] = (byWeek[w] || 0) + x.v; });
    const wDone = weekDays[curW] || 0, wStreak = streakBefore(curW) + (wDone >= G ? 1 : 0);
    memo = { total, week, today, entries: E, byWeek, goal: G, weekDone: wDone, wStreak, mult: multOf(streakBefore(curW)), rank: rankOf(total) };
    memoKey = key;
    return memo;
  }

  // ── Rango: 7 rangos × 5 niveles (mismos nombres y emblemas de siempre) ──
  const XT2 = [0, 1000, 4000, 10000, 22000, 45000, 85000, 150000];
  const RN2 = () => (typeof RN !== 'undefined' ? RN : ['MORTAL', 'ESPARTANO', 'HÉRCULES', 'APOLO', 'TITÁN', 'ZEUS', 'KRATOS']);
  const RO2 = ['I', 'II', 'III', 'IV', 'V'];
  function rankOf(xp) {
    let i = 0; XT2.forEach((x, k) => { if (k < 7 && xp >= x) i = k; });
    const lo = XT2[i], hi = XT2[i + 1], st = (hi - lo) / 5, s = Math.min(4, Math.floor((xp - lo) / st)), a = lo + s * st, b = a + st;
    const top = i === 6 && s === 4 && xp >= hi;
    const N = RN2();
    return { i, s, step: i * 5 + s, nm: N[i] + ' ' + RO2[s], p: top ? 100 : Math.max(0, Math.min(100, ((xp - a) / st) * 100)), a: Math.round(a), b: Math.round(b), nn: top ? null : s < 4 ? N[i] + ' ' + RO2[s + 1] : N[i + 1] + ' I' };
  }
  const nice = (s) => String(s).split(' ').map((w, i) => (i ? w.toUpperCase() : w[0] + w.slice(1).toLowerCase())).join(' ');

  // ── Liga semanal (de práctica hasta que haya servidor) ──
  const LG = ['Hermes', 'Artemisa', 'Ares', 'Atenea', 'Poseidón', 'Zeus'];
  const MEAN = [420, 650, 900, 1200, 1550, 1950];
  const NAMES = ['Lucía', 'Mateo', 'Sofía', 'Hugo', 'Valeria', 'Leo', 'Martina', 'Daniel', 'Emma', 'Pablo', 'Noah', 'Olivia', 'Liam', 'Camila', 'Thiago', 'Inès', 'Lucas', 'Chloé', 'João', 'Beatriz', 'Ana', 'Diego', 'Elena', 'Marco', 'Nora', 'Iker', 'Julia', 'Adam', 'Mía', 'Gabriel', 'Zoe', 'Bruno', 'Alba', 'Enzo', 'Lola', 'Samuel', 'Vera', 'Tomás', 'Aitana', 'Rafael'];
  const rnd = (seed) => () => { seed = (seed * 1103515245 + 12345) >>> 0; return seed / 4294967296; };
  function rivals(w, idx) {
    const r = rnd((w / 864e5) * 131 + idx * 977 + 17);
    const out = [];
    for (let k = 0; k < 29; k++) {
      const g = (r() + r() + r()) / 3; // ~normal
      const final = Math.max(40, Math.round(MEAN[idx] * (0.35 + g * 1.35)));
      const name = NAMES[Math.floor(r() * NAMES.length)] + ' ' + String.fromCharCode(65 + Math.floor(r() * 26)) + '.';
      out.push({ name, final, pace: 0.75 + r() * 0.5 });
    }
    return out;
  }
  function weekFrac(w) { return Math.max(0, Math.min(1, (Date.now() - w) / (7 * 864e5))); }
  function lgState() { const V2 = vx(); if (!V2.lg || typeof V2.lg !== 'object') V2.lg = { i: 0, wk: monKey(Date.now()) }; return V2.lg; }
  function settle() {
    const st = lgState(), cur = monKey(Date.now());
    if (st.wk >= cur) return;
    const led = ledger();
    let w = st.wk, i = st.i, res = null;
    while (w < cur) { // por si han pasado varias semanas
      const mine = led.byWeek[w] || 0, R0 = rivals(w, i).map((x) => x.final);
      const pos = 1 + R0.filter((v) => v > mine).length;
      const to = pos <= 7 && i < 5 ? i + 1 : pos >= 26 && i > 0 ? i - 1 : i;
      res = { from: i, to, pos, wk: w, mine };
      i = to; w += 7 * 864e5;
    }
    st.i = i; st.wk = cur; st.res = res; st.resSeen = 0;
    try { sv(); } catch (e) { /* sin guardar */ }
  }
  function group() {
    settle();
    const st = lgState(), w = monKey(Date.now()), f = weekFrac(w), mine = ledger().week;
    const list = rivals(w, st.i).map((x) => ({ name: x.name, v: Math.round(x.final * Math.min(1, Math.pow(f, x.pace))) }));
    list.push({ name: (S.userProfile && S.userProfile.name) || tr(T.you), v: mine, me: true });
    list.sort((a, b) => b.v - a.v || (a.me ? -1 : 1));
    const pos = list.findIndex((x) => x.me) + 1;
    return { i: st.i, name: LG[st.i], list, pos, mine, res: st.res, resSeen: st.resSeen };
  }

  // ── Interfaz ──
  const emblem = (i, s) => (typeof EM !== 'undefined' && EM[i] ? `<img src="${EM[i]}" width="${s}" height="${s}" alt="" style="flex:none;object-fit:contain">` : '⚡');
  function olympusCard() {
    const L2 = ledger(), r = L2.rank, col = (typeof RC !== 'undefined' && RC[r.i]) || '#9dff2e';
    const dots = Array.from({ length: L2.goal }, (_, k) => `<i class="${k < L2.weekDone ? 'on' : ''}"></i>`).join('');
    return `<div class="card vx-oly" style="--rc:${col}" onclick="go('vx:volt')" role="button" tabindex="0" aria-label="${tr(T.olympus)}">` +
      `<div class="row" style="gap:12px;align-items:center">${emblem(r.i, 52)}<div class="g"><div class="mu">${tr(T.olympus)}</div><div class="vx-oly-rk">${nice(r.nm)}</div>` +
      `<div class="mu"><b class="ac">⚡ ${nf(L2.total)}</b> ${tr(T.volt)} · +${nf(L2.today)} ${tr(T.today)}</div></div><span class="mu">›</span></div>` +
      `<div class="bar" style="margin-top:10px"><i style="width:${r.p.toFixed(1)}%"></i></div>` +
      `<div class="row sp mu" style="font-size:12px;margin-top:4px"><span>${r.nn ? `${nf(r.b - L2.total)} ⚡ ${tr(T.toNext)} ${nice(r.nn)}` : tr(T.max)}</span><span>+${nf(L2.week)} ${tr(T.week)}</span></div>` +
      `<div class="row sp vx-oly-goal"><span>${tr(T.weekGoal)}: <b>${Math.min(L2.weekDone, L2.goal)}/${L2.goal}</b> ${tr(T.days)}</span><span class="vx-oly-dots">${dots}</span></div>` +
      (L2.mult > 1 ? `<div class="mu" style="font-size:12px;margin-top:4px">🔥 ${tr(T.streak)}: ×${String(L2.mult).replace('.', ',')}</div>` : '') + '</div>';
  }
  V['vx:volt'] = function () {
    const L2 = ledger(), r = L2.rank;
    let h = `<div class="row" style="margin-bottom:6px"><button class="back" onclick="back()" aria-label="‹">‹</button><h1 style="font-size:22px">⚡ ${tr(T.volt)}</h1></div>`;
    h += olympusCard().replace(`onclick="go('vx:volt')" role="button" tabindex="0"`, '');
    h += `<h2>${tr(T.pieces)}</h2><div class="card vx-oly-pieces"><p>🏛️ ${tr(T.pRank)}</p><p>🏆 ${tr(T.pLeague)}</p><p>🔥 ${tr(T.pStreak)}</p><p class="mu">🛡️ ${tr(T.fair)}</p></div>`;
    h += `<h2>${tr(T.howT)}</h2><div class="card vx-oly-how">` + T.rows.map((x) => `<div class="row sp"><span>${x[LI[S.lang] || 0]}</span><b class="ac">${x[4]}</b></div>`).join('') + '</div>';
    const last = L2.entries.slice(-25).reverse();
    h += `<h2>${tr(T.hist)}</h2><div class="card vx-oly-hist">` + (last.length ? last.map((x) => `<div class="row sp"><span>${x.ic} ${esc(x.label)}<br><span class="mu" style="font-size:12px">${new Date(x.t).toLocaleDateString(S.lang, { day: 'numeric', month: 'short' })}</span></span><b class="ac">+${nf(x.v)}</b></div>`).join('') : `<div class="mu">${tr(T.histEmpty)}</div>`) + '</div>';
    return h;
  };
  function practiceRows() {
    const g = group();
    return `<div class="card vx-ar-list"><div class="row sp"><b>🏛️ ${tr(T.practice)} · ${LG[g.i]}</b><span class="mu">${tr(T.pos)} ${g.pos}/30</span></div><div class="mu" style="font-size:12px;margin:4px 0 8px">${tr(T.practiceNote)}</div>` +
      g.list.map((e, k) => (k === 7 ? `<div class="vx-zone up">▲ ${tr(T.upZone)}</div>` : '') + (k === 25 ? `<div class="vx-zone down">▼ ${tr(T.downZone)}</div>` : '') +
        `<div class="row vx-ar-row${e.me ? ' me' : ''}"><span class="vx-ar-pos">${['🥇', '🥈', '🥉'][k] || k + 1}</span><div class="g"><b>${esc(e.name)}</b></div><b class="vx-ar-pts">${nf(e.v)} ⚡</b></div>`).join('') + '</div>';
  }

  // ── Avisos: Voltios ganados, subida de rango y resultado de la liga ──
  function check() {
    const L2 = ledger(), V2 = vx(), r = L2.rank;
    // misiones del día cumplidas hoy (para sumarlas aunque cambie el día)
    try { if (window.vxMissions) { const n = window.vxMissions().filter((m) => m.daily && m.done).length, k = lk(Date.now()); V2.mdone = V2.mdone || {}; if (n > (V2.mdone[k] || 0)) { V2.mdone[k] = n; sv(); } } } catch (e) { /* sin misiones */ }
    if (V2.voltSeen == null) { V2.voltSeen = L2.total; V2.rankSeen = r.step; sv(); return; }
    if (L2.total > V2.voltSeen) {
      const gain = L2.total - V2.voltSeen; V2.voltSeen = L2.total;
      if (gain >= 10) { const msg = `⚡ ${tr(T.gained)} +${nf(gain)} ${tr(T.volt)}`; setTimeout(() => { try { toast(msg); } catch (e) { /* sin aviso */ } }, 700); if (window.vxPushInbox) window.vxPushInbox('⚡', msg, "go('vx:volt')"); }
    } else V2.voltSeen = L2.total;
    if (r.step > (V2.rankSeen || 0)) {
      V2.rankSeen = r.step;
      const msg = `${tr(T.levelUp)} ${nice(r.nm)}`;
      setTimeout(() => { if (window.vxCelebrate) window.vxCelebrate(); try { toast('🏛️ ' + msg); } catch (e) { /* sin aviso */ } }, 1500);
      if (window.vxPushInbox) window.vxPushInbox('🏛️', msg, "tab('prog')");
    }
    const st = lgState();
    if (st.res && !st.resSeen) {
      st.resSeen = 1; const x = st.res;
      const msg = x.to > x.from ? `${tr(T.resUp)} ${LG[x.to]}! 🏆` : x.to < x.from ? `${tr(T.resDown)} ${LG[x.to]}` : `${tr(T.resStay)} ${LG[x.to]}`;
      const full = `${tr(T.lastWeek)} #${x.pos}. ${msg}`;
      setTimeout(() => { if (x.to > x.from && window.vxCelebrate) window.vxCelebrate(); try { toast(full); } catch (e) { /* sin aviso */ } }, 2600);
      if (window.vxPushInbox) window.vxPushInbox(x.to > x.from ? '🏆' : x.to < x.from ? '📉' : '🏛️', full, "go('vx:arena')");
    }
    sv();
  }
  const _R = R;
  R = function () { _R.apply(this, arguments); try { clearTimeout(check.t); check.t = setTimeout(check, 400); } catch (e) { /* sin avisos */ } };

  window.vxVolt = ledger;
  window.vxVoltRank = rankOf;
  window.vxOlympusCard = olympusCard;
  window.vxPractice = { group, rows: practiceRows, names: LG };

  // Rangos de fuerza con nombres de metales (en mayúsculas y en tipo título), con sus niveles I–V
  if (window.vxAddTr) {
    const MT = [['HIERRO', 'IRON', 'FER', 'FERRO'], ['BRONCE', 'BRONZE', 'BRONZE', 'BRONZE'], ['PLATA', 'SILVER', 'ARGENT', 'PRATA'], ['ORO', 'GOLD', 'OR', 'OURO'], ['PLATINO', 'PLATINUM', 'PLATINE', 'PLATINA'], ['DIAMANTE', 'DIAMOND', 'DIAMANT', 'DIAMANTE'], ['OLÍMPICO', 'OLYMPIAN', 'OLYMPIEN', 'OLÍMPICO']];
    const cap = (w) => w[0] + w.slice(1).toLowerCase();
    const lines = [];
    MT.forEach((m) => { lines.push(m.join('|'), m.map(cap).join('|')); ['I', 'II', 'III', 'IV', 'V'].forEach((r) => { lines.push(m.map((x) => x + ' ' + r).join('|'), m.map((x) => cap(x) + ' ' + r).join('|')); }); });
    lines.push('Rango de fuerza · toca para ver qué necesitas para subir|Strength rank · tap to see what you need to rank up|Rang de force · touche pour voir ce qu’il faut pour monter|Nível de força · toca para ver o que precisas para subir');
    lines.push('Puntos de fuerza|Strength points|Points de force|Pontos de força', 'pts de fuerza|strength pts|pts de force|pts de força', 'Fuerza|Strength|Force|Força');
    window.vxAddTr(lines.join('\n'));
  }
  if (window.vxAddTr) window.vxAddTr(`
Voltios · toca para ver rangos|Volts · tap to see ranks|Volts · touche pour voir les rangs|Volts · toca para ver os níveis
Subes de nivel (I–V) con los Voltios que ganas entrenando, con misiones, logros y Trabajos.|You level up (I–V) with the Volts you earn training, with missions, achievements and Labors.|Tu montes de niveau (I–V) avec les Volts gagnés à l’entraînement, les missions, les succès et les Travaux.|Sobes de nível (I–V) com os Volts que ganhas a treinar, com missões, conquistas e Trabalhos.
`);
})();
