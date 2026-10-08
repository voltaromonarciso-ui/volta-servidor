/* VOLTA · Arena: ligas, nivel, ranking global / de liga / de amigos y perfiles públicos.
   La puntuación oficial la calcula el servidor (src/lib/score.js). Aquí se repite la misma fórmula solo para
   enseñarla sin conexión y explicar de dónde sale cada punto; el ranking siempre usa la del servidor. */
(function () {
  if (typeof V !== 'object' || typeof R !== 'function') return;
  const LI = { es: 0, en: 1, fr: 2, pt: 3 };
  const T = {
    arena: ['Arena', 'Arena', 'Arène', 'Arena'],
    league: ['Liga', 'League', 'Ligue', 'Liga'],
    level: ['Nivel', 'Level', 'Niveau', 'Nível'],
    week: ['esta semana', 'this week', 'cette semaine', 'esta semana'],
    pts: ['pts', 'pts', 'pts', 'pts'],
    toNext: ['XP para subir a', 'XP to reach', 'XP pour atteindre', 'XP para subir a'],
    top: ['Liga máxima alcanzada', 'Top league reached', 'Ligue maximale atteinte', 'Liga máxima alcançada'],
    tabLeague: ['Mi liga', 'My league', 'Ma ligue', 'A minha liga'],
    tabGlobal: ['Global', 'Global', 'Mondial', 'Global'],
    tabFriends: ['Amigos', 'Friends', 'Amis', 'Amigos'],
    you: ['tú', 'you', 'toi', 'tu'],
    rank: ['Tu posición', 'Your rank', 'Ton rang', 'A tua posição'],
    noRank: ['Entrena esta semana para entrar en el ranking', 'Train this week to enter the ranking', 'Entraîne-toi cette semaine pour entrer au classement', 'Treina esta semana para entrar no ranking'],
    empty: ['Aún no hay nadie esta semana. ¡Sé el primero!', 'Nobody yet this week. Be the first!', "Personne encore cette semaine. Sois le premier !", 'Ainda ninguém esta semana. Sê o primeiro!'],
    loading: ['Cargando…', 'Loading…', 'Chargement…', 'A carregar…'],
    offline: ['Crea tu cuenta (Social) para competir con todo el mundo. Tu nivel y tu liga ya cuentan desde hoy.', 'Create your account (Social) to compete with everyone. Your level and league already count from today.', 'Crée ton compte (Social) pour affronter tout le monde. Ton niveau et ta ligue comptent déjà.', 'Cria a tua conta (Social) para competir com todos. O teu nível e a tua liga já contam a partir de hoje.'],
    join: ['Entrar en la competición', 'Join the competition', 'Rejoindre la compétition', 'Entrar na competição'],
    how: ['Cómo se puntúa', 'How scoring works', 'Comment on marque', 'Como se pontua'],
    hDays: ['Cada día entrenado', 'Each training day', "Chaque jour d'entraînement", 'Cada dia treinado'],
    hSets: ['Cada serie (hasta 30 al día)', 'Each set (up to 30 a day)', "Chaque série (jusqu'à 30 par jour)", 'Cada série (até 30 por dia)'],
    hVol: ['Volumen total (crece despacio)', 'Total volume (grows slowly)', 'Volume total (augmente lentement)', 'Volume total (cresce devagar)'],
    hProg: ['Progresión frente a tu semana anterior', 'Progress vs your previous week', 'Progression vs ta semaine précédente', 'Progressão face à tua semana anterior'],
    hNote: ['Premiamos la constancia y que mejores frente a ti mismo: un principiante puede ganar a alguien que levanta el triple.', 'We reward consistency and beating your own numbers: a beginner can beat someone who lifts three times more.', "On récompense la régularité et le fait de progresser par rapport à toi-même : un débutant peut battre quelqu'un qui soulève trois fois plus.", 'Premiamos a constância e melhorar face a ti mesmo: um principiante pode ganhar a alguém que levanta o triplo.'],
    fair: ['Juego limpio', 'Fair play', 'Fair-play', 'Jogo limpo'],
    f1: ['La puntuación la calcula el servidor: nadie puede enviarse puntos.', 'Scores are calculated on the server: nobody can send themselves points.', 'Le score est calculé par le serveur : personne ne peut s’attribuer des points.', 'A pontuação é calculada pelo servidor: ninguém pode enviar pontos a si próprio.'],
    f2: ['Las cifras imposibles se rechazan; quien insiste sale del ranking de la semana.', 'Impossible numbers are rejected; repeat offenders leave the weekly ranking.', 'Les chiffres impossibles sont refusés ; en cas de récidive, on sort du classement de la semaine.', 'Os números impossíveis são rejeitados; quem insiste sai do ranking da semana.'],
    f3: ['Si varias personas denuncian trampas, la cuenta se aparta hasta revisarla.', 'If several people report cheating, the account is set aside for review.', 'Si plusieurs personnes signalent une triche, le compte est mis de côté pour vérification.', 'Se várias pessoas denunciarem batota, a conta é afastada até ser revista.'],
    f4: ['Nombres y mensajes pasan un filtro: aquí no hay insultos.', 'Names and messages are filtered: no insults here.', 'Les noms et messages sont filtrés : pas d’insultes ici.', 'Nomes e mensagens passam por um filtro: aqui não há insultos.'],
    profile: ['Perfil', 'Profile', 'Profil', 'Perfil'],
    since: ['Miembro desde', 'Member since', 'Membre depuis', 'Membro desde'],
    online: ['En línea', 'Online', 'En ligne', 'Online'],
    days: ['días', 'days', 'jours', 'dias'],
    day: ['día', 'day', 'jour', 'dia'],
    sets: ['series', 'sets', 'séries', 'séries'],
    add: ['Añadir amigo', 'Add friend', 'Ajouter en ami', 'Adicionar amigo'],
    pending: ['Solicitud enviada', 'Request sent', 'Demande envoyée', 'Pedido enviado'],
    friends: ['Sois amigos', "You're friends", 'Vous êtes amis', 'São amigos'],
    report: ['Denunciar', 'Report', 'Signaler', 'Denunciar'],
    rCheat: ['Trampas', 'Cheating', 'Triche', 'Batota'],
    rName: ['Nombre ofensivo', 'Offensive name', 'Nom offensant', 'Nome ofensivo'],
    rContent: ['Contenido ofensivo', 'Offensive content', 'Contenu offensant', 'Conteúdo ofensivo'],
    rOther: ['Otro motivo', 'Other reason', 'Autre raison', 'Outro motivo'],
    thanks: ['Gracias. Revisaremos la denuncia.', "Thanks. We'll review the report.", 'Merci. Nous examinerons le signalement.', 'Obrigado. Vamos rever a denúncia.'],
    err: ['No se pudo completar. Inténtalo de nuevo.', "Couldn't complete. Try again.", "Impossible de terminer. Réessaie.", 'Não foi possível concluir. Tenta de novo.'],
    up: ['¡Has subido a la liga', 'You moved up to the', 'Tu es monté en ligue', 'Subiste para a liga'],
    flagged: ['Esta semana estás fuera del ranking por cifras imposibles o denuncias. Vuelves el lunes.', "You're out of the ranking this week due to impossible numbers or reports. You're back on Monday.", 'Tu es hors classement cette semaine (chiffres impossibles ou signalements). Retour lundi.', 'Esta semana estás fora do ranking por números impossíveis ou denúncias. Voltas na segunda.'],
    see: ['Ver Arena', 'Open Arena', "Voir l'Arène", 'Ver Arena'],
  };
  const t = (k) => (T[k] || [k])[LI[S.lang] || 0];
  const LEAGUES = [
    { id: 'bronce', min: 0, n: ['Bronce', 'Bronze', 'Bronze', 'Bronze'], c: ['#f0a868', '#9a5426'] },
    { id: 'plata', min: 1500, n: ['Plata', 'Silver', 'Argent', 'Prata'], c: ['#eef2f6', '#8a96a3'] },
    { id: 'oro', min: 5000, n: ['Oro', 'Gold', 'Or', 'Ouro'], c: ['#ffe27a', '#c08a12'] },
    { id: 'platino', min: 12000, n: ['Platino', 'Platinum', 'Platine', 'Platina'], c: ['#b9fff4', '#2aa597'] },
    { id: 'diamante', min: 25000, n: ['Diamante', 'Diamond', 'Diamant', 'Diamante'], c: ['#cfe0ff', '#3f6fe0'] },
    { id: 'elite', min: 50000, n: ['Élite', 'Elite', 'Élite', 'Elite'], c: ['#e6c8ff', '#7a2fd0'] },
  ];
  const lgIdx = (id) => Math.max(0, LEAGUES.findIndex((l) => l.id === id));
  const lgOfXp = (xp) => { let i = 0; LEAGUES.forEach((l, j) => { if (xp >= l.min) i = j; }); return i; };
  const lgName = (i) => LEAGUES[i].n[LI[S.lang] || 0];
  const levelOf = (xp) => Math.floor(Math.sqrt(Math.max(0, xp) / 100)) + 1;
  const fmt = (n) => Math.round(n || 0).toLocaleString(S.lang);
  const safe = (s) => (typeof esc === 'function' ? esc(s) : String(s).replace(/[&<>"']/g, (c) => '&#' + c.charCodeAt(0) + ';'));
  const api = (m, p, b) => (window.vxApiCall ? window.vxApiCall(m, p, b) : Promise.reject(0));
  const online = () => !!(window.vxSocialOn && window.vxSocialOn());

  // Insignia original: escudo facetado con el color de la liga y estrellas según el nivel dentro de ella
  function badge(i, size, stars) {
    const L = LEAGUES[i], id = 'lg' + i + '_' + size;
    const st = Math.max(0, Math.min(3, stars || 0));
    return `<svg class="vx-badge" width="${size}" height="${size}" viewBox="0 0 64 64" role="img" aria-label="${t('league')} ${lgName(i)}">` +
      `<defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.c[0]}"/><stop offset="1" stop-color="${L.c[1]}"/></linearGradient></defs>` +
      `<path d="M32 3l24 9v18c0 15-10 25-24 31C18 55 8 45 8 30V12z" fill="url(#${id})" stroke="rgba(0,0,0,.35)" stroke-width="1.5"/>` +
      `<path d="M32 3l24 9v18c0 15-10 25-24 31z" fill="#000" opacity=".12"/>` +
      `<path d="M32 9l18 7v14c0 11-7 19-18 24C21 49 14 41 14 30V16z" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="1.4"/>` +
      `<path d="M32 18l4.2 8.6 9.4 1.3-6.8 6.6 1.6 9.4L32 39.5l-8.4 4.4 1.6-9.4-6.8-6.6 9.4-1.3z" fill="#fff" fill-opacity=".92"/>` +
      (i >= 4 ? '<path d="M32 18l4.2 8.6 9.4 1.3-6.8 6.6 1.6 9.4L32 39.5z" fill="#000" opacity=".12"/>' : '') +
      Array.from({ length: st }, (_, k) => `<circle cx="${32 + (k - (st - 1) / 2) * 9}" cy="55" r="2.6" fill="#fff" stroke="rgba(0,0,0,.3)" stroke-width=".8"/>`).join('') +
      '</svg>';
  }
  window.vxBadge = badge;

  // ── Puntuación local (misma fórmula que el servidor) ──
  const monKey = (ts) => { const d = new Date(ts); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  function weekScore(w, prevVolume) {
    const counted = Math.min(w.sets, w.days * 30);
    const parts = { days: w.days * 100, sets: counted * 5, vol: Math.round(40 * Math.log2(1 + w.volume / 1000)), prog: 0 };
    if (prevVolume > 0 && w.days >= 2) parts.prog = Math.round(Math.min(0.5, Math.max(0, w.volume / prevVolume - 1)) * 400);
    return { total: parts.days + parts.sets + parts.vol + parts.prog, parts };
  }
  function local() {
    const L = window.vxRealLog ? window.vxRealLog() : [];
    const W = {};
    L.forEach((l) => { const k = monKey(l.t); const w = W[k] || (W[k] = { days: new Set(), sets: 0, volume: 0 }); w.days.add(typeof lk === 'function' ? lk(l.t) : new Date(l.t).toDateString()); w.sets++; w.volume += (l.w || 0) * (l.r || 0); });
    const cur = monKey(Date.now());
    let xp = 0;
    const keys = Object.keys(W).map(Number).sort((a, b) => a - b);
    const norm = (w) => (w ? { days: Math.min(7, w.days.size), sets: w.sets, volume: Math.round(w.volume) } : { days: 0, sets: 0, volume: 0 });
    keys.filter((k) => k < cur).forEach((k) => { const prev = W[k - 7 * 864e5]; xp += weekScore(norm(W[k]), prev ? Math.round(prev.volume) : 0).total; });
    const prev = W[cur - 7 * 864e5];
    const now = weekScore(norm(W[cur]), prev ? Math.round(prev.volume) : 0);
    return { xp, week: norm(W[cur]), score: now.total, parts: now.parts };
  }

  // ── Estado del servidor ──
  let srv = null; // última respuesta de POST /api/users/stats
  const lbs = { league: null, global: null }, lbAt = { league: 0, global: 0 };
  let busy = {};
  const st = () => { try { return JSON.parse(localStorage.getItem('vx:arena') || '{}'); } catch (e) { return {}; } };
  const put = (o) => { try { localStorage.setItem('vx:arena', JSON.stringify(Object.assign(st(), o))); } catch (e) { /* sin almacenamiento */ } };
  function me() {
    const l = local();
    if (srv && online()) return { xp: srv.xp, score: srv.score, league: lgIdx(srv.league), level: srv.level, parts: l.parts, week: l.week, flagged: !!srv.flagged, server: true };
    return { xp: l.xp, score: l.score, league: lgOfXp(l.xp), level: levelOf(l.xp + l.score), parts: l.parts, week: l.week, flagged: false, server: false };
  }
  // Subida de liga: celebración una sola vez por liga
  function checkPromotion() {
    // Liga local y liga del servidor se guardan aparte: cambiar de una a otra no es "subir"
    const m = me(), s = st(), key = m.server ? 'lgS' : 'lgL';
    if (s[key] == null) { put({ [key]: m.league }); return; }
    if (m.league > s[key]) {
      put({ [key]: m.league });
      const msg = `${t('up')} ${lgName(m.league)}! 🏆`;
      if (window.vxCelebrate) window.vxCelebrate();
      if (typeof toast === 'function') toast(msg);
      if (window.vxPushInbox) window.vxPushInbox('🏆', msg, "go('vx:arena')");
    } else if (m.league < s[key]) put({ [key]: m.league });
  }
  window.vxArenaServer = (d) => { if (d && typeof d.score === 'number') { srv = d; lbAt.league = lbAt.global = 0; checkPromotion(); if (top() === 'vx:arena') R(); } };
  const top = () => (S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '');

  function loadLb(scope) {
    if (!online() || busy[scope] || Date.now() - lbAt[scope] < 30000) return;
    busy[scope] = true;
    api('GET', '/api/compete/leaderboard?scope=' + scope + '&limit=50').then((d) => {
      lbs[scope] = d; lbAt[scope] = Date.now();
      if (d && d.me && typeof d.me.score === 'number') srv = Object.assign({}, srv || {}, { xp: d.me.xp, score: d.me.score, league: d.me.league, level: d.me.level, flagged: d.me.flagged });
      if (top() === 'vx:arena') R();
    }).catch(() => {}).finally(() => { busy[scope] = false; });
  }

  // ── Tarjeta en Inicio ──
  function homeCard() {
    const m = me(), next = LEAGUES[m.league + 1];
    const tot = m.xp + m.score, pct = next ? Math.min(100, ((tot - LEAGUES[m.league].min) / (next.min - LEAGUES[m.league].min)) * 100) : 100;
    const r = lbs.global && lbs.global.me && lbs.global.me.rank;
    return `<div class="card vx-arena-card" onclick="go('vx:arena')" role="button" tabindex="0" aria-label="${t('arena')}">` +
      `<div class="row" style="gap:12px;align-items:center">${badge(m.league, 52, Math.min(3, Math.floor(pct / 34)))}` +
      `<div class="g"><div class="row sp"><b>🏆 ${t('arena')} · ${t('league')} ${lgName(m.league)}</b><span class="mu">›</span></div>` +
      `<div class="mu">${t('level')} ${m.level} · <b class="ac">${fmt(m.score)} ${t('pts')}</b> ${t('week')}${r ? ` · #${fmt(r)}` : ''}</div>` +
      `<div class="bar vx-xpbar" style="margin-top:8px"><i style="width:${pct.toFixed(1)}%"></i></div></div></div></div>`;
  }

  // ── Pantalla Arena ──
  const tab = () => st().tab || 'league';
  window.vxArenaTab = (k) => { put({ tab: k }); R(); };
  function rows(entries, myName) {
    if (!entries) return `<div class="mu" style="padding:10px 0">${t('loading')}</div>`;
    if (!entries.length) return `<div class="mu" style="padding:10px 0">${t('empty')}</div>`;
    const medal = ['🥇', '🥈', '🥉'];
    return entries.map((e, i) => {
      const rk = e.rank || i + 1, lg = lgIdx(e.league || 'bronce');
      const mine = e.me || (myName && e.username === myName);
      return `<div class="row vx-ar-row${mine ? ' me' : ''}${rk <= 3 ? ' podium' : ''}" onclick="vxArenaUser('${safe(e.username)}')" role="button" tabindex="0">` +
        `<span class="vx-ar-pos">${medal[rk - 1] || rk}</span>${badge(lg, 26)}` +
        `<div class="g"><b>${safe(e.username)}${mine ? ` <span class="mu">(${t('you')})</span>` : ''}</b><div class="mu">${t('level')} ${e.level || 1} · ${e.days} ${e.days === 1 ? t('day') : t('days')}${e.sets != null ? ` · ${e.sets} ${t('sets')}` : ''}</div></div>` +
        `<b class="vx-ar-pts">${e.score != null ? fmt(e.score) + ' ' + t('pts') : fmt(e.volume) + ' ' + ((S.units && S.units.w) || 'kg')}</b></div>`;
    }).join('');
  }
  V['vx:arena'] = function () {
    const m = me(), cur = LEAGUES[m.league], next = LEAGUES[m.league + 1], tot = m.xp + m.score;
    const pct = next ? Math.min(100, ((tot - cur.min) / (next.min - cur.min)) * 100) : 100;
    const k = tab();
    if (online()) { if (k !== 'friends') loadLb(k); }
    const d = k === 'friends' ? (window.vxLeaderboard ? window.vxLeaderboard() : null) : lbs[k];
    const myRank = d && d.me ? d.me.rank : null;
    const p = m.parts;
    let h = `<div class="row" style="margin-bottom:6px"><button class="back" onclick="back()" aria-label="‹">‹</button><h1 style="font-size:22px">🏆 ${t('arena')}</h1></div>`;
    h += `<div class="card vx-ar-hero lg-${cur.id}"><div class="vx-ar-glow" aria-hidden="true"></div>` +
      `<div class="row" style="gap:16px;align-items:center">${badge(m.league, 86, Math.min(3, Math.floor(pct / 34)))}` +
      `<div class="g"><div class="mu">${t('league')}</div><div class="vx-ar-lg">${lgName(m.league)}</div><div>${t('level')} <b>${m.level}</b> · ${fmt(tot)} XP</div></div></div>` +
      `<div class="bar vx-xpbar" style="margin-top:14px"><i style="width:${pct.toFixed(1)}%"></i></div>` +
      `<div class="mu" style="margin-top:6px">${next ? `${fmt(next.min - tot)} ${t('toNext')} ${lgName(m.league + 1)}` : t('top')}</div>` +
      `<div class="grid2 vx-ar-stats" style="grid-template-columns:repeat(3,1fr);margin-top:12px;text-align:center">` +
      `<div><b class="big">${fmt(m.score)}</b><div class="mu">${t('pts')} ${t('week')}</div></div>` +
      `<div><b class="big">${myRank ? '#' + fmt(myRank) : '—'}</b><div class="mu">${t('rank')}</div></div>` +
      `<div><b class="big">${m.week.days}</b><div class="mu">${t('days')}</div></div></div></div>`;
    if (m.flagged) h += `<div class="card" style="border-color:#ff7a59">⚠️ ${t('flagged')}</div>`;
    if (!online()) h += `<div class="card vx-ar-join"><div>${t('offline')}</div><button class="btn" style="margin-top:10px" onclick="socGo()">⚡ ${t('join')}</button></div>`;
    else {
      h += `<div class="chips vx-ar-tabs" role="tablist">${[['league', t('tabLeague')], ['global', t('tabGlobal')], ['friends', t('tabFriends')]].map(([id, n]) => `<div class="chip ${k === id ? 'on' : ''}" role="tab" aria-selected="${k === id}" onclick="vxArenaTab('${id}')">${n}</div>`).join('')}</div>`;
      h += `<div class="card vx-ar-list">${!myRank && k !== 'friends' && d ? `<div class="mu" style="margin-bottom:6px">${t('noRank')}</div>` : ''}${rows(d && d.entries, d && d.me && d.me.username)}</div>`;
    }
    h += `<h2>${t('how')}</h2><div class="card vx-ar-how">` +
      [['📅', t('hDays'), '+100', p.days], ['🏋️', t('hSets'), '+5', p.sets], ['📦', t('hVol'), 'log', p.vol], ['📈', t('hProg'), '≤ +200', p.prog]]
        .map(([ic, n, r, v]) => `<div class="row sp" style="margin:8px 0"><span>${ic} ${n} <span class="mu">(${r})</span></span><b class="ac">${fmt(v)}</b></div>`).join('') +
      `<div class="mu">${t('hNote')}</div></div>`;
    h += `<h2>🛡️ ${t('fair')}</h2><div class="card vx-ar-fair">${['f1', 'f2', 'f3', 'f4'].map((x) => `<div class="row" style="margin:7px 0;align-items:flex-start"><span>✅</span><span class="g">${t(x)}</span></div>`).join('')}</div>`;
    setTimeout(checkPromotion, 0);
    return h;
  };

  // ── Perfil público ──
  let pu = null, puData = null, puReport = false;
  window.vxArenaUser = (u) => {
    if (!online()) return;
    pu = u; puData = null; puReport = false; go('vx:pu');
    api('GET', '/api/compete/profile/' + encodeURIComponent(u)).then((d) => { puData = d; if (top() === 'vx:pu') R(); }).catch(() => { puData = { error: true }; if (top() === 'vx:pu') R(); });
  };
  window.vxPuAdd = () => api('POST', '/api/friends/request', { username: pu }).then((d) => { if (puData) puData.friendship = d && d.status === 'accepted' ? 'accepted' : 'pending'; R(); }).catch(() => toast(t('err')));
  window.vxPuReportOpen = () => { puReport = !puReport; R(); };
  window.vxPuReport = (reason) => api('POST', '/api/compete/report', { username: pu, reason }).then(() => { puReport = false; toast(t('thanks')); R(); }).catch(() => toast(t('err')));
  V['vx:pu'] = function () {
    let h = `<div class="row" style="margin-bottom:10px"><button class="back" onclick="back()" aria-label="‹">‹</button><h1 style="font-size:22px">${t('profile')}</h1></div>`;
    const d = puData;
    if (!d) return h + `<div class="card mu">${t('loading')}</div>`;
    if (d.error) return h + `<div class="card mu">${t('err')}</div>`;
    const lg = lgIdx(d.league), since = (() => { try { return new Date(d.memberSince).toLocaleDateString(S.lang, { month: 'long', year: 'numeric' }); } catch (e) { return ''; } })();
    h += `<div class="card vx-ar-hero lg-${d.league}" style="text-align:center"><div class="vx-ar-glow" aria-hidden="true"></div><div class="vx-ar-center">${badge(lg, 96, 0)}</div>` +
      `<div class="vx-ar-lg" style="margin-top:6px">${safe(d.username)}</div>` +
      `<div class="mu">${t('league')} ${lgName(lg)} · ${t('level')} ${d.level}${d.online ? ` · <span class="ac">● ${t('online')}</span>` : ''}</div>` +
      `<div class="grid2" style="grid-template-columns:repeat(3,1fr);margin-top:14px">` +
      `<div><b class="big">${fmt(d.week.score)}</b><div class="mu">${t('pts')} ${t('week')}</div></div>` +
      `<div><b class="big">${d.week.rank ? '#' + fmt(d.week.rank) : '—'}</b><div class="mu">${t('tabGlobal')}</div></div>` +
      `<div><b class="big">${d.week.days}</b><div class="mu">${t('days')}</div></div></div>` +
      `<div class="mu" style="margin-top:10px">${t('since')} ${since} · ${fmt(d.xp)} XP</div></div>`;
    if (!d.me) {
      const f = d.friendship;
      h += `<div class="row vx-pu-act" style="gap:8px">${f === 'accepted' ? `<button class="btn s g" disabled>🤝 ${t('friends')}</button>` : f === 'pending' ? `<button class="btn s g" disabled>⏳ ${t('pending')}</button>` : `<button class="btn" onclick="vxPuAdd()">➕ ${t('add')}</button>`}` +
        `<button class="btn s g" onclick="vxPuReportOpen()">🚩 ${t('report')}</button></div>`;
      if (puReport) h += `<div class="card" style="margin-top:10px"><div class="chips">${[['cheating', 'rCheat'], ['offensive_name', 'rName'], ['offensive_content', 'rContent'], ['other', 'rOther']].map(([r, n]) => `<div class="chip" onclick="vxPuReport('${r}')">${t(n)}</div>`).join('')}</div></div>`;
    }
    return h;
  };

  // ── Inserción: Inicio y tarjeta de amigos ──
  if (typeof V.home === 'function') {
    const _home = V.home;
    V.home = function () {
      let h = _home.apply(this, arguments);
      try {
        if (online()) setTimeout(() => loadLb('global'), 0);
        const card = homeCard(), i = h.indexOf('vx-missions');
        if (i !== -1) { const c = h.lastIndexOf('<div class="card', i); h = h.slice(0, c) + card + h.slice(c); } else h = card + h;
      } catch (e) { /* la pantalla original sigue intacta */ }
      return h;
    };
  }
  if (typeof V.soc === 'function') {
    const _soc = V.soc;
    V.soc = function () {
      const h = _soc.apply(this, arguments);
      try { return h + `<button class="btn o" style="margin-top:10px" onclick="go('vx:arena')">🏆 ${t('see')}</button>`; } catch (e) { return h; }
    };
  }
  window.vxArenaReload = () => { lbAt.league = lbAt.global = 0; R(); };
  window.vxArenaMe = me; window.vxArenaLocal = local; window.vxArenaScore = weekScore; // para pruebas
  try { checkPromotion(); R(); } catch (e) { /* la app ya está pintada */ }
})();
