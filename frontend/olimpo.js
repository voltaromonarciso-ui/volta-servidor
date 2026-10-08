/* VOLTA · El Olimpo: lo que solo tiene Volta.
   - Los 12 Trabajos de Heracles: desafíos épicos medidos con tu registro real de entrenamientos.
   - El Oráculo de Delfos: cada día te dice qué entrenar según la recuperación de cada grupo muscular. */
(function () {
  if (typeof V !== 'object' || typeof R !== 'function' || typeof EX === 'undefined') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const tr = (a) => (Array.isArray(a) ? a[LI[S.lang] || 0] || a[1] || a[0] : a);
  const fmt = (n) => Math.round(n || 0).toLocaleString(S.lang);
  const log = () => (window.vxRealLog ? window.vxRealLog() : (Array.isArray(S.log) ? S.log : [])).filter((l) => l && EX[l.ex]);
  const dayKey = (t) => { const d = new Date(t); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); };
  const monKey = (t) => { const d = new Date(t); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  const vol = (l) => (+l.w || 0) * (+l.r || 0);
  const grp = (l) => EX[l.ex][1];
  const LEGS = ['Cuádriceps', 'Isquiosurales', 'Glúteos', 'Gemelos', 'Aductores', 'Abductores'];
  const bw = () => +((S.userProfile && S.userProfile.weight) || S.wt || 75) || 75;
  const e1 = (l) => (+l.w || 0) * (1 + (+l.r || 0) / 30);

  const T = {
    labors: ['Los 12 Trabajos de Heracles', 'The 12 Labours of Heracles', 'Les 12 Travaux d’Héraclès', 'Os 12 Trabalhos de Héracles'],
    laborsSub: ['Desafíos épicos medidos con tus entrenos reales. Complétalos todos y serás Heracles.', 'Epic challenges measured with your real workouts. Finish them all to become Heracles.', 'Des défis épiques mesurés sur tes vraies séances. Termine-les tous pour devenir Héraclès.', 'Desafios épicos medidos com os teus treinos reais. Completa-os todos e serás Héracles.'],
    done: ['completados', 'completed', 'terminés', 'concluídos'],
    next: ['Siguiente', 'Next', 'Suivant', 'Seguinte'],
    many: ['Trabajos completados', 'Labours completed', 'Travaux accomplis', 'Trabalhos concluídos'],
    won: ['¡Trabajo completado!', 'Labour completed!', 'Travail accompli !', 'Trabalho concluído!'],
    title: ['Título', 'Title', 'Titre', 'Título'],
    titles: [['Mortal', 'Mortal', 'Mortel', 'Mortal'], ['Aspirante a héroe', 'Hero in training', 'Apprenti héros', 'Aspirante a herói'], ['Semidiós', 'Demigod', 'Demi-dieu', 'Semideus'], ['Héroe del Olimpo', 'Hero of Olympus', 'Héros de l’Olympe', 'Herói do Olimpo'], ['Heracles', 'Heracles', 'Héraclès', 'Héracles']],
    oracle: ['El Oráculo de Delfos', 'The Oracle of Delphi', 'L’Oracle de Delphes', 'O Oráculo de Delfos'],
    today: ['Hoy los dioses te piden', 'Today the gods ask for', 'Aujourd’hui, les dieux demandent', 'Hoje os deuses pedem'],
    train: ['Entrenar esto', 'Train this', 'Entraîner ça', 'Treinar isto'],
    rest: ['Descansa, guerrero. Ya entrenaste hoy: los dioses premian la recuperación. Prioriza proteína y 7–9 h de sueño.', 'Rest, warrior. You trained today: the gods reward recovery. Prioritise protein and 7–9 h of sleep.', 'Repose-toi, guerrier. Tu t’es entraîné aujourd’hui : les dieux récompensent la récupération. Protéines et 7–9 h de sommeil.', 'Descansa, guerreiro. Já treinaste hoje: os deuses premeiam a recuperação. Prioriza proteína e 7–9 h de sono.'],
    fresh: ['recuperado', 'recovered', 'récupéré', 'recuperado'],
    never: ['aún sin entrenar', 'not trained yet', 'pas encore entraîné', 'ainda por treinar'],
    ago: ['hace {h} h', '{h} h ago', 'il y a {h} h', 'há {h} h'],
    days: ['hace {d} días', '{d} days ago', 'il y a {d} jours', 'há {d} dias'],
    see: ['Ver los 12 Trabajos', 'See the 12 Labours', 'Voir les 12 Travaux', 'Ver os 12 Trabalhos'],
  };
  const PROPH = [
    ['Quien vence a su pereza vence a cualquier titán.', 'Whoever defeats laziness defeats any titan.', 'Qui vainc sa paresse vainc n’importe quel titan.', 'Quem vence a preguiça vence qualquer titã.'],
    ['El bronce de hoy es el oro de mañana.', 'Today’s bronze is tomorrow’s gold.', 'Le bronze d’aujourd’hui est l’or de demain.', 'O bronze de hoje é o ouro de amanhã.'],
    ['Ni Aquiles nació fuerte: entrenó.', 'Not even Achilles was born strong: he trained.', 'Même Achille n’est pas né fort : il s’est entraîné.', 'Nem Aquiles nasceu forte: treinou.'],
    ['La técnica es tu escudo; el peso, tu lanza.', 'Technique is your shield; the weight, your spear.', 'La technique est ton bouclier ; la charge, ta lance.', 'A técnica é o teu escudo; o peso, a tua lança.'],
    ['Un paso más cerca del Olimpo cada serie.', 'Every set is one step closer to Olympus.', 'Chaque série te rapproche de l’Olympe.', 'Cada série é um passo mais perto do Olimpo.'],
    ['Los dioses ayudan a quien vuelve mañana.', 'The gods help those who come back tomorrow.', 'Les dieux aident ceux qui reviennent demain.', 'Os deuses ajudam quem volta amanhã.'],
  ];

  // ── Los 12 Trabajos ──
  function weeks(L) { const W = {}; L.forEach((l) => { const k = monKey(l.t); (W[k] = W[k] || []).push(l); }); return W; }
  function bestWeek(L, fn) { const W = weeks(L); return Math.max(0, ...Object.values(W).map(fn)); }
  function records(L) {
    const best = {}; let n = 0;
    [...L].sort((a, b) => a.t - b.t).forEach((l) => { if (l.ty === 'warmup') return; const v = e1(l); if (best[l.ex] != null && v > best[l.ex] + 0.01) n++; best[l.ex] = Math.max(best[l.ex] || 0, v); });
    return n;
  }
  function consecutiveWeeks(L) {
    const W = weeks(L), ok = Object.keys(W).map(Number).filter((k) => new Set(W[k].map((l) => dayKey(l.t))).size >= 3).sort((a, b) => a - b);
    let best = 0, run = 0, prev = null;
    ok.forEach((k) => { run = prev != null && Math.round((k - prev) / 6048e5) === 1 ? run + 1 : 1; best = Math.max(best, run); prev = k; });
    return best;
  }
  const LABORS = [
    { id: 'nemea', ic: '🦁', n: ['El León de Nemea', 'The Nemean Lion', 'Le Lion de Némée', 'O Leão de Nemeia'], d: ['10.000 kg de volumen de pierna en una semana', '10,000 kg of leg volume in one week', '10 000 kg de volume jambes en une semaine', '10.000 kg de volume de pernas numa semana'], goal: 10000, unit: 'kg', cur: (L) => bestWeek(L.filter((l) => LEGS.includes(grp(l))), (w) => w.reduce((a, l) => a + vol(l), 0)) },
    { id: 'hidra', ic: '🐍', n: ['La Hidra de Lerna', 'The Lernaean Hydra', 'L’Hydre de Lerne', 'A Hidra de Lerna'], d: ['9 días de entreno en los últimos 30 días (una cabeza por día)', '9 training days in the last 30 days (one head a day)', '9 jours d’entraînement sur les 30 derniers jours', '9 dias de treino nos últimos 30 dias'], goal: 9, cur: (L) => new Set(L.filter((l) => Date.now() - l.t < 30 * 864e5).map((l) => dayKey(l.t))).size },
    { id: 'cierva', ic: '🦌', n: ['La Cierva de Cerinea', 'The Ceryneian Hind', 'La Biche de Cérynie', 'A Corça de Cerineia'], d: ['3 semanas seguidas entrenando al menos 3 días', '3 weeks in a row training at least 3 days', '3 semaines d’affilée avec au moins 3 jours', '3 semanas seguidas a treinar pelo menos 3 dias'], goal: 3, unit: 'sem', cur: consecutiveWeeks },
    { id: 'jabali', ic: '🐗', n: ['El Jabalí de Erimanto', 'The Erymanthian Boar', 'Le Sanglier d’Érymanthe', 'O Javali de Erimanto'], d: ['Sentadilla con tu peso corporal (1RM estimado)', 'Squat your bodyweight (estimated 1RM)', 'Squat à ton poids de corps (1RM estimé)', 'Agachamento com o teu peso corporal (1RM estimado)'], goal: 100, unit: '%', cur: (L) => Math.min(100, Math.round((Math.max(0, ...L.filter((l) => /^Sentadilla/.test(EX[l.ex][0])).map(e1)) / bw()) * 100)) },
    { id: 'augias', ic: '🧹', n: ['Los Establos de Augías', 'The Augean Stables', 'Les Écuries d’Augias', 'Os Estábulos de Áugias'], d: ['100 series registradas en total', '100 sets logged in total', '100 séries enregistrées au total', '100 séries registadas no total'], goal: 100, cur: (L) => L.length },
    { id: 'estinfalo', ic: '🐦', n: ['Las Aves del Estínfalo', 'The Stymphalian Birds', 'Les Oiseaux du lac Stymphale', 'As Aves do Estínfalo'], d: ['6 grupos musculares distintos en una semana', '6 different muscle groups in one week', '6 groupes musculaires différents en une semaine', '6 grupos musculares diferentes numa semana'], goal: 6, cur: (L) => bestWeek(L, (w) => new Set(w.map(grp)).size) },
    { id: 'toro', ic: '🐂', n: ['El Toro de Creta', 'The Cretan Bull', 'Le Taureau de Crète', 'O Touro de Creta'], d: ['Bate 5 récords personales', 'Beat 5 personal records', 'Bats 5 records personnels', 'Bate 5 recordes pessoais'], goal: 5, cur: records },
    { id: 'diomedes', ic: '🐎', n: ['Las Yeguas de Diomedes', 'The Mares of Diomedes', 'Les Juments de Diomède', 'As Éguas de Diomedes'], d: ['4 sesiones largas de 20 series o más', '4 long sessions of 20+ sets', '4 longues séances de 20 séries ou plus', '4 sessões longas de 20 séries ou mais'], goal: 4, cur: (L) => { const D = {}; L.forEach((l) => { const k = dayKey(l.t); D[k] = (D[k] || 0) + 1; }); return Object.values(D).filter((n) => n >= 20).length; } },
    { id: 'hipolita', ic: '🎗️', n: ['El Cinturón de Hipólita', 'Hippolyta’s Belt', 'La Ceinture d’Hippolyte', 'O Cinto de Hipólita'], d: ['60 series de core', '60 core sets', '60 séries de gainage', '60 séries de core'], goal: 60, cur: (L) => L.filter((l) => grp(l) === 'Core' || grp(l) === 'Lumbar').length },
    { id: 'gerion', ic: '🐄', n: ['El Ganado de Gerión', 'The Cattle of Geryon', 'Les Bœufs de Géryon', 'O Gado de Gérion'], d: ['50.000 kg de volumen acumulado', '50,000 kg of total volume', '50 000 kg de volume cumulé', '50.000 kg de volume acumulado'], goal: 50000, unit: 'kg', cur: (L) => L.reduce((a, l) => a + vol(l), 0) },
    { id: 'hesperides', ic: '🍎', n: ['Las Manzanas de las Hespérides', 'The Apples of the Hesperides', 'Les Pommes des Hespérides', 'As Maçãs das Hespérides'], d: ['Racha de 14 días abriendo Volta', 'A 14-day streak opening Volta', 'Une série de 14 jours sur Volta', 'Sequência de 14 dias a abrir o Volta'], goal: 14, cur: () => Math.max(+S.bestStreak || 0, +S.streakCount || 0) },
    { id: 'cerbero', ic: '🐕', n: ['Cerbero, guardián del Hades', 'Cerberus, guardian of Hades', 'Cerbère, gardien des Enfers', 'Cérbero, guardião do Hades'], d: ['30 días de entreno en total', '30 training days in total', '30 jours d’entraînement au total', '30 dias de treino no total'], goal: 30, cur: (L) => new Set(L.map((l) => dayKey(l.t))).size },
  ];
  function laborState() {
    const L = log();
    return LABORS.map((lb) => { let c = 0; try { c = Math.max(0, +lb.cur(L) || 0); } catch (e) { c = 0; } return { lb, cur: c, pct: Math.min(100, (c / lb.goal) * 100), ok: c >= lb.goal }; });
  }
  const titleOf = (n) => tr(T.titles[n >= 12 ? 4 : n >= 9 ? 3 : n >= 5 ? 2 : n >= 1 ? 1 : 0]);
  const store = () => { try { return JSON.parse(localStorage.getItem('vx:labors') || '{}'); } catch (e) { return {}; } };
  const keep = (o) => { try { localStorage.setItem('vx:labors', JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
  // Aviso y celebración una sola vez por trabajo (la primera vez que se ve, sin celebrar lo ya conseguido)
  function checkLabors(st) {
    const s = store(), first = !s.seen, fresh = [];
    st.forEach((x) => { if (x.ok && !s[x.lb.id]) { s[x.lb.id] = Date.now(); fresh.push(x); } });
    s.seen = 1; keep(s);
    if (first || !fresh.length) return;
    // Varios a la vez (p. ej. al importar un historial): un único aviso en lugar de una avalancha
    const msg = fresh.length === 1 ? `${fresh[0].lb.ic} ${tr(T.won)} ${tr(fresh[0].lb.n)}` : `🏛️ ${fresh.length} ${tr(T.many)}: ${fresh.map((x) => x.lb.ic).join(' ')}`;
    if (typeof toast === 'function') toast(msg);
    if (window.vxPushInbox) window.vxPushInbox(fresh.length === 1 ? fresh[0].lb.ic : '🏛️', msg, "go('vx:labors')");
    if (window.vxCelebrate) window.vxCelebrate();
  }
  const unitTxt = (u, v) => (u === 'kg' ? fmt(v) + ' kg' : u === '%' ? Math.round(v) + ' %' : u === 'sem' ? fmt(v) : fmt(v));

  V['vx:labors'] = function () {
    const st = laborState(), n = st.filter((x) => x.ok).length;
    setTimeout(() => checkLabors(st), 0);
    let h = `<div class="row" style="margin-bottom:6px"><button class="back" onclick="back()" aria-label="‹">‹</button><h1 style="font-size:22px">${tr(T.labors)}</h1></div>`;
    h += `<div class="card vx-lab-hero"><div class="vx-lab-ring" style="--p:${(n / 12) * 100}"><b>${n}</b><span>/12</span></div><div class="g"><div class="mu">${tr(T.title)}</div><div class="vx-lab-title">${titleOf(n)}</div><div class="mu">${tr(T.laborsSub)}</div></div></div>`;
    h += '<div class="vx-lab-grid">' + st.map((x, i) => `<div class="card vx-lab${x.ok ? ' ok' : ''}"><div class="vx-lab-n">${['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI', 'XII'][i]}</div><div class="vx-lab-ic" aria-hidden="true">${x.lb.ic}</div><b>${tr(x.lb.n)}</b><div class="mu">${tr(x.lb.d)}</div><div class="bar" style="margin-top:8px"><i style="width:${x.pct.toFixed(1)}%"></i></div><div class="vx-lab-v">${x.ok ? '✓ ' + tr(T.done).replace(/s$/, '') : unitTxt(x.lb.unit, x.cur) + ' / ' + unitTxt(x.lb.unit, x.lb.goal)}</div></div>`).join('') + '</div>';
    return h;
  };
  function laborsCard() {
    const st = laborState(), n = st.filter((x) => x.ok).length;
    const nx = st.filter((x) => !x.ok).sort((a, b) => b.pct - a.pct)[0];
    return `<div class="card vx-lab-card" onclick="go('vx:labors')" role="button" tabindex="0"><div class="row sp"><b>🏛️ ${tr(T.labors)}</b><span class="vx-count">${n}/12</span></div>` +
      (nx ? `<div class="row" style="gap:10px;margin-top:8px;align-items:center"><span style="font-size:24px">${nx.lb.ic}</span><div class="g"><div><b>${tr(T.next)}:</b> ${tr(nx.lb.n)}</div><div class="bar" style="margin-top:6px"><i style="width:${nx.pct.toFixed(1)}%"></i></div><div class="mu" style="margin-top:4px">${tr(nx.lb.d)}</div></div></div>` : `<div class="mu" style="margin-top:6px">${titleOf(12)} 🏆</div>`) + '</div>';
  }

  // ── El Oráculo de Delfos ──
  const BIG = ['Pecho', 'Espalda', 'Cuádriceps', 'Hombros', 'Glúteos', 'Isquiosurales'];
  const PAIRS = { Pecho: 'Tríceps', Espalda: 'Bíceps', Cuádriceps: 'Glúteos', Hombros: 'Core', Glúteos: 'Isquiosurales', Isquiosurales: 'Gemelos' };
  const RECOVER = 48 * 36e5;
  function oracle() {
    const L = log(), now = Date.now(), last = {};
    L.forEach((l) => { const g = grp(l); last[g] = Math.max(last[g] || 0, l.t); });
    const trainedToday = L.some((l) => dayKey(l.t) === dayKey(now));
    const ready = BIG.filter((g) => !last[g] || now - last[g] >= RECOVER).sort((a, b) => (last[a] || 0) - (last[b] || 0));
    const main = ready[0] || BIG.slice().sort((a, b) => (last[a] || 0) - (last[b] || 0))[0];
    const second = PAIRS[main];
    const doy = Math.floor(now / 864e5);
    return { trainedToday, main, second, last, proph: PROPH[doy % PROPH.length] };
  }
  const since = (t) => { if (!t) return tr(T.never); const h = Math.round((Date.now() - t) / 36e5); return h < 48 ? tr(T.ago).replace('{h}', h) : tr(T.days).replace('{d}', Math.round(h / 24)); };
  const gName = (g) => (window.vxTr ? window.vxTr(g) : g);
  window.vxOracleGo = (g) => { S.cat = g; S.xn = 30; S.q = ''; S.stack = S.stack || []; go('lib'); };
  function oracleCard() {
    const o = oracle();
    const head = `<div class="row" style="gap:10px;align-items:center"><span class="vx-or-ic" aria-hidden="true">${ORACLE_SVG}</span><div class="g"><b>${tr(T.oracle)}</b><div class="mu vx-or-proph">“${tr(o.proph)}”</div></div></div>`;
    if (o.trainedToday) return `<div class="card vx-oracle rest">${head}<div style="margin-top:10px">🌙 ${tr(T.rest)}</div></div>`;
    return `<div class="card vx-oracle">${head}<div class="mu" style="margin-top:10px">${tr(T.today)}:</div>` +
      `<div class="vx-or-groups">${[o.main, o.second].map((g) => `<div class="vx-or-g"><b>${gName(g)}</b><span class="mu">${since(o.last[g])}${o.last[g] && Date.now() - o.last[g] >= RECOVER ? ' · ' + tr(T.fresh) : ''}</span></div>`).join('<span class="vx-or-plus">+</span>')}</div>` +
      `<button class="btn" style="margin-top:12px" onclick="event.stopPropagation();vxOracleGo('${o.main}')">⚡ ${tr(T.train)}</button></div>`;
  }
  // Templo de Delfos (dibujo propio)
  const ORACLE_SVG = '<svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="vxorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#c79212"/></linearGradient></defs><circle cx="20" cy="20" r="19" fill="url(#vxorg)" opacity=".18"/><path d="M8 15L20 8l12 7z" fill="url(#vxorg)"/><rect x="9" y="15.5" width="22" height="2" rx=".6" fill="url(#vxorg)"/><g fill="url(#vxorg)"><rect x="10.5" y="18.5" width="2.6" height="11"/><rect x="16" y="18.5" width="2.6" height="11"/><rect x="21.4" y="18.5" width="2.6" height="11"/><rect x="26.9" y="18.5" width="2.6" height="11"/></g><rect x="8" y="30" width="24" height="2.4" rx=".6" fill="url(#vxorg)"/><path d="M20 3c1.6 1.8 1.6 3.4 0 5-1.6-1.6-1.6-3.2 0-5z" fill="#ffb648"/></svg>';

  // ── Inserción en Inicio: Oráculo arriba, Trabajos junto a la Arena ──
  if (typeof V.home === 'function') {
    const _home = V.home;
    V.home = function () {
      let h = _home.apply(this, arguments);
      try {
        const or = oracleCard(), lab = laborsCard();
        const ia = h.indexOf('vx-arena-card');
        if (ia !== -1) { const c = h.lastIndexOf('<div class="card', ia); h = h.slice(0, c) + or + h.slice(c); const ia2 = h.indexOf('vx-arena-card'); const end = h.indexOf('vx-missions', ia2); const c2 = end !== -1 ? h.lastIndexOf('<div class="card', end) : -1; if (c2 > ia2) h = h.slice(0, c2) + lab + h.slice(c2); else h += lab; }
        else h += or + lab;
        setTimeout(() => { try { checkLabors(laborState()); } catch (e) { /* sin aviso */ } }, 0);
      } catch (e) { /* Inicio original */ }
      return h;
    };
  }
  window.vxLabors = laborState; window.vxOracle = oracle; // para pruebas
})();
