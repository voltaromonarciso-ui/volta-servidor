/* VOLTA · Registro de series (diseño de los fundadores, 12-10-2026).
   Todas las series del ejercicio a la vista, cada una con su peso, sus repeticiones y lo que hiciste la última vez:
     [W] 30 kg · 10 reps ✓     calentamiento (no cuenta como serie efectiva)
     [1] 45 kg · 10 reps ✓
     [2] 50 kg ·  8 reps ○     ← la siguiente, ya rellenada con tu objetivo
   Arriba, el descanso con su anillo; abajo, «Añadir serie» y los siguientes ejercicios.
   Por dentro usa lo mismo que antes (w9log/doneSet, fin, nextEx): Voltios, récords, descanso e historial no cambian.
   La edición de una sesión ya terminada y las ventanas (reemplazar, añadir ejercicio) siguen con la pantalla anterior. */
(function () {
  'use strict';
  if (typeof V === 'undefined' || typeof V.work !== 'function' || typeof cfg !== 'function') return;
  const esc2 = (x) => String(x == null ? '' : x).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]));
  const today = () => lk(Date.now());
  const num = (v) => { const n = parseFloat(String(v == null ? '' : v).replace(',', '.')); return isFinite(n) ? n : null; };
  const fmtN = (n) => (n == null ? '' : String(Math.round(n * 100) / 100));
  const unit = () => (S.units && S.units.w) || 'kg';
  const routine = () => S.routines.find((x) => x.id == S.cur);
  const list = () => { const r = routine(); return r ? r.ex : DEF; };
  const keyOf = (c) => S.cur + ':' + S.wi + ':' + c.i;
  const drafts = (k) => { S.vxd = S.vxd && typeof S.vxd === 'object' ? S.vxd : {}; if (!S.vxd[k]) S.vxd = { [k]: {} }; return S.vxd[k]; };

  // Series de hoy y de la última sesión de este ejercicio
  function history(i) {
    const td = today(), src = typeof getLog === 'function' ? getLog() : (S.log || []), all = src.filter((l) => l.ex == i);
    const now = all.filter((l) => lk(l.t) === td).sort((a, b) => a.t - b.t);
    const past = all.filter((l) => lk(l.t) < td);
    let prev = [];
    if (past.length) { const d = past.reduce((m, l) => (lk(l.t) > m ? lk(l.t) : m), ''); prev = past.filter((l) => lk(l.t) === d).sort((a, b) => a.t - b.t); }
    const W = (a) => a.filter((l) => l.ty === 'warmup'), E = (a) => a.filter((l) => l.ty !== 'warmup');
    return { nowW: W(now), nowE: E(now), prevW: W(prev), prevE: E(prev), now };
  }
  function rows(c) {
    const h = history(c.i), k = keyOf(c), out = [];
    h.nowW.forEach((l, n) => out.push({ id: 'w' + n, warm: true, done: true, w: l.w, r: l.r, last: h.prevW[n], log: l }));
    const skipW = (S.vxNoW || {})[k];
    if (!h.nowW.length && !h.nowE.length && !skipW) out.push({ id: 'w0', warm: true, done: false, last: h.prevW[0] });
    h.nowE.forEach((l, n) => out.push({ id: 'e' + n, n: n + 1, done: true, w: l.w, r: l.r, last: h.prevE[n], log: l }));
    for (let n = h.nowE.length; n < (c.sets || 3); n++) out.push({ id: 'e' + n, n: n + 1, done: false, last: h.prevE[n] });
    // valores propuestos para las series pendientes
    const d = drafts(k), lastDone = h.nowE[h.nowE.length - 1], lo = parseInt(String(c.reps)) || 10;
    // objetivo de hoy (sobrecarga progresiva): se guarda la primera vez para que no lo pise lo que vas registrando
    S.vxTgt = S.vxTgt && typeof S.vxTgt === 'object' ? S.vxTgt : {};
    if (S.wk && S.wk.k === k && !S.wk.sr && num(S.wk.w) != null) S.vxTgt = { [k]: { w: num(S.wk.w), r: num(S.wk.r) } };
    const target = S.vxTgt[k] || null;
    const ref = target || (lastDone ? { w: lastDone.w, r: lastDone.r } : null) || (typeof lastOf === 'function' && lastOf(c.i) ? { w: lastOf(c.i).w, r: lastOf(c.i).r } : null);
    let first = true, firstEff = true;
    out.forEach((x) => {
      if (x.done) return;
      if (d[x.id]) { x.w = d[x.id].w; x.r = d[x.id].r; } else if (x.warm) {
        const base = ref && ref.w ? ref.w : (x.last ? x.last.w : 0);
        x.w = x.last ? x.last.w : base ? Math.max(0, Math.round(base * 0.5 / 2.5) * 2.5) : '';
        x.r = x.last ? x.last.r : 10;
      } else {
        const src = firstEff && target ? target : (x.last || ref); firstEff = false;
        x.w = src ? src.w : ''; x.r = src ? src.r : lo;
      }
      x.act = first; first = false;
    });
    return out;
  }

  function rowHTML(x, k) {
    const badge = x.warm ? 'W' : x.n;
    const lw = x.last ? fmtN(x.last.w) + ' ' + unit() : '—', lr = x.last ? x.last.r + ' reps' : '—';
    const cls = 'vx-sr-row' + (x.done ? ' done' : '') + (x.act ? ' act' : '') + (x.warm ? ' warm' : '');
    const bAttr = x.warm && !x.done ? ` role="button" tabindex="0" onclick="vxSrNoW('${k}')" aria-label="Quitar calentamiento" title="Quitar calentamiento"` : '';
    const inp = (f, v, lab) => x.done
      ? `<span class="vx-sr-val">${esc2(fmtN(v))} ${lab}</span>`
      : `<label class="vx-sr-in"><input type="number" inputmode="decimal" min="0" step="any" value="${esc2(fmtN(v))}" style="width:${Math.max(2, String(fmtN(v)).length) + 0.6}ch" data-row="${x.id}" data-f="${f}" oninput="this.style.width=(Math.max(2,this.value.length)+0.6)+'ch';vxSrDraft('${k}','${x.id}','${f}',this.value)" onfocus="this.select()" aria-label="${lab}"><span>${lab}</span></label>`;
    const ok = x.done
      ? `<button class="vx-sr-ok on" onclick="vxSrUndo(${(S.log || []).indexOf(x.log)})" aria-label="Serie hecha (tocar para borrarla)">✓</button>`
      : `<button class="vx-sr-ok" onclick="vxSrDone('${x.id}')" aria-label="Completar serie">✓</button>`;
    return `<div class="${cls}" data-id="${x.id}"><span class="vx-sr-n"${bAttr}>${badge}</span>` +
      `<div class="vx-sr-c">${inp('w', x.w, unit())}<span class="vx-sr-last">Última: ${esc2(lw)}</span></div>` +
      `<div class="vx-sr-c">${inp('r', x.r, 'reps')}<span class="vx-sr-last">${x.last ? 'Última: ' + esc2(lr) : '&nbsp;'}</span></div>${ok}</div>`;
  }

  function restHTML(c) {
    const w = S.w || {}, rs = typeof restOf === 'function' ? restOf(c) : c.rest || 90;
    if (w.on) {
      const r = rem();
      return `<div class="card vx-sr-rest on">${ring(r / (w.tot || rs), `<div id="tm" class="vx-sr-tm">${fmt(r)}</div>`, 74)}<div class="g"><b>Descanso</b>${w.xt ? `<div class="mu" style="font-size:12px">+${w.xt} s por esfuerzo alto</div>` : ''}<div class="row vx-sr-rc"><button class="chip" onclick="tick(-15)">−15s</button><button class="chip" onclick="tick(15)">+15s</button><button class="chip on" onclick="skip()">Saltar</button></div></div></div>`;
    }
    return `<div class="card vx-sr-rest">${ring(1, `<div class="vx-sr-tm">${fmt(rs)}</div>`, 74)}<div class="g"><b>Descanso</b><div class="mu" style="font-size:12px">Empieza solo al completar una serie</div></div></div>`;
  }

  function upcoming() {
    const L = list(), out = [];
    for (let j = S.wi + 1; j < L.length; j++) { const x = L[j]; if (x && EX[x.i]) out.push({ j, x }); }
    return out;
  }

  const _work = V.work;
  V.work = function () {
    const prev = _work.apply(this, arguments);
    try {
      if ((S.done && S.done[today()] && !S.edit) || S.edit || S.rpl || S.addm) return prev;
      const c = cfg(), e = EX[c.i]; if (!e) return prev;
      const k = keyOf(c), L = list(), R2 = routine();
      const rs = rows(c), effDone = rs.filter((x) => !x.warm && x.done).length, complete = effDone >= (c.sets || 3);
      const clock = (prev.match(/<span class="vx-clock"[^>]*>[^<]*<\/span>/) || [''])[0];
      const goal = typeof ovg === 'function' ? ovg(c) : '';
      let h = `<div class="vx-sr">`;
      h += `<div class="row vx-sr-top"><button class="back" onclick="back()" aria-label="Volver">‹</button><div class="g mu" style="font-size:13px">${R2 ? esc2(R2.name) : 'Entrenamiento rápido'} · Ejercicio ${S.wi + 1} de ${L.length}</div>${clock}</div>`;
      h += `<div class="bar" style="margin:8px 0 14px"><i style="width:${(S.wi + Math.min(1, effDone / (c.sets || 3))) / L.length * 100}%"></i></div>`;
      h += `<div class="row vx-sr-head"><div class="vx-sr-thumb">${thumb(c.i, 64)}</div><div class="g"><div class="mu" style="font-size:13px">Registro de entreno</div><h1 class="vx-sr-name">${esc2(e[0])}</h1><div class="mu" style="font-size:12.5px">${c.sets} series · ${esc2(String(c.reps))} reps</div></div>` +
        `<div class="vx-sr-tools"><button class="chip" onclick="S.rpl=true;R()" aria-label="Cambiar ejercicio">⇄</button><button class="chip" onclick="S.info=${c.i};R()" aria-label="Información">ℹ</button></div></div>`;
      h += restHTML(c);
      if (goal && !effDone) h += `<div class="vx-sr-goal mu">📌 ${goal}</div>`;
      h += `<div class="vx-sr-list">${rs.map((x) => rowHTML(x, k)).join('')}</div>`;
      h += `<button class="btn o vx-sr-add" onclick="vxSrAdd()">+ Añadir serie</button>`;
      if (complete) h += `<button class="btn vx-sr-next" onclick="nextEx()">${S.wi >= L.length - 1 ? 'Terminar entrenamiento' : 'Siguiente ejercicio ›'}</button>`;
      const up = upcoming();
      if (up.length) {
        h += `<div class="vx-next vx-sr-up"><span class="mu">Siguiente</span></div>` + up.map((u, n) => `<div class="card row vx-sr-upc${n ? '' : ' first'}" role="button" tabindex="0" onclick="vxSrJump(${u.j})"><div class="vx-sr-uth">${thumb(u.x.i, 46)}</div><div class="g"><b>${esc2(EX[u.x.i][0])}</b><div class="mu" style="font-size:12.5px">${u.x.sets} × ${esc2(String(u.x.reps))}</div></div><span class="arr">›</span></div>`).join('');
      }
      h += `<button class="btn s" style="margin-top:14px" onclick="w9fin()">Finalizar entrenamiento</button></div>`;
      return h;
    } catch (err) { return prev; }
  };

  const readRow = (id) => {
    const g = (f) => { const el = document.querySelector(`.vx-sr-row[data-id="${id}"] input[data-f="${f}"]`); return el ? el.value : ''; };
    return { w: g('w'), r: g('r') };
  };
  Object.assign(window, {
    vxSrDraft(k, id, f, v) { const d = drafts(k); d[id] = Object.assign({ w: '', r: '' }, d[id] || readRow(id)); d[id][f] = v; },
    vxSrDone(id) {
      const c = cfg(), k = keyOf(c), v = readRow(id);
      if (S.w && S.w.on) fin(false); // cierra el descanso en curso (y cuenta la serie anterior)
      S.wk = { k, w: v.w, r: v.r, rir: '', sr: 1 };
      S.st = id[0] === 'w' ? 'warmup' : 'effective';
      const n0 = (S.log || []).length;
      w9log();
      if ((S.log || []).length > n0) { const d = drafts(k); delete d[id]; }
      S.st = 'effective';
    },
    vxSrUndo(idx) {
      if (idx < 0 || !S.log[idx]) return;
      if (!confirm('¿Borrar esta serie?')) return;
      if (typeof w9d === 'function') w9d(idx); else { S.log.splice(idx, 1); sv(); R(); }
    },
    vxSrAdd() { const c = cfg(); c.sets = (+c.sets || 3) + 1; sv(); R(); },
    vxSrNoW(k) { S.vxNoW = Object.assign({}, S.vxNoW || {}, { [k]: 1 }); R(); },
    vxSrJump(j) { if (S.w) { S.w.set = 0; } S.wk = {}; S.wi = j; R(); }
  });

  if (window.vxAddTr) window.vxAddTr(`
Registro de entreno|Workout log|Journal d’entraînement|Registo de treino
Descanso|Rest|Repos|Descanso
Empieza solo al completar una serie|Starts automatically when you complete a set|Démarre seul quand tu termines une série|Começa sozinho ao completares uma série
+ Añadir serie|+ Add set|+ Ajouter une série|+ Adicionar série
Siguiente ejercicio ›|Next exercise ›|Exercice suivant ›|Próximo exercício ›
Terminar entrenamiento|Finish workout|Terminer la séance|Terminar treino
Siguiente|Next|Suivant|Seguinte
Quitar calentamiento|Remove warm-up|Retirer l’échauffement|Remover aquecimento
Completar serie|Complete set|Valider la série|Completar série
Serie hecha (tocar para borrarla)|Set done (tap to delete)|Série faite (touche pour la supprimer)|Série feita (toca para apagar)
¿Borrar esta serie?|Delete this set?|Supprimer cette série ?|Apagar esta série?
`);
  if (window.vxAddTrPat) {
    window.vxAddTrPat(/^Última: (.+)$/, ['Last: $1', 'Dernière : $1', 'Última: $1']);
    window.vxAddTrPat(/^(.+) · Ejercicio (\d+) de (\d+)$/, ['$1 · Exercise $2 of $3', '$1 · Exercice $2 sur $3', '$1 · Exercício $2 de $3']);
    window.vxAddTrPat(/^(\d+) series · (.+) reps$/, ['$1 sets · $2 reps', '$1 séries · $2 reps', '$1 séries · $2 reps']);
  }
})();
