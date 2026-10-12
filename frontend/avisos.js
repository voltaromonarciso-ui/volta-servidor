/* VOLTA · Notificaciones (decisión de los fundadores, 12-10-2026).
     · Plan del día     → 9:00  «⚡ Hoy toca: Pierna · 6 ejercicios»
     · Racha en peligro → 19:00 «🔥 Tu racha de 12 días está en peligro» (solo si hoy aún no has entrenado)
   Cada usuario puede cambiar las horas o apagarlas en Perfil › Ajustes › Notificaciones.
   Liga y amigos llegarán con el servidor.
   Cómo se entregan:
     · App de móvil (Capacitor, plugin LocalNotifications): se programan los avisos de los próximos 7 días y se
       reprograman cada vez que abres la app o terminas un entreno (así el de la tarde no sale si ya has entrenado).
     · Navegador: sin servidor no hay avisos con la app cerrada; mientras Volta está abierta (o en segundo plano)
       se comprueba cada 30 s y, si la app está a la vista, el aviso va al buzón de Volta en vez de al sistema. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined' || typeof V === 'undefined') return;
  const tr = (s) => (window.vxTr ? window.vxTr(s) : s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vx = () => (S.vx && typeof S.vx === 'object' ? S.vx : (S.vx = {}));
  const DEF_PREFS = { plan: 1, planAt: '09:00', streak: 1, streakAt: '19:00', rest: 1 };
  const prefs = () => { const v = vx(); v.nt = Object.assign({}, DEF_PREFS, v.nt && typeof v.nt === 'object' ? v.nt : {}); return v.nt; };
  const dayKey = (d) => lk(d.getTime());
  const trainedOn = (k) => !!(S.done && S.done[k]);
  const at = (base, hhmm) => { const [h, m] = String(hhmm || '00:00').split(':').map((x) => parseInt(x, 10) || 0); const d = new Date(base); d.setHours(h, m, 0, 0); return d; };
  const cap = () => { try { return window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.LocalNotifications; } catch (e) { return null; } };

  // ── Textos ──
  function todayPlan() {
    let r = null;
    try { // igual que el plan de Inicio: la rutina en curso o, si no hay, la que toca por día de la semana
      const L = (S.routines || []).filter((x) => !x.vxAdapt);
      r = (S.routines || []).find((x) => x.id == S.cur) || null;
      if (r && r.vxAdapt) r = L.find((x) => x.id == r.src) || null;
      if (!r && L.length) r = L[((new Date().getDay() + 6) % 7) % L.length];
    } catch (e) { r = null; }
    const list = r ? r.ex : typeof DEF !== 'undefined' ? DEF : [];
    return { name: r ? tr(r.name) : tr('Entrenamiento rápido'), n: list.length };
  }
  function planMsg(isToday) {
    const p = todayPlan();
    return { title: '⚡ ' + tr('Tu plan de hoy'), body: isToday && p.n ? `${tr('Hoy toca')}: ${p.name} · ${p.n} ${tr(p.n === 1 ? 'ejercicio' : 'ejercicios')}` : tr('Zeus tiene listo tu entreno. ¡A por ello!') };
  }
  function streakMsg() {
    const n = Math.max(1, +S.streakCount || 0);
    return { title: '🔥 ' + tr('Tu racha está en peligro'), body: `${n} ${tr(n === 1 ? 'día' : 'días')} · ${tr('Entrena hoy para mantenerla.')}` };
  }

  // ── App de móvil: programar 7 días ──
  const ID = { plan: 9100, streak: 9200 };
  let lastSig = '';
  async function scheduleNative(force) {
    const LN = cap(); if (!LN) return false;
    const P = prefs(), now = new Date(), tk = dayKey(now);
    const sig = JSON.stringify([P, tk, trainedOn(tk), todayPlan(), S.streakCount, S.lang]);
    if (!force && sig === lastSig) return true; lastSig = sig;
    try {
      const pend = await LN.getPending();
      const mine = ((pend && pend.notifications) || []).filter((n) => n.id >= 9100 && n.id < 9300).map((n) => ({ id: n.id }));
      if (mine.length) await LN.cancel({ notifications: mine });
      const out = [];
      for (let d = 0; d < 7; d++) {
        const day = new Date(now); day.setDate(now.getDate() + d);
        const k = dayKey(day);
        if (P.plan) { const t = at(day, P.planAt); if (t > now && !trainedOn(k)) out.push(Object.assign({ id: ID.plan + d, schedule: { at: t, allowWhileIdle: true }, extra: { go: 'home' } }, planMsg(d === 0))); }
        if (P.streak) { const t = at(day, P.streakAt); if (t > now && !trainedOn(k)) out.push(Object.assign({ id: ID.streak + d, schedule: { at: t, allowWhileIdle: true }, extra: { go: 'home' } }, streakMsg())); }
      }
      if (out.length) await LN.schedule({ notifications: out });
      return true;
    } catch (e) { return false; }
  }

  // ── Navegador: comprobar mientras la app está viva ──
  function showWeb(msg, tag) {
    if (document.visibilityState === 'visible') { if (window.vxPushInbox) window.vxPushInbox(msg.title.slice(0, 2), msg.title.slice(2).trim() + ' · ' + msg.body, "tab('home')"); return; }
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    const opts = { body: msg.body, icon: 'icon-192.png', badge: 'icon-192.png', tag: 'volta-' + tag };
    const show = (reg) => (reg ? reg.showNotification(msg.title, opts) : new Notification(msg.title, opts));
    try { (navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null)).then(show).catch(() => show(null)); } catch (e) { /* sin avisos */ }
  }
  function tickWeb(now) {
    if (cap()) return;
    now = now || new Date();
    const P = prefs(), tk = dayKey(now), v = vx(); v.ntSent = v.ntSent && typeof v.ntSent === 'object' ? v.ntSent : {};
    const due = (k, hhmm) => { const t = at(now, hhmm); return now >= t && now - t < 3 * 36e5 && v.ntSent[k] !== tk; };
    if (P.plan && due('plan', P.planAt)) { v.ntSent.plan = tk; if (!trainedOn(tk)) showWeb(planMsg(true), 'plan'); }
    if (P.streak && due('streak', P.streakAt)) { v.ntSent.streak = tk; if (!trainedOn(tk)) showWeb(streakMsg(), 'streak'); }
  }
  window.vxNtTick = tickWeb; // para pruebas
  window.vxNtMsgs = () => ({ plan: planMsg(true), streak: streakMsg() });
  window.vxNtSchedule = scheduleNative;
  setInterval(() => { try { tickWeb(); } catch (e) { /* sin avisos */ } }, 30000);
  document.addEventListener('visibilitychange', () => { try { tickWeb(); scheduleNative(); } catch (e) { /* sin avisos */ } });
  setTimeout(() => { try { tickWeb(); scheduleNative(true); } catch (e) { /* sin avisos */ } }, 1500);

  // tras cada repintado (entreno terminado, cambio de rutina…), reprograma si algo cambió
  const _R = R;
  R = function () { _R.apply(this, arguments); try { clearTimeout(R._nt); R._nt = setTimeout(() => scheduleNative(), 800); } catch (e) { /* sin avisos */ } };

  // ── Permiso ──
  // en la app de móvil el permiso se consulta al plugin (Android 13+ e iOS lo piden la primera vez)
  let natPerm = 'unknown';
  const natRefresh = () => { const LN = cap(); if (!LN || !LN.checkPermissions) return; LN.checkPermissions().then((r) => { const was = natPerm; natPerm = (r && r.display) || 'unknown'; if (was !== natPerm && S.stack && S.stack[S.stack.length - 1] === 's:notif') R(); }).catch(() => {}); };
  setTimeout(natRefresh, 1200);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') natRefresh(); });
  function perm() {
    if (cap()) return /^prompt/.test(natPerm) ? 'default' : natPerm === 'denied' ? 'denied' : 'app';
    if (!('Notification' in window)) return 'none';
    return Notification.permission; // default | granted | denied
  }
  window.vxNtAsk = async () => {
    try {
      const LN = cap();
      if (LN) { const r = await LN.requestPermissions(); natPerm = (r && r.display) || natPerm; await scheduleNative(true); }
      else if ('Notification' in window && Notification.permission === 'default') await Notification.requestPermission();
    } catch (e) { /* sin permiso */ }
    R();
  };
  // la primera serie registrada pide el permiso en el móvil (como ya hace el navegador)
  if (typeof doneSet === 'function') { const _ds = doneSet; doneSet = function () { try { if (cap() && /^prompt/.test(natPerm)) window.vxNtAsk(); } catch (e) { /* sin permiso */ } return _ds.apply(this, arguments); }; }
  window.vxNtSet = (k, v) => { const P = prefs(); if (k === 'planAt' || k === 'streakAt') { if (/^\d{2}:\d{2}$/.test(v)) P[k] = v; } else P[k] = P[k] ? 0 : 1; lastSig = ''; R(); };
  window.vxNtTest = () => { const m = planMsg(true); if (perm() === 'granted') { const opts = { body: m.body, icon: 'icon-192.png', tag: 'volta-test' }; try { (navigator.serviceWorker ? navigator.serviceWorker.getRegistration() : Promise.resolve(null)).then((reg) => (reg ? reg.showNotification(m.title, opts) : new Notification(m.title, opts))).catch(() => new Notification(m.title, opts)); } catch (e) { /* sin aviso */ } } else if (cap()) { cap().schedule({ notifications: [Object.assign({ id: 9099, schedule: { at: new Date(Date.now() + 2000) } }, m)] }).catch(() => {}); } if (typeof toast === 'function') toast(m.title + ' · ' + m.body); };

  // ── Ajustes › Notificaciones ──
  const sw = (on, k, label) => `<div class="tg ${on ? 'on' : ''}" role="switch" tabindex="0" aria-checked="${!!on}" aria-label="${esc(label)}" onclick="vxNtSet('${k}')" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();vxNtSet('${k}')}"></div>`;
  const row = (ic, title, sub, k, atK) => {
    const P = prefs();
    return `<div class="card vx-nt-row"><div class="row sp"><div class="row" style="gap:10px"><span class="vx-nt-ic" aria-hidden="true">${ic}</span><div class="g"><b>${tr(title)}</b><div class="mu">${tr(sub)}</div></div></div>${sw(P[k], k, tr(title))}</div>` +
      (atK ? `<label class="row sp vx-nt-time${P[k] ? '' : ' off'}"><span class="mu">${tr('Hora')}</span><input type="time" value="${esc(P[atK])}" ${P[k] ? '' : 'disabled'} onchange="vxNtSet('${atK}',this.value)" aria-label="${esc(tr(title) + ' · ' + tr('Hora'))}"></label>` : '') + '</div>';
  };
  V['s:notif'] = function () {
    const p = perm();
    let h = bk(tr('Notificaciones'));
    if (p === 'default') h += `<div class="card vx-nt-perm"><b>🔔 ${tr('Activa los avisos')}</b><div class="mu">${tr('Para recibir tu plan del día y no perder la racha.')}</div><button class="btn sm" onclick="vxNtAsk()">${tr('Activar avisos')}</button></div>`;
    else if (p === 'denied') h += `<div class="card vx-nt-perm warn"><b>🔕 ${tr('Avisos bloqueados')}</b><div class="mu">${tr('Actívalos en los ajustes de tu navegador o de tu móvil para Volta.')}</div></div>`;
    else if (p === 'none') h += `<div class="card vx-nt-perm warn"><div class="mu">${tr('Este navegador no permite avisos.')}</div></div>`;
    h += row('⚡', 'Plan del día', 'Qué toca entrenar hoy', 'plan', 'planAt');
    h += row('🔥', 'Racha en peligro', 'Solo si hoy aún no has entrenado', 'streak', 'streakAt');
    h += row('⏱️', 'Fin del descanso', 'Con la pantalla bloqueada', 'rest');
    h += `<div class="card vx-nt-row off"><div class="row" style="gap:10px"><span class="vx-nt-ic" aria-hidden="true">🏆</span><div class="g"><b>${tr('Liga y amigos')}</b><div class="mu">${tr('Llegará con las cuentas de Volta')}</div></div></div></div>`;
    h += `<button class="btn o" onclick="vxNtTest()">${tr('Probar aviso')}</button>`;
    if (!cap()) h += `<div class="mu vx-nt-foot">${tr('En el navegador, los avisos llegan mientras Volta está abierta. En la app del móvil llegan siempre.')}</div>`;
    return h;
  };

  if (window.vxAddTr) window.vxAddTr(`
Tu plan de hoy|Your plan for today|Ton plan du jour|O teu plano de hoje
Hoy toca|Today's workout|Au programme|Hoje toca
Zeus tiene listo tu entreno. ¡A por ello!|Zeus has your workout ready. Let's go!|Zeus a préparé ta séance. C’est parti !|O Zeus tem o teu treino pronto. Vamos!
Tu racha está en peligro|Your streak is in danger|Ta série est en danger|A tua sequência está em perigo
día|day|jour|dia
días|days|jours|dias
Entrena hoy para mantenerla.|Train today to keep it alive.|Entraîne-toi aujourd’hui pour la garder.|Treina hoje para a manter.
Activa los avisos|Turn on reminders|Active les rappels|Ativa os avisos
Para recibir tu plan del día y no perder la racha.|To get your daily plan and keep your streak.|Pour recevoir ton plan du jour et garder ta série.|Para receber o teu plano do dia e não perder a sequência.
Activar avisos|Turn on reminders|Activer les rappels|Ativar avisos
Avisos bloqueados|Reminders blocked|Rappels bloqués|Avisos bloqueados
Actívalos en los ajustes de tu navegador o de tu móvil para Volta.|Turn them on in your browser or phone settings for Volta.|Active-les dans les réglages de ton navigateur ou de ton téléphone pour Volta.|Ativa-os nas definições do teu navegador ou telemóvel para o Volta.
Este navegador no permite avisos.|This browser doesn't support reminders.|Ce navigateur ne permet pas les rappels.|Este navegador não permite avisos.
Plan del día|Daily plan|Plan du jour|Plano do dia
Qué toca entrenar hoy|What to train today|Ce que tu entraînes aujourd’hui|O que treinar hoje
Racha en peligro|Streak in danger|Série en danger|Sequência em perigo
Solo si hoy aún no has entrenado|Only if you haven't trained yet today|Seulement si tu ne t’es pas encore entraîné aujourd’hui|Só se ainda não treinaste hoje
Fin del descanso|Rest finished|Fin du repos|Fim do descanso
Con la pantalla bloqueada|With the screen locked|Écran verrouillé|Com o ecrã bloqueado
Liga y amigos|League and friends|Ligue et amis|Liga e amigos
Llegará con las cuentas de Volta|Coming with Volta accounts|Arrive avec les comptes Volta|Chega com as contas Volta
Probar aviso|Test reminder|Tester un rappel|Testar aviso
Hora|Time|Heure|Hora
En el navegador, los avisos llegan mientras Volta está abierta. En la app del móvil llegan siempre.|In the browser, reminders arrive while Volta is open. In the phone app they always arrive.|Dans le navigateur, les rappels arrivent tant que Volta est ouvert. Dans l’app mobile, ils arrivent toujours.|No navegador, os avisos chegam enquanto o Volta está aberto. Na app do telemóvel chegam sempre.
`);
})();
