/* VOLTA · El Olimpo: lo que solo tiene Volta.
   - Los 12 Trabajos de Hércules: desafíos épicos medidos con tu registro real de entrenamientos.
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
    labors: ['Los 12 Trabajos de Hércules', 'The 12 Labours of Hercules', 'Les 12 Travaux d’Hercule', 'Os 12 Trabalhos de Hércules'],
    laborsSub: ['Desafíos épicos medidos con tus entrenos reales. Complétalos todos y serás Hércules.', 'Epic challenges measured with your real workouts. Finish them all to become Hercules.', 'Des défis épiques mesurés sur tes vraies séances. Termine-les tous pour devenir Hercule.', 'Desafios épicos medidos com os teus treinos reais. Completa-os todos e serás Hércules.'],
    done: ['completados', 'completed', 'terminés', 'concluídos'],
    next: ['Siguiente', 'Next', 'Suivant', 'Seguinte'],
    many: ['Trabajos completados', 'Labours completed', 'Travaux accomplis', 'Trabalhos concluídos'],
    won: ['¡Trabajo completado!', 'Labour completed!', 'Travail accompli !', 'Trabalho concluído!'],
    title: ['Título', 'Title', 'Titre', 'Título'],
    titles: [['Mortal', 'Mortal', 'Mortel', 'Mortal'], ['Aspirante a héroe', 'Hero in training', 'Apprenti héros', 'Aspirante a herói'], ['Semidiós', 'Demigod', 'Demi-dieu', 'Semideus'], ['Héroe del Olimpo', 'Hero of Olympus', 'Héros de l’Olympe', 'Herói do Olimpo'], ['Hércules', 'Hercules', 'Hercule', 'Hércules']],
    oracle: ['El Oráculo de Delfos', 'The Oracle of Delphi', 'L’Oracle de Delphes', 'O Oráculo de Delfos'],
    favor: ['Favor del Oráculo', 'Oracle’s favour', 'Faveur de l’Oracle', 'Favor do Oráculo'],
    lvl: ['Nivel', 'Level', 'Niveau', 'Nível'],
    lastXP: ['Último entreno', 'Last workout', 'Dernière séance', 'Último treino'],
    howT: ['¿Cómo funciona?', 'How does it work?', 'Comment ça marche ?', 'Como funciona?'],
    how: ['Cada entreno que <b>finalizas</b> te da Favor: <b>40 XP</b>, más <b>4 XP por serie</b> (hasta 30 series) y <b>1 XP por cada 250 kg</b> de volumen (hasta 80). Cuenta cualquier entreno, venga de donde venga. Las series sueltas sin finalizar no cuentan.', 'Every workout you <b>finish</b> earns Favour: <b>40 XP</b>, plus <b>4 XP per set</b> (up to 30 sets) and <b>1 XP per 250 kg</b> of volume (up to 80). Any workout counts. Loose sets you don’t finish don’t.', 'Chaque séance <b>terminée</b> te donne de la Faveur : <b>40 XP</b>, plus <b>4 XP par série</b> (jusqu’à 30) et <b>1 XP par 250 kg</b> de volume (jusqu’à 80). Toute séance compte. Les séries isolées non terminées ne comptent pas.', 'Cada treino que <b>terminas</b> dá-te Favor: <b>40 XP</b>, mais <b>4 XP por série</b> (até 30) e <b>1 XP por cada 250 kg</b> de volume (até 80). Qualquer treino conta. Séries soltas sem terminar não contam.'],
    how2: ['Con el Favor subes de nivel y de título: Peregrino → Devoto → Iniciado → Sacerdote → Profeta → Pitia. Cada nivel pide 100 XP más que el anterior.', 'Favour levels you up and changes your title: Pilgrim → Devotee → Initiate → Priest → Prophet → Pythia. Each level needs 100 XP more than the last.', 'La Faveur te fait monter de niveau et de titre : Pèlerin → Fidèle → Initié → Prêtre → Prophète → Pythie. Chaque niveau demande 100 XP de plus.', 'O Favor faz-te subir de nível e de título: Peregrino → Devoto → Iniciado → Sacerdote → Profeta → Pítia. Cada nível pede mais 100 XP que o anterior.'],
    sess: ['Entrenos', 'Workouts', 'Séances', 'Treinos'],
    toNext: ['para el nivel', 'to level', 'pour le niveau', 'para o nível'],
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

  // ── El Oráculo de Delfos: tus avances (Favor) con cada entreno finalizado ──
  // Favor del Oráculo (XP): se gana con CUALQUIER entrenamiento finalizado, venga de una rutina de la IA,
  // de una rutina tuya o de una sesión libre.
  const OKEY = 'vx:oracle';
  const ost = () => { try { return JSON.parse(localStorage.getItem(OKEY) || '{}'); } catch (e) { return {}; } };
  const oput = (o) => { try { localStorage.setItem(OKEY, JSON.stringify(o)); } catch (e) { /* sin almacenamiento */ } };
  const OLV = [['Peregrino', 'Pilgrim', 'Pèlerin', 'Peregrino'], ['Devoto', 'Devotee', 'Fidèle', 'Devoto'], ['Iniciado', 'Initiate', 'Initié', 'Iniciado'], ['Sacerdote', 'Priest', 'Prêtre', 'Sacerdote'], ['Profeta', 'Prophet', 'Prophète', 'Profeta'], ['Pitia', 'Pythia', 'Pythie', 'Pítia']];
  const lvNeed = (n) => 100 * n * (n - 1) / 2; // XP total para llegar al nivel n (1 → 0, 2 → 100, 3 → 300…)
  const lvOf = (xp) => { let n = 1; while (lvNeed(n + 1) <= xp) n++; return n; };
  const lvName = (n) => tr(OLV[n >= 15 ? 5 : n >= 11 ? 4 : n >= 8 ? 3 : n >= 5 ? 2 : n >= 3 ? 1 : 0]);
  function sessions() {
    const done = S.done && typeof S.done === 'object' ? S.done : {};
    const L = log();
    return Object.keys(done).map((k) => {
      const d = done[k] || {}, t = +d.t || Date.parse(k) || 0, day = dayKey(t || Date.parse(k));
      const sets = L.filter((l) => dayKey(l.t) === day);
      return { k, t, sets: +d.sets || sets.length, vol: +d.vol || sets.reduce((a, l) => a + vol(l), 0), groups: [...new Set(sets.map(grp))], day };
    }).filter((x) => x.sets > 0).sort((a, b) => a.t - b.t);
  }
  function sessionXP(x) {
    return { xp: 40 + Math.min(30, x.sets) * 4 + Math.min(80, Math.round(x.vol / 250)) };
  }
  function favor() {
    const S2 = sessions().map((x) => Object.assign(x, sessionXP(x)));
    const xp = S2.reduce((a, x) => a + x.xp, 0), lv = lvOf(xp);
    return { xp, lv, name: lvName(lv), into: xp - lvNeed(lv), span: lvNeed(lv + 1) - lvNeed(lv), last: S2[S2.length - 1] || null, n: S2.length };
  }
  // Avisa de la XP ganada con cada entreno nuevo
  function remember() {
    const st = ost(); delete st.proph;
    const f = favor();
    if (st.seenN == null) st.seenN = f.n;
    else if (f.n > st.seenN && f.last) {
      st.seenN = f.n;
      const msg = `🏛️ +${f.last.xp} XP ${tr(T.favor)}`;
      setTimeout(() => { if (typeof toast === 'function') toast(msg); if (window.vxPushInbox) window.vxPushInbox('🏛️', msg, "tab('home')"); }, 900);
      if (st.lv && f.lv > st.lv && window.vxCelebrate) setTimeout(window.vxCelebrate, 1200);
    }
    st.lv = f.lv; oput(st);
    return f;
  }
  // Solo avances: nivel, título, XP y cómo se gana. Ningún entrenamiento recomendado.
  function oracleCard() {
    const f = remember(), doy = Math.floor(Date.now() / 864e5);
    const head = `<div class="row" style="gap:10px;align-items:center"><span class="vx-or-ic" aria-hidden="true">${ORACLE_SVG}</span><div class="g"><b>${tr(T.oracle)}</b><div class="mu vx-or-proph">“${tr(PROPH[doy % PROPH.length])}”</div></div></div>`;
    const fav = `<div class="vx-or-fav"><div class="row sp"><span><b>${tr(T.favor)}</b> · ${tr(T.lvl)} ${f.lv} · <span class="vx-or-rank">${f.name}</span></span><span class="mu">${fmt(f.xp)} XP</span></div>` +
      `<div class="bar" style="margin-top:6px"><i style="width:${Math.min(100, (f.into / f.span) * 100).toFixed(1)}%"></i></div>` +
      `<div class="row sp mu" style="font-size:12px;margin-top:4px"><span>${tr(T.sess)}: ${f.n}${f.last ? ` · ${tr(T.lastXP)}: +${f.last.xp} XP` : ''}</span><span>${fmt(f.span - f.into)} XP ${tr(T.toNext)} ${f.lv + 1}</span></div></div>`;
    const how = `<details class="vx-or-how"><summary>${tr(T.howT)}</summary><p>${tr(T.how)}</p><p>${tr(T.how2)}</p></details>`;
    return `<div class="card vx-oracle">${head}${fav}${how}</div>`;
  }
  // Templo de Delfos (dibujo propio)
  const ORACLE_SVG = '<svg width="38" height="38" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="vxorg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset="1" stop-color="#c79212"/></linearGradient></defs><circle cx="20" cy="20" r="19" fill="url(#vxorg)" opacity=".18"/><path d="M8 15L20 8l12 7z" fill="url(#vxorg)"/><rect x="9" y="15.5" width="22" height="2" rx=".6" fill="url(#vxorg)"/><g fill="url(#vxorg)"><rect x="10.5" y="18.5" width="2.6" height="11"/><rect x="16" y="18.5" width="2.6" height="11"/><rect x="21.4" y="18.5" width="2.6" height="11"/><rect x="26.9" y="18.5" width="2.6" height="11"/></g><rect x="8" y="30" width="24" height="2.4" rx=".6" fill="url(#vxorg)"/><path d="M20 3c1.6 1.8 1.6 3.4 0 5-1.6-1.6-1.6-3.2 0-5z" fill="#ffb648"/></svg>';

  // ── Inserción: Oráculo en Inicio (bajo la racha); los 12 Trabajos en Entrenos ──
  if (typeof V.home === 'function') {
    const _home = V.home;
    V.home = function () {
      let h = _home.apply(this, arguments);
      try {
        const or = oracleCard(), ia = h.indexOf('vx-arena-card');
        if (ia !== -1) { const c = h.lastIndexOf('<div class="card', ia); h = h.slice(0, c) + or + h.slice(c); } else h += or;
      } catch (e) { /* Inicio original */ }
      return h;
    };
  }
  if (typeof V.train === 'function') {
    const _train = V.train;
    V.train = function () {
      let h = _train.apply(this, arguments);
      try {
        const lab = laborsCard(), mk = '<h2>Ejercicios</h2>';
        h = h.indexOf(mk) !== -1 ? h.replace(mk, lab + mk) : h + lab;
        setTimeout(() => { try { checkLabors(laborState()); } catch (e) { /* sin aviso */ } }, 0);
      } catch (e) { /* Entrenos original */ }
      return h;
    };
  }
  window.vxLabors = laborState; window.vxFavor = favor; // para pruebas
})();
