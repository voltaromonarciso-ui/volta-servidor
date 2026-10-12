/* VOLTA · Entreno adaptado por Zeus (decisión de los fundadores, 12-10-2026).
   Al pulsar «Empezar entreno», Zeus pregunta en una sola pantalla: tiempo, sueño, dolor y lugar (se puede saltar
   y desactivar en Ajustes › General). Con las respuestas adapta la sesión de hoy con reglas fijas (plan gratis; en
   Pro lo hará la IA):
     · Poco tiempo  → menos ejercicios con las mismas series (se quedan los compuestos, fuera los accesorios).
     · Dormí mal    → mismos ejercicios con ~10 % menos de peso propuesto.
     · Dolor        → los ejercicios que cargan esa zona se cambian por otros seguros (o se quitan) y se avisa de
                      consultar a un profesional si el dolor es fuerte o no se va.
     · Casa / nada  → cada ejercicio se cambia por un equivalente con mancuernas, bandas o peso corporal.
   La sesión adaptada es una copia de la rutina de hoy (no cambia tu rutina) que se borra al empezar otra o al día siguiente. */
(function () {
  'use strict';
  if (typeof R !== 'function' || typeof S === 'undefined' || typeof V === 'undefined' || typeof EX === 'undefined' || typeof playToday !== 'function') return;
  const tr = (s) => (window.vxTr ? window.vxTr(s) : s);
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const vx = () => (S.vx && typeof S.vx === 'object' ? S.vx : (S.vx = {}));
  const today = () => lk(Date.now());
  const AID = 777000; // id de la sesión adaptada
  const isAd = (r) => !!(r && r.vxAdapt);
  const pat = (i) => { try { return window.vxPattern ? window.vxPattern(EX[i]) : ''; } catch (e) { return ''; } };
  const grp = (i) => EX[i] && EX[i][1], eq = (i) => EX[i] && EX[i][4];

  const COMPOUND = new Set(['bench', 'incline', 'pullup', 'row', 'ohp', 'squat', 'thrust', 'pulldown', 'legpress', 'pushup', 'dip', 'hinge', 'lunge', 'swing']);
  const GUIDED = new Set(['Máquina', 'Polea', 'Smith']);
  const PLACES = { gym: null, home: new Set(['Mancuernas', 'Peso corporal', 'Bandas', 'Kettlebell']), none: new Set(['Peso corporal']) };
  // Qué evita cada zona con dolor (patrón de movimiento; algunos solo si no van guiados en máquina/polea)
  const PAIN = {
    shoulder: { avoid: ['ohp', 'lateral', 'front', 'dip', 'overhead', 'pullup', 'fly', 'skull'], unlessGuided: ['bench', 'incline', 'pushup'] },
    back: { avoid: ['hinge', 'swing', 'backext', 'prone', 'jump', 'carry', 'shrug', 'lunge'], unlessGuided: ['squat', 'row', 'ohp'], fallback: { 'Lumbar': 'Core' } },
    knee: { avoid: ['squat', 'lunge', 'legext', 'jump', 'legpress'], fallback: { 'Cuádriceps': 'Glúteos', 'Abductores': 'Glúteos', 'Aductores': 'Glúteos' } },
    elbow: { avoid: ['curl', 'skull', 'pushdown', 'overhead', 'wrist', 'hang', 'dip', 'pushup', 'carry'] },
  };
  const hurts = (zone, i) => {
    const z = PAIN[zone]; if (!z) return false;
    const p = pat(i);
    if (z.avoid.includes(p)) return true;
    if (z.unlessGuided && z.unlessGuided.includes(p) && !GUIDED.has(eq(i))) return true;
    if (zone === 'back' && grp(i) === 'Lumbar') return true;
    return false;
  };

  // Mejor sustituto: mismo grupo (o el de reserva), material permitido, que no cargue la zona; mismo patrón, mismas alternativas
  function pick(orig, { place, pain, used, group }) {
    const g = group || grp(orig), p = pat(orig), alt = (EX[orig] && EX[orig].alt) || [];
    let best = -1, bs = -1e9;
    for (let j = 0; j < EX.length; j++) {
      if (j === orig || used.has(j) || grp(j) !== g) continue;
      if (place && !place.has(eq(j))) continue;
      if (pain && hurts(pain, j)) continue;
      let s = 0;
      if (pat(j) === p) s += 5;
      if (alt.includes(j)) s += 3;
      if (EX[j].head && EX[j].head === EX[orig].head) s += 2;
      if (pain && GUIDED.has(eq(j))) s += 1;
      if (EX[j][5] === 'Avanzado' && EX[orig][5] !== 'Avanzado') s -= 2;
      if (COMPOUND.has(p) && COMPOUND.has(pat(j))) s += 1;
      if (s > bs) { bs = s; best = j; }
    }
    return best;
  }
  // Línea de un cambio (cada nombre en su propio elemento para que se traduzca)
  const exn = (i) => `<span>${esc(EX[i] ? EX[i][0] : '')}</span>`;
  const line = (c) => `<span class="vx-ck-ic" aria-hidden="true">${c.ic}</span> ` + (c.t ? `<span>${esc(tr(c.t))}</span>` : exn(c.a) + (c.b != null ? ' → ' + exn(c.b) : ` <span class="mu">· ${tr(WHY[c.k])}</span>`));
  const WHY = { pain: 'fuera por dolor', time: 'fuera por tiempo', place: 'sin material' };
  // minutos de un ejercicio: ~45 s por serie, descanso entre series y 1 min para cambiar de ejercicio
  const minutes = (c) => { const n = +c.sets || 3; return (n * 45 + (n - 1) * (+c.rest || 90)) / 60 + 1; };

  // Adapta una lista de ejercicios. Devuelve { ex, load, changes:[{k,txt}] }
  function adapt(list, a) {
    const out = list.map((c) => Object.assign({}, c)), changes = [];
    const place = PLACES[a.l] || null, pain = PAIN[a.d] ? a.d : null;
    const used = new Set(out.map((c) => c.i));
    const drop = new Set();
    out.forEach((c, k) => {
      const badPlace = place && !place.has(eq(c.i)), badPain = pain && hurts(pain, c.i);
      if (!badPlace && !badPain) return;
      let j = pick(c.i, { place, pain, used });
      const fb = pain && PAIN[pain].fallback && PAIN[pain].fallback[grp(c.i)];
      if (j < 0 && fb) j = pick(c.i, { place, pain, used, group: fb });
      if (j < 0) { drop.add(k); changes.push({ k: badPain ? 'pain' : 'place', ic: '✕', a: c.i }); return; }
      changes.push({ k: badPain ? 'pain' : 'place', ic: '⇄', a: c.i, b: j });
      used.add(j); c.i = j;
    });
    let ex = out.filter((c, k) => !drop.has(k));
    // tiempo: fuera accesorios (desde el final), luego compuestos; mínimo 2 ejercicios
    const budget = a.t === '20' ? 20 : a.t === '40' ? 40 : 0;
    if (budget) {
      const total = () => ex.reduce((s, c) => s + minutes(c), 0);
      const order = ex.map((c, k) => ({ c, k, comp: COMPOUND.has(pat(c.i)) })).sort((x, y) => (x.comp - y.comp) || (y.k - x.k));
      for (const o of order) {
        if (total() <= budget || ex.length <= 2) break;
        ex = ex.filter((c) => c !== o.c); changes.push({ k: 'time', ic: '✂', a: o.c.i });
      }
    }
    const load = a.s === 'bad' ? 0.9 : 1;
    if (load < 1) changes.push({ k: 'sleep', ic: '⬇', t: '−10 % de peso en todas las series' });
    return { ex, load, changes };
  }

  // ── Sesión de hoy y limpieza ──
  const baseRoutine = () => {
    let r = S.routines.find((x) => x.id == S.cur);
    if (isAd(r)) r = S.routines.find((x) => x.id == r.src) || null;
    if (!r && S.routines.length) { const real = S.routines.filter((x) => !isAd(x)); r = real.length ? real[((new Date().getDay() + 6) % 7) % real.length] : null; }
    return r;
  };
  function clean(keepToday) {
    const r = S.routines.find(isAd);
    if (!r || (keepToday && r.day === today())) return;
    S.routines = S.routines.filter((x) => !isAd(x));
    if (S.cur == AID) S.cur = r.src != null ? r.src : 0;
  }
  clean(true);

  const answers = () => { const v = vx(); v.ck = Object.assign({ t: '60', s: 'ok', d: 'no', l: v.ckPlace || 'gym' }, v.ck && v.ck.day === today() ? v.ck : {}); return v.ck; };
  window.vxCkSet = (k, val) => { const a = answers(); a[k] = val; a.day = today(); if (k === 'l') vx().ckPlace = val; R(); };
  window.vxCkSkip = () => { clean(false); S.stack = []; _play(); };
  window.vxCkGo = () => {
    const a = answers(), base = baseRoutine(), list = base ? base.ex : DEF, res = adapt(list, a);
    clean(false);
    if (!res.changes.length) { S.stack = []; if (base) S.cur = base.id; _play(); return; }
    const r = { id: AID, vxAdapt: true, src: base ? base.id : null, day: today(), name: base ? base.name : tr('Entrenamiento rápido'), focus: base ? base.focus : '', days: base ? base.days : 0, ex: res.ex, vxLoad: res.load, vxNote: res.changes, vxPain: a.d !== 'no' ? a.d : '' };
    S.routines.push(r); S.cur = AID; S.stack = []; S.edit = false;
    startR(AID);
  };
  window.vxCkOff = () => { vx().ckOff = vx().ckOff ? 0 : 1; R(); };
  window.vxAdapt = adapt; // para pruebas

  // «Empezar entreno» pasa antes por el check-in (salvo desactivado o sesión adaptada ya hecha hoy)
  const _play = playToday;
  playToday = function () {
    if (vx().ckOff || (S.done && S.done[today()])) { const b = baseRoutine(); clean(false); if (b) S.cur = b.id; return _play.apply(this, arguments); }
    S.stack = []; go('vx:check');
  };
  // otra rutina → fuera la sesión adaptada
  const _start = startR;
  startR = function (id) { if (id != AID) clean(false); return _start.apply(this, arguments); };

  const ZONES = [['no', 'No'], ['shoulder', 'Hombro'], ['back', 'Espalda baja'], ['knee', 'Rodilla'], ['elbow', 'Codo o muñeca']];
  const ROWS = [
    ['t', '⏱️', '¿Cuánto tiempo tienes?', [['20', '20 min'], ['40', '30–45 min'], ['60', '60 min o más']]],
    ['s', '😴', '¿Qué tal has dormido?', [['ok', 'Bien'], ['meh', 'Regular'], ['bad', 'Mal']]],
    ['d', '🩹', '¿Te duele algo?', ZONES],
    ['l', '📍', '¿Dónde entrenas hoy?', [['gym', 'Gimnasio'], ['home', 'Casa (mancuernas)'], ['none', 'Sin material']]],
  ];
  V['vx:check'] = function () {
    const a = answers(), base = baseRoutine(), res = adapt(base ? base.ex : DEF, a);
    const z = typeof window.vxZeus === 'function' ? window.vxZeus('piensa', 84) : '';
    let h = bk(tr('Antes de empezar'));
    h += `<div class="card vx-ck-head">${z}<div><b>${tr('¿Cómo vienes hoy?')}</b><div class="mu">${tr('Adapto tu entreno en un momento.')}</div></div></div>`;
    ROWS.forEach(([k, ic, q, opts]) => {
      h += `<div class="vx-ck-q" role="group" aria-label="${esc(tr(q))}"><div class="vx-ck-l"><span aria-hidden="true">${ic}</span>${tr(q)}</div><div class="vx-ck-opts">` +
        opts.map(([v, l]) => `<button type="button" class="chip${a[k] === v ? ' on' : ''}" aria-pressed="${a[k] === v}" onclick="vxCkSet('${k}','${v}')">${tr(l)}</button>`).join('') + '</div></div>';
    });
    const name = base ? esc(base.name) : tr('Entrenamiento rápido');
    h += `<div class="card vx-ck-prev"><div class="row sp"><b>${name}</b><span class="mu">${res.ex.length} ${tr(res.ex.length === 1 ? 'ejercicio' : 'ejercicios')}</span></div>` +
      (res.changes.length ? '<ul>' + res.changes.map((c) => `<li class="vx-ck-${c.k}">${line(c)}</li>`).join('') + '</ul>' : `<div class="mu">${tr('Sin cambios: tu entreno de siempre.')}</div>`) +
      (a.d !== 'no' ? `<div class="vx-ck-warn" role="note">⚠️ ${tr('Si el dolor es fuerte o no se va, para y consulta a un profesional sanitario.')}</div>` : '') + '</div>';
    h += `<button class="btn vx-ck-go" onclick="vxCkGo()">⚡ ${tr(res.changes.length ? 'Empezar entreno adaptado' : 'Empezar entreno')}</button>`;
    h += `<button class="btn o vx-ck-skip" onclick="vxCkSkip()">${tr('Saltar')}</button>`;
    h += `<div class="mu vx-ck-foot">${tr('Puedes desactivar estas preguntas en Ajustes › General.')}</div>`;
    return h;
  };

  // Ajustes › General: interruptor
  const _gen = V['s:general'];
  if (typeof _gen === 'function') {
    V['s:general'] = function () {
      const on = !vx().ckOff;
      return _gen.apply(this, arguments) + `<div class="card row sp vx-ck-set"><div class="g"><b>${tr('Preguntas de Zeus antes de entrenar')}</b><div class="mu">${tr('Tiempo, sueño, dolor y lugar para adaptar tu entreno.')}</div></div><div class="tg ${on ? 'on' : ''}" role="switch" tabindex="0" aria-checked="${on}" aria-label="${esc(tr('Preguntas de Zeus antes de entrenar'))}" onclick="vxCkOff()" onkeydown="if(event.key===' '||event.key==='Enter'){event.preventDefault();vxCkOff()}"></div></div>`;
    };
  }

  // «Mis rutinas» no muestra la sesión adaptada
  const _rt = V.routines;
  if (typeof _rt === 'function') V.routines = function () { const keep = S.routines; S.routines = keep.filter((x) => !isAd(x)); try { return _rt.apply(this, arguments); } finally { S.routines = keep; } };

  // Aviso en la pantalla del entreno
  window.vxCkNoteOpen = () => { S.vxCkOpen = !S.vxCkOpen; R(); };
  const _R = R;
  R = function () {
    _R.apply(this, arguments);
    try {
      const top = S.stack && S.stack.length ? S.stack[S.stack.length - 1] : '';
      if (top !== 'work') return;
      const r = S.routines.find((x) => x.id == S.cur); if (!isAd(r) || !r.vxNote) return;
      const m = document.getElementById('m'); if (!m || m.querySelector('.vx-ck-note')) return;
      const anchor = m.querySelector('.vx-sr-top') || m.querySelector('.row');
      if (!anchor) return;
      const n = document.createElement('div'); n.className = 'card vx-ck-note';
      n.innerHTML = `<button type="button" class="vx-ck-nh" onclick="vxCkNoteOpen()" aria-expanded="${!!S.vxCkOpen}"><span aria-hidden="true">⚡</span><b>${tr('Zeus ha adaptado tu entreno')}</b><span class="mu">${r.vxNote.length} ${tr(r.vxNote.length === 1 ? 'cambio' : 'cambios')} ${S.vxCkOpen ? '▴' : '▾'}</span></button>` +
        (S.vxCkOpen ? '<ul>' + r.vxNote.map((c) => `<li class="vx-ck-${c.k}">${line(c)}</li>`).join('') + '</ul>' : '') +
        (r.vxPain ? `<div class="vx-ck-warn">⚠️ ${tr('Si el dolor es fuerte o no se va, para y consulta a un profesional sanitario.')}</div>` : '');
      anchor.after(n);
    } catch (e) { /* sin aviso */ }
  };

  if (window.vxAddTr) window.vxAddTr(`
Antes de empezar|Before you start|Avant de commencer|Antes de começar
¿Cómo vienes hoy?|How are you feeling today?|Comment tu te sens aujourd’hui ?|Como estás hoje?
Adapto tu entreno en un momento.|I'll adapt your workout in a moment.|J’adapte ta séance en un instant.|Adapto o teu treino num instante.
¿Cuánto tiempo tienes?|How much time do you have?|Combien de temps as-tu ?|Quanto tempo tens?
¿Qué tal has dormido?|How did you sleep?|Comment as-tu dormi ?|Como dormiste?
¿Te duele algo?|Does anything hurt?|As-tu mal quelque part ?|Dói-te alguma coisa?
¿Dónde entrenas hoy?|Where are you training today?|Où t’entraînes-tu aujourd’hui ?|Onde treinas hoje?
20 min|20 min|20 min|20 min
30–45 min|30–45 min|30–45 min|30–45 min
60 min o más|60 min or more|60 min ou plus|60 min ou mais
Bien|Good|Bien|Bem
Regular|So-so|Moyen|Mais ou menos
Mal|Badly|Mal|Mal
No|No|Non|Não
Hombro|Shoulder|Épaule|Ombro
Espalda baja|Lower back|Bas du dos|Lombar
Rodilla|Knee|Genou|Joelho
Codo o muñeca|Elbow or wrist|Coude ou poignet|Cotovelo ou pulso
Gimnasio|Gym|Salle|Ginásio
Casa (mancuernas)|Home (dumbbells)|Maison (haltères)|Casa (halteres)
Sin material|No equipment|Sans matériel|Sem material
ejercicios|exercises|exercices|exercícios
ejercicio|exercise|exercice|exercício
fuera por dolor|removed for pain|retiré pour la douleur|removido por dor
fuera por tiempo|removed for time|retiré faute de temps|removido por tempo
sin material|no equipment|sans matériel|sem material
Sin cambios: tu entreno de siempre.|No changes: your usual workout.|Aucun changement : ta séance habituelle.|Sem alterações: o teu treino de sempre.
Si el dolor es fuerte o no se va, para y consulta a un profesional sanitario.|If the pain is strong or doesn't go away, stop and see a healthcare professional.|Si la douleur est forte ou persiste, arrête et consulte un professionnel de santé.|Se a dor for forte ou não passar, para e consulta um profissional de saúde.
Empezar entreno adaptado|Start adapted workout|Commencer la séance adaptée|Começar treino adaptado
Empezar entreno|Start workout|Commencer la séance|Começar treino
Saltar|Skip|Passer|Saltar
Puedes desactivar estas preguntas en Ajustes › General.|You can turn these questions off in Settings › General.|Tu peux désactiver ces questions dans Réglages › Général.|Podes desativar estas perguntas em Definições › Geral.
Preguntas de Zeus antes de entrenar|Zeus's questions before training|Questions de Zeus avant l’entraînement|Perguntas do Zeus antes de treinar
Tiempo, sueño, dolor y lugar para adaptar tu entreno.|Time, sleep, pain and place to adapt your workout.|Temps, sommeil, douleur et lieu pour adapter ta séance.|Tempo, sono, dor e local para adaptar o teu treino.
Zeus ha adaptado tu entreno|Zeus adapted your workout|Zeus a adapté ta séance|O Zeus adaptou o teu treino
cambio|change|changement|alteração
cambios|changes|changements|alterações
−10 % de peso en todas las series|−10% weight on every set|−10 % de charge sur chaque série|−10% de peso em todas as séries
Entrenamiento rápido|Quick workout|Séance rapide|Treino rápido
`);
})();
